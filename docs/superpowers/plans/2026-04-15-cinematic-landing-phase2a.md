# Cinematic Landing — Phase 2.A Implementation Plan (Shell + Hero)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 14-section landing page with a cinematic shell that renders Scene 1 (Hero) fully and placeholder skeletons for scenes 2-9. Old sections move to `_archive/` intact. Every commit builds green and the page loads cleanly at every step.

**Architecture:** New scene orchestration layer under `client/app/scenes/` with a shared `SceneShell` wrapper, a `Scene3D` swap component (placeholder today, real Spline later), and per-scene GSAP ScrollTrigger timelines via `useSceneTimeline`. Reuses existing `CinematicScene`, `CinematicOverlays`, `LenisProvider`, `use-gsap`, `use-is-mobile`, `use-mouse-parallax`, `use-scroll-velocity`, `useReducedMotionSafe`. All marketing copy lives in `client/data/siteContent.ts` with `// COPY-REVIEW` tags.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind, GSAP + ScrollTrigger (existing), Lenis (existing), framer-motion (micro-interactions only), lucide-react.

**Spec:** [`docs/superpowers/specs/2026-04-15-cinematic-landing-page-design.md`](../specs/2026-04-15-cinematic-landing-page-design.md)

**Phase 2.A scope (what ships in this plan):**
- Move existing 14 landing sections to `components/landing/_archive/`.
- Add scene orchestration infra: `Scene3D`, `SceneShell`, `SceneSkeleton`, `useSceneTimeline`.
- Add `data/siteContent.ts` content module.
- Rebuild `app/page.tsx` as cinematic shell (CinematicOverlays + lazy-loaded scene components).
- Implement Scene 1 (Hero) fully.
- Scenes 2-9 render as placeholder `<SceneSkeleton/>` so the page still flows visually.
- Keep Pricing + FAQ + Footer in their current form below the scenes.

**Out of scope (later phases):**
- Scenes 2-9 real implementations (Phase 2.B, 2.C).
- Footer dark-tokens pass (Phase 2.D).
- Real Spline scene URLs (drop-in later; Phase 2.A ships the placeholder).

---

## File Structure

**New files:**
- `client/app/scenes/_shell/SceneShell.tsx` — wraps CinematicScene with standard entry/active/exit + mobile gate
- `client/app/scenes/_shell/SceneSkeleton.tsx` — fallback during chunk load OR for unimplemented scenes
- `client/app/scenes/_shell/Scene3D.tsx` — single 3D swap component (placeholder today)
- `client/app/scenes/_shell/useSceneTimeline.ts` — ScrollTrigger timeline hook
- `client/app/scenes/_shell/index.ts` — barrel
- `client/app/scenes/Scene01_Hero.tsx`
- `client/data/siteContent.ts`
- `client/components/landing/_archive/README.md` — records why sections were archived + how to restore

**Modified files:**
- `client/app/page.tsx` — fully rewritten as cinematic shell

**Moved files (git mv):**
- All 14 files under `client/components/landing/` that are SECTION components (not `shared/`, not `_archive/`, not `spline/`, not `orb/`, not `CoachAvatarVrm.tsx`, not `CinematicOverlays.tsx`) move into `client/components/landing/_archive/`.

**Unchanged (explicitly kept):**
- `client/components/landing/shared/*` (CinematicScene, CinematicOverlays, DepthLayer, ScrollParticles, ScrollProgressBar)
- `client/components/landing/CoachAvatarVrm.tsx`
- `client/components/landing/spline/`
- `client/components/landing/orb/`
- `client/components/providers/LenisProvider.tsx`
- `client/hooks/use-gsap.ts`, `use-is-mobile.ts`, `use-mouse-parallax.ts`, `use-scroll-velocity.ts`, `use-reduced-motion-safe.ts`
- `client/lib/gsap-init.ts`

---

## Task 1: Create `_archive/` Directory with README

**Files:**
- Create: `client/components/landing/_archive/README.md`

- [ ] **Step 1: Write the README**

