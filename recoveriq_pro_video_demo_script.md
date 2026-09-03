# 🎬 RecoverIQ Pro — Fast 5-Minute Video Presentation Script
### 🏆 Razorpay Buildathon · Track 03: AI Revenue Recovery Agent

> **Target Video Duration:** 5 Minutes (300 Seconds)  
> **Language:** Natural Teluglish (Telugu + English for smooth camera presentation)  
> **Coverage:** 100% Coverage of all 13 core presentation requirements in a tight, high-energy recording format.

---

## ⏱️ 5-Minute Master Time Budget

| Time Slot | Section & Points Covered | Target Duration | Screen to Show |
|---|---|---|---|
| **0:00 – 0:30** | **Pts 1 & 2:** Self Intro & Problem Vision | 30 Seconds | Camera / Dashboard Intro (`localhost:3000`) |
| **0:30 – 1:15** | **Pts 3 & 4:** Google Auth, Checkout Abandonment & Timeline | 45 Seconds | Storefront (`/store`) → Switch Tab → Diagnoses & Timeline |
| **1:15 – 2:00** | **Pts 5 & 6:** One-Time Order & Itemized WhatsApp Greeting | 45 Seconds | Store Checkout → WhatsApp & Email Receipts |
| **2:00 – 2:45** | **Pts 7 & 8:** Subscription Purchase & Greetings | 45 Seconds | Store Subscription → WhatsApp/Email Confirmation |
| **2:45 – 3:30** | **Pt 9:** Auto-Pay Mandate Failure & 24h AI Voice Caller | 45 Seconds | Subscribers Page → Risk Code Modal → Voice Audio |
| **3:30 – 4:15** | **Pts 10 & 11:** B2B Receivables, P2P Portal & AI Copilot | 45 Seconds | B2B Page → P2P Portal (`/p2p/[id]`) → Copilot Overlay |
| **4:15 – 5:00** | **Pts 12 & 13:** Tech Stack & Internal Pipeline Architecture | 45 Seconds | System Architecture / Code / Swagger Docs |

---

## 🎙️ 5-Minute Step-by-Step Recording Script

### ⏱️ [0:00 – 0:30] Scene 1: Self Intro & Problem Vision (Points 1 & 2)
**🎥 Screen:** Camera view or Merchant Dashboard (`http://localhost:3000`).

* **Speaking Script:**
> *"Namaste everyone! I'm **Jaswanth**, and this is **RecoverIQ Pro** — built for **Razorpay Buildathon Track 03**.*
> 
> *Indian merchants lose millions daily due to failed auto-pays, expired cards, and abandoned carts. Standard tools send spam emails, while raw AI models hallucinate bad discounts.*
> 
> *RecoverIQ Pro introduces a **Dual-Brain Architecture**: an LLM for root-cause diagnosis paired with a **Hard-Coded Policy Guard** that code-enforces quiet hours and caps. Our motto: **'The LLM thinks. Code acts. Every rupee has a receipt.'**"*

---

### ⏱️ [0:30 – 1:15] Scene 2: Google Auth, Abandonment & Audit Trail (Points 3 & 4)
**🎥 Screen:** Open `http://localhost:3000/store` (GreenBasket Store) → Cart → Switch Tab → Dashboard `/diagnoses` & `/timeline`.

* **Speaking Script:**
> *"Here is our storefront — **GreenBasket** (`/store`). Customers sign in with **Google Auth ('Continue with Google')**, capturing their verified email instantly without phone friction.*
> 
> *I'll add items to my cart. If I switch or close the tab, our HTML5 exit beacon fires immediately. *
> *(Switch tab -> Open Diagnoses).*
> 
> *In **Diagnoses** (`/diagnoses`), you see the exit ingested in real-time, generating a Razorpay link with 1-hour and 24-hour reminder triggers.*
> 
> *Over in **Timeline** (`/timeline`), every step is stored in an append-only audit trail — total explainability for every rupee!"*

---

### ⏱️ [1:15 – 2:00] Scene 3: One-Time Order & Itemized WhatsApp (Points 5 & 6)
**🎥 Screen:** Storefront -> Checkout One-Time Order -> Show WhatsApp Desktop & Email receipt.

* **Speaking Script:**
> *"Now let's complete a **One-Time Shopping Order**.*
> 
> *(Complete checkout on GreenBasket storefront).*
> 
> *As soon as payment completes, our system dispatches an **itemized WhatsApp message** and Resend Email receipt!*
> 
> *Look at WhatsApp: It shows **every ordered item with line totals** (Farm Fresh Milk: 2 x ₹60 = ₹120), total amount, delivery address, and **'🚚 Delivery Status: ON THE WAY'**!"*

