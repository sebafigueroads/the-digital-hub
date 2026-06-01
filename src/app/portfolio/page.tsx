"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { CustomCursor } from "@/components/CustomCursor";

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
  liveUrl?: string;
};

/* ═══════════════════════════════════════════════════════
   CASOS DE ÉXITO · números reales (top 7 clientes)
   ═══════════════════════════════════════════════════════ */
type CaseStudy = {
  id: string;
  client: string;
  title: string;
  cat: string;
  kpi: string;
  kpiLabel: string;
  desc: string;
  challenge?: string;
  img: string;
  colors: [string, string];
  metrics?: { num: string; label: string }[];
  quote?: string;
  quoteAuthor?: string;
  liveUrl?: string;
};

const CASES: CaseStudy[] = [
  { id: "sacyr", client: "Sacyr", title: "Monitoreo 24/7 infraestructura crítica", cat: "Reputation Management", kpi: "10K+", kpiLabel: "incidencias/mes", desc: "Sistema de Social Listening 24/7 sobre 7+ concesiones (autopistas + hospitales) transformando datos en atención al cliente inmediata.", challenge: "Gestionar comunicación crítica y reputación en tiempo real con alta exposición pública.", img: "/exitos/sacyr.png", colors: ["#ff8800", "#ffa040"], metrics: [{ num: "7+", label: "concesiones" }, { num: "100%", label: "uptime" }, { num: "4+ años", label: "partnership" }], quote: "El aporte de Digitals ha marcado la diferencia en posicionamiento y creatividad. Destacamos su flexibilidad, adaptación y la calidad de su trabajo.", quoteAuthor: "Natalia Marambio · Sacyr" },
  { id: "ajinomoto", client: "Ajinomoto", title: "De marca desconocida a viral en Chile", cat: "Social Media · Brand", kpi: "+320%", kpiLabel: "engagement", desc: "Estrategia de adaptación gráfica + acompañamiento en terreno. Campañas orgánicas de alto impacto para penetrar el retail masivo chileno.", challenge: "Adaptar una marca líder global al mercado chileno y romper la barrera del retail masivo.", img: "/exitos/ajinomoto.jpeg", colors: ["#ff4444", "#ff6b35"], metrics: [{ num: "3.8M", label: "alcance" }, { num: "Tottus", label: "retail key" }, { num: "Umami", label: "categoría líder" }] },
  { id: "mundomed", client: "Mundomed", title: "Importación médica con +30% anual sostenido", cat: "Performance · B2B Médico", kpi: "+30%", kpiLabel: "crecimiento anual", desc: "Embudos full-funnel data-driven, marketing de contenidos B2B médico, paid media segmentado por especialidad y automatización IA.", challenge: "Escalar ventas y leads ultra-calificados año tras año en importación de medicamentos.", img: "/exitos/mundomed.png", colors: ["#0891b2", "#06b6d4"], metrics: [{ num: "5+", label: "años" }, { num: "B2B", label: "leads ultra-cal." }, { num: "30%", label: "anual sostenido" }], quote: "Su atención personalizada ha sido clave; siempre están pendientes y dispuestos a atender cada una de nuestras necesidades.", quoteAuthor: "Jens Lehman · Mundomed" },
  { id: "hapee", client: "Hapee", title: "CRM con agentes IA que cierran ventas", cat: "AI & Tech · SaaS", kpi: "+68%", kpiLabel: "LTV", desc: "Plataforma CRM con agentes IA, embudos automatizados y voice AI como columna vertebral del ecosistema Grupo Digitals.", challenge: "Crear una plataforma SaaS que centralice operación comercial con IA para Chile y LATAM.", img: "/exitos/hapee.png", colors: ["#8b5cf6", "#a78bfa"], metrics: [{ num: "+35%", label: "conversión" }, { num: "100+", label: "clientes activos" }, { num: "LATAM", label: "expansión" }] },
  { id: "develon", client: "Develon", title: "Dominio digital en maquinaria pesada", cat: "Performance · IMAX", kpi: "+40%", kpiLabel: "crecimiento", desc: "Estrategia IMAX vinculando búsquedas semánticas con activos visuales de alta conversión. Lead Quality Score en mejora continua.", challenge: "Liderar la transición de marca Hyundai → Develon manteniendo autoridad en minería.", img: "/exitos/develon.jpeg", colors: ["#f5c518", "#e8a800"], metrics: [{ num: "960K", label: "impresiones/mes" }, { num: "+25%", label: "lead quality" }, { num: "2 años", label: "crecimiento sostenido" }] },
  { id: "fidelogist", client: "Fidelogist", title: "Reuniones C-Level con gigantes LATAM", cat: "B2B Executive · LinkedIn", kpi: "9+", kpiLabel: "reuniones C-Level", desc: "Programa Digitals Executive para autoridad LinkedIn + prospección automatizada que abrió la puerta a los compradores más altos del retail latino.", challenge: "Romper la barrera para sentarse con C-Level de las grandes corporaciones LATAM.", img: "/exitos/fidelogist.jpeg", colors: ["#22c55e", "#10b981"], metrics: [{ num: "PepsiCo", label: "C-Level" }, { num: "Carozzi", label: "C-Level" }, { num: "Copec", label: "C-Level" }] },
  { id: "simplus", client: "Simplus", title: "Funnel industrial automatizado en 18+ ciudades", cat: "B2B · Automatización", kpi: "18+", kpiLabel: "ciudades cubiertas", desc: "Automatización B2B de embudos + nurturing por especialidad industrial. ROI medible en ventas desde el primer trimestre.", challenge: "Escalar ventas industriales con ROI claro y nurturing por vertical.", img: "/exitos/simplus.jpeg", colors: ["#3b82f6", "#60a5fa"], metrics: [{ num: "ROI+", label: "medible" }, { num: "18+", label: "ciudades CL" }, { num: "Industrial", label: "vertical foco" }] },
];