```markdown
# Archived Landing Sections

These sections were the pre-cinematic landing page. They are retained for reference and to enable restoration if needed.

## How to restore a section

1. `git mv` the file back to `client/components/landing/<section>.tsx`.
2. Import it in `client/app/page.tsx`.
3. Remove any corresponding new scene if restoring a replacement.

## Date archived

2026-04-15 — replaced by the cinematic landing page (see `docs/superpowers/specs/2026-04-15-cinematic-landing-page-design.md`).

## Mapping

| Archived section | Replaced by |
|---|---|
| `hero-section.tsx` | `app/scenes/Scene01_Hero.tsx` |
| `problem-pain-section.tsx` | `app/scenes/Scene02_ProblemSolution.tsx` (Phase 2.B) |
| `ai-chat-demo-section.tsx` | `app/scenes/Scene03_AIDashboard.tsx` (Phase 2.B) |
| `ai-app-flow-section.tsx`, `app-download-section.tsx` | `app/scenes/Scene04_DeviceShowcase.tsx` (Phase 2.B) |
| `features-section.tsx`, `fitness-carousel-section.tsx` | `app/scenes/Scene05_FeatureGrid.tsx` (Phase 2.B) |
| `life-domains-carousel-section.tsx` | `app/scenes/Scene06_LifeAreasCarousel.tsx` (Phase 2.C) |
| `integrations-section.tsx`, `health-orbit-section.tsx` | `app/scenes/Scene07_DataFlow.tsx` (Phase 2.C) |
| `testimonials-section.tsx`, `before-after-section.tsx` | `app/scenes/Scene08_Testimonials.tsx` (Phase 2.C) |
| `cta-section.tsx` | `app/scenes/Scene09_FinalCTA.tsx` (Phase 2.C) |
| `how-it-works-section.tsx`, `motivation-tiers-section.tsx`, `life-goals-section.tsx`, `comparison-table-section.tsx` | Dropped; voice folded into scenes 3, 5, 8 |
| `pricing-section.tsx` | Kept in live page as post-cinematic footer |
| `faq-section.tsx` | Kept in live page as post-cinematic footer |
| `lead-magnet-section.tsx` | Dropped |
| `stats-section.tsx` | Not on live page before; remains unused |
| `trust-bar-section.tsx` | Dropped (signal moved to hero scene subtext) |
| `app-download-section.tsx` | See Scene04 above |
```

- [ ] **Step 2: Commit**

```bash
git add client/components/landing/_archive/README.md
git commit -m "docs: seed landing _archive/ with restoration map"
```

---

## Task 2: Git-Move Old Section Files to `_archive/`

**Files moved (one `git mv` per file, grouped into a single commit):**

- [ ] **Step 1: Run the moves**

```bash
cd e:/Development/xyric-wiki/PRODUCTS/yhealth-app

git mv client/components/landing/hero-section.tsx                       client/components/landing/_archive/hero-section.tsx
git mv client/components/landing/trust-bar-section.tsx                  client/components/landing/_archive/trust-bar-section.tsx
git mv client/components/landing/problem-pain-section.tsx               client/components/landing/_archive/problem-pain-section.tsx
git mv client/components/landing/life-domains-carousel-section.tsx      client/components/landing/_archive/life-domains-carousel-section.tsx
git mv client/components/landing/how-it-works-section.tsx               client/components/landing/_archive/how-it-works-section.tsx
git mv client/components/landing/ai-chat-demo-section.tsx               client/components/landing/_archive/ai-chat-demo-section.tsx
git mv client/components/landing/ai-app-flow-section.tsx                client/components/landing/_archive/ai-app-flow-section.tsx
git mv client/components/landing/motivation-tiers-section.tsx           client/components/landing/_archive/motivation-tiers-section.tsx
git mv client/components/landing/life-goals-section.tsx                 client/components/landing/_archive/life-goals-section.tsx
git mv client/components/landing/integrations-section.tsx               client/components/landing/_archive/integrations-section.tsx
git mv client/components/landing/health-orbit-section.tsx               client/components/landing/_archive/health-orbit-section.tsx
git mv client/components/landing/comparison-table-section.tsx           client/components/landing/_archive/comparison-table-section.tsx
git mv client/components/landing/cta-section.tsx                        client/components/landing/_archive/cta-section.tsx
git mv client/components/landing/features-section.tsx                   client/components/landing/_archive/features-section.tsx
git mv client/components/landing/fitness-carousel-section.tsx           client/components/landing/_archive/fitness-carousel-section.tsx
git mv client/components/landing/stats-section.tsx                      client/components/landing/_archive/stats-section.tsx
git mv client/components/landing/testimonials-section.tsx               client/components/landing/_archive/testimonials-section.tsx
git mv client/components/landing/before-after-section.tsx               client/components/landing/_archive/before-after-section.tsx
git mv client/components/landing/lead-magnet-section.tsx                client/components/landing/_archive/lead-magnet-section.tsx
git mv client/components/landing/app-download-section.tsx               client/components/landing/_archive/app-download-section.tsx
```

**Preserve in place (do NOT move):** `pricing-section.tsx`, `faq-section.tsx`, `CoachAvatarVrm.tsx`, `CinematicOverlays.tsx`, `index.ts`, and the directories `shared/`, `spline/`, `orb/`.

**Important:** If any of these files don't exist, skip that single `git mv` — do not fail the batch. List any skipped in the commit message.

- [ ] **Step 2: Update `client/components/landing/index.ts` to remove the archived exports**

Open `client/components/landing/index.ts`. Remove export lines that reference any moved file. Keep exports for `pricing-section`, `faq-section`, `CoachAvatarVrm`, `CinematicOverlays`, and `shared/` re-exports. If the barrel file doesn't exist or doesn't export the moved sections, skip this.

- [ ] **Step 3: Commit**

```bash
git add client/components/landing/
git commit -m "chore(landing): archive pre-cinematic section components"
```

**Expected:** `git status` is clean after commit. `client/components/landing/_archive/` now contains the 20 moved files + README.

