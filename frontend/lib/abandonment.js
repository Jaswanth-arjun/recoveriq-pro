import { API } from "./api";

// Module-level throttle: the store page mounts TWO trackers
// (useAbandonmentTracker + FinalBasket) that can fire within milliseconds of
// each other. Coalescing them here prevents duplicate abandonment records.
let lastSendAt = 0;
const THROTTLE_MS = 5000;

export function sendAbandonment(payload, { unloading = false } = {}) {
  const now = Date.now();
  if (now - lastSendAt < THROTTLE_MS) return;
  lastSendAt = now;

  const body = JSON.stringify(payload);
  const base = process.env.NEXT_PUBLIC_API_URL || API;
  const endpoint = `${base}/api/checkouts/abandon`;

  // sendBeacon cannot complete cross-origin requests that need a CORS
  // preflight (e.g. Content-Type: application/json) — the browser drops
  // the POST silently after the OPTIONS. `text/plain` IS CORS-safelisted,
  // so beacons must always use it (backend parses the raw body anyway).
  const sendBeacon = () => {
    if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
    try {
      const blob = new Blob([body], { type: "text/plain" });
      return navigator.sendBeacon(endpoint, blob);
    } catch {
      return false;
    }
  };

  const sendFetch = () => {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
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
}
