---
type: story
id: YH-S04.1.3
title: Dashboard Adaptation & Personalization
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

# YH-S04.1.3: Dashboard Adaptation & Personalization

## User Story

**As a** Busy Professional (P2),
**I want to** have my dashboard adapt to my preferences and time of day,
**So that** I see the most relevant information without configuring everything manually.

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
The dashboard automatically adapts based on user's Light/Deep mode preference (set during onboarding E1) and time of day. This creates a personalized experience without requiring manual configuration.

**Light/Deep Mode Rendering:**

| Element | Light Mode | Deep Mode |
|---------|------------|-----------|
| Pillar Scores | Large, prominent display | Large with 7-day trend sparklines |
| Today's Summary | Steps, meals logged, mood rating | + Active minutes, sleep, energy, calories |
| Insight Cards | 1 featured card | 3-5 cards with full descriptions |
| Quick Actions | 5 primary buttons | 5 buttons + secondary actions |
| Scrolling | Essential info above fold | Full scrollable feed |

**Time-of-Day Personalization:**
- **Morning (5am-12pm):** Recovery focus - sleep summary, recovery score, breakfast prompt
- **Afternoon (12pm-6pm):** Activity focus - step count, lunch logging, energy check
- **Evening (6pm-10pm):** Day summary - achievements, dinner log, mood reflection
- **Night (10pm-5am):** Rest focus - minimal content, sleep preparation tips

**Dashboard Caching:**
- Cache dashboard data locally for 7 days
- Display cached data immediately on app open
- Background refresh for fresh data
- Cache invalidation on significant data changes

**Behaviors:**
- Mode preference persists across sessions
- Time-of-day content rotates automatically
- Cached data serves immediately, fresh data loads in background
- Smooth transitions between content states

---

## Acceptance Criteria

```gherkin
Scenario: Light Mode Rendering
  Given the user has selected Light mode preference
  When the dashboard loads
  Then the dashboard displays simplified view: 3 pillar scores, 1 insight card, essential summary above fold

Scenario: Deep Mode Rendering
  Given the user has selected Deep mode preference
  When the dashboard loads
  Then the dashboard displays comprehensive view: scores with sparklines, 3-5 insights, detailed summary, scrollable feed

Scenario: Time-of-Day Morning
  Given the current time is between 5am-12pm
  When the dashboard loads
  Then the dashboard emphasizes recovery content: sleep summary, recovery score, breakfast prompt

Scenario: Time-of-Day Evening
  Given the current time is between 6pm-10pm
  When the dashboard loads
  Then the dashboard emphasizes day summary: achievements, dinner logging, mood reflection

Scenario: Dashboard Caching
  Given the user has previously loaded the dashboard
  When the app opens with cached data available
  Then cached dashboard displays immediately (<1 second) while fresh data loads in background

Scenario: Cache Freshness
  Given cached data is >24 hours old
  When the dashboard displays
  Then a visual indicator shows data age: "Last updated [time]"
```

---

## Success Metrics

- 70% of Light mode users complete check-ins in <2 minutes
- 60% of Deep mode users engage with 3+ features per session
- Cached dashboard loads in <1 second

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Cached load <1s | Cache encrypted | Mode preference user-only | Mode switch announced | All timezones |
| Background refresh | Secure storage | Time detection local | No flashing content | iOS + Android |

---

## Dependencies

- **Prerequisite Stories:** YH-S04.1.1, YH-S04.1.2
- **Related Stories:** YH-S04.5.1 (Offline caching infrastructure)
- **External Dependencies:** E1 (Onboarding mode selection)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Mode preference not set | Default to Light mode, prompt to set preference |
| Timezone change | Recalculate time-of-day content immediately |
| Cache corrupted | Clear cache, fetch fresh data, show loading state |
| Background refresh fails | Keep cached data, retry on next app foreground |

---

## Open Questions

- Should users be able to override time-of-day content?
- Should Deep mode include dashboard widget customization?

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Light/Deep mode rendering correct
- [ ] Time-of-day personalization working
- [ ] Dashboard caching functional (7 days)
- [ ] Background refresh implemented

---

*Story YH-S04.1.3 | Epic E04 | Product: yhealth-platform*
