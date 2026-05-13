# Epic 01: Onboarding & Assessment - Story Index

> **Epic:** E01 - Onboarding & Assessment
> **Source:** `prd-epics/PRD-Epic-01-Onboarding-Assessment.md`
> **Created:** 2025-12-07
> **Stories:** 15 (12 Must Have, 3 Should Have)

---

## Story Index

| Story ID | Title | Feature | Priority | Status | File |
|----------|-------|---------|----------|--------|------|
| S01.1.1 | Core Account Registration | F1.1 | P0 | Done | [View](S01-01-core-account-registration.md) |
| S01.1.2 | Social Sign-In | F1.1 | P0 | Done | [View](S01-02-social-sign-in.md) |
| S01.1.3 | Privacy Consent & WhatsApp Enrollment | F1.1 | P0 | In Progress | [View](S01-03-privacy-consent-whatsapp.md) |
| S01.2.1 | Goal Discovery | F1.2 | P0 | Done | [View](S01-04-goal-discovery.md) |
| S01.2.2 | Quick Assessment Path | F1.2 | P0 | Done | [View](S01-05-quick-assessment-path.md) |
| S01.2.3 | Deep Assessment Path | F1.2 | P1 | In Progress | [View](S01-06-deep-assessment-path.md) |
| S01.3.1 | AI-Guided Goal Setup | F1.3 | P0 | In Progress | [View](S01-07-ai-guided-goal-setup.md) |
| S01.3.2 | Goal Validation & Commitment | F1.3 | P0 | Done | [View](S01-08-goal-validation-commitment.md) |
| S01.4.1 | Integration Discovery & Selection | F1.4 | P0 | Done | [View](S01-09-integration-discovery-selection.md) |
| S01.4.2 | OAuth Connection Flow | F1.4 | P0 | In Progress | [View](S01-10-oauth-connection-flow.md) |
| S01.4.3 | Data Sync & Conflict Resolution | F1.4 | P0 | In Progress | [View](S01-11-data-sync-conflict-resolution.md) |
| S01.5.1 | Engagement & Notification Preferences | F1.5 | P0 | Done | [View](S01-12-engagement-notification-preferences.md) |
| S01.5.2 | Coaching Style & Channel Preferences | F1.5 | P1 | Done | [View](S01-13-coaching-style-channel-preferences.md) |
| S01.6.1 | Plan Generation Engine | F1.6 | P0 | In Progress | [View](S01-14-plan-generation-engine.md) |
| S01.6.2 | Plan Presentation & Adjustment | F1.6 | P0 | Done | [View](S01-15-plan-presentation-adjustment.md) |

**Status Summary:** Done: 9 | In Progress: 6
**Priority Summary:** P0 (Must Have): 12 | P1 (Should Have): 3

### Implementation Gaps (In Progress Stories)

| Story | Gap | Required Action |
|-------|-----|-----------------|
| S01.1.3 | SMS verification stubbed | Integrate Twilio/SMS provider |
| S01.2.3 | AI responses placeholder | Connect OpenAI for conversation |
| S01.3.1 | Goal suggestions stubbed | Implement generateSuggestedGoals() |
| S01.4.2 | Token exchange mock | Real OAuth with providers |
| S01.4.3 | Data sync mock | Implement provider data fetch |
| S01.6.1 | AI plan generation basic | Connect OpenAI for activities |

---

## Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EPIC 01 STORY DEPENDENCIES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: ACCOUNT FOUNDATION                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  S01.1.1 (Core Registration) ──┬──▶ S01.1.2 (Social Sign-In)       │  │
│  │                                └──▶ S01.1.3 (Privacy & WhatsApp)   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│  PHASE 2: ASSESSMENT                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  S01.2.1 (Goal Discovery) ──┬──▶ S01.2.2 (Quick Path)              │  │
│  │                             └──▶ S01.2.3 (Deep Path)               │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│  PHASE 3: GOAL SETTING                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  S01.3.1 (AI Goal Setup) ──────▶ S01.3.2 (Validation & Commitment) │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│  PHASE 4: INTEGRATIONS                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  S01.4.1 (Discovery) ──▶ S01.4.2 (OAuth) ──▶ S01.4.3 (Data Sync)  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│  PHASE 5: PREFERENCES                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  S01.5.1 (Engagement Prefs) ────▶ S01.5.2 (Coaching Style)         │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   │                                         │
│                                   ▼                                         │
│  PHASE 6: PLAN GENERATION                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  S01.6.1 (Plan Engine) ────────▶ S01.6.2 (Plan Presentation)       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| F1.1: Account Creation | S01.1.1 - S01.1.3 | 100% |
| F1.2: Flexible Assessment | S01.2.1 - S01.2.3 | 100% |
| F1.3: Goal Setting & Refinement | S01.3.1 - S01.3.2 | 100% |
| F1.4: Integration Setup | S01.4.1 - S01.4.3 | 100% |
| F1.5: Preference Configuration | S01.5.1 - S01.5.2 | 100% |
| F1.6: Personalized Plan Generation | S01.6.1 - S01.6.2 | 100% |

---

## Implementation Sequence

### Sprint 1: Account Foundation
| Order | Story | Rationale |
|-------|-------|-----------|
| 1 | S01.1.1 | Core Account Registration - Entry point |
| 2 | S01.1.2 | Social Sign-In - Alternative registration |
| 3 | S01.1.3 | Privacy Consent & WhatsApp - Required legal compliance |

### Sprint 2: Assessment Core
| Order | Story | Rationale |
|-------|-------|-----------|
| 4 | S01.2.1 | Goal Discovery - Assessment routing |
| 5 | S01.2.2 | Quick Assessment - Primary path (60% users) |
| 6 | S01.3.1 | AI-Guided Goal Setup - Core personalization |
| 7 | S01.3.2 | Goal Validation & Commitment - Safety guardrails |

### Sprint 3: Integrations
| Order | Story | Rationale |
|-------|-------|-----------|
| 8 | S01.4.1 | Integration Discovery - Device selection |
| 9 | S01.4.2 | OAuth Connection Flow - Secure authorization |
| 10 | S01.4.3 | Data Sync & Conflict Resolution - Data foundation |

### Sprint 4: Personalization & Plan
| Order | Story | Rationale |
|-------|-------|-----------|
| 11 | S01.5.1 | Engagement & Notification Preferences - User control |
| 12 | S01.6.1 | Plan Generation Engine - Core AI output |
| 13 | S01.6.2 | Plan Presentation & Adjustment - User handoff |

### Sprint 5: Enhancement
| Order | Story | Rationale |
|-------|-------|-----------|
| 14 | S01.2.3 | Deep Assessment Path - AI conversation (P1) |
| 15 | S01.5.2 | Coaching Style & Channel Preferences (P1) |

---

*Epic 01: Onboarding & Assessment Stories Index | yHealth Platform | 2025-12-07*
