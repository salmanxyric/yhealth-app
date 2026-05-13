---
type: story
id: S01.2.3
title: Deep Assessment Path
epic: E01
epic_name: Onboarding & Assessment
feature: F1.2
feature_name: Flexible Assessment
product: yhealth-platform
priority: P1
status: In Progress
created: 2025-12-07
---

# S01.2.3: Deep Assessment Path

## User Story

**As a** new yHealth user who wants comprehensive personalization,
**I want to** have a natural conversation with the AI about my health goals and history,
**So that** yHealth deeply understands my context, motivations, and challenges.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [ ] Must Have (P0)
- [x] Should Have (P1)

---

## Scope Description

**User Experience:**
- AI-guided conversational assessment (10-15 minutes)
- Natural dialogue flow, not robotic question lists
- AI asks follow-up questions based on responses
- Emotional intelligence: validates struggles, celebrates honesty
- User can type or use voice input
- Progress indicator shows estimated time remaining
- Can switch to Quick mode at any point

**AI Conversation Flow:**
```
AI: "Welcome! I'm here to help you become the best version of yourself.
     What's the main thing you want to improve about your health right now?"

User: "I want to lose weight. I've tried a lot but nothing sticks."

AI: "I hear you - that's frustrating. What have you tried before,
     and what made it hard to stick with?"

User: "Keto, intermittent fasting... work stress makes me snack a lot."

AI: "Stress-eating is so common. When you're stressed, what do you
     typically reach for? Sweet, salty, or just whatever's nearby?"

[Conversation continues naturally...]
```

**AI Personality & Tone:**
- Warm, empathetic, non-judgmental coach
- Curious and reflective (not interrogative)
- Celebrates honesty: "Thanks for sharing that - it helps me personalize better"
- Validates struggles: "That's a common challenge - you're not alone"
- Appropriate use of emoji (minimal, supportive)

**Adaptive Depth Control:**
- If user gives short answers → Offer to switch to Quick mode
- If user gives detailed stories → Continue open-ended exploration
- Progress indicator updates dynamically based on conversation length

**Data Captured:**
- Full conversation transcript (for future reference)
- Extracted insights:
  - Past attempts and why they failed
  - Emotional relationship with food/exercise
  - Daily routine and constraints
  - Support system and environment
  - Intrinsic motivations (deeper "why")

---

## Acceptance Criteria

```gherkin
Scenario: Natural conversation
  Given a user selecting Deep Assessment
  When they engage in conversation with AI
  Then the conversation feels natural and personalized to their responses

Scenario: Short answer detection
  Given a user provides short, minimal responses
  When AI detects pattern (3+ short answers)
  Then AI offers: "Want to try quick questions instead? Faster and easier."

Scenario: Empathetic responses
  Given a user shares emotional/sensitive information
  When AI responds
  Then the response is empathetic and non-judgmental

Scenario: Unrealistic goal check
  Given a user types an unrealistic goal
  When AI detects it
  Then AI gently reality-checks: "That's ambitious! What's driving this timeline?"

Scenario: Mode switch
  Given a user wants to switch to Quick Assessment
  When they request it
  Then transition occurs with conversation data preserved

Scenario: Assessment completion
  Given Deep Assessment completes
  When user finishes
  Then conversation transcript and extracted insights are saved
```

---

## Success Metrics

- Completion Rate: 85%+ (slightly lower than Quick due to time investment)
- Time to Complete: 10-15 minutes (on target)
- Mode Selection: 40% choose Deep path
- User Satisfaction: 4.6/5 ("Assessment felt relevant to my goals")
- AI Data Richness: 9/10 average insight quality

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s AI response time | Transcript encrypted | Conversation private | Voice input option | All devices |
| Real-time streaming | - | Never shared externally | - | |

---

## Dependencies

- **Prerequisite Stories:** S01.2.1 (goal selected)
- **Related Stories:** S01.2.2 (mode switch), S01.3.1
- **External Dependencies:** AI Conversation Engine (GPT-4/Claude)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| AI generates inappropriate response | Content filter blocks, fallback to neutral response |
| User types harmful content | Flag for review, continue supportively |
| AI response timeout | Show "Thinking..." then retry |
| User idle for 2+ minutes | Gentle prompt: "Still there? Take your time." |

---

## Open Questions

- Voice input quality requirements
- Transcript retention policy (user can delete?)

---

## Definition of Done

- [ ] AI conversation engine integrated
- [ ] Natural follow-up question logic implemented
- [ ] Emotion detection and empathetic responses working
- [ ] Adaptive depth control functional
- [ ] Mode switch to Quick preserves data
- [ ] Conversation transcript saved
- [ ] Insight extraction from transcript working
- [ ] 10-15 minute target achievable

---

*Story S01.2.3 | Epic E01 | Product: yHealth Platform*
