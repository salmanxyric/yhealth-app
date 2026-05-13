---
type: story
id: S05.4.1
title: Goal Creation & AI Suggestions
epic: E05
feature: F5.4
product: yhealth-platform
priority: P0
status: Draft
---


### User Story
**As an** Optimization Enthusiast (P3),
**I want to** set specific fitness goals with AI guidance,
**So that** I can systematically improve my health while avoiding unrealistic targets that lead to burnout.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users set fitness goals through a guided wizard that ensures SMART goal creation. AI analyzes the user's baseline data and recovery capacity to suggest appropriate, achievable goals. The system detects potentially unrealistic goals and recommends alternatives.

**Goal Categories:**
| Category | Examples | Metrics |
|----------|----------|---------|
| Daily Steps | Walk 10,000 steps daily | Steps/day |
| Weekly Active Minutes | 150 minutes moderate activity/week | Minutes/week |
| Sleep Duration | Get 7+ hours sleep nightly | Hours/night |
| Workout Frequency | Exercise 4 times per week | Workouts/week |
| Custom | Improve sleep quality to 80+ | Any tracked metric |

**SMART Goal Wizard Steps:**
1. **Specific:** What exactly do you want to achieve?
2. **Measurable:** How will you track progress? (select metric)
3. **Achievable:** AI checks against baseline, suggests adjustment if >50% above current
4. **Relevant:** Which health goal does this support?
5. **Time-bound:** When do you want to achieve this? (1 week, 1 month, 3 months)

**AI Goal Suggestions:**
Based on user's current data, AI suggests personalized goals:
- "Based on your current 6,000 steps/day average, try 7,500 steps as your first goal"
- "Your sleep averages 6h. A goal of 6.5h is achievable in 2 weeks"
- "You work out 2x/week. Try 3x/week for the next month"

**Goal Conflict Detection:**
System warns when goals may conflict:
- Max workouts + max recovery = conflict
- Weight loss + muscle gain = needs careful planning
- Multiple high-intensity goals = overtraining risk

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Quick goal from presets: "Walk more", "Sleep better", "Exercise regularly" |
| **Deep** | Full SMART wizard, AI suggestions, custom goals, priority settings |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Goal Category | Enum | From categories | User-only |
| Target Metric | String | Valid metric name | User-only |
| Target Value | Number | Realistic range | User-only |
| Timeframe | Enum | Week/Month/Quarter | User-only |
| AI Suggested | Boolean | Flag if AI-generated | System |
| Baseline Value | Number | At goal creation | System |

**Behaviors:**
- Goal wizard guides user through SMART process
- AI suggestions appear based on baseline analysis
- Unrealistic goal detection triggers before save
- Goals persist and track over selected timeframe
- Recovery-aware: AI suggests rest days when appropriate

### Acceptance Criteria

**AC1: Goal Category Selection**
Given the user starts goal creation,
When they select a category,
Then options for: Steps, Active Minutes, Sleep Duration, Workout Frequency, Custom are available.

**AC2: SMART Goal Wizard**
Given the user is creating a goal,
When they go through the wizard,
Then all SMART components are captured: Specific, Measurable, Achievable, Relevant, Time-bound.

**AC3: AI Goal Suggestion**
Given the user has 7+ days of baseline data,
When they view goal suggestions,
Then personalized AI suggestions appear based on their current performance.

**AC4: Unrealistic Goal Warning**
Given the user sets a goal >50% above their baseline,
When they attempt to save,
Then a warning displays: "This goal is ambitious! Start with [lower target]?"

**AC5: Goal Conflict Detection**
Given the user has existing goals,
When they create a potentially conflicting goal,
Then a warning displays: "These goals may conflict. Prioritize one or adjust targets?"

**AC6: Light Mode Quick Goals**
Given the user is in Light mode,
When they create a goal,
Then preset quick options are available (e.g., "Walk more" → 8,000 steps/day).

**AC7: Goal Persistence**
Given a goal is created,
When the user closes and reopens the app,
Then the goal persists with current progress.

### Success Metrics
- AI recommendation accuracy: 65% of AI-suggested goals accepted
- Goal creation completion: 80% of started goal wizards completed
- Realistic goal adherence: 70% of goals adjusted when warned about unrealistic targets

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Wizard <3s per step | Auth required | Goals user-only | Voice input for goals | iOS 14+, Android 10+ |
| AI suggestion <2s | Encrypted storage | No external sharing | 44x44pt touch targets | Portrait + Landscape |

### Dependencies
- **Prerequisite Stories:** S05.1.1, S05.2.1 (Baseline data needed)
- **Related Stories:** S05.4.2 (Progress Tracking)
- **External Dependencies:** E4 (Mobile App UI), E8 (Cross-Domain for cross-pillar goals)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No baseline data (new user) | Suggest population average goals with caveat: "We'll personalize as we learn your patterns" |
| User insists on unrealistic goal | Allow with acknowledgment: "Got it! We'll track this ambitious goal and suggest adjustments if needed." |
| Goal for untracked metric | Prompt to enable tracking: "To track this goal, connect your wearable or log manually." |
| User has 10+ active goals | Warn about focus: "Many active goals can be overwhelming. Consider prioritizing your top 3." |

### Open Questions
- Should goals automatically expire after timeframe, or convert to ongoing?
- Should we support team/family shared goals?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 5 goal categories functional
- [ ] SMART wizard complete
- [ ] AI suggestions generating
- [ ] Unrealistic goal warning working
- [ ] Goal conflict detection functional
- [ ] Light and Deep modes operational

