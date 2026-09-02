"""
Voice service — REAL ElevenLabs TTS (free tier 10k chars/mo).
Generates real playable audio (mp3, base64).
"""

import base64
from urllib.parse import quote_plus

import httpx
from app.core.config import settings
from app.core.logging import logger


async def generate_voice(script: str, language: str) -> dict:
    """
    Returns {"audio_base64": str, "engine": str}
    Raises if ElevenLabs is not configured.
    """
    if not settings.elevenlabs_ready:
        logger.info("voice_skipped", reason="ElevenLabs not configured")
        return {"audio_base64": "", "engine": "not_configured"}

    voice_id = settings.elevenlabs_voice_id
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={"xi-api-key": settings.elevenlabs_api_key,
                         "accept": "audio/mpeg",
                         "content-type": "application/json"},
                json={
                    "text": script,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.6, "similarity_boost": 0.8},
                },
            )
            resp.raise_for_status()
            return {
                "audio_base64": base64.b64encode(resp.content).decode(),
                "engine": "elevenlabs_multilingual_v2",
            }
    except Exception as e:
        logger.error("voice_error", error=str(e))
        return {"audio_base64": "", "engine": "error"}


async def make_twilio_call(to_phone: str, script: str, language: str = "te") -> dict:
    """
    Triggers a real automated phone call to customer via Twilio Programmable Voice.
    """
    if not settings.twilio_ready:
        logger.info("twilio_skipped", reason="Twilio not configured")
        return {"called": False, "channel": "twilio", "reason": "not_configured"}
    try:
        clean_script = script.replace("&", "and").replace("<", "").replace(">", "")

        data = {"To": to_phone, "From": settings.twilio_from_phone}
        public_base = (settings.frontend_url or "").strip()
        if public_base.startswith("http") and "localhost" not in public_base and "127.0.0.1" not in public_base:
            # Trial accounts reject the inline Twiml parameter ("limited parameter
            # access"), so point Twilio at the public TwiML URL instead — Twilio
            # GETs it and speaks the script.
            data["Url"] = (
                f"{public_base.rstrip('/')}/twiml/voice"
                f"?script={quote_plus(clean_script)}&voice=Polly.Aditi"
            )
        else:
            # No public URL (upgraded accounts can use inline Twiml directly)
            data["Twiml"] = f"<Response><Say voice='Polly.Aditi'>{clean_script}</Say></Response>"

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json",
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data=data,
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info("twilio_call_success", call_sid=data.get("sid"))
            return {
                "called": True,
                "channel": "twilio",
                "call_sid": data.get("sid", ""),
                "status": data.get("status", ""),
            }
    except Exception as e:
        logger.error("twilio_call_error", error=str(e))
        raw = str(e)
        # Map common Twilio failures to actionable hints for the UI
        hint = ""
        low = raw.lower()
        if "trial" in low or "verified" in low or "21608" in low:
            hint = ("Trial accounts can only call VERIFIED numbers. Add "
                    "+91-number as a Verified Caller ID in Twilio Console "
                    "(Phone Numbers → Manage → Verified Caller IDs) or upgrade the account.")
        elif "21606" in low or "twiml" in low:
            hint = "Twiml parameter rejected — check the voice script payload."
        elif "auth" in low or "20003" in low:
            hint = "Twilio authentication failed — check TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN."
        return {"called": False, "channel": "twilio", "reason": raw, "hint": hint}

