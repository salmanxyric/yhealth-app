---
type: story
id: S03.2.1
title: Text-Based Coaching Engine
epic: E03
epic_name: WhatsApp Integration
feature: F3.2
feature_name: Text-Based Coaching
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.2.1: Text-Based Coaching Engine

## User Story

**As a** Holistic Health Seeker (P1),
**I want to** chat with my AI coach on WhatsApp using natural language,
**So that** I can ask questions, get insights, and receive support anytime without opening a separate app.

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

**User Experience:**
- Natural language conversational AI via WhatsApp text messages
- Context-aware responses drawing from user's health data
- Conversation history maintained across messages (24-hour session context)
- Response time <5 seconds for all text messages
- Emotionally intelligent responses that adapt to user tone
- Quick reply buttons for common follow-ups

**Light Mode:**
- Brief, focused responses
- Example: "Your energy is lower today - try a 10min walk or quick snack."
- Minimal follow-up unless user initiates
- Action-oriented, concise

**Deep Mode:**
- Detailed explanations with context
- Example: "Your energy dipped at 2pm three days this week. This correlates with skipping lunch and poor sleep Tuesday-Thursday. Let's address both: try eating lunch by 1pm and aim for 7+ hours sleep."
- Multi-turn conversations with follow-up questions
- Pattern analysis and detailed insights

**Conversation Capabilities:**
- Casual conversation: "Good morning!" → "Good morning! How are you feeling today?"
- Health questions: "How did I sleep last night?" → Data-driven response
- Recommendations: "What should I eat for lunch?" → Personalized suggestion
- Journaling: "I'm feeling stressed about work" → Empathetic response with logging
- Escalation: Complex issues trigger "Want to talk about it? I can call you now."

**AI Personality & Tone:**
- Warm, empathetic, non-judgmental coach
- Adapts to user's emotional state (detected from language)
- Appropriate use of emoji (minimal, supportive)
- Never robotic or overly formal

**Data Used for Personalization:**
- User's health history (fitness, nutrition, wellbeing data)
- Recent patterns and trends
- Goals and milestones from onboarding
- Conversation history (current session)
- Cross-pillar correlations from E8

**Response Structure:**
- Lead with direct answer
- Provide context if relevant (especially Deep mode)
- Offer next action or quick reply buttons
- Keep under 4096 characters (WhatsApp limit)

---

## Acceptance Criteria

```gherkin
Scenario: Text message response
  Given a user sends a text message via WhatsApp
  When the AI processes the message
  Then a personalized response is delivered within 5 seconds

Scenario: Casual greeting
  Given a user sends a casual greeting
  When the AI responds
  Then the response is warm and asks about their wellbeing

Scenario: Health data query
  Given a user asks about their health data
  When the query is processed
  Then the response includes relevant data from their profile

Scenario: Conversation context
  Given a user sends multiple messages in a conversation
  When AI responds
  Then context from previous messages (24h window) is maintained

Scenario: Emotional tone detection
  Given a user's message indicates stress or negative emotion
  When AI detects the tone
  Then the response is empathetic and supportive

Scenario: Out-of-scope handling
  Given a user asks an out-of-scope question
  When AI detects the boundary
  Then it gracefully redirects: "I'm focused on health coaching. For that question, try..."

Scenario: Response timeout
  Given AI response takes >10 seconds
  When timeout is detected
  Then user sees "Thinking... Just a moment." followed by response

Scenario: Unclear message
  Given user sends unclear message
  When AI has low confidence on intent
  Then it asks: "I want to help! Are you asking about X or Y?"
```

---

## Success Metrics

- Response Latency: <5 seconds (p95)
- User Engagement: 60% of users message coach 3+ times/week
- Conversation Satisfaction: 4.5/5 helpfulness rating
- Multi-Turn Depth: Average 4+ exchanges per conversation
- Context Retention: 85% of follow-ups answered correctly

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s response time | Conversation encrypted | History per user only | Quick reply buttons | WhatsApp Business API |
| Real-time streaming | - | 90-day retention | Voice message alternative | All WhatsApp clients |

---

## Dependencies

- **Prerequisite Stories:** S03.1.1 (account linked), S03.0.1 (API ready)
- **Related Stories:** S03.2.2 (cross-pillar queries), S03.6.1/6.2 (logging triggers)
- **External Dependencies:** AI conversation engine, E8 (Cross-Domain Intelligence)
- **Cross-Epic:** E8 (insight generation), E5/E6/E7 (pillar data)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| AI response timeout (>10s) | Show "Thinking..." then deliver response |
| Unclear user intent | Ask clarifying question |
| Insufficient data for answer | "I need a few more days of data to answer that. Try logging tonight?" |
| API rate limit reached | "Message queued - you'll receive my response shortly!" |
| Harmful content detected | Redirect per AI safety boundaries |

---

## Open Questions

- Maximum conversation history to maintain (24h vs longer)
- Escalation trigger thresholds to voice call

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Natural language processing functional
- [ ] <5s response time achieved
- [ ] Light/Deep mode responses implemented
- [ ] Conversation context maintained (24h window)
- [ ] Emotional tone detection working
- [ ] Quick reply buttons included
- [ ] Out-of-scope handling graceful
- [ ] Error scenarios handled

---

*Story S03.2.1 | Epic E03 | Product: yHealth Platform*
