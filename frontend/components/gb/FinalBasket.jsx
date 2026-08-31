"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sunrise, PackageCheck, Repeat, X, Sparkles, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DELIVERY_DAYS_PER_MONTH, formatINR } from "../../data/products";
import { useBasketTotals } from "../../store/basket";
import { api } from "../../lib/api";

export function FinalBasket({ showCustomImage = false }) {
  const { lines, items, products, daily, monthly } = useBasketTotals();
  const [confirmed, setConfirmed] = useState(false);

  const [customerName, setCustomerName] = useState("Rahul");
  const [customerEmail, setCustomerEmail] = useState("jaswanthnelluru2004@gmail.com");
  const [customerPhone, setCustomerPhone] = useState("+919392443002");
  const [addressLine, setAddressLine] = useState("Flat 402, Green Glen Towers, Road No 3");
  const [city, setCity] = useState("Hyderabad");
  const [pincode, setPincode] = useState("500081");
  const [landmark, setLandmark] = useState("Near Fresh Mart Supermarket");
  
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const [showOneTimeModal, setShowOneTimeModal] = useState(false);
  const [oneTimePaymentType, setOneTimePaymentType] = useState("COD");
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
  const [orderCompleted, setOrderCompleted] = useState(false);

  // Automatic Checkout Abandonment Detection
  useEffect(() => {
    if (orderCompleted || (monthly <= 0 && daily <= 0)) return;

    let hasTriggered = false;
    const triggerAbandonment = (reason = "tab_switch_or_exit") => {
      if (hasTriggered || orderCompleted) return;
      hasTriggered = true;

      const payload = JSON.stringify({
        session_id: sessionId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        cart_items: getItemsDetail(),
        cart_value: monthly > 0 ? monthly : daily,
        stage: "checkout_basket",
        reason: reason,
      });

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/checkouts/abandon`;
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerAbandonment("tab_hidden_during_checkout");
      }
    };

    const handlePageHide = () => {
      triggerAbandonment("page_closed_during_checkout");
    };

    // Inactivity timer (30 seconds)
    const inactivityTimer = setTimeout(() => {
      triggerAbandonment("inactivity_timeout_during_checkout");
    }, 30000);

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [sessionId, customerName, customerEmail, customerPhone, monthly, daily, orderCompleted, lines]);

  const getItemsDetail = () => {
    return lines.map((l) => ({
      name: l.product?.name || "Grocery Item",
      unit: l.product?.unit || "1 pc",
      quantity: l.quantity,
      price: l.daily,
    }));
  };

  const handlePlaceOneTimeOrder = async (payType = oneTimePaymentType) => {
    if (daily <= 0) return;
    setIsSubmitting(true);
    setNotification(null);

    const itemsDetail = getItemsDetail();

    try {
      if (payType === "RAZORPAY" && window.Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TVGHgfyB8UpkvS",
          amount: Math.round(daily * 100),
          currency: "INR",
          name: "GreenBasket 1-Time Grocery Shopping",
          description: "Fresh Grocery Items Order",
          image: "https://cdn-icons-png.flaticon.com/512/1202/1202025.png",
          handler: async function (response) {
            try {
              const res = await api("/orders", {
                method: "POST",
                body: JSON.stringify({
                  name: customerName,
                  email: customerEmail,
                  phone: customerPhone,
                  address_line: addressLine,
                  city: city,
                  pincode: pincode,
                  landmark: landmark,
                  total_amount: daily,
                  items_count: items,
                  items_detail: itemsDetail,
                  payment_type: "RAZORPAY",
                  payment_status: "PAID",
                }),
              });
              setNotification({
                type: "success",
                message: `🎉 1-Time Order Placed & Paid! Razorpay ID: ${response.razorpay_payment_id}. Code: ${res.order_code}. Delivery Status: NOT DELIVERED YET.`,
              });
            } catch (e) {
              console.error(e);
            }
            setShowOneTimeModal(false);
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: { color: "#204b2b" },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          console.warn("Razorpay payment failed:", resp.error);
          setNotification({
            type: "error",
            message: `⚠️ Razorpay Payment Note: ${resp.error?.description || 'Checkout closed/failed'}. Try Cash on Delivery (COD) for test mode.`,
          });
        });
        rzp.open();
      } else {
        const res = await api("/orders", {
          method: "POST",
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address_line: addressLine,
            city: city,
            pincode: pincode,
            landmark: landmark,
            total_amount: daily,
            items_count: items,
            items_detail: itemsDetail,
            payment_type: payType,
            payment_status: payType === "RAZORPAY" ? "PAID" : "UNPAID",
          }),
        });
        setNotification({
          type: "success",
          message: `🎉 1-Time Grocery Order Placed (${res.order_code})! Payment: ${payType === "RAZORPAY" ? "PAID (Online)" : "Cash on Delivery (COD - UNPAID)"}. Delivery Status: NOT DELIVERED YET.`,
        });
        setShowOneTimeModal(false);
      }
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Razorpay SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("razorpay-sdk")) return;
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const createSubscriptionRecord = async () => {
    try {
      const sub = await api("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address_line: addressLine,
          city: city,
          pincode: pincode,
          landmark: landmark,
          daily_total: daily,
          monthly_total: monthly,
          items_count: items,
          items_detail: getItemsDetail(),
        }),
      });
      setActiveSubscription(sub);
      return sub;
    } catch (e) {
      console.error("Failed to create subscription record", e);
      return null;
    }
  };

  const handleRazorpaySubscribe = async () => {
    if (monthly <= 0) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const sub = await createSubscriptionRecord();

      // Create Razorpay Subscription Mandate for Auto-Pay
      let mandate = null;
      try {
        mandate = await api("/subscriptions/create-mandate", {
          method: "POST",
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            monthly_total: monthly,
          }),
        });
      } catch (mErr) {
        console.warn("Mandate API note:", mErr);
      }

      if (window.Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TVGHgfyB8UpkvS",
          name: "GreenBasket Morning Magic",
          description: "Monthly Farm Fresh Auto-Pay Subscription Mandate",
          image: "https://cdn-icons-png.flaticon.com/512/1202/1202025.png",
          handler: function (response) {
            const subId = response.razorpay_subscription_id || response.razorpay_payment_id || mandate?.subscription_id;
            setOrderCompleted(true);
            setNotification({
              type: "success",
              message: `🎉 Monthly Auto-Pay Mandate Activated! Sub ID: ${subId}. Your 6 AM Fresh Delivery is ACTIVE for ${customerName}!`,
            });
            if (sub?.id) {
              setActiveSubscription({ ...sub, status: "PAID", subscription_code: subId });
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: { color: "#204b2b" },
        };

        if (mandate?.subscription_id && !mandate.subscription_id.startsWith("sub_test_")) {
          options.subscription_id = mandate.subscription_id;
        } else {
          options.amount = Math.round(monthly * 100);
          options.currency = "INR";
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setNotification({
          type: "success",
          message: `Subscription Activated! Delivery Address recorded for ${customerName}. (Sub Code: ${sub?.subscription_code || 'SUB_GB_ACTIVE'})`,
        });
      }
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription?.id) return;
    setIsSubmitting(true);
    try {
      await api(`/subscriptions/${activeSubscription.id}/cancel`, { method: "POST" });
      setActiveSubscription({ ...activeSubscription, status: "CANCELLED" });
      setNotification({
        type: "warning",
        message: `Subscription #${activeSubscription.subscription_code} has been CANCELLED as requested by user. Merchant notified!`,
      });
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateAutopayFailure = async () => {
    if (!activeSubscription?.id) return;
    setIsSubmitting(true);
    try {
      const res = await api(`/subscriptions/${activeSubscription.id}/simulate-autopay-failure`, { method: "POST" });
      setActiveSubscription({ ...activeSubscription, status: "NOT_PAID_YET" });
      setNotification({
        type: "warning",
        message: `⚡ Monthly Auto-Pay Failed! Status updated to 'NOT PAID YET'. RecoverIQ Pro pipeline active (Event ID: ${res.event_id}).`,
      });
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateFailure = async (errorCode) => {
    if (monthly <= 0) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const sub = await createSubscriptionRecord();
      const res = await api("/failures/seed", {
        method: "POST",
        body: JSON.stringify({
          error_code: errorCode,
          amount_inr: monthly,
          customer: { name: customerName, email: customerEmail, phone: customerPhone },
        }),
      });

      if (sub?.id) {
        setActiveSubscription({ ...sub, status: "NOT_PAID_YET" });
      }

      setNotification({
        type: "warning",
        message: `⚡ Payment Failure Triggered (${errorCode}) for ${customerName} (${formatINR(monthly)})! RecoverIQ Pro is diagnosing and executing recovery. Check your Email/Phone!`,
      });
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden select-none px-4 py-10 sm:px-6">
      {/* Background Image Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#f7f3e9]">
        <img
          src="/summary-bg.jpg"
          alt="GreenBasket Harvest Overview"
          className="h-full w-full object-cover object-center filter brightness-[0.98] contrast-[1.02] transition-transform duration-700 hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, rgba(30,20,10,0.45) 100%), linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>

      {/* Main Glassmorphic Panel */}
      <div className="glass-panel relative z-20 flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] shadow-2xl border border-white/80 bg-white/80 backdrop-blur-xl transition-all duration-500">
        <header className="shrink-0 border-b border-white/40 bg-white/40 px-6 pb-4 pt-6 text-center sm:px-10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900 shadow-sm backdrop-blur-md">
              <Sparkles className="size-3 text-emerald-600 animate-pulse" />
              <span>Complete Subscription Overview</span>
            </div>
            <Link
              href="/"
              className="rounded-full bg-emerald-900/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900 hover:bg-emerald-900/20 transition-all"
            >
              Merchant Portal →
            </Link>
          </div>
          <h2 className="display-title mt-2 text-3xl font-bold text-ink sm:text-5xl">
            Your Morning, Your Way.
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Review your daily subscription basket before confirming sunrise delivery
          </p>
        </header>


        {notification && (
          <div className="px-6 pt-3">
            <div
              className={`rounded-2xl p-3 border text-xs font-semibold flex items-center justify-between shadow-lg ${notification.type === "success"
                  ? "bg-emerald-900/90 border-emerald-500 text-emerald-100"
                  : notification.type === "warning"
                    ? "bg-amber-900/90 border-amber-500 text-amber-100"
                    : "bg-rose-900/90 border-rose-500 text-rose-100"
                }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" && <CheckCircle2 className="size-4 shrink-0" />}
                {notification.type === "warning" && <AlertTriangle className="size-4 shrink-0 text-amber-300" />}
                <span>{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-xs opacity-70 font-bold ml-2">
                ✕
              </button>
            </div>
          </div>
        )}

        <div data-inner-scroll className="gb-scroll flex-1 overflow-y-auto px-6 py-5 sm:px-10">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Daily Basket Total
              </p>
              <p className="display-title tabular-nums mt-1 text-4xl text-leaf-deep font-bold">
                {formatINR(daily)}
                <span className="text-sm font-normal text-muted-foreground"> / day</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Monthly Subscription ({DELIVERY_DAYS_PER_MONTH} Days)
              </p>
              <p className="display-title tabular-nums mt-1 text-4xl text-ink font-bold">
                {formatINR(monthly)}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: <PackageCheck className="size-4" />, k: "Products", v: String(products) },
              { icon: <Repeat className="size-4" />, k: "Total units", v: String(items) },
              { icon: <Sunrise className="size-4" />, k: "Delivery", v: "6 AM Daily" },
              {
                icon: <Repeat className="size-4" />,
                k: "Frequency",
                v: `${DELIVERY_DAYS_PER_MONTH} days/mo`,
              },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-white/50 bg-white/40 p-4 shadow-sm">
                <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {s.icon}
                  {s.k}
                </dt>
                <dd className="display-title mt-1 text-lg font-bold text-ink">{s.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 space-y-2.5">
            {lines.length === 0 && (
              <div className="rounded-2xl border border-dashed border-muted-foreground/30 py-10 text-center text-sm text-muted-foreground">
                Nothing selected yet — scroll back up through the 8 farm worlds and fill your morning basket!
              </div>
            )}
            {lines.map(({ product, quantity, daily: d, monthly: m }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/50 px-4 py-3 shadow-sm"
              >
                {product.image.startsWith("http") || product.image.startsWith("/") ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-2xl" aria-hidden>
                    {product.image}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {product.name}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    · {product.unit} × {quantity}
                  </span>
                </span>
                <span className="tabular-nums text-sm font-bold text-leaf-deep">{formatINR(d)}/day</span>
                <span className="hidden tabular-nums text-sm font-medium text-muted-foreground sm:inline">
                  {formatINR(m)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/40 bg-white/40 px-6 py-5 text-center sm:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              disabled={lines.length === 0}
              className="w-full sm:w-auto rounded-full bg-leaf-deep px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-cream transition-all hover:bg-leaf disabled:opacity-40 shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <Repeat className="size-4 text-emerald-300" />
              <span>Confirm & Build Monthly Subscription</span>
            </button>
            <button
              type="button"
              onClick={() => setShowOneTimeModal(true)}
              disabled={lines.length === 0 || isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-emerald-900 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-emerald-800 disabled:opacity-40 shadow-lg cursor-pointer"
            >
              <CreditCard className="size-4 text-emerald-400" />
              <span>1-Time Shopping ({formatINR(daily)})</span>
            </button>
          </div>
          <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Razorpay Subscription Engine & COD Support · RecoverIQ Pro Revenue Safeguard Integrated
          </p>
        </footer>
      </div>

      {/* MODAL 1: Monthly Subscription Modal */}
      {confirmed && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-leaf-deep/40 px-6 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            className="glass-panel w-full max-w-lg rounded-[24px] border border-white/80 bg-white/90 p-6 sm:p-8 text-center shadow-2xl"
            style={{ animation: "gb-rise 420ms ease-out both" }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-3xl">🌅</span>
              <button
                type="button"
                onClick={() => setConfirmed(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full bg-white/70 text-ink shadow-sm hover:bg-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <h3 className="display-title text-2xl sm:text-3xl font-bold text-ink">Monthly Subscription Checkout</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {products} products · {formatINR(daily)}/day · {formatINR(monthly)}/month
            </p>

            <div className="mt-4 space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Phone (Twilio Call) *
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Delivery Address (House/Street/Flat) *
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Flat 402, Green Glen Towers"
                  className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Active Subscription Management Card */}
            {activeSubscription && (
              <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/80 p-4 text-left shadow-lg text-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Active Customer Subscription
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                      activeSubscription.status === "PAID"
                        ? "bg-emerald-500 text-slate-950"
                        : activeSubscription.status === "NOT_PAID_YET"
                        ? "bg-amber-400 text-slate-950 animate-pulse"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {activeSubscription.status === "PAID"
                      ? "🟢 PAID (This Month)"
                      : activeSubscription.status === "NOT_PAID_YET"
                      ? "🔴 NOT PAID YET"
                      : "⚪ CANCELLED"}
                  </span>
                </div>
                <div className="mt-2 text-xs">
                  <p className="font-bold text-white">{customerName} · {customerPhone}</p>
                  <p className="text-[11px] text-emerald-200/80 truncate">
                    📍 {addressLine}, {city} - {pincode} ({landmark})
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {activeSubscription.status !== "CANCELLED" && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleCancelSubscription}
                      className="rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-[10px] font-bold text-white transition shadow-sm cursor-pointer"
                    >
                      🚫 Cancel Subscription
                    </button>
                  )}
                  {activeSubscription.status === "PAID" && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSimulateAutopayFailure}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition shadow-sm cursor-pointer"
                    >
                      ⚡ Simulate Auto-Pay Failure (Next Month)
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setConfirmed(false);
                  handleRazorpaySubscribe();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-900 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-800 shadow-md cursor-pointer"
              >
                <CreditCard className="size-4 text-emerald-400" />
                <span>Pay via Razorpay Test Checkout ({formatINR(monthly)})</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setConfirmed(false);
                    handleSimulateFailure("EXPIRED_CARD");
                  }}
                  className="rounded-xl border border-rose-400 bg-rose-500/10 px-3 py-2 text-[10px] font-bold uppercase text-rose-900 hover:bg-rose-500/20 cursor-pointer"
                >
                  ⚡ Simulate Expired Card
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setConfirmed(false);
                    handleSimulateFailure("INSUFFICIENT_FUNDS");
                  }}
                  className="rounded-xl border border-amber-400 bg-amber-500/10 px-3 py-2 text-[10px] font-bold uppercase text-amber-950 hover:bg-amber-500/20 cursor-pointer"
                >
                  ⚡ Simulate No Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-Time Shopping Order Modal (Razorpay + Cash on Delivery) */}
      {showOneTimeModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-leaf-deep/40 px-6 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            className="glass-panel w-full max-w-lg rounded-[24px] border border-white/80 bg-white/90 p-6 sm:p-8 text-center shadow-2xl"
            style={{ animation: "gb-rise 420ms ease-out both" }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-3xl">🛍️</span>
              <button
                type="button"
                onClick={() => setShowOneTimeModal(false)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full bg-white/70 text-ink shadow-sm hover:bg-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <h3 className="display-title text-2xl sm:text-3xl font-bold text-ink">1-Time Grocery Order</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {products} products · Total Order Amount: {formatINR(daily)}
            </p>

            <div className="mt-4 space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Phone (Delivery Boy Contact) *
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Delivery Address (House/Street/Flat) *
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Flat 402, Green Glen Towers"
                  className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOneTimePaymentType("RAZORPAY")}
                    className={`rounded-xl border p-3 text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      oneTimePaymentType === "RAZORPAY"
                        ? "border-emerald-600 bg-emerald-100 text-emerald-950 shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">💳</span>
                    <span>Online (Razorpay)</span>
                    <span className="text-[9px] font-normal text-muted-foreground">Prepaid · Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOneTimePaymentType("COD")}
                    className={`rounded-xl border p-3 text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      oneTimePaymentType === "COD"
                        ? "border-emerald-600 bg-emerald-100 text-emerald-950 shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">💵</span>
                    <span>Cash on Delivery (COD)</span>
                    <span className="text-[9px] font-normal text-muted-foreground">Pay to Delivery Boy</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePlaceOneTimeOrder(oneTimePaymentType)}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-900 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-800 shadow-md cursor-pointer"
              >
                {oneTimePaymentType === "RAZORPAY" ? (
                  <>
                    <CreditCard className="size-4 text-emerald-400" />
                    <span>Pay via Razorpay Online ({formatINR(daily)})</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="size-4 text-emerald-400" />
                    <span>Place Order — Cash on Delivery ({formatINR(daily)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
