# yHealth Platform - Missing Features

> **Purpose**: Requirements documented in PRD/Epic stories but NOT yet implemented in code
> **Last Updated**: 2026-04-22
> **Source**: Cross-reference of `prd-epics/`, `stories/`, and `PRODUCTS/yhealth-app/` codebase
> **Related**: [PROGRESS.md](./PROGRESS.md) | [PROGRESS-DEV.md](./PROGRESS-DEV.md) | [Audit](./yhealth_result.md) | [Reviews](./reviews/)

---

## Summary

| Epic | Missing Features | Severity |
|------|-----------------|----------|
| E01 | 2 | P0 (AI stubs only) |
| E02 | 1 | P1 (outbound PSTN) |
| E03 | 14+ | 🚫 Deferred (entire epic) |
| E04 | 1 | P2 (PWA only — web-push done P48) |
| E05 | 2 | P2 (AI adaptation depth) |
| E06 | 2 | P2 (Nutritionix + barcode) |
| E07 | 1 | P2 (AI sleep deep analysis) |
| E08 | 0 | ✅ Ahead of docs (stories pending) |
| E09 | 4 | P2 (non-WHOOP/Spotify/GCal providers) |
| E10 | 2 | P3 (cohort + A/B) |

---

## E01: Onboarding & Assessment

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| AI-Powered Plan Generation | S01.2.x | ✅ Done | P35 Life Goals decomposition + Gemini/Claude plan generation are live. Original controller stub still present at `plan.controller.ts:1114` but downstream LangGraph path supersedes it — scheduled for stub removal. |
| AI Goal Suggestions | S01.1.x | ✅ Done | Life-goals AI suggestions (P35 `goal-decomposition.service.ts`) and onboarding AI (`onboarding-ai.service.ts`, 1,752 lines) cover this. Legacy stub at `assessment.controller.ts:516` pending cleanup. |
| AI Deep Assessment Analysis | S01.1.x | 🟡 Stub | `assessment.controller.ts:367,412` — placeholder conversation + insights extraction. LangGraph wiring pending. |
| Assessment Persistence | — | ✅ Done | Tables 07–08; full responses + scoring |
| Integration Discovery & OAuth Selection | S01.9–10 | ✅ Done | WHOOP + Spotify + Google Calendar OAuth (P47) |
| Plan Generation Engine | S01.14 | ✅ Done | `plan.controller.ts` + LangGraph plan tool |
| Plan Presentation & Adjustment | S01.15 | ✅ Done | `/plans/[id]` page + reschedule workflow |

---

## E02: Voice Coaching

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| User-Initiated Voice Calls | S02.01 | ✅ Done | P8 |
| AI-Initiated Proactive Calls | S02.02 | ✅ Done | `checkin-call.job.ts` + proactive messaging routing |
| Scheduled Coaching Sessions | S02.03 | ✅ Done | `voice-schedule.service.ts` |
| Voice Conversation Engine | S02.04 | ✅ Done | WebRTC + LangGraph + ElevenLabs/Google TTS |
| Context Memory | S02.05 | ✅ Done | Life-history embeddings (P33) + comprehensive context |
| Real-time Transcription | S02.06 | ✅ Done | AssemblyAI |
| Emotion Detection | S02.07–09 | ✅ Done | Camera + text + audio emotion; crisis detection |
| Quick Check-in Sessions | S02.10 | ✅ Done | QuickCheckInFlow |
| Emergency Support Session | S02.11 | ✅ Done | EmergencySessionFlow + mental-health guardrails (P47) |
| Goal Review Session | S02.12 | ✅ Done | GoalReviewFlow |
| Summary Generation & Delivery | S02.13–14 | ✅ Done | `call-summary.service.ts` + `summary-delivery.service.ts` |
| Voice Schedule Customization | S02.15 | ✅ Done | VoiceCustomizationPanel |
| Accessibility Preferences | S02.16 | ✅ Done | P29 modal responsiveness + screen-reader support |
| **Outbound PSTN Calling** | — | ❌ Not Started | `sms.service.ts:68` has literal `// TODO: Integrate with Twilio`. All Twilio env vars declared but no SDK calls. **P1** |

---

