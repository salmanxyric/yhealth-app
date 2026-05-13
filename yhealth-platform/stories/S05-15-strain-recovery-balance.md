---
type: story
id: S05.6.2
title: Strain-Recovery Balance
epic: E05
feature: F5.6
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As a** user,
**I want to** understand if my training load matches my recovery capacity,
**So that** I can train optimally without overreaching or undertraining.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The strain-recovery balance shows users whether their training load is appropriate for their recovery capacity. This prevents overtraining (too much strain vs. recovery) and undertraining (wasting recovery potential).

**Strain-Recovery Ratio:**
```
Weekly Strain ÷ (Weekly Average Recovery × Factor) = Ratio

Healthy Balance Ranges:
- Ratio ~1.0: Balanced (training matches recovery)
- Ratio >1.5: Overreaching (reduce load or improve recovery)
- Ratio <0.5: Undertraining (can push more if goals warrant)
```

**Recommended Strain Ranges by Goal:**
| Goal | Weekly Strain Target | Description |
|------|---------------------|-------------|
| Maintenance | 40-60 | Maintain current fitness |
| Progressive Training | 60-80 | Gradual improvement |
| Peak Performance | 80-100+ | Short-term max effort |
| Recovery Week | 0-40 | Deload period |

**Balance Visualization:**
- Visual gauge showing current position
- Green zone: Balanced
- Yellow zone: Approaching overreach
- Red zone: Overtraining risk

**Balance Insights:**
- "Your strain is 20% higher than your recovery supports. Consider a lighter day."
- "You have recovery capacity available. Today is a good day to push."
- "Great balance this week! You're training optimally for your recovery."

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Simple balance indicator (Balanced/Over/Under) with one-line guidance |
| **Deep** | Detailed ratio, weekly trend chart, strain vs. recovery overlay, goal-specific targets |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Weekly Strain | Float | Calculated | User-only |
| Weekly Avg Recovery | Float | Calculated | User-only |
| Balance Ratio | Float | Calculated | User-only |
| Balance Status | Enum | Over/Under/Balanced | User-only |
| User Goal | Enum | Maintenance/Progressive/Peak/Recovery | User-only |

**Behaviors:**
- Balance calculates daily as new strain/recovery data arrives
- Ratio compared against user's current goal
- Insights generated based on balance status
- Balance feeds into workout recommendations (reduce if overreaching)

### Acceptance Criteria

**AC1: Balance Ratio Calculation**
Given weekly strain and recovery data available,
When balance calculates,
Then ratio = Weekly Strain ÷ (Weekly Avg Recovery × Factor).

**AC2: Balance Status Classification**
Given balance ratio calculated,
When displaying status,
Then: >1.5 = "Overreaching", <0.5 = "Undertraining", 0.5-1.5 = "Balanced".

**AC3: Goal-Specific Targets**
Given user has selected training goal,
When viewing balance,
Then recommended strain range for that goal displays.

**AC4: Balance Visualization**
Given balance data available,
When viewing strain section,
Then visual gauge shows current position with green/yellow/red zones.

**AC5: Balance Insight Generation**
Given balance status determined,
When displaying balance,
Then actionable insight displays (e.g., "Consider a lighter day").

**AC6: Light Mode Display**
Given user is in Light mode,
When viewing balance,
Then simple indicator (Balanced/Over/Under) with one-line guidance shows.

**AC7: Deep Mode Analysis**
Given user is in Deep mode,
When viewing balance,
Then detailed ratio, weekly trend, strain vs. recovery overlay displays.

### Success Metrics
- Optimal strain adherence: 70% of users maintain strain within recommended range
- Strain-recovery balance achievement: 80% of users achieve ~1:1 ratio weekly
- Overtraining prevention: 60% reduction in user-reported overtraining symptoms

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Balance calc <1s | Auth required | Balance data user-only | Color-blind safe gauge | iOS 14+, Android 10+ |
| Update on new data | Encrypted storage | No external sharing | Plain language insights | All screen sizes |

### Dependencies
- **Prerequisite Stories:** S05.6.1 (Strain Calculation), S05.3.1 (Recovery Scores)
- **Related Stories:** S05.6.3 (Alerts), S05.5.1 (Workout recommendations)
- **External Dependencies:** None

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No recovery data | Show strain only; prompt: "Add recovery tracking for balance analysis" |
| Very low strain week | Note as "Recovery week pattern" not necessarily undertraining |
| High strain + high recovery | Show as balanced; "Your body is handling the load well" |
| Sudden strain spike | Flag: "Big increase this week. Make sure to support with recovery." |
| Goal not set | Default to "General Health" balance targets |

### Open Questions
- Should we show historical balance trends (how balanced were you last month)?
- Should balance warnings be more aggressive for injury prevention?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Balance ratio calculation correct
- [ ] Status classification working
- [ ] Goal-specific targets displaying
- [ ] Visual gauge functional
- [ ] Light and Deep modes operational

