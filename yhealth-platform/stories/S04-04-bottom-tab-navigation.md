---
type: story
id: YH-S04.2.1
title: Bottom Tab Navigation & Pillar Access
epic: E04
epic_name: Mobile App
feature: F4.2
feature_name: Navigation & Information Architecture
product: yhealth-platform
priority: P0
status: Draft
story_points: 5
created: 2025-12-09
---

# YH-S04.2.1: Bottom Tab Navigation & Pillar Access

## User Story

**As a** Busy Professional (P2),
**I want to** quickly navigate between fitness tracking, meal logging, and mood check-ins,
**So that** I can complete my health tasks efficiently during short breaks.

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
The app uses a persistent bottom tab bar (standard iOS/Android pattern) for primary navigation. The tab bar is optimized for one-handed thumb usage and provides consistent access to all major app sections.

**Bottom Tab Bar (4 Tabs):**
1. **Dashboard** (Home icon) - Unified dashboard view (F4.1)
2. **Pillars** (Layers icon) - Access to Fitness, Nutrition, Wellbeing detail views
3. **Insights** (Lightbulb icon) - Analytics dashboard (E10)
4. **Profile** (Person icon) - Settings, account, connected devices

**Pillars Sub-Navigation:**
When user taps Pillars tab, secondary navigation displays:
- **Fitness** (Activity icon) - Activity, sleep, recovery, workouts (E5)
- **Nutrition** (Food icon) - Meals, calories, hydration (E6)
- **Wellbeing** (Heart icon) - Mood, journaling, habits (E7)

**Tab Badges:**
- Unread insights count on Insights tab
- Notification count (if applicable)
- Visual indicator for pending actions

**Touch Targets:**
All interactive elements meet minimum 44x44pt touch target for accessibility.

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Tab Tap Events | Event log | Analytics | Aggregated |
| Current Tab State | String | Required | Session |

**Behaviors:**
- Tab bar persists across all screens (except full-screen modals)
- Active tab visually highlighted
- Tab badges update in real-time
- Pillars sub-nav appears on Pillars tab selection

---

## Acceptance Criteria

```gherkin
Scenario: Four Tab Display
  Given the app is loaded
  When the main interface displays
  Then a bottom tab bar with 4 tabs is visible: Dashboard, Pillars, Insights, Profile

Scenario: Tab Navigation
  Given the bottom tab bar is displayed
  When the user taps on a tab
  Then the app navigates to that section's primary view

Scenario: Pillars Sub-Navigation
  Given the user is on the Pillars tab
  When they view the Pillars section
  Then secondary navigation displays with Fitness, Nutrition, Wellbeing options

Scenario: Tab Badges
  Given unread insights exist
  When the Insights tab is displayed
  Then a badge shows the unread count

Scenario: Touch Target Size
  Given all interactive tab elements
  When measured
  Then each touch target is at least 44x44pt

Scenario: Active Tab Indicator
  Given the user is on a specific tab
  When viewing the tab bar
  Then the active tab is visually highlighted (distinct from inactive tabs)
```

---

## Success Metrics

- 90% of actions accessible within 3 taps
- 70% of users use 3+ tabs weekly
- One-handed usability score 4.5/5

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Tab switch <200ms | Nav state secured | Tab usage aggregated | 44x44pt targets | iOS + Android |
| Persist across screens | Auth check on Profile | No PII in events | Screen reader labels | All devices |

---

## Dependencies

- **Prerequisite Stories:** None (foundation story)
- **Related Stories:** YH-S04.2.2, YH-S04.1.1
- **External Dependencies:** E5, E6, E7 (Pillar detail screens)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Navigation state loss (crash recovery) | Restore last screen or default to Dashboard |
| Feature access restriction (free tier) | Show upgrade prompt: "This feature requires Premium. Upgrade to access." |
| Offline tab navigation | Allow offline-capable screens, block sync-required with message |

---

## Open Questions

- Should tab order be customizable?
- Should Pillars use dropdown vs dedicated screen?

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Four tabs functional
- [ ] Pillars sub-navigation working
- [ ] Tab badges updating
- [ ] Touch targets verified (44x44pt)
- [ ] Screen reader labels implemented

---

*Story YH-S04.2.1 | Epic E04 | Product: yhealth-platform*
