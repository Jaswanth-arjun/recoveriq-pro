import { API, getApiBase } from "./api";

let lastSendAt = 0;
const THROTTLE_MS = 5000;

export function sendAbandonment(payload, { unloading = false } = {}) {
  const now = Date.now();
  if (now - lastSendAt < THROTTLE_MS) return;
  lastSendAt = now;

  const body = JSON.stringify(payload);
  const base = getApiBase() || API;
  const endpoint = `${base}/api/checkouts/abandon`;

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
    if (!sendBeacon()) sendFetch();
  } else {
    sendFetch();
  }
}

