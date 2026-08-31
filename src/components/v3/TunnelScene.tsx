"use client";

/* ═══════════════════════════════════════════════════════════════
   V3 · "MUSEO SHOWCASE DIGITALS" — el museo-galería de casos
   La cámara vuela en primera persona por un corredor-museo oscuro
   organizado POR CLIENTE: cada marca tiene su propia sala con su
   nombre en tipografía gigante dorada, sus piezas reales colgadas
   como cuadros (videos con poster real, fotos de /exitos) y su
   PLACA-KPI de museo con cifras reales.
   Cada cuadro es clickeable → lightbox HTML con video CON SONIDO.
   Se mantiene todo lo que enamora: arcos dorados infinitos + fog,
   piso espejo, polvo dorado, hero, tramo WARP y la SALA DE CINE
   final con el video corporativo en AUTOPLAY y "Escuchar con voz".

   Rendimiento: solo los cuadros cerca de la cámara (hall actual ±1)
   montan VideoTexture (máx. 4 <video> decodificando); el resto usa
   su poster jpg. En móvil: cero VideoTexture inline — el tap abre
   el lightbox con el video real.
   ═══════════════════════════════════════════════════════════════ */

import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll, useProgress } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import * as THREE from "three";
import { store } from "@/lib/store";
import { makeGlowTexture, makePlateTexture, makeWordTexture, makeBadgeTexture } from "./textures";
import { videoBus } from "./videoBus";
import { lightboxBus, videoSlots, scrollBus } from "./lightboxBus";
import {
  HALLS,
  MORE_CASES,
  MORE_WORD_Z,
  MORE_WALL_Z,
  PAGES,
  SCREEN_Z,
  WARP_CENTER,
  cameraZ,
  pieceToLightbox,
  type Hall,
  type Piece,
} from "./halls";

const GOLD = "#e5bb55";
const FOG_COLOR = "#050403";
const CAM_Y = 2.1;
const FRAME_Y = 2.35;

/* ═══════════════ CAMERA RIG ═══════════════ */
function CameraRig({ mobile }: { mobile: boolean }) {
  const scroll = useScroll();
  const { camera } = useThree();
  const s = useRef(0);
  const mx = useRef(0);
  const my = useRef(0);

  /* comparte el contenedor de scroll con el DOM (menú "Casos", lightbox) */
  useEffect(() => {
    scrollBus.el = scroll.el;
    return () => {
      scrollBus.el = null;
    };
  }, [scroll.el]);

  useFrame((state) => {
    s.current = THREE.MathUtils.lerp(s.current, scroll.offset, 0.06);
    mx.current = THREE.MathUtils.lerp(mx.current, store.mouseX, 0.05);
    my.current = THREE.MathUtils.lerp(my.current, store.mouseY, 0.05);
    store.scrollProgress = scroll.offset;

    const t = s.current;
    const z = cameraZ(t);
    /* el vaivén se apaga al llegar a la sala: la cámara "se sienta" centrada */
    const seat = 1 - THREE.MathUtils.smoothstep(t, 0.9, 0.97);
    const sway = Math.sin(z * 0.05) * 0.32 * seat;
    const bob = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    const px = sway + mx.current * (mobile ? 0.12 : 0.34);
    const py = CAM_Y + bob + my.current * (mobile ? 0.08 : 0.18);
    camera.position.set(px, py, z);
    camera.lookAt(sway * 0.35 + mx.current * 0.9, CAM_Y + my.current * 0.5, z - 10);

    /* golpe de FOV durante el warp */
    const warp = Math.exp(-Math.pow((t - WARP_CENTER) / 0.035, 2));
    const cam = camera as THREE.PerspectiveCamera;
    const fov = 58 + warp * 16;
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

/* ═══════════════ ARCOS DORADOS (instancias) ═══════════════ */
function archShape(): THREE.Shape {
  const top = (p: THREE.Shape | THREE.Path, x: number, y: number, w: number, h: number, r: number) => {
    p.moveTo(x, y);
    p.lineTo(x, y + h - r);
    p.quadraticCurveTo(x, y + h, x + r, y + h);
    p.lineTo(x + w - r, y + h);
    p.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    p.lineTo(x + w, y);
    p.lineTo(x, y);
  };
  const shape = new THREE.Shape();
  top(shape, -3.75, 0, 7.5, 5.7, 2.3);
  const hole = new THREE.Path();
  top(hole, -3.42, 0, 6.84, 5.38, 2.12);
  shape.holes.push(hole);
  return shape;
}

function Arches({
  count,
  spacing,
  mirrored = false,
}: {
  count: number;
  spacing: number;
  mirrored?: boolean;
}) {
  const mesh = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(archShape(), { depth: 0.16, bevelEnabled: false });
    const mat = new THREE.MeshBasicMaterial({
      color: mirrored ? "#52400f" : "#c89a3e",
      transparent: mirrored,
      opacity: mirrored ? 0.13 : 1,
      side: THREE.DoubleSide,
      depthWrite: !mirrored,
    });
    const m = new THREE.InstancedMesh(geo, mat, count);
    const mat4 = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      mat4.makeTranslation(0, 0, 4 - i * spacing);
      m.setMatrixAt(i, mat4);
    }
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    return m;
  }, [count, spacing, mirrored]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
    [mesh]
  );

  return <primitive object={mesh} />;
}

