---
type: story
id: S03.5.1
title: Proactive Nudge Engine
epic: E03
epic_name: WhatsApp Integration
feature: F3.5
feature_name: Proactive Engagement
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.5.1: Proactive Nudge Engine

## User Story

**As a** Habit Formation Seeker (P4),
**I want** my AI coach to proactively check in with me and deliver insights,
**So that** I stay consistent with my health habits without having to remember to open the app.

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
- AI-initiated WhatsApp messages at appropriate times
- Value-driven engagement, not spam
- Contextual nudges based on user data and patterns
- Easy response via quick replies or text
- Personalized timing based on user's active patterns

**Nudge Types:**
| Type | Trigger | Example Message |
|------|---------|-----------------|
| Morning Check-In | User's wake time (8am default) | "Good morning! How are you feeling today?" |
| Goal Progress | User 80%+ toward daily goal | "You're at 8,000 steps - just 2,000 more!" |
| Insight Delivery | New pattern detected | "Your best sleep happens when you journal before bed" |
| Milestone Celebration | Streak/goal achieved | "7-day logging streak! Amazing consistency!" |
| Recovery Alert | Recovery score <50 two days | "Your recovery is low. Rest day recommended." |
| Workout Reminder | No activity logged, user has goal | "Haven't seen a workout today. Still planning one?" |
| Meal Reminder | No meal logged by typical time | "Lunch time! Eaten yet? Snap a photo when you do." |
| Re-Engagement | No interaction in 2+ days | "Haven't heard from you in a while. Everything okay?" |
| Evening Reflection | Bedtime - 1 hour | "How was your day? Quick mood check before bed?" |

**Light Mode:**
- Minimal proactive messages: 2-3/day maximum
- Morning check-in + critical insights only
- Goal reminders only when 80%+ toward target

**Deep Mode:**
- Frequent engagement: 5-7/day maximum (user-configurable)
- Morning + evening check-ins
- All insights delivered immediately
- Motivational nudges throughout day

**Nudge Content Requirements:**
- Every nudge provides personalized value
- No generic spam
- Contextual to user's data and goals
- Actionable (clear next step or response option)

---

## Acceptance Criteria

```gherkin
Scenario: Morning check-in
  Given it's the user's configured morning time
  When morning check-in is triggered
  Then a personalized greeting is sent with mood quick reply buttons

Scenario: Insight delivery
  Given a new cross-domain insight is detected
  When the insight is significant
  Then it's delivered to WhatsApp with explanation

Scenario: Milestone celebration
  Given user achieves a milestone
  When achievement is detected
  Then celebratory message is sent within 1 hour

Scenario: Re-engagement
  Given user hasn't interacted in 2+ days
  When re-engagement trigger fires
  Then gentle check-in message is sent (using template if >24h window)

Scenario: Light mode limit
  Given user has Light mode enabled
  When nudge count reaches 3/day
  Then no more nudges are sent until tomorrow

Scenario: Quiet hours respect
  Given a nudge is scheduled
  When the scheduled time falls in quiet hours
  Then the nudge is queued for next active period
```

---

## Success Metrics

- Nudge Engagement Rate: >50% of nudges receive response
- Opt-Out Rate: <5% disable proactive messages
- Perceived Value: 4.3/5 helpfulness rating
- Timing Accuracy: >90% sent within user's active hours

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Scheduled delivery | - | Nudges per user only | Clear, readable | WhatsApp Business API |
| Real-time triggers | - | - | Quick replies | - |

---

## Dependencies

- **Prerequisite Stories:** S03.2.1 (response engine), S03.1.1 (preferences)
- **Related Stories:** S03.5.2 (timing), S03.5.3 (24h window)
- **External Dependencies:** Scheduling service, E8 (insights)
- **Cross-Epic:** E8 (cross-domain insight generation)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User reports "too many messages" | Reduce frequency: "Got it! I'll check in less often." |
| Multiple triggers fire simultaneously | Prioritize, send highest value, queue others |
| Insight not relevant to user | AI relevance filter prevents low-value nudges |
| User in different timezone than expected | Respect device timezone, not configured |

---

## Open Questions

- Maximum nudge frequency caps by mode
- Insight relevance threshold for delivery

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] All nudge types implemented
- [ ] Light mode (2-3/day max) enforced
- [ ] Deep mode (5-7/day max) enforced
- [ ] Personalization working for all nudges
- [ ] Quick reply buttons on appropriate nudges
- [ ] Engagement tracking functional
- [ ] Frequency adjustment via user feedback

---

*Story S03.5.1 | Epic E03 | Product: yHealth Platform*
