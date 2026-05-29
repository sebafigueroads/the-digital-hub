"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

/* ═══════════════════════════════════════════════════════
   PALETA DIGITALS.CL · sobre fondo negro
   cyan #12809B · gold #E5BB55 · dark #0A0A0A · paper #F4F4F5
   ═══════════════════════════════════════════════════════ */
const C = {
  bg: "#0A0A0A",
  bgSoft: "#111114",
  ink: "#F4F4F5",
  mute: "rgba(244,244,245,0.55)",
  line: "rgba(244,244,245,0.10)",
  cyan: "#12809B",
  cyanGlow: "rgba(0,212,255,0.85)",
  gold: "#E5BB55",
  goldSoft: "rgba(229,187,85,0.18)",
};

/* ═══════════════════════════════════════════════════════
   FLOATING PARTICLES (canvas-based) — HERO original conservado
   ═══════════════════════════════════════════════════════ */
function FloatingAtoms() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    interface Atom {
      x: number; y: number;
      baseR: number;
      vx: number; vy: number;
      phase: number; speed: number;
      deform: number;
      rotSpeed: number;
      color: string;
      hover: number;
    }

    const palette = [
      "rgba(18,128,155,",
      "rgba(0,212,255,",
      "rgba(229,187,85,",
      "rgba(139,92,246,",
    ];

    const atoms: Atom[] = [];
    for (let i = 0; i < 15; i++) {
      atoms.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseR: Math.random() * 70 + 50,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.3 + 0.15,
        deform: Math.random() * 0.4 + 0.2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        color: palette[Math.floor(Math.random() * palette.length)],
        hover: 0,
      });
    }

    let mx = -9999, my = -9999;
    let dragged: Atom | null = null;
    let dragDX = 0, dragDY = 0;
    const pickAtom = (cx: number, cy: number) => {
      let best: Atom | null = null; let bd = Infinity;
      for (const a of atoms) {
        const dx = a.x - cx, dy = a.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < a.baseR * 0.95 && d < bd) { bd = d; best = a; }
      }
      return best;
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dragged) { dragged.x = mx - dragDX; dragged.y = my - dragDY; dragged.vx = 0; dragged.vy = 0; }
    };
    const onDown = (e: MouseEvent) => {
      const a = pickAtom(e.clientX, e.clientY);
      if (a) { dragged = a; dragDX = e.clientX - a.x; dragDY = e.clientY - a.y; e.preventDefault(); }
    };
    const onUp = () => {
      if (dragged) {
        dragged.vx = (Math.random() - 0.5) * 2;
        dragged.vy = (Math.random() - 0.5) * 2;
        dragged = null;
      }
    };
    const onMoveCursor = (e: MouseEvent) => {
      const a = pickAtom(e.clientX, e.clientY);
      canvas.style.pointerEvents = a ? "auto" : "none";
      canvas.style.cursor = a ? (dragged ? "grabbing" : "grab") : "auto";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousemove", onMoveCursor);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    let time = 0;
    const draw = () => {
      time += 0.008;
      ctx.clearRect(0, 0, w, h);

      for (const a of atoms) {
        const dx = a.x - mx, dy = a.y - my;
        const distSq = dx * dx + dy * dy;
        const range = 260;
        const inRange = distSq < range * range;
        const dist = inRange ? Math.sqrt(distSq) : range;
        a.hover += ((inRange ? 1 - dist / range : 0) - a.hover) * 0.12;

        if (a !== dragged) {
          if (inRange && distSq > 0.01) {
            const force = (1 - dist / range) * 1.1;
            a.vx += (dx / dist) * force;
            a.vy += (dy / dist) * force;
          }
          a.vx *= 0.94; a.vy *= 0.94;
          a.x += a.vx + Math.sin(time * a.speed + a.phase) * 0.18;
          a.y += a.vy + Math.cos(time * a.speed + a.phase) * 0.14;
        }
        if (a.x < -100) a.x = w + 100;
        if (a.x > w + 100) a.x = -100;
        if (a.y < -100) a.y = h + 100;
        if (a.y > h + 100) a.y = -100;

        const t = time * a.speed + a.phase;
        const r = a.baseR * (0.8 + Math.sin(t * 2) * 0.25) * (1 + a.hover * 0.18);

        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(time * a.rotSpeed);

        const points = 6;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const wobble = 1 + Math.sin(t * 3 + angle * 2) * a.deform
                           + Math.cos(t * 2 + angle * 3) * a.deform * 0.5;
          const px = Math.cos(angle) * r * wobble;
          const py = Math.sin(angle) * r * wobble;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            const prevAngle = ((i - 1) / points) * Math.PI * 2;
            const prevWobble = 1 + Math.sin(t * 3 + prevAngle * 2) * a.deform
                                 + Math.cos(t * 2 + prevAngle * 3) * a.deform * 0.5;
            const cpx = Math.cos((angle + prevAngle) / 2) * r * 1.15 * (wobble + prevWobble) / 2;
            const cpy = Math.sin((angle + prevAngle) / 2) * r * 1.15 * (wobble + prevWobble) / 2;
            ctx.quadraticCurveTo(cpx, cpy, px, py);
          }
        }
        ctx.closePath();

        const baseAlpha = 0.45 + a.hover * 0.3;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
        grad.addColorStop(0, a.color + baseAlpha + ")");
        grad.addColorStop(0.4, a.color + (0.25 + a.hover * 0.2) + ")");
        grad.addColorStop(0.7, a.color + (0.08 + a.hover * 0.12) + ")");
        grad.addColorStop(1, a.color + "0)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = a.color + (0.22 + a.hover * 0.5) + ")";
        ctx.lineWidth = 1.5 + a.hover * 1.5;
        ctx.stroke();

        ctx.restore();
      }

      ctx.lineWidth = 0.5;
      for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
          const dx = atoms[i].x - atoms[j].x;
          const dy = atoms[i].y - atoms[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 300) {
            const opacity = (1 - dist / 300) * 0.22;
            ctx.strokeStyle = `rgba(18,128,155,${opacity})`;
            ctx.beginPath();
            ctx.moveTo(atoms[i].x, atoms[i].y);
            ctx.lineTo(atoms[j].x, atoms[j].y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", onMoveCursor);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   GRID DE PORTAFOLIO · 25 slots (24 reels + 1 cover)
   Cada slot tiene un placeholder editable de cliente/categoría
   ═══════════════════════════════════════════════════════ */
type Slot = {
  id: string;
  file: string;
  kind: "video" | "image";
  client: string;
  category: string;
  span?: "wide" | "tall";
};

/* 25 slots con placeholders editables luego (cliente + categoría) */
const SLOTS: Slot[] = [
  { id: "s01", file: "/portfolio-material/cover-01.png", kind: "image", client: "[Cliente]", category: "Cover · Showcase",          span: "wide" },
  { id: "s02", file: "/portfolio-material/reel-01.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s03", file: "/portfolio-material/reel-02.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s04", file: "/portfolio-material/reel-03.mp4",  kind: "video", client: "[Cliente]", category: "Performance · Ad" },
  { id: "s05", file: "/portfolio-material/reel-04.mp4",  kind: "video", client: "[Cliente]", category: "Brand · Spot",                span: "wide" },
  { id: "s06", file: "/portfolio-material/reel-05.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s07", file: "/portfolio-material/reel-06.mp4",  kind: "video", client: "[Cliente]", category: "Performance · Ad" },
  { id: "s08", file: "/portfolio-material/reel-07.mp4",  kind: "video", client: "[Cliente]", category: "B2B · Demo" },
  { id: "s09", file: "/portfolio-material/reel-08.mp4",  kind: "video", client: "[Cliente]", category: "AI · Creative" },
  { id: "s10", file: "/portfolio-material/reel-09.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s11", file: "/portfolio-material/reel-10.mp4",  kind: "video", client: "[Cliente]", category: "Brand · Spot",                span: "wide" },
  { id: "s12", file: "/portfolio-material/reel-11.mp4",  kind: "video", client: "[Cliente]", category: "Performance · Ad" },
  { id: "s13", file: "/portfolio-material/reel-12.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s14", file: "/portfolio-material/reel-13.mp4",  kind: "video", client: "[Cliente]", category: "B2B · Demo" },
  { id: "s15", file: "/portfolio-material/reel-14.mp4",  kind: "video", client: "[Cliente]", category: "AI · Creative" },
  { id: "s16", file: "/portfolio-material/reel-15.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s17", file: "/portfolio-material/reel-16.mp4",  kind: "video", client: "[Cliente]", category: "Brand · Spot",                span: "wide" },
  { id: "s18", file: "/portfolio-material/reel-17.mp4",  kind: "video", client: "[Cliente]", category: "Performance · Ad" },
  { id: "s19", file: "/portfolio-material/reel-18.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s20", file: "/portfolio-material/reel-19.mp4",  kind: "video", client: "[Cliente]", category: "AI · Creative" },
  { id: "s21", file: "/portfolio-material/reel-20.mp4",  kind: "video", client: "[Cliente]", category: "B2B · Demo" },
  { id: "s22", file: "/portfolio-material/reel-21.mp4",  kind: "video", client: "[Cliente]", category: "Social Media · Reel" },
  { id: "s23", file: "/portfolio-material/reel-22.mp4",  kind: "video", client: "[Cliente]", category: "Performance · Ad" },
  { id: "s24", file: "/portfolio-material/reel-23.mp4",  kind: "video", client: "[Cliente]", category: "AI · Creative" },
  { id: "s25", file: "/portfolio-material/reel-24.mp4",  kind: "video", client: "[Cliente]", category: "Brand · Spot",                span: "wide" },
];

const CATEGORIES = ["Todos", "Social Media · Reel", "Performance · Ad", "Brand · Spot", "B2B · Demo", "AI · Creative", "Cover · Showcase"];

const CLIENT_LOGOS = [
  "burger_king.png", "clinica_indisa.png", "logo-chery.png", "mundomed.png",
  "mercosur.png", "corfo.png", "biobag.png", "crossover.png",
  "multi_deporte.png", "ecospot.png", "ecoterra.png", "innovait.png",
  "coalfa.png", "db_abogados.png", "balu_store.png",
  "Logo-Amapolas.png", "Logo-Cirumed.png", "Logo-Mantahue-v2.png",
  "aeropuerto_el_loa.png", "andesconstruccion.png", "calyptra.png",
  "logo-innovamak.png", "logo-la-quinta.png", "gas_hn.png",
];

/* ═══════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════ */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
  );
}

