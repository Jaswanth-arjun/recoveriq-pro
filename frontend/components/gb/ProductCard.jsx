"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Check, ShoppingBag } from "lucide-react";
import { DELIVERY_DAYS_PER_MONTH, formatINR, MAX_QUANTITY } from "../../data/products";
import { useBasket } from "../../store/basket";
import { cn } from "../../lib/utils";

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  label,
  compact = false,
  min = 0,
}) {
  const btn =
    "flex items-center justify-center rounded-full border border-glass-line bg-white/60 text-ink transition-all hover:bg-white hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:opacity-35 disabled:hover:scale-100 cursor-pointer";
  const size = compact ? "size-7" : "size-8";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Decrease quantity of ${label}`}
        className={cn(btn, size)}
        onClick={onDecrement}
        disabled={quantity <= min}
      >
        <Minus className={compact ? "size-3" : "size-3.5"} />
      </button>
      <span
        key={quantity}
        className={cn(
          "tabular-nums text-center font-bold text-ink select-none",
          compact ? "w-5 text-xs" : "w-6 text-sm",
        )}
        style={{ animation: "gb-pop 260ms ease-out" }}
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${label}`}
        className={cn(btn, size)}
        onClick={onIncrement}
        disabled={quantity >= MAX_QUANTITY}
      >
        <Plus className={compact ? "size-3" : "size-3.5"} />
      </button>
    </div>
  );
}

export function ProductCard({ product, index }) {
  const basketQuantity = useBasket((s) => s.quantities[product.id] ?? 0);
  const setQuantity = useBasket((s) => s.setQuantity);
  const increment = useBasket((s) => s.increment);
  const decrement = useBasket((s) => s.decrement);
  
  const [localQty, setLocalQty] = useState(1);
  const [burst, setBurst] = useState(0);
  const timer = useRef(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleAddToBag = () => {
    setQuantity(product.id, localQty);
    setBurst((b) => b + 1);
  };

  const isAdded = basketQuantity > 0;

  return (
    <article
      className="group relative flex flex-col justify-between rounded-2xl border border-white/50 bg-white/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_20px_45px_-20px_rgba(30,60,30,0.4)] h-full"
      style={{ animation: `gb-rise 520ms cubic-bezier(.2,.8,.2,1) ${Math.min(index, 8) * 40}ms both` }}
    >
      <div>
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2 sm:size-22"
            style={{
              background: `radial-gradient(120% 120% at 30% 20%, #ffffff 0%, ${product.swatch || '#f4efe0'} 62%, rgba(0,0,0,0.08) 100%)`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.8), 0 8px 18px -12px rgba(40,60,30,.7)",
            }}
            aria-hidden
          >
            {product.image.startsWith("http") || product.image.startsWith("/") ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover object-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <span className="text-4xl drop-shadow-sm sm:text-5xl">{product.image}</span>
            )}
            {product.badge && (
              <span className="absolute top-1 right-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white shadow-sm backdrop-blur-sm">
                {product.badge}
              </span>
            )}
            {burst > 0 && (
              <span
                key={burst}
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-leaf/70"
                style={{ animation: "gb-burst 620ms ease-out forwards" }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="display-title truncate text-base font-bold text-ink sm:text-lg">{product.name}</h3>
              <p className="display-title text-base font-bold text-leaf-deep shrink-0">{formatINR(product.pricePerDay)}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
              <p className="uppercase tracking-[0.14em]">
                {product.unit}
                {product.tag ? ` · ${product.tag}` : ""}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em]">/ day</p>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/40 pt-3">
        <QuantityStepper
          quantity={isAdded ? basketQuantity : localQty}
          onIncrement={() => {
            if (isAdded) {
              increment(product.id);
            } else {
              setLocalQty((q) => Math.min(MAX_QUANTITY, q + 1));
            }
          }}
          onDecrement={() => {
            if (isAdded) {
              decrement(product.id);
            } else {
              setLocalQty((q) => Math.max(1, q - 1));
            }
          }}
          label={`${product.name} ${product.unit}`}
          compact
          min={isAdded ? 0 : 1}
        />

        {isAdded ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-900 shadow-sm backdrop-blur-sm">
            <Check className="size-3.5 text-emerald-600" />
            <span className="tabular-nums">
              {formatINR(product.pricePerDay * basketQuantity * DELIVERY_DAYS_PER_MONTH)}/mo
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToBag}
            className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          >
            <ShoppingBag className="size-3.5" />
            <span>Add to bag</span>
          </button>
        )}
      </div>
    </article>
  );
}
