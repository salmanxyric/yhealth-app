# Cinematic Landing Phase 2.A — Final Code Review

**Date:** 2026-04-15
**Reviewer:** Senior Code Reviewer (Claude)
**Range:** `51391ef..HEAD` (14 commits)
**Spec:** `docs/superpowers/specs/2026-04-15-cinematic-landing-page-design.md`
**Plan:** `docs/superpowers/plans/2026-04-15-cinematic-landing-phase2a.md`

---

## Verdict

**APPROVED_WITH_FOLLOW_UPS**

Phase 2.A delivers everything it promised. The shell infrastructure is well-typed, the archive move is clean, and Scene 1 is a coherent, accessible, performant hero. One Medium-priority concern around hook dependency stability deserves attention before Phase 2.B scales the pattern across 8 more scenes; otherwise the work is ready to merge and build on.

---

## Plan Coverage

| Promise | Status | Evidence |
|---|---|---|
| Archive 14 (actually 21) section components into `_archive/` | Done | `f6abf7a` git-mv 21 files; `index.ts` cleaned |
| Archive README with restoration map | Done | `3d31a27` `client/components/landing/_archive/README.md` |
| `tsconfig` excludes `_archive/**` | Done | `0f1bb2f` one-line `exclude` extension |
| Holding page recovery commit (build green) | Done | `fd385a3` minimal page; named imports verified |
| `siteContent.ts` with COPY-REVIEW tags | Done | `905aed4` 30+ tagged strings; Scene 6 keys match server `life-area-domains.ts` |
| `Scene3D` swap component (placeholder + Spline hook) | Done | `2df47f7` 3 placeholder kinds; `splineUrl` fall-through documented |
| `SceneSkeleton` SSR-safe fallback | Done | `e8cbd2d` |
| `useSceneTimeline` hook | Done | `9868424` GSAP context cleanup; mobile/reduced-motion handled |
| `SceneShell` wrapper | Done | `8865704` semantic `<section aria-label>` |
| `_shell` barrel | Done | `7a3eaa8` re-exports types and components |
| Scene 1 Hero full implementation | Done | `9174d45` 120 lines, scrub fade/blur + mouse parallax |
| `page.tsx` rebuilt with hero + 8 lazy stubs + Pricing/FAQ | Done | `2c15138` named imports correct |
| Manual QA doc | Done | `e435899` |
| `PROGRESS-DEV` milestone entry | Done | `3f30289` |

All Phase 2.A acceptance criteria are met. Scenes 2-9 explicitly render via `SceneSkeleton` with labels (not implemented stubs), as scoped.

---

## Findings by Severity

### Blocker
*None.*

### High
*None.*

### Medium

**M1 — `useSceneTimeline` deps include unstable `config.build` / `config.onUpdate` callbacks**
*File:* `client/app/scenes/_shell/useSceneTimeline.ts:74`

The `useEffect` deps array lists `config.build` and `config.onUpdate`. In `Scene01_Hero.tsx:25`, the `build` arrow is created inline on every render. Today this is harmless because Scene 1's parent (`page.tsx`) is a Server Component that renders once, so `Scene01_Hero` won't re-render and the effect won't re-fire. But the moment any scene wires a state-driven prop or context value upstream, every render will tear down and rebuild the GSAP timeline (and ScrollTrigger), which is expensive and visually janky.

*Recommendation for Phase 2.B:* either (a) document a convention that scene `build`/`onUpdate` must be `useCallback`-wrapped at call sites, or (b) stash the latest callbacks in a ref inside the hook and drop them from the deps array. Option (b) is the lower-friction path for the 8 upcoming scenes.

**M2 — `Scene3D` `splineUrl` branch is dead code today**
*File:* `client/app/scenes/_shell/Scene3D.tsx:18-24`

The `if (splineUrl) { ... }` block is an empty intent-marker. ESLint with `no-empty` or strict rules may flag this. The comment is useful context, but the empty branch should either be a `// TODO` comment outside any control flow, or the branch should `return` a `<Suspense>`/lazy wrapper stub. Cosmetic, but easy to clean up.

### Low

**L1 — `page.tsx` `dynamic()` wrapping inline `Promise.resolve` for skeletons adds no value**
*File:* `client/app/page.tsx:14-21`

