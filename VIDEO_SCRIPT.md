# 🎬 RecoverIQ Pro — Winning Video Presentation Script

> **Total length: ~9–10 minutes** · Spoken in English, natural and confident
> **Golden rule:** 50% showing on screen, 50% talking. Move the cursor slowly — judges' eyes must follow exactly what you're highlighting.

---

## 🎯 BEFORE RECORDING — Setup Checklist

- [ ] Docker stack UP: `docker compose up -d` (backend + frontend + db + worker)
- [ ] Fresh DB state: use the **Reset Data** button on the Dashboard
- [ ] Ngrok tunnel ON (`start-ngrok.bat`) — required for the live voice-call demo
- [ ] Browser tabs ready: Dashboard, Store, Subscriptions, Receivables, Timeline, Approvals
- [ ] Your phone nearby — for the live AI voice call moment
- [ ] Screen recording at 1080p, browser zoom 100%, dark theme (already ✅)

---

## 1️⃣ WHO I AM (0:00 – 0:30)

**[Screen: Dashboard home page — clean live counters]**

> "Hello judges! I'm [YOUR NAME] from [COLLEGE/COMPANY]. Today I'm presenting **RecoverIQ Pro** — an AI Revenue Recovery Agent built for Razorpay merchants.
>
> If I had to describe it in one line — **'The LLM thinks. Code acts. Every rupee has a receipt.'**
>
> This isn't a chatbot. It's a fully autonomous agentic system that actually recovers money — end to end, in production style. Let me show you."

💡 **Tip:** Start with confidence. The first 15 seconds win or lose the judges' attention.

---

## 2️⃣ PROJECT INTRODUCTION — The Problem & Why I Built This (0:30 – 1:30)

**[Screen: Dashboard counters — point the cursor at "AT RISK"]**

> "Merchants have an invisible problem. When a customer's payment fails — insufficient funds, expired card, UPI timeout — that money silently leaks away. The merchant doesn't know, the customer forgets, and the revenue never comes back.
>
> Studies show e-commerce merchants lose around **18% of revenue to checkout abandonment**. Subscription businesses bleed money every month through auto-pay failures. And in B2B, overdue invoices are everywhere — but follow-ups are manual, boring, and inconsistent.
>
> Here's why I chose this problem: **human follow-up doesn't scale.** A merchant with 10,000 customers cannot personally call each one. But an AI agent can — politely, compliantly, and at exactly the right time.
>
> That's RecoverIQ Pro: **DETECT → DIAGNOSE → DECIDE → GATE → ACT → RECOVER → AUDIT** — the full loop, end to end, built on real Razorpay TEST MODE APIs."

💡 **Tip:** Point at the "₹ at risk" counter and add: "This is live — updating in real time over WebSocket."

---

## 3️⃣ GREENBASKET STORE — Continue with Google (1:30 – 2:15)

**[Screen: Sidebar → click "🥦 Open GreenBasket Store" → /store page]**

> "Now the demo. Our merchant runs a demo storefront — **GreenBasket**, a fresh-groceries daily-delivery concept.
>
> **[Click the Continue with Google button]**
>
> The customer signs in with **Continue with Google** — real Google OAuth. This matters because in the real world, customer identity, order history, and recovery personalization all flow from this."

💡 **Tip:** Complete the Google popup sign-in on screen (1–2 seconds).

---

## 4️⃣ CHECKOUT ABANDONMENT → DIAGNOSES + 24-HOUR VOICE FEATURE + TIMELINE (2:15 – 4:00)

**[Screen: Add items in the store → switch tab → Dashboard → Diagnoses]**

> "Now, my star feature — **checkout abandonment recovery**.
>
> **[Add 2–3 items to the cart — let the prices be visible]**
>
> Watch carefully — **while I'm still shopping, the dashboard shows NO risk**. No fake signals. The system only reacts to real intent — the moment I **switch away from the tab** —
>
> **[Switch tab — wait 2 seconds — go back to the Dashboard, open Diagnoses]**
>
> There it is! The **Diagnoses page instantly shows the abandonment risk** — amount, items, session — everything. The pipeline has already run: Detect → Diagnose → Decide → Policy Gate → Act.
>
> **[Click the event to open its Timeline]**
>
> This is my **Timeline** — an append-only audit log of every agent step. If you ask *'Why did the AI take this action?'* — this is the answer: root cause, confidence score, policy verdict, the action taken, and the actual API call IDs. Every rupee has a receipt."

### ⚡ The 1-Hour / 24-Hour AI Voice Caller Feature

**[Screen: Subscriptions page → Trigger Auto-Pay Failure modal → checkbox]**

> "And what if the customer doesn't respond? **The AI Voice Caller.** After selecting an error code, the merchant can schedule — **24 hours later, the AI voice agent automatically calls the customer**. And here's the smart part: if the customer pays in the meantime, the scheduled job checks and **skips the call**.
>
> **[Tick the 'AI Voice Caller after 24 hrs' checkbox and confirm]**
>
> This is real scheduling — an arq deferred job in Redis. I can't wait 24 hours on camera, so there's also an immediate trigger button — the call goes out right now.
>
> **[Let the phone ring — answer it, play ~5 seconds of the voice]**
>
> Did you hear that? A polite Telugu-English voice — *'we've sent you the payment link via SMS and Email'* — the script deliberately never reads the link aloud. Professional, human-like, and the SMS itself carries the link."

