# Life Areas Phase 1 — Manual QA Checklist

Run this checklist against a local dev environment (server + client both running).

## Setup
- [ ] `cd server && npm run dev` — server up on port 5000
- [ ] `cd client && npm run dev` — client up on port 3000
- [ ] Apply DB tables if not already applied: `psql "$DATABASE_URL" -f server/src/database/tables/116-life-areas.sql` and `117-life-area-links.sql`
- [ ] Sign in as a test user

## `/life-areas` hub
- [ ] Navigate to `http://localhost:3000/life-areas`. Empty state appears ("Start your first area").
- [ ] Click "New Area". Modal opens with 8 domain cards (Career, Relationships, Creativity, Spirituality, Finance, Fitness, Learning, Custom).
- [ ] Click **Career**. Name prefills to "Career".
- [ ] Change name to "Job Hunt 2026". Click "Create area". Modal closes, card appears on grid with flagship badge.
- [ ] Click the card. Detail drawer slides in from the right. Name editor shows "Job Hunt 2026"; linked items section says "No goals, schedules, or contracts linked yet."
- [ ] Edit name → close drawer → card updates.
- [ ] Re-open drawer, click "Archive this area". Card disappears from grid.

## AI Coach routing chip
- [ ] Navigate to `/ai-coach`. Send: "I've been lazy about applying to jobs".
- [ ] Coach replies. Under the assistant bubble, a chip appears: "Added to Career · Change".
- [ ] Click the chip's "Career" link → navigates to `/life-areas`. The new auto-created Career area is visible.
- [ ] Click "Change" in the chip → dropdown shows alternative domains. Click any → page navigates to `/life-areas` (Phase 1 reroute is a navigation; full reroute endpoint is Phase 2).

## DB sanity
- [ ] `psql "$DATABASE_URL" -c "SELECT slug, display_name, domain_type, status FROM life_areas ORDER BY created_at DESC LIMIT 5"` shows the areas you created plus any auto-created ones.
- [ ] `SELECT * FROM life_area_links` — empty for Phase 1 (linking UI is Phase 2).

## Regression
- [ ] Normal coach messages without self-improvement intent ("what's the weather?") → reply works, NO routing chip appears.
- [ ] Sidebar shows "Life Areas" nav item; clicking it highlights.
