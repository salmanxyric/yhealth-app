# Cinematic Landing Experience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top 6 landing page sections with a scroll-driven 5-act cinematic experience using GSAP master timeline + React Three Fiber.

**Architecture:** Single GSAP `ScrollTrigger` timeline scrubs a ~600vh scroll container. A `position: fixed` R3F canvas renders the 3D constellation that morphs across acts. `CinematicContext` bridges scroll progress to R3F via `useFrame`. Act III pins the viewport for click-driven interactive questions.

**Tech Stack:** Next.js 16, React 19, GSAP 3.12 + ScrollTrigger, React Three Fiber + drei + postprocessing, Framer Motion 12, Lenis (existing), Tailwind v4 (existing CSS vars)

**Spec:** `docs/superpowers/specs/2026-05-20-cinematic-landing-design.md`

---

## File Structure

```
client/components/cinematic/
├── CinematicContext.tsx          — React context: progress, activeAct, sceneMode, selections
├── useMasterTimeline.ts          — GSAP master timeline hook with ScrollTrigger
├── CinematicExperience.tsx       — Master orchestrator: context provider + scroll container + canvas
├── CinematicCanvas.tsx           — Fixed R3F canvas wrapper with opacity + mobile detection
├── ConstellationScene.tsx        — R3F scene: orbs, particles, connections, camera, post-processing
├── acts/
│   ├── ActOne.tsx                — Void + emergence + hero text
│   ├── ActTwo.tsx                — SIA introduction + typographic choreography
│   ├── ActThree.tsx              — 3 pinned interactive questions
│   ├── ActFour.tsx               — 12-week timeline + intelligence reveal + vignettes
│   └── ActFive.tsx               — Today Screen + closing
└── shared/
    ├── CinematicText.tsx         — Letter-by-letter typographic animation
    ├── GlassPanel.tsx            — Reusable glass-morphism container
    ├── SiaIdentityMark.tsx       — Breathing geometric identity mark (SVG + CSS)
    ├── ProgressDots.tsx          — 3-dot progress indicator
    ├── DomainCard.tsx            — Domain selection card (Act III Q1)
    ├── VisionCapsule.tsx         — Vision option capsule (Act III Q2)
    ├── IntensityCard.tsx         — Coaching intensity card (Act III Q3)
    └── ActionCard.tsx            — Today Screen action card (Act V)

Modified:
├── client/app/globals.css        — Add cinematic design tokens
├── client/app/page.tsx           — Replace top sections with CinematicExperience
└── client/components/preloader/CinematicSplashWrapper.tsx — Dissolve into Act I
```

**Testing note:** This is a visual/animation project. There are no meaningful unit tests for 3D scenes, scroll-driven animations, or typographic choreography. Each task ends with a visual verification step (start dev server, scroll through, confirm behavior). The commit serves as the checkpoint.

---

## Task 1: Design Tokens in globals.css

**Files:**
- Modify: `client/app/globals.css`

- [ ] **Step 1: Read the existing globals.css theme section**

Scan the file for the `@theme inline` block. The cinematic tokens need to live inside that block alongside existing tokens. Domain colors `#D97706` and `#F59E0B` already exist as `--yh-primary` and `--yh-primary-light`.

- [ ] **Step 2: Add cinematic design tokens**

