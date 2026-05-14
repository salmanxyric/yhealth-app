# Cinematic Preloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-component cinematic preloader system — a full-screen 3D splash intro (first visit) and a lightweight route loader (page transitions) — using Three.js/R3F with post-processing, particle systems, and GSAP-driven dissolution.

**Architecture:** The preloader lives in `client/components/preloader/` as a self-contained module. `CinematicSplash` is a fixed overlay rendered in the root layout that plays once per session, then unmounts. `RouteLoader` replaces the existing `loading.tsx`. Both share constants and the `EnergyCore` visual language. Shaders are inlined as template literal strings (no `.glsl` imports — Turbopack doesn't support raw-loader).

**Tech Stack:** Three.js, @react-three/fiber 9.5, @react-three/drei 10.7, @react-three/postprocessing 3.0, GSAP 3.12, Framer Motion (fallback only)

**Spec:** `docs/superpowers/specs/2026-05-14-cinematic-preloader-design.md`

---

## File Map

| File | Responsibility | Creates/Modifies |
|------|---------------|-----------------|
| `client/components/preloader/constants.ts` | All color tokens, timing values, animation params | Create |
| `client/components/preloader/shaders/energy-flow.ts` | GLSL vertex+fragment for icosahedron edge energy pulses | Create |
| `client/components/preloader/shaders/grid-ripple.ts` | GLSL fragment for quantum grid with ripple waves | Create |
| `client/components/preloader/shaders/particle-trail.ts` | GLSL vertex+fragment for particle size/opacity by distance | Create |
| `client/components/preloader/scene/EnergyCore.tsx` | Wireframe icosahedron + inner glow sphere | Create |
| `client/components/preloader/scene/OrbitalRings.tsx` | 3 concentric rings with traveling nodes | Create |
| `client/components/preloader/scene/NeuralParticles.tsx` | 200 instanced particles spiraling inward | Create |
| `client/components/preloader/scene/HolographicPanels.tsx` | 4 floating translucent UI panels with canvas textures | Create |
| `client/components/preloader/scene/QuantumGrid.tsx` | Floor grid plane with ripple shader | Create |
| `client/components/preloader/scene/AmbientParticles.tsx` | 100 background star dust points | Create |
| `client/components/preloader/scene/Lighting.tsx` | All light sources for the scene | Create |
| `client/components/preloader/scene/CameraRig.tsx` | Orbiting camera with micro-zoom and vertical bob | Create |
| `client/components/preloader/scene/PostProcessing.tsx` | EffectComposer: Bloom, DOF, Vignette, ChromAb, Noise | Create |
| `client/components/preloader/hooks/use-loading-progress.ts` | Real progress tracking across 4 stages | Create |
| `client/components/preloader/hooks/use-splash-state.ts` | Session storage check + state machine (loading → ready → dissolving → done) | Create |
| `client/components/preloader/ProgressOverlay.tsx` | HTML overlay with progress bar and loading text | Create |
| `client/components/preloader/ProgressRing.tsx` | SVG progress ring for route loader | Create |
| `client/components/preloader/CinematicSplash.tsx` | Full intro orchestrator — Canvas + scene + overlay + dissolution | Create |
| `client/components/preloader/RouteLoader.tsx` | Lightweight route transition version | Create |
| `client/app/layout.tsx` | Add CinematicSplash overlay + hydration event | Modify |
| `client/app/loading.tsx` | Replace with RouteLoader | Modify |

---

## Task 1: Constants & Shared Configuration

**Files:**
- Create: `client/components/preloader/constants.ts`

- [ ] **Step 1: Create the constants file**

```ts
// client/components/preloader/constants.ts
import * as THREE from "three";

// ─── Color palette ──────────────────────────────────────────────
export const COLORS = {
  coreCyan: new THREE.Color("#00E5FF"),
  electricBlue: new THREE.Color("#2979FF"),
  violet: new THREE.Color("#7C4DFF"),
  gold: new THREE.Color("#FFD740"),
  whiteHighlight: new THREE.Color("#FFFFFF"),
  deepBlack: new THREE.Color("#0A0A0F"),
  darkNavy: new THREE.Color("#0D1117"),
  paleBlue: new THREE.Color("#E0F7FA"),
} as const;

export const CSS_COLORS = {
  coreCyan: "#00E5FF",
  electricBlue: "#2979FF",
  violet: "#7C4DFF",
  gold: "#FFD740",
  deepBlack: "#0A0A0F",
} as const;

// ─── Core geometry ──────────────────────────────────────────────
export const CORE = {
  radius: 1,
  detail: 1,
  innerSphereRadius: 0.6,
  innerSphereOpacity: 0.3,
  innerEmissiveIntensity: 0.8,
  breatheMin: 0.95,
  breatheMax: 1.05,
  breathePeriod: 3,
  rotationYPeriod: 8,
  rotationXPeriod: 12,
  emissiveMin: 0.6,
  emissiveMax: 1.0,
} as const;

// ─── Orbital rings ──────────────────────────────────────────────
export const RINGS = [
  {
    radius: 1.8,
    tubeRadius: 0.008,
    tiltX: THREE.MathUtils.degToRad(15),
    tiltZ: 0,
    tiltY: 0,
    revolutionPeriod: 6,
    color: COLORS.coreCyan,
    opacity: 0.6,
    nodeCount: 2,
    nodeRadius: 0.04,
  },
  {
    radius: 2.7,
    tubeRadius: 0.006,
    tiltX: 0,
    tiltZ: THREE.MathUtils.degToRad(-25),
    tiltY: 0,
    revolutionPeriod: 10,
    color: COLORS.electricBlue,
    opacity: 0.4,
    nodeCount: 3,
    nodeRadius: 0.04,
  },
  {
    radius: 3.8,
    tubeRadius: 0.004,
    tiltX: THREE.MathUtils.degToRad(40),
    tiltZ: 0,
    tiltY: THREE.MathUtils.degToRad(10),
    revolutionPeriod: 16,
    color: COLORS.violet,
    opacity: 0.3,
    nodeCount: 2,
    nodeRadius: 0.04,
  },
] as const;

// ─── Particles ──────────────────────────────────────────────────
export const NEURAL_PARTICLES = {
  count: 200,
  spawnRadiusMin: 5,
  spawnRadiusMax: 6,
  coreRadius: 1.2,
  travelTimeMin: 2,
  travelTimeMax: 4,
  trailLength: 4,
  sizeMin: 1.5,
  sizeMax: 6.0,
} as const;

export const AMBIENT_PARTICLES = {
  count: 100,
  radiusMin: 8,
  radiusMax: 15,
  sizeMin: 0.5,
  sizeMax: 1.5,
  driftSpeed: 0.001,
  opacityMin: 0.3,
  opacityMax: 0.6,
} as const;

// ─── Holographic panels ─────────────────────────────────────────
export const PANELS = {
  count: 4,
  positions: [
    [-2.5, 0.8, 1],
    [2.2, -0.3, -1.5],
    [-1.8, -1, -0.5],
    [3, 0.5, 0.8],
  ] as [number, number, number][],
  sizes: [
    [1.0, 0.6],
    [0.8, 0.5],
    [1.2, 0.8],
    [0.9, 0.55],
  ] as [number, number][],
  opacity: { min: 0.15, max: 0.25 },
  floatAmplitude: 0.05,
  floatPeriods: [4, 5, 4.5, 6],
} as const;

// ─── Quantum grid ───────────────────────────────────────────────
export const GRID = {
  size: 20,
  divisions: 40,
  yPosition: -2,
  lineOpacityBase: 0.08,
  lineOpacityRipple: 0.3,
  rippleInterval: 3,
  rippleSpeed: 2,
  fadeRadius: 8,
} as const;

// ─── Camera ─────────────────────────────────────────────────────
export const CAMERA = {
  fov: 60,
  near: 0.1,
  far: 100,
  orbitRadius: 7,
  orbitElevationDeg: 15,
  orbitPeriod: 40,
  microZoomAmount: 3,
  microZoomInDuration: 1.5,
  microZoomOutDuration: 2,
  microZoomInterval: 9,
  verticalBobAmplitudeDeg: 3,
  verticalBobPeriod: 12,
} as const;

// ─── Post-processing ────────────────────────────────────────────
export const POST_PROCESSING = {
  bloom: { luminanceThreshold: 0.2, intensity: 1.5, mipmapBlur: true },
  depthOfField: { focusDistance: 0.02, focalLength: 0.05, bokehScale: 2 },
  vignette: { offset: 0.3, darkness: 0.7 },
  chromaticAberration: { offset: 0.0005 },
  noise: { opacity: 0.03, premultiply: true },
} as const;

// ─── Lighting ───────────────────────────────────────────────────
export const LIGHTING = {
  coreGlow: { color: "#FFD740", intensity: 2.0, pulseMin: 1.5, pulseMax: 2.5 },
  rim: { color: "#2979FF", intensity: 0.5, position: [2, 3, -5] as [number, number, number] },
  fill: { color: "#FFFFFF", intensity: 0.05 },
  leftAccent: { color: "#7C4DFF", intensity: 0.8, position: [-4, 3, 2] as [number, number, number], angle: Math.PI / 6 },
  rightAccent: { color: "#00E5FF", intensity: 0.6, position: [4, 2, -2] as [number, number, number], angle: Math.PI / 7.2 },
} as const;

// ─── Timing ─────────────────────────────────────────────────────
export const TIMING = {
  minDisplayMs: 2500,
  maxDisplayMs: 8000,
  dissolutionDurationMs: 1500,
  flashDurationMs: 400,
  shatterDurationMs: 600,
  fadeDurationMs: 500,
  routeLoaderFadeInMs: 200,
  routeLoaderFadeOutMs: 300,
  progressSmoothingDuration: 0.8,
} as const;

// ─── Session storage key ────────────────────────────────────────
export const SPLASH_SHOWN_KEY = "balencia-splash-shown";
```

- [ ] **Step 2: Verify the file compiles**

Run from `client/`:
```bash
npx tsc --noEmit components/preloader/constants.ts --skipLibCheck
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/components/preloader/constants.ts
git commit -m "feat(preloader): add constants and shared configuration"
```

---

## Task 2: GLSL Shaders (Inlined as TypeScript)

**Files:**
- Create: `client/components/preloader/shaders/energy-flow.ts`
- Create: `client/components/preloader/shaders/grid-ripple.ts`
- Create: `client/components/preloader/shaders/particle-trail.ts`

- [ ] **Step 1: Create the energy-flow shader**

This shader makes bright energy pulses travel along icosahedron edges. It uses the vertex positions to create a wave of brightness that moves around the geometry.

```ts
// client/components/preloader/shaders/energy-flow.ts

export const energyFlowVertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const energyFlowFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform float uEmissiveIntensity;
  uniform float uDissolve; // 0.0 = normal, 1.0 = fully dissolved

  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Edge detection via fresnel — wireframe-like bright edges
    float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    fresnel = pow(fresnel, 1.5);

    // Energy pulse traveling along the surface
    float pulse = sin(vPosition.x * 3.0 + vPosition.y * 2.0 + vPosition.z * 4.0 + uTime * 3.0);
    pulse = smoothstep(0.3, 1.0, pulse);

    // Second pulse at different frequency for complexity
    float pulse2 = sin(vPosition.y * 5.0 - vPosition.z * 3.0 + uTime * 2.0);
    pulse2 = smoothstep(0.5, 1.0, pulse2) * 0.5;

    float energy = (pulse + pulse2) * uEmissiveIntensity;

    // Combine: base edge glow + energy pulses
    vec3 color = uBaseColor * (fresnel * 0.4 + energy * 0.8 + 0.2);

    // Dissolve: fade out opacity
    float alpha = (fresnel * 0.6 + 0.4) * (1.0 - uDissolve);

    gl_FragColor = vec4(color, alpha);
  }
`;
```

- [ ] **Step 2: Create the grid-ripple shader**

```ts
// client/components/preloader/shaders/grid-ripple.ts

export const gridRippleVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const gridRippleFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  uniform float uRippleOpacity;
  uniform float uRippleInterval;
  uniform float uRippleSpeed;
  uniform float uFadeRadius;
  uniform float uDissolve;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    // Grid lines at 0.5 unit spacing
    vec2 gridCoord = vWorldPosition.xz;
    float lineWidth = 0.02;
    float spacing = 0.5;

    vec2 grid = abs(fract(gridCoord / spacing - 0.5) - 0.5) / fwidth(gridCoord / spacing);
    float line = min(grid.x, grid.y);
    float gridMask = 1.0 - min(line, 1.0);

    // Distance from center for fade
    float dist = length(vWorldPosition.xz);
    float distanceFade = 1.0 - smoothstep(uFadeRadius * 0.5, uFadeRadius, dist);

    // Ripple waves expanding from center
    float ripplePhase = uTime / uRippleInterval;
    float ripple = 0.0;
    for (int i = 0; i < 3; i++) {
      float phase = ripplePhase - float(i) * 0.33;
      float waveFront = fract(phase) * uFadeRadius * uRippleSpeed;
      float waveWidth = 1.5;
      float wave = 1.0 - smoothstep(0.0, waveWidth, abs(dist - waveFront));
      wave *= 1.0 - fract(phase); // fade as wave expands
      ripple = max(ripple, wave);
    }

    float opacity = gridMask * distanceFade * (uBaseOpacity + ripple * uRippleOpacity);
    opacity *= (1.0 - uDissolve);

    gl_FragColor = vec4(uColor, opacity);
  }
