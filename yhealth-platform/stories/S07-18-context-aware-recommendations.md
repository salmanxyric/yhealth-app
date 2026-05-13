---
type: story
id: S07.7.2
title: Context-Aware Recommendations
epic: E07
epic_name: Wellbeing Pillar
feature: F7.7
feature_name: Mindfulness Recommendations
product: yhealth-platform
priority: P0
status: Draft
story_points: 0
created: 2025-12-24
---

# S07.7.2: Context-Aware Recommendations


### User Story
**As a** Busy Professional (P2),
**I want to** receive mindfulness practice recommendations based on my current stress, mood, energy, and time of day,
**So that** I know what to do without needing to become a mindfulness expert.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Context-aware mindfulness recommendations surface the right practice at the right time. When the user is stressed, they get breathing exercises. When mood is low, loving-kindness meditation is suggested. The AI acts as a knowledgeable coach, not a meditation app.

**Recommendation Triggers:**

| Context | Recommendation Priority |
|---------|------------------------|
| **High stress (≥7)** | Calming: Box breathing, Body scan |
| **Low energy** | Gentle: Breathing exercises, Seated meditation |
| **Low mood** | Uplifting: Loving-kindness, Gratitude practice |
| **Anxious mood** | Grounding: Box breathing, Body scan |
| **Morning (6-9am)** | Energizing: Gratitude meditation, Intention setting |
| **Afternoon (2-5pm)** | Reset: Breathing exercises, Quick mindful break |
| **Evening (7-10pm)** | Wind-down: Sleep meditation prep, Evening body scan |
| **Post-workout** | Recovery: Breathing, Body scan |
| **Pre-sleep** | Sleep prep: 4-7-8 breathing, Body scan for sleep |

**Recommendation Delivery:**

| Mode | Experience |
|------|------------|
| **Light** | Simple recommendation: "Try 3 minutes of deep breathing right now." One-tap accept/decline. |
| **Deep** | Multiple options with explanations: "Here are 3 practices for your current state..." |

**Recommendation Logic:**
```
1. Assess current context:
   - Stress level (from S07.5.*)
   - Mood (from S07.1.1)
   - Energy (from S07.4.1)
   - Time of day
   - Recent activity (post-workout, pre-sleep)

2. Match practice to context:
   - High stress → Calming practices
   - Low mood → Compassion practices
   - Low energy → Gentle practices
   - Evening → Wind-down practices

3. Select duration based on context:
   - Stressed + busy → 1-3 minutes
   - Moderate stress → 5-10 minutes
   - Low stress + time → 10-20 minutes
   - User's historical preference

4. Avoid repetition:
   - Same practice not recommended 2 days in a row
   - Variety across categories over week

5. Learn from feedback:
   - Prioritize practices user has rated highly
   - Reduce frequency of declined practices
```

**Recommendation Frequency:**
- Maximum 2 recommendations per day (avoid overwhelm)
- Minimum 4 hours between recommendations
- Reduce if user consistently declines

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Recommendation ID | UUID | Required | System |
| Practice Recommended | UUID | From library | System |
| Context Used | JSON | Stress/mood/energy/time | System |
| User Response | Enum | accepted/declined/ignored | User-only |
| Practice Completed | Boolean | If accepted | User-only |
| Effectiveness Rating | Integer 1-10 | Post-practice | User-only |
| Timestamp | ISO 8601 | Required | System |

**Behaviors:**
- Recommendations delivered via app notification or in-app prompt
- WhatsApp delivery: "Quick stress reset: Try box breathing. [Accept] [Not now]"
- Voice delivery: AI coach verbally suggests practice
- Post-practice feedback: "Did this help?" (1-10 rating)
- AI learns from acceptance patterns and effectiveness ratings

### Acceptance Criteria

**AC1: Stress-Based Recommendation**
Given the user's stress is high (≥7),
When mindfulness recommendation triggers,
Then calming practice is recommended (e.g., "Your stress is high. Try 5 minutes of box breathing?").

**AC2: Mood-Based Recommendation**
Given the user's mood is low,
When mindfulness recommendation triggers,
Then uplifting practice is recommended (e.g., "Try loving-kindness meditation to lift your spirits").

**AC3: Time-of-Day Recommendation**
Given it's evening (8 PM),
When user opens mindfulness section,
Then wind-down practices are prioritized in suggestions.

**AC4: Light Mode One-Tap**
Given the user is in Light mode,
When recommendation appears,
Then simple accept/decline buttons are shown (no lengthy explanation).

**AC5: Deep Mode Multiple Options**
Given the user is in Deep mode,
When recommendation triggers,
Then 2-3 practice options are shown with brief explanations.

