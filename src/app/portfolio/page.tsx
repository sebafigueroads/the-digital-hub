"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

/* ═══════════════════════════════════════════════════════
   FLOATING PARTICLES (canvas-based for performance)
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
      hover: number; // 0..1 hover intensity for visual response
    }

    const palette = [
      "rgba(18,128,155,",
      "rgba(0,212,255,",
      "rgba(200,255,0,",
      "rgba(229,187,85,",
      "rgba(139,92,246,",
      "rgba(219,102,106,",
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

    /* Cursor reactivity — repel + grab */
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
    /* Cursor changes when over an atom */
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

        // draw amorphous blob using bezier curves
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

        // fill with radial gradient — boost on hover
        const baseAlpha = 0.55 + a.hover * 0.3;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
        grad.addColorStop(0, a.color + baseAlpha + ")");
        grad.addColorStop(0.4, a.color + (0.3 + a.hover * 0.2) + ")");
        grad.addColorStop(0.7, a.color + (0.1 + a.hover * 0.12) + ")");
        grad.addColorStop(1, a.color + "0)");
        ctx.fillStyle = grad;
        ctx.fill();

        // border — thicker on hover
        ctx.strokeStyle = a.color + (0.25 + a.hover * 0.5) + ")";
        ctx.lineWidth = 1.5 + a.hover * 1.5;
        ctx.stroke();

        ctx.restore();
      }

      // connecting lines between nearby atoms
      ctx.lineWidth = 0.5;
      for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
          const dx = atoms[i].x - atoms[j].x;
          const dy = atoms[i].y - atoms[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 300) {
            const opacity = (1 - dist / 300) * 0.25;
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
        /* pointerEvents toggled dynamically — auto when over an atom, none otherwise */
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════ */
const FILTERS = ["Selected", "Social Media", "Performance", "B2B", "AI & Tech", "Diseño y Web", "Producto"];

const PROJECTS = [
  { id: "ajinomoto", client: "Ajinomoto", title: "De marca desconocida a viral en Chile", cat: "Social Media", type: "Estrategia Orgánica", kpi: "+320%", kpiLabel: "engagement", desc: "3.8M alcance. Presencia en retail.", colors: ["#ff4444", "#ff6b35"], img: "/exitos/ajinomoto.jpeg" },
  { id: "sacyr", client: "Sacyr", title: "Monitoreo 24/7 infraestructura crítica", cat: "Social Media", type: "Reputation Management", kpi: "10K+", kpiLabel: "incidencias/mes", desc: "4+ años. 7 concesiones.", colors: ["#ff8800", "#ffa040"], img: "/exitos/sacyr.png" },
  { id: "develon", client: "Develon", title: "Dominio digital en maquinaria pesada", cat: "Performance", type: "Performance IMAX", kpi: "+40%", kpiLabel: "crecimiento", desc: "960K impresiones. Hyundai → Develon.", colors: ["#f5c518", "#e8a800"], img: "/exitos/develon.jpeg" },
  { id: "fidelogist", client: "Fidelogist", title: "Reuniones C-Level con gigantes LATAM", cat: "B2B", type: "Digitals Executive", kpi: "9+", kpiLabel: "reuniones C-Level", desc: "PepsiCo, Carozzi, Copec.", colors: ["#22c55e", "#10b981"], img: "/exitos/fidelogist.jpeg" },
  { id: "hapee", client: "hapee", title: "CRM con agentes AI que cierran ventas", cat: "AI & Tech", type: "SaaS + AI Agents", kpi: "+68%", kpiLabel: "LTV", desc: "100+ clientes activos.", colors: ["#8b5cf6", "#a78bfa"], img: "/exitos/hapee.png" },
  { id: "simplus", client: "Simplus", title: "Funnel industrial automatizado", cat: "B2B", type: "Automatización B2B", kpi: "18+", kpiLabel: "ciudades", desc: "ROI medible en ventas.", colors: ["#3b82f6", "#60a5fa"], img: "/exitos/simplus.jpeg" },
  { id: "mundomed", client: "Mundomed", title: "Importación médica con +30% anual", cat: "Performance", type: "Full Funnel B2B", kpi: "+30%", kpiLabel: "crecimiento anual", desc: "5+ años. Leads ultra-calificados.", colors: ["#0891b2", "#06b6d4"], img: "/exitos/mundomed.png" },
  { id: "vinolia", client: "Vinolia", title: "+12K seguidores en 4 meses", cat: "Social Media", type: "Community", kpi: "+380%", kpiLabel: "alcance", desc: "Ventas online y presenciales.", colors: ["#ec4899", "#f472b6"], img: "/eco/talent.jpeg" },
  { id: "zentru", client: "Zentru", title: "Agentes AI autónomos en producción", cat: "AI & Tech", type: "AI Agents", kpi: "24/7", kpiLabel: "autónomo", desc: "Social listening + alertas.", colors: ["#f97316", "#fb923c"], img: "/eco/zentru.png" },
  { id: "linkd", client: "Linkd", title: "Un tap y compartís todo", cat: "Producto", type: "NFC Product", kpi: "1", kpiLabel: "tap", desc: "Adiós tarjetas de papel.", colors: ["#06b6d4", "#22d3ee"], img: "/eco/linkd.png" },
  { id: "aws", client: "AWS", title: "Cloud para escalar agentes AI", cat: "AI & Tech", type: "Cloud Partnership", kpi: "∞", kpiLabel: "scale", desc: "Hosting de agentes AI.", colors: ["#f59e0b", "#fbbf24"], img: "/brands/aws-evento.jpeg" },
  { id: "creative", client: "Creative Suite", title: "Generación autónoma con Claude", cat: "Producto", type: "AI Creative", kpi: "AI", kpiLabel: "powered", desc: "Gráficas y video autónomos.", colors: ["#84cc16", "#a3e635"], img: "/eco/academy.png" },
  { id: "quellon", client: "Quellón Sports", title: "Identidad deportiva y plataforma digital", cat: "Diseño y Web", type: "Branding + Web", kpi: "100%", kpiLabel: "identidad nueva", desc: "Diseño de marca deportiva y sitio web con experiencia de fan y club.", colors: ["#0ea5e9", "#38bdf8"], img: "/eco/agencia.jpeg" },
  { id: "heli", client: "Heli Fork Lift", title: "Web corporativa para distribuidora industrial", cat: "Diseño y Web", type: "Web Corporativa", kpi: "B2B", kpiLabel: "lead gen", desc: "Sitio de alto impacto para distribuidor de maquinaria industrial con catálogo completo.", colors: ["#eab308", "#fde047"], img: "/eco/executive.jpeg" },
  { id: "dellanatura", client: "Dellanatura", title: "E-commerce y branding orgánico", cat: "Diseño y Web", type: "E-commerce + Brand", kpi: "↑ ventas", kpiLabel: "online", desc: "Identidad visual y tienda online para marca de productos naturales.", colors: ["#16a34a", "#4ade80"], img: "/eco/talent.jpeg" },
];

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

/* === Case-study popup modal — artistic ============================ */
function CaseModal({ project, onClose }: { project: typeof PROJECTS[number] | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);
  if (!project) return null;

  /* Build narrative from project data — extends with rich copy */
  const narratives: Record<string, { challenge: string; solution: string; result: string; testimonial?: string; author?: string; metrics: { num: string; label: string }[] }> = {
    ajinomoto: { challenge: "Adaptar comunicacional y comercialmente una marca líder global al mercado chileno, rompiendo la barrera del retail masivo.", solution: "Estrategia de adaptación gráfica + acompañamiento en terreno. Campañas orgánicas de alto impacto + marketing digital para penetrar puntos de venta clave.", result: "Posicionamiento como referente de la categoría umami en Chile con presencia consolidada en retail premium.", metrics: [{ num: "+320%", label: "Engagement" }, { num: "3.8M", label: "Alcance" }, { num: "Tottus", label: "Retail key" }] },
    sacyr: { challenge: "Gestionar la comunicación crítica y reputación en tiempo real de múltiples concesiones (autopistas y hospitales) con alta exposición.", solution: "Sistema de Social Listening 24/7 y monitoreo continuo de 7+ concesiones, transformando datos en atención al cliente inmediata.", result: "Más de 10K incidencias gestionadas mensualmente con 100% disponibilidad operativa y un partnership de 4+ años.", testimonial: "El aporte de Digitals ha marcado la diferencia en posicionamiento y creatividad. Destacamos su flexibilidad, adaptación y la calidad de su trabajo.", author: "Natalia Marambio · Sacyr", metrics: [{ num: "10K+", label: "Incidencias/mes" }, { num: "7+", label: "Concesiones" }, { num: "100%", label: "Disponibilidad" }] },
    develon: { challenge: "Liderar la transición de marca en el mercado de maquinaria pesada, manteniendo la autoridad en sectores críticos como minería.", solution: "Implementación de la estrategia IMAX vinculando búsquedas semánticas con activos visuales de alta conversión.", result: "Crecimiento sostenido en 2 años con dominio digital del rubro y mejora continua del Lead Quality Score.", metrics: [{ num: "+40%", label: "Crecimiento" }, { num: "960K", label: "Impresiones/mes" }, { num: "+25%", label: "Lead Quality" }] },
    fidelogist: { challenge: "Abrir oportunidades B2B con tomadores de decisión C-Level en empresas globales de alta complejidad.", solution: "Modelo Digitals Executive: prospección híbrida (automatizado + humano) diseñada para apertura de mercados estratégicos.", result: "Reuniones C-Level con cuentas top como PepsiCo, Carozzi, Unilever, Copec y otros gigantes industriales.", metrics: [{ num: "800+", label: "Perfiles/mes" }, { num: "9+", label: "Reuniones C-Level" }, { num: "PepsiCo", label: "Cuenta clave" }] },
    hapee: { challenge: "Crear una plataforma SaaS que centralice operación comercial con IA para clientes en Chile y Latam.", solution: "Plataforma CRM con agentes IA, embudos automatizados y voice AI integrada como columna vertebral del ecosistema Grupo Digitals.", result: "Líder regional en agentes de IA aplicados al ciclo comercial con +100 clientes activos.", metrics: [{ num: "+68%", label: "LTV" }, { num: "+35%", label: "Conversiones" }, { num: "100+", label: "Clientes activos" }] },
    simplus: { challenge: "Digitalizar y escalar el proceso de ventas industriales B2B de Grupo GTP.", solution: "Embudo de captación industrial 100% automatizado con cobertura nacional.", result: "Generación de demanda calificada en 18+ ciudades con ROI positivo validado.", metrics: [{ num: "100%", label: "Automatizado" }, { num: "18+", label: "Ciudades" }, { num: "ROI+", label: "Validado" }] },
    mundomed: { challenge: "Posicionar a una empresa de importación de medicamentos como referente, escalando ventas y leads ultra-calificados año tras año.", solution: "Embudos full-funnel data driven, marketing de contenidos B2B médico, paid media segmentado por especialidad y automatización IA.", result: "Crecimiento sostenido del 30% anual durante 5+ años con leads ultra-calificados constantes.", testimonial: "Su atención personalizada ha sido clave; siempre están pendientes y dispuestos a atender cada una de nuestras necesidades.", author: "Jens Lehman · Mundomed", metrics: [{ num: "+30%", label: "Anual" }, { num: "5+", label: "Años" }, { num: "B2B", label: "Leads ultra-cal." }] },
    vinolia: { challenge: "Construir comunidad y autoridad para una marca emergente del rubro gastronómico.", solution: "Estrategia de contenido vanguardista con hooks de neuromarketing y formatos nativos por plataforma.", result: "+12K seguidores en 4 meses con engagement del 8.4% y aumento sostenido en ventas online y presenciales.", metrics: [{ num: "+12K", label: "Seguidores" }, { num: "8.4%", label: "Engagement" }, { num: "+380%", label: "Alcance" }] },
    zentru: { challenge: "Crear una plataforma de IA que ayude a agencias en Chile y Latam a automatizar su operación.", solution: "Núcleo interno con IA que automatiza flujos operativos, gestiones y workflows de agencias publicitarias.", result: "Plataforma líder regional en automatización de operaciones de agencia, creada por Grupo Digitals.", metrics: [{ num: "24/7", label: "Autónomo" }, { num: "AGENCIAS", label: "Latam" }, { num: "AI", label: "Native" }] },
    linkd: { challenge: "Reemplazar la tarjeta de presentación tradicional por una experiencia 100% digital.", solution: "Soluciones NFC integradas con perfiles digitales: redes, web y catálogos accesibles con un solo tap.", result: "Producto adoptado por equipos comerciales que duplicaron su tasa de contacto post-evento.", metrics: [{ num: "1", label: "Tap" }, { num: "NFC", label: "Tech" }, { num: "0", label: "Papel" }] },
    aws: { challenge: "Escalar la infraestructura cloud de los agentes IA de producción para clientes enterprise.", solution: "Partnership con AWS Bedrock para hosting de pipelines de IA y orquestación de agentes a escala.", result: "Capacidad de servir agentes IA a clientes enterprise con SLA y observabilidad de nivel cloud.", metrics: [{ num: "∞", label: "Scale" }, { num: "Bedrock", label: "Stack" }, { num: "ENT", label: "SLA" }] },
    creative: { challenge: "Generar gráficas, video y guiones para clientes de manera 100% autónoma.", solution: "Suite completa construida sobre Claude Code con MCP Protocol y orquestación multi-modelo (Runway, Higgsfield, Kling, ElevenLabs).", result: "Producción creativa autónoma con calidad de agencia, escalable a múltiples clientes en paralelo.", metrics: [{ num: "AI", label: "Powered" }, { num: "MCP", label: "Stack" }, { num: "100%", label: "Auto" }] },
    quellon: { challenge: "Construir identidad visual y plataforma digital para un proyecto deportivo.", solution: "Diseño de marca deportiva integral + sitio web con experiencia de fan y club.", result: "Identidad lanzada con plataforma digital que sostiene comunidad y comunicación oficial.", metrics: [{ num: "100%", label: "Identidad" }, { num: "Web", label: "Plataforma" }, { num: "Fan", label: "Experiencia" }] },
    heli: { challenge: "Web corporativa de alto impacto para un distribuidor de maquinaria industrial.", solution: "Sitio con catálogo completo, fichas técnicas y formularios B2B de cotización.", result: "Lead gen industrial estable con sitio que respalda el rol de distribuidor referente.", metrics: [{ num: "B2B", label: "Lead gen" }, { num: "Catálogo", label: "Completo" }, { num: "ENT", label: "Industrial" }] },
    dellanatura: { challenge: "Lanzar una marca de productos naturales con identidad visual y tienda online.", solution: "Identidad visual orgánica + e-commerce optimizado para conversión + estrategia de contenido digital.", result: "Marca con presencia online consolidada y ventas digitales en crecimiento sostenido.", metrics: [{ num: "↑", label: "Ventas online" }, { num: "Brand", label: "Nueva" }, { num: "EC", label: "Ready" }] },
  };

  const n = narratives[project.id] || { challenge: project.desc, solution: project.type, result: project.desc, metrics: [{ num: project.kpi, label: project.kpiLabel }] };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(248,247,244,0.85)", backdropFilter: "blur(28px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1rem, 3vw, 3rem)" }}
    >
      <motion.article
        initial={{ y: 60, opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", width: "min(1100px, 100%)", maxHeight: "92vh",
          background: "#fff", borderRadius: "18px", overflow: "hidden",
          boxShadow: "0 60px 140px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.04)",
          display: "grid", gridTemplateColumns: "1.05fr 1fr",
        }}
        className="case-modal"
      >
        {/* LEFT — visual */}
        <div style={{ position: "relative", minHeight: "560px", overflow: "hidden", background: project.colors[0] }}>
          <motion.img
            src={project.img}
            alt={project.client}
            initial={{ scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.currentTarget.style.display = "none"); }}
          />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${project.colors[0]}55 0%, ${project.colors[1]}99 100%)`, mixBlendMode: "multiply" }} />
          {/* Floating brand mark */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "2.5rem", color: "#fff" }}>
            <div>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.7, marginBottom: "0.6rem" }}>{project.type}</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.2rem, 4vw, 3.8rem)", lineHeight: 0.95, letterSpacing: "-0.02em", textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
                {project.client}
              </h2>
            </div>
          </div>
        </div>

        {/* RIGHT — narrative */}
        <div style={{ padding: "clamp(1.6rem, 3vw, 3rem)", display: "flex", flexDirection: "column", gap: "1.4rem", overflow: "auto", color: "#111" }}>
          <div>
            <p style={{ fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#aaa", marginBottom: "0.6rem" }}>Caso de éxito</p>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.4rem, 2.4vw, 2.2rem)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              {project.title}
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${n.metrics.length}, 1fr)`, gap: "0.8rem", padding: "1rem 0", borderTop: "1px solid rgba(0,0,0,0.08)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            {n.metrics.map((m) => (
              <div key={m.label}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(1.4rem, 2.6vw, 2rem)", lineHeight: 1, color: project.colors[0], letterSpacing: "-0.02em" }}>{m.num}</div>
                <div style={{ fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginTop: "0.3rem" }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", textTransform: "uppercase", color: project.colors[0], marginBottom: "0.5rem", fontWeight: 700 }}>El reto</p>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.65, color: "#333" }}>{n.challenge}</p>
          </div>

          <div>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", textTransform: "uppercase", color: project.colors[0], marginBottom: "0.5rem", fontWeight: 700 }}>La solución</p>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.65, color: "#333" }}>{n.solution}</p>
          </div>

          <div>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", textTransform: "uppercase", color: project.colors[0], marginBottom: "0.5rem", fontWeight: 700 }}>El resultado</p>
            <p style={{ fontSize: "0.92rem", lineHeight: 1.65, color: "#333" }}>{n.result}</p>
          </div>

          {n.testimonial && (
            <div style={{ marginTop: "0.6rem", padding: "1.2rem 1.4rem", background: `linear-gradient(135deg, ${project.colors[0]}10, transparent)`, borderLeft: `3px solid ${project.colors[0]}`, borderRadius: "6px" }}>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "0.95rem", lineHeight: 1.6, color: "#222" }}>&ldquo;{n.testimonial}&rdquo;</p>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginTop: "0.7rem" }}>— {n.author}</p>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          data-cursor-hover
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute", top: "1rem", right: "1rem", zIndex: 10,
            width: "44px", height: "44px", borderRadius: "50%",
            background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem", color: "#111", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >×</button>
      </motion.article>
    </motion.div>
  );
}

