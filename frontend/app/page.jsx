"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, inr } from "../lib/api";
import useLive from "../lib/useLive";

const METRICS = [
  { key: "at_risk", label: "₹ at Risk", cls: "text-rose-500" },
  { key: "recovered", label: "₹ Recovered", cls: "text-emerald-400" },
  { key: "recovery_rate", label: "Recovery Rate %", cls: "text-slate-100" },
  { key: "failures", label: "Failures", cls: "text-slate-100" },
  { key: "awaiting_approval", label: "Awaiting Approval", cls: "text-amber-400" },
  { key: "escalated", label: "Escalated", cls: "text-slate-100" },
  { key: "stopped", label: "Stopped", cls: "text-slate-100" },
];

const ERROR_CODES = [
  { value: "INSUFFICIENT_FUNDS", label: "Insufficient Funds" },
  { value: "EXPIRED_CARD", label: "Card Expired" },
  { value: "BAD_REQUEST_PAYMENT_TIMED_OUT", label: "Payment Timed Out" },
  { value: "CARD_NOT_ACTIVE", label: "Card Not Active" },
  { value: "NETWORK_ERROR", label: "Network Error" },
  { value: "INTERNATIONAL_TRANSACTION_NOT_ALLOWED", label: "Intl. Transaction Blocked" },
  { value: "AUTHENTICATION_FAILED", label: "Authentication Failed" },
];

function fmtTime(ts) {
  try {
    const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour12: false });
  } catch {
    return String(ts);
  }
}

