---
type: story
id: S07.5.2
title: Multi-Signal Stress Detection
epic: E07
epic_name: Wellbeing Pillar
feature: F7.5
feature_name: Stress Pattern Detection
product: yhealth-platform
priority: P0
status: Draft
story_points: 0
created: 2025-12-24
---

# S07.5.2: Multi-Signal Stress Detection


### User Story
**As a** Holistic Health Seeker (P1),
**I want to** have stress detected from multiple signals including biometrics, journaling sentiment, and app usage patterns,
**So that** I can understand my stress levels even when I don't consciously recognize or report them.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Multi-signal stress detection is yHealth's KEY DIFFERENTIATOR. By combining self-report with biometric cues, text sentiment analysis, and app usage patterns, yHealth detects stress that users may not consciously recognize. This enables proactive interventions before stress escalates.

**Four Signal Sources:**

| Signal | Source | Detection Method |
|--------|--------|------------------|
| **Self-Report** | S07.5.1 | User's 1-10 stress rating |
| **Biometric** | E9 (Wearables) | HRV (below baseline), elevated RHR |
| **Text Sentiment** | S07.2.2 (Journal) | Negative sentiment, stress keywords |
| **App Usage Patterns** | System | Reduced engagement, missed check-ins |

**Biometric Stress Indicators:**
| Metric | Stress Indicator | Detection |
|--------|-----------------|-----------|
| HRV | Below 30-day baseline | Low HRV = higher stress |
| RHR | Above 30-day baseline | Elevated RHR = potential stress |
| Sleep Disruption | Quality <60/100 | Poor sleep correlates with stress |
| Wake-ups | >5 per night | Sleep fragmentation = stress |

**Text Sentiment Analysis:**
- Negative sentiment keywords: "overwhelmed," "anxious," "stressed," "can't cope," "too much," "struggling"
- Tone shift detection: Sudden change from positive to negative journaling
- Sentiment scoring: -1 (very negative) to +1 (very positive)

**App Usage Pattern Detection:**
| Pattern | Stress Signal |
|---------|---------------|
| Missed check-ins (3+ days) | May indicate overwhelm or avoidance |
| Irregular logging patterns | Life disruption indicator |
| Decreased engagement | Possible stress/overwhelm |
| Increased mood logging | Awareness of emotional shift |

**Multi-Signal Aggregation Algorithm:**

```
Stress Score Calculation (0-10 Scale):

Base Score: Self-reported stress (if available)

Biometric Adjustments (if wearable connected):
- Low HRV (below baseline): +1 to +3 points
- Elevated RHR (above baseline): +1 to +2 points
- Poor sleep quality (<60): +1 point
- Sleep disruption (>5 wake-ups): +1 point

Text Sentiment Adjustments (if journaling):
- Negative sentiment: +1 to +2 points
- Stress keywords detected: +1 point per occurrence (max +3)
- Tone shift (positive → negative): +1 point

Behavioral Adjustments:
- Missed check-ins (3+ days): +1 point
- Irregular logging: +0.5 points
- Decreased engagement: +0.5 points

Final Stress Score = Base + Adjustments (capped at 10)
```

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Self-Report Score | Integer 1-10 | From S07.5.1 | User-only |
| Biometric Score | Float 0-10 | If wearable connected | System |
| Sentiment Score | Float 0-10 | From journal analysis | System |
| Behavioral Score | Float 0-10 | From usage patterns | System |
| Final Stress Score | Float 0-10 | Aggregated | User-only |
| Signals Used | Array<Enum> | Which signals contributed | System |
| Timestamp | ISO 8601 | Required | System |

**Behaviors:**
- Stress score calculates daily (end of day)
- If no self-report, use other signals only
- Surface discrepancy when biometric stress ≠ self-report
- Notify user when multi-signal stress detected without self-report

### Acceptance Criteria

**AC1: Self-Report Only Score**
Given the user logged stress but has no wearable/journal,
When stress score calculates,
Then self-report is the primary score (100% weight).

**AC2: Biometric Signal Integration**
Given the user has a connected wearable with HRV/RHR data,
When biometric data shows stress indicators,
Then biometric adjustments are added to base score.

**AC3: Sentiment Signal Integration**
Given the user journaled today,
When journal text is analyzed,
Then sentiment adjustments are applied based on tone and keywords.

**AC4: Behavioral Signal Integration**
Given the user's app engagement has decreased,
When behavioral patterns are analyzed,
Then behavioral adjustments are applied.

**AC5: Multi-Signal Aggregation**
Given all 4 signals are available,
When stress score calculates,
Then all signals are combined per algorithm (capped at 10).

**AC6: Stress Detected Without Self-Report**
Given biometric and sentiment signals indicate stress (≥7),
When the user has not self-reported stress,
Then prompt appears: "I'm noticing some stress signals. How are you really feeling?"

**AC7: Signal Discrepancy Alert**
Given self-report is low (3) but biometrics show high stress,
When scores are compared,
Then insight surfaces: "You said stress is low, but your body shows tension. Explore this?"

**AC8: Minimum Signal Requirement**
Given only 1 signal is available (e.g., self-report only),
When stress score calculates,
Then that single signal determines the score.

### Success Metrics
- Multi-signal stress detection: 60% of users receive stress insights from non-self-report signals
- Stress detection accuracy: 70% user agreement when AI flags stress
- Proactive alerts: 50% receive stress pattern alerts before self-reporting high stress
- Signal utilization: 80% of users with wearables have biometric signals contributing

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Score calculation <3s | Auth required | Analysis results user-only | Screen reader support | iOS 14+, Android 10+ |
| Daily calculation | Encrypted | Raw signals not stored long-term | N/A | Requires E9 for biometrics |

### Dependencies
- **Prerequisite Stories:** S07.5.1 (Self-Report), S07.2.2 (Journal Entry - for sentiment)
- **Related Stories:** S07.5.3
- **External Dependencies:** E9 (HRV, RHR from wearables), E8 (Sentiment analysis engine)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| No wearable connected (biometrics unavailable) | Use remaining 3 signals |
| No journal entries (sentiment unavailable) | Use remaining signals |
| Conflicting signals (high self-report, low biometrics) | Note discrepancy; use average or higher |
| All signals unavailable | Cannot calculate multi-signal score; prompt for data |
| User busy, not using app (could be stressed OR just busy) | Behavioral signal = +1 max; validate with check-in |

### Open Questions
- Should we weight signals differently (e.g., self-report as primary)?
- How should we handle weekend vs weekday behavioral patterns?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Self-report integration functional
- [ ] Biometric signals (HRV, RHR) contributing when available
- [ ] Sentiment analysis from journal entries working
- [ ] Behavioral pattern detection functional
- [ ] Multi-signal aggregation algorithm implemented
- [ ] Discrepancy alerts surfacing
- [ ] Performance requirements verified

---