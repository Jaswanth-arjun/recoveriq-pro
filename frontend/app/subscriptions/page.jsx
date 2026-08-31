"use client";

import { useCallback, useEffect, useState } from "react";
import { api, inr } from "../../lib/api";
import useLive from "../../lib/useLive";
import { UserCheck, MapPin, AlertTriangle, CheckCircle2, Ban, Trash2, ShoppingBag, Truck, CreditCard, DollarSign } from "lucide-react";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("subscriptions"); // "subscriptions" | "one_time_orders"
  const [subscriptions, setSubscriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const { events } = useLive();

  const loadSubscriptions = useCallback(async () => {
    try {
      const data = await api(`/subscriptions?status=${filterStatus}`);
      setSubscriptions(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [filterStatus]);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api("/orders");
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
    loadOrders();
    const t = setInterval(() => {
      loadSubscriptions();
      loadOrders();
    }, 4000);
    return () => clearInterval(t);
  }, [loadSubscriptions, loadOrders]);

  useEffect(() => {
    const relevant = events.find(
      (e) => e.type.startsWith("subscription") || e.type.startsWith("order") || e.type === "system.reset"
    );
    if (relevant) {
      loadSubscriptions();
      loadOrders();
    }
  }, [events, loadSubscriptions, loadOrders]);

  const handleCancel = async (subId) => {
    setBusyId(subId);
    try {
      await api(`/subscriptions/${subId}/cancel`, { method: "POST" });
      setNotice(`Subscription #${subId} successfully CANCELLED.`);
      loadSubscriptions();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSimulateAutopayFailure = async (subId) => {
    setBusyId(subId);
    try {
      const res = await api(`/subscriptions/${subId}/simulate-autopay-failure`, { method: "POST" });
      setNotice(`⚡ Auto-pay failure simulated for Sub #${subId}! Status updated to 'NOT PAID YET'. Event ID: ${res.event_id}`);
      loadSubscriptions();
      setTimeout(() => setNotice(null), 5000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCleanupDeleted = async () => {
    setBusyId("cleanup");
    try {
      const res = await api("/subscriptions/cleanup-deleted", { method: "POST" });
      setNotice(`🧹 Retention Cleanup complete! ${res.deleted_count} cancelled subscription records purged from database.`);
      loadSubscriptions();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleDelivery = async (orderId) => {
    setBusyId(`order_del_${orderId}`);
    try {
      const res = await api(`/orders/${orderId}/toggle-delivery`, { method: "POST" });
      setNotice(`🚚 Order #${orderId} delivery status updated to '${res.delivery_status}'.`);
      loadOrders();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkOrderPaid = async (orderId) => {
    setBusyId(`order_paid_${orderId}`);
    try {
      await api(`/orders/${orderId}/mark-paid`, { method: "POST" });
      setNotice(`💵 COD Payment collected for Order #${orderId}! Payment status updated to 'PAID'.`);
      loadOrders();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteSubscription = async (subId) => {
    if (!window.confirm(`Are you sure you want to delete customer subscription #${subId}?`)) return;
    setBusyId(`del_sub_${subId}`);
    try {
      await api(`/subscriptions/${subId}`, { method: "DELETE" });
      setNotice(`🗑️ Customer Subscription #${subId} deleted successfully!`);
      loadSubscriptions();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete 1-time order #${orderId}?`)) return;
    setBusyId(`del_ord_${orderId}`);
    try {
      await api(`/orders/${orderId}`, { method: "DELETE" });
      setNotice(`🗑️ 1-Time Order #${orderId} deleted successfully!`);
      loadOrders();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const paidCount = subscriptions.filter((s) => s.status === "PAID").length;
  const notPaidCount = subscriptions.filter((s) => s.status === "NOT_PAID_YET").length;
  const cancelledCount = subscriptions.filter((s) => s.status === "CANCELLED").length;
  const totalMRR = subscriptions
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + (s.monthly_total || 0), 0);

  const pendingDeliveries = orders.filter((o) => o.delivery_status === "NOT_DELIVERED_YET").length;
  const deliveredOrders = orders.filter((o) => o.delivery_status === "DELIVERED").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="size-6 text-emerald-400" />
            <span>Merchant Directory: Subscribers & 1-Time Deliveries</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage monthly subscriber auto-pays, delivery locations, and 1-time shopping orders (Razorpay & COD)
          </p>
        </div>

        <button
          onClick={handleCleanupDeleted}
          disabled={busyId === "cleanup"}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 transition cursor-pointer"
        >
          <Trash2 className="size-4 text-rose-400" />
          <span>{busyId === "cleanup" ? "Cleaning..." : "Retention Cleanup (Purge Cancelled)"}</span>
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-4 py-3 text-sm">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "subscriptions"
              ? "bg-emerald-500 text-slate-950 shadow-lg"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <UserCheck className="size-4" />
          <span>Monthly Subscriptions ({subscriptions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("one_time_orders")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "one_time_orders"
              ? "bg-emerald-500 text-slate-950 shadow-lg"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <ShoppingBag className="size-4" />
          <span>1-Time Shopping Orders ({orders.length})</span>
          {pendingDeliveries > 0 && (
            <span className="rounded-full bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-extrabold">
              {pendingDeliveries} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === "subscriptions" ? (
        <>
          {/* Subscription Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Subscribers</div>
              <div className="mt-1 text-2xl font-bold text-white">{subscriptions.length}</div>
            </div>

            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Monthly MRR</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">{inr(totalMRR)}</div>
            </div>

            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">🟢 Paid (This Month)</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">{paidCount}</div>
            </div>

            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">🔴 Not Paid Yet</div>
              <div className="mt-1 text-2xl font-bold text-amber-400">{notPaidCount}</div>
            </div>

            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">⚪ Cancelled</div>
              <div className="mt-1 text-2xl font-bold text-slate-400">{cancelledCount}</div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {["ALL", "PAID", "NOT_PAID_YET", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  filterStatus === st
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-slate-800/60 text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {st === "ALL"
                  ? "All Subscribers"
                  : st === "PAID"
                  ? "🟢 Paid"
                  : st === "NOT_PAID_YET"
                  ? "🔴 Not Paid Yet"
                  : "⚪ Cancelled"}
              </button>
            ))}
          </div>

          {/* Subscribers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.length === 0 && (
              <div className="col-span-full rounded-2xl bg-[#111827] border border-slate-800 p-12 text-center text-slate-500">
                No subscribers found for current filter. Place a subscription on the GreenBasket storefront!
              </div>
            )}

            {subscriptions.map((sub) => {
              const cust = sub.customer || {};
              const addr = sub.delivery_address || {};
              return (
                <div
                  key={sub.id}
                  className={`rounded-2xl bg-[#111827] border p-5 transition-all shadow-md ${
                    sub.status === "PAID"
                      ? "border-emerald-500/30"
                      : sub.status === "NOT_PAID_YET"
                      ? "border-amber-500/50 bg-amber-950/10"
                      : "border-slate-800 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{cust.name || "Customer"}</h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          #{sub.subscription_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cust.phone} · {cust.email}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${
                        sub.status === "PAID"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : sub.status === "NOT_PAID_YET"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {sub.status === "PAID"
                        ? "🟢 PAID (This Month)"
                        : sub.status === "NOT_PAID_YET"
                        ? "🔴 NOT PAID YET"
                        : "⚪ CANCELLED"}
                    </span>
                  </div>

                  {/* Delivery Address Details */}
                  <div className="mt-4 rounded-xl bg-[#0a0e17] border border-slate-800 p-3.5 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase tracking-wide">
                      <MapPin className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Delivery Address & Location</span>
                    </div>
                    <p className="font-medium text-slate-200 pl-5">
                      {addr.address_line || cust.address_line || "Flat 402, Green Glen Towers"}
                    </p>
                    <p className="text-slate-400 pl-5">
                      {addr.city || cust.city || "Hyderabad"} - {addr.pincode || cust.pincode || "500081"}
                      {(addr.landmark || cust.landmark) && (
                        <span className="text-emerald-400/80"> · Landmark: {addr.landmark || cust.landmark}</span>
                      )}
                    </p>
                  </div>

                  {/* Selected Basket Items & Quantities */}
                  <div className="mt-3 rounded-xl bg-[#070b12] border border-emerald-900/40 p-3.5 text-xs shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 border-b border-emerald-900/30 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="size-3.5 text-emerald-400" />
                        <span>Subscribed Daily Basket Items</span>
                      </span>
                      <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-800/50">
                        {sub.items_count || 3} Items / Day
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {((sub.items_detail && sub.items_detail.length > 0) ? sub.items_detail : [
                        { name: "Farm Fresh Milk (A2 Cow)", unit: "1 Liter", quantity: 1 },
                        { name: "Organic Tomatoes", unit: "500g", quantity: 1 },
                        { name: "Fresh Palak / Spinach", unit: "1 bunch", quantity: 1 },
                      ]).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 text-slate-200">
                          <span className="font-semibold text-white">
                            🥦 {item.name} <span className="text-slate-400 text-[10px] font-normal">({item.unit || '1 pc'})</span>
                          </span>
                          <span className="font-extrabold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-700/50 text-[11px]">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subscription Breakdown */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-800/50 p-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Daily Basket</span>
                      <span className="font-bold text-emerald-400">{inr(sub.daily_total)}/day</span>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Monthly Total</span>
                      <span className="font-bold text-white">{inr(sub.monthly_total)}/mo</span>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Delivery Time</span>
                      <span className="font-bold text-slate-300">6 AM Daily</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    {sub.status === "PAID" && (
                      <button
                        disabled={busyId === sub.id}
                        onClick={() => handleSimulateAutopayFailure(sub.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 transition cursor-pointer"
                      >
                        <AlertTriangle className="size-3.5" />
                        <span>Trigger Auto-Pay Failure</span>
                      </button>
                    )}

                    {sub.status !== "CANCELLED" && (
                      <button
                        disabled={busyId === sub.id}
                        onClick={() => handleCancel(sub.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 transition cursor-pointer"
                      >
                        <Ban className="size-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    <button
                      disabled={busyId === `del_sub_${sub.id}`}
                      onClick={() => handleDeleteSubscription(sub.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-400 transition cursor-pointer ml-auto"
                      title="Delete customer subscription record"
                    >
                      <Trash2 className="size-3.5 text-red-400" />
                      <span>Delete Customer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* 1-TIME ORDERS TAB CONTENT */
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total 1-Time Orders</div>
              <div className="mt-1 text-2xl font-bold text-white">{orders.length}</div>
            </div>

            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">📦 Pending Deliveries</div>
              <div className="mt-1 text-2xl font-bold text-amber-400">{pendingDeliveries}</div>
            </div>

            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">🚚 Delivered Orders</div>
              <div className="mt-1 text-2xl font-bold text-emerald-400">{deliveredOrders}</div>
            </div>

            <div className="rounded-xl bg-[#111827] border border-slate-800 p-4">
              <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">Merchant / Delivery Boy</div>
              <div className="mt-1 text-xs font-bold text-slate-300">Active · Self Delivery Mode</div>
            </div>
          </div>

          {/* Orders Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.length === 0 && (
              <div className="col-span-full rounded-2xl bg-[#111827] border border-slate-800 p-12 text-center text-slate-500">
                No 1-time shopping orders placed yet. Add items to bag on GreenBasket store and choose '1-Time Shopping'!
              </div>
            )}

            {orders.map((ord) => {
              const cust = ord.customer || {};
              const addr = ord.delivery_address || {};
              const isDelivered = ord.delivery_status === "DELIVERED";
              const isPaid = ord.payment_status === "PAID";
              const isCOD = ord.payment_type === "COD";

              return (
                <div
                  key={ord.id}
                  className={`rounded-2xl bg-[#111827] border p-5 transition-all shadow-md ${
                    isDelivered ? "border-emerald-500/30" : "border-amber-500/40 bg-amber-950/10"
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{cust.name || "Customer"}</h3>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          #{ord.order_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cust.phone} · {cust.email}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {/* Delivery Status Badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          isDelivered
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                        }`}
                      >
                        {isDelivered ? "🟢 DELIVERED" : "🔴 NOT DELIVERED YET"}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          isPaid
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {isCOD
                          ? isPaid
                            ? "💵 COD: PAID"
                            : "💵 COD: UNPAID (Collect Cash)"
                          : "💳 RAZORPAY: PAID"}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Address Details */}
                  <div className="mt-4 rounded-xl bg-[#0a0e17] border border-slate-800 p-3.5 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase tracking-wide">
                      <MapPin className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Delivery Boy Address Details</span>
                    </div>
                    <p className="font-medium text-slate-200 pl-5">
                      {addr.address_line || cust.address_line || "Flat 402, Green Glen Towers"}
                    </p>
                    <p className="text-slate-400 pl-5">
                      {addr.city || cust.city || "Hyderabad"} - {addr.pincode || cust.pincode || "500081"}
                      {(addr.landmark || cust.landmark) && (
                        <span className="text-emerald-400/80"> · Landmark: {addr.landmark || cust.landmark}</span>
                      )}
                    </p>
                  </div>

                  {/* Order Financial Info */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-800/50 p-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Total Amount</span>
                      <span className="font-bold text-emerald-400">{inr(ord.total_amount)}</span>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Payment Method</span>
                      <span className="font-bold text-white">{isCOD ? "💵 COD" : "💳 Razorpay"}</span>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Items Count</span>
                      <span className="font-bold text-slate-300">{ord.items_count} items</span>
                    </div>
                  </div>

                  {/* Selected Basket Items & Quantities */}
                  <div className="mt-3 rounded-xl bg-[#0a0e17] border border-slate-800 p-3 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5 border-b border-slate-800/80 pb-1">
                      <span>🛒 Ordered Grocery Items</span>
                      <span>{ord.items_count} Units Total</span>
                    </div>
                    <div className="space-y-1">
                      {ord.items_detail && ord.items_detail.length > 0 ? (
                        ord.items_detail.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-200">
                            <span className="font-medium">
                              • {item.name} <span className="text-slate-500 text-[10px]">({item.unit || '1 pc'})</span>
                            </span>
                            <span className="font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[11px]">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic text-[11px]">
                          {ord.items_count} Fresh Grocery items in order
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Merchant / Delivery Boy Controls */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    {/* Delivery Status Toggle */}
                    <button
                      disabled={busyId === `order_del_${ord.id}`}
                      onClick={() => handleToggleDelivery(ord.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                        isDelivered
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                      }`}
                    >
                      <Truck className="size-3.5" />
                      <span>{isDelivered ? "↩️ Mark as Pending Delivery" : "📦 Mark as DELIVERED"}</span>
                    </button>

                    {/* Mark COD Paid Button */}
                    {isCOD && !isPaid && (
                      <button
                        disabled={busyId === `order_paid_${ord.id}`}
                        onClick={() => handleMarkOrderPaid(ord.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition cursor-pointer shadow-md"
                      >
                        <DollarSign className="size-3.5" />
                        <span>💵 Received Cash (Mark Paid)</span>
                      </button>
                    )}

                    {/* Delete Order Button */}
                    <button
                      disabled={busyId === `del_ord_${ord.id}`}
                      onClick={() => handleDeleteOrder(ord.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-400 transition cursor-pointer ml-auto"
                      title="Delete 1-time order record"
                    >
                      <Trash2 className="size-3.5 text-red-400" />
                      <span>Delete Order</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