💡 **Tip:** The live phone ring + voice playback is your WOW moment. Slow down and let judges hear it.

---

## 5️⃣ ONE-TIME SHOPPING DEMO (4:00 – 4:45)

**[Screen: Store → cart → checkout → place a COD order]**

> "Next, the complete purchase flow. I'll add items, open checkout, fill the address, and place a **Cash on Delivery** order.
>
> **[Place the order — the order code appears]**
>
> Order placed! And behind the scenes, the backend instantly handles payment-link generation, risk tracking, and delivery status — all automatic."

---

## 6️⃣ ORDER GREETING — EMAIL (4:45 – 5:15)

**[Screen: Open Gmail → show the order confirmation email]**

> "Right away, the customer receives a greeting message. On WhatsApp and Email — with every item, quantity, **price per item**, the total, the delivery address, and — look at this — **'Delivery Status: ON THE WAY'**.
>
> **[Scroll the email — make the item lines visible: 'Fresh Milk (1L) — Qty: 2 × ₹65 = ₹130']**
>
> Every rupee is transparent — the customer gets a complete receipt."

---

## 7️⃣ SUBSCRIPTION DEMO (5:15 – 6:00)

**[Screen: Store → select subscription → Razorpay checkout]**

> "Next — subscriptions. This is GreenBasket's core concept — a **daily fresh-delivery subscription**. Select the items and click Subscribe.
>
> **[Show the Razorpay checkout popup — point at the TEST MODE badge]**
>
> This is real **Razorpay TEST MODE** — mandate creation, auto-pay setup — all real API calls. Completing the payment now."

---

## 8️⃣ SUBSCRIPTION GREETING — EMAIL (6:00 – 6:20)

**[Screen: Gmail → subscription confirmation email]**

> "Once subscribed, the greeting email arrives: subscribed items with quantity and price, the **Daily Basket amount per day**, the **Monthly Total**, and the 6 AM delivery schedule. Complete clarity for the customer."

---

## 9️⃣ SUBSCRIPTION FAILURE — NEXT MONTH DEMO (6:20 – 7:00)

**[Screen: Subscriptions page → Trigger Auto-Pay Failure → error-code modal]**

> "Now the real-world problem — **next month's auto-pay failure**. On the merchant dashboard, I click **Trigger Auto-Pay Failure**.
>
> **[Show the 7 error codes modal]**
>
> The screen asks to **'Select one error code'** — seven real-world failure reasons: Insufficient Funds, Card Expired, Payment Timed Out, Card Not Active, Network Error, International Transaction Blocked, and Authentication Failed. I'll pick **Card Expired**.
>
> **[Click Confirm — notifications fire]**
>
> Instantly: the subscription flips to NOT_PAID_YET, the recovery pipeline runs, and a **polite SMS + Email + WhatsApp** go out to the customer — with the failure reason and a secure Razorpay payment link. And optionally, the 24-hour AI voice call is scheduled — just like we saw earlier."

---

## 🔟 B2B RECEIVABLES + PROMISE-TO-PAY (7:00 – 7:45)

**[Screen: B2B Receivables page → aging buckets → stage simulation]**

> "The B2B side — another revenue leak. On the **Receivables page**, there are aging buckets: 0–30, 31–60, 61–90, and 90+ days. Every invoice gets an automatic escalation tier — Tier 1 through Tier 4.
>
> **[Select Run Policy Stage and simulate one]**
>
> A 7-stage chaser: pre-due email → overdue SMS/WhatsApp → promise-to-pay link → and after 8+ days overdue, a **Tier-4 AI voice call**. All live.
>
> **[Open the Promises to Pay page]**
>
> The **Promise-to-Pay tracker** — the overdue B2B client opens a self-service portal and commits to a payment date — strictly within 7 days. If they break that promise, a background worker detects it and the failure automatically re-enters the recovery pipeline."

---

## 1️⃣1️⃣ AI COPILOT (7:45 – 8:15)

**[Screen: Any page → click the AI icon at the bottom-right]**

> "Last but not least — **AI Copilot**. See the AI icon at the bottom-right of every screen? One click opens a chat overlay.
>
> **[Type: 'How much revenue is at risk right now?']**
>
> Note — this is not a generic AI. It answers using **live database stats**. Look: at-risk amount, failure count, pending approvals, recovery rate — all in real time.
>
> **[Ask a second question: 'How many failures need approval?']**
>
> It's like the merchant having a personal AI analyst, on demand."

---

## 1️⃣2️⃣ TECH STACK + HOW THE FAILURE SYSTEM CHECKS ITSELF (8:15 – 9:00)

**[Screen: Architecture diagram from the README, or the code editor]**

