import { useEffect } from "react";
import { useBasket, useBasketTotals } from "../store/basket";
import { API } from "../lib/api";

export function useAbandonmentTracker() {
  const { lines, daily, monthly } = useBasketTotals();
  const customerName = useBasket((s) => s.customerName);
  const customerEmail = useBasket((s) => s.customerEmail);
  const customerPhone = useBasket((s) => s.customerPhone);
  const sessionId = useBasket((s) => s.sessionId);
  const orderCompleted = useBasket((s) => s.orderCompleted);

  useEffect(() => {
    if (orderCompleted) return;
    const cartVal = monthly > 0 ? monthly : daily;
    if (cartVal <= 0 && !customerName && !customerEmail && !customerPhone) return;

    const getItemsDetail = () => {
      return lines.map((l) => ({
        name: l.product?.name || "Grocery Item",
        unit: l.product?.unit || "1 pc",
        quantity: l.quantity,
        price: l.daily,
      }));
    };

    const triggerAbandonment = (reason = "tab_switch_or_exit", unloading = false) => {
      if (orderCompleted) return;

      const payload = JSON.stringify({
        session_id: sessionId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        cart_items: getItemsDetail(),
        cart_value: cartVal > 0 ? cartVal : 500,
        stage: "checkout_basket",
        reason: reason,
      });
      const base = process.env.NEXT_PUBLIC_API_URL || API;
      const endpoint = `${base}/api/checkouts/abandon`;

      // sendBeacon cannot complete cross-origin requests that need a CORS
      // preflight (e.g. Content-Type: application/json) — the browser drops
      // the POST silently after the OPTIONS. `text/plain` IS CORS-safelisted,
      // so beacons must always use it (backend parses the raw body anyway).
      const sendBeacon = () => {
        if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
        try {
          const blob = new Blob([payload], { type: "text/plain" });
          console.info("[abandonment] sending beacon to", endpoint, "reason=", reason);
          return navigator.sendBeacon(endpoint, blob);
        } catch (e) {
          return false;
        }
      };

      const sendFetch = () => {
        console.info("[abandonment] fetch to", endpoint, "reason=", reason);
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => { });
      };

      if (unloading) {
        // Page is unloading: beacon (text/plain) is the reliable path.
        if (!sendBeacon()) sendFetch();
      } else {
        // Page still alive: plain fetch handles CORS preflight correctly.
        sendFetch();
      }
    };

    // Auto-sync 1 second after adding items or typing customer info
    const timer = setTimeout(() => {
      if (lines.length > 0 || customerName || customerEmail || customerPhone) {
        triggerAbandonment("cart_activity_auto_sync");
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && (lines.length > 0 || customerName || customerEmail || customerPhone)) {
        triggerAbandonment("tab_hidden_during_checkout", true);
      }
    };

    const handlePageHide = () => {
      if (lines.length > 0 || customerName || customerEmail || customerPhone) {
        triggerAbandonment("page_closed_during_checkout", true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [sessionId, customerName, customerEmail, customerPhone, monthly, daily, orderCompleted, lines]);
}
