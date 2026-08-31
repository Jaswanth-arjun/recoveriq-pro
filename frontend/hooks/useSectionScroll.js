import { useCallback, useEffect, useRef, useState } from "react";

const LOCK_MS = 850;
const EDGE_DWELL_MS = 120;
const WHEEL_THRESHOLD = 45;

export function useSectionScroll(total) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const locked = useRef(false);
  const accum = useRef(0);
  const edgeSince = useRef(0);
  const touchStart = useRef(0);

  const goTo = useCallback(
    (next) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setIndex((current) => {
        if (clamped === current) return current;
        setDirection(clamped > current ? 1 : -1);
        locked.current = true;
        accum.current = 0;
        window.setTimeout(() => {
          locked.current = false;
          accum.current = 0;
        }, LOCK_MS);
        return clamped;
      });
    },
    [total],
  );

  useEffect(() => {
    const innerConsumes = (target, delta) => {
      const el = target?.closest?.("[data-inner-scroll]");
      if (!el) return false;
      const atTop = el.scrollTop <= 6;
      const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 6;
      const canScroll = el.scrollHeight - el.clientHeight > 8;
      if (canScroll && ((delta < 0 && !atTop) || (delta > 0 && !atBottom))) {
        edgeSince.current = 0;
        return true;
      }
      const now = performance.now();
      if (!edgeSince.current) edgeSince.current = now;
      if (now - edgeSince.current < EDGE_DWELL_MS) return true;
      return false;
    };

    const onWheel = (e) => {
      if (locked.current) return;
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      if (Math.abs(delta) < 2) return;
      if (e.target?.closest?.("[data-scroll-ignore]")) return;
      if (innerConsumes(e.target, delta)) return;

      e.preventDefault();
      accum.current += delta;
      if (Math.abs(accum.current) >= WHEEL_THRESHOLD) {
        const dir = accum.current > 0 ? 1 : -1;
        accum.current = 0;
        edgeSince.current = 0;
        setIndex((current) => {
          const next = Math.max(0, Math.min(total - 1, current + dir));
          if (next === current) return current;
          setDirection(dir);
          locked.current = true;
          window.setTimeout(() => {
            locked.current = false;
            accum.current = 0;
          }, LOCK_MS);
          return next;
        });
      }
    };

    const onKey = (e) => {
      if (locked.current) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        if (innerConsumes(e.target, 1)) return;
        e.preventDefault();
        setIndex((c) => {
          if (c >= total - 1) return c;
          setDirection(1);
          locked.current = true;
          window.setTimeout(() => {
            locked.current = false;
          }, LOCK_MS);
          return c + 1;
        });
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        if (innerConsumes(e.target, -1)) return;
        e.preventDefault();
        setIndex((c) => {
          if (c <= 0) return c;
          setDirection(-1);
          locked.current = true;
          window.setTimeout(() => {
            locked.current = false;
          }, LOCK_MS);
          return c - 1;
        });
      } else if (e.key === "Home") {
        setDirection(-1);
        setIndex(0);
      } else if (e.key === "End") {
        setDirection(1);
        setIndex(total - 1);
      }
    };

    const onTouchStart = (e) => {
      touchStart.current = e.touches[0]?.clientY ?? 0;
      edgeSince.current = 0;
    };

    const onTouchMove = (e) => {
      if (locked.current) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = touchStart.current - y;
      if (Math.abs(delta) < 45) return;
      if (innerConsumes(e.target, delta)) return;
      touchStart.current = y;
      setIndex((current) => {
        const dir = delta > 0 ? 1 : -1;
        const next = Math.max(0, Math.min(total - 1, current + dir));
        if (next === current) return current;
        setDirection(dir);
        locked.current = true;
        window.setTimeout(() => {
          locked.current = false;
          accum.current = 0;
        }, LOCK_MS);
        return next;
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [total]);

  return { index, direction, goTo };
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
