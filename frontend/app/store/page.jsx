"use client";

import { categories } from "../../data/categories";
import { Scene } from "../../components/gb/Scene";
import { Intro } from "../../components/gb/Intro";
import { CategoryPanel } from "../../components/gb/CategoryPanel";
import { FinalBasket } from "../../components/gb/FinalBasket";
import { FloatingBag } from "../../components/gb/FloatingBag";
import { BagDrawer } from "../../components/gb/BagDrawer";
import { CategoryRail, ProgressBadge } from "../../components/gb/CategoryRail";
import { usePrefersReducedMotion, useSectionScroll } from "../../hooks/useSectionScroll";

const TOTAL = categories.length + 2; // intro + 8 worlds + final basket

export default function GreenBasketPage() {
  const { index, goTo } = useSectionScroll(TOTAL);
  const reduced = usePrefersReducedMotion();

  const isIntro = index === 0;
  const isFinal = index === TOTAL - 1;
  const categoryIndex = Math.min(Math.max(index - 1, 0), categories.length - 1);
  const activeCategory = isIntro ? -1 : isFinal ? categories.length : categoryIndex;

  return (
    <main className="relative h-screen w-screen overflow-hidden text-ink select-none">
      {/* 3D WebGL Background Scene */}
      <Scene categoryIndex={categoryIndex} intro={isIntro} reduced={reduced} />

      {/* Cinematic Vignette + Warm Light Wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 10%, rgba(255,244,214,.35), transparent 60%), radial-gradient(120% 120% at 50% 110%, rgba(30,60,30,.28), transparent 55%)",
        }}
      />

      {/* Stacked Full-Viewport Sections with Cinematic Cross-Fade */}
      <div className="relative h-full w-full">
        {Array.from({ length: TOTAL }, (_, i) => {
          const offset = i - index;
          const activeSection = offset === 0;
          if (Math.abs(offset) > 1) return null;
          return (
            <div
              key={i}
              aria-hidden={!activeSection}
              className="absolute inset-0 transition-all duration-[600ms] ease-[cubic-bezier(.16,.84,.24,1)] will-change-transform"
              style={{
                opacity: activeSection ? 1 : 0,
                transform: activeSection
                  ? "translate3d(0,0,0) scale(1)"
                  : `translate3d(0, ${offset * 6}vh, 0) scale(${offset < 0 ? 1.04 : 0.96})`,
                pointerEvents: activeSection ? "auto" : "none",
                display: Math.abs(offset) > 1 ? "none" : "block",
              }}
            >
              {i === 0 ? (
                <Intro onStart={() => goTo(1)} />
              ) : i === TOTAL - 1 ? (
                <FinalBasket />
              ) : (
                <CategoryPanel
                  category={categories[i - 1]}
                  position={`${String(i).padStart(2, "0")} / 08`}
                  active={activeSection}
                />
              )}
            </div>
          );
        })}
      </div>

      {!isIntro && !isFinal && (
        <>
          <CategoryRail activeCategory={activeCategory} onSelect={(i) => goTo(i + 1)} />
          <ProgressBadge index={categoryIndex + 1} label={categories[categoryIndex].name} />
        </>
      )}
      {isFinal && (
        <div className="glass-soft fixed left-1/2 top-5 z-30 -translate-x-1/2 rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:left-auto sm:right-8 sm:translate-x-0">
          Final basket
        </div>
      )}

      {/* FloatingBag: visible on category worlds, hidden on final basket */}
      {!isIntro && !isFinal && <FloatingBag />}
      <BagDrawer onContinue={() => goTo(TOTAL - 1)} />
    </main>
  );
}
