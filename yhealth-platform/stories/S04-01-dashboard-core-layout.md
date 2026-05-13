---
type: story
id: YH-S04.1.1
title: Dashboard Core Layout & Three-Pillar Scores
epic: E04
epic_name: Mobile App
feature: F4.1
feature_name: Unified Dashboard
product: yhealth-platform
priority: P0
status: Draft
story_points: 5
created: 2025-12-09
---

# YH-S04.1.1: Dashboard Core Layout & Three-Pillar Scores

## User Story

**As a** Holistic Health Seeker (P1),
**I want to** see my complete health picture at a glance when I open the app,
**So that** I can quickly understand my status across fitness, nutrition, and wellbeing without navigating through multiple screens.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)
- [ ] Could Have (P2)
- [ ] Won't Have (P3)

---

## Scope Description

**User Experience:**
When the user opens the app, the dashboard displays as the home screen with a visually balanced layout showing all three pillar scores prominently. Each pillar (Fitness, Nutrition, Wellbeing) receives equal visual weight, reinforcing yHealth's holistic approach. The dashboard shell provides the foundation for all dashboard content.

**Dashboard Core Elements:**
- **Header:** App branding, current date, user greeting (time-of-day aware)
- **Three-Pillar Score Display:**
  - Fitness Score (0-100) with pillar-specific icon
  - Nutrition Score (0-100) with pillar-specific icon
  - Wellbeing Score (0-100) with pillar-specific icon
- **Score Color Coding:**
  - Green: 80-100 (Excellent)
  - Yellow: 50-79 (Needs Attention)
  - Red: 0-49 (Priority Focus)
- **Today's Summary Section:** Placeholder for key daily metrics

**Skeleton Loading:**
When data is loading, display skeleton UI elements (gray placeholder boxes) matching the layout shape. Never show a blank screen during data fetch.

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Fitness Score | Integer 0-100 | From E5 | User-only |
| Nutrition Score | Integer 0-100 | From E6 | User-only |
| Wellbeing Score | Integer 0-100 | From E7 | User-only |
| Last Updated | ISO Timestamp | Required | System |

**Behaviors:**
- Dashboard is the default landing screen after authentication
- Pillar scores update in real-time when new data syncs
- Tapping a pillar score navigates to that pillar's detail view (via F4.2 navigation)
- Score colors update immediately when threshold crossed

---

## Acceptance Criteria

```gherkin
Scenario: Dashboard Layout
  Given the user is authenticated
  When they open the app or navigate to Dashboard tab
  Then the dashboard displays with three-pillar scores prominently visible above the fold

Scenario: Score Color Coding - Excellent
  Given the dashboard is displaying pillar scores
  When a pillar score is 80-100
  Then the score displays with green color indicator

Scenario: Score Color Coding - Needs Attention
  Given a pillar score is 50-79
  When rendered on dashboard
  Then the score displays with yellow color indicator

Scenario: Score Color Coding - Priority Focus
  Given a pillar score is 0-49
  When rendered on dashboard
  Then the score displays with red color indicator

Scenario: Skeleton Loading
  Given the dashboard is fetching data
  When the API request is in progress
  Then skeleton loading placeholders display in place of content (no blank screen)

Scenario: Pillar Navigation
  Given the dashboard is displaying
  When the user taps on a pillar score
  Then the app navigates to that pillar's detail view

Scenario: Equal Visual Weight
  Given the dashboard layout
  When all three pillars are displayed
  Then each pillar occupies equal visual space and prominence
```

---

## Success Metrics

- Dashboard renders within 3 seconds on average network
- 90% of active users open dashboard daily
- Pillar score tap-through rate >40%

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s load time | Auth required | Scores user-only | WCAG 2.1 AA colors | iOS 14+, Android 10+ |
| Skeleton <500ms | Token validation | No PII in cache key | Min 4.5:1 contrast | Portrait + Landscape |

---

## Dependencies

- **Prerequisite Stories:** YH-S04.2.1 (Navigation must exist for pillar drill-down)
- **Related Stories:** YH-S04.1.2, YH-S04.1.3
- **External Dependencies:** E5, E6, E7 (Pillar score calculations)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Dashboard load failure (API timeout) | Show cached dashboard with timestamp: "Showing data from [time]. Pull to refresh when online." |
| Partial data load (some pillars unavailable) | Display available data, show placeholder with message for missing: "Fitness data syncing..." |
| No data yet (new user Day 1) | Welcome message with onboarding prompts: "Welcome! Start by connecting a wearable or logging your first meal." |
| Stale cached data (>24h old) | Visual indicator badge: "Data from yesterday. Connect to update." |

---

## Open Questions

- Should pillar scores animate on value change?
- Should score history be accessible via long-press on score?

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Error scenarios handled per PRD
- [ ] Accessibility requirements verified (contrast, screen reader labels)
- [ ] Performance requirements verified (<3s load)
- [ ] Cross-platform parity (iOS + Android)

---

*Story YH-S04.1.1 | Epic E04 | Product: yhealth-platform*
