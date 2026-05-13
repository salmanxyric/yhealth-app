# yHealth Platform - Next Steps Queue

> **Purpose**: Curated work queue for development and planning sessions
> **Owner**: Hamza
> **Last Updated**: 2026-05-05
> **Status**: Active
> **Context Documents**: [PROGRESS.md](./PROGRESS.md) | [PROGRESS-DEV.md](./PROGRESS-DEV.md)
> **Team**: See `PROJECTS/team.yaml` for team members

---

## QUICK START: Copy This Prompt

```markdown
# yHealth Development Session

## Session Context
I'm continuing development on the yHealth Platform - AI health coach.

**Reference This Document:** @PRODUCTS/yhealth-platform/NEXT-STEPS.md
**Reference Progress:** @PRODUCTS/yhealth-platform/PROGRESS.md
**Reference Dev Status:** @PRODUCTS/yhealth-platform/PROGRESS-DEV.md
**Reference PRD:** @PRODUCTS/yhealth-platform/Product-Requirements-Document.md

## Activate Claude Skills
[Skills listed in current work item's AI Context]

## Current Focus
[First In Progress item from queue below]

## Session Goal
Execute items in priority order, respecting dependencies.
```

---

## EXECUTION PROTOCOL

### Before Starting
- [ ] Read NEXT-STEPS.md fully
- [ ] Check PROGRESS.md for patterns/decisions
- [ ] Verify dependencies are met for current item
- [ ] Load referenced skills

### During Execution
- Work items in priority order
- Mark items "In Progress" when starting
- Capture decisions in PROGRESS.md
- Mark items "Done" when complete
- Add session notes to current item

### After Session
- [ ] Update item statuses in queue
- [ ] Move completed items to Archive
- [ ] Surface new items for Future Candidates
- [ ] Update PROGRESS.md with patterns/decisions
- [ ] Commit all changes

---

## NEXT STEPS QUEUE

> **Location**: Individual work item files in `./work-items/NS-XXX-name.md`
> **Template**: `FRAMEWORKS/templates/task-template.md`

### Currently In Progress

*No item currently in progress - select from Queued*

### Queued (Priority Order)

| ID | Title | Priority | Type | Blocked By | Link |
|----|-------|----------|------|------------|------|
| NS-010 | P0 Code Cleanup | P0 | Technical | - | [View](./work-items/NS-010-p0-code-cleanup.md) |
| NS-011 | AI Feature Audit | P0 | Research | - | [View](./work-items/NS-011-ai-feature-audit.md) |
| NS-006 | OpenAI Integration for AI Features | P0 | Development | - | [View](./work-items/NS-006-openai-integration-for-ai-features.md) |
| NS-012 | Service File Refactoring | P1 | Technical | NS-011 | [View](./work-items/NS-012-service-file-refactoring.md) |
| NS-013 | Server Components Migration | P1 | Technical | - | [View](./work-items/NS-013-server-components-migration.md) |
| NS-014 | Test Coverage Improvement | P1 | Technical | - | [View](./work-items/NS-014-test-coverage-improvement.md) |
| NS-002 | E08 Cross-Domain Intelligence Story Breakdown | P1 | Documentation | - | [View](./work-items/NS-002-E08-cross-domain-intelligence-story-breakdown.md) |
| NS-007 | Remaining Provider OAuth | P1 | Development | - | [View](./work-items/NS-007-oauth-token-exchange-implementation.md) |
| NS-009 | Remaining Provider Data Sync | P1 | Development | NS-007 | [View](./work-items/NS-009-data-sync-from-health-providers.md) |
| NS-003 | E09 Data Integrations Story Breakdown | P2 | Documentation | NS-002 | [View](./work-items/NS-003-E09-data-integrations-story-breakdown.md) |
| NS-004 | E10 Analytics Dashboard Story Breakdown | P2 | Documentation | NS-003 | [View](./work-items/NS-004-E10-analytics-dashboard-story-breakdown.md) |
| NS-015 | Undocumented Features Documentation | P2 | Documentation | - | [View](./work-items/NS-015-undocumented-features-documentation.md) |

**Queue Notes:**
- NS-007 renamed from "OAuth Token Exchange" -- WHOOP OAuth is fully done; remaining scope is Fitbit and other providers
- NS-008 moved to Deferred (WhatsApp integration deferred — web-first focus)
- NS-009 renamed from "Data Sync from Health Providers" -- WHOOP data sync is done; remaining scope is other providers
- NS-005 moved to Archive (superseded -- core UI complete with 170+ pages)