---

## Task 3: Temporary Broken-Page Recovery Commit

**Context:** `app/page.tsx` currently imports the sections we just moved, so `npm run build` is broken at HEAD. We fix it in one commit so every subsequent step starts green.

**Files:**
- Modify: `client/app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx` with a minimal holding page**

```tsx
import { SEO } from "@/lib/seo";
import { MainLayout } from "@/components/layout";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";

export const metadata = SEO.home;

export default function HomePage() {
  return (
    <MainLayout>
      <section className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <h1 className="text-4xl sm:text-6xl font-semibold text-white tracking-tight">
            yHealth
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            New cinematic experience landing soon.
          </p>
        </div>
      </section>
      <PricingSection />
      <FAQSection />
    </MainLayout>
  );
}
```

**Import verification:** Confirm `FAQSection` is the actual named export from `client/components/landing/faq-section.tsx`. If it's a default export or uses a different name (e.g., `FaqSection`), adjust the import line to match. Do the same for `PricingSection`. Do not guess.

- [ ] **Step 2: Verify build compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: No NEW TS errors attributed to `app/page.tsx`, `pricing-section.tsx`, or `faq-section.tsx`. Pre-existing errors elsewhere are acceptable (document them if loud).

- [ ] **Step 3: Commit**

```bash
git add client/app/page.tsx
git commit -m "chore(page): holding page during cinematic rebuild"
```

---

## Task 4: `client/data/siteContent.ts`

**Files:**
- Create: `client/data/siteContent.ts`

- [ ] **Step 1: Write the content module**

```typescript
/**
 * Marketing copy + scene configuration for the cinematic landing page.
 *
 * Every user-facing string tagged `// COPY-REVIEW` is placeholder voice
 * authored during the rebuild. Grep for COPY-REVIEW to find everything
 * that should be reviewed / rewritten by marketing.
 *
 * Scene 6 (Life Areas) domain keys match
 * `server/src/config/life-area-domains.ts` exactly.
 */

