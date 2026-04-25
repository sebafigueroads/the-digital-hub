"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { store } from "@/lib/store";

/**
 * Initialises Lenis smooth-scroll and feeds scroll progress + mouse
 * position into the shared store so the R3F scene can read them in useFrame.
 */
export function SmoothScroller({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Scroll → store
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      store.scrollProgress = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Mouse → store (position + velocity)
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);

      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      store.mouseX = nx;
      store.mouseY = ny;
      store.mouseVelocity = Math.min(speed * 0.08, 4);

      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Decay velocity when mouse stops
    const decayInterval = setInterval(() => {
      store.mouseVelocity *= 0.92;
    }, 50);

    return () => {
      lenis.destroy();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      clearInterval(decayInterval);
    };
  }, []);

  return <>{children}</>;
}
