---
type: story
id: S06.2.2
title: Personalized Targets & Dynamic Adjustment
epic: E06
feature: F6.2
product: yhealth-platform
priority: P0
status: Draft
---

# Personalized Targets & Dynamic Adjustment

### User Story
**As an** Optimization Enthusiast (P3),
**I want to** have personalized calorie/macro targets that adjust based on my activity level,
**So that** my nutrition supports my fitness goals whether it's a rest day or intense training day.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The system calculates personalized daily calorie and macro targets based on user goals, biometrics, and activity level. Targets automatically adjust on high-activity days and recalculate weekly based on progress.

**Target Calculation Inputs:**
1. **User Goals:** Weight loss, maintenance, muscle gain, performance
2. **Biometric Data:** Age, weight, height, gender (from onboarding)
3. **Activity Level:** Sedentary, lightly active, moderately active, very active, athlete
4. **Activity Data:** Daily calories burned from Fitness Pillar (E5)
5. **Progress Data:** Weight trends, adherence patterns

**TDEE (Total Daily Energy Expenditure) Calculation:**
- BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
- Activity multiplier based on activity level
- Dynamic adjustment from wearable/fitness data

**Goal-Based Adjustments:**
| Goal | Calorie Adjustment | Macro Split (P/C/F) |
|------|-------------------|---------------------|
| Weight Loss | -500 kcal deficit | 30% / 40% / 30% |
| Muscle Gain | +300 kcal surplus | 35% / 45% / 20% |
| Maintenance | TDEE | 30% / 40% / 30% |
| Performance | TDEE | 30% / 45% / 25% |
| Body Recomp | -200 kcal deficit | 35% / 35% / 30% |

**Dynamic Adjustments:**
- **High Activity Day:** Increase carb target based on workout intensity (from E5)
- **Rest Day:** Slight calorie reduction if body recomposition goal
- **Missed Meals:** Redistribute remaining macros across remaining meals
- **Weekly Recalculation:** Adjust based on weight trends and adherence

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | System calculates targets automatically. User sees simple "2,100 kcal today" with no manual adjustment needed. |
| **Deep** | User can view calculation breakdown, manually override any target, set custom macro percentages, and see how activity affects daily targets. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Goal Type | Enum | Required | User-only |
| Target Calories | Integer | Calculated or manual | User-only |
| Target Protein % | Float | 0-100%, sum to 100% | User-only |
| Target Carbs % | Float | 0-100%, sum to 100% | User-only |
| Target Fats % | Float | 0-100%, sum to 100% | User-only |
| Activity Adjustment | Integer | From E5 | System |

**Behaviors:**
- Targets calculated during onboarding
- Dashboard shows today's targets (may differ from base)
- Activity data from E5 automatically adjusts targets
- Manual overrides persist until changed
- Weekly summary shows target vs. actual trends

### Acceptance Criteria

**AC1: Initial Target Calculation**
Given a user completes onboarding with goal, biometrics, and activity level,
When targets are calculated,
Then personalized calorie and macro targets are set based on TDEE and goal adjustments.

**AC2: Activity-Based Adjustment**
Given a user has an intense workout day (high strain from E5),
When the system calculates daily targets,
Then calorie target increases by 200-500 kcal and carb target increases proportionally.

**AC3: Rest Day Adjustment**
Given a user has a body recomposition goal and a rest day,
When the system calculates daily targets,
Then calorie target decreases slightly (-100-200 kcal) compared to base.

**AC4: Manual Override (Deep Mode)**
Given a user is in Deep mode,
When they tap to edit targets,
Then they can manually set calorie target and macro percentages (with validation that percentages sum to 100%).

**AC5: Weekly Recalculation**
Given a user has 7+ days of tracking data,
When the weekly recalculation runs,
Then targets adjust based on weight trend and adherence (e.g., if losing faster than target, increase calories slightly).

**AC6: Missing Biometric Data**
Given a user hasn't entered weight or height,
When targets are requested,
Then safe defaults are used (2,000 kcal) and user is prompted to complete profile for personalized targets.

**AC7: Cross-Pillar Integration**
Given activity data is available from Fitness Pillar (E5),
When daily targets are calculated,
Then E5 calorie burn data is factored into the day's targets.

**AC8: Target Display**
Given targets are calculated,
When user views the macro dashboard,
Then today's targets (base + adjustments) are clearly displayed with breakdown available.

### Success Metrics
- Target calculation accuracy: 95%+ use correct TDEE formula
- Dynamic adjustment activation: 80% of high-activity days trigger adjustment
- Manual override usage: <20% (indicates auto-calculation is accurate)
- Weekly adherence: 70% of users meet targets 5+ days/week

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s target calculation | Biometric data encrypted | Weight data highly private | Clear target display | iOS 14+, Android 10+ |
| Real-time activity adjustment | No external sharing | No fitness data shared | Numeric accessibility | E5 integration required |

### Dependencies
- **Prerequisite Stories:** S06.0.1, S06.2.1
- **Related Stories:** S06.4.1, S06.5.1
- **External Dependencies:** E5 (Fitness Pillar - activity data for dynamic adjustment)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Macro percentages don't sum to 100% | Validation error: "Percentages must equal 100%. Currently: X%" |
| Extremely low calorie target (<1200) | Warning: "This target is below recommended minimum. Consider consulting a professional." |
| Extremely high calorie target (>5000) | Allow but verify: "This is a high target. Is this correct?" |
| No activity data from E5 | Use base targets without dynamic adjustment, note in UI |
| Rapid weight change detected | Alert user, suggest reviewing targets, don't auto-adjust dramatically |
| User changes goal mid-week | Recalculate immediately, apply new targets from today |
| E5 sync delayed | Use yesterday's activity pattern as estimate |

### Open Questions
- Should we show the math/formula to users in Deep mode?
- How aggressive should weekly recalculation be?
- Should we suggest target changes or auto-apply them?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] TDEE calculation implemented correctly
- [ ] Goal-based adjustments working
- [ ] Dynamic activity adjustment from E5 working
- [ ] Manual override (Deep mode) functional
- [ ] Weekly recalculation logic implemented
- [ ] Validation for edge cases (low calories, etc.)