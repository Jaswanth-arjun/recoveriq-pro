"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function ReceivablesPage() {
  const [aging, setAging] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState(null);
  const [runningBulk, setRunningBulk] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Demo Simulator State
  const [demoMode, setDemoMode] = useState(false);
  const [simulatingId, setSimulatingId] = useState(null);

  // Policy state
  const [policy, setPolicy] = useState(null);

  // Form state for creating invoice
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    finance_contact: "",
    invoice_number: "INV-1001",
    amount: "150000",
    invoice_date: "",
    payment_terms: "30_days",
    due_date: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [agingRes, invoicesRes, policyRes] = await Promise.all([
        api("/receivables/aging"),
        api(`/receivables/invoices?bucket=${selectedBucket}`),
        api("/receivables/policy").catch(() => null),
      ]);
      setAging(agingRes);
      setInvoices(invoicesRes);
      if (policyRes) setPolicy(policyRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    setForm((prev) => ({
      ...prev,
      invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_date: new Date().toISOString().split("T")[0],
    }));
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [selectedBucket, mounted]);

  const handleRemind = async (invId) => {
    try {
      setRemindingId(invId);
      const res = await api(`/receivables/invoices/${invId}/remind`, { method: "POST" });
      alert(`Payment Reminder & Razorpay Link Sent!\nPayment Link: ${res.payment_link || "Created"}`);
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

  const handleDeleteInvoice = async (invId) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api(`/receivables/invoices/${invId}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete invoice");
    }
  };

  const handleMarkPaid = async (invId) => {
    try {
      const res = await api(`/receivables/invoices/${invId}/pay`, { method: "POST" });
      alert(`✓ Payment Received! Recovered ₹${res.amount_recovered?.toLocaleString()}.\nAutomated recovery workflow STOPPED.`);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to mark invoice as paid");
    }
  };

  const handleRunBulkRecovery = async () => {
    try {
      setRunningBulk(true);
      const res = await api("/receivables/run-bulk-recovery", { method: "POST" });
      alert(`🚀 Bulk AI Auto-Recovery Executed!\nProcessed ${res.processed_count} overdue invoices against policy guard.`);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to run bulk recovery");
    } finally {
      setRunningBulk(false);
    }
  };



  const handleSimulateStage = async (invId, stageKey, extraParams = {}) => {
    try {
      setSimulatingId(invId);
      const res = await api(`/receivables/invoices/${invId}/simulate-stage`, {
        method: "POST",
        body: JSON.stringify({
          stage: stageKey,
          ...extraParams,
        }),
      });
      alert(`⚡ Demo Policy Stage Triggered!\n${res.message}`);
      loadData();
    } catch (err) {
      alert(err.message || "Simulation failed");
    } finally {
      setSimulatingId(null);
    }
  };

  const handleUpdatePolicy = async (e) => {
    e.preventDefault();
    try {
      await api("/receivables/policy", {
        method: "POST",
        body: JSON.stringify(policy),
      });
      alert("Recovery Policy updated successfully!");
      setShowPolicyModal(false);
    } catch (err) {
      alert(err.message || "Failed to update policy");
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
    <div className="space-y-6" suppressHydrationWarning>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            B2B AR Recovery & Aging Dashboard
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded uppercase font-semibold">
              Live AI Recovery
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated payment term calculation, multi-stage recovery policy, P2P extraction, and Razorpay links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Demo Mode Toggle Switch */}
          <div className="flex items-center gap-2 bg-[#111827] border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs shadow-sm">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              ⚡ Enable Demo Mode
            </span>
            <button
              type="button"
              onClick={() => setDemoMode(!demoMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                demoMode ? "bg-amber-500" : "bg-slate-700"
              }`}
              title="Toggle Demo Mode to test policy stages"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  demoMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => setShowPolicyModal(true)}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-2 text-xs transition-all flex items-center gap-1.5"
          >
            ⚙️ Recovery Policy
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            + Create B2B Invoice
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-3.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding</div>
          <div className="text-lg font-bold text-white mt-1">₹{aging?.total_outstanding?.toLocaleString() || "0"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{aging?.invoice_count || 0} Active Invoices</div>
        </div>

        <div className="bg-[#111827] border border-rose-500/30 rounded-xl p-3.5">
          <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Revenue At Risk</div>
          <div className="text-lg font-bold text-rose-400 mt-1">₹{aging?.revenue_at_risk?.toLocaleString() || "0"}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Overdue Accounts</div>
        </div>

        <div className="bg-[#111827] border border-emerald-500/30 rounded-xl p-3.5">
          <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Recovered Revenue</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">₹{aging?.recovered_revenue?.toLocaleString() || "0"}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Rate: {aging?.recovery_rate || 0}%</div>
        </div>

        <div className="bg-[#111827] border border-amber-500/30 rounded-xl p-3.5">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Due Today</div>
          <div className="text-lg font-bold text-amber-400 mt-1">₹{aging?.due_today_amount?.toLocaleString() || "0"}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">{aging?.due_today_count || 0} Invoices Due</div>
        </div>

        <div className="bg-[#111827] border border-indigo-500/30 rounded-xl p-3.5">
          <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Promises to Pay</div>
          <div className="text-lg font-bold text-indigo-400 mt-1">{aging?.promises_count || 0} Active</div>
          <div className="text-[10px] text-indigo-500/80 mt-0.5">Broken: {aging?.broken_promises_count || 0}</div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-3.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">0–30 Days Overdue</div>
          <div className="text-lg font-bold text-amber-300 mt-1">₹{aging?.buckets?.["0_30"]?.toLocaleString() || "0"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{aging?.counts?.["0_30"] || 0} Invoices</div>
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
                <th className="px-4 py-3">Customer / Company</th>
                <th className="px-4 py-3">Terms & Dates</th>
                <th className="px-4 py-3">Amount & Due</th>
                <th className="px-4 py-3">Aging Bucket</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Promise Status</th>
                <th className="px-4 py-3">Escalation</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Loading receivables...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No B2B invoices found in this bucket.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {inv.invoice_number}
                      <div className="text-[10px] font-normal text-slate-500">{inv.status}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{inv.customer.name}</div>
                      <div className="text-[10px] text-slate-500">{inv.customer.phone} • {inv.customer.email}</div>
                      {inv.finance_contact && (
                        <div className="text-[10px] text-indigo-400">Fin: {inv.finance_contact}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 font-medium">Terms: {inv.payment_terms.replace("_", " ")}</div>
                      <div className="text-[10px] text-slate-500">
                        Inv: {new Date(inv.invoice_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-emerald-400">₹{inv.outstanding_amount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                      {inv.days_overdue > 0 ? (
                        <span className="text-[10px] text-rose-400 font-bold">{inv.days_overdue}d Overdue</span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold">
                          {Math.ceil((new Date(inv.due_date) - new Date()) / (1000 * 60 * 60 * 24)) > 0
                            ? `Remaining: ${Math.ceil((new Date(inv.due_date) - new Date()) / (1000 * 60 * 60 * 24))} Days`
                            : "Due Today"}
                        </span>
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
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.risk_level === "LOW"
                            ? "text-emerald-400"
                            : inv.risk_level === "MEDIUM"
                            ? "text-amber-400"
                            : inv.risk_level === "HIGH"
                            ? "text-orange-400"
                            : "text-rose-400 animate-pulse"
                        }`}
                      >
                        {inv.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.promise_status === "PROMISED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10 whitespace-nowrap">
                          🤝 Promised ({inv.promised_date || "Active"})
                        </span>
                      ) : inv.promise_status === "BROKEN" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10 whitespace-nowrap">
                          🚨 Promise Broken
                        </span>
                      ) : inv.promise_status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                          ✓ Promise Kept
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Tier {inv.escalation_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {inv.status === "PAID" ? (
                          <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold">
                            ✓ Fully Paid
                          </span>
                        ) : demoMode ? (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSimulateStage(inv.id, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            disabled={simulatingId === inv.id}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none cursor-pointer whitespace-nowrap"
                          >
                            <option value="" className="bg-[#111827] text-slate-300">
                              ⚡ Run Policy Stage...
                            </option>
                            <option value="pre_due_3d" className="bg-[#111827] text-amber-300">
                              🕒 Stage 1: 3 Days Pre-Due (Email)
                            </option>
                            <option value="due_today" className="bg-[#111827] text-amber-300">
                              📅 Stage 2: Due Today (Check/Email)
                            </option>
                            <option value="overdue_1d" className="bg-[#111827] text-amber-300">
                              📧 Stage 3: 1 Day Overdue (Email)
                            </option>
                            <option value="overdue_2d" className="bg-[#111827] text-amber-300">
                              💬 Stage 4: 2 Days Overdue (SMS/WA)
                            </option>
                            <option value="overdue_3d" className="bg-[#111827] text-amber-300">
                              📨 Stage 5: 3 Days Overdue (Follow-up)
                            </option>
                            <option value="overdue_7d_p2p" className="bg-[#111827] text-indigo-300 font-bold">
                              🤝 Stage 6: 7 Days Overdue (Ask P2P Date)
                            </option>
                            <option value="overdue_8d_voice" className="bg-[#111827] text-rose-300">
                              📞 Stage 7: 8+ Days Overdue (Voice Call)
                            </option>
                          </select>
                        ) : (
                          <button
                            onClick={() => handleRemind(inv.id)}
                            disabled={remindingId === inv.id}
                            className="rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {remindingId === inv.id
                              ? "Sending..."
                              : inv.days_overdue > 0
                              ? "Send Overdue Remind"
                              : "Send Payment Link"}
                          </button>
                        )}
                        {inv.status !== "PAID" && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap"
                            title="Mark as Paid & Stop Workflow"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-1 text-[11px] font-semibold transition-colors"
                          title="Delete Invoice"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating B2B Invoice with Payment Terms */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Create B2B Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company / Customer Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. ABC Pvt Ltd"
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="billing@abc.com"
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+919392443002"
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Finance Contact Person (Optional)</label>
                <input
                  type="text"
                  value={form.finance_contact}
                  onChange={(e) => setForm({ ...form, finance_contact: e.target.value })}
                  placeholder="e.g. Rahul Sharma (CFO)"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={form.invoice_date}
                    onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Terms</label>
                  <select
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white font-medium"
                  >
                    <option value="immediate">Immediate (0 Days)</option>
                    <option value="7_days">7 Days</option>
                    <option value="15_days">15 Days</option>
                    <option value="30_days">30 Days</option>
                    <option value="45_days">45 Days</option>
                    <option value="60_days">60 Days</option>
                    <option value="90_days">90 Days</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Custom Due Date (Optional)</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  placeholder="Auto-calculated if blank"
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  If blank, due date automatically calculates from Invoice Date + Terms.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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

      {/* Modal for Recovery Policy Configuration */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              ⚙️ Configurable Recovery Timeline Policy
              <span className="text-xs text-emerald-400 font-normal">Policy Guard Compliant</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Configure intervals and communication channels for automated AR recovery workflow.
            </p>
            <form onSubmit={handleUpdatePolicy} className="space-y-3 text-xs">
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {policy?.timeline &&
                  Object.entries(policy.timeline).map(([days, rule]) => (
                    <div key={days} className="bg-[#1a2333] border border-slate-800 rounded p-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">
                          {days.startsWith("-") ? `${Math.abs(parseInt(days))} days before due date` : days === "0" ? "On Due Date" : `${days} days overdue`}
                        </div>
                        <div className="text-[11px] text-slate-400">{rule.label}</div>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                        {rule.channel}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
