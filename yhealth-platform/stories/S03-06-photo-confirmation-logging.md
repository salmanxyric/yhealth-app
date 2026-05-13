---
type: story
id: S03.3.2
title: Photo Confirmation & Logging
epic: E03
epic_name: WhatsApp Integration
feature: F3.3
feature_name: Photo Logging
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.3.2: Photo Confirmation & Logging

## User Story

**As a** Busy Professional (P2),
**I want to** confirm, edit, or reject photo analysis results before logging,
**So that** my nutrition data is accurate even when AI estimates need adjustment.

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
- Receive photo analysis results from S03.3.1
- Quick reply buttons: [Confirm] [Edit] [Cancel]
- Edit interface for adjusting values
- Logging to Nutrition pillar (E6) upon confirmation
- Meal timestamp captured from WhatsApp message time

**Confirmation Flow:**
```
AI: "Turkey sandwich - 500 cal, 35g protein, 45g carbs, 18g fat. Log it?"
    [Yes, Log It] [Edit Values] [Cancel]

User: [Taps "Yes, Log It"]

AI: "Lunch logged! You're at 1,200 cal today. 800 more to go."
```

**Edit Flow:**
```
AI: "Turkey sandwich - 500 cal. Log it?"
    [Yes] [Edit] [Cancel]

User: [Taps "Edit"]

AI: "What would you like to change?
    - Calories: 500
    - Protein: 35g
    - Carbs: 45g
    - Fat: 18g
    Reply with what to change (e.g., 'Calories: 400')"

User: "Calories: 400"

AI: "Updated to 400 cal. Confirm?"
    [Yes, Log It] [Edit More] [Cancel]
```

**Light Mode:**
- One-tap confirm
- No automatic follow-up questions
- Simple: "Logged!"

**Deep Mode:**
- Confirm with details shown
- Optional: "Add notes?" after logging
- Portion adjustment suggestions

**Data Logged:**
| Field | Source | Format |
|-------|--------|--------|
| Meal Type | Time-based inference | breakfast/lunch/dinner/snack |
| Timestamp | WhatsApp message time | ISO 8601 |
| Calories | AI estimate or user edit | Integer |
| Protein | AI estimate or user edit | Grams |
| Carbs | AI estimate or user edit | Grams |
| Fat | AI estimate or user edit | Grams |
| Foods Identified | AI analysis | Array of strings |
| Photo URL | Stored image | Encrypted URL |

---

## Acceptance Criteria

```gherkin
Scenario: Confirm photo analysis
  Given photo analysis is complete
  When user taps "Yes, Log It"
  Then meal is logged to Nutrition pillar and confirmation shown

Scenario: Edit values
  Given user taps "Edit"
  When edit interface is displayed
  Then user can modify any nutrition value

Scenario: Edited values logged
  Given user edits values
  When they confirm edits
  Then updated values are logged (not original estimates)

Scenario: Cancel logging
  Given user taps "Cancel"
  When cancellation is confirmed
  Then no meal is logged and photo is discarded

Scenario: Daily totals displayed
  Given meal is logged
  When daily totals are calculated
  Then confirmation includes updated daily calorie count

Scenario: Meal type inference
  Given meal timing needs inference
  When logging occurs
  Then meal type (breakfast/lunch/dinner/snack) is assigned based on time
```

---

## Success Metrics

- Confirmation Rate: >80% of analyzed photos logged
- Edit Rate: <30% of logs require edits (indicates good estimates)
- Cancel Rate: <10%
- Logging Time: <30 seconds from photo send to logged

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s confirmation | Photos encrypted | User can delete | Clear edit interface | WhatsApp interactive |
| Instant daily total | - | 90-day retention | - | - |

---

## Dependencies

- **Prerequisite Stories:** S03.3.1 (photo analysis)
- **Related Stories:** S03.7.1 (sync to app)
- **External Dependencies:** E6 (Nutrition pillar)
- **Cross-Epic:** E6 (meal logging endpoint)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User confirms then immediately says "Undo" | Allow undo within 5 minutes |
| Edit with invalid value ("Calories: abc") | "Please enter a number for calories." |
| Logging fails (backend error) | "Couldn't log that. Try again?" with retry button |
| Double-confirm (button tapped twice) | Ignore duplicate, log once |
| Photo storage fails | Log nutrition data, note photo unavailable |

---

## Open Questions

- Photo retention period (90 days default?)

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Confirm/Edit/Cancel buttons functional
- [ ] Edit interface for all nutrition values
- [ ] Meal logged to E6 Nutrition pillar
- [ ] Daily totals calculated and displayed
- [ ] Meal type inferred from time
- [ ] Undo capability working
- [ ] Error handling complete

---

*Story S03.3.2 | Epic E03 | Product: yHealth Platform*
