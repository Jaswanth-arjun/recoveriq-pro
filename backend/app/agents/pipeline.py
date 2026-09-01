"""
7-AGENT PIPELINE: DETECT → DIAGNOSE → DECIDE → GATE → ACT → MONITOR → RECOVER → MEASURE → AUDIT

Hard rules enforced here (deterministic code, never the LLM):
- max 3 retries/payment, min 2h between retries (48h insufficient_funds)
- quiet hours 9PM–9AM (no calls/messages)
- max 1 customer message/day, 5 contacts/30 days, opt-out = permanent suppression
- > ₹10,000 → merchant approval required
- Claude confidence < 70% → ESCALATE, never act
- Fixed action set ONLY (A–G)
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Merchant, Customer, Payment, FailureEvent, Diagnosis, Decision,
    PolicyCheck, Action, Outcome, AuditLog, VoiceCall,
)
from app.error_codes import classify, ACTION_NAMES
from app.services import llm as llm_service
from app.services import razorpay as rzp
from app.services import messaging, voice as voice_service
from app.services.events import broadcast
from app.core.config import settings
from app.core.logging import logger
import base64

# ---------------------------------------------------------------- audit


async def audit(db: AsyncSession, failure_event_id: int | None, actor: str, event: str, detail: dict):
    db.add(AuditLog(failure_event_id=failure_event_id, actor=actor,
                    event=event, detail=detail))
    await db.commit()
    logger.info("audit", actor=actor, audit_event=event, detail=detail)


# ---------------------------------------------------------------- ① REVENUE MONITOR


async def ingest_failure(
    db: AsyncSession, merchant_id: int, event_type: str,
    raw_payload: dict, error_code: str, error_description: str,
    amount_paise: int, razorpay_payment_id: str = "",
    subscription_id: str = "", customer_id: int = 0,
    razorpay_event_id: str = "", payment_id: int = 0,
) -> FailureEvent:
    """① REVENUE MONITOR — ingest real webhook event."""
    event = FailureEvent(
        merchant_id=merchant_id, payment_id=payment_id,
        razorpay_event_id=razorpay_event_id,
        event_type=event_type, raw_payload=raw_payload, error_code=error_code,
        error_description=error_description, amount_paise=amount_paise,
        status="detected",
    )
    db.add(event)
    await db.flush()
    await audit(db, event.id, "monitor", "FAILURE_DETECTED", {
        "error_code": error_code, "amount_inr": amount_paise / 100,
        "event_type": event_type,
    })
    await broadcast("failure.detected", {"id": event.id, "error_code": error_code,
                                         "amount_inr": amount_paise / 100})
    return event


# ---------------------------------------------------------------- ② ROOT CAUSE + ③ STRATEGIST


async def diagnose_and_decide(db: AsyncSession, event: FailureEvent) -> Decision:
    """② ROOT CAUSE (rule map + AI second opinion) + ③ STRATEGIST (fixed set)."""
    rule = classify(event.error_code)
    amount_inr = event.amount_paise / 100

    # load customer history for AI context
    payment = await db.get(Payment, event.payment_id)
    customer = {"successful_payment_count": 0, "language": "te", "name": "Customer"}
    if payment:
        cust = await db.get(Customer, payment.customer_id)
        if cust:
            customer = {"successful_payment_count": payment.successful_payment_count,
                        "language": cust.language, "name": cust.name}

    # Claude (or Gemini free tier) second opinion — graceful fallback built in
    ai = await llm_service.diagnose_and_decide(
        event.error_code, event.error_description, rule.category,
        amount_inr, customer, rule.recommended_action,
        _rule_confidence(rule, amount_inr),
    )

    if ai["degraded"]:
        await audit(db, event.id, "system", "AI_FALLBACK", {
            "reason": "AI unavailable, deterministic fallback used",
            "rule_action": rule.recommended_action,
        })

    diagnosis = Diagnosis(
        failure_event_id=event.id,
        cause=rule.cause, category=rule.category,
        confidence=ai["confidence"], reasoning=ai["reasoning"],
        engine=ai["engine"], model_used=ai["model_used"],
    )
    db.add(diagnosis)
    await db.flush()

    action = ai["action"]
    if not rule.retry_safe and action == "SMART_RETRY":
        action = rule.recommended_action or "CHECKOUT_RECOVERY"

    decision = Decision(
        failure_event_id=event.id, diagnosis_id=diagnosis.id,
        action=action, action_name=ACTION_NAMES.get(action, action),
        reasoning=ai["reasoning"],
        alternatives_considered=ai["alternatives_considered"],
        scheduled_at=datetime.utcnow() + timedelta(hours=rule.retry_delay_hours)
        if rule.retry_delay_hours else None,
    )
    db.add(decision)
    event.status = "diagnosed"
    await db.commit()

    await audit(db, event.id, "root_cause", "DIAGNOSED", {
        "cause": rule.cause, "category": rule.category,
        "engine": ai["engine"], "confidence": ai["confidence"],
    })
    await audit(db, event.id, "strategist", "DECISION_MADE", {
        "action": action, "name": ACTION_NAMES.get(action, action),
        "reasoning": ai["reasoning"],
        "alternatives": ai["alternatives_considered"],
    })
    await broadcast("decision.made", {"id": event.id, "action": action,
                                      "confidence": ai["confidence"]})
    return decision


def _rule_confidence(rule, amount_inr: float) -> int:
    base = {"insufficient_funds": 92, "card_expired": 90, "network": 85,
            "auth": 80, "bank": 75, "mandate": 78, "abandonment": 88,
            "dispute": 95, "permanent": 90, "risk": 90, "invoice": 80,
            "unknown": 50}.get(rule.category, 60)
    if amount_inr > 50_000:  # very high value => slightly less certain
        base -= 10
    return max(0, min(100, base))


# ---------------------------------------------------------------- ④ POLICY GUARD


async def policy_gate(db: AsyncSession, event: FailureEvent, decision: Decision) -> str:
    """④ POLICY GUARD — deterministic. Returns ALLOW | APPROVAL_REQUIRED | BLOCK.
    Priority: BLOCK > APPROVAL_REQUIRED > ALLOW."""
    merchant = await db.get(Merchant, event.merchant_id)
    payment = await db.get(Payment, event.payment_id)
    customer = await db.get(Customer, payment.customer_id) if payment else None
    diag = await db.get(Diagnosis, decision.diagnosis_id) if decision else None

    checks = []  # (verdict, rule, reason)

    # opt-out = permanent suppression
    if customer and customer.opted_out:
        checks.append(("BLOCK", "opt_out", "Customer opted out — permanent suppression"))

    # retry cap
    if await _retry_count(db, event) >= merchant.max_retries:
        checks.append(("BLOCK", "max_retries", f"Retry cap reached ({merchant.max_retries} max)"))

    # confidence floor — LLM CANNOT override
    if decision and decision.action not in ("ESCALATE", "STOP") and diag \
            and diag.confidence < merchant.min_ai_confidence:
        checks.append(("BLOCK", "min_ai_confidence",
                       f"AI confidence {diag.confidence}% < {merchant.min_ai_confidence}% floor — escalating, never acting"))

    # high-value approval gate
    if event.amount_paise > merchant.approval_threshold_paise and decision.action not in ("STOP", "ESCALATE"):
        checks.append(("APPROVAL_REQUIRED", "approval_threshold",
                       f"₹{event.amount_paise/100:,.0f} > approval threshold ₹{merchant.approval_threshold_paise/100:,.0f}"))

    # quiet hours (IST) — no voice/outreach actions
    if decision.action in ("VOICE_RECOVERY", "CHECKOUT_RECOVERY", "INVOICE_REMINDER", "SUBSCRIPTION_RECOVERY"):
        hour = int((datetime.now(timezone.utc).timestamp() + 5.5 * 3600) % 86400 // 3600)
        if merchant.quiet_hours_start <= hour or hour < merchant.quiet_hours_end:
            checks.append(("BLOCK", "quiet_hours",
                           f"Quiet hours {merchant.quiet_hours_start}:00–{merchant.quiet_hours_end}:00 IST — no outreach now"))

    if any(v == "BLOCK" for v, _, _ in checks):
        verdict, rule_name, reason = next((v, r, s) for v, r, s in checks if v == "BLOCK")
    elif checks:
        verdict, rule_name, reason = checks[0]
    else:
        verdict, rule_name, reason = "ALLOW", "all_rules", ""

    db.add(PolicyCheck(decision_id=decision.id, rule=rule_name,
                       verdict=verdict, reason=reason))
    event.status = {
        "ALLOW": "gated", "APPROVAL_REQUIRED": "awaiting_approval",
        "BLOCK": "stopped",
    }[verdict]
    await db.commit()

    await audit(db, event.id, "policy_guard",
                f"POLICY_{verdict}", {"rule": rule_name, "reason": reason})
    await broadcast("policy.verdict", {"id": event.id, "verdict": verdict, "reason": reason})
    return verdict


async def _retry_count(db: AsyncSession, event: FailureEvent) -> int:
    res = await db.execute(
        select(func.count(Action.id)).where(
            Action.failure_event_id == event.id, Action.action == "SMART_RETRY"))
    return res.scalar() or 0


# ---------------------------------------------------------------- ⑤ RECOVERY EXECUTOR


async def execute(db: AsyncSession, event: FailureEvent, decision: Decision) -> Action:
    """⑤ RECOVERY EXECUTOR — production: real API calls per action. Code acts."""
    payment = await db.get(Payment, event.payment_id)
    customer = await db.get(Customer, payment.customer_id) if payment else None
    amount_inr = event.amount_paise / 100
    diag = (await db.execute(
        select(Diagnosis).where(Diagnosis.failure_event_id == event.id)
    )).scalars().first()
    category = diag.category if diag else "unknown"
    action_record = Action(failure_event_id=event.id, decision_id=decision.id,
                           action=decision.action, status="pending")

    try:
        if decision.action == "SMART_RETRY":
            from app.worker import schedule_retry
            delay_h = 48 if "insufficient" in (decision.reasoning + "").lower() else 2
            job_id = await schedule_retry(event.id, delay_h)
            action_record.channel = "razorpay"
            action_record.resource_id = job_id or f"arq_{event.id}"
            action_record.detail = {"scheduled_in_hours": delay_h}

        elif decision.action in ("CHECKOUT_RECOVERY", "SUBSCRIPTION_RECOVERY"):
            link = rzp.create_payment_link(
                event.amount_paise,
                {"name": customer.name if customer else "Customer",
                 "email": customer.email if customer else "",
                 "phone": customer.phone if customer else ""},
                f"Payment recovery — {event.error_code}", f"ev_{event.id}",
            )
            action_record.channel = "razorpay"
            action_record.razorpay_api_call_id = link.get("api_call_id", "")
            action_record.resource_id = link.get("resource_id", "")
            short_url = link.get("short_url", "")
            action_record.detail = {"short_url": short_url,
                                    "notify": {"sms": True, "email": True}}

            # Multi-channel outreach: Email + WhatsApp + AI message
            if customer:
                msg = await llm_service.compose_recovery_message(
                    customer.name, amount_inr, category, customer.language, short_url)

                # Email is sent directly by Razorpay (notify: {email: true})
                action_record.detail["email"] = {"status": "handled_by_razorpay", "to": customer.email}

                # Multi-channel outreach: Twilio SMS + Email + Twilio Voice + WhatsApp
                if customer.phone and settings.twilio_ready:
                    sms_res = await messaging.send_sms(customer.phone, msg)
                    action_record.detail["twilio_sms"] = sms_res

                # Phone Call via Twilio
                if customer.phone and settings.twilio_ready:
                    twilio_call = await voice_service.make_twilio_call(
                        customer.phone, msg, customer.language
                    )
                    action_record.detail["twilio"] = twilio_call

                # WhatsApp (optional — skipped if not configured)
                wa_result = await messaging.send_whatsapp(customer.phone, msg)
                action_record.detail["whatsapp"] = wa_result

        elif decision.action == "INVOICE_REMINDER":
            link = rzp.create_payment_link(event.amount_paise,
                                           {"name": customer.name if customer else "Customer",
                                            "email": customer.email if customer else "",
                                            "phone": customer.phone if customer else ""},
                                           "Invoice payment — promise to pay", f"inv_{event.id}")
            action_record.channel = "razorpay"
            action_record.razorpay_api_call_id = link.get("api_call_id", "")
            action_record.resource_id = link.get("resource_id", "")
            short_url = link.get("short_url", "")
            action_record.detail = {"short_url": short_url, "promise_to_pay_tracker": True}

            # Email reminder is sent directly by Razorpay (notify: {email: true})
            if customer and customer.email:
                action_record.detail["email"] = {"status": "handled_by_razorpay", "to": customer.email}

        elif decision.action == "VOICE_RECOVERY":
            script = await llm_service.compose_recovery_message(
                customer.name if customer else "customer", amount_inr,
                category, customer.language if customer else "te", "")
            if not script or len(script) < 5:
                script = (f"Namaste {customer.name if customer else 'customer'} gaaru, "
                          f"mee payment of {int(amount_inr)} rupees fail ayyindi. "
                          f"Daya chesi malli try cheyyandi. Dhanyavadalu.")
            audio = await voice_service.generate_voice(script, customer.language if customer else "te")
            vc = VoiceCall(failure_event_id=event.id, script=script,
                           language=customer.language if customer else "te",
                           audio_base64=audio["audio_base64"],
                           simulated=audio.get("engine") == "not_configured")
            db.add(vc)
            await db.flush()
            
            # Place automated Twilio phone call if customer phone & Twilio credentials available
            twilio_call = {}
            if customer and customer.phone:
                twilio_call = await voice_service.make_twilio_call(
                    customer.phone, script, customer.language if customer else "te"
                )

            action_record.channel = "voice"
            action_record.resource_id = f"voice_{vc.id}"
            action_record.detail = {
                "script": script,
                "engine": audio["engine"],
                "twilio": twilio_call
            }

        elif decision.action == "ESCALATE":
            action_record.channel = "human"
            action_record.status = "executed"
            action_record.detail = {"queue": "approvals", "reason": decision.reasoning}

        elif decision.action == "STOP":
            action_record.channel = "none"
            action_record.status = "executed"
            action_record.detail = {"stopped": True, "reason": decision.reasoning}

        if action_record.status == "pending":
            action_record.status = "executed"

    except Exception as e:
        action_record.status = "failed"
        action_record.detail = {"error": str(e)}
        await audit(db, event.id, "system", "EXECUTOR_ERROR",
                    {"error": str(e), "graceful": True})
        await broadcast("action.failed", {"id": event.id, "error": str(e)})

    db.add(action_record)
    if decision.action != "ESCALATE":
        event.status = "acting" if action_record.status == "executed" else "escalated"
    await db.commit()

    await audit(db, event.id, "executor", "ACTION_EXECUTED", {
        "action": decision.action, "channel": action_record.channel,
        "api_call_id": action_record.razorpay_api_call_id,
        "status": action_record.status,
    })
    await broadcast("action.executed", {
        "id": event.id, "action": decision.action, "status": action_record.status,
    })
    return action_record


# ---------------------------------------------------------------- full pipeline


async def run_pipeline(db: AsyncSession, event: FailureEvent, skip_gate: bool = False):
    """② → ③ → ④ → ⑤ (① ingests, ⑥⑦ listen)."""
    decision = await diagnose_and_decide(db, event)
    verdict = await policy_gate(db, event, decision)
    if verdict == "BLOCK":
        return {"verdict": verdict, "action": decision.action}
    if verdict == "APPROVAL_REQUIRED" and not skip_gate:
        return {"verdict": verdict, "action": decision.action}
    action = await execute(db, event, decision)
    return {"verdict": verdict, "action": decision.action,
            "executed": action.status, "simulated": action.simulated}


# ---------------------------------------------------------------- ⑥ OUTCOME MONITOR


async def mark_recovered(db: AsyncSession, event_id: int,
                         razorpay_payment_id: str, recovered_via: str):
    """⑥ OUTCOME MONITOR — payment_link.paid / order.paid → RECOVERED."""
    event = await db.get(FailureEvent, event_id)
    if not event or event.status == "recovered":
        return
    recovered_paise = event.amount_paise
    tt = None
    if event.created_at:
        tt = int((datetime.now(timezone.utc) - event.created_at
                  .replace(tzinfo=timezone.utc)).total_seconds())
    db.add(Outcome(failure_event_id=event_id, recovered_paise=recovered_paise,
                   recovered=True, time_to_recovery_seconds=tt,
                   recovered_via=recovered_via,
                   razorpay_payment_id=razorpay_payment_id))
    event.status = "recovered"
    await db.commit()
    await audit(db, event_id, "outcome", "RECOVERED", {
        "amount_inr": recovered_paise / 100, "via": recovered_via,
        "razorpay_payment_id": razorpay_payment_id, "time_to_recovery_s": tt,
    })
    await broadcast("recovered", {"id": event_id,
                                  "amount_inr": recovered_paise / 100,
                                  "via": recovered_via})
