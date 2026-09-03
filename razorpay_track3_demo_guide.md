# 🚀 RecoverIQ Pro — Razorpay Buildathon Track 3 Demo & Test Guide

> **Track 03: AI Revenue Recovery** — Find revenue that’s slipping away and win it back.

---

## 🎯 Executive Summary & Track 3 Alignment

RecoverIQ Pro is an autonomous, 7-Agent revenue recovery system built specifically for Razorpay merchants. It closes the loop from detecting revenue loss to diagnosing root cause, executing compliant multi-channel recovery, and tracking measured money recovered with a strict audit trail.

---

## 🗺️ Complete Feature Mapping Matrix

| Razorpay Track 3 Requirement | RecoverIQ Pro Feature | UI Section / URL | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **1. Payment degradation → root cause → recovery action** | Ingest Payment Failure & 7-Agent Autonomous Pipeline | `Dashboard` (`/`) & `Diagnoses` (`/diagnoses`) | Ingests 50+ Razorpay error codes in `error_codes.py`, diagnoses cause, selects optimal action (A–G), applies Policy Gate, and executes. |
| **2. Checkout drop-off recovery** | GreenBasket Storefront Abandonment Tracking | Top Right Button → `Open GreenBasket Store` (`/store`) | Listens to checkout exits/tab hides, ingests abandonment risk, generates Razorpay payment link with coupon, dispatches multi-channel outreach. |
| **3. Failed-subscription recovery** | Subscription Mandate Auto-Pay Failure Simulation | `Subscribers & Delivery` (`/subscribers`) | Handles `subscription.charged.failed`, schedules smart retries, sends recovery links to shoppers. |
| **4. B2B receivables chaser** | 7-Stage B2B Overdue Invoice Chaser | `B2B Receivables` (`/b2b`) | Escalates from 1-day email → 2-day SMS/WhatsApp → 7-day P2P link → 8+ day AI Voice call. |
| **5. Promise-to-pay tracker** | Self-Service P2P Portal & Merchant Tracker | `Promises to Pay` (`/p2p`) & Public Portal (`/p2p/[id]`) | Allows overdue B2B clients to select a promise date strictly within 7 days, logging commitments to the dashboard. |
| **6. Mandate retry sequencer** | Intelligent Policy Guard & Retry Rules | `Recovery Plan` (`/recovery-plan`) | Enforces max 3 retries, 48h delay for `INSUFFICIENT_FUNDS`, 2h for network error, and quiet hours (9 PM – 9 AM IST). |
| **7. Hinglish/Telugu voice recovery** | AI Voice Agent & Twilio Telephony | `Call Console` (`/call-console`) | Generates multi-lingual voice scripts (Telugu/Hinglish) via ElevenLabs TTS & places live Twilio phone calls. |
| **THE BAR: Money Recovered, Escalation, Stopping Rules, Audit Trail** | Metrics Dashboard, Approvals Queue & Real-time Audit Log | `Dashboard` (`/`), `Approvals` (`/approvals`), `Timeline` (`/timeline`), `Report` (`/report`) | • **Measured Money**: Live stats (At Risk, Recovered, Recovery Rate %)<br>• **Escalation**: High-value (> ₹10,000) or low AI confidence (< 70%) requires manual merchant approval<br>• **Stopping Rules**: Opt-out, max retries, or risk flag stops outreach<br>• **Audit Trail**: Every agent step permanently recorded. |

---

## 🧪 Step-by-Step Testing & Video Presentation Script

### 📍 Step 1: Demo Setup & Clean State
1. Open the Merchant Dashboard at `http://localhost:3000`.
2. Click **`Reset Data`** (top right on Dashboard) to start with a fresh slate.
3. Observe the top KPI cards: `AT RISK: ₹0`, `RECOVERED: ₹0`, `RECOVERY RATE: 0%`.

---

### 📍 Step 2: Payment Degradation → Root Cause → Recovery Action
1. On the **Dashboard**, scroll to **`INGEST PAYMENT FAILURE`**.
2. Enter:
   - Customer Name: `Jaswanth`
   - Email: `jaswanth@example.com`
   - Phone: `+919392443002`
   - Amount: `₹2,000`
   - Error Code: Select **`Card Expired`** (or `Insufficient Funds`).
   - Language: `English` / `Telugu`.
