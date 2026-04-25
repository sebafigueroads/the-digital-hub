"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor — hollow circle that expands on interactive elements
 * and uses mix-blend-mode: difference for contrast.
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const hovering = useRef(false);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    const onMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.closest("a, button, [data-cursor-hover], [role='button']") ||
        t.tagName === "A" ||
        t.tagName === "BUTTON"
      ) {
        hovering.current = true;
        el.classList.add("is-hovering");
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.closest("a, button, [data-cursor-hover], [role='button']") ||
        t.tagName === "A" ||
        t.tagName === "BUTTON"
      ) {
        hovering.current = false;
        el.classList.remove("is-hovering");
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseout", onMouseOut, { passive: true });

    let raf: number;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;
      el.style.left = `${pos.current.x}px`;
      el.style.top = `${pos.current.y}px`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" />;
}
