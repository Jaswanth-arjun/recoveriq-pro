"""
LLM service — "LLM THINKS, CODE ACTS."

- Primary: Anthropic Claude (Sonnet)
- Free fallback: Google Gemini (free tier)
- Final fallback: deterministic rule engine (audit-logged as
  "AI unavailable, deterministic fallback used")

The LLM can ONLY: diagnose, choose from the FIXED action set, compose
messages, and answer copilot questions. It can never move money.
"""

import json
import httpx
from app.core.config import settings

FIXED_ACTIONS = ["SMART_RETRY", "CHECKOUT_RECOVERY", "SUBSCRIPTION_RECOVERY",
                 "INVOICE_REMINDER", "VOICE_RECOVERY", "ESCALATE", "STOP"]

SYSTEM_PROMPT = """You are the Recovery Strategist for RecoverIQ Pro, an autonomous
revenue-recovery agent for Indian merchants on Razorpay.

STRICT RULES:
- You may ONLY choose one action from this FIXED set: {actions}
- You can NEVER set amounts, move money, or override policy. Code enforces all limits.
- You must return a confidence score 0-100. If unsure, be honest — below 70 will escalate.
- For high-value (>= INR 5,000) transient failures with good customer history, prefer VOICE_RECOVERY.
- For risk/dispute-like cases, always ESCALATE.

Respond ONLY with JSON: {{"action": one_of_fixed_set, "confidence": 0-100, "reasoning": "1-2 sentences", "alternatives_considered": ["..."]}}"""


class LLMResult(dict):
    pass


def _build_diagnosis_prompt(error_code, error_desc, category, amount_inr, customer) -> str:
    return f"""Classify this failed payment and choose the recovery action.

Error code: {error_code}
Error description: {error_desc}
Rule-engine category: {category}
Amount: INR {amount_inr}
Customer history: {customer.get("successful_payment_count", 0)} successful payments before this.
Customer language: {customer.get("language", "te")} (te=Telugu, hi=Hindi, en=English)

Choose ONE action from: {FIXED_ACTIONS}
Return JSON only."""


async def _call_anthropic(prompt: str) -> dict | None:
    if not settings.anthropic_ready:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": settings.anthropic_api_key,
                         "anthropic-version": "2023-06-01",
                         "content-type": "application/json"},
                json={
                    "model": settings.anthropic_model,
                    "max_tokens": 500,
                    "system": SYSTEM_PROMPT.format(actions=FIXED_ACTIONS),
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            text = resp.json()["content"][0]["text"]
            return json.loads(text[text.find("{"): text.rfind("}") + 1])
    except Exception:
        return None


async def _call_gemini(prompt: str) -> dict | None:
    """Free-tier fallback so the demo works even without an Anthropic key."""
    if not settings.gemini_ready:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}",
                json={"contents": [{"parts": [{"text": SYSTEM_PROMPT.format(actions=FIXED_ACTIONS) + "\n\n" + prompt}]}]},
            )
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text[text.find("{"): text.rfind("}") + 1])
    except Exception:
        return None


async def _call_openrouter(prompt: str) -> dict | None:
    """OpenRouter API support for free-tier / open-source models."""
    if not settings.openrouter_ready:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openrouter_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT.format(actions=FIXED_ACTIONS)},
                        {"role": "user", "content": prompt},
                    ],
                },
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"]
            return json.loads(text[text.find("{"): text.rfind("}") + 1])
    except Exception:
        return None


async def diagnose_and_decide(
    error_code: str, error_desc: str, category: str,
    amount_inr: float, customer: dict, rule_action: str, rule_confidence: int,
) -> dict:
    """
    Returns:
      engine: claude | gemini | openrouter | fallback
      action: from FIXED set only
      confidence: 0-100
      reasoning, alternatives_considered, degraded (bool)
    """
    prompt = _build_diagnosis_prompt(error_code, error_desc, category, amount_inr, customer)

    for engine, caller in (("claude", _call_anthropic), ("gemini", _call_gemini), ("openrouter", _call_openrouter)):
        result = await caller(prompt)
        if result and result.get("action") in FIXED_ACTIONS:
            confidence = max(0, min(100, int(result.get("confidence", 0))))
            model_used = settings.anthropic_model if engine == "claude" else (
                settings.openrouter_model if engine == "openrouter" else "gemini-1.5-flash"
            )
            return {
                "engine": engine,
                "model_used": model_used,
                "action": result["action"],
                "confidence": confidence,
                "reasoning": result.get("reasoning", ""),
                "alternatives_considered": result.get("alternatives_considered", []),
                "degraded": False,
            }

    # ---- Graceful failure: deterministic fallback, audit-logged upstream ----
    return {
        "engine": "fallback",
        "model_used": "",
        "action": rule_action,
        "confidence": rule_confidence,
        "reasoning": "AI unavailable, deterministic fallback used (rule-engine recommendation).",
        "alternatives_considered": [],
        "degraded": True,
    }


