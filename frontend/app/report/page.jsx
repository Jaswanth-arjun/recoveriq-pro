"use client";

import { useEffect, useState } from "react";
import { api, inr } from "../../lib/api";

function Bar({ label, value, max, amount, cls }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300 font-medium">
          {label}
          {amount ? (
            <span className="text-slate-500"> · {inr(amount)}</span>
          ) : null}
        </span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${cls || "bg-emerald-400/80"}`}
          style={{ width: `${(Number(value || 0) / Math.max(1, max)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/report")
      .then(setReport)
      .catch((e) => setError(e.message));
  }, []);

  const r = report || {};
  const plays = Array.isArray(r.recovery_breakdown)
    ? r.recovery_breakdown
    : Object.entries(r.recovery_breakdown || {}).map(([name, v]) => ({
        play: name,
        count: typeof v === "object" ? v.count ?? 0 : v,
        amount: typeof v === "object" ? v.amount ?? 0 : 0,
      }));
  const actions = Array.isArray(r.action_distribution)
    ? r.action_distribution
    : Object.entries(r.action_distribution || {}).map(([name, v]) => ({
        action: name,
        count: typeof v === "object" ? v.count ?? 0 : v,
      }));
  const maxPlay = Math.max(1, ...plays.map((p) => Number(p.count || 0)));
  const maxAction = Math.max(1, ...actions.map((a) => Number(a.count || 0)));

  const metrics = [
    { label: "₹ at Risk", value: inr(r.at_risk ?? r.revenue_at_risk), cls: "text-rose-500" },
    { label: "₹ Recovered", value: inr(r.recovered), cls: "text-emerald-400" },
    { label: "Recovery Rate %", value: r.recovery_rate ?? "—", cls: "text-slate-100" },
    { label: "Avg Time-to-Recovery", value: r.avg_time_to_recovery ?? r.avg_ttr ?? "—", cls: "text-slate-100" },
    { label: "Escalated", value: r.escalated ?? 0, cls: "text-amber-400" },
    { label: "Stopped", value: r.stopped ?? 0, cls: "text-rose-400" },
    { label: "Audit Entries", value: r.audit_entries ?? r.audit_count ?? 0, cls: "text-slate-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Report</h1>
        <p className="text-sm text-slate-500">Recovery run summary</p>
      </div>

      <div className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-sm font-bold px-4 py-1.5 uppercase tracking-wide">
        Razorpay TEST MODE
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <span className="text-2xl font-bold text-emerald-400">
          {r.policy_violations ?? 0} policy violations
        </span>
        <span className="ml-2 text-xs text-slate-500">
          enforced by deterministic code, not the AI
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl bg-[#111827] border border-slate-800 p-4"
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-500">
              {m.label}
            </div>
            <div className={`mt-1 text-xl font-bold ${m.cls}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#111827] border border-slate-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Recovery Breakdown by Play
          </h2>
          {plays.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            plays.map((p) => (
              <Bar
                key={p.play || p.name}
                label={p.play || p.name}
                value={p.count}
                amount={p.amount}
                max={maxPlay}
              />
            ))
          )}
        </div>

        <div className="rounded-xl bg-[#111827] border border-slate-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Action Distribution
          </h2>
          {actions.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            actions.map((a) => (
              <Bar
                key={a.action || a.name}
                label={a.action || a.name}
                value={a.count}
                max={maxAction}
                cls="bg-sky-400/80"
              />
            ))
          )}
        </div>
      </div>

      {r.batch_note && (
        <p className="text-xs text-slate-500 italic max-w-2xl">{r.batch_note}</p>
      )}
    </div>
  );
}
