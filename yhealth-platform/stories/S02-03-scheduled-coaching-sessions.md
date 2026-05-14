---
type: story
id: S02.1.3
title: Scheduled Coaching Sessions
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

# S02.1.3: Scheduled Coaching Sessions

## User Story

**As an** Optimization Enthusiast (P3),
**I want to** schedule recurring coaching sessions with my AI coach,
**So that** I have consistent accountability check-ins built into my weekly routine.

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
- Schedule recurring coaching sessions (daily, weekly, custom)
- Receive reminders 1 hour before scheduled session
- Reschedule or cancel with easy interface
- No-show handling with follow-up options
- Session history shows scheduled vs completed

**Scheduling Options:**
| Frequency | Description | Example |
|-----------|-------------|---------|
| Daily | Same time every day | 7:00 AM wake-up check-in |
| Weekly | Specific day and time | Sunday 7:00 PM weekly review |
| Custom | User-defined pattern | Mon/Wed/Fri at 6:00 PM |
| One-time | Single scheduled session | Next Tuesday at 2:00 PM |

**Light Mode:**
- Simple weekly session scheduling
- Basic reminder notification
- Easy one-tap join at scheduled time

**Deep Mode:**
- Complex recurring patterns supported
- Pre-session agenda setting ("What should we focus on?")
- Calendar integration showing sessions alongside other events
- Session series management (skip one, modify all)

**Session Lifecycle:**
1. User schedules session (date, time, recurring pattern)
2. System sends reminder 1 hour before
3. At scheduled time, notification: "Your coaching session is starting"
4. User taps to join call
5. If no-show within 5 minutes, send follow-up: "Missed your session. Reschedule?"
6. Post-session summary notes it was a scheduled session

---

## Acceptance Criteria

```gherkin
Scenario: Weekly recurring session
  Given a user wants to schedule a weekly coaching session
  When they set up Sunday 7:00 PM recurring
  Then the session appears in their schedule and repeats weekly

Scenario: Session reminder
  Given a scheduled session is 1 hour away
  When the reminder time is reached
  Then the user receives a notification: "Coaching session in 1 hour."

Scenario: Session start
  Given the scheduled session time arrives
  When the user is notified
  Then they can tap to join and connect within 30 seconds

Scenario: No-show handling
  Given a user doesn't connect within 5 minutes of scheduled time
  When the no-show is detected
  Then they receive: "Missed your coaching session. Reschedule or cancel?"

Scenario: Reschedule session
  Given a user wants to reschedule a session
  When they select reschedule
  Then they can pick a new date/time and the original is updated
```

---

## Success Metrics

- Scheduled Session Adherence: 75% of scheduled calls completed
- Reminder Effectiveness: 80% of users who receive reminder join session
- Reschedule Usage: Track rescheduled vs cancelled sessions
- Recurring Session Retention: 60% of weekly sessions maintained >4 weeks

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s schedule creation | Authenticated only | Schedule data encrypted | VoiceOver for scheduling | iOS 14+, Android 10+ |
| Reminders delivered on time | Session tokens validated | No third-party calendar sync without consent | Time picker accessible | Calendar app integration optional |

---

## Dependencies

- **Prerequisite Stories:** S02.1.1, S02.4.1 (session types define content)
- **Related Stories:** S02.6.1 (quiet hours affect scheduling)
- **External Dependencies:** Push notification scheduling, Optional calendar API

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User schedules during their quiet hours | Warn: "This time is in your quiet hours. Schedule anyway?" |
| Timezone change for recurring session | Adjust to new timezone, notify user of change |
| Conflicting sessions scheduled | Prevent double-booking, suggest alternative |
| System downtime at scheduled time | Auto-reschedule with apology notification |
| User cancels all future recurring sessions | Confirm: "Cancel all future sessions?" with undo option |

---

## Open Questions

- Maximum scheduled sessions per week (prevent abuse)
- Session preparation prompts ("What do you want to discuss?")

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Recurring session scheduling working (daily, weekly, custom)
- [ ] Reminders delivered 1 hour before
- [ ] No-show detection and follow-up functional
- [ ] Reschedule and cancel flows working
- [ ] Calendar integration (optional) functional
- [ ] Session history correctly shows scheduled sessions

---

*Story S02.1.3 | Epic E02 | Product: yHealth Platform*
