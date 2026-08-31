"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { productsByCategory } from "../../data/products";
import { ProductCard } from "./ProductCard";

const CATEGORY_BACKGROUNDS = {
  dairy: "/dairy-farm-bg.png",
  bakery: "/bakery-artisan-bg.png",
  vegetables: "https://images.pexels.com/photos/5503193/pexels-photo-5503193.jpeg?auto=compress&cs=tinysrgb&w=1920",
  fruits: "https://images.pexels.com/photos/10011899/pexels-photo-10011899.jpeg?auto=compress&cs=tinysrgb&w=1920",
  breakfast: "https://images.pexels.com/photos/5505465/pexels-photo-5505465.jpeg?auto=compress&cs=tinysrgb&w=1920",
  drinks: "https://images.pexels.com/photos/9228128/pexels-photo-9228128.jpeg?auto=compress&cs=tinysrgb&w=1920",
  staples: "https://images.pexels.com/photos/32858024/pexels-photo-32858024.jpeg?auto=compress&cs=tinysrgb&w=1920",
  herbs: "https://images.pexels.com/photos/4750396/pexels-photo-4750396.jpeg?auto=compress&cs=tinysrgb&w=1920",
};

export function CategoryPanel({ category, position, active }) {
  const items = productsByCategory(category.id);
  const scroller = useRef(null);
  const containerRef = useRef(null);
  const [atBottom, setAtBottom] = useState(false);

  const bgImage = CATEGORY_BACKGROUNDS[category.id] || CATEGORY_BACKGROUNDS["dairy"];

  useEffect(() => {
    if (active && scroller.current) scroller.current.scrollTop = 0;
  }, [active]);

  useEffect(() => {
    if (!active) return;

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
        containerRef.current.style.setProperty("--cmx", currentX.toFixed(4));
        containerRef.current.style.setProperty("--cmy", currentY.toFixed(4));
      }

      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
  };

  return (
    <section
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden select-none px-4 py-8 sm:px-6"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden bg-black/40">
        <div
          className="absolute inset-[-5%] h-[110%] w-[110%] will-change-transform"
          style={{
            transform: `translate3d(calc(var(--cmx, 0) * -28px), calc(var(--cmy, 0) * -20px), 0) scale(1.05)`,
          }}
        >
          <img
            src={bgImage}
            alt={`${category.name} Organic World`}
            className="h-full w-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 100%)",
            }}
          />
        </div>
      </div>

      <div className="glass-panel relative z-20 flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] shadow-2xl border border-white/70 bg-white/75 backdrop-blur-xl transition-all duration-300">
        <header className="shrink-0 border-b border-white/40 bg-white/40 px-6 pb-4 pt-6 text-center sm:px-10">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-black/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-md">
              {position}
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900 shadow-sm backdrop-blur-md">
              <Sparkles className="size-3 text-emerald-600 animate-pulse" />
              <span>Direct Organic Harvest</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-4xl sm:text-5xl" aria-hidden>
              {category.icon}
            </span>
            <h2 className="display-title text-4xl font-bold text-ink sm:text-6xl">
              {category.name}
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground max-w-md mx-auto">
            {category.subtitle || `Handpicked fresh organic ${category.name.toLowerCase()} delivered daily.`}
          </p>
        </header>

        <div
          ref={scroller}
          onScroll={onScroll}
          data-inner-scroll
          className="gb-scroll flex-1 overflow-y-auto px-5 py-6 sm:px-8"
        >
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No products found in this category.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {items.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/40 bg-white/40 px-6 py-3 text-center sm:px-10">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>{items.length} items available</span>
            <span className="inline-flex items-center gap-1">
              Scroll for next world <ChevronDown className={`size-3.5 ${atBottom ? "animate-bounce" : ""}`} />
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
}