Add these CSS custom properties inside the `:root` selector in globals.css (or inside the `@theme inline` block if that's where vars live). Place them in a clearly separated section:

```css
/* ── Cinematic Landing Tokens ── */
--cin-void: #000000;
--cin-surface: #0A0A0B;
--cin-elevated: #141416;
--cin-border: rgba(255, 255, 255, 0.06);
--cin-text-primary: #F5F5F7;
--cin-text-secondary: rgba(245, 245, 247, 0.6);
--cin-sia-accent: #D4A574;

/* Domain colors (cinematic) */
--cin-domain-mental: #8B5CF6;
--cin-domain-physical: #10B981;
--cin-domain-career: #3B82F6;
--cin-domain-relationships: #F43F5E;
--cin-domain-financial: #F59E0B;
--cin-domain-growth: #D97706;
--cin-domain-spiritual: #6366F1;
--cin-domain-recreation: #FB7185;
--cin-domain-environment: #6EE7B7;
--cin-domain-community: #14B8A6;
```

- [ ] **Step 3: Verify build**

Run: `npm.cmd --prefix client run build`

Expected: Build succeeds. New CSS vars are available.

- [ ] **Step 4: Commit**

```
git add client/app/globals.css
git commit -m "feat(client): add cinematic landing design tokens to globals.css"
```

---

## Task 2: CinematicContext + Domain Data

**Files:**
- Create: `client/components/cinematic/CinematicContext.tsx`

- [ ] **Step 1: Create the context file**

```tsx
"use client";

import { createContext, useContext, useRef, useCallback, useSyncExternalStore, type ReactNode } from "react";

// ── Domain data ──────────────────────────────────────────────────────────────

export interface Domain {
  id: string;
  label: string;
  subLabel: string;
  color: string;
  icon: string; // emoji placeholder — replace with SVG later
}

export const DOMAINS: Domain[] = [
  { id: "mental",       label: "Mental Wellbeing",     subLabel: "your inner world",       color: "#8B5CF6", icon: "🧠" },
  { id: "physical",     label: "Physical Health",      subLabel: "your body's story",       color: "#10B981", icon: "💪" },
  { id: "career",       label: "Career & Purpose",     subLabel: "your professional path",  color: "#3B82F6", icon: "🎯" },
  { id: "relationships",label: "Relationships",        subLabel: "your connections",        color: "#F43F5E", icon: "❤️" },
  { id: "financial",    label: "Financial Health",      subLabel: "your security",          color: "#F59E0B", icon: "💰" },
  { id: "growth",       label: "Personal Growth",      subLabel: "your evolution",          color: "#D97706", icon: "🌱" },
  { id: "spiritual",    label: "Spiritual Life",       subLabel: "your deeper self",        color: "#6366F1", icon: "✨" },
  { id: "recreation",   label: "Recreation",           subLabel: "your joy",               color: "#FB7185", icon: "🎮" },
  { id: "environment",  label: "Physical Environment", subLabel: "your spaces",            color: "#6EE7B7", icon: "🏠" },
  { id: "community",    label: "Community",            subLabel: "your belonging",          color: "#14B8A6", icon: "🤝" },
];

// ── Scene modes ──────────────────────────────────────────────────────────────

export type SceneMode = "constellation" | "contracting" | "ambient" | "timeline" | "fadeout";
export type ActiveAct = 1 | 2 | 3 | 4 | 5;

// ── Cinematic state ──────────────────────────────────────────────────────────

export interface CinematicState {
  progress: number;
  activeAct: ActiveAct;
  isInteractive: boolean;
  selectedDomain: string | null;
  selectedVision: string | null;
  selectedIntensity: string | null;
  canvasOpacity: number;
  sceneMode: SceneMode;
}

const INITIAL_STATE: CinematicState = {
  progress: 0,
  activeAct: 1,
  isInteractive: false,
  selectedDomain: null,
  selectedVision: null,
  selectedIntensity: null,
  canvasOpacity: 1,
  sceneMode: "constellation",
};

// ── Derive act/scene/opacity from raw progress ──────────────────────────────

function deriveFromProgress(progress: number): Pick<CinematicState, "activeAct" | "sceneMode" | "canvasOpacity"> {
  if (progress < 0.17) return { activeAct: 1, sceneMode: "constellation", canvasOpacity: 1 };
  if (progress < 0.22) return { activeAct: 2, sceneMode: "contracting",  canvasOpacity: 1 };
  if (progress < 0.40) return { activeAct: 2, sceneMode: "ambient",      canvasOpacity: Math.max(0.4, 1 - (progress - 0.22) / 0.18 * 0.6) };
  if (progress < 0.70) return { activeAct: 3, sceneMode: "ambient",      canvasOpacity: 0.15 };
  if (progress < 0.93) return { activeAct: 4, sceneMode: "timeline",     canvasOpacity: 0.6 };
  return { activeAct: 5, sceneMode: "fadeout", canvasOpacity: Math.max(0, 0.15 - (progress - 0.93) / 0.07 * 0.15) };
}

// ── Store (external store pattern for 60fps updates without re-renders) ─────

type Listener = () => void;

function createCinematicStore() {
  let state = { ...INITIAL_STATE };
  const listeners = new Set<Listener>();

  function getState() { return state; }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  function notify() { listeners.forEach((l) => l()); }

  function setProgress(progress: number) {
    const derived = deriveFromProgress(progress);
    state = { ...state, progress, ...derived };
    notify();
  }

  function setInteractive(isInteractive: boolean) {
    state = { ...state, isInteractive };
    notify();
  }

  function setSelection(key: "selectedDomain" | "selectedVision" | "selectedIntensity", value: string | null) {
    state = { ...state, [key]: value };
    notify();
  }

  return { getState, subscribe, setProgress, setInteractive, setSelection };
}

// ── React context ────────────────────────────────────────────────────────────

type CinematicStore = ReturnType<typeof createCinematicStore>;

const CinematicCtx = createContext<CinematicStore | null>(null);

export function CinematicProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<CinematicStore | null>(null);
  if (!storeRef.current) storeRef.current = createCinematicStore();

  return <CinematicCtx.Provider value={storeRef.current}>{children}</CinematicCtx.Provider>;
}

export function useCinematicStore(): CinematicStore {
  const store = useContext(CinematicCtx);
  if (!store) throw new Error("useCinematicStore must be used within CinematicProvider");
  return store;
}

export function useCinematicState(): CinematicState {
  const store = useCinematicStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx --prefix client tsc --noEmit --strict client/components/cinematic/CinematicContext.tsx 2>&1 || echo "Check manually"`

If standalone tsc fails due to path aliases, just confirm the file has no red squiggles in the IDE or run the full build later.

- [ ] **Step 3: Commit**

```
git add client/components/cinematic/CinematicContext.tsx
git commit -m "feat(client): add CinematicContext with external store for 60fps scroll updates"
```

---

## Task 3: useMasterTimeline Hook

**Files:**
- Create: `client/components/cinematic/useMasterTimeline.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useRef, useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import { useCinematicStore } from "./CinematicContext";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

export interface MasterTimelineRefs {
  scrollContainer: React.RefObject<HTMLDivElement | null>;
  actThree: React.RefObject<HTMLDivElement | null>;
}

export function useMasterTimeline(refs: MasterTimelineRefs) {
  const store = useCinematicStore();
  const prefersReducedMotion = useReducedMotionSafe();
  const masterRef = useRef<gsap.core.Timeline | null>(null);
  const actThreePinRef = useRef<ScrollTrigger | null>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    if (!refs.scrollContainer.current) return;

    const master = gsap.timeline({
      scrollTrigger: {
        trigger: refs.scrollContainer.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          store.setProgress(self.progress);
        },
      },
    });

    // Placeholder tweens to establish timeline duration proportions.
    // Each act component will add real animations via addActTimeline().
    master.to({}, { duration: 17 }, 0);       // Act I:   0–17%
    master.to({}, { duration: 23 }, 17);      // Act II:  17–40%
    master.to({}, { duration: 30 }, 40);      // Act III: 40–70%
    master.to({}, { duration: 23 }, 70);      // Act IV:  70–93%
    master.to({}, { duration: 7 },  93);      // Act V:   93–100%

    masterRef.current = master;

    // Act III pin
    if (refs.actThree.current) {
      actThreePinRef.current = ScrollTrigger.create({
        id: "actThreePin",
        trigger: refs.actThree.current,
        start: "top top",
        end: "+=150%",
        pin: true,
        onEnter: () => {
          master.scrollTrigger?.disable();
          store.setInteractive(true);
        },
        onLeaveBack: () => {
          master.scrollTrigger?.enable();
          store.setInteractive(false);
        },
      });
    }

    return () => {
      actThreePinRef.current?.kill();
      master.kill();
    };
  }, [prefersReducedMotion]);

  const releasePin = () => {
    actThreePinRef.current?.disable();
    masterRef.current?.scrollTrigger?.enable();
    store.setInteractive(false);
  };

  return { masterRef, releasePin };
}
```

- [ ] **Step 2: Commit**

```
git add client/components/cinematic/useMasterTimeline.ts
git commit -m "feat(client): add useMasterTimeline hook with ScrollTrigger scrub + Act III pin"
```

---

## Task 4: Shared UI Components (GlassPanel, CinematicText, SiaIdentityMark, ProgressDots)

**Files:**
- Create: `client/components/cinematic/shared/GlassPanel.tsx`
- Create: `client/components/cinematic/shared/CinematicText.tsx`
- Create: `client/components/cinematic/shared/SiaIdentityMark.tsx`
- Create: `client/components/cinematic/shared/ProgressDots.tsx`

- [ ] **Step 1: Create GlassPanel**

```tsx
"use client";

import { type ReactNode } from "react";
import { motion, type MotionProps } from "framer-motion";

interface GlassPanelProps extends MotionProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  active?: boolean;
}

export function GlassPanel({ children, className = "", glowColor, active, ...motionProps }: GlassPanelProps) {
  return (
    <motion.div
      className={`relative rounded-2xl border border-white/[0.06] ${className}`}
      style={{
        background: "rgba(20, 20, 22, 0.7)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        ...(active && glowColor
          ? {
              boxShadow: `0 0 20px ${glowColor}26, 0 0 60px ${glowColor}10`,
              borderColor: `${glowColor}4D`,
            }
          : {}),
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create CinematicText**

```tsx
"use client";

import { useRef, useEffect, type CSSProperties } from "react";
import { gsap } from "@/lib/gsap-init";

interface CinematicTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
  charSpeed?: number; // ms per character, default 45
  onComplete?: () => void;
  trigger?: boolean; // when true, starts the animation
  dimTo?: number; // opacity to dim to when next line appears (default: 0.4)
  dimmed?: boolean; // whether this line is currently dimmed
}

export function CinematicText({
  text,
  className = "",
  style,
  charSpeed = 45,
  onComplete,
  trigger = true,
  dimTo = 0.4,
  dimmed = false,
}: CinematicTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!trigger || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const chars = containerRef.current.querySelectorAll<HTMLSpanElement>(".cin-char");
    gsap.set(chars, { opacity: 0 });
    gsap.to(chars, {
      opacity: 1,
      duration: 0.05,
      stagger: charSpeed / 1000,
      ease: "none",
      onComplete,
    });
  }, [trigger, charSpeed, onComplete]);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.to(containerRef.current, {
      opacity: dimmed ? dimTo : 1,
      duration: 0.4,
      ease: "power2.out",
    });
  }, [dimmed, dimTo]);

  const chars = text.split("").map((char, i) => (
    <span key={i} className="cin-char inline-block" style={{ opacity: 0 }}>
      {char === " " ? " " : char}
    </span>
  ));

  return (
    <div ref={containerRef} className={className} style={style}>
      {chars}
    </div>
  );
}
```

- [ ] **Step 3: Create SiaIdentityMark**

```tsx
"use client";

