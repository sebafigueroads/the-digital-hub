// ═══════════════════════════════════════════════════════════════
// V3 · Datos del recorrido — el MUSEO SHOWCASE DIGITALS se organiza
// POR CLIENTE. Cada sala = una marca real: nombre gigante dorado,
// sus piezas con NOMBRE PROPIO (videos del server con poster real,
// fotos de /exitos) y su PLACA-KPI de museo con cifras reales.
// Orden y mapping dictados por el dueño — iPhone Up jamás primero.
// Todas las rutas fueron verificadas contra public/ — jamás rotas.
// También vive aquí el rail de cámara (keyframes z) y su inversa
// tForZ() para menú/ticks de progreso.
// ═══════════════════════════════════════════════════════════════

import type { LightboxItem } from "./lightboxBus";

export type PieceKind = "video" | "photo" | "plate";

export type Piece = {
  id: string;
  kind: PieceKind;
  /** mp4 para video · imagen para photo */
  src?: string;
  /** poster jpg pre-generado (siempre presente en videos) */
  poster?: string;
  w: number;
  h: number;
  z: number;
  side: -1 | 1;
  title: string;
  sub?: string;
  /** kicker del plate canvas (solo kind: plate) */
  plateKicker?: string;
  /** cifras estructuradas de la placa: [0] = héroe, resto = filas (solo kind: plate) */
  stats?: { v: string; l: string }[];
  /** chip de servicio de la placa (pill dorada) */
  chip?: string;
};

export type Hall = {
  id: string;
  name: string;
  kicker: string;
  tagline: string;
  wordZ: number;
  compact?: boolean;
  pieces: Piece[];
};

/* ── Tamaños por aspecto real (verificado en posters/ y /exitos) ── */
const V_W = 1.56, V_H = 2.77;   // reel 9:16 (640×1134/1138)
const H_W = 3.2,  H_H = 1.8;    // pieza 16:9 (640×360)
const S_W = 2.1,  S_H = 2.8;    // 3:4 (nova-group-linkedin-aesthetic 640×854, develon.jpeg)
const Q_W = 2.3,  Q_H = 2.3;    // cuadrado (la-oferta-street 640×640)
const P_W = 2.06, P_H = 2.76;   // fotos /exitos 896×1200 (3:4)
const PL_W = 2.95, PL_H = 2.21; // placa-KPI dorada de museo

const vid = (n: string) => `/portfolio-material/${n}.mp4`;
const pos = (n: string) => `/portfolio-material/posters/${n}.jpg`;

/** reel vertical 9:16 */
function v(id: string, n: string, z: number, side: -1 | 1, title: string, sub?: string): Piece {
  return { id, kind: "video", src: vid(n), poster: pos(n), w: V_W, h: V_H, z, side, title, sub };
}
/** pieza horizontal 16:9 */
function hv(id: string, n: string, z: number, side: -1 | 1, title: string, sub?: string): Piece {
  return { id, kind: "video", src: vid(n), poster: pos(n), w: H_W, h: H_H, z, side, title, sub };
}
/** foto de /exitos (3:4) */
function photo(id: string, src: string, z: number, side: -1 | 1, title: string, sub?: string): Piece {
  return { id, kind: "photo", src, w: P_W, h: P_H, z, side, title, sub };
}
/** placa-KPI de museo con jerarquía: stats[0] = cifra héroe, resto = filas; chip = servicio */
function plate(
  id: string,
  z: number,
  side: -1 | 1,
  kicker: string,
  stats: { v: string; l: string }[],
  chip?: string
): Piece {
  return {
    id,
    kind: "plate",
    w: PL_W,
    h: PL_H,
    z,
    side,
    title: stats[0].v,
    sub: stats.map((s) => `${s.v} ${s.l}`).join(" · "),
    plateKicker: kicker,
    stats,
    chip,
  };
}

