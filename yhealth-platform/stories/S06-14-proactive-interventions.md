---
type: story
id: S06.5.3
title: Proactive Pattern Interventions
epic: E06
feature: F6.5
product: yhealth-platform
priority: P0
status: Draft
---

# Proactive Pattern Interventions

### User Story
**As a** Habit Formation Seeker (P4),
**I want to** receive proactive interventions when the AI detects concerning patterns,
**So that** I can address nutrition issues before they become problems.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The AI analyzes nutrition patterns over time and proactively intervenes when it detects concerning trends. Interventions are supportive, not alarming, and offer actionable suggestions.

**Pattern Detection Types:**

| Pattern | Detection Method | Intervention |
|---------|------------------|--------------|
| **Meal Skipping** | 3+ days of skipped breakfast/lunch | "You've skipped breakfast 3 days this week. Low energy connected?" |
| **Late-Night Eating** | Regular eating after 9pm | "Late dinners may affect sleep. Want meal timing tips?" |
| **Protein Consistently Low** | <80% target for 5+ days | "Protein intake low this week. Here's why it matters for [goal]..." |
| **Calorie Variance** | ±30% daily swing | "Your calories swing wildly day-to-day. Let's stabilize." |
| **Weekend Overeating** | Sat/Sun 150%+ of weekday average | "Weekends are tough! Here's a strategy that works..." |
| **Dehydration Pattern** | <50% hydration goal 3+ days | "You've been under-hydrated. Energy feeling low?" |

**Intervention Timing:**
- Evening check-in for daily patterns
- Weekly summary for weekly patterns
- Real-time for urgent patterns (e.g., several days no logging)

**Intervention Tone:**
- **Non-Judgmental:** No shaming or guilt
- **Curious:** Ask questions, don't assume
- **Helpful:** Offer specific solutions
- **Encouraging:** Acknowledge difficulty, support progress

**Behavioral Nudges:**
| Type | Example |
|------|---------|
| **Streaks** | "7-day meal logging streak! You're building a powerful habit." |
| **Milestones** | "You've logged 100 meals! Your AI coach knows your preferences well now." |
| **Recovery** | "Tough week. Remember, one bad day doesn't erase progress." |
| **Progress** | "Your average protein intake increased 15% this month. Great focus!" |

**Data Used:**
| Source | Pattern Detection |
|--------|-------------------|
| Meal logs | Timing, frequency, content |
| Macro history | Consistency, variance, trends |
| Goal progress | Adherence, improvement |
| Cross-pillar (E5, E7) | Workout correlation, mood correlation |

### Acceptance Criteria

**AC1: Meal Skipping Detection**
Given a user has skipped breakfast 3+ days in the past week,
When the pattern detection runs,
Then an intervention is triggered: "You've skipped breakfast 3 days this week. Everything okay?"

**AC2: Calorie Variance Detection**
Given a user's daily calories vary by >30% for 5+ days,
When the pattern detection runs,
Then an intervention is triggered: "Your calories swing wildly. Want help stabilizing?"

**AC3: Intervention Timing**
Given a pattern is detected,
When determining delivery time,
Then interventions are sent at appropriate times (evening for daily, Sunday for weekly).

**AC4: Non-Judgmental Tone**
Given an intervention for overeating is triggered,
When the message is generated,
Then the tone is supportive: "Big meals this week! No judgment - want to talk about what's going on?"

**AC5: Actionable Suggestions**
Given an intervention is sent,
When the user views it,
Then it includes a specific, actionable suggestion (not just identification of problem).

**AC6: Cross-Pillar Pattern Detection**
Given fitness data shows workouts at 6am and nutrition shows no breakfast,
When the pattern detection analyzes,
Then it identifies: "You work out at 6am but skip breakfast. Pre-workout nutrition could boost performance."

**AC7: Streak Recognition**
Given a user has logged meals for 7 consecutive days,
When the milestone is reached,
Then a celebration nudge is sent: "7-day streak! You're building a powerful habit."

**AC8: Intervention Effectiveness Tracking**
Given an intervention is sent,
When measuring effectiveness,
Then the system tracks if user behavior improves within 7 days.

### Success Metrics
- Pattern detection accuracy: 85%+ interventions are relevant (not false positives)
- Intervention effectiveness: 70% of users show improvement within 7 days
- User response: <10% mark interventions as "not helpful"
- Engagement: 80% of users interact with at least one intervention per month

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Daily pattern analysis | Pattern data encrypted | No sharing of patterns | Clear intervention text | iOS 14+, Android 10+ |
| <5s intervention generation | Session auth | User controls intervention freq | Voice delivery option | Multi-channel |

### Dependencies
- **Prerequisite Stories:** S06.2.1, S06.5.1
- **Related Stories:** S06.5.4, S06.6.2
- **External Dependencies:** E5 (Fitness), E7 (Wellbeing), E8 (Cross-Domain Intelligence)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User is traveling (unusual patterns) | Reduce intervention sensitivity, acknowledge context |
| User dismisses multiple interventions | Reduce frequency, ask: "Too many messages?" |
| Pattern is actually intentional (e.g., intermittent fasting) | Learn from user feedback, don't repeat same intervention |
| Conflicting patterns | Prioritize most impactful intervention |
| New user (<7 days data) | Don't send pattern interventions until enough data |
| Concerning pattern (eating disorder signs) | Very gentle approach with resources (see S06.6.3) |

### Open Questions
- How many interventions per week maximum?
- Should interventions be dismissable permanently?
- Should we A/B test intervention messaging?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All pattern types detecting correctly
- [ ] Intervention timing appropriate
- [ ] Tone verified as non-judgmental
- [ ] Actionable suggestions included
- [ ] Cross-pillar patterns working
- [ ] Effectiveness tracking operational