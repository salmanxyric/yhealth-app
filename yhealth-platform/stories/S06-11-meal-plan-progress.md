---
type: story
id: S06.4.3
title: Meal Plan Interaction & Progress Tracking
epic: E06
feature: F6.4
product: yhealth-platform
priority: P0
status: Draft
---

# Meal Plan Interaction & Progress Tracking

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** easily log meals from my plan and track weekly progress,
**So that** I can see how well I'm following my nutrition goals without extra effort.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users interact with their meal plans through easy actions - tap to log, swap meals, mark as skipped. Weekly progress reports show adherence and help users understand what's working.

**Plan Interaction Features:**
- **Tap-to-Log:** One tap logs the planned meal with exact macros
- **Swap Meals:** Drag-and-drop to rearrange days or meals
- **Substitute Items:** AI suggests macro-equivalent swaps
- **Regenerate Meal:** Don't like this meal? Generate alternative
- **Skip/Mark Eaten:** Mark meals as skipped or eaten off-plan
- **Freestyle Days:** Mark days as "I'll figure it out" (no plan)

**Weekly Progress Reports:**
| Metric | Display |
|--------|---------|
| Goal Adherence | % of days targets hit |
| Plan Adherence | % of planned meals actually eaten |
| Calorie Variance | Average daily variance from target |
| Macro Consistency | Which macros hit most/least |
| Weight Trend | If weight goal (requires E5 data) |
| Qualitative Score | "How sustainable does this feel?" (1-5) |

**Weekly Check-In Flow:**
1. End of week notification: "Time for your weekly nutrition check-in!"
2. Show key metrics and trends
3. Ask: "How sustainable does this feel?" (1-5 scale)
4. AI provides insight and suggestions
5. Optional: Adjust goals for next week

**Progress Insights:**
- "You hit protein targets 6/7 days this week - great consistency!"
- "Your calorie variance is ±8% - very accurate tracking."
- "You skipped meal plans 3 days. Want simpler suggestions?"
- "Weight down 0.6kg this week, on pace for your goal."

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Meal Status | Enum | planned/logged/skipped/off-plan | User-only |
| Log Timestamp | ISO 8601 | When meal logged | User-only |
| Swap History | Array | Original → new meal | System |
| Weekly Metrics | Object | Calculated weekly | User-only |
| Check-In Response | Integer | 1-5 sustainability score | User-only |

**Behaviors:**
- Planned meals appear in Today's schedule
- Logged meals cross off from plan
- Skipped meals don't count against adherence negatively (acknowledges reality)
- Reports generated every Sunday evening
- AI adjusts future plans based on adherence patterns

### Acceptance Criteria

**AC1: Tap-to-Log**
Given a user views their meal plan for today,
When they tap "Log" on a planned meal,
Then the meal is logged to their food diary with exact macros in <2 seconds.

**AC2: Meal Swap**
Given a user wants to eat Tuesday's dinner on Monday,
When they drag Tuesday's dinner to Monday,
Then the meals swap and daily totals recalculate.

**AC3: Substitute Suggestion**
Given a user doesn't like a planned meal,
When they tap "Substitute",
Then AI suggests 3 alternatives with similar macros in <5 seconds.

**AC4: Skip Meal**
Given a user skips a planned meal,
When they mark it as "Skipped",
Then it's recorded without negative judgment and remaining daily macros adjust.

**AC5: Weekly Report Generation**
Given a user has completed a week of tracking,
When Sunday evening arrives,
Then a weekly progress report is generated and notification sent.

**AC6: Adherence Metrics**
Given a user has followed their plan for a week,
When viewing the weekly report,
Then they see % goal adherence, % plan adherence, and calorie variance.

**AC7: Qualitative Check-In**
Given a user views their weekly report,
When they complete the check-in,
Then they can rate sustainability (1-5) and see personalized insights.

**AC8: AI Recommendations**
Given a user has 2+ weeks of data and low plan adherence (<50%),
When generating insights,
Then AI suggests adjustments: "You skipped meal plans 3 days. Want simpler suggestions?"

### Success Metrics
- Tap-to-log usage: 70% of planned meals logged via tap-to-log
- Plan adherence: 60% follow plan 4+ days per week
- Weekly check-in completion: 80% complete weekly check-in
- Goal achievement: 65% make measurable progress in 90 days

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s tap-to-log | Report data encrypted | Progress private | Clear progress visuals | iOS 14+, Android 10+ |
| <5s substitute | No external sharing | Optional sharing | Accessibility labels | Cross-channel sync |

### Dependencies
- **Prerequisite Stories:** S06.4.1, S06.4.2
- **Related Stories:** S06.2.1, S06.5.1
- **External Dependencies:** E5 (Fitness - weight data for trends)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User logs different meal than planned | Record as "off-plan", still count toward daily totals |
| All meals skipped for a day | Don't penalize, note in insights, ask if plan needs adjustment |
| Plan not generated but tracking | Show progress without plan adherence metrics |
| Week incomplete (started mid-week) | Partial week report with available data |
| User ignores check-in | Reminder once, then generate report without qualitative data |

### Open Questions
- Should we support exporting meal plans to PDF?
- How should we handle "cheat days" in metrics?
- Should progress be shareable (social features)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Tap-to-log functional
- [ ] Meal swap and substitute working
- [ ] Weekly reports generating
- [ ] Check-in flow complete
- [ ] AI recommendations based on patterns