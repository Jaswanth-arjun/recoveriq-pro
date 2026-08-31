"use client";

import { useCallback, useEffect, useState } from "react";
import { api, inr } from "../../lib/api";

export default function ApprovalsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await api("/approvals");
      setItems(Array.isArray(d) ? d : d.approvals || d.items || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id, verb) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await api(`/approvals/${id}/${verb}`, { method: "POST" });
      setNotice(
        verb === "approve"
          ? `Approval #${id} approved`
          : `Approval #${id} rejected`
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function bulkApprove() {
    setError(null);
    setNotice(null);
    try {
      await api("/approvals/bulk-approve", { method: "POST" });
      setNotice("All pending approvals approved");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Approvals</h1>
          <p className="text-sm text-slate-500">
            High-value recovery actions awaiting human sign-off
          </p>
        </div>
        <button
          onClick={bulkApprove}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-sm font-bold"
        >
          Bulk Approve All
        </button>
      </div>

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

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="rounded-xl bg-[#111827] border border-slate-800 px-4 py-8 text-sm text-slate-500 text-center">
          No pending approvals.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((a) => (
          <div
            key={a.id}
            className="rounded-xl bg-[#111827] border border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-2xl font-bold text-white">
                  {inr(a.amount)}
                </div>
                <div className="font-mono text-xs text-rose-300">
                  {a.error_code}
                </div>
              </div>
              <span className="font-mono text-xs text-slate-500">
                #{a.id}
              </span>
            </div>

            <div className="text-sm text-slate-300">{a.cause}</div>

            <div className="flex items-center gap-2 text-xs">
              <span
                className={`rounded border px-2 py-0.5 font-semibold ${
                  Number(a.confidence || 0) >= 70
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : Number(a.confidence || 0) >= 50
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {a.confidence != null ? `${a.confidence}% confidence` : "—"}
              </span>
            </div>

            {a.reasoning && (
              <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                  AI Reasoning
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {a.reasoning}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                disabled={busyId === a.id}
                onClick={() => act(a.id, "approve")}
                className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 px-3 py-2 text-sm font-bold"
              >
                Approve
              </button>
              <button
                disabled={busyId === a.id}
                onClick={() => act(a.id, "reject")}
                className="flex-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 disabled:opacity-50 px-3 py-2 text-sm font-semibold"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
