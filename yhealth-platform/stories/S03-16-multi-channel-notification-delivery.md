---
type: story
id: S03.7.3
title: Multi-Channel Notification Delivery
epic: E03
epic_name: WhatsApp Integration
feature: F3.7
feature_name: Cross-Channel Sync
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.7.3: Multi-Channel Notification Delivery

## User Story

**As an** Optimization Enthusiast (P3),
**I want** important notifications delivered across my preferred channels,
**So that** I don't miss insights or alerts regardless of which channel I'm using.

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
- Insights delivered to WhatsApp AND app notification
- User can set channel preferences per notification type
- No duplicate notifications if user has seen it
- Consistent messaging across channels

**Multi-Channel Delivery:**
| Notification Type | WhatsApp | App Push | App Inbox |
|------------------|----------|----------|-----------|
| New Insight | Message | Push notification | Saved |
| Goal Achievement | Celebratory message | Push + badge | Saved |
| Recovery Alert | Message | Push notification | Saved |
| Voice Call Summary | Summary message | - | Saved |
| Daily Summary | Optional message | Push notification | Always |

**Delivery Logic:**
1. Notification event generated
2. Check user's channel preferences
3. Deliver to preferred channels
4. Track delivery status per channel
5. Mark as seen when user views on any channel
6. Don't re-send if already seen

**Channel Preference Options:**
- "WhatsApp only" - Primary WhatsApp, no app push
- "App only" - Primary app push, no WhatsApp
- "Both" - Deliver to both channels
- "Smart" - AI decides based on user's active channel

**Deduplication:**
- Notification marked "seen" across all channels when viewed on one
- No repeated delivery of same notification
- Digest mode available: Multiple notifications combined

---

## Acceptance Criteria

```gherkin
Scenario: Multi-channel insight delivery
  Given a new insight is generated
  When delivery is triggered
  Then notification appears on user's preferred channels

Scenario: Cross-channel seen status
  Given user views notification on WhatsApp
  When they open the app
  Then notification is marked as read (no duplicate alert)

Scenario: Both channels preference
  Given user has "Both" preference
  When notification is sent
  Then it appears on WhatsApp AND app push

Scenario: Smart channel selection
  Given user has "Smart" preference
  When AI determines active channel
  Then notification is sent to most relevant channel

Scenario: Digest mode
  Given multiple notifications fire rapidly
  When digest mode is enabled
  Then notifications are combined into single message

Scenario: Partial delivery failure
  Given notification delivery fails on one channel
  When retry exhausts
  Then other channels still receive notification
```

---

## Success Metrics

- Delivery Success Rate: 99%+ across channels
- Deduplication Accuracy: 100% no unwanted duplicates
- User Channel Satisfaction: 4.4/5

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s delivery | - | Preferences per user | Consistent formatting | All channels |
| Real-time tracking | - | - | - | - |

---

## Dependencies

- **Prerequisite Stories:** S03.7.1, S03.7.2
- **Related Stories:** S03.5.1 (nudge delivery)
- **External Dependencies:** E4 (app push notifications)
- **Cross-Epic:** E4 (push notification service)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| WhatsApp delivery fails, app succeeds | Retry WhatsApp, don't duplicate app |
| Both channels fail | Queue and retry, alert if persistent |
| User changes preference mid-notification | Respect new preference for future |
| Timezone affects delivery | Consistent timing across channels |
| Notification too long for WhatsApp | Truncate with "See full in app" link |

---

## Open Questions

- Digest mode grouping logic (time-based vs count-based)

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Multi-channel delivery working
- [ ] Channel preferences respected
- [ ] Deduplication functional
- [ ] Smart channel selection working
- [ ] Digest mode available
- [ ] Delivery tracking accurate
- [ ] Cross-channel seen status synced

---

*Story S03.7.3 | Epic E03 | Product: yHealth Platform*
