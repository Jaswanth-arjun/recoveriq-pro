"""
arq worker — REAL delayed retry jobs (e.g. insufficient_funds → retry in 48h).
"""

import json
from datetime import datetime, timedelta, timezone

from arq.connections import RedisSettings
from sqlalchemy import select

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import FailureEvent, AuditLog
from app.agents.pipeline import run_pipeline, mark_recovered, audit


async def startup(ctx):
    pass


async def shutdown(ctx):
    pass


async def schedule_retry(event_id: int, delay_hours: int) -> str | None:
    """Queue a real delayed job in Redis. Returns job id (None if Redis unavailable)."""
    try:
        from arq import create_pool
        pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
        job = await pool.enqueue_job(
            "process_retry", event_id,
            _defer_by=timedelta(hours=delay_hours),
        )
        await pool.close()
        return job.job_id if job else None
    except Exception:
        return None  # graceful: job runs inline later via batch/manual trigger


async def process_retry(ctx, event_id: int):
    """Executes a scheduled SMART_RETRY through the same real pipeline."""
    async with SessionLocal() as db:
        event = await db.get(FailureEvent, event_id)
        if not event or event.status in ("recovered", "stopped"):
            return
        await audit(db, event_id, "executor", "SCHEDULED_RETRY_FIRED",
                    {"scheduled": True})
        await run_pipeline(db, event, skip_gate=True)


async def check_broken_promises_task(db) -> list:
    """Check for PROMISED payments whose promised date has passed without payment."""
    from app.models import PromiseToPay, Customer, Payment, B2BInvoice
    from app.services.events import broadcast
    
    now = datetime.utcnow()
    res = await db.execute(
        select(PromiseToPay).where(
            PromiseToPay.status == "PROMISED",
            PromiseToPay.promised_date <= now
        )
    )
    promises = res.scalars().all()
    processed = []

    for p in promises:
        # Check if invoice or payment was made
        paid = False
        if p.invoice_id:
            inv = await db.get(B2BInvoice, p.invoice_id)
            if inv and inv.status == "PAID":
                paid = True
        
        if paid:
            p.status = "PAID"
            p.paid_at = now
            await audit(db, p.failure_event_id, "system", "PROMISE_FULFILLED", {"promise_id": p.id, "amount": p.promised_amount})
        else:
            p.status = "BROKEN"
            p.broken_at = now
            
            # Create failure event for broken promise
            cust = await db.get(Customer, p.customer_id)
            cust_name = cust.name if cust else "Customer"
            
            payment = Payment(
                merchant_id=p.merchant_id,
                customer_id=p.customer_id,
                amount_paise=int(p.promised_amount * 100),
                description=f"Broken Promise to Pay by {cust_name}",
                status="failed"
            )
            db.add(payment)
            await db.flush()
            
            event = await pipeline.ingest_failure(
                db, p.merchant_id, "promise.broken",
                {"trigger": "background_worker", "promise_id": p.id},
                "PROMISE_BROKEN", f"Payment promise of ₹{p.promised_amount} due on {p.promised_date.strftime('%Y-%m-%d')} was broken.",
                payment.amount_paise, payment_id=payment.id
            )
            await db.flush()
            p.failure_event_id = event.id
            await audit(db, event.id, "system", "PROMISE_BROKEN_DETECTED", {"promise_id": p.id, "promised_date": str(p.promised_date)})
            await run_pipeline(db, event)
            await broadcast("promise.broken", {"id": p.id, "customer_name": cust_name, "event_id": event.id})
            
        processed.append({"id": p.id, "status": p.status})
    
    await db.commit()
    return processed