### Deferred

| ID | Title | Original Priority | Reason | Link |
|----|-------|-------------------|--------|------|
| NS-008 | SMS Verification for WhatsApp | P1 | WhatsApp integration deferred — web-first focus, E03 not needed for MVP | [View](./work-items/NS-008-sms-verification-for-whatsapp.md) |

---

## ARCHIVE (Completed)

### March 2026
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| - | Vision Wellness Module, Intelligent Data Extraction & Yoga Expansion (P41) | 2026-03-31 | Vision Wellness Module: Full Ishihara color blindness testing — ColorTestPlayer (463 lines, 8 difficulty-scaled plates, 4s auto-advance, SVG dot-matrix rendering), EyeExerciseMode (420 lines, 6 exercises: focus shift, palming, 20-20-20, figure eight, clock gaze, near-far), VisionProgress (501 lines, streak tracking, score trends, test history), plate generator (226 lines, confusion color palettes protan/deutan/tritan, difficulty scaling), scoring engine (186 lines, time bonuses, difficulty multipliers, percentile ranking). Backend: vision.service.ts (575 lines), vision.controller.ts (121 lines), 3 DB tables (vision_test_sessions, vision_test_responses, vision_streaks), Zod validators, auto-migrate. vision.ts types (152 lines). WellbeingModulesGrid + WellbeingPage integration. Intelligent Data Extraction: AI Coach system prompt now auto-logs meals/water/mood/energy/stress/exercise/weight/sleep from every message without asking permission, with macro estimation from nutrition knowledge (pizza ~800kcal, egg ~70kcal), cross-domain coaching insights after each log. Smart Embedding Optimization: isWorthEmbedding() gate filters <40 chars and SKIP_EMBED_PATTERNS (acknowledgements, commands), storeMessagePair() batches user+assistant into single INSERT (4→2 DB round-trips), individual INSERT fallback on error. Data-Gap Proactive Messages: 3 new types (data_gap_dinner 8-10pm, data_gap_mood 2-8pm, data_gap_workout_feedback post-workout) scored 20-25 base with time-window gating. Chat AI Response Pipeline: Message controller triggers LangGraph for AI coach chats, typing/stopTyping Socket.IO indicators, AI coach sender info (name, avatar) in emissions, emitToUser for notification badges. Yoga Expansion: 4 new session types (eye_exercise, face_yoga, desk_stretch, breathwork_focus), DemoVideoModal (180 lines, YouTube embed), EyeExerciseAnimation (286 lines, SVG iris tracking with animated gaze patterns), YogaHome expanded with new quick-start cards, SessionPlayer eye exercise phase support, AI Coach session log API (3 new endpoints), useMediaPipe pose connection retry with 5s debounce. Spotify 403 Circuit Breaker: 3-strike failure counter with 30-min auto-reset, Jamendo fallback preserved. Landing Cinematic Upgrade: CinematicScene (186 lines), DepthLayer (88 lines), ScrollParticles (112 lines), ScrollProgressBar (41 lines), useMouseParallax (81 lines), useScrollVelocity (93 lines), useIsMobile (41 lines), hero 3D perspective entrance, life goals carousel rewrite (556 lines), responsive CTA buttons. Auto-Invoke Tool Fallback: intent-based tool invocation for Gemini 0-token responses. Proactive Message Awareness: system prompt for proactive reply data extraction. Bug Fixes: preloader CSS import, WHOOP null recovery guard, NutritionTab loading skeleton, chat message image/file rendering, Jamendo error handling, yoga-coach validator expansion, diet-plans body validation, SEO metadata, auth-state.json removed. 78 files, +6,513/-1,062 lines. |
| - | AI Music Control, Vision Coaching & Multimodal Chat (P40) | 2026-03-27 | AI Music Manager: musicManager semantic tool with 4 actions (play_activity, search_and_play, control, recommend), Spotify-first + Jamendo fallback, track minification. Music Control Pipeline: ActionCommand 'music_control' → action-handler CustomEvent('music:command') → MusicPlayerProvider listener (play/pause/resume/stop/next/previous/volume). Regex-based instant controls bypass LLM for zero-latency. Vision Coaching System: vision-coaching.service.ts (402 lines) with Gemini Vision frame analysis, exercise detection, rep counting, posture corrections, food identification. Socket.IO events (vision:start/frame/stop/state/coaching/food/throttle/error), adaptive frame interval with rate-limit backoff. VisionCoachingOverlay (115 lines). Multimodal Chat: imageBase64 in ChatRequest/controller/route (max 2MB), HumanMessage [text, image_url] content arrays, camera capability system prompt. Socket.IO client: subscribeToVisionEvents, emitVisionFrame, start/stopVisionSession. VoiceAssistantTab vision toggle (Eye/EyeOff), 3s frame capture, auto-stop on camera off, TTS coaching. Life History Table Guard: cached isTableAvailable() for pgvector-missing graceful degradation. LangChain Upgrade: core→1.1.36, langgraph→1.2.6, openai→1.3.1, anthropic→1.3.25, langchain→1.2.37. Bug Fixes: emotion confidence NaN/Infinity guards, TensorFlow log spam, system message filter. 21 files, +1,458/-125 lines. |
| - | Journal Intelligence, Competition Redesign & LLM Resilience (P39) | 2026-03-27 | LLM JSON Parser: shared parseLlmJson<T>() utility with 5-stage pipeline (strip fences → direct parse → regex extract → sanitize → repair truncated), adopted across 5 services (emotion-detection, wellbeing-auto-tracker, wellbeing-question-engine, theme-detection, user-coaching-profile). Journal Semantic Tools: journalManager (CRUD/streak) + voiceJournalManager integrated into LangGraph chatbot, safe PostgreSQL enum mapping (15 valid categories + alias table for 40+ freeform strings). Tool Router: fuzzy keyword matching fallback (prefix-based, min 4 chars), schedule/prayer keywords (fajr/dhuhr/asr/maghrib/isha), voice journal keywords, scheduleManager + voiceJournalManager in wellbeing group. Competitions Redesign: CompetitionsPageContent rewritten (915→clean minimal UI), CountdownPill (60s vs 1s interval), JoinCompetitionModal simplified (removed framer-motion). Journal Schema: checkin_id UUID FK, journaling_mode (5 modes), ai_generated_prompt boolean, migration + table definition, DistractionFreeEditor date picker. Constellation: MindCore 200→140px, 4→3 ripple rings, reversed sort (oldest=innermost). Emotion Detection: Gemini primary. Life History: pgvector table-missing guards. Admin Users: pagination flicker fix (loading/fetching separation). Bug Fixes: score_date→date, system message filter, theme upsert, stale badges. 31 files, +1,170/-1,071 lines. |
| - | Premium Circular Metrics, Food Photo AI & Dashboard Polish (P38) | 2026-03-25 | PremiumCircularMetric system: 7 SVG arc variants (DoubleRing, GlowEndpoint, MultiRing, Segmented, ThickGradient, TickMarked, Wave) with arc-utils and metric-type variant selection. Food photo AI: dish-level identification with name extraction, 10 absolute rules. ProgressTab stat cards with left accent bars and glow effects. PhotoComparisonWithAI: ScoreRing, MiniStat, analysis history. ExerciseExecution fullscreen overlay layout. Constellation journal: 300 micro-star nebula backgrounds, shooting star animations, gradient headers. LLM auth error detection with 24h provider blacklist in ModelFactory. Health metrics 60s TTL cache. Water cache invalidation. `||`→`??` null coalescing migration (20+ fixes). 3-level macro fallback cascade. Goal category expansion (nutrition + fitness). 50 files, +3,298/-1,796 lines. |
| - | Coaching Intelligence, Semantic Tools & Wellbeing Redesign (P37) | 2026-03-24 | Semantic tool consolidation: 163+ CRUD → ~10 semantic managers (meal, goal, habit, workout, sleep, stress, hydration, lifeGoal, whoopAnalytics) with action parameters (60% tool reduction). WHOOP rich context (7d avg, 30d baseline, trend directions, sleep stages, biometrics, recovery/strain ratio). Coaching styles: brutal_honesty + fired_up_pride mapped to message types with 3-day new-user guard. Async embedding (store → fast INSERT → background backfill). LLM provider runtime rate-limiting with auto-skip fallback. 14 wellbeing pages redesigned (React Flow workflows, drag-drop goals, area charts, trend badges, behavioral patterns). On-demand insight compute API. Max tokens 800→2048. 56 files, +10,085/-6,016 lines. |
| - | Email & Notification Engine (P36) | 2026-03-19 | Full email pipeline: EmailEngine orchestrator (5 categories, preferences check, queue/inline), EmailQueueService (BullMQ, Redis fallback), EmailWorker (3 concurrency, 10/s rate, RFC List-Unsubscribe), EmailContentGenerator (AI weekly digests, coaching, re-engagement). NotificationEngine (Socket.IO real-time, 60s deduplication, email triggers for urgent). Email digest job (weekly summaries + re-engagement). 3 DB tables (email_logs, email_preferences, proactive_messages). Frontend: NotificationDropdown, NotificationToast, useNotifications hook. EJS templates (digest, coaching, unsubscribe). 6 email API routes. 32 files, +3,223 lines. |
| - | Life Goals & Motivation Ecosystem (P35) | 2026-03-18 | Multi-domain life coaching: 13 goal categories, AI goal decomposition (motivation-tier calibrated), milestones/checkins/streak tracking, motivation tier system (declared+computed+blended, 6 engagement signals), weekly engagement scoring job, Life Score metric (5-component holistic 0-100). 6 new proactive message types (life_goal_checkin/stalled/milestone/encouragement, intention_reminder/reflection). LifeGoalsStep onboarding (assessment→AI suggestions→confirm), DailySuggestionsWidget, AISuggestionCard, GoalsTab expansion, 3 landing sections, FAQ page, Preferences page. 3 new services, 19 routes, 4 DB tables, 1 job. 93 files, +8,318 lines. |
| - | Gemini Vision & Multi-Model AI Consolidation (P34) | 2026-03-13 | Gemini-first AI provider strategy: direct REST API (no SDK) for vision, embeddings (1536-dim), text. 3-tier fallback chains (Gemini→DeepSeek→OpenAI). JSON salvage for truncated LLM outputs. NutritionTab priority parsing. Bug fixes: voice avatar lip-sync, meal query, stress arrays. 19 files, +910/-514 lines. |
| - | AI Yoga Coach, Life History, YouTube (P33) | 2026-03-12 | AI Yoga Coach (Gemini Vision real-time pose analysis, MediaPipe landmarks, Coach Maya, 4 hooks, 5 utils), Life History Embeddings (13-source daily digest, Gemini 768-dim vectors, semantic search, 6h job), YouTube Integration (pose tutorials, 24h cache), PoseDetailSidebar, ProgressDashboard expansion, proactive messaging yoga refactor, coaching profile yoga adherence. 3 new services, 1 controller, 1 job, 1 DB table, 10+ components. 71 files, +6,945 lines. |
| - | Spotify/Music + Yoga & Meditation (P32) | 2026-03-11 | Spotify OAuth 2.0+PKCE with Jamendo fallback, activity-based music recommendations (8 categories), PersistentPlayer (SDK + HTML5), MusicTab dashboard, Soundscape page. Yoga module: 100+ pose library, 10 session types, 6 meditation modes, immersive SessionPlayer, streak tracking (14 milestones), progress dashboard. 4 new services, 2 controllers, 36 API endpoints, 6 DB tables, 12+ components. 59 files, +13,711 lines. |
| - | Cross-Domain Intelligence System (P31 / E08) | 2026-03-10 | Full E08 implementation: contradiction detection (22 rules, 6 pillars), health correlations (6 SQL detectors), best day formula + achievement score, prediction accuracy tracking, weekly reports with LLM narrative, voice journaling (record→transcribe→AI→summarize), theme detection (15 tags), LLM model factory (4-provider cascade). Intelligence Tab (5 sub-tabs) + 4 overview widgets. 9 new services, 14 endpoints, 3 DB tables, 15 components, 1 background job. |
| - | Journaling Inspiration Features (P30) | 2026-03-09 | Cross-pollinated Story Writer patterns: expanded mood states (13 emojis), mood arc tracking with triggers, SQL-based behavioral pattern detection (4 algorithms), morning/evening check-in loop with predicted-vs-actual, lessons learned system (AI extraction + spaced reminders), daily intentions enhancement. 14 new endpoints, 2 DB tables, 7 components. |

