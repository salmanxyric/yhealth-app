# Epic 06: Nutrition Pillar - User Stories

> **Epic:** E06 - Nutrition Pillar
> **Source:** `prd-epics/PRD-Epic-06-Nutrition-Pillar.md`
> **Created:** 2025-12-10
> **Stories:** 18 (18 Must Have)
> **Workflow:** EXPERT-13 Story Generator v3.0

---

## Story Index

| Story ID | File | Title | Feature | Priority | Status |
|----------|------|-------|---------|----------|--------|
| S06.0.1 | [S06-01-food-database-infrastructure.md](S06-01-food-database-infrastructure.md) | Food Database & API Integration Infrastructure | Technical | P0 (Must) | Draft |
| S06.1.1 | [S06-02-photo-ai-meal-recognition.md](S06-02-photo-ai-meal-recognition.md) | Photo AI Meal Recognition | F6.1 | P0 (Must) | Draft |
| S06.1.2 | [S06-03-barcode-manual-search.md](S06-03-barcode-manual-search.md) | Barcode Scanning & Manual Search | F6.1 | P0 (Must) | Draft |
| S06.1.3 | [S06-04-voice-whatsapp-logging.md](S06-04-voice-whatsapp-logging.md) | Voice & WhatsApp Meal Logging | F6.1 | P0 (Must) | Draft |
| S06.2.1 | [S06-05-calorie-macro-dashboard.md](S06-05-calorie-macro-dashboard.md) | Real-Time Calorie & Macro Dashboard | F6.2 | P0 (Must) | Draft |
| S06.2.2 | [S06-06-personalized-targets.md](S06-06-personalized-targets.md) | Personalized Targets & Dynamic Adjustment | F6.2 | P0 (Must) | Draft |
| S06.3.1 | [S06-07-hydration-logging.md](S06-07-hydration-logging.md) | Hydration Logging & Progress Tracking | F6.3 | P0 (Must) | Draft |
| S06.3.2 | [S06-08-smart-hydration-reminders.md](S06-08-smart-hydration-reminders.md) | Smart Hydration Reminders & Score | F6.3 | P0 (Must) | Draft |
| S06.4.1 | [S06-09-nutrition-goal-setting.md](S06-09-nutrition-goal-setting.md) | Nutrition Goal Setting & Templates | F6.4 | P0 (Must) | Draft |
| S06.4.2 | [S06-10-ai-meal-plan-generation.md](S06-10-ai-meal-plan-generation.md) | AI Meal Plan Generation | F6.4 | P0 (Must) | Draft |
| S06.4.3 | [S06-11-meal-plan-progress.md](S06-11-meal-plan-progress.md) | Meal Plan Interaction & Progress Tracking | F6.4 | P0 (Must) | Draft |
| S06.5.1 | [S06-12-realtime-nutrition-guidance.md](S06-12-realtime-nutrition-guidance.md) | Real-Time Nutrition Guidance | F6.5 | P0 (Must) | Draft |
| S06.5.2 | [S06-13-nutrition-qa.md](S06-13-nutrition-qa.md) | Nutrition Q&A & Personalized Answers | F6.5 | P0 (Must) | Draft |
| S06.5.3 | [S06-14-proactive-interventions.md](S06-14-proactive-interventions.md) | Proactive Pattern Interventions | F6.5 | P0 (Must) | Draft |
| S06.5.4 | [S06-15-educational-content.md](S06-15-educational-content.md) | Educational Content Delivery | F6.5 | P0 (Must) | Draft |
| S06.6.1 | [S06-16-custom-food-recipes.md](S06-16-custom-food-recipes.md) | Custom Food & Recipe Builder | F6.6 | P0 (Must) | Draft |
| S06.6.2 | [S06-17-emotional-eating-detection.md](S06-17-emotional-eating-detection.md) | Emotional Eating Detection & Tagging | F6.6 | P0 (Must) | Draft |
| S06.6.3 | [S06-18-emotional-eating-reports.md](S06-18-emotional-eating-reports.md) | Behavioral Analysis & Emotional Eating Reports | F6.6 | P0 (Must) | Draft |

---

## Dependency Diagram

