---
type: story
id: S03.5.2
title: Nudge Timing & Quiet Hours
epic: E03
epic_name: WhatsApp Integration
feature: F3.5
feature_name: Proactive Engagement
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.5.2: Nudge Timing & Quiet Hours

## User Story

**As a** Busy Professional (P2),
**I want** my AI coach to respect my schedule and only message during appropriate times,
**So that** I'm not disturbed during sleep, work, or focus time.

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
- Quiet hours strictly enforced (no messages during sleep/focus time)
- Smart timing learns user's active patterns
- Messages spaced appropriately (no clustering)
- User can snooze nudges temporarily

**Quiet Hours Configuration:**
- Default: 10pm - 8am (local time)
- User-configurable start and end times
- Timezone-aware (uses device timezone)
- Hard stop: Zero messages during quiet hours (99.9% compliance)

**Smart Timing Intelligence:**
- Learn when user typically responds
- Schedule nudges during high-engagement windows
- Avoid clustering (minimum 2 hours between nudges)
- Weekend vs weekday pattern detection

**Snooze Functionality:**
- "Remind me later" → 4-hour snooze
- "Not now" → Skip this nudge today
- "Too busy today" → Silence until tomorrow morning

**Timing Rules:**
| Rule | Implementation |
|------|----------------|
| Quiet Hours | No messages 10pm-8am (or custom) |
| Spacing | Minimum 2 hours between nudges |
| Morning Window | Primary check-in: user's wake time |
| Evening Window | Reflection: 1 hour before bedtime |
| Activity-Based | Post-workout, post-meal timing |

---

## Acceptance Criteria

```gherkin
Scenario: Quiet hours enforcement
  Given quiet hours are 10pm-8am
  When a nudge is scheduled for 11pm
  Then it is queued for 8am the next day

Scenario: Custom quiet hours
  Given user sets custom quiet hours
  When configuration is saved
  Then new hours are respected immediately

Scenario: Snooze remind later
  Given user taps "Remind me later"
  When 4 hours pass
  Then the nudge is resent (if still relevant)

Scenario: Message spacing
  Given two nudges are triggered within 2 hours
  When timing conflict is detected
  Then only the higher-priority nudge is sent immediately

Scenario: Timezone handling
  Given user is in different timezone
  When nudges are scheduled
  Then times are calculated using device timezone

Scenario: Busy day snooze
  Given user taps "Too busy today"
  When acknowledged
  Then no more nudges are sent until next morning
```

---

## Success Metrics

- Quiet Hours Compliance: 99.9%
- Snooze Usage: <20% of nudges snoozed (indicates good timing)
- User Timing Satisfaction: 4.5/5

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Real-time timezone | - | Times stored per user | Clear time displays | All timezones |
| Instant compliance | - | - | - | - |

---

## Dependencies

- **Prerequisite Stories:** S03.5.1 (nudge engine), S03.1.1 (preferences)
- **Related Stories:** S03.5.3 (24h window)
- **External Dependencies:** Timezone service

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User travels to new timezone | Detect via device, adjust automatically |
| DST transition | Handle timezone offset changes |
| All day marked quiet | Require minimum 2-hour window |
| Conflicting quiet hour settings | Show validation error |
| Snooze + quiet hours conflict | Queue for next active period after snooze |

---

## Open Questions

- Device timezone vs configured timezone precedence

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Quiet hours configuration functional
- [ ] 99.9% quiet hours compliance verified
- [ ] Snooze functionality working
- [ ] Timezone handling correct
- [ ] Message spacing enforced
- [ ] Smart timing learning active
- [ ] Silence/pause options working

---

*Story S03.5.2 | Epic E03 | Product: yHealth Platform*
