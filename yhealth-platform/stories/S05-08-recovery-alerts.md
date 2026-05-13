---
type: story
id: S05.3.3
title: Recovery Alerts & Historical Trends
epic: E05
feature: F5.3
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As an** Optimization Enthusiast (P3),
**I want to** see my recovery trends over time and receive alerts for concerning patterns,
**So that** I can identify recovery issues early and prevent overtraining or burnout.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Beyond daily scores, users need to understand their recovery patterns over time. Trend visualization helps identify gradual decline before it becomes critical. Proactive alerts catch concerning patterns that users might miss day-to-day.

**Recovery Trend Visualizations:**
- 7-day trend chart (Physical and Mental as separate lines)
- 30-day trend chart with rolling average
- 90-day long-term view
- Recovery consistency indicator (variance in scores)

**Alert Triggers:**

| Alert | Trigger | Severity | Message |
|-------|---------|----------|---------|
| Chronic Low Recovery | 5+ consecutive days <50 (either score) | High | "Your [physical/mental] recovery has been low for 5 days. Consider a recovery day." |
| Declining Trend | 7-day average dropping >15 points | Medium | "Your recovery is trending down this week. Pay attention to rest and recovery." |
| Physical-Mental Mismatch | 3+ days with >30 point difference | Low | "Your body and mind recovery are out of sync. This pattern can lead to burnout." |
| Recovery Not Improving | 3+ rest days with no score improvement | Medium | "Rest days aren't improving your recovery. Consider: sleep quality, stress, nutrition." |

**Cross-Domain Recovery Insights:**
- "Your physical recovery is 25% higher on days you journal"
- "Mental recovery predicts workout enjoyment better than physical recovery"
- "Best overall recovery happens with 7+ hours sleep + morning mood >7"

**Deep Mode Features:**
- Component breakdown with individual metric trends
- Export recovery data (CSV, PDF)
- Recovery pattern analysis

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Alert Type | Enum | From alert types | System |
| Alert Triggered | ISO 8601 | Required | System |
| Alert Acknowledged | Boolean | User action | System |
| Trend Direction | Enum | Up/Down/Stable | User-only |
| Export Requested | Boolean | User action | Aggregated |

**Behaviors:**
- Alerts trigger proactively when patterns detected
- Alerts don't repeat daily (cooldown period)
- User can acknowledge/dismiss alerts
- Trends update daily after new score calculates
- Deep mode allows data export

### Acceptance Criteria

**AC1: 7-Day Trend Chart**
Given 7+ days of recovery data,
When user views recovery trends,
Then a chart shows both Physical and Mental scores over the past 7 days.

**AC2: 30/90-Day Trends**
Given 30+ days of recovery data,
When user views extended trends,
Then 30-day and 90-day trend options are available.

**AC3: Chronic Low Recovery Alert**
Given 5+ consecutive days with Physical OR Mental score <50,
When alert system checks,
Then alert triggers: "Your [type] recovery has been low for 5 days."

**AC4: Declining Trend Alert**
Given 7-day recovery average drops >15 points from previous week,
When trend analysis runs,
Then alert triggers: "Your recovery is trending down this week."

**AC5: Alert Acknowledgment**
Given an alert has triggered,
When the user acknowledges it,
Then the alert is marked as seen and won't repeat for 48 hours minimum.

**AC6: Deep Mode Component Breakdown**
Given user is in Deep mode,
When viewing recovery details,
Then individual component trends (HRV, RHR, Sleep, Mood, etc.) display over time.

**AC7: Cross-Domain Insight Display**
Given sufficient cross-pillar data,
When correlation analysis runs,
Then recovery-related cross-domain insights display (e.g., "Recovery 25% higher when you journal").

**AC8: Data Export**
Given user requests recovery data export,
When export generates,
Then CSV or PDF with recovery history downloads.

### Success Metrics
- Alert accuracy: 80% of alerts acknowledged as helpful
- Trend engagement: 60% of Deep mode users view trends weekly
- Overtraining prevention: 50% reduction in user-reported overtraining symptoms

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Chart render <2s | Encrypted export | Recovery history user-only | Chart accessible | iOS 14+, Android 10+ |
| Alert check <1s | Auth required | No external sharing | Plain language alerts | All screen sizes |

### Dependencies
- **Prerequisite Stories:** S05.3.1 (Dual Recovery Engine), S05.3.2 (Recommendations)
- **Related Stories:** S05.6.3 (Strain Alerts)
- **External Dependencies:** E8 (Cross-Domain Intelligence for insights)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Insufficient data for trend (<7 days) | Show available data; message: "Keep tracking to see recovery trends" |
| User dismisses all alerts | Reduce alert frequency; don't spam |
| Score jumps dramatically (data error?) | Flag outliers; don't include in trend until confirmed |
| Export fails | Retry option; fallback to smaller date range |
| No cross-domain data | Show recovery trends only; encourage multi-pillar tracking |

### Open Questions
- Should users be able to set custom alert thresholds?
- How long should alert history be retained?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 7/30/90-day trend charts functional
- [ ] All 4 alert types triggering correctly
- [ ] Alert acknowledgment and cooldown working
- [ ] Deep mode component breakdown complete
- [ ] Data export functional
- [ ] Cross-domain insights displaying

