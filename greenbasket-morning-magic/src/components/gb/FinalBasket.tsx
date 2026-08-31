import { useState } from "react";
import { Sunrise, PackageCheck, Repeat, X, Sparkles } from "lucide-react";
import { DELIVERY_DAYS_PER_MONTH, formatINR } from "@/data/products";
import { useBasketTotals } from "@/store/basket";

export function FinalBasket() {
  const { lines, items, products, daily, monthly } = useBasketTotals();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden select-none px-4 py-10 sm:px-6">
      {/* Full-Bleed Dynamic Background Layer featuring the 8-Category Collage Image */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#f7f3e9]">
        <img
          src="/summary-bg.jpg"
          alt="GreenBasket Harvest Overview"
          className="h-full w-full object-cover object-center filter brightness-[0.98] contrast-[1.02] transition-transform duration-700 hover:scale-105"
        />
        {/* Subtle Vignette Overlay to ensure glass card pops */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, rgba(30,20,10,0.45) 100%), linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>

      {/* Main Subscription Glassmorphic Panel */}
      <div className="glass-panel relative z-20 flex max-h-[84vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] shadow-2xl border border-white/80 bg-white/80 backdrop-blur-xl transition-all duration-500">
        <header className="shrink-0 border-b border-white/40 bg-white/40 px-6 pb-4 pt-6 text-center sm:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900 shadow-sm backdrop-blur-md">
            <Sparkles className="size-3 text-emerald-600 animate-pulse" />
            <span>Complete Subscription Overview</span>
          </div>
          <h2 className="display-title mt-2 text-3xl font-bold text-ink sm:text-5xl">
            Your Morning, Your Way.
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Review your daily subscription basket before confirming sunrise delivery
          </p>
        </header>

        <div data-inner-scroll className="gb-scroll flex-1 overflow-y-auto px-6 py-5 sm:px-10">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Daily Basket Total
              </p>
              <p className="display-title tabular-nums mt-1 text-4xl text-leaf-deep font-bold">
                {formatINR(daily)}
                <span className="text-sm font-normal text-muted-foreground"> / day</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Monthly Subscription ({DELIVERY_DAYS_PER_MONTH} Days)
              </p>
              <p className="display-title tabular-nums mt-1 text-4xl text-ink font-bold">
                {formatINR(monthly)}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: <PackageCheck className="size-4" />, k: "Products", v: String(products) },
              { icon: <Repeat className="size-4" />, k: "Total units", v: String(items) },
              { icon: <Sunrise className="size-4" />, k: "Delivery", v: "6 AM Daily" },
              {
                icon: <Repeat className="size-4" />,
                k: "Frequency",
                v: `${DELIVERY_DAYS_PER_MONTH} days/mo`,
              },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-white/50 bg-white/40 p-4 shadow-sm">
                <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {s.icon}
                  {s.k}
                </dt>
                <dd className="display-title mt-1 text-lg font-bold text-ink">{s.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 space-y-2.5">
            {lines.length === 0 && (
              <div className="rounded-2xl border border-dashed border-muted-foreground/30 py-10 text-center text-sm text-muted-foreground">
                Nothing selected yet — scroll back up through the 8 farm worlds and fill your morning basket!
              </div>
            )}
            {lines.map(({ product, quantity, daily: d, monthly: m }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/50 px-4 py-3 shadow-sm"
              >
                {product.image.startsWith("http") || product.image.startsWith("/") ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-2xl" aria-hidden>
                    {product.image}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {product.name}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    · {product.unit} × {quantity}
                  </span>
                </span>
                <span className="tabular-nums text-sm font-bold text-leaf-deep">{formatINR(d)}/day</span>
                <span className="hidden tabular-nums text-sm font-medium text-muted-foreground sm:inline">
                  {formatINR(m)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/40 bg-white/40 px-6 py-5 text-center sm:px-10">
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            disabled={lines.length === 0}
            className="w-full rounded-full bg-leaf-deep py-4 text-xs font-bold uppercase tracking-[0.3em] text-cream transition-all hover:bg-leaf disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 sm:w-auto sm:px-14 shadow-lg cursor-pointer"
          >
            Confirm & Build Subscription
          </button>
          <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Demo experience · no actual payment is processed
          </p>
        </footer>
      </div>

      {confirmed && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-leaf-deep/40 px-6 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            className="glass-panel w-full max-w-md rounded-[24px] border border-white/80 bg-white/90 p-8 text-center shadow-2xl"
            style={{ animation: "gb-rise 420ms ease-out both" }}
          >
            <button
              type="button"
              onClick={() => setConfirmed(false)}
              aria-label="Close"
              className="ml-auto grid size-8 place-items-center rounded-full bg-white/70 text-ink shadow-sm hover:bg-white"
            >
              <X className="size-4" />
            </button>
            <p className="text-5xl">🌅</p>
            <h3 className="display-title mt-3 text-3xl font-bold text-ink">Subscription Active!</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              <strong className="text-ink">{products} products</strong> · {formatINR(daily)} per morning · {formatINR(monthly)} per month.
              Your custom GreenBasket will be delivered fresh every morning at 6 AM.
            </p>
            <button
              type="button"
              onClick={() => setConfirmed(false)}
              className="mt-6 w-full rounded-full bg-leaf-deep py-3 text-xs font-bold uppercase tracking-[0.28em] text-cream transition hover:bg-leaf shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
