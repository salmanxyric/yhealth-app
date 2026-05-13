# Epic 04: Mobile App - Stories Index

> **Epic:** E04 - Mobile App
> **Source:** `prd-epics/PRD-Epic-04-Mobile-App.md`
> **Created:** 2025-12-09
> **Stories:** 20 (20 Must Have)
> **Workflow:** EXPERT-13 Story Generator v3.0

---

## Story Index

| Story ID | Title | Feature | File | Priority | Status |
|----------|-------|---------|------|----------|--------|
| S04.1.1 | Dashboard Core Layout & Three-Pillar Scores | F4.1 | [S04-01-dashboard-core-layout.md](S04-01-dashboard-core-layout.md) | P0 (Must) | Draft |
| S04.1.2 | Dashboard Insights & Quick Actions | F4.1 | [S04-02-dashboard-insights-quick-actions.md](S04-02-dashboard-insights-quick-actions.md) | P0 (Must) | Draft |
| S04.1.3 | Dashboard Adaptation & Personalization | F4.1 | [S04-03-dashboard-adaptation.md](S04-03-dashboard-adaptation.md) | P0 (Must) | Draft |
| S04.2.1 | Bottom Tab Navigation & Pillar Access | F4.2 | [S04-04-bottom-tab-navigation.md](S04-04-bottom-tab-navigation.md) | P0 (Must) | Draft |
| S04.2.2 | Channel Switching & Navigation State | F4.2 | [S04-05-channel-switching-state.md](S04-05-channel-switching-state.md) | P0 (Must) | Draft |
| S04.3.1 | Core Chart Rendering | F4.3 | [S04-06-core-chart-rendering.md](S04-06-core-chart-rendering.md) | P0 (Must) | Draft |
| S04.3.2 | Advanced Charts & Interactivity | F4.3 | [S04-07-advanced-charts-interactivity.md](S04-07-advanced-charts-interactivity.md) | P0 (Must) | Draft |
| S04.3.3 | Chart Time Ranges & Export | F4.3 | [S04-08-chart-time-ranges-export.md](S04-08-chart-time-ranges-export.md) | P0 (Must) | Draft |
| S04.4.1 | Notification Infrastructure | F4.4 | [S04-09-notification-infrastructure.md](S04-09-notification-infrastructure.md) | P0 (Must) | Draft |
| S04.4.2 | Notification Types & Delivery | F4.4 | [S04-10-notification-types-delivery.md](S04-10-notification-types-delivery.md) | P0 (Must) | Draft |
| S04.4.3 | Smart Timing & Frequency Control | F4.4 | [S04-11-smart-timing-frequency.md](S04-11-smart-timing-frequency.md) | P0 (Must) | Draft |
| S04.5.1 | Offline Detection & Data Caching | F4.5 | [S04-12-offline-detection-caching.md](S04-12-offline-detection-caching.md) | P0 (Must) | Draft |
| S04.5.2 | Offline Queue Management | F4.5 | [S04-13-offline-queue-management.md](S04-13-offline-queue-management.md) | P0 (Must) | Draft |
| S04.5.3 | Sync Engine & Reconnection | F4.5 | [S04-14-sync-engine-reconnection.md](S04-14-sync-engine-reconnection.md) | P0 (Must) | Draft |
| S04.5.4 | Conflict Resolution & Storage Management | F4.5 | [S04-15-conflict-resolution-storage.md](S04-15-conflict-resolution-storage.md) | P0 (Must) | Draft |
| S04.6.1 | Core Settings & Preferences | F4.6 | [S04-16-core-settings-preferences.md](S04-16-core-settings-preferences.md) | P0 (Must) | Draft |
| S04.6.2 | Privacy, Account & Device Management | F4.6 | [S04-17-privacy-account-device-mgmt.md](S04-17-privacy-account-device-mgmt.md) | P0 (Must) | Draft |
| S04.7.1 | Visual Accessibility & Screen Reader Support | F4.7 | [S04-18-visual-accessibility-screen-reader.md](S04-18-visual-accessibility-screen-reader.md) | P0 (Must) | Draft |
| S04.7.2 | Motor & Cognitive Accessibility | F4.7 | [S04-19-motor-cognitive-accessibility.md](S04-19-motor-cognitive-accessibility.md) | P0 (Must) | Draft |
| S04.7.3 | Auditory Accessibility & Testing Requirements | F4.7 | [S04-20-auditory-accessibility-testing.md](S04-20-auditory-accessibility-testing.md) | P0 (Must) | Draft |

---

## Dependency Diagram