`;
```

- [ ] **Step 3: Create the particle-trail shader**

```ts
// client/components/preloader/shaders/particle-trail.ts

export const particleVertex = /* glsl */ `
  attribute float aSize;
  attribute float aOpacity;
  attribute vec3 aColor;

  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    vOpacity = aOpacity;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragment = /* glsl */ `
  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    // Soft circle shape
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;
```

- [ ] **Step 4: Commit**

```bash
git add client/components/preloader/shaders/
git commit -m "feat(preloader): add GLSL shaders for energy flow, grid ripple, and particles"
```

---

## Task 3: Scene Components — EnergyCore

**Files:**
- Create: `client/components/preloader/scene/EnergyCore.tsx`

- [ ] **Step 1: Create EnergyCore component**

```tsx
// client/components/preloader/scene/EnergyCore.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CORE, COLORS } from "../constants";
import { energyFlowVertex, energyFlowFragment } from "../shaders/energy-flow";

interface EnergyCoreProps {
  dissolve?: number; // 0 = normal, 1 = dissolved
}

export function EnergyCore({ dissolve = 0 }: EnergyCoreProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: COLORS.coreCyan },
      uEmissiveIntensity: { value: CORE.emissiveMax },
      uDissolve: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!groupRef.current || !shaderRef.current) return;

    const time = performance.now() / 1000;

    // Dual-axis rotation
    groupRef.current.rotation.y += (Math.PI * 2 * delta) / CORE.rotationYPeriod;
    groupRef.current.rotation.x += (Math.PI * 2 * delta) / CORE.rotationXPeriod;

    // Breathing scale
    const breathe = Math.sin(time * ((Math.PI * 2) / CORE.breathePeriod));
    const scale =
      CORE.breatheMin + (CORE.breatheMax - CORE.breatheMin) * (breathe * 0.5 + 0.5);
    groupRef.current.scale.setScalar(scale);

    // Emissive oscillation
    const emissive =
      CORE.emissiveMin +
      (CORE.emissiveMax - CORE.emissiveMin) * (breathe * 0.5 + 0.5);

    // Update shader uniforms
    shaderRef.current.uniforms.uTime.value = time;
    shaderRef.current.uniforms.uEmissiveIntensity.value = emissive;
    shaderRef.current.uniforms.uDissolve.value = dissolve;

    // Inner glow pulse synced with breathing
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = CORE.innerEmissiveIntensity * (0.8 + breathe * 0.2);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Wireframe icosahedron with energy flow shader */}
      <mesh>
        <icosahedronGeometry args={[CORE.radius, CORE.detail]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={energyFlowVertex}
          fragmentShader={energyFlowFragment}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[CORE.innerSphereRadius, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.gold}
          emissive={COLORS.gold}
          emissiveIntensity={CORE.innerEmissiveIntensity}
          transparent
          opacity={CORE.innerSphereOpacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/preloader/scene/EnergyCore.tsx
git commit -m "feat(preloader): add EnergyCore component with wireframe icosahedron and inner glow"
```

