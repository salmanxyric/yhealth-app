---
type: story
id: S05.6.3
title: Strain Alerts & Weekly Analysis
epic: E05
feature: F5.6
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As a** user,
**I want to** receive alerts when my training load becomes concerning,
**So that** I can prevent overtraining before it impacts my performance or health.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Proactive alerts catch dangerous training patterns before users realize there's a problem. Weekly analysis helps users understand their training distribution and plan future weeks.

**Alert Triggers:**

| Alert | Trigger | Severity | Message |
|-------|---------|----------|---------|
| **High Strain Streak** | 3+ consecutive days >80 strain with recovery <50 | Critical | "You've been pushing hard for 3 days with low recovery. Rest day strongly recommended." |
| **Weekly Overreach** | Weekly strain >150% of previous week | High | "Your training volume jumped significantly this week. Watch for overtraining signs." |
| **Chronic High Load** | 7+ consecutive days >80 strain | Critical | "High strain for 7 days. Your body needs recovery time." |
| **No Recovery Days** | 7+ days without a day <40 strain | Medium | "You haven't had a recovery day in a week. Consider a lighter day." |
| **Acute:Chronic Imbalance** | This week's strain >140% of 4-week average | High | "Training spike detected. Ease back to prevent injury." |

**Weekly Analysis:**
- Total weekly strain with comparison to previous week
- Strain distribution by day (which days were hardest?)
- Activity type breakdown (what contributed most to strain?)
- Strain vs. recovery correlation
- Recommendation for next week

**7-Day Strain Chart:**
- Bar chart showing daily strain
- Color-coded by intensity category
- Recovery score overlay (optional)
- Average line for context

**Data Export:**
- CSV export of strain history
- PDF report with weekly analysis

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Active alerts only with dismiss option |
| **Deep** | Weekly analysis, detailed charts, export, historical comparison |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Alert Type | Enum | From alert types | System |
| Alert Triggered | ISO 8601 | Required | System |
| Alert Acknowledged | Boolean | User action | System |
| Weekly Strain | Float | Calculated | User-only |
| Previous Week Strain | Float | Historical | User-only |
| Strain by Day | Float array | 7 values | User-only |
| Strain by Type | JSON | Activity breakdown | User-only |

**Behaviors:**
- Alerts trigger proactively when patterns detected
- Alert cooldown prevents spam (same alert max 1x per 48h)
- Weekly analysis generates every Monday (or user-selected day)
- Export available anytime in Deep mode
- Alerts integrate with workout recommendations

### Acceptance Criteria

**AC1: High Strain Streak Alert**
Given 3+ consecutive days with strain >80 AND recovery <50,
When alert system checks,
Then critical alert triggers: "Rest day strongly recommended."

**AC2: Weekly Overreach Alert**
Given this week's strain >150% of previous week,
When weekly analysis runs,
Then alert triggers: "Training volume jumped significantly."

**AC3: Chronic High Load Alert**
Given 7+ consecutive days with strain >80,
When alert system checks,
Then critical alert triggers: "Your body needs recovery time."

**AC4: Alert Acknowledgment**
Given an alert has triggered,
When user acknowledges it,
Then alert dismissed and won't repeat for 48 hours.

**AC5: Weekly Analysis Generation**
Given it's the start of a new week,
When weekly analysis runs,
Then report generates with: total strain, comparison, distribution, recommendations.

**AC6: 7-Day Strain Chart**
Given 7+ days of strain data,
When viewing strain section,
Then bar chart displays daily strain color-coded by intensity.

**AC7: Data Export**
Given user requests strain export,
When export generates,
Then CSV or PDF with strain history downloads.

**AC8: Light Mode Alert Display**
Given user is in Light mode,
When alerts exist,
Then only active alerts show with dismiss option (no full analysis).

### Success Metrics
- Alert effectiveness: 70% of users take action after critical alert
- Overtraining prevention: 60% reduction in user-reported overtraining symptoms
- Weekly analysis engagement: 50% of Deep mode users review weekly analysis

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Alert check <1s | Encrypted storage | Strain alerts user-only | Plain language alerts | iOS 14+, Android 10+ |
| Export <5s | Auth required | Export encrypted | Screen reader charts | All screen sizes |

### Dependencies
- **Prerequisite Stories:** S05.6.1 (Strain Calculation), S05.6.2 (Balance)
- **Related Stories:** S05.3.3 (Recovery Alerts), S05.5.1 (Workout recommendations)
- **External Dependencies:** E4 (Mobile App UI)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User dismisses all alerts | Reduce frequency; don't nag. Track dismissal pattern. |
| First week (no previous week data) | Skip weekly comparison; show absolute metrics only |
| Very sporadic logging | Note: "Incomplete data this week. Strain totals may be underestimated." |
| Multiple alerts same day | Prioritize by severity; show most critical first |
| Export fails | Retry option; fallback to smaller date range |

### Open Questions
- Should users be able to set custom alert thresholds?
- Should alerts integrate with calendar (suggest rest day on specific date)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 5 alert types triggering correctly
- [ ] Alert acknowledgment and cooldown working
- [ ] Weekly analysis generating
- [ ] 7-day strain chart functional
- [ ] Data export working
- [ ] Light and Deep modes operational