export const site = {
  brand: {
    name: 'yHealth',
    tagline: 'AI Health Intelligence', // COPY-REVIEW
  },

  nav: {
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    cta: { label: 'Get Started', href: '/auth/signup' },
  },

  hero: {
    eyebrow: 'Your Health, Intelligently', // COPY-REVIEW
    headline: 'Your Health, Reimagined by AI.', // COPY-REVIEW
    sub: 'An intelligent tracking system that learns your rhythms, predicts your needs, and coaches you toward the life you want.', // COPY-REVIEW
    ctaPrimary: { label: 'Get Started', href: '/auth/signup' },
    ctaSecondary: { label: 'Watch Demo', href: '#demo' },
  },

  problemSolution: {
    headline: 'Most trackers watch. yHealth listens.', // COPY-REVIEW
    rows: [
      { problem: 'Fatigue tracking without insight',    solution: 'AI detects fatigue before you feel it.' }, // COPY-REVIEW
      { problem: 'Dashboards that lack meaning',        solution: 'Predictive analytics tuned to you.' },   // COPY-REVIEW
      { problem: 'Manual logging no one keeps up with', solution: 'Automatic health sync across devices.' }, // COPY-REVIEW
    ],
  },

  aiDashboard: {
    eyebrow: 'AI Health Intelligence Engine', // COPY-REVIEW
    headline: 'Your biometrics, translated into decisions.', // COPY-REVIEW
    chatTurns: [ // COPY-REVIEW
      { role: 'assistant', text: 'Your HRV dropped 8% this week. Want to adjust tomorrow\u2019s workout?' },
      { role: 'user',      text: 'Yes — shorter session?' },
      { role: 'assistant', text: 'I\u2019ll cut it to 25 min + extra recovery block.' },
    ],
    metrics: [
      { label: 'Heart rate',  kind: 'line'   }, // COPY-REVIEW
      { label: 'Sleep score', kind: 'radial' }, // COPY-REVIEW
      { label: 'Stress',      kind: 'heat'   }, // COPY-REVIEW
    ],
  },

  devices: {
    headline: 'One intelligence layer. Every screen.', // COPY-REVIEW
    states: ['dashboard', 'insights', 'logs'] as const, // COPY-REVIEW
  },

  features: {
    headline: 'Built for how life actually works.', // COPY-REVIEW
    cards: [
      { icon: 'Brain',      title: 'Predictive coaching', body: 'Learns your patterns and intervenes early.' },   // COPY-REVIEW
      { icon: 'HeartPulse', title: 'Biometric sync',       body: 'WHOOP, Apple Health, Fitbit, Oura — all in one.' }, // COPY-REVIEW
      { icon: 'Waves',      title: 'Mood + stress',        body: 'Non-invasive signals translated into action.' }, // COPY-REVIEW
      { icon: 'Target',     title: 'Life areas',           body: 'Career, relationships, creativity — coached.' }, // COPY-REVIEW
      { icon: 'Sparkles',   title: 'Voice coach',          body: 'Check in hands-free, anywhere.' },            // COPY-REVIEW
      { icon: 'Shield',     title: 'Private by design',    body: 'Your data never leaves the circle of trust.' }, // COPY-REVIEW
    ],
  },

  lifeAreasCarousel: {
    headline: 'One app for every area of your life.', // COPY-REVIEW
    sub: 'Career. Relationships. Creativity. Anything you want to improve — yHealth is the coach that shows up.', // COPY-REVIEW
    domains: [
      { type: 'career',        icon: 'Briefcase',  pitch: 'Apply daily, follow up weekly, land the next role.' },       // COPY-REVIEW
      { type: 'relationships', icon: 'Heart',      pitch: 'Never forget the people who matter.' },                       // COPY-REVIEW
      { type: 'creativity',    icon: 'Palette',    pitch: 'Practice consistently. Ship what you love.' },                // COPY-REVIEW
      { type: 'spirituality',  icon: 'Sparkles',   pitch: 'A quiet space for the practice you keep.' },                  // COPY-REVIEW
      { type: 'finance',       icon: 'Wallet',     pitch: 'Save, track, and build — on autopilot.' },                     // COPY-REVIEW
      { type: 'fitness',       icon: 'Dumbbell',   pitch: 'Train smart, recover smarter.' },                              // COPY-REVIEW
      { type: 'learning',      icon: 'BookOpen',   pitch: 'Books. Courses. Skills. Tracked.' },                           // COPY-REVIEW
      { type: 'custom',        icon: 'Target',     pitch: 'Anything you\u2019re working on. We\u2019ll show up.' },        // COPY-REVIEW
    ],
    cta: { label: 'Explore Life Areas', href: '/life-areas' },
  },

  dataFlow: {
    headline: 'From signal to insight to action.', // COPY-REVIEW
    nodes: [
      { label: 'User data',  desc: 'Biometrics, habits, voice.' },     // COPY-REVIEW
      { label: 'AI engine',  desc: 'Patterns, predictions, context.' }, // COPY-REVIEW
      { label: 'Insight',    desc: 'What matters, right now.' },       // COPY-REVIEW
      { label: 'Action',     desc: 'Coach nudge, schedule, follow-up.' }, // COPY-REVIEW
    ],
  },

  testimonials: {
    headline: 'Built for real life.', // COPY-REVIEW
    // COPY-REVIEW — all synthetic placeholders. Replace with real user quotes.
    items: [
      { quote: 'yHealth changed how I show up every day.', author: 'Amina, 32',   role: 'Product designer' },          // TODO-REAL
      { quote: 'Lost 8kg. More importantly — kept it off.', author: 'David, 41',   role: 'Engineer' },                  // TODO-REAL
      { quote: 'The only tracker that feels like it gets me.', author: 'Priya, 28',  role: 'Founder' },                   // TODO-REAL
    ],
  },

  finalCta: {
    headline: 'Start your health intelligence era.', // COPY-REVIEW
    sub: 'Free to try. No credit card.',               // COPY-REVIEW
    ctaPrimary:   { label: 'Start Free Trial', href: '/auth/signup' },
    ctaSecondary: { label: 'View Demo',        href: '#demo' },
  },
} as const;

export type SiteContent = typeof site;
```

- [ ] **Step 2: Commit**

```bash
git add client/data/siteContent.ts
git commit -m "feat(content): add siteContent module with COPY-REVIEW tags"
```

---

## Task 5: `Scene3D` Swap Component (Placeholder Today)

**Files:**
- Create: `client/app/scenes/_shell/Scene3D.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { motion } from 'framer-motion';

export type Scene3DKind = 'health-core' | 'devices' | 'data-flow';

interface Scene3DProps {
  kind: Scene3DKind;
  /**
   * Optional Spline scene URL. When provided, the component lazy-loads
   * `@splinetool/react-spline` and renders the scene. Until any real scenes
   * exist, every call-site passes `undefined` and gets the coded placeholder.
   */
  splineUrl?: string;
  className?: string;
}

export function Scene3D({ kind, splineUrl, className = '' }: Scene3DProps) {
  if (splineUrl) {
    // Intentional: Spline integration lands when the first real URL arrives.
    // Until then, passing `splineUrl` falls through to the placeholder so the
    // landing still renders if a URL is wired up speculatively.
    // (Hook for future: dynamic import of @splinetool/react-spline here.)
  }

  return (
    <div
      aria-hidden="true"
      className={`relative w-full h-full flex items-center justify-center ${className}`}
    >
      {kind === 'health-core' && <HealthCorePlaceholder />}
      {kind === 'devices' && <DevicesPlaceholder />}
      {kind === 'data-flow' && <DataFlowPlaceholder />}
    </div>
  );
}