---

## Task 4: Scene Components — OrbitalRings

**Files:**
- Create: `client/components/preloader/scene/OrbitalRings.tsx`

- [ ] **Step 1: Create OrbitalRings component**

```tsx
// client/components/preloader/scene/OrbitalRings.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RINGS } from "../constants";

interface OrbitalRingsProps {
  dissolve?: number;
  progressNodeFraction?: number; // 0-1, drives inner ring progress node
}

export function OrbitalRings({ dissolve = 0, progressNodeFraction = 0 }: OrbitalRingsProps) {
  return (
    <group>
      {RINGS.map((ring, index) => (
        <SingleRing
          key={index}
          config={ring}
          index={index}
          dissolve={dissolve}
          progressNodeFraction={index === 0 ? progressNodeFraction : undefined}
        />
      ))}
    </group>
  );
}

interface SingleRingProps {
  config: (typeof RINGS)[number];
  index: number;
  dissolve: number;
  progressNodeFraction?: number;
}

function SingleRing({ config, index, dissolve, progressNodeFraction }: SingleRingProps) {
  const ringRef = useRef<THREE.Group>(null!);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

  const euler = useMemo(
    () => new THREE.Euler(config.tiltX, config.tiltY, config.tiltZ),
    [config.tiltX, config.tiltY, config.tiltZ]
  );

  useFrame((_, delta) => {
    if (!ringRef.current) return;

    // Rotate the ring group
    ringRef.current.rotation.y += (Math.PI * 2 * delta) / config.revolutionPeriod;

    // Animate traveling nodes
    const time = performance.now() / 1000;
    nodeRefs.current.forEach((node, i) => {
      if (!node) return;

      let angle: number;
      if (progressNodeFraction !== undefined && i === 0) {
        // Progress indicator node — position driven by load fraction
        angle = progressNodeFraction * Math.PI * 2;
      } else {
        // Normal traveling node — slightly different speed from ring
        const nodeSpeed = config.revolutionPeriod * (0.7 + i * 0.15);
        angle = (time / nodeSpeed) * Math.PI * 2 + (i * Math.PI * 2) / config.nodeCount;
      }

      node.position.x = Math.cos(angle) * config.radius;
      node.position.z = Math.sin(angle) * config.radius;

      // Progress node flare at 100%
      if (progressNodeFraction !== undefined && i === 0 && progressNodeFraction >= 0.99) {
        const flare = 1 + Math.sin(time * 8) * 0.5;
        node.scale.setScalar(flare);
      }
    });
  });

  return (
    <group rotation={euler}>
      <group ref={ringRef}>
        {/* Ring torus */}
        <mesh>
          <torusGeometry args={[config.radius, config.tubeRadius, 16, 100]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={0.5}
            transparent
            opacity={config.opacity * (1 - dissolve)}
            depthWrite={false}
          />
        </mesh>

        {/* Traveling nodes */}
        {Array.from({ length: config.nodeCount }, (_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) nodeRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[config.nodeRadius, 16, 16]} />
            <meshStandardMaterial
              color={config.color}
              emissive={config.color}
              emissiveIntensity={1.5}
              transparent
              opacity={1 - dissolve}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/preloader/scene/OrbitalRings.tsx
git commit -m "feat(preloader): add OrbitalRings with traveling nodes and progress indicator"
```

---

## Task 5: Scene Components — NeuralParticles

**Files:**
- Create: `client/components/preloader/scene/NeuralParticles.tsx`

- [ ] **Step 1: Create NeuralParticles component**

This is the most complex component. 200 particles spiral inward, burst outward on reaching the core, and respawn. Uses instanced `<Points>` with custom buffer attributes.