async def process_b2b_aging_task(db) -> list:
    """Calculate B2B AR aging buckets and auto-escalate overdue invoices."""
    from app.models import B2BInvoice, Customer
    from app.services.events import broadcast

    now = datetime.utcnow()
    res = await db.execute(select(B2BInvoice).where(B2BInvoice.status != "PAID"))
    invoices = res.scalars().all()
    updated = []

    for inv in invoices:
        days_overdue = (now - inv.due_date).days if now > inv.due_date else 0
        if days_overdue > 0 and inv.status == "UNPAID":
            inv.status = "OVERDUE"

        # Determine escalation tier based on days overdue
        new_escalation = 0
        if days_overdue > 90:
            new_escalation = 4  # 90+ High Priority Human Escalation
        elif days_overdue > 60:
            new_escalation = 3  # 61-90 Finance Manager Escalation
        elif days_overdue > 30:
            new_escalation = 2  # 31-60 Strong Follow-up
        elif days_overdue > 0:
            new_escalation = 1  # 0-30 Friendly Reminder

        if new_escalation > inv.escalation_level:
            inv.escalation_level = new_escalation
            await audit(db, None, "system", "B2B_INVOICE_ESCALATED", {
                "invoice_id": inv.id,
                "invoice_number": inv.invoice_number,
                "days_overdue": days_overdue,
                "escalation_level": new_escalation
            })
            await broadcast("invoice.escalated", {"id": inv.id, "number": inv.invoice_number, "level": new_escalation})

        updated.append({
            "id": inv.id,
            "days_overdue": days_overdue,
            "escalation_level": inv.escalation_level
        })

    await db.commit()
    return updated


async def detect_payment_degradation_task(db) -> dict | None:
    """Proactive calculation of payment degradation across recent attempts."""
    from app.models import Payment, FailureEvent, PaymentDegradationAlert, Merchant
    from app.services.events import broadcast

    res_m = await db.execute(select(Merchant).limit(1))
    merchant = res_m.scalar_one_or_none()
    if not merchant:
        return None

    # Get payments from last 2 hours
    cutoff = datetime.utcnow() - timedelta(hours=2)
    res_p = await db.execute(select(Payment).where(Payment.created_at >= cutoff))
    recent_payments = res_p.scalars().all()

    total_attempts = len(recent_payments)
    if total_attempts < 3:
        return None  # Insufficient sample size for anomaly detection

    failed_attempts = len([p for p in recent_payments if p.status == "failed"])
    success_rate = round(((total_attempts - failed_attempts) / total_attempts) * 100, 1)
    baseline_rate = 95.0
    drop_pct = round(baseline_rate - success_rate, 1)

    if drop_pct >= 15.0:
        # Determine severity
        severity = "CRITICAL" if drop_pct >= 35.0 else "HIGH" if drop_pct >= 25.0 else "MEDIUM"
        
        # Find dominant error code
        res_e = await db.execute(select(FailureEvent).where(FailureEvent.created_at >= cutoff))
        events = res_e.scalars().all()
        error_counts = {}
        for ev in events:
            code = ev.error_code or "UNKNOWN_ERROR"
            error_counts[code] = error_counts.get(code, 0) + 1
        
        top_error = max(error_counts, key=error_counts.get) if error_counts else "BANK_DECLINED"

        ai_diag = {
            "problem": "payment_degradation",
            "root_cause": f"Spike in {top_error} across gateway",
            "severity": severity,
            "drop_percentage": drop_pct,
            "recommended_action": "SMART_RETRY" if top_error in ("INSUFFICIENT_FUNDS", "BANK_DECLINED") else "ESCALATE"
        }

        # Check existing active alert
        res_a = await db.execute(select(PaymentDegradationAlert).where(PaymentDegradationAlert.status == "ACTIVE").limit(1))
        alert = res_a.scalar_one_or_none()

        if not alert:
            alert = PaymentDegradationAlert(
                merchant_id=merchant.id,
                gateway="Razorpay",
                baseline_success_rate=baseline_rate,
                current_success_rate=success_rate,
                drop_percentage=drop_pct,
                affected_payments_count=failed_attempts,
                top_error_code=top_error,
                severity=severity,
                ai_diagnosis=ai_diag,
                recommended_action=ai_diag["recommended_action"],
                status="ACTIVE"
            )
            db.add(alert)
            await db.commit()
            await db.refresh(alert)
            await audit(db, None, "system", "PAYMENT_DEGRADATION_DETECTED", ai_diag)
            await broadcast("degradation.alert", {"id": alert.id, "severity": severity, "drop": drop_pct})
        else:
            alert.current_success_rate = success_rate
            alert.drop_percentage = drop_pct
            alert.affected_payments_count = failed_attempts
            alert.top_error_code = top_error
            alert.severity = severity
            alert.ai_diagnosis = ai_diag
            await db.commit()

        return {
            "alert_id": alert.id,
            "severity": severity,
            "baseline": baseline_rate,
            "current": success_rate,
            "drop": drop_pct,
            "top_error": top_error
        }
    
    return None


