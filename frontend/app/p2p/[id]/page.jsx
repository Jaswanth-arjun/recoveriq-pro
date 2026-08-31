"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PublicP2PPage() {
  const params = useParams();
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const API_BASE = "http://localhost:8000/api";

  useEffect(() => {
    if (!invoiceId) return;
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/public/invoices/${invoiceId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Invoice not found or link expired.");
      }
      const data = await res.json();
      setInvoice(data);
      if (data.available_dates && data.available_dates.length > 0) {
        // Default select Day 3 or first date
        setSelectedDate(data.available_dates[2]?.date || data.available_dates[0]?.date);
      }
    } catch (err) {
      setError(err.message || "Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPromise = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      alert("Please select an expected payment date.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`${API_BASE}/public/invoices/${invoiceId}/promise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promised_date: selectedDate }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to record payment promise.");
      }

      const data = await res.json();
      setSuccessResult(data);
    } catch (err) {
      setError(err.message || "Failed to submit promise date.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-200 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-sm text-slate-400 font-mono">Loading Payment Promise Portal...</p>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-200 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111827] border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-white">Invoice Link Unavailable</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Container */}
      <div className="max-w-lg w-full space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <span>🛡️ RecoverIQ AR Portal</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400">Secure Payment Commitment</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight pt-2">Select Expected Payment Date</h1>
          <p className="text-xs text-slate-400">
            Invoice #{invoice?.invoice_number} is 7 days overdue. Please select a payment date within the next 7 days.
          </p>
        </div>

        {/* Success Screen */}
        {successResult ? (
          <div className="bg-[#111827] border border-emerald-500/40 rounded-2xl p-6 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Payment Promise Confirmed!</h2>
              <p className="text-sm text-emerald-400 font-semibold pt-1">
                Promised Payment Date: <span className="underline decoration-emerald-500/50">{successResult.promised_date}</span>
              </p>
            </div>
            <div className="bg-[#1a2333] border border-slate-800 rounded-xl p-4 text-xs text-slate-300 text-left space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Invoice Number</span>
                <span className="font-mono font-bold text-white">#{invoice.invoice_number}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Outstanding Amount</span>
                <span className="font-mono font-bold text-emerald-400">₹{invoice.outstanding_amount?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Merchant Dashboard Sync</span>
                <span className="text-emerald-400 font-semibold">✓ Updated Live (PROMISED)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              📲 Confirmation SMS & Email sent to <span className="text-slate-200">{invoice.customer_phone}</span> & <span className="text-slate-200">{invoice.customer_email}</span>.
            </p>
            <div className="pt-2">
              <a
                href={`https://rzp.io/i/b2b-inv-${invoice.invoice_number.lower()}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all text-center"
              >
                💳 Pay Online Now (Optional)
              </a>
            </div>
          </div>
        ) : (
          /* Selection Form */
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {/* Invoice Summary Card */}
            <div className="bg-[#1a2333] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer</div>
                <div className="text-sm font-bold text-white mt-0.5">{invoice?.customer_name}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Inv #{invoice?.invoice_number}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Amount Due</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  ₹{invoice?.outstanding_amount?.toLocaleString()}
                </div>
                <span className="inline-block text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-semibold mt-0.5">
                  7 Days Overdue
                </span>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* 7 Days Date Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Select Date (Next 7 Days Only)</span>
                <span className="text-[10px] text-indigo-400 font-mono">Strict 7-Day Window</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {invoice?.available_dates?.map((d) => {
                  const isSelected = selectedDate === d.date;
                  return (
                    <label
                      key={d.date}
                      onClick={() => setSelectedDate(d.date)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                          : "bg-[#1a2333] border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="promise_date"
                          value={d.date}
                          checked={isSelected}
                          onChange={() => setSelectedDate(d.date)}
                          className="accent-indigo-500 h-4 w-4"
                        />
                        <div>
                          <div className="text-xs font-bold">{d.full_label}</div>
                          <div className="text-[10px] text-slate-400">{d.days_from_now === 1 ? "Tomorrow" : `In ${d.days_from_now} days`}</div>
                        </div>
                      </div>
                      <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded ${
                        isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {d.formatted_date}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleConfirmPromise}
              disabled={submitting || !selectedDate}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Recording Promise...</span>
                </>
              ) : (
                <>
                  <span>🤝 Confirm Payment Promise</span>
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-slate-500">
              🔒 Your commitment will be automatically synced with Accounts Receivable.
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
