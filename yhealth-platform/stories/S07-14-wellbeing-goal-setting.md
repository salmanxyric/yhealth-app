---
type: story
id: S07.6.1
title: Wellbeing Goal Setting
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

# S07.6.1: Wellbeing Goal Setting


### User Story
**As a** Habit Formation Seeker (P4),
**I want to** set wellbeing improvement goals with AI-suggested targets,
**So that** I can work toward meaningful improvements in my mood, stress, energy, and habits.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Wellbeing goal setting applies the SMART framework to mental and emotional improvement. AI suggests realistic targets based on user's baseline data. Goals can target mood improvement, stress reduction, energy optimization, habit formation, sleep quality, or emotional regulation.

**Goal Categories:**

| Category | Example Goals |
|----------|---------------|
| **Mood Improvement** | "Increase average mood from 6 to 8 within 30 days" |
| **Stress Reduction** | "Reduce high-stress days (≥7) from 4/week to 1/week" |
| **Energy Optimization** | "Achieve morning energy ≥7 for 5+ days/week" |
| **Habit Formation** | "Meditate 5 days/week for 21 consecutive days" |
| **Sleep Quality** | "Improve sleep quality score from 70 to 85" |
| **Emotional Regulation** | "Reduce mood volatility (daily range <3 points)" |

**SMART Goal Framework:**
- **Specific:** Clear target metric (mood score, stress days, habit streak)
- **Measurable:** Quantifiable progress tracking
- **Achievable:** AI suggests realistic targets based on baseline
- **Relevant:** Connected to wellbeing improvements
- **Time-bound:** 7-day, 21-day, 30-day, 90-day windows

**AI-Suggested Targets:**
Based on user's baseline data (last 14 days), AI suggests achievable improvements:
- If baseline mood is 5.5, suggest target of 6.5-7.0 (realistic 15-25% improvement)
- If baseline stress days are 5/week at ≥7, suggest reduction to 3/week
- If no baseline data, suggest starting goals (e.g., "Log mood daily for 7 days")

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Goal ID | UUID | Required | System |
| Goal Category | Enum | From 6 categories | User-only |
| Target Metric | String | Specific to category | User-only |
| Current Baseline | Float | System calculated | System |
| Target Value | Float | User or AI suggested | User-only |
| Timeframe | Enum | 7d/21d/30d/90d | User-only |
| Start Date | Date | Required | System |
| End Date | Date | Calculated | System |
| Status | Enum | active/completed/abandoned | System |

**Behaviors:**
- AI suggests goals based on available data
- User can accept, modify, or create custom goals
- Goals appear in wellbeing dashboard
- Progress updates daily
- Celebration on goal achievement

### Acceptance Criteria

**AC1: Goal Category Selection**
Given the user wants to set a wellbeing goal,
When they view goal categories,
Then all 6 categories are available: Mood, Stress, Energy, Habit, Sleep, Emotional Regulation.

**AC2: AI-Suggested Target**
Given the user has 14+ days of mood data (baseline: 5.5),
When they select "Mood Improvement" goal,
Then AI suggests: "Increase average mood to 6.5-7.0 within 30 days."

**AC3: Custom Target Override**
Given AI suggests a target,
When the user wants a different target,
Then they can modify the value (within reasonable bounds).

**AC4: Timeframe Selection**
Given the user is creating a goal,
When they select timeframe,
Then options are: 7 days, 21 days, 30 days, 90 days.

**AC5: Goal Without Baseline Data**
Given the user has <14 days of relevant data,
When they try to set a goal,
Then AI suggests data collection goal: "Log mood daily for 7 days to establish baseline."

**AC6: SMART Validation**
Given the user creates a goal,
When they attempt to save,
Then validation ensures: specific metric, measurable target, time-bound.

**AC7: Active Goal Limit**
Given the user has 3 active wellbeing goals,
When they try to add a 4th,
Then suggestion appears: "Focus on fewer goals for better results. Complete one first?"

**AC8: Goal Dashboard Display**
Given the user has active goals,
When they view wellbeing dashboard,
Then goals appear with progress indicators.

### Success Metrics
- Goal creation: 60% of users create ≥1 wellbeing goal
- AI suggestion acceptance: 70% accept AI-suggested targets (with or without modification)
- Goal achievement: 55% achieve wellbeing goal within timeframe
- Multi-goal engagement: 40% have 2+ active goals

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Goal create <1s | Auth required | Goal data user-only | Screen reader support | iOS 14+, Android 10+ |
| AI suggestion <2s | Encrypted | Baseline data not shared | Min 4.5:1 contrast | All channels |

### Dependencies
- **Prerequisite Stories:** S07.1.1 (Mood), S07.4.1 (Energy), S07.5.1 (Stress), S07.3.1 (Habits)
- **Related Stories:** S07.6.2, S07.6.3
- **External Dependencies:** E5 (Sleep data), E8 (AI suggestion engine)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Unrealistic goal (mood 4→10 in 7 days) | Warning: "This goal seems ambitious. Smaller improvements may be more sustainable." |
| Goal already achieved at creation | Note: "You're already meeting this target! Set a stretch goal?" |
| Goal category without data | Prompt to log relevant data first |
| All goals abandoned | Check-in: "Goals haven't been resonating. Want help adjusting?" |
| Duplicate active goal in same category | Warning: "You have an active mood goal. Replace or keep both?" |

### Open Questions
- Should we allow team/accountability partner goals?
- What happens to goals when user goes on vacation?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 6 goal categories functional
- [ ] AI-suggested targets generating based on baseline
- [ ] Custom target override working
- [ ] SMART validation enforced
- [ ] Goal dashboard displaying progress
- [ ] Performance requirements verified

---