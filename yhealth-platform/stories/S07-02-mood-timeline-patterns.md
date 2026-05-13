---
type: story
id: S07.1.2
title: Mood Timeline & Patterns
epic: E07
epic_name: Wellbeing Pillar
feature: F7.1
feature_name: Mood Check-ins
product: yhealth-platform
priority: P0
status: Complete
story_points: 0
created: 2025-12-24
---

# S07.1.2: Mood Timeline & Patterns


### User Story
**As an** Optimization Enthusiast (P3),
**I want to** visualize my mood patterns across days, weeks, and months and discover correlations with other health factors,
**So that** I can understand what influences my emotional state and make data-driven lifestyle adjustments.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users can view their mood history as a visual timeline, revealing patterns across time. Cross-pillar correlations show how mood connects to sleep, workouts, meals, and habits - the "aha moments" that differentiate yHealth from competitors.

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | 7-day mood summary with simple trend indicator (↑ improving, ↓ declining, → stable). "Your week at a glance" view. |
| **Deep** | Full mood timeline (day/week/month views), correlation insights, mood volatility analysis, export capability, historical comparisons. |

**Timeline Visualizations:**
- **Daily View:** Hourly mood check-ins plotted on 24-hour timeline
- **Weekly View:** 7-day mood average with min/max range
- **Monthly View:** 30-day trend line with weekly averages

**Cross-Pillar Correlation Insights:**
| Correlation | Example Insight |
|-------------|-----------------|
| Mood → Sleep | "Your mood is 40% better after 7+ hours of sleep" |
| Mood → Workouts | "Morning workouts correlate with 25% higher afternoon mood" |
| Mood → Meals | "Your mood dips 2 hours after high-carb meals" |
| Mood → Habits | "Journaling before bed improves next-day mood by 35%" |
| Mood → Steps | "Low mood days correlate with <5,000 steps" |

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Timeline Period | Enum | day/week/month | User setting |
| Correlation Metric | Enum | sleep/workout/meal/habit | System generated |
| Correlation Strength | Float | 0.0-1.0 | System generated |
| Insight Text | String | Auto-generated | User-only |
| Export Format | Enum | csv/pdf | User request |

**Behaviors:**
- Timeline auto-updates when new mood data logged
- Correlations require minimum 14 days of multi-pillar data
- Insights surface when correlation strength >0.3
- Users can tap any insight to see underlying data
- Export includes mood data with timestamps (no raw health data from other pillars)

### Acceptance Criteria

**AC1: Daily Timeline View**
Given the user has logged multiple moods today,
When they view the daily timeline,
Then each check-in appears at its timestamp with emoji/rating visible.

**AC2: Weekly Summary (Light Mode)**
Given the user is in Light mode,
When they view mood patterns,
Then a 7-day summary shows trend direction (↑↓→) and average mood.

**AC3: Monthly Timeline (Deep Mode)**
Given the user is in Deep mode,
When they select monthly view,
Then a 30-day trend line displays with weekly averages highlighted.

**AC4: Cross-Pillar Correlation Display**
Given the user has 14+ days of mood + sleep data,
When correlations are calculated,
Then insights like "Better sleep → Better mood" appear with specific percentages.

**AC5: Correlation Drill-Down**
Given a correlation insight is displayed,
When the user taps the insight,
Then underlying data (mood on sleep days vs poor sleep days) is shown.

**AC6: Mood Volatility Detection**
Given the user's mood varies significantly within days,
When viewing weekly patterns,
Then volatility indicator shows: "Your mood varied more than usual this week."

**AC7: Export Capability (Deep Mode)**
Given the user wants to export mood data,
When they select export option,
Then mood data downloads as CSV or PDF with date range selection.

**AC8: Minimum Data Requirement**
Given the user has <7 days of mood data,
When they view timeline,
Then message shows: "Keep logging! Patterns will appear after 7+ days of data."

### Success Metrics
- Timeline engagement: 60% of users view mood patterns weekly
- Correlation insight discovery: 75% receive cross-pillar insight within 14 days
- Insight accuracy: 70% user agreement that insights match their experience
- Export usage: 10% of Deep mode users export data monthly

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Timeline load <2s | Auth required | Correlations calculated locally | Screen reader support | iOS 14+, Android 10+ |
| Correlation calc <5s | Export encrypted | No cross-pillar raw data in exports | Min 4.5:1 contrast | Landscape for charts |

### Dependencies
- **Prerequisite Stories:** S07.1.1 (Mood Check-in Logging)
- **Related Stories:** S07.4.2, S07.3.3
- **External Dependencies:** E5 (Sleep data), E6 (Meal data), E8 (Cross-Domain Intelligence engine)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Only Light mode check-ins (no Deep data) | Timeline uses emoji-based visualization; no detailed ratings chart |
| Insufficient data for correlations (<14 days) | Show timeline without correlations; "More data needed for insights" |
| Large mood swing detected (5+ point change in 2 hours) | Highlight on timeline: "Significant mood shift detected" |
| Cross-pillar data missing (no sleep/meal logged) | Show mood-only insights; prompt to log other pillars |
| User deletes mood check-ins | Timeline updates; correlations recalculate; warning before bulk delete |

### Open Questions
- Should correlation insights include confidence intervals?
- What's the retention period for mood history (unlimited vs 12 months)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Daily, weekly, monthly timeline views functional
- [ ] Cross-pillar correlation insights generating (when data available)
- [ ] Export to CSV/PDF working
- [ ] Accessibility requirements verified (screen reader, contrast)
- [ ] Performance requirements verified (<2s load, <5s correlation calc)

---