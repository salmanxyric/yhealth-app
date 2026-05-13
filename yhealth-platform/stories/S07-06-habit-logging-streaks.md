---
type: story
id: S07.3.2
title: Habit Logging & Streaks
epic: E07
epic_name: Wellbeing Pillar
feature: F7.3
feature_name: Habit Tracking
product: yhealth-platform
priority: P0
status: Complete
story_points: 0
created: 2025-12-24
---

# S07.3.2: Habit Logging & Streaks


### User Story
**As a** Habit Formation Seeker (P4),
**I want to** log my habits daily and track my streaks with milestone celebrations,
**So that** I can build consistency and feel motivated by my progress.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Daily habit logging is the core interaction - a checklist view where users mark habits complete. Streak tracking provides motivation with visual progress and milestone celebrations (3-day, 7-day, 21-day, 30-day).

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Simple checklist view with checkboxes. Today's habits only. Quick "all done" completion. |
| **Deep** | Detailed logging with notes per habit, historical view, streak analytics, export habit data. |

**Streak Milestones:**
| Streak | Milestone | Celebration |
|--------|-----------|-------------|
| 3 days | Getting started | "3-day streak! You're building momentum." |
| 7 days | One week | "7-day streak! Habits are forming." |
| 21 days | Habit forming | "21-day streak! Research says habits form around now." |
| 30 days | One month | "30-day streak! This is who you are now." |
| 60 days | Two months | "60-day streak! Impressive consistency." |
| 90 days | Three months | "90-day streak! Truly embedded habit." |

**Daily Dashboard:**
- Today's habits filtered by frequency (only applicable habits shown)
- Completion status for each habit
- Streak count displayed per habit
- Overall daily completion rate

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Habit ID | UUID | Required | System |
| Date | Date | Required | System |
| Completed | Boolean | Checkbox type | User-only |
| Value | Integer | Counter/Duration type | User-only |
| Rating | Integer 1-10 | Rating type | User-only |
| Note | String | Max 500 chars | User-only |
| Current Streak | Integer | System calculated | User-only |
| Longest Streak | Integer | System calculated | User-only |

**Behaviors:**
- Dashboard shows today's applicable habits based on frequency
- Checkbox habits toggle with single tap
- Counter/Duration habits show +/- or input field
- Streak updates immediately when habit completed
- Streak resets if day missed (for daily habits)
- Partial completion possible for "X times per week" habits

### Acceptance Criteria

**AC1: Daily Habit Dashboard**
Given the user opens habit tracking,
When today's date loads,
Then only habits with applicable frequency (daily, today's weekday, etc.) appear.

**AC2: Checkbox Habit Completion**
Given a checkbox habit is displayed,
When the user taps the checkbox,
Then the habit marks complete with visual feedback (checkmark, color change).

**AC3: Counter Habit Logging**
Given a counter habit is displayed (e.g., "Glasses of water"),
When the user taps +/- or enters a number,
Then the value saves and progress toward target updates.

**AC4: Duration Habit Logging**
Given a duration habit is displayed (e.g., "Deep work"),
When the user enters minutes,
Then the duration saves and progress displays.

**AC5: Rating Habit Logging**
Given a rating habit is displayed,
When the user slides to a rating (1-10),
Then the rating saves for that day.

**AC6: Streak Display**
Given a habit has been completed consecutive days,
When viewing the habit,
Then current streak count displays (e.g., "🔥 7").

**AC7: Streak Milestone Celebration**
Given a user completes a habit reaching 7-day streak,
When the streak milestone is reached,
Then celebratory message appears: "7-day streak! Habits are forming."

**AC8: Streak Reset**
Given a daily habit was missed yesterday,
When the user opens habits today,
Then streak shows reset to 0 with message: "Streak ended. Start fresh today!"

**AC9: Note on Habit (Deep Mode)**
Given the user is in Deep mode,
When they add a note to a habit completion,
Then the note saves with that day's log.

**AC10: Light Mode Quick View**
Given the user is in Light mode,
When viewing habits,
Then a simplified checklist with minimal detail appears.

### Success Metrics
- Daily habit logging rate: 65% of users log habits ≥5 days/week
- Streak achievement: 50% achieve 7+ day streak on ≥1 habit within first month
- 21-day streak: 30% achieve 21-day streak on ≥1 habit
- Habit completion rate: 70% average completion across all habits

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Habit toggle <500ms | Auth required | Habit logs user-only | 44x44pt touch targets | iOS 14+, Android 10+ |
| Dashboard load <2s | Encrypted at rest | No sharing without consent | Color-blind safe indicators | All channels |

### Dependencies
- **Prerequisite Stories:** S07.3.1 (Habit Creation)
- **Related Stories:** S07.3.3, S07.6.3
- **External Dependencies:** E4 (Mobile App), E3 (WhatsApp for quick logging)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Habit never completed (0% for 14+ days) | Suggestion: "Haven't completed [habit]. Adjust goal or remove to keep list focused?" |
| Habit logged after midnight for yesterday | Allow backdating within 24 hours with confirmation |
| Multiple completions same day (counter) | Allow updating value; keep latest |
| Streak broken after 21+ days | Encouragement: "21-day streak ended! One miss doesn't erase progress. Start again?" |
| Offline logging | Queue locally; sync when reconnected; streaks calculate on server |

### Open Questions
- Should we allow "grace period" for streaks (1 missed day doesn't break)?
- How should we handle timezone changes for streak calculation?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 4 habit types logging correctly
- [ ] Streaks calculating and displaying accurately
- [ ] Milestone celebrations appearing at correct thresholds
- [ ] Light and Deep modes rendering correctly
- [ ] Performance requirements verified
- [ ] WhatsApp quick logging functional

---