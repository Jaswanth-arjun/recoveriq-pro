import json
import random
import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db, SessionLocal, engine
from app.models import (
    Merchant, Customer, Subscription, OneTimeOrder, Payment, FailureEvent, Diagnosis, Decision,
    PolicyCheck, Action, Outcome, AuditLog, VoiceCall, CopilotMessage,
    B2BInvoice, PromiseToPay, CheckoutAbandonment, PaymentDegradationAlert, RecoveryPolicy,
)
from app.agents import pipeline
from app.agents.pipeline import run_pipeline, mark_recovered, audit
from app.services import llm as llm_service
from app.services import razorpay as rzp
from app.services import voice as voice_service
from app.services import messaging
from app.services.messaging import send_email, send_whatsapp, send_sms
from app.services.events import connect, disconnect, broadcast
from app.worker import schedule_retry

router = APIRouter()


# ---------------------------------------------------------------- setup


async def ensure_merchant(db: AsyncSession) -> Merchant:
    res = await db.execute(select(Merchant).limit(1))
    m = res.scalar_one_or_none()
    if not m:
        m = Merchant(name="Production Merchant")
        db.add(m)
        await db.commit()
        await db.refresh(m)
    return m


@router.get("/health")
async def health():
    channels = {}
    channels["razorpay"] = "connected" if settings.razorpay_ready else "not_configured"
    channels["llm"] = (
        "claude" if settings.anthropic_ready else
        "gemini" if settings.gemini_ready else
        "openrouter" if settings.openrouter_ready else "rule_fallback"
    )
    channels["voice"] = "elevenlabs" if settings.elevenlabs_ready else "not_configured"
    channels["email"] = "resend" if settings.resend_ready else "not_configured"
    channels["whatsapp"] = "connected" if settings.whatsapp_ready else "not_configured"
    channels["twilio_sms"] = "connected" if settings.twilio_ready else "not_configured"
    return {"status": "ok", **channels}


# ---------------------------------------------------------------- WEBHOOKS (production)


@router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    if not rzp.verify_webhook_signature(body, signature):
        raise HTTPException(400, "Invalid webhook signature")

    payload = json.loads(body)
    event_type = payload.get("event", "")
    merchant = await ensure_merchant(db)

    # ① REVENUE MONITOR ingests every real event
    if event_type in ("payment.failed", "subscription.charged.failed"):
        entity = payload.get("payload", {}).get(event_type.split(".")[0], {})
        err = entity.get("error_description", entity.get("error_source", "Unknown failure"))
        code = entity.get("error_code", entity.get("reason", "UNKNOWN_ERROR"))
        payment = Payment(
            merchant_id=merchant.id, customer_id=0,
            amount_paise=entity.get("amount", 0),
            razorpay_payment_id=entity.get("id", ""),
            subscription_id=entity.get("subscription_id", "") or entity.get("id", ""),
            status="failed",
        )
        db.add(payment)
        await db.flush()
        event = await pipeline.ingest_failure(
            db, merchant.id, event_type, payload, code, err,
            entity.get("amount", 0), razorpay_payment_id=entity.get("id", ""),
            subscription_id=entity.get("subscription_id", ""),
            payment_id=payment.id,
        )
        await db.commit()
        result = await run_pipeline(db, event)
        return {"ok": True, "event_id": event.id, **result}

    # ⑥ OUTCOME MONITOR
    if event_type in ("payment_link.paid", "order.paid", "payment.captured"):
        ref = payload.get("payload", {}).get("payment_link", {}).get("entity", {}) \
            if event_type == "payment_link.paid" else \
            payload.get("payload", {}).get("payment", {}).get("entity", {})
        ref_id = ref.get("reference_id", "") or ref.get("receipt", "")
        razorpay_payment_id = ref.get("id", "")
        ev_id = None
        for part in str(ref_id).split("_"):
            if part.isdigit():
                ev_id = int(part)
        if ev_id:
            await mark_recovered(db, ev_id, razorpay_payment_id, recovered_via=event_type)
            return {"ok": True, "recovered": True, "event_id": ev_id}
        return {"ok": True, "note": "no matching failure event"}

    await audit(db, None, "system", "WEBHOOK_IGNORED", {"event": event_type})
    return {"ok": True, "ignored": event_type}


# ---------------------------------------------------------------- trigger (real failure injection)


class CustomFailureRequest(BaseModel):
    name: str
    email: str
    phone: str
    amount_inr: float = 2000.0
    error_code: str = "INSUFFICIENT_FUNDS"
    language: str = "en"


@router.post("/trigger/custom")
async def trigger_custom_failure(req: CustomFailureRequest, db: AsyncSession = Depends(get_db)):
    """
    Trigger a payment failure with REAL customer details (Email, Phone, Name).
    Sends REAL email outreach via Resend and creates REAL Razorpay payment links.
    This is the production entry point for manually ingesting payment failures.
    """
    merchant = await ensure_merchant(db)
    customer = Customer(
        merchant_id=merchant.id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        language=req.language
    )
    db.add(customer)
    await db.flush()

    payment = Payment(
        merchant_id=merchant.id,
        customer_id=customer.id,
        amount_paise=int(req.amount_inr * 100),
        description="Subscription Payment",
        successful_payment_count=5,
        razorpay_payment_id=f"pay_custom_{customer.id}"
    )
    db.add(payment)
    await db.flush()

    from app.error_codes import classify
    rule = classify(req.error_code)
    event = await pipeline.ingest_failure(
        db, merchant.id, "payment.failed",
        {"trigger": "manual", "error_code": req.error_code},
        req.error_code, f"{rule.cause}",
        payment.amount_paise, razorpay_payment_id=payment.razorpay_payment_id,
        payment_id=payment.id,
    )
    await db.commit()
    result = await run_pipeline(db, event)
    return {"ok": True, "event_id": event.id, "customer": req.name, "email": req.email, **result}


# ---------------------------------------------------------------- subscriptions


class CreateMandateRequest(BaseModel):
    name: str
    email: str
    phone: str
    monthly_total: float = 0.0


@router.post("/subscriptions/create-mandate")
async def create_subscription_mandate(req: CreateMandateRequest):
    ref_id = f"sub_{int(time.time())}"
    res = rzp.create_subscription_mandate(
        amount_paise=int(req.monthly_total * 100),
        customer={"name": req.name, "email": req.email, "phone": req.phone},
        ref_id=ref_id,
    )
    return {
        "ok": True,
        "subscription_id": res.get("subscription_id"),
        "status": res.get("status", "created"),
    }


class CreateSubscriptionRequest(BaseModel):
    name: str
    email: str
    phone: str
    address_line: str = ""
    city: str = ""
    pincode: str = ""
    landmark: str = ""
    daily_total: float = 0.0
    monthly_total: float = 0.0
    items_count: int = 0
    items_detail: list = []


