# Epic 07: Wellbeing Pillar - Stories Index

> **Epic:** E07 - Wellbeing Pillar
> **Source:** `prd-epics/PRD-Epic-07-Wellbeing-Pillar.md`
> **Created:** 2025-12-11
> **Updated:** 2025-12-24
> **Stories:** 18 (18 Must Have)
> **Format:** Individual story files

---

## Story Index

| Story ID | File | Title | Feature | Priority | Status |
|----------|------|-------|---------|----------|--------|
| S07.1.1 | S07-01-mood-checkin-logging.md | Mood Check-in Logging | F7.1 | P0 | Draft |
| S07.1.2 | S07-02-mood-timeline-patterns.md | Mood Timeline & Patterns | F7.1 | P0 | Draft |
| S07.4.1 | S07-03-energy-level-logging.md | Energy Level Logging | F7.4 | P0 | Draft |
| S07.4.2 | S07-04-energy-pattern-analysis.md | Energy Pattern Analysis | F7.4 | P0 | Draft |
| S07.3.1 | S07-05-habit-creation.md | Habit Creation & Configuration | F7.3 | P0 | Draft |
| S07.3.2 | S07-06-habit-logging-streaks.md | Habit Logging & Streaks | F7.3 | P0 | Draft |
| S07.3.3 | S07-07-habit-correlation-insights.md | Habit Correlation Insights | F7.3 | P0 | Draft |
| S07.2.1 | S07-08-journaling-prompt-system.md | Journaling Prompt System | F7.2 | P0 | Draft |
| S07.2.2 | S07-09-journal-entry-voice.md | Journal Entry & Voice Input | F7.2 | P0 | Draft |
| S07.2.3 | S07-10-journal-ai-personalization.md | Journal AI Personalization | F7.2 | P0 | Draft |
| S07.5.1 | S07-11-self-report-stress.md | Self-Report Stress Tracking | F7.5 | P0 | Draft |
| S07.5.2 | S07-12-multi-signal-stress-detection.md | Multi-Signal Stress Detection | F7.5 | P0 | Draft |
| S07.5.3 | S07-13-stress-alerts-interventions.md | Stress Alerts & Interventions | F7.5 | P0 | Draft |
| S07.6.1 | S07-14-wellbeing-goal-setting.md | Wellbeing Goal Setting | F7.6 | P0 | Draft |
| S07.6.2 | S07-15-routine-templates.md | Routine Templates & Builder | F7.6 | P0 | Draft |
| S07.6.3 | S07-16-routine-tracking-analytics.md | Routine Tracking & Analytics | F7.6 | P0 | Draft |
| S07.7.1 | S07-17-mindfulness-practice-library.md | Mindfulness Practice Library | F7.7 | P0 | Draft |
| S07.7.2 | S07-18-context-aware-recommendations.md | Context-Aware Recommendations | F7.7 | P0 | Draft |

---

## Dependency Diagram