> "The tech stack — and where each piece is used:
>
> - **Next.js 14 + Tailwind + zustand** → the merchant dashboard, storefront, and real-time UI
> - **FastAPI + async SQLAlchemy** → 60+ API endpoints and the 7-agent pipeline
> - **PostgreSQL 16** → 19 tables, with an **append-only audit log** for trust
> - **Redis + arq** → scheduled background jobs — smart retries and the 24-hour voice calls
> - **Docker Compose** → 5 containers: db, redis, backend, worker, frontend — one-command deploy
> - **Razorpay TEST MODE** → payments, links, mandates, webhooks — the money path
> - **Twilio** → real voice calls, WhatsApp, and SMS
> - **ElevenLabs** → Telugu/Hindi text-to-speech audio
> - **Resend** → transactional email
>
> **And how does the system police itself on failures?** Every action passes through a **deterministic Policy Guard**: retry caps, quiet hours from 9 PM to 9 AM, a high-value approval gate, and an AI confidence floor of 70%. **The LLM can never override policy** — code enforces it. And every decision lands in the append-only audit log."

---

## 1️⃣3️⃣ INTERNAL WORKING — THE 7 AGENTS (9:00 – 9:45)

**[Screen: Diagnoses page pipeline details, or the 7-agent diagram from the README]**

> "Under the hood — **7 agents, one pipeline**:
>
> 1. **Revenue Monitor** — ingests webhooks, tracks live ₹ at risk
> 2. **Root Cause Agent** — a 50+ entry rule map of real Razorpay error codes, plus an LLM second opinion with a confidence score
> 3. **Recovery Strategist** — the LLM picks exactly ONE action from a fixed set, A through G — no free-form actions
> 4. **Policy Guard** — deterministic. The LLM can NEVER override it — verdict is ALLOW, APPROVAL_REQUIRED, or BLOCK
> 5. **Recovery Executor** — real API calls: Razorpay payment links, Twilio calls, emails
> 6. **Outcome Monitor** — when the payment webhook lands, the event flips to RECOVERED and time-to-recovery is measured
> 7. **Audit Agent** — every step is written to an append-only log
>
> Graceful failure is built in too — if the LLM is down, a rule-based fallback takes over; if confidence is low, it escalates. **It never acts on a guess.**"

---

## 🏁 CLOSING (9:45 – 10:00)

**[Screen: Dashboard — counters + 'Every rupee has a receipt' overlay]**

> "To summarize — RecoverIQ Pro helps merchants **detect** silently leaking revenue, **diagnose** it, **recover it compliantly**, and **measure** the money recovered — with a full audit trail as proof.
>
> The full loop runs on real Razorpay TEST MODE, real phone calls, and real emails — production-grade, not a scripted demo.
>
> **The LLM thinks. Code acts. Every rupee has a receipt.**
>
> Thank you, judges! Happy to take questions — or demo anything live."

---

# ⚡ WINNING TIPS

## Do's ✅
1. **Nail the hook** — problem + wow moment in the first 30 seconds
2. **The live phone ring** — a real AI voice call is your most powerful proof
3. **Focus on the counters** — "₹ at risk" → recovery → counters update — visual evidence
4. **Show the Timeline page** — judges take explainability very seriously; it's mandatory
5. **Point at the TEST MODE badge** — explicitly say "real Razorpay API calls"
6. **Move the cursor slowly** — pause for 1 second on each element you highlight

## Don'ts ❌
1. Don't recite the script robotically — keep the flow natural
2. No dead air — if you pause while recording, cut it in editing
3. Don't show error screens — test every flow once before recording
4. Don't hide the word "simulation" — present honesty as a feature: "channels without keys run SIMULATED — never faked"
5. Going slightly over 10 minutes is fine — content beats timing

## Backup Plan 🛟
- Voice call fails → show the **Call Console page** with the ElevenLabs audio playback (recorded audio)
- Slow internet → wait for the Razorpay popup, cut the wait in editing
- Need a clean state → **Reset Data** button (top-right of the Dashboard)

---

## 📝 ONE-PAGE CHEAT SHEET (keep beside you while recording)

| # | Section | Time | Screen |
|---|---|---|---|
| 1 | Intro | 0:00 | Dashboard |
| 2 | Problem / Why | 0:30 | At-Risk counter |
| 3 | Google Sign-in | 1:30 | Store |
| 4 | Abandonment + 24hr + Timeline | 2:15 | Store → Diagnoses → Timeline |
| 5 | One-time order | 4:00 | Store checkout |
| 6 | Order greeting email | 4:45 | Gmail |
| 7 | Subscription demo | 5:15 | Store subscribe |
| 8 | Subscription greeting email | 6:00 | Gmail |
| 9 | Next-month failure | 6:20 | Subscriptions modal |
| 10 | B2B + P2P | 7:00 | Receivables → Promises |
| 11 | AI Copilot | 7:45 | Any page, bottom-right |
| 12 | Tech stack | 8:15 | README diagram |
| 13 | Internal working | 9:00 | 7-agent diagram |
| — | Closing | 9:45 | Dashboard |
