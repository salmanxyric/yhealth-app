---
type: story
id: S02.1.2
title: AI-Initiated Proactive Calls
epic: E02
epic_name: Voice Coaching
feature: F2.1
feature_name: Voice Call Initiation
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
implemented: 2026-05-14
---

# S02.1.2: AI-Initiated Proactive Calls

## User Story

**As a** Holistic Health Seeker (P1),
**I want** my AI coach to proactively reach out when it detects concerning patterns or celebration-worthy milestones,
**So that** I receive timely guidance without having to remember to check in.

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
- AI initiates calls based on user-approved triggers
- Requires explicit opt-in during onboarding
- Respects quiet hours and do-not-disturb settings
- 30-second ring with voicemail fallback option
- User can decline with "not now" or "call me later"

**AI Initiation Triggers:**
| Trigger | Condition | Priority |
|---------|-----------|----------|
| Concerning Patterns | 5+ days poor sleep, declining recovery | High |
| Significant Milestones | 30-day streak, major goal achieved | Medium |
| Weekly Review | Sunday evening check-in (if opted in) | Medium |
| Recovery Extremes | Very high (>90) or very low (<50) scores | High |

**Light Mode:**
- AI rarely initiates (only critical patterns)
- Simple notification: "Coach wants to check in"
- Easy decline with no follow-up pressure

**Deep Mode:**
- AI initiates for weekly check-ins + patterns + milestones
- Context-rich notification explaining why AI is calling
- Smart scheduling around user's calendar (if integrated)

**Call Flow:**
1. AI determines call is warranted based on triggers
2. Check user's quiet hours and preferences
3. Send notification: "Your coach wants to check in about [reason]"
4. If user accepts, connect immediately
5. If no response in 30s, offer voice message or text summary
6. If declined 3x consecutively, reduce AI initiation frequency

---

## Acceptance Criteria

```gherkin
Scenario: AI-initiated call on concerning patterns
  Given a user has opted into AI-initiated calls
  When concerning patterns are detected (e.g., 5+ days poor sleep)
  Then the AI initiates a call with notification explaining the reason

Scenario: Quiet hours respected
  Given the AI attempts to call during quiet hours
  When quiet hours are active
  Then the call is deferred until quiet hours end

Scenario: No answer fallback
  Given a user doesn't answer within 30 seconds
  When the ring timeout occurs
  Then the AI sends a text message: "Wanted to check in. Reply 'Call me' when ready!"

Scenario: Consecutive declines
  Given a user declines 3+ AI-initiated calls consecutively
  When the third decline is detected
  Then AI initiation frequency is automatically reduced with message: "I'll check in less often."

Scenario: Opt-out respected
  Given a user has not opted into AI-initiated calls
  When any trigger condition is met
  Then no AI-initiated call occurs (text nudge only)
```

---

## Success Metrics

- AI-Initiated Call Acceptance Rate: 50%
- Trigger Accuracy: 80% of users agree call was warranted
- Quiet Hours Compliance: 100%
- Opt-in Rate: 60% of users enable AI-initiated calls
- Decline-to-frequency-reduction Effectiveness: Reduced complaints by 50%

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s trigger-to-notification | Consent verification | Opt-in required | Screen reader notifications | iOS/Android push |
| Quiet hours checked server-side | Preference encryption | No call without consent | Haptic feedback option | Calendar API optional |

---

## Dependencies

- **Prerequisite Stories:** S02.1.1, S02.2.2 (context engine), S02.4.1 (session types)
- **Related Stories:** S02.6.1 (frequency preferences)
- **External Dependencies:** Push notification service, Calendar API (optional)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User in airplane mode | Queue notification for delivery when online |
| Multiple triggers fire simultaneously | Prioritize highest severity, combine messaging |
| User changed timezone while traveling | Detect timezone change, prompt confirmation |
| User disabled notifications at OS level | Show in-app banner on next app open |
| AI-initiated call declined immediately | Record decline, no retry for 24 hours |

---

## Open Questions

- Integration depth with calendar apps (Google Calendar, Apple Calendar)
- Trigger threshold tuning based on user feedback

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Opt-in consent flow during onboarding
- [ ] All trigger conditions functional
- [ ] Quiet hours respected 100%
- [ ] 30-second timeout with fallback working
- [ ] Frequency auto-reduction on consecutive declines
- [ ] Analytics tracking for trigger effectiveness

---

*Story S02.1.2 | Epic E02 | Product: yHealth Platform*
