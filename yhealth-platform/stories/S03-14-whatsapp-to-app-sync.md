---
type: story
id: S03.7.1
title: WhatsApp to App Sync
epic: E03
epic_name: WhatsApp Integration
feature: F3.7
feature_name: Cross-Channel Sync
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.7.1: WhatsApp to App Sync

## User Story

**As an** Optimization Enthusiast (P3),
**I want** my WhatsApp conversations and logged data to appear in the mobile app,
**So that** I can review history and see all my data in one place.

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
- WhatsApp messages sync to app "Messages" inbox
- Data logged via WhatsApp appears in app dashboard immediately
- Sync latency <5 minutes
- Conversation history accessible in app

**What Syncs:**
| Data Type | Sync Latency | Destination |
|-----------|--------------|-------------|
| Text messages | <5 minutes | App inbox |
| Logged meals | Immediate | Nutrition dashboard |
| Logged mood/energy | Immediate | Wellbeing dashboard |
| Logged workouts | Immediate | Fitness dashboard |
| Photo analysis results | <5 minutes | Meal history |
| Voice transcriptions | <5 minutes | Conversation history |

**Sync Architecture:**
1. WhatsApp event occurs (message, log)
2. Event published to message queue
3. Event processed and stored in database
4. Push notification to app (if open)
5. App refreshes on next open

**Light Mode:**
- Basic data sync
- 24-hour conversation history in app
- Essential data logged

**Deep Mode:**
- Full sync
- Complete conversation history (30+ days) in app
- All metadata preserved

**App Inbox View:**
- Chronological conversation thread
- Message source indicator (WhatsApp icon)
- Logged data highlighted in conversation
- Search within WhatsApp conversations

---

## Acceptance Criteria

```gherkin
Scenario: Message sync
  Given a message is sent via WhatsApp
  When sync completes
  Then message appears in app inbox within 5 minutes

Scenario: Photo meal sync
  Given meal is logged via WhatsApp photo
  When logging completes
  Then meal appears in app Nutrition dashboard immediately

Scenario: Mood sync
  Given mood is logged via WhatsApp button
  When logging completes
  Then mood appears in app Wellbeing dashboard immediately

Scenario: App refresh
  Given user opens app after WhatsApp activity
  When app loads
  Then all WhatsApp data is visible and current

Scenario: Light mode history
  Given user has Light mode enabled
  When viewing conversation history
  Then last 24 hours of WhatsApp chat is visible

Scenario: Deep mode history
  Given user has Deep mode enabled
  When viewing conversation history
  Then 30+ days of history is accessible
```

---

## Success Metrics

- Sync Latency: <5 minutes (p95)
- Data Accuracy: 100% of WhatsApp logs appear in app
- User Satisfaction: 4.5/5 on sync reliability

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5 min sync | Data encrypted in transit | Per-user isolation | Searchable history | iOS 14+, Android 10+ |
| Immediate for logs | - | - | - | - |

---

## Dependencies

- **Prerequisite Stories:** All Phase B and C stories
- **Related Stories:** S03.7.2, S03.7.3
- **External Dependencies:** E4 (Mobile App inbox)
- **Cross-Epic:** E4 (app inbox UI)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Sync delay >10 minutes | Show "Syncing..." indicator in app |
| Message sync fails | Retry automatically, log failure |
| App offline during WhatsApp activity | Sync all on reconnect |
| Large history (1000+ messages) | Paginate, load on scroll |
| Conflict (edited in both places) | Use latest timestamp |

---

## Open Questions

- Conversation history pagination approach

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Message sync to app inbox working
- [ ] Data logs sync immediately
- [ ] <5 minute latency achieved
- [ ] Light mode (24h history) functional
- [ ] Deep mode (30+ days) functional
- [ ] App inbox displays WhatsApp conversations
- [ ] Error handling with retry logic

---

*Story S03.7.1 | Epic E03 | Product: yHealth Platform*
