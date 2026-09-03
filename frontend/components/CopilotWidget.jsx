"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { api } from "../lib/api";

const CHIPS = [
  "How much revenue is at risk right now?",
  "What's the recovery rate?",
  "How many failures need approval?",
  "Summarize today's recovery actions",
];

function engineTag(engine) {
  const e = (engine || "").toLowerCase();
  if (e.includes("claude")) return { label: "Claude AI", cls: "bg-violet-500/15 text-violet-300 border-violet-500/40" };
  if (e.includes("gemini")) return { label: "Gemini", cls: "bg-sky-500/15 text-sky-300 border-sky-500/40" };
  if (e.includes("openrouter")) return { label: "OpenRouter", cls: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40" };
  if (e.includes("fallback") || e.includes("rule")) return { label: "Rule Engine", cls: "bg-slate-500/15 text-slate-300 border-slate-500/40" };
  return { label: engine || "AI", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" };
}

export default function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const d = await api("/copilot/history");
        const h = d.history || d.messages || [];
        setMessages(h.map((m) => ({ role: m.role, text: m.content || m.text, engine: m.engine })));
      } catch {
        setMessages([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await api("/copilot", {
        method: "POST",
        body: JSON.stringify({ message: msg }),
      });
      setMessages((m) => [...m, { role: "assistant", text: res.answer || res.response || res.reply, engine: res.engine }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating AI button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Copilot"
        className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-xl shadow-emerald-500/40 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
      >
        <Sparkles className="size-6" />
        <span className="absolute -top-0.5 -right-0.5 grid size-3.5 place-items-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-300 border-2 border-emerald-900" />
        </span>
      </button>

      {/* Chat overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => setOpen(false)}>
          <div
            className="flex h-[80vh] max-h-[720px] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#111827] shadow-2xl shadow-emerald-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1420] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">RecoverIQ Copilot</div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400">AI Revenue Assistant</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                aria-label="Close copilot"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !sending && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
                  Namaste! I&apos;m your RecoverIQ Copilot 🌿 Ask me anything about your recovery pipeline — revenue at risk, recovery rate, approvals, escalations and more. I answer using LIVE stats from your database.
                </div>
              )}
              {messages.map((m, i) => {
                const tag = engineTag(m.engine);
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "rounded-br-sm bg-emerald-500/90 text-slate-950 font-medium"
                          : "rounded-bl-sm border border-slate-800 bg-slate-900/80 text-slate-200"
                      }`}
                    >
                      {m.role !== "user" && (
                        <span className={`mb-1.5 inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tag.cls}`}>
                          {tag.label}
                        </span>
                      )}
                      <div className={m.role === "user" ? "" : "mt-0.5"}>{m.text}</div>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-slate-400">
                    <span className="inline-flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                    </span>{" "}
                    Copilot is thinking…
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick chips */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-800 px-3 py-2 [scrollbar-width:none]">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => send(c)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[10px] text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-slate-800 bg-[#0d1420] px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about revenue at risk, recovery rate…"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/30 transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
