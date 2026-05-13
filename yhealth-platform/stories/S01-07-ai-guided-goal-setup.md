---
type: story
id: S01.3.1
title: AI-Guided Goal Setup
epic: E01
epic_name: Onboarding & Assessment
feature: F1.3
feature_name: Goal Setting & Refinement
product: yhealth-platform
priority: P0
status: In Progress
created: 2025-12-07
---

# S01.3.1: AI-Guided Goal Setup

## User Story

**As a** new yHealth user who completed assessment,
**I want to** receive AI-suggested SMART goals based on my assessment and refine them with AI guidance,
**So that** I start with clear, achievable targets tailored to my situation.

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
- AI suggests 2-3 goals based on assessment data (not generic templates)
- Primary goal (Fitness/Nutrition/Wellbeing) + supporting goals
- SMART format: Specific, Measurable, Achievable, Relevant, Time-bound
- User can edit every aspect: timeline, target, metrics
- Goals include "why it matters" motivation anchor
- Milestone breakdown: 30/60/90-day targets
- Light mode: Guided setup (5 min) - Accept/edit AI suggestions
- Deep mode: Collaborative refinement (10-15 min) - AI explores "why" deeper like

**AI Goal Suggestion Example:**
```
Based on your goal to lose weight and improve energy, here are my recommendations:

Primary Goal (Fitness):
🎯 Lose 20 lbs in 4 months (5 lbs/month - sustainable pace)
   Why this matters: Wedding in June, want to feel confident
   Success rate: 78% of users with similar profile achieve this

Supporting Goal (Nutrition):
🍽️ Track meals 6 days/week for 90 days
   Why: Food awareness is the #1 factor in weight loss

Supporting Goal (Wellbeing):
😌 Improve sleep quality from 5/10 to 7/10 in 60 days
   Why: Your assessment showed low energy + poor sleep - they're connected

[Edit Goals] [Looks Good, Continue]
```

**Editable Parameters:**
- Target value (e.g., 20 lbs → 25 lbs)
- Timeline (slider: faster/slower)
- Metric type (weight vs body fat %)
- Supporting goal priorities
- Motivation statement (why it matters)

**Milestone Generation:**
- AI auto-generates 30-day milestones based on goal and timeline
- User can adjust milestone targets
- Example: Month 1: 5 lbs | Month 2: 10 lbs | Month 3: 15 lbs | Month 4: 20 lbs

---

## Acceptance Criteria

```gherkin
Scenario: Personalized goal suggestions
  Given assessment data is available
  When user reaches goal setup
  Then AI suggests 2-3 personalized goals (not generic templates)

Scenario: Goal editing
  Given AI suggests goals
  When user taps "Edit Goals"
  Then they can modify timeline, target, and all goal parameters

Scenario: Trade-off validation
  Given user adjusts a goal
  When they change timeline or target
  Then AI validates the change and explains trade-offs if needed

Scenario: Milestone generation
  Given goals are finalized
  When user confirms
  Then milestones are auto-generated at 30/60/90 day markers

Scenario: Light mode completion
  Given user is in Light mode
  When they accept AI suggestions without edits
  Then goal setup completes in <5 minutes

Scenario: Deep mode refinement
  Given user is in Deep mode
  When they engage with AI refinement
  Then AI explores deeper motivations and adjusts goals accordingly
```

---

## Success Metrics

- SMART Compliance: 95%+ goals meet all SMART criteria
- User Confidence: 80%+ rate confidence ≥7/10 in their goals
- Goal Clarity Score: 9/10 average (AI-assessed specificity)
- Emotional Resonance: 90%+ goals include "why it matters" statement

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s goal generation | - | Goals private | Clear goal display | All devices |
| Real-time validation | - | - | Editable via voice | |

---

## Dependencies

- **Prerequisite Stories:** S01.2.2 or S01.2.3 (assessment complete)
- **Related Stories:** S01.3.2, S01.6.1
- **External Dependencies:** AI Coaching Engine

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Assessment data incomplete | Generate goals with available data, flag gaps |
| User sets conflicting goals | AI explains trade-off, force prioritization |
| User sets vague goal | AI prompts for specificity: "How much, by when?" |
| No primary goal set | Block proceeding, require at least one |

---

## Open Questions

- Maximum number of active goals? (Suggest: 1 primary + 2 supporting)

---

## Definition of Done

- [ ] AI goal suggestion based on assessment data
- [ ] SMART goal format enforced
- [ ] All goal parameters editable
- [ ] Milestone auto-generation working
- [ ] Trade-off explanations for aggressive changes
- [ ] Light mode <5 min completion
- [ ] Deep mode AI dialogue functional
- [ ] "Why it matters" captured for each goal

---

*Story S01.3.1 | Epic E01 | Product: yHealth Platform*