import { motion } from "framer-motion";

interface SiaIdentityMarkProps {
  size?: number;
  className?: string;
}

export function SiaIdentityMark({ size = 32, className = "" }: SiaIdentityMarkProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,165,116,0.3) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      {/* Core mark — geometric compass/node */}
      <svg viewBox="0 0 32 32" fill="none" className="absolute inset-0 w-full h-full">
        {/* Compass ring */}
        <circle cx="16" cy="16" r="12" stroke="#D4A574" strokeWidth="1" opacity="0.6" />
        {/* Neural node center */}
        <circle cx="16" cy="16" r="4" fill="#D4A574" opacity="0.9" />
        {/* Cardinal points */}
        <line x1="16" y1="2"  x2="16" y2="8"  stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        <line x1="16" y1="24" x2="16" y2="30" stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        <line x1="2"  y1="16" x2="8"  y2="16" stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        <line x1="24" y1="16" x2="30" y2="16" stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        {/* Diagonal connections */}
        <line x1="6"  y1="6"  x2="11" y2="11" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
        <line x1="21" y1="21" x2="26" y2="26" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
        <line x1="26" y1="6"  x2="21" y2="11" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
        <line x1="6"  y1="26" x2="11" y2="21" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </motion.div>
  );
}
```

- [ ] **Step 4: Create ProgressDots**

```tsx
"use client";

