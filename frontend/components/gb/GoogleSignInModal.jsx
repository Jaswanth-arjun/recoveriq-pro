"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, X, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

// Real Google Sign-In needs a Google Cloud OAuth Client ID (Web application)
// with Authorized JavaScript origin http://localhost:3000. Set it as
// NEXT_PUBLIC_GOOGLE_CLIENT_ID (baked at build time) to enable REAL sign-in.
// Without it the modal falls back to demo accounts so the store stays usable.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function GoogleSignInModal({ isOpen, onLogin, onClose }) {
  const [customEmail, setCustomEmail] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef(null);

  // Load Google Identity Services and render the OFFICIAL Google button
  useEffect(() => {
    if (!isOpen) return;
    if (!GOOGLE_CLIENT_ID) return;
    setError(null);

    const initAndRender = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        cancel_on_tap_outside: false,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 320,
        });
      }
    };

    if (window.google?.accounts?.id) {
      initAndRender();
      return;
    }
    if (!document.getElementById("gsi-client")) {
      const script = document.createElement("script");
      script.id = "gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => initAndRender();
      document.head.appendChild(script);
    } else {
      // script tag exists but may still be loading; retry after it loads
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initAndRender();
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  // Server-verified sign-in: the browser gets a signed JWT from Google,
  // the backend validates it and returns the real profile.
  const handleCredentialResponse = async (resp) => {
    if (!resp?.credential) {
      setError("Google sign-in was cancelled");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: resp.credential }),
      });
      const u = res.user || {};
      onLogin({
        id: u.id || "google_user",
        email: u.email,
        name: u.name,
        avatar: u.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || "google")}`,
        googleVerified: true,
      });
    } catch (e) {
      setError(e.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const handleQuickLogin = (email, name) => {
    onLogin({
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      googleVerified: false,
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const nameFromEmail = customEmail.split("@")[0].replace(/[._]/g, " ");
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    onLogin({
      email: customEmail.trim(),
      name: formattedName || "Google User",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customEmail)}`,
      googleVerified: false,
    });
  };

  const realGoogleReady = !!GOOGLE_CLIENT_ID;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Light Sky-Blue Studio Radial Gradient Backdrop - Exact Match to User Image */}
      <div
        className="fixed inset-0 z-0 backdrop-blur-xl transition-all duration-500"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.94) 0%, rgba(224, 242, 254, 0.9) 48%, rgba(186, 230, 253, 0.95) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Clean Sky-Blue Studio Modal Card */}
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-3xl bg-white/95 p-6 sm:p-8 text-left shadow-[0_25px_80px_rgba(14,165,233,0.22)] border border-sky-100/90 backdrop-blur-2xl transition-all duration-300">

        {/* Close / Dismiss button (Returns user to top of intro) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-2 text-slate-500 hover:bg-white/80 hover:text-slate-800 transition-colors cursor-pointer"
            title="Back to home"
          >
            <X className="size-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/90 border border-slate-200/80 shadow-md mb-4 backdrop-blur-md">
            {/* Google Multicolor SVG Logo */}
            <svg className="size-7" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-900 border border-emerald-500/30 backdrop-blur-md">
            <Sparkles className="size-3 text-emerald-600 animate-pulse" />
            Sign In Required to Explore Store
          </span>

          <h2 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            Sign in to GreenBasket
          </h2>
          <p className="mt-1.5 text-xs font-semibold text-slate-700 leading-relaxed max-w-xs">
            Continue with Google to scroll 8 organic farm worlds, build custom baskets & manage daily deliveries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {realGoogleReady ? (
            <>
              {/* OFFICIAL Google button — real OAuth flow */}
              {busy && (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-bold text-emerald-800">
                  <Loader2 className="size-4 animate-spin" />
                  Verifying your Google account…
                </div>
              )}
              <div ref={googleBtnRef} className={`flex justify-center ${busy ? "hidden" : ""}`} />
              <p className="text-center text-[11px] font-semibold text-emerald-800">
                🔒 Real Google OAuth — your profile is verified by Google & RecoverIQ backend
              </p>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
                ⚠️ Demo mode — set <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in <span className="font-mono">.env</span> + rebuild to enable real Google sign-in.
              </div>

              {/* Demo account options (fallback until Google Client ID configured) */}
              <button
                type="button"
                onClick={() => handleQuickLogin("jaswanth.arjun@gmail.com", "Jaswanth Arjun")}
                className="group relative flex w-full items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 p-3.5 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50/80 hover:shadow-md cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jaswanth"
                    alt="Jaswanth Arjun"
                    className="size-10 rounded-full border border-emerald-500/60 bg-slate-100 object-cover shadow-sm"
                  />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                      Jaswanth Arjun
                    </p>
                    <p className="text-xs text-slate-600 font-medium">jaswanth.arjun@gmail.com</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 opacity-90 group-hover:opacity-100">
                  Continue <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("customer@greenbasket.in", "GreenBasket Customer")}
                className="group relative flex w-full items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 p-3.5 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50/80 hover:shadow-md cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=GreenBasket"
                    alt="Customer"
                    className="size-10 rounded-full border border-slate-300 bg-slate-100 object-cover shadow-sm"
                  />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                      GreenBasket Customer
                    </p>
                    <p className="text-xs text-slate-600 font-medium">customer@greenbasket.in</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 opacity-90 group-hover:opacity-100">
                  Continue <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              {/* Custom Google Account Input toggle */}
              {!showInput ? (
                <button
                  type="button"
                  onClick={() => setShowInput(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300/90 bg-white/50 py-3 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:bg-white/80 transition-all cursor-pointer backdrop-blur-md"
                >
                  <span>+ Use another Google account</span>
                </button>
              ) : (
                <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Enter Google Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 bg-white/90 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-md"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Feature benefits list */}
        <div className="mt-6 rounded-2xl bg-white/60 border border-white/80 p-3.5 text-[11px] text-slate-700 space-y-1.5 backdrop-blur-md shadow-inner">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Instant access to 8 interactive 3D farm worlds</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Automatic 6 AM Sunrise Delivery booking</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>One-click pause/cancel subscription controls</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold">
          <ShieldCheck className="size-3.5 text-slate-500" />
          <span>Protected by Google OAuth • Secure SSL Connection</span>
        </div>
      </div>
    </div>
  );
}