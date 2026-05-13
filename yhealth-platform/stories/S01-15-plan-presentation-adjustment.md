---
type: story
id: S01.6.2
title: Plan Presentation & Adjustment
epic: E01
epic_name: Onboarding & Assessment
feature: F1.6
feature_name: Personalized Plan Generation
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.6.2: Plan Presentation & Adjustment

## User Story

**As a** new yHealth user viewing my generated plan,
**I want to** see my plan in appropriate detail (Light/Deep view) and adjust parameters,
**So that** I understand my roadmap and can customize it to my needs.

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
- Light mode: Plan overview with Week 1 focus (2-min review)
- Deep mode: Full 12-week breakdown with rationale (10-min review)
- User can adjust: Timeline, frequency, strategy, priorities
- AI validates adjustments and explains trade-offs
- Week 1 action plan clearly displayed
- Welcome experience transitions user to active coaching

**Light Mode View:**
```
Your Personalized Plan is Ready! 🎯

PRIMARY GOAL:
Lose 20 lbs in 4 months (5 lbs/month)

YOUR WEEK 1 FOCUS:
✓ Exercise 3x this week (Mon, Wed, Fri)
✓ Track meals 6 days (1800 cal/day target)
✓ In bed by 10:30 PM every night

FIRST MILESTONE (30 Days):
- Lose 5 lbs
- Establish exercise habit
- Hit 80% tracking consistency

[View Full Plan] [Start Week 1] [Adjust Plan]
```

**Deep Mode View:**
- Full 12-week breakdown
- Phase structure (Foundation → Progression → Optimization → Maintenance)
- Rationale for each recommendation
- Expected outcomes per phase
- Detailed Week 1 day-by-day actions

**Plan Adjustment Options:**
```
TIMELINE:
Current: 4 months
[Faster: 3 months] [Slower: 6 months]

EXERCISE FREQUENCY:
Current: 3x/week (Phase 1)
[Increase to 4x] [Decrease to 2x]

NUTRITION STRATEGY:
Current: Calorie tracking (1800 kcal/day)
[Portion control] [Intermittent fasting] [Keto]

[Save Adjustments] [Regenerate Plan]
```

**AI Adjustment Response:**
```
AI: "You want to increase to 4x/week in Phase 1. That's ambitious!

     Pros: Faster results, builds habit strength
     Cons: Higher injury risk, more recovery needed

     My recommendation: Stick with 3x for Phase 1, then 4x in Phase 2.
     Sound good?"

[Stick with 3x] [Override to 4x]
```

**Welcome Experience:**
```
🎉 Onboarding Complete!

TOMORROW MORNING (7:00 AM):
First check-in - rate your mood + energy (30 sec)

THIS WEEK:
Follow Week 1 actions via [WhatsApp/App]

FIRST COACHING CALL:
Scheduled for [Day/Time]

[View Full Plan] [Start Tomorrow]
```

---

## Acceptance Criteria

```gherkin
Scenario: Light mode view
  Given plan is generated
  When Light mode user views plan
  Then they see overview + Week 1 focus in <2 minutes

Scenario: Deep mode view
  Given plan is generated
  When Deep mode user views plan
  Then they see full 12-week breakdown with rationale

Scenario: Plan adjustment
  Given user adjusts plan parameters
  When they tap "Save Adjustments"
  Then AI validates and applies changes (or explains why not)

Scenario: Override AI recommendation
  Given user overrides AI recommendation
  When they confirm override
  Then change is applied with acknowledgment

Scenario: Start Week 1
  Given plan review is complete
  When user taps "Start Week 1"
  Then welcome experience guides them to active coaching

Scenario: First check-in delivery
  Given onboarding completes
  When next day arrives
  Then first check-in is delivered per preferences
```

---

## Success Metrics

- Plan Acceptance Rate: 90%+
- Week 1 Completion: 80%+
- Plan Relevance Score: 4.8/5
- Adjustment Rate: 20-30% (healthy engagement)
- First Milestone Achievement: 70%+

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s view load | Plan encrypted | - | Clear layout | All devices |
| - | - | - | Adjustable text | |

---

## Dependencies

- **Prerequisite Stories:** S01.6.1 (plan generated)
- **Related Stories:** None (final story in Epic)
- **External Dependencies:** None

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User rejects plan entirely | Offer to regenerate with different approach |
| All adjustments create unsafe plan | Block save, explain minimum requirements |
| User wants to restart onboarding | Allow from settings, warn data will reset |
| Plan save fails | Retry, cache locally if needed |

---

## Open Questions

- Plan sharing with accountability partner?

---

## Definition of Done

- [ ] Light mode view implemented
- [ ] Deep mode view with full 12-week breakdown
- [ ] Plan adjustment interface working
- [ ] AI validation of adjustments
- [ ] Week 1 action plan clearly displayed
- [ ] Welcome experience transitions to active coaching
- [ ] First check-in delivered next day
- [ ] Plan accessible from app dashboard

---

*Story S01.6.2 | Epic E01 | Product: yHealth Platform*
