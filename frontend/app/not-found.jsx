"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e17] text-white p-4 text-center">
      <h1 className="text-4xl font-bold text-emerald-400 mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm mb-6">
        The requested route could not be found. Please check the navigation.
      </p>
      <Link
        href="/receivables"
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors text-sm"
      >
        Go to B2B Receivables Dashboard
      </Link>
    </div>
  );
}
