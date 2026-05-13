# Epic 05: Fitness Pillar - Stories Index

> **Epic:** E05 - Fitness Pillar
> **Source:** `prd-epics/PRD-Epic-05-Fitness-Pillar.md`
> **Created:** 2025-12-09
> **Stories:** 16 (16 Must Have)
> **Workflow:** EXPERT-13 Story Generator v3.0

---

## Story Index

| Story ID | Title | Feature | Priority | Status | File |
|----------|-------|---------|----------|--------|------|
| S05.0.1 | Wearable Integration Infrastructure | Technical | P0 (Must) | Draft | [S05-01-wearable-integration-infrastructure.md](S05-01-wearable-integration-infrastructure.md) |
| S05.1.1 | Activity Wearable Sync | F5.1 | P0 (Must) | Draft | [S05-02-activity-wearable-sync.md](S05-02-activity-wearable-sync.md) |
| S05.1.2 | Activity Manual Logging & Timeline | F5.1 | P0 (Must) | Draft | [S05-03-activity-manual-logging.md](S05-03-activity-manual-logging.md) |
| S05.2.1 | Sleep Core Metrics & Stage Tracking | F5.2 | P0 (Must) | Draft | [S05-04-sleep-core-metrics.md](S05-04-sleep-core-metrics.md) |
| S05.2.2 | Sleep Cross-Pillar Insights | F5.2 | P0 (Must) | Draft | [S05-05-sleep-cross-pillar-insights.md](S05-05-sleep-cross-pillar-insights.md) |
| S05.3.1 | Dual Recovery Score Engine | F5.3 | P0 (Must) | Draft | [S05-06-dual-recovery-score.md](S05-06-dual-recovery-score.md) |
| S05.3.2 | Recovery-Based Recommendations | F5.3 | P0 (Must) | Draft | [S05-07-recovery-recommendations.md](S05-07-recovery-recommendations.md) |
| S05.3.3 | Recovery Alerts & Historical Trends | F5.3 | P0 (Must) | Draft | [S05-08-recovery-alerts.md](S05-08-recovery-alerts.md) |
| S05.4.1 | Goal Creation & AI Suggestions | F5.4 | P0 (Must) | Draft | [S05-09-goal-creation.md](S05-09-goal-creation.md) |
| S05.4.2 | Goal Progress Tracking | F5.4 | P0 (Must) | Draft | [S05-10-goal-progress.md](S05-10-goal-progress.md) |
| S05.5.1 | Workout Recommendation Engine | F5.5 | P0 (Must) | Draft | [S05-11-workout-recommendation-engine.md](S05-11-workout-recommendation-engine.md) |
| S05.5.2 | Exercise Library & Workout Plans | F5.5 | P0 (Must) | Draft | [S05-12-exercise-library.md](S05-12-exercise-library.md) |
| S05.5.3 | Workout Feedback & Progressive Overload | F5.5 | P0 (Must) | Draft | [S05-13-workout-feedback.md](S05-13-workout-feedback.md) |
| S05.6.1 | yHealth Strain Score Calculation | F5.6 | P0 (Must) | Draft | [S05-14-strain-score-calculation.md](S05-14-strain-score-calculation.md) |
| S05.6.2 | Strain-Recovery Balance | F5.6 | P0 (Must) | Draft | [S05-15-strain-recovery-balance.md](S05-15-strain-recovery-balance.md) |
| S05.6.3 | Strain Alerts & Weekly Analysis | F5.6 | P0 (Must) | Draft | [S05-16-strain-alerts.md](S05-16-strain-alerts.md) |

---

## Dependency Diagram

```
PHASE 1: FOUNDATION (Sprint 1)
S05.0.1 (Wearable Infra) ──┬──► S05.1.1 (Activity Sync)
                           │
                           └──► S05.2.1 (Sleep Core)
                                      │
                                      ▼
PHASE 2: CORE TRACKING (Sprint 2)
S05.1.1 ──► S05.1.2 (Activity Manual/Timeline)
         │
S05.2.1 ──► S05.2.2 (Sleep Insights) ◄─────────── E7 (Wellbeing)
         │
         └──► S05.4.1 (Goal Creation) ──► S05.4.2 (Progress)
                                                │
                                                ▼
PHASE 3: INTELLIGENCE (Sprint 3-4)
S05.2.1 + E7 ──► S05.3.1 (Dual Recovery) ──► S05.3.2 (Recommendations) ──► S05.3.3 (Alerts)
                        │
S05.1.1 ──► S05.6.1 (Strain Calc) ──► S05.6.2 (Balance) ──► S05.6.3 (Strain Alerts)
                        │                    │
                        └────────────────────┘
                                    │
                                    ▼
PHASE 4: OPTIMIZATION (Sprint 5)
S05.3.* + S05.4.* + S05.6.* ──► S05.5.1 (Workout Engine) ──► S05.5.2 (Library) ──► S05.5.3 (Feedback)
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| Technical Setup | S05.0.1 | 100% |
| F5.1: Activity Tracking | S05.1.1, S05.1.2 | 100% |
| F5.2: Sleep Tracking & Analysis | S05.2.1, S05.2.2 | 100% |
| F5.3: Recovery Monitoring | S05.3.1, S05.3.2, S05.3.3 | 100% |
| F5.4: Fitness Goal Setting & Progress | S05.4.1, S05.4.2 | 100% |
| F5.5: Workout Recommendations | S05.5.1, S05.5.2, S05.5.3 | 100% |
| F5.6: Strain/Load Management | S05.6.1, S05.6.2, S05.6.3 | 100% |

**Completeness Verification:** All 6 features + technical setup mapped to 16 stories with 100% coverage.

---

## Implementation Phases

| Phase | Sprint | Stories | Deliverable |
|-------|--------|---------|-------------|
| 1: Foundation | Sprint 1 | S05.0.1, S05.1.1, S05.2.1 | Wearable sync operational, basic activity/sleep tracking |
| 2: Core Tracking | Sprint 2 | S05.1.2, S05.2.2, S05.4.1, S05.4.2 | Manual logging, sleep insights, goal system |
| 3: Intelligence | Sprint 3-4 | S05.3.1-3.3, S05.6.1-6.3 | Dual Recovery Score, yHealth Strain Score, all alerts |
| 4: Optimization | Sprint 5 | S05.5.1-5.3 | AI workout recommendations, exercise library |

---

## Cross-Epic Dependencies

| Story | Depends On | Dependency Type | Status |
|-------|------------|-----------------|--------|
| S05.0.1 (Wearable Infra) | E09 | Detailed wearable OAuth flows | Awaiting E9 |
| S05.2.2 (Sleep Insights) | E7 | Mood, energy data for correlations | Awaiting E7 |
| S05.3.1 (Dual Recovery) | E7 | Mood, stress, energy, journaling | Awaiting E7 |
| S05.3.2 (Recommendations) | E2, E3 | Voice/WhatsApp coaching channels | E2, E3 Complete |
| S05.4.2 (Progress) | E8 | Cross-domain goal analysis | Awaiting E8 |
| S05.5.1 (Workout Engine) | E7 | Stress, energy for workout personalization | Awaiting E7 |

---

## Migration Notes

**Original File:** `Epic-05-Stories.md` (consolidated format)
**Migrated:** 2025-12-24
**Migration Method:** Individual story files with YAML frontmatter
**Story Count:** 16 stories (S05.0.1 through S05.6.3)

All stories preserved in git history. Original consolidated file can be removed after verification.
