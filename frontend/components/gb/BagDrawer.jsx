"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DELIVERY_DAYS_PER_MONTH, formatINR } from "../../data/products";
import { useBasket, useBasketTotals } from "../../store/basket";
import { QuantityStepper } from "./ProductCard";

export function BagDrawer({ onContinue }) {
  const open = useBasket((s) => s.drawerOpen);
  const setOpen = useBasket((s) => s.setDrawerOpen);
  const increment = useBasket((s) => s.increment);
  const decrement = useBasket((s) => s.decrement);
  const { lines, daily, monthly, items } = useBasketTotals();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-leaf-deep/25 backdrop-blur-[2px] transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="My morning bag"
        className={`glass-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col rounded-l-[28px] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between border-b border-white/45 px-6 py-5">
          <div>
            <h2 className="display-title text-3xl font-bold text-ink">My morning bag</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {items} item{items === 1 ? "" : "s"} · delivered 6 AM daily
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="grid size-9 place-items-center rounded-full bg-white/60 text-ink transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </header>

        <div data-inner-scroll className="gb-scroll flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {lines.length === 0 && (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              Your basket is empty. Travel through the worlds and add what you love.
            </p>
          )}
          {lines.map(({ product, quantity, daily: d }) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border border-white/45 bg-white/40 p-3"
            >
              <div
                className="grid size-14 shrink-0 place-items-center rounded-xl text-2xl overflow-hidden"
                style={{
                  background: `radial-gradient(120% 120% at 30% 20%, #fff 0%, ${product.swatch || '#f4efe0'} 70%)`,
                }}
                aria-hidden
              >
                {product.image && (product.image.startsWith("http") || product.image.startsWith("/")) ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-xl" />
                ) : (
                  <span>{product.image}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{product.name}</p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {product.unit} · {formatINR(d)}/day · {formatINR(d * DELIVERY_DAYS_PER_MONTH)}/mo
                </p>
                <div className="mt-2">
                  <QuantityStepper
                    compact
                    quantity={quantity}
                    onIncrement={() => increment(product.id)}
                    onDecrement={() => decrement(product.id)}
                    label={product.name}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="shrink-0 space-y-3 border-t border-white/45 px-6 py-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Daily basket
            </span>
            <span className="display-title tabular-nums text-2xl text-leaf-deep font-bold">
              {formatINR(daily)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Monthly subscription
            </span>
            <span className="display-title tabular-nums text-3xl font-bold text-ink">
              {formatINR(monthly)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onContinue();
            }}
            className="w-full rounded-full bg-leaf-deep py-3 text-xs font-medium uppercase tracking-[0.28em] text-cream transition hover:bg-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 cursor-pointer"
          >
            Continue
          </button>
        </footer>
      </aside>
    </>
  );
}
