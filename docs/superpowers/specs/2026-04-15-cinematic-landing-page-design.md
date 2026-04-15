---
title: Cinematic Landing Page — Design Spec
date: 2026-04-15
status: Draft
owner: yhealth-app
---

# Cinematic Landing Page

Rebuild the yHealth landing page as a scroll-driven cinematic experience on par with Apple / Stripe / Linear / Tesla product pages. 9 pinned scenes + functional footer (pricing/FAQ). Reuses the existing GSAP + Lenis + ScrollTrigger infrastructure already in the repo. Ships commit-per-scene on `master`, never in a broken state.

## 1. Decisions Locked (from brainstorm)

1. **9 cinematic scenes + functional footer.** Pricing + FAQ + Footer remain as post-cinematic sections below Scene 9.
2. **No Spline scenes yet.** All 3D placeholders today with a single `Scene3D.tsx` swap point; drop real Spline URLs later, one-line per scene.
3. **Scene 6 horizontal carousel = Life Areas.** One card per domain from `server/src/config/life-area-domains.ts` (Career, Relationships, Creativity, Spirituality, Finance, Fitness, Learning, Custom).
4. **Copy scaffolded by me**, every string tagged `// COPY-REVIEW` in `client/data/siteContent.ts`.
5. **Commit-per-scene replacement on master.** Each commit builds green. Old sections move to `client/components/landing/_archive/` as scenes supersede them.

## 2. Architecture

```
client/
├── app/
│   ├── page.tsx                           ← cinematic shell; orchestrates scene order + lazy loading
│   └── scenes/
│       ├── _shell/
│       │   ├── Scene3D.tsx                ← single Spline/VRM swap component (placeholder today)
│       │   ├── SceneShell.tsx             ← wraps CinematicScene with standard pin/enter/exit
│       │   ├── SceneSkeleton.tsx          ← suspense fallback per scene
│       │   └── useSceneTimeline.ts        ← per-scene GSAP ScrollTrigger hook
│       ├── Scene01_Hero.tsx
│       ├── Scene02_ProblemSolution.tsx
│       ├── Scene03_AIDashboard.tsx
│       ├── Scene04_DeviceShowcase.tsx
│       ├── Scene05_FeatureGrid.tsx
│       ├── Scene06_LifeAreasCarousel.tsx
│       ├── Scene07_DataFlow.tsx
│       ├── Scene08_Testimonials.tsx
│       └── Scene09_FinalCTA.tsx
├── data/
│   └── siteContent.ts                      ← ALL marketing copy + scene configs
└── components/landing/
    ├── _archive/                           ← old 16 sections moved here; deletable later
    └── shared/                             ← existing infra kept (CinematicOverlays, CinematicScene, DepthLayer, ScrollParticles)
```

### Reused (NOT rebuilt)

| Existing | Purpose |
|---|---|
| `components/landing/shared/CinematicScene.tsx` | scene wrapper with pin + depth |
| `components/landing/shared/CinematicOverlays.tsx` | scroll progress bar + particles |
| `components/landing/shared/DepthLayer.tsx` | parallax primitive |
| `components/providers/LenisProvider.tsx` | smooth scroll |
| `lib/gsap-init.ts` | GSAP + ScrollTrigger registration |
| `hooks/use-gsap.ts` | GSAP context hook |
| `hooks/use-is-mobile.ts` | mobile gate |
| `hooks/use-scroll-velocity.ts` | scroll velocity signal |
| `hooks/use-mouse-parallax.ts` | cursor parallax |

### New infrastructure (thin additions)

- **`SceneShell.tsx`** — standard wrapper that every scene uses. Applies pin/scrub, default entry (fade+translate), default exit (scale-down+blur), injects `useSceneTimeline` hook. Scenes only supply their *active* animation + content.
- **`useSceneTimeline(sceneRef, config)`** — creates a ScrollTrigger timeline bound to the scene, returns `{ progress, isActive }`. Handles cleanup, mobile downgrade, and refresh on resize. Built on `use-gsap`.
- **`Scene3D.tsx`** — accepts `{ kind: 'health-core' | 'devices' | 'data-flow', splineUrl?: string }`. If `splineUrl` present → lazy load `@splinetool/react-spline`. If not → render a coded placeholder (CSS/Canvas) specific to `kind`. Single swap point for all 3D.
- **`SceneSkeleton.tsx`** — lightweight pulsing gradient block while a scene's chunk loads.

### Content module (`client/data/siteContent.ts`)

