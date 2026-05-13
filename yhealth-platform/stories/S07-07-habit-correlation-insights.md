---
type: story
id: S07.3.3
title: Habit Correlation Insights
epic: E07
epic_name: Wellbeing Pillar
feature: F7.3
feature_name: Habit Tracking
product: yhealth-platform
priority: P0
status: Draft
story_points: 0
created: 2025-12-24
---

# S07.3.3: Habit Correlation Insights


### User Story
**As a** Holistic Health Seeker (P1),
**I want to** discover how my habits correlate with my mood, energy, sleep, and other health factors,
**So that** I can understand which habits truly impact my wellbeing and focus on what works.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The habit correlation engine analyzes habit completion against mood, energy, sleep, workouts, and stress to reveal which habits have the most impact. Insights like "Your mood is 45% better on days you meditate" help users prioritize their most effective habits.

**Cross-Pillar Correlation Analysis:**

| Correlation | Example Insight |
|-------------|-----------------|
| Habit → Mood | "Your mood is 45% better on days you meditate" |
| Habit → Energy | "Energy levels are 2 points higher when you do morning exercise" |
| Habit → Sleep | "Sleep quality improves 20% when you avoid caffeine after 2pm" |
| Habit → Stress | "Stress levels are 35% lower on journaling days" |
| Habit → Workouts | "You complete workouts 80% more often on meditation days" |

**Correlation Requirements:**
- Minimum 14 days of habit + correlating metric data
- Correlation coefficient >0.3 to surface insight
- Insights update weekly with new data

**Weekly Habit-Correlation Summary:**
- Top 3 positive correlations: "These habits boost your wellbeing"
- Top 3 negative correlations: "These habits may be holding you back" (e.g., "Late night screens correlate with 25% worse sleep")
- Habit effectiveness ranking

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Habit ID | UUID | Required | System |
| Correlated Metric | Enum | mood/energy/sleep/stress/workout | System |
| Correlation Coefficient | Float | -1.0 to 1.0 | System |
| Insight Text | String | Auto-generated | User-only |
| Sample Size | Integer | Days of data used | System |
| Generated At | ISO 8601 | Weekly update | System |

**Behaviors:**
- Correlations calculate in background (not real-time)
- Weekly summary delivered Sunday evening
- Users can tap any insight to see underlying data
- Negative correlations phrased constructively
- No judgment on "bad" habits - just data

### Acceptance Criteria

**AC1: Minimum Data Requirement**
Given the user has <14 days of habit + correlating metric data,
When viewing habit insights,
Then message shows: "Keep tracking! Correlations will appear after 14+ days."

**AC2: Positive Correlation Display**
Given habit "Meditation" correlates with higher mood (+0.4 coefficient),
When insights are generated,
Then insight shows: "Your mood is X% better on days you meditate."

**AC3: Negative Correlation Display**
Given habit "Late night screens" correlates with worse sleep (-0.35 coefficient),
When insights are generated,
Then insight shows: "Late night screens correlate with X% worse sleep quality."

**AC4: Weekly Summary Delivery**
Given the user has sufficient data,
When Sunday evening arrives,
Then weekly habit-correlation summary is generated and available.

**AC5: Insight Drill-Down**
Given a correlation insight is displayed,
When the user taps for details,
Then underlying data shows (e.g., mood on meditation days vs. non-meditation days).

**AC6: Habit Effectiveness Ranking**
Given multiple habits have correlations,
When viewing insights,
Then habits are ranked by positive impact on wellbeing.

**AC7: Multiple Metrics Per Habit**
Given a habit correlates with multiple metrics (mood AND energy),
When viewing that habit's insights,
Then all relevant correlations are shown.

**AC8: Confidence Indicator**
Given a correlation is based on limited data (14-21 days),
When insight displays,
Then confidence indicator shows: "Early insight - more data will improve accuracy."

### Success Metrics
- Habit-correlation insights: 80% of users receive habit correlation insights within 14 days
- Insight engagement: 60% of users view habit correlations weekly
- Insight accuracy: 70% user agreement that correlations match their experience
- Behavior change: 40% report adjusting habits based on correlation insights

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Correlation calc <10s | Auth required | Correlations user-only | Screen reader support | iOS 14+, Android 10+ |
| Insights load <2s | Encrypted at rest | No habit data shared | Min 4.5:1 contrast | All channels |

### Dependencies
- **Prerequisite Stories:** S07.3.2 (Habit Logging), S07.1.1 (Mood), S07.4.1 (Energy)
- **Related Stories:** S07.1.2, S07.4.2
- **External Dependencies:** E5 (Sleep, Workout data), E8 (Cross-Domain Intelligence)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Habit never completed (no data) | No correlation possible; skip in analysis |
| Habit completed every day (no variance) | Cannot calculate correlation; note: "Try skipping to see if there's a difference" |
| Correlating metric not logged (e.g., no sleep data) | Show available correlations; "Log sleep to see sleep correlations" |
| Spurious correlation detected | Require coefficient >0.3 AND p-value <0.05 to surface |
| User disputes correlation | Allow feedback: "This doesn't feel right" - flag for review |

### Open Questions
- Should we show negative correlations as "opportunities" or as-is?
- How should we handle habits that are new (<7 days old)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Correlations calculating for mood, energy, sleep, stress, workouts
- [ ] Weekly summary generating on schedule
- [ ] Drill-down to underlying data working
- [ ] Effectiveness ranking functional
- [ ] Confidence indicators displaying
- [ ] Performance requirements verified

---