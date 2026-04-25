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
      deform: number; // how much the shape wobbles
      rotSpeed: number;
      color: string;
    }

    // Digitals brand palette — cyan, lime, violet, gold, passion
    const palette = [
      "rgba(18,128,155,",   // cyan #12809b
      "rgba(0,212,255,",    // bright cyan
      "rgba(200,255,0,",    // lime accent #c8ff00
      "rgba(229,187,85,",   // gold #e5bb55
      "rgba(139,92,246,",   // violet #8b5cf6
      "rgba(219,102,106,",  // passion red #db666a
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
      });
    }

    let time = 0;
    const draw = () => {
      time += 0.008;
      ctx.clearRect(0, 0, w, h);

      for (const a of atoms) {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < -100) a.x = w + 100;
        if (a.x > w + 100) a.x = -100;
        if (a.y < -100) a.y = h + 100;
        if (a.y > h + 100) a.y = -100;

        const t = time * a.speed + a.phase;
        // pulsing size
        const r = a.baseR * (0.8 + Math.sin(t * 2) * 0.25);

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

        // fill with radial gradient
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
        grad.addColorStop(0, a.color + "0.55)");
        grad.addColorStop(0.4, a.color + "0.3)");
        grad.addColorStop(0.7, a.color + "0.1)");
        grad.addColorStop(1, a.color + "0)");
        ctx.fillStyle = grad;
        ctx.fill();

        // visible border
        ctx.strokeStyle = a.color + "0.25)";
        ctx.lineWidth = 1.5;
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
   DATA
   ═══════════════════════════════════════════════════════ */
const FILTERS = ["Selected", "Social Media", "Performance", "B2B", "AI & Tech", "Diseño y Web", "Producto"];

const PROJECTS = [
  { id: "ajinomoto", client: "Ajinomoto", title: "De marca desconocida a viral en Chile", cat: "Social Media", type: "Estrategia Orgánica", kpi: "+320%", kpiLabel: "engagement", desc: "3.8M alcance. Presencia en retail.", colors: ["#ff4444", "#ff6b35"], img: "/eco/agencia.jpeg" },
  { id: "sacyr", client: "Sacyr", title: "Monitoreo 24/7 infraestructura crítica", cat: "Social Media", type: "Reputation Management", kpi: "10K+", kpiLabel: "incidencias/mes", desc: "4+ años. 7 concesiones.", colors: ["#ff8800", "#ffa040"], img: "/eco/executive.jpeg" },
  { id: "develon", client: "Develon", title: "Dominio digital en maquinaria pesada", cat: "Performance", type: "Performance IMAX", kpi: "+40%", kpiLabel: "crecimiento", desc: "960K impresiones. Hyundai → Develon.", colors: ["#f5c518", "#e8a800"], img: "/brands/aws-evento.jpeg" },
  { id: "fidelogist", client: "Fidelogist", title: "Reuniones C-Level con gigantes LATAM", cat: "B2B", type: "Digitals Executive", kpi: "9+", kpiLabel: "reuniones C-Level", desc: "PepsiCo, Carozzi, Copec.", colors: ["#22c55e", "#10b981"], img: "/eco/talent.jpeg" },
  { id: "hapee", client: "hapee", title: "CRM con agentes AI que cierran ventas", cat: "AI & Tech", type: "SaaS + AI Agents", kpi: "+68%", kpiLabel: "LTV", desc: "100+ clientes activos.", colors: ["#8b5cf6", "#a78bfa"], img: "/brands/hapee-podcast.jpeg" },
  { id: "simplus", client: "Simplus", title: "Funnel industrial automatizado", cat: "B2B", type: "Automatización B2B", kpi: "18+", kpiLabel: "ciudades", desc: "ROI medible en ventas.", colors: ["#3b82f6", "#60a5fa"], img: "/eco/agencia.jpeg" },
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

/* Horizontal scrollable showcase */
function HorizontalShowcase({ projects }: { projects: typeof PROJECTS }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  }, []);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    containerRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
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
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: i * 0.08 }}
          data-cursor-hover
          style={{
            flex: "0 0 420px", height: "520px",
            position: "relative", overflow: "hidden",
            borderRadius: "16px", cursor: "pointer",
          }}
          className="showcase-card"
        >
          {/* Image background */}
          <div style={{ position: "absolute", inset: 0 }}>
            <img src={p.img} alt={p.client} loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)" }}
              className="showcase-img"
            />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${p.colors[0]}cc, ${p.colors[1]}88)`, mixBlendMode: "multiply" }} />
          </div>

          {/* KPI badge */}
          <div style={{
            position: "absolute", top: "1.5rem", right: "1.5rem", zIndex: 5,
            background: "rgba(0,0,0,0.25)", backdropFilter: "blur(12px)",
            padding: "0.5rem 1rem", borderRadius: "8px",
            display: "flex", alignItems: "baseline", gap: "0.3rem",
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "#fff" }}>{p.kpi}</span>
            <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>{p.kpiLabel}</span>
          </div>

          {/* Client name — bold and visible */}
          <div style={{
            position: "absolute", top: "1.5rem", left: "1.5rem", zIndex: 5,
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "2.8rem", color: "#fff", lineHeight: 1,
            textShadow: "0 2px 20px rgba(0,0,0,0.4)",
          }}>{p.client}</div>

          {/* Info bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5,
            padding: "2rem 1.5rem",
            background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)",
          }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.4rem" }}>
              {p.type}
            </p>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", lineHeight: 1.15, color: "#fff" }}>
              {p.title}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginTop: "0.4rem" }}>
              {p.desc}
            </p>
            <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginTop: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Ver Proyecto →
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const [filter, setFilter] = useState("Selected");
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
        <a href="/" data-cursor-hover style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.12em", color: "#111", textDecoration: "none" }}>
          DIGITALS
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
        <HorizontalShowcase projects={filtered} />
      </section>

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
        .showcase-card:hover .showcase-img { transform: scale(1.08); }
        div::-webkit-scrollbar { display: none; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
