"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, UserCheck, X } from "lucide-react";

export function GoogleSignInModal({ isOpen, onLogin, onClose }) {
  const [customEmail, setCustomEmail] = useState("");
  const [showInput, setShowInput] = useState(false);

  if (!isOpen) return null;

  const handleQuickLogin = (email, name) => {
    onLogin({
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
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
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Heavy White Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-white/75 backdrop-blur-2xl transition-all duration-500"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-3xl bg-white/95 p-6 sm:p-8 text-left shadow-[0_20px_70px_rgba(0,0,0,0.18)] border border-slate-200/90 backdrop-blur-md transition-all duration-300">
        
        {/* Close / Dismiss button (Returns user to top of intro) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Back to home"
          >
            <X className="size-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm mb-4">
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

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
            <Sparkles className="size-3 text-emerald-600 animate-pulse" />
            Account Required to Explore Store
          </span>

          <h2 className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to GreenBasket
          </h2>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-xs">
            Sign in with Google to scroll through 8 organic farm worlds, build custom baskets & manage daily morning deliveries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {/* Quick Demo Google Account Options */}
          <button
            type="button"
            onClick={() => handleQuickLogin("jaswanth.arjun@gmail.com", "Jaswanth Arjun")}
            className="group relative flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jaswanth"
                alt="Jaswanth Arjun"
                className="size-10 rounded-full border border-emerald-400 bg-slate-100"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                  Jaswanth Arjun
                </p>
                <p className="text-xs text-slate-500 font-medium">jaswanth.arjun@gmail.com</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 opacity-90 group-hover:opacity-100">
              Continue <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("customer@greenbasket.in", "GreenBasket Customer")}
            className="group relative flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=GreenBasket"
                alt="Customer"
                className="size-10 rounded-full border border-slate-300 bg-slate-100"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                  GreenBasket Customer
                </p>
                <p className="text-xs text-slate-500 font-medium">customer@greenbasket.in</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 opacity-90 group-hover:opacity-100">
              Continue <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          {/* Custom Google Account Input toggle */}
          {!showInput ? (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>+ Use another Google account</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Enter Google Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Feature benefits list */}
        <div className="mt-6 rounded-2xl bg-slate-50/80 border border-slate-200/60 p-3.5 text-[11px] text-slate-600 space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span>Instant access to 8 interactive 3D farm worlds</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span>Automatic 6 AM Sunrise Delivery booking</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span>One-click pause/cancel subscription controls</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="size-3.5 text-slate-400" />
          <span>Protected by Google OAuth • Secure SSL Connection</span>
        </div>
      </div>
    </div>
  );
}