/* ═══════════════ LAS 17 SALAS (orden dictado) ═══════════════ */
export const HALLS: Hall[] = [
  {
    id: "develon",
    name: "Develon",
    kicker: "01 · SALA",
    tagline: "Dominio digital en maquinaria pesada",
    wordZ: -16,
    pieces: [
      v("develon-ads", "develon-ads", -20, -1, "Ads · Maquinaria en campaña", "Performance con línea pesada real"),
      v("develon-ig", "develon-instagram", -24, 1, "Instagram · Develon", "La marca en el feed, sin stock"),
      photo("develon-foto", "/exitos/develon.jpeg", -28, -1, "Dominio digital", "Maquinaria pesada que llena la pantalla"),
      v("develon-ig2", "develon-instagram-2", -32, 1, "Instagram · Serie Develon", "Segunda pieza social del caso"),
      v("develon-rrss", "develon-rrss", -36, -1, "RRSS · Develon", "Contenido de redes en terreno"),
      plate("develon-kpi", -40, 1, "DEVELON / HYUNDAI", [
        { v: "+40%", l: "crecimiento comercial en 2 años" },
        { v: "+35%", l: "conversiones anuales 2024-2026" },
        { v: "+960K", l: "impresiones" },
      ]),
    ],
  },
  {
    id: "ajinomoto",
    name: "Ajinomoto",
    kicker: "02 · SALA",
    tagline: "De marca desconocida a viral en Chile",
    wordZ: -48,
    pieces: [
      v("aji-animado", "ajinomoto-animado", -52, -1, "Animado · Ajinomoto", "La marca en animación, lista para viralizar"),
      v("aji-ugc", "ajinomoto-ugc", -56, 1, "UGC · Ajinomoto", "Creadores reales, cocina real"),
      photo("aji-foto", "/exitos/ajinomoto.jpeg", -60, -1, "Viral en Chile", "De marca desconocida a fenómeno local"),
      plate("aji-kpi", -64, 1, "AJINOMOTO", [
        { v: "14,4M", l: "alcance total" },
        { v: "5,9%", l: "engagement rate" },
        { v: "TOTTUS · LÍDER", l: "penetración en retail" },
      ], "DE DESCONOCIDA A VIRAL EN CHILE"),
    ],
  },
  {
    id: "simplus",
    name: "Simplus",
    kicker: "03 · SALA",
    tagline: "Embudo industrial automatizado · Turbus · Grupo GTP",
    wordZ: -72,
    pieces: [
      v("simplus-1", "simplus-turbus", -76, -1, "Simplus × Turbus", "El embudo de captación en cámara"),
      hv("simplus-2", "simplus-turbus-2", -80, 1, "Simplus × Turbus · II", "Cobertura nacional en video"),
      photo("simplus-foto", "/exitos/simplus.jpeg", -84, -1, "Captación industrial", "Automatización con impacto en ventas"),
      plate("simplus-kpi", -88, 1, "SIMPLUS · TURBUS · GRUPO GTP", [
        { v: "100%", l: "embudo de captación industrial automatizado" },
        { v: "NACIONAL", l: "cobertura del embudo" },
      ], "CIERRE DE VENTAS A GRAN ESCALA"),
    ],
  },
  {
    id: "sacyr",
    name: "Sacyr",
    kicker: "04 · SALA",
    tagline: "Infraestructura crítica, monitoreo 24/7",
    wordZ: -96,
    pieces: [
      photo("sacyr-foto", "/exitos/sacyr.png", -100, -1, "Infraestructura crítica", "Comunicación digital de obra mayor"),
      plate("sacyr-kpi", -104, 1, "SACYR", [
        { v: "+260%", l: "engagement y seguidores en 6 meses" },
      ]),
      plate("sacyr-247", -108, -1, "SACYR", [
        { v: "24/7", l: "atención y monitoreo de infraestructura crítica" },
      ], "COMUNICACIÓN DE OBRA MAYOR"),
    ],
  },
  {
    id: "integrakin",
    name: "Integrakin",
    kicker: "05 · SALA",
    tagline: "Skincare profesional · UGC y producto",
    wordZ: -116,
    pieces: [
      v("intk-ugc", "integrakin-ugc", -120, -1, "UGC · Integrakin", "Piel real, resultados reales"),
      v("intk-skinxpert", "integrakin-skinxpert", -124, 1, "SkinXpert", "Contenido de producto profesional"),
      v("intk-sanvalentin", "integrakin-san-valentin", -128, -1, "San Valentín", "Campaña estacional de la marca"),
      plate("intk-kpi", -132, 1, "INTEGRAKIN", [
        { v: "+180%", l: "engagement" },
        { v: "+67%", l: "seguidores · sostenido mensual" },
        { v: "+30%", l: "ventas 2024-2025" },
      ]),
    ],
  },
  {
    id: "dellanatura",
    name: "Dellanatura",
    kicker: "06 · SALA",
    tagline: "E-commerce y branding orgánico",
    wordZ: -140,
    pieces: [
      v("della-mall", "dellanatura-mall", -144, -1, "Dellanatura · Mall", "La marca natural en el punto de venta"),
      v("della-spot1", "dellanatura-spot-1", -148, 1, "Spot · Dellanatura", "El spot principal de la marca"),
      v("della-snacks", "dellanatura-snacks", -152, -1, "Snacks · Dellanatura", "La línea de snacks en cámara"),
      v("della-spot2", "dellanatura-spot-2", -156, 1, "Spot · Serie II", "Segunda pieza de la campaña"),
      plate("della-kpi", -160, -1, "DELLANATURA", [
        { v: "+30%", l: "crecimiento mensual sostenido en seguidores" },
        { v: ">6%", l: "engagement rate" },
      ], "BRANDING · REDES · COMUNIDAD"),
    ],
  },
  {
    id: "heli",
    name: "Heli Fork Lift",
    kicker: "07 · SALA",
    tagline: "Grúas horquilla que mueven Chile",
    wordZ: -168,
    pieces: [
      v("heli-chile", "heli-chile", -172, -1, "B2B Corporate · Heli Chile", "La marca industrial, en serio"),
      v("heli-electric", "heli-electric", -176, 1, "Heli Electric", "La línea eléctrica en escena"),
      v("heli-exponor", "heli-exponor-pro", -180, -1, "EXPONOR · PRO", "Producción PRO para la feria"),
      { id: "heli-linkedin", kind: "video", src: vid("nova-group-linkedin-aesthetic"), poster: pos("nova-group-linkedin-aesthetic"), w: S_W, h: S_H, z: -184, side: 1, title: "LinkedIn Aesthetic", sub: "Pieza B2B para LinkedIn" },
      plate("heli-kpi", -188, -1, "HELI FORK LIFT", [
        { v: "+80%", l: "clientes potenciales" },
        { v: "+45%", l: "lead quality score" },
      ], "AUTOMATIZACIÓN VÍA HAPEE"),
    ],
  },
  /* ── warp: z -192 → -228 ── */
  {
    id: "otravista",
    name: "OtraVista",
    kicker: "08 · SALA",
    tagline: "Revestimientos y terrazas · brand films",
    wordZ: -232,
    compact: true,
    pieces: [
      hv("otv-hero", "otra-vista", -235, -1, "Brand film · OtraVista", "Revestimientos en primer plano"),
      v("otv-terraza", "otra-vista-terraza", -238, 1, "Terrazas de cristal", "El resultado instalado, en vertical"),
      v("otv-chile", "otra-vista-chile", -241, -1, "OtraVista Chile", "La marca en su mercado"),
      hv("otv-4d", "otra-vista-effecting-4d", -244, 1, "Effecting 4D", "Postproducción con efectos"),
      plate("otv-kpi", -247, -1, "OTRAVISTA", [
        { v: "+30%", l: "conversiones en ventas e-commerce" },
      ], "AUTOMATIZACIÓN 100% VÍA HAPEE"),
    ],
  },
  {
    id: "la-estampa",
    name: "La Estampa",
    kicker: "09 · SALA",
    tagline: "Textil que viste marcas",
    wordZ: -252,
    compact: true,
    pieces: [
      hv("estampa-hero", "la-estampa-hero", -255, 1, "Brand film · La Estampa", "Producción textil en cámara"),
      v("estampa-fx", "la-estampa-instagram-effecting", -258, -1, "Instagram · Effecting", "El estampado, con efectos"),
      plate("estampa-kpi", -261, 1, "LA ESTAMPA", [
        { v: "+40%", l: "lead quality score" },
        { v: "+25%", l: "conversiones" },
      ], "AUTOMATIZACIÓN 100% VÍA HAPEE"),
    ],
  },
  {
    id: "don-locker",
    name: "Don Locker",
    kicker: "10 · SALA",
    tagline: "Organiza tus espacios",
    wordZ: -266,
    compact: true,
    pieces: [
      v("locker-ig", "don-locker-instagram", -269, -1, "Instagram · Don Locker", "Storage con personalidad"),
      hv("locker-wow", "don-locker-wow-effect", -272, 1, "Wow Effect", "El claim hecho efecto"),
      plate("locker-kpi", -275, -1, "DON LOCKER", [
        { v: "+32%", l: "conversiones" },
      ], "GOOGLE ADS + GESTIÓN DE BRANDING"),
    ],
  },
  {
    id: "nova",
    name: "Nova",
    kicker: "11 · SALA",
    tagline: "Contenido que enciende la marca",
    wordZ: -280,
    compact: true,
    pieces: [
      hv("nova-promo", "nova-promo", -283, 1, "Promo · Nova", "Campaña audiovisual principal"),
      v("nova-ig", "nova-group-instagram", -286, -1, "Instagram · Nova Group", "Formato vertical para social"),
      plate("nova-kpi", -289, 1, "NOVA", [
        { v: "3×", l: "impresiones en LinkedIn" },
        { v: "+60%", l: "interacciones" },
      ], "POSICIONAMIENTO LINKEDIN"),
    ],
  },
  {
    id: "la-oferta",
    name: "La Oferta",
    kicker: "12 · SALA",
    tagline: "Retail que convierte",
    wordZ: -294,
    compact: true,
    pieces: [
      hv("oferta-hero", "la-oferta-hero", -297, -1, "Hero · La Oferta", "Retail con ritmo de campaña"),
      { id: "oferta-street", kind: "video", src: vid("la-oferta-street"), poster: pos("la-oferta-street"), w: Q_W, h: Q_H, z: -300, side: 1, title: "Street · La Oferta", sub: "La campaña en la calle" },
      plate("oferta-kpi", -303, -1, "LA OFERTA", [
        { v: "+28%", l: "ventas" },
      ], "AUTOMATIZACIÓN 100% VÍA HAPEE"),
    ],
  },
  {
    id: "big-boba",
    name: "Big Boba",
    kicker: "13 · SALA",
    tagline: "AI Creative · spot de marca",
    wordZ: -308,
    compact: true,
    pieces: [
      v("boba-spot", "big-boba", -311, 1, "Spot · Big Boba", "Bubble tea que detiene el scroll"),
      plate("boba-kpi", -314, -1, "BIG BOBA", [
        { v: "AI CREATIVE", l: "spot de marca generado con IA" },
      ]),
    ],
  },
  {
    id: "preomed",
    name: "Preomed",
    kicker: "14 · SALA",
    tagline: "Presencia EXPONOR · spot de marca",
    wordZ: -319,
    compact: true,
    pieces: [
      v("preomed-exponor", "preomed-exponor", -322, -1, "EXPONOR · Preomed", "La marca médica en la feria"),
      plate("preomed-kpi", -325, 1, "PREOMED", [
        { v: "EXPONOR", l: "presencia en feria · spot de marca" },
      ]),
    ],
  },
  {
    id: "calyptra",
    name: "Calyptra",
    kicker: "15 · SALA",
    tagline: "UGC de fundadora · social media",
    wordZ: -330,
    compact: true,
    pieces: [
      v("calyptra-founder", "calyptra-founder-ugc", -333, -1, "Founder UGC", "La fundadora, a cámara"),
      v("calyptra-rrss", "calyptra-rrss", -336, 1, "RRSS · Calyptra", "La marca en el feed"),
      plate("calyptra-kpi", -339, -1, "CALYPTRA", [
        { v: "+85%", l: "alcance en redes sociales" },
        { v: "+24%", l: "conversiones a ventas" },
      ], "UGC DE FUNDADORA"),
    ],
  },
  {
    id: "iphone-up",
    name: "iPhone Up",
    kicker: "16 · SALA",
    tagline: "Lanzamiento retail · campaña de expectativa",
    wordZ: -344,
    compact: true,
    pieces: [
      hv("iup-hero", "iphone-up-hero", -347, 1, "Hero · iPhone Up", "El lanzamiento, en pantalla ancha"),
      v("iup-showcase", "iphone-up-showcase", -350, -1, "Showcase", "Producto + ritmo vertical"),
      v("iup-ig", "iphone-up-instagram", -353, 1, "Instagram · iPhone Up", "La campaña en el feed"),
      v("iup-expectativa", "iphone-up-expectativa", -356, -1, "Expectativa · UGC", "El teaser que abrió la campaña"),
      plate("iup-kpi", -359, 1, "IPHONE UP", [
        { v: "LANZAMIENTO", l: "retail · campaña de expectativa" },
      ], "HERO + SHOWCASE + UGC"),
    ],
  },
];

