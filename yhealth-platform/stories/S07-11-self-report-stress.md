---
type: story
id: S07.5.1
title: Self-Report Stress Tracking
epic: E07
epic_name: Wellbeing Pillar
feature: F7.5
feature_name: Stress Pattern Detection
product: yhealth-platform
priority: P0
status: Draft
story_points: 0
created: 2025-12-24
---

# S07.5.1: Self-Report Stress Tracking


### User Story
**As a** Busy Professional (P2),
**I want to** quickly log my stress level with optional trigger identification,
**So that** I can track my stress patterns and understand what causes my stress.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Self-reported stress is the first signal in the multi-signal stress detection system. Users rate their stress on a 1-10 scale with optional trigger tagging. Daily evening check-ins capture overall stress, with on-demand logging available for acute stress moments.

**Stress Scale:**

| Rating | Label | Description |
|--------|-------|-------------|
| 1-2 | No stress | Completely relaxed, at ease |
| 3-4 | Mild stress | Slight tension, manageable |
| 5-6 | Moderate stress | Noticeable stress, affecting focus |
| 7-8 | High stress | Significant stress, difficulty coping |
| 9-10 | Extreme stress | Overwhelming, crisis-level |

**Stress Triggers:**
- Work
- Relationships
- Finances
- Health
- Family
- Uncertainty
- Time pressure
- Conflict
- Other (free text)

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Daily stress rating (1-10), optional single trigger. 10-second check-in. |
| **Deep** | Detailed stress logging with multiple triggers, notes, intensity tracking throughout day. |

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Stress Rating | Integer 1-10 | Required | User-only |
| Triggers | Array<Enum> | From trigger list | User-only |
| Other Trigger | String | If "Other" selected | User-only |
| Note | String | Max 500 chars | User-only |
| Timestamp | ISO 8601 | Required | System |
| Check-in Type | Enum | daily/on-demand | System |

**Behaviors:**
- Evening check-in prompt (default 8 PM): "How was your stress today?"
- On-demand logging available anytime
- Multiple stress logs per day accepted
- Triggers are multi-select (can have multiple stressors)
- Stress data is 30% weight in Mental Recovery Score

### Acceptance Criteria

**AC1: Stress Rating Input**
Given the user opens stress check-in,
When they slide to a stress level (1-10),
Then the rating saves with timestamp.

**AC2: Evening Prompt Delivery**
Given evening prompt time (default 8 PM),
When user has app open or notifications enabled,
Then "How was your stress today?" prompt appears.

**AC3: Trigger Selection**
Given the user is logging stress,
When they view trigger options,
Then they can select multiple triggers from the list.

**AC4: Other Trigger Free Text**
Given "Other" trigger is selected,
When the user enters custom trigger text,
Then the custom trigger saves with the stress log.

**AC5: On-Demand Stress Logging**
Given the user is experiencing acute stress,
When they open stress check-in manually,
Then they can log stress outside of daily prompt.

**AC6: Multiple Daily Logs**
Given the user logged stress this morning,
When they log again in the evening,
Then both logs are saved (not overwritten).

**AC7: Light Mode Quick Check**
Given the user is in Light mode,
When stress check-in opens,
Then simple slider + optional single trigger appears.

**AC8: Deep Mode Detailed Check**
Given the user is in Deep mode,
When stress check-in opens,
Then multiple triggers, notes field, and intensity details are available.

**AC9: Mental Recovery Score Integration**
Given stress data is logged,
When Mental Recovery Score calculates,
Then stress contributes 30% weight to the score.

### Success Metrics
- Daily stress logging: 70% of users log stress ≥1x/day
- Trigger tagging: 50% of stress logs include at least one trigger
- On-demand usage: 20% use on-demand stress logging for acute stress
- Average check-in time: <10 seconds for Light mode

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Stress save <1s | Auth required | Stress data user-only | Voice input support | iOS 14+, Android 10+ |
| Prompt delivery <2s | Encrypted at rest | No sharing without consent | 44x44pt touch targets | WhatsApp, Voice channels |

### Dependencies
- **Prerequisite Stories:** None (foundation for stress detection)
- **Related Stories:** S07.5.2, S07.5.3
- **External Dependencies:** E4 (Mobile App), E3 (WhatsApp), E2 (Voice coaching)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Chronic extreme stress (≥9 for 5+ days) | Escalation protocol: "Your stress is very high. Consider talking to a professional?" + resources |
| No stress logging for 3+ days | Re-engagement: "Haven't tracked stress recently. How are you holding up?" |
| All triggers selected (unlikely) | Accept; may indicate overwhelm |
| Stress improves dramatically (9→3 in 1 day) | Accept; flag for pattern analysis (positive) |
| Offline stress logging | Queue locally; sync when reconnected |

### Open Questions
- Should we show stress trend inline with the check-in ("Your stress has been 7+ for 3 days")?
- What's the appropriate escalation threshold for crisis resources?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 1-10 stress scale functional
- [ ] Trigger selection (multi-select) working
- [ ] Evening prompt delivering
- [ ] On-demand logging available
- [ ] Stress data feeding Mental Recovery Score (30% weight)
- [ ] Crisis escalation protocol implemented
- [ ] Performance requirements verified

---