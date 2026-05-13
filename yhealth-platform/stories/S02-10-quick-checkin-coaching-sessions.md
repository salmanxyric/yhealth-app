---
type: story
id: S02.4.1
title: Quick Check-In & Coaching Sessions
epic: E02
epic_name: Voice Coaching
feature: F2.4
feature_name: Session Types
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-07
---

# S02.4.1: Quick Check-In & Coaching Sessions

## User Story

**As a** Busy Professional (P2),
**I want** access to both quick 5-minute check-ins and deeper 20-30 minute coaching sessions,
**So that** I can get meaningful guidance whether I have 5 minutes or 30 minutes.

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

**Quick Check-In (5 minutes):**
| Phase | Duration | Content |
|-------|----------|---------|
| Opening | 30s | "How are you feeling today?" |
| Key Metric Review | 2 min | AI highlights 1-2 important patterns |
| Single Recommendation | 1.5 min | One actionable suggestion |
| Closing | 1 min | Confirm action item |

**Triggers:** User-initiated one-tap, AI-initiated daily morning (if opted in)
**Usage:** 60% of all calls (most common)

**Coaching Session (20-30 minutes):**
| Phase | Duration | Content |
|-------|----------|---------|
| Opening Reflection | 3-5 min | "How's your week been?" |
| Data Review | 8-10 min | Detailed multi-pillar analysis |
| Insight Discussion | 5-7 min | Cross-domain connections |
| Goal Adjustment | 3-5 min | Review and refine goals |
| Action Planning | 3-5 min | Set 2-3 action items |
| Closing | 2 min | Summary and next session |

**Triggers:** Scheduled recurring, AI-suggested ("It's been a week since deep session")
**Usage:** 25% of all calls

**Light Mode:**
- Quick Check-In only available
- Coaching Sessions via explicit request only
- Simpler session selection

**Deep Mode:**
- Both session types readily available
- AI suggests appropriate type based on context
- Session can upgrade mid-call: "Want to extend this to a full coaching session?"

---

## Acceptance Criteria

```gherkin
Scenario: Quick Check-In completion
  Given a user wants a quick check-in
  When they select Quick Check-In
  Then the session completes in 5 minutes ±1 minute with one actionable recommendation

Scenario: Coaching Session multi-pillar
  Given a user has time for a coaching session
  When they select Coaching Session
  Then the session covers 2+ health pillars and sets 2-3 action items

Scenario: Session upgrade
  Given a user is in a Quick Check-In but has time
  When the AI detects opportunity
  Then it offers: "Want to extend this to a full coaching session?"

Scenario: AI session suggestion
  Given the AI needs to suggest a session type
  When user initiates call without selection
  Then AI uses context (time of day, recent patterns) to suggest appropriate type

Scenario: Session time management
  Given a session is running over time
  When duration exceeds target by >5 minutes
  Then AI prompts: "We're running long - should we wrap up or continue?"
```

---

## Success Metrics

- Quick Check-In Completion: 90% within 5±1 minutes
- Coaching Session Value: 4.5/5 user rating
- Session Type Appropriateness: 85% report "right session for my need"
- Session Upgrade Rate: 20% of Quick Check-Ins upgrade to Coaching
- Multi-Pillar Coverage: 95% of Coaching Sessions cover 2+ pillars

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Time tracking accurate | Session data secure | Session type not shared | Session timer accessible | All platforms |
| Smooth session transitions | | | Clear session type indication | |

---

## Dependencies

- **Prerequisite Stories:** S02.2.1 (voice engine), S02.2.2 (context for personalized content)
- **Related Stories:** S02.4.3 (session orchestration), S02.5.1 (summaries tailored to session type)
- **External Dependencies:** None beyond core voice infrastructure

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User ends Quick Check-In after 1 minute | Offer quick summary, don't force structure |
| Coaching Session user distracted | Check-in: "Are you still there? Should we pause?" |
| Session type unclear from user request | Ask: "Quick check-in or deeper conversation today?" |
| User wants to downgrade from Coaching | "No problem, let's wrap up with your key action item." |
| Network issues during long session | Save progress, offer to resume or summarize |

---

## Open Questions

- Optimal session timer visibility (always visible vs on-demand)
- Session phase indicators (show progress through structure?)

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Quick Check-In 5-minute structure working
- [ ] Coaching Session 20-30 minute structure working
- [ ] Session upgrade flow functional
- [ ] AI session type suggestion based on context
- [ ] Time management prompts working
- [ ] Multi-pillar coverage in Coaching Sessions

---

*Story S02.4.1 | Epic E02 | Product: yHealth Platform*
