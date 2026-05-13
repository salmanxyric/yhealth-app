---
type: story
id: S04.1.2
title: Dashboard Insights & Quick Actions
epic: E04
feature: F4.1
product: yhealth-platform
priority: P0
status: Draft
---

# S04.1.2: Dashboard Insights & Quick Actions

## User Story
**As a** Holistic Health Seeker (P1),
**I want to** see actionable insights and have one-tap access to common actions,
**So that** I can understand what to focus on and quickly log data without navigating through menus.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
Below the pillar scores, the dashboard displays insight cards and quick action buttons. Insights are AI-prioritized to show the most actionable information first. Quick actions enable common tasks with a single tap.

**Featured Insight Cards:**
- **Light Mode:** 1 featured insight card (most actionable)
- **Deep Mode:** 3-5 insight cards with rotation
- Card content: Title, brief description, CTA button
- AI priority algorithm determines card ordering (most relevant/actionable first)
- Cards link to relevant detail views or actions

**Quick Action Buttons:**
- Log Meal → Opens meal logging (E6)
- Log Mood → Opens mood check-in (E7)
- Start Voice Coaching → Initiates voice session (E2)
- View Full Insights → Navigates to Insights tab (E10)
- Log Workout → Opens workout logging (E5)

**Pull-to-Refresh:**
- Swipe down gesture triggers data refresh
- Loading indicator during refresh
- Content updates upon completion

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Insight ID | UUID | From E8 | System |
| Insight Priority | Integer 1-5 | Required | System |
| Quick Action Taps | Event log | Analytics | Aggregated |

**Behaviors:**
- Insight cards rotate based on AI priority (E8 Cross-Domain Intelligence)
- Quick action buttons remain fixed for consistent access
- Pull-to-refresh triggers full dashboard data reload
- Insight engagement tracked for personalization

## Acceptance Criteria

**AC1: Insight Card Display**
Given the dashboard is loaded,
When insights are available from E8,
Then the dashboard displays featured insight card(s) based on mode (1 for Light, 3-5 for Deep).

**AC2: AI Priority Ordering**
Given multiple insights are available,
When the dashboard renders insight cards,
Then insights display in priority order (most actionable first per AI algorithm).

**AC3: Quick Action Buttons**
Given the dashboard is displayed,
When the user views the quick actions area,
Then 5 quick action buttons are visible: Log Meal, Log Mood, Start Voice Coaching, View Full Insights, Log Workout.

**AC4: Quick Action Navigation**
Given a quick action button is displayed,
When the user taps "Log Meal",
Then the app opens the meal logging interface.

Given a quick action button is displayed,
When the user taps "Start Voice Coaching",
Then the app initiates a voice coaching session (E2).

**AC5: Pull-to-Refresh**
Given the dashboard is displayed,
When the user performs pull-down gesture,
Then the dashboard data refreshes and loading indicator displays during fetch.

**AC6: Insight Click-Through**
Given an insight card is displayed,
When the user taps the insight card,
Then the app navigates to the relevant detail view or action.

## Success Metrics
- 70% of users use quick actions 3+ times/week
- 60% click-through rate on dashboard insights
- Pull-to-refresh used by 80% of daily active users

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Card render <500ms | Insight source validated | No PII in insights | Cards have alt text | iOS + Android |
| Touch response <100ms | Action auth check | Analytics anonymized | 44x44pt touch targets | All screen sizes |

## Dependencies
- **Prerequisite Stories:** S04.1.1 (Dashboard core layout)
- **Related Stories:** S04.1.3, S04.2.1
- **External Dependencies:** E2 (Voice), E5-E7 (Pillars), E8 (Cross-Domain AI), E10 (Analytics)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No insights available (new user) | Display welcome card: "Keep logging to unlock personalized insights!" |
| Insight load failure | Show cached insights with timestamp or generic tips |
| Quick action target unavailable | Show toast: "[Feature] is currently unavailable. Try again later." |
| Pull-to-refresh with no network | Show offline indicator and cached data timestamp |

## Open Questions
- Should quick actions be customizable by user?
- How many insight cards maximum before scrolling required?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] Error scenarios handled
- [ ] Quick actions functional for all 5 types
- [ ] Pull-to-refresh works reliably
- [ ] Insight engagement tracking implemented