### February 2026
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| - | Delta-Aware Conversations & Smart Routing (P27) | 2026-02-25 | Delta detection service, delta-aware greetings/prompt, smart message routing (score-and-rank top 2-3), longitudinal accountability with tough_love escalation, daily analysis engine, WHOOP test fixes. 749 tests, 0 TS errors. |
| - | AI Coach Pro & Proactive Messaging Overhaul (P26) | 2026-02-24 | Coaching profiles with adherence/risk/predictions, proactive message quality overhaul, 95% query reduction, voice greeting personalization |
| - | Product Tour / Walkthrough System | 2026-02-19 | 8-step interactive tour with SVG spotlight, glassmorphism tooltips, confetti, keyboard nav, focus trap, ARIA a11y, admin steps, localStorage + backend persistence, 165 tests across 10 suites |

### Development Tasks - December 2025
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| NS-001 | E01 Story Review | 2025-12-27 | Framework implemented, 9 stories Done, 6 In Progress (AI/integration gaps) |
| NS-005 | Complete Core App UI | 2025-12-27 | 170+ pages, 20+ components, 8-tab dashboard -- superseded by full web app |

### Story Breakdown Sessions - December 2025
- E02: Voice Coaching - 16 stories
- E03: WhatsApp Integration - 16 stories
- E04: Mobile App - 20 stories
- E05: Fitness Pillar - 17 stories
- E06: Nutrition Pillar - 18 stories
- E07: Wellbeing Pillar - 18 stories