```ts
export const site = {
  hero: {
    headline: 'Your Health, Reimagined by AI', // COPY-REVIEW
    sub: 'Intelligent tracking that adapts to your life.', // COPY-REVIEW
    ctaPrimary: 'Get Started',
    ctaSecondary: 'Watch Demo',
  },
  problemSolution: {
    problems: [ /* COPY-REVIEW */ ],
    solutions: [ /* COPY-REVIEW */ ],
  },
  aiDashboard: { /* COPY-REVIEW */ },
  devices: { /* COPY-REVIEW */ },
  features: [ /* COPY-REVIEW — 6 cards */ ],
  lifeAreasCarousel: {
    // Pulled structurally from server life-area-domains registry;
    // marketing headline + supporting copy per card authored here with COPY-REVIEW
    headline: 'One app for every area of your life.', // COPY-REVIEW
    domains: [
      { type: 'career',       pitch: '...' /* COPY-REVIEW */ },
      { type: 'relationships',pitch: '...' /* COPY-REVIEW */ },
      // ... 8 total
    ],
  },
  dataFlow: { /* COPY-REVIEW */ },
  testimonials: [ /* COPY-REVIEW — synthetic, marked TODO-REAL */ ],
  finalCta: { /* COPY-REVIEW */ },
} as const;
```

The Scene 6 domain list is hand-authored in siteContent (not fetched from server) to avoid SSR coupling, but its `type` keys match `server/src/config/life-area-domains.ts` exactly so if marketing voice drifts from product, we catch it.

## 3. Scene Specifications

Every scene uses `SceneShell` which supplies:
- Entry: fade 0→1 + translateY 24→0, duration 0.6s cubic-bezier(0.4,0,0.2,1)
- Active: scene-specific animation (bound to ScrollTrigger.scrub)
- Exit: scale 0.96 + blur 4px + opacity 0.15 on scroll-past
- Mobile: entry unchanged, active complexity capped (no pin on mobile; scenes fall back to vertical flow)

### Scene 1 — Hero (Spline cinematic placeholder)
- **3D**: `Scene3D kind="health-core"`. Placeholder is a CSS/Canvas rotating orb with radial glow and particle ring. Scroll scrubs a fake "camera zoom" via `scale 1 → 1.15` + `translateZ` parallax.
- **Text**: Headline fades + parallax-up 40px; subtext follows 0.1s delay; CTAs slide-in from below after headline.
- **Nav**: fixed, glass backdrop; collapses to logo + Get Started on mobile.

### Scene 2 — Problem → Solution split
- Two stacked columns; on scroll-into-view they slide from ±60px opposite directions.
- Center divider `<div>` scales vertically 0→100% as timeline advances.
- Solution column rows glow (box-shadow cyan) when their paired problem row reaches 80% progress.

### Scene 3 — AI Intelligence Dashboard
- Left panel: SVG line chart where the stroke `pathLength` animates 0→1 on scroll.
- Right panel: synthetic chat; messages appear via typewriter effect tied to `ScrollTrigger.scrub` progress (not time).
- Below: radial progress + heat-map cards pulse (box-shadow opacity cycle) when active.

### Scene 4 — Device Showcase
- Laptop frame (`<DepthLayer z={40}>`) + phone frame (`<DepthLayer z={-30}>`) float with mouse parallax.
- Inner screens cycle through 3 states via `AnimatePresence` (dashboard → insights → logs) tied to scroll progress, not a setInterval.
- Subtle tilt on scroll: laptop rotateY + phone rotateY opposite directions, scale ~4°.

### Scene 5 — Feature Grid
- 6 cards (3×2 desktop, 2×3 tablet, 1-col mobile).
- Stagger reveal: ScrollTrigger batch, 0.08s between entries.
- Hover: translateY -6px + ring-1 cyan-400/40 + glass backdrop intensifies.

### Scene 6 — Life Areas Pinned Horizontal Carousel
- Pinned on desktop only (`useIsMobile` false). On mobile: vertical stack.
- 8 cards, each: icon (lucide name from domain registry), headline, pitch, "Try it" CTA linking to `/life-areas`.
- Horizontal translation: `x: -(totalWidth - viewportWidth)` bound to scroll progress via `scrub: 0.6` (momentum easing).
- Each card individually scales 0.9→1 as it enters the "focus slot" (screen center).

### Scene 7 — Data Flow
- 4 nodes (User Data → AI Brain → Prediction → Result) connected by SVG paths.
- `<path>` `stroke-dasharray` animates draw-in with scroll.
- Particles: 20 canvas dots traverse each path left→right in a loop, speed scales with scroll velocity (`useScrollVelocity`).
- Active node pulses (box-shadow grows/shrinks) based on which segment scroll-progress is in.

### Scene 8 — Testimonials
- 3 cards stacked at different z with rotation (-4°, 0°, +4°).
- Active card (center) scales to 1.05 and shadow intensifies; non-active cards dim to opacity 0.5.
- Scroll advances which card is "active" via scrub.
- Background: blur-backdrop that shifts hue subtly on card change.

### Scene 9 — Final CTA (cinematic exit)
- Full-viewport dark gradient.
- On scroll-in: radial glow expands from center (200px → 2400px).
- Headline + CTAs fade in at 40% timeline progress.
- On scroll-past: fade-to-black transition into pricing footer.

### Footer sections (NOT scenes — kept simple)
- **Pricing**: reuse current `pricing-section.tsx` with a visual pass (dark theme tokens, remove gaudy gradients).
- **FAQ**: reuse current `faq-section.tsx`.
- **Footer**: reuse current footer.

## 4. Tech Stack

