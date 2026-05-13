---
type: story
id: S05.5.1
title: Workout Recommendation Engine
epic: E05
feature: F5.5
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As a** Busy Professional (P2),
**I want to** have AI tell me exactly what workout to do today based on my recovery, schedule, and goals,
**So that** I don't waste time planning and can maximize results with limited time.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Each day, the AI generates a personalized workout recommendation based on multiple inputs: recovery scores, user goals, workout history, cross-pillar data, and time/equipment constraints. This is NOT generic "do cardio" advice - it's a specific plan with exercises, sets, and duration.

**Recommendation Generation Process:**
```
1. Recovery Assessment (from S05.3.1):
   - Both scores >80: High-intensity option available
   - Either score 50-79: Moderate intensity recommended
   - Either score <50: Light activity or rest recommended

2. Goal Alignment (from S05.4.1):
   - Strength goal → Strength training emphasis
   - Endurance goal → Cardio emphasis
   - Weight loss goal → Higher calorie burn focus
   - General health → Balanced variety

3. Workout History Analysis:
   - Muscle group rotation (avoid same groups consecutive days)
   - Workout type variety (avoid 5+ days same activity)
   - Progressive overload consideration

4. Cross-Pillar Inputs (from E7):
   - Low energy → Shorter, less intense workout
   - High stress → Mind-body exercises (yoga, tai chi)
   - Poor sleep → Active recovery recommended

5. Time/Equipment Constraints:
   - User's available time
   - User's equipment access (home, gym, outdoors)

6. Generate Plan:
   - Select workout type
   - Choose specific exercises
   - Set volume (sets/reps/duration)
   - Provide rationale
```

**Recommendation Output:**
- Workout type (e.g., "Upper Body Strength")
- Duration estimate (e.g., "35 minutes")
- Intensity level (Light/Moderate/High)
- Brief rationale (e.g., "Based on your high recovery and strength goal")
- Link to full workout plan (S05.5.2)

**Safety Checks:**
- Warns against high-intensity with poor recovery
- Suggests rest days when appropriate
- Flags potential injury risk (e.g., same muscle group 3 days in a row)

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Single "Workout of the Day" recommendation with duration and intensity. One-tap start. Example: "30-min Moderate Cardio recommended today". |
| **Deep** | Full recommendation with rationale, alternative options, ability to request different workout type. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Recommendation ID | UUID | Required | System |
| Workout Type | Enum | From categories | User-only |
| Intensity | Enum | Light/Moderate/High | User-only |
| Duration Minutes | Integer | 10-120 range | User-only |
| Rationale | String | Generated | User-only |
| Physical Recovery | Integer 0-100 | Input | User-only |
| Mental Recovery | Integer 0-100 | Input | User-only |
| User Accepted | Boolean | User action | Aggregated |

**Behaviors:**
- Recommendation generates after morning recovery scores calculate
- Updates if significant input changes (e.g., time constraint added)
- User can reject and request alternative
- Accepted recommendation feeds into strain calculation (S05.6.1)
- Available via mobile app, WhatsApp, and voice coaching

### Acceptance Criteria

**AC1: Recovery-Based Intensity**
Given recovery scores are available,
When recommendation generates,
Then intensity aligns with recovery: Both High (80+) → High intensity available; Either Low (<50) → Light/rest recommended.

**AC2: Goal Alignment**
Given user has active fitness goals,
When recommendation generates,
Then workout type aligns with goal (strength goal → strength workout).

**AC3: Workout History Consideration**
Given user did upper body strength yesterday,
When recommendation generates today,
Then upper body is NOT recommended (muscle rotation).

**AC4: Cross-Pillar Input**
Given user logged high stress in E7,
When recommendation generates,
Then mind-body exercises (yoga, breathing) are suggested.

**AC5: Light Mode Display**
Given user is in Light mode,
When viewing recommendation,
Then single "Workout of the Day" displays with one-tap start.

**AC6: Deep Mode Rationale**
Given user is in Deep mode,
When viewing recommendation,
Then full rationale and alternative options display.

**AC7: Safety Warning**
Given physical recovery is <50 AND recommendation would be High intensity,
When generating recommendation,
Then system overrides to lower intensity with warning: "Recovery low - intense workout not recommended today."

**AC8: Multi-Channel Availability**
Given recommendation is generated,
When user queries via WhatsApp ("What should I do today?") or Voice,
Then the recommendation is delivered via that channel.

### Success Metrics
- Workout recommendation acceptance: 70% of recommendations started by user
- Recovery alignment accuracy: 85% match between workout and recovery state
- User satisfaction: 4.5/5 rating on workout diversity

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Generation <3s | Auth required | Recommendations user-only | Plain language | iOS 14+, Android 10+ |
| Update <2s | Encrypted storage | No external sharing | Screen reader support | Multi-channel delivery |

### Dependencies
- **Prerequisite Stories:** S05.3.1 (Recovery), S05.4.1 (Goals)
- **Related Stories:** S05.5.2 (Exercise Library), S05.5.3 (Feedback)
- **External Dependencies:** E7 (Wellbeing inputs), E2 (Voice), E3 (WhatsApp)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No recovery score available | Generate based on other factors; note: "Personalization improves with recovery tracking" |
| User rejects 3+ recommendations | Ask for feedback: "What would you prefer today?" Learn preference |
| Conflicting inputs (high recovery + high stress) | Prioritize mental health: suggest moderate intensity |
| No workout history | Start with balanced, beginner-friendly recommendations |
| Equipment constraint not set | Ask user: "What equipment do you have access to today?" |

### Open Questions
- Should we support scheduled recommendations (e.g., generate for whole week)?
- How do we handle users who always override AI recommendations?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 6 recommendation inputs considered
- [ ] Safety checks preventing overtraining
- [ ] Light and Deep modes functional
- [ ] Multi-channel delivery working
- [ ] Rejection/alternative flow implemented