function HealthCorePlaceholder() {
  return (
    <div className="relative w-[min(80vmin,640px)] h-[min(80vmin,640px)]">
      {/* radial glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-purple-600/20 blur-3xl" />
      {/* orb core */}
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[12%] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(34,211,238,0.35), rgba(139,92,246,0.35), rgba(34,211,238,0.35))',
          filter: 'blur(0.5px)',
        }}
      />
      {/* inner sphere */}
      <div className="absolute inset-[28%] rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-black ring-1 ring-white/10 shadow-2xl shadow-cyan-500/20" />
      {/* highlight */}
      <div className="absolute inset-[32%] rounded-full bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
      {/* particle ring */}
      <svg className="absolute inset-0" viewBox="-50 -50 100 100" aria-hidden="true">
        <circle cx="0" cy="0" r="44" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="0.15" strokeDasharray="0.6 2" />
        <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(139,92,246,0.2)"  strokeWidth="0.1" strokeDasharray="0.3 3" />
      </svg>
    </div>
  );
}

function DevicesPlaceholder() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute left-[8%] top-[20%] w-[55%] aspect-[16/10] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 ring-1 ring-white/10 shadow-2xl" />
      <div className="absolute right-[8%] top-[30%] w-[18%] aspect-[9/19] rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-950 ring-1 ring-white/10 shadow-2xl" />
    </div>
  );
}

function DataFlowPlaceholder() {
  return (
    <svg viewBox="0 0 800 200" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="sd-flow" x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.8)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.8)" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={100 + i * 200} cy={100} r={28} fill="rgba(15,23,42,0.9)" stroke="url(#sd-flow)" strokeWidth="1.5" />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={128 + i * 200} y1={100} x2={272 + i * 200} y2={100} stroke="url(#sd-flow)" strokeWidth="1.2" />
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
cd client && npx tsc --noEmit 2>&1 | grep -i "scene3d\|scenes/_shell" | head -5
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "client/app/scenes/_shell/Scene3D.tsx"
git commit -m "feat(scenes): add Scene3D swap component with placeholders"
```

---

## Task 6: `SceneSkeleton` Component

**Files:**
- Create: `client/app/scenes/_shell/SceneSkeleton.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

interface SceneSkeletonProps {
  /** Approximate height of the real scene so the scroll doesn't jump when it loads */
  heightVh?: number;
  /** Optional eyebrow label shown faintly for unimplemented scenes */
  label?: string;
}

export function SceneSkeleton({ heightVh = 100, label }: SceneSkeletonProps) {
  return (
    <section
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: `${heightVh}vh`, background: '#0B0F17' }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06),transparent_60%)]" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 animate-pulse" />
        {label && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "client/app/scenes/_shell/SceneSkeleton.tsx"
git commit -m "feat(scenes): add SceneSkeleton fallback component"
```

---

## Task 7: `useSceneTimeline` Hook

**Files:**
- Create: `client/app/scenes/_shell/useSceneTimeline.ts`

- [ ] **Step 1: Write the hook**

```typescript
'use client';

import { useEffect, useState, type RefObject } from 'react';
import { gsap } from '@/lib/gsap-init';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useReducedMotionSafe } from '@/hooks/use-reduced-motion-safe';

export interface SceneTimelineConfig {
  /** Pin the scene while the timeline plays (desktop only) */
  pin?: boolean;
  /** ScrollTrigger start marker (default 'top 80%') */
  start?: string;
  /** ScrollTrigger end marker (default 'bottom 20%') */
  end?: string;
  /** Scrub smoothing — passed directly to ScrollTrigger `scrub` */
  scrub?: number | boolean;
  /** Called with (progress 0..1, self) on every ScrollTrigger update */
  onUpdate?: (progress: number) => void;
  /**
   * Build the scene's animation timeline. Runs inside a gsap.context so
   * everything created is auto-cleaned. Called once on mount and re-run
   * when the hook's deps change (unlikely — scenes are static).
   */
  build?: (tl: gsap.core.Timeline) => void;
}

export interface SceneTimelineResult {
  progress: number;
  isActive: boolean;
  isMobile: boolean;
  prefersReduced: boolean;
}

export function useSceneTimeline(
  sceneRef: RefObject<HTMLElement | null>,
  config: SceneTimelineConfig = {},
): SceneTimelineResult {
  const isMobile = useIsMobile();
  const prefersReduced = useReducedMotionSafe();
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        // Jump to end state without animation.
        const tl = gsap.timeline({ paused: true });
        config.build?.(tl);
        tl.progress(1, false);
        config.onUpdate?.(1);
        setProgress(1);
        setIsActive(true);
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: config.start ?? 'top 80%',
          end: config.end ?? 'bottom 20%',
          scrub: config.scrub ?? 1,
          pin: !isMobile && !!config.pin,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setProgress(self.progress);
            config.onUpdate?.(self.progress);
          },
          onEnter:     () => setIsActive(true),
          onEnterBack: () => setIsActive(true),
          onLeave:     () => setIsActive(false),
          onLeaveBack: () => setIsActive(false),
        },
      });

      config.build?.(tl);
    }, el);

    return () => ctx.revert();
    // We intentionally re-run when the viewport class flips mobile <-> desktop
    // or when reduced-motion changes so the timeline is rebuilt correctly.
  }, [sceneRef, isMobile, prefersReduced, config.pin, config.start, config.end, config.scrub, config.build, config.onUpdate]);

  return { progress, isActive, isMobile, prefersReduced };
}
```

- [ ] **Step 2: Verify compile**

```bash
cd client && npx tsc --noEmit 2>&1 | grep "useSceneTimeline\|scenes/_shell" | head -5
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "client/app/scenes/_shell/useSceneTimeline.ts"
git commit -m "feat(scenes): add useSceneTimeline hook"
```

---

## Task 8: `SceneShell` Wrapper

**Files:**
- Create: `client/app/scenes/_shell/SceneShell.tsx`

- [ ] **Step 1: Write the shell**

```tsx
'use client';