## E03: WhatsApp Integration (DEFERRED)

**Entire epic deferred** — web-first focus, WhatsApp Business API not needed for current product direction. Residual `whatsapp-voice-command.service.ts` (141 lines) should be deleted or re-scoped.

| Feature | Story | Status |
|---------|-------|--------|
| WhatsApp Business API Setup | S03.0.1 | 🚫 Deferred |
| Message Templates | S03.1.x | 🚫 Deferred |
| Group Coaching via WhatsApp | S03.2.x | 🚫 Deferred |
| WhatsApp Onboarding Flow | S03.3.x | 🚫 Deferred |
| Rich Media Messages | S03.4.x | 🚫 Deferred |
| WhatsApp Notifications | S03.5.x | 🚫 Deferred |
| SMS Verification | S01.1.3 | 🚫 Deferred |

---

## E04: Mobile App (Web Pivot)

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| Dashboard & Navigation | S04.01–05 | ✅ Done | 8-tab dashboard + bottom nav + channel switching |
| Charts & Visualizations | S04.06–08 | ✅ Done | Recharts + d3 + chart.js + Premium Circular Metrics (P38) |
| Notification Infrastructure | S04.09–11 | ✅ Done | P36 Notification Engine + Web Push (P47) + Desktop Notifications / DesktopNotificationPrompt + NotificationSocketBridge (P48) |
| Accessibility | S04.18–20 | ✅ Done | Radix UI + keyboard nav + focus trap (P19) |
| Settings & Preferences | S04.16–17 | ✅ Done | Settings page + Preferences page + Privacy controls |
| **PWA / Offline Mode** | S04.x | ❌ Not Started | No service worker, no offline caching. **P2** |
| Web Push + Desktop Notification Opt-in | S04.x | ✅ Done | VAPID (P47) + DesktopNotificationPrompt opt-in UI + NotificationSocketBridge (P48) complete the stack. |

---

## E05: Fitness Pillar

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| Wearable Integration | S05.01–02 | ✅ Done | WHOOP + Spotify activity signals |
| Activity Logging | S05.03 | ✅ Done | `activity-ingestion.service.ts` + events |
| Sleep Metrics | S05.04–05 | ✅ Done | WHOOP sleep + cross-pillar insights |
| Dual Recovery Score | S05.06 | ✅ Done | Physical (WHOOP) + Mental Recovery (P8) |
| Recovery Recommendations & Alerts | S05.07–08 | ✅ Done | Basic done |
| Goal Creation & Progress | S05.09–10 | ✅ Done | Life goals + daily check-ins |
| Workout Recommendation Engine | S05.11 | ✅ Done | LangGraph workout manager |
| Exercise Library | S05.12 | ✅ Done | 400+ exercises + admin CRUD (P20) |
| Workout Feedback | S05.13 | ✅ Done | Execution drawer + history (P21) |
| Strain Score & Balance | S05.14–15 | ✅ Done | `whoop-stress.service.ts` + analytics |
| Strain Alerts | S05.16 | ✅ Done | Proactive messaging integration |
| **AI Workout Adaptation (deep personalization)** | S05.x | 🟡 Partial | Basic plans exist; cross-session progressive-overload AI pending. **P2** |
| **Personalized Recovery Protocols** | S05.x | 🟡 Partial | Generic recovery recommendations; personalized protocols pending. **P2** |

---

