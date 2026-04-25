"use client";

import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { store } from "@/lib/store";

/* ═══════════════════════════════════════════════════════
   VERTEX SHADER — dual depth-map displacement

   Blends between exterior and interior depth maps
   based on uBlend (0 = exterior, 1 = interior).
   ═══════════════════════════════════════════════════════ */
const vertexShader = /* glsl */ `
  uniform sampler2D uDepthExt;
  uniform sampler2D uDepthInt;
  uniform float uTime;
  uniform float uDepth;
  uniform float uBlend;
  uniform float uDistortion;
  uniform vec2  uMouse;

  varying vec2  vUv;
  varying float vDepthValue;

  void main() {
    vUv = uv;
    vec3 pos = position;

    /* ── sample both depth maps and blend ── */
    float dExt = 1.0 - texture2D(uDepthExt, uv).r;
    float dInt = 1.0 - texture2D(uDepthInt, uv).r;
    float depth = mix(dExt, dInt, uBlend);
    depth = smoothstep(0.05, 0.95, depth);
    vDepthValue = depth;

    /* ── displace toward camera (very gentle) ── */
    pos.z += depth * uDepth;

    /* ── minimal concave curvature ── */
    pos.z += sin(uv.x * 3.14159) * 0.35;
    pos.z += sin(uv.y * 3.14159) * 0.1;

    /* ── very subtle mouse ripple ── */
    pos.z += sin(pos.x * 1.8 + pos.y * 1.2 + uTime * 0.6)
           * uDistortion * 0.015;

    /* ── gentle mouse proximity ── */
    float mDist = length(uv - uMouse);
    pos.z += smoothstep(0.35, 0.0, mDist) * uDistortion * 0.04;

    /* ── breathing ── */
    pos.z += sin(uTime * 0.35) * 0.02;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/* ═══════════════════════════════════════════════════════
   FRAGMENT SHADER — crossfade between exterior & interior
   ═══════════════════════════════════════════════════════ */
const fragmentShader = /* glsl */ `
  uniform sampler2D uTexExt;
  uniform sampler2D uTexInt;
  uniform float uTime;
  uniform float uBlend;
  uniform float uDistortion;

  varying vec2  vUv;
  varying float vDepthValue;

  void main() {
    vec2 uv = vUv;

    /* ── very subtle UV distortion (only on fast mouse) ── */
    uv += vec2(
      sin(uv.y * 10.0 + uTime * 1.5) * uDistortion * 0.0008,
      cos(uv.x * 10.0 + uTime * 1.8) * uDistortion * 0.0008
    );
    uv = clamp(uv, 0.001, 0.999);

    /* ── sample both textures clean ── */
    vec3 colExt = texture2D(uTexExt, uv).rgb;
    vec3 colInt = texture2D(uTexInt, uv).rgb;

    /* ── blend exterior → interior ── */
    vec3 color = mix(colExt, colInt, uBlend);

    /* ── subtle depth brightness ── */
    color += smoothstep(0.6, 1.0, vDepthValue) * 0.06 * vec3(1.0, 0.98, 0.95);

    /* ── depth brightness ── */
    color *= 0.9 + vDepthValue * 0.18;

    /* ── edge fade ── */
    float edgeX = smoothstep(0.0, 0.1, min(vUv.x, 1.0 - vUv.x));
    float edgeY = smoothstep(0.0, 0.1, min(vUv.y, 1.0 - vUv.y));

    gl_FragColor = vec4(color, edgeX * edgeY);
  }
`;

/* ═══════════════════════════════════════════════════════
   HubObject — exterior → interior crossfade terrain
   Images: 2048 × 1143 (landscape ~16:9)
   ═══════════════════════════════════════════════════════ */
export function HubObject() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const smoothVel = useRef(0);
  const smoothMouse = useRef({ x: 0.5, y: 0.5 });
  const smoothBlend = useRef(0);
  const scroll = useScroll();

  // Load all 4 textures
  const texExt = useLoader(THREE.TextureLoader, "/exterior.jpg");
  const texInt = useLoader(THREE.TextureLoader, "/interior.jpg");
  const depthExt = useLoader(THREE.TextureLoader, "/exterior-depth.jpg");
  const depthInt = useLoader(THREE.TextureLoader, "/interior-depth.jpg");

  // Configure textures
  [texExt, texInt].forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
  });
  [depthExt, depthInt].forEach((t) => {
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
  });

  const uniforms = useMemo(
    () => ({
      uTexExt: { value: texExt },
      uTexInt: { value: texInt },
      uDepthExt: { value: depthExt },
      uDepthInt: { value: depthInt },
      uTime: { value: 0 },
      uDepth: { value: 1.2 },
      uBlend: { value: 0 },
      uDistortion: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [texExt, texInt, depthExt, depthInt]
  );

  useFrame(({ clock }) => {
    if (!matRef.current) return;

    smoothVel.current = THREE.MathUtils.lerp(
      smoothVel.current,
      store.mouseVelocity,
      0.07
    );
    smoothMouse.current.x = THREE.MathUtils.lerp(
      smoothMouse.current.x,
      (store.mouseX + 1) * 0.5,
      0.05
    );
    smoothMouse.current.y = THREE.MathUtils.lerp(
      smoothMouse.current.y,
      (store.mouseY + 1) * 0.5,
      0.05
    );

    // Crossfade: exterior (0-25%) → transition (25-40%) → interior (40-100%)
    const offset = scroll.offset;
    const blend = THREE.MathUtils.smoothstep(offset, 0.22, 0.42);
    smoothBlend.current = THREE.MathUtils.lerp(
      smoothBlend.current,
      blend,
      0.06
    );

    matRef.current.uniforms.uTime.value = clock.elapsedTime;
    matRef.current.uniforms.uBlend.value = smoothBlend.current;
    matRef.current.uniforms.uDistortion.value = Math.min(smoothVel.current, 4);
    matRef.current.uniforms.uMouse.value.set(
      smoothMouse.current.x,
      smoothMouse.current.y
    );
  });

  // Landscape: 2048 × 1143 → aspect ≈ 1.79
  const W = 24;
  const H = W / (2048 / 1143); // ≈ 13.4

  return (
    <mesh>
      <planeGeometry args={[W, H, 180, 100]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
