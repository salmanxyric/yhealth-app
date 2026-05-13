---
type: story
id: S01.2.2
title: Quick Assessment Path
epic: E01
epic_name: Onboarding & Assessment
feature: F1.2
feature_name: Flexible Assessment
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.2.2: Quick Assessment Path

## User Story

**As a** new yHealth user who selected my primary goal,
**I want to** complete a quick, structured health assessment,
**So that** I can get my personalized plan without spending too much time upfront.

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
- 8-12 targeted questions based on goal selection
- Structured questionnaire format (no open-ended responses)
- Progress indicator showing "Step X of Y" and estimated time remaining
- Smart defaults pre-selected for common answers
- <5 minute total completion time
- Mobile-optimized with large tap targets
- Summary review screen before finalizing

**Question Types:**
- Single-select (radio buttons)
- Multi-select (checkboxes)
- Sliders (numeric scales 1-10)
- Emoji scales (mood/energy)
- Date pickers (for timelines)
- Number inputs (height, weight)

**Screen Flow (8-10 screens):**
1. **Goal Confirmation** (from S01.2.1)
2. **Body Stats** (if relevant): Height, weight, target weight
3. **Activity Level**: Slider 0-7 days/week
4. **Nutrition Habits**: Multi-select (tracking, meal prep, dining out)
5. **Sleep Quality**: Emoji scale (1-10)
6. **Stress Level**: Emoji scale (1-10)
7. **Dietary Preferences**: Checkboxes (vegan, keto, allergies)
8. **Past Attempts**: Multi-select (diets tried, apps used)
9. **Biggest Challenge**: Single-select (time, motivation, knowledge, consistency)
10. **Summary Review**: Edit any answer before proceeding

**Cross-Pillar Baseline (Asked Regardless of Goal):**

| Pillar | Questions |
|--------|-----------|
| Fitness | Activity days/week, primary activities, wearable owned |
| Nutrition | Meals/day, cooking frequency, hydration |
| Wellbeing | Mood rating, stress level, sleep quality, mindfulness practice |

**Smart Defaults:**
- Country: Auto-detect from device locale
- Units: Imperial (US) or Metric (other) based on locale
- Common selections pre-highlighted where data supports

---

## Acceptance Criteria

```gherkin
Scenario: Quick assessment completion
  Given a user starting Quick Assessment
  When they answer all questions and submit
  Then assessment completes in <5 minutes and data is saved

Scenario: Progress indicator
  Given a user is on any question screen
  When they view the progress indicator
  Then they see "Step X of Y" and estimated time remaining

Scenario: Summary review
  Given a user completes all questions
  When they reach the summary screen
  Then they can edit any answer before finalizing

Scenario: Skip optional questions
  Given a user skips optional questions
  When they proceed
  Then the skip is recorded and assessment continues

Scenario: Mode switch
  Given a user wants to switch to Deep Assessment
  When they tap "Switch to conversational mode"
  Then they transition to Deep path with data preserved

Scenario: Progress persistence
  Given a user exits mid-assessment
  When they return to yHealth
  Then their progress is restored automatically
```

---

## Success Metrics

- Completion Rate: 90%+
- Time to Complete: <5 minutes (95% of users)
- Mode Selection: 60% choose Quick path
- Data Richness: 8/10 average completeness score

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <500ms per screen | Data encrypted in transit | Health data protected | 44x44pt tap targets | iOS 14+, Android 10+ |
| Real-time save | - | - | Screen reader support | |

---

## Dependencies

- **Prerequisite Stories:** S01.2.1 (goal selected)
- **Related Stories:** S01.2.3, S01.3.1
- **External Dependencies:** None

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User abandons mid-assessment | Auto-save, send reminder via WhatsApp/email |
| Network error during save | Local cache, sync on reconnection |
| Invalid numeric input | Inline validation with bounds checking |
| User skips too many questions | Block completion, explain minimum requirements |

---

## Open Questions

- Minimum questions required for plan generation (target: 6)

---

## Definition of Done

- [ ] 8-12 questions implemented per goal category
- [ ] Progress indicator functional
- [ ] Smart defaults working
- [ ] Summary review screen implemented
- [ ] Auto-save on each answer
- [ ] Mode switch to Deep path working
- [ ] <5 minute completion verified
- [ ] Cross-pillar baseline captured

---

*Story S01.2.2 | Epic E01 | Product: yHealth Platform*
