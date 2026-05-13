---
type: story
id: S07.4.2
title: Energy Pattern Analysis
epic: E07
epic_name: Wellbeing Pillar
feature: F7.4
feature_name: Energy Level Monitoring
product: yhealth-platform
priority: P0
status: Complete
story_points: 0
created: 2025-12-24
---

# S07.4.2: Energy Pattern Analysis


### User Story
**As an** Optimization Enthusiast (P3),
**I want to** visualize my energy patterns throughout the day and understand what factors affect my energy levels,
**So that** I can optimize my schedule, meals, and activities for consistent high energy.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Energy pattern analysis reveals when users naturally peak and dip, and what behaviors correlate with better or worse energy. Insights like "High-protein breakfast = 25% better morning energy" help users make actionable changes.

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | 7-day energy summary with peak/low indicators. "Your energy tends to dip around 3 PM." |
| **Deep** | Full energy timeline (hourly/daily/weekly), correlation engine, trend analysis, energy optimization recommendations. |

**Energy Timeline Visualizations:**
- **Hourly View:** Energy levels plotted across 24 hours (requires 3+ check-ins/day)
- **Daily View:** Average energy with min/max range
- **Weekly View:** 7-day trend with day-of-week patterns

**Energy Correlation Engine:**

| Correlation | Example Insight |
|-------------|-----------------|
| Energy → Sleep | "7+ hours sleep = +3 energy points average" |
| Energy → Meals | "High-protein breakfast = 25% better morning energy" |
| Energy → Workouts | "Morning workouts boost all-day energy by 18%" |
| Energy → Stress | "High stress days = -2.5 energy points average" |
| Energy → Caffeine | "No caffeine after 2 PM = +1.5 evening energy" |
| Energy → Habits | "Meditation mornings have 20% higher energy" |

**Energy Dip Detection:**
- Afternoon dip: Energy drop >3 points between 1-4 PM
- Consistent pattern: Same dip pattern 3+ days/week
- Alert: "Your afternoon energy crashes consistently. Try: walking break, protein snack, or hydration."

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Time-of-Day Pattern | JSON | System calculated | User-only |
| Correlation Metric | Enum | sleep/meal/workout/stress/habit | System |
| Correlation Strength | Float | 0.0-1.0 | System |
| Dip Detected | Boolean | Auto-detected | System |
| Recommendation | String | System generated | User-only |

**Behaviors:**
- Pattern detection requires 7+ days of energy data (3+ check-ins/day)
- Correlations require 14+ days of multi-pillar data
- Energy dip alerts surface when consistent pattern detected
- Recommendations are actionable and specific

### Acceptance Criteria

**AC1: Daily Energy Timeline**
Given the user has logged energy 3+ times today,
When they view the daily timeline,
Then hourly energy levels display as a chart/graph.

**AC2: Weekly Pattern Summary (Light Mode)**
Given the user is in Light mode,
When they view energy patterns,
Then 7-day average, peak time, and low time are shown.

**AC3: Time-of-Day Pattern Detection**
Given the user has 7+ days of energy data,
When patterns are analyzed,
Then insights like "Your energy peaks between 9-11 AM" appear.

**AC4: Cross-Pillar Correlation (Sleep)**
Given the user has 14+ days of energy + sleep data,
When correlations calculate,
Then insight shows: "7-8 hours sleep → 8/10 morning energy" (with actual numbers).

**AC5: Cross-Pillar Correlation (Meals)**
Given the user has 14+ days of energy + meal data,
When post-meal energy is analyzed,
Then insight shows meal-energy connections (e.g., protein vs carb impact).

**AC6: Afternoon Dip Detection**
Given the user's energy drops >3 points between 1-4 PM consistently,
When pattern is detected (3+ days/week),
Then alert: "Consistent afternoon energy dip detected. Recommendations: [list]."

**AC7: Trend Analysis (Deep Mode)**
Given the user is in Deep mode,
When they view 30-day energy trends,
Then average/min/max energy per week is shown with trend direction.

**AC8: Actionable Recommendations**
Given an energy pattern or dip is detected,
When recommendations surface,
Then they are specific: "Try a 10-minute walk at 2:30 PM" not generic "exercise more."

### Success Metrics
- Energy pattern insights: 75% receive energy correlation insight within 7 days
- Energy optimization: 50% report improved energy management in 30 days
- Insight accuracy: 70% user agreement that energy insights match experience
- Dip detection accuracy: 80% user confirmation when dip alert shown

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Timeline load <2s | Auth required | Energy patterns user-only | Screen reader support | iOS 14+, Android 10+ |
| Correlation calc <5s | Encrypted at rest | No cross-pillar raw data exposed | Min 4.5:1 contrast | Landscape for charts |

### Dependencies
- **Prerequisite Stories:** S07.4.1 (Energy Level Logging)
- **Related Stories:** S07.1.2 (Mood Patterns), S07.3.3 (Habit Correlations)
- **External Dependencies:** E5 (Sleep data), E6 (Meal data), E8 (Cross-Domain Intelligence)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Insufficient data (<7 days) | Show available data; "More data needed for patterns" message |
| Single check-in per day only | Show daily trend; cannot generate hourly timeline |
| No cross-pillar data (no sleep/meal logged) | Energy-only patterns; prompt to log other pillars for deeper insights |
| Erratic energy (no consistent pattern) | Acknowledge variability: "Your energy varies significantly. Tracking more factors may reveal causes." |
| User vacation/travel (unusual patterns) | Note unusual period; don't weight heavily in long-term patterns |

### Open Questions
- Should we show predicted energy for future time slots?
- How should we handle timezone changes for pattern analysis?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Hourly, daily, weekly energy timelines functional
- [ ] Cross-pillar correlations generating (sleep, meals, workouts, habits)
- [ ] Afternoon energy dip detection working
- [ ] Actionable recommendations displaying
- [ ] Performance requirements verified (<2s load)
- [ ] Accessibility requirements verified

---