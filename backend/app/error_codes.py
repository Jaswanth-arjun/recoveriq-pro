"""
Root-cause rule engine: maps 50+ real Razorpay error codes to
{cause, category, retry_safe, recommended_action, retry_delay_hours}.

Deterministic. The LLM only adds a second opinion on top of this.
"""

from dataclasses import dataclass


@dataclass
class RuleResult:
    cause: str
    category: str          # insufficient_funds | card_expired | network | auth | bank | mandate | abandonment | dispute | permanent | risk
    retry_safe: bool
    recommended_action: str  # default action from fixed set
    retry_delay_hours: int   # 0 = act now
    risk_level: str          # low | medium | high


# Real Razorpay error codes (payments + subscriptions/UPI AutoPay)
RULES: dict[str, RuleResult] = {
    # ---- Insufficient funds (retry later is safe) ----
    "BAD_REQUEST_ERROR_PAYMENT_DECLINED_INSUFFICIENT_FUNDS": RuleResult("Customer account has insufficient balance", "insufficient_funds", True, "SMART_RETRY", 48, "low"),
    "GATEWAY_ERROR_INSUFFICIENT_FUNDS": RuleResult("Bank reported insufficient funds", "insufficient_funds", True, "SMART_RETRY", 48, "low"),
    "PAYMENT_DECLINED_INSUFFICIENT_FUNDS": RuleResult("Insufficient funds at issuer bank", "insufficient_funds", True, "SMART_RETRY", 48, "low"),
    "INSUFFICIENT_FUNDS": RuleResult("Insufficient funds", "insufficient_funds", True, "SMART_RETRY", 48, "low"),
    "UPI_INSUFFICIENT_FUNDS": RuleResult("UPI account has insufficient balance", "insufficient_funds", True, "SMART_RETRY", 48, "low"),
    # ---- Card expired / invalid ----
    "BAD_REQUEST_ERROR_CARD_EXPIRED": RuleResult("Card has expired", "card_expired", False, "CHECKOUT_RECOVERY", 0, "low"),
    "CARD_EXPIRED": RuleResult("Card expired", "card_expired", False, "CHECKOUT_RECOVERY", 0, "low"),
    "BAD_REQUEST_ERROR_CARD_INVALID": RuleResult("Invalid card details", "auth", False, "CHECKOUT_RECOVERY", 0, "low"),
    "CARD_INVALID": RuleResult("Card invalid", "auth", False, "CHECKOUT_RECOVERY", 0, "low"),
    "GATEWAY_ERROR_CARD_TOKEN_INVALID": RuleResult("Card token invalid — needs re-authorization", "card_expired", False, "SUBSCRIPTION_RECOVERY", 0, "medium"),
    # ---- Authentication / OTP ----
    "BAD_REQUEST_ERROR_AUTHENTICATION_FAILED": RuleResult("3DS authentication failed", "auth", True, "CHECKOUT_RECOVERY", 2, "medium"),
    "AUTHENTICATION_FAILED": RuleResult("Authentication failed", "auth", True, "CHECKOUT_RECOVERY", 2, "medium"),
    "BAD_REQUEST_ERROR_OTP_INCORRECT": RuleResult("Wrong OTP entered", "auth", True, "SMART_RETRY", 2, "low"),
    "OTP_INCORRECT": RuleResult("Incorrect OTP", "auth", True, "SMART_RETRY", 2, "low"),
    "BAD_REQUEST_ERROR_OTP_EXPIRED": RuleResult("OTP expired before entry", "auth", True, "SMART_RETRY", 2, "low"),
    "OTP_EXPIRED": RuleResult("OTP expired", "auth", True, "SMART_RETRY", 2, "low"),
    "CUSTOMER_CANCELLED_OTP_FLOW": RuleResult("Customer abandoned OTP entry (checkout friction)", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
    "CUSTOMER_AUTHENTICATION_PENDING": RuleResult("Customer did not complete authentication", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
    "PAYMENT_AUTHENTICATION_CANCELLED": RuleResult("Authentication cancelled by customer", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
    # ---- Network / gateway (transient) ----
    "GATEWAY_ERROR": RuleResult("Payment gateway error (transient)", "network", True, "SMART_RETRY", 2, "low"),
    "GATEWAY_ERROR_NETWORK_ERROR": RuleResult("Network error between gateway and bank", "network", True, "SMART_RETRY", 2, "low"),
    "NETWORK_ERROR": RuleResult("Network failure", "network", True, "SMART_RETRY", 2, "low"),
    "GATEWAY_ERROR_TIMED_OUT": RuleResult("Gateway timeout", "network", True, "SMART_RETRY", 2, "low"),
    "SERVER_ERROR": RuleResult("Server-side error (transient)", "network", True, "SMART_RETRY", 2, "low"),
    "GATEWAY_ERROR_UNKNOWN_ERROR": RuleResult("Unknown gateway error", "network", True, "SMART_RETRY", 2, "medium"),
    "GATEWAY_ERROR_ACQUIRING_ERROR": RuleResult("Acquiring bank error", "network", True, "SMART_RETRY", 2, "medium"),
    "GATEWAY_ERROR_ISSUER_UNAVAILABLE": RuleResult("Issuing bank temporarily unavailable", "bank", True, "SMART_RETRY", 2, "low"),
    "GATEWAY_ERROR_ISSUER_TIMEOUT": RuleResult("Issuing bank timeout", "bank", True, "SMART_RETRY", 2, "low"),
    "BANK_ERROR": RuleResult("Bank-side error", "bank", True, "SMART_RETRY", 2, "low"),
    "BANK_DOWN": RuleResult("Bank systems down", "bank", True, "SMART_RETRY", 6, "low"),
    # ---- Subscription mandate / UPI AutoPay ----
    "SUBSCRIPTION_MANDATE_EXPIRED": RuleResult("Mandate has expired — needs renewal", "mandate", False, "SUBSCRIPTION_RECOVERY", 0, "medium"),
    "MANDATE_EXPIRED": RuleResult("Mandate expired", "mandate", False, "SUBSCRIPTION_RECOVERY", 0, "medium"),
    "SUBSCRIPTION_MANDATE_CANCELLED": RuleResult("Mandate cancelled by customer", "mandate", False, "STOP", 0, "high"),
    "MANDATE_REVOKED": RuleResult("Mandate revoked", "mandate", False, "STOP", 0, "high"),
    "SUBSCRIPTION_MANDATE_INVALID": RuleResult("Mandate invalid", "mandate", False, "SUBSCRIPTION_RECOVERY", 0, "medium"),
    "MANDATE_INVALID": RuleResult("Mandate invalid", "mandate", False, "SUBSCRIPTION_RECOVERY", 0, "medium"),
    "BAD_REQUEST_ERROR_UPI_MANDATE_VALIDATION_FAILED": RuleResult("UPI AutoPay mandate validation failed", "mandate", False, "SUBSCRIPTION_RECOVERY", 0, "medium"),
    "UPI_AUTOPAY_MANDATE_FAILED": RuleResult("UPI AutoPay debit failed", "mandate", True, "SUBSCRIPTION_RECOVERY", 24, "medium"),
    "BAD_REQUEST_ERROR_UPI_COLLECT_DECLINED": RuleResult("UPI collect request declined by customer", "mandate", True, "CHECKOUT_RECOVERY", 24, "medium"),
    "UPI_COLLECT_TIMED_OUT": RuleResult("UPI collect request timed out", "mandate", True, "CHECKOUT_RECOVERY", 24, "medium"),
    "BAD_REQUEST_ERROR_UPI_PIN_INCORRECT": RuleResult("Incorrect UPI PIN", "auth", True, "SMART_RETRY", 2, "low"),
    "UPI_PIN_INCORRECT": RuleResult("Wrong UPI PIN", "auth", True, "SMART_RETRY", 2, "low"),
    "BAD_REQUEST_ERROR_UPI_DECLINED_BY_CUSTOMER": RuleResult("Customer declined UPI request", "abandonment", True, "CHECKOUT_RECOVERY", 24, "medium"),
    # ---- Risk / disputes / hard stops ----
    "BAD_REQUEST_ERROR_TRANSACTION_DECLINED_BY_RISK": RuleResult("Transaction flagged by risk engine", "risk", False, "ESCALATE", 0, "high"),
    "TRANSACTION_DECLINED_BY_RISK": RuleResult("Risk engine declined transaction", "risk", False, "ESCALATE", 0, "high"),
    "FRAUD_SUSPECTED": RuleResult("Possible fraud", "risk", False, "ESCALATE", 0, "high"),
    "DISPUTE_CREATED": RuleResult("Customer raised a dispute/chargeback", "dispute", False, "ESCALATE", 0, "high"),
    "CHARGEBACK": RuleResult("Chargeback filed", "dispute", False, "ESCALATE", 0, "high"),
    "BAD_REQUEST_ERROR_BLOCKED_BY_ADMIN": RuleResult("Blocked by administrator", "permanent", False, "STOP", 0, "high"),
    "BLOCKED_BY_ADMIN": RuleResult("Blocked by admin", "permanent", False, "STOP", 0, "high"),
    "PAYMENT_DECLINED_INVALID_ACCOUNT": RuleResult("Invalid/closed account", "permanent", False, "STOP", 0, "high"),
    "INVALID_ACCOUNT": RuleResult("Invalid account", "permanent", False, "STOP", 0, "high"),
    "BAD_REQUEST_ERROR_PAYMENT_DECLINED_DO_NOT_HONOR": RuleResult("Issuer declined — do not honor", "bank", False, "ESCALATE", 0, "high"),
    "DO_NOT_HONOR": RuleResult("Issuer declined (do not honor)", "bank", False, "ESCALATE", 0, "high"),
    "BAD_REQUEST_ERROR_PAYMENT_DECLINED_BY_ISSUER": RuleResult("Declined by issuing bank", "bank", True, "SMART_RETRY", 24, "medium"),
    "PAYMENT_DECLINED_BY_ISSUER": RuleResult("Declined by issuer", "bank", True, "SMART_RETRY", 24, "medium"),
    # ---- Checkout abandonment ----
    "CHECKOUT_ABANDONED": RuleResult("Customer left checkout before paying", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
    "CUSTOMER_DROPPED_OFF": RuleResult("Customer dropped off during checkout", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
    "PAYMENT_LINK_EXPIRED": RuleResult("Payment link expired unpaid", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
    # ---- Invoice (B2B) ----
    "INVOICE_OVERDUE": RuleResult("B2B invoice overdue", "invoice", True, "INVOICE_REMINDER", 0, "medium"),
}

# fuzzy keyword fallback for unseen codes
_KEYWORDS = [
    ("INSUFFICIENT", "insufficient_funds", True, "SMART_RETRY", 48, "low"),
    ("EXPIRED_CARD", "card_expired", False, "CHECKOUT_RECOVERY", 0, "low"),
    ("CARD_EXPIR", "card_expired", False, "CHECKOUT_RECOVERY", 0, "low"),
    ("OTP", "auth", True, "SMART_RETRY", 2, "low"),
    ("AUTH", "auth", True, "CHECKOUT_RECOVERY", 2, "medium"),
    ("TIMEOUT", "network", True, "SMART_RETRY", 2, "low"),
    ("TIMED_OUT", "network", True, "SMART_RETRY", 2, "low"),
    ("NETWORK", "network", True, "SMART_RETRY", 2, "low"),
    ("MANDATE", "mandate", False, "SUBSCRIPTION_RECOVERY", 0, "medium"),
    ("UPI", "mandate", True, "CHECKOUT_RECOVERY", 24, "medium"),
    ("FRAUD", "risk", False, "ESCALATE", 0, "high"),
    ("RISK", "risk", False, "ESCALATE", 0, "high"),
    ("DISPUTE", "dispute", False, "ESCALATE", 0, "high"),
    ("BLOCKED", "permanent", False, "STOP", 0, "high"),
    ("CANCEL", "abandonment", True, "CHECKOUT_RECOVERY", 24, "medium"),
    ("DECLINE", "bank", True, "SMART_RETRY", 24, "medium"),
    ("GATEWAY", "network", True, "SMART_RETRY", 2, "medium"),
    ("BANK", "bank", True, "SMART_RETRY", 6, "medium"),
    ("ABANDON", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
    ("EXPIRED", "abandonment", True, "CHECKOUT_RECOVERY", 0, "low"),
]

DEFAULT = RuleResult("Unclassified payment failure", "unknown", True, "ESCALATE", 0, "high")


def classify(error_code: str) -> RuleResult:
    code = (error_code or "").upper()
    if code in RULES:
        return RULES[code]
    for kw, cat, safe, act, delay, risk in _KEYWORDS:
        if kw in code:
            return RuleResult(f"Keyword match on '{kw}'", cat, safe, act, delay, risk)
    return DEFAULT


ACTION_NAMES = {
    "SMART_RETRY": "A · Smart Retry",
    "CHECKOUT_RECOVERY": "B · Checkout Recovery (UPI link)",
    "SUBSCRIPTION_RECOVERY": "C · Subscription Recovery",
    "INVOICE_REMINDER": "D · Invoice Reminder",
    "VOICE_RECOVERY": "E · Voice Recovery",
    "ESCALATE": "F · Escalate to Human",
    "STOP": "G · Hard Stop",
}
