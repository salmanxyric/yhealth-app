---
type: story
id: S03.5.3
title: 24-Hour Window & Template Messages
epic: E03
epic_name: WhatsApp Integration
feature: F3.5
feature_name: Proactive Engagement
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.5.3: 24-Hour Window & Template Messages

## User Story

**As a** yHealth platform,
**I want to** properly manage WhatsApp's 24-hour messaging window and use template messages for re-engagement,
**So that** proactive nudges work within policy constraints and users can be re-engaged when inactive.

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

**What This Enables:**
- Compliance with WhatsApp Business API 24-hour window policy
- Re-engagement of inactive users via approved templates
- Seamless transition between free-form and template messaging
- Tracking of window status per user

**24-Hour Window Rules:**
- Window opens when user sends a message
- Free-form messages allowed within 24 hours
- After 24 hours: Only template messages allowed
- Template messages can reopen window if user responds

**Window Management:**
| User State | Message Type Allowed | Action |
|------------|---------------------|--------|
| Active (<24h since last message) | Free-form | Send any nudge |
| Inactive (>24h) | Template only | Use re-engagement template |
| Re-engaged (responded to template) | Free-form | Resume normal nudges |

**Template Messages (Pre-Approved):**
1. **Re-Engagement Template:**
   "Hi {{name}}! It's been a while since we last connected. I'm here when you're ready to continue your health journey. Reply anytime!"

2. **Critical Insight Template:**
   "Hi {{name}}, I noticed an important pattern in your health data. Reply to see the insight and how it can help you."

3. **Goal Reminder Template:**
   "Hi {{name}}, checking in on your progress toward {{goal}}. Reply to continue."

**Window Tracking:**
- Store last user message timestamp per user
- Calculate window status in real-time
- Update when user responds

**Template Usage Guidelines:**
- Maximum 1 re-engagement template per week
- Critical insight templates: As detected (max 2/week)
- Goal reminders: Weekly maximum

---

## Acceptance Criteria

```gherkin
Scenario: Template message for inactive user
  Given a user hasn't messaged in >24 hours
  When a proactive nudge is scheduled
  Then a template message is used instead of free-form

Scenario: Window reopens on response
  Given a template message is sent
  When the user responds
  Then the 24-hour window reopens for free-form messaging

Scenario: Template selection
  Given multiple templates need to be sent
  When selecting which to send
  Then the most relevant template is chosen

Scenario: Weekly re-engagement limit
  Given re-engagement template was sent this week
  When another re-engagement trigger fires
  Then it is skipped (max 1/week enforced)

Scenario: Normal nudges resume
  Given user responds to template
  When window status is updated
  Then normal nudge scheduling resumes

Scenario: All templates on cooldown
  Given all templates are on cooldown
  When re-engagement is needed
  Then the attempt is logged and skipped
```

---

## Success Metrics

- Template Delivery Rate: 98%+
- Template Response Rate: >20% of templates get response
- Window Compliance: 100% (no policy violations)
- Re-Engagement Success: 40% of inactive users re-engage within 7 days

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Real-time window check | - | Window status per user | Templates readable | WhatsApp Business API |
| Template fallback <1s | - | - | - | Pre-approved templates |

---

## Dependencies

- **Prerequisite Stories:** S03.0.1 (templates approved), S03.5.1 (nudge engine)
- **Related Stories:** S03.5.2 (timing)
- **External Dependencies:** WhatsApp template approval process

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Template rejected by WhatsApp | Use approved fallback, alert product team |
| Window status calculation error | Default to template (safer) |
| User blocks yHealth | Detect blocked status, stop all messages |
| Template variable missing | Use default value or skip personalization |
| Rate limit on templates | Queue and retry within limits |

---

## Open Questions

- Template approval timeline with WhatsApp
- Additional template types needed

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] 24-hour window tracking functional
- [ ] All template messages approved and functional
- [ ] Template selection logic working
- [ ] Frequency limits enforced
- [ ] Window reopening on user response
- [ ] 100% policy compliance verified
- [ ] Re-engagement analytics tracking

---

*Story S03.5.3 | Epic E03 | Product: yHealth Platform*
