import { create } from "zustand";
import {
  DELIVERY_DAYS_PER_MONTH,
  MAX_QUANTITY,
  productById,
  products,
} from "../data/products";

const clamp = (n) => Math.max(0, Math.min(MAX_QUANTITY, n));

// Persist session across page loads so the backend can dedupe abandonment
// records per user instead of creating a new one on every visit.
const getStoredSessionId = () => {
  if (typeof window === "undefined") return `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  try {
    let sid = window.localStorage.getItem("gb_session_id");
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      window.localStorage.setItem("gb_session_id", sid);
    }
    return sid;
  } catch {
    return `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
};

export const useBasket = create((set) => ({
  quantities: {},
  lastAdded: null,
  drawerOpen: false,
  customerName: "Jaswanth Nelluru",
  customerEmail: "jaswanthnelluru2004@gmail.com",
  customerPhone: "+919392443002",
  addressLine: "Flat 402, Green Glen Towers, Road No 3",
  city: "Hyderabad",
  pincode: "500081",
  landmark: "Near Fresh Mart Supermarket",
  sessionId: getStoredSessionId(),
  orderCompleted: false,
  setCustomerInfo: (info) => set((s) => ({ ...s, ...info })),
  setOrderCompleted: (orderCompleted) => {
    if (orderCompleted) {
      const newSid = `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      if (typeof window !== "undefined") {
        try { window.localStorage.setItem("gb_session_id", newSid); } catch {}
      }
      set({ orderCompleted: true, sessionId: newSid });
    } else {
      set({ orderCompleted: false });
    }
  },
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
  clear: () => {
    const newSid = `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem("gb_session_id", newSid); } catch {}
    }
    set({ quantities: {}, sessionId: newSid, orderCompleted: false });
  },
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
}));

export const useBasketLines = () => {
  const quantities = useBasket((s) => s.quantities);
  const lines = [];
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
