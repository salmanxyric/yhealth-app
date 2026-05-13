---
type: story
id: S01.6.1
title: Plan Generation Engine
epic: E01
epic_name: Onboarding & Assessment
feature: F1.6
feature_name: Personalized Plan Generation
product: yhealth-platform
priority: P0
status: In Progress
created: 2025-12-07
---

# S01.6.1: Plan Generation Engine

## User Story

**As a** new yHealth user who completed onboarding,
**I want to** receive an AI-generated health plan synthesizing all my onboarding data,
**So that** I have a personalized roadmap tailored to my goals, data, and preferences.

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
- Plan generates in <30 seconds
- Progress indicator shows generation steps
- Plan synthesizes: Assessment, Goals, Integrations, Preferences
- 12-week plan structure with weekly breakdown
- TDEE/macro calculations included for nutrition
- Fitness, Nutrition, and Wellbeing pillars covered

**Plan Generation Inputs:**

| Source | Data Used |
|--------|-----------|
| F1.2 Assessment | Goal, baseline metrics, past attempts, challenges |
| F1.3 Goals | SMART goals, milestones, motivation |
| F1.4 Integrations | Wearable data, baseline HR/sleep/activity |
| F1.5 Preferences | Engagement mode, coaching style, channels |

**Plan Components:**

**Fitness Plan:**
- Exercise frequency based on baseline + goal
- Exercise types tailored to goal (cardio for weight loss, strength for muscle)
- Progressive overload: Volume increases every 4 weeks
- Rest days mandatory based on recovery data
- Heart rate zones from wearable data

**Nutrition Plan:**
- TDEE calculation (Mifflin-St Jeor formula)
- Calorie target: TDEE ± deficit/surplus for goal
- Macro split personalized to goal (e.g., high protein for muscle)
- Respects dietary restrictions
- Tracking frequency recommendation

**Wellbeing Plan:**
- Sleep target based on assessment
- Stress management activities (journaling, meditation)
- Mood tracking frequency
- Energy optimization strategies

**TDEE Calculation:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + modifier
  modifier: +5 (men), -161 (women)

TDEE = BMR × Activity Multiplier
  Sedentary: 1.2 | Light: 1.375 | Moderate: 1.55 | Active: 1.725
```

**Generation Progress:**
```
Generating Your Personalized Plan...

✓ Analyzing your goals (2 sec)
✓ Reviewing your assessment (5 sec)
✓ Calculating nutrition targets (8 sec)
✓ Designing workout plan (12 sec)
✓ Adding wellbeing strategies (18 sec)
✓ Finalizing Week 1 actions (25 sec)

Your plan is ready! (30 sec)
```

---

## Acceptance Criteria

```gherkin
Scenario: Plan generation speed
  Given all onboarding data is available
  When plan generation is triggered
  Then plan generates in <30 seconds

Scenario: Progress indicator
  Given plan is generating
  When user views progress
  Then step-by-step progress indicator shows status

Scenario: Plan completeness
  Given plan is generated
  When content is reviewed
  Then it includes Fitness, Nutrition, and Wellbeing components

Scenario: Dietary restrictions
  Given user has specific dietary restrictions
  When nutrition plan is generated
  Then restrictions are respected

Scenario: Wearable data integration
  Given user has wearable data
  When fitness plan is generated
  Then baseline metrics inform recommendations

Scenario: Safety validation
  Given unsafe targets would be generated (e.g., <1200 kcal)
  When validation runs
  Then safe minimums are enforced with explanation
```

---

## Success Metrics

- Generation Speed: <30 seconds (95% of cases)
- Plan Completeness: 100% include all 3 pillars
- TDEE Accuracy: Within 10% of validated calculators
- Safe Target Enforcement: 100%

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s generation | Plan encrypted | Plan private | Progress readable | All devices |
| - | - | - | - | |

---

## Dependencies

- **Prerequisite Stories:** S01.5.1 or S01.5.2 (preferences set)
- **Related Stories:** S01.6.2
- **External Dependencies:** AI plan generation engine (GPT-4/Claude)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Missing critical input | Block generation, prompt for missing data |
| AI generation timeout | Retry with simplified prompt |
| Unsafe plan generated | Override with safe defaults, notify user |
| No wearable data yet | Generate with assumptions, refine as data syncs |

---

## Open Questions

- Plan versioning when user edits

---

## Definition of Done

- [ ] <30 second generation time
- [ ] Progress indicator functional
- [ ] TDEE/macro calculations accurate
- [ ] All 3 pillars (Fitness, Nutrition, Wellbeing) included
- [ ] Dietary restrictions respected
- [ ] Wearable data incorporated
- [ ] Safety validation enforced
- [ ] Plan saved to database

---

*Story S01.6.1 | Epic E01 | Product: yHealth Platform*