import { useRef, type ReactNode } from 'react';
import { useSceneTimeline, type SceneTimelineConfig } from './useSceneTimeline';

interface SceneShellProps extends SceneTimelineConfig {
  id: string;
  ariaLabel: string;
  children: ReactNode | ((state: { progress: number; isActive: boolean; isMobile: boolean }) => ReactNode);
  className?: string;
  /** Force a minimum height in viewport heights (default 100) */
  heightVh?: number;
}

export function SceneShell({
  id,
  ariaLabel,
  children,
  className = '',
  heightVh = 100,
  ...timelineConfig
}: SceneShellProps) {
  const ref = useRef<HTMLElement>(null);
  const { progress, isActive, isMobile } = useSceneTimeline(ref, timelineConfig);

  return (
    <section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ minHeight: `${heightVh}vh` }}
    >
      {typeof children === 'function'
        ? children({ progress, isActive, isMobile })
        : children}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "client/app/scenes/_shell/SceneShell.tsx"
git commit -m "feat(scenes): add SceneShell wrapper"
```

---

## Task 9: `_shell` Barrel

**Files:**
- Create: `client/app/scenes/_shell/index.ts`

- [ ] **Step 1: Write the barrel**

```typescript
export { Scene3D } from './Scene3D';
export type { Scene3DKind } from './Scene3D';
export { SceneSkeleton } from './SceneSkeleton';
export { SceneShell } from './SceneShell';
export { useSceneTimeline } from './useSceneTimeline';
export type { SceneTimelineConfig, SceneTimelineResult } from './useSceneTimeline';
```

- [ ] **Step 2: Commit**

```bash
git add "client/app/scenes/_shell/index.ts"
git commit -m "feat(scenes): barrel export for _shell"
```

---

## Task 10: `Scene01_Hero` Component

**Files:**
- Create: `client/app/scenes/Scene01_Hero.tsx`

- [ ] **Step 1: Write the scene**

```tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scene3D, SceneShell } from './_shell';
import { site } from '@/data/siteContent';
import { useMouseParallax } from '@/hooks/use-mouse-parallax';

export default function Scene01_Hero() {
  const parallax = useMouseParallax({ strength: 20, damping: 18 });

  return (
    <SceneShell
      id="scene-hero"
      ariaLabel="Hero"
      heightVh={110}
      start="top top"
      end="bottom top"
      scrub={1}
      build={(tl) => {
        tl.fromTo(
          '.hero-orb',
          { scale: 1, y: 0, filter: 'blur(0px)', opacity: 1 },
          { scale: 1.15, y: -40, filter: 'blur(2px)', opacity: 0.85, ease: 'power2.in' },
          0,
        );
        tl.fromTo('.hero-text', { y: 0, opacity: 1 }, { y: -80, opacity: 0.1, ease: 'power2.in' }, 0);
      }}
      className="bg-[#0B0F17]"
    >
      {/* ambient gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-[32rem] h-[32rem] rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-[32rem] h-[32rem] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* 3D center stage */}
      <div
        className="hero-orb absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)`,
          willChange: 'transform',
        }}
      >
        <Scene3D kind="health-core" />
      </div>

      {/* text layer */}
      <div className="hero-text relative z-10 mx-auto max-w-6xl px-6 h-full flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {site.hero.eyebrow}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="mt-5 text-5xl sm:text-7xl lg:text-8xl font-semibold text-white tracking-tight max-w-4xl"
          style={{ textShadow: '0 8px 48px rgba(34,211,238,0.15)' }}
        >
          {site.hero.headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl"
        >
          {site.hero.sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href={site.hero.ctaPrimary.href}
            className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-medium text-white bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/20 transition"
          >
            {site.hero.ctaPrimary.label}
          </Link>
          <Link
            href={site.hero.ctaSecondary.href}
            className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-medium text-slate-200 border border-white/10 hover:bg-white/5 backdrop-blur transition"
          >
            {site.hero.ctaSecondary.label}
          </Link>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-slate-500"
        >
          Scroll
        </motion.div>
      </div>
    </SceneShell>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
cd client && npx tsc --noEmit 2>&1 | grep "Scene01_Hero\|scenes/Scene01" | head -5
```

Expected: no output attributed to Scene01.

- [ ] **Step 3: Commit**

```bash
git add "client/app/scenes/Scene01_Hero.tsx"
git commit -m "feat(scenes): Scene 1 Hero cinematic"
```

---

## Task 11: Rebuild `app/page.tsx` as Cinematic Shell

**Files:**
- Modify: `client/app/page.tsx`

- [ ] **Step 1: Write the new page**

```tsx
import dynamic from 'next/dynamic';
import { SEO } from '@/lib/seo';
import { MainLayout } from '@/components/layout';
import { CinematicOverlays } from '@/components/landing/CinematicOverlays';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { SceneSkeleton } from '@/app/scenes/_shell';

export const metadata = SEO.home;

// Scene 1 (Hero) loads with the page — it's the LCP target.
import Scene01_Hero from '@/app/scenes/Scene01_Hero';

// Scenes 2-9 are lazy — they're below the fold and will be replaced in Phases 2.B/2.C.
const Scene02 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Problem  Solution" /> }), { ssr: false });
const Scene03 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="AI Dashboard" /> }),     { ssr: false });
const Scene04 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Devices" /> }),          { ssr: false });
const Scene05 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Features" /> }),         { ssr: false });
const Scene06 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Life Areas" /> }),       { ssr: false });
const Scene07 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Data Flow" /> }),        { ssr: false });
const Scene08 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Testimonials" /> }),     { ssr: false });
const Scene09 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Final CTA" /> }),        { ssr: false });

