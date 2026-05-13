---
type: story
id: S05.4.2
title: Goal Progress Tracking
epic: E05
feature: F5.4
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As a** Busy Professional (P2),
**I want to** see my goal progress at a glance and receive milestone celebrations,
**So that** I stay motivated and know if I'm on track without deep analysis.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Goal progress is visible throughout the app - on dashboard, in fitness tab, and via notifications. Progress visualization includes bars, streaks, and trend indicators. The system celebrates milestones and suggests adjustments when goals are consistently missed.

**Progress Visualization:**
- **Progress Bar:** Visual fill showing % complete
- **Streak Counter:** Days/weeks of consecutive goal completion
- **Trend Indicator:** Arrow showing if progress is improving/declining
- **Success Rate:** % of goal-eligible days where goal was met

**Milestone Celebrations:**
- First goal completion: "You did it! First step towards your goal."
- 7-day streak: "One week strong! Keep it up!"
- 30-day streak: "A whole month of consistency! Amazing!"
- 50% progress: "Halfway there! You're making great progress."
- Goal achieved: "GOAL COMPLETE! Time to set a new challenge?"

**Goal Adjustment Prompts:**
When goals are consistently missed (>70% failure rate over 7+ days):
- "Struggling with this goal. Let's adjust it together?"
- Suggest scaled-back version
- Option to keep current goal or adjust

**Recovery-Aware Goal Suggestions:**
- When recovery is low, suggest rest day even if it breaks streak
- "Your recovery is low today. Taking rest won't hurt your progress - it'll help it!"

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | 1-3 top priority goals with simple progress bars and streak counters |
| **Deep** | All active goals, detailed analytics, historical performance, success rate charts |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Goal ID | UUID | Required | System |
| Daily Progress | Number | Against target | User-only |
| Current Streak | Integer | Days consecutive | User-only |
| Success Rate | Float % | Calculated | User-only |
| Milestone Achieved | Enum | From milestones | User-only |
| Adjustment Accepted | Boolean | User action | Aggregated |

**Behaviors:**
- Progress updates in real-time as data syncs
- Milestones trigger celebrations immediately
- Adjustment prompts appear after 7 days of >70% failure
- Recovery-aware suggestions integrate with S05.3.2
- Dashboard shows priority goals; full list in fitness tab

### Acceptance Criteria

**AC1: Progress Bar Display**
Given a user has active goals,
When they view the dashboard or fitness tab,
Then progress bars show current % completion for each goal.

**AC2: Streak Counter**
Given a user is on a streak (consecutive days meeting goal),
When viewing goal progress,
Then streak counter displays: "7 day streak!" etc.

**AC3: Milestone Celebration**
Given a user achieves a milestone (7-day streak, goal complete, etc.),
When the milestone is reached,
Then a celebration message/animation displays.

**AC4: Goal Adjustment Prompt**
Given a user has <30% success rate over 7+ days,
When viewing the struggling goal,
Then prompt appears: "Struggling with this goal. Let's adjust it together?"

**AC5: Recovery-Aware Suggestion**
Given recovery score is <50,
When user views goals,
Then a note suggests: "Your recovery is low today. Rest is okay!"

**AC6: Light Mode Display**
Given user is in Light mode,
When viewing goals,
Then only top 1-3 priority goals show with simple status.

**AC7: Deep Mode Analytics**
Given user is in Deep mode,
When viewing goals,
Then all goals, historical charts, and success rate analytics are available.

**AC8: Goal Complete Flow**
Given a user achieves their goal target,
When the goal completes,
Then celebration displays and prompt asks: "Set a new goal?" or "Extend this goal?"

### Success Metrics
- Goal completion rate: 60% of set goals achieved within timeframe
- Goal adjustment adoption: 70% of users adjust unrealistic goals when prompted
- Sustainable adherence: 75% of users maintain goals for 30+ days

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Progress update <1s | Auth required | Progress data user-only | Color-blind safe progress | iOS 14+, Android 10+ |
| Celebration <500ms | Encrypted storage | No external sharing | Celebration screen reader | All screen sizes |

### Dependencies
- **Prerequisite Stories:** S05.4.1 (Goal Creation)
- **Related Stories:** S05.3.2 (Recovery-aware suggestions)
- **External Dependencies:** E4 (Mobile App UI), E3 (WhatsApp goal nudges)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Goal data unavailable for day | Mark as "no data" not "failed"; don't break streak |
| User manually marks goal complete | Allow with logging; may affect tracking accuracy |
| Streak broken | Acknowledge: "Streak ended at X days. Ready to start a new one?" |
| Multiple goals complete same day | Celebrate each; don't overwhelm with notifications |
| User refuses all adjustment suggestions | Accept; track that user prefers ambitious goals |

### Open Questions
- Should we support public/social goal sharing?
- Should goals integrate with calendar for scheduled goal activities?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Progress bars and streaks functional
- [ ] All milestone celebrations implemented
- [ ] Goal adjustment prompts working
- [ ] Recovery-aware suggestions integrated
- [ ] Light and Deep modes operational
- [ ] Goal completion flow tested