/* ═══════════════ PARED "MÁS CASOS" (antes del cine) ═══════════════ */
/* Sacyr y Simplus salieron de la pared: ahora tienen sala propia.
   El nombre va 8u antes de la pared: cuando el texto termina de leerse
   ya se desvanece y los marcos quedan limpios al frente. */
export const MORE_WORD_Z = -366;
export const MORE_WALL_Z = -374;

export type MoreCase = { id: string; src: string; title: string; sub: string };
export const MORE_CASES: MoreCase[] = [
  { id: "fidelogist", src: "/exitos/fidelogist.jpeg", title: "Fidelogist", sub: "Reuniones C-Level con gigantes LATAM" },
  { id: "mundomed", src: "/exitos/mundomed.png", title: "MundoMed", sub: "Importación médica +30% anual" },
];

/* ═══════════════ RAIL DE CÁMARA ═══════════════ */
export const PAGES = 22;
export const SCREEN_Z = -392;

/* crucero por las 7 salas fuertes → WARP → salas compactas →
   pared "Más casos" → reposo frente a la pantalla de cine. */
export const KF = [
  { t: 0.0, z: 8 },
  { t: 0.04, z: -2 },
  { t: 0.44, z: -192 },
  { t: 0.48, z: -228 }, // ← warp
  { t: 0.85, z: -366 },
  { t: 0.91, z: -374 },
  { t: 0.96, z: -378.5 },
  { t: 1.0, z: -381 },
];

