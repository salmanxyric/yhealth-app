# Cinematic Landing Experience — Design Spec

**Date:** 2026-05-20
**Status:** Design — awaiting implementation plan
**Scope:** Replace the top landing page sections with a scroll-driven 5-act cinematic experience using GSAP + React Three Fiber
**Relation:** Implements Phase 7 (Premium Cinematic UX) of the SIA Universal Intelligence roadmap

---

## Table of Contents

1. [Summary](#1-summary)
2. [Architecture](#2-architecture)
3. [Act-by-Act Breakdown](#3-act-by-act-breakdown)
4. [3D Scene Architecture](#4-3d-scene-architecture)
5. [Animation System](#5-animation-system)
6. [Mobile Degradation & Performance](#6-mobile-degradation--performance)
7. [Integration with Existing Page](#7-integration-with-existing-page)
8. [Design Tokens](#8-design-tokens)
9. [File Manifest](#9-file-manifest)

---

## 1. Summary

Transform the top portion of the Balencia landing page into an interactive scroll-driven cinematic experience that tells the SIA story in 5 acts. The user scrolls through a continuous sequence — from a 3D constellation emerging from void, through SIA's introduction, interactive onboarding questions, a 12-week plan reveal, to a Today Screen — all orchestrated by a single GSAP master timeline driving a persistent React Three Fiber canvas.

**What it is:** An interactive web landing page where scroll position drives a cinematic narrative with 3D animations and interactive moments.

**What it replaces:** The existing hero, problem/pain, life domains carousel, how-it-works, and AI chat demo sections. Pricing, comparisons, CTA, testimonials, and footer remain below.

**Target:** Desktop-first with premium feel. Mobile gets gracefully degraded 2D fallback. No backend integration — interactive onboarding is visual demo only.

**Tech stack:** GSAP 3.12 + ScrollTrigger (master timeline), React Three Fiber + drei + postprocessing (3D constellation), Framer Motion (HTML card animations), Lenis (smooth scroll, already present), Tailwind v4 (styling via existing CSS vars).

---

## 2. Architecture

### Approach: GSAP Master Timeline — Single Scroll Conductor

One `gsap.timeline()` with `ScrollTrigger` scrub controls all 5 acts. The page scroll container is ~600vh. Scrolling drives a single master timeline that triggers sub-timelines for each act. The R3F constellation scene lives in a `position: fixed` canvas that responds to the master timeline's progress via React context.

### Page Composition

```
<LenisProvider>
  <CinematicExperience>              /* NEW — master orchestrator */

    /* Fixed-position R3F canvas — persists across all acts */
    <CinematicCanvas>
      <ConstellationScene />          /* 10 orbs + particles + connections */
    </CinematicCanvas>

    /* Scroll-driven content — ~600vh total */
    <div className="cinematic-scroll-container">
      <ActOne />          /* The Void & Emergence — 100vh */
      <ActTwo />          /* SIA Introduces Herself — 120vh */
      <ActThree />        /* The Understanding — 150vh (PINNED) */
      <ActFour />         /* The Reveal — 150vh */
      <ActFive />         /* The Landing — 80vh */
    </div>

  </CinematicExperience>

  /* === EXISTING SECTIONS BELOW (unchanged) === */
  <ComparisonTableSection />
  <PricingSection />
  <TestimonialsSection />
  <IntegrationsSection />
  <CTASection />
  <FooterSection />
</LenisProvider>
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Timeline orchestration | Single GSAP master timeline with ScrollTrigger scrub | Matches the "no cuts, seamless" vision from the story frame. Single source of truth for timing. |
| 3D rendering | Fixed-position R3F canvas that persists across acts | Allows the constellation to morph continuously without remounting. Canvas opacity controlled per-act. |
| Act III interactivity | `ScrollTrigger.pin()` freezes viewport; clicks drive sub-timeline via `tweenTo()` | Scroll pauses naturally during questions. After Q3, pin releases and scroll resumes. |
| React-R3F bridge | `CinematicContext` provider shares progress, act, selections | GSAP writes progress → derives scene state → R3F reads via `useFrame` (no React re-renders for scroll). |
| Mobile strategy | Detect via `matchMedia` + `hardwareConcurrency`; disable R3F, use CSS 2D fallback | Desktop-first. Mobile gets the same content/story but with simpler animations. |
| Existing preloader | Keep `CinematicSplash` as brief 2-3s loader that dissolves into Act I void | Gives R3F initialization time. User never sees blank canvas. |

### CinematicContext

```typescript
interface CinematicState {
  progress: number;                    // 0-1 master timeline progress
  activeAct: 1 | 2 | 3 | 4 | 5;
  isInteractive: boolean;             // true when Act III is pinned

  // User selections (visual demo only, not persisted)
  selectedDomain: string | null;
  selectedVision: string | null;
  selectedIntensity: string | null;

  // R3F control signals
  canvasOpacity: number;               // 0-1, CSS opacity on fixed canvas div
  sceneMode: 'constellation' | 'contracting' | 'ambient' | 'timeline' | 'fadeout';
}
```

Data flow:
- **GSAP `onUpdate`** → writes `progress` to context
- **`progress`** → derives `activeAct`, `sceneMode`, `canvasOpacity`
- **R3F `useFrame`** → reads context, interpolates 3D positions/materials (no React re-renders)
- **Act III clicks** → write selections to context → R3F reacts (ambient light shift)
- **Canvas wrapper** → reads `canvasOpacity` → CSS opacity on the fixed canvas div

Context updates throttled to 60fps via `requestAnimationFrame`.

---

## 3. Act-by-Act Breakdown

### Act I — The Void & Emergence

| Attribute | Value |
|-----------|-------|
| Scroll height | 100vh |
| Timeline range | 0% – 17% |
| Dominant layer | R3F (full 3D scene) |
| HTML content | Text overlay only |
| R3F scene mode | `constellation` |
| Canvas opacity | 1.0 |

**Scroll milestones:**
- **0–5%:** Pure black void. Single amber light point pulsing (R3F: one emissive sphere + point light). 3 seconds of stillness at page load.
- **5–12%:** Light fractures into 10 domain orbs. Each trails a bioluminescent filament back to origin. Particle fog fills 3D space. Orbs drift outward with physically accurate motion (inertia, natural deceleration).
- **12–15%:** Neural-pathway lines cascade between orbs (not all at once — sequential firing). Camera begins slow dolly-in. Constellation self-organizes into golden-ratio spiral.
- **15–17%:** Text fades in dimensionally within the constellation (parallax-responsive, not flat overlay): "Your life is one system. Let's see it clearly." Typography transitions ultra-thin → medium weight. Letter-spacing: wide → tight. On "clearly" — all connection lines pulse simultaneously.

### Act II — SIA Introduces Herself

| Attribute | Value |
|-----------|-------|
| Scroll height | 120vh |
| Timeline range | 17% – 40% |
| Dominant layer | Transition: R3F → HTML |
| HTML content | Glass panels + typographic choreography |
| R3F scene mode | `constellation` → `contracting` → `ambient` |
| Canvas opacity | 1.0 → 0.4 |

**Scroll milestones:**
- **17–22%:** Constellation contracts via inverse-square dynamics (orbs accelerate toward center, don't snap). Particle field compresses into device screen outline. Orbs settle as navigation icons within a dark UI shell.
- **22–26%:** Glass panels slide in from edges with spring physics (overshoot, settle, micro-bounce). SIA's identity mark appears — geometric form (compass + neural node), breathing on 4-second cycle. Warm ambient light behind UI casts volumetric rays.
- **26–34%:** Four dialogue lines appear sequentially via `CinematicText` component:
  1. "I'm SIA — your life coach." — luminous underline draws beneath "life coach"
  2. "I'm not a fitness app. I'm not a to-do list." — "not" flickers with red-shift, stabilizes. Previous line dims to 40%.
  3. "I connect the parts of your life you've been managing separately." — on "connect" domain icons pulse; on "separately" icons drift apart then snap back.
  4. "Let me show you what I mean." — warm amber italic serif, different typographic treatment.
- **34–36%:** Mini network visualization of connected domain nodes breathes below text.
- **36–40%:** Text ascends and compresses into thin luminous bar (conversation history indicator). Lower two-thirds opens for Act III.

### Act III — The Understanding (Interactive)

| Attribute | Value |
|-----------|-------|
| Scroll height | 150vh (PINNED) |
| Timeline range | 40% – 70% |
| Dominant layer | HTML (interactive cards) |
| HTML content | 3 question sequences with selection animations |
| R3F scene mode | `ambient` |
| Canvas opacity | 0.15 |
| Interaction model | `ScrollTrigger.pin()` freezes scroll; clicks advance via `tweenTo()` |

**Pin mechanics:**
- On entering Act III, `ScrollTrigger.pin()` freezes the viewport. Master timeline scrub is disabled.
- User clicks trigger `actThreeTL.tweenTo(label)` to animate between questions.
- After Q3 selection, pin releases and master scrub re-enables. Scroll resumes into Act IV.
- Progress dots (3 dots, filling as questions complete) visible throughout.

**Q1 — Domain Selection (40–50%):**
- SIA asks: "What area of your life needs the most attention right now?"
- 10 domain cards materialize in staggered cascade (120ms stagger).
- Layout: fluid masonry grid with subtle floating motion (2px amplitude, randomized phase).
- Each card: dark glass surface, frosted-blur background, 1px luminous border in domain color, custom animated line-art icon, domain name + one-line sub-label.
- Hover: card lifts 8px (spring), border brightens to full saturation, blur reduces.
- Click: selected card scales 120% → moves to center (spring animation). Unselected cards dissolve into particles that flow into the selected card. Selected card's domain color tints the entire scene's ambient lighting. Satisfying resonant sound cue.

**Q2 — Vision Setting (50–60%):**
- SIA asks: "What does success look like for you in [selected domain]?" — domain name rendered in domain color.
- 4 contextual suggestion capsules rise from below, each with distinct micro-animation:
  - "Sleep through the night consistently" — tiny moon-phase animation
  - "Feel less anxious about work" — descending wave
  - "Build a meditation habit" — expanding concentric ripples
  - Custom input field with pulsing cursor
- Click: capsule edges sharpen (crystallization), color saturates, micro-animation holds at apex.
- SIA responds: "That's worth building toward. Let's make it real." (faster than previous text — building conversational momentum).

**Q3 — Coaching Intensity (60–70%):**
- SIA asks: "How do you want me to show up for you?"
- Three vertical cards, each a distinct visual world:
  - **Gentle Presence:** soft gradients, slow particle drift, 24px radius. "I'll be here when you need me." Dawn light atmosphere.
  - **Steady Guide:** balanced contrast, rhythmic pulse, 16px radius. "A consistent rhythm. I'll suggest, you decide." Golden hour atmosphere.
  - **Full Accountability:** sharp contrasts, crisp edges, 8px radius, faster particles. "I'll push you. I'll track you." Electric twilight atmosphere.
- Hover: entire scene ambient lighting shifts to match card's atmosphere.
- Click: selected expands full-width, others slide off-screen. SIA's identity mark morphs to reflect chosen style.
- Exit: 3 answer cards stack vertically, compress into a single "life blueprint seed" — a luminous card. Scroll resumes.

### Act IV — The Reveal

| Attribute | Value |
|-----------|-------|
| Scroll height | 150vh |
| Timeline range | 70% – 93% |
| Dominant layer | Mixed (R3F timeline topography + HTML cards overlay) |
| HTML content | Week cards, insight cards, feature vignettes |
| R3F scene mode | `timeline` |
| Canvas opacity | 0.6 |

**Scroll milestones:**
- **70–76%:** Blueprint seed hovers on dark canvas. 12-week timeline renders progressively — week waypoints crystallize with neural pathway animations firing from seed to each week. Deliberate 8-10s generation pacing (scroll-driven, not instant). SIA: "Building your first 12 weeks..." Timeline has 3D topography (rises for challenge weeks, plateaus for consolidation, summit at week 12).
- **76–82%:** Camera dollies along timeline. Week 1 card expands: 3 specific activities with domain color accent, duration badge, difficulty meter. "We start where it matters — your evening routine." Week 4 milestone: golden badge, warm light bloom (no confetti).
- **82–88%:** **THE MONEY SHOT — Week 6 cross-domain intelligence reveal.** Cross-domain connection lines fire as golden electrical impulses across the timeline. Mental Wellbeing → Physical Health: sleep quality correlation insight. Mental Wellbeing → Career: stress pattern insight. Insight card examples: "Your sleep quality drops 23% on days with 3+ meetings." "Evening meditation correlates with next-day focus scores." SIA: "This is where it gets interesting. Week 6: I start connecting your mental wellbeing to how you're sleeping, moving, and working."
- **88–90%:** Camera rises above timeline. All cross-domain connections visible as dense neural network. Week 12 summit glows. Holographic data card: radar chart showing projected improvement.
- **90–93%:** Three feature vignettes float in as premium cards:
  1. **Cross-Pillar Intelligence:** 10-node circular graph with weighted pulsing edges. "Most apps see one dimension. SIA sees ten."
  2. **Adaptive Coaching:** week card morphing in real-time (activity swaps, difficulty adjusts). "Your plan isn't fixed. It learns as you do."
  3. **Predictive Insights:** notification preview card. "SIA doesn't just track — she anticipates."

### Act V — The Landing

| Attribute | Value |
|-----------|-------|
| Scroll height | 80vh |
| Timeline range | 93% – 100% |
| Dominant layer | HTML (pure UI) |
| HTML content | Today Screen, action cards, closing |
| R3F scene mode | `fadeout` |
| Canvas opacity | 0.15 → 0.0 |

**Scroll milestones:**
- **93–95%:** Portal transition — camera pushes through convergence point. R3F fades out. Today Screen assembles with choreography: background → time/date → SIA greeting → action cards (200ms stagger cascade from below).
- **95–97%:** SIA greeting zone: full-width card, identity mark breathing, domain color strip. "Good morning. Today we're focusing on your evening routine — small change, big ripple effect." Micro-insight: "Day 3 of your plan. 2 of 2 completed yesterday."
- **97–98%:** Intelligence teaser card (amber accent, different texture): "As we get to know each other, I'll start connecting dots across your life." Three locked insight slots below: "Sleep ↔ Mood correlation" (locked), "Stress pattern detection" (locked), "Cross-domain weekly report" (locked).
- **98–99%:** Three action cards:
  1. Mental Wellbeing: "10-minute evening wind-down" (10 min, primary styling)
  2. Physical Health: "Log last night's sleep" (2 min, secondary styling)
  3. Personal Growth: "Set one intention for tomorrow" (3 min, tertiary styling)
  - Total: "~15 minutes today" badge. Integration offer below at 40% opacity (WHOOP, Apple Health, Google Calendar).
- **99–100%:** "Welcome to Balencia. Let's begin." — amber italic serif. First action card pulses once. Balencia wordmark fades in. Canvas fully transparent. 3-second hold on final composition. Gradient transition into existing sections below.

---

## 4. 3D Scene Architecture

### ConstellationScene (R3F)

Single persistent `<Canvas>` at `position: fixed; inset: 0; z-index: 0`. Never unmounts — only internal state changes per act.

**Scene graph:**
```
<Canvas frameloop="demand">
  <CameraRig />                  /* Position/rotation driven by timeline progress */
  <AmbientParticles />           /* Instanced mesh, ~2000 particles on desktop */
  <group ref={orbsGroup}>
    <Orb key={0..9}>             /* 10 domain orbs */
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial emissive={domainColor} transparent />
      </mesh>
      <Filament />               /* Bioluminescent trail (tube geometry) */
      <pointLight />             /* Per-orb glow */
    </Orb>
  </group>
  <NeuralConnections />          /* Line segments between orbs */
  <EffectComposer>
    <Bloom luminanceThreshold={0.6} />
    <DepthOfField />             /* Act I only */
    <Vignette />
  </EffectComposer>
</Canvas>
```

**Scene states by act:**

| Act | Scene Mode | Orbs | Particles | Connections | Camera | Opacity |
|-----|-----------|------|-----------|-------------|--------|---------|
| I | `constellation` | Emerge from center, drift outward, form spiral | Dense fog (2000) | Cascade in, pulse | Dolly in through network | 1.0 |
| II | `contracting` | Accelerate to center (inverse-square), settle as UI icons | Compress into device outline | Hold, then fade | Push in as constellation contracts | 1.0 → 0.4 |
| III | `ambient` | Subtle background positions | Minimal (200) | Hidden | Static | 0.15 |
| IV | `timeline` | Reposition as timeline nodes | Moderate (800) | Fire as golden impulses between timeline weeks | Dolly along timeline, then rise above | 0.6 |
| V | `fadeout` | Fade out | Fade out | Fade out | Static | 0.15 → 0.0 |

**Orb component:** Each orb has position, scale, emissive color, and emissive intensity driven by the master timeline progress. Interpolation happens in `useFrame` using `THREE.Vector3.lerp` and `THREE.MathUtils.lerp` — no React state updates for continuous animation.

**NeuralConnections component:** Uses `THREE.BufferGeometry` with `THREE.LineSegments`. Connection visibility and color driven by timeline progress. During Act I, connections appear sequentially. During Act IV, they fire as animated impulses (vertex color animation along the line).

**Particle system:** `THREE.InstancedMesh` with a single draw call. Particle positions stored in an `InstancedBufferAttribute`. Animated via compute-in-`useFrame` (update instance matrix per frame). Count adapts: 2000 desktop / 0 mobile.

---

## 5. Animation System

### GSAP Master Timeline

```typescript
// useMasterTimeline.ts
const master = gsap.timeline({
  scrollTrigger: {
    trigger: scrollContainerRef,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,              // smooth 1s lag for cinematic feel
  }
});

// Each act registers its sub-timeline at a position
master.add(actOneTL, 0);
master.add(actTwoTL, '17%');
master.add(actThreeTL, '40%');
master.add(actFourTL, '70%');
master.add(actFiveTL, '93%');
```

### Act III Pin Mechanics

```typescript
// Separate pinned ScrollTrigger for Act III
ScrollTrigger.create({
  trigger: actThreeRef,
  start: 'top top',
  end: '+=150%',
  pin: true,
  onEnter: () => {
    master.scrollTrigger.disable();
    setInteractiveMode(true);
  },
  onLeaveBack: () => {
    master.scrollTrigger.enable();
    setInteractiveMode(false);
  }
});

// Click handlers advance sub-timeline
function onQuestionAnswered(questionIndex: number) {
  const targets = ['q2Start', 'q3Start', 'actThreeEnd'];
  actThreeTL.tweenTo(targets[questionIndex], {
    duration: 0.8,
    ease: 'power2.inOut'
  });
  if (questionIndex === 2) {
    ScrollTrigger.getById('actThreePin').disable();
    master.scrollTrigger.enable();
  }
}
```

### Animation Tokens (from Production Bible)

| Token | Value | Usage |
|-------|-------|-------|
| Spring physics | `stiffness: 200, damping: 20, mass: 1` | All card movements (Framer Motion) |
| Ease curve | `cubic-bezier(0.16, 1, 0.3, 1)` / GSAP `power3.out` | Fast start, graceful settle |
| Micro duration | 150–200ms | Icon state changes, hover effects |
| Standard duration | 300–500ms | Card movements, panel slides |
| Macro duration | 800–1200ms | Scene transitions, act changes |
| Stagger | 80–120ms between siblings | Domain cards: 120ms. Action cards: 200ms |
| Parallax depth | Foreground 1x, Midground 0.6x, Background 0.3x | Consistent 3D depth feel |
| SIA breathing | 4s cycle (2s in, 2s out) | Identity mark + ambient elements |
| CinematicText speed | 45ms per character | Letter-by-letter typographic animation |

**Anti-patterns (enforced):** No bounce easing. No elastic overshoot >15%. No linear motion on UI elements. No motion for motion's sake.

### CinematicText Component

Reusable component for SIA's typographic choreography:
- Letter-by-letter reveal at configurable speed (default 45ms/char)
- Supports inline styling markers: underline glow, red-shift flicker, domain color tinting
- Previous lines dim to configurable opacity (default 40%)
- Built with GSAP `SplitText`-style approach (wrap each character in a span, animate opacity/transform)

---

## 6. Mobile Degradation & Performance

### Detection

```typescript
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const isLowEnd = navigator.hardwareConcurrency <= 4;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Desktop (primary target)

- Full R3F constellation with post-processing (Bloom, DepthOfField, Vignette)
- All particle systems at full density (2000 particles)
- GSAP scrub at 60fps, `scrub: 1`
- Spring physics on all interactive elements
- `frameloop="demand"` — R3F only renders when `useFrame` requests it

### Mobile fallback

- R3F canvas **disabled** — replaced with CSS-animated 2D constellation:
  - Radial gradient circles for orbs
  - CSS `@keyframes` for pulsing and drifting
  - CSS `backdrop-filter` for glass effects
- Particle count: 0
- GSAP timelines simplified — fewer intermediate keyframes, `scrub: 0.5`
- Act III questions fully functional (HTML, not 3D-dependent)
- Act IV timeline: flat 2D HTML cards instead of 3D topography

### Reduced motion

- All GSAP timelines play instantly (no scrub animation)
- Particles disabled
- Breathing animations paused
- Cards appear without spring physics (instant position)
- Uses existing `use-reduced-motion-safe.ts` hook

### Performance budget

| Metric | Target |
|--------|--------|
| Desktop FPS | 60fps sustained, 30fps acceptable during Act I particle burst |
| LCP | < 2.5s (preloader covers R3F initialization) |
| TBT | < 200ms (GSAP timeline registration is sync but fast) |
| Bundle impact | ~50KB gzipped for cinematic components (R3F/Three.js already in bundle) |
| Orb geometry | `sphereGeometry args={[1, 16, 16]}` (low poly, bloom hides edges) |
| Particles | InstancedMesh, 1 draw call for all |
| Post-processing | Bloom + Vignette always; DepthOfField only during Act I camera dolly |

---

## 7. Integration with Existing Page

### Sections Replaced

| Existing Section | Replaced By |
|-----------------|-------------|
| `HeroSection` | Acts I + II (constellation + SIA intro) |
| `TrustBarSection` | Removed (trust built through the experience) |
| `ProblemPainSection` | Act II ("not a fitness app, not a to-do list") |
| `LifeDomainsCarouselSection` | Act III Q1 (domain selection) |
| `HowItWorksSection` | Act IV (12-week plan reveal) |
| `AiChatDemoSection` | Act II (SIA typographic dialogue) |

### Sections Retained (below cinematic experience)

- `ComparisonTableSection`
- `PricingSection`
- `TestimonialsSection` / social proof
- `IntegrationsSection`
- `CTASection`
- `FooterSection`

### Transition Seam

Act V ends with Balencia wordmark and R3F canvas at `opacity: 0`. Below, a CSS gradient from `#000000` → `#0A0A0B` (existing surface color) bridges into the retained sections. No jarring cut.

### CinematicSplash Handling

Keep existing `CinematicSplash.tsx` as a brief 2-3s preloader that dissolves into Act I's void. This gives R3F initialization time — user never sees a blank canvas. The preloader's existing EnergyCore/particles create visual continuity into Act I's single amber light point.

### page.tsx Modification

```tsx
// Before: 51 sections loaded sequentially
// After: CinematicExperience replaces top ~6 sections

export default function LandingPage() {
  return (
    <LenisProvider>
      <CinematicSplash />           {/* existing, 2-3s */}
      <CinematicExperience />       {/* NEW — 5 acts */}

      {/* Retained sections */}
      <ComparisonTableSection />
      <PricingSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <CTASection />
      <FooterSection />
    </LenisProvider>
  );
}
```

---

## 8. Design Tokens

### Color Architecture

| Token | Value | Usage |
|-------|-------|-------|
| `--void` | `#000000` | True black for OLED, Act I background |
| `--surface` | `#0A0A0B` | Primary background |
| `--elevated` | `#141416` | Cards, panels |
| `--border` | `rgba(255,255,255,0.06)` | Glass edges |
| `--text-primary` | `#F5F5F7` | Off-white (pure `#FFF` is banned) |
| `--text-secondary` | `rgba(245,245,247,0.6)` | Supporting text |
| `--sia-accent` | `#D4A574` | SIA's warm amber signature |

### Domain Colors

| Domain | Hex | 60% Opacity (dark bg) | 100% (active) |
|--------|-----|-----------------------|----------------|
| Mental Wellbeing | `#8B5CF6` | `rgba(139,92,246,0.6)` | `#8B5CF6` |
| Physical Health | `#10B981` | `rgba(16,185,129,0.6)` | `#10B981` |
| Career & Purpose | `#3B82F6` | `rgba(59,130,246,0.6)` | `#3B82F6` |
| Relationships | `#F43F5E` | `rgba(244,63,94,0.6)` | `#F43F5E` |
| Financial Health | `#F59E0B` | `rgba(245,158,11,0.6)` | `#F59E0B` |
| Personal Growth | `#D97706` | `rgba(217,119,6,0.6)` | `#D97706` |
| Spiritual Life | `#6366F1` | `rgba(99,102,241,0.6)` | `#6366F1` |
| Recreation | `#FB7185` | `rgba(251,113,133,0.6)` | `#FB7185` |
| Physical Environment | `#6EE7B7` | `rgba(110,231,183,0.6)` | `#6EE7B7` |
| Community | `#14B8A6` | `rgba(20,184,166,0.6)` | `#14B8A6` |

### Material Language

| Material | CSS | Usage |
|----------|-----|-------|
| Dark Glass | `background: rgba(20,20,22,0.7); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.06)` | Cards, panels, floating elements |
| Luminous Edge | `box-shadow: 0 0 20px rgba(color, 0.15); border: 1px solid rgba(color, 0.3)` | Selected/active states |
| Warm Surface | noise texture overlay at 3% + warm color grade | SIA greeting zones |

### Typography

| Role | Font | Weight | Size Range |
|------|------|--------|------------|
| Hero Statement | Instrument Serif | Light 300 | 72–96px |
| SIA Dialogue | DM Sans | Regular 400 | 28–32px |
| UI Headers | DM Sans | Medium 500 | 20–24px |
| Body | DM Sans | Regular 400 | 16–18px |
| Captions/Badges | DM Sans | Medium 500 | 12–14px |
| SIA Italic | Instrument Serif | Regular 400, italic | 16–20px |

---

## 9. File Manifest

### New Files

| File | Purpose |
|------|---------|
| `client/components/cinematic/CinematicExperience.tsx` | Master orchestrator — context provider, scroll container, GSAP master timeline setup |
| `client/components/cinematic/CinematicCanvas.tsx` | Fixed R3F canvas wrapper — opacity control, mobile detection |
| `client/components/cinematic/ConstellationScene.tsx` | R3F scene: 10 orbs, particles, connections, camera, post-processing |
| `client/components/cinematic/useMasterTimeline.ts` | Custom hook: creates GSAP master timeline with ScrollTrigger, exposes progress |
| `client/components/cinematic/CinematicContext.tsx` | React context: progress, activeAct, sceneMode, canvasOpacity, selections |
| `client/components/cinematic/acts/ActOne.tsx` | Void + emergence + text statement |
| `client/components/cinematic/acts/ActTwo.tsx` | SIA introduction + typographic choreography |
| `client/components/cinematic/acts/ActThree.tsx` | 3 pinned question cards with click-to-advance |
| `client/components/cinematic/acts/ActFour.tsx` | Timeline generation + intelligence reveal + vignettes |
| `client/components/cinematic/acts/ActFive.tsx` | Today Screen + closing |
| `client/components/cinematic/shared/CinematicText.tsx` | Letter-by-letter typographic animation component |
| `client/components/cinematic/shared/DomainCard.tsx` | Glass-morphism domain selection card (Act III Q1) |
| `client/components/cinematic/shared/VisionCapsule.tsx` | Vision option capsule with micro-animation (Act III Q2) |
| `client/components/cinematic/shared/IntensityCard.tsx` | Coaching intensity card with atmosphere shift (Act III Q3) |
| `client/components/cinematic/shared/ActionCard.tsx` | Today Screen action card (Act V) |
| `client/components/cinematic/shared/GlassPanel.tsx` | Reusable glass-morphism container |
| `client/components/cinematic/shared/ProgressDots.tsx` | 3-dot question progress indicator |
| `client/components/cinematic/shared/SiaIdentityMark.tsx` | Breathing geometric identity mark |

### Files to Modify

| File | Change |
|------|--------|
| `client/app/page.tsx` | Replace top ~6 sections with `<CinematicExperience />`, keep bottom sections |
| `client/app/globals.css` | Add cinematic-specific CSS custom properties (void, surface, SIA tokens) if not already present |
| `client/components/landing/CinematicSplashWrapper.tsx` | Adjust dissolve transition to flow into Act I void |
