---
type: story
id: S03.0.1
title: WhatsApp API Configuration
epic: E03
epic_name: WhatsApp Integration
feature: Technical
feature_name: Technical Setup
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.0.1: WhatsApp API Configuration

## User Story

**As a** yHealth platform,
**I want to** establish a properly configured WhatsApp Business API integration with all required infrastructure,
**So that** all WhatsApp features can function reliably within policy constraints.

---

## Story Type

- [ ] Feature
- [ ] Enhancement
- [x] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)

---

## Scope Description

**What This Enables:**
- Webhook endpoint to receive all WhatsApp messages (text, media, interactive)
- Message sending capability for all message types (text, interactive, media, templates)
- Template message registration for re-engagement beyond 24-hour window
- Rate limiting and quality rating monitoring infrastructure
- Phone number verification via SMS

**WhatsApp Business API Requirements:**
- Business verification with Meta completed
- Dedicated phone number for yHealth WhatsApp channel
- API access tier configured (starting Tier 1, upgrade path defined)
- Webhook verification endpoint functional
- All required message templates pre-approved

**Message Types Supported:**
| Type | Purpose | Max Size |
|------|---------|----------|
| Text | Coaching responses, insights | 4096 characters |
| Interactive | Quick reply buttons (up to 3) | - |
| Media | Photos, voice notes | 16MB images, 16MB audio |
| Template | Re-engagement beyond 24h window | Pre-approved only |

**Template Messages Required:**
- Re-engagement: "Hi {{name}}! It's been a while since we last connected..."
- Critical Insight: "Hi {{name}}, I noticed an important pattern in your health data..."
- Goal Reminder: "Hi {{name}}, checking in on your progress toward {{goal}}..."

**Infrastructure Components:**
- Webhook endpoint for incoming messages
- Message queue for outbound message processing
- SMS gateway integration for phone verification
- Media storage service for photos and voice notes
- Rate limit tracking and quality score monitoring

---

## Acceptance Criteria

```gherkin
Scenario: Webhook verification
  Given WhatsApp Business API credentials are configured
  When the webhook verification request arrives
  Then the endpoint responds with the correct challenge and returns 200 OK

Scenario: Incoming message processing
  Given an incoming WhatsApp message arrives
  When the webhook receives it
  Then the message is parsed, validated, and queued for processing within 3 seconds

Scenario: Template message delivery
  Given a template message needs to be sent
  When the message is sent to a user beyond the 24-hour window
  Then the pre-approved template is used and delivery succeeds

Scenario: Rate limit monitoring
  Given API rate limits are approached
  When 80% of tier limit is reached
  Then the system alerts operations and begins message prioritization

Scenario: Phone verification
  Given a phone verification is requested
  When the user enters their phone number
  Then an SMS verification code is delivered within 30 seconds
```

---

## Success Metrics

- Webhook Uptime: 99.9%
- Message Processing Latency: <3 seconds from receipt to queue
- SMS Delivery Rate: 95%+ within 30 seconds
- Template Message Approval: 100% of required templates approved

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s webhook processing | API keys encrypted | Phone numbers encrypted | N/A (backend) | WhatsApp Business API v18+ |
| 99.9% uptime | Webhook signature validation | Message retention policy | N/A | Twilio/SMS gateway |

---

## Dependencies

- **Prerequisite Stories:** None (foundation)
- **Related Stories:** S03.1.1 (uses verification), all subsequent stories
- **External Dependencies:** WhatsApp Business API approval, SMS provider account, Cloud infrastructure

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Webhook signature invalid | Reject message, log security alert |
| SMS provider unavailable | Fallback to alternative provider, queue retries |
| Rate limit exceeded | Queue messages, deliver when window opens |
| Template rejected by WhatsApp | Alert product team, use approved fallback |
| Webhook timeout | Return 200 immediately, process async |

---

## Open Questions

- SMS provider selection (Twilio vs alternatives)
- Initial rate limit tier negotiation with WhatsApp
- Template message approval timeline

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Webhook endpoint verified and processing messages
- [ ] SMS verification delivering codes
- [ ] All template messages approved by WhatsApp
- [ ] Rate limiting infrastructure operational
- [ ] Quality score monitoring active
- [ ] Security review completed

---

*Story S03.0.1 | Epic E03 | Product: yHealth Platform*
