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
  const router = useRouter();

  useEffect(() => {
    api("/failures")
      .then((d) => setRows(Array.isArray(d) ? d : d.failures || d.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Diagnoses</h1>
        <p className="text-sm text-slate-500">
          AI-classified payment failures with engine attribution
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-800">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Error Code</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Cause</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Engine</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading && (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-slate-500">
                  No failures detected yet. Payment failures appear here automatically via Razorpay webhooks.
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
                <td className="px-4 py-3 font-mono text-rose-300">
                  {r.error_code}
                </td>
                <td className="px-4 py-3">{inr(r.amount)}</td>
                <td className="px-4 py-3 text-slate-300">{r.cause}</td>
                <td className="px-4 py-3 text-slate-400">{r.category}</td>
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
                <td className="px-4 py-3 text-slate-300">
                  {r.action_name || "—"}
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
                          api("/failures").then((d) => setRows(Array.isArray(d) ? d : d.failures || d.items || []));
                        });
                      }}
                      className="rounded bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/40 text-emerald-300 px-2 py-1 text-[11px] font-semibold tracking-wide transition-colors"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
