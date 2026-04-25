"use client";

import { useEffect, useRef } from "react";
import { store } from "@/lib/store";

/**
 * Tracks mouse position + velocity and writes to the shared store
 * so the R3F render loop can read them every frame.
 */
export function MouseTracker() {
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      store.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      store.mouseY = -((e.clientY / window.innerHeight) * 2 - 1);

      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      store.mouseVelocity = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, 5);
      last.current = { x: e.clientX, y: e.clientY };
    };

    const decay = setInterval(() => {
      store.mouseVelocity *= 0.9;
    }, 40);

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearInterval(decay);
    };
  }, []);

  return null;
}
