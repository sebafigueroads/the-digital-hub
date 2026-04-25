"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll } from "@react-three/drei";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { HubObject } from "./HubObject";
import { Loader } from "./Loader";

const PAGES = 10;

/* ═══════════════════════════════════════════════════════
   CAMERA PATH

   0–25%   Exterior — drone approach
   25–40%  Transition — entering the building
   40–100% Interior — exploring the hub
   ═══════════════════════════════════════════════════════ */
const KF = [
  // — EXTERIOR: drone approach —
  { t: 0.0,  px: 0,  py: 1,   pz: 26,  lx: 0, ly: 1.5,lz: 0.5 },  // looking at building sign
  { t: 0.1,  px: 0.8,py: 0.5, pz: 20,  lx: 0, ly: 1.2,lz: 0.5 },
  { t: 0.2,  px:-0.3,py: 1,   pz: 15,  lx: 0, ly: 1.5,lz: 0.5 },
  // — TRANSITION: straight into the "Digitals" sign —
  { t: 0.27, px: 0,  py: 1.5, pz: 11,  lx: 0, ly: 1.5,lz: 0.5 },  // centered on logo
  { t: 0.34, px: 0,  py: 1.5, pz: 7,   lx: 0, ly: 1.5,lz: 0.5 },  // diving into logo
  { t: 0.41, px: 0,  py: 1.5, pz: 5,   lx: 0, ly: 1.5,lz: 0.5 },  // through the sign
  // — INTERIOR: emerge and explore —
  { t: 0.50, px: 0,  py: 1,   pz: 12,  lx: 0, ly: 1,  lz: 0.5 },  // inside, pulling back
  { t: 0.60, px:-2,  py: 1.5, pz: 11,  lx: 0, ly: 1,  lz: 0.8 },  // orbit left
  { t: 0.70, px: 2,  py: 0,   pz: 12,  lx: 0, ly: 0.5,lz: 0.8 },  // orbit right
  { t: 0.80, px: 0,  py: 2.5, pz: 14,  lx: 0, ly: 0.5,lz: 0.5 },  // bird's eye
  { t: 0.90, px:-1.2,py: 1,   pz: 11,  lx: 0, ly: 1,  lz: 0.8 },  // close orbit
  { t: 1.0,  px: 0,  py: 1,   pz: 22,  lx: 0, ly: 1,  lz: 0.5 },  // final wide
];

function smoothstep(x: number) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function interpCamera(t: number) {
  let i = 0;
  for (; i < KF.length - 2; i++) {
    if (t <= KF[i + 1].t) break;
  }
  const a = KF[i], b = KF[i + 1];
  const e = smoothstep((t - a.t) / (b.t - a.t));
  const lerp = (u: number, v: number) => u + (v - u) * e;
  return { px: lerp(a.px, b.px), py: lerp(a.py, b.py), pz: lerp(a.pz, b.pz), lx: lerp(a.lx, b.lx), ly: lerp(a.ly, b.ly), lz: lerp(a.lz, b.lz) };
}

function CameraRig() {
  const scroll = useScroll();
  const { camera } = useThree();
  const sOff = useRef(0);
  const sMx = useRef(0);
  const sMy = useRef(0);
  useFrame(() => {
    sOff.current = THREE.MathUtils.lerp(sOff.current, scroll.offset, 0.035);
    sMx.current = THREE.MathUtils.lerp(sMx.current, store.mouseX, 0.04);
    sMy.current = THREE.MathUtils.lerp(sMy.current, store.mouseY, 0.04);
    const c = interpCamera(sOff.current);
    const p = Math.max(0.2, 1 - c.pz / 26);
    camera.position.set(c.px + sMx.current * 0.8 * p, c.py + sMy.current * 0.4 * p, c.pz);
    camera.lookAt(c.lx, c.ly, c.lz);
  });
  return null;
}

