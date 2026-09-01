"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, inr } from "../../lib/api";

function confBadge(c) {
  const n = Number(c || 0);
  if (n >= 70)
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (n >= 50)
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-rose-500/10 text-rose-400 border-rose-500/30";
}

function engineTag(e) {
  const v = String(e || "fallback").toLowerCase();
  if (v.includes("claude"))
    return "bg-violet-500/10 text-violet-300 border-violet-500/30";
  if (v.includes("gemini"))
    return "bg-sky-500/10 text-sky-300 border-sky-500/30";
  return "bg-slate-700/40 text-slate-400 border-slate-600";
}

function statusTag(s) {
  const v = String(s || "").toUpperCase();
  if (v.includes("RECOVER"))
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (v.includes("PENDING") || v.includes("APPROVAL"))
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  if (v.includes("STOP") || v.includes("ESCALAT"))
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  return "bg-slate-700/40 text-slate-400 border-slate-600";
}

export default function DiagnosesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const router = useRouter();

  function loadData() {
    setLoading(true);
    api("/failures")
      .then((d) => {
        const all = Array.isArray(d) ? d : d.failures || d.items || [];
        // Completed purchases auto-recover abandoned carts — those risks
        // should disappear from Diagnoses, not linger as stale rows.
        setRows(all.filter((r) => !(r.event_type === "checkout.abandoned" && (r.status === "recovered" || r.recovered))));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDeleteEvent(eventId) {
    if (!confirm("Are you sure you want to delete this risk record?")) return;
    setError(null);
    try {
      await api(`/failures/${eventId}`, { method: "DELETE" });
      setNotice(`🗑️ Risk record #${eventId} deleted.`);
      setRows((prev) => prev.filter((r) => r.id !== eventId));
      loadData();
    } catch (e) {
      setError(e.message || "Failed to delete record");
    }
  }

  async function handleTriggerStage(eventId, stage) {
    if (!stage) return;
    setNotice(null);
    setError(null);
    setTriggering(true);
    try {
      let res;
      try {
        res = await api(`/failures/${eventId}/trigger_stage`, {
          method: "POST",
          body: JSON.stringify({ stage })
        });
      } catch (err) {
        try {
          res = await api(`/failures/${eventId}/trigger-stage`, {
            method: "POST",
            body: JSON.stringify({ stage })
          });
        } catch (err2) {
          res = await api(`/checkouts/abandonments/${eventId}/trigger-stage`, {
            method: "POST",
            body: JSON.stringify({ stage })
          });
        }
      }
      if (stage === "1hr") {
        setNotice(`⚡ 1-Hour Polite Reminder Sent!\nSMS/Email Content: "${res.message || 'Reminder notification queued'}"`);
      } else if (stage === "24hr") {
        setNotice(`🎁 24-Hour Coupon (RECOVER10) Sent!\nSMS/Email Content: "${res.message || '10% OFF coupon code sent'}"`);
      } else if (stage === "purge") {
        setNotice(`⌛ Risk Purged: ${res.message || 'Risk marked as expired'}`);
      }
      loadData();
    } catch (e) {
      setError(e.message || "Failed to trigger stage action");
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnoses & Recovery Actions</h1>
          <p className="text-sm text-slate-400">
            AI-classified payment failures & stage-based recovery triggers
          </p>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-4 py-3 text-sm whitespace-pre-wrap font-mono">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Customer Details</th>
              <th className="px-4 py-3">Risk Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Cause</th>
              <th className="px-4 py-3">Stage Action (Judges Demo)</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Engine</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && (
              <tr>
                <td colSpan="10" className="px-4 py-6 text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="10" className="px-4 py-6 text-slate-500 text-center py-10">
                  No payment failures or cart abandonments recorded yet.
                  <div className="mt-2 text-xs text-slate-400">
                    Visit the <strong>GreenBasket Store page (/store)</strong> and add items to your cart to automatically record 🛒 Checkout Abandonment!
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => router.push(`/timeline?id=${r.id}`)}
                className="cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-slate-400">{r.id}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{r.customer_name || "Shopper"}</div>
                  {r.customer_phone && <div className="text-xs text-slate-400">{r.customer_phone}</div>}
                  {r.customer_email && <div className="text-[11px] text-slate-500">{r.customer_email}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    {r.risk_type || r.error_code || "Payment Risk"}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-rose-400">{inr(r.amount)}</td>
                <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{r.cause}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    disabled={triggering}
                    defaultValue=""
                    onChange={(e) => {
                      const stage = e.target.value;
                      handleTriggerStage(r.id, stage);
                      e.target.value = "";
                    }}
                    className="bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                  >
                    <option value="" disabled>
                      Select Stage Action...
                    </option>
                    <option value="1hr">⚡ 1-Hour Polite Reminder</option>
                    <option value="24hr">🎁 24-Hour Coupon (10% OFF)</option>
                    <option value="purge">⌛ Expire / Purge Risk (48h)</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-semibold ${confBadge(
                      r.confidence
                    )}`}
                  >
                    {r.confidence != null ? `${r.confidence}%` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs ${engineTag(
                      r.engine
                    )}`}
                  >
                    {r.engine || "fallback"}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs uppercase tracking-wide ${statusTag(
                      r.status
                    )}`}
                  >
                    {r.status || "—"}
                  </span>
                  {r.status !== "recovered" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        api(`/events/${r.id}/mark_recovered`, { method: "POST" }).then(() => {
                          loadData();
                        });
                      }}
                      className="rounded bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/40 text-emerald-300 px-2 py-1 text-[11px] font-semibold tracking-wide transition-colors"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    title="Delete record"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(r.id);
                    }}
                    className="rounded bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 px-2 py-1 text-xs font-medium transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
