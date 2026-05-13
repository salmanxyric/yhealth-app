---
type: story
id: S05.6.1
title: yHealth Strain Score Calculation
epic: E05
feature: F5.6
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As an** Optimization Enthusiast (P3),
**I want to** understand my training load for each workout and day,
**So that** I can optimize my workout distribution and avoid overtraining without needing expensive wearables.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The yHealth Strain Score (0-100) measures training load for each activity and aggregates into daily/weekly totals. Unlike WHOOP, yHealth calculates strain using ANY available data source - making strain tracking accessible to all users, not just those with premium wearables.

**Three Calculation Methods:**

**Method A: HR-Based (Most Accurate - requires wearable HR data)**
```
1. Calculate average % of max HR during activity
2. Weight by activity duration
3. Apply activity type multiplier:
   - HIIT: 1.5x
   - Strength: 1.2x
   - Cardio: 1.0x
   - Yoga/Flexibility: 0.6x
   - Recovery: 0.3x
4. Normalize to 0-100 scale based on user baseline
```

**Method B: Duration + Type (Good - no HR required)**
```
1. Activity type baseline strain per hour:
   - HIIT: 15/hour
   - Strength: 12/hour
   - Cardio: 10/hour
   - Yoga: 5/hour
   - Recovery: 3/hour
2. Multiply by duration in hours
3. Adjust for user fitness level:
   - Beginner: +20%
   - Intermediate: 0%
   - Advanced: -10%
4. Normalize to 0-100 scale
```

**Method C: Perceived Effort (Basic - manual entry fallback)**
```
1. User rates effort 1-10
2. Multiply by duration in 10-minute increments
3. Convert to 0-100 scale
4. Less accurate but maintains tracking continuity
```

**Strain Aggregation:**
- **Daily Strain:** Sum of all activities that day
- **Weekly Strain:** 7-day rolling total
- **Activity Strain:** Individual activity contribution

**Strain Categories:**
| Range | Category | Description |
|-------|----------|-------------|
| 0-20 | Very Light | Recovery activities only |
| 21-40 | Light | Easy workouts, active recovery |
| 41-60 | Moderate | Typical training day |
| 61-80 | High | Challenging workout |
| 81-100+ | Very High | Peak effort, race day |

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Daily strain score (0-100) with color coding and simple guidance: "Today's strain: 65 (Moderate). You have capacity for more." |
| **Deep** | Detailed strain breakdown by activity, calculation method used, accuracy indicator, contribution chart. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Activity ID | UUID | Required | System |
| Strain Score | Float 0-100+ | Calculated | User-only |
| Calculation Method | Enum | A/B/C | System |
| HR Average | Integer BPM | If available | User-only |
| Duration Minutes | Integer | Required | User-only |
| Activity Type | Enum | Required | User-only |
| User Effort Rating | Integer 1-10 | If manual | User-only |
| Daily Total | Float | Calculated | User-only |
| Weekly Total | Float | Calculated | User-only |

**Behaviors:**
- Strain calculates immediately after activity data syncs or manual entry
- Method selection automatic based on available data (HR preferred)
- Daily and weekly totals update in real-time
- Strain feeds into recovery calculation and workout recommendations

### Acceptance Criteria

**AC1: HR-Based Calculation (Method A)**
Given activity has HR data from wearable,
When strain calculates,
Then Method A (most accurate) is used with HR zones and activity multiplier.

**AC2: Duration-Based Calculation (Method B)**
Given activity has no HR data but has type and duration,
When strain calculates,
Then Method B is used with activity baseline and fitness level adjustment.

**AC3: Perceived Effort Calculation (Method C)**
Given activity is manually entered with effort rating,
When strain calculates,
Then Method C is used with effort x duration formula.

**AC4: Daily Strain Total**
Given multiple activities in a day,
When viewing daily strain,
Then total equals sum of all activity strains.

**AC5: Weekly Strain Tracking**
Given 7+ days of activity data,
When viewing weekly strain,
Then 7-day rolling total displays.

**AC6: Light Mode Display**
Given user is in Light mode,
When viewing strain,
Then daily score with color coding and simple guidance displays.

**AC7: Deep Mode Breakdown**
Given user is in Deep mode,
When viewing strain,
Then activity-by-activity breakdown with calculation method and contribution % displays.

**AC8: Method Accuracy Indicator**
Given strain is calculated,
When displaying the score,
Then accuracy indicator shows: "High accuracy (HR-based)" or "Estimated (duration-based)" or "Approximate (perceived effort)".

### Success Metrics
- Strain accuracy vs. perceived effort: 75% correlation
- Method A usage: 60%+ for wearable-connected users
- Universal accessibility: 100% of users can track strain (regardless of device)

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Calculation <1s | Encrypted storage | Strain data user-only | Color-blind safe categories | Works without wearable |
| Real-time update | Auth required | No external sharing | Plain language guidance | All calculation methods |

### Dependencies
- **Prerequisite Stories:** S05.1.1 (Activity data source), S05.0.1 (Wearable infrastructure for HR)
- **Related Stories:** S05.6.2 (Strain-Recovery Balance), S05.6.3 (Alerts)
- **External Dependencies:** None (self-contained)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No HR and no perceived effort | Use Method B (duration + type only); note lower accuracy |
| Activity type unknown | Default to "Other" with 1.0x multiplier |
| Unrealistic strain spike | Flag for review: "This activity seems unusually intense. Confirm details?" |
| Very long activity (>3 hours) | Apply fatigue factor; don't scale linearly |
| Multiple activities same time | Merge if overlap >50%; otherwise keep separate |

### Open Questions
- Should we show users which calculation method was used?
- How should we handle sleep as "negative strain" (recovery)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All three calculation methods implemented
- [ ] Daily and weekly aggregation working
- [ ] Category thresholds applied correctly
- [ ] Light and Deep modes functional
- [ ] Accuracy indicators displaying