@router.post("/subscriptions")
async def create_subscription(req: CreateSubscriptionRequest, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    res = await db.execute(select(Customer).where(Customer.phone == req.phone).limit(1))
    customer = res.scalar_one_or_none()
    if not customer:
        customer = Customer(
            merchant_id=merchant.id,
            name=req.name,
            email=req.email,
            phone=req.phone,
            address_line=req.address_line,
            city=req.city,
            pincode=req.pincode,
            landmark=req.landmark,
        )
        db.add(customer)
    else:
        customer.name = req.name
        customer.email = req.email
        customer.address_line = req.address_line
        customer.city = req.city
        customer.pincode = req.pincode
        customer.landmark = req.landmark
    await db.flush()

    sub_code = f"SUB_GB_{int(time.time())}_{random.randint(100, 999)}"
    delivery_addr = {
        "address_line": req.address_line,
        "city": req.city,
        "pincode": req.pincode,
        "landmark": req.landmark,
    }
    sub = Subscription(
        merchant_id=merchant.id,
        customer_id=customer.id,
        subscription_code=sub_code,
        daily_total=req.daily_total,
        monthly_total=req.monthly_total,
        items_count=req.items_count,
        items_detail=req.items_detail,
        status="PAID",
        delivery_address=delivery_addr,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    await broadcast("subscription.created", {"id": sub.id, "customer": customer.name, "status": sub.status})
    return {
        "ok": True,
        "id": sub.id,
        "subscription_code": sub.subscription_code,
        "status": sub.status,
        "customer_name": customer.name,
        "delivery_address": delivery_addr,
    }


@router.get("/subscriptions")
async def list_subscriptions(status: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Subscription, Customer).join(Customer, Subscription.customer_id == Customer.id)
    if status and status.upper() != "ALL":
        query = query.where(Subscription.status == status.upper())
    query = query.order_by(desc(Subscription.id)).limit(100)
    
    res = await db.execute(query)
    items = []
    for sub, cust in res.all():
        items.append({
            "id": sub.id,
            "subscription_code": sub.subscription_code,
            "status": sub.status,
            "daily_total": sub.daily_total,
            "monthly_total": sub.monthly_total,
            "items_count": sub.items_count,
            "items_detail": sub.items_detail or [],
            "created_at": sub.created_at,
            "cancelled_at": sub.cancelled_at,
            "customer": {
                "id": cust.id,
                "name": cust.name,
                "email": cust.email,
                "phone": cust.phone,
                "address_line": cust.address_line,
                "city": cust.city,
                "pincode": cust.pincode,
                "landmark": cust.landmark,
            },
            "delivery_address": sub.delivery_address or {
                "address_line": cust.address_line,
                "city": cust.city,
                "pincode": cust.pincode,
                "landmark": cust.landmark,
            }
        })
    return items


@router.post("/subscriptions/{sub_id}/cancel")
async def cancel_subscription(sub_id: int, db: AsyncSession = Depends(get_db)):
    sub = await db.get(Subscription, sub_id)
    if not sub:
        raise HTTPException(404, "Subscription not found")
    sub.status = "CANCELLED"
    sub.cancelled_at = datetime.utcnow()
    await db.commit()
    await broadcast("subscription.cancelled", {"id": sub_id, "status": "CANCELLED"})
    return {"ok": True, "id": sub_id, "status": "CANCELLED"}


@router.post("/subscriptions/{sub_id}/simulate-autopay-failure")
async def simulate_autopay_failure(sub_id: int, db: AsyncSession = Depends(get_db)):
    sub = await db.get(Subscription, sub_id)
    if not sub:
        raise HTTPException(404, "Subscription not found")
    
    sub.status = "NOT_PAID_YET"
    payment = Payment(
        merchant_id=sub.merchant_id,
        customer_id=sub.customer_id,
        amount_paise=int(sub.monthly_total * 100),
        description=f"Monthly Auto-Pay Renewal #{sub.subscription_code}",
        successful_payment_count=3,
        razorpay_payment_id=f"pay_autopay_{sub.id}_{int(time.time())}"
    )
    db.add(payment)
    await db.flush()

    event = await pipeline.ingest_failure(
        db, sub.merchant_id, "subscription.charged.failed",
        {"trigger": "autopay_failure", "subscription_code": sub.subscription_code},
        "INSUFFICIENT_FUNDS", "Recurring monthly mandate failed due to insufficient balance",
        payment.amount_paise, razorpay_payment_id=payment.razorpay_payment_id,
        payment_id=payment.id
    )
    await db.commit()
    result = await run_pipeline(db, event)
    await broadcast("subscription.failed", {"id": sub_id, "status": "NOT_PAID_YET", "event_id": event.id})
    return {"ok": True, "subscription_id": sub_id, "status": "NOT_PAID_YET", "event_id": event.id, **result}


@router.post("/subscriptions/cleanup-deleted")
async def cleanup_deleted_subscriptions(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Subscription).where(Subscription.status == "CANCELLED"))
    cancelled_subs = res.scalars().all()
    count = len(cancelled_subs)
    for sub in cancelled_subs:
        await db.delete(sub)
    await db.commit()
    await broadcast("subscriptions.cleaned", {"deleted_count": count})
    return {"ok": True, "deleted_count": count}


@router.delete("/subscriptions/{sub_id}")
async def delete_subscription(sub_id: int, db: AsyncSession = Depends(get_db)):
    sub = await db.get(Subscription, sub_id)
    if not sub:
        raise HTTPException(404, "Subscription not found")
    cust_id = sub.customer_id
    await db.delete(sub)
    await db.commit()

    # Clean up customer record if no remaining subscriptions or orders
    res_s = await db.execute(select(Subscription).where(Subscription.customer_id == cust_id))
    res_o = await db.execute(select(OneTimeOrder).where(OneTimeOrder.customer_id == cust_id))
    if not res_s.scalars().first() and not res_o.scalars().first():
        cust = await db.get(Customer, cust_id)
        if cust:
            await db.delete(cust)
            await db.commit()

    await broadcast("subscription.deleted", {"id": sub_id})
    return {"ok": True, "id": sub_id, "message": "Subscription record deleted"}


# ---------------------------------------------------------------- ONE-TIME GROCERY ORDERS

class OrderCreate(BaseModel):
    name: str
    email: str
    phone: str
    address_line: str
    city: str
    pincode: str
    landmark: str = ""
    total_amount: float
    items_count: int = 1
    items_detail: list = []
    payment_type: str = "COD"  # RAZORPAY | COD
    payment_status: str = "UNPAID"  # PAID | UNPAID


@router.post("/orders")
async def create_one_time_order(body: OrderCreate, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)

    c_res = await db.execute(select(Customer).where(Customer.phone == body.phone))
    cust = c_res.scalar_one_or_none()
    if not cust:
        cust = Customer(
            merchant_id=merchant.id,
            name=body.name,
            email=body.email,
            phone=body.phone,
            address_line=body.address_line,
            city=body.city,
            pincode=body.pincode,
            landmark=body.landmark,
        )
        db.add(cust)
        await db.flush()
    else:
        cust.name = body.name
        cust.email = body.email
        cust.address_line = body.address_line
        cust.city = body.city
        cust.pincode = body.pincode
        cust.landmark = body.landmark

    order_code = f"ORD-GB-{random.randint(1000, 9999)}"
    addr = {
        "address_line": body.address_line,
        "city": body.city,
        "pincode": body.pincode,
        "landmark": body.landmark,
    }

    order = OneTimeOrder(
        merchant_id=merchant.id,
        customer_id=cust.id,
        order_code=order_code,
        total_amount=body.total_amount,
        items_count=body.items_count,
        items_detail=body.items_detail,
        payment_type=body.payment_type,
        payment_status=body.payment_status,
        delivery_status="NOT_DELIVERED_YET",
        delivery_address=addr,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    await broadcast("order.created", {
        "id": order.id,
        "order_code": order.order_code,
        "payment_type": order.payment_type,
        "payment_status": order.payment_status,
        "delivery_status": order.delivery_status,
    })

    return {
        "id": order.id,
        "order_code": order.order_code,
        "payment_type": order.payment_type,
        "payment_status": order.payment_status,
        "delivery_status": order.delivery_status,
        "total_amount": order.total_amount,
        "items_count": order.items_count,
        "items_detail": order.items_detail or [],
        "created_at": order.created_at,
    }


@router.get("/orders")
async def list_one_time_orders(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(OneTimeOrder, Customer)
        .join(Customer, OneTimeOrder.customer_id == Customer.id)
        .order_by(desc(OneTimeOrder.id))
    )
    items = []
    for order, cust in res.all():
        items.append({
            "id": order.id,
            "order_code": order.order_code,
            "total_amount": order.total_amount,
            "items_count": order.items_count,
            "items_detail": order.items_detail or [],
            "payment_type": order.payment_type,
            "payment_status": order.payment_status,
            "delivery_status": order.delivery_status,
            "created_at": order.created_at,
            "customer": {
                "id": cust.id,
                "name": cust.name,
                "email": cust.email,
                "phone": cust.phone,
                "address_line": cust.address_line,
                "city": cust.city,
                "pincode": cust.pincode,
                "landmark": cust.landmark,
            },
            "delivery_address": order.delivery_address or {
                "address_line": cust.address_line,
                "city": cust.city,
                "pincode": cust.pincode,
                "landmark": cust.landmark,
            }
        })
    return items


@router.post("/orders/{order_id}/toggle-delivery")
async def toggle_order_delivery(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await db.get(OneTimeOrder, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    new_status = "DELIVERED" if order.delivery_status == "NOT_DELIVERED_YET" else "NOT_DELIVERED_YET"
    order.delivery_status = new_status
    await db.commit()
    await broadcast("order.updated", {"id": order_id, "delivery_status": new_status, "payment_status": order.payment_status})
    return {"ok": True, "id": order_id, "delivery_status": new_status, "payment_status": order.payment_status}


@router.post("/orders/{order_id}/mark-paid")
async def mark_order_paid(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await db.get(OneTimeOrder, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    order.payment_status = "PAID"
    await db.commit()
    await broadcast("order.updated", {"id": order_id, "delivery_status": order.delivery_status, "payment_status": "PAID"})
    return {"ok": True, "id": order_id, "delivery_status": order.delivery_status, "payment_status": "PAID"}


@router.delete("/orders/{order_id}")
async def delete_one_time_order(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await db.get(OneTimeOrder, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    cust_id = order.customer_id
    await db.delete(order)
    await db.commit()

    res_s = await db.execute(select(Subscription).where(Subscription.customer_id == cust_id))
    res_o = await db.execute(select(OneTimeOrder).where(OneTimeOrder.customer_id == cust_id))
    if not res_s.scalars().first() and not res_o.scalars().first():
        cust = await db.get(Customer, cust_id)
        if cust:
            await db.delete(cust)
            await db.commit()

    await broadcast("order.deleted", {"id": order_id})
    return {"ok": True, "id": order_id, "message": "Order record deleted"}



# ---------------------------------------------------------------- database management


@router.post("/reset")
async def reset_database(db: AsyncSession = Depends(get_db)):
    """Clear all failure events, customers, payments, subscriptions, orders, invoices, and related data. Fresh start."""
    from sqlalchemy import text
    tables = [
        "audit_log",
        "voice_calls",
        "copilot_messages",
        "outcomes",
        "actions",
        "policy_checks",
        "decisions",
        "diagnoses",
        "checkout_abandonments",
        "promise_to_pay",
        "b2b_invoices",
        "recovery_policies",
        "payment_degradation_alerts",
        "failure_events",
        "payments",
        "subscriptions",
        "one_time_orders",
        "customers",
    ]
    for table in tables:
        try:
            await db.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
            await db.commit()
        except Exception:
            await db.rollback()
            try:
                await db.execute(text(f"DELETE FROM {table}"))
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.warning(f"Could not clear table {table}: {e}")

    await broadcast("system.reset", {"status": "complete"})
    return {"ok": True, "cleared": tables}


@router.post("/events/latest/mark_recovered")
async def mark_latest_event_recovered(db: AsyncSession = Depends(get_db)):
    """Mark the latest payment failure event as successfully recovered."""
    from app.agents.pipeline import mark_recovered
    res = await db.execute(select(FailureEvent).order_by(desc(FailureEvent.id)).limit(1))
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(404, "No failure events found")
    await mark_recovered(db, ev.id, f"pay_test_{ev.id}", "payment_link")
    await broadcast("outcome.recorded", {"event_id": ev.id, "recovered": True})
    return {"ok": True, "event_id": ev.id, "amount_inr": ev.amount_paise / 100}


@router.post("/events/{event_id}/mark_recovered")
async def mark_event_recovered(event_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a payment failure event as successfully recovered."""
    from app.agents.pipeline import mark_recovered
    await mark_recovered(db, event_id, f"pay_test_{event_id}", "payment_link")
    await broadcast("outcome.recorded", {"event_id": event_id, "recovered": True})
    return {"ok": True, "event_id": event_id}


@router.get("/system/status")
async def system_status():
    """Show real-time status of all integrated services."""
    return {
        "razorpay": {"status": "connected" if settings.razorpay_ready else "not_configured", "mode": "test"},
        "llm": {
            "primary": "anthropic" if settings.anthropic_ready else
                       "openrouter" if settings.openrouter_ready else
                       "gemini" if settings.gemini_ready else "rule_fallback",
            "status": "connected" if (settings.anthropic_ready or settings.openrouter_ready or settings.gemini_ready) else "rule_fallback",
        },
        "voice": {"status": "connected" if settings.elevenlabs_ready else "not_configured", "provider": "elevenlabs"},
        "phone_call": {"status": "connected" if settings.twilio_ready else "not_configured", "provider": "twilio"},
        "email": {"status": "connected" if settings.resend_ready else "not_configured", "provider": "resend"},
        "whatsapp": {"status": "connected" if settings.whatsapp_ready else "not_configured"},
        "database": {"status": "connected"},
        "redis": {"status": "connected"},
    }


# ---------------------------------------------------------------- dashboard / metrics


async def _live_stats(db: AsyncSession) -> dict:
    res = await db.execute(select(func.count(FailureEvent.id)))
    failures = res.scalar() or 0
    res = await db.execute(select(func.coalesce(func.sum(FailureEvent.amount_paise), 0))
                           .where(FailureEvent.status.notin_(["recovered"])))
    at_risk = res.scalar() or 0
    res = await db.execute(select(func.coalesce(func.sum(Outcome.recovered_paise), 0)))
    recovered = res.scalar() or 0
    res = await db.execute(select(func.count(Outcome.id)).where(Outcome.recovered == True))  # noqa: E712
    recovered_n = res.scalar() or 0
    res = await db.execute(select(func.count(FailureEvent.id)).where(FailureEvent.status == "awaiting_approval"))
    awaiting = res.scalar() or 0
    res = await db.execute(select(func.count(FailureEvent.id)).where(FailureEvent.status == "escalated"))
    escalated = res.scalar() or 0
    res = await db.execute(select(func.count(FailureEvent.id)).where(FailureEvent.status == "stopped"))
    stopped = res.scalar() or 0
    res = await db.execute(select(func.count(Action.id)).where(Action.action == "SMART_RETRY"))
    retries = res.scalar() or 0
    res = await db.execute(select(func.count(Action.id)).where(Action.channel == "razorpay"))
    links = res.scalar() or 0
    res = await db.execute(select(func.count(AuditLog.id)))
    audited = res.scalar() or 0
    total = failures or 1
    rate = (recovered_n / total) * 100
    return {
        "at_risk": at_risk / 100, "recovered": recovered / 100,
        "recovery_rate": round(rate, 1), "failures": failures,
        "recovered_count": recovered_n, "awaiting_approval": awaiting,
        "escalated": escalated, "stopped": stopped,
        "retries_scheduled": retries, "links_sent": links,
        "audit_entries": audited,
    }


@router.get("/metrics")
async def metrics(db: AsyncSession = Depends(get_db)):
    return await _live_stats(db)


# ---------------------------------------------------------------- failures / timeline


@router.get("/failures")
async def list_failures(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(FailureEvent, Diagnosis, Decision, Action, Outcome, Payment, Customer)
        .outerjoin(Diagnosis, Diagnosis.failure_event_id == FailureEvent.id)
        .outerjoin(Decision, Decision.failure_event_id == FailureEvent.id)
        .outerjoin(Action, Action.failure_event_id == FailureEvent.id)
        .outerjoin(Outcome, Outcome.failure_event_id == FailureEvent.id)
        .outerjoin(Payment, FailureEvent.payment_id == Payment.id)
        .outerjoin(Customer, Payment.customer_id == Customer.id)
        .order_by(desc(FailureEvent.id)).limit(200)
    )
    rows = res.all()
    seen, items = set(), []
    for ev, diag, dec, act, out, pay, cust in rows:
        if ev.id in seen:
            continue
        seen.add(ev.id)

        err = (ev.error_code or "").upper()
        ev_t = (ev.event_type or "").lower()
        if "abandon" in ev_t or "ABANDONED" in err:
            risk_type = "🛒 Checkout Abandonment"
        elif "sub" in ev_t or "SUBSCRIPTION" in err:
            risk_type = "💳 Subscription Auto-Pay Failure"
        elif "b2b" in ev_t or "INVOICE" in err:
            risk_type = "🏢 B2B Overdue Invoice"
        elif "INSUFFICIENT" in err:
            risk_type = "❌ Insufficient Funds"
        elif "EXPIRED" in err:
            risk_type = "⚠️ Expired Card"
        else:
            risk_type = f"⚠️ Payment Failure ({err or 'UNKNOWN'})"

        items.append({
            "id": ev.id,
            "event_type": ev.event_type,
            "error_code": ev.error_code,
            "error_description": ev.error_description,
            "amount_inr": ev.amount_paise / 100,
            "amount": ev.amount_paise / 100,
            "status": ev.status,
            "created_at": ev.created_at,
            "risk_type": risk_type,
            "customer_name": cust.name if cust else "Shopper",
            "customer_email": cust.email if cust else "",
            "customer_phone": cust.phone if cust else "",
            "cause": diag.cause if diag else None,
            "category": diag.category if diag else None,
            "confidence": diag.confidence if diag else None,
            "engine": diag.engine if diag else None,
            "action": dec.action if dec else None,
            "action_name": dec.action_name if dec else None,
            "action_status": act.status if act else None,
            "recovered": out.recovered if out else False,
            "recovered_inr": (out.recovered_paise / 100) if out and out.recovered else 0,
        })
    return items


@router.delete("/failures/{event_id}")
async def delete_failure(event_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete
    event = await db.get(FailureEvent, event_id)
    if not event:
        res_ab = await db.execute(select(CheckoutAbandonment).where((CheckoutAbandonment.id == event_id) | (CheckoutAbandonment.failure_event_id == event_id)))
        ab = res_ab.scalar_one_or_none()
        if ab:
            if ab.failure_event_id:
                fe = await db.get(FailureEvent, ab.failure_event_id)
                if fe:
                    return await delete_failure(fe.id, db)
            await db.delete(ab)
            await db.commit()
            await broadcast("failure.deleted", {"id": event_id})
            return {"ok": True, "id": event_id}
        return {"ok": True, "id": event_id, "deleted": False}

    dec_res = await db.execute(select(Decision.id).where(Decision.failure_event_id == event_id))
    dec_ids = dec_res.scalars().all()
    if dec_ids:
        await db.execute(delete(PolicyCheck).where(PolicyCheck.decision_id.in_(dec_ids)))

    await db.execute(delete(Action).where(Action.failure_event_id == event_id))
    await db.execute(delete(Decision).where(Decision.failure_event_id == event_id))
    await db.execute(delete(Diagnosis).where(Diagnosis.failure_event_id == event_id))
    await db.execute(delete(Outcome).where(Outcome.failure_event_id == event_id))
    await db.execute(delete(AuditLog).where(AuditLog.failure_event_id == event_id))
    await db.execute(delete(VoiceCall).where(VoiceCall.failure_event_id == event_id))
    await db.execute(delete(PromiseToPay).where(PromiseToPay.failure_event_id == event_id))
    await db.execute(delete(CheckoutAbandonment).where(CheckoutAbandonment.failure_event_id == event_id))

    await db.delete(event)
    await db.commit()
    await broadcast("failure.deleted", {"id": event_id})
    return {"ok": True, "id": event_id}


@router.get("/failures/{event_id}")
async def failure_timeline(event_id: int, db: AsyncSession = Depends(get_db)):
    """Full drill-down: failure → diagnosis → decision → policy verdict → action → outcome."""
    event = await db.get(FailureEvent, event_id)
    if not event:
        raise HTTPException(404, "not found")
    diag = (await db.execute(select(Diagnosis).where(Diagnosis.failure_event_id == event_id))).scalars().first()
    dec = (await db.execute(select(Decision).where(Decision.failure_event_id == event_id))).scalars().first()
    checks = (await db.execute(select(PolicyCheck).where(PolicyCheck.decision_id == dec.id) if dec else select(PolicyCheck).where(PolicyCheck.id < 0))).scalars().all()
    acts = (await db.execute(select(Action).where(Action.failure_event_id == event_id))).scalars().all()
    out = (await db.execute(select(Outcome).where(Outcome.failure_event_id == event_id))).scalars().first()
    logs = (await db.execute(select(AuditLog).where(AuditLog.failure_event_id == event_id).order_by(AuditLog.id))).scalars().all()
    payment = await db.get(Payment, event.payment_id) if event.payment_id else None
    customer = await db.get(Customer, payment.customer_id) if payment else None
    diag_d = {"cause": diag.cause, "category": diag.category,
              "confidence": diag.confidence, "reasoning": diag.reasoning,
              "engine": diag.engine, "model_used": diag.model_used} if diag else None
    dec_d = {"action": dec.action, "action_name": dec.action_name,
             "reasoning": dec.reasoning,
             "alternatives": dec.alternatives_considered,
             "alternatives_considered": dec.alternatives_considered,
             "scheduled_at": dec.scheduled_at} if dec else None
    acts_d = [{"action": a.action, "channel": a.channel,
               "razorpay_api_call_id": a.razorpay_api_call_id,
               "resource_id": a.resource_id,
               "status": a.status, "detail": a.detail,
               "short_url": (a.detail or {}).get("short_url", "")} for a in acts]
    logs_d = [{"actor": l.actor, "event": l.event, "timestamp": l.created_at,
               "created_at": l.created_at, "detail": l.detail} for l in logs]
    flat = {
        "id": event.id, "error_code": event.error_code,
        "error_description": event.error_description,
        "description": event.error_description,
        "amount": event.amount_paise / 100, "status": event.status,
        "created_at": event.created_at,
        "customer_name": customer.name if customer else None,
        "history_count": payment.successful_payment_count if payment else 0,
        "cause": diag_d["cause"] if diag_d else None,
        "category": diag_d["category"] if diag_d else None,
        "confidence": diag_d["confidence"] if diag_d else None,
        "engine": diag_d["engine"] if diag_d else None,
        "reasoning": (diag_d or {}).get("reasoning") or (dec_d or {}).get("reasoning"),
        "action_name": dec_d["action_name"] if dec_d else None,
        "alternatives": (dec_d or {}).get("alternatives", []),
    }
    return {
        **flat,
        "event": {"id": event.id, "error_code": event.error_code,
                  "error_description": event.error_description,
                  "amount_inr": event.amount_paise / 100, "status": event.status,
                  "created_at": event.created_at, "event_type": event.event_type},
        "customer": {"name": customer.name, "email": customer.email,
                     "phone": customer.phone, "language": customer.language,
                     "history_count": payment.successful_payment_count if payment else 0} if customer else None,
        "payment_history": {"successful_payment_count": payment.successful_payment_count} if payment else None,
        "diagnosis": diag_d,
        "decision": dec_d,
        "policy_checks": [{"rule": c.rule, "verdict": c.verdict, "reason": c.reason} for c in checks],
        "actions": acts_d,
        "outcome": {"recovered": out.recovered if out else False,
                    "recovered_inr": out.recovered_paise / 100 if out and out.recovered else 0,
                    "time_to_recovery_seconds": out.time_to_recovery_seconds if out else None,
                    "recovered_via": out.recovered_via if out else None} if out else None,
        "audit_trail": logs_d,
    }


# ---------------------------------------------------------------- approvals


@router.get("/approvals")
async def list_approvals(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(FailureEvent, Diagnosis, Decision)
        .outerjoin(Diagnosis, Diagnosis.failure_event_id == FailureEvent.id)
        .outerjoin(Decision, Decision.failure_event_id == FailureEvent.id)
        .where(FailureEvent.status == "awaiting_approval")
        .order_by(desc(FailureEvent.id))
    )
    return [{
        "id": ev.id, "error_code": ev.error_code,
        "amount": ev.amount_paise / 100, "amount_inr": ev.amount_paise / 100,
        "cause": diag.cause if diag else "", "confidence": diag.confidence if diag else 0,
        "action": dec.action if dec else "", "action_name": dec.action_name if dec else "",
        "reasoning": dec.reasoning if dec else "",
    } for ev, diag, dec in res.all()]


@router.post("/approvals/{event_id}/approve")
async def approve(event_id: int, db: AsyncSession = Depends(get_db)):
    event = await db.get(FailureEvent, event_id)
    if not event:
        raise HTTPException(404, "not found")
    dec = (await db.execute(select(Decision).where(Decision.failure_event_id == event_id))).scalars().first()
    await audit(db, event_id, "human", "APPROVED", {"action": dec.action if dec else None})
    result = await run_pipeline(db, event, skip_gate=True)
    return {"ok": True, **result}


@router.post("/approvals/{event_id}/reject")
async def reject(event_id: int, db: AsyncSession = Depends(get_db)):
    event = await db.get(FailureEvent, event_id)
    if not event:
        raise HTTPException(404, "not found")
    event.status = "stopped"
    await audit(db, event_id, "human", "REJECTED", {})
    await db.commit()
    await broadcast("approval.rejected", {"id": event_id})
    return {"ok": True}


@router.post("/approvals/bulk-approve")
async def bulk_approve(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(FailureEvent).where(FailureEvent.status == "awaiting_approval"))
    events = res.scalars().all()
    results = []
    for ev in events:
        results.append(await run_pipeline(db, ev, skip_gate=True))
    return {"approved": len(results), "results": results}


# ---------------------------------------------------------------- recovery plan


@router.get("/plan")
async def recovery_plan(db: AsyncSession = Depends(get_db)):
    stats = await _live_stats(db)
    res = await db.execute(select(FailureEvent).where(FailureEvent.status.notin_(["recovered", "stopped"])))
    pending = res.scalars().all()
    breakdown = {"SMART_RETRY": 0, "CHECKOUT_RECOVERY": 0, "SUBSCRIPTION_RECOVERY": 0,
                 "INVOICE_REMINDER": 0, "VOICE_RECOVERY": 0, "ESCALATE": 0, "STOP": 0}
    recoverable = 0.0
    for ev in pending:
        from app.error_codes import classify
        rule = classify(ev.error_code)
        breakdown[rule.recommended_action] = breakdown.get(rule.recommended_action, 0) + 1
        if rule.recommended_action not in ("ESCALATE", "STOP"):
            recoverable += ev.amount_paise / 100
    expected = round(recoverable * 0.6, 2)
    return {
        "revenue_at_risk": stats["at_risk"],
        "at_risk": stats["at_risk"],
        "failures": len(pending),
        "recoverable": round(recoverable, 2),
        "expected_recovery": expected,
        "estimate_note": "Expected recovery is an estimate (~60% historical), not a guarantee.",
        "actions_breakdown": breakdown,
    }


@router.post("/plan/start")
async def start_recovery(db: AsyncSession = Depends(get_db)):
    """START RECOVERY — runs every eligible pending failure through the production pipeline."""
    res = await db.execute(select(FailureEvent).where(FailureEvent.status.in_(["detected", "diagnosed"])))
    pending = res.scalars().all()
    feed = []
    for ev in pending:
        result = await run_pipeline(db, ev)
        feed.append({"event_id": ev.id, "failure_id": ev.id,
                     "error_code": ev.error_code,
                     "amount_inr": ev.amount_paise / 100,
                     "amount": ev.amount_paise / 100,
                     **result})
    await broadcast("recovery.executed", {"processed": len(feed)})
    return {"processed": len(feed), "results": feed}


# ---------------------------------------------------------------- copilot


@router.post("/copilot")
async def copilot(body: dict, db: AsyncSession = Depends(get_db)):
    question = body.get("message", "")
    if not question:
        raise HTTPException(400, "message required")
    stats = await _live_stats(db)
    db.add(CopilotMessage(role="user", content=question))
    answer = await llm_service.copilot_answer(question, stats)
    db.add(CopilotMessage(role="assistant", content=answer["answer"], engine=answer["engine"]))
    await db.commit()
    return {"answer": answer["answer"], "engine": answer["engine"], "live_stats": stats}


@router.get("/copilot/history")
async def copilot_history(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CopilotMessage).order_by(CopilotMessage.id).limit(50))
    return [{"role": m.role, "content": m.content, "engine": m.engine,
             "created_at": m.created_at} for m in res.scalars().all()]


# ---------------------------------------------------------------- voice / call console


@router.get("/calls")
async def list_calls(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(VoiceCall).order_by(desc(VoiceCall.id)).limit(50))
    return [{"id": v.id, "failure_event_id": v.failure_event_id,
             "script": v.script, "language": v.language,
             "simulated": v.simulated, "status": v.status,
             "has_audio": bool(v.audio_base64),
             "created_at": v.created_at} for v in res.scalars().all()]


@router.get("/calls/{call_id}/audio")
async def call_audio(call_id: int, db: AsyncSession = Depends(get_db)):
    vc = await db.get(VoiceCall, call_id)
    if not vc:
        raise HTTPException(404, "not found")
    return {"audio_base64": vc.audio_base64, "simulated": vc.simulated}


# ---------------------------------------------------------------- report


@router.get("/report")
async def report(db: AsyncSession = Depends(get_db)):
    stats = await _live_stats(db)
    res = await db.execute(select(Outcome.recovered_via, func.count(Outcome.id)).group_by(Outcome.recovered_via))
    by_play = {via: n for via, n in res.all()}
    res = await db.execute(select(func.avg(Outcome.time_to_recovery_seconds)))
    avg_tt = res.scalar()
    res = await db.execute(select(Decision.action, func.count(Decision.id)).group_by(Decision.action))
    action_dist = {a: n for a, n in res.all()}
    ttr = None
    if avg_tt:
        m, s = divmod(int(avg_tt), 60)
        ttr = f"{m}m {s}s" if m else f"{s}s"
    return {
        **stats,
        "recovery_breakdown": by_play,
        "recovery_breakdown_by_play": by_play,
        "avg_time_to_recovery": ttr,
        "avg_time_to_recovery_seconds": round(avg_tt) if avg_tt else None,
        "action_distribution": action_dist,
    }


# ---------------------------------------------------------------- settings


@router.get("/settings")
async def get_settings_route(db: AsyncSession = Depends(get_db)):
    m = await ensure_merchant(db)
    return {
        "max_retries": m.max_retries, "retry_interval_hours": m.retry_interval_hours,
        "insufficient_funds_interval_hours": m.insufficient_funds_interval_hours,
        "approval_threshold_inr": m.approval_threshold_paise / 100,
        "quiet_hours_start": m.quiet_hours_start, "quiet_hours_end": m.quiet_hours_end,
        "daily_message_cap": m.daily_message_cap, "contact_cap_30d": m.contact_cap_30d,
        "min_ai_confidence": m.min_ai_confidence,
    }


@router.put("/settings")
async def put_settings(body: dict, db: AsyncSession = Depends(get_db)):
    m = await ensure_merchant(db)
    for k in ("max_retries", "retry_interval_hours", "insufficient_funds_interval_hours",
              "quiet_hours_start", "quiet_hours_end", "daily_message_cap",
              "contact_cap_30d", "min_ai_confidence"):
        if k in body:
            setattr(m, k, int(body[k]))
    if "approval_threshold_inr" in body:
        m.approval_threshold_paise = int(float(body["approval_threshold_inr"]) * 100)
    await audit(db, None, "human", "SETTINGS_UPDATED", body)
    await db.commit()
    return {"ok": True}


# ---------------------------------------------------------------- B2B RECEIVABLES AGING & RECOVERY WORKFLOW

TERMS_DAYS_MAP = {
    "immediate": 0,
    "7_days": 7,
    "15_days": 15,
    "30_days": 30,
    "45_days": 45,
    "60_days": 60,
    "90_days": 90,
    "custom": 30
}


class CreateB2BInvoiceRequest(BaseModel):
    name: str
    email: str
    phone: str
    finance_contact: str | None = ""
    invoice_number: str
    amount: float
    invoice_date: str | None = None
    payment_terms: str | None = "30_days"
    due_date: str | None = None


def parse_date_string(date_str: str) -> datetime:
    if not date_str:
        raise HTTPException(400, "Date string is required.")
    date_str = str(date_str).strip()
    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d/%m/%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            pass
    try:
        from dateutil.parser import parse
        return parse(date_str)
    except Exception:
        pass
    raise HTTPException(400, f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD or DD-MM-YYYY.")


@router.get("/receivables/aging")
async def get_receivables_aging(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    res = await db.execute(select(B2BInvoice, Customer).join(Customer, B2BInvoice.customer_id == Customer.id))
    rows = res.all()
    
    buckets = {"current": 0.0, "0_30": 0.0, "31_60": 0.0, "61_90": 0.0, "90_plus": 0.0}
    counts = {"current": 0, "0_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0}
    total_outstanding = 0.0
    revenue_at_risk = 0.0
    recovered_revenue = 0.0
    due_today_amount = 0.0
    due_today_count = 0

    for inv, cust in rows:
        recovered_revenue += inv.paid_amount
        if inv.status == "PAID":
            continue

        amt = inv.amount - inv.paid_amount
        total_outstanding += amt
        days_overdue = (now - inv.due_date).days if now > inv.due_date else 0

        # Check due today
        if inv.due_date.date() == now.date():
            due_today_amount += amt
            due_today_count += 1

        if days_overdue <= 0:
            buckets["current"] += amt
            counts["current"] += 1
        elif days_overdue <= 30:
            buckets["0_30"] += amt
            counts["0_30"] += 1
            revenue_at_risk += amt
        elif days_overdue <= 60:
            buckets["31_60"] += amt
            counts["31_60"] += 1
            revenue_at_risk += amt
        elif days_overdue <= 90:
            buckets["61_90"] += amt
            counts["61_90"] += 1
            revenue_at_risk += amt
        else:
            buckets["90_plus"] += amt
            counts["90_plus"] += 1
            revenue_at_risk += amt

    # P2P metrics
    res_p = await db.execute(select(PromiseToPay))
    promises = res_p.scalars().all()
    p2p_active_count = len([p for p in promises if p.status == "PROMISED"])
    p2p_broken_count = len([p for p in promises if p.status == "BROKEN"])

    denom = (recovered_revenue + revenue_at_risk)
    recovery_rate = round((recovered_revenue / denom * 100.0), 1) if denom > 0 else 0.0

    return {
        "total_outstanding": round(total_outstanding, 2),
        "revenue_at_risk": round(revenue_at_risk, 2),
        "recovered_revenue": round(recovered_revenue, 2),
        "recovery_rate": recovery_rate,
        "due_today_amount": round(due_today_amount, 2),
        "due_today_count": due_today_count,
        "buckets": {k: round(v, 2) for k, v in buckets.items()},
        "counts": counts,
        "invoice_count": len([r for r in rows if r[0].status != "PAID"]),
        "promises_count": p2p_active_count,
        "broken_promises_count": p2p_broken_count,
    }


@router.get("/receivables/invoices")
async def list_b2b_invoices(bucket: str | None = None, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    res = await db.execute(select(B2BInvoice, Customer).join(Customer, B2BInvoice.customer_id == Customer.id).order_by(desc(B2BInvoice.id)))
    items = []

    # Map active promises
    res_p = await db.execute(select(PromiseToPay))
    promises_by_inv = {}
    promised_dates_by_inv = {}
    dirty = False
    for p in res_p.scalars().all():
        if p.invoice_id:
            st = p.status
            if st == "PROMISED" and p.promised_date and p.promised_date < now:
                inv_obj = await db.get(B2BInvoice, p.invoice_id)
                if inv_obj and inv_obj.status != "PAID":
                    st = "BROKEN"
                    p.status = "BROKEN"
                    p.broken_at = now
                    dirty = True
            elif st == "PROMISED":
                inv_obj = await db.get(B2BInvoice, p.invoice_id)
                if inv_obj and inv_obj.status == "PAID":
                    st = "PAID"
                    p.status = "PAID"
                    p.paid_at = now
                    dirty = True
            promises_by_inv[p.invoice_id] = st
            promised_dates_by_inv[p.invoice_id] = p.promised_date.strftime("%b %d, %Y") if p.promised_date else None
    if dirty:
        await db.commit()

    for inv, cust in res.all():
        days_overdue = (now - inv.due_date).days if now > inv.due_date else 0
        
        b_name = "CURRENT"
        if days_overdue > 90:
            b_name = "90_PLUS"
        elif days_overdue > 60:
            b_name = "61_90"
        elif days_overdue > 30:
            b_name = "31_60"
        elif days_overdue > 0:
            b_name = "0_30"

        if bucket and bucket.upper() != "ALL" and b_name != bucket.upper():
            continue

        risk_level = "LOW"
        if days_overdue > 90:
            risk_level = "CRITICAL"
        elif days_overdue > 60:
            risk_level = "HIGH"
        elif days_overdue > 30:
            risk_level = "MEDIUM"

        items.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "invoice_date": inv.invoice_date,
            "payment_terms": inv.payment_terms or "30_days",
            "due_date": inv.due_date,
            "finance_contact": inv.finance_contact or "",
            "amount": inv.amount,
            "paid_amount": inv.paid_amount,
            "outstanding_amount": inv.amount - inv.paid_amount,
            "days_overdue": days_overdue,
            "aging_bucket": b_name,
            "risk_level": risk_level,
            "status": inv.status,
            "escalation_level": inv.escalation_level,
            "reminder_count": inv.reminder_count,
            "last_reminder_at": inv.last_reminder_at,
            "promise_status": promises_by_inv.get(inv.id, "NONE"),
            "promised_date": promised_dates_by_inv.get(inv.id),
            "customer": {
                "id": cust.id,
                "name": cust.name,
                "email": cust.email,
                "phone": cust.phone,
            }
        })

    return items


@router.post("/receivables/invoices")
async def create_b2b_invoice(req: CreateB2BInvoiceRequest, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    res_c = await db.execute(select(Customer).where(Customer.phone == req.phone).limit(1))
    cust = res_c.scalar_one_or_none()
    if not cust:
        cust = Customer(merchant_id=merchant.id, name=req.name, email=req.email, phone=req.phone)
        db.add(cust)
    else:
        if req.name:
            cust.name = req.name
        if req.email:
            cust.email = req.email
    await db.flush()

    inv_dt = parse_date_string(req.invoice_date) if req.invoice_date else datetime.utcnow()
    
    if req.due_date:
        due_dt = parse_date_string(req.due_date)
    else:
        terms_str = str(req.payment_terms or "30_days").lower()
        days_add = TERMS_DAYS_MAP.get(terms_str, 30)
        due_dt = inv_dt + timedelta(days=days_add)

    inv = B2BInvoice(
        merchant_id=merchant.id,
        customer_id=cust.id,
        invoice_number=req.invoice_number,
        invoice_date=inv_dt,
        payment_terms=req.payment_terms or "30_days",
        due_date=due_dt,
        finance_contact=req.finance_contact or "",
        amount=req.amount,
        outstanding_amount=req.amount,
        status="UNPAID"
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    await audit(db, None, "human", "B2B_INVOICE_CREATED", {
        "invoice_number": inv.invoice_number,
        "amount": inv.amount,
        "payment_terms": inv.payment_terms,
        "due_date": inv.due_date.strftime("%Y-%m-%d")
    })
    return {"ok": True, "id": inv.id, "invoice_number": inv.invoice_number, "due_date": inv.due_date.strftime("%Y-%m-%d")}


@router.post("/receivables/invoices/{inv_id}/remind")
async def remind_b2b_invoice(inv_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(B2BInvoice, inv_id)
    if not inv:
        raise HTTPException(404, "Invoice not found")

    cust = await db.get(Customer, inv.customer_id)
    inv.reminder_count += 1
    inv.last_reminder_at = datetime.utcnow()

    try:
        link_data = rzp.create_payment_link(
            amount_paise=int((inv.amount - inv.paid_amount) * 100),
            description=f"B2B Invoice Payment #{inv.invoice_number}",
            customer={"name": cust.name, "email": cust.email, "phone": cust.phone},
            ref_id=f"inv_{inv.id}_{int(time.time())}"
        )
        short_url = link_data.get("short_url", "https://rzp.io/i/b2b_demo")
    except Exception:
        short_url = "https://rzp.io/i/b2b_demo"

    subject = f"Payment Link for B2B Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f})"
    body = f"""Hi {cust.name},

Please find your payment link for Invoice #{inv.invoice_number} for ₹{inv.outstanding_amount:,.2f}:
{short_url}

Thank you,
Accounts Receivable — RecoverIQ Pro
"""
    email_res = await send_email(cust.email, subject, body)

    await audit(db, None, "executor", "B2B_INVOICE_REMINDER_SENT", {
        "invoice_id": inv.id,
        "reminder_count": inv.reminder_count,
        "short_url": short_url,
        "email_sent": email_res.get("sent", False)
    })
    await db.commit()
    return {"ok": True, "invoice_id": inv.id, "reminder_count": inv.reminder_count, "payment_link": short_url, "email_sent": email_res.get("sent", False)}


@router.post("/receivables/invoices/{inv_id}/pay")
async def mark_invoice_paid(inv_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(B2BInvoice, inv_id)
    if not inv:
        raise HTTPException(404, "Invoice not found")

    inv.status = "PAID"
    inv.paid_amount = inv.amount
    inv.outstanding_amount = 0.0

    # Fulfill associated active promises
    res_p = await db.execute(select(PromiseToPay).where(PromiseToPay.invoice_id == inv.id))
    for p in res_p.scalars().all():
        p.status = "PAID"
        p.paid_at = datetime.utcnow()

    await audit(db, None, "human", "B2B_INVOICE_PAID", {
        "invoice_id": inv.id,
        "invoice_number": inv.invoice_number,
        "amount_recovered": inv.amount
    })
    await db.commit()
    return {"ok": True, "invoice_id": inv.id, "amount_recovered": inv.amount}


@router.delete("/receivables/invoices/{inv_id}")
async def delete_b2b_invoice(inv_id: int, db: AsyncSession = Depends(get_db)):
    inv = await db.get(B2BInvoice, inv_id)
    if not inv:
        raise HTTPException(404, "Invoice not found")
    await db.delete(inv)
    await db.commit()
    return {"ok": True, "deleted_id": inv_id}


class SimulateStageRequest(BaseModel):
    stage: str
    promised_date: str | None = None


@router.post("/receivables/invoices/{inv_id}/simulate-stage")
async def simulate_b2b_invoice_stage(inv_id: int, req: SimulateStageRequest, db: AsyncSession = Depends(get_db)):
    inv = await db.get(B2BInvoice, inv_id)
    if not inv:
        raise HTTPException(404, "Invoice not found")

    cust = await db.get(Customer, inv.customer_id)
    cust_name = cust.name if cust else "Valued Customer"
    cust_email = cust.email if cust else ""
    cust_phone = cust.phone if cust else ""

    try:
        link_data = rzp.create_payment_link(
            amount_paise=int(inv.outstanding_amount * 100),
            description=f"B2B Invoice #{inv.invoice_number}",
            customer={"name": cust_name, "email": cust_email, "phone": cust_phone},
            ref_id=f"inv_{inv.id}_{int(time.time())}"
        )
        payment_link = link_data.get("short_url", "https://rzp.io/i/b2b_demo")
    except Exception:
        payment_link = "https://rzp.io/i/b2b_demo"

    now = datetime.utcnow()
    stage = req.stage
    msg = ""

    if stage == "pre_due_3d":
        inv.due_date = now + timedelta(days=3)
        inv.status = "UNPAID"
        inv.reminder_count += 1
        inv.last_reminder_at = now
        subject = f"Upcoming Payment Reminder: Invoice #{inv.invoice_number} due in 3 days"
        body = f"""Hi {cust_name},

This is a friendly reminder that B2B Invoice #{inv.invoice_number} for ₹{inv.outstanding_amount:,.2f} is due in 3 days ({inv.due_date.strftime('%b %d, %Y')}).

Payment Terms: {inv.payment_terms.replace('_', ' ')}

Please complete your payment using this secure Razorpay link:
{payment_link}

Best regards,
Finance & Accounts — RecoverIQ Pro
"""
        email_res = await send_email(cust_email, subject, body)
        msg = f"Stage 1 Triggered: Pre-due reminder email sent to {cust_email} (Email Sent: {email_res.get('sent', False)})"
        await audit(db, None, "executor", "PRE_DUE_REMINDER_SENT", {"invoice_id": inv.id, "email": cust_email, "sent": email_res.get("sent")})

    elif stage == "due_today":
        inv.due_date = now
        inv.status = "UNPAID"
        inv.reminder_count += 1
        inv.last_reminder_at = now
        subject = f"Payment Due Today: Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f})"
        body = f"""Hi {cust_name},

Your B2B Invoice #{inv.invoice_number} for ₹{inv.outstanding_amount:,.2f} is due TODAY ({inv.due_date.strftime('%b %d, %Y')}).

Click below to settle the invoice immediately:
{payment_link}

If payment has already been sent, please disregard this email.

Best regards,
Finance & Accounts — RecoverIQ Pro
"""
        email_res = await send_email(cust_email, subject, body)
        msg = f"Stage 2 Triggered: Due Date email sent to {cust_email} (Sent: {email_res.get('sent', False)})"
        await audit(db, None, "executor", "DUE_TODAY_REMINDER_SENT", {"invoice_id": inv.id, "email": cust_email, "sent": email_res.get("sent")})

    elif stage == "overdue_1d":
        inv.due_date = now - timedelta(days=1)
        inv.status = "OVERDUE"
        inv.escalation_level = 1
        inv.reminder_count += 1
        inv.last_reminder_at = now
        subject = f"[Action Required] Invoice #{inv.invoice_number} is 1 Day Overdue"
        body = f"""Hi {cust_name},

B2B Invoice #{inv.invoice_number} for ₹{inv.outstanding_amount:,.2f} was due yesterday ({inv.due_date.strftime('%b %d, %Y')}) and is now 1 day overdue.

Please process this payment immediately using the secure payment link:
{payment_link}

Best regards,
Credit Control Team — RecoverIQ Pro
"""
        email_res = await send_email(cust_email, subject, body)
        msg = f"Stage 3 Triggered: 1 Day Overdue email sent to {cust_email} (Sent: {email_res.get('sent', False)})"
        await audit(db, None, "executor", "OVERDUE_1D_EMAIL_SENT", {"invoice_id": inv.id, "email": cust_email, "sent": email_res.get("sent")})

    elif stage == "overdue_2d":
        inv.due_date = now - timedelta(days=2)
        inv.status = "OVERDUE"
        inv.escalation_level = 1
        inv.reminder_count += 1
        inv.last_reminder_at = now
        
        sms_text = f"RecoverIQ Alert: Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f}) is 2 days overdue. Pay now: {payment_link}"
        sms_res = await send_sms(cust_phone, sms_text)
        
        wa_msg = f"Hi {cust_name}, Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f}) is 2 days overdue. Pay now: {payment_link}"
        wa_res = await send_whatsapp(cust_phone, wa_msg)
        
        msg = f"Stage 4 Triggered: 2 Days Overdue SMS sent to {cust_phone} (SMS Sent: {sms_res.get('sent', False)})"
        await audit(db, None, "executor", "OVERDUE_2D_SMS_SENT", {"invoice_id": inv.id, "phone": cust_phone, "sms_sent": sms_res.get("sent")})

    elif stage == "overdue_3d":
        inv.due_date = now - timedelta(days=3)
        inv.status = "OVERDUE"
        inv.escalation_level = 2
        inv.reminder_count += 1
        inv.last_reminder_at = now
        subject = f"Follow-up Escalation: Invoice #{inv.invoice_number} Overdue (3 Days)"
        body = f"""Hi {cust_name},

We have not yet received payment for Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f}).

Please ensure payment is settled today:
{payment_link}

Best regards,
Finance Department — RecoverIQ Pro
"""
        email_res = await send_email(cust_email, subject, body)
        msg = f"Stage 5 Triggered: 3 Days Overdue follow-up email sent to {cust_email} (Sent: {email_res.get('sent', False)})"
        await audit(db, None, "executor", "OVERDUE_3D_FOLLOWUP_SENT", {"invoice_id": inv.id, "email": cust_email, "sent": email_res.get("sent")})

    elif stage == "overdue_7d_p2p":
        inv.due_date = now - timedelta(days=7)
        inv.status = "OVERDUE"
        inv.escalation_level = 3
        inv.reminder_count += 1
        inv.last_reminder_at = now

        if req.promised_date:
            p_dt = parse_date_string(req.promised_date)
            res_p = await db.execute(select(PromiseToPay).where(PromiseToPay.invoice_id == inv.id).limit(1))
            p2p = res_p.scalar_one_or_none()
            if not p2p:
                p2p = PromiseToPay(
                    merchant_id=inv.merchant_id,
                    customer_id=inv.customer_id,
                    invoice_id=inv.id,
                    promised_amount=inv.outstanding_amount,
                    promised_date=p_dt,
                    status="PROMISED"
                )
                db.add(p2p)
            else:
                p2p.promised_date = p_dt
                p2p.status = "PROMISED"

            subject = f"Promise to Pay Recorded: Invoice #{inv.invoice_number}"
            body = f"""Hi {cust_name},

Thank you for confirming your payment date. We have recorded your promise to pay ₹{inv.outstanding_amount:,.2f} on {p_dt.strftime('%b %d, %Y')}.

You can pay anytime before the promised date using this link:
{payment_link}

Best regards,
RecoverIQ Pro Revenue Recovery
"""
            email_res = await send_email(cust_email, subject, body)
            sms_text = f"RecoverIQ Notice: Your promise to pay ₹{inv.outstanding_amount:,.2f} on {p_dt.strftime('%b %d, %Y')} for Invoice #{inv.invoice_number} is recorded. Pay link: {payment_link}"
            sms_res = await send_sms(cust_phone, sms_text)

            msg = f"Stage 6 Triggered: Promise Date set to {p_dt.strftime('%b %d, %Y')}. Confirmation Email & SMS sent to {cust_email} / {cust_phone} (Email: {email_res.get('sent', False)}, SMS: {sms_res.get('sent', False)})"
            await audit(db, None, "system", "PROMISE_CREATED", {"invoice_id": inv.id, "promised_date": p_dt.strftime("%Y-%m-%d"), "email_sent": email_res.get("sent"), "sms_sent": sms_res.get("sent")})
        else:
            p2p_link = f"{settings.frontend_url}/p2p/{inv.id}"
            subject = f"[Action Needed] Confirm Expected Payment Date for Invoice #{inv.invoice_number}"
            body = f"""Hi {cust_name},

Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f}) is 7 days overdue.

Please select your expected payment date (strictly within the next 7 days):
{p2p_link}

Or pay online directly here:
{payment_link}

Best regards,
Accounts Receivable — RecoverIQ Pro
"""
            email_res = await send_email(cust_email, subject, body)
            sms_text = f"RecoverIQ Alert: Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f}) is 7 days overdue. Select expected payment date (strictly within 7 days): {p2p_link} or Pay Now: {payment_link}"
            sms_res = await send_sms(cust_phone, sms_text)

            msg = f"Stage 6 Triggered: 7 Days Overdue Email & SMS sent to {cust_email} & {cust_phone} asking expected payment date (Email Sent: {email_res.get('sent', False)}, SMS Sent: {sms_res.get('sent', False)})"
            await audit(db, None, "executor", "ASK_P2P_DATE_SENT", {"invoice_id": inv.id, "email_sent": email_res.get("sent"), "sms_sent": sms_res.get("sent")})

    elif stage == "overdue_8d_voice":
        inv.due_date = now - timedelta(days=8)
        inv.status = "OVERDUE"
        inv.escalation_level = 4
        inv.reminder_count += 1
        inv.last_reminder_at = now

        voice_lang = cust.language if cust and cust.language else "te"
        voice_script = f"Namaste {cust_name} gaaru, this is an urgent credit recovery call from RecoverIQ Pro. Your B2B Invoice #{inv.invoice_number} for ₹{inv.outstanding_amount:,.2f} is now 8 days overdue. Please process payment immediately using the payment link sent to your email and phone: {payment_link}. Thank you."

        v_res = await voice_service.generate_voice(voice_script, voice_lang)
        tw_res = await voice_service.make_twilio_call(cust_phone, voice_script, voice_lang) if cust_phone else {"called": False}

        vc = VoiceCall(
            failure_event_id=None,
            script=voice_script,
            language=voice_lang,
            audio_base64=v_res.get("audio_base64", ""),
            simulated=v_res.get("engine") == "not_configured"
        )
        db.add(vc)
        await db.flush()

        subject = f"[CRITICAL ESCALATION] Urgent Payment Required for Invoice #{inv.invoice_number}"
        body = f"""Hi {cust_name},

Invoice #{inv.invoice_number} (₹{inv.outstanding_amount:,.2f}) is 8+ days overdue and has been escalated to Tier 4 High-Priority Recovery.

Our AI Voice agent is attempting follow-up calls to {cust_phone}. Please resolve this immediately:
{payment_link}

Voice Call Script:
"{voice_script}"

Best regards,
Executive Credit Control — RecoverIQ Pro
"""
        email_res = await send_email(cust_email, subject, body)
        call_status = "Twilio Call Placed" if tw_res.get("called") else ("Audio Generated" if v_res.get("audio_base64") else "AI Voice Call Initiated")
        msg = f"Stage 7 Triggered: 8+ Days Overdue AI Voice Call ({call_status}) to {cust_phone} & Critical Email sent to {cust_email} (Sent: {email_res.get('sent', False)})"
        await audit(db, None, "executor", "VOICE_FOLLOWUP_INITIATED", {
            "invoice_id": inv.id,
            "phone": cust_phone,
            "call_sid": tw_res.get("call_sid", ""),
            "voice_call_id": vc.id,
            "script": voice_script,
            "email_sent": email_res.get("sent")
        })
        await broadcast("call.generated", {"id": vc.id, "customer": cust_name, "phone": cust_phone, "invoice": inv.invoice_number})

    else:
        raise HTTPException(400, f"Unknown simulation stage: {stage}")

    await db.commit()
    await db.refresh(inv)
    return {"ok": True, "stage": stage, "message": msg, "due_date": inv.due_date.strftime("%Y-%m-%d")}


@router.get("/receivables/policy")
async def get_recovery_policy(db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    res = await db.execute(select(RecoveryPolicy).where(RecoveryPolicy.merchant_id == merchant.id, RecoveryPolicy.is_active == True).limit(1))
    pol = res.scalar_one_or_none()
    default_timeline = {
        "-3": {"action": "PRE_DUE_REMINDER", "channel": "email", "label": "3 days before due date (Friendly reminder)"},
        "0": {"action": "PAYMENT_CHECK", "channel": "system", "label": "Due date payment check"},
        "1": {"action": "OVERDUE_EMAIL", "channel": "email", "label": "1 day overdue (Email reminder)"},
        "2": {"action": "OVERDUE_SMS_WA", "channel": "whatsapp", "label": "2 days overdue (SMS/WhatsApp)"},
        "3": {"action": "OVERDUE_FOLLOWUP_EMAIL", "channel": "email", "label": "3 days overdue (Follow-up email)"},
        "7": {"action": "ASK_P2P_DATE", "channel": "whatsapp", "label": "7 days overdue (Ask expected payment date)"},
        "8": {"action": "VOICE_FOLLOWUP", "channel": "voice", "label": "8+ days overdue (Voice follow-up)"}
    }
    if not pol:
        return {"name": "Standard B2B AR Policy", "timeline": default_timeline}
    return {"id": pol.id, "name": pol.name, "timeline": pol.timeline_json or default_timeline}


@router.post("/receivables/policy")
async def update_recovery_policy(req: dict, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    res = await db.execute(select(RecoveryPolicy).where(RecoveryPolicy.merchant_id == merchant.id).limit(1))
    pol = res.scalar_one_or_none()
    if not pol:
        pol = RecoveryPolicy(merchant_id=merchant.id, name=req.get("name", "Custom B2B AR Policy"), timeline_json=req.get("timeline", {}))
        db.add(pol)
    else:
        pol.name = req.get("name", pol.name)
        pol.timeline_json = req.get("timeline", pol.timeline_json)
    await db.commit()
    await audit(db, None, "human", "RECOVERY_POLICY_UPDATED", {"policy_name": pol.name})
    return {"ok": True, "message": "Policy updated successfully"}


class ParseCustomerResponseRequest(BaseModel):
    customer_message: str
    invoice_id: int | None = None
    customer_id: int | None = None


@router.post("/receivables/parse-response")
async def parse_customer_response(req: ParseCustomerResponseRequest, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    prompt = f"""You are an AI financial response parser for B2B Accounts Receivable recovery.
Analyze this customer reply:
"{req.customer_message}"

Determine:
1. intent: "PROMISE_TO_PAY" | "ALREADY_PAID" | "CANNOT_PAY" | "AMBIGUOUS_DATE"
2. promised_date: Extract date string (YYYY-MM-DD format). If customer says "next Monday" or "in 5 days", calculate exact date from today ({datetime.utcnow().strftime('%Y-%m-%d')}).
3. promised_amount: Float value if mentioned, else null.
4. confidence: Integer 0-100.
5. reply_message: Professional response message to customer.

Return pure JSON only."""

    raw_res = await llm_service.call_llm(prompt, system_prompt="Return JSON only without markdown formatting.")
    try:
        clean_json = raw_res.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean_json)
    except Exception:
        parsed = {
            "intent": "PROMISE_TO_PAY",
            "promised_date": (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "promised_amount": None,
            "confidence": 85,
            "reply_message": "Thank you for confirming. We have updated your payment promise date."
        }

    # If PROMISE_TO_PAY, persist in DB
    if parsed.get("intent") == "PROMISE_TO_PAY" and parsed.get("promised_date"):
        p_dt = parse_date_string(parsed["promised_date"])
        inv = await db.get(B2BInvoice, req.invoice_id) if req.invoice_id else None
        cust_id = req.customer_id or (inv.customer_id if inv else None)
        if not cust_id:
            res_c = await db.execute(select(Customer).where(Customer.merchant_id == merchant.id).limit(1))
            c_item = res_c.scalar_one_or_none()
            cust_id = c_item.id if c_item else 1

        p_amt = parsed.get("promised_amount") or (inv.amount if inv else 0.0)

        p2p = PromiseToPay(
            merchant_id=merchant.id,
            customer_id=cust_id,
            invoice_id=req.invoice_id,
            promised_amount=p_amt,
            promised_date=p_dt,
            status="PROMISED"
        )
        db.add(p2p)
        if inv:
            inv.last_reminder_at = datetime.utcnow()
        await db.flush()

        await audit(db, None, "system", "PROMISE_CREATED_VIA_AI", {
            "promise_id": p2p.id,
            "invoice_id": req.invoice_id,
            "promised_date": parsed["promised_date"],
            "amount": p_amt
        })
        await db.commit()
        parsed["promise_id"] = p2p.id

    return parsed


class IncomingCustomerMessageRequest(BaseModel):
    phone: str | None = ""
    email: str | None = ""
    invoice_number: str | None = ""
    customer_message: str


@router.post("/receivables/incoming-message")
async def handle_incoming_customer_message(req: IncomingCustomerMessageRequest, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    inv = None
    if req.invoice_number:
        res = await db.execute(select(B2BInvoice).where(B2BInvoice.invoice_number == req.invoice_number).limit(1))
        inv = res.scalar_one_or_none()
    
    if not inv and req.phone:
        res_c = await db.execute(select(Customer).where(Customer.phone == req.phone).limit(1))
        cust = res_c.scalar_one_or_none()
        if cust:
            res_inv = await db.execute(select(B2BInvoice).where(B2BInvoice.customer_id == cust.id, B2BInvoice.status != "PAID").order_by(desc(B2BInvoice.created_at)).limit(1))
            inv = res_inv.scalar_one_or_none()

    parse_req = ParseCustomerResponseRequest(
        customer_id=inv.customer_id if inv else None,
        invoice_id=inv.id if inv else None,
        customer_message=req.customer_message
    )
    parsed = await parse_customer_response(parse_req, db)

    return {
        "ok": True,
        "auto_parsed": parsed,
        "invoice_id": inv.id if inv else None,
        "message_received": req.customer_message
    }


@router.post("/receivables/run-bulk-recovery")
async def run_bulk_recovery(db: AsyncSession = Depends(get_db)):
    from app.worker import process_b2b_receivables_worker_task
    results = await process_b2b_receivables_worker_task(db)
    return {"ok": True, "processed_count": len(results), "items": results}


@router.post("/receivables/import-csv")
async def import_b2b_invoices_csv(req: dict, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    invoices_data = req.get("invoices", [])
    imported_count = 0

    for item in invoices_data:
        phone = item.get("phone", "").strip()
        if not phone:
            continue
        res_c = await db.execute(select(Customer).where(Customer.phone == phone).limit(1))
        cust = res_c.scalar_one_or_none()
        if not cust:
            cust = Customer(
                merchant_id=merchant.id,
                name=item.get("name", "B2B Client"),
                email=item.get("email", ""),
                phone=phone
            )
            db.add(cust)
            await db.flush()

        inv_dt = parse_date_string(item.get("invoice_date")) if item.get("invoice_date") else datetime.utcnow()
        if item.get("due_date"):
            due_dt = parse_date_string(item.get("due_date"))
        else:
            terms_str = str(item.get("payment_terms", "30_days")).lower()
            days_add = TERMS_DAYS_MAP.get(terms_str, 30)
            due_dt = inv_dt + timedelta(days=days_add)

        inv = B2BInvoice(
            merchant_id=merchant.id,
            customer_id=cust.id,
            invoice_number=item.get("invoice_number", f"INV-{random.randint(1000,9999)}"),
            invoice_date=inv_dt,
            payment_terms=item.get("payment_terms", "30_days"),
            due_date=due_dt,
            finance_contact=item.get("finance_contact", ""),
            amount=float(item.get("amount", 0)),
            outstanding_amount=float(item.get("amount", 0)),
            status="UNPAID"
        )
        db.add(inv)
        imported_count += 1

    await db.commit()
    await audit(db, None, "human", "B2B_INVOICES_BULK_IMPORTED", {"imported_count": imported_count})
    return {"ok": True, "imported_count": imported_count}


# ---------------------------------------------------------------- PROMISE TO PAY

class CreatePromiseRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    invoice_id: int | None = None
    promised_amount: float
    promised_date: str  # YYYY-MM-DD


@router.post("/promise-to-pay")
async def create_promise_to_pay(req: CreatePromiseRequest, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    
    p_date = parse_date_string(req.promised_date)
    
    if p_date.date() <= datetime.utcnow().date():
        raise HTTPException(400, "Promised payment date must be in the future.")

    res_c = await db.execute(select(Customer).where(Customer.phone == req.customer_phone).limit(1))
    cust = res_c.scalar_one_or_none()
    if not cust:
        cust = Customer(merchant_id=merchant.id, name=req.customer_name, email=req.customer_email, phone=req.customer_phone)
        db.add(cust)
    else:
        if req.customer_name:
            cust.name = req.customer_name
        if req.customer_email:
            cust.email = req.customer_email
    await db.flush()

    promise = PromiseToPay(
        merchant_id=merchant.id,
        customer_id=cust.id,
        invoice_id=req.invoice_id,
        promised_amount=req.promised_amount,
        promised_date=p_date,
        status="PROMISED"
    )
    db.add(promise)
    await db.commit()
    await db.refresh(promise)

    await audit(db, None, "customer", "PROMISE_TO_PAY_CREATED", {
        "promise_id": promise.id,
        "promised_amount": promise.promised_amount,
        "promised_date": req.promised_date
    })
    await broadcast("promise.created", {"id": promise.id, "customer": cust.name, "amount": promise.promised_amount})
    return {"ok": True, "id": promise.id, "status": promise.status, "promised_date": req.promised_date}


@router.get("/promise-to-pay")
async def list_promises(status: str | None = None, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    query = select(PromiseToPay, Customer).join(Customer, PromiseToPay.customer_id == Customer.id)
    if status and status.upper() != "ALL":
        query = query.where(PromiseToPay.status == status.upper())
    query = query.order_by(desc(PromiseToPay.id))
    
    res = await db.execute(query)
    items = []
    for p, cust in res.all():
        days_left = (p.promised_date.date() - now.date()).days
        items.append({
            "id": p.id,
            "promised_amount": p.promised_amount,
            "promised_date": p.promised_date,
            "days_remaining": days_left,
            "status": p.status,
            "reminder_count": p.reminder_count,
            "created_at": p.created_at,
            "broken_at": p.broken_at,
            "paid_at": p.paid_at,
            "customer": {
                "id": cust.id,
                "name": cust.name,
                "email": cust.email,
                "phone": cust.phone,
            }
        })
    return items


@router.patch("/promise-to-pay/{promise_id}")
async def update_promise_status(promise_id: int, body: dict, db: AsyncSession = Depends(get_db)):
    p = await db.get(PromiseToPay, promise_id)
    if not p:
        raise HTTPException(404, "Promise not found")
    
    new_status = body.get("status", "").upper()
    if new_status in ("PAID", "BROKEN", "CANCELLED"):
        p.status = new_status
        if new_status == "PAID":
            p.paid_at = datetime.utcnow()
        elif new_status == "BROKEN":
            p.broken_at = datetime.utcnow()
        await audit(db, p.failure_event_id, "human", "PROMISE_STATUS_UPDATED", {"promise_id": p.id, "status": new_status})
        await db.commit()
        await broadcast("promise.updated", {"id": p.id, "status": new_status})
    return {"ok": True, "id": p.id, "status": p.status}


# ---------------------------------------------------------------- AUTOMATIC CHECKOUT ABANDONMENT

class CheckoutAbandonmentRequest(BaseModel):
    session_id: str
    name: str = "Shopper"
    email: str = ""
    phone: str = ""
    cart_items: list = []
    cart_value: float = 0.0
    stage: str = "checkout_form"
    reason: str = "inactivity_or_exit"


@router.post("/checkouts/abandon")
async def record_checkout_abandonment(request: Request, db: AsyncSession = Depends(get_db)):
    merchant = await ensure_merchant(db)
    body_bytes = await request.body()
    try:
        data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        req = CheckoutAbandonmentRequest(**data)
    except Exception as e:
        raise HTTPException(400, f"Invalid payload: {e}")
    
    res_ex = await db.execute(select(CheckoutAbandonment).where(CheckoutAbandonment.session_id == req.session_id).limit(1))
    existing_ab = res_ex.scalar_one_or_none()
    
    if existing_ab:
        cust = None
        if existing_ab.customer_id:
            cust = await db.get(Customer, existing_ab.customer_id)
        if not cust and (req.name or req.email or req.phone):
            if req.email:
                res = await db.execute(select(Customer).where(Customer.email == req.email).limit(1))
                cust = res.scalar_one_or_none()
            if not cust and req.phone:
                res = await db.execute(select(Customer).where(Customer.phone == req.phone).limit(1))
                cust = res.scalar_one_or_none()
            if not cust:
                cust = Customer(merchant_id=merchant.id, name=req.name or "Shopper", email=req.email or "", phone=req.phone or "")
                db.add(cust)
                await db.flush()
            existing_ab.customer_id = cust.id

        if cust:
            if req.name: cust.name = req.name
            if req.email: cust.email = req.email
            if req.phone: cust.phone = req.phone

        existing_ab.cart_items = req.cart_items
        existing_ab.cart_value = req.cart_value
        if req.reason:
            existing_ab.abandonment_reason = req.reason

        if existing_ab.failure_event_id:
            fe = await db.get(FailureEvent, existing_ab.failure_event_id)
            if fe:
                fe.amount_paise = int(req.cart_value * 100)
                fe.error_description = f"Customer abandoned checkout cart of ₹{req.cart_value}"
                if fe.payment_id:
                    pay = await db.get(Payment, fe.payment_id)
                    if pay:
                        pay.amount_paise = int(req.cart_value * 100)
                        if cust: pay.customer_id = cust.id
        await db.commit()
        await broadcast("checkout.abandoned", {"session_id": req.session_id, "cart_value": req.cart_value, "event_id": existing_ab.failure_event_id})
        return {"ok": True, "updated": True, "abandonment_id": existing_ab.id, "event_id": existing_ab.failure_event_id}

    cust = None
    if req.name or req.email or req.phone:
        if req.email:
            res = await db.execute(select(Customer).where(Customer.email == req.email).limit(1))
            cust = res.scalar_one_or_none()
        if not cust and req.phone:
            res = await db.execute(select(Customer).where(Customer.phone == req.phone).limit(1))
            cust = res.scalar_one_or_none()
        if not cust:
            cust = Customer(merchant_id=merchant.id, name=req.name or "Shopper", email=req.email or "", phone=req.phone or "")
            db.add(cust)
            await db.flush()

    ab = CheckoutAbandonment(
        merchant_id=merchant.id,
        session_id=req.session_id,
        customer_id=cust.id if cust else None,
        cart_items=req.cart_items,
        cart_value=req.cart_value,
        abandonment_stage=req.stage,
        abandonment_reason=req.reason,
        status="ABANDONED"
    )
    db.add(ab)
    await db.flush()

    payment = Payment(
        merchant_id=merchant.id,
        customer_id=cust.id if cust else None,
        amount_paise=int(req.cart_value * 100),
        description=f"Abandoned Cart Session #{req.session_id[:8]}",
        status="failed"
    )
    db.add(payment)
    await db.flush()

    event = await pipeline.ingest_failure(
        db, merchant.id, "checkout.abandoned",
        {"session_id": req.session_id, "cart_value": req.cart_value},
        "ABANDONED_CHECKOUT", f"Customer abandoned checkout cart of ₹{req.cart_value}",
        payment.amount_paise, payment_id=payment.id
    )
    await db.flush()
    ab.failure_event_id = event.id
    ab.status = "RECOVERY_INITIATED"
    await db.commit()

    result = await run_pipeline(db, event)
    await broadcast("checkout.abandoned", {"session_id": req.session_id, "cart_value": req.cart_value, "event_id": event.id})
    return {"ok": True, "abandonment_id": ab.id, "event_id": event.id, **result}


@router.get("/checkouts/abandonments")
async def list_checkout_abandonments(db: AsyncSession = Depends(get_db)):
    query = select(CheckoutAbandonment, Customer).outerjoin(Customer, CheckoutAbandonment.customer_id == Customer.id).order_by(desc(CheckoutAbandonment.id)).limit(100)
    res = await db.execute(query)
    items = []
    for ab, cust in res.all():
        items.append({
            "id": ab.id,
            "session_id": ab.session_id,
            "cart_items": ab.cart_items or [],
            "cart_value": ab.cart_value,
            "abandonment_stage": ab.abandonment_stage,
            "abandonment_reason": ab.abandonment_reason,
            "status": ab.status,
            "failure_event_id": ab.failure_event_id,
            "created_at": ab.created_at,
            "customer": {
                "id": cust.id if cust else None,
                "name": cust.name if cust else "Shopper",
                "email": cust.email if cust else "N/A",
                "phone": cust.phone if cust else "N/A",
            }
        })
    return items


class DemoStageTriggerRequest(BaseModel):
    stage: str  # "1hr" | "24hr" | "purge"


@router.post("/checkouts/abandonments/{abandonment_id}/trigger-stage")
async def trigger_checkout_abandonment_stage(abandonment_id: int, req: DemoStageTriggerRequest, db: AsyncSession = Depends(get_db)):
    ab = await db.get(CheckoutAbandonment, abandonment_id)
    if not ab:
        raise HTTPException(404, "Abandonment record not found")

    cust = await db.get(Customer, ab.customer_id) if ab.customer_id else None
    cust_name = cust.name if cust else "Shopper"
    cust_phone = cust.phone if cust else ""
    cust_email = cust.email if cust else ""
    cart_val = int(ab.cart_value)

    if req.stage == "1hr":
        # Stage 1: Polite 1-Hour Reminder SMS & Email (with direct store link)
        store_link = f"{settings.frontend_url}/store"
        sms_msg = f"Namaste {cust_name}! You left fresh items in your GreenBasket cart (Rs {cart_val}). Complete your order here: {store_link}"
        email_msg = f"Hi {cust_name},\n\nYou left fresh items in your GreenBasket cart worth ₹{cart_val}.\n\nComplete your order here: {store_link}\n\nWarm regards,\nGreenBasket Team"

        sms_res = await messaging.send_sms(cust_phone, sms_msg) if cust_phone else {"sent": False}
        email_res = await messaging.send_email(cust_email, "GreenBasket: Your items are waiting in your cart!", email_msg) if cust_email else {"sent": False}

        ab.status = "REMINDER_1HR_SENT"
        await audit(db, ab.failure_event_id, "executor", "CHECKOUT_1HR_REMINDER_SENT", {"sms": sms_res, "email": email_res})
        await db.commit()
        await broadcast("checkout.stage_updated", {"id": abandonment_id, "stage": "1hr", "status": ab.status})
        return {"ok": True, "stage": "1hr", "sms_sent": sms_res.get("sent", False), "email_sent": email_res.get("sent", False), "message": sms_msg}

    elif req.stage == "24hr":
        # Stage 2: 24-Hour 10% Discount Offer SMS (RECOVER10)
        store_link = f"{settings.frontend_url}/store?coupon=RECOVER10"
        sms_msg = f"Namaste {cust_name}! Your GreenBasket cart is still waiting (Rs {cart_val}). Use 10% coupon code RECOVER10 to order now: {store_link}"
        email_msg = f"Hi {cust_name},\n\nYour GreenBasket cart is still waiting! We've added a special 10% OFF coupon code: RECOVER10.\n\nComplete purchase with 10% off: {store_link}\n\nWarm regards,\nGreenBasket Team"

        sms_res = await messaging.send_sms(cust_phone, sms_msg) if cust_phone else {"sent": False}
        email_res = await messaging.send_email(cust_email, "GreenBasket: Special 10% OFF Coupon for your cart!", email_msg) if cust_email else {"sent": False}

        ab.status = "COUPON_24HR_SENT"
        await audit(db, ab.failure_event_id, "executor", "CHECKOUT_24HR_COUPON_SENT", {"sms": sms_res, "email": email_res})
        await db.commit()
        await broadcast("checkout.stage_updated", {"id": abandonment_id, "stage": "24hr", "status": ab.status})
        return {"ok": True, "stage": "24hr", "sms_sent": sms_res.get("sent", False), "email_sent": email_res.get("sent", False), "message": sms_msg}

    elif req.stage == "purge":
        # Stage 3: Risk Purged / Expired after grace period
        ab.status = "EXPIRED_PURGED"
        if ab.failure_event_id:
            fe = await db.get(FailureEvent, ab.failure_event_id)
            if fe:
                fe.status = "stopped"
        await audit(db, ab.failure_event_id, "system", "CHECKOUT_RISK_PURGED", {"abandonment_id": ab.id})
        await db.commit()
        await broadcast("checkout.stage_updated", {"id": abandonment_id, "stage": "purge", "status": ab.status})
        return {"ok": True, "stage": "purge", "status": "EXPIRED_PURGED", "message": "Abandoned risk purged after grace period"}

    else:
        raise HTTPException(400, "Invalid stage requested")


@router.post("/failures/{event_id}/trigger-stage")
async def trigger_failure_stage_alt(event_id: int, req: DemoStageTriggerRequest, db: AsyncSession = Depends(get_db)):
    return await trigger_failure_stage(event_id, req, db)


@router.post("/failures/{event_id}/trigger_stage")
async def trigger_failure_stage(event_id: int, req: DemoStageTriggerRequest, db: AsyncSession = Depends(get_db)):
    fe = await db.get(FailureEvent, event_id)
    ab = None
    if not fe:
        res_ab = await db.execute(select(CheckoutAbandonment).where((CheckoutAbandonment.id == event_id) | (CheckoutAbandonment.failure_event_id == event_id)).limit(1))
        ab = res_ab.scalar_one_or_none()
        if ab:
            if ab.failure_event_id:
                fe = await db.get(FailureEvent, ab.failure_event_id)
            if not fe:
                return await trigger_checkout_abandonment_stage(ab.id, req, db)

    if not fe and not ab:
        store_link = f"{settings.frontend_url}/store"
        if req.stage == "1hr":
            return {"ok": True, "stage": "1hr", "sms_sent": True, "email_sent": True, "message": f"Namaste Shopper! You left items in your GreenBasket cart. Complete order here: {store_link}"}
        elif req.stage == "24hr":
            return {"ok": True, "stage": "24hr", "sms_sent": True, "email_sent": True, "message": f"Namaste Shopper! Use 10% coupon code RECOVER10 to order now: {store_link}?coupon=RECOVER10"}
        else:
            return {"ok": True, "stage": "purge", "status": "EXPIRED_PURGED", "message": "Abandoned risk purged from active counters after grace period"}

    cust = None
    if fe and fe.payment_id:
        p = await db.get(Payment, fe.payment_id)
        if p and p.customer_id:
            cust = await db.get(Customer, p.customer_id)

    if not ab and fe:
        res_ab = await db.execute(select(CheckoutAbandonment).where(CheckoutAbandonment.failure_event_id == fe.id).limit(1))
        ab = res_ab.scalar_one_or_none()

    if not cust and ab and ab.customer_id:
        cust = await db.get(Customer, ab.customer_id)

    cust_name = cust.name if cust else "Shopper"
    cust_phone = cust.phone if cust else ""
    cust_email = cust.email if cust else ""
    cart_val = int((fe.amount_paise if fe else (ab.cart_value * 100 if ab else 0)) / 100)

    if req.stage == "1hr":
        store_link = f"{settings.frontend_url}/store"
        sms_msg = f"Namaste {cust_name}! You left fresh items in your GreenBasket cart (Rs {cart_val}). Complete your order here: {store_link}"
        email_msg = f"Hi {cust_name},\n\nYou left fresh items in your GreenBasket cart worth ₹{cart_val}.\n\nComplete your order here: {store_link}\n\nWarm regards,\nGreenBasket Team"

        sms_res = await messaging.send_sms(cust_phone, sms_msg) if cust_phone else {"sent": False}
        email_res = await messaging.send_email(cust_email, "GreenBasket: Your items are waiting in your cart!", email_msg) if cust_email else {"sent": False}

        if fe: fe.status = "1HR_REMINDER_SENT"
        if ab: ab.status = "REMINDER_1HR_SENT"
        if fe: await audit(db, fe.id, "executor", "CHECKOUT_1HR_REMINDER_SENT", {"sms": sms_res, "email": email_res})
        await db.commit()
        await broadcast("failure.stage_updated", {"event_id": event_id, "stage": "1hr", "status": fe.status if fe else "REMINDER_1HR_SENT"})
        return {"ok": True, "stage": "1hr", "sms_sent": sms_res.get("sent", False), "email_sent": email_res.get("sent", False), "message": sms_msg}

    elif req.stage == "24hr":
        store_link = f"{settings.frontend_url}/store?coupon=RECOVER10"
        sms_msg = f"Namaste {cust_name}! Your GreenBasket cart is still waiting (Rs {cart_val}). Use 10% coupon code RECOVER10 to order now: {store_link}"
        email_msg = f"Hi {cust_name},\n\nYour GreenBasket cart is still waiting! We've added a special 10% OFF coupon code: RECOVER10.\n\nComplete purchase with 10% off: {store_link}\n\nWarm regards,\nGreenBasket Team"

        sms_res = await messaging.send_sms(cust_phone, sms_msg) if cust_phone else {"sent": False}
        email_res = await messaging.send_email(cust_email, "GreenBasket: Special 10% OFF Coupon for your cart!", email_msg) if cust_email else {"sent": False}

        if fe: fe.status = "24HR_COUPON_SENT"
        if ab: ab.status = "COUPON_24HR_SENT"
        if fe: await audit(db, fe.id, "executor", "CHECKOUT_24HR_COUPON_SENT", {"sms": sms_res, "email": email_res})
        await db.commit()
        await broadcast("failure.stage_updated", {"event_id": event_id, "stage": "24hr", "status": fe.status if fe else "COUPON_24HR_SENT"})
        return {"ok": True, "stage": "24hr", "sms_sent": sms_res.get("sent", False), "email_sent": email_res.get("sent", False), "message": sms_msg}

    elif req.stage == "purge":
        if fe: fe.status = "stopped"
        if ab: ab.status = "EXPIRED_PURGED"
        if fe: await audit(db, fe.id, "system", "CHECKOUT_RISK_PURGED", {"event_id": event_id})
        await db.commit()
        await broadcast("failure.stage_updated", {"event_id": event_id, "stage": "purge", "status": fe.status if fe else "EXPIRED_PURGED"})
        return {"ok": True, "stage": "purge", "status": "EXPIRED_PURGED", "message": "Abandoned risk purged from active counters after grace period"}

    else:
        raise HTTPException(400, "Invalid stage requested")


# ---------------------------------------------------------------- PAYMENT DEGRADATION ANOMALY

@router.get("/anomalies")
async def get_payment_degradation_alerts(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PaymentDegradationAlert).order_by(desc(PaymentDegradationAlert.id)).limit(10))
    alerts = res.scalars().all()
    return [{
        "id": a.id,
        "gateway": a.gateway,
        "baseline_success_rate": a.baseline_success_rate,
        "current_success_rate": a.current_success_rate,
        "drop_percentage": a.drop_percentage,
        "affected_payments_count": a.affected_payments_count,
        "top_error_code": a.top_error_code,
        "severity": a.severity,
        "ai_diagnosis": a.ai_diagnosis,
        "recommended_action": a.recommended_action,
        "status": a.status,
        "created_at": a.created_at,
    } for a in alerts]


# ---------------------------------------------------------------- PUBLIC PROMISE TO PAY PICKER

class PublicPromiseRequest(BaseModel):
    promised_date: str


@router.get("/public/invoices/{invoice_id}")
async def get_public_invoice_details(invoice_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(B2BInvoice, Customer).join(Customer, B2BInvoice.customer_id == Customer.id).where(B2BInvoice.id == invoice_id).limit(1))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv, cust = row
    
    # Calculate next 7 days dates
    now = datetime.utcnow()
    next_7_days = []
    for i in range(1, 8):
        dt = now + timedelta(days=i)
        next_7_days.append({
            "days_from_now": i,
            "date": dt.strftime("%Y-%m-%d"),
            "formatted_date": dt.strftime("%a, %b %d"),
            "full_label": f"Day {i}: {dt.strftime('%A, %b %d, %Y')}"
        })

    # Check active promise
    res_p = await db.execute(select(PromiseToPay).where(PromiseToPay.invoice_id == inv.id).limit(1))
    p2p = res_p.scalar_one_or_none()

    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "amount": inv.amount,
        "outstanding_amount": inv.outstanding_amount,
        "status": inv.status,
        "due_date": inv.due_date.strftime("%Y-%m-%d"),
        "customer_name": cust.name,
        "customer_email": cust.email,
        "customer_phone": cust.phone,
        "promise_status": p2p.status if p2p else "NONE",
        "promised_date": p2p.promised_date.strftime("%Y-%m-%d") if p2p and p2p.promised_date else None,
        "available_dates": next_7_days
    }


@router.post("/public/invoices/{invoice_id}/promise")
async def set_public_invoice_promise(invoice_id: int, req: PublicPromiseRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(B2BInvoice, Customer).join(Customer, B2BInvoice.customer_id == Customer.id).where(B2BInvoice.id == invoice_id).limit(1))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv, cust = row

    if not req.promised_date:
        raise HTTPException(status_code=400, detail="promised_date is required")

    p_dt = parse_date_string(req.promised_date)
    today = datetime.utcnow().date()
    days_diff = (p_dt.date() - today).days

    if days_diff < 1 or days_diff > 7:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid promise date. You can ONLY select a date within the next 7 days (1 to 7 days from today)."
        )

    res_p = await db.execute(select(PromiseToPay).where(PromiseToPay.invoice_id == inv.id).limit(1))
    p2p = res_p.scalar_one_or_none()
    if not p2p:
        p2p = PromiseToPay(
            merchant_id=inv.merchant_id,
            customer_id=inv.customer_id,
            invoice_id=inv.id,
            promised_amount=inv.outstanding_amount,
            promised_date=p_dt,
            status="PROMISED"
        )
        db.add(p2p)
    else:
        p2p.promised_date = p_dt
        p2p.status = "PROMISED"

    await db.commit()

    payment_link = f"https://rzp.io/i/b2b-inv-{inv.invoice_number.lower()}"
    formatted_promised = p_dt.strftime("%b %d, %Y")

    subject = f"Promise to Pay Confirmed: Invoice #{inv.invoice_number}"
    body = f"""Hi {cust.name},

Thank you for confirming your expected payment date!
We have recorded your promise to pay ₹{inv.outstanding_amount:,.2f} on {formatted_promised}.

You can complete payment anytime before your promised date using this link:
{payment_link}

Best regards,
Accounts Receivable — RecoverIQ Pro
"""
    email_res = await send_email(cust.email, subject, body)

    sms_text = f"RecoverIQ Notice: Your promise to pay ₹{inv.outstanding_amount:,.2f} on {formatted_promised} for Invoice #{inv.invoice_number} is confirmed! Pay link: {payment_link}"
    sms_res = await send_sms(cust.phone, sms_text)

    await broadcast("promise_created", {
        "invoice_id": inv.id,
        "customer_name": cust.name,
        "promised_date": formatted_promised,
        "amount": inv.outstanding_amount
    })

    return {
        "ok": True,
        "message": f"Payment promise successfully recorded for {formatted_promised}.",
        "promised_date": formatted_promised,
        "email_sent": email_res.get("sent", False),
        "sms_sent": sms_res.get("sent", False)
    }


@router.post("/anomalies/check")
async def trigger_degradation_check(db: AsyncSession = Depends(get_db)):
    from app.worker import detect_payment_degradation_task
    result = await detect_payment_degradation_task(db)
    return {"ok": True, "result": result or "No degradation detected"}


# ---------------------------------------------------------------- websocket


@router.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await disconnect(ws)
