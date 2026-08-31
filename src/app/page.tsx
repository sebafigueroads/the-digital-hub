import type { Metadata } from "next";
import "./elegir.css";

/* La casa 3D se eliminó: esta ruta es ahora la bifurcación a la que llega
   quien pulsa «Portafolio» en digitals.cl. Dos destinos y nada más — sin
   escena WebGL de por medio, así que entra igual de rápido en móvil (antes
   la casa redirigía a /portfolio en pantallas ≤1024, que era un parche). */
export const metadata: Metadata = {
  title: "Portafolio Digitals | Elige cómo verlo",
  description:
    "Dos formas de recorrer el trabajo de Digitals: la vista portafolio, con las piezas y los casos ordenados, o el Museo, una galería inmersiva donde cada sala es una marca.",
};

const OPCIONES = [
  {
    href: "/portfolio",
    n: "01",
    titulo: "Vista portafolio",
    bajada:
      "Las piezas y los casos ordenados para revisar rápido: campañas, webs, video y contenido, con el cliente y el servicio de cada trabajo.",
    metas: ["Navegación directa", "Filtrable por servicio", "Carga liviana"],
    cta: "Entrar al portafolio",
    poster: "/prev-portfolio.jpg",
    alt: "Vista previa del portafolio: la grilla de piezas con sus filtros por servicio",
  },
  {
    href: "/museo-digitals",
    n: "02",
    titulo: "Vista museo",
    bajada:
      "Una galería inmersiva en 3D: cada sala es una marca, con sus piezas, sus cifras y su placa. Se recorre con scroll, sala por sala.",
    metas: ["Experiencia 3D", "Una sala por marca", "Mejor en escritorio"],
    cta: "Entrar al museo",
    poster: "/prev-museo.jpg",
    alt: "Vista previa del museo: una de las salas de la galería, con sus piezas colgadas",
  },
];

export default function ElegirVista() {
  return (
    <main className="elegir">
      <header className="elegir-hd">
        <a href="https://digitals.cl" className="elegir-marca" aria-label="Digitals, ir al sitio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-digitals-white.png" alt="Digitals" width={160} height={44} />
        </a>
        <a href="https://digitals.cl" className="elegir-volver">
          ← digitals.cl
        </a>
      </header>

      <section className="elegir-intro">
        <p className="elegir-kicker">Portafolio · Grupo Digitals</p>
        <h1 className="elegir-h1">
          Elige cómo<br />
          <em>quieres verlo.</em>
        </h1>
        <p className="elegir-sub">
          El mismo trabajo, dos recorridos distintos. Uno va al grano; el otro te
          mete dentro.
        </p>
      </section>

      <section className="elegir-g" aria-label="Formas de ver el portafolio">
        {OPCIONES.map((o) => (
          <article className="op" key={o.href}>
            <a className="op-link" href={o.href}>
              <span className="op-foto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.poster} alt={o.alt} loading="eager" />
              </span>
              <span className="op-cuerpo">
                <span className="op-n">{o.n}</span>
                <span className="op-tit">{o.titulo}</span>
                <span className="op-baj">{o.bajada}</span>
                <span className="op-metas">
                  {o.metas.map((m) => (
                    <span className="op-meta" key={m}>
                      {m}
                    </span>
                  ))}
                </span>
                <span className="op-cta">
                  {o.cta} <i aria-hidden="true">→</i>
                </span>
              </span>
            </a>
          </article>
        ))}
      </section>

      <footer className="elegir-pie">
        <span>© 2026 Grupo Digitals</span>
        <a href="mailto:contacto@digitals.cl">contacto@digitals.cl</a>
      </footer>
    </main>
  );
}
