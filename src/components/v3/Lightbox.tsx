"use client";

/* ═══════════════════════════════════════════════════════════════
   V3 · LIGHTBOX — la pieza en grande, encima del túnel.
   Fondo negro 92%, video CON SONIDO y controles nativos, botón
   cerrar elegante + ESC + click en el fondo. Al abrir: se bloquea
   el scroll del túnel y se pausa el video 3D del cine; al cerrar
   todo vuelve exactamente como estaba.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { lightboxBus, scrollBus, type LightboxItem } from "./lightboxBus";
import { videoBus } from "./videoBus";

export default function Lightbox() {
  const [item, setItem] = useState<LightboxItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => lightboxBus.subscribe(setItem), []);

  /* bloqueo de scroll + pausa del cine + ESC mientras está abierto */
  useEffect(() => {
    if (!item) return;
    const scrollEl = scrollBus.el;
    const prevScroll = scrollEl?.style.overflow ?? "";
    if (scrollEl) scrollEl.style.overflow = "hidden";
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const cinemaWasPlaying = !!videoBus.el && !videoBus.el.paused;
    videoBus.el?.pause();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") lightboxBus.close();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      if (scrollEl) scrollEl.style.overflow = prevScroll;
      document.body.style.overflow = prevBody;
      if (cinemaWasPlaying) videoBus.el?.play().catch(() => {});
    };
  }, [item]);

  if (!item) return null;

  return (
    <div
      className="v3-lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.brand} — ${item.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) lightboxBus.close();
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        ref={closeRef}
        type="button"
        className="v3-lb-close"
        data-cursor-hover
        aria-label="Cerrar"
        onClick={() => lightboxBus.close()}
      >
        <span aria-hidden="true">✕</span>
      </button>

      <figure className={`v3-lb-body ${item.vertical ? "is-vertical" : ""}`}>
        {item.kind === "video" && (
          <video
            className="v3-lb-media"
            src={item.src}
            poster={item.poster}
            controls
            autoPlay
            playsInline
            preload="auto"
          />
        )}
        {item.kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="v3-lb-media" src={item.src} alt={`${item.brand} — ${item.title}`} />
        )}
        {item.kind === "plate" && (
          <div className="v3-lb-plate">
            <p className="kicker">{item.brand}</p>
            {item.stats ? (
              <>
                <p className="v3-lb-plate-title">{item.stats[0].v}</p>
                <p className="v3-lb-plate-herolabel">{item.stats[0].l}</p>
                {item.stats.slice(1).map((s) => (
                  <p key={s.v + s.l} className="v3-lb-plate-row">
                    <b>{s.v}</b>
                    <span>{s.l}</span>
                  </p>
                ))}
                {item.chip && <span className="v3-lb-plate-chip">{item.chip}</span>}
              </>
            ) : (
              <>
                <p className="v3-lb-plate-title">{item.title}</p>
                {item.sub && <p className="v3-lb-plate-sub">{item.sub}</p>}
              </>
            )}
          </div>
        )}
        {item.kind !== "plate" && (
          <figcaption className="v3-lb-caption">
            <p className="v3-lb-brand">{item.brand}</p>
            <p className="v3-lb-title">{item.title}</p>
            {item.sub && <p className="v3-lb-sub">{item.sub}</p>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
