---
type: story
id: YH-S04.4.2
title: Notification Types & Delivery
epic: E04
epic_name: Mobile App
feature: F4.4
feature_name: Push Notifications
product: yhealth-platform
priority: P0
status: Draft
story_points: 5
created: 2025-12-09
---

# YH-S04.4.2: Notification Types & Delivery

## User Story

**As a** Habit Formation Seeker (P4),
**I want to** receive different types of notifications (reminders, insights, celebrations),
**So that** I can stay engaged with my health goals through relevant, timely prompts.

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
Users receive personalized notifications based on their health data, goals, and activity patterns. Each notification type serves a specific purpose in the engagement journey.

**7 Notification Types:**

| Type | Example | Trigger | Deep Link |
|------|---------|---------|-----------|
| **Check-in Reminder** | "Good morning! How are you feeling today?" | Daily at user's preferred time | Mood check-in screen |
| **Featured Insight** | "New insight: Your best workouts happen after 7+ hours sleep." | New insight generated (E8) | Insight detail view |
| **Goal Milestone** | "Congrats! 7-day logging streak achieved!" | Milestone reached | Achievement screen |
| **Recovery Alert** | "Low recovery today. Consider light activity." | Recovery <50 (morning) | Recovery detail |
| **Workout Reminder** | "Time for your workout? Here's today's recommendation." | User's typical workout time | Workout recommendations |
| **Meal Logging Prompt** | "Don't forget to log dinner!" | No meal logged by 7pm | Meal logging |
| **Coaching Nudge** | "Haven't chatted in a while. I'm here if you need support!" | 3+ days inactive | Voice coaching or chat |

**Rich Notifications:**
- Include images where relevant (e.g., achievement badge)
- Action buttons: "Log Now", "View Insight", "Snooze"
- Expandable content for longer messages

**Deep Linking:**
- Each notification links to relevant app screen
- Handle deep link if app is open or closed
- Track notification tap-through

**Notification History:**
- View last 30 days of notifications in Profile > Notifications
- Mark as read/unread
- Clear history option

**Behaviors:**
- Notifications personalized with user's name
- Deep links open correct screen in all app states
- History persists across sessions

---

## Acceptance Criteria

```gherkin
Scenario: Check-in Reminder
  Given the user has check-in reminders enabled
  When the user's preferred time arrives
  Then a "Check-in Reminder" notification is sent

Scenario: Insight Notification
  Given a new insight is generated (E8)
  When the insight is actionable
  Then a "Featured Insight" notification is sent with the insight summary

Scenario: Goal Milestone
  Given the user achieves a milestone (e.g., 7-day streak)
  When the milestone is recorded
  Then a "Goal Milestone" celebration notification is sent immediately

Scenario: Rich Notifications
  Given a notification is sent
  When it supports rich content
  Then images and action buttons are included

Scenario: Deep Linking
  Given the user taps a notification
  When the app opens
  Then the user is navigated to the relevant screen (per notification type)

Scenario: Notification History
  Given the user navigates to Profile > Notifications
  When the notification history screen loads
  Then the last 30 days of notifications are displayed

Scenario: Action Buttons
  Given a notification with action buttons
  When the user taps an action button (e.g., "Log Now")
  Then the corresponding action is triggered (e.g., open meal logging)
```

---

## Success Metrics

- 40% average notification open rate
- 70% increase in check-in consistency (vs no notifications)
- <10% users disable all notifications

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Delivery <5s | Notification auth | No PII in payload | Screen reader announces | iOS + Android |
| Deep link <1s | Signed payloads | User name optional | Action button labels | Rich notifications |

---

## Dependencies

- **Prerequisite Stories:** YH-S04.4.1 (Infrastructure)
- **Related Stories:** YH-S04.4.3, YH-S04.2.2 (Deep linking)
- **External Dependencies:** E5, E6, E7 (Data triggers), E8 (Insights)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Deep link to deleted content | Navigate to Dashboard with toast |
| Notification for unlinked feature | Don't send, or show feature preview |
| Multiple notifications queued | Deliver in priority order, not all at once |
| App uninstalled then reinstalled | Clear history, re-register token |

---

## Open Questions

- Should notifications include user's name?
- Should notification history sync across devices?

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] All 7 notification types implemented
- [ ] Rich notifications with images and buttons
- [ ] Deep linking working for all types
- [ ] Notification history screen complete

---

*Story YH-S04.4.2 | Epic E04 | Product: yhealth-platform*