/* ─── Card individual de slot · video o imagen, hover lift + cyan glow ─── */
function SlotCard({ slot, index, onOpen }: { slot: Slot; index: number; onOpen: (s: Slot) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  /* Pausar fuera de viewport para no quemar CPU con 24 videos en loop */
  useEffect(() => {
    if (slot.kind !== "video" || !videoRef.current) return;
    const v = videoRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) v.play().catch(() => { /* autoplay bloqueado, no es crítico */ });
          else v.pause();
        });
      },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [slot.kind]);

  const wideSpan = slot.span === "wide";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      data-cursor-hover
      onClick={() => onOpen(slot)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="slot-card"
      style={{
        position: "relative",
        gridColumn: wideSpan ? "span 2" : "auto",
        aspectRatio: wideSpan ? "32 / 9" : "16 / 9",
        borderRadius: "14px",
        overflow: "hidden",
        cursor: "pointer",
        background: C.bgSoft,
        border: `1px solid ${hover ? "rgba(18,128,155,0.55)" : C.line}`,
        boxShadow: hover
          ? `0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(18,128,155,0.35), 0 0 40px rgba(18,128,155,0.18)`
          : `0 6px 18px rgba(0,0,0,0.4)`,
        transform: hover ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s, border-color 0.4s",
      }}
    >
      {/* MEDIA */}
      {slot.kind === "video" ? (
        <video
          ref={videoRef}
          src={slot.file}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.file}
          alt={`${slot.client} · ${slot.category}`}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}

      {/* Overlay degradado · siempre visible para legibilidad */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: hover
            ? "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.78) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.65) 100%)",
          transition: "background 0.4s",
        }}
      />

      {/* Etiqueta de categoría · esquina sup izq */}
      <span
        style={{
          position: "absolute", top: "0.9rem", left: "0.9rem",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase",
          color: C.gold, fontWeight: 600,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
          padding: "0.32rem 0.6rem", borderRadius: "100px",
          border: "1px solid rgba(229,187,85,0.25)",
        }}
      >
        {slot.category}
      </span>

      {/* Slot number · esquina sup der */}
      <span
        style={{
          position: "absolute", top: "0.9rem", right: "0.9rem",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "0.95rem", letterSpacing: "0.12em",
          color: C.cyan,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
          padding: "0.2rem 0.55rem", borderRadius: "4px",
          border: "1px solid rgba(18,128,155,0.4)",
        }}
      >
        {String(index + 1).padStart(2, "0")} / 25
      </span>

      {/* Título inferior · cliente + categoría */}
      <div
        style={{
          position: "absolute", left: "1.1rem", right: "1.1rem", bottom: "1rem",
          color: C.ink,
        }}
      >
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(1.4rem, 2vw, 2rem)", lineHeight: 0.95,
          letterSpacing: "0.01em", marginBottom: "0.25rem",
          textShadow: "0 2px 14px rgba(0,0,0,0.55)",
        }}>
          {slot.client}
        </div>
        <div style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "0.72rem", color: "rgba(244,244,245,0.75)",
          letterSpacing: "0.04em",
        }}>
          {slot.category}
        </div>
      </div>

      {/* CTA "Ver pieza" · solo en hover */}
      <div
        style={{
          position: "absolute", bottom: "1rem", right: "1.1rem",
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 0.35s, transform 0.35s",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase",
          color: C.cyan, fontWeight: 700,
        }}
      >
        Ver pieza →
      </div>
    </motion.div>
  );
}

