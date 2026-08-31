"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function ReceivablesPage() {
  const [aging, setAging] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState(null);
  
  // Modal state for creating invoice
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: "5000",
    due_date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [agingRes, invoicesRes] = await Promise.all([
        api("/receivables/aging"),
        api(`/receivables/invoices?bucket=${selectedBucket}`),
      ]);
      setAging(agingRes);
      setInvoices(invoicesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBucket]);

  const handleRemind = async (invId) => {
    try {
      setRemindingId(invId);
      const res = await api(`/receivables/invoices/${invId}/remind`, { method: "POST" });
      alert(`Payment Reminder & Razorpay Link Sent! Short URL: ${res.payment_link || "Created"}`);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api("/receivables/invoices", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create invoice");
    }
  };

  const bucketsList = [
    { key: "ALL", label: "All Invoices" },
    { key: "CURRENT", label: "Current (Not Due)" },
    { key: "0_30", label: "1-30 Days Overdue" },
    { key: "31_60", label: "31-60 Days Overdue" },
    { key: "61_90", label: "61-90 Days Overdue" },
    { key: "90_PLUS", label: "90+ Days Overdue" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">B2B Receivables Aging Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track overdue B2B receivables, aging buckets, and automated multi-tier recovery.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-sm transition-all shadow-md shadow-emerald-500/20"
        >
          + Create B2B Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Outstanding</div>
          <div className="text-xl font-bold text-white mt-1">₹{aging?.total_outstanding?.toLocaleString() || "0"}</div>
          <div className="text-[11px] text-slate-500 mt-1">{aging?.invoice_count || 0} Total Active Invoices</div>
        </div>
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Current (Not Due)</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">₹{aging?.buckets?.current?.toLocaleString() || "0"}</div>
          <div className="text-[11px] text-slate-500 mt-1">{aging?.counts?.current || 0} Invoices</div>
        </div>
        <div className="bg-[#111827] border border-amber-500/30 rounded-xl p-4">
          <div className="text-xs font-semibold text-amber-400 uppercase">1–30 Days Overdue</div>
          <div className="text-xl font-bold text-amber-400 mt-1">₹{aging?.buckets?.["0_30"]?.toLocaleString() || "0"}</div>
          <div className="text-[11px] text-slate-500 mt-1">{aging?.counts?.["0_30"] || 0} Invoices</div>
        </div>
        <div className="bg-[#111827] border border-orange-500/30 rounded-xl p-4">
          <div className="text-xs font-semibold text-orange-400 uppercase">31–60 Days Overdue</div>
          <div className="text-xl font-bold text-orange-400 mt-1">₹{aging?.buckets?.["31_60"]?.toLocaleString() || "0"}</div>
          <div className="text-[11px] text-slate-500 mt-1">{aging?.counts?.["31_60"] || 0} Invoices</div>
        </div>
        <div className="bg-[#111827] border border-rose-500/30 rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="text-xs font-semibold text-rose-400 uppercase">61–90+ Days Overdue</div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            ₹{((aging?.buckets?.["61_90"] || 0) + (aging?.buckets?.["90_plus"] || 0)).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">High Risk Receivables</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {bucketsList.map((b) => (
          <button
            key={b.key}
            onClick={() => setSelectedBucket(b.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedBucket === b.key
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a2333] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Days Overdue</th>
                <th className="px-4 py-3">Aging Bucket</th>
                <th className="px-4 py-3">Escalation Tier</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading receivables...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No B2B invoices found in this bucket.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-white">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{inv.customer.name}</div>
                      <div className="text-[10px] text-slate-500">{inv.customer.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      ₹{inv.outstanding_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {inv.days_overdue > 0 ? (
                        <span className="text-rose-400 font-semibold">{inv.days_overdue} days</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Not Due</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.aging_bucket === "CURRENT"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : inv.aging_bucket === "0_30"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : inv.aging_bucket === "31_60"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {inv.aging_bucket}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 font-mono">
                        Tier {inv.escalation_level} {inv.escalation_level === 0 ? "(Friendly)" : inv.escalation_level === 1 ? "(Soft Reminder)" : inv.escalation_level === 2 ? "(Follow-up)" : inv.escalation_level === 3 ? "(Manager)" : "(Human Legal)"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemind(inv.id)}
                        disabled={remindingId === inv.id}
                        className="rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        {remindingId === inv.id ? "Sending..." : "Send Reminder & Link"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating B2B Invoice */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create B2B Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Customer Phone</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={form.invoice_number}
                    onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
