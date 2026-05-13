---
type: story
id: S01.3.2
title: Goal Validation & Commitment
epic: E01
epic_name: Onboarding & Assessment
feature: F1.3
feature_name: Goal Setting & Refinement
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.3.2: Goal Validation & Commitment

## User Story

**As a** new yHealth user finalizing my goals,
**I want to** have my goals validated for safety and realism, and commit with confidence,
**So that** I start with goals that are healthy, achievable, and I'm emotionally invested in.

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
- AI validates all goals against safety guardrails before finalization
- Medical condition flags trigger disclaimers and conservative adjustments
- User rates confidence (1-10) for each goal
- Low confidence (<7) triggers refinement conversation
- Final commitment screen with motivation anchor
- Goals can be edited anytime from settings (noted clearly)

**Safety Guardrails:**

| Goal Type | Safety Check | AI Action if Unsafe |
|-----------|--------------|---------------------|
| Weight Loss | >2 lbs/week average | Suggest slower pace, explain risks |
| Calorie Target | <1200 kcal (women) / <1500 (men) | Flag as too low, recommend TDEE-based |
| Exercise Frequency | >6 days/week, no rest | Recommend rest days, explain recovery |
| Sleep Target | <6 hours/night | Educate on health risks, suggest 7-9 |
| Extreme Timelines | Any goal with <4 weeks to drastic change | Extend timeline, explain sustainability |

**Medical Condition Handling:**
- If user disclosed conditions (diabetes, heart disease, eating disorder history):
  - AI adds disclaimer: "Since you mentioned [condition], please confirm with your doctor before starting."
  - Offer to email goal summary to share with provider
  - Adjust recommendations conservatively

**Commitment Flow:**
```
Your Goals Are Set! 🎯

PRIMARY GOAL (Fitness):
Lose 20-30 lbs in 6 months
Why it matters: "I want to feel confident at my wedding and have energy to enjoy it."

SUPPORTING GOALS:
✓ Nutrition: Track meals 6 days/week
✓ Wellbeing: Journal 3x/week to manage stress

FIRST MILESTONE (30 days):
- Lose 5 lbs
- Establish 3-day/week exercise habit
- Hit 80% food tracking consistency

How committed are you to these goals? [1━━━━━━━━━━10]

[Looks Great!] [Edit Goals]
```

**Confidence Handling:**
- If <7/10: "I'm sensing some hesitation. What's holding you back? Let's adjust until you're at an 8 or higher."
- If ≥7/10: "Love that confidence! I'll check in with you in 30 days to see how we're tracking."

---

## Acceptance Criteria

```gherkin
Scenario: Safety validation
  Given user has finalized goals
  When goals violate safety guardrails
  Then AI flags the issue and suggests safer alternatives

Scenario: Medical condition disclaimer
  Given user disclosed a medical condition
  When they finalize goals
  Then a disclaimer appears recommending doctor consultation

Scenario: Low confidence handling
  Given user rates confidence
  When confidence is <7/10
  Then AI prompts to explore hesitation and adjust goals

Scenario: Goal commitment
  Given user confirms goals with confidence ≥7/10
  When they tap "Looks Great!"
  Then goals are saved with commitment timestamp and user proceeds

Scenario: Future editing
  Given goals are saved
  When user wants to edit later
  Then they can access goals from settings at any time

Scenario: Safety override
  Given an unsafe goal is detected
  When user tries to override
  Then they can proceed with explicit acknowledgment of risk
```

---

## Success Metrics

- Realistic Pacing: <5% goals flagged as unsafe/unsustainable
- User Confidence: 80%+ commit with ≥7/10 confidence
- Medical Disclaimer Display: 100% when conditions disclosed
- Goal Edit Rate: 30%+ adjust within first 30 days (healthy iteration)

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s validation | Medical data encrypted | Conditions never shared | Clear warning display | All devices |
| - | - | - | Adjustable slider | |

---

## Dependencies

- **Prerequisite Stories:** S01.3.1 (goals created)
- **Related Stories:** S01.6.1
- **External Dependencies:** None

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User overwhelmed by too many goals | AI suggests focus: "Start with 1-2 for first month?" |
| All goals flagged as unsafe | Block until at least one safe goal created |
| User skips confidence rating | Default to 5/10, suggest revisiting |
| Medical condition not disclosed but unsafe goal set | General safety warning without specific condition reference |

---

## Open Questions

- Email goal summary to doctor integration (future feature?)

---

## Definition of Done

- [ ] Safety guardrail validation implemented
- [ ] Medical condition disclaimers displayed
- [ ] Confidence rating (1-10) functional
- [ ] Low confidence triggers refinement dialogue
- [ ] Final commitment screen with motivation anchor
- [ ] Goals editable from settings
- [ ] Override with acknowledgment for unsafe goals

---

*Story S01.3.2 | Epic E01 | Product: yHealth Platform*
