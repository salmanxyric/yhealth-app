---
type: story
id: S05.3.2
title: Recovery-Based Recommendations
epic: E05
feature: F5.3
product: yhealth-platform
priority: P0
status: Draft
---

# S05.3.2: Recovery-Based Recommendations

## User Story
**As a** user,
**I want to** receive actionable guidance based on my dual recovery scores,
**So that** I know what type of activity suits today without second-guessing my body or mind state.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
Based on the combination of Physical and Mental Recovery scores, the system provides personalized daily guidance. This goes beyond simple "recovered/not recovered" by accounting for the nuanced states where body and mind may disagree.

**Score Combination Recommendations:**

| Physical | Mental | Recommendation |
|----------|--------|----------------|
| High (80+) | High (80+) | "Great day for intense training! Your body and mind are both ready for a challenge." |
| High (80+) | Low (<50) | "Light activity recommended - your body is recovered but your mind needs rest. Try gentle yoga or a walk." |
| Low (<50) | High (80+) | "Focus on mobility and stretching today - your mind is sharp but your body needs recovery." |
| Low (<50) | Low (<50) | "Full rest day recommended. Both your body and mind need recovery. Take it easy!" |
| Medium (50-79) | Medium (50-79) | "Moderate activity is appropriate today. Listen to your body and don't push too hard." |
| High (80+) | Medium (50-79) | "Good day for training, but consider a moderate session rather than max effort." |
| Medium (50-79) | High (80+) | "Your mind is ready for a workout, but keep intensity moderate to support physical recovery." |
| Medium (50-79) | Low (<50) | "Easy movement recommended - a light walk or gentle stretching would be ideal." |
| Low (<50) | Medium (50-79) | "Active recovery day - light mobility work will help without adding stress." |

**Recommendation Delivery:**
- Dashboard card with daily recommendation
- Push notification in morning (if enabled)
- WhatsApp message option (via E3)
- Voice coaching query: "How's my recovery today?" (via E2)

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Physical Score | Integer 0-100 | Required | User-only |
| Mental Score | Integer 0-100 | Required | User-only |
| Recommendation Type | Enum | From matrix | System |
| Recommendation Text | String | Generated | User-only |
| User Followed | Boolean | Post-activity check | Aggregated |

**Behaviors:**
- Recommendation generates after both scores calculate
- Recommendation updates if scores change (e.g., mood logged later)
- Feeds into workout recommendation engine (S05.5.1)
- User can override recommendation (logged for learning)

## Acceptance Criteria

**AC1: Both High Recommendation**
Given Physical ≥80 AND Mental ≥80,
When recommendation generates,
Then message indicates "great day for intense training."

**AC2: Physical High, Mental Low**
Given Physical ≥80 AND Mental <50,
When recommendation generates,
Then message recommends "light activity - mind needs rest" (e.g., yoga, walking).

**AC3: Physical Low, Mental High**
Given Physical <50 AND Mental ≥80,
When recommendation generates,
Then message recommends "mobility and stretching - body needs rest."

**AC4: Both Low Recommendation**
Given Physical <50 AND Mental <50,
When recommendation generates,
Then message recommends "full rest day."

**AC5: Dashboard Display**
Given a recommendation has generated,
When the user views the dashboard,
Then the recommendation displays as a prominent card.

**AC6: Multi-Channel Delivery**
Given push notifications are enabled,
When the morning recommendation generates,
Then a push notification delivers the recommendation.

**AC7: Recommendation Update**
Given scores change after initial recommendation (e.g., mood logged later),
When the system detects score change,
Then the recommendation updates to reflect new scores.

## Success Metrics
- 75% user agreement with recommendations (post-workout survey)
- 70% of users adjust workouts based on recovery recommendations
- 50% reduction in user-reported burnout vs. baseline

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Recommendation <1s | Encrypted delivery | Recommendations user-only | Plain language | iOS 14+, Android 10+ |
| Update <2s on score change | Auth for push | No sharing without consent | Screen reader friendly | Multi-channel support |

## Dependencies
- **Prerequisite Stories:** S05.3.1 (Dual Recovery Score Engine)
- **Related Stories:** S05.5.1 (Workout Engine uses recommendations)
- **External Dependencies:** E2 (Voice), E3 (WhatsApp), E4 (Mobile App)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Only physical score available | Provide physical-only recommendation with note: "Add mood for complete picture" |
| Scores are borderline (e.g., 79 physical, 81 mental) | Use category boundaries strictly; consider neighboring recommendations |
| User consistently ignores recommendations | Adapt messaging tone; don't nag excessively |
| Recommendation conflicts with scheduled workout | Show both; let user decide: "Recovery suggests rest, but you have a workout scheduled. How do you want to proceed?" |

## Open Questions
- Should recommendations account for user's planned activity (from calendar)?
- How should we handle users who always want to train regardless of recovery?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] All 9 score combinations handled
- [ ] Dashboard recommendation card functional
- [ ] Push notification delivery working
- [ ] Multi-channel integration tested
- [ ] Recommendation update on score change
