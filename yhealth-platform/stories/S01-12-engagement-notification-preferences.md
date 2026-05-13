---
type: story
id: S01.5.1
title: Engagement & Notification Preferences
epic: E01
epic_name: Onboarding & Assessment
feature: F1.5
feature_name: Preference Configuration
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.5.1: Engagement & Notification Preferences

## User Story

**As a** new yHealth user completing onboarding,
**I want to** set my preferred engagement depth and notification preferences,
**So that** yHealth fits my lifestyle without overwhelming me.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)

---

## Scope Description

**User Experience:**
- Set default engagement mode (Light/Deep/Adaptive)
- Configure notification types and timing
- Set quiet hours for uninterrupted time
- Smart defaults available if user wants to skip
- All preferences editable anytime from settings

**Engagement Mode Selection:**
```
How do you prefer to interact with yHealth?

○ Light Mode (Quick & Efficient)
  ✓ 30-second check-ins
  ✓ Emoji mood logging
  ✓ Brief insights (key highlights)
  ✓ Short coaching calls (5 min)

○ Deep Mode (Detailed & Comprehensive)
  ✓ 5-10 min journaling
  ✓ Detailed mood logging
  ✓ In-depth insights (full analysis)
  ✓ Extended coaching calls (20-30 min)

○ Adaptive (AI Learns Your Preference)
  ✓ Start with Light, AI suggests Deep when you have time
  ✓ Automatically adjusts based on engagement patterns

💡 You can switch modes anytime per interaction.
```

**Notification Preferences:**
```
DAILY REMINDERS:
☑ Morning check-in (7:00 AM) [Edit Time]
☑ Evening reflection (9:00 PM) [Edit Time]
☐ Meal logging reminders
☐ Hydration reminders (every 2 hours)

COACHING NUDGES:
☑ Motivational messages (2-3x/day)
☑ Habit streak celebrations
☐ Weekly progress summaries

INSIGHTS & ALERTS:
☑ New personalized insights
☑ Pattern alerts (important changes)
☑ Goal progress updates (weekly)
```

**Quiet Hours:**
```
SLEEP HOURS:
From: 10:00 PM  To: 7:00 AM  [Every day]
☑ No notifications during sleep hours

WORK/FOCUS HOURS (Optional):
From: 9:00 AM  To: 12:00 PM  [Weekdays]
☐ Silence non-urgent notifications

EXCEPTIONS:
☐ Critical health alerts can override
☐ Scheduled coaching calls can override
☑ Nothing (strict quiet hours)
```

**Smart Defaults (If Skipped):**
- Engagement Mode: Light
- Notifications: Morning (8 AM) + Evening (9 PM) only
- Quiet Hours: 10 PM - 7 AM
- Frequency: Moderate (3-5/day)

---

## Acceptance Criteria

```gherkin
Scenario: Engagement mode selection
  Given user reaches preference configuration
  When they select engagement mode
  Then the mode is applied to all future interactions

Scenario: Notification configuration
  Given user configures notification preferences
  When they toggle options and set times
  Then preferences are saved and respected

Scenario: Quiet hours
  Given user sets quiet hours
  When those hours are active
  Then no notifications are delivered (99.9% compliance)

Scenario: Smart defaults
  Given user skips preference setup
  When they proceed
  Then smart defaults are applied and noted

Scenario: Future editing
  Given preferences are saved
  When user accesses settings later
  Then they can modify all preferences
```

---

## Success Metrics

- Preference Setup Completion: 85%+
- Customization Rate: 40%+ customize beyond defaults
- Notification Opt-Out: <10% disable all notifications
- Quiet Hours Compliance: 99.9%

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s save | - | Preferences private | Time picker accessible | All devices |
| - | - | - | Clear toggle states | |

---

## Dependencies

- **Prerequisite Stories:** S01.4.3 (integrations syncing)
- **Related Stories:** S01.5.2, S01.6.1
- **External Dependencies:** Push notification service, scheduling system

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Overlapping quiet hours | Auto-merge or prompt clarification |
| All hours blocked | Prevent save, require 2-hour window minimum |
| DND integration permission denied | Fallback to manual quiet hours |
| Timezone change detected | Prompt to update notification times |

---

## Open Questions

- DND integration depth (respect device DND?)

---

## Definition of Done

- [ ] Engagement mode selection working
- [ ] Notification type toggles functional
- [ ] Notification time pickers working
- [ ] Quiet hours configuration working
- [ ] Smart defaults applied when skipped
- [ ] 99.9% quiet hours compliance
- [ ] Preferences editable from settings

---

*Story S01.5.1 | Epic E01 | Product: yHealth Platform*