/* ═══════════════ LUZ VOLUMÉTRICA FINGIDA (planos additive) ═══════════════ */
function GlowPlanes({ count, spacing }: { count: number; spacing: number }) {
  const mesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(9.6, 7.2);
    const mat = new THREE.MeshBasicMaterial({
      map: makeGlowTexture(),
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const m = new THREE.InstancedMesh(geo, mat, count);
    const mat4 = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      mat4.makeTranslation(0, 2.5, 4 - i * spacing * 2 - 0.4);
      m.setMatrixAt(i, mat4);
    }
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    m.renderOrder = 2;
    return m;
  }, [count, spacing]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.dispose();
    },
    [mesh]
  );

  return <primitive object={mesh} />;
}

/* ═══════════════ POLVO DORADO ═══════════════ */
function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 5.6;
      pos[i * 3 + 2] = 8 - Math.random() * 416;
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.25) * 0.12;
      ref.current.position.x = Math.cos(clock.elapsedTime * 0.18) * 0.08;
    }
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={GOLD}
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════ WARP STREAKS (galería fuerte → halls compactos) ═══════════════ */
function WarpStreaks({ count }: { count: number }) {
  const scroll = useScroll();
  const mesh = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.022, 0.022, 7);
    const mat = new THREE.MeshBasicMaterial({
      color: "#e8cd7e",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const m = new THREE.InstancedMesh(geo, mat, count);
    const mat4 = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (1.2 + Math.random() * 2.6);
      const y = 0.4 + Math.random() * 4.8;
      const z = -190 - Math.random() * 42;
      mat4.makeTranslation(x, y, z);
      m.setMatrixAt(i, mat4);
    }
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    m.renderOrder = 3;
    return m;
  }, [count]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
    [mesh]
  );

  useFrame(() => {
    const t = scroll.offset;
    const warp = Math.exp(-Math.pow((t - WARP_CENTER) / 0.05, 2));
    (mesh.material as THREE.MeshBasicMaterial).opacity = warp * 0.5;
  });

  return <primitive object={mesh} />;
}

