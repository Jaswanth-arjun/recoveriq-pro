# 🎬 RecoverIQ Pro — Complete Video Presentation & Demo Script
### 🏆 Razorpay Buildathon · Track 03: AI Revenue Recovery Agent

> **Note for Video Recording:** This script is written in a natural, clear **Telugu + English (Teluglish)** format so you can present smoothly on camera while showing your screen. It covers all 13 core requirements step-by-step from introduction to internal architecture.

---

## 📋 Presentation Overview & Scene Map

| Scene # | Section Name | Target Duration | Screen to Show |
|---|---|---|---|
| **Scene 1** | Self Introduction & Project Vision | 0:00 – 0:45 | Camera / Slide / Dashboard Intro |
| **Scene 2** | Problem Statement — Why RecoverIQ Pro? | 0:45 – 1:30 | Dashboard Financial Counters |
| **Scene 3** | GreenBasket Store — Google Authentication | 1:30 – 2:15 | `localhost:3000/store` (Google Login) |
| **Scene 4** | Checkout Abandonment & Timeline Explainability | 2:15 – 3:30 | Storefront → Tab Switch → Diagnoses & Timeline |
| **Scene 5 & 6** | One-Time Shopping Order & Itemized WhatsApp Greetings | 3:30 – 4:45 | Cart Checkout → WhatsApp & Email Receipts |
| **Scene 7 & 8** | Subscription Purchase & Confirmation Messages | 4:45 – 5:45 | Store Subscription → WhatsApp/Email Greetings |
| **Scene 9** | Subscription Auto-Pay Failure & 24h AI Voice Caller | 5:45 – 7:30 | Subscribers Page → Risk Code Modal → Voice Call |
| **Scene 10** | B2B Receivables Chaser & Promise-to-Pay (P2P) Portal | 7:30 – 8:45 | Receivables Page → P2P Portal (`/p2p/[id]`) |
| **Scene 11** | Floating AI Copilot Assistant | 8:45 – 9:30 | Floating Widget Chat Overlay |
| **Scene 12 & 13** | Tech Stack, Internal Architecture & System Resilience | 9:30 – 11:30 | Architecture Diagram / Code / Swagger |

---

## 🎙️ Detailed Step-by-Step Recording Script

### Scene 1: Self Introduction (Na Gurinchi)
**⏱️ Duration:** 0:00 – 0:45  
**🎥 On Screen:** Camera view or title screen showing your name and project logo.

* **Voiceover / Speaking Script:**
> *"Namaste & Hello Everyone! My name is **Jaswanth**, and today I am excited to present **RecoverIQ Pro** — an Autonomous AI Revenue Recovery Agent built for the **Razorpay Buildathon (Track 03)**.*
> 
> *As a developer passionate about building scalable, high-impact AI systems, I designed RecoverIQ Pro to solve one of the biggest revenue leaks in modern e-commerce and subscription platforms: **Silent Payment Failures & Unrecovered Abandoned Carts**."*

---

### Scene 2: Project Introduction & Problem Statement (Why I Chose This Problem)
**⏱️ Duration:** 0:45 – 1:30  
**🎥 On Screen:** Open `http://localhost:3000` (Merchant Dashboard showing live ₹ At Risk counters).

* **Voiceover / Speaking Script:**
> *"Every single day, Indian merchants lose millions of rupees silently. Payment gateways drop due to bank timeouts, debit/credit cards expire, customers run out of balance during auto-pay mandates, or customers add items to their cart and abandon the checkout.*
> 
> *Existing tools either send dumb, static email blasts that get marked as spam, or use unconstrained AI models that hallucinate incorrect discount codes and annoy customers.*
> 
> *That’s why I built **RecoverIQ Pro**. It uses a **Dual-Brain Architecture**: an AI LLM for smart root-cause diagnosis, paired with a **Hard-Coded Deterministic Policy Guard** that code-enforces business rules like quiet hours, retry caps, and human approvals. Our core motto is: **'The LLM thinks. Code acts. Every rupee has a receipt.'**"*

---

### Scene 3: Storefront & Google Authentication ("Continue with Google")
**⏱️ Duration:** 1:30 – 2:15  
**🎥 On Screen:** Navigate to `http://localhost:3000/store` (GreenBasket Storefront). Show the sign-in modal/header.

* **Voiceover / Speaking Script:**
> *"Let's look at the customer experience. Here is our D2C storefront — **GreenBasket Store** (`http://localhost:3000/store`).*
> 
> *When a customer visits the store, they sign in seamlessly using **Google Authentication ('Continue with Google')**. *
> *(Click Continue with Google -> show user authenticated state).*
> 
> *Notice that we capture the user's verified Google email address immediately. This allows our system to track checkout intent and send instant reminders without forcing the customer to fill out lengthy phone forms right away."*

---