```
PHASE 1: FOUNDATION (Sprint 1)
S07.1.1 (Mood Input) ──► S07.1.2 (Mood Patterns)
         │
S07.4.1 (Energy Input) ──► S07.4.2 (Energy Patterns)
         │                        │
         └────────────┬───────────┘
                      ▼
PHASE 2: CORE TRACKING (Sprint 2)
S07.3.1 (Habit Create) ──► S07.3.2 (Habit Log) ──► S07.3.3 (Habit Correlations)
                                                           │
S07.2.1 (Journal Prompts) ──► S07.2.2 (Journal Entry) ──► S07.2.3 (AI Personalization)
                                        │                          │
                                        └──────────┬───────────────┘
                                                   ▼
PHASE 3: INTELLIGENCE (Sprint 3)
S07.5.1 (Stress Self-Report) ──┬──► S07.5.2 (Multi-Signal)
                               │              │
S07.2.2 (Journal Entry) ───────┘              ▼
                                       S07.5.3 (Alerts)
                                              │
                                              ▼
PHASE 4: ENHANCEMENT (Sprint 4)
S07.6.1 (Goals) ──► S07.6.2 (Routines) ──► S07.6.3 (Routine Analytics)
S07.7.1 (Practice Library) ──► S07.7.2 (AI Recommendations)
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| F7.1: Mood Check-ins | S07.1.1, S07.1.2 | 100% |
| F7.2: Daily Journaling | S07.2.1, S07.2.2, S07.2.3 | 100% |
| F7.3: Habit Tracking | S07.3.1, S07.3.2, S07.3.3 | 100% |
| F7.4: Energy Level Monitoring | S07.4.1, S07.4.2 | 100% |
| F7.5: Stress Pattern Detection | S07.5.1, S07.5.2, S07.5.3 | 100% |
| F7.6: Wellbeing Goals & Routines | S07.6.1, S07.6.2, S07.6.3 | 100% |
| F7.7: Mindfulness Recommendations | S07.7.1, S07.7.2 | 100% |

**Completeness Verification:** All 7 features mapped to 18 stories with 100% coverage.

---

## Implementation Phases

| Phase | Sprint | Stories | Deliverable |
|-------|--------|---------|-------------|
| 1: Foundation | Sprint 1 | S07.1.1, S07.1.2, S07.4.1, S07.4.2 | Mood and energy tracking operational |
| 2: Core Tracking | Sprint 2 | S07.3.1-3.3, S07.2.1-2.3 | Habit tracking and journaling system |
| 3: Intelligence | Sprint 3 | S07.5.1-5.3 | Multi-signal stress detection engine |
| 4: Enhancement | Sprint 4 | S07.6.1-6.3, S07.7.1-7.2 | Goals, routines, and mindfulness recommendations |

---

## Cross-Epic Dependencies

| Story | Depends On | Dependency Type | Status |
|-------|------------|-----------------|--------|
| S07.1.2 (Mood Patterns) | E5 (Sleep), E6 (Meals) | Cross-pillar correlations | Awaiting E8 |
| S07.2.3 (AI Personalization) | E5 (Sleep, Workouts) | Context for prompts | Awaiting E8 |
| S07.3.3 (Habit Correlations) | E5 (Sleep, Activity), E6 (Meals) | Habit-health correlations | Awaiting E8 |
| S07.4.2 (Energy Patterns) | E5 (Sleep), E6 (Meals) | Energy correlation engine | Awaiting E8 |
| S07.5.2 (Multi-Signal) | E9 (Wearable HRV/RHR) | Biometric stress signals | Awaiting E9 |
| S07.5.3 (Stress Alerts) | E2, E3 | Delivery via Voice/WhatsApp | E2, E3 Complete |
| All Display Stories | E4 | Mobile App UI components | E4 Complete |

**Feeds To:**
- **E5 (Fitness):** Mood, stress, energy, journaling → Mental Recovery Score (30% weight)
- **E8 (Cross-Domain Intelligence):** All wellbeing data for insights engine

---

## Competitive Advantage Summary

Epic 07 establishes yHealth's Daily Wellbeing Pillar with three critical differentiators that no competitor offers:

1. **Daily Wellbeing as Equal Pillar:** While WHOOP and BEVEL treat mental health as an afterthought (monthly surveys), yHealth treats Daily Wellbeing as an EQUAL pillar alongside Fitness and Nutrition with real-time tracking and cross-pillar correlations.

2. **Multi-Signal Stress Detection:** The ONLY platform combining self-reported stress ratings + biometric signals (HRV, RHR) + text sentiment analysis from journaling + app usage patterns for comprehensive stress awareness without requiring users to consciously report.

3. **Dual Recovery Score (Mental Component):** yHealth uniquely contributes mood, stress, energy, and journaling data to the Mental Recovery Score, enabling predictions like "Tomorrow's workout may suffer due to high stress today" - insights competitors cannot provide.

---

*Epic 07 Stories Index | yHealth Platform | Created: 2025-12-24*