/* ═══════════════ MARCO + HALO DE CADA CUADRO ═══════════════ */
function FrameChrome({ w, h }: { w: number; h: number }) {
  const glowTex = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glowTex.dispose(), [glowTex]);
  return (
    <>
      {/* marco dorado */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[w + 0.16, h + 0.16]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>
      {/* halo */}
      <mesh position={[0, 0, -0.05]} renderOrder={2}>
        <planeGeometry args={[w + 1.6, h + 1.6]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/* Badge "+" — señala que el cuadro se expande (clave en móvil, sin hover) */
function ExpandBadge({ w, h }: { w: number; h: number }) {
  const tex = useMemo(() => makeBadgeTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[w / 2 - 0.06, -h / 2 + 0.06, 0.03]} renderOrder={3}>
      <planeGeometry args={[0.3, 0.3]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* ═══════════════ SUPERFICIES ═══════════════ */
function PlateSurface({
  stats,
  kicker,
  chip,
  w,
  h,
}: {
  stats: { v: string; l: string }[];
  kicker?: string;
  chip?: string;
  w: number;
  h: number;
}) {
  const tex = useMemo(() => makePlateTexture(stats, kicker, chip), [stats, kicker, chip]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/* Foto perezosa: carga la textura recién cuando la cámara se acerca
   (las fotos de /exitos pesan — no bloquean el loader inicial).
   El map se asigna imperativamente + needsUpdate: si solo se cambia la
   prop, el shader ya compilado sin USE_MAP deja el plano negro. */
function LazyPhotoSurface({
  src,
  w,
  h,
  z,
  noFog = false,
}: {
  src: string;
  w: number;
  h: number;
  z: number;
  noFog?: boolean;
}) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const requested = useRef(false);
  useFrame(({ camera }) => {
    if (requested.current) return;
    if (camera.position.z - z < 90) {
      requested.current = true;
      new THREE.TextureLoader().load(src, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        setTex(t);
      });
    }
  });
  useEffect(() => {
    if (tex && mat.current) {
      mat.current.map = tex;
      mat.current.color.set("#ffffff");
      mat.current.needsUpdate = true;
    }
    return () => tex?.dispose();
  }, [tex]);
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} color="#15100a" toneMapped={false} fog={!noFog} />
    </mesh>
  );
}

/* Reel inteligente: poster jpg siempre; VideoTexture solo cerca de la
   cámara, con presupuesto global de 4 <video> y nunca en móvil. */
function SmartVideoSurface({ piece, mobile }: { piece: Piece; mobile: boolean }) {
  const poster = useLoader(THREE.TextureLoader, piece.poster!);
  useMemo(() => {
    poster.colorSpace = THREE.SRGBColorSpace;
  }, [poster]);

  const [active, setActive] = useState(false);
  const holding = useRef(false);

  useFrame(({ camera }) => {
    if (mobile) return;
    const d = camera.position.z - piece.z; // >0 → la pieza está por delante
    const want = d > -6 && d < 18 && !lightboxBus.item;
    if (want && !holding.current && videoSlots.used < videoSlots.max) {
      videoSlots.used += 1;
      holding.current = true;
      setActive(true);
    } else if (!want && holding.current) {
      videoSlots.used -= 1;
      holding.current = false;
      setActive(false);
    }
  });

  /* devuelve el slot si el componente muere sosteniéndolo */
  useEffect(
    () => () => {
      if (holding.current) {
        videoSlots.used -= 1;
        holding.current = false;
      }
    },
    []
  );

  const [tex, setTex] = useState<THREE.VideoTexture | null>(null);
  useEffect(() => {
    if (!active) {
      setTex(null);
      return;
    }
    const v = document.createElement("video");
    v.src = piece.src!;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.play().catch(() => {
      /* autoplay bloqueado → queda el poster */
    });
    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.SRGBColorSpace;
    setTex(t);
    return () => {
      v.pause();
      v.removeAttribute("src");
      v.load();
      t.dispose();
    };
  }, [active, piece.src]);

  return (
    <mesh>
      <planeGeometry args={[piece.w, piece.h]} />
      <meshBasicMaterial map={tex ?? poster} toneMapped={false} />
    </mesh>
  );
}

/* ═══════════════ CUADRO CLICKEABLE DE UN HALL ═══════════════ */
function ArtFrame({
  piece,
  hall,
  index,
  mobile,
}: {
  piece: Piece;
  hall: Hall;
  index: number;
  mobile: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const hover = useRef(false);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.position.y = FRAME_Y + Math.sin(t * 0.65 + index * 1.7) * 0.06;
    group.current.rotation.z = Math.sin(t * 0.4 + index) * 0.012;
    const target = hover.current ? 1.05 : 1;
    const s = THREE.MathUtils.lerp(group.current.scale.x, target, 0.14);
    group.current.scale.setScalar(s);
  });

  return (
    <group
      ref={group}
      position={[piece.side * 3.28, FRAME_Y, piece.z]}
      rotation={[0, -piece.side * (Math.PI / 2 - 0.36), 0]}
    >
      <FrameChrome w={piece.w} h={piece.h} />
      <Suspense fallback={null}>
        {piece.kind === "video" && <SmartVideoSurface piece={piece} mobile={mobile} />}
        {piece.kind === "photo" && (
          <LazyPhotoSurface src={piece.src!} w={piece.w} h={piece.h} z={piece.z} />
        )}
        {piece.kind === "plate" && (
          <PlateSurface
            stats={piece.stats ?? [{ v: piece.title, l: piece.sub ?? hall.tagline }]}
            kicker={piece.plateKicker}
            chip={piece.chip}
            w={piece.w}
            h={piece.h}
          />
        )}
      </Suspense>
      <ExpandBadge w={piece.w} h={piece.h} />
      {/* superficie de hit invisible — click/tap → lightbox */}
      <mesh
        position={[0, 0, 0.04]}
        onClick={(e) => {
          e.stopPropagation();
          lightboxBus.open(pieceToLightbox(hall, piece));
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover.current = true;
        }}
        onPointerOut={() => {
          hover.current = false;
        }}
      >
        <planeGeometry args={[piece.w + 0.16, piece.h + 0.16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════ NOMBRE GIGANTE DEL HALL ═══════════════ */
function HallWord({
  word,
  kicker,
  tagline,
  z,
  compact,
}: {
  word: string;
  kicker: string;
  tagline?: string;
  z: number;
  compact?: boolean;
}) {
  const tex = useMemo(() => makeWordTexture(word, kicker, tagline), [word, kicker, tagline]);
  useEffect(() => () => tex.dispose(), [tex]);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  /* los halls compactos van más juntos → ventana de fade más corta
     para que nunca convivan dos nombres a plena opacidad */
  const inStart = compact ? 15 : 22;
  const inSpan = compact ? 6 : 8;

  useFrame(() => {
    if (!mat.current || !mesh.current) return;
    const d = camera.position.z - z; // distancia por delante de la cámara
    const fadeIn = THREE.MathUtils.smoothstep(inStart - d, 0, inSpan);
    const fadeOut = THREE.MathUtils.smoothstep(d, 1.2, 5.5);
    mat.current.opacity = fadeIn * fadeOut;
    const grow = 1 + (1 - fadeOut) * 0.25;
    mesh.current.scale.setScalar(grow);
    mesh.current.visible = mat.current.opacity > 0.01;
  });

  const w = compact ? 5.4 : 6.9;
  const h = w * (576 / 1536);

  return (
    <mesh ref={mesh} position={[0, 2.75, z]} renderOrder={4}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        ref={mat}
        map={tex}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}

/* ═══════════════ HALLS COMPLETOS ═══════════════ */
function HallsGallery({ mobile }: { mobile: boolean }) {
  return (
    <>
      {HALLS.map((hall, hi) => (
        <group key={hall.id}>
          <HallWord
            word={hall.name}
            kicker={hall.kicker}
            tagline={hall.tagline}
            z={hall.wordZ}
            compact={hall.compact}
          />
          {hall.pieces.map((piece, pi) => (
            <ArtFrame key={piece.id} piece={piece} hall={hall} index={hi * 4 + pi} mobile={mobile} />
          ))}
        </group>
      ))}
    </>
  );
}

/* ═══════════════ PARED "MÁS CASOS" (grilla 4, atravesable) ═══════════════ */
function MoreCaseFrame({
  data,
  x,
  y,
  w,
  h,
}: {
  data: (typeof MORE_CASES)[number];
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const hover = useRef(false);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const target = hover.current ? 1.06 : 1;
    const s = THREE.MathUtils.lerp(group.current.scale.x, target, 0.14);
    group.current.scale.setScalar(s);
  });
  return (
    <group ref={group} position={[x, y, 0]}>
      <FrameChrome w={w} h={h} />
      {/* fog off: la pared brilla en la oscuridad como la pantalla del cine */}
      <LazyPhotoSurface src={data.src} w={w} h={h} z={MORE_WALL_Z} noFog />
      <ExpandBadge w={w} h={h} />
      <mesh
        position={[0, 0, 0.04]}
        onClick={(e) => {
          e.stopPropagation();
          lightboxBus.open({
            kind: "image",
            src: data.src,
            brand: data.title,
            title: data.title,
            sub: data.sub,
            vertical: true,
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover.current = true;
        }}
        onPointerOut={() => {
          hover.current = false;
        }}
      >
        <planeGeometry args={[w + 0.16, h + 0.16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function MoreCasesWall({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);

  /* la cámara la atraviesa camino al cine: fade elegante al acercarse */
  useFrame(({ camera }) => {
    if (!group.current) return;
    const d = camera.position.z - MORE_WALL_Z;
    const k = THREE.MathUtils.clamp((d - 1.4) / 2.6, 0, 1);
    group.current.visible = k > 0.02;
    group.current.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.MeshBasicMaterial;
      if (mat.userData.v3Base === undefined) {
        mat.userData.v3Base = mat.opacity;
        mat.transparent = true;
      }
      mat.opacity = (mat.userData.v3Base as number) * k;
    });
  });

  /* solo dos marcos: Fidelogist y MundoMed (Sacyr y Simplus ya tienen sala) */
  const w = mobile ? 1.3 : 1.7;
  const h = w * (1200 / 896);
  const slots: Array<[number, number]> = mobile
    ? [
        [-0.76, 2.9],
        [0.76, 2.9],
      ]
    : [
        [-1.08, 2.6],
        [1.08, 2.6],
      ];

  return (
    <group ref={group} position={[0, 0, MORE_WALL_Z]}>
      {MORE_CASES.map((mc, i) => (
        <MoreCaseFrame key={mc.id} data={mc} x={slots[i][0]} y={slots[i][1]} w={w} h={h} />
      ))}
    </group>
  );
}

/* ═══════════════ SALA DE CINE ═══════════════ */
function Cinema({ mobile }: { mobile: boolean }) {
  /* en móvil la pantalla se achica para respetar el aspecto vertical */
  const SCREEN_W = mobile ? 5.4 : 9.6;
  const SCREEN_H = SCREEN_W * (9 / 16);
  const SCREEN_Y = mobile ? 2.4 : 2.85;
  const scroll = useScroll();
  const poster = useLoader(THREE.TextureLoader, "/video/hero-poster.jpg");
  useMemo(() => {
    poster.colorSpace = THREE.SRGBColorSpace;
  }, [poster]);

  const glowTex = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glowTex.dispose(), [glowTex]);

  const [videoTex, setVideoTex] = useState<THREE.VideoTexture | null>(null);
  const videoTexRef = useRef<THREE.VideoTexture | null>(null);
  const started = useRef(false);
  const retryTick = useRef(0);

  /* AUTOPLAY GARANTIZADO: si play() es bloqueado por el navegador,
     el próximo gesto (scroll/tap/tecla/rueda) lo reintenta al instante.
     Nunca resucita el video mientras el lightbox lo tiene pausado. */
  const tryPlay = () => {
    const v = videoBus.el;
    if (v && v.paused && !lightboxBus.item) v.play().catch(() => {});
  };

  /* preload none hasta t > 0.8: recién ahí creamos el <video> y
     FORZAMOS v.play() (muted) — al llegar, la pantalla ya corre. */
  useFrame(() => {
    const t = scroll.offset;
    if (!started.current && t > 0.8) {
      started.current = true;
      const v = document.createElement("video");
      v.src = "/video/hero-digitals-720.mp4";
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "auto";
      v.poster = "/video/hero-poster.jpg";
      videoBus.el = v;
      v.play().catch(() => {
        /* bloqueado → reintenta en el próximo gesto y en el loop */
      });
      const tex = new THREE.VideoTexture(v);
      tex.colorSpace = THREE.SRGBColorSpace;
      videoTexRef.current = tex;
      setVideoTex(tex);
    }
    /* reintento periódico (~cada 1s a 60fps) mientras la sala esté a la vista */
    if (started.current && t > 0.8 && videoBus.el?.paused && !lightboxBus.item) {
      retryTick.current += 1;
      if (retryTick.current % 60 === 1) videoBus.el.play().catch(() => {});
    }
  });

  /* reintento en el primer gesto del usuario si el autoplay fue bloqueado */
  useEffect(() => {
    const el = scrollBus.el;
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("touchstart", tryPlay, { passive: true });
    window.addEventListener("keydown", tryPlay);
    window.addEventListener("wheel", tryPlay, { passive: true });
    el?.addEventListener("scroll", tryPlay, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("wheel", tryPlay);
      el?.removeEventListener("scroll", tryPlay);
    };
  }, []);

  /* limpieza SOLO al desmontar — la versión anterior dependía de
     [videoTex] y su cleanup pausaba y anulaba el video recién creado:
     ese era el bug por el que el cine no partía solo. */
  useEffect(
    () => () => {
      videoTexRef.current?.dispose();
      if (videoBus.el) {
        videoBus.el.pause();
        videoBus.el = null;
      }
    },
    []
  );

  const map = videoTex ?? poster;

  return (
    <group>
      {/* pared de fondo */}
      <mesh position={[0, 6, SCREEN_Z - 0.6]}>
        <planeGeometry args={[46, 26]} />
        <meshBasicMaterial color="#040302" fog={false} />
      </mesh>
      {/* halo dorado — visible desde la boca del túnel (fog off) */}
      <mesh position={[0, SCREEN_Y, SCREEN_Z - 0.3]} renderOrder={2}>
        <planeGeometry args={[SCREEN_W * 1.56, SCREEN_H * 1.78]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      {/* marco dorado */}
      <mesh position={[0, SCREEN_Y, SCREEN_Z - 0.12]}>
        <planeGeometry args={[SCREEN_W + 0.36, SCREEN_H + 0.36]} />
        <meshBasicMaterial color={GOLD} fog={false} />
      </mesh>
      {/* PANTALLA — brilla al fondo del corredor desde el primer scroll */}
      <mesh position={[0, SCREEN_Y, SCREEN_Z]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial map={map} toneMapped={false} fog={false} />
      </mesh>
      {/* reflejo barato en el "piso" espejo */}
      <mesh position={[0, -SCREEN_Y, SCREEN_Z]} scale={[1, -1, 1]} renderOrder={1}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial
          map={map}
          transparent
          opacity={0.16}
          depthWrite={false}
          toneMapped={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* pilares dorados de la sala */}
      <mesh position={[-(SCREEN_W / 2 + 1.3), 3.1, SCREEN_Z + 1]}>
        <boxGeometry args={[0.2, mobile ? 5.4 : 6.6, 0.2]} />
        <meshBasicMaterial color={GOLD} fog={false} />
      </mesh>
      <mesh position={[SCREEN_W / 2 + 1.3, 3.1, SCREEN_Z + 1]}>
        <boxGeometry args={[0.2, mobile ? 5.4 : 6.6, 0.2]} />
        <meshBasicMaterial color={GOLD} fog={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════ BOTÓN "ESCUCHAR CON VOZ" ═══════════════ */
function VoiceButton() {
  const [on, setOn] = useState(false);
  const fade = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (fade.current) clearInterval(fade.current);
    },
    []
  );

  const toggle = () => {
    const v = videoBus.el;
    if (!v) return;
    if (fade.current) clearInterval(fade.current);
    if (!on) {
      v.currentTime = 0;
      v.muted = false;
      v.volume = 0;
      v.play().catch(() => {});
      fade.current = setInterval(() => {
        v.volume = Math.min(1, v.volume + 0.08);
        if (v.volume >= 1 && fade.current) clearInterval(fade.current);
      }, 60);
      setOn(true);
    } else {
      v.muted = true;
      setOn(false);
    }
  };

  return (
    <button
      type="button"
      data-cursor-hover
      className={`v3-voice-btn ${on ? "is-on" : ""}`}
      onClick={toggle}
    >
      <span className="v3-voice-bars" aria-hidden="true">
        <span /><span /><span /><span />
      </span>
      {on ? "Silenciar" : "Escuchar con voz"}
    </button>
  );
}

/* ═══════════════ SECCIONES HTML POR ETAPA ═══════════════ */
function ScrollSection({
  children,
  page,
  align = "center",
  justify = "center",
  pin,
  interactive = false,
}: {
  children: React.ReactNode;
  page: number;
  align?: "center" | "left" | "right";
  justify?: "center" | "end";
  /* "start": no se desvanece antes de su centro (hero);
     "end": queda fija al llegar al fondo (CTA final). */
  pin?: "start" | "end";
  /* solo las secciones con botones/links capturan el puntero —
     el resto deja pasar los clicks hacia los cuadros del túnel */
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useScroll();
  useFrame(() => {
    if (!ref.current) return;
    const center = (page + 0.5) / PAGES;
    let delta = (scroll.offset - center) * PAGES;
    if (pin === "start" && delta < 0) delta = 0;
    if (pin === "end" && delta > 0) delta = 0;
    const dist = Math.abs(delta);
    const opacity = Math.max(0, Math.min(1, 1 - (dist - 0.28) * 3));
    const dir = delta < 0 ? 1 : -1;
    const slideY = dist > 0.2 ? dir * (dist - 0.2) * 90 : 0;
    ref.current.style.opacity = String(opacity);
    ref.current.style.transform = `translateY(${slideY}px)`;
  });
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: `${page * 100}vh`,
        left: 0,
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        justifyContent: justify === "end" ? "flex-end" : "center",
        padding: "3rem clamp(1.5rem, 6vw, 5rem)",
        opacity: 0,
        willChange: "transform, opacity",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: interactive ? "auto" : "none",
          maxWidth: "64rem",
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function OverlaySections() {
  return (
    <>
      {/* 0 · HERO */}
      <ScrollSection page={0} align="center" pin="start">
        <div className="v3-hero">
          <p className="kicker">Digitals · Casos Reales</p>
          <h1 className="display-xxl v3-hero-title">
            Museo Showcase<br />
            <span className="v3-gold">Digitals</span>
          </h1>
          <p className="body-lg v3-hero-sub">
            Un museo-galería de casos reales: cada sala, una marca — sus
            piezas, sus cifras, su placa. Al fondo, la sala de cine.
          </p>
          <p className="v3-scroll-hint">Scroll para avanzar ↓</p>
        </div>
      </ScrollSection>

      {/* 0.55 · CÓMO SE RECORRE EL MUSEO (en el tramo vacío antes de la primera sala) */}
      <ScrollSection page={0.55} align="center" justify="end">
        <div className="v3-caption v3-caption-center">
          <p className="kicker">El museo de casos</p>
          <p className="v3-caption-text">
            Toca cualquier cuadro para verlo en grande — los videos suenan.
          </p>
        </div>
      </ScrollSection>

      {/* WARP (fraccional: centrado en el tramo de aceleración) */}
      <ScrollSection page={WARP_CENTER * PAGES - 0.5} align="center" justify="end">
        <div className="v3-caption v3-caption-center">
          <p className="v3-warp-label">— Acelerando →</p>
        </div>
      </ScrollSection>

      {/* MÁS CASOS */}
      <ScrollSection page={19.3} align="center" justify="end">
        <div className="v3-caption v3-caption-center">
          <p className="kicker">Antes del cine</p>
          <p className="v3-caption-text">Dos casos más — toca para ampliar.</p>
        </div>
      </ScrollSection>

      {/* ANTESALA */}
      <ScrollSection page={20.7} align="center">
        <div className="v3-center">
          <p className="kicker">Y al final del túnel…</p>
          <h2 className="display-lg">Una historia que<br />se cuenta sola.</h2>
        </div>
      </ScrollSection>

      {/* SALA DE CINE */}
      <ScrollSection page={PAGES - 1} align="center" justify="end" pin="end" interactive>
        <div className="v3-cinema-cta">
          <p className="kicker">La sala de cine</p>
          <h2 className="display-lg">Digitals, en su propia voz.</h2>
          <div className="v3-cinema-actions">
            <VoiceButton />
            <a href="/portfolio" data-cursor-hover className="btn-solid">
              Ir al portafolio →
            </a>
          </div>
          <p className="v3-footer-line">
            © {new Date().getFullYear()} Digitals · Google Premier Partner · Meta Business Partner
          </p>
        </div>
      </ScrollSection>
    </>
  );
}

/* ═══════════════ LOADER CON % ═══════════════ */
/* Vive FUERA del Canvas. Antes era un <Html fullscreen> de drei, que monta su
   propia raíz de React sobre un contenedor del DOM; con el doble render de
   StrictMode esa raíz se creaba dos veces sobre el mismo nodo y la consola
   quedaba con un error permanente ("createRoot() on a container that has
   already been passed to createRoot()"). No hacía falta estar dentro de la
   escena: es un overlay de DOM sin nada 3D, y `useProgress` de drei lee el
   gestor de carga global, así que funciona igual afuera. De paso se ahorra el
   puente 3D→DOM en el momento de arranque, que es cuando menos sobra. */
function V3Loader() {
  const { progress, active } = useProgress();
  /* Solo la PRIMERA carga. `useProgress` se vuelve a activar cada vez que
     entran texturas nuevas —y en este museo entran a medida que uno avanza por
     las salas—, así que sin este pestillo el panel negro a pantalla completa
     reaparecía en mitad del recorrido y tapaba la sala que se estaba mirando.
     Antes no pasaba porque el loader vivía dentro de <Suspense>, que solo
     suspende al montar; al sacarlo de ahí (para no montar una segunda raíz de
     React) había que reponer esa condición a mano. */
  const listo = useRef(false);
  if (!active && progress >= 100) listo.current = true;
  if (listo.current) return null;
  return (
    <div className="v3-loader" aria-live="polite" aria-busy="true">
        <p className="v3-loader-brand">Digitals</p>
        <div className="v3-loader-track">
          <div className="v3-loader-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="v3-loader-pct">{progress.toFixed(0)}%</p>
        <p className="v3-loader-hint">Construyendo el túnel…</p>
    </div>
  );
}

/* ═══════════════ ESCENA ═══════════════ */
export default function TunnelScene({ mobile }: { mobile: boolean }) {
  /* los arcos terminan antes de la sala de cine (pared en z -374, cine -392) */
  const archCount = mobile ? 62 : 95;
  const archSpacing = mobile ? 6 : 4;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1 }}>
      <V3Loader />
      <Canvas
        camera={{ fov: 58, near: 0.1, far: 440, position: [0, CAM_Y, 8] }}
        gl={{ antialias: !mobile, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[FOG_COLOR]} />
        <fog attach="fog" args={[FOG_COLOR, 3, 30]} />
        <Suspense fallback={null}>
          <ScrollControls pages={PAGES} damping={0.28}>
            <CameraRig mobile={mobile} />

            {/* túnel */}
            <Arches count={archCount} spacing={archSpacing} />
            {/* reflejo espejo bajo el piso negro */}
            <group scale={[1, -1, 1]}>
              <Arches count={archCount} spacing={archSpacing} mirrored />
            </group>
            <GlowPlanes count={mobile ? 33 : 50} spacing={archSpacing} />
            <Dust count={mobile ? 190 : 520} />
            <WarpStreaks count={mobile ? 26 : 64} />

            {/* halls por marca + pared final de casos */}
            <HallsGallery mobile={mobile} />
            <HallWord
              word="Más casos"
              kicker="ANTES DEL CINE"
              tagline="Dos casos más, en corto"
              z={MORE_WORD_Z}
              compact
            />
            <MoreCasesWall mobile={mobile} />

            {/* sala de cine */}
            <Cinema mobile={mobile} />

            {/* etapas HTML */}
            <Scroll html style={{ width: "100%" }}>
              <OverlaySections />
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
