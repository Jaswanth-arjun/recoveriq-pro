"""
Voice service — Gnani AI is the primary TTS engine, ElevenLabs is an
optional fallback, and Twilio Programmable Voice places the real calls.

Provider selection (set in .env):
    VOICE_PROVIDER=gnani       # default — Gnani Timbre (recommended)
    VOICE_PROVIDER=elevenlabs  # legacy fallback
    VOICE_PROVIDER=none        # disable TTS (simulated mode)

Gnani API docs: https://docs.gnani.ai
"""

from urllib.parse import quote_plus

import httpx

from app.core.config import settings
from app.core.logging import logger
from app.services import gnani


def _voice_provider() -> str:
    return (settings.voice_provider or "gnani").strip().lower()


_ONES = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
    "sixteen", "seventeen", "eighteen", "nineteen",
]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty",
         "seventy", "eighty", "ninety"]


def _under_100(n: int) -> str:
    if n < 20:
        return _ONES[n]
    return _TENS[n // 10] + (("-" + _ONES[n % 10]) if n % 10 else "")


def _under_1000(n: int) -> str:
    if n < 100:
        return _under_100(n)
    rest = n % 100
    return _ONES[n // 100] + " hundred" + ((" " + _under_100(rest)) if rest else "")


def rupees_in_words(amount: float) -> str:
    """
    Convert an amount to Indian spoken words, e.g. 150000 -> "one lakh
    fifty thousand rupees". Gnani's input-formatting guide recommends spoken
    words over raw digits / currency symbols for correct pronunciation.
    """
    try:
        n = int(round(float(amount)))
    except (TypeError, ValueError):
        return "zero rupees"
    if n <= 0:
        return "zero rupees"

    crore, n = divmod(n, 10_000_000)
    lakh, n = divmod(n, 100_000)
    thousand, n = divmod(n, 1_000)
    hundred, n = divmod(n, 100)

    parts: list[str] = []
    if crore:
        parts.append(_under_1000(crore) + " crore")
    if lakh:
        parts.append(_under_100(lakh) + " lakh")
    if thousand:
        parts.append(_under_100(thousand) + " thousand")
    if hundred:
        parts.append(_ONES[hundred] + " hundred")
    if n:
        parts.append(_under_100(n))
    return " ".join(parts) + " rupees"


async def generate_voice(script: str, language: str) -> dict:
    """
    Generate playable TTS audio.

    Returns:
        {"audio_base64": str, "engine": str, "content_type": str,
         "voice": str, "language": str, "error"?: str}
    """
    provider = _voice_provider()
    attempted = False

    # 1) Primary — Gnani Timbre (Telugu / Hinglish / Hindi / English)
    if provider in ("gnani", "auto", "default") and settings.gnani_ready:
        attempted = True
        result = await gnani.synthesize(script, language)
        if result.get("audio_base64"):
            return result
        logger.info("gnani_tts_failed_trying_fallback", error=result.get("error"))

    # 2) Optional legacy fallback — ElevenLabs
    if provider != "none" and settings.elevenlabs_ready:
        attempted = True
        result = await _elevenlabs_tts(script, language)
        if result.get("audio_base64"):
            return result

    # 3) Nothing configured — the UI labels this as NOT_CONFIGURED / simulated
    if not attempted:
        logger.info("voice_skipped", reason="no TTS provider configured")
    return {
        "audio_base64": "",
        "engine": "error" if attempted else "not_configured",
        "content_type": "",
        "voice": "",
        "language": gnani.language_code(language),
        "error": "TTS provider failed" if attempted else "No voice provider configured (set GNANI_API_KEY)",
    }


async def synthesize_audio_bytes(script: str, language: str = "auto") -> tuple[bytes | None, dict]:
    """
    Return raw audio bytes for Twilio <Play>.

    Tries Gnani first, then ElevenLabs. Used by GET /api/twiml/audio.
    """
    provider = _voice_provider()
    attempted = False

    if provider in ("gnani", "auto", "default") and settings.gnani_ready:
        attempted = True
        audio, meta = await gnani.synthesize_bytes(script, language)
        if audio:
            return audio, meta
        logger.info("gnani_bytes_failed_trying_fallback", error=meta.get("error"))

    if provider != "none" and settings.elevenlabs_ready:
        attempted = True
        res = await _elevenlabs_tts(script, language)
        if res.get("audio_base64"):
            import base64

            return base64.b64decode(res["audio_base64"]), res

    return None, {
        "engine": "error" if attempted else "not_configured",
        "content_type": "",
        "error": "TTS provider failed" if attempted else "No voice provider configured (set GNANI_API_KEY)",
    }


async def make_twilio_call(to_phone: str, script: str, language: str = "te") -> dict:
    """
    Trigger a real automated phone call via Twilio Programmable Voice.

    Twilio fetches our public TwiML endpoint, which returns a Gnani-generated
    <Play> URL (or a Twilio <Say> fallback if Gnani is unavailable).
    """
    if not settings.twilio_ready:
        logger.info("twilio_skipped", reason="Twilio not configured")
        return {"called": False, "channel": "twilio", "reason": "not_configured"}
    try:
        clean_to_phone = to_phone.strip()
        if clean_to_phone and not clean_to_phone.startswith("+"):
            if len(clean_to_phone) == 10:
                clean_to_phone = "+91" + clean_to_phone
            else:
                clean_to_phone = "+" + clean_to_phone

        clean_script = script.replace("&", "and").replace("<", "").replace(">", "")

        data = {"To": clean_to_phone, "From": settings.twilio_from_phone}
        # Self-hosted TwiML: Twilio fetches our public endpoint (ngrok -> backend).
        # twimlets.com is deprecated and Twilio's production fetchers reject it.
        # NOTE: trial accounts cannot use the inline "Twiml" parameter (400 limited access).
        data["Url"] = (
            f"{settings.frontend_url.rstrip('/')}/api/twiml/voice"
            f"?script={quote_plus(clean_script[:1200])}"
            f"&lang={quote_plus(gnani.language_code(language))}"
        )

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json",
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data=data,
            )
            resp.raise_for_status()
            payload = resp.json()
            logger.info(
                "twilio_call_success",
                call_sid=payload.get("sid"),
                voice_provider="gnani" if settings.gnani_ready else ("elevenlabs" if settings.elevenlabs_ready else "twilio_say"),
            )
            return {
                "called": True,
                "channel": "twilio",
                "call_sid": payload.get("sid", ""),
                "status": payload.get("status", ""),
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


async def _elevenlabs_tts(script: str, language: str) -> dict:
    """Legacy ElevenLabs fallback (kept so existing deployments keep working)."""
    import base64

    voice_id = settings.elevenlabs_voice_id
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
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
                "content_type": "audio/mpeg",
                "voice": voice_id,
                "language": gnani.language_code(language),
            }
    except Exception as e:
        logger.error("voice_error", error=str(e))
        return {"audio_base64": "", "engine": "error", "content_type": "",
                "voice": "", "language": gnani.language_code(language), "error": str(e)}
