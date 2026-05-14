# Cinematic Preloader — Design Specification

**Date:** 2026-05-14
**Status:** Draft
**Scope:** Full-screen cinematic splash + lightweight route loader for Balencia (yHealth) app

---

## 1. Overview

Two-component preloader system for the Balencia AI health app:

1. **CinematicSplash** — immersive 3D intro that plays once per browser session on first visit. Features a geometric energy core, orbital rings, neural particles, holographic panels, and a quantum grid, rendered via Three.js / React Three Fiber with cinematic post-processing.
2. **RouteLoader** — lightweight version of the same visual language for Next.js page transitions. Replaces the current `loading.tsx`.

### Design Language

- Ultra-modern sci-fi aesthetic (Apple + Black Mirror + Interstellar)
- Feels like watching an AI consciousness processing reality
- Slow, hypnotic, intelligent motion — no abrupt transitions
- Premium, enterprise-grade, emotionally engaging

---

## 2. Technology Stack

| Technology | Role |
|------------|------|
| Three.js + @react-three/fiber | 3D scene rendering |
| @react-three/drei | Helper components (Float, Points, shaderMaterial) |
| @react-three/postprocessing | Bloom, DOF, vignette, chromatic aberration |
| GSAP | Exit dissolution timeline, precise sequencing |
| Custom GLSL shaders | Energy flow, grid ripple, particle trails |

All dependencies are already installed in the project.

---

## 3. Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `core-cyan` | #00E5FF | Primary glow — core edges, particles, grid lines |
| `electric-blue` | #2979FF | Rim light, middle orbital ring, secondary particles |
| `violet` | #7C4DFF | Outer ring, accent spots, energy pulse flashes |
| `gold` | #FFD740 | Inner core glow, "processed data" particles (~10%) |
| `white-highlight` | #FFFFFF @ 80% | Information glow on panels, bright particle tips |
| `deep-black` | #0A0A0F | Scene background |
| `dark-navy` | #0D1117 | Gradient blend near edges |

---

## 4. Component Architecture

### 4.1 Component Tree — CinematicSplash

```
<CinematicSplash>                     # Fixed overlay, z-index 9999
  <Canvas gl={{ antialias: true, alpha: false }}>
    <CameraRig />                     # Slow orbit + micro-zoom + bob
    <PostProcessing />                # Bloom → DOF → Vignette → ChromAb → Noise
    <EnergyCore />                    # Central icosahedron + inner glow sphere
    <OrbitalRings count={3} />        # Concentric rings with traveling nodes
    <NeuralParticles count={200} />   # Spiral-in data streams
    <HolographicPanels count={4} />   # Floating translucent UI panels
    <QuantumGrid />                   # Floor grid with ripple waves
    <AmbientParticles count={100} />  # Background star dust
    <Lighting />                      # Point + directional + ambient + spots
  </Canvas>
  <ProgressOverlay />                 # HTML layer: progress bar + loading text
</CinematicSplash>
```

### 4.2 Component Tree — RouteLoader

```
<RouteLoader>                         # Fixed overlay, z-index 9998
  <Canvas>
    <MiniCore />                      # 40% scale icosahedron
    <MiniParticles count={30} />      # Close-orbit particles
    <SingleBloom />                   # Bloom only, no other post-processing
  </Canvas>
  <ProgressRing />                    # SVG ring overlay
</RouteLoader>
```

### 4.3 File Structure

```
client/components/preloader/
├── CinematicSplash.tsx               # Full intro orchestrator
├── RouteLoader.tsx                   # Lightweight route transition version
├── scene/
│   ├── EnergyCore.tsx                # Icosahedron wireframe + inner glow sphere
│   ├── OrbitalRings.tsx              # 3 rings + traveling node spheres
│   ├── NeuralParticles.tsx           # Instanced streaming data particles
│   ├── HolographicPanels.tsx         # 4 floating translucent UI panels
│   ├── QuantumGrid.tsx               # Floor grid with ripple shader
│   ├── AmbientParticles.tsx          # Background star dust points
│   ├── CameraRig.tsx                 # Orbit + micro-zoom + vertical bob
│   ├── Lighting.tsx                  # All light sources
│   └── PostProcessing.tsx            # Effect pipeline
├── shaders/
│   ├── energy-flow.glsl              # Edge energy pulse (vertex + fragment)
│   ├── grid-ripple.glsl              # Grid wave propagation
│   └── particle-trail.glsl           # Trail fade effect
├── hooks/
│   ├── use-loading-progress.ts       # Real progress tracking controller
│   └── use-splash-state.ts           # Session storage + state machine
├── ProgressOverlay.tsx               # HTML progress text + bar
├── ProgressRing.tsx                  # SVG ring for route loader
└── constants.ts                      # Colors, timing, sizes, animation params
```

