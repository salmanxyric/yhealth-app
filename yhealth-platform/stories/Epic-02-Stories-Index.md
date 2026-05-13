# Epic 02: Voice Coaching - Story Index

> **Epic:** E02 - Voice Coaching
> **Source:** `prd-epics/PRD-Epic-02-Voice-Coaching.md`
> **Created:** 2025-12-07
> **Stories:** 16 (16 Must Have)

---

## Story Index

| Story ID | Title | Feature | Priority | Status | File |
|----------|-------|---------|----------|--------|------|
| S02.1.1 | User-Initiated Voice Calls | F2.1 | P0 | Draft | [View](S02-01-user-initiated-voice-calls.md) |
| S02.1.2 | AI-Initiated Proactive Calls | F2.1 | P0 | Draft | [View](S02-02-ai-initiated-proactive-calls.md) |
| S02.1.3 | Scheduled Coaching Sessions | F2.1 | P0 | Draft | [View](S02-03-scheduled-coaching-sessions.md) |
| S02.2.1 | Voice Conversation Engine | F2.2 | P0 | Draft | [View](S02-04-voice-conversation-engine.md) |
| S02.2.2 | Conversation Context & Memory | F2.2 | P0 | Draft | [View](S02-05-conversation-context-memory.md) |
| S02.2.3 | Real-Time Transcription & Accessibility | F2.2 | P0 | Draft | [View](S02-06-realtime-transcription-accessibility.md) |
| S02.3.1 | Emotion Detection Engine | F2.3 | P0 | Draft | [View](S02-07-emotion-detection-engine.md) |
| S02.3.2 | AI Response Adaptation | F2.3 | P0 | Draft | [View](S02-08-ai-response-adaptation.md) |
| S02.3.3 | Emotion Data Integration | F2.3 | P0 | Draft | [View](S02-09-emotion-data-integration.md) |
| S02.4.1 | Quick Check-In & Coaching Sessions | F2.4 | P0 | Draft | [View](S02-10-quick-checkin-coaching-sessions.md) |
| S02.4.2 | Emergency Support Session | F2.4 | P0 | Draft | [View](S02-11-emergency-support-session.md) |
| S02.4.3 | Goal Review & Session Orchestration | F2.4 | P0 | Draft | [View](S02-12-goal-review-session-orchestration.md) |
| S02.5.1 | Summary Generation & Content | F2.5 | P0 | Draft | [View](S02-13-summary-generation-content.md) |
| S02.5.2 | Summary Delivery & Action Tracking | F2.5 | P0 | Draft | [View](S02-14-summary-delivery-action-tracking.md) |
| S02.6.1 | Voice & Schedule Customization | F2.6 | P0 | Draft | [View](S02-15-voice-schedule-customization.md) |
| S02.6.2 | Conversation & Accessibility Preferences | F2.6 | P0 | Draft | [View](S02-16-conversation-accessibility-preferences.md) |

**Priority Summary:** P0 (Must Have): 16

---

## Dependency Diagram

```
PHASE 1: FOUNDATION
S02.1.1 ──► S02.2.1 ──► S02.6.1
                │
PHASE 2: CORE   ▼
        S02.2.2 ──┬──► S02.3.1 ──► S02.3.2
                  └──► S02.4.1
                           │
PHASE 3: SESSIONS          ▼
        S02.1.2 ◄──────────┤
        S02.1.3 ◄──────────┤
        S02.4.2 ◄──────────┘ (CRITICAL)
        S02.4.3
            │
PHASE 4: ENHANCEMENT
            ▼
        S02.5.1 ──► S02.5.2
        S02.2.3
        S02.3.3
        S02.6.2
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| F2.1 Voice Call Initiation | S02.1.1, S02.1.2, S02.1.3 | 100% |
| F2.2 Real-Time AI Conversation | S02.2.1, S02.2.2, S02.2.3 | 100% |
| F2.3 Voice Tone Analysis | S02.3.1, S02.3.2, S02.3.3 | 100% |
| F2.4 Session Types | S02.4.1, S02.4.2, S02.4.3 | 100% |
| F2.5 Post-Call Summary | S02.5.1, S02.5.2 | 100% |
| F2.6 Voice Preferences | S02.6.1, S02.6.2 | 100% |

---

## Implementation Phases

| Phase | Sprint | Stories | Deliverable |
|-------|--------|---------|-------------|
| 1: Foundation | Sprint 1 | S02.1.1, S02.2.1, S02.6.1 | Users can initiate voice calls with basic conversations |
| 2: Core Capabilities | Sprint 2 | S02.2.2, S02.3.1, S02.3.2, S02.4.1 | Emotionally intelligent, context-aware conversations |
| 3: Full Session Support | Sprint 3 | S02.1.2, S02.1.3, S02.4.2, S02.4.3 | All 4 session types, AI-initiated calls, emergency protocols |
| 4: Enhancement | Sprint 4 | S02.5.1, S02.5.2, S02.2.3, S02.3.3, S02.6.2 | Complete Epic with summaries, accessibility, cross-pillar integration |

---

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| All 16 stories as P0 Must Have | All features are MVP Core per PRD | 2025-12-07 |
| 4 implementation phases | Logical progression: Foundation → Core → Sessions → Enhancement | 2025-12-07 |
| Emergency Support atomic | Safety protocols cannot be partially deployed | 2025-12-07 |
| Voice Tone Analysis split 3 ways | Detection, adaptation, integration are distinct concerns | 2025-12-07 |
| Transcription separated | Accessibility compliance deserves dedicated attention | 2025-12-07 |
| Session types grouped | Quick Check-In + Coaching together; Emergency separate for safety | 2025-12-07 |

---

*Epic 02: Voice Coaching Stories Index | yHealth Platform | 2025-12-07*
