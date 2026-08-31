"""
Messaging — WhatsApp Business API + Resend email.
Production mode: channels require valid API keys.
WhatsApp is optional (skipped if not configured).
"""

import time
import httpx
from app.core.config import settings
from app.core.logging import logger


async def send_whatsapp(phone: str, message: str) -> dict:
    if not settings.whatsapp_ready:
        logger.info("whatsapp_skipped", reason="WhatsApp not configured")
        return {"sent": False, "channel": "whatsapp", "reason": "not_configured"}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"https://graph.facebook.com/v19.0/{settings.whatsapp_phone_id}/messages",
                headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
                json={
                    "messaging_product": "whatsapp", "to": phone,
                    "type": "text", "text": {"body": message},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return {"sent": True, "channel": "whatsapp",
                    "api_call_id": data.get("messages", [{}])[0].get("id", "")}
    except Exception as e:
        logger.error("whatsapp_error", error=str(e))
        return {"sent": False, "channel": "whatsapp", "reason": str(e)}


async def send_email(to: str, subject: str, body: str) -> dict:
    if not settings.resend_ready:
        logger.info("email_skipped", reason="Resend not configured")
        return {"sent": False, "channel": "email", "reason": "not_configured"}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={"from": "onboarding@resend.dev",
                      "to": [to], "subject": subject, "text": body},
            )
            resp.raise_for_status()
            return {"sent": True, "channel": "email",
                    "api_call_id": resp.json().get("id", "")}
    except Exception as e:
        logger.error("email_error", error=str(e))
        return {"sent": False, "channel": "email", "reason": str(e)}


async def send_recovery_email(customer_name: str, customer_email: str,
                               amount_inr: float, short_url: str,
                               error_category: str) -> dict:
    """Send a branded recovery email to the customer via Resend."""
    subject = f"Complete your payment of ₹{amount_inr:,.0f} — RecoverIQ"
    body = f"""Hi {customer_name},

Your recent payment of ₹{amount_inr:,.0f} could not be processed ({error_category}).

Please complete your payment using this secure link:
{short_url}

This link is powered by Razorpay and is completely secure.

If you've already completed this payment, please ignore this email.

Best regards,
RecoverIQ Pro — AI Revenue Recovery
"""
    return await send_email(customer_email, subject, body)
