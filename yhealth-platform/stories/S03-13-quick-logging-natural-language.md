---
type: story
id: S03.6.2
title: Quick Logging - Natural Language
epic: E03
epic_name: WhatsApp Integration
feature: F3.6
feature_name: Quick Logging
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.6.2: Quick Logging - Natural Language

## User Story

**As a** Holistic Health Seeker (P1),
**I want to** log health data by typing or speaking naturally,
**So that** I can capture context and details that buttons can't convey.

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
- Natural language parsing for logging requests
- Batch logging in single message
- Editable logs after parsing
- Undo functionality for corrections

**Natural Language Logging Examples:**
| User Input | Parsed Data | Response |
|------------|-------------|----------|
| "Ate chicken salad for lunch" | Meal: chicken salad, Time: lunch | "Chicken salad logged for lunch!" |
| "30 min run" | Workout: running, Duration: 30 min | "30 min run logged! Great workout!" |
| "Slept 7 hours" | Sleep: 7 hours | "7 hours sleep logged!" |
| "Mood: happy, Energy: 8/10, ate breakfast" | Mood: 8, Energy: 8, Meal: breakfast | "All logged! Mood: happy, Energy: 8/10, Breakfast noted." |
| "Feeling stressed, had coffee" | Stress: high, Intake: coffee | "Stress noted. Coffee logged. Want to talk about what's stressing you?" |

**Light Mode:**
- Parse and log immediately
- Minimal confirmation: "Logged!"
- No follow-up questions

**Deep Mode:**
- Parse with optional clarification
- "30 min run - outdoor or treadmill?"
- "Chicken salad - want to estimate calories or snap a photo?"
- Context captured for richer data

**Batch Logging:**
- Multiple data points in single message
- "Slept 7 hours, mood 8/10, energy high, worked out 30 min"
- All items parsed and logged together
- Single confirmation: "All logged! Sleep: 7h, Mood: 8/10, Energy: High, Workout: 30min"

**Edit/Undo Capability:**
- "Oops, change that to 6 hours" → Updates last entry
- "Undo" → Removes last logged item
- Edit window: 5 minutes after logging

---

## Acceptance Criteria

```gherkin
Scenario: Basic meal logging
  Given a user types "Ate lunch"
  When the message is parsed
  Then a meal entry is created with appropriate defaults

Scenario: Batch logging
  Given a user types multiple items
  When batch logging is processed
  Then all items are logged with single confirmation

Scenario: Undo last log
  Given a user types "Undo"
  When within 5 minutes of last log
  Then the last entry is removed with confirmation

Scenario: Edit previous entry
  Given a user types "Change that to X"
  When the edit is parsed
  Then the previous entry is updated

Scenario: Unclear input
  Given unclear logging input
  When AI cannot determine data type
  Then it asks: "What would you like to log? Meal, workout, mood, or something else?"

Scenario: Meal without calories
  Given a user logs meal via text
  When no calorie info is provided
  Then reasonable estimate is applied (or photo requested in Deep mode)
```

---

## Success Metrics

- NLP Parsing Accuracy: >90% correct interpretation
- Batch Logging Usage: 30% of users use batch logging weekly
- Edit Usage: <10% of logs require edits (indicates good parsing)

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s parsing | - | Logs private | Works with voice messages | All WhatsApp clients |
| Real-time confirmation | - | - | - | - |

---

## Dependencies

- **Prerequisite Stories:** S03.6.1 (button logging), S03.2.1 (NLP engine)
- **Related Stories:** S03.4.1 (voice input), S03.7.1 (sync)
- **External Dependencies:** E5, E6, E7 (logging endpoints)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Ambiguous input ("ate food") | Ask for specifics or apply generic log |
| Invalid value ("Mood: 15/10") | "Mood scale is 1-10. Did you mean 10/10?" |
| Conflicting batch data | Process valid items, clarify conflicts |
| Undo after 5 minutes | "Too late to undo. Edit it in the app?" |

---

## Open Questions

- Default calorie estimates for text-logged meals

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] NLP parsing for all data types
- [ ] Batch logging functional
- [ ] Edit/undo capability working
- [ ] Light/Deep modes implemented
- [ ] >90% parsing accuracy verified
- [ ] Error handling for ambiguous input

---

*Story S03.6.2 | Epic E03 | Product: yHealth Platform*