**Total Stories Generated:** 120 (across E01-E07)

---

## FUTURE CANDIDATES

Items identified during sessions that need user curation to enter queue.

| Item | Source | Type | Notes | Added |
|------|--------|------|-------|-------|
| Story prioritization pass | After E08-E10 | Documentation | MoSCoW review across all epics | 2025-12-20 |
| Sprint planning | After stories | Planning | Map stories to sprints | 2025-12-20 |
| Technical architecture doc | E01-E10 stories | Documentation | Cross-cutting technical decisions | 2025-12-20 |
| API design document | E03, E09 | Documentation | WhatsApp, wearable APIs | 2025-12-20 |
| Server Component migration strategy | NS-013 audit | Technical | Full migration plan based on page audit results | 2026-02-08 |

*User Action Required: Review and add to queue or dismiss*

---

## REFERENCE

### Team Quick Lookup

| Task Scope | Team | Activation |
|-----------|------|------------|
| Idea to PRD | Product Discovery Team | `/team product-discovery` |
| PRD to Architecture | Architecture Team | `/team architecture` |
| PRD to Stories | Epic Breakdown Team | `/team epic-breakdown` |
| Stories to Task Specs | Implementation Prep Team | `/team implementation-prep` |
| Code implementation | Development Team | `/team development` |
| PR/Design review | Review Team | `/team review` |

