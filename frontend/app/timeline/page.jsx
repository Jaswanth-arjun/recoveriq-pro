"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, inr } from "../../lib/api";

function confBadge(c) {
  const n = Number(c || 0);
  if (n >= 70)
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (n >= 50)
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-rose-500/10 text-rose-400 border-rose-500/30";
}

function verdictTag(v) {
  const s = String(v || "").toUpperCase();
  if (s.includes("ALLOW"))
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (s.includes("APPROVAL"))
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  if (s.includes("BLOCK") || s.includes("DENY"))
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  return "bg-slate-700/40 text-slate-400 border-slate-600";
}

function Section({ icon, title, children }) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#111827] border border-slate-700 flex items-center justify-center text-base">
        {icon}
      </div>
      <div className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-slate-800 last:hidden" />
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="rounded-xl bg-[#111827] border border-slate-800 p-4 space-y-2">
        {children}
      </div>
    </div>
  );
}

function TimelineContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initialId = params.get("id") || "";
  const [inputId, setInputId] = useState(initialId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const load = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await api(`/failures/${id}`);
      setData(d);
    } catch (e) {
      setData(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) load(initialId);
  }, [initialId, load]);

  const f = data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Timeline</h1>
          <p className="text-sm text-slate-500">
            Full audit trail for a single failure
          </p>
        </div>
        <form
          className="flex gap-2 ml-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (inputId) {
              router.push(`/timeline?id=${inputId}`);
              load(inputId);
            }
          }}
        >
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="Failure ID"
            className="rounded-lg bg-[#111827] border border-slate-700 px-3 py-2 text-sm w-32 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-sm font-bold"
          >
            Load
          </button>
        </form>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="rounded-xl bg-[#111827] border border-slate-800 px-4 py-8 text-sm text-slate-500 text-center">
          Enter a failure ID (or click a row in Diagnoses) to view its timeline.
        </div>
      )}

      {data && (
        <div className="max-w-3xl">
          <Section icon="⚡" title="Failure">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-rose-300 font-semibold">
                {f.error_code}
              </span>
              <span className="text-xl font-bold text-white">
                {inr(f.amount)}
              </span>
            </div>
            <p className="text-sm text-slate-300">
              {f.description || f.cause || "—"}
            </p>
          </Section>

          <Section icon="👤" title="Customer">
            <div className="text-sm text-slate-200 font-medium">
              {f.customer_name || f.customer?.name || "—"}
            </div>
            <p className="text-sm text-slate-400">
              {f.history_count ?? f.customer?.history_count ?? f.customer?.successful_payments ?? 0}{" "}
              successful payments before
            </p>
          </Section>

          <Section icon="🧠" title="Diagnosis">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-200">{f.cause || "—"}</span>
              <span className="rounded border border-slate-600 bg-slate-800/60 text-slate-300 px-2 py-0.5 text-xs">
                {f.category || "—"}
              </span>
              <span
                className={`rounded border px-2 py-0.5 text-xs font-semibold ${confBadge(
                  f.confidence
                )}`}
              >
                {f.confidence != null ? `${f.confidence}% confidence` : "—"}
              </span>
              <span className="rounded border border-violet-500/30 bg-violet-500/10 text-violet-300 px-2 py-0.5 text-xs">
                {f.engine || "fallback"}
              </span>
            </div>
            {f.reasoning && (
              <div>
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {showReasoning ? "▾" : "▸"} Why did AI take this action?
                </button>
                {showReasoning && (
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed rounded-lg bg-slate-800/50 border border-slate-700/60 p-3">
                    {f.reasoning}
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section icon="🎯" title="Decision">
            <div className="text-sm text-slate-200 font-medium">
              {f.action_name || "—"}
            </div>
            {f.alternatives && f.alternatives.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  Alternatives considered
                </div>
                <ul className="list-disc list-inside text-xs text-slate-400">
                  {f.alternatives.map((alt, i) => (
                    <li key={i}>
                      {typeof alt === "string" ? alt : alt.name || JSON.stringify(alt)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section icon="🛡️" title="Policy Checks">
            {(f.policy_checks || f.policy || []).length === 0 && (
              <p className="text-sm text-slate-500">No policy checks recorded.</p>
            )}
            {(f.policy_checks || f.policy || []).map((p, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-bold uppercase ${verdictTag(
                    p.verdict
                  )}`}
                >
                  {p.verdict}
                </span>
                <span className="text-slate-400 text-xs">
                  {p.reason || p.rule || ""}
                </span>
              </div>
            ))}
          </Section>

          <Section icon="🚀" title="Actions">
            {(f.actions || []).length === 0 && (
              <p className="text-sm text-slate-500">No actions executed yet.</p>
            )}
            {(f.actions || []).map((a, i) => {
              const simulated =
                a.simulated === true ||
                String(a.mode || "").toUpperCase() === "SIMULATED";
              return (
                <div
                  key={i}
                  className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      {a.channel || a.name || "—"}
                    </span>
                    <span
                      className="rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    >
                      {simulated ? "CONFIGURED" : "EXECUTED"}
                    </span>
                  </div>
                  {a.razorpay_api_call_id && (
                    <div className="font-mono text-[11px] text-slate-400 break-all">
                      receipt: {a.razorpay_api_call_id}
                    </div>
                  )}
                  {a.short_url && (
                    <a
                      href={a.short_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline break-all"
                    >
                      {a.short_url}
                    </a>
                  )}
                </div>
              );
            })}
          </Section>

          <Section icon="🏁" title="Outcome">
            {String(f.status || "").toUpperCase().includes("RECOVER") ? (
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3 py-1 text-sm font-bold">
                RECOVERED
              </span>
            ) : (
              <span className="rounded border border-slate-600 bg-slate-800/60 text-slate-400 px-3 py-1 text-sm font-bold">
                {f.status || "PENDING"}
              </span>
            )}
          </Section>

          <Section icon="📜" title="Audit Trail">
            {(f.audit_trail || f.audit || []).length === 0 && (
              <p className="text-sm text-slate-500">No audit entries.</p>
            )}
            <ul className="space-y-2">
              {(f.audit_trail || f.audit || []).map((entry, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-baseline gap-2 text-xs"
                >
                  <span className="font-semibold text-emerald-400">
                    {entry.actor || "system"}
                  </span>
                  <span className="text-slate-300">
                    {entry.event || entry.action || JSON.stringify(entry)}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 ml-auto">
                    {entry.timestamp || entry.ts || ""}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-slate-500">Loading…</div>}
    >
      <TimelineContent />
    </Suspense>
  );
}
