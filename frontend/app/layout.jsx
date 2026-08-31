"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import useLive from "../lib/useLive";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/receivables", label: "B2B Receivables" },
  { href: "/promises", label: "Promises to Pay" },
  { href: "/subscriptions", label: "Subscribers & Delivery" },
  { href: "/diagnoses", label: "Diagnoses" },
  { href: "/approvals", label: "Approvals" },
  { href: "/plan", label: "Recovery Plan" },
  { href: "/timeline", label: "Timeline" },
  { href: "/calls", label: "Call Console" },
  { href: "/copilot", label: "Copilot" },
  { href: "/report", label: "Report" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const { connected } = useLive();
  const [open, setOpen] = useState(false);

  const isStoreRoute = pathname?.startsWith("/store");

  if (isStoreRoute) {
    return (
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="bg-[#0e0b08] text-slate-200 min-h-screen antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0a0e17] text-slate-200 min-h-screen antialiased" suppressHydrationWarning>
        <div className="flex min-h-screen">
          <aside
            className={`${
              open ? "block" : "hidden"
            } md:block fixed md:sticky top-0 h-screen z-40 w-56 shrink-0 bg-[#111827] border-r border-slate-800 p-4 overflow-y-auto`}
          >
            <Link href="/" className="block mb-6">
              <div className="text-lg font-bold text-white tracking-tight">
                RecoverIQ <span className="text-emerald-400">Pro</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                AI Revenue Recovery
              </div>
            </Link>

            <Link
              href="/store"
              className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-3 py-2.5 text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              🥦 Open GreenBasket Store
            </Link>

            <nav className="space-y-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest">
              Razorpay Buildathon
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-y-auto">
            <header className="sticky top-0 z-30 bg-[#0a0e17]/90 backdrop-blur border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden text-slate-400 hover:text-white text-xl leading-none"
                  onClick={() => setOpen(!open)}
                  aria-label="Toggle navigation"
                >
                  ☰
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-semibold px-3 py-1 uppercase tracking-wide">
                  Razorpay TEST MODE
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/store"
                  className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-3 py-1 text-xs font-semibold transition-colors"
                >
                  🥦 View GreenBasket Storefront ➔
                </Link>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      connected ? "bg-emerald-400" : "bg-rose-500"
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {connected ? "WS Connected" : "WS Disconnected"}
                  </span>
                </div>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-24">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
