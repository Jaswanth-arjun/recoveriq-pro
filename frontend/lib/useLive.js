"use client";

import { useEffect, useRef, useState } from "react";
import { wsUrl } from "./api";

export default function useLive() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      try {
        const ws = new WebSocket(wsUrl());
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            const event = {
              type: data.type || "event",
              payload: data.payload ?? data.data ?? data,
              ts: data.ts || Date.now(),
            };
            setEvents((prev) => [event, ...prev].slice(0, 50));
          } catch {}
        };

        ws.onclose = () => {
          setConnected(false);
          timerRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {}
        };
      } catch {
        timerRef.current = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, []);

  return { events, connected };
}