### Scene 4: Checkout Abandonment, 1h/24h Reminders & Audit Timeline
**⏱️ Duration:** 2:15 – 3:30  
**🎥 On Screen:** GreenBasket Store cart -> Add items -> Switch tab or close tab -> Open Merchant Dashboard (`/diagnoses` & `/timeline`).

* **Voiceover / Speaking Script:**
> *"Now let's test **Intent-Driven Checkout Abandonment Recovery**.*
> 
> *I am adding items to my cart — Farm Fresh Milk and Organic Tomatoes. Suppose I get distracted and switch tabs or close the page.*
> *(Switch tab or close store tab).*
> 
> *Our frontend uses the HTML5 Beacon API (`visibilitychange` / `pagehide`) to detect true exit intent. It immediately dispatches an exit signal to our backend.*
> 
> *Now let's switch to the **Merchant Diagnoses Dashboard** (`/diagnoses`). As you can see, the system automatically detected the exit, ingested the risk, mapped the customer email, and generated a real Razorpay payment link with personalized 1-hour and 24-hour reminder schedules!*
> 
> *If we open the **Timeline page** (`/timeline`), you can see the complete, append-only audit trail: from detection to diagnosis to policy check — giving 100% explainability for every rupee."*

---

### Scene 5 & 6: One-Time Shopping Order & Itemized WhatsApp Greetings
**⏱️ Duration:** 3:30 – 4:45  
**🎥 On Screen:** GreenBasket Store -> Checkout one-time order -> Show WhatsApp desktop / Email inbox received.

* **Voiceover / Speaking Script:**
> *"Next, let's see what happens when a customer completes a **One-Time Shopping Order**.*
> 
> *(Complete checkout on GreenBasket storefront).*
> 
> *As soon as the payment completes, two things happen instantly:*
> 1. *Our system sends an **itemized WhatsApp message** directly to the customer's WhatsApp number.*
> 2. *An official **Email receipt** is sent via Resend API.*
> 
> *Let's check the WhatsApp message on screen! Notice how rich and detailed it is: It lists **every item ordered with its exact quantity and price breakdown** (e.g., Farm Fresh Milk: 2 x ₹60 = ₹120), total paid amount, delivery address, and displays **'🚚 Delivery Status: ON THE WAY'**!"*

---

### Scene 7 & 8: Subscription Purchase & Confirmation Messages
**⏱️ Duration:** 4:45 – 5:45  
**🎥 On Screen:** GreenBasket Store -> Subscribe to daily milk/vegetables -> Show WhatsApp subscription greeting & Email.

* **Voiceover / Speaking Script:**
> *"Now let's test our **Subscription Mandate Flow**.*
> 
> *Customers can subscribe to daily essentials like fresh milk or organic vegetables on a recurring basis. Let's click **'Subscribe Daily'** and complete the mandate activation.*
> 
> *Upon successful subscription, RecoverIQ Pro immediately sends a specialized **Subscription Confirmation WhatsApp & Email Greeting**!*
> 
> *The WhatsApp message welcomes the subscriber, outlines their daily delivery schedule (6:00 AM every morning), details item quantities and prices, and provides a direct link to manage or pause their subscription."*

---

### Scene 9: Auto-Pay Subscription Failure Simulation & 24h AI Voice Follow-Up
**⏱️ Duration:** 5:45 – 7:30  
**🎥 On Screen:** Merchant Dashboard -> `Subscribers & Delivery` page -> Click **Trigger Auto-Pay Failure** -> Risk Code Modal -> Show Voice Call Banner & Audio Player.

* **Voiceover / Speaking Script:**
> *"What happens next month when recurring auto-pay fails? Let's simulate that live!*
> 
> *In the **Subscribers & Delivery** page (`/subscriptions`), we have a dedicated button: **'Trigger Auto-Pay Failure'**.*
> 
> *(Click Trigger Auto-Pay Failure button).*
> 
> *An interactive **Risk Code Selector Modal** appears on screen with 7 real-world failure reasons:*
> * `INSUFFICIENT_FUNDS`
> * `CARD_EXPIRED`
> * `PAYMENT_TIMED_OUT`
> * `CARD_INACTIVE`
> * `NETWORK_ERROR`
> * `INTL_TRANSACTION_BLOCKED`
> * `AUTHENTICATION_FAILED`
> 
> *Let's select **`CARD_EXPIRED`** and check the box for **'📞 Schedule 24h AI Voice Call'**. Click Confirm!*
> 
> *The subscription status instantly flips to `NOT_PAID_YET`. A polite SMS, Email, and WhatsApp message go out with a secure Razorpay retry link.*
> 
> *And if the customer does not clear the payment after 24 hours, our background worker (arq + Redis) triggers an **AI Voice Agent call** in **Telugu / Hinglish**! Let's click 'Trigger Immediate 24h Voice Call' to preview the real ElevenLabs Telugu voice audio right here in the dashboard!"*  
> *(Play audio clip on screen).*