/* 31 slots reales con cliente + categoría + estilo · spans corregidos por aspect ratio real
   wide = 16:9 horizontal · 2 cols  ·  tall = 9:16 vertical · 1 col · 2 rows  ·  (sin span) = 16:9 1 col */
const SLOTS: Slot[] = [
  { id: "web-heliforklift",     file: "/portfolio-material/web-heliforklift.jpg",                    kind: "image", client: "Heli Forklift Chile", category: "Diseño Web · Live",  span: "wide", liveUrl: "https://heliforklift.cl/" },
  { id: "web-iphoneup",         file: "/portfolio-material/web-iphoneup.jpg",                        kind: "image", client: "iPhone Up",           category: "Diseño Web · Live",  span: "wide", liveUrl: "https://iphoneup.cl/" },
  { id: "web-donlocker",        file: "/portfolio-material/web-donlocker.png",                       kind: "image", client: "Don Locker",          category: "Diseño Web · Live",  span: "wide", liveUrl: "https://donlocker.cl/" },
  { id: "web-grupomr",          file: "/portfolio-material/web-grupomr.png",                         kind: "image", client: "MR Group",            category: "Diseño Web · Live",  span: "wide", liveUrl: "https://grupomr.cl/" },
  { id: "web-47seguridad",      file: "/portfolio-material/web-47seguridad.png",                     kind: "image", client: "47 Seguridad",        category: "Diseño Web · Live",  span: "wide", liveUrl: "https://47seguridad.cl/" },
  { id: "web-develon",          file: "/portfolio-material/web-develon.png",                         kind: "image", client: "Develon",             category: "Diseño Web · Live",  span: "wide", liveUrl: "https://develon-ce.cl/" },
  { id: "la-oferta-hero",       file: "/portfolio-material/la-oferta-hero.mp4",                     kind: "video", client: "La Oferta",       category: "Brand · Hero",         span: "wide" },
  { id: "la-oferta-street",     file: "/portfolio-material/la-oferta-street.mp4",                   kind: "video", client: "La Oferta",       category: "Brand · Street" },
  { id: "iphone-up-hero",       file: "/portfolio-material/iphone-up-hero.mp4",                     kind: "video", client: "iPhone Up",       category: "Brand · Hero",         span: "wide" },
  { id: "la-estampa-hero",      file: "/portfolio-material/la-estampa-hero.mp4",                    kind: "video", client: "La Estampa",      category: "Brand · Hero",         span: "wide" },
  { id: "nova-promo",           file: "/portfolio-material/nova-promo.mp4",                         kind: "video", client: "Nova Promo",      category: "Brand · Spot" },
  { id: "telectronic-corporate",file: "/portfolio-material/telectronic-corporate.mp4",              kind: "video", client: "Telectronic",     category: "B2B · Corporate",      span: "tall" },
  { id: "don-locker-wow",       file: "/portfolio-material/don-locker-wow-effect.mp4",              kind: "video", client: "Don Locker",      category: "Brand · Spot" },
  { id: "hotel-lodge",          file: "/portfolio-material/hotel-lodge.mp4",                        kind: "video", client: "Hotel Lodge",     category: "Brand · Spot" },
  { id: "harney-tea",           file: "/portfolio-material/harney-sons-tea.mp4",                    kind: "video", client: "Harney & Sons",   category: "Brand · Spot" },

  { id: "big-boba",             file: "/portfolio-material/big-boba.mp4",                           kind: "video", client: "Big Boba",        category: "Social Media · Reel",  span: "tall" },
  { id: "don-locker-ig",        file: "/portfolio-material/don-locker-instagram.mp4",               kind: "video", client: "Don Locker",      category: "Social Media · Reel",  span: "tall" },
  { id: "iphone-up-ig",         file: "/portfolio-material/iphone-up-instagram.mp4",                kind: "video", client: "iPhone Up",       category: "Social Media · Reel",  span: "tall" },
  { id: "iphone-up-expect",     file: "/portfolio-material/iphone-up-expectativa.mp4",              kind: "video", client: "iPhone Up",       category: "Brand · Campaña",      span: "tall" },
  { id: "otra-vista",           file: "/portfolio-material/otra-vista.mp4",                         kind: "video", client: "Otra Vista",     category: "Brand · Spot" },
  { id: "otra-vista-chile",     file: "/portfolio-material/otra-vista-chile.mp4",                   kind: "video", client: "Otra Vista",     category: "Brand · Spot",         span: "tall" },
  { id: "otra-vista-terraza",   file: "/portfolio-material/otra-vista-terraza.mp4",                 kind: "video", client: "Otra Vista",     category: "Brand · Spot",         span: "tall" },
  { id: "nova-group-ig",        file: "/portfolio-material/nova-group-instagram.mp4",               kind: "video", client: "Nova Group",      category: "Social Media · Reel",  span: "tall" },
  { id: "nova-group-li",        file: "/portfolio-material/nova-group-linkedin-aesthetic.mp4",      kind: "video", client: "Nova Group",      category: "B2B · LinkedIn",       span: "tall" },

  { id: "clinica-glowing",      file: "/portfolio-material/clinica-glowing-effecting.mp4",          kind: "video", client: "Clínica Glowing", category: "After Effects · PRO Production", span: "tall" },
  { id: "heli-aesthetic",       file: "/portfolio-material/heli-chile-aesthetic.mp4",               kind: "video", client: "Heli Chile",      category: "After Effects · PRO Production", span: "tall" },
  { id: "heli-chile",           file: "/portfolio-material/heli-chile.mp4",                         kind: "video", client: "Heli Chile",      category: "B2B · Corporate",       span: "tall" },
  { id: "otra-vista-4d",        file: "/portfolio-material/otra-vista-effecting-4d.mp4",            kind: "video", client: "Otra Vista",     category: "After Effects · PRO Production" },
  { id: "otra-vista-effects",   file: "/portfolio-material/otra-vista-effects.mp4",                 kind: "video", client: "Otra Vista",     category: "After Effects · PRO Production", span: "tall" },
  { id: "la-estampa-effecting", file: "/portfolio-material/la-estampa-instagram-effecting.mp4",     kind: "video", client: "La Estampa",      category: "After Effects · PRO Production", span: "tall" },
  { id: "telectronic-effect",   file: "/portfolio-material/telectronic-effecting-executive.mp4",    kind: "video", client: "Telectronic",     category: "After Effects · PRO Production", span: "tall" },

  { id: "develon-ads",          file: "/portfolio-material/develon-ads.mp4",                        kind: "video", client: "Develon",         category: "Performance · Ad",     span: "tall" },
  { id: "develon-ig",           file: "/portfolio-material/develon-instagram.mp4",                  kind: "video", client: "Develon",         category: "Social Media · Reel",  span: "tall" },
  { id: "develon-ig-2",         file: "/portfolio-material/develon-instagram-2.mp4",                kind: "video", client: "Develon",         category: "Social Media · Reel",  span: "tall" },

  { id: "simplus-turbus",       file: "/portfolio-material/simplus-turbus.mp4",                     kind: "video", client: "Simplus · Turbus",category: "B2B · Corporate",      span: "tall" },
  { id: "simplus-turbus-2",     file: "/portfolio-material/simplus-turbus-2.mp4",                   kind: "video", client: "Simplus · Turbus",category: "B2B · Corporate" },
];

