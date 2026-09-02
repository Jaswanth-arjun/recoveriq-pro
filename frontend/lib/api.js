export const getApiBase = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const proto = window.location.protocol;
    if (host.includes("ngrok") || (proto === "https:" && !host.includes("localhost"))) {
      return `${proto}//${window.location.host}`;
    }
    return `http://${host}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export const API = getApiBase();

export async function api(path, options = {}) {
  const baseUrl = getApiBase();
  const res = await fetch(`${baseUrl}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {}
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json();
}

export function wsUrl() {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    if (host.includes("ngrok")) {
      return `${proto}//${window.location.host}/api/ws`;
    }
    return `${proto}//${host}:8000/api/ws`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/ws";
}

export function inr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}
