import { useEffect } from "react";
import { useBasket, useBasketTotals } from "../store/basket";
import { sendAbandonment } from "../lib/abandonment";

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
    if (lines.length === 0 || cartVal <= 0) return;

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
      sendAbandonment(
        {
          session_id: sessionId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          cart_items: getItemsDetail(),
          cart_value: cartVal > 0 ? cartVal : 0,
          stage: "checkout_basket",
          reason: reason,
        },
        { unloading },
      );
    };

    // Auto-sync 800ms after adding items so risk is persisted even before tab switch
    const timer = setTimeout(() => {
      if (lines.length > 0) {
        triggerAbandonment("cart_activity_auto_sync");
      }
    }, 800);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && lines.length > 0) {
        triggerAbandonment("tab_hidden_during_checkout", true);
      }
    };

    const handlePageHide = () => {
      if (lines.length > 0) {
        triggerAbandonment("page_closed_during_checkout", true);
      }
    };

    const handleBlur = () => {
      if (lines.length > 0) {
        triggerAbandonment("window_blur_during_checkout", true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
    window.addEventListener("blur", handleBlur);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      window.removeEventListener("blur", handleBlur);
      if (lines.length > 0 && !orderCompleted) {
        triggerAbandonment("navigated_away_from_checkout", true);
      }
    };
  }, [sessionId, customerName, customerEmail, customerPhone, monthly, daily, orderCompleted, lines]);
}

