import { useEffect, useState } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatINR } from "@/data/products";
import { useBasket, useBasketTotals } from "@/store/basket";

export function FloatingBag({ hidden }: { hidden?: boolean }) {
  const { items, daily, monthly } = useBasketTotals();
  const setDrawerOpen = useBasket((s) => s.setDrawerOpen);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (items > 0) setPulse((p) => p + 1);
  }, [items]);

  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-label={`View my morning bag, ${items} items, ${formatINR(daily)} per day`}
      className="glass-panel fixed bottom-5 right-5 z-40 w-[13.5rem] rounded-3xl px-5 py-4 text-left transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf sm:bottom-8 sm:right-8"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        <ShoppingBag
          key={pulse}
          className="size-4 text-leaf-deep"
          style={{ animation: "gb-pop 420ms ease-out" }}
        />
        My morning bag
      </div>
      <p className="mt-2 text-sm text-ink">
        <span className="tabular-nums font-medium">{items}</span> item{items === 1 ? "" : "s"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Today</p>
          <p className="display-title tabular-nums text-xl text-leaf-deep">{formatINR(daily)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Monthly</p>
          <p className="display-title tabular-nums text-xl text-ink">{formatINR(monthly)}</p>
        </div>
      </div>
      <span className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-leaf-deep">
        View bag <ArrowRight className="size-3.5" />
      </span>
    </button>
  );
}
