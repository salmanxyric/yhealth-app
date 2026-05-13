---
type: story
id: S05.3.1
title: Dual Recovery Score Engine
epic: E05
feature: F5.3
product: yhealth-platform
priority: P0
status: Draft
---

# S05.3.1: Dual Recovery Score Engine

## User Story
**As a** Holistic Health Seeker (P1),
**I want to** know if my body AND mind are ready for intense activity,
**So that** I can make informed decisions about workout intensity and rest without overtraining or burning out mentally.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
This is yHealth's PRIMARY DIFFERENTIATOR. While WHOOP and BEVEL track only physiological recovery, yHealth uniquely provides TWO SEPARATE SCORES: Physical Recovery and Mental Recovery. Both are displayed independently with color coding, enabling targeted recommendations that account for the whole person.

**Dual Recovery Score Display:**
- **Physical Recovery Score:** 0-100 (body readiness)
- **Mental Recovery Score:** 0-100 (mind readiness)
- **Color Coding:** Green (80-100), Yellow (50-79), Red (0-49)
- Both scores displayed prominently on dashboard and fitness tab

**Physical Recovery Score Calculation:**
```
Physical Recovery Score (0-100) = Weighted Average:
- HRV vs. 30-day baseline (40%)
- Resting Heart Rate vs. 30-day baseline (30%)
- Sleep Quality Score from S05.2.1 (20%)
- Sleep Duration vs. user's goal (10%)

Scoring:
- Metric above baseline = bonus points
- Metric below baseline = penalty points
- Normalized to 0-100 scale
```

**Mental Recovery Score Calculation:**
```
Mental Recovery Score (0-100) = Weighted Average:
- Morning Mood Rating 1-10 (40%) - from E7 Wellbeing
- Stress Level 1-10 inverted (30%) - from E7 Wellbeing
- Energy Level 1-10 (20%) - from E7 Wellbeing
- Journaling Completion bonus (10%) - from E7 Wellbeing

Scoring:
- Mood 8+ = 80-100 range
- Stress <4 = 80-100 range
- Energy 8+ = 80-100 range
- Journaling completed = +10 bonus
```

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Two scores with color coding (Physical: 85/Green, Mental: 72/Yellow) and one-line summary: "Body ready, mind needs some care." |
| **Deep** | Detailed breakdown of each score component, individual metric values, trend over time, component contribution visualization. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Physical Score | Integer 0-100 | Calculated | User-only |
| Mental Score | Integer 0-100 | Calculated | User-only |
| HRV Value | Integer ms | From wearable | User-only |
| HRV Baseline | Float ms | 30-day rolling | User-only |
| RHR Value | Integer BPM | From wearable | User-only |
| RHR Baseline | Float BPM | 30-day rolling | User-only |
| Mood Rating | Integer 1-10 | From E7 | User-only |
| Stress Level | Integer 1-10 | From E7 | User-only |
| Energy Level | Integer 1-10 | From E7 | User-only |
| Journaling Done | Boolean | From E7 | User-only |
| Calculation Time | ISO 8601 | Required | System |

**Behaviors:**
- Scores calculate daily, typically in morning after sleep data syncs
- Partial scores generate when some data missing (with disclaimer)
- Baseline builds over 7-14 days for new users
- Scores update if new data arrives (mood logged later, etc.)
- Scores feed into workout recommendations (S05.5.1)

## Acceptance Criteria

**AC1: Physical Recovery Calculation**
Given HRV, RHR, and sleep data are available,
When physical recovery score calculates,
Then a 0-100 score generates using: HRV (40%), RHR (30%), Sleep Quality (20%), Sleep Duration (10%).

**AC2: Mental Recovery Calculation**
Given mood, stress, energy data are available from E7,
When mental recovery score calculates,
Then a 0-100 score generates using: Mood (40%), Stress (30%), Energy (20%), Journaling (10%).

**AC3: Dual Score Display**
Given both recovery scores have calculated,
When the user views the fitness dashboard,
Then both Physical and Mental scores display with independent color coding.

**AC4: Color Coding**
Given a recovery score value,
When displayed,
Then color is: Green (80-100), Yellow (50-79), Red (0-49).

**AC5: Partial Score with Disclaimer**
Given some recovery data is missing (e.g., no mood rating),
When score calculates,
Then a partial score displays with disclaimer: "Recovery estimate based on limited data. Add [missing metric] for accuracy."

**AC6: New User Baseline**
Given a user has <7 days of HRV/RHR data,
When physical recovery calculates,
Then population averages are used with caveat: "Building your baseline. Scores will improve accuracy in 7-14 days."

**AC7: Light Mode Summary**
Given both scores are calculated,
When user is in Light mode,
Then a one-line summary displays: e.g., "Body ready, mind needs some care."

**AC8: Deep Mode Component Breakdown**
Given user is in Deep mode,
When viewing recovery details,
Then individual components (HRV, RHR, Sleep, Mood, etc.) display with their values and contribution to score.

## Success Metrics
- Recovery score accuracy: 75% user agreement with recommendations
- Dual score differentiation: 80% of users report value of mental recovery tracking
- Baseline establishment: 90% of users have personalized baseline within 14 days

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Score calculation <2s | All inputs encrypted | Recovery data user-only | Color-blind safe indicators | iOS 14+, Android 10+ |
| Real-time updates | Cross-pillar data secured | No external sharing | Screen reader announces score | Wearable + E7 required |

## Dependencies
- **Prerequisite Stories:** S05.2.1 (Sleep data for physical score)
- **Related Stories:** S05.3.2, S05.3.3, S05.5.1
- **External Dependencies:** E7 (Wellbeing - mood, stress, energy, journaling data)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No HRV data (device doesn't support) | Calculate physical score without HRV; redistribute weights |
| No E7 data (user hasn't logged mood) | Physical score only; prompt: "Add mood check-in for complete recovery picture" |
| HRV very high but mood very low | Show both scores independently; mental takes precedence for recommendations |
| Score calculation failure | Show last valid score with timestamp: "Using yesterday's recovery score. Recalculating..." |
| First day (no baseline) | Show provisional score with clear "building baseline" message |

## Open Questions
- Should we show a combined "Total Recovery" score alongside the two individual scores?
- How should we weight the scores when one data source is consistently missing?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] Physical score calculation accurate per formula
- [ ] Mental score calculation accurate per formula
- [ ] Dual display with independent color coding
- [ ] Partial score handling with disclaimers
- [ ] Baseline building logic functional
- [ ] Integration with E7 wellbeing data verified