---

## 5. Visual Elements — Detailed Specifications

### 5.1 Energy Core

**Geometry:** `IcosahedronGeometry(radius=1, detail=1)` — 20 triangular faces, wireframe only.

**Wireframe material:**
- Custom `shaderMaterial` with energy-flow shader
- Base color: `core-cyan` (#00E5FF)
- Energy pulses travel along edges — bright spots that move from vertex to vertex over ~2s
- Emissive intensity oscillates (0.6 → 1.0) in sync with breathing

**Inner glow sphere:**
- `SphereGeometry(radius=0.6)` nested inside icosahedron
- `MeshStandardMaterial` with emissive `gold` (#FFD740), emissive intensity 0.8
- Opacity 0.3 (transparent, volumetric feel)

**Animation:**
- Rotation: Y-axis at `2π / 8s`, X-axis at `2π / 12s` (dual-axis, never stops)
- Breathing: scale oscillates `0.95 → 1.05` on a 3s sine cycle
- Energy flow: shader uniform `uTime` drives pulse position along edges

### 5.2 Orbital Rings

Three `TorusGeometry` rings orbiting the core:

| Property | Inner Ring | Middle Ring | Outer Ring |
|----------|-----------|-------------|------------|
| Radius | 1.8 | 2.7 | 3.8 |
| Tube radius | 0.008 | 0.006 | 0.004 |
| Tilt | 15° X-axis | -25° Z-axis | 40° X, 10° Y |
| Revolution | 6s | 10s | 16s |
| Color | core-cyan | electric-blue | violet |
| Opacity | 0.6 | 0.4 | 0.3 |
| Style | Dashed line | Small spheres along path | Thin solid |
| Traveling nodes | 2 | 3 | 2 |

**Traveling nodes:** small `SphereGeometry(0.04)` spheres that move along the ring path at slightly different speeds than the ring rotation. Emissive material matching ring color but at full brightness.

### 5.3 Neural Particles (Data Streams)

**Count:** 200 particles, rendered via `<Points>` with `<PointMaterial>` (instanced).

**Behavior:**
- Spawn at random positions on a sphere of radius 5-6 (outer boundary)
- Spiral inward toward the core along curved paths (Fibonacci spiral with noise perturbation)
- Travel time: 2-4 seconds from edge to core surface
- On reaching core (radius < 1.2): burst outward in random direction, respawn at outer boundary
- Continuous cycle — always ~200 particles in motion

**Visual properties:**
- Size: 0.5px (far) to 3px (near core) — scaled by distance
- Color distribution: 60% cyan, 25% white, 10% gold, 5% violet
- Trail: each particle stores 4 previous positions, rendered as decreasing-opacity points (1.0 → 0.6 → 0.3 → 0.1)

### 5.4 Holographic Panels

**Count:** 4 panels at asymmetric positions around the core.

**Geometry:** `PlaneGeometry` — varying sizes (0.8x0.5 to 1.2x0.8 units).

**Material:**
- `MeshPhysicalMaterial` with transmission 0.85, roughness 0.1
- Opacity 0.15-0.25
- Cyan edge glow (emissive border via custom shader or thin edge geometry)

**Content texture:** Generated via offscreen `<canvas>`:
- Horizontal lines simulating text (6-10 lines per panel, varying widths)
- One panel has a small bar chart (4 bars)
- One panel has a circular progress arc
- One panel has a grid of small dots (data matrix)
- Content is decorative — not real UI

**Animation:**
- Float: gentle Y-axis bobbing ±0.05 units, 4-6s period per panel (staggered)
- Rotation: panels slowly orient toward camera (billboard with damping, not instant snap)
- Placement: positions = [(-2.5, 0.8, 1), (2.2, -0.3, -1.5), (-1.8, -1, -0.5), (3, 0.5, 0.8)]

### 5.5 Quantum Grid

**Geometry:** `PlaneGeometry(20, 20, 40, 40)` rotated flat (X-Z plane), positioned at Y=-2.

**Shader (grid-ripple.glsl):**
- Renders grid lines at 0.5 unit spacing
- Line color: core-cyan at opacity 0.08-0.15
- Ripple effect: concentric circles emanate from center (below core), expanding outward
- Ripple interval: new wave every 3s
- Ripple speed: ~2 units/second
- Lines brighten to 0.3 opacity as ripple passes, then fade back
- Distance fade: lines fade to 0 opacity beyond radius 8 (soft fog)

### 5.6 Ambient Particles

**Count:** 100 static points via `<Points>`.

**Properties:**
- Scattered in sphere of radius 8-15 (far background)
- Size: 0.5-1px
- Color: white and pale blue (#E0F7FA) at opacity 0.3-0.6
- Animation: very slow random drift (0.001 units/frame in random direction)
- Creates depth and "deep space" ambience

---

## 6. Camera

**Type:** `PerspectiveCamera`, FOV 60°, near 0.1, far 100.

**Orbit:**
- Continuous rotation around Y-axis at elevation ~15°
- Orbit radius: 7 units from center
- Full revolution: 40 seconds
- Uses sine-eased position (not linear) for organic feel

**Micro-zoom:**
- Every 8-10 seconds, FOV narrows by 2-3° over 1.5s, then returns over 2s
- Creates a subtle "focusing" sensation
- Triggered on a repeating GSAP tween

**Vertical bob:**
- Elevation oscillates ±3° on a 12s sine cycle
- Combined with orbit creates a floating, weightless perspective

---

## 7. Lighting

| Light | Type | Color | Intensity | Position | Notes |
|-------|------|-------|-----------|----------|-------|
| Core glow | PointLight | #FFD740 → #00E5FF | 2.0 (pulses 1.5-2.5) | (0, 0, 0) | Inside core, pulses with breathing |
| Rim | DirectionalLight | #2979FF | 0.5 | (2, 3, -5) | Edge highlights on rings/panels |
| Fill | AmbientLight | #FFFFFF | 0.05 | Global | Prevents pure black crush |
| Left accent | SpotLight | #7C4DFF | 0.8 | (-4, 3, 2) | Violet pool on grid, angle 30° |
| Right accent | SpotLight | #00E5FF | 0.6 | (4, 2, -2) | Cyan pool on grid, angle 25° |

---

## 8. Post-Processing Pipeline

Applied via `@react-three/postprocessing` `<EffectComposer>`:

| Order | Effect | Parameters | Purpose |
|-------|--------|------------|---------|
| 1 | Bloom (UnrealBloom) | luminanceThreshold: 0.2, intensity: 1.5, radius: 0.8 | Makes all emissive materials glow — the key cinematic effect |
| 2 | DepthOfField | focusDistance: 0.02, focalLength: 0.05, bokehScale: 2 | Subtle blur on far background particles |
| 3 | Vignette | offset: 0.3, darkness: 0.7 | Darkens edges, draws eye to center |
| 4 | ChromaticAberration | offset: [0.0005, 0.0005] | Filmic quality on bright edges |
| 5 | Noise | opacity: 0.03, premultiply: true | Film grain texture in dark areas |

---

## 9. Progress System

### 9.1 Loading Progress Controller (`use-loading-progress.ts`)

Tracks real app readiness across 4 stages:

| Stage | Progress Range | Signal |
|-------|---------------|--------|
| Document ready | 0% → 20% | `document.readyState === 'complete'` |
| Fonts loaded | 20% → 40% | `document.fonts.ready` |
| Hydration complete | 40% → 70% | `useEffect` in root layout dispatches `window.dispatchEvent(new Event('app-hydrated'))` — splash listens for this event |
| Critical assets | 70% → 100% | Preload key images via `Image()` constructor, track `onload` |

**Smoothing:** Progress never jumps — it animates smoothly between stages using GSAP `gsap.to(progressRef, { value: targetPercent, duration: 0.8, ease: "power2.out" })`.

### 9.2 Timing Constraints

- **Minimum display:** 2.5 seconds — the animation always completes its introductory arc
- **Maximum display:** 8 seconds — force-exit if loading stalls
- **Exit trigger:** `progress >= 100% AND elapsed >= 2.5s`

### 9.3 Visual Progress Indicator

One of the inner ring's traveling nodes doubles as the progress indicator:
- At 0%: node sits at the ring's starting position
- Node travels along the ring proportional to load percentage
- At 100%: node completes a full revolution and flares bright (scale 1 → 2, opacity flash)

---

## 10. Exit Transition — Particle Dissolution

Triggered when progress reaches 100% and minimum time has elapsed. Total duration: 1.5 seconds. Sequenced via `gsap.timeline()`.

### Phase 1: Energy Flash (0s → 0.4s)

- Core emissive intensity spikes from 1.0 to 3.0 (bright flash)
- All orbital ring nodes flare simultaneously
- Bloom intensity temporarily increases to 2.5
- All element motion freezes for 0.15s (momentary pause before break)

### Phase 2: Shatter (0.4s → 1.0s)

- Icosahedron faces separate: each triangular face becomes independent, moving outward from center
- Face velocities: random direction, speed 2-4 units/s, with slight rotation
- Orbital rings break into segments, each segment drifts outward
- All traveling nodes scatter in random directions at higher speed (5-6 units/s)
- Neural particles reverse direction — burst outward from core
- Holographic panels drift backward and fade
- Grid ripple sends one final strong wave outward

### Phase 3: Fade (1.0s → 1.5s)

- All scattered elements fade to opacity 0
- Background color transitions from deep-black to transparent (revealing app beneath)
- Bloom fades to 0
- Canvas element fades to opacity 0

### Phase 4: Unmount (1.5s)

- CinematicSplash component unmounts from DOM
- `sessionStorage.setItem('balencia-splash-shown', 'true')` (already set at exit trigger)
- R3F canvas and all Three.js resources disposed

---

## 11. Route Loader Specification

Simplified version for `loading.tsx` (page transitions):

### Visual Elements

- **MiniCore:** 40% scale icosahedron with same wireframe material, single-axis rotation (Y only, 4s period)
- **MiniParticles:** 30 particles in close orbit (radius 1.5-2.5), no spiral-in behavior, just circular orbit
- **Single bloom:** intensity 1.0, radius 0.6 (lighter than splash)

### Progress Ring (SVG Overlay)

- Thin ring (2px stroke) around the core in HTML overlay
- Animated `stroke-dashoffset` proportional to route loading progress
- Color: core-cyan with 40% opacity

### Transitions

- **Enter:** fade in over 200ms (opacity 0 → 1)
- **Exit:** fade out over 300ms (opacity 1 → 0)
- No dissolution effect

### Size

- Centered on screen, core occupies ~120x120px area
- Canvas is full viewport but most area is transparent black

---

## 12. WebGL Fallback

Detection: check `navigator.hardwareConcurrency < 4` OR WebGL context creation fails.

**Fallback behavior:**
- Skip R3F entirely for both splash and route loader
- Render a CSS-only version using the current Framer Motion loader aesthetic but with updated sci-fi color palette (cyan/blue/violet instead of emerald/sky)
- No degraded 3D — either full experience or clean 2D fallback

---

## 13. Accessibility

| Concern | Solution |
|---------|----------|
| Reduced motion | `prefers-reduced-motion: reduce` → show static brand mark + progress bar only, no animation |
| Screen readers | Splash: `aria-hidden="true"`, `role="progressbar"`, `aria-valuenow={progress}` |
| Route loader | `aria-live="polite"` announces "Loading page" |
| Keyboard | No interactive elements in preloader, no focus trap |
| Seizure risk | No strobing — all pulses are slow (>1s cycle), brightness changes are gradual |

---

## 14. Integration Points

| Integration | Details |
|-------------|---------|
| Root layout | CinematicSplash wraps body content as fixed overlay in `layout.tsx` |
| Route loading | RouteLoader replaces `client/app/loading.tsx` |
| Session check | `sessionStorage.getItem('balencia-splash-shown')` — splash renders only if absent |
| GSAP | Uses existing `gsap-init.ts` infrastructure for dissolution timeline |
| Lenis | No conflict — splash is fixed overlay, Lenis initializes after splash unmounts (LenisProvider is page-level via MainLayout) |
| Reduced motion | Integrates with existing `use-reduced-motion-safe.ts` hook |

---

## 15. Performance Budget

| Metric | Target |
|--------|--------|
| First paint of splash | < 300ms (canvas + basic core visible) |
| Full scene render | < 800ms (all elements + post-processing active) |
| Sustained frame rate | 60fps |
| GPU memory | < 50MB |
| Bundle size (gzipped) | 60-80KB (scene components + shaders) |
| Total particle count | 300 (200 neural + 100 ambient), all instanced |
| Post-processing passes | 5 |
| Draw calls | < 20 (instanced geometry, shared materials) |

---

## 16. Animation Timing Summary

| Element | Duration/Period | Easing |
|---------|----------------|--------|
| Core Y rotation | 8s / revolution | linear |
| Core X rotation | 12s / revolution | linear |
| Core breathing | 3s / cycle | sine in-out |
| Inner ring orbit | 6s / revolution | linear |
| Middle ring orbit | 10s / revolution | linear |
| Outer ring orbit | 16s / revolution | linear |
| Camera orbit | 40s / revolution | sine (position) |
| Camera micro-zoom | every 8-10s, 1.5s in + 2s out | power2 in-out |
| Camera vertical bob | 12s / cycle | sine |
| Particle spiral-in | 2-4s per particle | linear with noise |
| Grid ripple | new wave every 3s, 2 units/s speed | ease-out |
| Panel float | 4-6s / cycle (staggered) | sine |
| Holographic panel content | static (generated once) | — |
| Exit dissolution | 1.5s total | custom timeline |
| Route loader enter | 200ms | ease-out |
| Route loader exit | 300ms | ease-in |