```tsx
// client/components/preloader/scene/NeuralParticles.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NEURAL_PARTICLES, COLORS } from "../constants";
import { particleVertex, particleFragment } from "../shaders/particle-trail";

interface NeuralParticlesProps {
  dissolve?: number;
}

function randomOnSphere(radiusMin: number, radiusMax: number): THREE.Vector3 {
  const r = radiusMin + Math.random() * (radiusMax - radiusMin);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

function pickColor(index: number): THREE.Color {
  const ratio = index / NEURAL_PARTICLES.count;
  if (ratio < 0.6) return COLORS.coreCyan.clone();
  if (ratio < 0.85) return COLORS.whiteHighlight.clone();
  if (ratio < 0.95) return COLORS.gold.clone();
  return COLORS.violet.clone();
}

export function NeuralParticles({ dissolve = 0 }: NeuralParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!);

  // Include trail positions: each particle has trailLength copies
  const totalPoints = NEURAL_PARTICLES.count * NEURAL_PARTICLES.trailLength;

  const { positions, sizes, opacities, colors, particleState } = useMemo(() => {
    const pos = new Float32Array(totalPoints * 3);
    const sz = new Float32Array(totalPoints);
    const op = new Float32Array(totalPoints);
    const col = new Float32Array(totalPoints * 3);

    const state = Array.from({ length: NEURAL_PARTICLES.count }, (_, i) => {
      const start = randomOnSphere(
        NEURAL_PARTICLES.spawnRadiusMin,
        NEURAL_PARTICLES.spawnRadiusMax
      );
      const speed =
        NEURAL_PARTICLES.travelTimeMin +
        Math.random() * (NEURAL_PARTICLES.travelTimeMax - NEURAL_PARTICLES.travelTimeMin);
      const spiralOffset = Math.random() * Math.PI * 2;
      const color = pickColor(i);

      // Initialize all trail positions to spawn point
      for (let t = 0; t < NEURAL_PARTICLES.trailLength; t++) {
        const idx = (i * NEURAL_PARTICLES.trailLength + t) * 3;
        pos[idx] = start.x;
        pos[idx + 1] = start.y;
        pos[idx + 2] = start.z;

        const trailIdx = i * NEURAL_PARTICLES.trailLength + t;
        sz[trailIdx] = NEURAL_PARTICLES.sizeMin;
        op[trailIdx] = t === 0 ? 1.0 : Math.max(0.1, 1.0 - t * 0.3);

        col[trailIdx * 3] = color.r;
        col[trailIdx * 3 + 1] = color.g;
        col[trailIdx * 3 + 2] = color.b;
      }

      return {
        position: start,
        prevPositions: Array.from({ length: NEURAL_PARTICLES.trailLength }, () => start.clone()),
        progress: Math.random(), // Start at random progress so particles are spread out
        speed,
        spiralOffset,
        burstVelocity: null as THREE.Vector3 | null,
      };
    });

    return { positions: pos, sizes: sz, opacities: op, colors: col, particleState: state };
  }, [totalPoints]);

  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const sizeAttr = geo.getAttribute("aSize") as THREE.BufferAttribute;
    const opacityAttr = geo.getAttribute("aOpacity") as THREE.BufferAttribute;

    for (let i = 0; i < NEURAL_PARTICLES.count; i++) {
      const p = particleState[i];

      if (dissolve > 0.1 && !p.burstVelocity) {
        // Dissolution: burst all particles outward
        p.burstVelocity = p.position.clone().normalize().multiplyScalar(3 + Math.random() * 3);
      }

      if (p.burstVelocity) {
        // Burst outward
        p.position.add(p.burstVelocity.clone().multiplyScalar(delta));
        p.burstVelocity.multiplyScalar(0.98); // slow down
      } else {
        // Spiral inward
        p.progress += delta / p.speed;

        if (p.progress >= 1) {
          // Reached core — respawn
          p.position.copy(
            randomOnSphere(NEURAL_PARTICLES.spawnRadiusMin, NEURAL_PARTICLES.spawnRadiusMax)
          );
          p.progress = 0;
          p.speed =
            NEURAL_PARTICLES.travelTimeMin +
            Math.random() * (NEURAL_PARTICLES.travelTimeMax - NEURAL_PARTICLES.travelTimeMin);
          p.prevPositions.forEach((pp) => pp.copy(p.position));
        } else {
          // Interpolate toward center with spiral
          const t = p.progress;
          const radius = NEURAL_PARTICLES.spawnRadiusMax * (1 - t) + NEURAL_PARTICLES.coreRadius * t;
          const angle = p.spiralOffset + t * Math.PI * 4; // 2 full spirals
          const baseDir = p.prevPositions[0].clone().normalize();

          // Create perpendicular vectors for spiral
          const up = new THREE.Vector3(0, 1, 0);
          const right = new THREE.Vector3().crossVectors(baseDir, up).normalize();
          const forward = new THREE.Vector3().crossVectors(right, baseDir).normalize();

          const spiralX = Math.cos(angle) * radius * 0.3;
          const spiralZ = Math.sin(angle) * radius * 0.3;

          p.position.copy(baseDir.multiplyScalar(radius));
          p.position.add(right.multiplyScalar(spiralX));
          p.position.add(forward.multiplyScalar(spiralZ));
        }
      }

      // Update trail positions (shift history)
      for (let t = NEURAL_PARTICLES.trailLength - 1; t > 0; t--) {
        p.prevPositions[t].copy(p.prevPositions[t - 1]);
      }
      p.prevPositions[0].copy(p.position);

      // Write all trail positions to buffer
      for (let t = 0; t < NEURAL_PARTICLES.trailLength; t++) {
        const idx = (i * NEURAL_PARTICLES.trailLength + t) * 3;
        const pos = p.prevPositions[t];
        posAttr.array[idx] = pos.x;
        posAttr.array[idx + 1] = pos.y;
        posAttr.array[idx + 2] = pos.z;

        const trailIdx = i * NEURAL_PARTICLES.trailLength + t;
        const dist = pos.length();
        const sizeFactor = 1 - (dist - NEURAL_PARTICLES.coreRadius) /
          (NEURAL_PARTICLES.spawnRadiusMax - NEURAL_PARTICLES.coreRadius);
        sizeAttr.array[trailIdx] =
          NEURAL_PARTICLES.sizeMin + (NEURAL_PARTICLES.sizeMax - NEURAL_PARTICLES.sizeMin) * Math.max(0, sizeFactor);

        const trailFade = t === 0 ? 1.0 : Math.max(0.1, 1.0 - t * 0.3);
        opacityAttr.array[trailIdx] = trailFade * (1 - dissolve);
      }
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={totalPoints} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" array={sizes} count={totalPoints} itemSize={1} />
        <bufferAttribute attach="attributes-aOpacity" array={opacities} count={totalPoints} itemSize={1} />
        <bufferAttribute attach="attributes-aColor" array={colors} count={totalPoints} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/preloader/scene/NeuralParticles.tsx
git commit -m "feat(preloader): add NeuralParticles with spiral-in motion and trail system"
```

---

## Task 6: Scene Components — HolographicPanels

**Files:**
- Create: `client/components/preloader/scene/HolographicPanels.tsx`

- [ ] **Step 1: Create HolographicPanels component**

Each panel generates a decorative "UI" texture on an offscreen canvas, then renders it as a translucent floating plane.

```tsx
// client/components/preloader/scene/HolographicPanels.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PANELS, CSS_COLORS } from "../constants";

interface HolographicPanelsProps {
  dissolve?: number;
}

function generatePanelTexture(
  variant: number,
  width: number,
  height: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;

  // Background: transparent
  ctx.clearRect(0, 0, 256, 160);

  // Border glow
  ctx.strokeStyle = CSS_COLORS.coreCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.strokeRect(4, 4, 248, 152);
  ctx.globalAlpha = 1;

  // Content varies by variant
  ctx.fillStyle = CSS_COLORS.coreCyan;
  ctx.globalAlpha = 0.3;

  if (variant === 0) {
    // Text lines
    for (let i = 0; i < 8; i++) {
      const w = 60 + Math.random() * 150;
      ctx.fillRect(16, 16 + i * 16, w, 3);
    }
  } else if (variant === 1) {
    // Bar chart
    for (let i = 0; i < 5; i++) {
      const h = 20 + Math.random() * 80;
      ctx.fillRect(20 + i * 44, 140 - h, 30, h);
    }
  } else if (variant === 2) {
    // Circular progress arc
    ctx.beginPath();
    ctx.arc(128, 80, 50, 0, Math.PI * 1.6);
    ctx.strokeStyle = CSS_COLORS.coreCyan;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    // Dot at end
    const endAngle = Math.PI * 1.6;
    ctx.beginPath();
    ctx.arc(128 + Math.cos(endAngle) * 50, 80 + Math.sin(endAngle) * 50, 4, 0, Math.PI * 2);
    ctx.fillStyle = CSS_COLORS.coreCyan;
    ctx.globalAlpha = 0.6;
    ctx.fill();
  } else {
    // Data matrix dots
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 12; c++) {
        if (Math.random() > 0.4) {
          ctx.globalAlpha = 0.1 + Math.random() * 0.3;
          ctx.beginPath();
          ctx.arc(20 + c * 20, 16 + r * 18, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function HolographicPanels({ dissolve = 0 }: HolographicPanelsProps) {
  const panelRefs = useRef<THREE.Mesh[]>([]);
  const { camera } = useThree();

  const textures = useMemo(
    () =>
      PANELS.positions.map((_, i) =>
        generatePanelTexture(i, PANELS.sizes[i][0], PANELS.sizes[i][1])
      ),
    []
  );

  useFrame(() => {
    const time = performance.now() / 1000;

    panelRefs.current.forEach((mesh, i) => {
      if (!mesh) return;

      // Float bobbing
      const baseY = PANELS.positions[i][1];
      mesh.position.y =
        baseY + Math.sin(time * ((Math.PI * 2) / PANELS.floatPeriods[i]) + i) * PANELS.floatAmplitude;

      // Slow billboard toward camera (damped)
      const targetQuat = new THREE.Quaternion();
      const lookMatrix = new THREE.Matrix4().lookAt(
        mesh.position,
        camera.position,
        new THREE.Vector3(0, 1, 0)
      );
      targetQuat.setFromRotationMatrix(lookMatrix);
      mesh.quaternion.slerp(targetQuat, 0.02);

      // Dissolve: drift backward and fade
      if (dissolve > 0) {
        const dir = mesh.position.clone().normalize();
        mesh.position.add(dir.multiplyScalar(dissolve * 0.05));
      }
    });
  });

  return (
    <group>
      {PANELS.positions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) panelRefs.current[i] = el;
          }}
          position={pos}
        >
          <planeGeometry args={PANELS.sizes[i]} />
          <meshPhysicalMaterial
            map={textures[i]}
            transparent
            opacity={(PANELS.opacity.min + (PANELS.opacity.max - PANELS.opacity.min) * (i / PANELS.count)) * (1 - dissolve)}
            roughness={0.1}
            transmission={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/preloader/scene/HolographicPanels.tsx
git commit -m "feat(preloader): add HolographicPanels with canvas-generated UI textures"
```

