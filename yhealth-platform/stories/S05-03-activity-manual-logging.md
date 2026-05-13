---
type: story
id: S05.1.2
title: Activity Manual Logging & Timeline
epic: E05
feature: F5.1
product: yhealth-platform
priority: P0
status: Draft
---

# S05.1.2: Activity Manual Logging & Timeline

## User Story
**As a** user without a wearable device,
**I want to** manually log my workouts and view my activity timeline,
**So that** I can still benefit from yHealth's fitness tracking and insights.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
For users without wearables or when automatic tracking misses an activity, manual logging provides a fallback. Users can log workouts with type, duration, and perceived effort. The activity timeline shows hourly movement patterns for users who want to understand their daily rhythm.

**Manual Workout Entry Fields:**
| Field | Type | Required | Options |
|-------|------|----------|---------|
| Workout Type | Select | Yes | Running, Walking, Cycling, Swimming, Strength Training, Yoga, HIIT, Other |
| Duration | Number | Yes | Minutes (5-480 range) |
| Perceived Effort | Scale | Yes | 1-10 (1=Very Easy, 10=Maximum) |
| Notes | Text | No | Free text (500 char max) |
| Time of Workout | DateTime | Yes | Default to now, adjustable |

**Activity Timeline (Deep Mode):**
- Hourly breakdown of movement/activity
- Visual representation of active vs. sedentary periods
- Workout sessions highlighted on timeline
- Week-over-week pattern comparison

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Quick workout log button; simple daily activity summary |
| **Deep** | Full activity timeline with hourly patterns, workout history, export capability |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Workout Type | Enum | From type list | User-only |
| Duration | Integer minutes | 5-480 range | User-only |
| Perceived Effort | Integer 1-10 | Required | User-only |
| Notes | String | Max 500 chars | User-only |
| Logged At | ISO 8601 | Required | System |
| Source | "manual" | Constant | System |

**Behaviors:**
- Manual entry available from dashboard quick action and fitness tab
- Offline mode queues manual entries for sync when reconnected
- Manual entries appear alongside wearable data in timeline
- Perceived effort used for strain calculation when HR unavailable (S05.6.1)
- Validation warns on unrealistic values

## Acceptance Criteria

**AC1: Manual Workout Entry**
Given the user wants to log a workout manually,
When they access the manual entry form,
Then they can enter: workout type, duration, perceived effort (1-10), optional notes.

**AC2: Entry Validation**
Given the user enters workout details,
When they submit with unrealistic values (e.g., 500 minutes, effort 15),
Then validation errors display with helpful messages.

**AC3: Offline Queue**
Given the user is offline,
When they submit a manual workout entry,
Then the entry is queued locally and syncs when connection restored.

**AC4: Timeline Display (Deep Mode)**
Given the user is in Deep mode,
When they view the activity timeline,
Then hourly activity patterns are visualized with workout sessions highlighted.

**AC5: Manual Entry Integration**
Given a manual workout is logged,
When viewing activity summaries,
Then manual entries appear alongside wearable data (marked as "Manual").

**AC6: Quick Log Access**
Given the user is on the dashboard,
When they tap "Log Workout" quick action,
Then the manual entry form opens immediately.

**AC7: Unrealistic Value Warning**
Given the user enters >50,000 steps or >6 hours workout manually,
When they attempt to save,
Then a confirmation prompt appears: "This seems unusually high. Is this correct?"

## Success Metrics
- Manual entry fallback usage <10% of total activity logs (indicates wearable-first working)
- Manual entry completion rate >90% (started entries that save successfully)
- Offline queue sync success rate 100%

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Entry save <1s | Auth required | Manual data user-only | Voice input support | iOS 14+, Android 10+ |
| Offline queue sync <30s | Data encrypted | No analytics on notes | 44x44pt touch targets | Portrait + Landscape |

## Dependencies
- **Prerequisite Stories:** S05.1.1 (Activity Wearable Sync - for data integration)
- **Related Stories:** S05.6.1 (Strain uses perceived effort)
- **External Dependencies:** E4 (Mobile App), E3 (WhatsApp - voice workout logging)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Duplicate entry (same time, same type) | Warn: "You already logged a [type] at this time. Add anyway?" |
| Entry for future time | Reject: "Cannot log workout for future time" |
| Entry >7 days in past | Allow with note: "Adding to history for [date]" |
| Very short workout (<5 min) | Allow but don't count toward daily goals |
| Network restored with queued entries | Auto-sync with progress indicator; show success toast |

## Open Questions
- Should we support recurring workout scheduling (log same workout weekly)?
- Should manual entries affect the holistic health score differently than wearable data?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] Manual entry form fully functional
- [ ] Offline queue implemented and tested
- [ ] Activity timeline renders in Deep mode
- [ ] Validation and error handling complete
- [ ] Integration with wearable data verified