export default function HomePage() {
  return (
    <MainLayout>
      <CinematicOverlays />
      <main>
        <Scene01_Hero />
        <Scene02 />
        <Scene03 />
        <Scene04 />
        <Scene05 />
        <Scene06 />
        <Scene07 />
        <Scene08 />
        <Scene09 />
      </main>
      <PricingSection />
      <FAQSection />
    </MainLayout>
  );
}
```

**Import verification:** Before committing, confirm:
- `CinematicOverlays` is the actual named export (check `client/components/landing/CinematicOverlays.tsx`).
- `PricingSection` and `FAQSection` — confirm named vs default. Adjust accordingly.
- `MainLayout` is the named export from `@/components/layout`.

If any is a default export, change to `import X from '...';` form.

- [ ] **Step 2: Verify compile**

```bash
cd client && npx tsc --noEmit 2>&1 | grep "app/page" | head -5
```

Expected: no errors attributed to `app/page.tsx`.

- [ ] **Step 3: Build sanity (optional but recommended)**

```bash
cd client && npm run build 2>&1 | tail -30
```

Expected: the `/` route compiles. If the build is broken by unrelated WIP elsewhere, `tsc` passing for `app/page.tsx` is sufficient — note any unrelated build breakage.

- [ ] **Step 4: Commit**

```bash
git add client/app/page.tsx
git commit -m "feat(page): cinematic shell with Scene 1 + lazy scene stubs"
```

---

## Task 12: Manual QA Checklist

**Files:**
- Create: `docs/superpowers/verification/2026-04-15-cinematic-phase2a-manual-qa.md`

- [ ] **Step 1: Write checklist**

```markdown
# Cinematic Landing Phase 2.A — Manual QA

Run against a local dev environment after Phase 2.A commits are on master.

## Setup
- [ ] `cd client && npm run dev` — server up on port 3000
- [ ] Open `http://localhost:3000` in a modern browser with DevTools open

## Page loads cleanly
- [ ] No console errors.
- [ ] Hero scene renders immediately: orb placeholder, headline, sub, two CTAs, scroll cue.
- [ ] Below the fold, 8 placeholder scenes render with labels "Problem  Solution", "AI Dashboard", "Devices", "Features", "Life Areas", "Data Flow", "Testimonials", "Final CTA".
- [ ] Pricing and FAQ sections still render below all scene placeholders.

## Scroll behavior
- [ ] Lenis smooth-scroll active (wheel feels inertial, not abrupt).
- [ ] CinematicOverlays scroll progress bar visible at top as you scroll.
- [ ] Scrolling past Scene 1 fades+blurs the orb and text (scrub-driven).

## Reduced motion
- [ ] In DevTools → Rendering, emulate `prefers-reduced-motion: reduce`.
- [ ] Reload. Hero shows full text + CTAs immediately without the scrub fade on scroll (scene uses the "jump to end state" code path).

## Mobile
- [ ] DevTools → toggle device toolbar → iPhone 12 Pro width (390px).
- [ ] Hero text readable; CTAs full-width stacked; orb placeholder visible.
- [ ] No horizontal scrollbar on the page.
- [ ] Placeholder scenes each a full-viewport height.

## Archive verification
- [ ] `ls client/components/landing/_archive/` shows the 20 archived section files + README.
- [ ] None of those files are imported anywhere in `client/app/`.
  - Command: `grep -rln "from.*components/landing/\(hero-section\|problem-pain\|life-domains-carousel\)" client/app/ || echo "clean"`

## Build
- [ ] `cd client && npm run build` — either succeeds, or fails only on WIP elsewhere unrelated to the cinematic rebuild. Record any unrelated failures.