## E06: Nutrition Pillar

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| Food Database | S06.01 | ✅ Done | ~400+ items, Indian/South-Asian matching (P28) |
| Photo AI Meal Recognition | S06.02 | ✅ Done | Dish-level identification + 10 rules (P38) |
| Manual Search | S06.03 | ✅ Done | Search in client |
| Voice / Chat Logging | S06.04 | ✅ Done | LangGraph meal manager + intelligent extraction (P41) |
| Calorie & Macro Dashboard | S06.05 | ✅ Done | Dashboard + UnifiedHealthDashboard (P38) |
| Personalized Targets | S06.06 | ✅ Done | `adaptive-calorie.service.ts` |
| Hydration Logging & Reminders | S06.07–08 | ✅ Done | `water-intake.service.ts` |
| Nutrition Goal Setting | S06.09 | ✅ Done | Life goals + nutrition-user-preferences |
| AI Meal Plan Generation | S06.10 | ✅ Done | Diet-plans routes + LLM |
| Meal Plan Progress | S06.11 | ✅ Done | MealHistoryTab + progress tracking |
| Realtime Nutrition Guidance | S06.12 | ✅ Done | Auto-logging from chat messages (P41) |
| Nutrition Q&A | S06.13 | ✅ Done | LangGraph meal manager |
| Proactive Interventions | S06.14 | ✅ Done | Data-gap meals/water proactive messages (P41) |
| Educational Content | S06.15 | ✅ Done | Blog system + help articles |
| Custom Food & Recipes | S06.16 | ✅ Done | Recipes table 27 |
| Emotional Eating Detection | S06.17–18 | ✅ Done | `nutrition-learning.service.ts` patterns |
| **Nutritionix External API** | S06.0.1 | ❌ Not Connected | Local DB covers MVP; external API for broader catalog pending. **P2** |
| **Barcode / UPC Scanning** | S06.x | ❌ Not Started | Camera scan for packaged foods. **P2** |

--- 

## E07: Wellbeing Pillar

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| Mood / Energy / Stress Tracking | S07.01–12 | ✅ Done | P15 + P30 + expanded 13 emojis + arc timeline + behavioral patterns |
| Habit Creation & Tracking | S07.05–07 | ✅ Done | HabitDashboard + habit_logs |
| Journaling | S07.08–10 | ✅ Done | Entry form + AI prompts + voice journal (P31) + Mind Constellation |
| Self-Report Stress | S07.11 | ✅ Done | StressCheckIn |
| Multi-Signal Stress Detection | S07.12 | ✅ Done | Multi-source: WHOOP + calendar + journal + self-report |
| Stress Alerts & Interventions | S07.13 | ✅ Done | `stress-reminder.job.ts` + crisis detection |
| Wellbeing Goals & Routines | S07.14–16 | ✅ Done | Routines + completions + daily schedules |
| Schedule Workflow Builder | S07.x | ✅ Done | P48 — ScheduleWorkflow node-graph UI + WorkflowNode component + service layer + time-conflict helper + schedule-item source migration |
| Mindfulness Library | S07.17 | ✅ Done | MindfulnessRecommendation + yoga + meditation (P32) |
| Context-Aware Recommendations | S07.18 | ✅ Done | WellbeingContextService + question engine |
| **Advanced AI Wellbeing Protocols** | S07.x | 🟡 Partial | Basic recommendations live; deep AI-personalized protocols (e.g., anxiety-specific micro-protocols) pending. **P2** |

---

## E08: Cross-Domain Intelligence

**✅ Ahead of docs** — implementation (P31) is complete. Stories still need generation (NS-002).

Implemented:
- Contradiction detection (22 rules across 6 pillars)
- Health correlations (6 SQL detectors)
- Best Day Formula + daily achievement score
- Prediction accuracy tracking
- Weekly aggregated reports (LLM narrative)
- Voice journaling end-to-end
- Theme detection (15 tags)
- LLM model factory (4-provider cascade: Gemini → Anthropic → DeepSeek → OpenAI)
- Intelligence Tab (5 sub-tabs) + 4 overview widgets
- Cross-domain correlator (P47) with data sources (Spotify/Calendar/Prayer/Finance)

**Action needed:** Generate E08 stories to document what's already built (NS-002).

---

## E09: Data Integrations

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| WHOOP | — | ✅ Done | OAuth+PKCE + webhooks + analytics + stress derivation |
| Spotify | — | ✅ Done | PKCE + Jamendo fallback + listening history (P47) |
| Google Calendar | — | ✅ Done | Per-user OAuth, multi-calendar sync (P47) |
| Prayer Times | — | ✅ Done | `prayer-times.service.ts` + table 124 |
| Holiday Calendar | — | ✅ Done | `holiday-calendar.service.ts` + table 119 |
| Finance Data Source | — | ✅ Done | `finance-tracking.service.ts` + table 125 |
| YouTube (tutorials) | — | ✅ Done | 24h cache + nocookie embeds |
| **Fitbit Full Sync** | S09.x | 🟡 Partial | OAuth started; full data sync incomplete. **P2** |
| **Apple Health (HealthKit)** | S09.x | ❌ Not Started | **P2** |
| **Garmin Connect** | S09.x | ❌ Not Started | **P2** |
| **Oura Ring** | S09.x | ❌ Not Started | **P2** |

