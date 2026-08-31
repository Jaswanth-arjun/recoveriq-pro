"use client";

import { categories } from "../../data/categories";
import { cn } from "../../lib/utils";

export function CategoryRail({ activeCategory, onSelect }) {
  return (
    <nav
      aria-label="Category navigation"
      className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 bg-black/40 border border-white/25 backdrop-blur-md shadow-xl md:flex transition-all duration-300"
    >
      {categories.map((c, i) => {
        const active = i === activeCategory;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={active ? "true" : undefined}
            className="group relative flex items-center justify-center cursor-pointer focus-visible:outline-none"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-300",
                active
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110 ring-2 ring-white/90"
                  : "bg-white/15 text-white/90 hover:bg-white/35 hover:scale-110"
              )}
            >
              {c.icon}
            </span>

            <span
              className={cn(
                "pointer-events-none absolute left-10 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white bg-black/80 border border-white/20 shadow-xl backdrop-blur-md whitespace-nowrap transition-all duration-200",
                active
                  ? "opacity-100 translate-x-1"
                  : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1"
              )}
            >
              {c.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function ProgressBadge({ index, label }) {
  return (
    <div className="glass-panel fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-white/40 bg-black/40 px-5 py-2 text-center shadow-xl backdrop-blur-md sm:left-auto sm:right-6 sm:translate-x-0 transition-all duration-300">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
        World {String(index).padStart(2, "0")} / 08
      </p>
      <p className="display-title text-xs font-bold uppercase tracking-[0.18em] text-white">{label}</p>
    </div>
  );
}
