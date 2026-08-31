"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const FIELDS = [
  { key: "max_retries", label: "Max Retries", type: "number" },
  { key: "retry_interval_hours", label: "Retry Interval (hours)", type: "number" },
  { key: "insufficient_funds_interval_hours", label: "Insufficient Funds Interval (hours)", type: "number" },
  { key: "approval_threshold_inr", label: "Approval Threshold (₹)", type: "number" },
  { key: "quiet_hours_start", label: "Quiet Hours Start", type: "text" },
  { key: "quiet_hours_end", label: "Quiet Hours End", type: "text" },
  { key: "daily_message_cap", label: "Daily Message Cap", type: "number" },
  { key: "contact_cap_30d", label: "Contact Cap (30 days)", type: "number" },
  { key: "min_ai_confidence", label: "Min AI Confidence (%)", type: "number" },
];

export default function SettingsPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/settings")
      .then((d) => setForm(d.settings || d || {}))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await api("/settings", { method: "PUT", body: JSON.stringify(form) });
      setNotice("Settings saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500">
          Deterministic policy limits — enforced in code
        </p>
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

      <form onSubmit={save} className="space-y-4">
        <div className="rounded-xl bg-[#111827] border border-slate-800 p-5 space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key] ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [f.key]:
                      f.type === "number" ? Number(e.target.value) : e.target.value,
                  })
                }
                className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-6 py-2.5 text-sm font-bold"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>

      <p className="text-xs text-slate-500 rounded-lg border border-slate-800 bg-[#111827] px-4 py-3">
        Policy is enforced by deterministic code. The AI can never override
        these limits.
      </p>
    </div>
  );
}
