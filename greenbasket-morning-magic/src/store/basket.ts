import { create } from "zustand";
import {
  DELIVERY_DAYS_PER_MONTH,
  MAX_QUANTITY,
  productById,
  products,
} from "@/data/products";

interface BasketState {
  quantities: Record<string, number>;
  lastAdded: string | null;
  drawerOpen: boolean;
  setQuantity: (id: string, qty: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setDrawerOpen: (open: boolean) => void;
}

const clamp = (n: number) => Math.max(0, Math.min(MAX_QUANTITY, n));

export const useBasket = create<BasketState>((set) => ({
  quantities: {},
  lastAdded: null,
  drawerOpen: false,
  setQuantity: (id, qty) =>
    set((s) => {
      const next = { ...s.quantities };
      const value = clamp(qty);
      if (value <= 0) delete next[id];
      else next[id] = value;
      return { quantities: next, lastAdded: value > 0 ? id : s.lastAdded };
    }),
  increment: (id) =>
    set((s) => {
      const value = clamp((s.quantities[id] ?? 0) + 1);
      return { quantities: { ...s.quantities, [id]: value }, lastAdded: id };
    }),
  decrement: (id) =>
    set((s) => {
      const next = { ...s.quantities };
      const value = clamp((s.quantities[id] ?? 0) - 1);
      if (value <= 0) delete next[id];
      else next[id] = value;
      return { quantities: next };
    }),
  remove: (id) =>
    set((s) => {
      const next = { ...s.quantities };
      delete next[id];
      return { quantities: next };
    }),
  clear: () => set({ quantities: {} }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
}));

export interface BasketLine {
  product: (typeof products)[number];
  quantity: number;
  daily: number;
  monthly: number;
}

export const useBasketLines = (): BasketLine[] => {
  const quantities = useBasket((s) => s.quantities);
  const lines: BasketLine[] = [];
  for (const [id, quantity] of Object.entries(quantities)) {
    const product = productById[id];
    if (!product || quantity <= 0) continue;
    const daily = product.pricePerDay * quantity;
    lines.push({ product, quantity, daily, monthly: daily * DELIVERY_DAYS_PER_MONTH });
  }
  return lines;
};

export const useBasketTotals = () => {
  const lines = useBasketLines();
  const daily = lines.reduce((sum, l) => sum + l.daily, 0);
  const items = lines.reduce((sum, l) => sum + l.quantity, 0);
  return {
    lines,
    items,
    products: lines.length,
    daily,
    monthly: daily * DELIVERY_DAYS_PER_MONTH,
  };
};
