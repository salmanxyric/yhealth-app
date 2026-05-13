---
type: story
id: S03.4.2
title: Voice Sentiment Analysis & Response
epic: E03
epic_name: WhatsApp Integration
feature: F3.4
feature_name: Voice Messaging
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.4.2: Voice Sentiment Analysis & Response

## User Story

**As a** Holistic Health Seeker (P1),
**I want** my AI coach to understand my emotional tone from voice messages,
**So that** responses are empathetic and match how I'm actually feeling.

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
- Sentiment detected from voice message content and tone
- AI response adapts to detected emotion
- Automatic mood logging when emotion is clear
- Empathetic responses for negative emotions

**Sentiment Detection:**
| Detected Sentiment | Indicators | AI Response Style |
|-------------------|------------|-------------------|
| Very Positive | Excited tone, positive words | Celebratory, reinforcing |
| Positive | Upbeat tone, happy content | Supportive, encouraging |
| Neutral | Flat tone, factual content | Informative, balanced |
| Negative | Sad/frustrated tone, negative words | Empathetic, solution-focused |
| Very Negative/Distressed | Distressed tone, concerning content | Highly empathetic, escalation check |
| Stressed/Anxious | Rushed speech, worry words | Calming, stress-reduction techniques |
| Tired/Fatigued | Slow speech, low energy | Gentle, suggests rest |

**Sentiment to Mood Mapping:**
- Very Positive → Mood 9-10
- Positive → Mood 7-8
- Neutral → Mood 5-6
- Negative → Mood 3-4
- Very Negative → Mood 1-2

**Light Mode:**
- Brief acknowledgment of emotion
- "Got it! Logged your morning mood as 'energized'."
- Emotion influences response tone but isn't detailed

**Deep Mode:**
- Detailed emotional acknowledgment
- "Thanks for sharing! I can hear you're feeling really energized (8/10 mood) after your morning coffee and journaling. This matches your pattern - mornings are your peak energy time. Recommend a workout within the next 2 hours for best results!"
- Full emotional context in response

**Automatic Logging:**
- Clear positive emotion → Log positive mood
- Clear negative emotion → Log lower mood, offer support
- Unclear → Ask for confirmation before logging

**Response Examples:**
```
User (stressed voice): "I'm so overwhelmed with work today, I can't even think about exercise."

AI: "I can hear you're really stressed right now. That's totally valid - work pressure is real. Let's take exercise off the table today. Instead, could you do just 5 minutes of deep breathing? I'll check in with you tomorrow when things might be calmer."
```

---

## Acceptance Criteria

```gherkin
Scenario: Positive tone response
  Given a voice message with positive tone
  When sentiment analysis completes
  Then AI response is celebratory and reinforcing

Scenario: Negative tone response
  Given a voice message with stressed/negative tone
  When sentiment analysis completes
  Then AI response is empathetic and supportive

Scenario: Automatic mood logging
  Given clear emotional content
  When mood can be inferred
  Then mood is automatically logged to Wellbeing pillar

Scenario: Distress detection
  Given user sounds distressed
  When very negative sentiment detected
  Then AI offers additional support options per safety boundaries

Scenario: Unclear sentiment
  Given sentiment is unclear
  When confidence is low
  Then AI asks: "How are you feeling about that? Just want to make sure I understand."

Scenario: Voice-text sentiment conflict
  Given voice + text sentiment conflict
  When words say "fine" but tone suggests stress
  Then AI gently probes: "You say you're fine, but I'm sensing something might be off. Want to talk about it?"
```

---

## Success Metrics

- Sentiment Detection Accuracy: >80% alignment with user intent
- Mood Auto-Logging Accuracy: 85%+
- User Feedback: 4.5/5 on emotional understanding

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s sentiment analysis | Tone data not stored | Mood logs private | Response tone adapts | All voice messages |
| Combined with transcription | - | - | - | - |

---

## Dependencies

- **Prerequisite Stories:** S03.4.1 (transcription)
- **Related Stories:** S03.2.1 (response generation)
- **External Dependencies:** Text analytics service
- **Cross-Epic:** E7 (Wellbeing pillar mood logging)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Mixed emotions detected | Acknowledge complexity: "I'm hearing both excitement and some worry..." |
| Sarcasm detected | Don't take literally, acknowledge: "Not sure if you're joking there - how do you really feel?" |
| Cultural tone differences | Default to content over tone if confidence low |
| Very short voice message | Use text content primarily for sentiment |

---

## Open Questions

- Escalation protocol for very distressed users (integrate with E2 emergency)

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Sentiment analysis integrated with transcription
- [ ] Response adaptation based on emotion
- [ ] Automatic mood logging functional
- [ ] Light/Deep response modes working
- [ ] Distress detection and handling
- [ ] >80% accuracy verified
- [ ] Cross-epic mood logging to E7

---

*Story S03.4.2 | Epic E03 | Product: yHealth Platform*