---

## Task 7: Scene Components — QuantumGrid, AmbientParticles, Lighting

**Files:**
- Create: `client/components/preloader/scene/QuantumGrid.tsx`
- Create: `client/components/preloader/scene/AmbientParticles.tsx`
- Create: `client/components/preloader/scene/Lighting.tsx`

- [ ] **Step 1: Create QuantumGrid**

```tsx
// client/components/preloader/scene/QuantumGrid.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GRID, COLORS } from "../constants";
import { gridRippleVertex, gridRippleFragment } from "../shaders/grid-ripple";

interface QuantumGridProps {
  dissolve?: number;
}

export function QuantumGrid({ dissolve = 0 }: QuantumGridProps) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: COLORS.coreCyan },
      uBaseOpacity: { value: GRID.lineOpacityBase },
      uRippleOpacity: { value: GRID.lineOpacityRipple },
      uRippleInterval: { value: GRID.rippleInterval },
      uRippleSpeed: { value: GRID.rippleSpeed },
      uFadeRadius: { value: GRID.fadeRadius },
      uDissolve: { value: 0 },
    }),
    []
  );

  useFrame(() => {
    if (!shaderRef.current) return;
    shaderRef.current.uniforms.uTime.value = performance.now() / 1000;
    shaderRef.current.uniforms.uDissolve.value = dissolve;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GRID.yPosition, 0]}>
      <planeGeometry args={[GRID.size, GRID.size, GRID.divisions, GRID.divisions]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={gridRippleVertex}
        fragmentShader={gridRippleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Create AmbientParticles**

```tsx
// client/components/preloader/scene/AmbientParticles.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AMBIENT_PARTICLES, COLORS } from "../constants";

interface AmbientParticlesProps {
  dissolve?: number;
}

