---
type: story
id: S07.3.1
title: Habit Creation & Configuration
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

# S07.3.1: Habit Creation & Configuration


### User Story
**As an** Optimization Enthusiast (P3),
**I want to** create and configure custom habits with flexible tracking types and frequencies,
**So that** I can track any behavior that matters to me and discover correlations with my health outcomes.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
yHealth's habit tracking is user-customizable, not limited to predefined categories. Users can track ANY habit (meditation, reading, alcohol consumption, creative work) with four tracking types and flexible frequencies. This enables discovering personal patterns rather than prescribing "correct" habits.

**Tracking Types:**

| Type | Description | Example |
|------|-------------|---------|
| **Checkbox** | Binary yes/no | "Meditated today" → ✓ or ✗ |
| **Counter** | Quantity | "Glasses of water" → 8 |
| **Duration** | Time-based | "Deep work" → 90 minutes |
| **Rating** | 1-10 scale | "Social connection quality" → 8/10 |

**Frequency Options:**
- Daily
- Weekly (any day completes)
- Specific days (M/T/W/T/F/S/S selectable)
- X times per week (e.g., 3x/week)

**Pre-populated Suggestions:**
| Category | Suggested Habits |
|----------|-----------------|
| Mindfulness | Meditation, Journaling, Gratitude practice, Breathing exercises |
| Social | Quality time with loved ones, Meaningful conversation, Phone call with friend |
| Health | Morning routine, Evening routine, Stretching, Cold shower |
| Productivity | Deep work session, Reading, Learning new skill, No phone before 9am |
| Avoidance | No alcohol, No caffeine after 2pm, No social media, No screens before bed |
| Recreation | Outdoor time, Hobby time, Play/fun activity, Music/art |

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Habit Name | String | 1-100 chars, required | User-only |
| Habit Category | Enum | From categories or custom | User-only |
| Tracking Type | Enum | checkbox/counter/duration/rating | User-only |
| Frequency | Enum | daily/weekly/specific_days/x_per_week | User-only |
| Specific Days | Array<Enum> | Mon-Sun if specific_days | User-only |
| Target Value | Integer | Counter/Duration only | User-only |
| Reminder Time | Time | Optional | User-only |
| Created At | ISO 8601 | Required | System |

**Behaviors:**
- Users can create unlimited habits (no cap)
- Categories are suggested but users can create custom categories
- Habits appear in daily dashboard based on frequency
- Reminder notifications optional per habit
- Habits can be archived (hidden but data preserved) or deleted

### Acceptance Criteria

**AC1: Create Checkbox Habit**
Given the user wants to track a binary habit,
When they create a habit with type "checkbox",
Then the habit appears with ✓/✗ toggle in daily view.

**AC2: Create Counter Habit**
Given the user wants to track a quantity,
When they create a habit with type "counter" (e.g., "Glasses of water", target 8),
Then the habit shows +/- buttons and progress toward target.

**AC3: Create Duration Habit**
Given the user wants to track time spent,
When they create a habit with type "duration" (e.g., "Deep work", target 60 min),
Then the habit allows entering minutes with progress display.

**AC4: Create Rating Habit**
Given the user wants to track quality on a scale,
When they create a habit with type "rating" (e.g., "Sleep quality"),
Then the habit shows 1-10 slider for daily rating.

**AC5: Set Frequency (Daily)**
Given the user creates a daily habit,
When viewing the habit dashboard,
Then the habit appears every day.

**AC6: Set Frequency (Specific Days)**
Given the user creates a habit for Mon/Wed/Fri only,
When viewing the habit dashboard on Tuesday,
Then the habit does not appear (only on selected days).

**AC7: Use Pre-populated Suggestions**
Given the user is creating a new habit,
When they view suggestions,
Then categorized suggestions are shown and selectable.

**AC8: Create Custom Category**
Given no existing category fits the user's habit,
When they type a custom category name,
Then the new category is created and available for future habits.

**AC9: Set Reminder**
Given the user wants a reminder for a habit,
When they set reminder time (e.g., 7:00 AM),
Then notification triggers at that time on applicable days.

**AC10: Archive Habit**
Given the user no longer tracks a habit but wants to keep data,
When they archive the habit,
Then it's hidden from daily view but data is preserved.

### Success Metrics
- Habit creation adoption: 70% of users create ≥1 custom habit
- Multi-habit tracking: 50% create 3+ habits
- Suggestion usage: 40% of habits created from suggestions
- Custom category creation: 20% create custom category

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Habit create <1s | Auth required | Habit data user-only | Voice input for habit name | iOS 14+, Android 10+ |
| Dashboard load <2s | Encrypted at rest | No habit sharing | 44x44pt touch targets | All channels |

### Dependencies
- **Prerequisite Stories:** None (foundation for habits)
- **Related Stories:** S07.3.2, S07.3.3
- **External Dependencies:** E4 (Mobile App UI)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Too many habits created (>15 active) | Suggestion: "Tracking many habits! Focus on 5-7 core habits for better consistency?" |
| Duplicate habit name | Allow duplicates (user may want "Morning meditation" and "Evening meditation") |
| Empty habit name | Validation error: "Habit name required" |
| Very long habit name (>100 chars) | Truncate at 100; warning shown |
| Delete habit with data | Confirmation: "Delete habit and all logged data? This cannot be undone." |

### Open Questions
- Should we limit active habits to prevent overwhelm?
- What's the maximum number of custom categories?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 4 tracking types functional (checkbox, counter, duration, rating)
- [ ] All frequency options working
- [ ] Pre-populated suggestions displayed
- [ ] Custom categories creatable
- [ ] Reminders triggering at correct times
- [ ] Archive and delete functional
- [ ] Performance requirements verified

---