function StatusDot({ status }) {
  const color =
    status === "connected"
      ? "bg-emerald-400"
      : status === "rule_fallback"
      ? "bg-amber-400"
      : "bg-rose-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const recoveredRef = useRef(null);
  const { events, connected } = useLive();

  // Failure trigger form state
  const [triggerForm, setTriggerForm] = useState({
    name: "",
    email: "",
    phone: "",
    amount_inr: 2000,
    error_code: "INSUFFICIENT_FUNDS",
    language: "en",
  });
  const [showTrigger, setShowTrigger] = useState(false);
  const [anomalies, setAnomalies] = useState([]);

  const loadMetrics = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([
        api("/metrics"),
        api("/anomalies").catch(() => []),
      ]);
      setMetrics(m);
      setAnomalies(a || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    api("/system/status").then(setSystemStatus).catch(() => {});
    const t = setInterval(loadMetrics, 5000);
    return () => clearInterval(t);
  }, [loadMetrics]);

  const recovered = Number(metrics?.recovered || 0);
  useEffect(() => {
    const el = recoveredRef.current;
    if (!el) return;
    el.classList.remove("pulse-live");
    void el.offsetWidth;
    el.classList.add("pulse-live");
  }, [recovered]);

  useEffect(() => {
    const relevant = events.find(
      (e) => e.type === "failure.detected" || e.type === "recovered" || e.type === "system.reset"
    );
    if (relevant) {
      loadMetrics();
      if (relevant.type === "system.reset") {
        setNotice("Database cleared — fresh start");
        setTimeout(() => setNotice(null), 4000);
      }
    }
  }, [events, loadMetrics]);

  async function action(label, fn) {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      await fn();
      await loadMetrics();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleTrigger(e) {
    e.preventDefault();
    if (!triggerForm.name || !triggerForm.email || !triggerForm.phone) {
      setError("Name, Email, and Phone are required");
      return;
    }
    await action("trigger", async () => {
      const res = await api("/trigger/custom", {
        method: "POST",
        body: JSON.stringify(triggerForm),
      });
      setNotice(
        `Payment failure created for ${res.customer} — ${res.action || "processing"} (Event #${res.event_id})`
      );
      setTimeout(() => setNotice(null), 6000);
    });
  }

  async function handleReset() {
    if (!confirm("This will clear ALL data (failures, customers, actions, audit logs). Continue?")) return;
    await action("reset", async () => {
      await api("/reset", { method: "POST" });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500">
            AI revenue-recovery agent · live overview
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              connected ? "bg-emerald-400" : "bg-rose-500"
            }`}
          />
          {connected ? "live" : "offline"}
        </div>
      </div>

      {/* Payment Degradation Anomaly Banner */}
      {anomalies && anomalies.length > 0 && anomalies[0].status === "ACTIVE" && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 shadow-lg shadow-rose-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-400 text-sm">
                    PAYMENT DEGRADATION ANOMALY DETECTED ({anomalies[0].gateway})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 uppercase">
                    {anomalies[0].severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Success rate dropped to <span className="font-bold text-white">{anomalies[0].current_success_rate}%</span> (Baseline {anomalies[0].baseline_success_rate}% · Drop: -{anomalies[0].drop_percentage}%).
                  Affected payments: <span className="font-bold text-white">{anomalies[0].affected_payments_count}</span>. Top Error: <span className="font-mono text-amber-300">{anomalies[0].top_error_code}</span>.
                </p>
                {anomalies[0].ai_diagnosis?.root_cause && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    🤖 <span className="text-emerald-400 font-semibold">AI Root Cause Diagnosis:</span> {anomalies[0].ai_diagnosis.root_cause}. Recommended Action: <span className="font-mono text-white">{anomalies[0].recommended_action}</span>.
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                await api("/anomalies/check", { method: "POST" });
                loadMetrics();
              }}
              className="shrink-0 rounded bg-rose-500 hover:bg-rose-400 text-white font-bold px-3 py-1.5 text-xs transition-colors"
            >
              Re-Analyze Anomaly
            </button>
          </div>
        </div>
      )}

      {/* System Status Bar */}
      {systemStatus && (
        <div className="rounded-xl bg-[#111827] border border-slate-800 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mr-1">Services</span>
            {Object.entries(systemStatus).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1.5 text-slate-300">
                <StatusDot status={val.status} />
                <span className="capitalize">{key}</span>
                {val.primary && <span className="text-slate-500">({val.primary})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {METRICS.map((m) => {
          const value = metrics ? metrics[m.key] : "—";
          const display =
            m.key === "at_risk" || m.key === "recovered"
              ? inr(value)
              : String(value ?? "—");
          const isRecovered = m.key === "recovered";
          return (
            <div
              key={m.key}
              ref={isRecovered ? recoveredRef : null}
              className="rounded-xl bg-[#111827] border border-slate-800 p-4"
            >
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                {m.label}
              </div>
              <div className={`mt-1 text-xl md:text-2xl font-bold ${m.cls}`}>
                {display}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowTrigger(!showTrigger)}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200"
        >
          {showTrigger ? "✕ Close" : "⚡ New Payment Failure"}
        </button>
        <button
          disabled={!!busy}
          onClick={() =>
            action("run", () =>
              api("/plan/start", { method: "POST" })
            )
          }
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 px-4 py-2 text-sm font-bold"
        >
          {busy === "run" ? "Processing…" : "RUN RECOVERY PIPELINE"}
        </button>
        <button
          disabled={!!busy}
          onClick={handleReset}
          className="rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 disabled:opacity-50 px-4 py-2 text-sm font-medium ml-auto"
        >
          {busy === "reset" ? "Clearing…" : "Reset Data"}
        </button>
      </div>

      {/* Custom Failure Trigger Form */}
      {showTrigger && (
        <form
          onSubmit={handleTrigger}
          className="rounded-xl bg-[#111827] border border-slate-800 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Ingest Payment Failure
            </h2>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
              Real customer → Real recovery pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Customer Name *
              </label>
              <input
                required
                value={triggerForm.name}
                onChange={(e) => setTriggerForm({ ...triggerForm, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Email *
              </label>
              <input
                required
                type="email"
                value={triggerForm.email}
                onChange={(e) => setTriggerForm({ ...triggerForm, email: e.target.value })}
                placeholder="rahul@company.com"
                className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Phone *
              </label>
              <input
                required
                value={triggerForm.phone}
                onChange={(e) => setTriggerForm({ ...triggerForm, phone: e.target.value })}
                placeholder="+919812345670"
                className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                value={triggerForm.amount_inr}
                onChange={(e) =>
                  setTriggerForm({ ...triggerForm, amount_inr: Number(e.target.value) })
                }
                className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Error Code
              </label>
              <select
                value={triggerForm.error_code}
                onChange={(e) =>
                  setTriggerForm({ ...triggerForm, error_code: e.target.value })
                }
                className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                {ERROR_CODES.map((ec) => (
                  <option key={ec.value} value={ec.value}>
                    {ec.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Language
              </label>
              <select
                value={triggerForm.language}
                onChange={(e) =>
                  setTriggerForm({ ...triggerForm, language: e.target.value })
                }
                className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!!busy}
            className="rounded-lg bg-rose-500 hover:bg-rose-400 text-white disabled:opacity-50 px-5 py-2.5 text-sm font-bold"
          >
            {busy === "trigger" ? "Processing…" : "Ingest Failure → Run Pipeline"}
          </button>
        </form>
      )}

      {/* Live Feed */}
      <div className="rounded-xl bg-[#111827] border border-slate-800">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
            Live Feed
          </h2>
          <span className="text-xs text-slate-500">
            {events.length} events
          </span>
        </div>
        <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
          {events.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500">
              Waiting for events… Failures arrive via Razorpay webhooks or manual entry above.
            </div>
          )}
          {events.map((e, i) => (
            <div
              key={`${e.ts}-${i}`}
              className="px-4 py-2.5 flex items-start gap-3 text-sm"
            >
              <span className="shrink-0 font-mono text-[11px] text-slate-500 pt-0.5">
                {fmtTime(e.ts)}
              </span>
              <span
                className={`shrink-0 font-semibold text-xs uppercase tracking-wide rounded px-1.5 py-0.5 border ${
                  e.type === "recovered"
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    : e.type === "failure.detected"
                    ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                    : "text-slate-400 border-slate-700 bg-slate-800/50"
                }`}
              >
                {e.type}
              </span>
              <span className="text-slate-300 break-all min-w-0">
                {typeof e.payload === "string"
                  ? e.payload
                  : JSON.stringify(e.payload)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