export function AmbientParticles({ dissolve = 0 }: AmbientParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, driftDirections } = useMemo(() => {
    const pos = new Float32Array(AMBIENT_PARTICLES.count * 3);
    const drifts: THREE.Vector3[] = [];

    for (let i = 0; i < AMBIENT_PARTICLES.count; i++) {
      const r =
        AMBIENT_PARTICLES.radiusMin +
        Math.random() * (AMBIENT_PARTICLES.radiusMax - AMBIENT_PARTICLES.radiusMin);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      drifts.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize()
      );
    }

    return { positions: pos, driftDirections: drifts };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;

    for (let i = 0; i < AMBIENT_PARTICLES.count; i++) {
      posAttr.array[i * 3] += driftDirections[i].x * AMBIENT_PARTICLES.driftSpeed;
      posAttr.array[i * 3 + 1] += driftDirections[i].y * AMBIENT_PARTICLES.driftSpeed;
      posAttr.array[i * 3 + 2] += driftDirections[i].z * AMBIENT_PARTICLES.driftSpeed;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={AMBIENT_PARTICLES.count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        color={COLORS.paleBlue}
        transparent
        opacity={(AMBIENT_PARTICLES.opacityMax + AMBIENT_PARTICLES.opacityMin) / 2 * (1 - dissolve)}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

- [ ] **Step 3: Create Lighting**

```tsx
// client/components/preloader/scene/Lighting.tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LIGHTING, CORE } from "../constants";

interface LightingProps {
  dissolve?: number;
}

export function Lighting({ dissolve = 0 }: LightingProps) {
  const coreGlowRef = useRef<THREE.PointLight>(null!);

  useFrame(() => {
    if (!coreGlowRef.current) return;

    const time = performance.now() / 1000;
    const breathe = Math.sin(time * ((Math.PI * 2) / CORE.breathePeriod));
    const intensity =
      LIGHTING.coreGlow.pulseMin +
      (LIGHTING.coreGlow.pulseMax - LIGHTING.coreGlow.pulseMin) * (breathe * 0.5 + 0.5);
    coreGlowRef.current.intensity = intensity * (1 - dissolve);
  });

  return (
    <>
      <pointLight
        ref={coreGlowRef}
        color={LIGHTING.coreGlow.color}
        intensity={LIGHTING.coreGlow.intensity}
        position={[0, 0, 0]}
        distance={10}
        decay={2}
      />
      <directionalLight
        color={LIGHTING.rim.color}
        intensity={LIGHTING.rim.intensity * (1 - dissolve)}
        position={LIGHTING.rim.position}
      />
      <ambientLight color={LIGHTING.fill.color} intensity={LIGHTING.fill.intensity} />
      <spotLight
        color={LIGHTING.leftAccent.color}
        intensity={LIGHTING.leftAccent.intensity * (1 - dissolve)}
        position={LIGHTING.leftAccent.position}
        angle={LIGHTING.leftAccent.angle}
        penumbra={0.5}
        distance={15}
        decay={2}
      />
      <spotLight
        color={LIGHTING.rightAccent.color}
        intensity={LIGHTING.rightAccent.intensity * (1 - dissolve)}
        position={LIGHTING.rightAccent.position}
        angle={LIGHTING.rightAccent.angle}
        penumbra={0.5}
        distance={15}
        decay={2}
      />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/components/preloader/scene/QuantumGrid.tsx client/components/preloader/scene/AmbientParticles.tsx client/components/preloader/scene/Lighting.tsx
git commit -m "feat(preloader): add QuantumGrid, AmbientParticles, and Lighting scene components"
```

---

## Task 8: Scene Components — CameraRig & PostProcessing

**Files:**
- Create: `client/components/preloader/scene/CameraRig.tsx`
- Create: `client/components/preloader/scene/PostProcessing.tsx`

- [ ] **Step 1: Create CameraRig**

```tsx
// client/components/preloader/scene/CameraRig.tsx
"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "@/lib/gsap-init";
import { CAMERA } from "../constants";

export function CameraRig() {
  const { camera } = useThree();
  const fovRef = useRef(CAMERA.fov);
  const microZoomTween = useRef<gsap.core.Timeline | null>(null);

  // Set up repeating micro-zoom with GSAP
  useEffect(() => {
    const target = { fov: CAMERA.fov };

    const doZoom = () => {
      microZoomTween.current = gsap.timeline({ onComplete: () => {
        // Schedule next zoom after interval
        gsap.delayedCall(
          CAMERA.microZoomInterval - CAMERA.microZoomInDuration - CAMERA.microZoomOutDuration,
          doZoom
        );
      }});

      microZoomTween.current
        .to(target, {
          fov: CAMERA.fov - CAMERA.microZoomAmount,
          duration: CAMERA.microZoomInDuration,
          ease: "power2.inOut",
          onUpdate: () => { fovRef.current = target.fov; },
        })
        .to(target, {
          fov: CAMERA.fov,
          duration: CAMERA.microZoomOutDuration,
          ease: "power2.inOut",
          onUpdate: () => { fovRef.current = target.fov; },
        });
    };

    // Start first zoom after a short delay
    const initial = gsap.delayedCall(2, doZoom);

    return () => {
      initial.kill();
      microZoomTween.current?.kill();
      gsap.killTweensOf(target);
    };
  }, []);

  useFrame(() => {
    const time = performance.now() / 1000;

    // Orbit
    const orbitAngle = (time / CAMERA.orbitPeriod) * Math.PI * 2;
    // Sine-eased for organic feel
    const easedAngle = orbitAngle + Math.sin(orbitAngle * 0.5) * 0.3;

    // Vertical bob
    const elevationRad = THREE.MathUtils.degToRad(
      CAMERA.orbitElevationDeg +
        Math.sin(time * ((Math.PI * 2) / CAMERA.verticalBobPeriod)) * CAMERA.verticalBobAmplitudeDeg
    );

    const x = Math.cos(easedAngle) * CAMERA.orbitRadius * Math.cos(elevationRad);
    const y = Math.sin(elevationRad) * CAMERA.orbitRadius;
    const z = Math.sin(easedAngle) * CAMERA.orbitRadius * Math.cos(elevationRad);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);

    // Apply micro-zoom FOV
    if ((camera as THREE.PerspectiveCamera).fov !== fovRef.current) {
      (camera as THREE.PerspectiveCamera).fov = fovRef.current;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return null;
}
```

- [ ] **Step 2: Create PostProcessing**

```tsx
// client/components/preloader/scene/PostProcessing.tsx
"use client";

import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  ChromaticAberration,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { POST_PROCESSING } from "../constants";

interface PostProcessingProps {
  bloomIntensity?: number;
}

export function PostProcessingEffects({ bloomIntensity }: PostProcessingProps) {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={POST_PROCESSING.bloom.luminanceThreshold}
        intensity={bloomIntensity ?? POST_PROCESSING.bloom.intensity}
        mipmapBlur={POST_PROCESSING.bloom.mipmapBlur}
      />
      <DepthOfField
        focusDistance={POST_PROCESSING.depthOfField.focusDistance}
        focalLength={POST_PROCESSING.depthOfField.focalLength}
        bokehScale={POST_PROCESSING.depthOfField.bokehScale}
      />
      <Vignette
        offset={POST_PROCESSING.vignette.offset}
        darkness={POST_PROCESSING.vignette.darkness}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new Vector2(
          POST_PROCESSING.chromaticAberration.offset,
          POST_PROCESSING.chromaticAberration.offset
        )}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={POST_PROCESSING.noise.opacity}
        premultiply={POST_PROCESSING.noise.premultiply}
        blendFunction={BlendFunction.SCREEN}
      />
    </EffectComposer>
  );
}
```

- [ ] **Step 3: Verify postprocessing import works**

The `postprocessing` library is a peer dependency of `@react-three/postprocessing`. Check it's installed:

Run from `client/`:
```bash
node -e "require('postprocessing'); console.log('OK')"
```
If it fails, run: `npm install postprocessing`

- [ ] **Step 4: Commit**

```bash
git add client/components/preloader/scene/CameraRig.tsx client/components/preloader/scene/PostProcessing.tsx
git commit -m "feat(preloader): add CameraRig with orbit/zoom and PostProcessing effect pipeline"
```

---

## Task 9: Hooks — Loading Progress & Splash State

**Files:**
- Create: `client/components/preloader/hooks/use-loading-progress.ts`
- Create: `client/components/preloader/hooks/use-splash-state.ts`

- [ ] **Step 1: Create use-loading-progress hook**

```ts
// client/components/preloader/hooks/use-loading-progress.ts
"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { gsap } from "@/lib/gsap-init";
import { TIMING } from "../constants";

export function useLoadingProgress() {
  const [smoothProgress, setSmoothProgress] = useState(0);
  const rawProgress = useRef(0);
  const animatedProgress = useRef({ value: 0 });

  const setProgress = useCallback((target: number) => {
    if (target <= rawProgress.current) return;
    rawProgress.current = target;

    gsap.to(animatedProgress.current, {
      value: target,
      duration: TIMING.progressSmoothingDuration,
      ease: "power2.out",
      onUpdate: () => {
        setSmoothProgress(animatedProgress.current.value);
      },
    });
  }, []);

  useEffect(() => {
    // Stage 1: Document ready (0-20%)
    if (document.readyState === "complete") {
      setProgress(20);
    } else {
      const onReady = () => setProgress(20);
      window.addEventListener("load", onReady, { once: true });
    }

    // Stage 2: Fonts loaded (20-40%)
    document.fonts.ready.then(() => setProgress(40));

    // Stage 3: App hydration (40-70%)
    const onHydrated = () => setProgress(70);
    window.addEventListener("app-hydrated", onHydrated, { once: true });

    // Stage 4: Critical assets (70-100%)
    // Preload a few key above-fold images
    const criticalImages = [
      // Add actual critical image paths here if needed, or complete immediately
    ];

    if (criticalImages.length === 0) {
      // No critical images to preload — jump to 100%
      const timer = setTimeout(() => setProgress(100), 300);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("app-hydrated", onHydrated);
      };
    }

    let loaded = 0;
    criticalImages.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        const pct = 70 + (loaded / criticalImages.length) * 30;
        setProgress(pct);
      };
      img.src = src;
    });

    return () => {
      window.removeEventListener("app-hydrated", onHydrated);
    };
  }, [setProgress]);

  return smoothProgress;
}
```

- [ ] **Step 2: Create use-splash-state hook**

```ts
// client/components/preloader/hooks/use-splash-state.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TIMING, SPLASH_SHOWN_KEY } from "../constants";

export type SplashPhase = "loading" | "ready" | "dissolving" | "done";

export function useSplashState(progress: number) {
  const [phase, setPhase] = useState<SplashPhase>("loading");
  const startTime = useRef(Date.now());
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Check if splash was already shown this session
  const alreadyShown =
    typeof window !== "undefined" &&
    sessionStorage.getItem(SPLASH_SHOWN_KEY) === "true";

  // Force exit after max display time
  useEffect(() => {
    if (alreadyShown) {
      setPhase("done");
      return;
    }

    maxTimeoutRef.current = setTimeout(() => {
      if (phase === "loading") {
        setPhase("ready");
      }
    }, TIMING.maxDisplayMs);

    return () => {
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, [alreadyShown, phase]);

  // Transition to ready when progress complete and min time elapsed
  useEffect(() => {
    if (phase !== "loading") return;
    if (progress < 100) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = TIMING.minDisplayMs - elapsed;

    if (remaining <= 0) {
      setPhase("ready");
    } else {
      const timer = setTimeout(() => setPhase("ready"), remaining);
      return () => clearTimeout(timer);
    }
  }, [phase, progress]);

  const startDissolve = useCallback(() => {
    if (phase !== "ready") return;
    setPhase("dissolving");
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "true");

    setTimeout(() => {
      setPhase("done");
    }, TIMING.dissolutionDurationMs);
  }, [phase]);

  // Auto-start dissolve when ready
  useEffect(() => {
    if (phase === "ready") {
      startDissolve();
    }
  }, [phase, startDissolve]);

  return { phase, alreadyShown };
}
```

- [ ] **Step 3: Commit**

```bash
git add client/components/preloader/hooks/
git commit -m "feat(preloader): add loading progress tracker and splash state machine hooks"
```

---

## Task 10: Progress Overlay & Progress Ring

**Files:**
- Create: `client/components/preloader/ProgressOverlay.tsx`
- Create: `client/components/preloader/ProgressRing.tsx`

- [ ] **Step 1: Create ProgressOverlay**

```tsx
// client/components/preloader/ProgressOverlay.tsx
"use client";

import { CSS_COLORS } from "./constants";

interface ProgressOverlayProps {
  progress: number;
  dissolving: boolean;
}

export function ProgressOverlay({ progress, dissolving }: ProgressOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-end pb-[12vh]"
      style={{ opacity: dissolving ? 0 : 1, transition: "opacity 0.5s ease" }}
    >
      {/* Progress bar */}
      <div className="relative w-48 h-px overflow-hidden rounded-full bg-white/5">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: `linear-gradient(90deg, ${CSS_COLORS.coreCyan}40, ${CSS_COLORS.coreCyan})`,
            boxShadow: `0 0 12px ${CSS_COLORS.coreCyan}60`,
          }}
        />
      </div>

      {/* Loading text */}
      <div className="mt-4 flex items-center gap-2 text-xs tracking-[0.25em] uppercase"
        style={{ color: `${CSS_COLORS.coreCyan}80` }}
      >
        <span>Initializing</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1 w-1 rounded-full animate-pulse"
              style={{
                backgroundColor: CSS_COLORS.coreCyan,
                animationDelay: `${i * 200}ms`,
                animationDuration: "1.2s",
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ProgressRing**

```tsx
// client/components/preloader/ProgressRing.tsx
"use client";

import { CSS_COLORS } from "./constants";

interface ProgressRingProps {
  progress: number;
  size?: number;
}

export function ProgressRing({ progress, size = 120 }: ProgressRingProps) {
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${CSS_COLORS.coreCyan}15`}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${CSS_COLORS.coreCyan}66`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/components/preloader/ProgressOverlay.tsx client/components/preloader/ProgressRing.tsx
git commit -m "feat(preloader): add ProgressOverlay and ProgressRing UI components"
```

---

## Task 11: CinematicSplash Orchestrator

**Files:**
- Create: `client/components/preloader/CinematicSplash.tsx`

- [ ] **Step 1: Create CinematicSplash**

This is the main orchestrator that composes the Canvas scene, hooks, overlay, and dissolution sequence.

```tsx
// client/components/preloader/CinematicSplash.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { gsap } from "@/lib/gsap-init";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { EnergyCore } from "./scene/EnergyCore";
import { OrbitalRings } from "./scene/OrbitalRings";
import { NeuralParticles } from "./scene/NeuralParticles";
import { HolographicPanels } from "./scene/HolographicPanels";
import { QuantumGrid } from "./scene/QuantumGrid";
import { AmbientParticles } from "./scene/AmbientParticles";
import { Lighting } from "./scene/Lighting";
import { CameraRig } from "./scene/CameraRig";
import { PostProcessingEffects } from "./scene/PostProcessing";
import { ProgressOverlay } from "./ProgressOverlay";
import { useLoadingProgress } from "./hooks/use-loading-progress";
import { useSplashState } from "./hooks/use-splash-state";
import { CAMERA, CSS_COLORS, TIMING } from "./constants";

export function CinematicSplash() {
  const prefersReducedMotion = useReducedMotionSafe();
  const progress = useLoadingProgress();
  const { phase, alreadyShown } = useSplashState(progress);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dissolve, setDissolve] = useState(0);
  const [bloomIntensity, setBloomIntensity] = useState(1.5);
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setWebGLSupported(false);
      if (navigator.hardwareConcurrency < 4) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Dissolution timeline
  useEffect(() => {
    if (phase !== "dissolving" || !containerRef.current) return;

    const dissolveTarget = { value: 0, bloom: 1.5 };
    const tl = gsap.timeline();

    // Phase 1: Energy flash
    tl.to(dissolveTarget, {
      bloom: 2.5,
      duration: TIMING.flashDurationMs / 1000,
      ease: "power2.in",
      onUpdate: () => setBloomIntensity(dissolveTarget.bloom),
    });

    // Phase 2: Shatter — dissolve value 0 → 1
    tl.to(dissolveTarget, {
      value: 1,
      duration: TIMING.shatterDurationMs / 1000,
      ease: "power2.in",
      onUpdate: () => setDissolve(dissolveTarget.value),
    });

    // Phase 3: Fade container
    tl.to(containerRef.current, {
      opacity: 0,
      duration: TIMING.fadeDurationMs / 1000,
      ease: "power2.out",
    });

    return () => { tl.kill(); };
  }, [phase]);

  // Don't render if already shown this session
  if (alreadyShown || phase === "done") return null;

  // Reduced motion fallback
  if (prefersReducedMotion || !webGLSupported) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: CSS_COLORS.deepBlack }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-6">
          <div
            className="text-4xl font-bold"
            style={{ color: CSS_COLORS.coreCyan }}
          >
            B
          </div>
          <div className="w-48 h-px bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: CSS_COLORS.coreCyan,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999]"
      style={{ background: CSS_COLORS.deepBlack }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-hidden="true"
    >
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [0, 2, CAMERA.orbitRadius] }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[CSS_COLORS.deepBlack]} />
        <CameraRig />
        <PostProcessingEffects bloomIntensity={bloomIntensity} />
        <EnergyCore dissolve={dissolve} />
        <OrbitalRings dissolve={dissolve} progressNodeFraction={progress / 100} />
        <NeuralParticles dissolve={dissolve} />
        <HolographicPanels dissolve={dissolve} />
        <QuantumGrid dissolve={dissolve} />
        <AmbientParticles dissolve={dissolve} />
        <Lighting dissolve={dissolve} />
      </Canvas>
      <ProgressOverlay progress={progress} dissolving={phase === "dissolving"} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/preloader/CinematicSplash.tsx
git commit -m "feat(preloader): add CinematicSplash orchestrator with dissolution timeline"
```

---

## Task 12: RouteLoader

**Files:**
- Create: `client/components/preloader/RouteLoader.tsx`

- [ ] **Step 1: Create RouteLoader**

```tsx
// client/components/preloader/RouteLoader.tsx
"use client";

import { useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { useRef } from "react";
import * as THREE from "three";
import { CORE, COLORS, CAMERA, CSS_COLORS, TIMING } from "./constants";
import { ProgressRing } from "./ProgressRing";
import { energyFlowVertex, energyFlowFragment } from "./shaders/energy-flow";
import { particleVertex, particleFragment } from "./shaders/particle-trail";

function MiniCore() {
  const groupRef = useRef<THREE.Group>(null!);
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = {
    uTime: { value: 0 },
    uBaseColor: { value: COLORS.coreCyan },
    uEmissiveIntensity: { value: 0.8 },
    uDissolve: { value: 0 },
  };

  useFrame((_, delta) => {
    if (!groupRef.current || !shaderRef.current) return;
    groupRef.current.rotation.y += (Math.PI * 2 * delta) / 4;

    const time = performance.now() / 1000;
    const breathe = Math.sin(time * ((Math.PI * 2) / CORE.breathePeriod));
    const scale = 0.38 + breathe * 0.02;
    groupRef.current.scale.setScalar(scale);

    shaderRef.current.uniforms.uTime.value = time;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[CORE.radius, CORE.detail]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={energyFlowVertex}
          fragmentShader={energyFlowFragment}
          uniforms={uniforms}
          transparent
          wireframe
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[CORE.innerSphereRadius, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.gold}
          emissive={COLORS.gold}
          emissiveIntensity={0.6}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function MiniParticles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 30;

  const { positions, sizes, opacities, colors } = (() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const op = new Float32Array(count);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.5 + Math.random() * 1;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      sz[i] = 2 + Math.random() * 3;
      op[i] = 0.4 + Math.random() * 0.6;

      const c = i % 4 === 0 ? COLORS.gold : COLORS.coreCyan;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return { positions: pos, sizes: sz, opacities: op, colors: col };
  })();

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const angle = delta * 0.5;
      const x = posAttr.array[i * 3];
      const z = posAttr.array[i * 3 + 2];
      posAttr.array[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
      posAttr.array[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" array={sizes} count={count} itemSize={1} />
        <bufferAttribute attach="attributes-aOpacity" array={opacities} count={count} itemSize={1} />
        <bufferAttribute attach="attributes-aColor" array={colors} count={count} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function RouteLoader() {
  const prefersReducedMotion = useReducedMotionSafe();
  const [visible, setVisible] = useState(false);
  const [webGLOk, setWebGLOk] = useState(true);

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setVisible(true));

    // WebGL check
    try {
      const c = document.createElement("canvas");
      if (!c.getContext("webgl2") && !c.getContext("webgl")) setWebGLOk(false);
    } catch {
      setWebGLOk(false);
    }
  }, []);

  // Reduced motion / no WebGL fallback
  if (prefersReducedMotion || !webGLOk) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading content"
        className="fixed inset-0 z-[9998] flex items-center justify-center"
        style={{
          background: `${CSS_COLORS.deepBlack}E6`,
          opacity: visible ? 1 : 0,
          transition: `opacity ${TIMING.routeLoaderFadeInMs}ms ease-out`,
        }}
      >
        <div
          className="text-2xl font-bold animate-pulse"
          style={{ color: CSS_COLORS.coreCyan }}
        >
          B
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{
        background: `${CSS_COLORS.deepBlack}E6`,
        opacity: visible ? 1 : 0,
        transition: `opacity ${TIMING.routeLoaderFadeInMs}ms ease-out`,
      }}
    >
      <div className="relative" style={{ width: 120, height: 120 }}>
        <Canvas
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 50, near: 0.1, far: 50, position: [0, 0, 5] }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.05} />
          <pointLight color={CSS_COLORS.gold} intensity={1.5} position={[0, 0, 0]} />
          <MiniCore />
          <MiniParticles />
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} intensity={1.0} mipmapBlur />
          </EffectComposer>
        </Canvas>
        <ProgressRing progress={50} size={120} />
      </div>
      <span className="sr-only">Please wait while the page loads</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/preloader/RouteLoader.tsx
git commit -m "feat(preloader): add RouteLoader with mini 3D core for page transitions"
```

---

## Task 13: Integration — Root Layout & Loading.tsx

**Files:**
- Modify: `client/app/layout.tsx`
- Modify: `client/app/loading.tsx`

- [ ] **Step 1: Add CinematicSplash to root layout and dispatch hydration event**

In `client/app/layout.tsx`, add two things:
1. Dynamic import of `CinematicSplash` (so it doesn't block SSR)
2. A hydration event dispatcher component

Add imports at the top of the file (after existing imports):

```tsx
import dynamic from "next/dynamic";

const CinematicSplash = dynamic(
  () => import("@/components/preloader/CinematicSplash").then((m) => ({ default: m.CinematicSplash })),
  { ssr: false }
);
```

Add a hydration event dispatcher component before the `RootLayout` function:

```tsx
function HydrationSignal() {
  "use client";
  // This component renders after hydration — dispatch event for splash progress tracking
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("app-hydrated"));
  }
  return null;
}
```

Then in the JSX, add `<CinematicSplash />` and `<HydrationSignal />` inside the `<body>` tag, right after the opening `<Providers>`:

The body should become:
```tsx
<body className={`${inter.variable} ${poppins.variable} ${cinzel.variable} ${nunito.variable} ${instrumentSerif.variable} font-sans antialiased`}>
  <CinematicSplash />
  <Providers>
    <HydrationSignal />
    <AlarmProvider>
      {/* ...rest unchanged... */}
    </AlarmProvider>
  </Providers>