3. Click **`Ingest Failure → Run Pipeline`**.
4. **What to show on screen**:
   - Go to **`Diagnoses`** (`/diagnoses`): Show the 7-agent pipeline run (**Detect → Diagnose → Decide → Policy Gate → Act**).
   - Show the root cause: *"Card has expired"*.
   - Show the selected action: `B · Checkout Recovery (UPI link)`.
   - Go to **`Timeline`** (`/timeline`): Show the complete step-by-step audit entries.

---

### 📍 Step 3: High-Value Escalation & Approval Gate (The Bar: Compliance)
1. On the **Dashboard** -> **INGEST PAYMENT FAILURE**, enter an amount of **`₹15,000`** (greater than the ₹10,000 threshold).
2. Click **`Ingest Failure → Run Pipeline`**.
3. **What to show on screen**:
   - Observe status is **`AWAITING APPROVAL`** (Policy Gate triggered due to High-Value Rule).
   - Go to **`Approvals`** tab (`/approvals`): Show the pending item with details.
   - Click **`Approve & Execute Action`**.
   - Show the action execute successfully with audit log update.

---

### 📍 Step 4: Checkout Drop-Off Recovery (GreenBasket Store)
1. Click the top-right button **`Open GreenBasket Store`** (`http://localhost:3000/store`).
2. Add products (e.g. Fresh Organic Tomatoes, Alphonsos) to the cart.
3. Click **`Proceed to Checkout`**, type your name & email.
4. Close the checkout modal or switch tabs without completing payment.
5. Go back to the **RecoverIQ Pro Merchant Dashboard** -> **`Diagnoses`** tab.
6. **What to show on screen**:
   - Real-time cart abandonment risk ingested (`🛒 Checkout Abandonment`).
   - Automated recovery action triggered with a 10% discount coupon (`RECOVER10`) and multi-channel outreach (SMS, WhatsApp, Email).
   - Completing the order on store auto-marks the risk as **`RECOVERED`**.

---

### 📍 Step 5: Failed-Subscription Recovery
1. Go to **`Subscribers & Delivery`** (`/subscribers`).
2. View existing subscriptions. Click **`Simulate Auto-Pay Failure`** on any active subscriber.
3. **What to show on screen**:
   - Status changes to `NOT_PAID_YET`.
   - Pipeline ingests `subscription.charged.failed` and schedules a smart retry + recovery link.

---

### 📍 Step 6: B2B Receivables Chaser & Promise-to-Pay Tracker
1. Go to **`B2B Receivables`** (`/b2b`).
2. Select any B2B Invoice (e.g., `INV-2026-001` for ₹1,50,000).
3. Test Stage Escalations:
   - Click **`Stage 4: 2 Days Overdue`** -> Triggers SMS & WhatsApp.
   - Click **`Stage 6: 7 Days Overdue (P2P)`** -> Sends P2P link (`http://localhost:3000/p2p/[id]`).
   - Click **`Stage 7: 8+ Days Overdue (AI Voice Call)`** -> Triggers AI Voice Call in Telugu/Hinglish via Twilio.
4. Open the **`Promises to Pay`** tab (`/p2p`):
   - Show the committed payment date recorded by the customer.

---

### 📍 Step 7: Hinglish / Telugu Voice Recovery & Twilio Call Console
1. Go to **`Call Console`** (`/call-console`).
2. View the generated Voice Call records.
3. Play the audio or view the generated voice script in Telugu/Hinglish.
4. Show the Twilio Call SID proving a real telephony integration.

---

### 📍 Step 8: Measured Money Recovered & Audit Trail (Closing "The Bar")
1. Go to **`Dashboard`** / **`Report`** (`/report`).
2. **Highlight key metrics**:
   - Total Revenue At Risk vs Total Money Recovered.
   - Recovery Rate Percentage.
   - Channel effectiveness (UPI links vs Voice calls vs SMS).
3. Go to **`Timeline`** (`/timeline`): Show the immutable audit trail detailing every single decision, policy check, and action execution.

---
*Built with ❤️ for Razorpay Buildathon 2026 — RecoverIQ Pro Team*
