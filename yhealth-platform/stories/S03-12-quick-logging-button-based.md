---
type: story
id: S03.6.1
title: Quick Logging - Button-Based
epic: E03
epic_name: WhatsApp Integration
feature: F3.6
feature_name: Quick Logging
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.6.1: Quick Logging - Button-Based

## User Story

**As a** Busy Professional (P2),
**I want to** log my health data with one-tap buttons on WhatsApp,
**So that** I can track everything in seconds without typing.

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
- Quick reply buttons for common logging actions
- Emoji-based mood/energy logging
- One-tap confirmations after logging
- Contextual buttons based on time of day

**Button-Based Logging Types:**
| Data Type | Button Options | Outcome |
|-----------|---------------|---------|
| Mood | [Great] [Okay] [Rough] | Mood logged (1-10 scale mapped) |
| Energy | [High] [Medium] [Low] | Energy logged (1-10 scale) |
| Sleep Quality | [Great] [Okay] [Poor] | Sleep quality logged |
| Workout Done | [Done] [Log It] [Rest Day] | Status updated |
| Meal Eaten | [Photo] [Describe] [Skip] | Logging method selected |
| Water | [250ml] [500ml] [1L] | Hydration logged |

**Light Mode:**
- Maximum button usage, minimal typing
- "How's your mood?" → Tap emoji → "Great mood logged!"
- Ultra-fast, under 5 seconds

**Deep Mode:**
- Buttons available with optional follow-up
- "How's your mood?" → Tap emoji → "Want to tell me more?" → Text/voice elaboration
- Detailed journal entry created if user elaborates

**Contextual Button Triggers:**
| Time/Context | Prompt | Buttons |
|--------------|--------|---------|
| Morning (7-9am) | "Good morning! How are you feeling?" | Mood buttons |
| After meal time (12-1pm) | "Did you eat lunch?" | [Yes-Photo] [Yes-Text] [Not yet] |
| Evening (8-10pm) | "How was your day?" | Mood + Energy buttons |
| After workout logged | "How do you feel after your workout?" | Energy buttons |

**Logging Confirmation:**
- One-tap logs immediately confirmed
- "Logged! [emoji]" response within 2 seconds
- Running totals shown where relevant: "Water logged! You're at 1.5L today."

---

## Acceptance Criteria

```gherkin
Scenario: Mood button logging
  Given a user receives a mood check prompt
  When they tap an emoji button
  Then their mood is logged and confirmed within 2 seconds

Scenario: Water logging with total
  Given a user taps water logging button
  When the amount is logged
  Then cumulative daily total is displayed in confirmation

Scenario: Contextual prompt buttons
  Given a user receives contextual prompt
  When buttons are displayed
  Then the options are relevant to the time of day and user's patterns

Scenario: Light mode no follow-up
  Given a user is in Light mode
  When they complete a log
  Then no follow-up questions are asked

Scenario: Deep mode elaboration
  Given a user is in Deep mode
  When they complete a log
  Then optional elaboration is offered

Scenario: Not yet meal response
  Given a user taps "Not yet" for a meal
  When acknowledged
  Then a follow-up prompt is scheduled for later
```

---

## Success Metrics

- Quick Reply Usage: >70% of logs use buttons vs. free text
- Average Logging Time: <10 seconds per entry
- Daily Logging Adoption: 75% of users log 1+ metric daily
- User Satisfaction: 4.6/5 on convenience

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s confirmation | - | Logs private | Large emoji buttons | WhatsApp interactive messages |
| Real-time totals | - | - | Readable labels | 3 buttons max per message |

---

## Dependencies

- **Prerequisite Stories:** S03.2.1 (coaching engine for context)
- **Related Stories:** S03.6.2 (NLP logging), S03.7.1 (sync to app)
- **External Dependencies:** E5, E6, E7 (logging endpoints)
- **Cross-Epic:** E5/E6/E7 (pillar data storage)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Button tap not registered | Resend buttons with "Tap didn't register. Try again?" |
| Duplicate log in short window | "Already logged mood at 8am. Update it or log a new one?" |
| User taps wrong button | "Oops, change that?" with undo option |
| Buttons expire (WhatsApp limit) | Resend prompt if user tries to interact with old buttons |

---

## Open Questions

- Maximum button prompts per day to avoid fatigue

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] All logging types with buttons functional
- [ ] Contextual prompts based on time of day
- [ ] Light mode (no follow-up) working
- [ ] Deep mode (optional elaboration) working
- [ ] <2s confirmation time achieved
- [ ] Running totals displayed accurately
- [ ] Button error handling implemented

---

*Story S03.6.1 | Epic E03 | Product: yHealth Platform*