import { motion } from "framer-motion";

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export function ProgressDots({ total, current, className = "" }: ProgressDotsProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: i < current ? "#D4A574" : "rgba(255,255,255,0.15)",
          }}
          animate={{ scale: i === current - 1 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```
git add client/components/cinematic/shared/
git commit -m "feat(client): add shared cinematic components — GlassPanel, CinematicText, SiaIdentityMark, ProgressDots"
```

---

## Task 5: CinematicCanvas + ConstellationScene (R3F)

**Files:**
- Create: `client/components/cinematic/CinematicCanvas.tsx`
- Create: `client/components/cinematic/ConstellationScene.tsx`

- [ ] **Step 1: Create CinematicCanvas**

```tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useCinematicState } from "./CinematicContext";

const Scene = dynamic(() => import("./ConstellationScene").then((m) => ({ default: m.ConstellationScene })), {
  ssr: false,
});

export function CinematicCanvas() {
  const { canvasOpacity } = useCinematicState();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const lowEnd = navigator.hardwareConcurrency <= 4;
    setIsMobile(mobile || lowEnd);
  }, []);

  if (isMobile) return null; // Mobile fallback handled by act components with CSS

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: canvasOpacity, transition: "opacity 0.3s ease-out" }}
    >
      <Scene />
    </div>
  );
}
```

- [ ] **Step 2: Create ConstellationScene**

This is the R3F scene with orbs, particles, connections, camera, and post-processing. Start with a working scene that renders 10 orbs that respond to scroll progress.

```tsx
"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { DOMAINS, useCinematicStore, type SceneMode } from "./CinematicContext";

// ── Orb positions for each scene mode ────────────────────────────────────────

const PHI = (1 + Math.sqrt(5)) / 2; // golden ratio

function goldenSpiralPosition(index: number, count: number, radius: number): [number, number, number] {
  const angle = index * 2 * Math.PI / PHI;
  const r = radius * Math.sqrt(index / count);
  return [r * Math.cos(angle), r * Math.sin(angle), (index - count / 2) * 0.3];
}

function getOrbTargets(mode: SceneMode): Array<[number, number, number]> {
  switch (mode) {
    case "constellation":
      return DOMAINS.map((_, i) => goldenSpiralPosition(i, DOMAINS.length, 4));
    case "contracting":
      return DOMAINS.map(() => [0, 0, 0] as [number, number, number]);
    case "ambient":
      return DOMAINS.map((_, i) => {
        const angle = (i / DOMAINS.length) * Math.PI * 2;
        return [Math.cos(angle) * 6, Math.sin(angle) * 4, -5] as [number, number, number];
      });
    case "timeline":
      return DOMAINS.map((_, i) => [(i - 4.5) * 1.5, Math.sin(i * 0.6) * 1.5, -2] as [number, number, number]);
    case "fadeout":
      return DOMAINS.map((_, i) => {
        const angle = (i / DOMAINS.length) * Math.PI * 2;
        return [Math.cos(angle) * 8, Math.sin(angle) * 5, -8] as [number, number, number];
      });
  }
}

// ── Single Orb ───────────────────────────────────────────────────────────────

function Orb({ index, color }: { index: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const store = useCinematicStore();
  const targetPos = useRef(new THREE.Vector3());
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(() => {
    if (!meshRef.current) return;
    const state = store.getState();
    const targets = getOrbTargets(state.sceneMode);
    const [tx, ty, tz] = targets[index];
    targetPos.current.set(tx, ty, tz);

    meshRef.current.position.lerp(targetPos.current, 0.04);

    // Pulsing emissive intensity
    const pulse = 0.5 + Math.sin(Date.now() * 0.001 + index * 0.5) * 0.3;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = state.sceneMode === "fadeout" ? pulse * 0.3 : pulse;

    if (lightRef.current) {
      lightRef.current.position.copy(meshRef.current.position);
      lightRef.current.intensity = state.sceneMode === "fadeout" ? 0.1 : 0.4;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={0.4} distance={3} />
    </>
  );
}

// ── Particle Field (instanced) ───────────────────────────────────────────────

const PARTICLE_COUNT = 2000;
const tempObject = new THREE.Object3D();

function ParticleField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const store = useCinematicStore();

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const state = store.getState();
    const t = clock.getElapsedTime();

    let visibleCount = PARTICLE_COUNT;
    if (state.sceneMode === "ambient") visibleCount = 200;
    if (state.sceneMode === "timeline") visibleCount = 800;
    if (state.sceneMode === "fadeout") visibleCount = 100;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = positions[i * 3]     + Math.sin(t * 0.2 + i) * 0.02;
      const y = positions[i * 3 + 1] + Math.cos(t * 0.15 + i) * 0.02;
      const z = positions[i * 3 + 2];

      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(i < visibleCount ? 0.015 : 0);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#F5F5F7" transparent opacity={0.3} />
    </instancedMesh>
  );
}

// ── Neural Connections ───────────────────────────────────────────────────────

function NeuralConnections() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const store = useCinematicStore();

  const { geometry, pairs } = useMemo(() => {
    const connectionPairs: [number, number][] = [];
    for (let i = 0; i < DOMAINS.length; i++) {
      for (let j = i + 1; j < DOMAINS.length; j++) {
        if (Math.random() > 0.5) connectionPairs.push([i, j]);
      }
    }
    const positions = new Float32Array(connectionPairs.length * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, pairs: connectionPairs };
  }, []);

  useFrame(() => {
    if (!lineRef.current) return;
    const state = store.getState();
    const targets = getOrbTargets(state.sceneMode);
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;

    for (let c = 0; c < pairs.length; c++) {
      const [i, j] = pairs[c];
      const [ax, ay, az] = targets[i];
      const [bx, by, bz] = targets[j];
      posAttr.setXYZ(c * 2,     ax, ay, az);
      posAttr.setXYZ(c * 2 + 1, bx, by, bz);
    }
    posAttr.needsUpdate = true;

    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const showConnections = state.sceneMode === "constellation" || state.sceneMode === "timeline";
    mat.opacity = showConnections ? 0.3 : 0;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#D4A574" transparent opacity={0.3} />
    </lineSegments>
  );
}

// ── Camera Rig ───────────────────────────────────────────────────────────────

function CameraRig() {
  const store = useCinematicStore();
  const target = useRef(new THREE.Vector3(0, 0, 5));

  useFrame(({ camera }) => {
    const state = store.getState();
    switch (state.sceneMode) {
      case "constellation":
        target.current.set(0, 0, 5 - state.progress * 10);
        break;
      case "contracting":
        target.current.set(0, 0, 3);
        break;
      case "ambient":
        target.current.set(0, 0, 8);
        break;
      case "timeline":
        target.current.set((state.progress - 0.7) * 30, 2, 4);
        break;
      case "fadeout":
        target.current.set(0, 0, 10);
        break;
    }
    camera.position.lerp(target.current, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Main Scene ───────────────────────────────────────────────────────────────

export function ConstellationScene() {
  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 0, 5], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.1} />
      <CameraRig />
      <ParticleField />
      {DOMAINS.map((domain, i) => (
        <Orb key={domain.id} index={i} color={domain.color} />
      ))}
      <NeuralConnections />
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.8} />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
```

- [ ] **Step 3: Commit**

```
git add client/components/cinematic/CinematicCanvas.tsx client/components/cinematic/ConstellationScene.tsx
git commit -m "feat(client): add CinematicCanvas wrapper + ConstellationScene with orbs, particles, connections"
```

---

## Task 6: CinematicExperience Orchestrator

**Files:**
- Create: `client/components/cinematic/CinematicExperience.tsx`

- [ ] **Step 1: Create the orchestrator**

This component composes everything: context provider, canvas, scroll container, master timeline, and all 5 acts. For now the act components are stubs — they'll be fleshed out in later tasks.

```tsx
"use client";

import { useRef } from "react";
import { CinematicProvider } from "./CinematicContext";
import { CinematicCanvas } from "./CinematicCanvas";
import { useMasterTimeline } from "./useMasterTimeline";
import { ActOne } from "./acts/ActOne";
import { ActTwo } from "./acts/ActTwo";
import { ActThree } from "./acts/ActThree";
import { ActFour } from "./acts/ActFour";
import { ActFive } from "./acts/ActFive";

function CinematicInner() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const actThreeRef = useRef<HTMLDivElement>(null);

  const { releasePin } = useMasterTimeline({
    scrollContainer: scrollContainerRef,
    actThree: actThreeRef,
  });

  return (
    <>
      <CinematicCanvas />
      <div ref={scrollContainerRef} className="relative z-10">
        <ActOne />
        <ActTwo />
        <div ref={actThreeRef}>
          <ActThree onComplete={releasePin} />
        </div>
        <ActFour />
        <ActFive />
      </div>
    </>
  );
}

export function CinematicExperience() {
  return (
    <CinematicProvider>
      <CinematicInner />
    </CinematicProvider>
  );
}
```

- [ ] **Step 2: Create stub act files**

Create `client/components/cinematic/acts/ActOne.tsx`:
```tsx
"use client";

export function ActOne() {
  return (
    <section className="relative h-[100vh] flex items-end justify-center pb-20">
      <h1
        className="text-center text-5xl font-light tracking-wide"
        style={{ color: "var(--cin-text-primary)", fontFamily: "var(--font-instrument-serif)" }}
      >
        Your life is one system. Let&apos;s see it clearly.
      </h1>
    </section>
  );
}
```

Create `client/components/cinematic/acts/ActTwo.tsx`:
```tsx
"use client";

export function ActTwo() {
  return <section className="relative h-[120vh]" />;
}
```

Create `client/components/cinematic/acts/ActThree.tsx`:
```tsx
"use client";

export function ActThree({ onComplete }: { onComplete: () => void }) {
  return <section className="relative h-[150vh]" />;
}
```

Create `client/components/cinematic/acts/ActFour.tsx`:
```tsx
"use client";

export function ActFour() {
  return <section className="relative h-[150vh]" />;
}
```

Create `client/components/cinematic/acts/ActFive.tsx`:
```tsx
"use client";

export function ActFive() {
  return <section className="relative h-[80vh]" />;
}
```

- [ ] **Step 3: Commit**

```
git add client/components/cinematic/CinematicExperience.tsx client/components/cinematic/acts/
git commit -m "feat(client): add CinematicExperience orchestrator with stub act components"
```

---

## Task 7: Wire Into page.tsx + Visual Smoke Test

**Files:**
- Modify: `client/app/page.tsx`

- [ ] **Step 1: Replace top sections with CinematicExperience**

Read the current `client/app/page.tsx` (already captured above). Replace the top sections:

```tsx
import { SEO } from "@/lib/seo";
import { MainLayout } from "@/components/layout";
import { CinematicExperience } from "@/components/cinematic/CinematicExperience";
import { CinematicSplashWrapper } from "@/components/preloader/CinematicSplashWrapper";
import { VoiceCoachSection } from "@/components/landing/voice-coach-section";
import { MotivationTiersSection } from "@/components/landing/motivation-tiers-section";
import { LifeGoalsSection } from "@/components/landing/life-goals-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { HealthOrbitSection } from "@/components/landing/health-orbit-section";
import { ComparisonTableSection } from "@/components/landing/comparison-table-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";

export const metadata = SEO.home;

export default function HomePage() {
  return (
    <MainLayout>
      <CinematicSplashWrapper />
      <CinematicExperience />
      <VoiceCoachSection />
      <MotivationTiersSection />
      <LifeGoalsSection />
      <HealthOrbitSection />
      <IntegrationsSection />
      <ComparisonTableSection />
      <PricingSection />
      <CTASection />
    </MainLayout>
  );
}
```

Note: We keep `VoiceCoachSection`, `MotivationTiersSection`, `LifeGoalsSection`, and `HealthOrbitSection` because they were not in the replaced list in the spec. Only `HeroSection`, `TrustBarSection`, `ProblemPainSection`, `LifeDomainsCarouselSection`, `HowItWorksSection`, and `AIChatDemoSection` are removed.

- [ ] **Step 2: Visual smoke test**

Run: `npm.cmd --prefix client run dev`

Open `http://localhost:3000` in browser. Verify:
1. Page loads without errors
2. CinematicSplash preloader appears briefly
3. The 3D constellation with 10 orbs renders on black background
4. Scrolling changes orb positions (constellation → contracting → ambient → timeline → fadeout)
5. Act I hero text "Your life is one system..." is visible
6. Existing sections (pricing, CTA, etc.) appear below the cinematic scroll area

- [ ] **Step 3: Commit**

```
git add client/app/page.tsx
git commit -m "feat(client): wire CinematicExperience into page.tsx, replace top landing sections"
```

---

## Task 8: Act I — The Void & Emergence (Full Implementation)

**Files:**
- Modify: `client/components/cinematic/acts/ActOne.tsx`

- [ ] **Step 1: Implement Act I with scroll-driven text animation**

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";

export function ActOne() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !textRef.current) return;

    const chars = textRef.current.querySelectorAll<HTMLSpanElement>(".act1-char");

    // Text starts hidden, fades in at 80% through Act I scroll
    gsap.set(chars, { opacity: 0, y: 20 });

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      duration: 0.05,
      stagger: 0.03,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "80% bottom",
        end: "95% bottom",
        scrub: 1,
      },
    });

    // Font weight transition: 200 → 500
    gsap.fromTo(
      textRef.current,
      { fontWeight: 200, letterSpacing: "0.15em" },
      {
        fontWeight: 500,
        letterSpacing: "-0.01em",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "80% bottom",
          end: "95% bottom",
          scrub: 1,
        },
      }
    );
  }, sectionRef, []);

  const text = "Your life is one system. Let's see it clearly.";
  const words = text.split(" ");

  return (
    <section ref={sectionRef} className="relative h-[100vh] flex items-end justify-center pb-24">
      <div
        ref={textRef}
        className="text-center text-5xl md:text-7xl leading-tight max-w-4xl px-8"
        style={{
          color: "var(--cin-text-primary, #F5F5F7)",
          fontFamily: "var(--font-instrument-serif, serif)",
          fontWeight: 200,
          letterSpacing: "0.15em",
        }}
      >
        {words.map((word, wi) => (
          <span key={wi} className="inline-block mr-[0.3em]">
            {word.split("").map((char, ci) => (
              <span key={ci} className="act1-char inline-block" style={{ opacity: 0 }}>
                {char}
              </span>
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Visual verify**

Run dev server, scroll through Act I. Verify:
- Black void for first ~80% of Act I scroll
- Text characters fade in letter-by-letter as you scroll
- Font weight transitions from ultra-thin to medium
- Letter spacing goes from wide to tight

- [ ] **Step 3: Commit**

```
git add client/components/cinematic/acts/ActOne.tsx
git commit -m "feat(client): implement Act I — void emergence with scroll-driven typographic animation"
```

---

## Task 9: Act II — SIA Introduces Herself

**Files:**
- Modify: `client/components/cinematic/acts/ActTwo.tsx`

- [ ] **Step 1: Implement Act II with glass panels + typographic choreography**

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { GlassPanel } from "../shared/GlassPanel";
import { SiaIdentityMark } from "../shared/SiaIdentityMark";
import { DOMAINS } from "../CinematicContext";

const LINES = [
  { text: "I'm SIA — your life coach.", style: "normal" as const },
  { text: "I'm not a fitness app. I'm not a to-do list.", style: "negation" as const },
  { text: "I connect the parts of your life you've been managing separately.", style: "thesis" as const },
  { text: "Let me show you what I mean.", style: "cta" as const },
];

export function ActTwo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const domainsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !panelRef.current || !linesRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Panel slides in with spring-like overshoot
    tl.fromTo(
      panelRef.current,
      { y: 100, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 15, ease: "power3.out" },
      0
    );

    // Each line fades in sequentially, previous dims
    const lineEls = linesRef.current.querySelectorAll<HTMLDivElement>(".sia-line");
    lineEls.forEach((line, i) => {
      const startAt = 15 + i * 18;
      tl.fromTo(
        line,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 12, ease: "power2.out" },
        startAt
      );
      if (i > 0) {
        tl.to(lineEls[i - 1], { opacity: 0.4, duration: 8 }, startAt);
      }
    });

    // Domain dots pulse on "connect" line
    if (domainsRef.current) {
      const dots = domainsRef.current.querySelectorAll(".domain-dot");
      tl.fromTo(
        dots,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 0.6, stagger: 0.8, duration: 5, ease: "power2.out" },
        55
      );
    }
  }, sectionRef, []);

  return (
    <section ref={sectionRef} className="relative h-[120vh] flex items-center justify-center">
      <GlassPanel
        ref={panelRef}
        className="max-w-xl w-full mx-8 p-10 md:p-12"
        style={{ opacity: 0 }}
      >
        {/* SIA identity mark */}
        <div className="flex justify-center mb-8">
          <SiaIdentityMark size={40} />
        </div>

        {/* Dialogue lines */}
        <div ref={linesRef} className="space-y-6 text-center">
          {LINES.map((line, i) => (
            <div
              key={i}
              className="sia-line"
              style={{
                opacity: 0,
                color: line.style === "cta" ? "var(--cin-sia-accent, #D4A574)" : "var(--cin-text-primary, #F5F5F7)",
                fontSize: line.style === "cta" ? "1.125rem" : "1.5rem",
                fontStyle: line.style === "cta" ? "italic" : "normal",
                fontFamily: line.style === "cta" ? "var(--font-instrument-serif, serif)" : "inherit",
                fontWeight: 400,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        {/* Mini domain network */}
        <div ref={domainsRef} className="flex justify-center gap-2 mt-8">
          {DOMAINS.slice(0, 5).map((d) => (
            <div
              key={d.id}
              className="domain-dot rounded-full"
              style={{
                width: 10,
                height: 10,
                backgroundColor: d.color,
                opacity: 0,
              }}
            />
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}
```

**Note:** `GlassPanel` needs to accept a `ref`. Update GlassPanel to use `forwardRef`:

Update `client/components/cinematic/shared/GlassPanel.tsx`:
```tsx
"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type MotionProps } from "framer-motion";

interface GlassPanelProps extends MotionProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  active?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel({ children, className = "", glowColor, active, ...motionProps }, ref) {
    return (
      <motion.div
        ref={ref}
        className={`relative rounded-2xl border border-white/[0.06] ${className}`}
        style={{
          background: "rgba(20, 20, 22, 0.7)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          ...(active && glowColor
            ? {
                boxShadow: `0 0 20px ${glowColor}26, 0 0 60px ${glowColor}10`,
                borderColor: `${glowColor}4D`,
              }
            : {}),
        }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
```

- [ ] **Step 2: Visual verify**

Scroll into Act II. Verify:
- Glass panel slides up into view
- SIA identity mark breathes at center
- 4 dialogue lines appear sequentially, each dimming the previous
- "Let me show you what I mean" appears in amber italic serif
- Domain dots pulse below the text

- [ ] **Step 3: Commit**

```
git add client/components/cinematic/acts/ActTwo.tsx client/components/cinematic/shared/GlassPanel.tsx
git commit -m "feat(client): implement Act II — SIA introduction with glass panel + typographic choreography"
```

---

## Task 10: Act III Shared Components (DomainCard, VisionCapsule, IntensityCard)

**Files:**
- Create: `client/components/cinematic/shared/DomainCard.tsx`
- Create: `client/components/cinematic/shared/VisionCapsule.tsx`
- Create: `client/components/cinematic/shared/IntensityCard.tsx`

- [ ] **Step 1: Create DomainCard**

```tsx
"use client";

import { motion } from "framer-motion";
import type { Domain } from "../CinematicContext";

interface DomainCardProps {
  domain: Domain;
  selected: boolean;
  onSelect: (id: string) => void;
  exitDelay?: number;
  exiting?: boolean;
}

const spring = { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 };

export function DomainCard({ domain, selected, onSelect, exitDelay = 0, exiting }: DomainCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(domain.id)}
      className="relative rounded-xl border p-4 text-center cursor-pointer w-full"
      style={{
        background: `rgba(${hexToRgb(domain.color)}, 0.08)`,
        borderColor: selected ? `${domain.color}80` : `${domain.color}33`,
      }}
      whileHover={!selected && !exiting ? { y: -8, borderColor: domain.color, transition: spring } : undefined}
      animate={
        selected
          ? { scale: 1.2, zIndex: 10 }
          : exiting
            ? { opacity: 0, scale: 0.5, transition: { delay: exitDelay * 0.08 } }
            : { scale: 1, opacity: 1 }
      }
      transition={spring}
      layout
    >
      <div className="text-2xl mb-2">{domain.icon}</div>
      <div className="text-sm font-medium" style={{ color: domain.color }}>
        {domain.label}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--cin-text-secondary, rgba(245,245,247,0.6))" }}>
        {domain.subLabel}
      </div>
    </motion.button>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
```

- [ ] **Step 2: Create VisionCapsule**

```tsx
"use client";

import { motion } from "framer-motion";

interface VisionCapsuleProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
  delay?: number;
}

const spring = { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 };

export function VisionCapsule({ text, selected, onSelect, delay = 0 }: VisionCapsuleProps) {
  return (
    <motion.button
      onClick={onSelect}
      className="w-full text-left rounded-full border px-6 py-4 cursor-pointer"
      style={{
        background: selected ? "rgba(212,165,116,0.12)" : "rgba(20,20,22,0.7)",
        borderColor: selected ? "#D4A57480" : "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        color: "var(--cin-text-primary, #F5F5F7)",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      whileHover={!selected ? { y: -4, borderColor: "#D4A57440" } : undefined}
    >
      {text}
    </motion.button>
  );
}
```

- [ ] **Step 3: Create IntensityCard**

```tsx
"use client";

import { motion } from "framer-motion";

export interface IntensityOption {
  id: string;
  title: string;
  description: string;
  radius: number; // border-radius px
  atmosphere: string; // gradient
}

export const INTENSITY_OPTIONS: IntensityOption[] = [
  {
    id: "gentle",
    title: "Gentle Presence",
    description: "I'll be here when you need me. Quiet support, no pressure.",
    radius: 24,
    atmosphere: "linear-gradient(135deg, rgba(212,165,116,0.08) 0%, rgba(139,92,246,0.05) 100%)",
  },
  {
    id: "steady",
    title: "Steady Guide",
    description: "A consistent rhythm. I'll suggest, you decide.",
    radius: 16,
    atmosphere: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(212,165,116,0.06) 100%)",
  },
  {
    id: "accountability",
    title: "Full Accountability",
    description: "I'll push you. I'll track you. You asked for it.",
    radius: 8,
    atmosphere: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.08) 100%)",
  },
];

interface IntensityCardProps {
  option: IntensityOption;
  selected: boolean;
  onSelect: () => void;
  exiting?: boolean;
}

const spring = { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 };

export function IntensityCard({ option, selected, onSelect, exiting }: IntensityCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className="relative border p-6 text-left cursor-pointer w-full"
      style={{
        background: option.atmosphere,
        borderColor: selected ? "#D4A57480" : "rgba(255,255,255,0.06)",
        borderRadius: option.radius,
        backdropFilter: "blur(20px)",
      }}
      whileHover={!selected && !exiting ? { y: -6, borderColor: "#D4A57440", transition: spring } : undefined}
      animate={
        selected ? { flex: 1 } : exiting ? { opacity: 0, x: -100 } : { opacity: 1, x: 0 }
      }
      transition={spring}
    >
      <h3 className="text-lg font-medium mb-2" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
        {option.title}
      </h3>
      <p className="text-sm" style={{ color: "var(--cin-text-secondary, rgba(245,245,247,0.6))" }}>
        {option.description}
      </p>
    </motion.button>
  );
}
```

- [ ] **Step 4: Commit**

```
git add client/components/cinematic/shared/DomainCard.tsx client/components/cinematic/shared/VisionCapsule.tsx client/components/cinematic/shared/IntensityCard.tsx
git commit -m "feat(client): add Act III card components — DomainCard, VisionCapsule, IntensityCard"
```

---

## Task 11: Act III — The Understanding (Interactive Questions)

**Files:**
- Modify: `client/components/cinematic/acts/ActThree.tsx`

- [ ] **Step 1: Implement the full 3-question interactive sequence**

```tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DOMAINS, useCinematicStore } from "../CinematicContext";
import { DomainCard } from "../shared/DomainCard";
import { VisionCapsule } from "../shared/VisionCapsule";
import { IntensityCard, INTENSITY_OPTIONS } from "../shared/IntensityCard";
import { ProgressDots } from "../shared/ProgressDots";

type QuestionStep = 1 | 2 | 3 | "complete";

const VISION_OPTIONS = [
  "Sleep through the night consistently",
  "Feel less anxious about work",
  "Build a meditation habit",
  "Find more energy throughout the day",
];

export function ActThree({ onComplete }: { onComplete: () => void }) {
  const store = useCinematicStore();
  const [step, setStep] = useState<QuestionStep>(1);
  const [exitingCards, setExitingCards] = useState(false);

  const selectedDomain = useCinematicStore().getState().selectedDomain;
  const selectedVision = useCinematicStore().getState().selectedVision;

  const domainData = DOMAINS.find((d) => d.id === selectedDomain);

  const handleDomainSelect = useCallback(
    (id: string) => {
      store.setSelection("selectedDomain", id);
      setExitingCards(true);
      setTimeout(() => {
        setExitingCards(false);
        setStep(2);
      }, 600);
    },
    [store]
  );

  const handleVisionSelect = useCallback(
    (text: string) => {
      store.setSelection("selectedVision", text);
      setTimeout(() => setStep(3), 500);
    },
    [store]
  );

  const handleIntensitySelect = useCallback(
    (id: string) => {
      store.setSelection("selectedIntensity", id);
      setTimeout(() => {
        setStep("complete");
        onComplete();
      }, 800);
    },
    [store, onComplete]
  );

  const currentStep = step === "complete" ? 3 : step;

  return (
    <section
      className="relative flex flex-col items-center justify-center px-8"
      style={{ minHeight: "100vh", background: "var(--cin-void, #000)" }}
    >
      <ProgressDots total={3} current={currentStep} className="mb-10" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl"
          >
            <h2
              className="text-center text-2xl md:text-3xl font-light mb-10"
              style={{ color: "var(--cin-text-primary, #F5F5F7)" }}
            >
              What area of your life needs the most attention right now?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {DOMAINS.map((domain, i) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  selected={selectedDomain === domain.id}
                  onSelect={handleDomainSelect}
                  exiting={exitingCards && selectedDomain !== domain.id}
                  exitDelay={i}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <h2
              className="text-center text-2xl md:text-3xl font-light mb-10"
              style={{ color: "var(--cin-text-primary, #F5F5F7)" }}
            >
              What does success look like for you in{" "}
              <span style={{ color: domainData?.color }}>{domainData?.label ?? "this area"}</span>?
            </h2>
            <div className="space-y-3">
              {VISION_OPTIONS.map((text, i) => (
                <VisionCapsule
                  key={text}
                  text={text}
                  selected={selectedVision === text}
                  onSelect={() => handleVisionSelect(text)}
                  delay={i * 0.1}
                />
              ))}
            </div>
            {selectedVision && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-8"
                style={{
                  color: "var(--cin-sia-accent, #D4A574)",
                  fontFamily: "var(--font-instrument-serif, serif)",
                  fontStyle: "italic",
                  fontSize: "1.125rem",
                }}
              >
                That&apos;s worth building toward. Let&apos;s make it real.
              </motion.p>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <h2
              className="text-center text-2xl md:text-3xl font-light mb-10"
              style={{ color: "var(--cin-text-primary, #F5F5F7)" }}
            >
              How do you want me to show up for you?
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              {INTENSITY_OPTIONS.map((opt) => (
                <IntensityCard
                  key={opt.id}
                  option={opt}
                  selected={store.getState().selectedIntensity === opt.id}
                  onSelect={() => handleIntensitySelect(opt.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div
              className="text-lg"
              style={{ color: "var(--cin-sia-accent, #D4A574)", fontFamily: "var(--font-instrument-serif, serif)", fontStyle: "italic" }}
            >
              Building your plan...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
```

- [ ] **Step 2: Visual verify**

Scroll to Act III. Verify:
1. Viewport pins (scroll freezes)
2. Q1: 10 domain cards appear in grid. Hover lifts card. Click selects — others exit.
3. Q2: 4 vision capsules appear. Selection shows SIA's amber italic response.
4. Q3: 3 intensity cards appear side-by-side. Click selects and exits others.
5. After Q3: "Building your plan..." appears and scroll resumes.

- [ ] **Step 3: Commit**

```
git add client/components/cinematic/acts/ActThree.tsx
git commit -m "feat(client): implement Act III — 3 interactive questions with pin + click-to-advance"
```

---

## Task 12: Act IV — The Reveal (Timeline + Intelligence)

**Files:**
- Modify: `client/components/cinematic/acts/ActFour.tsx`

- [ ] **Step 1: Implement Act IV with timeline, insights, and vignettes**

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { GlassPanel } from "../shared/GlassPanel";

const WEEKS = Array.from({ length: 12 }, (_, i) => ({
  week: i + 1,
  height: i === 3 ? 55 : i === 5 ? 70 : i === 11 ? 85 : 30 + Math.sin(i * 0.6) * 15 + i * 3,
  milestone: i === 3 ? "First milestone: consistent sleep rhythm" : i === 11 ? "Full system power" : null,
  highlight: i === 5,
}));

const INSIGHTS = [
  { from: "Sleep", to: "Mood", text: "Your sleep quality drops 23% on days with 3+ meetings", color: "#8B5CF6" },
  { from: "Meditation", to: "Focus", text: "Evening meditation correlates with next-day focus scores", color: "#10B981" },
];

const VIGNETTES = [
  { title: "Cross-Pillar Intelligence", subtitle: "Most apps see one dimension. SIA sees ten.", color: "#D4A574" },
  { title: "Adaptive Coaching", subtitle: "Your plan isn't fixed. It learns as you do.", color: "#3B82F6" },
  { title: "Predictive Insights", subtitle: "SIA doesn't just track — she anticipates.", color: "#8B5CF6" },
];

export function ActFour() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const vignettesRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Timeline bars grow in sequentially
    if (timelineRef.current) {
      const bars = timelineRef.current.querySelectorAll(".week-bar");
      gsap.fromTo(
        bars,
        { scaleY: 0, transformOrigin: "bottom" },
        {
          scaleY: 1,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "30% top",
            scrub: 1,
          },
        }
      );
    }

    // Insights slide in
    if (insightsRef.current) {
      const cards = insightsRef.current.querySelectorAll(".insight-card");
      gsap.fromTo(
        cards,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: insightsRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );
    }

    // Vignettes cascade in
    if (vignettesRef.current) {
      const cards = vignettesRef.current.querySelectorAll(".vignette-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: vignettesRef.current,
            start: "top 80%",
            end: "top 40%",
            scrub: 1,
          },
        }
      );
    }
  }, sectionRef, []);

  return (
    <section ref={sectionRef} className="relative h-[150vh] px-8 py-20" style={{ background: "var(--cin-void, #000)" }}>
      {/* Title */}
      <div className="text-center mb-16 pt-20">
        <p className="text-lg mb-2" style={{ color: "var(--cin-text-secondary)" }}>Building your first 12 weeks...</p>
        <h2 className="text-3xl md:text-4xl font-light" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
          We start where it matters — your evening routine.
        </h2>
      </div>

      {/* 12-week timeline visualization */}
      <div ref={timelineRef} className="flex items-end justify-center gap-2 h-40 max-w-3xl mx-auto mb-20">
        {WEEKS.map((week) => (
          <div key={week.week} className="flex flex-col items-center flex-1">
            <div
              className="week-bar w-full rounded-t"
              style={{
                height: week.height,
                background: week.highlight
                  ? "rgba(139,92,246,0.5)"
                  : week.milestone
                    ? "rgba(245,158,11,0.4)"
                    : "rgba(59,130,246,0.3)",
                border: `1px solid ${week.highlight ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.15)"}`,
                borderBottom: "none",
                transformOrigin: "bottom",
                transform: "scaleY(0)",
              }}
            />
            <span className="text-[10px] mt-1" style={{ color: "var(--cin-text-secondary)" }}>
              {week.highlight ? "W6 ⚡" : week.milestone ? `W${week.week}` : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Cross-domain insights — the money shot */}
      <div ref={insightsRef} className="max-w-2xl mx-auto mb-20">
        <p
          className="text-center text-xl mb-8"
          style={{ color: "var(--cin-text-primary, #F5F5F7)", fontFamily: "var(--font-instrument-serif, serif)" }}
        >
          This is where it gets interesting.
        </p>
        <div className="space-y-4">
          {INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className="insight-card rounded-xl border p-5"
              style={{
                background: `rgba(${hexToRgb(insight.color)}, 0.08)`,
                borderColor: `rgba(${hexToRgb(insight.color)}, 0.2)`,
                opacity: 0,
              }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: insight.color }}>
                {insight.from} ↔ {insight.to}
              </div>
              <div className="text-sm" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
                {insight.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature vignettes */}
      <div ref={vignettesRef} className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {VIGNETTES.map((v, i) => (
          <GlassPanel key={i} className="vignette-card p-6" style={{ opacity: 0 }}>
            <div className="text-sm font-medium mb-2" style={{ color: v.color }}>
              {v.title}
            </div>
            <p className="text-sm" style={{ color: "var(--cin-text-secondary)" }}>
              {v.subtitle}
            </p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
```

- [ ] **Step 2: Visual verify**

Scroll to Act IV. Verify:
- "Building your first 12 weeks..." appears
- 12 timeline bars grow sequentially
- Week 6 is highlighted purple (the money shot)
- Insight cards slide in from left
- 3 vignette cards cascade up from below

- [ ] **Step 3: Commit**

```
git add client/components/cinematic/acts/ActFour.tsx
git commit -m "feat(client): implement Act IV — 12-week timeline, intelligence reveal, feature vignettes"
```

---

## Task 13: Act V — The Landing (Today Screen + Closing)

**Files:**
- Modify: `client/components/cinematic/acts/ActFive.tsx`
- Create: `client/components/cinematic/shared/ActionCard.tsx`

- [ ] **Step 1: Create ActionCard**

```tsx
"use client";

import { motion } from "framer-motion";

interface ActionCardProps {
  title: string;
  duration: string;
  domainColor: string;
  variant: "primary" | "secondary" | "tertiary";
  delay?: number;
}

export function ActionCard({ title, duration, domainColor, variant, delay = 0 }: ActionCardProps) {
  const opacityMap = { primary: 1, secondary: 0.7, tertiary: 0.5 };
  return (
    <motion.div
      className="rounded-xl border p-4"
      style={{
        background: `rgba(${hexToRgb(domainColor)}, 0.08)`,
        borderColor: `rgba(${hexToRgb(domainColor)}, 0.15)`,
        borderLeftWidth: 3,
        borderLeftColor: domainColor,
        opacity: opacityMap[variant],
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: opacityMap[variant], y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
      viewport={{ once: true }}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
          {title}
        </span>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{ background: `rgba(${hexToRgb(domainColor)}, 0.15)`, color: domainColor }}
        >
          {duration}
        </span>
      </div>
    </motion.div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
```

- [ ] **Step 2: Implement Act V**

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { GlassPanel } from "../shared/GlassPanel";
import { SiaIdentityMark } from "../shared/SiaIdentityMark";
import { ActionCard } from "../shared/ActionCard";

export function ActFive() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const items = sectionRef.current.querySelectorAll(".act5-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "40% top",
          scrub: 1,
        },
      }
    );
  }, sectionRef, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[80vh] flex items-center justify-center px-8"
      style={{ background: "var(--cin-void, #000)" }}
    >
      <div className="w-full max-w-md">
        {/* SIA Greeting */}
        <GlassPanel className="act5-item p-5 mb-4" style={{ opacity: 0 }}>
          <div className="flex items-start gap-3 mb-3">
            <SiaIdentityMark size={28} />
            <p className="text-[15px]" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
              Good morning. Today we&apos;re focusing on your evening routine — small change, big ripple effect.
            </p>
          </div>
          <p className="text-xs" style={{ color: "var(--cin-text-secondary)" }}>
            Day 3 of your plan. 2 of 2 completed yesterday.
          </p>
          <div className="h-[3px] rounded mt-3" style={{ background: "rgba(139,92,246,0.4)" }} />
        </GlassPanel>

        {/* Intelligence teaser */}
        <GlassPanel className="act5-item p-4 mb-4" style={{ opacity: 0, borderColor: "rgba(212,165,116,0.15)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--cin-sia-accent, #D4A574)" }}>
            As we get to know each other, I&apos;ll start connecting dots across your life.
          </p>
          <div className="space-y-2">
            {["Sleep ↔ Mood correlation", "Stress pattern detection", "Cross-domain weekly report"].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.03)", color: "var(--cin-text-secondary)" }}
              >
                <span style={{ opacity: 0.4 }}>🔒</span> {label}
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Action cards */}
        <div className="act5-item space-y-2 mb-6" style={{ opacity: 0 }}>
          <ActionCard title="10-minute evening wind-down" duration="10 min" domainColor="#8B5CF6" variant="primary" delay={0} />
          <ActionCard title="Log last night's sleep" duration="2 min" domainColor="#10B981" variant="secondary" delay={0.1} />
          <ActionCard title="Set one intention for tomorrow" duration="3 min" domainColor="#D97706" variant="tertiary" delay={0.2} />
          <p className="text-center text-xs mt-2" style={{ color: "var(--cin-text-secondary)" }}>~15 minutes today</p>
        </div>

        {/* Closing */}
        <div className="act5-item text-center" style={{ opacity: 0 }}>
          <p
            className="text-xl mb-6"
            style={{
              color: "var(--cin-sia-accent, #D4A574)",
              fontFamily: "var(--font-instrument-serif, serif)",
              fontStyle: "italic",
            }}
          >
            Welcome to Balencia. Let&apos;s begin.
          </p>
          <p className="text-sm tracking-[0.2em] uppercase" style={{ color: "var(--cin-text-secondary)" }}>
            Balencia
          </p>
        </div>

        {/* Gradient transition to sections below */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--cin-surface, #0A0A0B))" }}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Visual verify**

Scroll to Act V. Verify:
- SIA greeting card with breathing mark and domain strip
- Intelligence teaser with locked insight slots
- 3 action cards with domain color accents and duration badges
- "Welcome to Balencia. Let's begin." in amber italic
- Gradient transition into sections below

- [ ] **Step 4: Commit**

```
git add client/components/cinematic/shared/ActionCard.tsx client/components/cinematic/acts/ActFive.tsx
git commit -m "feat(client): implement Act V — Today Screen, action cards, intelligence teaser, closing"
```

---

## Task 14: Full Integration Test + Polish

**Files:**
- Possibly touch any cinematic file for polish

- [ ] **Step 1: Run full build**

Run: `npm.cmd --prefix client run build`

Expected: Build succeeds with no errors related to cinematic components.

- [ ] **Step 2: Full scroll-through test**

Run: `npm.cmd --prefix client run dev`

Open browser, scroll through the entire page top to bottom. Verify each act:
1. **Act I:** Black void → orbs emerge → connections cascade → text fades in with weight transition
2. **Act II:** Glass panel slides up → SIA mark breathes → 4 dialogue lines sequence → domain dots pulse
3. **Act III:** Viewport pins → Q1 domain grid → Q2 vision capsules → Q3 intensity cards → scroll resumes
4. **Act IV:** Timeline bars grow → insight cards slide → vignettes cascade
5. **Act V:** Today Screen assembles → action cards stagger → closing text → gradient into existing sections
6. **Below:** Existing sections (VoiceCoach, Pricing, CTA, etc.) render correctly

- [ ] **Step 3: Fix any issues found during scroll-through**

Address any visual glitches, timing issues, or layout problems discovered during testing.

- [ ] **Step 4: Run lint**

Run: `npm.cmd --prefix client run lint`

Fix any lint errors.

- [ ] **Step 5: Final commit**

```
git add -A
git commit -m "feat(client): cinematic landing experience — full 5-act scroll-driven implementation"
```

---

## Summary

| Task | What It Builds | Files |
|------|---------------|-------|
| 1 | CSS design tokens | globals.css |
| 2 | CinematicContext + domain data | CinematicContext.tsx |
| 3 | useMasterTimeline hook | useMasterTimeline.ts |
| 4 | Shared UI (GlassPanel, CinematicText, SiaIdentityMark, ProgressDots) | shared/*.tsx |
| 5 | R3F canvas + ConstellationScene | CinematicCanvas.tsx, ConstellationScene.tsx |
| 6 | CinematicExperience orchestrator + stub acts | CinematicExperience.tsx, acts/*.tsx |
| 7 | Wire into page.tsx + first visual smoke test | page.tsx |
| 8 | Act I — Void & Emergence | ActOne.tsx |
| 9 | Act II — SIA Introduces Herself | ActTwo.tsx, GlassPanel.tsx |
| 10 | Act III cards (DomainCard, VisionCapsule, IntensityCard) | shared/*.tsx |
| 11 | Act III — Interactive Questions | ActThree.tsx |
| 12 | Act IV — Timeline + Intelligence Reveal | ActFour.tsx |
| 13 | Act V — Today Screen + Closing | ActFive.tsx, ActionCard.tsx |
| 14 | Full integration test + polish | All cinematic files |