/* Horizontal scrollable showcase — magnetic, tilt, parallax, click → modal */
function HorizontalShowcase({ projects, onOpen }: { projects: typeof PROJECTS; onOpen: (p: typeof PROJECTS[number]) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [movedFar, setMovedFar] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setMovedFar(false);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  }, []);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    const delta = x - startX;
    if (Math.abs(delta) > 6) setMovedFar(true);
    containerRef.current.scrollLeft = scrollLeft - delta * 1.5;
  }, [isDragging, startX, scrollLeft]);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
      style={{
        display: "flex", gap: "1.5rem",
        overflowX: "auto", overflowY: "hidden",
        padding: "2rem clamp(1.5rem, 4vw, 3rem) 3rem",
        scrollBehavior: "smooth",
        scrollbarWidth: "none",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      {projects.map((p, i) => (
        <ShowcaseCard key={p.id} project={p} index={i} onClick={() => { if (!movedFar) onOpen(p); }} />
      ))}
    </div>
  );
}

function ShowcaseCard({ project: p, index: i, onClick }: { project: typeof PROJECTS[number]; index: number; onClick: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 });

  const handleMove = (e: React.MouseEvent) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({ rx: (y - 0.5) * -10, ry: (x - 0.5) * 10, mx: x * 100, my: y * 100 });
  };
  const handleLeave = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: i * 0.06 }}
      data-cursor-hover
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        flex: "0 0 420px", height: "520px",
        position: "relative", overflow: "hidden",
        borderRadius: "16px", cursor: "pointer",
        transformStyle: "preserve-3d",
        transform: `perspective(1400px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s",
        boxShadow: "0 16px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
      }}
      className="showcase-card"
    >
      {/* Image background with parallax */}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${(tilt.mx - 50) * -0.18}px, ${(tilt.my - 50) * -0.18}px) scale(1.08)`, transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}>
        <img src={p.img} alt={p.client} loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${p.colors[0]}cc, ${p.colors[1]}88)`, mixBlendMode: "multiply", pointerEvents: "none" }} />
      {/* Cursor-following spotlight */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.22) 0%, transparent 35%)`, mixBlendMode: "overlay", pointerEvents: "none", transition: "background 0.2s" }} />
      {/* Animated grain on hover */}
      <div className="card-grain" style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.92' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* KPI badge */}
      <div style={{
        position: "absolute", top: "1.5rem", right: "1.5rem", zIndex: 5,
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(14px)",
        padding: "0.55rem 1.1rem", borderRadius: "8px",
        display: "flex", alignItems: "baseline", gap: "0.35rem",
        border: "1px solid rgba(255,255,255,0.18)",
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "#fff", letterSpacing: "-0.01em" }}>{p.kpi}</span>
        <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{p.kpiLabel}</span>
      </div>

      {/* Client name */}
      <div style={{
        position: "absolute", top: "1.5rem", left: "1.5rem", zIndex: 5,
        fontFamily: "var(--font-display)", fontWeight: 700,
        fontSize: "2.8rem", color: "#fff", lineHeight: 1, letterSpacing: "-0.02em",
        textShadow: "0 2px 30px rgba(0,0,0,0.5)",
      }}>{p.client}</div>

      {/* Info bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5,
        padding: "2rem 1.5rem",
        background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 70%, transparent 100%)",
      }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem" }}>
          {p.type}
        </p>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.35rem", lineHeight: 1.15, color: "#fff", letterSpacing: "-0.01em" }}>
          {p.title}
        </h3>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", marginTop: "0.5rem" }}>
          {p.desc}
        </p>
        <div className="card-cta" style={{
          marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
          color: "#fff", fontWeight: 700,
          padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "100px",
          backdropFilter: "blur(10px)", background: "rgba(255,255,255,0.08)",
        }}>
          Abrir caso <span className="cta-arrow">→</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const [filter, setFilter] = useState("Selected");
  const [openProject, setOpenProject] = useState<typeof PROJECTS[number] | null>(null);
  const filtered = filter === "Selected" ? PROJECTS : PROJECTS.filter((p) => p.cat === filter);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div style={{ background: "#f8f7f4", color: "#111", position: "relative" }}>
      <FloatingAtoms />

      {/* ── NAV ──────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "1.25rem clamp(1.5rem, 4vw, 3rem)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(16px)", background: "rgba(248,247,244,0.85)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
      }}>
        <a href="/" data-cursor-hover style={{ display: "flex", alignItems: "center", gap: "10px", color: "#111", textDecoration: "none" }} aria-label="Inicio">
          <img src="/logo-digitals.png" alt="Digitals" style={{ height: "26px", width: "auto" }} />
        </a>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a href="mailto:hola@digitals.cl" data-cursor-hover style={{ fontSize: "0.8rem", color: "#888", textDecoration: "none" }}>hola@digitals.cl</a>
          <a href="/" data-cursor-hover style={{ fontSize: "0.75rem", padding: "0.5rem 1.25rem", background: "#111", borderRadius: "100px", color: "#fff", textDecoration: "none" }}>Hub 3D</a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <motion.section ref={heroRef} style={{ opacity: heroOpacity, y: heroY,
        minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "8rem clamp(1.5rem, 4vw, 3rem) 4rem", maxWidth: "90rem", margin: "0 auto", position: "relative", zIndex: 1,
      }}>
        <motion.p initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#aaa", marginBottom: "2rem" }}>
          01 · Portafolio
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }}
          style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(4rem, 14vw, 12rem)", lineHeight: 0.85, letterSpacing: "-0.06em",
          }}>
          Digitals<br />Showcase
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ marginTop: "2.5rem", fontSize: "1.15rem", color: "#888", maxWidth: "32rem", lineHeight: 1.7 }}>
          Arrastra para explorar →
        </motion.p>
      </motion.section>

      {/* ── FILTERS ──────────────────────────────────── */}
      <section style={{ position: "sticky", top: "60px", zIndex: 50, padding: "1rem clamp(1.5rem, 4vw, 3rem)", background: "rgba(248,247,244,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button key={f} data-cursor-hover onClick={() => setFilter(f)} style={{
              padding: "0.55rem 1.4rem", fontSize: "0.82rem",
              fontFamily: "var(--font-display)", fontWeight: filter === f ? 700 : 400,
              borderRadius: "100px", border: "none",
              background: filter === f ? "#111" : "rgba(0,0,0,0.04)",
              color: filter === f ? "#fff" : "#777", transition: "all 0.3s",
            }}>{f}</button>
          ))}
        </div>
      </section>

      {/* ── HORIZONTAL SHOWCASE ──────────────────────── */}
      <section style={{ position: "relative", zIndex: 1 }}>
        <HorizontalShowcase projects={filtered} onOpen={setOpenProject} />
      </section>

      {/* ── CASE MODAL ───────────────────────────────── */}
      <CaseModal project={openProject} onClose={() => setOpenProject(null)} />

      {/* ── CLIENT LOGOS (marquee) ────────────────────── */}
      <section style={{ padding: "4rem 0", borderTop: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <FadeUp>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#bbb", marginBottom: "1.5rem", textAlign: "center" }}>
            +60 marcas confían en nosotros
          </p>
        </FadeUp>
        <div style={{ display: "flex", animation: "marquee 30s linear infinite", width: "max-content" }}>
          {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
            <img key={`${logo}-${i}`} src={`/brands/${logo}`} alt="" loading="lazy"
              style={{ height: "28px", objectFit: "contain", marginRight: "3rem", opacity: 0.35, filter: "grayscale(1)" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ))}
        </div>
      </section>

      {/* ── CAPABILITIES (compact) ────────────────────── */}
      <section style={{ padding: "5rem clamp(1.5rem, 4vw, 3rem)", background: "#111", color: "#f8f7f4", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "90rem", margin: "0 auto", display: "flex", gap: "3rem", flexWrap: "wrap" }}>
          <FadeUp>
            <div style={{ flex: "1 1 250px" }}>
              <p style={{ fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>02 · Capabilities</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>Lo Que Hacemos</h2>
            </div>
          </FadeUp>
          <div style={{ flex: "2 1 400px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }}>
            {[
              { title: "Social Media", color: "#ff4444", items: ["Estrategia de contenido", "Community management", "Crecimiento orgánico"] },
              { title: "Paid Media", color: "#f5c518", items: ["Meta, Google, LinkedIn, TikTok", "Tracking CAPI + GTM", "Dashboards C-Level"] },
              { title: "B2B Executive", color: "#22c55e", items: ["Autoridad LinkedIn", "Prospección automatizada", "Reuniones C-Level"] },
              { title: "AI & Automatización", color: "#8b5cf6", items: ["Agentes conversacionales", "RAG pipelines", "Voice AI"] },
            ].map((c, i) => (
              <FadeUp key={c.title} delay={i * 0.1}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.color, boxShadow: `0 0 10px ${c.color}66` }} />
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem" }}>{c.title}</h3>
                  </div>
                  {c.items.map((item) => <p key={item} style={{ fontSize: "0.82rem", color: "#666", padding: "0.25rem 0" }}>{item}</p>)}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────── */}
      <section style={{ padding: "6rem clamp(1.5rem, 4vw, 3rem)", textAlign: "center", background: "#f8f7f4", position: "relative", zIndex: 1 }}>
        <FadeUp>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#aaa", marginBottom: "1.5rem" }}>03 · Contacto</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.04em" }}>
            Creemos Algo Juntos
          </h2>
          <p style={{ marginTop: "1rem", color: "#888", fontSize: "1.05rem" }}>Cada gran idea empieza con una conversación.</p>
          <a href="mailto:hola@digitals.cl" data-cursor-hover style={{
            display: "inline-block", marginTop: "2rem", padding: "1rem 3rem",
            background: "#111", borderRadius: "100px", color: "#fff",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem",
            letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
          }}>hola@digitals.cl</a>
        </FadeUp>
        <p style={{ marginTop: "3rem", fontSize: "0.6rem", color: "#ccc" }}>
          © {new Date().getFullYear()} Digitals · Google Premier Partner · Meta Business Partner
        </p>
      </section>

      <style>{`
        * { cursor: none !important; }
        ::selection { background: rgba(100,100,255,0.15); }
        div::-webkit-scrollbar { display: none; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .showcase-card { will-change: transform; }
        .showcase-card .card-cta { transition: gap 0.35s, background 0.35s, padding 0.35s; }
        .showcase-card:hover { box-shadow: 0 32px 80px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06) !important; }
        .showcase-card:hover .card-cta { background: rgba(255,255,255,0.18); padding: 0.55rem 1.4rem; }
        .showcase-card:hover .cta-arrow { transform: translateX(6px); display: inline-block; }
        .showcase-card .cta-arrow { transition: transform 0.35s cubic-bezier(.22,1,.36,1); display: inline-block; }
        .showcase-card .card-grain { animation: grainShift 1.2s steps(3) infinite; }
        @keyframes grainShift {
          0%, 100% { transform: translate(0,0); }
          33% { transform: translate(-2%, 1%); }
          66% { transform: translate(2%, -1%); }
        }
        .case-modal { will-change: transform, opacity; }
        @media (max-width: 900px) {
          .case-modal { grid-template-columns: 1fr !important; }
          .case-modal > div:first-child { min-height: 280px !important; }
        }
      `}</style>
    </div>
  );
}
