"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, Sparkles, Leaf, ShoppingBag } from "lucide-react";

export function Intro({ onStart }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
    };

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (containerRef.current) {
        containerRef.current.style.setProperty("--mx", currentX.toFixed(4));
        containerRef.current.style.setProperty("--my", currentY.toFixed(4));
      }

      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex h-full w-full flex-col justify-between overflow-hidden select-none"
    >
      {/* Ambient Sunbeam Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at calc(50% + var(--mx, 0) * 300px) calc(40% + var(--my, 0) * 300px), rgba(255, 235, 175, 0.45), rgba(255, 215, 120, 0.18) 45%, transparent 75%)`,
        }}
      />

      {/* Dynamic Background Image Layer with 3D Parallax */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#e0be7d]">
        <div
          className="absolute inset-[-4%] h-[108%] w-[108%] will-change-transform"
          style={{
            transform: `translate3d(calc(var(--mx, 0) * -24px), calc(var(--my, 0) * -18px), 0) scale(1.04)`,
          }}
        >
          <img
            src="/hero-farm-table.png"
            alt="Farm-To-Table Organic Harvest"
            className="h-full w-full object-cover object-center filter brightness-[0.96] contrast-[1.02]"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(40, 26, 8, 0.45) 0%, rgba(0,0,0,0.15) 50%, rgba(45, 30, 10, 0.52) 100%)",
            }}
          />
        </div>
      </div>

      {/* Floating Animated Leaves Layer */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div
          className="absolute top-6 left-[8%] size-12 opacity-85 will-change-transform"
          style={{
            transform: `translate3d(calc(var(--mx, 0) * 35px), calc(var(--my, 0) * 25px), 0)`,
            animation: "gb-float-leaf 6s ease-in-out infinite alternate",
          }}
        >
          <Leaf className="size-full text-[#5c8a4d] drop-shadow-md" />
        </div>

        <div
          className="absolute top-8 right-[10%] size-14 opacity-90 will-change-transform"
          style={{
            transform: `translate3d(calc(var(--mx, 0) * -40px), calc(var(--my, 0) * 30px), 0)`,
            animation: "gb-float-leaf 7s ease-in-out infinite alternate-reverse",
          }}
        >
          <Leaf className="size-full text-[#4a773d] drop-shadow-md" />
        </div>

        <div
          className="absolute top-[38%] right-[5%] size-10 opacity-75 will-change-transform"
          style={{
            transform: `translate3d(calc(var(--mx, 0) * -20px), calc(var(--my, 0) * -25px), 0)`,
            animation: "gb-float-leaf 5s ease-in-out infinite alternate",
          }}
        >
          <Leaf className="size-full text-[#6b9e59] drop-shadow-sm" />
        </div>
      </div>

      {/* HERO CONTENT SECTION */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-6 text-center my-auto py-10 h-full">
        <div
          className="mx-auto flex max-w-3xl flex-col items-center will-change-transform"
          style={{
            transform: `translate3d(calc(var(--mx, 0) * 16px), calc(var(--my, 0) * 12px), 0)`,
          }}
        >
          <div
            className="glass-panel inline-flex items-center gap-2.5 rounded-full px-6 py-2.5 text-xs font-bold tracking-[0.32em] uppercase text-[#422e11] shadow-xl border border-white/70 bg-white/80 backdrop-blur-md"
            style={{ animation: "gb-middle-action 800ms cubic-bezier(0.2, 0.8, 0.2, 1) 100ms both" }}
          >
            <Sparkles className="size-3.5 text-[#b8782a] animate-pulse" />
            <span>Farm-To-Table • Original Fresh</span>
            <Sparkles className="size-3.5 text-[#b8782a] animate-pulse" />
          </div>

          <h1
            className="display-title mt-4 whitespace-nowrap text-5xl font-black sm:text-7xl md:text-8xl lg:text-8xl xl:text-9xl tracking-tight text-white select-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
            style={{ animation: "gb-middle-action 850ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both" }}
          >
            GreenBasket
          </h1>

          <div style={{ animation: "gb-middle-action 900ms cubic-bezier(0.2, 0.8, 0.2, 1) 900ms both" }}>
            <p className="mt-4 text-2xl font-bold tracking-wide text-[#fff6db] drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] sm:text-3xl lg:text-4xl">
              Freshness. Delivered Every Morning.
            </p>

            <p className="mx-auto mt-3.5 max-w-xl text-xs sm:text-sm font-semibold text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-relaxed">
              Explore 8 farm worlds & build your custom daily subscription basket. Delivered at 6 AM.
            </p>
          </div>

          <div
            className="mt-8 flex flex-col items-center gap-4"
            style={{ animation: "gb-middle-action 950ms cubic-bezier(0.2, 0.8, 0.2, 1) 1050ms both" }}
          >
            <button
              type="button"
              onClick={onStart}
              className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-600 px-10 py-4 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-950/50 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 cursor-pointer"
            >
              <ShoppingBag className="size-4 transition-transform group-hover:scale-110" />
              <span>Start Building Your Basket</span>
              <ChevronDown className="size-4 transition-transform group-hover:translate-y-1" />
              <span className="absolute -inset-0.5 rounded-full bg-white/25 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-white/95 font-bold drop-shadow-md">
              <span className="rounded-full bg-black/45 px-4 py-1.5 backdrop-blur-md border border-white/30 shadow-lg">
                🌿 100% Organic Direct
              </span>
              <span className="rounded-full bg-black/45 px-4 py-1.5 backdrop-blur-md border border-white/30 shadow-lg">
                🌅 6:00 AM Sunrise Delivery
              </span>
              <span className="rounded-full bg-black/45 px-4 py-1.5 backdrop-blur-md border border-white/30 shadow-lg">
                ⚡ Pause or Cancel Anytime
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full overflow-hidden leading-none pointer-events-none mt-auto">
        <svg
          className="relative block w-full h-10 sm:h-14 text-cream fill-current"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  );
}