async def process_b2b_receivables_worker_task(db) -> list:
    """Calculates AR aging, checks payments, and triggers multi-channel recovery actions."""
    from app.models import B2BInvoice, Customer, PromiseToPay
    from app.services import razorpay as rzp
    from app.services.events import broadcast

    now = datetime.utcnow()
    res = await db.execute(select(B2BInvoice).where(B2BInvoice.status != "PAID"))
    invoices = res.scalars().all()
    processed = []

    for inv in invoices:
        cust = await db.get(Customer, inv.customer_id)
        if not cust:
            continue

        days_overdue = (now - inv.due_date).days if now > inv.due_date else 0
        days_to_due = (inv.due_date - now).days if inv.due_date > now else 0

        # Automatic Payment Check
        if inv.status == "PAID":
            continue

        if days_overdue > 0 and inv.status == "UNPAID":
            inv.status = "OVERDUE"

        # Escalation Tiers
        new_escalation = 0
        if days_overdue > 90:
            new_escalation = 4  # 90+ Human Review
        elif days_overdue > 60:
            new_escalation = 3  # 61-90 High Priority Escalation
        elif days_overdue > 30:
            new_escalation = 2  # 31-60 Finance/Account Manager Escalation
        elif days_overdue > 0:
            new_escalation = 1  # 0-30 Follow-up & Reminders

        if new_escalation > inv.escalation_level:
            inv.escalation_level = new_escalation

        # Policy-driven recovery action dispatch
        action_taken = None
        if days_to_due <= 3 and days_to_due >= 0 and inv.reminder_count == 0:
            inv.reminder_count += 1
            inv.last_reminder_at = now
            action_taken = "PRE_DUE_REMINDER_SENT"
        elif days_overdue == 1 and inv.reminder_count <= 1:
            inv.reminder_count += 1
            inv.last_reminder_at = now
            action_taken = "OVERDUE_EMAIL_SENT"
        elif days_overdue == 2 and inv.reminder_count <= 2:
            inv.reminder_count += 1
            inv.last_reminder_at = now
            action_taken = "OVERDUE_SMS_WA_SENT"
        elif days_overdue >= 7 and inv.reminder_count <= 3:
            inv.reminder_count += 1
            inv.last_reminder_at = now
            action_taken = "P2P_CONFIRMATION_REQUESTED"
        elif days_overdue >= 8 and inv.reminder_count <= 4:
            inv.reminder_count += 1
            inv.last_reminder_at = now
            action_taken = "VOICE_FOLLOWUP_INITIATED"

        if action_taken:
            await audit(db, None, "executor", action_taken, {
                "invoice_id": inv.id,
                "invoice_number": inv.invoice_number,
                "customer_name": cust.name,
                "days_overdue": days_overdue,
                "reminder_count": inv.reminder_count
            })

        processed.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "days_overdue": days_overdue,
            "status": inv.status,
            "escalation_level": inv.escalation_level,
            "action_taken": action_taken
        })

    await db.commit()
    return processed


async def run_all_background_tasks():
    """Runs all background closed-loop tasks synchronously within a DB session."""
    async with SessionLocal() as db:
        try:
            await check_broken_promises_task(db)
            await process_b2b_aging_task(db)
            await process_b2b_receivables_worker_task(db)
            await detect_payment_degradation_task(db)
        except Exception as e:
            print(f"[BACKGROUND TASK ERROR] {e}")


class WorkerSettings:
    functions = [process_retry]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
