---
type: story
id: S05.1.1
title: Activity Wearable Sync
epic: E05
feature: F5.1
product: yhealth-platform
priority: P0
status: Draft
---

# S05.1.1: Activity Wearable Sync

## User Story
**As a** Holistic Health Seeker (P1),
**I want to** automatically sync my activity data from my wearable device,
**So that** I can see my movement patterns and understand how physical activity connects to my energy levels and mood without manual effort.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
When a user has connected a wearable device, their activity data automatically syncs to yHealth. The user sees their daily steps, active minutes, heart rate data, and workout sessions without any manual intervention. This is the "wearable-first" approach - automatic tracking is the primary experience.

**Activity Data Synced:**
- **Steps:** Daily step count, hourly breakdown
- **Active Minutes:** Moderate-to-vigorous physical activity minutes
- **Heart Rate:** Average, max, resting, and zone distribution
- **Workout Sessions:** Detected workouts with type, duration, calories
- **Calories Burned:** Active calories (from movement) and total calories

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Daily step count, active minutes summary, simplified activity timeline. Quick glance at "Did I move enough today?" with yes/no feedback. |
| **Deep** | Detailed activity breakdown by hour, heart rate zones during activities, workout intensity analysis, movement patterns across weeks/months, export activity data. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Steps | Integer | 0-100,000 range | User-only |
| Active Minutes | Integer | 0-1440 range | User-only |
| Heart Rate Avg | Integer BPM | 30-250 range | User-only |
| Heart Rate Max | Integer BPM | 30-250 range | User-only |
| Heart Rate Zones | JSON object | 5 zones | User-only |
| Workout Type | Enum | From activity types | User-only |
| Workout Duration | Integer minutes | 1-720 range | User-only |
| Calories Active | Integer | 0-10,000 range | User-only |
| Source Device | Enum | From connected devices | System |
| Sync Timestamp | ISO 8601 | Required | System |

**Behaviors:**
- Activity data syncs automatically within 15 minutes of wearable sync
- Dashboard updates in real-time when new data arrives
- Tapping activity metrics navigates to detailed activity view
- Activity data feeds into holistic health score calculation
- Cross-pillar connections enabled: activity → energy correlation, mood-performance insights

## Acceptance Criteria

**AC1: Automatic Sync**
Given the user has a connected wearable with new activity data,
When the sync scheduler executes,
Then activity data appears in yHealth within 15 minutes.

**AC2: Daily Summary Display**
Given activity data has synced,
When the user views their fitness dashboard,
Then they see: daily step count, active minutes, and workout sessions prominently displayed.

**AC3: Light Mode Display**
Given the user is in Light mode,
When viewing activity data,
Then a simplified daily summary with "Did I move enough today?" feedback is shown.

**AC4: Deep Mode Display**
Given the user is in Deep mode,
When viewing activity data,
Then hourly activity breakdown, heart rate zones, and multi-week trends are available.

**AC5: Heart Rate Zone Display**
Given heart rate data is available from wearable,
When the user views workout details,
Then time spent in each of 5 heart rate zones is displayed.

**AC6: Multi-Source Support**
Given the user has multiple wearables connected,
When activity data syncs from multiple sources,
Then data is merged using golden source hierarchy (no duplicates, conflicts resolved).

**AC7: Cross-Pillar Integration**
Given activity data is available,
When the holistic health score calculates,
Then activity metrics contribute to the Fitness pillar score.

## Success Metrics
- Wearable sync success rate >95% within 15 minutes
- Daily activity data completeness >90% for users with connected wearables
- User satisfaction with auto-tracking: 4.5/5 rating

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <15min sync latency | Auth token required | Activity data user-only | Color-blind safe indicators | iOS 14+, Android 10+ |
| Dashboard load <3s | Encrypted at rest | No sharing without consent | Min 4.5:1 contrast | 10+ wearable sources |

## Dependencies
- **Prerequisite Stories:** S05.0.1 (Wearable Infrastructure)
- **Related Stories:** S05.1.2, S05.6.1
- **External Dependencies:** E9 (Data Integrations), E4 (Mobile App UI)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Wearable sync failure (no data >24h) | Retry hourly; notify after 48h: "Haven't synced from your [device] in 2 days. Everything okay?" |
| Conflicting activity data from multiple sources | Apply golden source hierarchy silently |
| Heart rate data gap during workout | Accept workout without HR zones: "Workout logged! HR data unavailable for this session." |
| Unrealistic step count (>100,000) | Flag for review; do not display until confirmed |
| Device battery died mid-day | Show partial data with note: "Activity data incomplete - device disconnected at [time]" |

## Open Questions
- Should we show a "sync status" indicator on the dashboard?
- How should we handle workout detection differences between devices?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] Sync from 10+ wearable sources functional
- [ ] Light and Deep modes render correctly
- [ ] Heart rate zone visualization working
- [ ] Error scenarios handled per PRD
- [ ] Performance requirements verified (<15min sync, <3s load)