```
PHASE 1: FOUNDATION (Sprint 1)
S06.0.1 (Food DB/API Infra) ──┬──► S06.1.1 (Photo AI)
                              │
                              ├──► S06.1.2 (Barcode/Manual)
                              │
                              └──► S06.6.1 (Custom Food/Recipes)

PHASE 2: CORE TRACKING (Sprint 1-2)
S06.1.1 + S06.1.2 ──► S06.1.3 (Voice/WhatsApp Logging)
         │
         ├──► S06.2.1 (Macro Dashboard) ──► S06.2.2 (Personalized Targets)
         │                                         │
         │                                         ▼
         └──► S06.3.1 (Hydration Logging) ──► S06.3.2 (Smart Reminders)

PHASE 3: INTELLIGENCE (Sprint 2-3)
S06.2.2 ──► S06.4.1 (Goal Setting) ──► S06.4.2 (AI Meal Plans) ──► S06.4.3 (Plan Progress)
                                               │
S06.2.1 + S06.4.1 ──► S06.5.1 (Real-Time Guidance)
                              │
                              ├──► S06.5.2 (Q&A)
                              │
                              └──► S06.5.3 (Pattern Interventions) ──► S06.5.4 (Education)

PHASE 4: ENHANCEMENT (Sprint 3-4)
S06.5.3 + E7 (Wellbeing) ──► S06.6.2 (Emotional Tagging) ──► S06.6.3 (Emotional Eating Reports)
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| Technical Setup | S06.0.1 | 100% |
| F6.1: Meal Logging (Multi-Modal Input) | S06.1.1, S06.1.2, S06.1.3 | 100% |
| F6.2: Calorie & Macro Tracking | S06.2.1, S06.2.2 | 100% |
| F6.3: Hydration Tracking | S06.3.1, S06.3.2 | 100% |
| F6.4: Nutrition Goals & Plans | S06.4.1, S06.4.2, S06.4.3 | 100% |
| F6.5: AI Nutrition Coaching | S06.5.1, S06.5.2, S06.5.3, S06.5.4 | 100% |
| F6.6: Food Database & Emotional Eating | S06.6.1, S06.6.2, S06.6.3 | 100% |

**Completeness Verification:** All 6 features + technical setup mapped to 18 stories with 100% coverage.

---

## Implementation Phases

| Phase | Sprint | Stories | Deliverable |
|-------|--------|---------|-------------|
| 1: Foundation | Sprint 1 | S06.0.1, S06.1.1, S06.1.2 | Food database operational, Photo AI + Barcode scanning functional |
| 2: Core Tracking | Sprint 1-2 | S06.1.3, S06.2.1, S06.2.2, S06.3.1, S06.3.2 | All logging methods, macro dashboard, hydration tracking |
| 3: Intelligence | Sprint 2-3 | S06.4.1-4.3, S06.5.1-5.4 | Goal system, AI meal plans, coaching capabilities |
| 4: Enhancement | Sprint 3-4 | S06.6.1, S06.6.2, S06.6.3 | Custom foods, emotional eating integration |

---

## Cross-Epic Dependencies

| Story | Depends On | Dependency Type | Status |
|-------|------------|-----------------|--------|
| S06.0.1 (Food DB Infra) | E9 | Nutritionix API configuration | Awaiting E9 |
| S06.1.1, S06.2.2 | E5 | Activity level for calorie adjustment | E5 Complete |
| S06.1.3 (Voice/WhatsApp) | E2, E3 | Voice Coaching, WhatsApp integration | E2, E3 Complete |
| S06.5.* (AI Coaching) | E8 | Cross-Domain Intelligence patterns | Awaiting E8 |
| S06.6.2, S06.6.3 (Emotional) | E7 | Wellbeing Pillar mood/stress data | Awaiting E7 |
| All Display Stories | E4 | Mobile App UI components | E4 Complete |

---

## Competitive Advantage Summary

Epic 06 establishes yHealth's Nutrition Pillar with three critical differentiators that no competitor offers:

1. **Multi-Modal Logging (4 methods):** While MyFitnessPal focuses on barcode/manual and newer apps add photo AI, yHealth uniquely combines Photo AI + Barcode + Manual + Voice across all channels (App, WhatsApp, Voice Coaching). This targets the 37% who abandon due to logging friction.

2. **Emotional Eating Integration:** Unlike Noom's psychology focus or standalone apps like Bea, yHealth deeply integrates emotional eating detection with the Wellbeing Pillar (E7). Mood, stress, and journaling data automatically correlate with meal patterns to reveal "When you're stressed, you eat 40% more snacks" insights without manual tagging.

3. **Cross-Pillar Nutrition Intelligence:** Beyond calorie counting, yHealth connects nutrition to fitness performance ("Protein-rich breakfasts correlate with 15% higher workout intensity") and wellbeing ("Low fiber days correlate with poor sleep quality") - insights impossible without the three-pillar architecture.

Combined with <30 second Light mode logging, regional food databases (Pakistani, Middle Eastern cuisines), and non-judgmental AI coaching, yHealth delivers a nutrition experience that is both faster and more holistic than any competitor.