Each placeholder is `dynamic(() => Promise.resolve({ default: () => <SceneSkeleton .../> }))`. Since the body is synchronous and the skeleton ships in the main bundle anyway (it's imported at the top), there's no code-split benefit here — only loading-state overhead and slightly worse hydration cost. The shape will pay off in Phase 2.B when each scene becomes its own chunk (`dynamic(() => import('@/app/scenes/Scene02_ProblemSolution'))`); for Phase 2.A, plain `<SceneSkeleton label="..."/>` JSX would be equivalent and lighter. Acceptable as-is for symmetry with future phases.

**L2 — Scroll cue inside `hero-text` will fade with the scrub timeline**
*File:* `client/app/scenes/Scene01_Hero.tsx:108-115`

The "Scroll" cue is nested inside `.hero-text`, which the GSAP timeline animates to `opacity: 0.1, y: -80`. The cue inherits the parent transform, so it scrolls up and fades out together with the headline. Visually this is fine on first paint, but the cue's own framer-motion fade-in (`delay: 1.1`) competes with the parent's scrub. Consider hoisting the cue out of `.hero-text` so it can fade independently or persist briefly. Pure polish — flag for Phase 2.D.

**L3 — `useIsMobile` returns `{ isMobile: false }` on first paint**
*File:* `client/hooks/use-is-mobile.ts:13-17`

Pre-existing hook, not introduced by this phase, but worth noting: the initial state is always desktop, so SSR + first client render gates `pin: !isMobile && !!config.pin` to `pin: true` for one frame on mobile before the effect corrects it. ScrollTrigger's `invalidateOnRefresh: true` should self-heal, but Phase 2.B scenes that rely on pinning need to verify no flash on real devices. Carry-over to mobile QA.

**L4 — `Scene3D` `motion.div` with `animate={{ rotate: 360 }}` ignores reduced-motion**
*File:* `client/app/scenes/_shell/Scene3D.tsx:42-52`

The 48s rotation of the conic-gradient ring runs unconditionally. Users with `prefers-reduced-motion: reduce` will still see continuous rotation. Wrap with `useReducedMotionSafe()` or use framer-motion's `useReducedMotion()` and short-circuit the `animate` prop. Low because rotation is slow and ambient, but technically an a11y miss.

---

## Accessibility Notes

- `SceneShell` correctly emits `<section role="region">` semantics via `<section aria-label="…">`. Scene 1 uses `ariaLabel="Hero"` — fine but consider a more descriptive label (`"yHealth hero"`) for screen-reader users navigating by landmark.
- `Scene3D` placeholders are `aria-hidden="true"` everywhere — correct, decorative content.
- `<h1>` is the headline and there's exactly one `<h1>` per page — good.
- CTAs use `<Link>` with visible text; never hidden behind `opacity: 0` on initial render (motion `initial.opacity: 0` then `animate.opacity: 1` runs immediately, not scroll-gated).
- `SceneSkeleton` is `aria-hidden="true"` — correct for a loading/placeholder block.
- **Gap (L4 above):** continuous rotation in `HealthCorePlaceholder` doesn't honor reduced-motion.
- The animated `Scroll` cue (line 112) has no semantic role — fine since it's decorative, but if it later becomes interactive, add `aria-hidden`.

---

## Performance Notes

- Hero loads synchronously (good for LCP); scene 2-9 placeholders use `dynamic()` (currently no benefit — see L1, but the pattern is in place for Phase 2.B chunks).
- All scrub animations target `transform`, `opacity`, `filter` — composited properties only. Good.
- `will-change: transform` set on the parallax wrapper (`Scene01_Hero.tsx:52`) — appropriate for the actively-transformed element. Not over-applied.
- Lenis + `gsap.ticker` integration is centralized (per memory note); this phase doesn't touch that infra.
- `gsap.context().revert()` cleanup on unmount is correctly wired (`useSceneTimeline.ts:73`), so HMR / route changes won't leak ScrollTriggers.
- `invalidateOnRefresh: true` plus `anticipatePin: 1` on the trigger — sound defaults.
- One concern for Phase 2.B: with `pin: true` enabled across 4-5 scenes, ScrollTrigger pin-spacer DOM growth will roughly double the page height. Plan for `pinSpacing: false` or sequential (non-overlapping) pins.

---

## Carry-overs for Phase 2.B / 2.C / 2.D

**Phase 2.B (Scenes 2-5):**
- Implement `Scene02_ProblemSolution`, `Scene03_AIDashboard`, `Scene04_DeviceShowcase`, `Scene05_FeatureGrid`.
- Replace `Promise.resolve` `dynamic()` stubs in `page.tsx` with real `import()` chunks.
- Address M1 (callback dep stability) before scaling — refactor `useSceneTimeline` to ref-stash callbacks, or document the `useCallback` convention.
- Verify `pin: true` interaction across consecutive scenes (pin-spacing strategy).

**Phase 2.C (Scenes 6-9):**
- Scene 6 `LifeAreasCarousel` consumes `site.lifeAreasCarousel.domains[].type` — keys already match `server/src/config/life-area-domains.ts`. Re-verify before wiring.
- Scenes 7-9 (DataFlow, Testimonials, Final CTA).
- Clean up L2 (scroll cue lifecycle in Scene 1) if it becomes a noticeable artifact.

**Phase 2.D (Polish + Audit):**
- Footer / Pricing / FAQ dark-tokens pass.
- Lighthouse + axe full sweep.
- Drop in real Spline scene URLs via `siteContent.ts` (zero code change in `Scene3D`).
- Address L4 (reduced-motion respect for ambient rotation in `HealthCorePlaceholder`).
- Marketing pass on every `// COPY-REVIEW` and `// TODO-REAL` string in `siteContent.ts`.
- Replace `Scene3D.tsx:18-24` empty `if` block (M2) with either real Spline lazy-load or remove the dead branch.

---

## Commit Hygiene Assessment

**Excellent.** 14 commits, each focused on one logical change:

1. `3d31a27` README only.
2. `f6abf7a` 21 git-mv operations + barrel export cleanup, no other edits.
3. `fd385a3` holding page only — keeps build green between archive and shell.
4. `0f1bb2f` truly one-line tsconfig change.
5-9. Each new shell file in its own commit.
10. `9174d45` Scene 1 in isolation.
11. `2c15138` page rebuild after all dependencies exist.
12-14. Docs / QA / progress.

Commit message style is consistent (`feat(scenes):`, `chore(landing):`, `docs:`). Working-tree noise (the long list of unrelated `M client/...` files in `git status`) was correctly kept out of every commit in this range. The archive move is a pure rename (`f6abf7a` shows `0` line changes for the moved files). Tsconfig exclude is the minimal one-line addition promised. Nothing to flag.

---

## Summary

Phase 2.A is a clean, well-scoped foundation. Verdict: **APPROVED_WITH_FOLLOW_UPS** — the only blocker-adjacent concern (M1: hook dep stability) is forward-looking and inexpensive to address before Phase 2.B starts producing real scenes.