function Lighting() {
  const main = useRef<THREE.PointLight>(null);
  const mx = useRef(0);
  const my = useRef(0);
  useFrame(() => {
    mx.current = THREE.MathUtils.lerp(mx.current, store.mouseX * 8, 0.035);
    my.current = THREE.MathUtils.lerp(my.current, store.mouseY * 6, 0.035);
    if (main.current) main.current.position.set(mx.current, my.current + 3, 10);
  });
  return (
    <>
      <ambientLight intensity={0.3} color="#eeddcc" />
      <pointLight ref={main} intensity={2.5} distance={35} decay={2} color="#ffffff" />
      <pointLight position={[0, 10, 6]} intensity={1} distance={30} decay={2} color="#ffeecc" />
      <pointLight position={[-6, 0, 5]} intensity={0.6} distance={20} decay={2} color="#ff4444" />
      <pointLight position={[3, 0, 5]} intensity={0.6} distance={20} decay={2} color="#4488ff" />
      <pointLight position={[6, 0, 5]} intensity={0.6} distance={20} decay={2} color="#ffaa00" />
    </>
  );
}

function Particles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const pal = [[1,.25,.25],[1,.6,0],[.95,.95,0],[.2,.85,.3],[.25,.55,1],[.65,.2,1]];
    for (let i = 0; i < count; i++) {
      pos[i*3]=(Math.random()-.5)*28; pos[i*3+1]=(Math.random()-.5)*20; pos[i*3+2]=Math.random()*12+2;
      const c=pal[Math.floor(Math.random()*pal.length)];
      col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
    }
    return { positions: pos, colors: col };
  }, [count]);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.003) * 0.02; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.5} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   ScrollSection — fade in/out based on scroll position
   ═══════════════════════════════════════════════════════ */
