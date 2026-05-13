---
type: story
id: S06.2.1
title: Real-Time Calorie & Macro Dashboard
epic: E06
feature: F6.2
product: yhealth-platform
priority: P0
status: Draft
---

# Real-Time Calorie & Macro Dashboard

### User Story
**As a** Busy Professional (P2),
**I want to** see a simple visual showing if I'm on track with calories,
**So that** I don't need to analyze numbers constantly throughout the day.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users see real-time tracking of calories and macronutrients against their daily targets. Light mode shows a simple "on track" indicator while Deep mode provides detailed breakdowns. The dashboard updates instantly as meals are logged.

**Dashboard Components:**

**Light Mode:**
- **Progress Ring:** Outer ring showing calories consumed vs. target
- **Color Coding:** Green (on track), Yellow (close to limit), Red (over target)
- **Simple Text:** "1,450 / 2,000 kcal (73%)"
- **Optional Focus Macro:** One additional ring (e.g., protein for muscle gain)

**Deep Mode:**
- **Macro Breakdown:** Stacked bar chart (Protein/Carbs/Fats) showing consumed vs. target
- **Meal Timeline:** Chronological view of all logged meals with macro contribution
- **Pie Chart:** Meal distribution (breakfast/lunch/dinner/snacks)
- **Trend Graphs:** 7/30/90 day rolling averages
- **Traffic Lights:** Red/Yellow/Green indicators for each macro
- **Export Option:** Download data as CSV

**Background Tracking (All Users):**
Even Light mode users have complete tracking in the background:
- Calories, Protein, Carbs, Fats, Fiber, Sugar, Sodium, Cholesterol
- Micronutrients (when available): Vitamins, Minerals
- Meal timing and frequency
- Hydration status (linked to F6.3)

This enables AI insights even for users who don't actively view detailed data.

**Real-Time Updates:**
- Dashboard refreshes within 2 seconds of any meal logged
- Updates propagate from any channel (App, WhatsApp, Voice)
- Offline changes sync and update when connected

**Data Displayed:**
| Metric | Light Mode | Deep Mode |
|--------|------------|-----------|
| Total Calories | Progress ring + number | Ring + timeline + trends |
| Protein | Optional focus ring | Detailed grams + % of target |
| Carbs | Hidden | Detailed grams + % of target |
| Fats | Hidden | Detailed grams + % of target |
| Fiber | Hidden | Available in expanded view |
| Micronutrients | Hidden | Available in expanded view |

**Behaviors:**
- Dashboard is primary screen in Nutrition section
- Tap progress ring to toggle Light/Deep view
- Tap meal in timeline to see detailed breakdown
- Pull-to-refresh updates from server
- Animations smooth and non-distracting

### Acceptance Criteria

**AC1: Real-Time Updates**
Given a user logs a meal via any channel,
When the dashboard is viewed,
Then calorie/macro totals update within 2 seconds.

**AC2: Progress Ring Display (Light Mode)**
Given a user is in Light mode,
When viewing the dashboard,
Then a progress ring shows calories consumed vs. target with color-coded status.

**AC3: Color Coding Logic**
Given calorie progress is displayed,
When consumption is 0-90% of target, status is Green (on track),
When consumption is 90-110% of target, status is Yellow (close),
When consumption is >110% of target, status is Red (over).

**AC4: Macro Breakdown (Deep Mode)**
Given a user is in Deep mode,
When viewing the dashboard,
Then Protein, Carbs, and Fats are shown with grams consumed, grams remaining, and % of daily target.

**AC5: Meal Timeline**
Given a user has logged multiple meals,
When viewing the timeline in Deep mode,
Then meals are shown chronologically with time, name, and macro contribution.

**AC6: Trend Visualization**
Given a user has 7+ days of logging history,
When viewing trends in Deep mode,
Then 7-day and 30-day rolling average graphs are available.

**AC7: Background Tracking**
Given a user is in Light mode,
When AI generates insights,
Then complete nutritional data (including hidden metrics) is available for analysis.

**AC8: Cross-Channel Sync**
Given a user logs via WhatsApp and views dashboard on Mobile App,
When the dashboard loads,
Then all WhatsApp-logged meals appear with full macro data.

### Success Metrics
- Dashboard load time: <2 seconds (95th percentile)
- Real-time update latency: <2 seconds after meal logged
- User engagement: 70% check dashboard at least once daily
- Deep mode adoption: 40% of users explore Deep mode within first week
- Feature satisfaction: 4.6/5 for macro tracking

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s load time | Data encrypted at rest | Personal data only | High contrast mode | iOS 14+, Android 10+ |
| <2s update latency | Session authentication | No sharing without consent | Screen reader labels | All screen sizes |

### Dependencies
- **Prerequisite Stories:** S06.0.1, S06.1.1, S06.1.2
- **Related Stories:** S06.2.2, S06.4.1
- **External Dependencies:** E4 (Mobile App UI components)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No meals logged today | Show empty state: "No meals logged yet. Start tracking!" |
| Missing macro data for a food | Use estimates, show "~" indicator, don't break totals |
| Extremely high calories (>5000) | Display accurately, no judgment, gentle insight later |
| Offline mode | Show cached data with "Last updated: X ago" indicator |
| Target not set | Prompt to set target, show absolute values only |
| Data sync conflict | Use most recent timestamp, log conflict for review |
| Very old historical data | Lazy load, prioritize recent 30 days |

### Open Questions
- Should Light mode show one macro (e.g., protein) or just calories?
- What's the maximum historical data to display in trends?
- Should we show "remaining" calories or "consumed" as primary?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Light mode progress ring functional
- [ ] Deep mode macro breakdown functional
- [ ] Real-time updates <2 seconds
- [ ] Meal timeline functional
- [ ] Trend graphs for 7/30/90 days
- [ ] Background tracking verified
- [ ] Accessibility requirements met