const CATEGORIES = ["Todos", "Diseño Web · Live", "Brand · Hero", "Brand · Spot", "Brand · Street", "Brand · Campaña", "Social Media · Reel", "After Effects · PRO Production", "Performance · Ad", "B2B · Corporate", "B2B · LinkedIn"];

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
  const tallSpan = slot.span === "tall";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      data-cursor-hover
      onClick={() => {
        if (slot.liveUrl) {
          window.open(slot.liveUrl, "_blank", "noopener,noreferrer");
        } else {
          onOpen(slot);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`slot-card${tallSpan ? " slot-tall" : ""}${wideSpan ? " slot-wide" : ""}`}
      style={{
        position: "relative",
        gridColumn: wideSpan ? "span 2" : "auto",
        gridRow: tallSpan ? "span 2" : "auto",
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
          color: slot.liveUrl ? C.gold : C.cyan, fontWeight: 700,
        }}
      >
        {slot.liveUrl ? "Ver web ↗" : "Ver pieza →"}
      </div>

      {/* Badge "LIVE" para slots con liveUrl */}
      {slot.liveUrl && (
        <span style={{
          position: "absolute", top: "0.9rem", left: "calc(0.9rem + 130px)",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.52rem", letterSpacing: "0.24em", textTransform: "uppercase",
          color: "#0A0A0A", fontWeight: 800,
          background: C.gold,
          padding: "0.3rem 0.6rem", borderRadius: "3px",
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
        }}>
          <span style={{ width: "5px", height: "5px", background: "#0A0A0A", borderRadius: "50%", display: "inline-block" }} />
          LIVE
        </span>
      )}
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
      {/* Portal entry overlay · fades from cyan-white to transparent as you "land" in the room */}
      <div className="portfolio-entry-flash" aria-hidden="true" />
      <CustomCursor />
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
          <img src="/logo-digitals-white.png" alt="Digitals" style={{ height: "44px", width: "auto", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }} />
        </a>
        <div style={{ display: "flex", gap: "1.6rem", alignItems: "center" }}>
          <a href="mailto:contacto@digitals.cl" data-cursor-hover style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.mute, textDecoration: "none", letterSpacing: "0.04em" }}>
            contacto@digitals.cl
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
          Portafolio
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
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8 }}
          style={{
            marginTop: "2.6rem",
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(1.05rem, 1.35vw, 1.2rem)",
            color: C.ink,
            maxWidth: "42rem", lineHeight: 1.55, fontWeight: 500,
          }}
        >
          No estás viendo piezas sueltas. Cada video, cada landing, cada campaña que aparece acá <span style={{ color: C.gold, fontWeight: 700 }}>es la huella visible de una estrategia diseñada por nuestro equipo creativo de alto nivel</span> — directores de arte, copywriters, performance leads y estrategas que llevan años escalando marcas en Chile y LATAM.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.8 }}
          style={{
            marginTop: "1.4rem",
            fontFamily: "Inter, sans-serif",
            fontSize: "1rem", color: C.mute,
            maxWidth: "40rem", lineHeight: 1.7,
          }}
        >
          Detrás de cada frame: horas de research, decisiones difíciles, iteración obsesiva — y un único objetivo: <span style={{ color: C.ink, fontWeight: 600 }}>convertir tu marca en una categoría imposible de ignorar</span>. Resultados revolucionarios para marcas que dejaron de competir y empezaron a definir su mercado.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          style={{
            marginTop: "2.4rem",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.78rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.mute,
            fontWeight: 600,
          }}
        >
          25 piezas · video · branding · performance · AI creative<br />
          <span style={{ color: C.cyan }}>↓ Scrollea para explorar</span>
        </motion.p>
      </motion.section>

      {/* ── FILTERS (sticky) · solo desktop ─────────── */}
      <section
        className="portfolio-filters"
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

      {/* ── CASOS DE ÉXITO · editorial premium ──────────── */}
      <section style={{
        padding: "7rem clamp(1.5rem, 4vw, 3rem) 6rem",
        background: C.bg,
        position: "relative", zIndex: 1,
        borderTop: `1px solid ${C.line}`,
      }}>
        <div style={{ maxWidth: "92rem", margin: "0 auto", position: "relative" }}>
          <FadeUp>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1.2rem", marginBottom: "1.2rem" }}>
              <span style={{ width: "60px", height: "1px", background: C.cyan }} />
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.7rem", letterSpacing: "0.32em", textTransform: "uppercase",
                color: C.cyan, margin: 0, fontWeight: 700,
              }}>01.5 · Casos de éxito</p>
            </div>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
              fontSize: "clamp(3rem, 8vw, 6rem)", lineHeight: 0.92,
              letterSpacing: "-0.005em", color: C.ink, margin: "0 0 1.4rem",
              maxWidth: "16ch",
            }}>
              Resultados<br/>
              <span style={{ color: C.gold, fontStyle: "italic", fontFamily: "'Bebas Neue', serif" }}>que se pueden medir.</span>
            </h2>
            <p style={{
              fontFamily: "Inter, sans-serif", color: C.mute,
              fontSize: "1.1rem", maxWidth: "780px", marginBottom: "4.5rem",
              lineHeight: 1.6,
            }}>
              <span style={{ color: C.ink, fontWeight: 600 }}>50M+ impresiones combinadas</span>, partnerships de 4-5 años · y crecimiento sostenido año tras año. Cada número está respaldado por reporting auditable.
            </p>
          </FadeUp>

          {/* Aggregate stats bar */}
          <FadeUp delay={0.1}>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0",
              border: `1px solid ${C.line}`, borderRadius: "16px",
              background: "rgba(255,255,255,0.02)", marginBottom: "4rem",
              overflow: "hidden",
            }}>
              {[
                { num: "50M+", label: "impresiones combinadas" },
                { num: "7", label: "marcas activas" },
                { num: "5 años", label: "partnership promedio" },
                { num: "100%", label: "uptime SLA" },
              ].map((s, i) => (
                <div key={s.label} style={{
                  padding: "2rem 1.5rem", textAlign: "center",
                  borderRight: i < 3 ? `1px solid ${C.line}` : "none",
                }}>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    color: C.gold, lineHeight: 1, letterSpacing: "-0.005em",
                  }}>{s.num}</div>
                  <div style={{
                    fontFamily: "Inter, sans-serif", fontSize: "0.65rem",
                    color: C.mute, letterSpacing: "0.18em", textTransform: "uppercase",
                    marginTop: "0.6rem", fontWeight: 600,
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Editorial cards · 2-up layout */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
            {CASES.map((c, i) => {
              const reverse = i % 2 === 1;
              return (
                <FadeUp key={c.id} delay={i * 0.08}>
                  <article
                    data-cursor-hover
                    className="case-editorial"
                    style={{
                      position: "relative",
                      background: C.bgSoft,
                      border: `1px solid ${C.line}`,
                      borderRadius: "18px",
                      overflow: "hidden",
                      display: "grid",
                      gridTemplateColumns: "1fr 1.4fr",
                      minHeight: "360px",
                      transition: "transform 0.4s cubic-bezier(.22,1,.36,1), border-color 0.4s, box-shadow 0.4s",
                    }}
                  >
                    {/* IMAGE PANEL */}
                    <div style={{
                      position: "relative", overflow: "hidden",
                      background: `linear-gradient(135deg, ${c.colors[0]}30, ${c.colors[1]}15)`,
                      order: reverse ? 2 : 1,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.img}
                        alt={c.client}
                        style={{
                          position: "absolute", inset: 0,
                          width: "100%", height: "100%", objectFit: "cover",
                          opacity: 0.85,
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent 40%, ${C.bgSoft}f8 100%)`,
                      }} />
                      {/* category badge */}
                      <span style={{
                        position: "absolute", top: "1.4rem", left: "1.4rem",
                        padding: "0.4rem 0.85rem",
                        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                        border: `1px solid ${c.colors[0]}55`,
                        borderRadius: "100px",
                        fontFamily: "Inter, sans-serif", fontWeight: 600,
                        fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase",
                        color: c.colors[0],
                      }}>{c.cat}</span>
                    </div>

                    {/* CONTENT PANEL */}
                    <div style={{
                      order: reverse ? 1 : 2,
                      padding: "clamp(1.8rem, 3vw, 2.8rem)",
                      display: "flex", flexDirection: "column", justifyContent: "space-between",
                    }}>
                      <div>
                        <p style={{
                          fontFamily: "Inter, sans-serif", fontWeight: 700,
                          fontSize: "0.7rem", letterSpacing: "0.28em", textTransform: "uppercase",
                          color: c.colors[0], margin: "0 0 0.7rem",
                        }}>{c.client}</p>
                        <h3 style={{
                          fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
                          fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1,
                          letterSpacing: "0.005em", color: C.ink, margin: "0 0 1rem",
                        }}>{c.title}</h3>
                        {c.challenge && (
                          <p style={{
                            fontFamily: "Inter, sans-serif", fontSize: "0.78rem",
                            color: c.colors[0], margin: "0 0 0.8rem", fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}>El reto · <span style={{ color: C.mute, fontWeight: 400 }}>{c.challenge}</span></p>
                        )}
                        <p style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.92rem", color: C.ink, opacity: 0.85,
                          margin: 0, lineHeight: 1.55,
                        }}>{c.desc}</p>
                      </div>

                      {/* big KPI + metrics row */}
                      <div style={{
                        marginTop: "1.6rem", paddingTop: "1.4rem",
                        borderTop: `1px solid ${C.line}`,
                        display: "flex", alignItems: "flex-end", gap: "1.8rem", flexWrap: "wrap",
                      }}>
                        <div style={{ flex: "0 0 auto" }}>
                          <div style={{
                            fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
                            fontSize: "clamp(2.8rem, 5vw, 4rem)", lineHeight: 0.9,
                            letterSpacing: "-0.01em",
                            color: C.gold,
                            textShadow: `0 0 24px ${C.gold}33`,
                          }}>{c.kpi}</div>
                          <div style={{
                            fontFamily: "Inter, sans-serif", fontWeight: 600,
                            fontSize: "0.62rem", color: C.mute,
                            letterSpacing: "0.18em", textTransform: "uppercase",
                            marginTop: "0.4rem",
                          }}>{c.kpiLabel}</div>
                        </div>
                        {c.metrics && (
                          <div style={{ display: "flex", gap: "1.4rem", flexWrap: "wrap", flex: "1 1 0" }}>
                            {c.metrics.map((m) => (
                              <div key={m.label} style={{ minWidth: "70px" }}>
                                <p style={{
                                  fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
                                  fontSize: "1.5rem", color: c.colors[0],
                                  margin: 0, lineHeight: 1, letterSpacing: "0.01em",
                                }}>{m.num}</p>
                                <p style={{
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: "0.56rem", color: C.mute,
                                  letterSpacing: "0.18em", textTransform: "uppercase",
                                  margin: "0.4rem 0 0", fontWeight: 600,
                                }}>{m.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* testimonial if exists */}
                      {c.quote && (
                        <blockquote style={{
                          marginTop: "1.4rem", marginBottom: 0,
                          padding: "1rem 1.3rem",
                          background: `${c.colors[0]}0F`,
                          borderLeft: `3px solid ${c.colors[0]}`,
                          borderRadius: "4px",
                        }}>
                          <p style={{
                            fontFamily: "'Bebas Neue', serif", fontStyle: "italic",
                            fontSize: "1rem", color: C.ink, opacity: 0.9,
                            margin: 0, lineHeight: 1.4, fontWeight: 400,
                            letterSpacing: "0.005em",
                          }}>"{c.quote}"</p>
                          <p style={{
                            fontFamily: "Inter, sans-serif", fontWeight: 600,
                            fontSize: "0.65rem", color: c.colors[0],
                            letterSpacing: "0.16em", textTransform: "uppercase",
                            marginTop: "0.7rem", marginBottom: 0,
                          }}>— {c.quoteAuthor}</p>
                        </blockquote>
                      )}

                      {/* live web button */}
                      {c.liveUrl && (
                        <a href={c.liveUrl} target="_blank" rel="noopener noreferrer"
                          data-cursor-hover
                          style={{
                            marginTop: "1.4rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            padding: "0.7rem 1.2rem",
                            background: `${c.colors[0]}18`,
                            border: `1px solid ${c.colors[0]}55`,
                            borderRadius: "100px",
                            color: c.colors[0],
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            alignSelf: "flex-start",
                            transition: "all 0.3s",
                          }}>
                          Ver web en vivo
                          <span style={{ fontSize: "1.1em" }}>↗</span>
                        </a>
                      )}
                    </div>
                  </article>
                </FadeUp>
              );
            })}
          </div>

          {/* mobile fallback styles */}
          <style jsx>{`
            .case-editorial:hover {
              border-color: rgba(229,187,85,0.35) !important;
              box-shadow: 0 30px 80px -30px rgba(229,187,85,0.18);
            }
            @media (max-width: 820px) {
              .case-editorial {
                grid-template-columns: 1fr !important;
                min-height: 0 !important;
              }
              .case-editorial > div:first-child {
                order: 1 !important;
                min-height: 240px !important;
              }
              .case-editorial > div:last-child {
                order: 2 !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* ── CLIENTS LOGOS BAND · estilo home digitals.cl ── */}
      <section style={{
        padding: "8vh 0",
        background: C.bg,
        borderTop: `1px solid ${C.line}`,
        overflow: "hidden", position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: "3rem", padding: "0 4vw" }}>
          <span style={{
            fontFamily: "Inter, sans-serif", fontWeight: 800,
            fontSize: "0.7rem", letterSpacing: "0.32em", textTransform: "uppercase",
            color: C.cyan, display: "block", marginBottom: "10px",
          }}>VERIFICADO POR NUESTROS PARTNERS</span>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
            color: C.ink, letterSpacing: "0.06em", margin: 0, fontWeight: 400,
          }}>+ DE 500 MARCAS HAN CONFIADO EN NOSOTROS</h2>
        </div>
        <div
          className="hub-logo-carousel-container"
          style={{
            width: "100%", overflow: "hidden",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          <div
            className="hub-logo-carousel-track"
            style={{
              display: "flex", alignItems: "center", width: "max-content",
              animation: "hubMarq 60s linear infinite",
            }}
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).concat(Array.from({ length: 24 }, (_, i) => i + 1)).map((n, i) => (
              <div key={`${n}-${i}`} className="hub-logo-item" style={{
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                width: "280px", height: "160px", padding: "0 20px",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos-blancos/${n}.png`}
                  alt="Cliente"
                  loading="lazy"
                  style={{
                    maxWidth: "220px", maxHeight: "130px", width: "auto", height: "auto",
                    objectFit: "contain", opacity: 0.5, transition: "filter .5s, opacity .5s, transform .4s",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MASTER FOOTER · igual a digitals.cl ────────── */}
      <footer style={{
        position: "relative", width: "100vw", overflow: "hidden",
        background: "#000",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "12vh 4vw 4vh",
        borderTop: `1px solid ${C.line}`, zIndex: 10,
      }}>
        {/* huge ghost logo */}
        <div aria-hidden style={{
          position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(8rem, 25vw, 32rem)",
          color: "#fff", opacity: 0.06, whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 0, letterSpacing: "-1vw", userSelect: "none",
        }}>DIGITALS</div>

        <div className="hub-footer-grid-4" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1.4fr",
          gap: "48px", marginBottom: "5vh",
          position: "relative", zIndex: 5,
        }}>
          {/* COL 1 · Sitio */}
          <div>
            <h4 style={{
              fontFamily: "Inter, sans-serif", fontWeight: 800,
              fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase",
              color: C.cyan, marginBottom: "18px",
            }}>Sitio</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { l: "Inicio", h: "https://digitals.cl" },
                { l: "Nosotros", h: "https://digitals.cl/#about" },
                { l: "El Equipo", h: "https://digitals.cl/#squad" },
                { l: "Proyectos", h: "https://digitals.cl/#work" },
                { l: "Portafolio", h: "/portfolio" },
                { l: "Contacto", h: "https://digitals.cl/#contact" },
              ].map(item => (
                <li key={item.l} style={{ marginBottom: "6px" }}>
                  <a href={item.h} data-cursor-hover style={{
                    color: C.mute, fontSize: "0.95rem", lineHeight: 1.7, fontWeight: 500,
                    textDecoration: "none", display: "inline-block",
                  }}>{item.l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* COL 2 · Servicios */}
          <div>
            <h4 style={{
              fontFamily: "Inter, sans-serif", fontWeight: 800,
              fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase",
              color: C.cyan, marginBottom: "18px",
            }}>Servicios</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {["Social Media", "Paid Media", "Digitals Executive", "IA & Automatización"].map(s => (
                <li key={s} style={{ marginBottom: "6px" }}>
                  <a href="https://digitals.cl/#services" data-cursor-hover style={{
                    color: C.mute, fontSize: "0.95rem", lineHeight: 1.7, fontWeight: 500,
                    textDecoration: "none", display: "inline-block",
                  }}>{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* COL 3 · Ecosistema */}
          <div>
            <h4 style={{
              fontFamily: "Inter, sans-serif", fontWeight: 800,
              fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase",
              color: C.cyan, marginBottom: "18px",
            }}>Ecosistema</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                { l: "AI Labs", h: "https://digitals.cl/ai-labs.html" },
                { l: "Blog · Editorial", h: "https://digitals.cl/blog.html" },
                { l: "Portafolio", h: "/portfolio" },
                { l: "Hapee", h: "https://hapee.ai" },
                { l: "Zentru", h: "https://zentru.ai" },
                { l: "Grupo Digitals", h: "https://grupodigitals.com" },
              ].map(item => (
                <li key={item.l} style={{ marginBottom: "6px" }}>
                  <a href={item.h} target={item.h.startsWith("http") ? "_blank" : undefined} rel="noopener" data-cursor-hover style={{
                    color: C.mute, fontSize: "0.95rem", lineHeight: 1.7, fontWeight: 500,
                    textDecoration: "none", display: "inline-block",
                  }}>{item.l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* COL 4 · Estudio */}
          <div>
            <h4 style={{
              fontFamily: "Inter, sans-serif", fontWeight: 800,
              fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase",
              color: C.cyan, marginBottom: "18px",
            }}>Estudio</h4>
            <p style={{ margin: 0, color: C.mute, fontSize: "0.9rem", lineHeight: 1.6 }}>
              <span style={{ color: C.cyan, fontWeight: 700, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Chile</span>
              Padre Mariano #82, Oficina 502<br/>Providencia, Santiago
            </p>
            <p style={{ margin: "14px 0 0", color: C.mute, fontSize: "0.9rem", lineHeight: 1.6 }}>
              <span style={{ color: C.cyan, fontWeight: 700, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>USA</span>
              1908 Thomes Ave STE 12605<br/>Cheyenne, Wyoming, 82001
            </p>
            <a href="mailto:contacto@digitals.cl" data-cursor-hover style={{
              display: "inline-block", marginTop: "14px",
              color: C.cyan, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.92rem",
              textDecoration: "none", borderBottom: `1px solid ${C.cyan}`, paddingBottom: "2px",
            }}>contacto@digitals.cl</a>
            <a href="tel:+56959254546" data-cursor-hover style={{
              display: "inline-block", marginTop: "8px",
              color: C.gold, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.92rem",
              textDecoration: "none", borderBottom: `1px solid ${C.gold}`, paddingBottom: "2px",
            }}>+56 9 5925 4546</a>
            <div style={{
              color: C.gold, fontWeight: 400, display: "block", marginTop: "18px",
              fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: "0.04em",
            }}>Let&apos;s reinvent.</div>
          </div>
        </div>

        {/* Presencia regional */}
        <div style={{ padding: "3vh 0", borderTop: `1px solid ${C.line}`, marginBottom: "3vh", position: "relative", zIndex: 5 }}>
          <h4 style={{
            color: C.mute, fontSize: "0.85rem", letterSpacing: "0.16em", textTransform: "uppercase",
            marginBottom: "15px", fontWeight: 500,
          }}>PRESENCIA REGIONAL</h4>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {["CL","AR","PE","EC","CO","MX","US"].map(code => (
              <div key={code} style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "#1a1a1a", border: `1px solid ${C.line}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.ink, fontFamily: "Inter, sans-serif", fontWeight: 700,
                fontSize: "0.65rem", letterSpacing: "0.04em",
              }}>{code}</div>
            ))}
          </div>
        </div>

        {/* Cierre + socials */}
        <div style={{
          width: "100%", borderTop: `1px solid ${C.line}`, paddingTop: "20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "relative", zIndex: 5,
          color: "#555", fontSize: "0.8rem", letterSpacing: "0.04em",
          flexWrap: "wrap", gap: "15px",
        }}>
          <p style={{ margin: 0 }}>DIGITALS &copy; {new Date().getFullYear()} | AGENCIA &amp; CONSULTORA DIGITAL. TODOS LOS DERECHOS RESERVADOS.</p>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            {[
              { l: "IG", h: "https://www.instagram.com/agencia.digitals" },
              { l: "in", h: "https://www.linkedin.com/company/agencia.digitals" },
              { l: "TT", h: "https://www.tiktok.com/@agencia.digitals" },
            ].map(s => (
              <a key={s.l} href={s.h} target="_blank" rel="noopener" data-cursor-hover style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "#000", border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.ink, textDecoration: "none",
                fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem",
                letterSpacing: "0.04em",
                transition: "border-color .3s, box-shadow .3s",
              }} aria-label={s.l}>{s.l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Google Fonts + Grid + Custom cursor + Marquee ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');

        ::selection { background: rgba(18,128,155,0.32); color: #fff; }
        div::-webkit-scrollbar { display: none; }
        @media (hover: hover) {
          html, body, * { cursor: none !important; }
        }
        @media (hover: none) {
          a, button, [data-cursor-hover], [role="button"] { cursor: pointer; }
        }

        /* PORTFOLIO ENTRY · solo un fade rápido para el flash inicial · no transform animations */
        .portfolio-entry-flash {
          position: fixed; inset: 0; z-index: 9998;
          pointer-events: none;
          background: radial-gradient(circle at 50% 50%,
            rgba(255,255,255,0.9) 0%,
            rgba(0, 212, 255, 0.5) 40%,
            rgba(0,0,0,0) 100%);
          opacity: 1;
          animation: portfolio-entry-fade 0.7s ease-out forwards;
          will-change: opacity;
        }
        @keyframes portfolio-entry-fade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* CLIENTS LOGOS BAND · estilo home digitals.cl */
        @keyframes hubMarq {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .hub-logo-carousel-container:hover .hub-logo-carousel-track { animation-play-state: paused; }
        .hub-logo-item img:hover {
          filter: drop-shadow(0 0 18px rgba(0,212,255,0.9)) !important;
          opacity: 0.95 !important;
          transform: scale(1.08);
        }
        @media (max-width: 768px) {
          .hub-logo-item { width: 180px !important; height: 110px !important; padding: 0 14px !important; }
          .hub-logo-item img { max-width: 140px !important; max-height: 80px !important; }
        }
        @media (max-width: 480px) {
          .hub-logo-item { width: 140px !important; height: 90px !important; padding: 0 10px !important; }
          .hub-logo-item img { max-width: 110px !important; max-height: 60px !important; opacity: 0.65 !important; }
        }

        /* MASTER FOOTER responsive */
        @media (max-width: 1024px) {
          .hub-footer-grid-4 { grid-template-columns: 1fr 1fr !important; gap: 38px !important; }
        }
        @media (max-width: 600px) {
          .hub-footer-grid-4 { grid-template-columns: 1fr !important; gap: 30px !important; }
        }

        /* PORTFOLIO GRID · masonry-style con grid-auto-flow dense
           default → 1col × 1row · row height fijo crea formato cercano a 4:3
           wide   → 2cols × 1row · landscape ancho
           tall   → 1col × 2rows · formato reel vertical 9:16
           dense empaca los huecos · orden visual estilo Pinterest */
        .portfolio-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-flow: dense;
          grid-auto-rows: 200px;
        }
        .slot-card { height: 100% !important; }
        @media (max-width: 1280px) {
          .portfolio-grid { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 210px; }
        }
        @media (max-width: 900px) {
          .portfolio-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 200px; }
        }
        @media (max-width: 600px) {
          .portfolio-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; grid-auto-rows: 170px; }
        }
        @media (max-width: 420px) {
          .portfolio-grid { grid-template-columns: 1fr; gap: 0.7rem; grid-auto-rows: 200px; }
          .slot-card.slot-wide { grid-column: auto !important; }
          .slot-card.slot-tall { grid-row: span 2 !important; }
        }

        /* Mobile: ocultar filtros sticky · liberan espacio */
        @media (max-width: 768px) {
          .portfolio-filters { display: none !important; }
        }

        /* Reduce motion · respetar accesibilidad */
        @media (prefers-reduced-motion: reduce) {
          .slot-card { transform: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
