from datetime import datetime
from sqlalchemy import (
    BigInteger, String, Integer, Float, Text, DateTime, ForeignKey, JSON, Boolean, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base


class Merchant(Base):
    __tablename__ = "merchants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    razorpay_merchant_id: Mapped[str] = mapped_column(String(64), default="")
    # merchant-configurable policy limits (Settings page)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    retry_interval_hours: Mapped[int] = mapped_column(Integer, default=2)
    insufficient_funds_interval_hours: Mapped[int] = mapped_column(Integer, default=48)
    approval_threshold_paise: Mapped[int] = mapped_column(BigInteger, default=1_000_000)  # ₹10,000
    quiet_hours_start: Mapped[int] = mapped_column(Integer, default=21)  # 9 PM
    quiet_hours_end: Mapped[int] = mapped_column(Integer, default=9)     # 9 AM
    daily_message_cap: Mapped[int] = mapped_column(Integer, default=1)
    contact_cap_30d: Mapped[int] = mapped_column(Integer, default=5)
    min_ai_confidence: Mapped[int] = mapped_column(Integer, default=70)


class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(20), default="")
    address_line: Mapped[str] = mapped_column(String(300), default="")
    city: Mapped[str] = mapped_column(String(100), default="")
    pincode: Mapped[str] = mapped_column(String(20), default="")
    landmark: Mapped[str] = mapped_column(String(200), default="")
    language: Mapped[str] = mapped_column(String(10), default="te")  # te/hi/en
    opted_out: Mapped[bool] = mapped_column(Boolean, default=False)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    subscription_code: Mapped[str] = mapped_column(String(64), default="")
    daily_total: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_total: Mapped[float] = mapped_column(Float, default=0.0)
    items_count: Mapped[int] = mapped_column(Integer, default=0)
    items_detail: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="PAID")  # PAID | NOT_PAID_YET | CANCELLED | DELETED
    delivery_address: Mapped[dict] = mapped_column(JSON, default=dict)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class OneTimeOrder(Base):
    __tablename__ = "one_time_orders"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    order_code: Mapped[str] = mapped_column(String(64), default="")
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    items_count: Mapped[int] = mapped_column(Integer, default=0)
    items_detail: Mapped[list] = mapped_column(JSON, default=list)
    payment_type: Mapped[str] = mapped_column(String(32), default="COD")  # RAZORPAY | COD
    payment_status: Mapped[str] = mapped_column(String(32), default="UNPAID")  # PAID | UNPAID
    delivery_status: Mapped[str] = mapped_column(String(32), default="NOT_DELIVERED_YET")  # NOT_DELIVERED_YET | DELIVERED
    delivery_address: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)



