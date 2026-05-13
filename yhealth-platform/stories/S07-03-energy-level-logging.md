---
type: story
id: S07.4.1
title: Energy Level Logging
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

# S07.4.1: Energy Level Logging


### User Story
**As a** Busy Professional (P2),
**I want to** quickly rate my energy level multiple times per day with optional context,
**So that** I can understand my energy patterns and optimize my schedule for when I feel most productive.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Energy tracking captures the dynamic nature of how users feel throughout the day. Unlike one-time daily ratings, users can log energy multiple times to reveal patterns - morning energy baseline, afternoon dips, evening wind-down. Quick slider input makes logging effortless.

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | 2-3 prompted check-ins per day (morning, afternoon, evening) with simple 1-10 slider. 5-second interaction. |
| **Deep** | Unlimited on-demand logging with context tagging, optional notes, and energy timeline visualization. |

**Energy Rating Scale:**
| Rating | Label | Description |
|--------|-------|-------------|
| 1-2 | Exhausted | Cannot function, need rest |
| 3-4 | Low | Fatigued, struggling to focus |
| 5-6 | Neutral | Functional but not optimal |
| 7-8 | Good | Alert, productive, focused |
| 9-10 | Highly Energized | Peak performance, excellent focus |

**Context Tags (Deep Mode):**
- Post-meal
- Post-workout
- During work
- After sleep
- After caffeine
- After social activity
- Stressed
- Relaxed

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Energy Rating | Integer 1-10 | Required | User-only |
| Context Tag | Enum | From tag list | User-only |
| Note | String | Max 200 chars | User-only |
| Prompt Type | Enum | morning/afternoon/evening/on-demand | System |
| Timestamp | ISO 8601 | Required | System |
| Channel | Enum | app/whatsapp/voice | System |

**Prompted Check-in Schedule:**
| Prompt | Default Time | Customizable |
|--------|--------------|--------------|
| Morning | 8:00 AM | Yes, 6-10 AM window |
| Afternoon | 2:00 PM | Yes, 12-4 PM window |
| Evening | 7:00 PM | Yes, 5-9 PM window |

**Behaviors:**
- Single slider tap for quick rating (no confirmation needed)
- Context tags optional but encouraged via "What's affecting your energy?"
- Prompted check-ins dismissable without penalty
- Energy data feeds Mental Recovery Score (20% weight)
- Cross-pillar integration: Energy vs sleep, meals, workouts

### Acceptance Criteria

**AC1: Quick Energy Rating**
Given the user opens energy check-in,
When they slide to a number (1-10),
Then the rating saves immediately with timestamp.

**AC2: Morning Prompt Delivery**
Given prompt time is reached (default 8 AM),
When user has app open or notifications enabled,
Then "How's your energy this morning?" prompt appears.

**AC3: Afternoon/Evening Prompts**
Given afternoon (2 PM) or evening (7 PM) prompt time,
When the user hasn't logged energy recently,
Then appropriate prompt appears: "Afternoon energy check?" or "How's your evening energy?"

**AC4: Custom Prompt Timing**
Given the user wants different prompt times,
When they adjust in settings,
Then prompts deliver at new times (within allowed windows).

**AC5: Context Tagging (Deep Mode)**
Given the user logs energy in Deep mode,
When they select context tags (e.g., "Post-meal", "After caffeine"),
Then tags attach to the energy record.

**AC6: WhatsApp Energy Check**
Given the user receives "Energy check: 1-10?" on WhatsApp,
When they reply with a number (e.g., "7"),
Then energy rating is logged from WhatsApp channel.

**AC7: On-Demand Logging**
Given the user wants to log energy outside prompted times,
When they access energy check-in manually,
Then they can log at any time without restriction.

**AC8: Dismiss Without Penalty**
Given an energy prompt appears,
When the user dismisses without logging,
Then no negative feedback or penalty occurs.

### Success Metrics
- Daily energy logging: 70% of users log energy ≥2x/day
- Prompt response rate: 60% of prompted check-ins completed
- Multi-time-point logging: 40% log energy ≥3x/day
- Average check-in time: <5 seconds

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Rating save <1s | Auth required | Energy data user-only | Voice input support | iOS 14+, Android 10+ |
| Prompt delivery <2s | Encrypted at rest | No sharing without consent | Color-blind safe slider | WhatsApp, Voice channels |

### Dependencies
- **Prerequisite Stories:** None (parallel to S07.1.1)
- **Related Stories:** S07.4.2, S07.1.1
- **External Dependencies:** E4 (Mobile App), E3 (WhatsApp), E2 (Voice coaching)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Chronic low energy (average <4 for 7+ days) | Health concern prompt: "Energy has been low. Consider talking to a healthcare provider?" |
| Missed energy check-ins (3+ days) | Re-engagement: "Haven't tracked energy recently. Quick check: How's your energy right now?" |
| Contradictory ratings (9 then 2 within 1 hour) | Accept both; flag for pattern analysis (possible caffeine crash, etc.) |
| User in meeting during prompt | Prompt waits 30 minutes before re-prompting (not intrusive) |
| Offline logging | Queue locally; sync when reconnected |

### Open Questions
- Should energy prompts sync with calendar (avoid during meetings)?
- What's the minimum interval between on-demand check-ins?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 1-10 slider functional with instant save
- [ ] Prompted check-ins delivered at correct times
- [ ] Custom prompt timing configurable
- [ ] Context tags working in Deep mode
- [ ] Multi-channel logging (app, WhatsApp, voice)
- [ ] Energy data feeds Mental Recovery Score
- [ ] Performance requirements verified (<1s save)

---