- Next.js 15 App Router + React 19 (existing)
- Tailwind (existing; dark-first tokens already in `globals.css`)
- GSAP + ScrollTrigger (existing via `lib/gsap-init.ts`)
- Lenis (existing via `LenisProvider`)
- framer-motion (existing — scope: micro-interactions ONLY; hover/press/AnimatePresence)
- `@splinetool/react-spline` — added only when first real Spline URL lands; until then `Scene3D` uses placeholders and doesn't import Spline

## 5. Performance Targets

- **LCP < 2.5s**. Hero text + CTAs must render synchronously (no Suspense). Placeholder 3D lazy-loaded via `next/dynamic({ ssr: false, loading: SceneSkeleton })`.
- All scenes `dynamic()` imported with `loading: () => <SceneSkeleton/>`.
- Every animation uses `transform` / `opacity` only. No `top/left/width/height` tweens.
- Images use `next/image` with explicit `sizes`.
- Mobile: `useIsMobile()` gates all `pin: true` and reduces any `stagger` by ~50%.
- `will-change: transform` applied to pinned scene containers; removed on scroll-past.
- No `setInterval` / `setTimeout` for animation — everything is ScrollTrigger-driven.

## 6. Accessibility

- `prefers-reduced-motion`: all ScrollTrigger timelines short-circuit to `progress: 1` (final state shown, no animation).
- Every scene has a semantic `<section aria-labelledby="scene-N-title">` wrapper with a visually positioned `<h2 id="scene-N-title">`.
- Focusable elements (CTAs) never hidden behind `opacity: 0`; we render them and apply `pointer-events: none` until visible so keyboard nav still reaches them on a fade-in.
- Spline placeholder `<canvas>` has `aria-hidden="true"`; decorative only.

## 7. Error Handling & Edge Cases

- **Scene chunk fails to load**: `ErrorBoundary` at `page.tsx` level swaps a failing scene for a minimal static fallback (headline + CTA); the rest of the page keeps scrolling.
- **ScrollTrigger refresh timing**: `ScrollTrigger.refresh()` called on route mount + after all scene skeletons resolve + on window resize (debounced 150ms).
- **Hot-reload jank**: dev-only; we ensure `gsap.context` cleanup in every scene's effect return so HMR doesn't stack timelines.
- **Reduced-motion mid-scroll**: if user toggles `prefers-reduced-motion` mid-session, existing timelines stay; new mounts honor the new value. No runtime swap (too janky).
- **Horizontal carousel over-scroll**: ScrollTrigger `invalidateOnRefresh` + `anticipatePin: 1` to prevent flicker.

## 8. Testing Strategy

- **Manual QA checklist** per scene (same pattern as Life Areas Phase 1 QA doc). Playwright isn't configured in this repo.
- **Performance smoke**: Lighthouse run on local build; fail if LCP > 2.5s on simulated 3G.
- **Visual regression**: none for v1 — deferred to a follow-up phase if/when we adopt Chromatic or Percy.
- **Accessibility**: axe CLI sweep on `/` — zero critical violations.

## 9. Phasing

**Phase 2.A — Shell + Scene 1 (Hero)**
1. Move 16 current sections to `_archive/`.
2. Add `Scene3D`, `SceneShell`, `SceneSkeleton`, `useSceneTimeline`.
3. Add `data/siteContent.ts` skeleton.
4. Rebuild `app/page.tsx` as cinematic shell importing Scene 1 (all other scenes = placeholder `<SceneSkeleton>` so page renders).
5. Implement Scene 1 (Hero).

**Phase 2.B — Scenes 2–5**
6. Scene 2 Problem/Solution.
7. Scene 3 AI Dashboard.
8. Scene 4 Device Showcase.
9. Scene 5 Feature Grid.

**Phase 2.C — Scenes 6–9**
10. Scene 6 Life Areas Carousel (pinned horizontal).
11. Scene 7 Data Flow.
12. Scene 8 Testimonials.
13. Scene 9 Final CTA.

**Phase 2.D — Footer + polish**
14. Wire pricing + FAQ + footer below Scene 9 with dark-tokens pass.
15. Lighthouse + axe pass.
16. Mobile audit at 375px.
17. Copy audit (grep `COPY-REVIEW`).

Each numbered item = one commit on master. Page builds green at every commit.

## 10. Out of Scope (v1)

- Real Spline scenes (swap in when URLs available; zero code change beyond adding URL to siteContent).
- CMS integration for siteContent (Contentful/Sanity) — v1 is flat TS.
- Internationalization — English only for v1.
- Video backgrounds or custom cursor — future.
- A/B testing framework for landing page variants — future.
- SEO structured data beyond what `next-seo` already provides — future.

## 11. References

- Brief: as written by user on 2026-04-15.
- Existing infra: `client/components/landing/shared/`, `client/hooks/use-*`, `client/lib/gsap-init.ts`, `client/components/providers/LenisProvider.tsx`.
- Life Areas registry (Scene 6 source of truth): `server/src/config/life-area-domains.ts`.
- Memory: cinematic-landing prior work (2026-03-30); "redesign = replace, not add alongside" rule.