---

## E10: Analytics Dashboard

| Feature | Story | Status | Notes |
|---------|-------|--------|-------|
| 8-Tab Dashboard | — | ✅ Done | Overview, Activity, Goals, Achievements, Notifications, Profile, Preferences, Settings |
| Intelligence Tab (5 sub-tabs) | — | ✅ Done | Insights, Correlations, Predictions, Reports, Health Score (P31) |
| Overview Widgets | — | ✅ Done | HealthScoreHero, BestDayProgress, PredictionsCard, ContradictionsBanner (P31) + Life Areas + Smart Timing + Proactive Coach (P47) |
| Analytics & Reporting Views | — | ✅ Done | AnalyticsTab + ReportingTab + ScoringTab |
| Admin Analytics | — | ✅ Done | `admin-analytics.service.ts` + routes |
| Leaderboard & Scoring | — | ✅ Done | Dual-track competitions + daily scoring job + snapshots |
| Chart Library | — | ✅ Done | Recharts + chart.js + d3 + Premium Circular Metrics (P38) |
| **Predictive Health Models (advanced ML)** | S10.x | 🟡 Partial | P31 basic predictions live; deep ML models pending. **P3** |
| **Cohort Analysis / Benchmarking** | S10.x | ❌ Not Started | **P3** |
| **A/B Testing Dashboard** | S10.x | ❌ Not Started | **P3** |

---

## Cross-Cutting Missing Features

| Feature | Source | Status | Notes |
|---------|--------|--------|-------|
| Subscription Paywall Enforcement | PRD / Monetization | ✅ Done (P48+P49) | P48: entitlement plumbing (service, credit service, context, gates, stores, seed plans). P49: `entitlement.middleware.ts` (requireTier/requireFeature/requireCredits) wired on ai-coach, journal, rag-chatbot, transcription, TTS, voice-calls, emotional-checkin, call-summaries routes. Shadow→enforce rollout modes. Billing UI: CheckoutButton, PlanComparisonTable, CreditLedgerTable, CancelSubscriptionDialog, LockedFeatureScreen, /upgrade, /settings/billing pages. Admin: 6 subscription sub-pages + abuse detection. Stripe webhook service. Grace expiration job. Full credit ledger with promo codes. |
| **Hardcoded AssemblyAI API key** | Security | ❌ Must Fix | `assemblyai.service.ts:10`. **P0 — rotate & purge.** |
| **JWT/Session default secrets** | Security |  ✅ Done Must Fix | `env.config.ts:64-65` fallback strings; dev insecure. **P0** |
| **Duplicate migration filenames** | Infra |  ✅ Done | `113-*.sql`, `116-*.sql`, `27-*.sql`, `30-*.sql` duplicates. **P0** |
| **Auto-migrate race at boot** | Infra |  ✅ Done | No advisory lock; multi-pod risk. **P0** |
| **Web + Worker split** | Infra | ❌ Must Fix | 34 jobs share HTTP process. **P0** |
| **APM / Error Tracking (Sentry etc.)** | Ops | ❌ Not Started | **P0** |
| **OpenAPI / Swagger Spec** | Docs | ❌ Not Started | 92 route files undocumented. **P1** |
| **HIPAA-grade PHI Audit Log** | Compliance | ❌ Not Started | App collects mental-health data; no access log. **P1** |
| **PHI Field-Level Encryption** | Compliance | ❌ Not Started | **P1** |
| **GDPR Data Export / Deletion** | PRD | ❌ Not Started | **P1** |
| **Email Verification on Signup** | PRD |  ✅ Done  | **P1** |
| **Two-Factor Authentication** | PRD | ❌ Not Started | **P1** |
| **Multi-language Support (i18n)** | PRD | 🟡 Partial | English/Urdu only, no i18n framework. **P2** |
| **Referral System / Viral Loop** | Growth | ❌ Not Started | **P1 revenue lever** |
| **Automated Dunning / Refund** | Billing | ❌ Not Started | **P1** |
| **Content Moderation for Group Chats** | Trust & Safety |  ✅ Done | **P1** |
| **Incident Response Runbook** | Ops | ❌ Not Started | **P0 for launch** |
| **Backup / DR Plan** | Ops | ❌ Not Started | **P0 for launch** |
| **Load Testing Baseline (10k concurrent)** | Ops | ❌ Not Started | **P1** |
| **WCAG 2.2 AA Full Audit** | Accessibility | 🟡 Partial | Radix + keyboard nav present; full audit pending. **P1** |