async def compose_recovery_message(
    customer_name: str, amount_inr: float, category: str,
    language: str, pay_url: str = "", is_escalated_24h: bool = False,
) -> str:
    """Short recovery message in the customer's language (Telugu/Hindi/Hinglish)."""
    if "abandon" in str(category).lower() or category == "checkout":
        link_str = f" Complete order here: {pay_url}" if pay_url else ""
        if is_escalated_24h:
            return f"Namaste {customer_name}! Your GreenBasket cart is still waiting (Rs {int(amount_inr)}).{link_str} Use coupon RECOVER10 for 10% OFF!"
        else:
            return f"Namaste {customer_name}! You left fresh items in your GreenBasket cart (Rs {int(amount_inr)}).{link_str}"

    lang_map = {"te": "Telugu (Telugu script or Telugu-English mix)",
                "hi": "Hindi (Devanagari or Hinglish)", "en": "English"}
    prompt = f"""Write a SHORT (max 25 words), warm, non-spammy payment recovery message in {lang_map.get(language, 'Hinglish')}.
Customer: {customer_name}. Amount: INR {amount_inr}. Reason category: {category}.
{"Include this payment link: " + pay_url if pay_url else "No link needed."}
Return JSON only: {{"message": "..."}}"""
    for caller in (_call_anthropic, _call_gemini, _call_openrouter):
        result = await caller(prompt)
        if result and result.get("message"):
            return result["message"]
    return f"Hi {customer_name}, your payment of Rs {amount_inr} failed ({category}). Please retry here: {pay_url}" if pay_url else (
        f"Hi {customer_name}, your payment of Rs {amount_inr} failed. Please retry from your account."
    )


async def copilot_answer(question: str, live_stats: dict) -> dict:
    """DB-backed copilot. Live stats are injected — the LLM only phrases the answer."""
    stats_blob = json.dumps(live_stats, indent=2, default=str)
    prompt = f"""You are RecoverIQ Copilot for an Indian merchant. The merchant asked (often in Hinglish): "{question}"

Here are LIVE database stats (ground truth — do not invent numbers):
{stats_blob}

Answer in the merchant's style (Hinglish if they asked in Hinglish), quoting the real numbers,
and end with a clear suggestion (e.g. "Approvals queue lo review cheyyandi"). Max 120 words."""
    for engine, caller in (("claude", _call_anthropic), ("gemini", _call_gemini), ("openrouter", _call_openrouter)):
        result = await caller(prompt)
        if result:
            answer = result.get("answer") or result.get("reasoning") or result.get("message")
            if answer:
                return {"answer": answer, "engine": engine}
    # deterministic fallback answer from real stats
    answer = (
        f"₹{live_stats.get('at_risk', 0):,.0f} at risk — {live_stats.get('failures', 0)} failures. "
        f"{live_stats.get('retries_scheduled', 0)} retries scheduled; "
        f"{live_stats.get('links_sent', 0)} UPI links sent; "
        f"{live_stats.get('awaiting_approval', 0)} awaiting your approval. "
        f"Recovered so far: ₹{live_stats.get('recovered', 0):,.0f}. "
        f"Approvals queue review cheyyandi."
    )
    return {"answer": answer, "engine": "fallback"}


async def call_llm(prompt: str, system_prompt: str = "") -> str:
    """General LLM caller returning raw text response from OpenRouter / Anthropic / Gemini."""
    if settings.openrouter_ready:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openrouter_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.openrouter_model,
                        "messages": [
                            {"role": "system", "content": system_prompt or "You are an AI financial intent parser. Return JSON only."},
                            {"role": "user", "content": prompt},
                        ],
                    },
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print("call_llm OpenRouter error:", e)

    for caller in (_call_anthropic, _call_gemini, _call_openrouter):
        res = await caller(prompt)
        if res:
            return json.dumps(res)

    return ""

