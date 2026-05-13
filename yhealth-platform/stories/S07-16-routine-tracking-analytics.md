---
type: story
id: S07.6.3
title: Routine Tracking & Analytics
epic: E07
epic_name: Wellbeing Pillar
feature: F7.6
feature_name: Wellbeing Goals & Routines
product: yhealth-platform
priority: P0
status: Draft
story_points: 0
created: 2025-12-24
---

# S07.6.3: Routine Tracking & Analytics


### User Story
**As a** Habit Formation Seeker (P4),
**I want to** track my routine completion with streaks and see how routines affect my wellbeing,
**So that** I can stay motivated and understand which routines make the biggest difference.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Routine tracking provides daily checklists for routine steps, streak tracking for consistency, and analytics showing how routines correlate with mood, energy, and sleep. AI recommendations suggest routine optimizations based on data.

**Daily Routine Checklist:**
- Routine steps appear as checklist at trigger time
- Each step can be marked complete
- Partial completion tracked (3/5 steps = 60%)
- Completion time recorded

**Routine Streaks:**
| Streak | Milestone |
|--------|-----------|
| 3 days | "3-day routine streak! Building momentum." |
| 7 days | "7-day streak! This is becoming automatic." |
| 21 days | "21-day streak! Your routine is now a habit." |
| 30 days | "30-day streak! Routines are part of who you are." |

**Routine Analytics:**
- **Consistency Score:** Days completed / Days applicable (e.g., 5/7 = 71%)
- **Average Completion:** Steps completed per day
- **Best/Worst Days:** Which days are most/least consistent
- **Completion Time:** Average time to complete routine

**Routine-Outcome Correlations:**
| Correlation | Example Insight |
|-------------|-----------------|
| Routine → Mood | "Morning routine days have 25% better mood" |
| Routine → Energy | "Evening routine = +2 energy next morning" |
| Routine → Sleep | "Evening routine improves sleep quality 18%" |
| Routine → Recovery | "Routine completion = +5 Mental Recovery Score bonus" |

**AI Optimization Recommendations:**
- "Based on your patterns, adding meditation to morning routine could boost mood 20%"
- "Your stress is lowest on routine-completion days. Prioritize your morning routine."
- "Evening journaling step has highest impact. Consider extending it."

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Routine ID | UUID | Required | System |
| Date | Date | Required | System |
| Steps Completed | Array<Boolean> | Per step | User-only |
| Completion Rate | Float 0-1 | Calculated | User-only |
| Time Started | Time | Optional | User-only |
| Time Completed | Time | Optional | User-only |
| Current Streak | Integer | Calculated | User-only |
| Longest Streak | Integer | Calculated | User-only |

**Behaviors:**
- Routine checklist appears at trigger time (or accessible anytime)
- Steps can be completed in any order
- Partial completion counts toward analytics
- +5 Mental Recovery Score bonus when routine completed (100%)
- Streak resets if routine missed on applicable day

### Acceptance Criteria

**AC1: Daily Routine Checklist**
Given a routine is set for today,
When the user opens routines,
Then checklist appears with all routine steps.

**AC2: Step Completion**
Given a routine step is shown,
When the user taps the checkbox,
Then step marks complete with visual feedback.

**AC3: Partial Completion Tracking**
Given the user completes 3 of 5 steps,
When viewing routine status,
Then completion shows: "3/5 steps (60%)"

**AC4: Routine Streak Display**
Given the user has completed routine for 7 consecutive days,
When viewing routine,
Then streak displays: "🔥 7-day streak!"

**AC5: Streak Milestone Celebration**
Given the user reaches 7-day streak,
When they complete today's routine,
Then celebratory message appears.

**AC6: Consistency Score**
Given the user has routine data for 2+ weeks,
When viewing analytics,
Then consistency score displays (e.g., "71% consistency this month").

**AC7: Routine-Outcome Correlation**
Given the user has 14+ days of routine + mood data,
When correlations calculate,
Then insight appears: "Morning routine days have X% better mood."

**AC8: AI Optimization Recommendation**
Given routine correlation data shows meditation has high impact,
When recommendations generate,
Then suggestion appears: "Add meditation to your routine for better results."

**AC9: Mental Recovery Score Bonus**
Given the user completes routine 100%,
When Mental Recovery Score calculates,
Then +5 bonus is applied.

**AC10: Streak Reset**
Given the user misses routine on an applicable day,
When the next day loads,
Then streak resets to 0 with message: "Routine streak ended. Start fresh today!"

### Success Metrics
- Routine consistency: 60% maintain routine ≥5 days/week for 30+ days
- Streak achievement: 50% achieve 7-day routine streak
- Correlation insights: 70% receive routine-outcome insights within 14 days
- Morning routine impact: 70% report improved mood/energy on routine days

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Checklist load <1s | Auth required | Routine data user-only | 44x44pt touch targets | iOS 14+, Android 10+ |
| Analytics load <2s | Encrypted | Correlations user-only | Screen reader support | All channels |

### Dependencies
- **Prerequisite Stories:** S07.6.2 (Routine Templates), S07.1.1 (Mood), S07.4.1 (Energy)
- **Related Stories:** S07.6.1, S07.3.2 (Habit Streaks - similar patterns)
- **External Dependencies:** E5 (Sleep data), E8 (Cross-Domain Intelligence)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Routine never completed (0% for 7+ days) | Suggestion: "Haven't completed this routine. Make it easier or remove?" |
| Routine completed very late (10pm for morning routine) | Accept but note: "Morning routine completed at 10pm - consider adjusting schedule?" |
| Partial completion consistent (always 60%) | Insight: "You consistently complete X steps. Make those your core routine?" |
| User on vacation (unusual schedule) | Allow "pause" routine without breaking streak (manual flag) |
| Routine step takes much longer than expected | Note in analytics; suggest adjusting duration |

### Open Questions
- Should routine completion count if done in wrong order?
- How should we handle timezone changes for routine streaks?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Daily checklist rendering correctly
- [ ] Step completion tracking functional
- [ ] Partial completion analytics working
- [ ] Streak tracking and milestones functional
- [ ] Routine-outcome correlations generating
- [ ] AI recommendations displaying
- [ ] Mental Recovery Score bonus applying
- [ ] Performance requirements verified

---