</body>
```

Note: `CinematicSplash` goes OUTSIDE `<Providers>` since it's a fixed overlay that doesn't need auth/theme context. `HydrationSignal` goes inside since it fires after providers have hydrated.

- [ ] **Step 2: Replace loading.tsx with RouteLoader**

Replace the entire content of `client/app/loading.tsx`:

```tsx
// client/app/loading.tsx
import { RouteLoader } from "@/components/preloader/RouteLoader";

export default function Loading() {
  return <RouteLoader />;
}
```

- [ ] **Step 3: Verify the dev server starts without errors**

Run from `client/`:
```bash
npm run dev
```

Open the browser. Verify:
1. The cinematic splash appears on first load
2. No console errors related to Three.js or WebGL
3. The splash shows the energy core, rings, particles, grid
4. After loading completes, the dissolution animation plays
5. The app content appears beneath

- [ ] **Step 4: Verify splash only shows once per session**

1. Refresh the page — splash should NOT appear (sessionStorage check)
2. Open a new incognito/private window — splash SHOULD appear

- [ ] **Step 5: Verify route loader works**

1. Navigate between pages
2. The lightweight route loader should appear during transitions
3. Check it has the mini energy core and progress ring

- [ ] **Step 6: Commit**

```bash
git add client/app/layout.tsx client/app/loading.tsx
git commit -m "feat(preloader): integrate CinematicSplash in root layout and replace loading.tsx with RouteLoader"
```

---

## Task 14: Visual Tuning & Performance Verification

This is the final polish pass. After seeing the preloader running in the browser, adjust values as needed.

**Files:**
- Modify: `client/components/preloader/constants.ts` (if tuning needed)
- Modify: any scene component (if visual adjustments needed)

- [ ] **Step 1: Check frame rate**

Open browser DevTools → Performance tab. Record 5 seconds of the splash animation.

Verify:
- Sustained 60fps (no frame drops below 50fps)
- GPU memory < 50MB (check Chrome task manager: Shift+Esc)
- No "WebGL: CONTEXT_LOST_WEBGL" warnings in console

If frame rate is low:
- Reduce `NEURAL_PARTICLES.count` from 200 to 150
- Reduce `AMBIENT_PARTICLES.count` from 100 to 60
- Set `dpr={[1, 1.5]}` instead of `[1, 2]` on the Canvas

- [ ] **Step 2: Check dissolution sequence**

Watch the full exit animation. Verify:
- Phase 1 (flash): core brightens noticeably
- Phase 2 (shatter): elements scatter outward
- Phase 3 (fade): smooth fade to transparent
- No visual artifacts or jerky transitions
- App content is visible beneath during fade

- [ ] **Step 3: Check reduced motion fallback**

In browser DevTools → Rendering → Emulate CSS `prefers-reduced-motion: reduce`

Verify:
- Splash shows static "B" mark + progress bar only
- No 3D canvas renders
- Route loader shows static "B" with pulse

- [ ] **Step 4: Final commit**

If any tuning changes were made:

```bash
git add -A client/components/preloader/
git commit -m "fix(preloader): tune animation parameters for performance and visual quality"
```

---

## Summary

| Task | What it builds | Key files |
|------|---------------|-----------|
| 1 | Constants & config | `constants.ts` |
| 2 | GLSL shaders | `shaders/*.ts` (3 files) |
| 3 | Energy core | `scene/EnergyCore.tsx` |
| 4 | Orbital rings | `scene/OrbitalRings.tsx` |
| 5 | Neural particles | `scene/NeuralParticles.tsx` |
| 6 | Holographic panels | `scene/HolographicPanels.tsx` |
| 7 | Grid, ambient particles, lighting | `scene/QuantumGrid.tsx`, `AmbientParticles.tsx`, `Lighting.tsx` |
| 8 | Camera & post-processing | `scene/CameraRig.tsx`, `PostProcessing.tsx` |
| 9 | Progress & state hooks | `hooks/use-loading-progress.ts`, `use-splash-state.ts` |
| 10 | Progress UI | `ProgressOverlay.tsx`, `ProgressRing.tsx` |
| 11 | Splash orchestrator | `CinematicSplash.tsx` |
| 12 | Route loader | `RouteLoader.tsx` |
| 13 | Layout integration | `layout.tsx`, `loading.tsx` |
| 14 | Visual tuning | Various (parameter tweaks) |

Total: 21 new files, 2 modified files. All tasks produce working, committable code.
