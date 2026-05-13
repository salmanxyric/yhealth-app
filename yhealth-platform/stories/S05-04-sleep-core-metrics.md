---
type: story
id: S05.2.1
title: Sleep Core Metrics & Stage Tracking
epic: E05
feature: F5.2
product: yhealth-platform
priority: P0
status: Draft
---

# S05.2.1: Sleep Core Metrics & Stage Tracking

## User Story
**As an** Optimization Enthusiast (P3),
**I want to** track my sleep quality and see detailed sleep stage breakdowns,
**So that** I can understand my rest patterns and identify areas for improvement.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
Sleep data imports automatically from connected wearables. Users see their sleep duration, quality score, and stage breakdown. This provides feature parity with WHOOP/Oura for core sleep metrics while setting the foundation for yHealth's cross-pillar differentiation.

**Sleep Metrics Displayed:**
- **Total Sleep Time:** Hours and minutes of actual sleep
- **Sleep Quality Score:** 0-100 composite score
- **Sleep Stages:** Wake, Light, Deep, REM (time in each)
- **Sleep Efficiency:** Time asleep / time in bed
- **Sleep Onset Latency:** Time to fall asleep (if available)
- **Wake Events:** Number of times woken during night

**Sleep Quality Score Calculation:**
```
Sleep Quality Score (0-100) = Weighted average of:
- Sleep Duration vs. goal (30%)
- Deep Sleep % (25%)
- REM Sleep % (25%)
- Sleep Efficiency (10%)
- Wake Events penalty (10%)
```

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Sleep duration, quality score (0-100), simple "Good/Fair/Poor" rating. One-line insight: "7h 30min sleep, Quality: Good (85/100)". |
| **Deep** | Detailed sleep stages breakdown, time in each stage, sleep onset latency, wake-ups, HRV during sleep (if available), historical trends, sleep consistency score. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Sleep Start | ISO 8601 | Required | User-only |
| Sleep End | ISO 8601 | Required | User-only |
| Total Sleep Min | Integer | 0-840 range | User-only |
| Quality Score | Integer 0-100 | Calculated | User-only |
| Stage Wake Min | Integer | 0-480 range | User-only |
| Stage Light Min | Integer | 0-480 range | User-only |
| Stage Deep Min | Integer | 0-480 range | User-only |
| Stage REM Min | Integer | 0-480 range | User-only |
| HRV Avg | Integer ms | 0-200 range | User-only |
| Source Device | Enum | From connected devices | System |

**Behaviors:**
- Sleep data syncs automatically from connected wearables
- Quality score calculates after each sleep record imports
- Sleep stages normalized across different wearable formats
- Manual sleep entry available as fallback
- Sleep data feeds into Recovery Score calculation (S05.3.1)

## Acceptance Criteria

**AC1: Sleep Data Import**
Given the user has a connected wearable with sleep tracking,
When sleep data syncs,
Then total sleep time, sleep stages, and quality score display in yHealth.

**AC2: Sleep Quality Score**
Given sleep data is available,
When the quality score calculates,
Then a 0-100 score displays based on duration, stages, efficiency, and wake events.

**AC3: Stage Normalization**
Given sleep stage data arrives from different wearable formats,
When normalization applies,
Then all stages map to yHealth standard: Wake, Light, Deep, REM.

**AC4: Light Mode Display**
Given the user is in Light mode,
When viewing sleep data,
Then a simple summary shows: "7h 30min sleep, Quality: Good (85/100)".

**AC5: Deep Mode Display**
Given the user is in Deep mode,
When viewing sleep data,
Then detailed stage breakdown, HRV during sleep, and efficiency metrics display.

**AC6: Manual Sleep Entry**
Given the user's wearable doesn't track sleep or data is missing,
When they access manual sleep entry,
Then they can enter: bedtime, wake time, and subjective quality rating (1-10).

**AC7: Multi-Source Sleep Data**
Given multiple devices track sleep,
When data conflicts occur,
Then golden source hierarchy applies (WHOOP > Oura > Apple Watch > Fitbit).

## Success Metrics
- Sleep data sync success rate >95% for wearable users
- Sleep stage normalization accuracy 100%
- Manual sleep entry usage <10% (wearable-first working)

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Sync <15min | Encrypted at rest | Sleep data user-only | Color-blind safe stages | 8+ sleep data sources |
| Load <3s | Auth required | No sharing without consent | Screen reader labels | iOS 14+, Android 10+ |

## Dependencies
- **Prerequisite Stories:** S05.0.1 (Wearable Infrastructure)
- **Related Stories:** S05.2.2, S05.3.1 (Recovery uses sleep quality)
- **External Dependencies:** E9 (Data Integrations), E4 (Mobile App UI)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Missing sleep data >48h | Prompt manual entry: "We haven't tracked your sleep in 2 days. Add it manually?" |
| Sleep stages unavailable from device | Show duration/quality only: "Sleep tracked! Detailed stages unavailable from your device." |
| Unrealistic sleep (>14h or <1h) | Flag for confirmation: "Sleep duration seems unusual. Is this correct?" |
| Nap detected (short sleep <3h) | Categorize as nap, don't replace main sleep record |
| Multiple sleep records same day | Show all records (main sleep + naps) |

## Open Questions
- Should we detect and score naps separately from main sleep?
- How should we handle sleep data from users who work night shifts?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] Sleep data imports from 8+ sources
- [ ] Stage normalization working for all sources
- [ ] Quality score calculation accurate
- [ ] Light and Deep modes render correctly
- [ ] Manual entry fallback functional
