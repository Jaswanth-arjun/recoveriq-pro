<div align="center">

# 🏆 RecoverIQ Pro
### Autonomous AI Revenue Recovery Agent · Gnani AI — Great Indian AI Internship Challenge

**"The LLM thinks. Code acts. Every rupee has a receipt."**

[![Gnani AI](https://img.shields.io/badge/Gnani%20AI-Timbre%20TTS%20%2B%20Prisma%20STT-6E3AFF?style=for-the-badge)](https://www.gnani.ai/)
[![Challenge](https://img.shields.io/badge/Great%20Indian%20AI-Internship%20Challenge-FF6B35?style=for-the-badge)](https://www.gnani.ai/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay%20Test%20Mode-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose_Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Redis](https://img.shields.io/badge/Redis-7_arq_Worker-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)

`#GnaniAI` · `#GreatIndianAIInternshipChallenge`

[📋 Challenge Submission](#-gnani-ai-challenge-submission) • [🚀 Quick Start](#-quick-start-one-command) • [🤖 7-Agent Pipeline](#-the-7-agent-autonomous-pipeline) • [🎙️ Gnani Integration](#-gnani-ai-integration--models-used) • [🔌 API Reference](#-api-reference-categorized)

</div>

---

## 📖 Table of Contents

1. [Gnani AI Challenge Submission](#-gnani-ai-challenge-submission)
2. [Executive Summary & Core Concept](#-executive-summary--core-concept)
3. [Why This Matters (The Product Bar)](#-why-this-matters-the-product-bar)
4. [Gnani AI Integration & Models Used](#-gnani-ai-integration--models-used)
5. [Capability Matrix — Revenue Recovery Coverage](#-capability-matrix--revenue-recovery-coverage)
6. [System Architecture](#-system-architecture)
7. [The 7-Agent Autonomous Pipeline](#-the-7-agent-autonomous-pipeline)
8. [The Fixed Action Contracts (Set A–G)](#-the-fixed-action-contracts-set-ag)
9. [Deterministic Policy Guard — Hard-Coded Compliance Rules](#-deterministic-policy-guard--hard-coded-compliance-rules)
10. [End-to-End Feature Deep Dives](#-end-to-end-feature-deep-dives)
    - [1. GreenBasket Storefront & Intent-Driven Abandonment Tracking](#1-greenbasket-storefront--intent-driven-abandonment-tracking)
    - [2. Subscription Mandate Auto-Pay Failure Engine (7 Risk Codes)](#2-subscription-mandate-auto-pay-failure-engine-7-risk-codes)
    - [3. B2B Receivables Chaser & 7-Stage Escalation Ladder](#3-b2b-receivables-chaser--7-stage-escalation-ladder)
    - [4. Self-Service Promise-to-Pay (P2P) Portal](#4-self-service-promise-to-pay-p2p-portal)
    - [5. Telephony Engine & AI Voice Caller (Telugu / Hinglish / English)](#5-telephony-engine--ai-voice-caller-telugu--hinglish--english)
    - [6. Multi-Channel Messaging & Itemized WhatsApp Greetings](#6-multi-channel-messaging--itemized-whatsapp-greetings)
    - [7. Embedded AI Copilot Assistant](#7-embedded-ai-copilot-assistant)
11. [Multi-Channel Communication Audit (Real vs Simulated)](#-multi-channel-communication-audit-real-vs-simulated)
12. [Graceful Degradation & Honesty Architecture](#-graceful-degradation--honesty-architecture)
13. [Key UI Pages Map](#-key-ui-pages-map)
14. [Database Schema & 19 Tables Map](#-database-schema--19-tables-map)
15. [API Reference (Categorized)](#-api-reference-categorized)
16. [Production Design Decisions & Trade-offs](#-production-design-decisions--trade-offs)
17. [Quick Start (One Command)](#-quick-start-one-command)
18. [Troubleshooting & FAQs](#-troubleshooting--faqs)
19. [Challenge Submission Checklist](#-challenge-submission-checklist)

---

## 🏅 Gnani AI Challenge Submission

> **Challenge:** Great Indian AI Internship Challenge — build a working application using Gnani AI's models and/or APIs to solve a practical need for enterprises, developers, or creators.
>
> **Deadline:** November 10, 2026 (final, no extensions).
>
> **Submission hashtags:** `#GnaniAI` `#GreatIndianAIInternshipChallenge`
>
> **Official Gnani AI accounts tagged:** [gnani.ai on LinkedIn](https://www.linkedin.com/company/gnani-ai) · [@GnaniAi on X](https://x.com/GnaniAi)

### Submission links

| Required item | Link / location |
|---|---|
| 💻 Public GitHub repository | [github.com/Jaswanth-arjun/recoveriq-pro](https://github.com/Jaswanth-arjun/recoveriq-pro) |
| 🎥 Public demo video | _Add your public LinkedIn/X video URL here before submitting_ |
| 📝 Written project explanation | This README (problem, solution, users, Gnani models, contributions) |
| 🤖 Gnani AI models / APIs used | [`Timbre v2.5`](#gnani-ai-models--apis-used) (TTS) + [`Prisma v3.0`](#gnani-ai-models--apis-used) (STT) |
| 💼 Nominated LinkedIn post | _Add your public LinkedIn post URL here_ |
| 𝕏 Nominated X post | _Add your public X post URL here_ |

### The problem

Indian businesses lose revenue silently through failed payments, abandoned checkouts, failed subscription mandates, and overdue B2B invoices. Recovery is still largely manual, generic, and English-only, even when the customer speaks Telugu, Hindi, or Hinglish. Generic voice bots make this worse: they mispronounce Indian names and amounts, cannot switch languages naturally, and leave no reliable transcript for audit or compliance.

### The solution

**RecoverIQ Pro** is an autonomous revenue-recovery platform for Indian merchants. It closes the loop from detection to measured recovery:

```
DETECT → DIAGNOSE → DECIDE → POLICY GATE → ACT → RECOVER → AUDIT
```

* **Detect** payment failures, abandoned checkouts, mandate failures, and overdue invoices.
* **Diagnose** the root cause using a 50+ error-code rule map plus an LLM second opinion.
* **Decide** on exactly one action from fixed, strongly-typed contracts (Set A–G).
* **Gate** every action through a deterministic policy engine (retries, quiet hours, opt-outs, value thresholds).
* **Act** through Razorpay payment links, Twilio SMS/WhatsApp/voice, Resend email, and **Gnani AI speech**.
* **Recover** only when a Razorpay webhook confirms real money received.
* **Audit** every recommendation, policy check, and external API call in an append-only log.

**Gnani AI is the voice layer of the product.** Gnani Timbre speaks to customers in their own language, and Gnani Prisma turns call recordings into searchable transcripts with automatic Indian-language detection.

### Gnani AI models & APIs used

| Gnani AI model / API | Version | Role in RecoverIQ Pro | Implementation |
|---|---|---|---|
| **Timbre — Text-to-Speech** | `timbre-v2.5` | Synthesises real Telugu, Hindi, Hinglish, and English recovery calls. Twilio plays the generated MP3 during a live call. | `backend/app/services/gnani.py` → `POST https://api.vachana.ai/api/v1/tts/inference` |
| **Prisma — Speech-to-Text** | `prisma-v3.0` | Transcribes call recordings and auto-detects the spoken Indian language for audit and follow-up. | `backend/app/services/gnani.py` → `POST https://api.vachana.ai/stt/v3` |

**Authentication:** every Gnani request uses the `X-API-Key-ID` header.

**Default Timbre v2.5 voices:**

| Customer language | Gnani locale | Voice |
|---|---|---|
| Telugu | `te-IN` | Suhana |
| Hindi | `hi-IN` | Nalini |
| Hinglish (code-mixed) | `hi-en` | Poorvi |
| English (India) | `en-IN` | Kaveri |

**Production details that make the voice layer usable:**

* **Spoken Indian amounts:** `₹1,50,000` is converted to *"one lakh fifty thousand rupees"* before synthesis, following Gnani's input-formatting guidance, so amounts are not mispronounced.
* **Self-hosted TwiML:** Twilio fetches `/api/twiml/voice`, which returns a `<Play>` pointing at `/api/twiml/audio`; that endpoint streams Gnani-generated audio. If Gnani is unavailable, the call falls back to Twilio `<Say>` instead of failing.
* **In-process audio cache:** repeated scripts (retries, webhook replays) do not re-synthesise the same audio.
* **Honest status reporting:** `GET /api/system/status` returns the live provider, TTS model, and STT model.

> **A note on Evon:** Gnani Evon v3.3 (30B MoE, Hugging Face) was evaluated but is **not used in this build**. At submission time its hosted Gnani API was in closed beta, and self-hosting the 60 GB BF16 weights requires H100/H200-class GPUs. The reasoning layer continues to use the existing LLM plus a deterministic rule map. This README does not claim Evon usage.

### Who will use it

| User | Why they need it |
|---|---|
| **Razorpay merchants / D2C brands** | Recover failed payments and abandoned carts without hiring a manual calling team. |
| **Subscription businesses** | Recover failed mandates with retries and local-language voice follow-ups. |
| **B2B finance and receivables teams** | Automate staged overdue reminders and Promise-to-Pay collection. |
| **Recovery operations / agencies** | Run multilingual outreach with a complete, immutable audit trail. |
| **Indian end customers** | Receive a call they can actually understand, in Telugu, Hindi, Hinglish, or English. |
| **Developers** | Reuse `backend/app/services/gnani.py` as a small, working Gnani TTS/STT integration. |

### Team contributions

| Member | Contribution |
|---|---|
| **Jaswanth Arjun** (solo participant) | Product design, FastAPI backend, Next.js dashboard, Razorpay integration, agent pipeline, deterministic policy guard, database schema, Gnani Timbre/Prisma integration, Twilio telephony, testing, documentation, and demo. |

> If the submission is converted to a team entry, replace this table with each member's name and the specific modules they owned. Do not submit a team entry with a single combined credit.

---

## 🎯 Executive Summary & Core Concept

**RecoverIQ Pro** is an autonomous, end-to-end revenue recovery agent specifically engineered for Razorpay merchants. In modern e-commerce and subscription businesses, millions of rupees leak silently due to payment gateway degradations, expired cards, insufficient funds, abandoned checkouts, and overdue B2B invoices.

Existing recovery tools use simple, rigid, static email blasts that customers ignore, or dangerous unconstrained LLMs that hallucinate discount codes and spam users. 

**RecoverIQ Pro solves this by introducing a dual-brain architecture:**
* **An LLM Diagnostician & Strategist** (Claude 3.5 Sonnet / Gemini 1.5 Pro) that analyzes 50+ Razorpay error codes, customer purchase history, and failure patterns with confidence scoring.
* **A Hard-Coded Deterministic Policy Guard** that evaluates every proposed AI decision against strict merchant rules (caps, quiet hours, value gating, opt-outs) before execution.

```
                    ┌────────────────────────────────────────────────────────┐
                    │            💸 REVENUE LEAKING SILENTLY                  │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1️⃣ DETECT      Ingest 50+ Razorpay Error Codes / Checkout Abandonments / Mandate Failures    │
│ 2️⃣ DIAGNOSE    Rule Map + LLM 2nd Opinion with 0–100% Confidence Score                     │
│ 3️⃣ DECIDE      LLM selects ONE action from Fixed Compliant Contracts (Set A–G)             │
│ 4️⃣ GATE        Deterministic Policy Guard (Code Enforces; LLM CANNOT Override)              │
│ 5️⃣ ACT         Real Razorpay Links + Twilio WhatsApp/SMS + Resend Email + Telephony Voice   │
│ 6️⃣ RECOVER     Webhook confirms payment → Real measured money recovered                     │
│ 7️⃣ AUDIT       Append-Only Immutable Audit Log — Every Rupee Has a Receipt                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

> **Zero Fake Data in the Money Path:** Webhooks, payment links, payment retries, and recovery confirmations use **100% real Razorpay TEST MODE APIs**. Communication channels without active credentials operate in explicit, visually-labeled `SIMULATED` modes.

---

## 💡 Why This Matters (The Product Bar)

RecoverIQ Pro is built to clear a strict production bar — real money, real compliance, real auditability, and real Indian-language voice:

| Product Bar | 🎯 How RecoverIQ Pro Solves & Exceeds It | Implementation Proof |
|---|---|---|
| **💰 Money Recovered (Measured)** | Real-time WebSocket financial counters tracking *At Risk ₹*, *Recovered ₹*, and *Recovery Rate %*. Recovery is confirmed exclusively when a Razorpay webhook returns `payment_link.paid`. | `backend/app/services/events.py`<br>`frontend/app/page.jsx` |
| **⬆️ Escalation (Human-in-the-Loop)** | High-value payments (**> ₹10,000**) or low AI confidence (**< 70%**) are automatically routed to the **Approvals Queue**. No automated action fires until a human merchant approves. | `backend/app/agents/pipeline.py`<br>`frontend/app/approvals/page.jsx` |
| **🛑 Stopping Rules (Compliance)** | Strictly enforced compliance: Max 3 retries/payment, 48h minimum wait for insufficient funds, 9 PM–9 AM IST quiet hours, customer opt-outs, and immediate `STOP` on fraud/dispute codes. | `backend/app/agents/pipeline.py`<br>`frontend/app/plan/page.jsx` |
| **🧾 Audit Trail (Explainability)** | Every decision step, policy check, LLM prompt/response, and external API call ID is written to an **append-only PostgreSQL table**. Merchants and auditors can click any payment on the Timeline page to see its complete history. | `backend/app/models.py`<br>`frontend/app/timeline/page.jsx` |
| **🤖 Autonomous Agentic Behavior** | 7 specialized agents operating in an asynchronous pipeline with background retry workers (arq + Redis) and real AI telephony in Telugu/Hinglish. | `backend/app/worker.py`<br>`backend/app/services/gnani.py`<br>`backend/app/services/voice.py` |

---

## 🎙️ Gnani AI Integration & Models Used

RecoverIQ Pro treats speech as a first-class recovery channel, not a demo add-on. The integration lives in one small service (`backend/app/services/gnani.py`) and is called by the agent pipeline, the background worker, the TwiML endpoints, and the Call Console.

### Request flow for a live recovery call

```
arq worker / agent pipeline
        │  script + customer language
        ▼
backend/app/services/voice.py
        │  provider = gnani
        ▼
backend/app/services/gnani.py ──► POST https://api.vachana.ai/api/v1/tts/inference
        │                          X-API-Key-ID: <GNANI_API_KEY>
        │                          model: timbre-v2.5
        │                          voice: Suhana / Nalini / Poorvi / Kaveri
        ▼
Twilio Programmable Voice
        │  fetches GET /api/twiml/voice
        ▼
<Response><Play>/api/twiml/audio?...</Play></Response>
        │
        ▼
Customer hears Gnani Timbre in Telugu / Hindi / Hinglish / English
        │
        ▼
Call recording ──► POST /api/voice/transcribe ──► Gnani Prisma v3.0
                                                  (transcript + detected language)
```

### Text-to-Speech (Timbre v2.5)

```python
payload = {
    "text": script,
    "voice": "Suhana",          # per-language default
    "model": "timbre-v2.5",
    "language": "te-IN",
    "speed": 1.0,
    "audio_config": {
        "sample_rate": 22050,
        "num_channels": 1,
        "container": "mp3",
        "bitrate": "128k",
    },
}
```

* **Language mapping:** the app stores short codes (`te`, `hi`, `en`, `hi-en`) and maps them to Gnani locales (`te-IN`, `hi-IN`, `en-IN`, `hi-en`).
* **Voice selection:** per-language defaults, with an optional `GNANI_TTS_VOICE` override.
* **Cache:** a 32-entry in-process cache keyed by `(text, language, model, voice)` avoids duplicate synthesis on retries.

### Speech-to-Text (Prisma v3.0)

`POST /api/voice/transcribe` accepts base64 audio from the dashboard or worker and forwards it to Gnani's `/stt/v3` endpoint with `model=prisma-v3.0` and `language_code=indic-auto`. Prisma returns the transcript plus `detected_language_code`, which is stored for audit and follow-up.

### Live verification (submission build)

| Check | Result |
|---|---|
| Telugu TTS (`te-IN`, Suhana) | ✅ 177,632-byte MP3 |
| Hinglish TTS (`hi-en`, Poorvi) | ✅ 126,641-byte MP3 |
| English TTS (`en-IN`, Kaveri) | ✅ 126,641-byte MP3 |
| TwiML response | ✅ `<Play>https://…/api/twiml/audio?script=…&lang=te-IN</Play>` |
| Twilio audio endpoint | ✅ `audio/mpeg` with a valid MP3 header |
| Telugu STT (`prisma-v3.0`, `indic-auto`) | ✅ transcript returned, `detected_language_code: te-IN` |
| `GET /api/system/status` | ✅ `{"provider":"gnani","model":"timbre-v2.5","stt_model":"prisma-v3.0"}` |

### Failure handling

| Failure | Behaviour |
|---|---|
| `GNANI_API_KEY` missing | Call Console marks the call `NOT_CONFIGURED`; Twilio falls back to `<Say>`; no fake audio is stored. |
| Gnani returns `401` / `402` | The call is marked `TTS ERROR`, the error is logged, and the optional ElevenLabs fallback or Twilio `<Say>` is used. |
| Gnani timeout / network error | Retried by the normal recovery workflow; the customer still receives SMS/email/WhatsApp outreach. |

---

## ✅ Capability Matrix — Revenue Recovery Coverage

| # | Revenue Recovery Capability | RecoverIQ Pro Solution | Target Code / Route | UI Location |
|---|---|---|---|---|
| **1** | **Payment Degradation & Root Cause Diagnosis** | Ingests 50+ real Razorpay error codes (`BAD_REQUEST_PAYMENT_TIMED_OUT`, `INSUFFICIENT_FUNDS`, etc.), maps category, and runs LLM 2nd opinion. | `backend/app/error_codes.py`<br>`POST /api/events` | Dashboard (`/`) & Diagnoses (`/diagnoses`) |
| **2** | **Checkout Drop-Off & Abandonment Recovery** | GreenBasket storefront captures tab-switch/close signals via `visibilitychange`/`pagehide` beacons, generates Razorpay links, and auto-recovers on order completion. | `frontend/hooks/useAbandonmentTracker.js`<br>`POST /api/checkouts/abandon` | GreenBasket Store (`/store`) & Diagnoses (`/diagnoses`) |
| **3** | **Failed-Subscription Mandate Recovery** | Mandate failure simulator with 7 risk failure codes (`CARD_EXPIRED`, `CARD_INACTIVE`, etc.) + polite WhatsApp/SMS/Email outreach + optional 24h AI Voice caller scheduler. | `backend/app/api/routes.py`<br>`POST /api/subscriptions/{id}/simulate-autopay-failure` | Subscribers & Delivery (`/subscriptions`) |
| **4** | **B2B Receivables Automated Chaser** | 7-stage aging escalation ladder (Pre-due reminder → Overdue notice → SMS/WhatsApp → Promise-to-pay link → Tier-4 AI Voice call). | `backend/app/api/routes.py`<br>`POST /api/receivables/invoices/{id}/simulate-stage` | B2B Receivables (`/receivables`) |
| **5** | **Promise-to-Pay (P2P) Commitment Tracker** | Customer self-service portal (`/p2p/[id]`) allowing clients to commit to payment within 7 days. Daily worker flags broken promises for auto-recovery. | `backend/app/worker.py`<br>`POST /api/p2p/{id}/submit` | Promises to Pay (`/promises`) |
| **6** | **Mandate Retry Sequencer** | Intelligent retry delay calculator (+48h for low balance, +2h for network, quiet hours adjustment, retry caps). | `backend/app/agents/pipeline.py`<br>`backend/app/worker.py` | Recovery Plan (`/plan`) |
| **7** | **Hinglish / Telugu AI Voice Agent** | Self-hosted TwiML engine making real Twilio calls powered by **Gnani Timbre TTS** (Telugu, Hinglish, Hindi, English) for high-value orders (> ₹10,000). | `backend/app/services/gnani.py`<br>`backend/app/services/voice.py`<br>`GET /api/twiml/voice` | Call Console (`/calls`) |
| **🏆** | **THE BAR (Money, Escalation, Stopping, Audit)** | WebSocket live metrics, merchant Approvals Queue, deterministic Policy Guard, and immutable Timeline audit trail. | `backend/app/agents/pipeline.py`<br>`backend/app/models.py` | All Dashboard Pages |

---

## 🏗️ System Architecture

RecoverIQ Pro is built as a containerized, event-driven microservices system designed for low latency, high resilience, and audit compliance.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND LAYER (Next.js 14)                               │
│  ┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐  │
│  │ Merchant Dashboard UI     │   │ GreenBasket Storefront    │   │ Floating AI Copilot   │  │
│  │ (App Router / Tailwind)   │   │ (Checkout Abandon Tracker)│   │ (Live DB Assistant)   │  │
│  └─────────────┬─────────────┘   └─────────────┬─────────────┘   └───────────┬───────────┘  │
└────────────────┼───────────────────────────────┼─────────────────────────────┼──────────────┘
                 │ HTTP API                      │ Beacon / Fetch              │ HTTP / WS
                 ▼                               ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND LAYER (FastAPI)                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  API Gateway & Routers (/api/v1 — 60+ endpoints)                                       │  │
│  └──────────────────────────────────────────┬────────────────────────────────────────────┘  │
│                                             │                                               │
│  ┌──────────────────────────────────────────▼────────────────────────────────────────────┐  │
│  │  7-Agent Autonomous Pipeline (Ingestion → Diagnosis → Strategy → Policy → Execution)  │  │
│  └───────┬──────────────────────────────────┬──────────────────────────────────┬─────────┘  │
└──────────┼──────────────────────────────────┼──────────────────────────────────┼────────────┘
           │ SQL (Async)                      │ Pub/Sub                          │ Enqueue Jobs
           ▼                                  ▼                                  ▼
┌──────────────────────┐           ┌──────────────────────┐           ┌──────────────────────┐
│ PostgreSQL 16 DB     │           │ Redis 7 In-Memory    │           │ arq Async Worker     │
│ - 19 Relational      │           │ - WebSocket Pub/Sub  │           │ - Scheduled Retries  │
│   Tables             │           │ - Live Realtime Feed │           │ - 24h Voice Scheduler│
│ - Append-Only Audit  │           │ - Event Caching      │           │ - P2P Expiry Scans   │
└──────────────────────┘           └──────────────────────┘           └──────────┬───────────┘
                                                                                 │
                                                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               EXTERNAL INTEGRATIONS & SERVICES                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐  │
│  │ Razorpay     │   │ Twilio Voice │   │ Twilio SMS / │   │ Resend Email │   │ Gnani AI  │  │
│  │ Test Mode API│   │ (TwiML Engine│   │ WhatsApp API │   │ Delivery API │   │TTS + STT  │  │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └───────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 The 7-Agent Autonomous Pipeline

Every payment failure or revenue risk event passes through 7 specialized agents operating sequentially:

```mermaid
graph TD
    A[Event Ingestion: Webhook / Storefront] --> Agent1[1. Revenue Monitor Agent]
    Agent1 --> Agent2[2. Root Cause & Risk Diagnosis Agent]
    Agent2 --> Agent3[3. Recovery Strategist Agent]
    Agent3 --> Agent4[4. Deterministic Policy Guard Agent]
    Agent4 -->|ALLOW| Agent5[5. Multi-Channel Execution Agent]
    Agent4 -->|APPROVAL_REQUIRED| Appr[Human Approvals Queue]
    Agent4 -->|BLOCK / STOP| Agent7[7. Append-Only Audit Agent]
    Appr -->|Approved| Agent5
    Agent5 --> Agent6[6. Outcome & Reconciliation Agent]
    Agent6 -->|Payment Confirmed| Rec[State: RECOVERED]
    Agent6 --> Agent7
    Rec --> Agent7
```

### Agent Roles & Responsibilities:

1. **Agent 1 — Revenue Monitor Agent:** Ingests failure payloads from Razorpay webhooks, subscription mandate failures, B2B overdue invoices, or storefront abandonments. Standardizes data into a `FailureEvent` record and broadcasts real-time financial metrics over WebSockets.
2. **Agent 2 — Root Cause & Risk Diagnosis Agent:** Queries an extensive 50+ Razorpay error-code dictionary (`error_codes.py`) to categorize the failure (e.g., `TRANSIENT_USER`, `PERMANENT_CARD`, `GATEWAY_DOWN`). Passes context to Claude 3.5 Sonnet or Gemini 1.5 Pro to generate a human-readable diagnosis and a **0–100% Confidence Score**.
3. **Agent 3 — Recovery Strategist Agent:** Evaluates customer history, payment amount, and failure category to select **exactly one action** from the Fixed Action Set (Set A–G).
4. **Agent 4 — Deterministic Policy Guard Agent:** A hard-coded, pure Python policy engine. It validates the strategist's proposed action against merchant compliance rules. **The LLM cannot bypass or alter this agent.** Output is strictly `ALLOW`, `APPROVAL_REQUIRED`, or `BLOCK`.
5. **Agent 5 — Multi-Channel Execution Agent:** Executes the approved action: generates a real Razorpay payment link (`notify: {sms: True, email: True}`), triggers Twilio WhatsApp messages, dispatches Resend transactional emails, or schedules arq background retry jobs.
6. **Agent 6 — Outcome & Reconciliation Agent:** Listens for incoming Razorpay `payment_link.paid` or storefront order completion webhooks. Matches the token, updates event status to `RECOVERED`, calculates total recovery duration, and updates live revenue counters.
7. **Agent 7 — Append-Only Audit Agent:** Records an immutable audit log entry for every step taken by agents 1 through 6, ensuring total explainability for merchants and compliance auditors.

---

## ♟️ The Fixed Action Contracts (Set A–G)

To guarantee safety and prevent AI hallucination, the Recovery Strategist is restricted to selecting from 7 predefined, strongly-typed action contracts:

| Contract ID | Action Name | Execution Logic & Channels | Applicable Scenario |
|---|---|---|---|
| **Action A** | `SMART_RETRY` | Schedules automated background mandate retry via arq + Redis. Applies +48h delay for insufficient funds and +2h for network timeouts. | Temporary bank outage, gateway timeout, or insufficient balance. |
| **Action B** | `CHECKOUT_RECOVERY` | Generates a Razorpay payment link and dispatches multi-channel outreach via SMS, Email, and WhatsApp. | Abandoned carts, cart drop-offs, expired checkout sessions. |
| **Action C** | `SUBSCRIPTION_RECOVERY` | Sends a customer portal link for instant card/UPI mandate update along with polite messaging. | Failed recurring auto-pay charges, expired card tokens. |
| **Action D** | `INVOICE_REMINDER` | Sends B2B overdue invoice reminder with an embedded Promise-to-Pay (P2P) date selection link. | Overdue B2B accounts receivable invoices (Stages 1–3). |
| **Action E** | `VOICE_RECOVERY` | Initiates an automated AI Voice call via Twilio & **Gnani Timbre** (in Telugu, Hinglish, Hindi, or English). **Strictly gated for order values > ₹10,000.** | High-value abandoned checkouts or Stage 4+ overdue B2B invoices. |
| **Action F** | `ESCALATE` | Routes the event to the merchant **Approvals Queue** with full AI diagnostic context for manual review. | AI confidence < 70%, high-risk signals, or high-value threshold breach. |
| **Action G** | `STOP` | Ceases all recovery attempts immediately. Logs reason as permanent failure. | Opted-out customers, max retry limit reached (3), fraud/dispute codes. |

---

## 🛡️ Deterministic Policy Guard — Hard-Coded Compliance Rules

The Policy Guard (`backend/app/agents/pipeline.py`) acts as an un-bypassable firewall around the AI. No matter what the LLM suggests, the Policy Guard enforces code-level rules:

```python
# Pure Python Enforcement — Zero LLM Involvement
IF customer.is_opted_out == True               ──► Verdict: BLOCK (Reason: Customer Opted Out)
IF event.retry_count >= 3                      ──► Verdict: BLOCK (Reason: Max Retries Reached)
IF event.error_code IN FRAUD_OR_DISPUTE_CODES   ──► Verdict: BLOCK (Reason: Fraud/Dispute Hard Stop)
IF event.amount >= 10000_00 AND action == VOICE ──► Verdict: APPROVAL_REQUIRED (Reason: High-Value Gate)
IF ai_confidence < 70                           ──► Verdict: APPROVAL_REQUIRED (Reason: Low Confidence)
IF current_time IN QUIET_HOURS (9 PM - 9 AM)    ──► Verdict: DELAY (Reschedule to 9:01 AM IST)
```

### Policy Rules Summary Table:

| Rule Category | Rule Specification | Enforcement Mechanism |
|---|---|---|
| **Max Retry Cap** | Maximum 3 retries per payment failure event. | Hard `BLOCK` on 4th attempt. |
| **Retry Backoff Gap** | Minimum 48 hours for `INSUFFICIENT_FUNDS`; 2 hours for `NETWORK_ERROR`. | Scheduled in Redis via arq worker. |
| **Quiet Hours** | No SMS, WhatsApp, or Voice calls between 9:00 PM and 9:00 AM IST. | Rescheduled to next 9:01 AM IST window. |
| **High-Value Gate** | Any recovery action involving order value **> ₹10,000** requires merchant sign-off. | Event placed in `awaiting_approval` status. |
| **AI Voice Gating** | Phone calls allowed **only for order value > ₹10,000** or Stage 4+ B2B invoices. | Rejects voice calls for low-value carts to prevent telephony cost waste. |
| **Shopping Abandonment Gate** | Checkout abandonments **never** trigger phone calls (SMS/WhatsApp/Email only). | Enforced in `useAbandonmentTracker` & pipeline logic. |
| **Opt-Out Compliance** | Customers requesting stop are permanently suppressed across all channels. | Flag set in PostgreSQL `customers` table. |

---

## 🚀 End-to-End Feature Deep Dives

### 1. GreenBasket Storefront & Intent-Driven Abandonment Tracking

RecoverIQ Pro includes a fully functional e-commerce storefront called **GreenBasket** (`/store`), built with Next.js, interactive cart management, and Razorpay checkout integration.

* **Intent-Driven Abandonment Detection:** Unlike naive systems that trigger recovery on simple mouse movement, RecoverIQ Pro tracks true exit intent by listening to `visibilitychange` (tab switch) and `pagehide` (tab close) events via the HTML5 Beacon API (`navigator.sendBeacon`).
* **Single-Send Architecture:** Guarantees that only one abandonment signal is dispatched per shopping session, eliminating duplicate event noise.
* **Seamless Auto-Recovery:** When a customer completes their order on the storefront, the backend automatically locates any open abandonment record for that session and marks it `RECOVERED`.

```
  Shopper adds items to GreenBasket cart
                   │
                   ▼
     Shopper switches tab / closes tab
                   │
                   ▼
  HTML5 Beacon sends payload to /api/checkouts/abandon
                   │
                   ▼
  Pipeline generates Razorpay Payment Link & dispatches WhatsApp / Email
                   │
                   ▼
  Shopper clicks link & completes payment  ──►  Auto-marked RECOVERED 🟢
```

---

### 2. Subscription Mandate Auto-Pay Failure Engine (7 Risk Codes)

Subscription revenue is the lifeblood of recurring SaaS and D2C businesses. On the **Subscribers & Delivery** page (`/subscriptions`), merchants can simulate next-month recurring auto-pay failures across 7 real-world error codes:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SELECT AUTO-PAY FAILURE RISK CODE MODAL                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  (•) 💳 INSUFFICIENT_FUNDS      Low balance in customer bank account           │
│  ( ) 💳 CARD_EXPIRED            Debit/Credit card validity expired              │
│  ( ) ⏱️ PAYMENT_TIMED_OUT       Bank gateway session timeout                    │
│  ( ) 🚫 CARD_INACTIVE           Card inactive or mandate disabled               │
│  ( ) 🌐 NETWORK_ERROR           Inter-bank network communication error          │
│  ( ) 🌍 INTL_BLOCKED            International transaction policy restriction    │
│  ( ) 🔒 AUTHENTICATION_FAILED   3DS 2FA mandate authentication failed           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

* **Immediate Multi-Channel Outreach:** Triggering a failure flips subscription status to `NOT_PAID_YET` and instantly dispatches polite SMS, Email, and WhatsApp notifications containing a Razorpay payment link.
* **Scheduled 24-Hour AI Voice Follow-Up:** Includes a dedicated **`📞 24h AI Voice Call (Follow-Up)`** trigger. If the customer does not clear the dues within 24 hours, an automated voice call is placed to their phone in Telugu/Hinglish. If the customer pays in the interim, the background job detects the payment and **cancels the call**.

---

### 3. B2B Receivables Chaser & 7-Stage Escalation Ladder

For B2B merchants managing large accounts receivable balances, RecoverIQ Pro implements an automated 7-stage escalation matrix (`/receivables`):

```
Stage 1: Pre-Due Reminder (3 Days Before Due Date) ──► Gentle Email
Stage 2: Due Date Payment Notice                   ──► Email + SMS
Stage 3: 2 Days Overdue Notice                     ──► WhatsApp + Payment Link
Stage 4: 5 Days Overdue Escalation                 ──► Promise-to-Pay (P2P) Link
Stage 5: 8 Days Overdue Tier-4 Escalation          ──► AI Voice Agent Call (Telugu/Hinglish)
Stage 6: 15 Days Overdue Critical Warning          ──► Formal Legal/Late Fee Notice
Stage 7: 30+ Days Default & Collection             ──► Merchant Escalation & Credit Hold
```

Merchants can run a live one-click simulation of any stage directly from the Receivables dashboard to observe agent responses.

---

### 4. Self-Service Promise-to-Pay (P2P) Portal

When B2B clients receive overdue notices, they are provided a link to the self-service **Promise-to-Pay Portal** (`/p2p/[id]`):

* **Strict Date Selection:** Clients can select a committed payment date **strictly within 7 days**.
* **Automatic Status Tracking:** Submitting a commitment updates the invoice status to `PROMISED` and pauses aggressive automated chasers.
* **Broken Promise Engine:** An arq background job runs daily at midnight. If a promised date passes without payment reconciliation, the system automatically marks the promise as `BROKEN`, elevates the invoice to Stage 5, and triggers an AI Voice Call.

---

### 5. Telephony Engine & AI Voice Caller (Telugu / Hinglish / English)

RecoverIQ Pro features a native, self-hosted TwiML telephony server (`backend/app/services/voice.py`) integrated with Twilio Programmable Voice and **Gnani AI Timbre Text-to-Speech** (`backend/app/services/gnani.py`):

* **Gnani Timbre TTS:** Telugu/Hinglish/Hindi/English speech is synthesised by Gnani's `timbre-v2.5` model (default voices: Suhana for Telugu, Nalini for Hindi, Kaveri for English, Poorvi for Hinglish).
* **Self-Hosted TwiML:** Twilio fetches instructions from `/api/twiml/voice`, which returns a `<Play>` pointing at the Gnani audio served by `/api/twiml/audio`. If Gnani is not configured, it gracefully falls back to Twilio's `<Say>` voice.
* **Localized Multilingual Scripts:** Supports fluent Telugu, Hinglish, and English scripts tailored for Indian e-commerce customers.
* **Link-Safe Scripting:** Voice scripts **never read long payment URLs aloud**. Instead, the AI agent politely informs the customer:
  > *"Namaste Jaswanth gaaru! Direct follow-up call from GreenBasket. Mee monthly subscription payment pending lo undi. Mee WhatsApp mariyu Email ki payment link pampamu. Kindha pampina link click chesi payment complete cheyandi. Dhanyavaadalu!"*
* **In-Browser Audio Preview:** The Call Console (`/calls`) allows merchants to review call logs and play the generated Gnani audio clips directly in the browser.
* **Gnani Prisma STT (bonus):** `POST /api/voice/transcribe` transcribes call recordings with Gnani Prisma and auto-detects Indian languages.

---

### 6. Multi-Channel Messaging & Itemized WhatsApp Greetings

RecoverIQ Pro integrates Twilio WhatsApp API and Resend Email API to deliver rich, contextual communications:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WHATSAPP ORDER CONFIRMATION                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 🌿 GreenBasket Order Confirmed!                                                │
│                                                                                 │
│ Hello Jaswanth Nelluru, thank you for your order #ORD-8821!                     │
│                                                                                 │
│ 🛍️ Ordered Items:                                                              │
│ • Farm Fresh Milk (A2 Cow) — 2 x ₹60.00 = ₹120.00                              │
│ • Organic Tomatoes — 1 x ₹40.00 = ₹40.00                                       │
│                                                                                 │
│ 💳 Total Amount: ₹160.00 (PAID via UPI)                                         │
│ 📍 Delivery Address: Flat 402, Green Glen Towers, Hyderabad                    │
│ 🚚 Delivery Status: ON THE WAY                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 7. Embedded AI Copilot Assistant

Accessible via a floating widget at the bottom-right of every dashboard page (`frontend/components/CopilotWidget.jsx`):

* **Live Database Context:** Powered by an active database query engine that retrieves live metrics (*total revenue at risk, current recovery rate, pending approvals, broken promises*) before generating responses.
* **Multilingual Chat:** Communicates naturally in Hinglish, Telugu, and English.
* **Full History Persistence:** Conversations are saved in the `copilot_messages` table across sessions.

---

## 📡 Multi-Channel Communication Audit (Real vs Simulated)

RecoverIQ Pro adheres to strict engineering honesty. We clearly distinguish between real external API dispatches and simulated demonstration fallbacks:

| Channel | Service Provider | Real / Simulated Status | Notes & Operational Details |
|---|---|---|---|
| 💳 **Payment Links** | Razorpay Test Mode API | 🟢 **100% REAL** | Real payment links generated; webhook confirmations drive actual state transitions. |
| 📞 **Voice Calls** | Twilio Programmable Voice + Gnani AI | 🟢 **100% REAL** | Places actual phone calls; Twilio fetches our TwiML, which plays Gnani Timbre neural audio. |
| 🗣️ **Voice TTS Audio** | Gnani AI Timbre API | 🟢 **100% REAL** | Renders realistic Telugu/Hinglish/Hindi/English audio; ElevenLabs is an optional fallback, and Twilio `<Say>` is the last resort if neither is configured. |
| 📝 **Call Transcription** | Gnani AI Prisma API | 🟢 **100% REAL** | `prisma-v3.0` transcribes call recordings and auto-detects Indian languages. |
| ✉️ **Email Outreach** | Resend API + Razorpay Notify | 🟢 **100% REAL** | Transmits actual HTML emails to verified customer email addresses. |
| 💬 **WhatsApp Messages** | Twilio WhatsApp API | 🟢 **100% REAL** | Delivers real WhatsApp messages (requires customer opt-in session on Twilio Sandbox). |
| 📱 **SMS Outreach** | Twilio SMS API | 🟡 **REAL / SIMULATED** | Real API call made; Indian DLT template restrictions on trial accounts log graceful notice. |
| 🧠 **LLM Reasoning** | Claude 3.5 / Gemini 1.5 / OpenRouter | 🟢 **100% REAL** | Real API calls for diagnosis & copilot; falls back to rule map if keys are omitted. Gnani Evon is **not** used in this build. |

---

## 💥 Graceful Degradation & Honesty Architecture

RecoverIQ Pro is engineered to handle real-world infrastructure failures without crashing or losing data:

1. **LLM API Timeout / Quota Exhaustion:** If Claude or Gemini API calls fail, the system seamlessly falls back to the deterministic 50+ error code rule map (`error_codes.py`). The audit log records: `"LLM unavailable — applied rule map fallback"`.
2. **Low AI Confidence (< 70%):** The strategist agent refuses to execute autonomous actions on low-confidence predictions, routing the event to human merchant review in the Approvals Queue.
3. **Razorpay Webhook Downtime:** If webhooks are delayed, background arq polling workers periodically sync payment status directly with Razorpay REST APIs.
4. **Missing Optional Credentials:** If the Gnani API key (or the optional Resend key) is omitted in `.env`, the system gracefully downgrades that specific channel to `SIMULATED` mode while keeping the rest of the application fully operational.

---

## 🗺️ Key UI Pages Map

| Page Title | Route | Core Functionality & Purpose |
|---|---|---|
| **Dashboard** | `/` | Real-time WebSocket financial counters (*At Risk, Recovered, Recovery Rate*), quick failure injectors, batch pipeline runner. |
| **Diagnoses** | `/diagnoses` | Live pipeline run view, agent diagnostic breakdowns, policy verdicts, and action statuses. |
| **Subscribers & Delivery** | `/subscriptions` | Subscription mandate tracker, 7-code auto-pay failure simulator, 24h voice call scheduler, customer order history. |
| **B2B Receivables** | `/receivables` | Aging buckets (0–30, 31–60, 61–90, 90+ days), 7-stage escalation simulator, invoice management. |
| **Promises to Pay** | `/promises` | Active P2P commitments tracker, broken promise detector, customer promise history. |
| **Approvals Queue** | `/approvals` | Human-in-the-loop escalation panel for high-value (> ₹10,000) or low-confidence (< 70%) recovery actions. |
| **Recovery Plan** | `/plan` | Policy configuration panel, quiet hours settings, retry backoff calculators, channel priority toggles. |
| **Timeline** | `/timeline` | Immutable, append-only audit trail per failure event. Click any payment to view its complete execution history. |
| **Call Console** | `/calls` | Telephony log, call status tracker, Gnani Timbre Telugu/Hinglish audio player. |
| **Recovery Report** | `/report` | Measured recovery analytics, policy violation checks (0%), channel attribution breakdown. |
| **Settings** | `/settings` | Merchant policy controls, threshold adjustments, API channel connection status monitors. |
| **GreenBasket Store** | `/store` | Customer-facing storefront with persistent cart, intent-driven abandonment tracker, and Razorpay checkout. |

---

## 🗄️ Database Schema & 19 Tables Map

RecoverIQ Pro uses a robust PostgreSQL 16 relational database structure comprising 19 interconnected tables:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   RECOVERIQ PRO DATABASE SCHEMA                             │
├───────────────────────────────┬───────────────────────────────┬─────────────────────────────┤
│ Core Entities                 │ Recovery Pipeline             │ Domain Modules              │
├───────────────────────────────┼───────────────────────────────┼─────────────────────────────┤
│ • merchants                   │ • failure_events              │ • subscriptions             │
│ • customers                   │ • diagnoses                   │ • checkout_abandonments     │
│ • payments                    │ • decisions                   │ • one_time_orders           │
│ • recovery_policies           │ • policy_checks               │ • b2b_invoices              │
│                               │ • actions                     │ • promise_to_pay            │
│                               │ • outcomes                    │ • copilot_messages          │
│                               │ • voice_calls                 │ • degradation_alerts        │
│                               │ • audit_log (append-only)     │                             │
└───────────────────────────────┴───────────────────────────────┴─────────────────────────────┘
```

### Core Invariants:
* `audit_log` is strictly **append-only** — records cannot be updated or deleted.
* `failure_events.status` follows a strict state machine: `detected` → `diagnosed` → `gated` → (`awaiting_approval`) → `acting` → `recovered` / `stopped` / `escalated`.
* `checkout_abandonments` enforces session deduplication with closed-record protection.

---

## 🔌 API Reference (Categorized)

Below is a highlight of key API endpoints. Access full interactive OpenAPI Swagger documentation at `http://localhost:8000/docs`.

### 1. Ingestion & Event Pipeline
* `POST /api/events` — Ingest a raw payment failure event and trigger the 7-agent pipeline.
* `POST /api/checkouts/abandon` — Ingest storefront checkout abandonment via HTML5 Beacon.
* `GET /api/metrics` — Retrieve real-time aggregate financial metrics (*At Risk, Recovered, Recovery Rate*).
* `WS /api/ws` — Real-time WebSocket feed for live metric updates and event broadcasts.

### 2. Subscriptions & Mandates
* `POST /api/subscriptions` — Create a new recurring customer subscription.
* `POST /api/subscriptions/{id}/simulate-autopay-failure` — Simulate mandate failure with one of 7 risk codes.
* `POST /api/subscriptions/{id}/trigger-24h-voice-call` — Schedule or immediately trigger a 24h AI Voice follow-up call.

### 3. B2B Receivables & P2P
* `POST /api/receivables/invoices/{id}/simulate-stage` — Simulate B2B escalation (Stages 1–7).
* `POST /api/p2p/{id}/submit` — Submit a customer Promise-to-Pay commitment date.

### 4. Approvals & Voice Telephony (Gnani AI + Twilio)
* `POST /api/approvals/{event_id}/approve` — Approve a gated high-value or low-confidence action.
* `POST /api/approvals/{event_id}/reject` — Reject a proposed action and mark event `STOPPED`.
* `GET /api/twiml/voice` — Serve dynamic TwiML; returns `<Play>` for Gnani Timbre audio or `<Say>` fallback.
* `GET /api/twiml/audio` — Gnani Timbre TTS audio stream fetched by Twilio during a live call.
* `GET /api/calls` — List voice calls shown in the Call Console.
* `GET /api/calls/{id}/audio` — Base64 MP3 for in-browser playback.
* `POST /api/calls/generate-test` — Generate a Gnani Timbre sample and store it in the Call Console.
* `POST /api/voice/transcribe` — Transcribe a base64 call recording with Gnani Prisma (STT).
* `GET /api/system/status` — Shows the live voice provider (`gnani`), TTS model, and STT model.

---

## 🧭 Production Design Decisions & Trade-offs

| Design Choice | Rationale & Engineering Advantage | Trade-off Accepted |
|---|---|---|
| **Fixed Action Contracts (Set A–G)** | Guarantees safety and zero LLM action hallucination in production. | Slightly restricts LLM creativity in generating novel action types. |
| **Deterministic Policy Guard Outside LLM** | Compliance rules (retry caps, quiet hours) must be mathematically non-bypassable. | Requires maintaining pure Python policy evaluation logic. |
| **Value Gate on AI Voice Calls (> ₹10,000)** | Mirrors human economics: reserves expensive telephony for high-margin recovery. | Low-value carts do not receive automated phone calls. |
| **Exit-Intent Only Abandonment Tracking** | Prevents fake "amount at risk" inflation while shoppers are actively browsing. | Requires HTML5 Beacon API support on customer browsers. |
| **Redis arq Worker for Deferred Jobs** | Guarantees 24-hour scheduled retries and voice calls survive server restarts. | Adds Redis dependency to the container infrastructure stack. |

---

## ⚡ Quick Start (One Command)

### Prerequisites:
* Docker & Docker Compose installed.
* **Gnani AI API key** — required for Timbre TTS and Prisma STT. Registered challenge participants receive 5,000 programme credits. Get a key at [app.gnani.ai/voice](https://app.gnani.ai/voice).
* **Razorpay Test Mode keys** — optional; required only for real payment links and webhook-driven recovery. Free at [dashboard.razorpay.com](https://dashboard.razorpay.com).

### Step 1: Environment Setup
```bash
# Clone repository
git clone https://github.com/Jaswanth-arjun/recoveriq-pro.git
cd recoveriq-pro

# Create environment configuration
cp .env.example .env
```

### Step 1b: Enable the Gnani AI voice model
The voice channel uses **Gnani AI** (sponsor model) for Text-to-Speech and Speech-to-Text:

```env
GNANI_API_KEY=your_gnani_api_key_here
GNANI_TTS_MODEL=timbre-v2.5
GNANI_TTS_VOICE=            # blank => auto: te-IN=Suhana, hi-IN=Nalini, en-IN=Kaveri, hi-en=Poorvi
GNANI_STT_MODEL=prisma-v3.0
VOICE_PROVIDER=gnani
```

* Get a key at [app.gnani.ai/voice](https://app.gnani.ai/voice), docs at [docs.gnani.ai](https://docs.gnani.ai).
* Verify the backend sees it: `GET /api/system/status` → `"voice": {"provider": "gnani", "status": "connected"}`.
* Without a key, the Call Console still works but every call is labelled `NOT_CONFIGURED`; Twilio falls back to `<Say>` for live calls.

### Step 1c: Verify Gnani is live

```bash
curl http://localhost:8000/api/system/status
```

Expected voice block:

```json
{
  "voice": {
    "status": "connected",
    "provider": "gnani",
    "model": "timbre-v2.5",
    "stt_model": "prisma-v3.0"
  }
}
```

Generate a sample from the dashboard at `/calls` → **Generate Test Voice**, or directly:

```bash
curl -X POST http://localhost:8000/api/calls/generate-test \
  -H "Content-Type: application/json" \
  -d '{"text":"Namaste! Idi RecoverIQ Pro nundi automated call.","language":"te"}'
```

### Step 2: Launch via Docker Compose
```bash
docker compose up --build
```

### Service Access URLs:

| Service | Local URL | Description |
|---|---|---|
| 🖥️ **Merchant Dashboard** | `http://localhost:3000` | Full management dashboard & analytics. |
| 🥦 **GreenBasket Store** | `http://localhost:3000/store` | Customer storefront with checkout tracker. |
| 📚 **API Swagger Docs** | `http://localhost:8000/docs` | Interactive REST API documentation. |
| 🔌 **WebSocket Feed** | `ws://localhost:8000/api/ws` | Real-time live event stream. |

> **Telephony & Live Webhook Testing (Optional):** Run `start-ngrok.bat` to open a public tunnel to port 8000, and update `FRONTEND_URL` in `.env` with your ngrok URL for live Twilio TwiML callbacks.

---

## 🧰 Troubleshooting & FAQs

### Q1: Why does Twilio Voice say "Could not reach internal server"?
* **Cause:** Twilio cannot access `localhost:8000` directly over the public internet.
* **Fix:** Execute `start-ngrok.bat` to generate a public ngrok URL, and set `FRONTEND_URL=https://your-ngrok-subdomain.ngrok-free.app` in `.env`.

### Q1b: Gnani returns `401 INVALID_API_KEY` or `402 Insufficient credit`
* **Cause:** `GNANI_API_KEY` is missing/invalid, or the key has no TTS scope/credits.
* **Fix:** Confirm the key starts with the value from [app.gnani.ai/voice](https://app.gnani.ai/voice), restart the backend, and check `GET /api/system/status`. Until then the app degrades to ElevenLabs (if configured) or Twilio `<Say>`.

### Q2: Why are WhatsApp messages showing as pending on Twilio Trial?
* **Cause:** Twilio WhatsApp Sandbox requires a 24-hour user-initiated session.
* **Fix:** Send a WhatsApp message from your test phone to the Twilio Sandbox number (`+14155238886`) with the join code displayed in your Twilio Console once.

### Q3: How do I verify that recovery money is real and not simulated?
* **Verification:** Complete a payment using a generated Razorpay payment link in Test Mode. Observe the incoming Razorpay webhook signature verification in backend logs and the live increment on the Dashboard counter.

---

## ✅ Challenge Submission Checklist

Official requirements for the **Great Indian AI Internship Challenge**:

- [x] Working application that uses Gnani AI models/APIs — **Timbre v2.5 (TTS)** and **Prisma v3.0 (STT)**
- [x] Written project explanation — problem, solution, Gnani models, target users, and team contributions
- [x] Gnani AI models and APIs identified with implementation paths
- [x] Public GitHub repository with setup instructions
- [ ] Public demo video recorded on LinkedIn and/or X
- [ ] Video explains what was built and identifies the Gnani AI technology used
- [ ] Gnani AI official account tagged — [gnani.ai on LinkedIn](https://www.linkedin.com/company/gnani-ai) / [@GnaniAi on X](https://x.com/GnaniAi)
- [ ] `#GnaniAI` and `#GreatIndianAIInternshipChallenge` included in the post
- [ ] One nominated post per platform
- [ ] Video URL, post URLs, and repository link submitted through the programme page
- [ ] Submitted before **November 10, 2026** (final, no extensions)

> **Important:** tagging Gnani AI alone does not complete the entry. The demo/video, written explanation, Gnani models used, and the nominated post links must all be submitted through the programme page.

---

<div align="center">

**RecoverIQ Pro** — *The LLM thinks. Code acts. Every rupee has a receipt.* 🧾

Built with ❤️ for the **Gnani AI — Great Indian AI Internship Challenge**

`#GnaniAI` · `#GreatIndianAIInternshipChallenge`

</div>
