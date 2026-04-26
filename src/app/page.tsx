"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { CustomCursor } from "@/components/CustomCursor";
import { GrainOverlay } from "@/components/GrainOverlay";
import { MouseTracker } from "@/components/MouseTracker";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  useEffect(() => {
    document.body.classList.add("hub-page");
    return () => { document.body.classList.remove("hub-page"); };
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

      {/* Persistent CTA — always visible, always at the end of any flow */}
      <a
        href="/portfolio"
        data-cursor-hover
        className="sticky-portfolio-cta"
        aria-label="Ir al Portafolio"
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
