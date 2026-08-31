"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

const CHIPS = [
  "is hafte mere paise kahan fase hain?",
  "how much did we recover today?",
  "any approvals pending?",
];

function engineTag(e) {
  const v = String(e || "fallback").toLowerCase();
  if (v.includes("claude"))
    return "bg-violet-500/10 text-violet-300 border-violet-500/30";
  if (v.includes("gemini"))
    return "bg-sky-500/10 text-sky-300 border-sky-500/30";
  return "bg-slate-700/40 text-slate-400 border-slate-600";
}

export default function CopilotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api("/copilot/history")
      .then((d) => {
        const h = Array.isArray(d) ? d : d.history || d.messages || [];
        setMessages(
          h.map((m) => ({
            role: m.role || (m.answer ? "assistant" : "user"),
            text: m.message || m.text || m.question || m.answer || "",
            engine: m.engine,
          }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setSending(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    try {
      const res = await api("/copilot", {
        method: "POST",
        body: JSON.stringify({ message: msg }),
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.answer || res.response || res.reply || JSON.stringify(res),
          engine: res.engine,
        },
      ]);
    } catch (e) {
      setError(e.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${e.message}`, engine: "error" },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Copilot</h1>
        <p className="text-sm text-slate-500">
          Ask anything about your recovery pipeline — English, Hindi, or Telugu
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => send(c)}
            disabled={sending}
            className="rounded-full border border-slate-700 bg-slate-800/60 hover:bg-slate-700 disabled:opacity-50 px-3 py-1.5 text-xs text-slate-300"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-[#111827] border border-slate-800 p-4 h-[26rem] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-slate-500 py-8 text-center">
            Ask the copilot about failures, recoveries, or approvals.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm space-y-1.5 ${
                m.role === "user"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-100"
                  : "bg-slate-800/70 border border-slate-700 text-slate-200"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              {m.role === "assistant" && m.engine && (
                <span
                  className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${engineTag(
                    m.engine
                  )}`}
                >
                  {m.engine}
                </span>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="text-xs text-slate-500 animate-pulse">
            Copilot is thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-2 text-xs">
          {error}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          className="flex-1 rounded-lg bg-[#111827] border border-slate-700 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-5 py-2.5 text-sm font-bold"
        >
          Send
        </button>
      </form>
    </div>
  );
}
