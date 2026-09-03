"""
Messaging — WhatsApp Business API + Resend email.
Production mode: channels require valid API keys.
WhatsApp is optional (skipped if not configured).
"""

import time
import asyncio
import httpx
from app.core.config import settings
from app.core.logging import logger


def format_e164_phone(phone: str) -> str:
    p = phone.strip() if phone else ""
    if not p:
        return ""
    if not p.startswith("+"):
        if len(p) == 10:
            p = "+91" + p
        else:
            p = "+" + p
    return p


async def send_whatsapp(phone: str, message: str) -> dict:
    to_phone = format_e164_phone(phone)
    if not to_phone:
        return {"sent": False, "channel": "whatsapp", "reason": "invalid_phone"}

    # 1. Primary: Meta WhatsApp Business API if configured
    if settings._is_real(settings.whatsapp_token) and settings._is_real(settings.whatsapp_phone_id):
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    f"https://graph.facebook.com/v19.0/{settings.whatsapp_phone_id}/messages",
                    headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
                    json={
                        "messaging_product": "whatsapp", "to": to_phone,
                        "type": "text", "text": {"body": message},
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                return {"sent": True, "channel": "whatsapp", "provider": "meta",
                        "api_call_id": data.get("messages", [{}])[0].get("id", "")}
        except Exception as e:
            logger.error("meta_whatsapp_error", error=str(e))
            # Fallthrough to Twilio WhatsApp if Twilio is ready

    # 2. Twilio Programmable Messaging API (WhatsApp)
    if settings.twilio_ready:
        try:
            to_whatsapp = f"whatsapp:{to_phone}"

            if settings.twilio_whatsapp_from:
                from_num = settings.twilio_whatsapp_from if settings.twilio_whatsapp_from.startswith("whatsapp:") else f"whatsapp:{settings.twilio_whatsapp_from}"
            elif settings.twilio_from_phone:
                from_num = settings.twilio_from_phone if settings.twilio_from_phone.startswith("whatsapp:") else f"whatsapp:{settings.twilio_from_phone}"
            else:
                from_num = "whatsapp:+14155238886"  # Twilio WhatsApp Sandbox default

            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json",
                    auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                    data={
                        "To": to_whatsapp,
                        "From": from_num,
                        "Body": message,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                logger.info("twilio_whatsapp_sent_success", to=to_whatsapp, sid=data.get("sid"))
                return {"sent": True, "channel": "whatsapp", "provider": "twilio", "api_call_id": data.get("sid", "")}
        except Exception as e:
            logger.error("twilio_whatsapp_error", error=str(e))
            return {"sent": False, "channel": "whatsapp", "provider": "twilio", "reason": str(e)}

    logger.info("whatsapp_skipped", reason="Neither Meta nor Twilio WhatsApp is configured")
    return {"sent": False, "channel": "whatsapp", "reason": "not_configured"}


async def send_sms(phone: str, message: str) -> dict:
    if not settings.twilio_ready:
        logger.info("sms_skipped", reason="Twilio not configured")
        return {"sent": False, "channel": "sms", "reason": "not_configured"}
    try:
        to_phone = format_e164_phone(phone)
        if not to_phone:
            return {"sent": False, "channel": "sms", "reason": "invalid_phone"}

        from_phone = settings.twilio_from_phone.replace("whatsapp:", "").strip()

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json",
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data={
                    "To": to_phone,
                    "From": from_phone,
                    "Body": message,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info("sms_sent_success", to=to_phone, sid=data.get("sid"))
            return {"sent": True, "channel": "sms", "provider": "twilio", "api_call_id": data.get("sid", "")}
    except Exception as e:
        logger.error("sms_error", error=str(e))
        return {"sent": False, "channel": "sms", "provider": "twilio", "reason": str(e)}


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
            if resp.status_code in (200, 201):
                data = resp.json()
                logger.info("email_sent_success", to=to, resend_id=data.get("id"))
                return {"sent": True, "channel": "email", "api_call_id": data.get("id", "")}
            else:
                logger.error("email_send_failed", status=resp.status_code, response=resp.text)
                return {"sent": False, "channel": "email", "reason": resp.text}
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