/* ─── Modal lightbox · reproduce video grande / muestra imagen grande ─── */
function SlotModal({ slot, onClose }: { slot: Slot | null; onClose: () => void }) {
  useEffect(() => {
    if (!slot) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [slot, onClose]);
  if (!slot) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "clamp(1rem,3vw,3rem)",
      }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(1200px, 100%)",
          maxHeight: "90vh",
          background: C.bg,
          borderRadius: "18px",
          overflow: "hidden",
          border: `1px solid ${C.line}`,
          boxShadow: "0 60px 140px rgba(0,0,0,0.7), 0 0 0 1px rgba(18,128,155,0.18), 0 0 80px rgba(18,128,155,0.10)",
        }}
      >
        <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
          {slot.kind === "video" ? (
            <video
              src={slot.file}
              controls
              autoPlay
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slot.file} alt={slot.client} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          )}
        </div>
        <div style={{ padding: "1.6rem 1.8rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, marginBottom: "0.5rem" }}>
              {slot.category}
            </p>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "0.01em", lineHeight: 0.95, color: C.ink, margin: 0 }}>
              {slot.client}
            </h2>
          </div>
          <button
            data-cursor-hover
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              padding: "0.7rem 1.4rem", borderRadius: "100px",
              border: `1px solid ${C.cyan}`, background: "transparent",
              color: C.ink, fontFamily: "Inter, sans-serif",
              fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cerrar ×
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const [filter, setFilter] = useState("Todos");
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);

  const filtered = filter === "Todos" ? SLOTS : SLOTS.filter((s) => s.category === filter);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div style={{ background: C.bg, color: C.ink, position: "relative", minHeight: "100vh" }}>
      <FloatingAtoms />

      {/* ── NAV ──────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "1.1rem clamp(1.5rem, 4vw, 3rem)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(18px)", background: "rgba(10,10,10,0.72)",
        borderBottom: `1px solid ${C.line}`,
      }}>
        <a href="/" data-cursor-hover style={{ display: "flex", alignItems: "center", gap: "10px", color: C.ink, textDecoration: "none" }} aria-label="Inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-digitals-white.png" alt="Digitals" style={{ height: "26px", width: "auto" }} />
        </a>
        <div style={{ display: "flex", gap: "1.6rem", alignItems: "center" }}>
          <a href="mailto:hola@digitals.cl" data-cursor-hover style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.mute, textDecoration: "none", letterSpacing: "0.04em" }}>
            hola@digitals.cl
          </a>
          <a href="/" data-cursor-hover style={{
            fontFamily: "Inter, sans-serif", fontWeight: 600,
            fontSize: "0.7rem", padding: "0.55rem 1.2rem",
            background: "transparent", border: `1px solid ${C.cyan}`,
            borderRadius: "100px", color: C.ink, textDecoration: "none",
            letterSpacing: "0.18em", textTransform: "uppercase",
          }}>Hub 3D</a>
        </div>
      </nav>

      {/* ── HERO ─────── (mantenido por pedido del cliente, pasado a negro) ── */}
      <motion.section
        ref={heroRef}
        style={{
          opacity: heroOpacity, y: heroY,
          minHeight: "100vh",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "8rem clamp(1.5rem, 4vw, 3rem) 4rem",
          maxWidth: "90rem", margin: "0 auto",
          position: "relative", zIndex: 1,
        }}
      >
        <motion.p
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.72rem", letterSpacing: "0.32em", textTransform: "uppercase",
            color: C.cyan, marginBottom: "2rem", fontWeight: 600,
          }}
        >
          01 · Portafolio
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }}
          style={{
            fontFamily: "'Bebas Neue', 'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(4rem, 14vw, 12rem)",
            lineHeight: 0.85,
            letterSpacing: "0.005em",
            color: C.ink,
            margin: 0,
          }}
        >
          Digitals<br />
          <span style={{ color: C.gold }}>Showcase</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{
            marginTop: "2.5rem",
            fontFamily: "Inter, sans-serif",
            fontSize: "1.05rem", color: C.mute, maxWidth: "34rem", lineHeight: 1.7,
          }}
        >
          25 piezas · video, branding, performance y AI creative.
          <br />
          Scrollea para explorar ↓
        </motion.p>
      </motion.section>

      {/* ── FILTERS (sticky) ─────────────────────────── */}
      <section
        style={{
          position: "sticky", top: "58px", zIndex: 50,
          padding: "0.85rem clamp(1.5rem, 4vw, 3rem)",
          background: "rgba(10,10,10,0.88)", backdropFilter: "blur(16px)",
          borderTop: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
          {CATEGORIES.map((f) => (
            <button
              key={f}
              data-cursor-hover
              onClick={() => setFilter(f)}
              style={{
                padding: "0.5rem 1.2rem",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.7rem",
                fontWeight: filter === f ? 700 : 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                borderRadius: "100px",
                border: filter === f ? `1px solid ${C.cyan}` : `1px solid ${C.line}`,
                background: filter === f ? C.cyan : "transparent",
                color: filter === f ? "#fff" : C.mute,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* ── PORTFOLIO GRID · 25 slots ─────────────────── */}
      <section
        style={{
          position: "relative", zIndex: 1,
          padding: "4rem clamp(1.5rem, 4vw, 3rem) 5rem",
          maxWidth: "90rem", margin: "0 auto",
        }}
      >
        <div className="portfolio-grid">
          {filtered.map((slot, i) => (
            <SlotCard key={slot.id} slot={slot} index={i} onOpen={setOpenSlot} />
          ))}
        </div>
      </section>

      {/* ── MODAL ──────────────────────────────────────── */}
      <SlotModal slot={openSlot} onClose={() => setOpenSlot(null)} />

      {/* ── CLIENT LOGOS (marquee) ────────────────────── */}
      <section
        style={{
          padding: "4.5rem 0",
          borderTop: `1px solid ${C.line}`,
          overflow: "hidden", position: "relative", zIndex: 1,
          background: C.bg,
        }}
      >
        <FadeUp>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.7rem", letterSpacing: "0.28em", textTransform: "uppercase",
            color: C.mute, marginBottom: "2rem", textAlign: "center", fontWeight: 600,
          }}>
            +60 marcas confían en nosotros
          </p>
        </FadeUp>
        <div style={{ display: "flex", animation: "marquee 35s linear infinite", width: "max-content" }}>
          {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${logo}-${i}`}
              src={`/brands/${logo}`}
              alt=""
              loading="lazy"
              style={{
                height: "32px", objectFit: "contain",
                marginRight: "3.5rem",
                opacity: 0.42,
                filter: "grayscale(1) brightness(2.2)",
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ))}
        </div>
      </section>

      {/* ── CAPABILITIES ──────────────────────────────── */}
      <section style={{
        padding: "5rem clamp(1.5rem, 4vw, 3rem)",
        background: C.bgSoft, color: C.ink,
        position: "relative", zIndex: 1,
        borderTop: `1px solid ${C.line}`,
      }}>
        <div style={{ maxWidth: "90rem", margin: "0 auto", display: "flex", gap: "3rem", flexWrap: "wrap" }}>
          <FadeUp>
            <div style={{ flex: "1 1 250px" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", letterSpacing: "0.28em", textTransform: "uppercase", color: C.cyan, marginBottom: "1rem", fontWeight: 600 }}>
                02 · Capabilities
              </p>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 0.95, letterSpacing: "0.005em", color: C.ink, margin: 0 }}>
                Lo que hacemos
              </h2>
            </div>
          </FadeUp>
          <div style={{ flex: "2 1 400px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }}>
            {[
              { title: "Social Media", color: C.cyan, items: ["Estrategia de contenido", "Community management", "Crecimiento orgánico"] },
              { title: "Paid Media", color: C.gold, items: ["Meta, Google, LinkedIn, TikTok", "Tracking CAPI + GTM", "Dashboards C-Level"] },
              { title: "B2B Executive", color: "#22c55e", items: ["Autoridad LinkedIn", "Prospección automatizada", "Reuniones C-Level"] },
              { title: "AI & Automatización", color: "#8b5cf6", items: ["Agentes conversacionales", "RAG pipelines", "Voice AI"] },
            ].map((c, i) => (
              <FadeUp key={c.title} delay={i * 0.08}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.color, boxShadow: `0 0 12px ${c.color}88` }} />
                    <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, fontSize: "1.4rem", letterSpacing: "0.04em", margin: 0 }}>{c.title}</h3>
                  </div>
                  {c.items.map((item) => (
                    <p key={item} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: C.mute, padding: "0.25rem 0", margin: 0 }}>{item}</p>
                  ))}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section style={{
        padding: "6rem clamp(1.5rem, 4vw, 3rem)",
        textAlign: "center", background: C.bg,
        position: "relative", zIndex: 1,
        borderTop: `1px solid ${C.line}`,
      }}>
        <FadeUp>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.7rem", letterSpacing: "0.28em", textTransform: "uppercase",
            color: C.cyan, marginBottom: "1.5rem", fontWeight: 600,
          }}>03 · Contacto</p>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
            fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "0.01em", color: C.ink, margin: 0,
          }}>
            Creemos algo juntos
          </h2>
          <p style={{ marginTop: "1.2rem", color: C.mute, fontSize: "1.05rem", fontFamily: "Inter, sans-serif" }}>
            Cada gran idea empieza con una conversación.
          </p>
          <a href="mailto:hola@digitals.cl" data-cursor-hover style={{
            display: "inline-block", marginTop: "2.2rem",
            padding: "1.05rem 3rem",
            background: "transparent",
            border: `1px solid ${C.gold}`,
            borderRadius: "100px",
            color: C.gold, textDecoration: "none",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem",
            letterSpacing: "0.22em", textTransform: "uppercase",
            transition: "all 0.4s",
          }}>hola@digitals.cl</a>
        </FadeUp>
        <p style={{ marginTop: "3rem", fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: "rgba(244,244,245,0.28)", letterSpacing: "0.08em" }}>
          © {new Date().getFullYear()} Digitals · Google Premier Partner · Meta Business Partner
        </p>
      </section>

      {/* ── BACK TO MAIN SITE ────────────────────────── */}
      <section style={{
        padding: "5rem clamp(1.5rem, 4vw, 3rem)",
        textAlign: "center", background: "#050505", color: C.ink,
        position: "relative", zIndex: 1, borderTop: `1px solid ${C.line}`,
      }}>
        <FadeUp>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(244,244,245,0.4)", marginBottom: "1rem", fontWeight: 600 }}>
            — Volver al ecosistema —
          </p>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "0.01em", lineHeight: 1, marginBottom: "1.4rem", color: C.ink }}>
            Explora el sitio principal de Digitals
          </h3>
          <p style={{ fontFamily: "Inter, sans-serif", color: "rgba(244,244,245,0.55)", fontSize: "0.95rem", maxWidth: "32rem", margin: "0 auto 2.4rem", lineHeight: 1.6 }}>
            Servicios, equipo, AI Labs, blog editorial y todo el ecosistema Grupo Digitals.
          </p>
          <a href="https://digitals.cl" data-cursor-hover style={{
            display: "inline-flex", alignItems: "center", gap: "0.7rem",
            padding: "1.05rem 2.6rem",
            background: "transparent", border: `1px solid ${C.cyan}`, borderRadius: "100px",
            color: C.ink, textDecoration: "none",
            fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem",
            letterSpacing: "0.22em", textTransform: "uppercase",
            transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}>
            ← Ir a digitals.cl
          </a>
        </FadeUp>
      </section>

      {/* ── Google Fonts + Grid + Custom cursor + Marquee ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');

        * { cursor: none !important; }
        ::selection { background: rgba(18,128,155,0.32); color: #fff; }
        div::-webkit-scrollbar { display: none; }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* PORTFOLIO GRID · responsive */
        .portfolio-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1100px) {
          .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .portfolio-grid { grid-template-columns: 1fr; gap: 0.85rem; }
          .slot-card { grid-column: auto !important; aspect-ratio: 16 / 9 !important; }
        }

        /* Reduce motion · respetar accesibilidad */
        @media (prefers-reduced-motion: reduce) {
          .slot-card { transform: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
