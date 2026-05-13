---
type: story
id: S06.4.1
title: Nutrition Goal Setting & Templates
epic: E06
feature: F6.4
product: yhealth-platform
priority: P0
status: Draft
---

# Nutrition Goal Setting & Templates

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** set nutrition goals that align with my fitness and wellbeing objectives,
**So that** all three pillars work together toward my health transformation.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users select from pre-built goal templates or create custom goals that integrate with their fitness and wellbeing objectives. Goals determine daily calorie/macro targets and influence AI coaching recommendations.

**Pre-Built Goal Templates:**

| Template | Calorie Adjustment | Macro Split (P/C/F) | Focus |
|----------|-------------------|---------------------|-------|
| **Weight Loss** | -500 kcal deficit | 30% / 40% / 30% | High satiety (fiber, protein), sustainable pace |
| **Muscle Gain** | +300 kcal surplus | 35% / 45% / 20% | Protein timing, progressive overload support |
| **Performance** | Maintenance | 30% / 45% / 25% | Pre/post-workout nutrition, carb focus |
| **General Health** | Maintenance | 30% / 40% / 30% | Micronutrient diversity, Mediterranean principles |
| **Body Recomposition** | -200 kcal deficit | 35% / 35% / 30% | High protein, strength training alignment |

**Custom Goal Builder (Deep Mode):**
- Manual calorie target input
- Custom macro percentages (with validation: must sum to 100%)
- Micronutrient targets (e.g., 30g fiber, <2300mg sodium)
- Meal timing preferences (e.g., intermittent fasting 16:8)
- Dietary restrictions (allergies, vegetarian, vegan, halal, kosher)
- Cuisine preferences (Mediterranean, Asian, Middle Eastern, etc.)

**Goal Integration:**
- Goals sync with Fitness Pillar (E5) for activity-adjusted targets
- Goals influence AI coaching (E5.5) recommendations
- Goals feed into meal plan generation (S06.4.2)
- Progress tracked against goal criteria

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Select pre-built template → Answer 2-3 simple questions → Goal set. ~1 minute. |
| **Deep** | Review template details → Customize any parameter → Set micronutrient targets → Define meal timing → Full control. ~5-10 minutes. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Goal Type | Enum | From templates or "custom" | User-only |
| Target Calories | Integer | 800-6000 kcal | User-only |
| Protein % | Float | 10-60%, sum to 100% | User-only |
| Carbs % | Float | 10-60%, sum to 100% | User-only |
| Fats % | Float | 10-60%, sum to 100% | User-only |
| Restrictions | Array | Valid restriction types | User-only |
| Start Date | Date | Today or future | User-only |
| Target Duration | String | Optional end date | User-only |

**Behaviors:**
- Goals can be changed anytime
- Previous goals archived for comparison
- Changing goals triggers target recalculation
- Weekly check-ins review goal appropriateness
- AI may suggest goal adjustments based on progress

### Acceptance Criteria

**AC1: Template Selection**
Given a user is setting up nutrition goals,
When they view goal templates,
Then 5 pre-built templates are available with clear descriptions of each.

**AC2: Quick Goal Setup (Light Mode)**
Given a user selects a goal template in Light mode,
When they complete 2-3 simple questions (e.g., current weight, activity level),
Then the goal is set with calculated targets in under 1 minute.

**AC3: Custom Goal Builder (Deep Mode)**
Given a user wants custom goals in Deep mode,
When they access the goal builder,
Then they can set manual calorie targets, custom macro percentages, and dietary restrictions.

**AC4: Macro Validation**
Given a user enters custom macro percentages,
When percentages don't sum to 100%,
Then a validation error is shown: "Percentages must equal 100%. Currently: X%"

**AC5: Dietary Restrictions**
Given a user selects dietary restrictions (e.g., vegetarian, halal),
When the goal is saved,
Then restrictions are applied to meal plan generation and food recommendations.

**AC6: Goal Change**
Given a user has an active goal,
When they change to a different goal,
Then new targets are calculated immediately and old goal is archived.

**AC7: Cross-Pillar Integration**
Given a user sets a "Muscle Gain" goal,
When viewing the Fitness Pillar,
Then workout recommendations align with the nutrition goal (strength training emphasis).

**AC8: Goal Progress Tracking**
Given a user has an active goal,
When viewing the goals section,
Then progress toward goal (e.g., weight trend, adherence rate) is displayed.

### Success Metrics
- Goal setting adoption: 85% of users set a goal within first 7 days
- Template usage: 70% select pre-built template vs. custom
- Goal completion: 65% maintain goal for 30+ days
- Goal satisfaction: 4.5/5 rating for goal setting experience

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1 minute Light setup | Goal data encrypted | Goals private by default | Clear goal descriptions | iOS 14+, Android 10+ |
| Instant target calculation | No external goal sharing | Optional coach sharing | Large touch targets | E5 integration |

### Dependencies
- **Prerequisite Stories:** S06.2.2
- **Related Stories:** S06.4.2, S06.4.3, S06.5.1
- **External Dependencies:** E5 (Fitness - goal alignment), E8 (Cross-Domain Intelligence - goal recommendations)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Impossible macro combo (e.g., 200g protein on 1200 kcal) | Warning: "This protein target needs ~2200 kcal. Adjust calories or protein?" |
| Conflicting restrictions (e.g., vegan + high protein) | Suggest: "Vegan high-protein can be challenging. Here are plant protein sources." |
| User changes goal frequently | Note pattern, ask: "You've changed goals 3 times this month. Want help finding the right fit?" |
| Goal set but no meals logged | Reminder: "You set a goal but haven't logged meals. Start tracking!" |
| External goal change (e.g., doctor's advice) | Allow manual override with note field |

### Open Questions
- Should we support multiple simultaneous goals (e.g., weight loss + protein target)?
- How long to archive old goals?
- Should goals have recommended durations?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 5 pre-built templates available
- [ ] Quick setup (Light) in <1 minute
- [ ] Custom goal builder (Deep) functional
- [ ] Macro validation working
- [ ] Dietary restrictions applied
- [ ] Cross-pillar integration verified