"use client";

import { useEffect, useState } from "react";
import { api, inr } from "../../lib/api";
import useLive from "../../lib/useLive";

export default function PlanPage() {
  const [plan, setPlan] = useState(null);
  const [running, setRunning] = useState(false);
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState(null);
  const { events } = useLive();

  useEffect(() => {
    api("/plan")
      .then(setPlan)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const exec = events.filter((e) => e.type === "plan.executed" || e.type === "recovery.executed");
    if (exec.length === 0) return;
    setFeed((prev) => {
      const rows = exec.map((e) => ({
        key: `${e.ts}-${JSON.stringify(e.payload).slice(0, 40)}`,
        ...(typeof e.payload === "object" ? e.payload : { raw: e.payload }),
      }));
      const seen = new Set(prev.map((r) => r.key));
      return [...rows.filter((r) => !seen.has(r.key)), ...prev].slice(0, 100);
    });
  }, [events]);

  async function start() {
    setRunning(true);
    setError(null);
    try {
      const res = await api("/plan/start", { method: "POST" });
      const results = res?.results || res?.executed || [];
      if (Array.isArray(results) && results.length > 0) {
        setFeed((prev) => {
          const rows = results.map((r, i) => ({ key: `res-${i}-${r.failure_id || i}`, ...r }));
          const seen = new Set(prev.map((r) => r.key));
          return [...rows.filter((r) => !seen.has(r.key)), ...prev];
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const actions = Array.isArray(plan?.actions)
    ? plan.actions
    : plan?.actions_breakdown
    ? Object.entries(plan.actions_breakdown).map(([name, v]) => ({
        name,
        count: typeof v === "object" ? v.count ?? v.n ?? 0 : v,
        amount: typeof v === "object" ? v.amount ?? 0 : 0,
      }))
    : [];

  const maxCount = Math.max(1, ...actions.map((a) => Number(a.count || 0)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Recovery Plan</h1>
        <p className="text-sm text-slate-500">
          AI-generated action plan across all recoverable failures
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#111827] border border-slate-800 p-5">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Revenue at Risk
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-500">
            {inr(plan?.revenue_at_risk ?? plan?.at_risk)}
          </div>
        </div>
        <div className="rounded-xl bg-[#111827] border border-slate-800 p-5">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Recoverable
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-100">
            {inr(plan?.recoverable)}
          </div>
        </div>
        <div className="rounded-xl bg-[#111827] border border-slate-800 p-5">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Expected Recovery
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-400">
            {inr(plan?.expected_recovery)}
          </div>
          {plan?.estimate_note && (
            <p className="mt-2 text-[11px] text-slate-500 italic">
              {plan.estimate_note}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-[#111827] border border-slate-800 p-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
          Actions Breakdown
        </h2>
        {actions.length === 0 ? (
          <p className="text-sm text-slate-500">
            No pending failures. Recovery plan generates automatically when payment failures are detected.
          </p>
        ) : (
          <div className="space-y-3">
            {actions.map((a) => (
              <div key={a.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    {a.name}
                    {a.amount ? (
                      <span className="text-slate-500"> · {inr(a.amount)}</span>
                    ) : null}
                  </span>
                  <span className="text-slate-400">{a.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400/80 rounded-full"
                    style={{
                      width: `${(Number(a.count || 0) / maxCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={start}
        disabled={running}
        className="w-full md:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-8 py-3 text-base font-bold tracking-wide"
      >
        {running ? "RUNNING RECOVERY…" : "START RECOVERY"}
      </button>

      {running && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          Executing recovery actions — results stream in below.
        </div>
      )}

      {feed.length > 0 && (
        <div className="rounded-xl bg-[#111827] border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Execution Feed
            </h2>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
            {feed.map((r) => {
              const verdict = String(r.verdict || r.action_name || "").toUpperCase();
              const executed = String(
                r.executed ?? r.mode ?? r.status ?? ""
              ).toUpperCase();
              const isReal = executed.includes("REAL") || executed === "TRUE" || executed === "EXECUTED";
              return (
                <div
                  key={r.key}
                  className="px-4 py-2.5 flex flex-wrap items-center gap-3 text-sm"
                >
                  <span className="font-mono text-xs text-slate-500">
                    #{r.failure_id ?? r.event_id ?? r.id ?? "—"}
                  </span>
                  <span className="font-mono text-rose-300">
                    {r.error_code || "—"}
                  </span>
                  <span className="text-slate-100">
                    {inr(r.amount)}
                  </span>
                  <span className="text-slate-300">{r.verdict || "—"}</span>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      isReal
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {isReal ? "EXECUTED" : "PENDING"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
