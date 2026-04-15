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
- [ ] In DevTools -> Rendering, emulate `prefers-reduced-motion: reduce`.
- [ ] Reload. Hero shows full text + CTAs immediately without the scrub fade on scroll (scene uses the "jump to end state" code path).

## Mobile
- [ ] DevTools -> toggle device toolbar -> iPhone 12 Pro width (390px).
- [ ] Hero text readable; CTAs full-width stacked; orb placeholder visible.
- [ ] No horizontal scrollbar on the page.
- [ ] Placeholder scenes each a full-viewport height.

## Archive verification
- [ ] `ls client/components/landing/_archive/` shows the archived section files + README.
- [ ] None of those files are imported anywhere in `client/app/`.

## Build
- [ ] `cd client && npm run build` — either succeeds, or fails only on WIP elsewhere unrelated to the cinematic rebuild. Record any unrelated failures.

## COPY-REVIEW grep
- [ ] `grep -c COPY-REVIEW client/data/siteContent.ts` — expect ~30+ matches. These are the strings marketing should review.
