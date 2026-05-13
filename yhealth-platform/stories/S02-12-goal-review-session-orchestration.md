---
type: story
id: S02.4.3
title: Goal Review & Session Orchestration
epic: E02
epic_name: Voice Coaching
feature: F2.4
feature_name: Session Types
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-07
---

# S02.4.3: Goal Review & Session Orchestration

## User Story

**As an** Optimization Enthusiast (P3),
**I want** focused goal review sessions and intelligent session type selection,
**So that** I can regularly assess my progress and always receive the right type of coaching for my current situation.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)

---

## Scope Description

**Goal Review Session (15 minutes):**
| Phase | Duration | Content |
|-------|----------|---------|
| Goal Selection | 1 min | "Which goal should we discuss?" |
| Progress Analysis | 5 min | Review metrics and achievements |
| Barrier Exploration | 4 min | "What's holding you back?" |
| Goal Adjustment | 3 min | Modify target or strategy |
| Commitment | 2 min | Confirm adjusted goal |

**Triggers:**
- User-initiated: "Let's review my goals"
- AI-suggested: Goal deadline approaching, consistent goal failure
**Usage:** 10% of calls

**Session Orchestration Logic:**
```
IF (crisis keywords OR severe stress tone):
  → Emergency Support (immediate)

ELSE IF (user has <10 minutes):
  → Quick Check-In

ELSE IF (weekly coaching scheduled):
  → Coaching Session

ELSE IF (goal deadline approaching OR consistent failure):
  → Goal Review Session

ELSE IF (deep mode AND no recent coaching):
  → Offer Coaching Session

ELSE:
  → Default to Quick Check-In

User can always override AI suggestion.
```

**Session History:**
- All sessions labeled by type
- Filter history by session type
- Duration and topics tracked
- Completion status (full, early end, upgraded)

---

## Acceptance Criteria

```gherkin
Scenario: Goal review request
  Given a user requests a goal review
  When they select Goal Review Session
  Then they can choose which specific goal to discuss

Scenario: AI suggests goal review on failure
  Given consistent goal failure is detected
  When the AI initiates contact
  Then it suggests a Goal Review Session: "Your sleep goal has been challenging. Want to review and adjust it?"

Scenario: Deadline approaching suggestion
  Given a goal deadline is approaching
  When the user initiates any call
  Then AI suggests: "Your 30-day fitness goal ends in 3 days. Should we review progress?"

Scenario: Session orchestration
  Given session orchestration determines appropriate type
  When user doesn't specify session type
  Then AI suggests based on context with explanation

Scenario: Session history access
  Given a user wants to see session history
  When they access call history
  Then sessions are labeled by type with filter options
```

---

## Success Metrics

- Goal Review Completion: 80% of Goal Reviews result in adjusted or confirmed goals
- Session Suggestion Accuracy: 85% of AI suggestions accepted
- Barrier Identification: 70% of reviews identify actionable barriers
- Session Type Distribution: Matches expected usage patterns
- History Utility: 60% of users use session history filters

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Session selection <1s | Goal data encrypted | Session type not shared | Clear session labels | All platforms |
| History loads <2s | Auth required for history | | Filter accessible | |

---

## Dependencies

- **Prerequisite Stories:** S02.4.1 (Quick Check-In and Coaching), S02.4.2 (Emergency for orchestration)
- **Related Stories:** S02.2.2 (context for goal data), E5/E6/E7 (goal sources)
- **External Dependencies:** Goal data from pillars, Session history database

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User has no goals set | Offer to set goals: "No goals yet. Want to create one?" |
| All goals on track | Celebrate: "All goals progressing well! Let's discuss what's working." |
| Goal review reveals depression/anxiety | Seamlessly transition to emotional support, offer resources |
| Multiple goals need review | Let user prioritize: "Multiple goals to discuss. Which first?" |
| Session history very long | Paginate with date filters, search capability |

---

## Open Questions

- Goal review frequency recommendation
- Automatic goal archiving for completed/abandoned goals

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Goal Review 15-minute structure working
- [ ] Session orchestration logic implemented
- [ ] AI session suggestions based on context
- [ ] Session history with type labels
- [ ] History filtering functional
- [ ] Goal selection flow working

---

*Story S02.4.3 | Epic E02 | Product: yHealth Platform*
