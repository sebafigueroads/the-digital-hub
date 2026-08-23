// Canvas-generated textures for V3 "El Túnel del Hub".
// Everything is drawn locally (no network fonts required to render):
// we draw once with the fallback stack, then re-draw when the Google
// fonts land so the gallery types sharpen up.

import * as THREE from "three";

const GOLD = "#e5bb55";
const GOLD_DEEP = "#8a6a24";
const INK = "#f4f4f5";

const DISPLAY_STACK = `"Bebas Neue", "Arial Narrow", Impact, sans-serif`;
const BODY_STACK = `"Inter", "Helvetica Neue", Arial, sans-serif`;

function redrawWhenFontsReady(draw: () => void, tex: THREE.CanvasTexture) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        draw();
        tex.needsUpdate = true;
      })
      .catch(() => {
        /* fallback stack already drawn */
      });
  }
}

/* ── Soft radial gold glow (volumetric-light fake, additive planes) ── */
export function makeGlowTexture(size = 256): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(229,187,85,0.85)");
  g.addColorStop(0.35, "rgba(229,187,85,0.28)");
  g.addColorStop(0.7, "rgba(229,187,85,0.07)");
  g.addColorStop(1, "rgba(229,187,85,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ── Word-wrap helper para las placas (cifras reales largas) ── */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const probe = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      if (lines.length === maxLines - 1) {
        // todo lo restante cabe en la última línea
        line = words.slice(i).join(" ");
        break;
      }
      line = words[i];
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ── PLACA DE MUSEO (tarjeta-KPI dorada) con JERARQUÍA:
      kicker (cliente) → cifra héroe gigante + su label →
      filas secundarias valor/label con filetes → chip de servicio.
      Cero párrafos: cada cifra es su propia fila. ── */
export type PlateStat = { v: string; l: string };

