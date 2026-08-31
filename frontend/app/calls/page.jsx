"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

const LANGS = [
  { value: "en", label: "English (en)" },
  { value: "hi", label: "Hindi (hi)" },
  { value: "te", label: "Telugu (te)" },
];

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [genText, setGenText] = useState("");
  const [genLang, setGenLang] = useState("en");
  const [genBusy, setGenBusy] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    api("/calls")
      .then((d) => setCalls(Array.isArray(d) ? d : d.calls || d.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function b64ToBlob(b64, mime) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function play(call) {
    setNotice(null);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (call.simulated) {
      setNotice("Voice not configured — add ELEVENLABS_API_KEY to enable real TTS");
      return;
    }
    setPlayingId(call.id);
    try {
      const d = await api(`/calls/${call.id}/audio`);
      const b64 = d.audio_base64 || d.audio || d.data;
      if (!b64) throw new Error("No audio data returned");
      const url = URL.createObjectURL(b64ToBlob(b64, "audio/mpeg"));
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e) {
      setError(e.message);
      setPlayingId(null);
    }
  }

  async function generateTest(e) {
    e.preventDefault();
    setGenBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api("/calls/generate-test", {
        method: "POST",
        body: JSON.stringify({ text: genText, language: genLang }),
      });
      setNotice("Test voice generated");
    } catch (err) {
      setNotice(
        "Voice generation happens during VOICE_RECOVERY actions — trigger a high-value failure on the Dashboard"
      );
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Call Console</h1>
        <p className="text-sm text-slate-500">
          AI voice-recovery calls (ElevenLabs TTS)
        </p>
      </div>

      {notice && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 px-4 py-3 text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {!loading && calls.length === 0 && (
        <div className="rounded-xl bg-[#111827] border border-slate-800 px-4 py-8 text-sm text-slate-500 text-center">
          No voice calls yet. Voice calls are generated automatically for high-value (≥ ₹5,000) payment failures.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {calls.map((c) => (
          <div
            key={c.id}
            className="rounded-xl bg-[#111827] border border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs text-slate-500">#{c.id}</span>
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  c.simulated
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                }`}
              >
                {c.simulated ? "NOT_CONFIGURED" : "LIVE"}
              </span>
            </div>
            <p className="text-sm text-slate-300 line-clamp-3">
              {c.script_preview || c.script || "—"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded border border-slate-600 bg-slate-800/60 px-2 py-0.5 uppercase">
                {c.language || "en"}
              </span>
              <span className="rounded border border-violet-500/30 bg-violet-500/10 text-violet-300 px-2 py-0.5">
                {c.engine || "tts"}
              </span>
            </div>
            <button
              onClick={() => play(c)}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm font-medium"
            >
              {playingId === c.id ? "Playing…" : "Play"}
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={generateTest}
        className="rounded-xl bg-[#111827] border border-slate-800 p-5 space-y-3 max-w-xl"
      >
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          Generate Test Voice
        </h2>
        <textarea
          value={genText}
          onChange={(e) => setGenText(e.target.value)}
          rows={3}
          placeholder="Enter script text…"
          className="w-full rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
        <div className="flex gap-2">
          <select
            value={genLang}
            onChange={(e) => setGenLang(e.target.value)}
            className="rounded-lg bg-[#0a0e17] border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={genBusy || !genText.trim()}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-4 py-2 text-sm font-bold"
          >
            {genBusy ? "Generating…" : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
}