**AC6: Post-Practice Feedback**
Given the user completes a recommended practice,
When practice ends,
Then "Did this help? (1-10)" feedback prompt appears.

**AC7: Recommendation Frequency Limit**
Given the user received a mindfulness recommendation this morning,
When they're stressed in the afternoon,
Then max 1 more recommendation today (2 per day max).

**AC8: Declined Practice Learning**
Given the user declines "Box breathing" 3 times,
When future recommendations generate,
Then Box breathing frequency is reduced.

**AC9: WhatsApp Delivery**
Given the user prefers WhatsApp,
When recommendation triggers,
Then message is sent: "Quick stress reset: Try box breathing. Reply YES to start."

**AC10: No Repetition**
Given the user did Body Scan yesterday via recommendation,
When today's recommendation generates,
Then Body Scan is not recommended (variety maintained).

### Success Metrics
- Recommendation acceptance: 55% accept mindfulness recommendation when offered
- Practice completion: 70% complete recommended practice after accepting
- Stress reduction post-practice: 60% report lower stress after completing practice
- Regular practice adoption: 40% do mindfulness ≥3x/week after 30 days

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Recommendation gen <2s | Auth required | Recommendations user-only | Screen reader support | iOS 14+, Android 10+ |
| Context analysis <1s | Encrypted | Context not stored permanently | Voice delivery option | WhatsApp, Voice channels |

### Dependencies
- **Prerequisite Stories:** S07.7.1 (Practice Library), S07.5.* (Stress), S07.1.1 (Mood), S07.4.1 (Energy)
- **Related Stories:** S07.5.3 (Stress Interventions)
- **External Dependencies:** E3 (WhatsApp), E2 (Voice), E4 (App notifications)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Recommendation rejected 3x in a row | Reduce frequency: "Noticed you've skipped suggestions. Prefer different practices or less often?" |
| Practice never completed after acceptance | Reduce confidence in that practice for user |
| Practice rated ineffective (<4) | Remove from recommendation pool for 30 days |
| User already uses meditation app | Acknowledge: "Great! I'll suggest practices to complement your app, not replace it." |
| No context data available | Default to time-of-day appropriate recommendation |
| Conflicting context (high stress + good mood) | Prioritize stress (safety first) |

### Open Questions
- Should we integrate with external meditation apps for seamless handoff?
- Can users set "do not recommend" for specific practices?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Context-aware recommendations generating based on stress/mood/energy/time
- [ ] Light and Deep mode delivery functional
- [ ] Post-practice feedback collecting
- [ ] Recommendation frequency limits enforced
- [ ] Learning from declined practices working
- [ ] Multi-channel delivery (app, WhatsApp, voice)
- [ ] No repetition logic functional
- [ ] Performance requirements verified

---

## Implementation Sequence (Recommended)

| Order | Story | Rationale |
|-------|-------|-----------|
| 1 | S07.1.1 | Mood input - foundation signal |
| 2 | S07.4.1 | Energy input - parallel foundation signal |
| 3 | S07.1.2 | Mood patterns - builds on S07.1.1 |
| 4 | S07.4.2 | Energy patterns - builds on S07.4.1 |
| 5 | S07.3.1 | Habit creation - foundation for tracking |
| 6 | S07.3.2 | Habit logging - builds on S07.3.1 |
| 7 | S07.2.1 | Journal prompts - foundation for journaling |
| 8 | S07.2.2 | Journal entry - builds on S07.2.1 |
| 9 | S07.3.3 | Habit correlations - requires mood/energy/habit data |
| 10 | S07.2.3 | Journal AI - requires mood/stress/journal data |
| 11 | S07.5.1 | Self-report stress - foundation for stress detection |
| 12 | S07.5.2 | Multi-signal stress - requires journal (sentiment), S07.5.1 |
| 13 | S07.5.3 | Stress alerts - requires S07.5.1, S07.5.2 |
| 14 | S07.6.1 | Wellbeing goals - requires mood/energy/stress baselines |
| 15 | S07.6.2 | Routine templates - foundation for routines |
| 16 | S07.6.3 | Routine tracking - builds on S07.6.2 |
| 17 | S07.7.1 | Practice library - foundation for mindfulness |
| 18 | S07.7.2 | Context recommendations - requires stress/mood/energy, S07.7.1 |

---

*Epic 07: Wellbeing Pillar Stories v1.0 | Xyric Solutions | 2025-12-11*
*Generated via EXPERT-13 Story Generator v3.0*
*Total Stories: 18 | All P0 Must Have | All Draft Status*
*KEY DIFFERENTIATOR: Daily Wellbeing as Equal Pillar with Multi-Signal Stress Detection*