export function makePlateTexture(
  stats: PlateStat[],
  kicker = "DIGITALS",
  chip?: string
): THREE.CanvasTexture {
  const W = 768;
  const H = 576;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = () => {
    // base
    ctx.fillStyle = "#0b0906";
    ctx.fillRect(0, 0, W, H);
    // diagonal gold sheen
    const g = ctx.createLinearGradient(0, H, W, 0);
    g.addColorStop(0, "rgba(229,187,85,0.02)");
    g.addColorStop(0.55, "rgba(229,187,85,0.10)");
    g.addColorStop(0.75, "rgba(229,187,85,0.28)");
    g.addColorStop(1, "rgba(229,187,85,0.06)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // corner light
    const r = ctx.createRadialGradient(W * 0.85, H * 0.12, 0, W * 0.85, H * 0.12, W * 0.7);
    r.addColorStop(0, "rgba(229,187,85,0.2)");
    r.addColorStop(1, "rgba(229,187,85,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    // marco doble de placa (hairline + interior fino)
    ctx.strokeStyle = "rgba(229,187,85,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = "rgba(229,187,85,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    ctx.textBaseline = "top";
    const X = 58;
    const RIGHT = W - 58;

    // kicker: CLIENTE + filete
    ctx.fillStyle = "rgba(229,187,85,0.92)";
    ctx.font = `700 21px ${BODY_STACK}`;
    ctx.fillText(kicker.toUpperCase(), X, 58);
    ctx.fillStyle = "rgba(229,187,85,0.4)";
    ctx.fillRect(X, 92, W - 116, 1);

    const hero = stats[0];
    const rows = stats.slice(1, 3);

    // ── CIFRA HÉROE: gigante en dorado, autosize ──
    let size = 148;
    ctx.font = `400 ${size}px ${DISPLAY_STACK}`;
    while (ctx.measureText(hero.v.toUpperCase()).width > W - 116 && size > 46) {
      size -= 4;
      ctx.font = `400 ${size}px ${DISPLAY_STACK}`;
    }
    const heroY = 116;
    // sombra de brillo detrás del número
    ctx.save();
    ctx.shadowColor = "rgba(229,187,85,0.45)";
    ctx.shadowBlur = 26;
    ctx.fillStyle = GOLD;
    ctx.fillText(hero.v.toUpperCase(), X - 2, heroY);
    ctx.restore();

    // label del héroe: blanco cálido, caps chicas con tracking
    ctx.fillStyle = "rgba(244,240,230,0.92)";
    ctx.font = `600 23px ${BODY_STACK}`;
    const heroLabelY = heroY + size * 1.02 + 12;
    const heroLines = wrapLines(ctx, hero.l.toUpperCase(), W - 120, 2);
    heroLines.forEach((ln, i) => ctx.fillText(ln, X, heroLabelY + i * 31));

    // ── FILAS SECUNDARIAS: valor Bebas + label Inter, con filetes ──
    let y = heroLabelY + heroLines.length * 31 + 26;
    for (const rItem of rows) {
      ctx.fillStyle = "rgba(229,187,85,0.24)";
      ctx.fillRect(X, y, W - 116, 1);
      y += 16;
      // valor a la izquierda (Bebas blanco)
      ctx.fillStyle = INK;
      let vs = 46;
      ctx.font = `400 ${vs}px ${DISPLAY_STACK}`;
      while (ctx.measureText(rItem.v.toUpperCase()).width > (W - 116) * 0.44 && vs > 24) {
        vs -= 2;
        ctx.font = `400 ${vs}px ${DISPLAY_STACK}`;
      }
      ctx.fillText(rItem.v.toUpperCase(), X, y);
      const vw = ctx.measureText(rItem.v.toUpperCase()).width;
      // label a la derecha del valor (gris cálido), centrado vertical a la cifra
      ctx.fillStyle = "rgba(238,214,150,0.78)";
      ctx.font = `500 20px ${BODY_STACK}`;
      const lLines = wrapLines(ctx, rItem.l, W - 116 - vw - 26, 2);
      const lBlockH = lLines.length * 25;
      lLines.forEach((ln, i) =>
        ctx.fillText(ln, X + vw + 24, y + Math.max(0, (vs * 0.92 - lBlockH) / 2) + i * 25)
      );
      y += Math.max(vs * 1.0, lBlockH) + 14;
    }

    // ── CHIP de servicio: pill con borde dorado, abajo-izquierda ──
    if (chip) {
      ctx.font = `700 16px ${BODY_STACK}`;
      const cw = ctx.measureText(chip.toUpperCase()).width;
      const px = 18;
      const ch = 36;
      const cy = H - 66 - ch - 12;
      ctx.strokeStyle = "rgba(229,187,85,0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(X, cy, cw + px * 2, ch, ch / 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(229,187,85,0.10)";
      ctx.fill();
      ctx.fillStyle = "rgba(229,187,85,0.95)";
      ctx.fillText(chip.toUpperCase(), X + px, cy + 10);
    }

    // footer marca
    ctx.fillStyle = "rgba(244,244,245,0.38)";
    ctx.font = `600 15px ${BODY_STACK}`;
    ctx.fillText("DIGITALS · MUSEO SHOWCASE", X, H - 58);
    tex.needsUpdate = true;
  };

  draw();
  redrawWhenFontsReady(draw, tex);
  return tex;
}

/* ── Giant floating brand/hall word (transparent background).
      `index` = kicker superior ("01 · CASO"), `sub` = tagline inferior. ── */
export function makeWordTexture(word: string, index: string, sub?: string): THREE.CanvasTexture {
  const W = 1536;
  const H = 576;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // fit the word
    let size = 340;
    ctx.font = `400 ${size}px ${DISPLAY_STACK}`;
    while (ctx.measureText(word.toUpperCase()).width > W - 130 && size > 90) {
      size -= 8;
      ctx.font = `400 ${size}px ${DISPLAY_STACK}`;
    }
    // gold vertical gradient fill
    const g = ctx.createLinearGradient(0, H / 2 - size / 2, 0, H / 2 + size / 2);
    g.addColorStop(0, "#f6dfa0");
    g.addColorStop(0.5, GOLD);
    g.addColorStop(1, GOLD_DEEP);
    // soft halo
    ctx.shadowColor = "rgba(229,187,85,0.55)";
    ctx.shadowBlur = 50;
    ctx.fillStyle = g;
    ctx.fillText(word.toUpperCase(), W / 2, H / 2 + 14);
    ctx.shadowBlur = 0;
    // index chip
    ctx.font = `600 27px ${BODY_STACK}`;
    ctx.fillStyle = "rgba(244,244,245,0.72)";
    ctx.fillText(index, W / 2, Math.max(40, H / 2 - size / 2 - 4));
    // tagline
    if (sub) {
      ctx.font = `500 31px ${BODY_STACK}`;
      ctx.fillStyle = "rgba(244,244,245,0.66)";
      ctx.fillText(sub, W / 2, Math.min(H - 36, H / 2 + size / 2 + 34));
    }
    tex.needsUpdate = true;
  };

  draw();
  redrawWhenFontsReady(draw, tex);
  return tex;
}

/* ── Badge "+" de cuadro clickeable (esquina del marco) ── */
export function makeBadgeTexture(size = 128): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  // disco dorado con leve gradiente
  const g = ctx.createRadialGradient(cx, cx * 0.8, 4, cx, cx, cx - 6);
  g.addColorStop(0, "#f2d488");
  g.addColorStop(1, GOLD);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cx, cx - 8, 0, Math.PI * 2);
  ctx.fill();
  // anillo exterior fino
  ctx.strokeStyle = "rgba(10,8,4,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();
  // signo +
  ctx.strokeStyle = "#0a0804";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 26, cx);
  ctx.lineTo(cx + 26, cx);
  ctx.moveTo(cx, cx - 26);
  ctx.lineTo(cx, cx + 26);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