export const WARP_CENTER = 0.46;

export function smoothstep01(x: number) {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

export function cameraZ(t: number) {
  let i = 0;
  for (; i < KF.length - 2; i++) if (t <= KF[i + 1].t) break;
  const a = KF[i];
  const b = KF[i + 1];
  const e = smoothstep01((t - a.t) / (b.t - a.t));
  return a.z + (b.z - a.z) * e;
}

/** Inversa de cameraZ (z es monótona decreciente en t) — búsqueda binaria. */
export function tForZ(z: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (cameraZ(mid) > z) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ── Marcas para ticks de progreso + menú "Casos" ──
      la cámara aterriza ~7u antes del nombre: plano perfecto de la sala. */
export type HallMark = { id: string; name: string; tagline: string; t: number };
export const HALL_MARKS: HallMark[] = [
  ...HALLS.map((h) => ({ id: h.id, name: h.name, tagline: h.tagline, t: tForZ(h.wordZ + 7) })),
  { id: "more", name: "Más casos", tagline: "Dos casos más, en corto", t: tForZ(MORE_WORD_Z + 7) },
  { id: "cine", name: "Sala de cine", tagline: "Digitals, en su propia voz", t: 1 },
];

/* ── Pieza → item del lightbox ── */
export function pieceToLightbox(hall: Hall, p: Piece): LightboxItem {
  return {
    kind: p.kind === "video" ? "video" : p.kind === "photo" ? "image" : "plate",
    src: p.src,
    poster: p.poster,
    brand: hall.name,
    title: p.title,
    sub: p.sub,
    vertical: p.h > p.w,
    stats: p.stats,
    chip: p.chip,
  };
}
