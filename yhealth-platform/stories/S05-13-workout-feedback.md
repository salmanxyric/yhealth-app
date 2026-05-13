---
type: story
id: S05.5.3
title: Workout Feedback & Progressive Overload
epic: E05
feature: F5.5
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As an** Optimization Enthusiast (P3),
**I want to** provide feedback after workouts so AI learns my preferences, and see gradual difficulty increases as I improve,
**So that** recommendations get better over time and I continuously progress.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
After completing a workout, users provide simple feedback. This feedback trains the recommendation algorithm to better match user preferences. Additionally, the system implements progressive overload by gradually increasing difficulty when users consistently complete workouts.

**Post-Workout Feedback:**
Simple prompt after workout completion:
- "How was this workout?"
  - Too Easy (will increase difficulty)
  - Just Right (perfect match)
  - Too Hard (will decrease difficulty)
  - Not My Style (learn preference)

**Optional Detail Feedback:**
- Which exercises did you enjoy?
- Which exercises were too difficult?
- Any exercises you'd like to skip next time?
- How do you feel now? (energy level 1-5)

**Progressive Overload Logic:**
```
After 3+ consecutive "completed" workouts at same level:
- Strength: +5% weight or +1 rep per set
- Cardio: +5% duration or +1 intensity level
- HIIT: +1 interval or -5s rest period

After 2+ consecutive "Too Hard" feedback:
- Reduce to previous difficulty level
- Flag for review: suggest easier alternatives

After 3+ consecutive "Too Easy" feedback:
- Immediate increase in difficulty
- Consider moving to advanced templates
```

**Algorithm Learning:**
| Feedback | System Response |
|----------|-----------------|
| "Too Easy" multiple times | Increase baseline intensity for this user |
| "Not My Style" on running | Reduce running recommendations, suggest alternatives |
| Skipped leg exercises | Note preference; still include legs but offer alternatives |
| High post-workout energy | This workout type is well-suited to user |
| Low post-workout energy | May have been too intense; adjust |

**Injury Handling:**
- User reports injury or pain → Immediately remove exercises affecting that area
- "I hurt my [body part]" → System adjusts all future recommendations
- Recovery period suggestions provided
- Gradual reintroduction of affected exercises after recovery

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Workout ID | UUID | Required | System |
| Difficulty Rating | Enum | Easy/Right/Hard | User-only |
| Style Match | Boolean | True/False | User-only |
| Enjoyed Exercises | UUID array | From workout | User-only |
| Difficult Exercises | UUID array | From workout | User-only |
| Skip Requests | UUID array | From workout | User-only |
| Post Energy | Integer 1-5 | Optional | User-only |
| Injury Report | String | Free text | User-only |

**Behaviors:**
- Feedback prompt appears immediately after workout marked complete
- Progressive overload applies automatically based on consistency
- Algorithm adjustments happen in real-time
- Injury reports trigger immediate safety responses
- Feedback optional but encouraged

### Acceptance Criteria

**AC1: Post-Workout Feedback Prompt**
Given a user completes a workout,
When they mark it done,
Then a feedback prompt appears: "How was this workout?" with options.

**AC2: Difficulty Adjustment - Too Easy**
Given a user rates 3+ workouts as "Too Easy",
When the next recommendation generates,
Then difficulty is increased (more reps, weight, or intensity).

**AC3: Difficulty Adjustment - Too Hard**
Given a user rates 2+ workouts as "Too Hard",
When the next recommendation generates,
Then difficulty is decreased.

**AC4: Progressive Overload**
Given a user completes 3+ consecutive workouts at same level without "Too Hard" feedback,
When the next recommendation generates,
Then slight progression is applied (+5% weight/duration or +1 rep).

**AC5: Preference Learning**
Given a user marks an exercise as "Not My Style" multiple times,
When future recommendations generate,
Then that exercise type is reduced in frequency or replaced.

**AC6: Injury Handling**
Given a user reports "I hurt my shoulder",
When future recommendations generate,
Then shoulder exercises are removed and alternatives provided.

**AC7: Optional Detailed Feedback**
Given a user wants to provide more detail,
When they expand feedback options,
Then they can rate individual exercises and provide post-workout energy level.

### Success Metrics
- Feedback submission rate: 60% of completed workouts receive feedback
- Algorithm accuracy improvement: 10% increase in "Just Right" ratings over 30 days
- Injury response satisfaction: 90% report appropriate exercise removal

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Feedback save <1s | Auth required | Feedback user-only | Simple rating UI | iOS 14+, Android 10+ |
| Adjustment apply <2s | Encrypted storage | No external sharing | Voice input option | Multi-channel |

### Dependencies
- **Prerequisite Stories:** S05.5.1 (Workout Engine), S05.5.2 (Exercise Library)
- **Related Stories:** S05.6.1 (Strain tracking post-workout)
- **External Dependencies:** E4 (Mobile App UI)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User never provides feedback | Use completion/skip patterns as implicit feedback |
| Conflicting feedback (easy one day, hard next) | Weight recent feedback more; detect pattern changes |
| Injury reported then recovered | After 2 weeks, gently suggest reintroducing exercises |
| User always says "Too Hard" | Suggest reassessing fitness level; provide very beginner options |
| Feedback provided via WhatsApp | Accept: "That workout was too easy" parsed as feedback |

### Open Questions
- How long should we wait before reintroducing exercises after injury?
- Should we show users how their feedback affected recommendations?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Post-workout feedback flow implemented
- [ ] Progressive overload logic functional
- [ ] Preference learning working
- [ ] Injury handling with exercise removal
- [ ] Algorithm adjustments applying correctly