```
PHASE 1: FOUNDATION (Sprint 1-2)
S04.2.1 (Navigation) ──┬──────────────────────────────────────────┐
                       │                                          │
S04.2.2 (Channel) ─────┤                                          │
                       │                                          │
S04.6.1 (Settings) ────┼──► S04.6.2 (Privacy/Account)             │
                       │                                          │
S04.7.1 (Visual A11y) ─┘                                          │
                                                                  │
                       ┌──────────────────────────────────────────┘
                       │
                       ▼
PHASE 2: CORE EXPERIENCE (Sprint 3-4)
S04.1.1 (Dashboard Core) ──► S04.1.2 (Insights/Actions) ──► S04.1.3 (Adaptation)
       │
       ├──► S04.3.1 (Core Charts) ──► S04.3.2 (Advanced) ──► S04.3.3 (Ranges/Export)
       │
       ▼
PHASE 3: ENGAGEMENT (Sprint 5)
S04.4.1 (Notif Infra) ──► S04.4.2 (Types/Delivery) ──► S04.4.3 (Timing/Frequency)
       │
S04.7.2 (Motor/Cognitive A11y) ◄────────────────────────┘
       │
       ▼
PHASE 4: RESILIENCE (Sprint 6)
S04.5.1 (Offline Detection) ──► S04.5.2 (Queue) ──► S04.5.3 (Sync) ──► S04.5.4 (Conflict)
       │
S04.7.3 (Auditory A11y) ◄───────┘
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| F4.1: Unified Dashboard | S04.1.1, S04.1.2, S04.1.3 | 100% |
| F4.2: Navigation & IA | S04.2.1, S04.2.2 | 100% |
| F4.3: Data Visualization | S04.3.1, S04.3.2, S04.3.3 | 100% |
| F4.4: Push Notifications | S04.4.1, S04.4.2, S04.4.3 | 100% |
| F4.5: Offline Mode | S04.5.1, S04.5.2, S04.5.3, S04.5.4 | 100% |
| F4.6: Settings & Preferences | S04.6.1, S04.6.2 | 100% |
| F4.7: Accessibility Features | S04.7.1, S04.7.2, S04.7.3 | 100% |

**Completeness Verification:** All 7 features mapped to 20 stories with 100% coverage.

---

## Implementation Phases

| Phase | Sprint | Stories | Deliverable |
|-------|--------|---------|-------------|
| 1: Foundation | Sprint 1-2 | S04.2.1, S04.2.2, S04.6.1, S04.6.2, S04.7.1 | Navigation shell, settings framework, accessibility foundation |
| 2: Core Experience | Sprint 3-4 | S04.1.1, S04.1.2, S04.1.3, S04.3.1, S04.3.2, S04.3.3 | Unified dashboard, data visualizations |
| 3: Engagement | Sprint 5 | S04.4.1, S04.4.2, S04.4.3, S04.7.2 | Push notification system, motor/cognitive accessibility |
| 4: Resilience | Sprint 6 | S04.5.1, S04.5.2, S04.5.3, S04.5.4, S04.7.3 | Offline mode, sync engine, auditory accessibility |

---

## Cross-Epic Dependencies

| Story | Depends On | Dependency Type | Status |
|-------|------------|-----------------|--------|
| S04.1.1-1.3 (Dashboard) | E5, E6, E7 | Pillar scores and data | Awaiting E5-E7 |
| S04.1.2 (Insights) | E8 | Cross-domain AI insights | Awaiting E8 |
| S04.2.2 (Channel Switch) | E2, E3 | Voice and WhatsApp channels | E2, E3 Complete |
| S04.3.* (Visualization) | E5, E6, E7, E10 | Pillar data and analytics | Awaiting E5-E7, E10 |
| S04.6.2 (Connected Devices) | E9 | Data integrations | Awaiting E9 |

---

## Competitive Advantage Summary

Epic 04 establishes yHealth's mobile app as the **primary interface and home base** for holistic health management. Unlike competitors who focus on single domains (WHOOP on recovery, MyFitnessPal on nutrition), yHealth delivers a **three-pillar unified dashboard** with equal weight to Fitness, Nutrition, and Wellbeing. The **adaptive Light/Deep mode system** serves both busy professionals seeking quick glances and optimization enthusiasts diving into correlation charts. Combined with **WCAG 2.1 AA compliance** and **comprehensive offline mode**, yHealth delivers an industry-leading accessible, reliable mobile experience.

---

## Document Governance

**Created:** 2025-12-09
**Epic PRD Version:** 1.0
**Story Generator:** EXPERT-13 v3.0

**Review Triggers:**
- User feedback from beta testing
- Accessibility audit findings
- Platform OS updates (iOS/Android major releases)

**Next Steps:**
- Task breakdown for each story (EXPERT-14)
- Sprint planning based on implementation phases
- Design specifications for UI components

---

*yHealth Platform - E04: Mobile App Stories v1.0*
*20 stories | 7 features | 100% coverage*
*Generated: 2025-12-09 | Migrated to individual files: 2025-12-24*