---

### ⏱️ [2:00 – 2:45] Scene 4: Subscription Order & Confirmations (Points 7 & 8)
**🎥 Screen:** Storefront -> Subscribe Daily -> Show WhatsApp & Email Subscription Confirmation.

* **Speaking Script:**
> *"Next, **Subscription Orders**.*
> 
> *Customers can subscribe to daily milk or vegetables. Clicking **'Subscribe Daily'** activates the recurring mandate.*
> 
> *Immediately, a specialized **Subscription WhatsApp & Email Greeting** is sent! It confirms their subscription, sets their 6:00 AM daily delivery schedule, and provides a portal link to manage their basket."*

---

### ⏱️ [2:45 – 3:30] Scene 5: Auto-Pay Failure & 24h AI Voice Caller (Point 9)
**🎥 Screen:** Merchant Dashboard -> `Subscribers & Delivery` (`/subscriptions`) -> Trigger Auto-Pay Failure -> Select `CARD_EXPIRED` -> Play Audio.

* **Speaking Script:**
> *"What happens next month when auto-pay fails? Let's simulate it!*
> 
> *On the **Subscribers page**, clicking **'Trigger Auto-Pay Failure'** opens our **Risk Code Selector Modal** with 7 codes like `INSUFFICIENT_FUNDS` and `CARD_EXPIRED`.*
> 
> *I'll select **`CARD_EXPIRED`** and check **'📞 Schedule 24h AI Voice Call'**. Subscription flips to `NOT_PAID_YET`, and polite WhatsApp/SMS/Email alerts fire.*
> 
> *If unpaid after 24 hours, our Redis worker triggers a **Telugu/Hinglish AI Voice Agent call**! Let's listen to the real ElevenLabs Telugu voice preview right here on dashboard!"*  
> *(Play audio clip on screen).*

---

### ⏱️ [3:30 – 4:15] Scene 6: B2B Receivables, P2P Portal & AI Copilot (Points 10 & 11)
**🎥 Screen:** B2B Page (`/receivables`) → P2P Portal (`/p2p/[id]`) → Click Floating Copilot Widget.

* **Speaking Script:**
> *"For **B2B Receivables**, invoices escalate across 7 stages. At Stage 4 (5 days overdue), clients receive a self-service **Promise-to-Pay (P2P)** portal link (`/p2p/[id]`).*
> 
> *(Show P2P Portal).*
> *Clients select a payment date within 7 days, pausing chasers. Broken promises trigger an automatic AI Voice call.*
> 
> *Merchants can also open our **Floating AI Copilot** at the bottom-right and ask in Teluglish: **'Ee vaaram entha revenue risk lo undi?'** The AI queries live DB stats and answers instantly!"*

---

### ⏱️ [4:15 – 5:00] Scene 7: Tech Stack & Internal Architecture (Points 12 & 13)
**🎥 Screen:** Architecture Diagram / Swagger UI (`localhost:8000/docs`).

* **Speaking Script:**
> *"Under the hood, RecoverIQ Pro is built with:*
> * **Next.js 14 & FastAPI** connected via WebSockets.
> * **PostgreSQL 16** (19 tables + append-only `audit_log`).
> * **Redis 7 + arq worker** for 48h retry backoffs & 24h voice calls.
> * **Razorpay, Twilio Voice/WhatsApp, Resend Email, and ElevenLabs TTS**.
> 
> **System Resilience:** If the LLM goes down, our 50+ Razorpay error-code rule map (`error_codes.py`) takes over seamlessly. Low AI confidence (< 70%) escalates to the merchant **Approvals Queue**.
> 
> *RecoverIQ Pro makes revenue recovery autonomous, compliant, and 100% auditable. Thank you!"*

---

## 🎬 Pre-Recording Checklist (Run in 1 Minute Before Video)
1. **Reset Data:** Open Dashboard (`/`), click **"Reset Demo Data"**.
2. **Open Tabs:**
   - Tab 1: `http://localhost:3000` (Dashboard)
   - Tab 2: `http://localhost:3000/store` (GreenBasket Store)
   - Tab 3: `http://localhost:3000/subscriptions` (Subscribers)
   - Tab 4: `http://localhost:3000/receivables` (B2B Receivables)
   - Tab 5: `http://localhost:8000/docs` (Swagger API Docs)
3. **Timer:** Place a stopwatch on your desk set for 5:00!