### Skill Quick Lookup

| Use Case | Skill | Activation |
|----------|-------|------------|
| Product strategy | EXPERT-10 | `Act as EXPERT-10 Product Manager` |
| Story breakdown | EXPERT-13 | `Use EXPERT-13 Story Generator` |
| Software architecture | EXPERT-03 | `Act as EXPERT-03 Software Architect` |
| Senior frontend | EXPERT-01 | `Act as EXPERT-01 Senior Frontend` |
| Code review | DEV-01 | `Apply DEV-01 CLEAR framework` |
| Testing | DEV-02 | `Use DEV-02 test patterns` |
| Documentation | DOC-01 | `Apply DOC-01 Documentation Validator` |

### Key Patterns from PROGRESS.md

| Pattern | Reference |
|---------|-----------|
| 4-phase implementation | Foundation, Core, Intelligence, Enhancement |
| Technical foundation stories | S0X.0.1 for API/platform setup |
| Bootstrap AI approach | Research-based prompts first, AI personalizes over time |
| Domain module split | Break large services into domain-specific files |
| Client/server monorepo | Next.js frontend + Express API in apps/yhealth-app/ |

### Epic PRD Files

| Epic | PRD File |
|------|----------|
| E08 | `prd-epics/PRD-Epic-08-Cross-Domain-Intelligence.md` |
| E09 | `prd-epics/PRD-Epic-09-Data-Integrations.md` |
| E10 | `prd-epics/PRD-Epic-10-Analytics-Dashboard.md` |

---

## ITEM STATE MACHINE

```
Future Candidate -> Queued -> In Progress -> Done (Archive)
                      |           |
                   Blocked     Blocked
                      |           |
                   Queued    In Progress
```

---

*NEXT-STEPS.md v2.0 | yHealth Platform*
*Created: 2025-12-20 | Migrated: 2026-02-08*
