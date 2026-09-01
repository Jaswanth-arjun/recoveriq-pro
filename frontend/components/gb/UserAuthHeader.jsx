"use client";

import { LogOut, User, Sparkles } from "lucide-react";

export function UserAuthHeader({ user, onLogout, onSignInClick }) {
  if (user) {
    return (
      <div className="fixed top-4 left-4 sm:left-6 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 p-1.5 pr-4 backdrop-blur-md shadow-xl transition-all duration-300">
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
          alt={user.name}
          className="size-8 rounded-full border border-emerald-400/80 bg-white object-cover"
        />
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-white leading-tight flex items-center gap-1">
            {user.name}
            <Sparkles className="size-3 text-amber-400" />
          </p>
          <p className="text-[10px] text-slate-300 font-medium leading-none">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="ml-2 flex items-center gap-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
          title="Sign Out to test new customer experience"
        >
          <LogOut className="size-3" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSignInClick}
      className="fixed top-4 left-4 sm:left-6 z-40 flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 hover:bg-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-xl transition-all cursor-pointer"
    >
      <User className="size-3.5" />
      <span>Sign In with Google</span>
    </button>
  );
}
