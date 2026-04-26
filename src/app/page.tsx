"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CustomCursor } from "@/components/CustomCursor";
import { GrainOverlay } from "@/components/GrainOverlay";
import { MouseTracker } from "@/components/MouseTracker";
import { store } from "@/lib/store";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    document.body.classList.add("hub-page");
    let raf: number;
    const tick = () => {
      setShowCta(store.scrollProgress >= 0.7);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      document.body.classList.remove("hub-page");
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Dynamic gradient background */}
      <div className="gradient-bg" />

      {/* Full-screen immersive 3D experience — IS the page */}
      <Scene />

      {/* Film grain on top of everything */}
      <GrainOverlay />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Mouse position → shared store for R3F */}
      <MouseTracker />

      {/* Persistent CTA — only after 70% of the experience */}
      <a
        href="/portfolio"
        data-cursor-hover
        className={`sticky-portfolio-cta ${showCta ? "is-visible" : ""}`}
        aria-label="Ir al Portafolio"
        aria-hidden={!showCta}
      >
        <span className="sticky-cta-pulse" />
        <span className="sticky-cta-text">
          <span className="sticky-cta-kicker">Casa Creativa</span>
          <span className="sticky-cta-main">Ir al Portafolio</span>
        </span>
        <span className="sticky-cta-arrow" aria-hidden="true">→</span>
      </a>
    </>
  );
}
