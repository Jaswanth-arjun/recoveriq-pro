"""
Gnani AI speech service — the primary voice model for RecoverIQ Pro.

Docs: https://docs.gnani.ai
  * TTS  : POST {base}/api/v1/tts/inference   (Gnani Timbre v2.5 / v3.0)
  * STT  : POST {base}/stt/v3                 (Gnani Prisma v2.5 / v3.0)
  * Auth : X-API-Key-ID: <GNANI_API_KEY>

The project stores language codes as "te", "hi", "en" or "hi-en"; Gnani
expects locale codes such as "te-IN", "hi-IN", "en-IN" and "hi-en", so this
module owns the mapping and the default voice selection.
"""

import base64
import hashlib

import httpx

from app.core.config import settings
from app.core.logging import logger

# Project language code -> Gnani language code
LANGUAGE_MAP = {
    "te": "te-IN",
    "te-in": "te-IN",
    "hi": "hi-IN",
    "hi-in": "hi-IN",
    "en": "en-IN",
    "en-in": "en-IN",
    "hi-en": "hi-en",
    "hinglish": "hi-en",
    "ta": "ta-IN",
    "ta-in": "ta-IN",
    "kn": "kn-IN",
    "kn-in": "kn-IN",
    "ml": "ml-IN",
    "ml-in": "ml-IN",
    "mr": "mr-IN",
    "mr-in": "mr-IN",
    "bn": "bn-IN",
    "bn-in": "bn-IN",
    "gu": "gu-IN",
    "gu-in": "gu-IN",
    "pa": "pa-IN",
    "pa-in": "pa-IN",
    "auto": "auto",
}

# Timbre v2.5 default voices (each voice has one preferred language).
DEFAULT_VOICES = {
    "te-IN": "Suhana",    # Telugu — calm, soothing, confident
    "hi-IN": "Nalini",    # Hindi — friendly
    "en-IN": "Kaveri",    # English — firm customer-support voice
    "hi-en": "Poorvi",    # Hinglish — natural bilingual voice
    "ta-IN": "Trisha",
    "kn-IN": "Saanvi",
    "ml-IN": "Reshma",
    "mr-IN": "Zahira",
    "bn-IN": "Kirra",
    "gu-IN": "Falak",
    "pa-IN": "Mehuli",
    "auto": "Nalini",
}

# Timbre v3.0 voices speak every supported language. Used when
# GNANI_TTS_MODEL=timbre-v3.0.
V3_VOICES = {
    "te-IN": "Chetana",   # warm, empathetic
    "hi-IN": "Kalpana",
    "en-IN": "Tarika",
    "hi-en": "Chetana",
    "ta-IN": "Chetana",
    "kn-IN": "Chetana",
    "ml-IN": "Chetana",
    "mr-IN": "Chetana",
    "bn-IN": "Chetana",
    "gu-IN": "Chetana",
    "pa-IN": "Chetana",
    "auto": "Chetana",
}

# Small in-process cache so Twilio does not re-synthesise the same script on
# retries. Keyed by (text, language, model, voice).
_AUDIO_CACHE: dict[str, dict] = {}
_AUDIO_CACHE_MAX = 32


def language_code(language: str | None) -> str:
    """Map the project's short code to a Gnani locale code."""
    key = (language or "auto").strip().lower()
    return LANGUAGE_MAP.get(key, "auto")


def voice_for(language: str | None) -> str:
    """Pick a sensible default Gnani voice for a language."""
    if settings.gnani_tts_voice:
        return settings.gnani_tts_voice
    lang = language_code(language)
    if (settings.gnani_tts_model or "").startswith("timbre-v3"):
        return V3_VOICES.get(lang, "Chetana")
    return DEFAULT_VOICES.get(lang, "Nalini")


def _cache_key(text: str, language: str, model: str, voice: str) -> str:
    raw = f"{model}|{voice}|{language}|{text}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _remember(key: str, payload: dict) -> None:
    if len(_AUDIO_CACHE) >= _AUDIO_CACHE_MAX:
        _AUDIO_CACHE.pop(next(iter(_AUDIO_CACHE)))
    _AUDIO_CACHE[key] = payload


def _error(message: str, engine: str = "error") -> dict:
    return {
        "audio_base64": "",
        "engine": engine,
        "content_type": "",
        "voice": "",
        "language": "",
        "error": message,
    }


