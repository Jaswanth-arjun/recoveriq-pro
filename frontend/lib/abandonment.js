import { getApiBase } from "./api";

let lastSendAt = 0;
const THROTTLE_MS = 2000;

export function sendAbandonment(payload, { unloading = false } = {}) {
  const now = Date.now();
  if (!unloading && now - lastSendAt < THROTTLE_MS) return;
  lastSendAt = now;

  const body = JSON.stringify(payload);
  const base = getApiBase();
  const endpoint = `${base}/api/checkouts/abandon`;

  // Single send per trigger (double-sending duplicated backend pipeline runs).
  if (unloading && typeof navigator !== "undefined" && navigator.sendBeacon) {
    // Tab hidden/closed: sendBeacon fires reliably after the page freezes.
    try {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }));
    } catch {
      try {
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain" }, body, keepalive: true }).catch(() => {});
      } catch {}
    }
  } else {
    try {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }
}

