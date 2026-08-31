"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Next.js Error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e17] text-white p-4 text-center">
      <h2 className="text-2xl font-bold text-rose-400 mb-2">Something went wrong!</h2>
      <p className="text-slate-400 text-sm mb-4">{error?.message || "An unexpected error occurred."}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors text-sm border border-slate-700"
      >
        Try again
      </button>
    </div>
  );
}