---

## 2026-04-07 Founder Review — Outstanding Items

From [`reviews/2026-04-07-feature-review-hamza-salman.md`](./reviews/2026-04-07-feature-review-hamza-salman.md).

**Confirmed ✅ Done (tracked in PROGRESS-DEV.md):**
- Streak System (P45)
- Status Awareness AI (P45)
- Social Accountability (P45)
- Accountability Contracts (P45)
- Accountability Buddy Matching (P45)
- Google Calendar Integration (P47 — OAuth + multi-calendar sync)
- Coach Persona / Personality Modes (P47)
- Push Notifications (P47)
- Obstacle Detection scaffolding (P47)
- Goal Reconnection engine (P47)
- Timing Profile (P47)
- Life Areas / Universal Scope (P47)
- Mental Health Guardrails (P47 — `mental-health-guardrail.service.ts` + screening events table)
- Life Goals Ecosystem — 13 categories including career/finance/relationships (P35)

**Still outstanding:**

| Feature | Source | Status | Notes |
|---------|--------|--------|-------|
| Friction Reduction Check-ins | Review §1 | ❌ Not Started | "2-min check-in after 3 days absence" |
| AI-Generated Personalized Achievements (notification tie-in) | Review §3 | 🟡 Partial | `achievement-ai.service.ts` + `dynamic-achievements.service.ts` exist; push/email wiring pending |
| SOS Feature for Isolated Users | Review §5 | ❌ Not Started | Accountability infra ready, SOS escalation path missing |
| Goal-Similarity Shared Challenges (AI-created) | Review §7 | 🟡 Partial | `smart-competition.service.ts` + `shared-challenge.service.ts` live; AI-creation prompt chain pending |
| Spotify Mood Correlation | Review §8 | 🟡 Partial | `spotify-listening.service.ts` captures history; correlator wiring pending |
| Calendar Stress Correlation | Review §8 | 🟡 Partial | Calendar sync live; meeting-density → stress derivation pending |
| Prayer / Finance Signal Correlation | Review §8 | 🟡 Partial | Sources present in `data-source-manager.service.ts`; correlator ingestion pending |
| Career Follow-up Loops | Review §9 | 🟡 Partial | Life goals category exists; application/resume follow-up prompts pending |
| Relationship Commitment Follow-ups | Review §9 | 🟡 Partial | Category exists; recurring prompt logic pending |
| AI Outbound PSTN Calling | Review §10 | ❌ Not Started | Twilio TODO |
| Obstacle Root-Cause Diagnosis (AI prompts) | Review §12 | 🟡 Partial | `obstacle.service.ts` + detector job + `/obstacles` page live; "time / location / energy?" AI prompt logic pending |
| Silent Goal Revisit | Review §13 | 🟡 Partial | `goal-reconnection.service.ts` + job live; explicit 3-week-untouched revisit rule pending |
| Contextual-Timing Pattern Learning | Review §14 | 🟡 Partial | `timing-profile.service.ts` live; most-talkative-hour learning from conversation patterns pending |
| Clinical Depression Guardrails | Review §15 | 🟡 Partial | `mental-health-guardrail.service.ts` + lane classifier + screening events table live; clinical-vs-normal differentiation with pro-help escalation pending full clinical review |
| "Pillars as Infrastructure" Vision Reframe | Review — key reframe | ❌ Not Started | Update `Product-Vision.md` + `Product-Requirements-Document.md` to position coach as the product, pillars as sensors |

---

*Missing-Features.md | yHealth Platform*
*Created: 2026-03-10 · Last updated: 2026-04-22*