async def synthesize(
    text: str,
    language: str = "auto",
    voice: str | None = None,
    model: str | None = None,
    container: str = "mp3",
) -> dict:
    """
    Synthesise speech with Gnani Timbre.

    Returns:
        {
          "audio_base64": str, "engine": str, "content_type": str,
          "voice": str, "language": str, "error"?: str
        }
    """
    if not settings.gnani_ready:
        logger.info("gnani_tts_skipped", reason="GNANI_API_KEY not configured")
        return _error("GNANI_API_KEY not configured", engine="not_configured")

    lang = language_code(language)
    model = model or settings.gnani_tts_model or "timbre-v2.5"
    voice = voice or voice_for(lang)

    cache_key = _cache_key(text, lang, model, voice)
    if cache_key in _AUDIO_CACHE:
        return _AUDIO_CACHE[cache_key]

    audio_config = {
        "sample_rate": 22050,
        "num_channels": 1,
        "container": container,
    }
    if container == "mp3":
        audio_config["bitrate"] = "128k"
    else:
        audio_config["sample_width"] = 2
        audio_config["encoding"] = "linear_pcm"

    payload = {
        "text": text,
        "voice": voice,
        "model": model,
        "language": lang,
        "speed": settings.gnani_tts_speed,
        "audio_config": audio_config,
    }
    headers = {
        "X-API-Key-ID": settings.gnani_api_key,
        "Content-Type": "application/json",
        "accept": "audio/mpeg",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{settings.gnani_base_url.rstrip('/')}/api/v1/tts/inference",
                headers=headers,
                json=payload,
            )
        if resp.status_code != 200:
            detail = resp.text[:500]
            logger.error("gnani_tts_error", status=resp.status_code, detail=detail)
            return _error(f"Gnani TTS {resp.status_code}: {detail}")

        result = {
            "audio_base64": base64.b64encode(resp.content).decode(),
            "engine": f"gnani_{model.replace('.', '_')}",
            "content_type": resp.headers.get("content-type", "audio/mpeg"),
            "voice": voice,
            "language": lang,
        }
        _remember(cache_key, result)
        logger.info(
            "gnani_tts_success",
            model=model,
            voice=voice,
            language=lang,
            bytes=len(resp.content),
        )
        return result
    except Exception as e:  # network / timeout / invalid response
        logger.error("gnani_tts_exception", error=str(e))
        return _error(str(e))


async def synthesize_bytes(
    text: str,
    language: str = "auto",
    voice: str | None = None,
    model: str | None = None,
    container: str = "mp3",
) -> tuple[bytes | None, dict]:
    """Synthesise and return raw audio bytes (used by Twilio <Play>)."""
    result = await synthesize(text, language, voice, model, container)
    if not result.get("audio_base64"):
        return None, result
    try:
        return base64.b64decode(result["audio_base64"]), result
    except Exception as e:
        logger.error("gnani_tts_decode_error", error=str(e))
        return None, _error(str(e))


async def transcribe(
    audio_bytes: bytes,
    filename: str = "call.wav",
    language_code_value: str = "indic-auto",
    model: str | None = None,
) -> dict:
    """
    Transcribe a call recording with Gnani Prisma.

    Returns Gnani's JSON, e.g.
        {"success": true, "transcript": "...", "detected_language_code": "te-IN"}
    or {"success": false, "error": "..."}.
    """
    if not settings.gnani_ready:
        return {"success": False, "error": "GNANI_API_KEY not configured"}

    stt_model = model or settings.gnani_stt_model or "prisma-v3.0"
    headers = {"X-API-Key-ID": settings.gnani_api_key}

    # Prisma v2.5 needs an explicit language; v3.0 supports indic-auto.
    if stt_model.startswith("prisma-v3"):
        language_code_value = language_code_value or "indic-auto"
    elif not language_code_value or language_code_value == "indic-auto":
        language_code_value = "hi-IN"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.gnani_base_url.rstrip('/')}/stt/v3",
                headers=headers,
                files={"audio_file": (filename, audio_bytes, "application/octet-stream")},
                data={"model": stt_model, "language_code": language_code_value},
            )
        if resp.status_code == 200:
            data = resp.json()
            logger.info(
                "gnani_stt_success",
                model=stt_model,
                detected_language=data.get("detected_language_code"),
            )
            return data
        logger.error("gnani_stt_error", status=resp.status_code, detail=resp.text[:500])
        return {
            "success": False,
            "status_code": resp.status_code,
            "error": resp.text[:500],
        }
    except Exception as e:
        logger.error("gnani_stt_exception", error=str(e))
        return {"success": False, "error": str(e)}
