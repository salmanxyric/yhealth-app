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
