---
type: story
id: S07.6.2
title: Routine Templates & Builder
epic: E07
epic_name: Wellbeing Pillar
feature: F7.6
feature_name: Wellbeing Goals & Routines
product: yhealth-platform
priority: P0
status: Complete
story_points: 0
created: 2025-12-24
---

# S07.6.2: Routine Templates & Builder


### User Story
**As a** Busy Professional (P2),
**I want to** use pre-built routine templates or create custom routines,
**So that** I can build consistent morning and evening practices without figuring out what to include.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Pre-built routine templates provide research-backed sequences for morning energy, evening wind-down, and stress reset. Users can use templates as-is or customize. The custom builder allows creating any routine from scratch.

**Pre-Built Routine Templates:**

**Morning Energizer (15 minutes):**
1. Gratitude reflection (1 min): "What are you grateful for today?"
2. Light stretching (5 min): Gentle movement to wake up body
3. Hydrate (1 glass water): Rehydrate after sleep
4. Deep breathing (3 min): 4-7-8 breathing technique
5. Intention setting (2 min): "What's one intention for today?"

**Evening Wind-Down (20 minutes):**
1. Screen-free time (start 30 min before bed): No phones, TV, screens
2. Reflection journaling (5 min): "What went well today? What to release?"
3. Breathing exercise (3 min): Box breathing or progressive relaxation
4. Gratitude practice (2 min): "Three things from today I'm grateful for"
5. Sleep preparation: Dark, cool room, ready for rest

**Stress Reset (15 minutes):**
1. Find quiet space (1 min): Step away from stressor
2. Deep breathing (5 min): Focus on slowing breath
3. Body scan (5 min): Notice tension, consciously relax
4. Stress journaling (5 min): "What's causing stress? What's in my control?"

**Custom Routine Builder:**
- Add/remove steps from templates
- Define custom steps with name, duration, description
- Set routine frequency: Daily, Weekdays, Weekends, Specific days
- Time-based triggers: "Start at 7am"

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Routine ID | UUID | Required | System |
| Routine Name | String | 1-100 chars | User-only |
| Routine Type | Enum | morning/evening/stress/custom | User-only |
| Steps | Array<Step> | 2-10 steps | User-only |
| Step Name | String | Required | User-only |
| Step Duration | Integer (minutes) | 1-60 | User-only |
| Step Description | String | Optional | User-only |
| Frequency | Enum | daily/weekdays/weekends/specific | User-only |
| Trigger Time | Time | Optional | User-only |
| Based On Template | UUID | If from template | System |

**Behaviors:**
- Templates appear as starting points
- Customization saves as new routine (doesn't modify template)
- Routines appear in daily checklist at trigger time
- Multiple routines supported (morning AND evening)
- Routine completion tracked per day

### Acceptance Criteria

**AC1: Template Selection**
Given the user wants to start a routine,
When they view templates,
Then Morning Energizer, Evening Wind-Down, Stress Reset are available.

**AC2: Use Template As-Is**
Given the user selects Morning Energizer template,
When they confirm without changes,
Then the routine is created with all template steps.

**AC3: Customize Template**
Given the user selects a template,
When they remove/add steps or adjust durations,
Then customized routine saves as their own (template unchanged).

**AC4: Custom Routine Creation**
Given the user wants a unique routine,
When they select "Create Custom",
Then they can add steps, durations, and descriptions from scratch.

**AC5: Step Management**
Given the user is editing a routine,
When they add/remove/reorder steps,
Then changes save correctly.

**AC6: Frequency Setting**
Given the user creates a routine,
When they set frequency to "Weekdays only",
Then routine appears only Monday-Friday.

**AC7: Trigger Time Setting**
Given the user wants reminders,
When they set trigger time (e.g., 7:00 AM),
Then notification triggers at that time on applicable days.

**AC8: Multiple Routines**
Given the user has Morning Energizer routine,
When they create Evening Wind-Down,
Then both routines are active independently.

**AC9: Routine Step Detail**
Given a routine step is displayed,
When the user taps for details,
Then step description/instructions appear.

### Success Metrics
- Routine adoption: 65% of users create ≥1 routine
- Template usage: 70% of routines start from templates
- Customization rate: 40% customize templates (add/remove steps)
- Multiple routine adoption: 35% have morning AND evening routines

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Routine create <1s | Auth required | Routine data user-only | Voice input for steps | iOS 14+, Android 10+ |
| Template load <500ms | Encrypted | No sharing | 44x44pt touch targets | All channels |

### Dependencies
- **Prerequisite Stories:** S07.3.1 (Habit Creation - similar UX patterns)
- **Related Stories:** S07.6.1, S07.6.3
- **External Dependencies:** E4 (Mobile App UI)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Routine with 0 steps | Validation: "Routines need at least 2 steps" |
| Step duration >60 minutes | Warning: "Long steps may be hard to complete consistently" |
| Overlapping routine times | Allow but note: "Morning Energizer and Yoga Routine overlap at 7am" |
| Template updated by system | User's custom routine unaffected; templates are starting points only |
| Delete routine with completion history | Confirmation: "Delete routine? History will be preserved for reference." |

### Open Questions
- Should we offer audio/video guides for routine steps?
- Can users share custom routines with others?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 3 pre-built templates available
- [ ] Template customization functional
- [ ] Custom routine builder working
- [ ] Step add/remove/reorder functional
- [ ] Frequency and trigger time settings working
- [ ] Multiple routines supported
- [ ] Performance requirements verified

---