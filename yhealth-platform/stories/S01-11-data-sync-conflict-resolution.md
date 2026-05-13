---
type: story
id: S01.4.3
title: Data Sync & Conflict Resolution
epic: E01
epic_name: Onboarding & Assessment
feature: F1.4
feature_name: Integration Setup
product: yhealth-platform
priority: P0
status: In Progress
created: 2025-12-07
---

# S01.4.3: Data Sync & Conflict Resolution

## User Story

**As a** new yHealth user who connected integrations,
**I want to** have my historical data synced and see clear status of ongoing syncs,
**So that** yHealth has my health history and I know my data is up-to-date.

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
- Initial sync: Pull last 30 days of historical data
- Progress indicator during sync: "Syncing... 12 of 30 days imported"
- Ongoing sync: Real-time or near-real-time per integration
- Sync status dashboard showing last sync time per integration
- Multi-source conflict resolution (when same data from multiple sources)

**Sync Frequencies:**

| Integration | Initial Sync | Ongoing Sync | Method |
|-------------|--------------|--------------|--------|
| WHOOP | 30 days | Every 15 min | Webhook + polling |
| Apple Health | 30 days | Real-time | HealthKit background |
| Fitbit | 30 days | Every 15 min | Subscription API |
| MyFitnessPal | 30 days | Every 1 hour | Polling |
| Strava | 30 days | Real-time | Webhook |
| Oura | 30 days | Every 6 hours | Polling (daily data) |

**Sync Status Indicators:**
```
Integration Status:

Apple Watch: ✅ Synced 5 min ago
WHOOP: ✅ Synced 12 min ago
MyFitnessPal: ⚠️ Last sync 25 hours ago [Re-authorize]
Strava: ❌ Connection lost [Reconnect]
```

**Conflict Resolution (Golden Source Hierarchy):**
When same metric comes from multiple sources:
1. **Heart Rate:** WHOOP > Apple > Fitbit > Garmin
2. **Sleep:** Oura > WHOOP > Apple > Fitbit
3. **Steps:** Apple > Fitbit > Garmin > Samsung
4. **Workouts:** Primary device set by user, fallback to most detailed

User can override hierarchy in settings.

---

## Acceptance Criteria

```gherkin
Scenario: Initial sync
  Given integration is connected
  When initial sync begins
  Then 30 days of historical data is pulled with progress indicator

Scenario: Sync progress
  Given initial sync is running
  When user views progress
  Then they see "Syncing... X of 30 days imported"

Scenario: Ongoing sync
  Given ongoing sync is active
  When new data is available at source
  Then yHealth syncs within the defined frequency

Scenario: Status dashboard
  Given sync status dashboard is viewed
  When integrations have varying states
  Then clear status indicators show each integration's health

Scenario: Conflict resolution
  Given data conflict exists (same metric, multiple sources)
  When data is processed
  Then golden source hierarchy is applied silently

Scenario: Sync failure
  Given sync fails 3+ times
  When failure persists
  Then user is notified and support escalation is offered
```

---

## Success Metrics

- Initial Sync Completion: 95%+ within 5 minutes
- Sync Reliability: 99%+ uptime
- Time to First Data: <2 min from authorization
- Conflict Resolution Accuracy: 100% (rules applied correctly)

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5 min initial sync | Data encrypted at rest | User controls retention | Status clearly visible | All supported devices |
| Real-time where possible | - | - | - | |

---

## Dependencies

- **Prerequisite Stories:** S01.4.2 (OAuth complete)
- **Related Stories:** S01.6.1 (plan uses synced data)
- **External Dependencies:** All integration APIs, background job infrastructure

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| API rate limit hit | Exponential backoff, retry later |
| No historical data available | Start collecting from now |
| Integration API down | Show status, auto-retry when up |
| Duplicate data from same source | Deduplicate by timestamp |
| User disconnects integration | Stop sync, optionally delete data |

---

## Open Questions

- Data retention default (2 years?)
- User ability to delete specific integration data

---

## Definition of Done

- [ ] 30-day historical sync for all integrations
- [ ] Progress indicator during initial sync
- [ ] Ongoing sync at defined frequencies
- [ ] Sync status dashboard implemented
- [ ] Conflict resolution hierarchy enforced
- [ ] User can view/manage sync settings
- [ ] Error handling with retry logic

---

*Story S01.4.3 | Epic E01 | Product: yHealth Platform*