function ScrollSection({ children, page, align = "center" }: { children: React.ReactNode; page: number; align?: "center" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useScroll();
  useFrame(() => {
    if (!ref.current) return;
    const center = (page + 0.5) / PAGES;
    const dist = Math.abs(scroll.offset - center) * PAGES;
    const opacity = Math.max(0, Math.min(1, 1 - (dist - 0.25) * 3));
    const dir = scroll.offset < center ? 1 : -1;
    const slideY = dist > 0.2 ? dir * (dist - 0.2) * 100 : 0;
    const blur = dist > 0.35 ? (dist - 0.35) * 20 : 0;
    ref.current.style.opacity = String(opacity);
    ref.current.style.transform = `translateY(${slideY}px)`;
    ref.current.style.filter = blur > 0.5 ? `blur(${blur}px)` : "none";
  });
  return (
    <div ref={ref} style={{ position: "absolute", top: `${page * 100}vh`, left: 0, width: "100%", height: "100vh", display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center", justifyContent: "center", padding: "3rem clamp(2rem, 6vw, 5rem)", opacity: 0, willChange: "transform, opacity, filter", pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto", maxWidth: "68rem", width: "100%" }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PORTFOLIO DATA
   ═══════════════════════════════════════════════════════ */
const SERVICES = [
  { n: "01", icon: "📱", title: "Social Media & RRSS", desc: "Estrategia de contenido, community management, crecimiento orgánico. +12K seguidores en 4 meses." },
  { n: "02", icon: "🎯", title: "Paid Media & Full Funnel", desc: "Meta, Google, LinkedIn, TikTok. Tracking avanzado con pixel, CAPI y GTM. 4.2x ROAS." },
  { n: "03", icon: "🤝", title: "Digitals Executive", desc: "Prospección B2B, autoridad LinkedIn, reuniones C-Level. 9+ reuniones/mes con decisores." },
  { n: "04", icon: "🤖", title: "AI & Automatización", desc: "Agentes conversacionales, RAG pipelines, Voice AI, automatización CRM. +35% conversión." },
];

const CASES = [
  { name: "AJINOMOTO", cat: "FMCG · Estrategia Orgánica", kpi: "+320% engagement", desc: "Adaptación de marca global al mercado chileno. 3.8M personas alcanzadas, presencia en retail." },
  { name: "SACYR", cat: "Infraestructura · Reputation Management", kpi: "10K+ incidencias/mes", desc: "4+ años de alianza estratégica. Monitoreo 24/7 de 7+ concesiones con escucha social." },
  { name: "DEVELON", cat: "Maquinaria · Performance Digital", kpi: "+40% crecimiento comercial", desc: "Transición de marca Hyundai → Develon. 960K impresiones mensuales, +25% calidad de leads." },
  { name: "FIDELOGIST", cat: "Logística · B2B Executive", kpi: "9+ reuniones C-Level/mes", desc: "Modelo híbrido Digitals Executive. Cuentas clave: PepsiCo, Carozzi, Unilever, Copec." },
  { name: "SIMPLUS", cat: "Industrial · Automatización", kpi: "100% funnel automatizado", desc: "Captura de demanda industrial automatizada. 18+ ciudades, ROI medible en cierre de ventas." },
];

const ECOSYSTEM = [
  { name: "Agencia", desc: "Performance 360: contenido, pauta, funnels, AI", color: "#ff4444" },
  { name: "Executive", desc: "Prospección B2B y autoridad LinkedIn", color: "#ff8800" },
  { name: "Linkd", desc: "Tarjeta de contacto NFC inteligente", color: "#ffcc00" },
  { name: "hapee", desc: "CRM + automatización + agentes AI", color: "#44cc44" },
  { name: "Academy", desc: "Workshops, webinars y capacitación", color: "#4488ff" },
  { name: "Talent", desc: "Gestión de creators e influencers", color: "#8844ff" },
  { name: "Zentru", desc: "Automatización interna con AI", color: "#ff44aa" },
];

const TESTIMONIALS = [
  { quote: "Digitals marcó la diferencia en posicionamiento y creatividad. Trabajo flexible, adaptativo y de alta calidad.", name: "Natalia Marambio", role: "Prensa y Contenido · Sacyr" },
  { quote: "Gran equipo humano. Generaron ventas online y presenciales. Constantemente atentos. 100% recomendable.", name: "Andrés Villaseca", role: "CEO · Vinolia" },
  { quote: "Experiencia muy positiva. Guía comprometida en estrategia digital y social. Atención personalizada clave.", name: "Jens Lehman", role: "Marketing Manager · Mundomed" },
];

/* ═══════════════════════════════════════════════════════
   SCENE
   ═══════════════════════════════════════════════════════ */
export default function Scene() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1 }}>
      <Canvas camera={{ fov: 55, near: 0.1, far: 120, position: [0, 1, 26] }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} dpr={[1, 1.5]}>
        <Suspense fallback={<Loader />}>
          <color attach="background" args={["#0a0806"]} />
          <fog attach="fog" args={["#0a0806", 22, 50]} />

          <ScrollControls pages={PAGES} damping={0.3}>
            <CameraRig />
            <Lighting />
            <HubObject />
            <Particles />

            <Scroll html style={{ width: "100%" }}>

              {/* ── PAGE 0: HERO ──────────────────────── */}
              <ScrollSection page={0} align="center">
                <div style={{ textAlign: "center" }}>
                  <h1 className="heading-xl" style={{ justifyContent: "center" }}>The Digital Hub</h1>
                  <p className="heading-md" style={{ color: "var(--color-accent)", marginTop: "0.75rem" }}>Casa Creativa · Portafolio Digital</p>
                  <p className="body-lg" style={{ marginTop: "1.25rem", maxWidth: "34rem", margin: "1.25rem auto 0" }}>
                    Donde la creatividad se encuentra con la tecnología.
                  </p>
                  <p style={{ marginTop: "2.5rem", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)" }}>
                    scroll para explorar ↓
                  </p>
                </div>
              </ScrollSection>

              {/* ── PAGE 1: STATS (holo screen) ──────── */}
              <ScrollSection page={1} align="center">
                <div className="holo-screen" style={{ maxWidth: "52rem", margin: "0 auto", textAlign: "center" }}>
                  <span className="holo-label">SYS::METRICS</span>
                  <div className="holo-corner tl" /><div className="holo-corner tr" /><div className="holo-corner bl" /><div className="holo-corner br" />
                  <p className="heading-md" style={{ color: "rgba(0,212,255,0.7)", marginBottom: "2rem" }}>Performance en Tiempo Real</p>
                  <div style={{ display: "flex", gap: "clamp(2rem, 5vw, 5rem)", justifyContent: "center", flexWrap: "wrap" }}>
                    {[
                      { n: "60+", l: "Clientes Activos" },
                      { n: "4.2x", l: "ROAS Promedio" },
                      { n: "7", l: "Unidades de Negocio" },
                      { n: "12", l: "Países" },
                    ].map((s) => (
                      <div key={s.l} style={{ minWidth: "100px" }}>
                        <p className="heading-lg" style={{ color: "var(--color-accent)" }}>{s.n}</p>
                        <p style={{ fontSize: "0.7rem", color: "rgba(0,212,255,0.5)", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>

              {/* ── PAGE 2: ENTER THE HUB ────────────── */}
              <ScrollSection page={2} align="center">
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: "1rem" }}>Bienvenido</p>
                  <h2 className="heading-xl" style={{ justifyContent: "center" }}>Entra al Hub</h2>
                </div>
              </ScrollSection>

              {/* ── PAGE 3: BREATHING ROOM (interior reveals) ── */}
              <ScrollSection page={3} align="center">
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(140,235,255,0.5)" }}>
                    Bienvenido al Hub
                  </p>
                </div>
              </ScrollSection>

              {/* ── PAGE 4: SERVICES (holo) ─────────────── */}
              <ScrollSection page={4} align="left">
                <div className="holo-screen" style={{ maxWidth: "58rem" }}>
                  <span className="holo-label">SYS::SERVICIOS</span>
                  <div className="holo-corner tl" /><div className="holo-corner tr" /><div className="holo-corner bl" /><div className="holo-corner br" />
                  <h2 className="heading-lg" style={{ marginBottom: "1.5rem" }}>Lo Que Hacemos</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                    {SERVICES.map((s) => (
                      <div key={s.n} data-cursor-hover style={{ padding: "1rem", border: "1px solid rgba(140,235,255,0.08)", background: "rgba(140,235,255,0.02)", transition: "border-color 0.3s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "rgba(140,235,255,0.6)" }}>{s.n}</span>
                          <span style={{ fontSize: "1rem" }}>{s.icon}</span>
                        </div>
                        <h3 className="heading-md">{s.title}</h3>
                        <p style={{ fontSize: "0.78rem", color: "rgba(240,240,245,0.45)", marginTop: "0.3rem", lineHeight: 1.5 }}>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>

              {/* ── PAGE 5: CASES (holo) ────────────────── */}
              <ScrollSection page={5} align="left">
                <div className="holo-screen" style={{ maxWidth: "58rem" }}>
                  <span className="holo-label">SYS::CASOS</span>
                  <div className="holo-corner tl" /><div className="holo-corner tr" /><div className="holo-corner bl" /><div className="holo-corner br" />
                  <h2 className="heading-lg" style={{ marginBottom: "1.5rem" }}>Casos de Éxito</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {CASES.map((c) => (
                      <div key={c.name} data-cursor-hover style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1rem 1.25rem", border: "1px solid rgba(140,235,255,0.06)", background: "rgba(140,235,255,0.015)", transition: "border-color 0.3s" }}>
                        <div style={{ minWidth: "90px" }}>
                          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(0.9rem, 1.8vw, 1.3rem)" }}>{c.name}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(140,235,255,0.45)" }}>{c.cat}</p>
                          <p style={{ fontSize: "0.78rem", color: "rgba(240,240,245,0.5)", marginTop: "0.15rem", lineHeight: 1.4 }}>{c.desc}</p>
                        </div>
                        <div style={{ minWidth: "fit-content", textAlign: "right" }}>
                          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", color: "var(--color-accent)" }}>{c.kpi}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>

              {/* ── PAGE 6: ECOSYSTEM (holo) ──────────── */}
              <ScrollSection page={6} align="center">
                <div className="holo-screen" style={{ maxWidth: "56rem", margin: "0 auto", textAlign: "center" }}>
                  <span className="holo-label">SYS::ECOSISTEMA</span>
                  <div className="holo-corner tl" /><div className="holo-corner tr" /><div className="holo-corner bl" /><div className="holo-corner br" />
                  <h2 className="heading-lg" style={{ marginBottom: "2rem" }}>7 Unidades, 1 Visión</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", justifyContent: "center" }}>
                    {ECOSYSTEM.map((e) => (
                      <div key={e.name} data-cursor-hover style={{ padding: "0.85rem 1.25rem", border: "1px solid rgba(140,235,255,0.08)", background: "rgba(140,235,255,0.015)", minWidth: "170px", textAlign: "left" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: e.color, marginBottom: "0.4rem", boxShadow: `0 0 8px ${e.color}` }} />
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem" }}>{e.name}</p>
                        <p style={{ fontSize: "0.7rem", color: "rgba(240,240,245,0.4)", marginTop: "0.15rem" }}>{e.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>

              {/* ── PAGE 7: SHOWCASE (holo) ─────────────── */}
              <ScrollSection page={7} align="center">
                <div className="holo-screen" style={{ maxWidth: "62rem", margin: "0 auto" }}>
                  <span className="holo-label">SYS::SHOWCASE</span>
                  <div className="holo-corner tl" /><div className="holo-corner tr" /><div className="holo-corner bl" /><div className="holo-corner br" />
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h2 className="heading-lg">Nuestro Portafolio</h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                    {[
                      { name: "Ajinomoto", kpi: "+320%", metric: "Engagement", cat: "FMCG", desc: "3.8M alcance, presencia en retail nacional" },
                      { name: "Sacyr", kpi: "10K+", metric: "Incidencias/mes", cat: "Infraestructura", desc: "4+ años, monitoreo 24/7 de 7 concesiones" },
                      { name: "Develon", kpi: "+40%", metric: "Crecimiento", cat: "Maquinaria", desc: "960K impresiones, transición de marca global" },
                      { name: "Fidelogist", kpi: "9+", metric: "Reuniones C-Level", cat: "Logística B2B", desc: "PepsiCo, Carozzi, Unilever, Copec" },
                      { name: "Simplus", kpi: "100%", metric: "Automatizado", cat: "Industrial", desc: "18+ ciudades, ROI medible en ventas" },
                      { name: "hapee", kpi: "+68%", metric: "LTV", cat: "SaaS & AI", desc: "CRM + agentes AI, 100+ clientes activos" },
                    ].map((p) => (
                      <div key={p.name} data-cursor-hover style={{ padding: "1.25rem", border: "1px solid rgba(140,235,255,0.12)", background: "rgba(140,235,255,0.03)", transition: "all 0.3s" }}>
                        <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(140,235,255,0.5)", marginBottom: "0.3rem" }}>{p.cat}</p>
                        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem" }}>{p.name}</h3>
                        <div style={{ margin: "0.75rem 0", display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.8rem", color: "var(--color-accent)", lineHeight: 1 }}>{p.kpi}</span>
                          <span style={{ fontSize: "0.65rem", color: "rgba(140,235,255,0.5)", textTransform: "uppercase" }}>{p.metric}</span>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "rgba(240,240,245,0.45)", lineHeight: 1.4 }}>{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>

              {/* ── PAGE 8: TESTIMONIALS (holo) ─────── */}
              <ScrollSection page={8} align="center">
                <div className="holo-screen" style={{ maxWidth: "58rem", margin: "0 auto", textAlign: "center" }}>
                  <span className="holo-label">SYS::TESTIMONIOS</span>
                  <div className="holo-corner tl" /><div className="holo-corner tr" /><div className="holo-corner bl" /><div className="holo-corner br" />
                  <h2 className="heading-lg" style={{ marginBottom: "2rem" }}>Nuestros Clientes</h2>
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                    {TESTIMONIALS.map((t) => (
                      <div key={t.name} style={{ flex: "1 1 240px", maxWidth: "300px", padding: "1.25rem", border: "1px solid rgba(140,235,255,0.12)", background: "rgba(140,235,255,0.03)", textAlign: "left" }}>
                        <p style={{ fontSize: "0.82rem", color: "rgba(240,240,245,0.65)", lineHeight: 1.6, fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
                        <div style={{ marginTop: "0.75rem", borderTop: "1px solid rgba(140,235,255,0.15)", paddingTop: "0.6rem" }}>
                          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.82rem" }}>{t.name}</p>
                          <p style={{ fontSize: "0.65rem", color: "rgba(140,235,255,0.5)", marginTop: "0.1rem" }}>{t.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>

              {/* ── PAGE 9: PORTAL BUTTON ───────────────── */}
              <ScrollSection page={9} align="center">
                <div style={{ textAlign: "center" }}>
                  <p className="body-lg" style={{ marginBottom: "2rem", maxWidth: "28rem", margin: "0 auto 2rem" }}>
                    Explora nuestros proyectos en detalle
                  </p>
                  <button
                    data-cursor-hover
                    className="portal-btn"
                    onClick={() => {
                      document.body.classList.add("zoom-portal");
                      setTimeout(() => { window.location.href = "/portfolio"; }, 900);
                    }}
                  >
                    <span className="portal-btn-glow" />
                    <span className="portal-btn-text">Ir al Portafolio</span>
                  </button>
                  <p style={{ marginTop: "3rem", fontSize: "0.6rem", color: "rgba(140,235,255,0.3)" }}>
                    © {new Date().getFullYear()} Digitals · Google Premier Partner · Meta Business Partner
                  </p>
                </div>
              </ScrollSection>

            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