class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    razorpay_payment_id: Mapped[str] = mapped_column(String(64), default="")
    razorpay_order_id: Mapped[str] = mapped_column(String(64), default="")
    subscription_id: Mapped[str] = mapped_column(String(64), default="")
    amount_paise: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    method: Mapped[str] = mapped_column(String(32), default="")
    status: Mapped[str] = mapped_column(String(32), default="created")  # created|failed|recovered|stopped
    description: Mapped[str] = mapped_column(String(200), default="")
    successful_payment_count: Mapped[int] = mapped_column(Integer, default=0)  # customer history
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FailureEvent(Base):
    __tablename__ = "failure_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"))
    razorpay_event_id: Mapped[str] = mapped_column(String(64), default="")
    event_type: Mapped[str] = mapped_column(String(64))  # payment.failed etc.
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    error_code: Mapped[str] = mapped_column(String(64), default="")
    error_description: Mapped[str] = mapped_column(String(300), default="")
    amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(String(32), default="detected")
    # detected | diagnosed | gated | awaiting_approval | acting | recovered | stopped | escalated
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    failure_event_id: Mapped[int] = mapped_column(ForeignKey("failure_events.id"))
    cause: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(64))
    confidence: Mapped[int] = mapped_column(Integer)  # 0-100
    reasoning: Mapped[str] = mapped_column(Text, default="")
    engine: Mapped[str] = mapped_column(String(32), default="rule")  # rule|claude|gemini|fallback
    model_used: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Decision(Base):
    __tablename__ = "decisions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    failure_event_id: Mapped[int] = mapped_column(ForeignKey("failure_events.id"))
    diagnosis_id: Mapped[int] = mapped_column(ForeignKey("diagnoses.id"))
    action: Mapped[str] = mapped_column(String(32))  # A..G fixed set
    action_name: Mapped[str] = mapped_column(String(64))
    reasoning: Mapped[str] = mapped_column(Text, default="")
    alternatives_considered: Mapped[list] = mapped_column(JSON, default=list)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PolicyCheck(Base):
    __tablename__ = "policy_checks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    decision_id: Mapped[int] = mapped_column(ForeignKey("decisions.id"))
    rule: Mapped[str] = mapped_column(String(64))
    verdict: Mapped[str] = mapped_column(String(32))  # ALLOW | APPROVAL_REQUIRED | BLOCK
    reason: Mapped[str] = mapped_column(String(300), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Action(Base):
    __tablename__ = "actions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    failure_event_id: Mapped[int] = mapped_column(ForeignKey("failure_events.id"))
    decision_id: Mapped[int] = mapped_column(ForeignKey("decisions.id"))
    action: Mapped[str] = mapped_column(String(32))
    channel: Mapped[str] = mapped_column(String(32), default="")  # razorpay|whatsapp|email|voice
    razorpay_api_call_id: Mapped[str] = mapped_column(String(128), default="")
    resource_id: Mapped[str] = mapped_column(String(128), default="")  # link id, retry job id...
    simulated: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending|executed|failed|blocked
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Outcome(Base):
    __tablename__ = "outcomes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    failure_event_id: Mapped[int] = mapped_column(ForeignKey("failure_events.id"))
    recovered_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    recovered: Mapped[bool] = mapped_column(Boolean, default=False)
    time_to_recovery_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recovered_via: Mapped[str] = mapped_column(String(64), default="")  # retry|payment_link|...
    razorpay_payment_id: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    failure_event_id: Mapped[int | None] = mapped_column(ForeignKey("failure_events.id"), nullable=True)
    actor: Mapped[str] = mapped_column(String(32))  # monitor|root_cause|strategist|policy_guard|executor|outcome|human|system
    event: Mapped[str] = mapped_column(String(64))
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class VoiceCall(Base):
    __tablename__ = "voice_calls"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    failure_event_id: Mapped[int] = mapped_column(ForeignKey("failure_events.id"))
    script: Mapped[str] = mapped_column(Text, default="")
    language: Mapped[str] = mapped_column(String(10), default="te")
    audio_base64: Mapped[str] = mapped_column(Text, default="")  # real TTS audio
    simulated: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="generated")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CopilotMessage(Base):
    __tablename__ = "copilot_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(Integer, default=1)
    role: Mapped[str] = mapped_column(String(16))  # user|assistant
    content: Mapped[str] = mapped_column(Text)
    engine: Mapped[str] = mapped_column(String(32), default="claude")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class B2BInvoice(Base):
    __tablename__ = "b2b_invoices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    invoice_number: Mapped[str] = mapped_column(String(64))
    invoice_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_date: Mapped[datetime] = mapped_column(DateTime)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    outstanding_amount: Mapped[float] = mapped_column(Float, default=0.0)
    reminder_count: Mapped[int] = mapped_column(Integer, default=0)
    escalation_level: Mapped[int] = mapped_column(Integer, default=0)
    last_reminder_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="UNPAID")  # UNPAID | PAID | OVERDUE | CANCELLED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PromiseToPay(Base):
    __tablename__ = "promise_to_pay"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    invoice_id: Mapped[int | None] = mapped_column(ForeignKey("b2b_invoices.id"), nullable=True)
    failure_event_id: Mapped[int | None] = mapped_column(ForeignKey("failure_events.id"), nullable=True)
    promised_amount: Mapped[float] = mapped_column(Float, default=0.0)
    promised_date: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(32), default="PROMISED")  # PENDING | PROMISED | PAID | BROKEN | CANCELLED
    reminder_count: Mapped[int] = mapped_column(Integer, default=0)
    broken_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CheckoutAbandonment(Base):
    __tablename__ = "checkout_abandonments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    session_id: Mapped[str] = mapped_column(String(128))
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    cart_items: Mapped[list] = mapped_column(JSON, default=list)
    cart_value: Mapped[float] = mapped_column(Float, default=0.0)
    abandonment_stage: Mapped[str] = mapped_column(String(64), default="checkout_form")
    abandonment_reason: Mapped[str] = mapped_column(String(128), default="inactivity_or_exit")
    status: Mapped[str] = mapped_column(String(32), default="ABANDONED")  # ABANDONED | RECOVERY_INITIATED | RECOVERED | EXPIRED
    failure_event_id: Mapped[int | None] = mapped_column(ForeignKey("failure_events.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PaymentDegradationAlert(Base):
    __tablename__ = "payment_degradation_alerts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"))
    gateway: Mapped[str] = mapped_column(String(64), default="Razorpay")
    baseline_success_rate: Mapped[float] = mapped_column(Float, default=95.0)
    current_success_rate: Mapped[float] = mapped_column(Float, default=100.0)
    drop_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    affected_payments_count: Mapped[int] = mapped_column(Integer, default=0)
    top_error_code: Mapped[str] = mapped_column(String(64), default="")
    severity: Mapped[str] = mapped_column(String(16), default="LOW")  # LOW | MEDIUM | HIGH | CRITICAL
    ai_diagnosis: Mapped[dict] = mapped_column(JSON, default=dict)
    recommended_action: Mapped[str] = mapped_column(String(64), default="SMART_RETRY")
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")  # ACTIVE | RESOLVED | ACKNOWLEDGED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


Index("ix_failure_status", FailureEvent.status)
Index("ix_audit_event", AuditLog.failure_event_id)