---

### Scene 10: B2B Receivables Chaser & Self-Service Promise-to-Pay (P2P) Portal
**⏱️ Duration:** 7:30 – 8:45  
**🎥 On Screen:** Dashboard -> `B2B Receivables` (`/receivables`) -> Open Promise-to-Pay Portal (`/p2p/[id]`).

* **Voiceover / Speaking Script:**
> *"Now let's move to **B2B Accounts Receivable Recovery**.*
> 
> *On the B2B Receivables page, invoices are categorized into 7 aging escalation stages — from pre-due reminders to 30+ day defaults.*
> 
> *When an invoice is 5 days overdue (Stage 4), our agent sends the B2B client a link to the self-service **Promise-to-Pay (P2P) Portal** (`/p2p/[id]`).*
> 
> *(Open P2P Portal page).*
> 
> *Here, the client can select a committed payment date **strictly within the next 7 days**. Once submitted, the promise is logged to the merchant dashboard and chasers are paused.*
> 
> *If the client breaks the promise, our midnight background worker automatically flags it as `BROKEN`, escalates the invoice to Stage 5, and triggers an AI Voice Call!"*

---

### Scene 11: Embedded Floating AI Copilot Assistant
**⏱️ Duration:** 8:45 – 9:30  
**🎥 On Screen:** Click the floating AI icon at bottom-right -> Type a query in Telugu/Hinglish -> Show live response.

* **Voiceover / Speaking Script:**
> *"Throughout the dashboard, merchants have access to our **Floating AI Copilot Assistant** at the bottom-right of every screen.*
> 
> *Let's open the widget and ask in natural language: **'How much revenue is currently at risk?'** or **'Ee vaaram entha money recover ayindi?'***
> 
> *(Type query & hit send).*
> 
> *The AI Copilot executes live SQL queries against our PostgreSQL database and responds instantly with accurate, real-time financial figures!"*

---

### Scene 12 & 13: Tech Stack Breakdown & Internal System Architecture
**⏱️ Duration:** 9:30 – 11:30  
**🎥 On Screen:** Architecture Diagram / Swagger Docs (`localhost:8000/docs`) / Code Editor.

* **Voiceover / Speaking Script:**
> *"Finally, let's look at the **Tech Stack & Internal Architecture** that powers RecoverIQ Pro:*
> 
> 1. **Frontend:** Built with **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**, and **Zustand** for real-time state management.
> 2. **Backend:** Powered by **FastAPI** with 60+ async REST endpoints and a real-time **WebSocket** broadcast server.
> 3. **Database Layer:** **PostgreSQL 16** with 19 relational tables and an **append-only `audit_log`** table to ensure every single rupee has an immutable receipt.
> 4. **Asynchronous Background Worker:** **Redis 7 + arq worker** for scheduling 48-hour retry backoffs, 24-hour voice calls, and P2P promise checks.
> 5. **External Integrations:** 
>    * **Razorpay Test Mode API** for payment links, subscriptions & webhooks.
>    * **Twilio Programmable Voice** with a self-hosted TwiML server for live telephone calls.
>    * **ElevenLabs API** for Telugu & Hinglish voice synthesis.
>    * **Resend API** & **Twilio WhatsApp API** for multi-channel messaging.
>    * **Claude 3.5 Sonnet & Gemini 1.5 Pro** for AI diagnosis & copilot reasoning.
> 
> **How the system handles failures (Resilience):**
> * If the LLM API is down, our system gracefully falls back to a deterministic 50+ Razorpay error-code rule map (`error_codes.py`).
> * If AI confidence is low (< 70%), the **Policy Guard** automatically routes the case to the merchant **Approvals Queue**.
> * If any channel credential is missing, that specific channel runs in explicit **SIMULATED mode**, ensuring zero crashes.
> 
> *Thank you everyone for watching! RecoverIQ Pro makes revenue recovery autonomous, policy-compliant, and 100% auditable. Every rupee has a receipt!"*

---

## 💡 Quick Tips for Video Recording
1. **Screen Resolution:** Record at `1920x1080` (1080p).
2. **Audio:** Use a clean microphone in a quiet room.
3. **Browser Tabs Ready Before Recording:**
   - Tab 1: `http://localhost:3000` (Merchant Dashboard)
   - Tab 2: `http://localhost:3000/store` (GreenBasket Storefront)
   - Tab 3: `http://localhost:3000/diagnoses` (Diagnoses)
   - Tab 4: `http://localhost:3000/subscriptions` (Subscribers)
   - Tab 5: `http://localhost:3000/receivables` (B2B Receivables)
   - Tab 6: `http://localhost:8000/docs` (Swagger API Docs)
4. **Data Reset:** Click "Reset Demo Data" on the dashboard before starting Scene 1 so counters start clean!
