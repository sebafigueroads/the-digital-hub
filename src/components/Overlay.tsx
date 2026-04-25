"use client";

import { RevealText, RevealBlock } from "./RevealText";

/* ────────────────────────────────────────────────────
   Overlay — all HTML sections that scroll over the
   fixed 3D canvas. Each section maps roughly to a
   camera keyframe position in Scene.tsx.
   ──────────────────────────────────────────────────── */

const SERVICES = [
  {
    title: "Estrategia Digital",
    desc: "Diseñamos roadmaps digitales que conectan la visión de tu marca con resultados medibles.",
  },
  {
    title: "Producción Audiovisual",
    desc: "Contenido cinematográfico que cuenta historias y genera impacto en cada plataforma.",
  },
  {
    title: "Desarrollo Web & Apps",
    desc: "Experiencias interactivas de alto rendimiento con las tecnologías más avanzadas.",
  },
  {
    title: "AI & Automatización",
    desc: "Integramos inteligencia artificial en cada flujo para escalar tu creatividad.",
  },
];

const WORKS = [
  { title: "ZENTRU", category: "Branding & Web" },
  { title: "Hapee Podcast", category: "Producción Audiovisual" },
  { title: "AWS Summit", category: "Evento & Cobertura" },
  { title: "AI Ad Lab", category: "Producto & AI" },
];

export function Overlay() {
  return (
    <div className="relative z-10">
      {/* ── HERO ─────────────────────────────────── */}
      <section className="section" style={{ minHeight: "110vh" }}>
        <div className="max-w-5xl mx-auto text-center">
          <RevealText
            text="The Digital Hub"
            as="h1"
            className="heading-xl justify-center"
            stagger={0.06}
          />
          <RevealBlock delay={0.5}>
            <p
              className="heading-md mt-6"
              style={{ color: "var(--color-accent)" }}
            >
              Casa Creativa
            </p>
          </RevealBlock>
          <RevealBlock delay={0.8}>
            <p className="body-lg mt-4 max-w-2xl mx-auto">
              Donde la creatividad se encuentra con la tecnología.
              <br />
              Un estudio digital de nueva generación.
            </p>
          </RevealBlock>
          <RevealBlock delay={1.1}>
            <div className="mt-10 flex gap-4 justify-center">
              <a
                href="#trabajo"
                data-cursor-hover
                className="inline-block px-8 py-3 border border-[var(--color-accent)] text-[var(--color-accent)] font-[family-name:var(--font-display)] font-semibold tracking-wide text-sm uppercase hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-colors duration-300"
              >
                Ver Proyectos
              </a>
              <a
                href="#contacto"
                data-cursor-hover
                className="inline-block px-8 py-3 border border-white/20 text-white/70 font-[family-name:var(--font-display)] font-semibold tracking-wide text-sm uppercase hover:border-white/60 hover:text-white transition-colors duration-300"
              >
                Hablemos
              </a>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────── */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <RevealText
            text="Somos Digitals"
            as="h2"
            className="heading-lg"
          />
          <RevealBlock delay={0.3}>
            <p className="body-lg mt-8 max-w-2xl">
              Somos un estudio creativo-tecnológico con base en Chile.
              Combinamos estrategia, diseño, desarrollo y producción
              audiovisual con inteligencia artificial para crear
              experiencias digitales que transforman marcas.
            </p>
          </RevealBlock>
          <RevealBlock delay={0.5}>
            <div className="mt-12 grid grid-cols-3 gap-8 text-center">
              {[
                { num: "50+", label: "Proyectos" },
                { num: "12", label: "Países" },
                { num: "∞", label: "Ideas" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p
                    className="heading-lg"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {stat.num}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────── */}
      <section className="section">
        <div className="max-w-5xl mx-auto w-full">
          <RevealText
            text="Lo Que Hacemos"
            as="h2"
            className="heading-lg mb-16"
          />
          <div className="grid md:grid-cols-2 gap-8">
            {SERVICES.map((s, i) => (
              <RevealBlock key={s.title} delay={i * 0.15}>
                <div
                  data-cursor-hover
                  className="group p-8 border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-[var(--color-accent)]/30 hover:bg-white/[0.04] transition-all duration-500"
                >
                  <p
                    className="text-xs font-mono mb-3"
                    style={{ color: "var(--color-accent)" }}
                  >
                    0{i + 1}
                  </p>
                  <h3 className="heading-md">{s.title}</h3>
                  <p className="body-lg mt-3 text-sm">{s.desc}</p>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORK ─────────────────────────────────── */}
      <section id="trabajo" className="section">
        <div className="max-w-5xl mx-auto w-full">
          <RevealText
            text="Trabajo Seleccionado"
            as="h2"
            className="heading-lg mb-16"
          />
          <div className="space-y-1">
            {WORKS.map((w, i) => (
              <RevealBlock key={w.title} delay={i * 0.12}>
                <a
                  href="#"
                  data-cursor-hover
                  className="group flex items-center justify-between py-8 border-b border-white/5 hover:border-[var(--color-accent)]/20 transition-colors duration-300"
                >
                  <div>
                    <h3 className="heading-md group-hover:text-[var(--color-accent)] transition-colors duration-300">
                      {w.title}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {w.category}
                    </p>
                  </div>
                  <span
                    className="text-2xl opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                    style={{ color: "var(--color-accent)" }}
                  >
                    &rarr;
                  </span>
                </a>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────── */}
      <section id="contacto" className="section">
        <div className="max-w-4xl mx-auto text-center">
          <RevealText
            text="Creemos Algo Juntos"
            as="h2"
            className="heading-xl justify-center"
            stagger={0.06}
          />
          <RevealBlock delay={0.4}>
            <p className="body-lg mt-6 max-w-xl mx-auto">
              ¿Tenés un proyecto en mente? Nos encantaría escucharte.
              Cada gran idea empieza con una conversación.
            </p>
          </RevealBlock>
          <RevealBlock delay={0.7}>
            <a
              href="mailto:hola@digitals.cl"
              data-cursor-hover
              className="inline-block mt-10 px-12 py-4 bg-[var(--color-accent)] text-[var(--color-bg)] font-[family-name:var(--font-display)] font-bold tracking-wider text-lg uppercase hover:scale-105 transition-transform duration-300"
            >
              hola@digitals.cl
            </a>
          </RevealBlock>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer className="py-12 px-8 text-center relative z-10">
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
          &copy; {new Date().getFullYear()} Digitals. Todos los derechos
          reservados.
        </p>
      </footer>
    </div>
  );
}
