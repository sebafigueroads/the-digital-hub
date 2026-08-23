"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { store } from "@/lib/store";
import { CustomCursor } from "@/components/CustomCursor";
import { GrainOverlay } from "@/components/GrainOverlay";
import { MouseTracker } from "@/components/MouseTracker";
import TunnelScene from "./TunnelScene";
import Lightbox from "./Lightbox";
import { lightboxBus, scrollBus } from "./lightboxBus";
import { videoBus } from "./videoBus";
import { HALLS, HALL_MARKS, MORE_CASES, pieceToLightbox, tForZ } from "./halls";

/* ── Salto de scroll a un punto t (0–1) del recorrido.
      Fijamos el scrollTop y el damping de drei hace el glide cinematográfico. ── */
function jumpTo(t: number) {
  const el = scrollBus.el;
  if (!el) return;
  el.scrollTop = t * (el.scrollHeight - el.clientHeight);
}

/* ── Nav mínima sobre el canvas (reusa clases .hub-nav de globals) ── */
function V3Nav({ onCases }: { onCases?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setScrolled(store.scrollProgress > 0.02), 250);
    return () => clearInterval(id);
  }, []);
  return (
    <header className={`hub-nav ${scrolled ? "is-scrolled" : ""}`}>
      <a href="/" className="hub-nav-logo" data-cursor-hover aria-label="Inicio">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-digitals-white.png" alt="Digitals" />
      </a>
      <div className="hub-nav-links">
        <span className="hub-nav-link hide-mobile">Museo Showcase Digitals</span>
        {onCases && (
          <button type="button" className="v3-nav-cases" data-cursor-hover onClick={onCases}>
            Casos
          </button>
        )}
        <a href="/portfolio" className="hub-nav-cta" data-cursor-hover>
          Portafolio
        </a>
      </div>
    </header>
  );
}

/* ── Barra de progreso + ticks por hall (clickeables) ── */
function V3Progress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf: number;
    const loop = () => {
      if (ref.current) ref.current.style.transform = `scaleX(${store.scrollProgress})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      <div ref={ref} className="scroll-progress" aria-hidden="true" />
      <div className="v3-ticks" aria-label="Progreso por caso">
        {HALL_MARKS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="v3-tick"
            style={{ left: `${m.t * 100}%` }}
            title={m.name}
            aria-label={`Ir a ${m.name}`}
            onClick={() => jumpTo(m.t)}
          />
        ))}
      </div>
    </>
  );
}

/* ── Menú overlay "Casos" — lista las marcas y navega a su hall ── */
function CasesMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="v3-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Casos de éxito"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="v3-menu-panel">
        <div className="v3-menu-head">
          <p className="kicker">El recorrido · {HALL_MARKS.length} paradas</p>
          <button type="button" className="v3-lb-close v3-menu-close" aria-label="Cerrar menú" onClick={onClose}>
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <ul className="v3-menu-list">
          {HALL_MARKS.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                className="v3-menu-item"
                data-cursor-hover
                onClick={() => {
                  jumpTo(m.t);
                  onClose();
                }}
              >
                <span className="v3-menu-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="v3-menu-name">{m.name}</span>
                <span className="v3-menu-tag">{m.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Fallback estático para prefers-reduced-motion:
      grilla de marcas con sus piezas + lightbox funcional ── */
function V3Static() {
  return (
    <main className="v3-static">
      <V3Nav />
      <section className="v3-static-hero">
        <p className="kicker">Digitals · Casos Reales</p>
        <h1 className="display-xl">
          Museo Showcase <span className="v3-gold">Digitals</span>
        </h1>
        <p className="body-lg v3-static-sub">
          Un museo-galería del trabajo real de Digitals, sala por sala:
          cada marca con sus piezas y su placa de cifras. Toca cualquier
          pieza para verla en grande — los videos suenan.
        </p>
        <video
          className="v3-static-video"
          src="/video/hero-digitals-720.mp4"
          poster="/video/hero-poster.jpg"
          controls
          playsInline
          preload="none"
        />
      </section>

      {HALLS.map((hall) => (
        <section key={hall.id} className="v3-static-hall" id={`caso-${hall.id}`}>
          <header className="v3-static-hall-head">
            <p className="kicker">{hall.kicker}</p>
            <h2>{hall.name}</h2>
            <p className="v3-static-hall-tag">{hall.tagline}</p>
          </header>
          <div className="v3-static-pieces">
            {hall.pieces.map((p) => (
              <button
                key={p.id}
                type="button"
                className="v3-static-piece"
                onClick={() => lightboxBus.open(pieceToLightbox(hall, p))}
              >
                {p.kind === "plate" ? (
                  <span className="v3-static-plate">
                    <b>{p.title}</b>
                    <i>{p.sub}</i>
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.kind === "video" ? p.poster : p.src}
                    alt={`${hall.name} — ${p.title}`}
                    loading="lazy"
                  />
                )}
                <span className="v3-static-piece-label">
                  {p.kind === "video" ? "▶ " : ""}
                  {p.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="v3-static-hall">
        <header className="v3-static-hall-head">
          <p className="kicker">Antes del cine</p>
          <h2>Más casos</h2>
          <p className="v3-static-hall-tag">Dos casos más, en corto</p>
        </header>
        <div className="v3-static-pieces">
          {MORE_CASES.map((mc) => (
            <button
              key={mc.id}
              type="button"
              className="v3-static-piece"
              onClick={() =>
                lightboxBus.open({
                  kind: "image",
                  src: mc.src,
                  brand: mc.title,
                  title: mc.title,
                  sub: mc.sub,
                  vertical: true,
                })
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mc.src} alt={`${mc.title} — ${mc.sub}`} loading="lazy" />
              <span className="v3-static-piece-label">{mc.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="v3-static-cta">
        <h2 className="display-lg">El portafolio te espera.</h2>
        <a href="/portfolio" className="btn-solid">Ir al portafolio →</a>
        <p className="v3-footer-line">
          © {new Date().getFullYear()} Digitals · Google Premier Partner · Meta Business Partner
        </p>
      </section>
    </main>
  );
}

/* ═══════════════ EXPERIENCIA V3 ═══════════════ */
export default function V3Experience() {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMobile(window.matchMedia("(max-width: 820px)").matches);
    setMounted(true);
  }, []);

  /* hook de navegación (deep-links y QA): window.__v3.jump(t) */
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__v3 = {
      jump: jumpTo,
      marks: HALL_MARKS,
      tForZ,
      halls: HALLS,
      lightbox: lightboxBus,
      pieceToLightbox,
      video: videoBus,
    };
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  if (!mounted) {
    return (
      <div className="v3-boot" aria-hidden="true">
        <p className="v3-loader-brand">Digitals</p>
      </div>
    );
  }

  if (reduced) {
    return (
      <>
        <V3Static />
        <Lightbox />
      </>
    );
  }

  return (
    <>
      <MouseTracker />
      <TunnelScene mobile={mobile} />
      <V3Nav onCases={() => setMenuOpen(true)} />
      <V3Progress />
      <CasesMenu open={menuOpen} onClose={closeMenu} />
      <Lightbox />
      <GrainOverlay />
      <CustomCursor />
    </>
  );
}
