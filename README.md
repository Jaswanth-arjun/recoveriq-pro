# 🏆 RecoverIQ Pro — AI Revenue Recovery Agent

Razorpay Buildathon — Track 03 — Production-Grade, Real-Time, No Simulations.

**The LLM thinks. Code acts. Every rupee has a receipt.**

Full recovery loop: `DETECT → DIAGNOSE → DECIDE → GATE → ACT → MONITOR → RECOVER → MEASURE → AUDIT`

## One-command setup

```bash
cp .env.example .env        # add Razorpay TEST keys (free) + Claude key
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

**Honesty rule:** any channel without a real API key runs in `SIMULATED` mode and is visibly labeled `SIMULATED` in the UI. The main pipeline (webhooks → payment links → Razorpay `notify:{sms,email}` → recovery) is 100% real Razorpay TEST MODE calls.

## Architecture

7 agents, one pipeline:

```
Razorpay Webhooks (real test-mode)
   ↓
① Revenue Monitor      — ingests events, live ₹ at risk
② Root Cause Agent     — 50+ error-code rule map + Claude second opinion (confidence 0–100%)
③ Recovery Strategist  — Claude picks ONE action from FIXED set (A–G). No free-form actions.
④ Policy Guard         — deterministic. LLM can NEVER override. Blocks are visible in UI.
⑤ Recovery Executor    — real Razorpay API calls / arq scheduled retries
⑥ Outcome Monitor      — payment_link.paid → RECOVERED + time-to-recovery
⑦ Audit Agent          — append-only log. Click any rupee → see its full story.
```

### Fixed action set
| | Action | Trigger |
|---|---|---|
| A | SMART_RETRY | transient failures (insufficient_funds → +48h, network → +2h) |
| B | CHECKOUT_RECOVERY | abandonment / card expired → UPI payment link + real SMS/email |
| C | SUBSCRIPTION_RECOVERY | mandate failure → card-update link |
| D | INVOICE_REMINDER | B2B overdue → promise-to-pay tracker |
| E | VOICE_RECOVERY | high-value ≥ ₹5,000 → ElevenLabs Telugu/Hindi audio |
| F | ESCALATE | low confidence (<70%) / risky / dispute-like |
| G | STOP | retry cap / permanent failure / opt-out |

### Deterministic Policy Guard (code, never LLM)
- max 3 retries/payment · min 2h between retries (48h for insufficient_funds)
- quiet hours 9PM–9AM · max 1 message/day, 5 contacts/30d
- opt-out = permanent suppression · > ₹10,000 → merchant approval
- Claude confidence < 70% → escalate, never act

## Graceful failure (visible, audit-logged)
1. **Claude timeout** → rule-based fallback, audit entry: "AI unavailable, deterministic fallback used"
2. **Razorpay API error** → exponential backoff retry → merchant alert, no crash
3. **Low confidence (e.g. 54%)** → agent visibly refuses: "Confidence too low — escalating to human"

## Key pages
Dashboard (live WebSocket ₹ counters) · Diagnoses · Approvals Queue · Recovery Plan + START RECOVERY · Customer Timeline ("Why did AI take this action?") · Call Console (real ElevenLabs audio) · Copilot Chat (Hinglish, DB-backed) · Recovery Report · Settings

## Free-tier keys (all optional, all graceful)
| Service | Free tier | Purpose |
|---|---|---|
| Razorpay Test Mode | 100% free | payments, links, webhooks — the real pipeline |
| Anthropic / Gemini | paid / free tier | diagnosis + copilot (Gemini = free fallback) |
| ElevenLabs | 10k chars/mo | Telugu/Hindi voice audio |
| Resend | 3k emails/mo | email sends (Razorpay notify also sends free) |

## Demo script (3 min)
1. "₹18.4L at risk — silently leaking."
2. Trigger real test-mode failure → WebSocket dashboard in seconds
3. Rahul ₹2,000, 11 clean payments → "Retry after 2h, 91% confidence" → RECOVERED
4. card_expired → real UPI link → real SMS
5. Voice case → play real ElevenLabs Telugu audio
6. 54%-confidence refusal + policy block (retry cap)
7. RUN BATCH → live feed → report: recovered %, 0 policy violations, 100% audited
8. Copilot: "is hafte mere paise kahan fase hain?" → live answer
9. "Every rupee has a receipt."