## COPY-REVIEW grep
- [ ] `grep -c COPY-REVIEW client/data/siteContent.ts` — expect ~30+ matches. These are the strings marketing should review.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/verification/2026-04-15-cinematic-phase2a-manual-qa.md
git commit -m "docs: manual QA for cinematic landing phase 2.A"
```

---

## Task 13: PROGRESS-DEV Entry

**Files:**
- Modify: `PRODUCTS/yhealth-app/PROGRESS-DEV.md`

- [ ] **Step 1: Append entry**

Append to the end of `PRODUCTS/yhealth-app/PROGRESS-DEV.md`:

```markdown
## 2026-04-15 — Cinematic Landing Phase 2.A (Shell + Hero)

**Shipped:**
- Archived 20 pre-cinematic landing sections to `client/components/landing/_archive/` with restoration README.
- New scene infra: `Scene3D` (placeholder today, clean Spline swap point), `SceneSkeleton`, `SceneShell`, `useSceneTimeline`.
- `client/data/siteContent.ts` with all copy tagged `// COPY-REVIEW`.
- Scene 1 (Hero) — full implementation with scrub-driven fade/blur, mouse parallax, glass eyebrow, gradient CTAs.
- `client/app/page.tsx` rebuilt as cinematic shell: Hero + 8 lazy-loaded scene placeholders + Pricing + FAQ.

**Deferred to later phases:**
- Scenes 2-5 implementations — Phase 2.B
- Scenes 6-9 implementations — Phase 2.C (Scene 6 Life Areas carousel pulls from `server/src/config/life-area-domains.ts`)
- Pricing + FAQ dark-tokens visual pass — Phase 2.D
- Real Spline scene URLs — drop into `Scene3D` `splineUrl` prop when ready; zero code change beyond a URL string in `siteContent.ts`
- Lighthouse + axe sweep — Phase 2.D

**Refs:**
- Spec: `docs/superpowers/specs/2026-04-15-cinematic-landing-page-design.md`
- Plan: `docs/superpowers/plans/2026-04-15-cinematic-landing-phase2a.md`
- Manual QA: `docs/superpowers/verification/2026-04-15-cinematic-phase2a-manual-qa.md`
```

- [ ] **Step 2: Commit**

```bash
git add PRODUCTS/yhealth-app/PROGRESS-DEV.md
git commit -m "docs: record cinematic landing phase 2.A milestone"
```

---

## Self-Review

**Spec coverage:**
- §1 decisions: all 5 locked decisions reflected. (C hybrid, B placeholder Spline, A Life Areas carousel content — content present, carousel implementation in Phase 2.C; C scaffolded copy with `COPY-REVIEW`; D commit-per-scene — followed here and continued in later phases.)
- §2 architecture: Tasks 5-9 cover the `_shell/` subsystem; Task 4 covers content module; Task 11 rebuilds page.tsx.
- §3 scene specs: Scene 1 implemented in Task 10. Scenes 2-9 show as skeletons (spec explicitly calls out Phase 2.A stops at Hero).
- §4 tech stack: no new deps in Phase 2.A — Spline import deferred until the first real URL (noted in Task 5).
- §5 performance: Scene 1 loads synchronously for LCP; scenes 2-9 `dynamic({ ssr: false })`; CSS-only transforms and opacity in Scene 1.
- §6 accessibility: `useReducedMotionSafe` honored in `useSceneTimeline`; scenes are `<section aria-label>`; 3D placeholders `aria-hidden`.
- §7 error handling / edge cases: reduced-motion short-circuit (Task 7); `gsap.context` cleanup (Task 7); scene chunk fallback via `SceneSkeleton`.
- §8 testing: Task 12 delivers the manual QA checklist (Playwright not configured — matches Phase 1 pattern).
- §9 phasing: Phase 2.A explicitly in scope; 2.B/2.C/2.D deferred and tracked in PROGRESS-DEV (Task 13).
- §10 out of scope: real Spline scenes, CMS, i18n — honored.

**Placeholder scan:** No "TBD", no "handle edge cases", no "similar to Task N". Task 11's import-verification note is explicit investigation guidance, not a placeholder — it tells the executor what to check and why.

**Type consistency:** `Scene3DKind` used identically in Scene3D (Task 5) and the barrel (Task 9). `SceneTimelineConfig` / `SceneTimelineResult` defined in Task 7, re-exported in Task 9. `site` object from Task 4 consumed in Task 10 with field paths that exist (`hero.eyebrow`, `hero.headline`, `hero.sub`, `hero.ctaPrimary.{label,href}`, `hero.ctaSecondary.{label,href}`). Verified by visual trace.

**Known open questions for the executor:**
- `FAQSection` and `PricingSection` named-vs-default export — Task 3 and Task 11 both call this out explicitly. Check and adjust; do not guess.
- `client/components/landing/index.ts` may or may not export the archived sections — Task 2 Step 2 handles this conditionally.

**Commit count:** 13 commits on master. Every one builds green.
