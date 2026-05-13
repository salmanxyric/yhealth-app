---
type: story
id: S01.2.1
title: Goal Discovery
epic: E01
epic_name: Onboarding & Assessment
feature: F1.2
feature_name: Flexible Assessment
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.2.1: Goal Discovery

## User Story

**As a** new yHealth user who just created an account,
**I want to** tell yHealth what my primary health goal is,
**So that** subsequent assessment questions are relevant to my specific objectives.

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
- Goal discovery is the first assessment step after account creation
- User presented with structured goal options plus custom input
- Single primary goal selection (can refine later in F1.3)
- Goal selection determines question routing for Quick/Deep paths
- Clear value proposition: "Helps us ask the right questions"

**Goal Options:**
```
What brings you to yHealth today? What's your main health goal?

□ Lose weight and improve body composition
□ Build muscle and strength
□ Improve sleep quality and recovery
□ Reduce stress and improve mental wellness
□ Boost daily energy and productivity
□ Train for a specific event (marathon, competition, etc.)
□ Manage a health condition (with doctor's guidance)
□ Build sustainable healthy habits
□ Optimize overall health and performance
□ Other (custom input)
```

**Custom Goal Input:**
- If "Other" selected, free-text input appears
- AI categorizes custom goal to closest category for question routing
- Original text preserved for F1.3 refinement

**Question Routing Logic:**

| Goal Category | Primary Assessment Focus |
|---------------|-------------------------|
| Weight Loss | Body composition, diet history, emotional eating |
| Muscle Building | Training experience, protein intake, recovery |
| Sleep Improvement | Sleep patterns, bedtime routine, environment |
| Stress/Wellness | Stressors, coping mechanisms, mindfulness |
| Energy | Energy patterns, caffeine, sleep quality |
| Event Training | Event details, timeline, current fitness |
| Health Condition | Condition specifics, medications, doctor guidance |
| Habit Building | Target habits, past attempts, accountability |

---

## Acceptance Criteria

```gherkin
Scenario: Structured goal selection
  Given a user on the goal discovery screen
  When they select a structured goal option
  Then the selection is saved and user proceeds to assessment path choice

Scenario: Custom goal entry
  Given a user selects "Other"
  When they enter custom text and submit
  Then the custom goal is saved and AI categorizes it for routing

Scenario: Assessment routing
  Given a user has selected a goal
  When they proceed to assessment
  Then questions shown are relevant to their selected goal category

Scenario: Goal modification
  Given a user wants to change their goal selection
  When they tap "Back" or edit selection
  Then they can modify their choice before proceeding
```

---

## Success Metrics

- Goal Selection Rate: 99%+ (required to proceed)
- Custom Goal Usage: 10-15% (healthy diversity, not confusion)
- Goal Relevance: 95%+ users feel questions match their goal (survey)

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s selection response | - | Goal stored privately | Large tap targets | All devices |
| Instant routing | - | - | VoiceOver labels | |

---

## Dependencies

- **Prerequisite Stories:** S01.1.3 (account complete)
- **Related Stories:** S01.2.2, S01.2.3, S01.3.1
- **External Dependencies:** AI categorization for custom goals

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User selects multiple goals accidentally | Single-select enforced (radio buttons) |
| Custom goal text empty | Require minimum 5 characters |
| AI cannot categorize custom goal | Default to "Habit Building" routing |

---

## Open Questions

- Allow multiple primary goals? (Decision: No, single primary, supporting goals in F1.3)

---

## Definition of Done

- [ ] All 10 goal options displayed clearly
- [ ] Single-select enforced
- [ ] Custom goal input working
- [ ] AI categorization for custom goals functional
- [ ] Goal saved to user profile
- [ ] Routing logic connecting to assessment paths

---

*Story S01.2.1 | Epic E01 | Product: yHealth Platform*
