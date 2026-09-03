<div align="center">

# 🏆 RecoverIQ Pro

### AI Revenue Recovery Agent — Razorpay Buildathon · Track 03

**"The LLM thinks. Code acts. Every rupee has a receipt."**

[![Razorpay](https://img.shields.io/badge/Razorpay-Buildathon%20Track%2003-0C2451?logo=razorpay&logoColor=white)](https://razorpay.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Live](https://img.shields.io/badge/Real--time-WebSocket%20%2B%20Redis-DC382D?logo=redis&logoColor=white)](https://redis.io)

</div>

---

## 📖 Table of Contents

1. [What is RecoverIQ Pro?](#-what-is-recoveriq-pro)
2. [Why Judges Should Care](#-why-judges-should-care)
3. [Track 03 Requirements — 100% Coverage](#-track-03-requirements--100-coverage)
4. [The 7-Agent Pipeline](#-the-7-agent-pipeline)
5. [The Fixed Action Set (A–G)](#-the-fixed-action-set-ag)
6. [Deterministic Policy Guard — Code Never Lies](#-deterministic-policy-guard--code-never-lies)
7. [Feature Deep Dives](#-feature-deep-dives)
8. [Multi-Channel Outreach](#-multi-channel-outreach)
9. [Graceful Failure — Honesty as a Feature](#-graceful-failure--honesty-as-a-feature)
10. [Architecture & Tech Stack](#-architecture--tech-stack)
11. [Quick Start (One Command)](#-quick-start-one-command)
12. [5-Minute Judge Demo Script](#-5-minute-judge-demo-script)
13. [Key Pages Map](#-key-pages-map)
14. [API Reference](#-api-reference)
15. [Database Model](#-database-model)
16. [Free-Tier Keys Table](#-free-tier-keys-table)
17. [Design Decisions & Trade-offs](#-design-decisions--trade-offs)
18. [Troubleshooting](#-troubleshooting)

---

## 🎯 What is RecoverIQ Pro?

**RecoverIQ Pro** is an autonomous, production-grade revenue recovery system for Razorpay merchants. It closes the *entire* loop:

```
 💸 Revenue silently leaking
        ↓
 🔍 DETECT  →  real-time failure ingestion (50+ Razorpay error codes)
        ↓
 🧠 DIAGNOSE  →  rule map + LLM second opinion with confidence score
        ↓
 ♟️ DECIDE  →  LLM picks ONE action from a fixed, compliant set
        ↓
 🛡️ GATE  →  deterministic policy guard (LLM can NEVER override)
        ↓
 ⚡ ACT  →  real Razorpay payment links, SMS, Email, WhatsApp, AI voice calls
        ↓
 📈 RECOVER  →  webhook confirms payment → measured money back
        ↓
 🧾 AUDIT  →  append-only trail — click any rupee, see its full story
```

Full loop: `DETECT → DIAGNOSE → DECIDE → GATE → ACT → MONITOR → RECOVER → MEASURE → AUDIT`

> **No simulations in the money path.** Webhooks, payment links, retries, and recovery confirmation are 100% real Razorpay **TEST MODE** API calls. Channels without keys run visibly `SIMULATED` — never faked.

---

## 💡 Why Judges Should Care

| 💚 The Bar (Track 03) | ✅ How RecoverIQ Pro Clears It |
|---|---|
| **💰 Money Recovered (measured)** | Live counters via WebSocket: *At Risk ₹ · Recovered ₹ · Recovery Rate %*. Every recovered rupee is confirmed by a real Razorpay webhook — not a status flag. |
| **⬆️ Escalation (when AI shouldn't act)** | High-value (> ₹10,000) or AI confidence < 70% → auto-escalates to the merchant **Approvals Queue**. Human approves → only then does the executor act. |
| **🛑 Stopping Rules (compliance)** | Opt-out = permanent suppression · max 3 retries/payment · 48h gap for insufficient funds · quiet hours 9 PM–9 AM IST · dispute/fraud = hard STOP. |
| **🧾 Audit Trail (explainability)** | Append-only `audit_log`. Timeline page answers *"Why did AI take this action?"* for any payment — every agent step, verdict, and API call ID is on record. |
| **🤖 Autonomous agentic behavior** | 7 specialized agents, real LLM reasoning with fixed action contracts, real scheduled background jobs (arq + Redis), real telephony — not a scripted demo. |

---

## ✅ Track 03 Requirements — 100% Coverage

| # | Razorpay Requirement | RecoverIQ Pro Feature | Where in UI |
|---|---|---|---|
| 1 | **Payment degradation → root cause → recovery action** | Ingest 50+ real Razorpay error codes → rule + LLM diagnosis → policy-gated action | Dashboard → Diagnoses |
| 2 | **Checkout drop-off recovery** | GreenBasket storefront tracks tab-switch / tab-close abandonment → Razorpay payment link + multi-channel outreach → order completion auto-marks `RECOVERED` | Open GreenBasket Store → Diagnoses |
| 3 | **Failed-subscription recovery** | Auto-pay mandate failure simulation with 7 selectable error codes → polite SMS + Email + WhatsApp + (optional) scheduled AI voice call | Subscribers & Delivery |
| 4 | **B2B receivables chaser** | 7-stage escalation: pre-due email → overdue SMS/WhatsApp → promise-to-pay link → Tier-4 AI voice call | B2B Receivables |
| 5 | **Promise-to-pay tracker** | Self-service portal — overdue B2B clients commit to a date within 7 days; broken promises auto-create failure events | Promises to Pay |
| 6 | **Mandate retry sequencer** | Intelligent retry scheduling: +48h insufficient funds, +2h network, quiet hours, retry caps | Recovery Plan |
| 7 | **Hinglish/Telugu voice recovery** | Real Twilio phone calls with Telugu/Hinglish scripts + ElevenLabs audio; AI voice agent only for high-value (> ₹10,000) | Call Console |
| 🏆 | **THE BAR: measured money, escalation, stopping rules, audit** | Live metrics + Approvals Queue + append-only audit + Timeline | Dashboard / Approvals / Timeline / Report |

---

## 🤖 The 7-Agent Pipeline

```
        Razorpay Webhooks (real TEST MODE)
                     ↓
 ┌───────────────────────────────────────────────────────────┐
 │ ① REVENUE MONITOR   ingests events → live ₹ at risk       │
 │ 🧠 ROOT CAUSE AGENT 50+ error-code rules + LLM 2nd opinion│
 │ ♟️ STRATEGIST       LLM picks ONE action from fixed A–G   │
 │ 🛡️ POLICY GUARD     deterministic — LLM cannot override   │
 │ ⚡ EXECUTOR          real Razorpay / Twilio / Resend calls │
 │ 📈 OUTCOME MONITOR   payment_link.paid → RECOVERED + time │
 │ 🧾 AUDIT AGENT       append-only log — every rupee has a  │
 │                      receipt                              │
 └───────────────────────────────────────────────────────────┘
```

**Agent 1 — Revenue Monitor.** Ingests webhooks (`payment.failed`, `subscription.charged.failed`, `checkout.abandoned`, `promise.broken`, …). Creates a `FailureEvent` with amount, error code, raw payload. Broadcasts over WebSocket instantly.

**Agent 2 — Root Cause Agent.** A curated 50+ entry rule map (`error_codes.py`) of *real Razorpay error codes* classifies cause, category, retry-safety and recommended action. An LLM (Claude → Gemini → OpenRouter fallback chain) provides a second opinion with a 0–100 confidence score.

**Agent 3 — Recovery Strategist.** The LLM selects exactly **one** action from the fixed set A–G. No free-form actions — the action contract keeps autonomy safe. Low confidence or risky signals are *visible* decisions with reasoning stored.

**Agent 4 — Policy Guard.** Deterministic, code-only. **The LLM can never override policy.** Every verdict (`ALLOW` / `APPROVAL_REQUIRED` / `BLOCK`) is persisted and shown in the UI.

**Agent 5 — Recovery Executor.** Real API calls: Razorpay payment links (`notify: {sms, email}`), Twilio voice calls, Resend emails, WhatsApp. Transient failures schedule real arq jobs in Redis (+2h network, +48h insufficient funds).

**Agent 6 — Outcome Monitor.** `payment_link.paid` webhook → event flips to `RECOVERED` with measured time-to-recovery. Completing checkout on the storefront auto-recovers linked risks.

**Agent 7 — Audit Agent.** Every agent step writes to an append-only log with actor, action and detail. The Timeline page renders the full story per event.

---

## ♟️ The Fixed Action Set (A–G)

| | Action | Trigger | Channel |
|---|---|---|---|
| **A** | `SMART_RETRY` | transient failures (insufficient funds → +48h, network → +2h) | arq + Redis scheduled retry |
| **B** | `CHECKOUT_RECOVERY` | abandonment / card expired | Razorpay UPI link + SMS + Email + WhatsApp |
| **C** | `SUBSCRIPTION_RECOVERY` | mandate failure / card token invalid | card-update link + outreach |
| **D** | `INVOICE_REMINDER` | B2B overdue invoice | payment link + promise-to-pay tracker |
| **E** | `VOICE_RECOVERY` | AI voice agent — **only for order value > ₹10,000** | Twilio call + ElevenLabs audio |
| **F** | `ESCALATE` | low confidence (<70%) / risk flags / disputes / chargebacks | human Approvals Queue |
| **G** | `STOP` | retry cap / permanent failure / opt-out / mandate revoked | none — visible stop with reason |

---

## 🛡️ Deterministic Policy Guard — Code Never Lies

| Rule | Value |
|---|---|
| Max retries per payment | 3 |
| Min gap between retries | 2h (48h for insufficient funds) |
| Quiet hours | 9 PM – 9 AM IST — no outreach |
| High-value approval gate | > ₹10,000 → merchant must approve |
| **AI voice call gate** | **Order value > ₹10,000 only** — below that, SMS + Email suffice |
| Shopping abandonment | **Never triggers phone calls** (SMS/WhatsApp/Email only — saves telephony spend) |
| AI confidence floor | < 70% → escalate, never act |
| Opt-out | Permanent suppression |
| Disputes / fraud / revoked mandates | Hard `STOP` |

Every verdict is persisted in `policy_checks` and rendered in Diagnoses + Timeline.

---

## 🚀 Feature Deep Dives

### 🥦 GreenBasket Storefront + Checkout Abandonment (Track 03 #2)

- Full storefront (`/store`) with persistent cart, live bag, and COD / Razorpay one-time checkout.
- Abandonment tracking fires **only on tab switch or tab close** (`visibilitychange` / `pagehide`) — never while the shopper is still browsing (no fake "amount at risk" inflation).
- Single-send architecture (`sendBeacon` on unload, `fetch keepalive` otherwise) — no duplicate events.
- On abandonment: ingestion → pipeline → Razorpay payment link → multi-channel outreach. Completing the order auto-marks the risk **RECOVERED**.
- Deduplication by session id with closed-record protection — reopening a closed case never resurrects old events.

### ⚡ Subscription Auto-Pay Failure (Track 03 #3)

- One-click **Trigger Auto-Pay Failure** → on-screen **"Select Auto-Pay Failure Risk Code"** modal with 7 real-world codes:
  `Insufficient Funds · Card Expired · Payment Timed Out · Card Not Active · Network Error · Intl. Transaction Blocked · Authentication Failed`
- On confirm: subscription flips to `NOT_PAID_YET`, pipeline runs, and **polite SMS + Email + WhatsApp** go out with the reason and a secure Razorpay payment link.
- Optional checkbox — **"📞 AI Voice Caller after 24 hrs"**: schedules a real deferred job (arq + Redis). If the customer *still* hasn't paid after 24 hours, the AI voice agent calls them automatically. Pay in the meantime → the job checks and **skips the call**.

### 💬 WhatsApp Greetings (real sends)

| Event | WhatsApp Message |
|---|---|
| 🛒 Order placed | Greeting + **every item with Qty × ₹Price = line total** + grand total + payment method + address + **"🚚 Delivery Status: ON THE WAY"** |
| 🌿 Subscription confirmed | Greeting + subscribed items (Qty × ₹Price) + Daily Basket ₹/day + Monthly Total + 6 AM delivery schedule |
| ⚠️ Auto-pay failure | Polite failure reason + secure payment link |

Voice call scripts deliberately **never read the link aloud** — they say *"meeku SMS mariyu Email lo payment link pampamu — SMS mariyu Email check chesi, aa link tho payment complete cheyandi"* and the SMS itself carries the link.

### 🏢 B2B Receivables Chaser (Track 03 #4)

- 7-stage escalation ladder: pre-due reminder (3d) → overdue email (1d) → SMS/WhatsApp (2d) → promise-to-pay (7d) → **Tier-4 AI voice call (8+ days)**.
- Aging buckets (0–30 / 31–60 / 61–90 / 90+ days) with automatic escalation tiers — all visible on the Receivables page.
- One-click **Run Policy Stage** to demo any stage live.

### 🤝 Promise-to-Pay Tracker (Track 03 #5)

- Self-service portal (`/p2p/[id]`) where overdue B2B clients pick a commitment date **strictly within 7 days**.
- Background worker checks daily: fulfilled → `PAID`; broken → auto-creates a new failure event and re-enters the recovery pipeline.

### 📞 AI Voice Agent (Track 03 #7)

- **Real Twilio phone calls** to the customer's phone — self-hosted TwiML endpoint (no third-party twimlet dependency), fetched live by Twilio at call time.
- Telugu/Hinglish scripts + ElevenLabs TTS audio preview in the **Call Console**.
- Value-gated: voice calls only for **> ₹10,000** orders; the 24h scheduled follow-up re-checks payment status before dialing.
- High-value orders additionally pass through the merchant approval gate.

### 🧠 AI Copilot (floating widget)

- Sidebar-free: an **AI icon at the bottom-right of every screen** opens an overlay chat panel.
- Answers **Hinglish/Telugu/English** questions using **live DB stats** (at-risk ₹, recovery rate, approvals pending, escalations, retries scheduled, links sent).
- Full chat history persisted; engine badge shows which model answered.

---

## 📡 Multi-Channel Outreach

| Channel | Provider | Real / Simulated |
|---|---|---|
| 💳 Payment links + webhooks | **Razorpay Test Mode** | 🟢 100% real (the money path) |
| 📞 Voice calls | **Twilio Programmable Voice** + self-hosted TwiML | 🟢 real calls to the customer's phone |
| 🗣️ TTS audio | **ElevenLabs** (10k chars/mo) | 🟢 real audio; graceful fallback if quota ends |
| ✉️ Email | **Resend** (3k emails/mo) + Razorpay `notify.email` | 🟢 real |
| 💬 WhatsApp | **Twilio WhatsApp** / Meta Cloud API | 🟢 real (session rules apply on trials) |
| 📱 SMS | **Twilio SMS** | 🟡 trial-restricted to India (predefined templates only) — graceful `sent: false` otherwise |
| 🧠 Diagnosis / Copilot LLM | Claude → Gemini → OpenRouter chain | 🟢 real; deterministic rule fallback if all unavailable |

---

## 💥 Graceful Failure — Honesty as a Feature

1. **LLM timeout / quota end** → deterministic rule-based fallback; audit entry `"AI unavailable, deterministic fallback used"`.
2. **Razorpay API error** → exponential backoff → merchant alert. No crash, no silent loss.
3. **Low AI confidence (e.g. 54%)** → agent visibly refuses: *"Confidence too low — escalating to human"*. Never acts on a guess.
4. **Missing API keys** → that channel runs `SIMULATED`, **visibly labeled** in the UI and audit log. Never faked.
5. **Every external call** stores its API call ID — receipts, not vibes.

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Next.js 14 (App Router)    │  HTTP  │  FastAPI (uvicorn)           │
│  Merchant Dashboard         │ ─────► │  /api — 60+ endpoints        │
│  GreenBasket Storefront     │  WS    │  WebSocket broadcast (live)  │
│  Tailwind + zustand + SWR   │ ◄───── │  7-agent pipeline            │
└─────────────────────────────┘        └──────────┬───────────────────┘
                                                  │
                     ┌────────────────────────────┼──────────────────────┐
                     ▼                            ▼                      ▼
             ┌──────────────┐            ┌──────────────┐       ┌──────────────┐
             │ PostgreSQL16 │            │  Redis 7     │       │  External    │
             │ 19 tables    │            │  arq worker  │       │  Razorpay    │
             │ audit log    │            │  scheduled   │       │  Twilio      │
             │ append-only  │            │  retries +   │       │  Resend      │
             │              │            │  voice calls │       │  ElevenLabs  │
             └──────────────┘            └──────────────┘       └──────────────┘
```

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, zustand, lucide-react |
| Backend | FastAPI, SQLAlchemy 2 (async), Pydantic |
| Real-time | WebSocket broadcast + Redis pub/sub |
| Background jobs | arq (Redis) — retries, 24h voice-call follow-ups, broken-promise scans |
| Database | PostgreSQL 16 — 19 tables, append-only audit |
| Infra | Docker Compose (db · redis · backend · worker · frontend) |
| Integrations | Razorpay (payments), Twilio (voice/SMS/WhatsApp), Resend (email), ElevenLabs (TTS) |

### Repository layout

```
recoveriq-pro/
├── backend/
│   ├── app/
│   │   ├── api/routes.py        # 60+ endpoints (2800+ lines)
│   │   ├── agents/pipeline.py   # the 7-agent loop
│   │   ├── services/            # razorpay, twilio voice, messaging, llm, events
│   │   ├── error_codes.py       # 50+ Razorpay error-code rule map
│   │   ├── worker.py            # arq jobs (retries, 24h voice calls)
│   │   ├── core/                # config, db, logging
│   │   └── models.py            # 19 SQLAlchemy tables
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                     # dashboard + storefront pages
│   ├── components/gb/           # GreenBasket storefront components
│   ├── components/CopilotWidget.jsx
│   ├── hooks/useAbandonmentTracker.js
│   ├── lib/ (api, abandonment, useLive)
│   ├── store/basket.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── start-ngrok.bat              # public tunnel for Twilio webhooks (voice)
```

---

## ⚡ Quick Start (One Command)

```bash
cp .env.example .env        # add Razorpay TEST keys (free) — everything else optional
docker compose up --build
```

| Service | URL |
|---|---|
| 🖥️ Merchant Dashboard | http://localhost:3000 |
| 🥦 GreenBasket Storefront | http://localhost:3000/store |
| 📚 API Docs (Swagger) | http://localhost:8000/docs |
| 🔌 WebSocket feed | ws://localhost:8000/api/ws |

**Voice-call testing (optional):** run `start-ngrok.bat` to expose the backend for Twilio's live TwiML fetch, and set `FRONTEND_URL` to your tunnel URL in `.env`.

---

## 🎬 5-Minute Judge Demo Script

| ⏱ | Step | What Judges See |
|---|---|---|
| 0:00 | Dashboard, Reset Data → live counters | Clean slate: At Risk ₹0, Recovery Rate 0% |
| 0:30 | Ingest Payment Failure → Run Pipeline | WebSocket dashboard updates in seconds; Diagnoses shows Detect → Diagnose → Decide → Gate → Act |
| 1:30 | Timeline page | Full audit trail: *"Why did AI take this action?"* — every step with reasoning + API call IDs |
| 2:15 | **Trigger Auto-Pay Failure** → pick `Card Expired` → tick **24h voice call** | Polite SMS + Email + WhatsApp fire; subscription → NOT_PAID_YET; 24h call scheduled in Redis |
| 3:00 | Amount **> ₹10,000** → Approvals Queue → Approve | Escalation gate visible; after approval the AI voice agent actually calls the phone |
| 3:45 | GreenBasket Store → add items → **switch tab** | Checkout abandonment appears in Diagnoses instantly; complete the order → auto-RECOVERED, counters update |
| 4:15 | AI Copilot (bottom-right) | *"How much revenue is at risk?"* → live-DB-backed answer |
| 4:45 | Recovery Report | Measured money recovered, 0 policy violations, 100% audit coverage |

---

## 🗺️ Key Pages Map

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/` | Live ₹ counters (WS), failure ingestion, batch runner |
| B2B Receivables | `/receivables` | Aging buckets, stage simulation, invoices |
| Promises to Pay | `/promises` | P2P tracker, broken promises |
| Subscribers & Delivery | `/subscriptions` | Auto-pay failure simulation + 24h voice scheduler |
| Diagnoses | `/diagnoses` | Live pipeline runs, statuses, policy verdicts |
| Approvals | `/approvals` | Human-in-the-loop for high-value / low-confidence |
| Recovery Plan | `/plan` | Retry schedule + policy configuration |
| Timeline | `/timeline` | Full audit trail per event |
| Call Console | `/calls` | Voice call log + ElevenLabs audio playback |
| Report | `/report` | Recovery analytics: measured money, violations, coverage |
| Settings | `/settings` | Merchant policy knobs (thresholds, quiet hours) |
| GreenBasket Store | `/store` | Customer-facing storefront (the revenue source) |

---

## 🔌 API Reference (highlights — full Swagger at `/docs`)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Channel-by-channel config status |
| `/api/checkouts/abandon` | POST | Ingest checkout abandonment (beacon-friendly) |
| `/api/orders` | POST | One-time order + WhatsApp order confirmation |
| `/api/subscriptions` | POST | Create subscription + WhatsApp greeting |
| `/api/subscriptions/{id}/simulate-autopay-failure` | POST | 7-code failure sim + outreach + optional 24h call |
| `/api/subscriptions/{id}/trigger-24h-voice-call` | POST | Immediate AI voice follow-up (demo) |
| `/api/receivables/invoices/{id}/simulate-stage` | POST | B2B stage simulation (7 stages) |
| `/api/approvals/{event_id}/approve` | POST | Human approval → executor runs |
| `/api/copilot` / `/api/copilot/history` | POST/GET | AI copilot with live stats |
| `/api/twiml/voice` | GET/POST | Self-hosted TwiML (Twilio fetches at call time) |
| `/api/metrics` | GET | Live aggregates (at-risk, recovered, rate) |
| `/api/ws` | WS | Real-time broadcast feed |

---

## 🗄️ Database Model (19 tables)

`merchants · customers · payments · failure_events · diagnoses · decisions · policy_checks · actions · outcomes · voice_calls · audit_log · subscriptions · checkout_abandonments · one_time_orders · promise_to_pay · b2b_invoices · copilot_messages · payment_degradation_alerts · recovery_policies`

Key invariants:
- `audit_log` is **append-only** — the receipt for every rupee.
- `failure_events.status` is a visible state machine: `detected → diagnosed → gated → awaiting_approval → acting → recovered / stopped / escalated`.
- `checkout_abandonments` deduplicates by session with closed-record protection.

---

## 🔑 Free-Tier Keys Table (all optional, all graceful)

| Service | Free tier | Purpose |
|---|---|---|
| **Razorpay Test Mode** | 100% free | payments, links, webhooks — the real pipeline |
| **Anthropic Claude** | paid | diagnosis + copilot (best quality) |
| **Google Gemini** | free tier | LLM fallback |
| **OpenRouter** | free tier | LLM fallback chain |
| **ElevenLabs** | 10k chars/mo | Telugu/Hindi voice audio |
| **Resend** | 3k emails/mo | transactional email |
| **Twilio Trial** | trial credit | voice calls + WhatsApp (WhatsApp needs 24h session; SMS = predefined templates on trial) |

> **Honesty rule:** any channel without a real key runs in `SIMULATED` mode and is visibly labeled in the UI. The money path (webhooks → links → recovery) is always 100% real Razorpay TEST MODE.

---

## 🧭 Design Decisions & Trade-offs

| Decision | Why |
|---|---|
| **Fixed action set (A–G) instead of free-form LLM actions** | Autonomy without chaos — LLM picks from audited, policy-checked actions only. |
| **Deterministic policy guard outside the LLM** | Compliance rules must be impossible to talk the AI out of. Code enforces; LLM advises. |
| **Confidence-scored dual diagnosis (rules + LLM)** | Rules give reliability; LLM gives nuance; disagreement is visible, not hidden. |
| **Value gate on voice calls (> ₹10,000)** | Human-like economics: phone calls for big tickets, cheap channels for small ones. |
| **No calls for live shopping abandonment** | A shopper mid-browsing is not a defector — only tab-switch/close signals intent, and telephony spend stays protected. |
| **Self-hosted TwiML endpoint** | No dependency on deprecated third-party twimlets; the script is served from our own FastAPI. |
| **Deferred jobs via arq/Redis (not sleeps)** | Real 24-hour scheduling survives restarts; payment-before-call checks prevent wasted dials. |
| **Append-only audit** | Judges (and auditors) can replay every decision — trust through receipts. |

---

## 🧰 Troubleshooting

| Symptom | Fix |
|---|---|
| Voice call says *"could not reach your internal server"* | Ngrok tunnel is down — run `start-ngrok.bat` (forwards to backend :8000) before voice testing. |
| WhatsApp messages not delivered | Twilio trial: customer must WhatsApp the sender once first (opens a 24h session); then our messages deliver. |
| SMS shows `sent: false` (400) | Twilio trial India allows predefined templates only — upgrade, or rely on WhatsApp + Email (both real). |
| Frontend changes not visible | Frontend has no volume mount — `docker compose build frontend && docker compose up -d frontend`. |
| Backend code changes not visible | Backend is volume-mounted — `docker compose restart backend`. |
| Calls fire too often in testing | Voice calls are gated: > ₹10,000 value + non-shopping events only. |

---

<div align="center">

**RecoverIQ Pro** — *The LLM thinks. Code acts. Every rupee has a receipt.* 🧾

Built with ❤️ for the Razorpay Buildathon — Track 03: AI Revenue Recovery

</div>
