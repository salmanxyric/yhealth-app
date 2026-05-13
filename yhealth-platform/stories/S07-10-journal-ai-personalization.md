---
type: story
id: S07.2.3
title: Journal AI Personalization
epic: E07
epic_name: Wellbeing Pillar
feature: F7.2
feature_name: Daily Journaling
product: yhealth-platform
priority: P0
status: Draft
story_points: 0
created: 2025-12-24
---

# S07.2.3: Journal AI Personalization


### User Story
**As a** returning user,
**I want to** receive journaling prompts personalized to my recent mood, activities, and patterns,
**So that** my journaling feels relevant and helps me process what's actually happening in my life.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
AI personalization enhances the journaling experience over time. Initially, users receive research-based prompts (bootstrap approach). As data accumulates, AI customizes prompts based on mood patterns, stress levels, sleep quality, workout consistency, and previous journal themes.

**Bootstrap Approach:**
- Days 1-14: Research-based prompts only (from S07.2.1)
- Days 15+: AI begins personalizing based on accumulated data
- Personalization improves with more data

**AI Personalization Logic:**

| User Context | Prompt Adaptation |
|--------------|-------------------|
| Low mood (from S07.1.1) | Self-compassion or Gratitude prompts prioritized |
| High stress (from S07.5.1) | Stress Management or Emotional Processing prompts |
| Good recovery score | Reflection & Growth prompts (celebrate wins) |
| Missed workouts | Motivational or Future Focus prompts |
| Recent sleep issues | Prompts about rest and self-care |
| Previous journal mentioned work stress | Follow-up: "Last week you mentioned work pressure. How's that going?" |

**Personalization Inputs:**
- Recent mood patterns (7 days)
- Current stress level
- Sleep quality (last 3 nights)
- Workout consistency (7 days)
- Previous journal entry themes (NLP analysis)
- Time of day (morning vs evening appropriate prompts)

**Variety Management:**
- Same personalized prompt not shown within 7 days
- Balance categories even with personalization
- Allow "surprise me" to get random prompt

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| User Context | JSON | System assembled | System |
| Personalization Score | Float | 0-1 confidence | System |
| Prompt Selected | UUID | From library | System |
| Personalization Reason | String | For debugging | System |
| User Feedback | Enum | helpful/not_helpful | User-only |

**Behaviors:**
- Personalization runs when user opens journaling
- Falls back to random research-based prompt if personalization fails
- User can provide feedback on prompt relevance
- Feedback improves future personalization

### Acceptance Criteria

**AC1: Bootstrap Phase (Days 1-14)**
Given a new user with <14 days of data,
When they open journaling,
Then research-based prompts display (no personalization attempted).

**AC2: Low Mood Personalization**
Given the user logged low mood today,
When journaling prompt loads,
Then self-compassion or gratitude prompts are prioritized.

**AC3: High Stress Personalization**
Given the user's stress score is high (>7),
When journaling prompt loads,
Then stress management prompts are prioritized.

**AC4: Cross-Pillar Context**
Given the user had poor sleep last night,
When journaling prompt loads,
Then prompt may reference: "After a tough night's sleep, what do you need today?"

**AC5: Previous Entry Follow-Up**
Given the user mentioned "work stress" in last week's journal,
When journaling prompt loads,
Then personalized follow-up may appear: "You mentioned work pressure last week. Any updates?"

**AC6: Time-of-Day Appropriateness**
Given it's morning,
When journaling prompt loads,
Then morning-appropriate prompts prioritized (intentions, gratitude, not "reflect on today").

**AC7: Variety Despite Personalization**
Given personalization suggests gratitude prompts 3 days in a row,
When the 4th day loads,
Then a different category is selected for variety.

**AC8: Fallback to Research-Based**
Given personalization engine fails or returns low confidence,
When prompt loads,
Then fallback to random research-based prompt from library.

**AC9: User Feedback**
Given a personalized prompt is shown,
When the user rates it "not helpful",
Then feedback is recorded to improve future personalization.

### Success Metrics
- Personalization engagement: 60% of personalized prompts rated "helpful"
- Prompt relevance: 50% reduction in prompt skips after personalization active
- Data utilization: 80% of users with sufficient data receive personalized prompts
- User satisfaction: 4.5/5 rating for journaling prompts after 30 days

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Personalization <2s | Auth required | Context data not stored permanently | Screen reader support | iOS 14+, Android 10+ |
| Fallback <500ms | Encrypted analysis | Previous entries only analyzed, not stored raw | Min 4.5:1 contrast | All channels |

### Dependencies
- **Prerequisite Stories:** S07.2.1 (Prompt System), S07.2.2 (Journal Entry), S07.1.1 (Mood), S07.5.1 (Stress)
- **Related Stories:** S07.4.1 (Energy), S07.3.2 (Habits)
- **External Dependencies:** E5 (Sleep, Workout data), E8 (Cross-Domain Intelligence)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| No mood/stress data available | Use journal themes + time-of-day only |
| User always rates prompts "not helpful" | Reduce personalization confidence; offer more variety |
| Contradictory signals (high stress + good mood) | Use most recent signal; acknowledge complexity in prompt |
| User journals at irregular times | Adapt time-of-day logic; don't assume morning/evening pattern |
| Previous journal entry was blank | Skip journal theme analysis; use other context |

### Open Questions
- Should we show users WHY a prompt was selected ("Based on your recent mood...")?
- How long should previous journal themes influence personalization?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Bootstrap phase correctly limiting personalization
- [ ] Mood, stress, sleep, workout context incorporated
- [ ] Previous journal theme analysis functional
- [ ] Variety maintained despite personalization
- [ ] Fallback to research-based prompts working
- [ ] User feedback mechanism functional
- [ ] Performance requirements verified

---