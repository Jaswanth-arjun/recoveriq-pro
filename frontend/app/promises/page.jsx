"use client";

import { useEffect, useState } from "react";
import API from "../../lib/api";

export default function PromisesPage() {
  const [promises, setPromises] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    promised_amount: "2500",
    promised_date: tomorrow,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/promise-to-pay?status=${selectedStatus}`);
      setPromises(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const handleCreatePromise = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Front-end date validation check: cannot be today or in the past
    const selectedDate = new Date(form.promised_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setErrorMsg("Validation Error: Promised payment date must be a FUTURE date.");
      return;
    }

    try {
      await API.post("/promise-to-pay", {
        ...form,
        promised_amount: parseFloat(form.promised_amount),
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create payment promise.");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.patch(`/promise-to-pay/${id}`, { status });
      loadData();
    } catch (err) {
      alert("Failed to update promise status");
    }
  };

  const activeCount = promises.filter((p) => p.status === "PROMISED").length;
  const brokenCount = promises.filter((p) => p.status === "BROKEN").length;
  const paidCount = promises.filter((p) => p.status === "PAID").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Promise-To-Pay (P2P) Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage customer payment commitments, automated due date enforcement, and broken promise recovery.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg("");
            setShowModal(true);
          }}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-sm transition-all shadow-md shadow-emerald-500/20"
        >
          + Record Payment Promise
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-blue-500/30 rounded-xl p-4">
          <div className="text-xs font-semibold text-blue-400 uppercase">Active Promises</div>
          <div className="text-2xl font-bold text-white mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending payment on agreed dates</div>
        </div>
        <div className="bg-[#111827] border border-emerald-500/30 rounded-xl p-4">
          <div className="text-xs font-semibold text-emerald-400 uppercase">Fulfilled (Paid)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{paidCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Recovered on time</div>
        </div>
        <div className="bg-[#111827] border border-rose-500/30 rounded-xl p-4">
          <div className="text-xs font-semibold text-rose-400 uppercase">Broken Promises</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{brokenCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Auto-escalated to AI recovery</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {["ALL", "PROMISED", "PAID", "BROKEN"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedStatus === st
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Promise Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a2333] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Promised Amount</th>
                <th className="px-4 py-3">Promised Date</th>
                <th className="px-4 py-3">Status & Timeframe</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading promises...
                  </td>
                </tr>
              ) : promises.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No payment promises recorded yet.
                  </td>
                </tr>
              ) : (
                promises.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{p.customer.name}</div>
                      <div className="text-[10px] text-slate-500">{p.customer.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      ₹{p.promised_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {new Date(p.promised_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === "PAID"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : p.status === "BROKEN"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.status === "PROMISED" && (
                          <span className="text-[11px] text-amber-400 font-medium">
                            {p.days_remaining > 0
                              ? `Due in ${p.days_remaining} days`
                              : p.days_remaining === 0
                              ? "Due Today!"
                              : "Expired"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "PROMISED" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusUpdate(p.id, "PAID")}
                            className="rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-1 text-[10px] font-semibold"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(p.id, "BROKEN")}
                            className="rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-1 text-[10px] font-semibold"
                          >
                            Mark Broken
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating Promise */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Record Customer Promise to Pay</h2>
            <p className="text-slate-400 text-xs mb-4">
              Enter agreed date for customer payment commitment. System enforces future date requirement.
            </p>

            {errorMsg && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePromise} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Customer Phone</label>
                <input
                  type="text"
                  required
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Promised Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.promised_amount}
                    onChange={(e) => setForm({ ...form, promised_amount: e.target.value })}
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Promised Date (Future Only)</label>
                  <input
                    type="date"
                    required
                    min={tomorrow}
                    value={form.promised_date}
                    onChange={(e) => setForm({ ...form, promised_date: e.target.value })}
                    className="w-full bg-[#1a2333] border border-slate-700 rounded p-2 text-white"
                  />
                </div>
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
                  Save Promise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
