# yHealth Platform: Development Progress

> **Purpose**: Track development execution and technical milestones
> **Phase**: Active Development - Multi-Pillar Implementation
> **Last Updated**: 2026-05-05
> **Planning Context**: See [PROGRESS.md](./PROGRESS.md)

---

## QUICK START: Copy This Prompt

```markdown
# yHealth Development Session

## Session Context
I'm continuing development work on yHealth Platform mobile app.

**Reference This Document:** @PRODUCTS/yhealth-platform/PROGRESS-DEV.md
**Reference Planning:** @PRODUCTS/yhealth-platform/PROGRESS.md
**Reference NEXT-STEPS:** @PRODUCTS/yhealth-platform/NEXT-STEPS.md

## Active Skills
EXPERT-01 (Frontend), EXPERT-02 (Backend), DEV-01 (Code Review), DEV-02 (Tests)

## Current Phase
Active Development - Multi-Pillar Implementation

## Session Goal
[Describe what you want to accomplish this session]
```

---

## PHASE STATUS TABLE

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| P1 | Project Setup | ✅ Complete | 100% |
| P2 | Design System | ✅ Complete | 100% |
| P3 | Core Infrastructure | ✅ Complete | 100% |
| P4 | Components | ✅ Complete | 100% |
| P5 | Pages | ✅ Complete | 100% |
| P6 | Testing | ✅ Complete | 100% |
| P7 | State Management | ✅ Complete | 100% |
| P8 | API Integration | ✅ Complete | 100% |
| P9 | Notifications | ✅ Complete | 100% |
| P10 | Goals System | ✅ Complete | 100% |
| P11 | Achievements | ✅ Complete | 100% |
| P12 | Dashboard Tabs | ✅ Complete | 100% |
| P13 | Plans System | ✅ Complete | 100% |
| P14 | Enhanced Onboarding | ✅ Complete | 100% |
| P15 | Wellbeing Pillar | ✅ Complete | 100% |
| P16 | Automation & Background Jobs | ✅ Complete | 100% |
| P17 | Emotional Check-ins | ✅ Complete | 100% |
| P18 | Feb 2026 Enhancements | ✅ Complete | 100% |
| P19 | Product Tour / Walkthrough | ✅ Complete | 100% |
| P20 | Exercise Library System | ✅ Complete | 100% |
| P21 | Exercise Execution Drawer | ✅ Complete | 100% |
| P22 | Landing Page Redesign | ✅ Complete | 100% |
| P23 | Server Test Infrastructure Fixes | ✅ Complete | 100% |
| P24 | Leaderboard & Competition Fixes | ✅ Complete | 100% |
| P25 | Testimonials Admin & Landing Animations | ✅ Complete | 100% |
| P26 | AI Coach Pro & Proactive Messaging Overhaul | ✅ Complete | 100% |
| P27 | Delta-Aware Conversations & Smart Routing | ✅ Complete | 100% |
| P28 | SEO, Performance & Code Quality | ✅ Complete | 100% |
| P29 | AI Coach Emotional Intelligence & Avatar Fixes | ✅ Complete | 100% |
| P30 | Journaling Inspiration Features | ✅ Complete | 100% |
| P31 | Cross-Domain Intelligence (E08) | ✅ Complete | 100% |
| P32 | Spotify/Music + Yoga & Meditation | ✅ Complete | 100% |
| P33 | AI Yoga Coach, Life History, YouTube | ✅ Complete | 100% |
| P34 | Gemini Vision & Multi-Model AI Consolidation | ✅ Complete | 100% |
| P35 | Life Goals & Motivation Ecosystem | ✅ Complete | 100% |
| P36 | Email & Notification Engine | ✅ Complete | 100% |
| P37 | Coaching Intelligence, Semantic Tools & Wellbeing Redesign | ✅ Complete | 100% |
| P38 | Premium Circular Metrics, Food Photo AI & Dashboard Polish | ✅ Complete | 100% |
| P39 | Journal Intelligence, Competition Redesign & LLM Resilience | ✅ Complete | 100% |
| P40 | AI Music Control, Vision Coaching & Multimodal Chat | ✅ Complete | 100% |
| P41 | Vision Wellness Module, Intelligent Data Extraction & Yoga Expansion | ✅ Complete | 100% |
| P42 | Avatar Gesture System, Chat UI Refresh & Backend Resilience | ✅ Complete | 100% |
| P43 | Finance Module, Knowledge Graph, WHOOP Sync & Onboarding Polish | ✅ Complete | 100% |
| P44 | GIF Reactions, Knowledge Graph Expansion, Wellness Orbit & Security Hardening | ✅ Complete | 100% |
| P45 | Streak System, Status Awareness AI, Weather Widget & Dashboard Widgets | ✅ Complete | 100% |
| P46 | Dashboard Visual Redesign, Activity Toggle, Landing Simplification & AI Resilience | ✅ Complete | 100% |
| P47 | Coach Persona, Mental Health Guardrails, Push Notifications, Data Sources, Timing Profiles, Google Calendar OAuth & Voice Assistant Redesign | ✅ Complete | 100% |
| P48 | Entitlements System, Schedule Workflow Builder, Journal Constellation Redesign & Mood Rating | ✅ Complete | 100% |
| P49 | Subscription Enforcement, Billing UI, Admin Panels, Exercise Import & Icon Cleanup | ✅ Complete | 100% |
| P50 | Database Consolidation, Leaderboard Redesign, Test Suite Expansion & Admin Customer Subscriptions | ✅ Complete | 100% |
| P51 | AI Tool Governance, Calendar Domain, Auth Improvements, Admin Premium Panel & Test Expansion | ✅ Complete | 100% |
| P52 | Reasoning Graph, Tool Transactions, AI Coach Agent UI, User Files & Proactive Events | ✅ Complete | 100% |
| P53 | Chatbot Performance Pipeline, Tool Router Expansion & Data Source Corrections | ✅ Complete | 100% |
| P54 | Tool Resilience, Action Normalization, Entitlement Config & Voice Call Fixes | ✅ Complete | 100% |
| P55 | Intelligence Engine — Memory, Deep Analysis, Core Profile & Transparency | ✅ Complete | 100% |
| P56 | Landing Page V2, AI Coach Modularization, Billing Jobs & Onboarding Enhancements | ✅ Complete | 100% |
| P57 | AI Coach Calling, Call Ringtones, Chat Call Persistence & Email Template Overhaul | ✅ Complete | 100% |

**Status Legend**: ✅ Complete | 🔄 In Progress | ⏳ Not Started | 🚫 Blocked

---

## IMPLEMENTATION GAPS

Features with placeholder/stub implementations that need completion:

| Gap | Impact | Location | Priority |
|-----|--------|----------|----------|
| AI Plan Generation | Plan activities are generic | plan.controller.ts:1114 | P0 |
| AI Goal Suggestions | No personalized goals | assessment.controller.ts:516 | P0 |
| AI Deep Assessment | Placeholder conversation responses | assessment.controller.ts:364 | P0 |
| Debug Instrumentation | 5 server files with debug fetch | server/src/ | P0 |
| Unused NPM Dependencies | Redux Toolkit, React Query unused | client/package.json | P1 |
| Data Sync | No health data import from some providers | integration.controller.ts:761 | P1 |
| ~~SMS Verification~~ | ~~WhatsApp enrollment incomplete~~ | ~~auth.controller.ts~~ | **DEFERRED**: E03 WhatsApp deferred |
| Activity Feedback | Random AI feedback strings | plan.controller.ts:676 | P2 |

**Note:** LangGraph-based AI exists (M-011) but some original AI stubs remain in onboarding controllers. WHOOP OAuth is fully implemented (M-012). E03 WhatsApp integration deferred — web-first focus.

**Next Priority:** Remove debug instrumentation, clean unused deps, then connect remaining AI stubs to LangGraph.

---

## COMPONENT STATUS TABLE

| Component | Phase | Status | Notes |
|-----------|-------|--------|-------|
| Next.js 15 Setup | P1 | ✅ Complete | TypeScript, Tailwind CSS v4 |
| CSS Variables | P2 | ✅ Complete | yHealth theme with dark mode |
| Pillar Colors | P2 | ✅ Complete | Fitness, Nutrition, Wellbeing |
| Animations | P2 | ✅ Complete | Creature, glow, message slide |
| TypeScript Interfaces | P3 | ✅ Complete | Pillar, Message, Insight, Metric |
| Mock Data Layer | P3 | ✅ Complete | User, pillars, messages, insights |
| PillarCreature | P4 | ✅ Complete | Animated health pillar |
| SageAvatar | P4 | ✅ Complete | AI coach avatar with expressions |
| ChatBubble | P4 | ✅ Complete | User/AI message bubbles |
| MCQChips | P4 | ✅ Complete | Multiple choice chips |
| AIQuestionCard | P4 | ✅ Complete | AI-initiated question prompts |
| MessageInput | P4 | ✅ Complete | Text/voice input bar |
| ProgressRing | P4 | ✅ Complete | SVG circular progress |
| MetricCard | P4 | ✅ Complete | Health metric display |
| InsightCard | P4 | ✅ Complete | AI insight display |
| SettingsItem | P4 | ✅ Complete | Settings row component |
| BottomTabBar | P4 | ✅ Complete | Navigation with Pillars tab |
| PillarTabBar | P4 | ✅ Complete | Sub-navigation |
| QuickActionButton | P4 | ✅ Complete | Compact/default actions |
| Sparkline | P4 | ✅ Complete | Mini trend line chart |
| HarmonyView | P4 | ✅ Complete | Three-pillar visualization |
| CorrelationCard | P4 | ✅ Complete | Cross-domain insight cards |
| SettingsToggle | P4 | ✅ Complete | Toggle with icon/label |
| AlertDialog | P4 | ✅ Complete | Radix UI confirmation dialog |
| Checkbox | P4 | ✅ Complete | Radix UI checkbox component |
| Home Page | P5 | ✅ Complete | Greeting, pillars, AI question |
| Pillars Hub | P5 | ✅ Complete | Overview of all three creatures |
| Fitness Detail | P5 | ✅ Complete | Activity, sleep, recovery |
| Nutrition Detail | P5 | ✅ Complete | Meals, macros, hydration |
| Wellbeing Detail | P5 | ✅ Complete | Mood, habits, stress |
| Insights Page | P5 | ✅ Complete | Progress rings, Harmony View |
| Coach Page | P5 | ✅ Complete | Full chat, quick actions |
| Settings Page | P5 | ✅ Complete | All E4.6 categories |
| Goals Page | P5 | ✅ Complete | Goal tracking with progress |
| Notifications Page | P5 | ✅ Complete | Full notification management |
| Profile Edit Page | P5 | ✅ Complete | User profile editing |
| Dashboard Page | P5 | ✅ Complete | Main dashboard view |
| Onboarding Flow | P5 | ✅ Complete | Multi-step onboarding |
| Notification Service | P8 | ✅ Complete | Auto-notifications for events |
| Goals API | P8 | ✅ Complete | CRUD with progress tracking |
| Achievements API | P8 | ✅ Complete | User achievements system |
| Notifications API | P8 | ✅ Complete | Full notification endpoints |
| Activity API | P8 | ✅ Complete | Activity feed endpoints |
| Stats API | P8 | ✅ Complete | User statistics endpoints |
| DashboardTabs | P12 | ✅ Complete | 8-tab dashboard system |
| OverviewTab | P12 | ✅ Complete | Dashboard overview |
| ActivityTab | P12 | ✅ Complete | Activity feed tab |
| GoalsTab | P12 | ✅ Complete | Goals tracking tab |
| AchievementsTab | P12 | ✅ Complete | Achievements display |
| NotificationsTab | P12 | ✅ Complete | Inline notifications |
| ProfileTab | P12 | ✅ Complete | Profile overview |
| PreferencesTab | P12 | ✅ Complete | Preferences access |
| SettingsTab | P12 | ✅ Complete | Settings quick access |
| Plans Detail Page | P13 | ✅ Complete | Dynamic plan routing |
| DeepAssessmentStep | P14 | ✅ Complete | Comprehensive assessment |
| BackButton | P4 | ✅ Complete | Reusable back navigation |
| SuccessModal | P4 | ✅ Complete | Success confirmation modal |
| Database Migrations | P3 | ✅ Complete | Auto-migrate system |
| CallCoachButton | P8 | ✅ Complete | One-tap voice call initiation |
| VoiceCallTab | P5 | ✅ Complete | Voice call interface with status tracking |
| CallHistory | P5 | ✅ Complete | Call history display component |
| Voice Call Service | P8 | ✅ Complete | Backend voice call lifecycle management |
| Voice Calls API | P8 | ✅ Complete | REST API endpoints for voice calls |
| WebRTC Signaling | P8 | ✅ Complete | WebRTC connection infrastructure |
| Emotion Detection Service | P8 | ✅ Complete | Real-time emotion analysis with crisis detection |
| Mental Recovery Scoring | P8 | ✅ Complete | Recovery progress tracking and scoring |
| Report Generation Service | P8 | ✅ Complete | Comprehensive analytics and reports |
| AssemblyAI Transcription | P8 | ✅ Complete | Audio transcription service integration |
| Session Orchestration | P8 | ✅ Complete | Voice session type management |
| Crisis Detection Service | P8 | ✅ Complete | Safety monitoring and escalation |
| AnalyticsTab | P12 | ✅ Complete | Dashboard analytics view |
| ReportingTab | P12 | ✅ Complete | Dashboard reporting view |
| ScoringTab | P12 | ✅ Complete | Dashboard scoring view |
| VoiceAssistant Modal | P5 | ✅ Complete | CallPurposeSelector, EmergencyResources, SessionTypeSelector |
| QuickCheckInFlow | P8 | ✅ Complete | 5-minute quick check-in session flow |
| CoachingSessionFlow | P8 | ✅ Complete | 20-30 minute coaching session flow |
| EmergencySessionFlow | P8 | ✅ Complete | Emergency support session protocol |
| GoalReviewFlow | P8 | ✅ Complete | 15-minute goal review session flow |
| CallSummaryView | P8 | ✅ Complete | Post-call summary display component |
| VoiceCustomizationPanel | P8 | ✅ Complete | Voice and schedule customization UI |
| EmotionTrendsWidget | P8 | ✅ Complete | Emotion data visualization widget |
| ActionItemList | P8 | ✅ Complete | Action item tracking component |
| Call Summary Service | P8 | ✅ Complete | AI-powered summary generation |
| Summary Delivery Service | P8 | ✅ Complete | Multi-channel summary delivery |
| Voice Schedule Service | P8 | ✅ Complete | Voice preferences and scheduling |
| call_summaries Table | P3 | ✅ Complete | Post-call summary storage |
| action_items Table | P3 | ✅ Complete | Action item tracking storage |
| WellbeingTab | P15 | ✅ Complete | Wellbeing dashboard tab |
| ScheduleWorkflow | P15 | ✅ Complete | Schedule workflow visualization with nodes and edges |
| WellbeingContextService | P15 | ✅ Complete | Context aggregation for AI chatbot integration |
| WellbeingQuestionEngine | P15 | ✅ Complete | AI-powered question generation for proactive check-ins |
| WellbeingAutoTracker | P15 | ✅ Complete | Automatic wellbeing data extraction from chat messages |
| WellbeingEmbeddingService | P15 | ✅ Complete | Vector embeddings for semantic search and RAG |
| Wellbeing Vector Indexes | P15 | ✅ Complete | Database indexes for fast wellbeing data retrieval |
| LangGraph Wellbeing Tools | P15 | ✅ Complete | Wellbeing tools integrated into AI chatbot |
| TensorFlow Sentiment Service | P15 | ✅ Complete | Sentiment analysis for wellbeing data |
| WHOOP Integration | P15 | ✅ Complete | OAuth 2.0 + PKCE, webhooks, charts, metrics, overview |
| Nutrition Tab Enhancements | P15 | ✅ Complete | Enhanced nutrition tracking and display |
| Stats Controller Enhancements | P15 | ✅ Complete | Improved statistics and analytics endpoints |
| R2 Service Updates | P15 | ✅ Complete | Enhanced file storage service |
| Workout Alarm Service | P15 | ✅ Complete | Workout reminder and alarm system |
| MoodCheckIn | P15 | ✅ Complete | Mood check-in components (light/deep) |
| MoodTimeline | P15 | ✅ Complete | Mood history visualization |
| MoodPatterns | P15 | ✅ Complete | Mood pattern analysis |
| EnergyCheckIn | P15 | ✅ Complete | Energy level tracking |
| EnergyTimeline | P15 | ✅ Complete | Energy history visualization |
| EnergyPatterns | P15 | ✅ Complete | Energy pattern analysis |
| StressCheckIn | P15 | ✅ Complete | Stress check-in components (light/deep) |
| StressCrisisBanner | P15 | ✅ Complete | Crisis detection and support |
| StressEveningPrompt | P15 | ✅ Complete | Evening stress reflection |
| JournalEntryForm | P15 | ✅ Complete | Journal entry creation |
| JournalHistory | P15 | ✅ Complete | Journal entry history |
| JournalPrompt | P15 | ✅ Complete | AI-powered journal prompts |
| JournalStreaks | P15 | ✅ Complete | Journal streak tracking |
| HabitDashboard | P15 | ✅ Complete | Habit tracking dashboard |
| HabitFormModal | P15 | ✅ Complete | Habit creation and editing |
| MindfulnessRecommendation | P15 | ✅ Complete | Mindfulness activity suggestions |
| Schedule Service | P15 | ✅ Complete | Daily schedule management |
| Wellbeing Service | P15 | ✅ Complete | Wellbeing data aggregation |
| Wellbeing Controllers | P15 | ✅ Complete | Mood, energy, stress, journal, habit APIs |
| Wellbeing Database Tables | P15 | ✅ Complete | mood_logs, energy_logs, stress_logs, journal_entries, habits, daily_schedules |
| RescheduleWorkoutModal | P15 | ✅ Complete | Workout rescheduling modal interface |
| WorkoutConstraints | P15 | ✅ Complete | User workout constraint management |
| WorkoutRescheduleHistory | P15 | ✅ Complete | Workout reschedule history tracking |
| WorkoutScheduleTasks | P15 | ✅ Complete | Workout schedule task management |
| MealHistoryTab | P15 | ✅ Complete | Meal logging history display |
| Workout Reschedule Service | P15 | ✅ Complete | Workout rescheduling business logic |
| Workout Constraint Service | P15 | ✅ Complete | Workout constraint validation |
| Workout Reschedule Workflow | P15 | ✅ Complete | Workout rescheduling workflow orchestration |
| Workout Slot Calculator | P15 | ✅ Complete | Workout slot availability calculation |
| Workout Audit Service | P15 | ✅ Complete | Workout schedule validation and auditing |
| Workout Reschedule Routes | P15 | ✅ Complete | REST API endpoints for workout rescheduling |
| Workout Reschedule Database Tables | P15 | ✅ Complete | workout_schedule_tasks, user_workout_constraints, plan_reschedule_history |
| Testing Infrastructure | P6 | ✅ Complete | Meal logging integration/unit tests, testing guide |
| ProductTour Orchestrator | P19 | ✅ Complete | Portal-based tour root with keyboard nav, focus trap, RAF position tracking |
| TourOverlay | P19 | ✅ Complete | Full-screen SVG mask with animated spotlight cutout |
| TourSpotlight | P19 | ✅ Complete | Neon ring with gradient glow around target element |
| TourTooltip | P19 | ✅ Complete | Glassmorphism card with smart positioning, mobile bottom sheet |
| TourWelcomeModal | P19 | ✅ Complete | Fullscreen welcome with gradient text, pulsing icon |
| TourCompletionModal | P19 | ✅ Complete | Fullscreen with canvas-confetti celebration |
| TourProgressBar | P19 | ✅ Complete | Dot-based progress with layout animation |
| TourAmbientBackground | P19 | ✅ Complete | Floating gradient orbs during tour |
| ProductTourContext | P19 | ✅ Complete | State management, localStorage persistence, backend sync, auto-trigger |
| Tour Test Suites | P19 | ✅ Complete | 10 suites, 165 tests covering utils, components, context, integration |
| Exercise Library Page | P20 | ✅ Complete | Search, filter, browse exercises with grid/list views |
| Exercise Detail Page | P20 | ✅ Complete | Full exercise detail view with instructions, tips, media |
| ExerciseCard | P20 | ✅ Complete | Card component for exercise library grid display |
| ExerciseFilters | P20 | ✅ Complete | Filter panel for muscle group, equipment, difficulty |
| ExerciseDetailView | P20 | ✅ Complete | Tabbed detail view with instructions, tips, mistakes |
| Admin Exercise Management | P20 | ✅ Complete | Admin CRUD for exercise library entries with media (.gif/.mp4) support |
| Exercise Ingestion Service | P20 | ✅ Complete | ETL pipeline for bulk exercise data with SAVEPOINT-based batch upsert |
| exercises.service.ts (client) | P20 | ✅ Complete | Client service for exercise search, getById, CRUD |
| ExerciseExecutionDrawer | P21 | ✅ Complete | Slide-over drawer with exercise detail, set tracker, timer |
| PlateCalculator | P21 | ✅ Complete | Barbell weight plate calculator with visual diagram |
| Landing Hero Section | P22 | ✅ Complete | Redesigned hero with gradient text and animation |
| Landing Features Section | P22 | ✅ Complete | Feature cards with icons and descriptions |
| Landing How It Works | P22 | ✅ Complete | Step-by-step flow section |
| Landing Pricing Section | P22 | ✅ Complete | Pricing tiers with feature comparison |
| Landing Testimonials | P22 | ✅ Complete | User testimonial carousel/grid |
| Landing Stats Section | P22 | ✅ Complete | Platform statistics display |
| Landing CTA Section | P22 | ✅ Complete | Call-to-action with download links |
| Landing FAQ Section | P22 | ✅ Complete | Expandable FAQ accordion |
| Landing Integrations | P22 | ✅ Complete | Integration partner logos and info |
| Landing AI App Flow | P22 | ✅ Complete | AI-powered app flow visualization |
| Landing App Download | P22 | ✅ Complete | App store download section |
| Landing Shared Components | P22 | ✅ Complete | Shared UI components for landing page |
| Leaderboard UI Enhancements | P22 | ✅ Complete | TopThreePodium, DailyScoreCard, ScoreHistoryChart, UserRowBreakdown |
| ESM Test Mocking Pattern | P23 | ✅ Complete | jest.unstable_mockModule + dynamic imports for all integration tests |
| Server Unit Tests | P23 | ✅ Complete | 24 suites, 631 tests passing (100% unit test pass rate) |
| Leaderboard Score Materialization | P24 | ✅ Complete | Always materialize + updateRanks when scores exist |
| Scoring Pipeline Resilience | P24 | ✅ Complete | Graceful fallback for missing tables (nutrition_user_preferences, habit_logs) |
| Competition Date Range Scoring | P24 | ✅ Complete | Compute scores for full competition date range, not just today |
| Dual-Track Competition Auto-Create | P24 | ✅ Complete | Daily (1-day) + Challenge (3/7/15-day) independent tracks |
| Leaderboard Materialization Job | P24 | ✅ Complete | Lazy score compute + updateRanks in background job |
| Competition Completed Entries | P24 | ✅ Complete | Include ended competitions in user entries and leaderboard |
| LeaderboardView Competition Fallback | P24 | ✅ Complete | Fall back to global when no competitionId for competition type |
| Testimonials Admin Page | P25 | ✅ Complete | Full CRUD for testimonials with search, filters, bulk actions |
| Testimonials Service | P25 | ✅ Complete | Admin + public query services with stats |
| Testimonials API Routes | P25 | ✅ Complete | Admin CRUD + public listing endpoints |
| Testimonials DB Schema | P25 | ✅ Complete | testimonials table with migration |
| Integrations Section Animations | P25 | ✅ Complete | Scroll parallax, orbital rotation, 3D tilt, particle ring |
| Proactive Messaging Service | P25 | ✅ Complete | Enhanced proactive messaging with context-aware triggers |
| Google Cloud TTS Service | P25 | ✅ Complete | Google Cloud Text-to-Speech integration |
| Voice Customization Panel | P25 | ✅ Complete | Voice and schedule customization UI enhancements |
| CompetitionsSection Redesign | P25 | ✅ Complete | Enhanced competition cards with status badges |
| PlanCompletionCelebration | P25 | ✅ Complete | Workout plan completion celebration component |
| User Coaching Profile Service | P26 | ✅ Complete | AI coaching profiles with adherence scores, risk flags, predictions |
| Coach Profile Generation Job | P26 | ✅ Complete | 6-hour interval batch job for stale/missing profile generation |
| AI Coach Profile API | P26 | ✅ Complete | GET/POST/PATCH endpoints for coaching profiles and tone |
| Proactive Message Quality Overhaul | P26 | ✅ Complete | Professional coaching prompts, data-rich templates, gpt-4o for pro messages |
| Proactive Message Rate Limiting | P26 | ✅ Complete | 2-hour min gap, 4/day cap, context caching (95% query reduction) |
| Voice Greeting Personalization | P26 | ✅ Complete | Comprehensive context-aware greeting with WHOOP/score/streak data |
| user_coaching_profiles Table | P26 | ✅ Complete | DB migration + auto-migrate registration |
| User Delta Service | P27 | ✅ Complete | Snapshot-based delta detection: tracks workouts, meals, scores, goals, habits, achievements since last visit |
| Delta-Aware Greetings | P27 | ✅ Complete | AI acknowledges what changed since last visit in greeting and system prompt |
| Daily Analysis Service | P27 | ✅ Complete | Cross-domain pattern detection with 8 insight types, coaching directives, LLM enrichment |
| Daily Analysis Job | P27 | ✅ Complete | Background job for daily analysis report generation |
| Smart Message Routing | P27 | ✅ Complete | Score-and-rank replaces 18 sequential checks — top 2-3 highest-impact messages per cycle |
| Longitudinal Adherence | P27 | ✅ Complete | 7d vs 30d adherence tracking with trend detection and accountability escalation |
| WHOOP Integration Test Fixes | P27 | ✅ Complete | Fixed device_info lookup, mock implementation survival, JSONB parse handling |
| SEO Server Components | P28 | ✅ Complete | 60+ pages converted to server component wrappers with metadata, Open Graph, JSON-LD |
| PageContent Client Components | P28 | ✅ Complete | Client component extraction for all pages preserving interactivity |
| Structured Data (JSON-LD) | P28 | ✅ Complete | Schema.org structured data for WebApplication, Organization, FAQ |
| Sitemap & Robots | P28 | ✅ Complete | Dynamic sitemap generation, robots.txt configuration |
| Chat Message Loading Optimization | P28 | ✅ Complete | Batch queries (N+1 → 7 queries), fire-and-forget markChatAsRead |
| Chat Skeleton Loading | P28 | ✅ Complete | Contextual skeleton placeholders for chat list and messages |
| View-Once Messages | P28 | ✅ Complete | View-once media viewer with auto-expiry support |
| Dashboard Sci-Fi Preloader | P28 | ✅ Complete | AI-themed preloader with glowing orbs, hexagonal nodes, orbital paths |
| Food Icon Matching | P28 | ✅ Complete | Indian/South Asian foods, breakfast items, salad ordering fix |
| Workout Plan Bug Fixes | P28 | ✅ Complete | Weekly view, exercise execution drawer, create modal fixes |
| Proactive Messaging Startup Fix | P28 | ✅ Complete | Fixed query storm on server startup |
| ESLint Zero Warnings | P28 | ✅ Complete | Resolved all 149 client lint warnings (unused imports, any types, hooks) |
| WHOOP Sync Job | P28 | ✅ Complete | Background job for WHOOP data synchronization |
| Coach Emotional State Engine | P29 | ✅ Complete | Deterministic computation of coach emotions (proud/worried/frustrated/excited/disappointed/hopeful) from user data |
| Relationship Depth Tracking | P29 | ✅ Complete | Phase-based voice adaptation (new/building/established/deep) with voice style instructions |
| Embodied Language Prompts | P29 | ✅ Complete | Emotion-driven language in chat system prompt and proactive messaging prompts |
| Progress-Aware Greeting | P29 | ✅ Complete | Comprehensive greeting with adherence scores, goals, streaks, trends, risk flags, and coaching insights |
| LLM Circuit Breaker | P29 | ✅ Complete | OpenAI 429 rate limit protection with exponential backoff and automatic recovery |
| VRM Loading Race Condition Fix | P29 | ✅ Complete | Rest quaternions cached before vrmRef set, preventing T-pose on first frame |
| RAF Loop Error Handling | P29 | ✅ Complete | Try-catch prevents silent animation crashes, diagnostic logging on first frame |
| Micro-Expression Engine | P29 | ✅ Complete | Brief emotional flashes (200-500ms) during conversation for avatar realism |
| Expanded Emotion Modulators | P29 | ✅ Complete | Added headTilt, headNod, breathingRate, breathingDepth, microExpressionProb, bodyTension |
| Finger Curl Enhancement | P29 | ✅ Complete | Rest pose 7°→20° curl with intermediate joints, boosted speaking finger amplitudes |
| Voice Assistant Modal Responsive | P29 | ✅ Complete | 20% smaller height (80vh desktop), responsive breakpoints, proper absolute positioning |
| ContextPanel Responsive | P29 | ✅ Complete | Absolute positioning within modal bounds, responsive bottom spacing |
| Proactive Messaging Streak Fix | P29 | ✅ Complete | Fixed streak_risk eligibility in proactive messaging |
| Coach Emotion Avatar Mapping | P29 | ✅ Complete | Coach emotion → VRM expression mapping for avatar facial state |
| MoodArcTimeline | P30 | ✅ Complete | Horizontal timeline showing mood progression with colored nodes, triggers, timestamps |
| BehavioralPatternBadges | P30 | ✅ Complete | Dismissible alert cards with color-coded severity for detected mood patterns |
| MorningCheckin | P30 | ✅ Complete | 5-step morning flow: predicted mood/energy, sleep quality, stressors, intentions |
| EveningReview | P30 | ✅ Complete | 8-step evening flow: actual mood/energy, day rating, lessons, tomorrow focus |
| DayComparisonCard | P30 | ✅ Complete | Side-by-side predicted vs actual with delta arrows and intention fulfillment ratio |
| LessonsLearned | P30 | ✅ Complete | Card list with search, domain filters, confirm/dismiss for AI-extracted lessons |
| LessonReminderBanner | P30 | ✅ Complete | Inline banner rotating old lessons with "still relevant?" spaced repetition |
| Behavioral Pattern Service | P30 | ✅ Complete | SQL-based detection: negativity bias, trigger identification, euphoria-regret, escalation flags |
| Lessons Learned Service | P30 | ✅ Complete | AI extraction (Claude Haiku), user entry, spaced reminders, full-text search |
| Mood Arc Tracking | P30 | ✅ Complete | Transition triggers, trigger categories, previous_mood_log_id linking |
| Morning/Evening Check-in | P30 | ✅ Complete | Dual check-in types with prediction fields and evening review fields |
| Daily Intentions Enhancement | P30 | ✅ Complete | Max 3 per day, bulk set, sort_order, domain, fulfillment rate |
| Expanded Emotional States | P30 | ✅ Complete | 6→13 emoji enum (added calm, confident, focused, euphoric, distracted, fearful, frustrated) |
| lessons_learned Table | P30 | ✅ Complete | AI-extracted and user-entered lessons with domain taxonomy and reminder scheduling |
| mood_behavioral_patterns Table | P30 | ✅ Complete | Detected patterns with severity, acknowledgment, dismissal tracking |
| Journaling Inspiration Features Migration | P30 | ✅ Complete | Schema changes for mood arcs, behavioral patterns, check-in types, intentions |
| Mind Constellation Improvements | P30 | ✅ Complete | Enhanced journal entry modal, star tooltip, observatory star layer |
| Vector Embedding Enhancements | P30 | ✅ Complete | Enhanced vector embedding service for wellbeing semantic search |
| IntelligenceTab | P31 | ✅ Complete | Master container with 5 sub-tabs: Insights, Correlations, Predictions, Reports, Health Score |
| InsightFeed | P31 | ✅ Complete | Filterable feed of daily insights with thumbs up/down feedback |
| CorrelationExplorer | P31 | ✅ Complete | Visualizes health correlations with strength/direction indicators |
| PredictionTracker | P31 | ✅ Complete | Shows today's predictions with confidence levels |
| ReportViewer | P31 | ✅ Complete | Renders full daily/weekly reports with narrative |
| HealthScoreBreakdown | P31 | ✅ Complete | Component score visualization with trend comparison |
| HealthScoreHero Widget | P31 | ✅ Complete | Large 0-100 score display with ring chart, delta, 6-component breakdown |
| BestDayProgress Widget | P31 | ✅ Complete | Achievement % vs best day formula, streak tracking |
| PredictionsCard Widget | P31 | ✅ Complete | Today's predictions (energy, mood, sleep, stress) with confidence badges |
| ContradictionsBanner Widget | P31 | ✅ Complete | Expandable banner with contradiction count by severity, resolve/dismiss |
| InsightsPanel | P31 | ✅ Complete | Top health-performance correlations in wellbeing tab |
| ThemeCloud | P31 | ✅ Complete | Horizontal tag cloud of journal themes with frequency sizing and trend indicators |
| VoiceJournalSession | P31 | ✅ Complete | Conversational voice journal: record → transcribe → AI responds → summarize |
| VoiceRecordButton | P31 | ✅ Complete | Record/stop button with timer |
| ConversationTranscript | P31 | ✅ Complete | Full conversation transcript with AI responses |
| VoiceJournalSummary | P31 | ✅ Complete | Session summary (mood, themes, lessons, action items) |
| Cross-Pillar Intelligence Service | P31 | ✅ Complete | 22 deterministic contradiction rules across 6 health pillars |
| Health Correlation Service | P31 | ✅ Complete | SQL-based 6-pattern detection (sleep-mood, exercise-gratitude, best-day, etc.) |
| Best Day Formula Service | P31 | ✅ Complete | Personalized formula from highest-rated days + daily achievement score |
| Prediction Accuracy Service | P31 | ✅ Complete | Predicted vs actual comparison with accuracy stats by type |
| Weekly Report Service | P31 | ✅ Complete | 7 daily reports aggregated into weekly summary with LLM narrative |
| Model Factory Service | P31 | ✅ Complete | Cascading LLM fallback: Gemini → Anthropic → DeepSeek → OpenAI, 3 tiers |
| Voice Journal Service | P31 | ✅ Complete | Record → AssemblyAI transcribe → AI respond → summarize → approve |
| Theme Detection Service | P31 | ✅ Complete | 2-stage: per-entry LLM extraction + aggregate SQL analysis, 15 theme tags |
| Intelligence Controller | P31 | ✅ Complete | 14 REST endpoints for intelligence features |
| Intelligence Routes | P31 | ✅ Complete | Mounted at /api/v1/intelligence |
| Insights Computation Job | P31 | ✅ Complete | 6-hour background job: correlations + theme analysis for active users |
| intelligence.ts Types | P31 | ✅ Complete | DailySnapshot, StructuredInsight, Prediction, RiskFlag, BestDayFormula, etc. |
| insight_feedback Table | P31 | ✅ Complete | User feedback on insights (useful/not useful + comment) |
| weekly_analysis_reports Table | P31 | ✅ Complete | Weekly aggregated reports with LLM narrative |
| prediction_accuracy_tracking Table | P31 | ✅ Complete | Predicted vs actual values with accuracy percentage |
| SpotifyService | P32 | ✅ Complete | OAuth 2.0 + PKCE, token management, per-user credentials, auto-refresh |
| SpotifyPlaylistService | P32 | ✅ Complete | Activity-based recommendations, 8 categories, audio feature mapping, 6h cache |
| JamendoService | P32 | ✅ Complete | Free CC-licensed music fallback, activity-to-tag mapping |
| SpotifyController | P32 | ✅ Complete | 18 endpoints: OAuth, playlists, search, recommendations, playback |
| spotify.routes.ts | P32 | ✅ Complete | /api/spotify/ with auth + optional auth endpoints |
| spotify_cached_playlists Table | P32 | ✅ Complete | Playlist metadata cache with 6h TTL |
| MusicTab | P32 | ✅ Complete | Dashboard tab with browse, search, smart mix, library views |
| PersistentPlayer | P32 | ✅ Complete | Fixed bottom player with Spotify SDK + HTML5 audio fallback, fullscreen mode |
| MusicPlayerProvider | P32 | ✅ Complete | React context for playback state, queue, SDK lifecycle |
| PlaylistBrowser | P32 | ✅ Complete | Grid of playlist cards with hover animations |
| ActivitySelector | P32 | ✅ Complete | 8-category pill selector for music activity |
| TrackList | P32 | ✅ Complete | Sortable track list with play controls |
| SpotifyConnectPrompt | P32 | ✅ Complete | CTA card for Spotify OAuth connection |
| Soundscape Page | P32 | ✅ Complete | Dedicated music page at /soundscape |
| spotify.ts Types | P32 | ✅ Complete | SpotifyTrack, SpotifyPlaylist, AudioFeatureProfile, etc. |
| YogaService | P32 | ✅ Complete | Poses, sessions, meditation, streaks, milestones, progress analytics |
| YogaController | P32 | ✅ Complete | 18 endpoints under /v1/wellbeing/yoga |
| yoga.validator.ts | P32 | ✅ Complete | Zod schemas for poses, sessions, meditation, history |
| yoga_poses Table | P32 | ✅ Complete | 100+ poses, 11 categories, difficulty, benefits, contraindications |
| yoga_sessions Table | P32 | ✅ Complete | Template + user sessions with phases, ambient themes, breathing |
| yoga_session_logs Table | P32 | ✅ Complete | Session logs with mood before/after, completion rate, WHOOP context |
| meditation_timers Table | P32 | ✅ Complete | Meditation modes (silent, nature, mantra) with ambient sounds |
| yoga_streaks Table | P32 | ✅ Complete | Per-user streak tracking with 14 milestone types |
| YogaPageContent | P32 | ✅ Complete | 3-tab yoga page: Practice, Pose Library, Progress |
| YogaHome | P32 | ✅ Complete | Quick-start session launcher with 6 featured templates |
| SessionPlayer | P32 | ✅ Complete | Full-screen immersive session with ambient themes, phase progression |
| PoseLibrary | P32 | ✅ Complete | Filterable pose browser (11 categories, 3 difficulties) |
| PoseCard | P32 | ✅ Complete | Pose card with Sanskrit name, benefits, breathing cues |
| ProgressDashboard | P32 | ✅ Complete | Streak, milestones (14 types), heatmap, session history |
| use-yoga-session Hook | P32 | ✅ Complete | State machine for session playback (play/pause/skip/complete) |
| yoga.ts Types | P32 | ✅ Complete | YogaPose, YogaSession, SessionLog, MeditationTimer, Streak, Stats |
| Yoga Seed Data | P32 | ✅ Complete | 100+ yoga poses seed SQL |
| YogaCoachService | P33 | ✅ Complete | Gemini 2.5-flash Vision pose analysis, Coach Maya persona, JSON repair |
| YouTubeService | P33 | ✅ Complete | YouTube Data API search, 24h caching, privacy-safe embeds |
| LifeHistoryEmbeddingService | P33 | ✅ Complete | 13-source daily digest, Gemini 768-dim vectors, semantic search |
| YouTubeController | P33 | ✅ Complete | GET /youtube/search endpoint |
| LifeHistoryDigestJob | P33 | ✅ Complete | 6h interval batch processing for daily digests |
| yoga-coach.validator.ts | P33 | ✅ Complete | Zod schemas for pose coaching frames |
| user_life_history Table | P33 | ✅ Complete | 768-dim vector embeddings, daily digests, GIN index on metadata |
| yoga_poses.joint_targets | P33 | ✅ Complete | JSONB column with target angles and tolerances per joint |
| YogaAICoach | P33 | ✅ Complete | Full AI coaching UI: camera viewport, coaching panel, body part cards |
| CameraViewport | P33 | ✅ Complete | WebRTC camera stream with MediaPipe landmark overlay |
| CoachingPanel | P33 | ✅ Complete | Real-time coaching feedback display |
| PoseDetailSidebar | P33 | ✅ Complete | Glass-morphism pose breakdown with YouTube tutorial |
| YouTubeEmbed | P33 | ✅ Complete | Privacy-safe iframe embed with skeleton loading |
| useGeminiCoach Hook | P33 | ✅ Complete | Frame capture interval + API call management |
| useMediaPipe Hook | P33 | ✅ Complete | Body landmark detection + joint angle calculation |
| useCamera Hook | P33 | ✅ Complete | WebRTC video stream management |
| usePoseScorer Hook | P33 | ✅ Complete | Local pose scoring from joint angles |
| Proactive Messaging Refactor | P33 | ✅ Complete | Yoga session tracking integration, 624-line refactor |
| LangGraph Yoga Tools | P33 | ✅ Complete | Yoga context added to AI coach semantic tools |
| Coaching Profile Yoga Integration | P33 | ✅ Complete | Yoga adherence tracking in user coaching profiles |
| ProgressDashboard Expansion | P33 | ✅ Complete | 1000+ lines with detailed analytics and charts |
| Gemini Vision Primary (ai-coach) | P34 | ✅ Complete | callGeminiVision() + callGeminiText() direct REST, OpenAI fallback |
| Gemini Human Detection | P34 | ✅ Complete | gemini-2.5-flash-lite-preview for lightweight detection |
| Emotion Detection Fallback Chain | P34 | ✅ Complete | DeepSeek → Gemini → OpenAI 3-tier fallback |
| GeminiDirectEmbeddings | P34 | ✅ Complete | Direct REST to gemini-embedding-2-preview (1536-dim), bypasses SDK |
| AI Provider Reorder | P34 | ✅ Complete | Priority: Gemini (primary) → DeepSeek (secondary) → OpenAI (fallback) |
| JSON Salvage Logic | P34 | ✅ Complete | Tolerates truncated LLM outputs in workouts, diet plans, coaching profiles |
| NutritionTab JSON Parsing | P34 | ✅ Complete | Priority-based parsing for Gemini native JSON format |
| VoiceAssistant Lip-Sync Fix | P34 | ✅ Complete | Avatar cleanup on speech stop, race condition prevention |
| LangGraph Gemini Content Array | P34 | ✅ Complete | Handles Gemini [{type, text}] response chunks |
| Health Correlation CTE Refactor | P34 | ✅ Complete | SQL CTE for cleaner sentiment + exercise correlation |
| GoalDecompositionService | P35 | ✅ Complete | AI-powered goal breakdown into habits/schedules/tricks, motivation-tier calibrated |
| MotivationTierService | P35 | ✅ Complete | Declared + computed + blended tiers, 6 engagement signals, 14-day rolling window |
| EngagementScoringJob | P35 | ✅ Complete | Weekly batch job, 5-factor score (login/accept/completion/depth/streak) |
| LifeGoalsController (expanded) | P35 | ✅ Complete | 19 new routes: milestones, check-ins, decomposition, actions, dashboard |
| LifeGoalsService (expanded) | P35 | ✅ Complete | Full CRUD for milestones, check-ins, goal actions, streak tracking |
| life_goal_milestones Table | P35 | ✅ Complete | Step-by-step targets with target dates/values, sort order |
| life_goal_checkins Table | P35 | ✅ Complete | Daily progress logging with mood (1-5), unique per goal per day |
| user_motivation_profiles Table | P35 | ✅ Complete | 3 tiers (declared/computed/active), 6 engagement scores, tier history |
| goal_actions Table | P35 | ✅ Complete | AI-generated actions (6 types), pillar mapping, response tracking |
| Life Score Metric | P35 | ✅ Complete | 5-component holistic score: health (40%) + goals (25%) + intentions (15%) + consistency (10%) + engagement (10%) |
| Proactive Messaging (6 new types) | P35 | ✅ Complete | life_goal_checkin/stalled/milestone/encouragement, intention_reminder/reflection |
| AISuggestionCard | P35 | ✅ Complete | Reusable card with accept/edit/skip, variants (card/compact/notification) |
| DailySuggestionsWidget | P35 | ✅ Complete | Dashboard widget showing top 3 pending AI actions |
| LifeGoalsStep | P35 | ✅ Complete | Onboarding: 4 questions → AI goal suggestions → user confirms |
| GoalsTab Life Goals | P35 | ✅ Complete | Dashboard life goals section with 13 category icons, check-in modal |
| Landing Life Goals/Tiers/Domains | P35 | ✅ Complete | 3 new landing sections showcasing life goals ecosystem |
| FAQ Page | P35 | ✅ Complete | New /faq route |
| Preferences Page | P35 | ✅ Complete | New /preferences route with settings |
| wellbeing.service.ts (expanded) | P35 | ✅ Complete | Client API for goals/milestones/checkins/actions/decomposition |
| wellbeing.ts Types (expanded) | P35 | ✅ Complete | 13 goal categories, MotivationTier, GoalAction, GoalDecomposition types |
| EmailEngineService | P36 | ✅ Complete | Core orchestrator: preferences check, logging, queue/inline delivery, 5 categories |
| EmailQueueService | P36 | ✅ Complete | BullMQ async email delivery with Redis fallback to inline sending |
| EmailContentGeneratorService | P36 | ✅ Complete | AI-powered weekly digests, coaching emails, re-engagement content |
| NotificationEngineService | P36 | ✅ Complete | Real-time Socket.IO + DB storage, deduplication (60s window), email triggers |
| EmailController | P36 | ✅ Complete | Preferences, analytics, one-click unsubscribe, admin logs, test send |
| EmailWorker | P36 | ✅ Complete | BullMQ worker: 3 concurrency, 10/s rate limit, RFC List-Unsubscribe headers |
| EmailDigestJob | P36 | ✅ Complete | Weekly digests (Sundays) + re-engagement (7+ days inactive), 6h interval |
| email_logs Table | P36 | ✅ Complete | Delivery tracking: status, provider, attempts, opened_at, clicked_at |
| email_preferences Table | P36 | ✅ Complete | Per-user per-category opt-in/out, frequency, unsubscribe tokens |
| proactive_messages Table | P36 | ✅ Complete | AI coach proactive message tracking with FK to messages/chats |
| digestSummary.ejs | P36 | ✅ Complete | Weekly digest email: highlights, coach's note, insights, next focus |
| coachingInsight.ejs | P36 | ✅ Complete | Coaching message email with personal greeting and CTA |
| NotificationDropdown | P36 | ✅ Complete | Header popover: 8 recent notifications, unread badge, mark all read |
| NotificationToast | P36 | ✅ Complete | Animated real-time toast: priority colors, type icons, dismissable |
| useNotifications Hook | P36 | ✅ Complete | React hook: counts, socket subscription, mark read, tab refetch |
| Semantic Tool Managers | P37 | ✅ Complete | ~10 managers (meal, goal, habit, workout, sleep, stress, hydration, lifeGoal, whoopAnalytics) replacing 163+ CRUD tools |
| WHOOP Rich Context | P37 | ✅ Complete | 7d avg, 30d baseline, trend directions, sleep stages, biometrics, recovery/strain ratio |
| Coaching Styles (brutal/pride) | P37 | ✅ Complete | brutal_honesty + fired_up_pride styles mapped to message types, relationship phase guards |
| Async Embedding Pipeline | P37 | ✅ Complete | storeMessage → fast INSERT → background embedding backfill via worker |
| LLM Provider Rate-Limiting | P37 | ✅ Complete | Runtime rate-limit tracking, auto-skip blacklisted providers, fallback chain |
| GoalsPageContent Redesign | P37 | ✅ Complete | Drag-drop (dnd-kit), goal cards, analytics, AI suggestions, bulk actions |
| WellbeingPageContent Redesign | P37 | ✅ Complete | Module grid, multi-day stats, trend badges, area charts, date filters |
| MoodPageContent Redesign | P37 | ✅ Complete | Stat cards, arc timeline, behavioral patterns, time-of-day, emotion frequency |
| EnergyPageContent Redesign | P37 | ✅ Complete | Energy stat cards, time-of-day breakdown, timeline, patterns, trends |
| SchedulePageContent Redesign | P37 | ✅ Complete | Week/month calendar, activity cards, category colors, grid/list toggle |
| ScheduleDetailPageContent Redesign | P37 | ✅ Complete | Workflow visualization, activity form, daily workflow graph |
| InsightsPageContent Redesign | P37 | ✅ Complete | Correlations, theme detection, cross-pillar insights, on-demand compute |
| 8 More Wellbeing Pages Redesigned | P37 | ✅ Complete | Breathing, stress, journal, habits, emotional check-in, soundscape pages |
| React Flow Schedule Workflows | P37 | ✅ Complete | Interactive nodes/edges with dark theme, custom WorkflowNode/Edge components |
| ModuleCard Component | P37 | ✅ Complete | Trend icons, gradient backgrounds, status badges, hover effects |
| On-Demand Insight Compute API | P37 | ✅ Complete | POST /wellbeing/insights/compute with configurable window |
| PremiumCircularMetric | P38 | ✅ Complete | 7-variant SVG arc system with arc-utils, variant selection by metric type |
| DoubleRingArc | P38 | ✅ Complete | Dual concentric rings with independent progress and glow effects |
| GlowEndpointArc | P38 | ✅ Complete | Arc with luminous endpoint dot and radial gradient glow |
| MultiRingArc | P38 | ✅ Complete | Multiple stacked rings for multi-metric visualization |
| SegmentedArc | P38 | ✅ Complete | Segmented arc with gap separators for discrete ranges |
| ThickGradientArc | P38 | ✅ Complete | Wide arc with smooth color gradient fill |
| TickMarkedArc | P38 | ✅ Complete | Arc with tick mark indicators along circumference |
| WaveArc | P38 | ✅ Complete | Animated wave-pattern arc with oscillation |
| ProgressTab Redesign | P38 | ✅ Complete | Stat cards with left accent bars, glow effects, enhanced visual hierarchy |
| PhotoComparisonWithAI Enhancement | P38 | ✅ Complete | ScoreRing component, MiniStat cards, analysis history tracking |
| ExerciseExecution Fullscreen Overlay | P38 | ✅ Complete | Fullscreen overlay layout replacing drawer pattern |
| Constellation Journal Enhancements | P38 | ✅ Complete | 300 micro-stars nebula background, shooting star animations, gradient headers |
| Food Photo AI Rules | P38 | ✅ Complete | Dish-level identification with 10 absolute rules, name extraction |
| LLM Auth Error Detection | P38 | ✅ Complete | isAuthError() detection + 24h provider blacklist in ModelFactory |
| Health Metrics Cache | P38 | ✅ Complete | 60s TTL caching in stats controller for health metrics |
| Water Cache Invalidation | P38 | ✅ Complete | Cache invalidation on water intake updates |
| Null Coalescing Migration | P38 | ✅ Complete | diet-plans.routes.ts `||` → `??` for 20+ null checks |
| Goal Categories Expansion | P38 | ✅ Complete | Added nutrition + fitness categories to shared goal types |
| MacroCircularChart Update | P38 | ✅ Complete | 3-level macro fallback cascade for nutrition display |
| UnifiedHealthDashboard Refactor | P38 | ✅ Complete | Migrated to PremiumCircularMetric variant system |
| LLM JSON Parser Utility | P39 | ✅ Complete | 5-stage parseLlmJson<T>() — strip fences → parse → regex → sanitize → repair |
| Journal Semantic Tools | P39 | ✅ Complete | journalManager (CRUD/streak) + voiceJournalManager in LangGraph with safe enum mapping |
| Tool Router Fuzzy Matching | P39 | ✅ Complete | Prefix-based keyword fallback for misspellings (min 4 chars) |
| Competitions Redesign | P39 | ✅ Complete | Minimal UI rewrite, CountdownPill (60s→1s), clean dark theme |
| Journal Schema Enhancement | P39 | ✅ Complete | checkin_id FK, journaling_mode (5 modes), ai_generated_prompt, date picker |
| Constellation MindCore Refinement | P39 | ✅ Complete | Orb 200→140px, 4→3 ripple rings, reversed sort order (oldest=innermost) |
| Admin Users Pagination Fix | P39 | ✅ Complete | Loading/fetching separation, hasLoadedOnce ref, memoized search |
| MusicManager Semantic Tool | P40 | ✅ Complete | 4 actions (play_activity, search_and_play, control, recommend), Spotify+Jamendo |
| Music Control Pipeline | P40 | ✅ Complete | ActionCommand → CustomEvent → MusicPlayerProvider listener for AI-driven playback |
| Instant Music Controls | P40 | ✅ Complete | Regex-based pause/next/volume bypass LLM for zero-latency response |
| Vision Coaching Service | P40 | ✅ Complete | Gemini Vision frame analysis, exercise detection, rep counting, posture corrections |
| VisionCoachingOverlay | P40 | ✅ Complete | Live overlay: exercise name, rep counter, attention badge, coaching toasts |
| Socket.IO Vision Events | P40 | ✅ Complete | vision:start/frame/stop/state/coaching/food/throttle/error event handlers |
| Multimodal Chat | P40 | ✅ Complete | imageBase64 in ChatRequest, HumanMessage [text, image_url] content arrays |
| Life History Table Guard | P40 | ✅ Complete | Cached isTableAvailable() — graceful pgvector-missing degradation |
| LangChain Package Upgrade | P40 | ✅ Complete | core→1.1.36, langgraph→1.2.6, openai→1.3.1, anthropic→1.3.25, langchain→1.2.37 |
| Vision Wellness Module | P41 | ✅ Complete | Ishihara color test (8 plates, 4s advance), 6 eye exercises, progress/streak tracking |
| ColorTestPlayer | P41 | ✅ Complete | 463-line SVG dot-matrix test with confusion palettes (protan/deutan/tritan) |
| EyeExerciseMode | P41 | ✅ Complete | 420-line guided exercises: focus shift, palming, 20-20-20, figure eight, clock gaze, near-far |
| VisionProgress | P41 | ✅ Complete | 501-line progress dashboard with score trends, test history, streak tracking |
| Plate Generator Engine | P41 | ✅ Complete | SVG dot-matrix rendering with difficulty scaling and confusion color palettes |
| Vision Scoring Engine | P41 | ✅ Complete | Time bonuses, difficulty multipliers, percentile ranking |
| Vision Backend | P41 | ✅ Complete | vision.service.ts (575 lines), controller (121 lines), 3 DB tables, validators |
| Intelligent Data Extraction | P41 | ✅ Complete | AI auto-logs meals/water/mood/energy/stress/exercise from every message |
| Smart Embedding Optimization | P41 | ✅ Complete | isWorthEmbedding() gate + storeMessagePair() batch INSERT (4→2 DB trips) |
| Data-Gap Proactive Messages | P41 | ✅ Complete | 3 new types: data_gap_dinner, data_gap_mood, data_gap_workout_feedback |
| Chat AI Response Pipeline | P41 | ✅ Complete | Message controller LangGraph trigger, typing indicators, sender info |
| Yoga Eye/Face/Desk/Breathwork | P41 | ✅ Complete | 4 new session types with DemoVideoModal and EyeExerciseAnimation |
| Spotify 403 Circuit Breaker | P41 | ✅ Complete | 3-strike threshold, 30-min auto-reset, Jamendo fallback preserved |
| Landing Cinematic Upgrade | P41 | ✅ Complete | CinematicScene, DepthLayer, ScrollParticles, parallax hooks, 3D hero entrance |
| Auto-Invoke Tool Fallback | P41 | ✅ Complete | Intent-based tool invocation for Gemini 0-token response recovery |
| Streak Service (master streak) | P45 | ✅ Complete | `streak.service.ts` — single master streak fed by any qualifying activity, freeze economy, midnight validation, tier progression, Socket.IO real-time |
| Streak Routes | P45 | ✅ Complete | `streak.routes.ts` — status, history, calendar heatmap, leaderboard endpoints |
| StreakWidget | P45 | ✅ Complete | Dashboard streak display with current/longest counts, at-risk warning |
| StreakCalendar | P45 | ✅ Complete | Calendar heatmap of active days |
| StreakFreezeControls | P45 | ✅ Complete | Freeze-economy UI for pausing streak |
| StreakMilestoneModal | P45 | ✅ Complete | Milestone celebration modal |
| Activity Status Service | P45 | ✅ Complete | `activity-status.service.ts` — status lifecycle (sick/traveling/vacation/injured), day-by-day reset, duration tracking |
| Status Intent Classifier | P45 | ✅ Complete | `status-intent-classifier.service.ts` — auto-detects status from AI coach conversations |
| Status Pattern Analyzer | P45 | ✅ Complete | `status-pattern-analyzer.service.ts` — learns recurring patterns (e.g., low-energy Mondays) |
| Status Plan Adjuster | P45 | ✅ Complete | `status-plan-adjuster.service.ts` — adjusts plans based on active status |
| Status Plan Generator | P45 | ✅ Complete | `status-plan-generator.service.ts` — generates status-appropriate plans (e.g., comfort food when sick) |
| Activity Status Routes | P45 | ✅ Complete | `activity-status.routes.ts` — status CRUD, history, picker endpoints |
| ActivityStatusPageContent | P45 | ✅ Complete | Full `/activity-status` page with calendar, timeline, config, stats, picker modal |
| StatusPill | P45 | ✅ Complete | Voice-assistant pill surfacing active status |
| StatusWidget | P45 | ✅ Complete | Dashboard overview widget for current status |
| Accountability Consent Service | P45 | ✅ Complete | `accountability-consent.service.ts` — consent capture for notifying friends/family/group |
| Accountability Trigger Service | P45 | ✅ Complete | `accountability-trigger.service.ts` — user-defined trigger conditions (missed-gym, inactivity, calorie excess) |
| Accountability Routes | P45 | ✅ Complete | `accountability.routes.ts` — consent, contacts, triggers endpoints |
| SocialAccountabilitySection | P45 | ✅ Complete | Dashboard section for managing social accountability contacts and triggers |
| AccountabilityTab | P45 | ✅ Complete | Dashboard tab consolidating contracts + social accountability |
| Accountability Contract Service | P45 | ✅ Complete | `accountability-contract.service.ts` — contract CRUD, condition evaluation, violation handling, pause/auto-renew |
| Contract Suggestion Service | P45 | ✅ Complete | `contract-suggestion.service.ts` — AI-suggested contract terms based on user goals |
| Accountability Contract Routes | P45 | ✅ Complete | `accountability-contract.routes.ts` — contract sign/pause/end/violation endpoints |
| ContractsPageContent | P45 | ✅ Complete | Full `/contracts` page for managing accountability contracts |
| ContractCard | P45 | ✅ Complete | Contract summary card (title, condition, penalty, status) |
| CreateContractModal | P45 | ✅ Complete | User-driven or AI-suggested contract creation flow |
| Buddy Suggestion Service | P45 | ✅ Complete | `buddy-suggestion.service.ts` — goal-similarity matching, in-chat suggestion → follow request → shared chat |
| BuddyProfileModal | P45 | ✅ Complete | Profile modal for prospective buddy with goal alignment |
| Coach Persona System | P47 | ✅ Complete | `coach-persona-prompt.service.ts` + dynamic prompting, `useCoachMood` hook, `coachPersonality` avatar lib, `CoachPersonaPicker` UI |
| Mental Health Guardrails | P47 | ✅ Complete | `mental-health-guardrail.service.ts` + table 127 (`mental-health-screening-events`); safety checks for sensitive coaching topics |
| Push Notification Service | P47 | ✅ Complete | Web Push with VAPID keys (`push-notification.service.ts`), `DesktopNotificationPrompt`, `NotificationSocketBridge`, `web-notifications.ts` |
| Communication Preferences | P47 | ✅ Complete | `communication-preferences.service.ts` + controller/routes + client `communication.service.ts`; per-channel user prefs |
| Data Source Integrations | P47 | ✅ Complete | `data-source-manager.service.ts` orchestrating Spotify, prayer-times, finance, holiday-calendar (tables 120–125); `data-source-sync.job.ts` |
| Cross-Domain Correlator | P47 | ✅ Complete | `cross-domain-correlator.service.ts` + `correlation-compute.job.ts` + table 122, `CorrelationDashboard` client view |
| Timing Profile System | P47 | ✅ Complete | `timing-profile.service.ts` + controller/routes + `timing-profile.job.ts` + table 118, smart-timing dashboard widget |
| Follow / Connection System | P47 | ✅ Complete | `user_follows` migration, follow controller/routes, `ConnectionsModal` UI, buddy/profile discovery |
| Google Calendar OAuth | P47 | ✅ Complete | Per-user OAuth (users provide Client ID/Secret), multi-calendar sync, `/api/integrations/oauth/callback/google` route, `/calendar/connected` success view |
| Voice Assistant Redesign | P47 | ✅ Complete | New modular UI: `AICoachTranscript`, `BottomControlBar`, `CameraPip`, `CiaBrandBadge`, `StatusPill`, `TopRightControls` |
| AI Coach Page Refactor | P47 | ✅ Complete | Extracted into `AICoachHeader`, `AICoachInput`, `AICoachMessages`, `AICoachSidebar`, `AICoachWelcome`, `MessageActions` with dedicated `useAICoach` hook |
| Life Areas Expansion | P47 | ✅ Complete | `LifeAreasOverviewTab`, `LifeAreasConnectionsTab`, `LifeAreaDetailDrawer`, `Edit/Delete` modals, `user-commitments-life-area` migration |
| Dashboard Overview Widgets | P47 | ✅ Complete | `LifeAreasOverviewWidget`, `ProactiveCoachOverviewWidget`, `SmartTimingOverviewWidget` with sub-tab utility |
| Chat Wallpaper & Settings | P47 | ✅ Complete | `ChatSettingsModal`, `useChatWallpaper` hook, 5 wallpaper assets |
| Schedule Activity Details | P47 | ✅ Complete | `ActivityDetailsDrawer`, calendar sync enhancements |
| Whoop Dashboard Polish | P47 | ✅ Complete | Redesigned `WhoopMetrics`, `WhoopOverview`, `DateRangePicker` |
| Storage Migration AWS → R2 | P47 | ✅ Complete | `.env.example` updated, Cloudflare R2 as primary object store |
| Shared Challenges | P47 | ✅ Complete | `shared-challenge.service.ts` + controller + `competition-invitations` table (126) |
| Achievement AI | P47 | ✅ Complete | `achievement-ai.service.ts` + `achievement-check.job.ts` + constraints migration |
| Dynamic Achievements | P47 | ✅ Complete | `dynamic-achievements.service.ts` — goal-adaptive achievement generation |
| Achievement Tree | P47 | ✅ Complete | `achievement-tree.service.ts` — hierarchical achievement progression |
| Goal Reconnection Engine | P47 | ✅ Complete | `goal-reconnection.service.ts` + `goal-reconnection.job.ts` + `reconnection.routes.ts` + table 117 |
| Obstacle Detection | P47 | ✅ Complete | `obstacle.service.ts` + `obstacle-detector.job.ts` + `obstacle.routes.ts` + table 116, `/obstacles` page |
| Intelligent Intervention Engine | P47 | ✅ Complete | `intelligent-intervention.service.ts` + `intervention-engine.job.ts` |
| Commitment Tracker | P47 | ✅ Complete | `commitment-tracker.service.ts` — daily pledge + commitment evaluation |
| Daily Pledge System | P47 | ✅ Complete | `daily-pledge.service.ts` — morning pledge → evening evaluation loop |
| Micro-Wins System | P47 | ✅ Complete | `micro-wins.service.ts` + `micro-wins.job.ts` — surfaces unnoticed small achievements |
| Variable Reward Engine | P47 | ✅ Complete | `variable-reward.service.ts` — randomized reinforcement for habit formation |
| Personality Mode System | P47 | ✅ Complete | `personality-mode.service.ts` — tone/style switching tied to coaching profile |
| User Classification | P47 | ✅ Complete | `user-classification.service.ts` + user-classification-tables migration — behavioral segmentation |
| Inconsistency Detection | P47 | ✅ Complete | `inconsistency-detection.service.ts` — cross-signal contradiction detection |
| Life-Area Intent Router | P47 | ✅ Complete | `life-area-intent-router.service.ts` + routes tests (`life-area-intent-router.test.ts`) |
| Life Areas System | P47 | ✅ Complete | `life-areas.service.ts` + `life-areas.routes.ts` + tables 116–117, life-areas drawer/tabs |
| Knowledge Graph | P47 | ✅ Complete | `knowledge-graph.service.ts` (2,405 lines) + `knowledge-graph.routes.ts` + `/knowledge-graph` page with react-sigma/graphology |
| Finance Module | P47 | ✅ Complete | `finance.service.ts` + `finance-tracking.service.ts` + `finance.routes.ts` + `/money-map` page + `20260402130000_add-finance-module.sql` + tables 107, 125 |
| Prayer Times Integration | P47 | ✅ Complete | `prayer-times.service.ts` + table 124 (`prayer_schedules`) feeding correlator |
| Holiday Calendar | P47 | ✅ Complete | `holiday-calendar.service.ts` + table 119 — Ramadan/holiday-aware coaching context |
| Smart Competition | P47 | ✅ Complete | `smart-competition.service.ts` — goal-similarity competition creation |
| Team Competition | P47 | ✅ Complete | `team-competition.service.ts` + `competition-stream.service.ts` — team-based competition support |
| Nutrition Learning | P47 | ✅ Complete | `nutrition-learning.service.ts` — per-user nutrition pattern learning |
| Nutrition Analysis | P47 | ✅ Complete | `nutrition-analysis.service.ts` + `nutrition-analysis.job.ts` — daily pattern analysis |
| Adaptive Calorie | P47 | ✅ Complete | `adaptive-calorie.service.ts` + adaptive-nutrition-tables migration — dynamic calorie targets |
| Auto Progress | P47 | ✅ Complete | `auto-progress.service.ts` — automatic milestone progression |
| Activity Ingestion | P47 | ✅ Complete | `activity-ingestion.service.ts` + `activity-events.routes.ts` + table 67 |
| Activity Automation | P47 | ✅ Complete | `activity-automation.service.ts` + activity-automation migrations + tables 66 |
| Activity Event Processor | P47 | ✅ Complete | Event processor started in `index.ts:481` for realtime activity stream |
| Health Profile Access Control | P47 | ✅ Complete | `health-profile-access.service.ts` + `add-health-profile-visibility.sql` migration |
| Safety Service | P47 | ✅ Complete | `safety.service.ts` + unit tests — coaching content safety checks |
| Subscription System | P47 | ✅ Complete | `subscription.service.ts` (Stripe v2025-12-15.clover) + `subscription-revenue.service.ts` + admin page + `seed-subscription-plans.ts` + `add-subscription-tables.sql` |
| Stripe Webhook | P47 | ✅ Complete | `webhooks/stripe.routes.ts` — signature-verified `constructEvent` + raw-body mount |
| Role & Permission System | P47 | ✅ Complete | `role.service.ts` + `permission.service.ts` + `admin-role.routes.ts` + tables 73–75, 77 + `ensure-admin-all-permissions.ts` |
| Contact Submissions | P47 | ✅ Complete | `contact.service.ts` + `contact.routes.ts` + `admin-contact.routes.ts` + table 69 |
| Help Articles | P47 | ✅ Complete | `help.service.ts` + `help.routes.ts` + `admin-help.routes.ts` + table 70 |
| Community Posts | P47 | ✅ Complete | `community.service.ts` + `community.routes.ts` + `admin-community.routes.ts` + tables 71, 68 |
| Blog System | P47 | ✅ Complete | `blog.service.ts` + `blog.routes.ts` + `admin-blog.routes.ts` + featured-image migration + `/blogs` page |
| Webinars | P47 | ✅ Complete | `webinar.service.ts` + `webinar.routes.ts` + `admin-webinar.routes.ts` + table 72 |
| Visitor Analytics | P47 | ✅ Complete | `visitor.service.ts` + `visitor.routes.ts` + `add-visitor-visits.sql` migration |
| Tenor GIF Picker | P47 | ✅ Complete | `tenor.service.ts` + client `gif-picker-react` integration in chat |
| Admin Analytics | P47 | ✅ Complete | `admin-analytics.service.ts` + `admin-analytics.routes.ts` — admin dashboards |
| Admin WHOOP Management | P47 | ✅ Complete | `admin-whoop.routes.ts` — admin-side WHOOP configuration |
| Tool Router | P47 | ✅ Complete | `tool-router.service.ts` — fuzzy keyword routing for LangGraph tools |
| Voice Assistant Redesign (extended) | P47 | ✅ Complete | `voice-schedule.service.ts` + `voice-session.service.ts` + `voice-calls.routes.ts` + `webrtc-signaling.service.ts` |
| Report Generation | P47 | ✅ Complete | `report-generation.service.ts` + `reports.routes.ts` + `weekly-report.service.ts` |
| Scoring & Daily Scores | P47 | ✅ Complete | `daily-health-metrics.service.ts` + `daily-scoring.job.ts` + table 68 + `scoring.routes.ts` |
| Correlation Engine | P47 | ✅ Complete | `correlation-engine.service.ts` — alternative correlation computation path |
| Testimonial System | P47 | ✅ Complete | `testimonial.service.ts` + `testimonial.routes.ts` + admin testimonials (P25) |
| Newsletter | P47 | ✅ Complete | `newsletter.service.ts` + admin newsletter page (P25) |
| Water Intake | P47 | ✅ Complete | `water-intake.service.ts` + `water.routes.ts` + `add-water-intake.sql` |
| WHOOP Stress | P47 | ✅ Complete | `whoop-stress.service.ts` — strain/stress derivation from WHOOP |
| WHOOP Data Service | P47 | ✅ Complete | `whoop-data.service.ts` — data normalization and fetch |
| Spotify Listening Tracker | P47 | ✅ Complete | `spotify-listening.service.ts` + table 123 — listening history persistence |
| Reminder Scheduler | P47 | ✅ Complete | `reminder-scheduler.service.ts` + `reminder-processor.job.ts` + table 28 |
| Stress Reminder Job | P47 | ✅ Complete | `stress-reminder.job.ts` — periodic stress check-in prompts |
| Embedding Queue | P47 | ✅ Complete | `embedding-queue.service.ts` + `wellbeing-embedding.job.ts` — async backfill |
| Alarm Sync | P47 | ✅ Complete | `alarm-sync.service.ts` + `alarm.routes.ts` — workout alarm sync |
| Shopping List | P47 | ✅ Complete | `shopping-list.service.ts` + `shopping-list.routes.ts` + table 25 + calories migration |
| Task Management | P47 | ✅ Complete | `task.service.ts` + `task.routes.ts` + table 29 |
| Schedule Context | P47 | ✅ Complete | `schedule-context.service.ts` — schedule-aware coaching context |
| Special Days | P47 | ✅ Complete | `special-days.service.ts` — birthdays, anniversaries, custom events |
| Competition Chat | P47 | ✅ Complete | `competition-chat.service.ts` + `competition-chat.routes.ts` + chat tables migration |
| Follow / Connections | P47 | ✅ Complete | `follow.service.ts` + `follow.routes.ts` + table 115 |
| OAuth Service | P47 | ✅ Complete | `oauth.service.ts` — centralized OAuth token exchange |
| SMS Service (mock mode) | P47 | 🟡 Partial | `sms.service.ts` — skeleton exists, Twilio integration is TODO |
| Summary Delivery | P47 | ✅ Complete | `summary-delivery.service.ts` — multi-channel summary dispatch |
| R2 Service | P47 | ✅ Complete | `r2.service.ts` — Cloudflare R2 presigned uploads (primary object store) |
| Nutrition Analysis Job | P47 | ✅ Complete | `nutrition-analysis.job.ts` — daily pattern analysis batch |
| Checkin Call Job | P47 | ✅ Complete | `checkin-call.job.ts` for scheduled coach check-ins |
| Entitlement Catalogs | P48 | ✅ Complete | `20260423100000_create_entitlement_catalogs.sql` — feature/credit catalog schema |
| Subscription Plans Extended | P48 | ✅ Complete | `20260423100100_extend_subscription_plans.sql` + `20260423100500_seed_starter_pro_premium_plans.sql` — Starter/Pro/Premium tiers |
| Plan-Scoped Tables | P48 | ✅ Complete | `20260423100200_create_plan_scoped_tables.sql` — per-plan feature maps |
| Credit System (DB) | P48 | ✅ Complete | `20260423100300_create_credit_tables.sql` — credit balances, grants, consumption |
| Entitlement Cache | P48 | ✅ Complete | `20260423100400_create_entitlement_cache.sql` — denormalized access lookup |
| Entitlement Service | P48 | ✅ Complete | `entitlement.service.ts` — plan-based feature gating, cache lookups, access checks |
| Credit Service | P48 | ✅ Complete | `credit.service.ts` — credit balance, consumption & grants for metered features |
| Entitlements API | P48 | ✅ Complete | `entitlements.controller.ts` + `entitlements.routes.ts` — REST for tier/feature/credit data |
| Entitlements Context (Client) | P48 | ✅ Complete | `app/context/EntitlementsContext.tsx` — tier/feature/credit state in React |
| Feature Gates | P48 | ✅ Complete | `components/gates/` — FeatureGate, PlanGate, CreditGate + hooks (useFeature, useCredits, usePaywall) + PaywallErrorBoundary |
| Paywall UI | P48 | ✅ Complete | `components/subscription/PaywallCard.tsx` + `UpgradeModal.tsx` — upsell surfaces |
| Subscription Stores | P48 | ✅ Complete | `stores/paywallStore.ts` + `walletStore.ts` — Zustand stores for paywall/wallet state |
| Analytics Helper | P48 | ✅ Complete | `lib/analytics.ts` — upgrade funnel event tracking |
| Icon Map | P48 | ✅ Complete | `lib/icon-map.ts` — consistent feature iconography |
| Schedule Workflow Builder | P48 | ✅ Complete | `ScheduleWorkflow.tsx` + `WorkflowNode.tsx` — canvas-based workflow builder with node graph |
| Schedule Time Conflict | P48 | ✅ Complete | `lib/schedule/time-conflict.ts` — overlap detection helper |
| Schedule Item Source | P48 | ✅ Complete | `20260422000000_schedule_items_source.sql` — provenance tracking for schedule items |
| Mood Rating | P48 | ✅ Complete | `20260421000000_add_mood_rating_to_mood_logs.sql` + `apply-mood-rating-migration.ts` — numeric mood scale |
| Journal Mind Constellation Redesign | P48 | ✅ Complete | `components/journal/constellation/` — MindConstellation, MindCore, SVGLines, EntryModal, ObservatoryHeader, FilterBar, MoodLegend, StarLayer, EmptyState |
| OAuth Callback Hardening | P48 | ✅ Complete | `app/api/integrations/oauth/callback/google/route.ts` + `spotify/route.ts` — refreshed error handling |
| Entitlement Middleware | P49 | ✅ Complete | `entitlement.middleware.ts` — requireTier/requireFeature/requireCredits guards with shadow/enforce-new/enforce-all modes |
| Wallet Backfill Migration | P49 | ✅ Complete | `20260423100600_backfill_wallets_and_trial_credits.sql` |
| Stripe Hardening Migration | P49 | ✅ Complete | `20260423100700_stripe_hardening.sql` |
| User Subscriptions Extension | P49 | ✅ Complete | `20260423100800_extend_user_subscriptions.sql` |
| Admin Overrides & Enterprise | P49 | ✅ Complete | `20260423100900_admin_overrides_and_enterprise.sql` |
| Promo/Audit/Abuse Tables | P49 | ✅ Complete | `20260423101000_promo_audit_abuse.sql` |
| Grace Expiration Job | P49 | ✅ Complete | `graceExpirationJob.ts` — expires lapsed grace-period subscriptions |
| Abuse Service | P49 | ✅ Complete | `abuse.service.ts` — velocity checks, device fingerprint, promo stacking detection |
| Stripe Webhook Service | P49 | ✅ Complete | `stripe-webhook.service.ts` — checkout.session.completed, invoice events, subscription lifecycle |
| Credit Service (expanded) | P49 | ✅ Complete | `credit.service.ts` — full ledger: grants, consumption, refunds, expiry, promo codes |
| Token Counter | P49 | ✅ Complete | `tokenCounter.ts` — tiktoken-based AI token metering |
| Entitlement Config | P49 | ✅ Complete | `env.config.ts` — shadow/enforce-new/enforce-all rollout modes |
| Route Middleware Wiring | P49 | ✅ Complete | requireTier/requireCredits on ai-coach, journal, rag-chatbot, transcription, TTS, voice-calls, emotional-checkin, call-summaries |
| Admin Billing Routes | P49 | ✅ Complete | `admin-billing.routes.ts` — admin billing management API |
| Me Credits Routes | P49 | ✅ Complete | `me-credits.routes.ts` — user credit balance/ledger API |
| CheckoutButton | P49 | ✅ Complete | `subscription/CheckoutButton.tsx` — Stripe checkout trigger |
| PlanComparisonTable | P49 | ✅ Complete | `subscription/PlanComparisonTable.tsx` — tier feature comparison |
| CreditLedgerTable | P49 | ✅ Complete | `subscription/CreditLedgerTable.tsx` — credit transaction history |
| CancelSubscriptionDialog | P49 | ✅ Complete | `subscription/CancelSubscriptionDialog.tsx` |
| LockedFeatureScreen | P49 | ✅ Complete | `subscription/LockedFeatureScreen.tsx` — paywall landing |
| PromoCodeInput | P49 | ✅ Complete | `subscription/PromoCodeInput.tsx` — promo code redemption |
| RemainingCreditsChip | P49 | ✅ Complete | `subscription/RemainingCreditsChip.tsx` — inline credit balance |
| TrialCountdownBanner | P49 | ✅ Complete | `subscription/TrialCountdownBanner.tsx` — trial expiry banner |
| WalletSummaryCard | P49 | ✅ Complete | `subscription/WalletSummaryCard.tsx` — wallet overview |
| PageAccessGate | P49 | ✅ Complete | `gates/PageAccessGate.tsx` — route-level plan enforcement |
| EntitlementsSocketBridge | P49 | ✅ Complete | `notifications/EntitlementsSocketBridge.tsx` — real-time entitlement sync |
| useNavEntitlement | P49 | ✅ Complete | `hooks/useNavEntitlement.ts` — nav visibility by plan |
| Admin Subscription Panels | P49 | ✅ Complete | 6 sub-pages: abuse, analytics, features, overrides, promotions, usage |
| Admin Components | P49 | ✅ Complete | AbuseSignalBadge, EntityMatrix, OverrideDialog |
| Upgrade Page | P49 | ✅ Complete | `/upgrade` — plan comparison + checkout |
| Billing Page | P49 | ✅ Complete | `/settings/billing` + `/billing/credits` |
| Locked Page | P49 | ✅ Complete | `/locked/[pageKey]` — feature gate landing |
| Exercise Import/Export | P49 | ✅ Complete | ImportExercisesModal + CSV/JSON parser utils |
| Database Config Consolidation | P50 | ✅ Complete | `config/database.config.ts` — single source of truth for pool/query, migrated from `database/pg.ts`, 280+ files updated |
| Configurable Pool Settings | P50 | ✅ Complete | DB_POOL_MAX (30), DB_IDLE_TIMEOUT_MS, DB_CONNECTION_TIMEOUT_MS (5s), DB_STATEMENT_TIMEOUT_MS (15s) via env vars |
| LangGraph Tool Domain Extraction | P50 | ✅ Complete | `services/langgraph-tools/` — 16 domain modules (body-images, goals, habits, health-data, notifications, nutrition, plans, progress, reminders, schedule, shopping-list, status-history, user-preferences, water-intake, wellbeing, workout) with registry and types |
| Leaderboard SVG Navigation | P50 | ✅ Complete | SVG-based tab icons replacing Lucide icons for Leaderboard, Around Me, Competitions |
| OrbitalBackground | P50 | ✅ Complete | `leaderboard/components/OrbitalBackground.tsx` — animated orbital background effect |
| ScoreBreakdownBars | P50 | ✅ Complete | `leaderboard/components/ScoreBreakdownBars.tsx` — visual score component breakdown |
| Paginated Competitions | P50 | ✅ Complete | Server-side pagination for competitions list with page controls |
| All-Time Around Me | P50 | ✅ Complete | Around-me view supports all-time leaderboard in addition to daily/weekly |
| Admin Customer Subscriptions | P50 | ✅ Complete | `admin/subscriptions/customers/` — customer subscription management page with shared types |
| PaginationBar Component | P50 | ✅ Complete | `components/ui/pagination-bar.tsx` — reusable pagination component |
| Test Helpers Infrastructure | P50 | ✅ Complete | `tests/helpers/` — mock-db, mock-services, factories, controller-harness, cleanup/entitlement/subscription test utilities |
| Controller Unit Tests | P50 | ✅ Complete | 9 test files: auth, chat, entitlements, health, notifications, scoring, streak, subscription, user controllers |
| Middleware Unit Tests | P50 | ✅ Complete | 7 test files: auth, entitlement, error, rateLimiter, requestId, upload, validate middlewares |
| Service Unit Tests (expanded) | P50 | ✅ Complete | 11 new test files: credit, crisis-detection, entitlement, follow, gamification, model-factory, notification, schedule, streak, subscription, user services |
| Validator Unit Tests | P50 | ✅ Complete | 25 test files covering accountability-contract, admin-exercise, admin-testimonial, ai-coach, assessment, blog, community, contact, email, exercise, finance, follow, help, integration, knowledge-graph, life-areas, newsletter, preferences, role, streak, stress, subscription, user, vision, webinar, yoga-coach, yoga validators |
| Integration Tests | P50 | ✅ Complete | 6 test files: admin-billing, credits, entitlements, stripe-webhook, subscription-state-machine, subscription integration tests |
| Tool Entitlements Config | P51 | ✅ Complete | `config/tool-entitlements.config.ts` — per-tool tier/credit cost mapping |
| Tool Audit Service | P51 | ✅ Complete | `tool-audit.service.ts` — execution logging with latency, token usage, errors |
| Tool Execution Wrapper | P51 | ✅ Complete | `tool-execution-wrapper.service.ts` — entitlement check → audit → metrics pipeline |
| Tool Metrics Service | P51 | ✅ Complete | `tool-metrics.service.ts` — aggregated tool usage stats for admin dashboard |
| Admin Tools Routes | P51 | ✅ Complete | `admin-tools.routes.ts` — admin API for tool audit logs and metrics |
| Chat Performance Indexes | P51 | ✅ Complete | `20260427000000_add_chat_performance_indexes.sql` |
| Entitlement Shadow Log | P51 | ✅ Complete | `20260427000001_entitlement_shadow_log.sql` |
| Tool Audit Log Table | P51 | ✅ Complete | `20260427100000_tool_audit_log.sql` |
| Sleep Logs Table | P51 | ✅ Complete | `20260427100001_sleep_logs.sql` |
| User Medications Table | P51 | ✅ Complete | `20260427100002_user_medications.sql` |
| Calendar Domain Manager | P51 | ✅ Complete | `langgraph-tools/domains/calendar.ts` — calendar semantic tool for LangGraph |
| LangGraph Tool Registry | P51 | ✅ Complete | Updated registry with calendar domain + tool-governance integration |
| Admin Premium Components | P51 | ✅ Complete | `components/admin/premium/` — DataTable, FilterBar, FormModal, MetricCard, SegmentedControl, StatusBadge |
| Invoice PDF Generator | P51 | ✅ Complete | `lib/invoice-pdf.ts` — client-side invoice generation |
| Admin Tokens Utility | P51 | ✅ Complete | `lib/admin-tokens.ts` — admin design token system |
| Auth Improvements | P51 | ✅ Complete | SignInPageContent, use-auth hook, lib/auth refinements |
| Boneyard Config | P51 | ✅ Complete | `boneyard.config.json` — dead code tracking |
| Controller Tests (expanded) | P51 | ✅ Complete | 16 new test files: achievements, activity, assessment, community, competitions, contact, emotional-checkin, finance, follow, integration, leaderboard, plan, preferences, report, schedule, stats |
| Job Tests | P51 | ✅ Complete | 14 new test files: achievement-check, coach-profile-generation, competition-auto-create, daily-analysis, daily-scoring, data-source-sync, email-digest, engagement-scoring, exercise-sync, goal-reconnection, leaderboard-materialization, nutrition-analysis, schedule-automation, streak-validation |
| Tool Governance Tests | P51 | ✅ Complete | 4 test files: tool-audit, tool-execution-wrapper, tool-metrics, tool-router + tool-entitlements config test |
| Reasoning Graph System | P52 | ✅ Complete | `services/reasoning-graph/` — feature-node-registry, feature-state, graph-context, graph-event-emitter, graph-validation, next-best-action, state-propagation |
| Reasoning Graph Types | P52 | ✅ Complete | `shared/types/domain/reasoning-graph.ts` — graph node, edge, state types |
| Tool Transaction Service | P52 | ✅ Complete | `services/tool-transaction.service.ts` — atomic tool execution with rollback |
| User Files Service | P52 | ✅ Complete | `services/user-files.service.ts` — file management for user uploads |
| Proactive Event Triggers | P52 | ✅ Complete | `services/proactive-event-triggers.service.ts` — event-driven proactive messaging |
| LangGraph Artifacts Domain | P52 | ✅ Complete | `services/langgraph-tools/domains/artifacts.ts` — artifact management tool |
| LangGraph Files Domain | P52 | ✅ Complete | `services/langgraph-tools/domains/files.ts` — file operations tool |
| LangGraph Finance Domain | P52 | ✅ Complete | `services/langgraph-tools/domains/finance.ts` — finance semantic tool |
| AI Coach Agent Timeline | P52 | ✅ Complete | `ai-coach/components/AgentTimeline.tsx` — step-by-step agent reasoning display |
| AI Coach Artifact Card | P52 | ✅ Complete | `ai-coach/components/ArtifactCard.tsx` — rich artifact rendering |
| AI Coach Check-In Card | P52 | ✅ Complete | `ai-coach/components/CheckInCard.tsx` — proactive check-in UI |
| AI Coach Files Panel | P52 | ✅ Complete | `ai-coach/components/FilesPanel.tsx` — user file management panel |
| Knowledge Graph Health Card | P52 | ✅ Complete | `knowledge-graph/components/GraphHealthCard.tsx` — graph health metrics |
| DB Migration: Reasoning Graph | P52 | ✅ Complete | `20260428000000_reasoning_graph.sql` — reasoning graph tables |
| DB Migration: Tool Operations | P52 | ✅ Complete | `20260428100000_tool_operations.sql` — tool operation tracking |
| DB Migration: Coach Personas | P52 | ✅ Complete | `20260428200000_expand_coach_personas.sql` — expanded persona fields |
| DB Migration: User Files | P52 | ✅ Complete | `20260428300000_user_files.sql` — user file storage |
| DB Migration: Proactive Check-ins | P52 | ✅ Complete | `20260428400000_proactive_check_ins.sql` — check-in scheduling |
| DB Migrate-Seed Script | P52 | ✅ Complete | `scripts/db-migrate-seed.ts` — combined migration + seeding utility |
| Dockerfile.db-migrate-seed | P52 | ✅ Complete | Standalone container for DB migration + seed |
| Message Type Classifier | P53 | ✅ Complete | `services/message-type-classifier.service.ts` — synchronous first-stage classifier for fast-path routing |
| Chatbot Metrics Service | P53 | ✅ Complete | `services/chatbot-metrics.service.ts` — in-memory TTFT, intent accuracy, tool selection observability |
| Coaching Profile Cache | P53 | ✅ Complete | `services/user-coaching-profile.service.ts` — 10min in-memory TTL cache with non-blocking background refresh |
| Crisis Detection Fast Path | P53 | ✅ Complete | `services/crisis-detection.service.ts` — synchronous keyword pre-check to skip expensive LLM calls |
| LangGraph Chatbot Refactor | P53 | ✅ Complete | `services/langgraph-chatbot.service.ts` — integrated classifier, metrics, cached profiles for reduced TTFT |
| Tool Router Expansion | P53 | ✅ Complete | `services/tool-router.service.ts` — new tools in workout, schedule, progress, shopping, reminders, general groups |
| Tool Definitions Map | P53 | ✅ Complete | `services/langgraph-tools/registry.ts` — getDefinitionsMap() for intent-aware tool filtering |
| Schema Description Improvements | P53 | ✅ Complete | `services/langgraph-semantic-tools.service.ts` — improved Zod descriptions for meal, workout, recipe managers |
| Reasoning Graph Data Source Fixes | P53 | ✅ Complete | `services/reasoning-graph/feature-node-registry.ts` — 8 data source table names corrected |
| Feature State User Column Overrides | P53 | ✅ Complete | `services/reasoning-graph/feature-state.service.ts` — author_id override for community tables |
| Auto-Migrate Reasoning Tables | P53 | ✅ Complete | `database/auto-migrate.ts` — reasoning graph tables added to expected list |
| Streak Disruption Query Fix | P53 | ✅ Complete | `services/status-pattern-analyzer.service.ts` — NOT EXISTS subquery replacing incorrect JOIN |
| Client Type Extensions | P53 | ✅ Complete | Violet accent, BuddySuggestion.suggestedChallenge, LifeAreasDashboardSummary, exercise bulk import |
| Tool Resolution Fallback | P54 | ✅ Complete | `services/langgraph-chatbot.service.ts` — full-cache fallback when intent-filtered set misses a valid tool |
| Action Alias Normalization | P54 | ✅ Complete | `services/langgraph-chatbot.service.ts` — log/add/record→create, remove→delete, list/show→get, find/search→getByName |
| MealManager Description Fix | P54 | ✅ Complete | `services/langgraph-semantic-tools.service.ts` — explicit log/add→create mapping in tool description |
| Pool Export | P54 | ✅ Complete | `config/database.config.ts` — direct pool instance export + Error type fix on handler |
| Entitlement Enforcement Config | P54 | ✅ Complete | `config/env.config.ts` — ENTITLEMENT_ENFORCEMENT_MODE (shadow/enforce-new/enforce-all) + rollout start date |
| Check-In Call Purpose | P54 | ✅ Complete | `types/voice-call.types.ts` — added 'check_in' to CallPurpose union |
| Checkin Job Cleanup | P54 | ✅ Complete | `jobs/checkin-call.job.ts` — removed invalid initiator_source field from payload |

---

## INFRASTRUCTURE SUMMARY

| Metric | Count |
|--------|-------|
| Server Services | 177 |
| API Routes | 92 route files |
| Database Tables | 138 table SQL files |
| Controllers | 72 |
| Background Jobs | 34 |
| SQL Migrations | 85 |
| Client Pages | 95 (`page.tsx`) |
| Client Components | 999 `.tsx` files |
| Client Shared Services | 34+ |
| Avatar Animation Modules | 5 (vrmPoses, emotionModulation, microExpressions, vrmMappings, smoothing) |
| Server Unit Test Files | 69 |
| Server Integration Test Files | 19 |
| Client Test Files | 258 |
| DB Indexes (table files) | 491 `CREATE INDEX` |

---

## TECHNICAL DECISIONS

| Decision | Rationale | Date |
|----------|-----------|------|
| PostgreSQL over SQLite | Production-grade, concurrent access, JSON types | 2025-12-20 |
| Express 5 separate backend | API flexibility, clustering support | 2025-12-20 |
| Client/server monorepo | Next.js frontend + Express API in one repo | 2025-12-20 |
| Next.js 15 | App Router, SSR/SSG, production-ready | 2025-12-20 |
| Tailwind CSS v4 | Inline theme, dark mode, utility-first | 2025-12-20 |
| React hooks for state | Simple for MVP, Zustand later if needed | 2025-12-20 |
| App Router routing | File-based, layouts support | 2025-12-20 |
| Conversation-first design | Unique UX with accessible dashboard features | 2025-12-20 |
| R2 for file storage | Cloudflare R2 for images and documents | 2025-12-23 |
| Dynamic progress calculation | Ensures accuracy regardless of stored value | 2025-12-23 |
| Notification service pattern | Centralized, reusable, easily testable | 2025-12-23 |
| Separate SQL queries for stats | Avoids column ambiguity, easier to maintain | 2025-12-23 |
| Tab-based dashboard | Better organization, reduces page navigation | 2025-12-23 |
| Dynamic routing for plans | Flexible plan detail pages with [id] param | 2025-12-23 |
| Auto-migrate on startup | Ensures database is always up-to-date | 2025-12-23 |
| Socket.io for real-time | Reliable WebSocket with fallback | 2026-01-12 |
| LangGraph for AI | Structured reasoning with tool-based agents | 2026-01-12 |
| BullMQ for background jobs | Redis-backed, reliable processing | 2026-02-04 |
| SVG mask for tour spotlight | Avoids CSS mix-blend-mode conflicts with glassmorphism | 2026-02-19 |
| React Portal for tour overlay | Ensures z-index stacking above all dashboard content | 2026-02-19 |
| localStorage-first tour persistence | Fire-and-forget backend sync for resilience | 2026-02-19 |
| SAVEPOINT-based batch upsert | Per-exercise savepoints in exercise ingestion for partial failure recovery | 2026-02-20 |
| Greedy plate calculator algorithm | Largest-first plate selection for barbell weight calculation | 2026-02-20 |
| ESM jest.unstable_mockModule | All integration tests use ESM-compatible mocking with dynamic imports | 2026-02-20 |
| Exercise library search-based linking | Execution drawer fetches library data by name search, no FK required | 2026-02-20 |
| Dual-track competition auto-creation | Daily (1-day) and challenge (3/7/15-day) tracks run independently so long competitions never block dailies | 2026-02-23 |
| Graceful scoring pipeline fallback | Missing DB tables (nutrition_user_preferences) don't crash scoring — fall back to heuristic scores | 2026-02-23 |
| Always-materialize leaderboard strategy | ensureScoresExist always materializes + updateRanks even when scores pre-exist from daily job | 2026-02-23 |
| Cached context pattern for proactive messaging | Fetch comprehensive context once per user, pass via optional `cachedContext?` param with `??` fallback — 95% query reduction | 2026-02-24 |
| Dual-model LLM strategy for proactive messages | Gemini primary for standard messages, gpt-4o for coaching analysis/briefings/recovery — balances cost vs quality (updated P34: Gemini-first) | 2026-02-24 |
| 2-hour minimum message gap | Prevents proactive message spam — max 1 message every 2 hours per user | 2026-02-24 |
| Comprehensive context for voice greetings | Voice assistant fetches full user context (WHOOP, score, streak, goals) for data-aware greetings instead of basic recent activity | 2026-02-24 |
| Snapshot-based delta detection | Store lightweight JSON snapshot at session start, compare to previous on next visit — 6 parallel SQL queries, no LLM needed for change detection | 2026-02-25 |
| Score-and-rank message routing | Replace 18 sequential checkAndSend calls with scored candidates sorted by impact — only top 2-3 sent per cycle. Base scores (85→10) plus context multipliers | 2026-02-25 |
| Longitudinal adherence with accountability escalation | 7d vs 30d adherence comparison with trend detection; 14+ consecutive low days auto-forces tough_love tone | 2026-02-25 |
| Cross-domain daily analysis engine | Deterministic rule engine detects 8 pattern types across fitness/nutrition/wellbeing/WHOOP, single LLM call enriches into structured coaching directives | 2026-02-25 |
| Server component wrappers for SEO | All pages split into server component (metadata, JSON-LD) + client PageContent — preserves interactivity while enabling SSR SEO | 2026-03-02 |
| Batch query pattern for messages | Replace N+1 sequential queries with batch queries using PostgreSQL ANY() — 300 queries reduced to 7 | 2026-03-02 |
| Fire-and-forget for non-blocking ops | markChatAsRead uses .then() instead of await to avoid blocking message rendering | 2026-03-02 |
| Deterministic coach emotional state | Pure computation (no LLM) maps adherence scores, risk flags, streaks, goals to coach emotions — zero cost, instant, consistent | 2026-03-04 |
| Phase-based relationship depth | Voice adaptation based on daysOnPlatform (new→building→established→deep) rather than interaction count — simpler, more predictable | 2026-03-04 |
| Micro-expression engine for avatar | Class-based engine with weighted random selection, attack/release curves, min interval — adds involuntary emotion leaks during speech | 2026-03-04 |
| Rest quats before vrmRef pattern | Cache bone quaternions BEFORE making VRM visible to RAF loop — prevents race condition where animation sees VRM without valid rest state | 2026-03-04 |
| Modal relative positioning | Voice assistant modal uses relative+absolute instead of fixed — allows proper height containment (80vh) and responsive sizing | 2026-03-04 |
| SQL-based behavioral pattern detection | Pure SQL aggregation + window functions for mood pattern detection — no LLM needed, fast, deterministic, cost-free | 2026-03-09 |
| Dual check-in types (morning/evening) | Changed uniqueness from (user_id, date) to (user_id, date, type) — enables prediction-vs-actual comparison | 2026-03-09 |
| Fire-and-forget lesson extraction | Evening review doesn't wait for Claude Haiku lesson extraction — async .then() pattern keeps UX snappy | 2026-03-09 |
| Spaced repetition for lessons | Confirmed lessons >2 weeks old reminded if not reminded in 7 days — random 3 sampling prevents fatigue | 2026-03-09 |
| Expanded mood emoji enum with trigger tracking | 6→13 emojis + transition_trigger + trigger_category enables mood arc analysis without breaking existing logs | 2026-03-09 |
| Deterministic contradiction detection | 22 rule functions with threshold-based severity — no LLM needed for detection, only for AI correction suggestions | 2026-03-10 |
| SQL-based health correlations | Pure SQL window functions for 6 correlation patterns — fast, deterministic, zero API cost | 2026-03-10 |
| Cascading LLM model factory | Gemini (primary) → Anthropic → DeepSeek → OpenAI fallback chain with 3 tiers (default/reasoning/light) for cost optimization | 2026-03-10 |
| Two-stage theme detection | Stage A: per-entry LLM extraction (fire-and-forget), Stage B: aggregate SQL analysis in background job — separates real-time from batch | 2026-03-10 |
| Voice journal conversation loop | Record → transcribe (AssemblyAI) → AI responds → user continues → summarize → approve — creates journal entry from conversation | 2026-03-10 |
| Prediction accuracy feedback loop | Daily job compares yesterday's predictions with today's actuals — upsert pattern for continuous accuracy tracking | 2026-03-10 |
| Dual music source (Spotify + Jamendo) | Spotify OAuth for connected users, Jamendo CC-licensed fallback — ensures music always available without premium requirement | 2026-03-11 |
| Activity-to-audio-feature mapping | 8 activity categories mapped to Spotify audio features (energy, tempo, valence, instrumentalness) for scientifically-matched recommendations | 2026-03-11 |
| PKCE OAuth for Spotify | Proof Key for Code Exchange prevents authorization code interception, more secure than basic OAuth | 2026-03-11 |
| Persistent HTML5 audio element | Audio element never unmounts, maintaining playback across page navigation | 2026-03-11 |
| Yoga phase state machine | Hook-based state machine (idle→loading→playing→paused→complete) with automatic phase progression via 1s intervals | 2026-03-11 |
| Ambient theme gradients | 6 yoga ambient themes (forest, ocean, mountain, night, sunrise, space) with unique gradient color schemes for immersive sessions | 2026-03-11 |
| 14-type milestone system | Automatic milestone checking on yoga session completion — streak (3/7/14/30d), count (10/30/50/100), duration (100/500/1000min), first-time achievements | 2026-03-11 |
| Gemini Vision for pose coaching | Frame-by-frame analysis via Gemini 2.5-flash Vision — 8s capture interval with joint angles and coaching persona (Coach Maya) | 2026-03-12 |
| MediaPipe client-side body detection | Browser-based landmark detection with joint angle calculation — no server round-trip for skeleton, only for coaching | 2026-03-12 |
| Daily digest embedding pattern | Aggregate 13 data sources into natural language digest, embed with Gemini 768-dim vectors — enables semantic search over complete user health history | 2026-03-12 |
| YouTube nocookie embeds | Privacy-safe youtube-nocookie.com iframe embeds for tutorial videos — 24h server-side caching | 2026-03-12 |
| Gemini-first AI provider strategy | All AI calls prioritize Gemini (REST direct), DeepSeek secondary, OpenAI last-resort — reduces cost, improves latency | 2026-03-13 |
| Direct REST over SDK for Gemini | Bypass @google/generative-ai SDK — direct HTTP calls to Gemini API for vision, text, and embeddings enable finer control and smaller bundle | 2026-03-13 |
| JSON salvage for truncated LLM output | Auto-close incomplete JSON (braces/brackets) from truncated AI responses — prevents feature breakage in workouts, diet plans, coaching profiles | 2026-03-13 |
| Gemini-embedding-2-preview (1536-dim) | Upgraded from text-embedding-004 (768d) to gemini-embedding-2-preview (1536d) with task type support (retrieval, similarity, classification) | 2026-03-13 |
| Motivation tier blending (declared + computed) | User self-reports tier, AI computes from 14-day behavior — blended active_tier drives personalization. Tier history tracked for debugging. | 2026-03-18 |
| On-demand goal decomposition | AI breaks down goals only when user triggers /decompose — not automatic on creation, respects user agency | 2026-03-18 |
| 5-factor engagement scoring | login_frequency (25%) + suggestion_accept (30%) + task_completion (25%) + session_depth (10%) + streak_consistency (10%) — weekly batch recalculation | 2026-03-18 |
| Life Score holistic metric | 5-component 0-100 score: health (40%) + goal_progress (25%) + intention_fulfillment (15%) + consistency (10%) + engagement (10%) | 2026-03-18 |
| 13 life goal categories | Beyond health: faith, career, finances, relationships, education, personal_growth, creative, productivity, social, spiritual, happiness, anxiety_management, health_wellness | 2026-03-18 |
| Layered email architecture | EmailEngine → EmailQueueService → EmailWorker → Mail helper. Preferences checked at enqueue AND delivery time. Redis fallback to inline. | 2026-03-19 |
| Per-category email preferences | 5 categories (transactional/engagement/digest/coaching/marketing), transactional non-disableable. One-click unsubscribe tokens per user+category. | 2026-03-19 |
| Notification deduplication (60s window) | NotificationEngine prevents duplicate notifications per user+type+entity within 60 seconds | 2026-03-19 |
| AI-generated email content | LLM generates personalized weekly digests + coaching emails + re-engagement win-back content with fallback templates | 2026-03-19 |
| Semantic tool managers over CRUD proliferation | Collapse 163+ individual CRUD tools into ~10 semantic managers with action parameters — 60% reduction in LLM tool inventory | 2026-03-24 |
| Async embedding pipeline (store-then-embed) | Fast INSERT for messages, background embedding backfill via worker — non-blocking chat storage | 2026-03-24 |
| Runtime LLM provider rate-limiting | ModelFactory tracks rate limits per provider, auto-skips blacklisted providers, returns next available in fallback chain | 2026-03-24 |
| WHOOP 7d/30d trend context | Pre-computed 7d averages, 30d baselines, and trend directions (improving/stable/declining) injected into AI coach system prompt | 2026-03-24 |
| Coaching style mapping to message types | brutal_honesty for low scores, fired_up_pride for achievements, tough_love for stalls — with 3-day new-user guard | 2026-03-24 |
| Variant-based circular metrics | 7 SVG arc variants (DoubleRing, GlowEndpoint, MultiRing, Segmented, ThickGradient, TickMarked, Wave) selected by metric type — reusable across dashboard | 2026-03-25 |
| 3-level macro fallback cascade | Nutrition macros: meal-level → daily-level → zero-safe defaults for consistent display | 2026-03-25 |
| LLM auth error 24h blacklist | ModelFactory detects 401/403 auth errors, blacklists provider for 24h, continues fallback chain | 2026-03-25 |
| Cache invalidation on mutation | Water routes invalidate health metrics cache on updates — pattern for write-through cache consistency | 2026-03-25 |
| Null coalescing over logical OR | Systematic `||` → `??` migration for numeric/boolean values to prevent 0/false being treated as falsy | 2026-03-25 |
| Shared LLM JSON parser | 5-stage pipeline (strip fences → parse → regex extract → sanitize → repair truncated) replaces per-service inline parsing — single source of truth | 2026-03-27 |
| Journal enum alias table | Map 40+ freeform category strings to 15 valid PostgreSQL enums via alias lookup — prevents constraint violations from LLM outputs | 2026-03-27 |
| Fuzzy keyword routing fallback | Tool router uses prefix-based matching (min 4 chars) when exact keywords miss — handles typos without extra LLM round-trip | 2026-03-27 |
| CountdownPill over CountdownTimer | 60s interval vs 1s interval for competition countdowns — 60x fewer re-renders, no visual difference for hour+ timescales | 2026-03-27 |
| AI-to-player music bridge via CustomEvent | musicManager tool → suggestedAction → ActionHandler dispatches `music:command` CustomEvent → MusicPlayerProvider listener — decoupled, no prop drilling | 2026-03-27 |
| Regex-based instant music controls | Bypass LLM tool round-trip for simple commands (pause/next/volume) — regex match → immediate ActionCommand → instant response | 2026-03-27 |
| Vision coaching via Socket.IO | Real-time frame streaming (vision:frame) over WebSocket instead of REST — lower latency, backpressure via isProcessing flag, adaptive throttling | 2026-03-27 |
| Cached table availability check | Life history service queries information_schema once, memoizes result — avoids repeated 42P01 errors when pgvector not installed | 2026-03-27 |
| Multimodal HumanMessage for vision | Camera frames sent as [text, image_url] content array in LangGraph — Gemini processes inline, system prompt declares camera capability | 2026-03-27 |
| Ishihara SVG dot-matrix plates | Client-side plate generation with confusion color palettes (protan/deutan/tritan) — no image assets, pure SVG, difficulty-scaled | 2026-03-31 |
| Intelligent data extraction in system prompt | AI coach auto-logs meals/water/mood/stress/exercise from every message without asking — macro estimation from nutrition knowledge | 2026-03-31 |
| Embedding worthiness gate | isWorthEmbedding() skips messages <40 chars or matching SKIP_EMBED_PATTERNS (acknowledgements, commands) — saves embedding API calls | 2026-03-31 |
| Batched message pair INSERT | storeMessagePair() inserts user+assistant in single SQL — 4 DB round-trips → 2, with individual INSERT fallback on error | 2026-03-31 |
| Data-gap proactive messages | Conversational data gathering (dinner/mood/workout feedback) scored at 20-25 base — lower than coaching messages, time-window gated | 2026-03-31 |
| Spotify 403 circuit breaker | 3-strike failure counter with 30-min auto-reset — prevents repeated 403 calls for non-approved app quotas, Jamendo fallback | 2026-03-31 |
| Auto-invoke tool by intent | When Gemini returns 0 output tokens, map detected intent to default tool invocation — prevents empty responses for clear user requests | 2026-03-31 |
| Chat AI typing indicators | setImmediate + Socket.IO typing/stopTyping events give real-time feedback during LangGraph processing in message controller | 2026-03-31 |
| Database config consolidation | Merge `database/pg.ts` (255 lines) into `config/database.config.ts` as single source of truth — eliminates circular dependency risk, centralizes pool config with env-var tuning | 2026-04-24 |
| LangGraph tool domain extraction | Split monolithic `langgraph-tools.service.ts` into 16 domain modules with registry pattern — improved maintainability, lazy loading, type safety | 2026-04-24 |

---

## DEVELOPMENT COMMANDS

```bash
# Install all dependencies
cd apps/yhealth-app && npm run install:all

# Start client dev server
cd apps/yhealth-app/client && npm run dev

# Start server dev server
cd apps/yhealth-app/server && npm run dev

# Build client
cd apps/yhealth-app/client && npm run build

# Run server tests
cd apps/yhealth-app/server && npm test

# Run client tests
cd apps/yhealth-app/client && npm test
```

---

## KEY FILES

| Feature | Files |
|---------|-------|
| Client Pages | `client/app/(app)/`, `client/app/(pages)/` (82+ pages) |
| Client Components | `client/components/` (320+ components across 31 directories) |
| Product Tour | `client/components/common/product-tour/` (16 files + 10 test suites) |
| Exercise Library | `client/app/(pages)/exercises/` (library, detail, admin pages) |
| Exercise Execution | `client/app/(pages)/dashboard/components/tabs/workouts/` (drawer + plate calculator) |
| Avatar System | `client/lib/avatar/` (5 modules), `client/hooks/useThreeVrm.ts` |
| Landing Page | `client/components/landing/` (20+ section components + shared/) |
| Leaderboard | `client/app/(pages)/leaderboard/components/` (5 UI components) |
| Server Services | `server/src/services/` (138+ services) |
| Server Routes | `server/src/routes/` (102+ route files) |
| Server Controllers | `server/src/controllers/` (49+ controllers) |
| Database Migrations | `server/src/database/migrations/` |
| Shared Types | `shared/types/` |

---

## UNDOCUMENTED FEATURES

Features implemented in code that don't map to original E01-E10 epics:

| Feature | Backend | Frontend | DB Tables |
|---------|---------|----------|-----------|
| Chat & Real-time Messaging | chat.service.ts, message.service.ts, socket.service.ts | ChatContainer, ChatMessage, 15+ components | 6 tables |
| Gamification (XP/Levels) | gamification.service.ts | Dashboard tab | xp_transactions |
| Activity Automation | activity-automation.service.ts | Limited | 2 tables |
| Schedule Automation | schedule-automation.service.ts | Limited | DB table |
| Emotional Check-in System | 4 services (checkin, insights, questions, trends) | Components | emotional_checkins |
| Breathing Exercises | breathing.service.ts | Breathing component | breathing_tests |
| RAG Chatbot | rag-chatbot.service.ts, vector-embedding.service.ts | Chat UI | Vector indexes |
| Task Management | task.service.ts, task.controller.ts | UI | tasks table |
| Body Composition Tracking | body-images.controller.ts | Components | body_images |
| Exercise Library | exercise-ingestion.service.ts, exercises controller | Library pages, detail view, admin | exercises, exercise_media |
| Barbell Plate Calculator | N/A (client-only) | PlateCalculator component | - |
| Competitions & Leaderboard | competition.service.ts, leaderboard.service.ts | Leaderboard page, competition views | competitions, competition_entries, leaderboard_ranks |
| Motivational Content | motivational-video.service.ts | Components | motivational_videos |
| ElevenLabs TTS | elevenlabs.service.ts, tts.controller.ts | Voice UI | - |
| Camera Emotion Detection | camera-emotion.service.ts (TensorFlow) | Camera component | - |
| Testimonials System | testimonial.service.ts, admin-testimonial.controller.ts | Admin testimonials page, landing section | testimonials |
| Google Cloud TTS | google-cloud-tts.service.ts, tts.controller.ts | Voice customization panel | - |
| Proactive Messaging | proactive-messaging.service.ts, proactive-messaging.job.ts | N/A (push-based) | proactive_messages |
| AI Coach Pro Profiles | user-coaching-profile.service.ts, coach-profile-generation.job.ts | AI Coach profile API | user_coaching_profiles |
| Delta-Aware Conversations | user-delta.service.ts | Greeting + system prompt | user_engagement_sessions |
| Daily Analysis Engine | daily-analysis.service.ts, daily-analysis.job.ts | Coaching directives | daily_analysis_reports |
| Smart Message Routing | proactive-messaging.service.ts (scoreMessageCandidates) | N/A (job-internal) | - |
| Coach Emotional Intelligence | user-coaching-profile.service.ts (computeCoachEmotionalState, computeRelationshipDepth) | Avatar expression mapping (vrmMappings.ts) | user_coaching_profiles |
| LLM Circuit Breaker | llm-circuit-breaker.service.ts | N/A (server-internal) | - |
| Micro-Expression System | N/A (client-only) | microExpressions.ts, useThreeVrm.ts | - |
| Newsletter Subscriptions | newsletter.service.ts, newsletter.controller.ts | Admin newsletter page | newsletter_subscriptions |
| Behavioral Pattern Detection | behavioral-pattern.service.ts | BehavioralPatternBadges | mood_behavioral_patterns |
| Lessons Learned System | lessons-learned.service.ts, lessons-learned.controller.ts | LessonsLearned, LessonReminderBanner | lessons_learned |
| Morning/Evening Check-in Loop | daily-checkin.service.ts (enhanced) | MorningCheckin, EveningReview, DayComparisonCard | daily_checkins (enhanced) |
| Mood Arc Tracking | mood.service.ts (enhanced) | MoodArcTimeline | mood_logs (enhanced) |
| Cross-Domain Intelligence | cross-pillar-intelligence.service.ts (22 rules) | ContradictionsBanner | daily_analysis_reports (enhanced) |
| Health Correlations | health-correlation.service.ts (6 detectors) | CorrelationExplorer, InsightsPanel | journal_patterns |
| Best Day Formula | best-day-formula.service.ts | BestDayProgress widget | daily_analysis_reports |
| Prediction Accuracy | prediction-accuracy.service.ts | PredictionTracker | prediction_accuracy_tracking |
| Weekly Reports | weekly-report.service.ts | ReportViewer | weekly_analysis_reports |
| Voice Journaling | voice-journal.service.ts | VoiceJournalSession, 4 components | voice_journal_sessions |
| Theme Detection | theme-detection.service.ts (15 tags) | ThemeCloud | journal_insights |
| LLM Model Factory | model-factory.service.ts | N/A (server-internal) | - |
| Intelligence Dashboard | intelligence.controller.ts, intelligence.routes.ts | IntelligenceTab (5 sub-tabs) | insight_feedback |
| Insights Computation | insights-computation.job.ts (6h interval) | N/A (background) | - |
| Spotify/Music Integration | spotify.service.ts, spotify-playlist.service.ts, jamendo.service.ts | MusicTab, PersistentPlayer, Soundscape page | spotify_cached_playlists |
| Yoga & Meditation | yoga.service.ts, yoga.controller.ts | YogaPage (6 components), SessionPlayer | yoga_poses, yoga_sessions, yoga_session_logs, meditation_timers, yoga_streaks |
| AI Yoga Coach | yoga-coach.service.ts (Gemini Vision) | YogaAICoach, CameraViewport, CoachingPanel, 4 hooks, 5 utils | yoga_poses.joint_targets |
| Life History Embeddings | life-history-embedding.service.ts, life-history-digest.job.ts | N/A (server-internal) | user_life_history (768-dim vectors) |
| YouTube Integration | youtube.service.ts, youtube.controller.ts | YouTubeEmbed, PoseDetailSidebar | - (24h in-memory cache) |
| Life Goals Ecosystem | life-goals.service.ts, life-goals.controller.ts, goal-decomposition.service.ts | GoalsTab, LifeGoalsStep, DailySuggestionsWidget, AISuggestionCard | life_goals (enhanced), life_goal_milestones, life_goal_checkins, goal_actions |
| Motivation Tier System | motivation-tier.service.ts, engagement-scoring.job.ts | Onboarding tier selection | user_motivation_profiles |
| Life Score Metric | ai-scoring.service.ts (expanded) | Dashboard summary | - (computed from existing tables) |
| FAQ Page | N/A (client-only) | FAQPageContent | - |
| Preferences Page | N/A (client-only) | PreferencesPageContent | - |
| Email Engine | email-engine.service.ts, email-queue.service.ts, email-worker.ts | Email preferences UI | email_logs, email_preferences |
| Email Content Generator | email-content-generator.service.ts | N/A (server-internal) | - |
| Notification Engine | notification-engine.service.ts | NotificationDropdown, NotificationToast, useNotifications | - (uses existing notifications table) |
| Email Digest System | email-digest.job.ts | N/A (background) | - |
| Premium Circular Metrics | N/A (client-only) | PremiumCircularMetric + 7 arc variants (circular-variants/) | - |
| AI Music Control | musicManager in langgraph-semantic-tools.service.ts | MusicPlayerProvider (CustomEvent listener), action-handler.service.ts | - (uses Spotify/Jamendo services) |
| Vision Coaching | vision-coaching.service.ts, socket.service.ts | VisionCoachingOverlay, VoiceAssistantTab (vision toggle), socket-client.ts | - (in-memory sessions) |
| Multimodal Chat (Camera) | rag-chatbot.controller.ts (imageBase64), langgraph-chatbot.service.ts | VoiceAssistantTab (frame capture) | - |
| LLM JSON Parser | helper/llm-json-parser.ts | N/A (server-internal) | - |
| Vision Wellness (Color Test) | vision.service.ts, vision.controller.ts | VisionPageContent, ColorTestPlayer, EyeExerciseMode, VisionProgress, VisionHome | vision_test_sessions, vision_test_responses, vision_streaks |
| Intelligent Data Extraction | langgraph-chatbot.service.ts (system prompt) | N/A (AI behavior) | - |
| Data-Gap Proactive Messages | proactive-messaging.service.ts (3 new types) | N/A (push-based) | proactive_messages |
| Landing Cinematic System | N/A (client-only) | CinematicScene, DepthLayer, ScrollParticles, ScrollProgressBar | - |
| Parallax Hooks | N/A (client-only) | useMouseParallax, useScrollVelocity, useIsMobile hooks | - |

---

## TECHNICAL DEBT INVENTORY

| Priority | Item | Impact |
|----------|------|--------|
| P0 | Debug fetch calls in 5 server files | Performance, info leakage |
| P0 | Unused npm deps (Redux Toolkit, React Query) | Bundle size (~200KB) |
| P1 | langgraph-tools.service.ts is 11,013 lines | Maintainability |
| ~~P1~~ | ~~All 170+ pages use "use client" (no Server Components)~~ | **FIXED P28**: 60+ pages converted to server component wrappers |
| P1 | 5 pages over 1,000 lines (settings 2047, goals 2029) | Maintainability |
| P2 | 3 chart libraries (chart.js + recharts + d3-shape) | Consistency, bundle size |
| P2 | 3 toast/alert libraries (react-hot-toast + sonner + sweetalert2) | Consistency, bundle size |
| P2 | Low test coverage (~8% client, ~15% server estimated) | Quality risk (improved: 165 tour tests + 749 server tests passing across 35 suites, ESM mocking fixed) |

---

## ROUTE STRUCTURE

```
/                          # Home (enhanced)
/dashboard                 # Main dashboard
/goals                     # Goals management
/notifications             # Notification center
/pillars                   # Pillar hub (new)
/pillars/fitness           # Fitness detail
/pillars/nutrition         # Nutrition detail
/pillars/wellbeing         # Wellbeing detail
/insights                  # Analytics dashboard (enhanced)
/coach                     # AI Coach chat (enhanced)
/settings                  # Settings (enhanced)
/profile                   # User profile
/profile/edit              # Edit profile
/onboarding                # Multi-step onboarding
/plans/:id                 # Plan detail (dynamic)
/exercises                 # Exercise library browse/search
/exercises/:id             # Exercise detail view
/admin/exercises           # Admin exercise management
/admin/testimonials        # Admin testimonial management
/admin/newsletter          # Admin newsletter management
/intelligence              # Cross-domain intelligence dashboard
/soundscape                # Music & soundscape player
/yoga                      # Yoga & meditation (+ eye/face/desk/breathwork)
/wellbeing/vision          # Vision wellness (Ishihara test, eye exercises)
/leaderboard               # Leaderboard with podium, charts
/competitions              # Competition listing and details
/faq                       # Frequently asked questions
/preferences               # User preferences
/contact                   # Contact page
/auth/signin               # Authentication
/auth/signup               # Registration
```

---

## DEPENDENCIES

| Dependency | Type | Status |
|------------|------|--------|
| Node.js 20+ | Required | Available |
| Next.js 16 | Frontend Framework | Installed |
| React 19 | UI Library | Installed |
| Express 5 | Backend Framework | Installed |
| PostgreSQL | Database | Installed |
| Tailwind CSS 4 | Styling | Installed |
| Socket.io | Real-time | Installed |
| BullMQ | Job Queue | Installed |
| Redis | Cache/Queue | Installed |
| LangGraph | AI Framework | Installed |
| TensorFlow.js | ML | Installed |
| AssemblyAI | Transcription | Installed |
| ElevenLabs | Text-to-Speech | Installed |
| Cloudflare R2 | File Storage | Installed |
| Stripe | Payments | Installed |
| Radix UI | UI Components | Installed |
| Lucide React | Icons | Installed |
| Framer Motion | Animations | Installed |

---

## SESSION LOG

| Date | Focus | Outcome |
|------|-------|---------|
| 2025-12-20 | Initial Build | Full MVP UI from yhealth-mockup |
| 2025-12-20 | Core App Expansion | Added Pillars hub, 3 detail pages, 8 new components |
| 2025-12-22 | Format Migration | Created PROGRESS-DEV.md (Tier 3) |
| 2025-12-22 | Goals & Achievements | Goals page, achievements tab, progress tracking |
| 2025-12-22 | Notifications Backend | Notifications table, API endpoints, auto-migrate |
| 2025-12-23 | Notifications Complete | Notification service, page UI, header bell icon |
| 2025-12-23 | Bug Fixes | SQL ambiguity fix, goal progress calc, React keys |
| 2025-12-23 | Dashboard Tabs | 8-tab dashboard system with full functionality |
| 2025-12-23 | Plans System | Dynamic plan detail page with routing |
| 2025-12-23 | Enhanced Onboarding | Deep assessment step, improved flow |
| 2025-12-23 | API Completion | Achievements, Activity, Stats endpoints |
| 2025-12-23 | Database Tools | Auto-migrate, setup, and seeding utilities |
| 2025-12-24 | Voice Messages | Voice message support with image recognition |
| 2025-12-24 | Language Support | English/Urdu language integration |
| 2025-12-24 | AI Task Creation | AI-driven task/plan creation via chat |
| 2025-12-24 | Chat History | Conversation history persistence |
| 2025-12-27 | Progress Sync | Mapped code to stories, identified implementation gaps |
| 2025-01-27 | Voice Call Implementation | S02.1.1 complete - CallCoachButton, VoiceCallTab, voice-call.service, WebRTC signaling, call history |
| 2026-01-09 | Voice System & Analytics | Emotion detection, mental recovery scoring, report generation, crisis detection, AssemblyAI transcription, session orchestration, dashboard analytics tabs |
| 2026-01-12 | Voice Coaching Features | S02-09 to S02-15 complete - Emotion integration, session flows (Quick Check-In, Coaching, Emergency, Goal Review), call summaries, action tracking, voice customization |
| 2026-01-12 | Wellbeing Pillar Implementation | Epic 07 complete - Mood tracking (light/deep check-ins, timeline, patterns), Energy tracking (check-ins, timeline, patterns), Stress management (check-ins, crisis detection, evening prompts), Journal system (entry form, history, AI prompts, streaks), Habit tracking (dashboard, form modal), Mindfulness recommendations, Schedule service, Full backend API and database schema |
| 2026-01-12 | Wellbeing AI Integration | Enhanced wellbeing with AI integration - Schedule workflow visualization, WellbeingContextService for chatbot context, WellbeingQuestionEngine for proactive questions, WellbeingAutoTracker for chat-based tracking, WellbeingEmbeddingService for semantic search, vector indexes, LangGraph tools integration, improved navigation and overview tab |
| 2026-01-12 | Platform Enhancements | WHOOP integration improvements (charts, metrics, overview), Nutrition tab enhancements, Overview tab improvements, Schedule workflow refinements, Wellbeing services enhancements (auto-tracker, context, question engine), LangGraph chatbot improvements, Stats controller enhancements, R2 service updates, Workout alarm service, TensorFlow sentiment service, Auth context improvements, API client enhancements |
| 2026-01-13 | Workout Rescheduling & Nutrition Enhancements | Workout rescheduling system with constraints and history tracking (RescheduleWorkoutModal, WorkoutConstraints, WorkoutRescheduleHistory, WorkoutScheduleTasks components), workout-reschedule service and workflow, workout-slot-calculator service, workout audit job, shopping list enhancements with calories tracking, MealHistoryTab component, nutrition tab improvements, database migrations (workout reschedule tables, calories to shopping list, activity log status, plan policy), testing infrastructure (meal logging integration/unit tests, testing guide), voice assistant flow improvements |
| 2026-01-14 | WHOOP Integration | OAuth 2.0 + PKCE, webhooks, analytics, data normalization |
| 2026-02-04 | Automation System | BullMQ background jobs, schedule/activity automation, reminders |
| 2026-02-08 | Documentation Audit | Updated PROGRESS-DEV.md to reflect actual codebase state |
| 2026-02-19 | Product Tour System | Complete interactive walkthrough: 8-step guided tour with SVG spotlight, glassmorphism tooltips, confetti completion, keyboard nav, focus trap, ARIA accessibility, role-based admin steps, localStorage + backend persistence, auto-trigger logic. 16 new files, 10 test suites (165 tests). Zero new dependencies. |
| 2026-02-20 | Exercise Library & Execution | Complete exercise library system (browse, search, filter, detail views, admin CRUD), exercise execution drawer with set tracker/timer/plate calculator, landing page full redesign (12 sections), leaderboard UI enhancements (podium, score cards, charts), server scoring/competition/leaderboard service improvements, comprehensive test infrastructure fixes (ESM mocking migration, 631 tests passing). 6 commits pushed. |
| 2026-02-23 | Leaderboard & Competition Fixes | Fixed empty leaderboard root cause chain: scoring pipeline crashes (missing completed_count column, missing nutrition_user_preferences table), ensureScoresExist not materializing pre-existing scores, falsy rank check treating 0 as null, competition date range scoring only checking today. Rewrote competition auto-creation with dual-track system (daily 1-day + challenge 3/7/15-day). Added testimonials admin CRUD system, enhanced integrations section with scroll-driven parallax/orbital/3D animations, proactive messaging service, Google Cloud TTS, plan completion celebration. Server build + 411 client tests passing. |
| 2026-02-24 | AI Coach Pro & Proactive Messaging Overhaul | Built AI Coach Pro system: user-coaching-profile.service.ts generates persistent coaching profiles with adherence scores, risk flags, predictions, and goal alignment analysis. Coach profile generation job (6h interval) processes users in batches. Added 3 AI coach API endpoints (GET profile, POST refresh, PATCH tone). Fixed proactive messaging query storm (~450 queries/user/hour down to ~25-30, 95% reduction) by caching comprehensive context and passing to all 18 checkAndSend methods. Overhauled proactive message quality: upgraded from generic 2-3 sentence casual messages to professional data-rich coaching analysis (maxTokens 300→600/1000, gpt-4o for pro messages, structured per-type prompts with specific data blocks). Added 2-hour minimum message gap and reduced daily cap to 4. Rewrote voice assistant greeting to use comprehensive context (WHOOP recovery, daily score, streak, goals) instead of generic "How can I help you today?". Fixed ai-coach.controller.ts req.userId→req.user?.userId. DB migration for user_coaching_profiles table. Server + client build clean. |
| 2026-02-25 | Delta-Aware Conversations & Smart Routing | Phase 5 AI Coach Enhancement (4 sub-phases). **Delta Detection Service**: new user-delta.service.ts with snapshot-based comparison — stores lightweight JSON at session start, computes delta from previous via 6 parallel SQL queries (workouts, meals, scores, goals, habits, achievements), classifies significance as major/moderate/minor, picks topHighlight deterministically. **Delta-Aware Greeting & Prompt**: wired into generateGreeting() and buildPersonalizedSystemPrompt() so AI acknowledges changes naturally ("Since we last talked 2 days ago, your score jumped 16 points"). **Smart Message Routing**: new scoreMessageCandidates() replaces 18 sequential checkAndSend calls with scored candidates (base 85→10 + context multipliers), job sends only top 2-3 highest-impact messages per cycle. **Longitudinal Accountability**: 7d vs 30d adherence tracking with trend detection, consecutive low days counting, auto-escalation to accountability mode (tough_love forced) after 14+ consecutive low days below 40%. **Daily Analysis Engine**: cross-domain pattern detection with 8 insight types, deterministic rule engine + single LLM enrichment call, coaching directives with tone recommendations. **Test Fixes**: fixed 3 pre-existing WHOOP integration test failures (missing device_info for user lookup, mock implementations wiped by resetMocks, JSONB double-parse). All 749 tests passing across 35 suites. TypeScript build clean (0 errors). 3 new services, 2 new jobs, 1 new DB table. |
| 2026-03-02 | SEO, Performance & Code Quality (P28) | **SEO Server Components**: converted 60+ pages to server component wrappers with metadata exports, Open Graph tags, and JSON-LD structured data — extracted client `PageContent` components to preserve interactivity. Dynamic sitemap and robots.txt generation. **Chat Performance**: fixed N+1 query storm in message loading (300 sequential queries → 7 batch queries using PostgreSQL ANY()), fire-and-forget markChatAsRead pattern. Added contextual skeleton loading for chat list and messages. **View-Once Messages**: view-once media viewer with auto-expiry support, SQL migration. **Dashboard Preloader**: sci-fi AI-themed preloader with glowing orbs, hexagonal nodes, orbital paths replacing basic spinner. **Food Icons**: expanded food database (~400+ items across 20 categories), Indian/South Asian food icon matching, breakfast items, fixed salad ordering. **Workout Fixes**: weekly view, exercise execution drawer, create modal bug fixes. **Proactive Messaging**: fixed query storm on server startup. **WHOOP Sync Job**: background job for WHOOP data synchronization. **ESLint Zero Warnings**: resolved all 149 client lint warnings across ~45 files (unused imports, `any` → proper types, React hooks purity/exhaustive-deps/preserve-manual-memoization fixes, prefer-const). Server build clean, 749/749 server tests passing (4 pre-existing integration test failures from ESM/CJS conflict in mail.ts). Client lint: 0 warnings, 0 errors. All 20 client tests passing. |
| 2026-03-04 | AI Coach Emotional Intelligence & Avatar Fixes (P29) | **Coach Emotional Intelligence**: Deterministic coach emotional state engine — computes primary/secondary emotions (proud, worried, frustrated, excited, disappointed, hopeful, protective, neutral) from adherence scores, risk flags, streaks, goals, and longitudinal trends. Relationship depth tracking with 4 phases (new/building/established/deep) driving voice style adaptation. Injected emotional state into chat system prompt (embodied language section + per-response emotional context) and proactive messaging prompts. **Progress-Aware Greeting**: Complete rewrite of generateGreeting() — fetches coaching profile in parallel, builds 5-part structured greeting (personalized opening, progress reflection, insight/pattern, next step, engaging close) using deep coaching data (adherence scores, patterns, risk flags, key insights, memorable moments). Data-aware fallback for LLM unavailability. **LLM Circuit Breaker**: OpenAI 429 rate limit protection with exponential backoff, request counting, and automatic recovery. **Avatar Animation Fixes**: Fixed VRM loading race condition (restQuatsRef populated before vrmRef set), added try-catch around entire RAF loop body, `vrm.update(0)` for immediate bone sync on load. New micro-expression engine with context-appropriate emotional flashes (200-500ms). Expanded emotion modulators with headTilt, headNod, breathingRate, breathingDepth, microExpressionProb, bodyTension for 16 emotion types. **Finger Movement Enhancement**: Increased rest pose finger curl from 7° to 20° with intermediate joints, added intermediate joint animation channels for idle and speaking, boosted speaking finger amplitudes 1.5x for visible gesticulation. **Responsive Modal**: Voice assistant modal reduced 20% height (80vh desktop, responsive breakpoints), converted fixed→absolute positioning for proper containment, responsive ContextPanel. **Landing Page**: New GSAP sections (trust-bar, voice-coach, comparison, before-after, three-pillars, lead-magnet, fitness-carousel), hero/features/FAQ/how-it-works overhaul, Lenis smooth scroll. **Newsletter System**: Full-stack newsletter subscriptions with admin page. Server build clean, 749/749 tests passing. |
| 2026-03-10 | Cross-Domain Intelligence (P31 / E08) | **Full E08 implementation**: Cross-pillar contradiction detection (22 deterministic rules across 6 pillars with severity scoring), health correlation engine (6 SQL-based detectors: sleep-mood, exercise-gratitude, best-day, sleep-energy, recovery-mood, stress-exercise), Best Day Formula (personalized formula from highest-rated days + daily achievement score + streak tracking), prediction accuracy tracking (predicted vs actual with per-type breakdown), weekly aggregated reports (7 daily reports → LLM narrative), LLM model factory (cascading fallback: Gemini → Anthropic → DeepSeek → OpenAI, 3 tiers). **Voice journaling system**: conversational voice journal (record → AssemblyAI transcribe → AI responds → summarize → approve), theme detection (2-stage: per-entry LLM extraction + aggregate SQL, 15 theme tags). **Dashboard integration**: new Intelligence Tab with 5 sub-tabs (Insights, Correlations, Predictions, Reports, Health Score), 4 overview widgets (HealthScoreHero, BestDayProgress, PredictionsCard, ContradictionsBanner), wellbeing integration (InsightsPanel, ThemeCloud). 9 new services, 14 new API endpoints, 3 new DB tables, 15 new frontend components, 1 background job. |
| 2026-03-09 | Journaling Inspiration Features (P30) | **Cross-pollination from Story Writer**: Expanded emotional state model (6→13 emojis with calm, confident, focused, euphoric, distracted, fearful, frustrated). Mood Arc Timeline tracking intra-day transitions with trigger categories and linking. SQL-based behavioral pattern detection (4 algorithms: negativity bias, trigger identification, euphoria-regret cycle, escalation flags) with dismissible badge UI. Morning/Evening check-in loop: 5-step morning (predicted mood/energy, sleep, stressors, intentions) + 8-step evening (actual, day rating, lessons, tomorrow focus) with predicted-vs-actual comparison card. Lessons Learned system with Claude Haiku AI extraction from journals, user entry from evening reviews, spaced reminders (>2 weeks old, not reminded in 7 days), full-text search. Daily intentions enhanced to max 3 per day with bulk set, sort order, domain linking, fulfillment rate. Mind Constellation journal visualization improvements. Vector embedding and LangGraph chatbot enhancements. 14 new API endpoints, 2 new DB tables (lessons_learned, mood_behavioral_patterns), 7 new frontend components, 3 new backend services. |
| 2026-03-12 | AI Yoga Coach, Life History, YouTube (P33) | **AI Yoga Coach**: Gemini 2.5-flash Vision real-time pose analysis with MediaPipe body landmarks, Coach Maya persona, 8s frame capture, joint target angles. CameraViewport, CoachingPanel, 4 hooks (useGeminiCoach, useMediaPipe, useCamera, usePoseScorer), 5 utils. **Life History Embeddings**: 13-source daily digest aggregation with Gemini 768-dim vectors, semantic search, 6h background job. **YouTube**: Pose tutorial search with 24h cache, privacy-safe nocookie embeds. **Yoga Enhancements**: PoseDetailSidebar (glass-morphism), ProgressDashboard expanded (1000+ lines), proactive messaging refactor (624 lines) with yoga integration, coaching profile yoga adherence. 71 files, +6,945/-1,333 lines. |
| 2026-03-24 | Coaching Intelligence, Semantic Tools & Wellbeing Redesign (P37) | **Semantic Tool Consolidation**: Collapsed 163+ individual CRUD tools into ~10 semantic managers (meal, goal, habit, workout, sleep, stress, hydration, lifeGoal, whoopAnalytics) with action/identifier/filters/data parameters — 60% tool reduction for LLM. **WHOOP Intelligence**: Rich context layer with 7d averages, 30d baselines, trend directions (improving/stable/declining), sleep stage breakdown, biometrics (SPO2, skin temp), recovery/strain sustainability ratio. **Coaching Styles**: brutal_honesty (hard data, confrontational) and fired_up_pride (genuine amazement, exact numbers) mapped to message types, with 3-day new-user guard. **Async Embedding**: storeMessage → fast INSERT → background backfill via worker, non-blocking chat storage. **LLM Rate-Limiting**: ModelFactory runtime rate-limit tracking, auto-skip blacklisted providers, fallback chain continues. **14 Wellbeing Pages Redesigned**: Goals (drag-drop dnd-kit, analytics), Wellbeing hub (module grid, trend badges, area charts), Mood (arc timeline, behavioral patterns, emotion frequency), Energy (time-of-day breakdown), Schedule (React Flow workflows, week/month calendar), Insights (on-demand compute), Breathing, Stress, Journal, Habits, Emotional Check-in + more. **Dashboard**: GoalsTab consolidation (+2,016 lines), DashboardSidebar mobile nav, MusicTab redesign, ModuleCard with trends. **API**: On-demand insight compute endpoint. Max tokens 800→2048. 56 files, +10,085/-6,016 lines. |
| 2026-03-19 | Email & Notification Engine (P36) | **Email Pipeline**: EmailEngine orchestrator (5 categories, preferences check, logging), EmailQueueService (BullMQ with Redis fallback to inline), EmailWorker (3 concurrency, 10/s rate limit, RFC List-Unsubscribe headers), EmailContentGenerator (AI-powered weekly digests, coaching emails, re-engagement win-back). **Notification Engine**: Real-time Socket.IO broadcast (notification:new, notification:count events), 60s deduplication window, automatic email trigger for urgent/high priority. **Email Digest Job**: Weekly summaries (Sundays) + re-engagement (7+ day inactive users). **DB**: 3 new tables (email_logs, email_preferences, proactive_messages). **Frontend**: NotificationDropdown (header popover, 8 recent, unread badge), NotificationToast (animated, priority colors, dismissable), useNotifications hook (socket subscription, counts, mark read). **Templates**: digestSummary.ejs, coachingInsight.ejs, unsubscribe footer. 6 email API routes (preferences, analytics, unsubscribe, admin logs). 32 files, +3,223 lines. |
| 2026-03-18 | Life Goals & Motivation Ecosystem (P35) | **Life Goals System**: 13-category life goals (faith, career, finances, relationships, etc.), AI goal decomposition via Claude (motivation-tier calibrated: low=micro-actions, medium=structured, high=ambitious), milestones with target dates/values, daily check-ins with mood tracking, streak computation. **Motivation Tiers**: Declared + computed + blended tiers, 6 engagement signals (login/accept/completion/depth/streak), 14-day rolling window, weekly engagement-scoring batch job. **Goal Actions**: AI-generated actionable steps (6 types: habit/schedule/journal_prompt/tracking/milestone/behavioral_trick), pillar mapping, accept/edit/skip response tracking. **Life Score**: 5-component holistic metric (health 40% + goals 25% + intentions 15% + consistency 10% + engagement 10%). **Proactive Messaging**: 6 new message types (life_goal_checkin/stalled/milestone/encouragement, intention_reminder/reflection) integrated into scored routing. **Frontend**: LifeGoalsStep onboarding (assessment→AI suggestions→confirm), GoalsTab expansion, DailySuggestionsWidget, AISuggestionCard, 3 landing sections (life goals/tiers/domains carousel), FAQ page, Preferences page. **Backend**: 3 new services, 19 new routes, 4 DB tables, 1 background job. 93 files, +8,318/-537 lines. |
| 2026-03-13 | Gemini Vision & Multi-Model AI Consolidation (P34) | **Gemini-First Provider Strategy**: Pivoted AI infrastructure to Gemini primary with DeepSeek/OpenAI fallbacks. Direct REST API calls bypass SDKs for vision, embeddings, and text completions. **AI Coach Vision**: callGeminiVision() + callGeminiText() with base64 image handling, safety filter detection. **Human Detection**: Gemini 2.5-flash-lite-preview for lightweight detection. **Emotion Detection**: 3-tier fallback (DeepSeek → Gemini → OpenAI). **Embeddings**: GeminiDirectEmbeddings class with gemini-embedding-2-preview (1536-dim), task type support. **JSON Salvage**: Auto-close truncated LLM JSON outputs in workouts, diet plans, coaching profiles. **NutritionTab**: Priority-based parsing for Gemini native JSON format. **Bug Fixes**: Voice avatar lip-sync cleanup, meal history query column fix (logged_at→eaten_at), stress array PostgreSQL formatting, LangGraph Gemini content array handling, health correlation CTE refactor. 19 files, +910/-514 lines. |
| 2026-03-11 | Spotify/Music + Yoga & Meditation (P32) | **Spotify/Music**: OAuth 2.0+PKCE, Jamendo fallback, activity-based recommendations (8 categories with audio feature mapping), PersistentPlayer (Spotify SDK + HTML5 audio), MusicTab dashboard, Soundscape page, 3 new services, 18 API endpoints, 1 DB table. **Yoga & Meditation**: 100+ pose library (11 categories), 10 session types, 6 meditation modes, immersive SessionPlayer with ambient themes, streak tracking (14 milestones), progress dashboard with heatmap, use-yoga-session hook, 18 API endpoints, 5 DB tables, 6 components, yoga seed data. Total: 59 files, +13,711 lines. |
| 2026-03-10 | Documentation Overhaul | E03 deferred, E08/E09/E10 status updated, infrastructure counts refreshed (120+ services, 135+ tables, 76+ pages), Missing-Features.md created, NS-008 deferred |
| 2026-03-31 | Vision Wellness Module, Intelligent Data Extraction & Yoga Expansion (P41) | **Vision Wellness Module**: Full Ishihara color blindness testing — ColorTestPlayer (463 lines, 8 plates, 4s auto-advance, SVG dot-matrix), EyeExerciseMode (420 lines, 6 exercises: focus shift, palming, 20-20-20, figure eight, clock gaze, near-far), VisionProgress (501 lines, streak/score trends/test history), plate generator (226 lines, confusion palettes protan/deutan/tritan), scoring engine (186 lines, time bonuses, difficulty multipliers). Backend: vision.service.ts (575 lines), vision.controller.ts (121 lines), 3 DB tables, validators, auto-migrate. **Intelligent Data Extraction**: AI auto-logs meals/water/mood/energy/stress/exercise/weight from every message with macro estimation, cross-domain coaching insights. **Smart Embedding**: isWorthEmbedding() gate (<40 chars, SKIP_EMBED_PATTERNS), storeMessagePair() batch INSERT (4→2 DB trips). **Data-Gap Messages**: 3 new proactive types (dinner/mood/workout_feedback). **Chat AI Pipeline**: Message controller triggers LangGraph for AI coach, typing indicators, sender info. **Yoga Expansion**: 4 new types (eye/face/desk/breathwork), DemoVideoModal, EyeExerciseAnimation. **Spotify 403 Circuit Breaker**: 3-strike, 30-min reset. **Landing Cinematic**: CinematicScene, DepthLayer, ScrollParticles, parallax hooks, 3D hero. **Auto-Invoke Fallback**: Intent-based tool invocation for 0-token Gemini responses. 78 files, +6,513/-1,062 lines. |
| 2026-03-27 | AI Music Control, Vision Coaching & Multimodal Chat (P40) | **AI Music Manager**: New musicManager semantic tool (play_activity, search_and_play, control, recommend) with Spotify-first + Jamendo fallback. Track minification for efficient payloads. Music removed from off-topic list. **Music Control Pipeline**: End-to-end AI-to-player bridge — ActionCommand 'music_control' type, action-handler dispatches CustomEvent('music:command'), MusicPlayerProvider listener executes play/pause/resume/stop/next/previous/volume. Regex-based instant controls bypass LLM. **Vision Coaching**: vision-coaching.service.ts (402 lines) with Gemini Vision analysis, exercise detection, rep counting, posture corrections, food identification. Socket.IO events (vision:start/frame/stop/state/coaching/food/throttle/error). Adaptive frame interval. **VisionCoachingOverlay** (115 lines). **Multimodal Chat**: imageBase64 in ChatRequest/controller/route (max 2MB), HumanMessage [text, image_url] arrays, camera capability system prompt. **Life History Guard**: Cached isTableAvailable() for graceful pgvector-missing degradation. **LangChain Upgrade**: core→1.1.36, langgraph→1.2.6, langchain→1.2.37. **Bug Fixes**: Emotion confidence NaN/Infinity guards, TensorFlow log spam, system message filtering. 21 files, +1,458/-125 lines. |
| 2026-03-27 | Journal Intelligence, Competition Redesign & LLM Resilience (P39) | **LLM JSON Parser**: Shared parseLlmJson<T>() utility (5-stage pipeline) adopted across 5 services. **Journal Semantic Tools**: journalManager + voiceJournalManager in LangGraph with safe PostgreSQL enum mapping (15 categories + alias table). **Tool Router**: Fuzzy keyword matching fallback (prefix-based, min 4 chars), schedule/prayer/voice-journal keywords, scheduleManager + voiceJournalManager added. **Competitions Redesign**: CompetitionsPageContent rewritten to clean minimal UI, CountdownPill (60s vs 1s), JoinCompetitionModal simplified. **Journal Schema**: checkin_id FK, journaling_mode (5 modes), ai_generated_prompt, DistractionFreeEditor date picker. **Constellation**: MindCore 200→140px, 4→3 ripples, reversed sort. **Emotion Detection**: Gemini primary. **Life History**: pgvector table-missing guards. **Admin Users**: Pagination flicker fix. **Bug Fixes**: score_date→date, system message filter, theme upsert, stale badges. 31 files, +1,170/-1,071 lines. |
| 2026-03-25 | Premium Circular Metrics, Food Photo AI & Dashboard Polish (P38) | **Premium Circular Metrics**: 7 SVG arc variant system (DoubleRing, GlowEndpoint, MultiRing, Segmented, ThickGradient, TickMarked, Wave) with arc-utils and variant selection by metric type, UnifiedHealthDashboard refactored to use variants. **Food Photo AI**: Dish-level identification with name extraction, 10 absolute rules for AI coach. **Progress Tab**: Stat cards with left accent bars, glow effects, enhanced visual hierarchy (1098-line redesign). **Photo Comparison**: ScoreRing, MiniStat components, analysis history (924 lines). **Exercise Execution**: Fullscreen overlay layout replacing drawer (819 lines). **Constellation Journal**: 300 micro-star nebula backgrounds, shooting star animations, gradient headers (8 files). **Infrastructure**: LLM auth error detection with 24h provider blacklist in ModelFactory, health metrics 60s TTL cache, water cache invalidation, `||`→`??` null coalescing migration (20+ fixes), nutrition 3-level macro fallback, goal category expansion. 50 files, +3,298/-1,796 lines. |
| 2026-04-07 | Feature Review — Hamza & Salman | Founder review against North Star principles. Confirmed ✅ Done: Streak System (P45), Activity Status Awareness (P45), Social Accountability (P45), Accountability Contracts (P45), Accountability Buddy Matching (P45), AI Coach Personalities, Push/Email/In-App Voice channels. Flagged ⏳ for follow-up: Google Calendar integration, AI outbound PSTN calls, AI-generated personalized achievements, friction reduction (2-min check-ins), SOS alert for isolated users, clinical-depression guardrails, "pillars as infrastructure" vision-doc reframe. See `reviews/2026-04-07-feature-review-hamza-salman.md`. |
| 2026-04-23 | Subscription Enforcement, Billing UI, Admin Panels & Exercise Import (P49) | **Server Enforcement Stack**: entitlement.middleware.ts (requireTier/requireFeature/requireCredits guards with shadow/enforce-new/enforce-all rollout modes), 5 DB migrations (wallet backfill, Stripe hardening, user_subscriptions extensions, admin overrides/enterprise, promo/audit/abuse tables), graceExpirationJob (expires lapsed grace-period subs), abuse.service.ts (velocity checks, device fingerprint, promo stacking), stripe-webhook.service.ts (checkout.session.completed, invoice events, subscription lifecycle), credit.service.ts expanded (full ledger: grants, consumption, refunds, expiry, promo codes), entitlement.service.ts expanded (plan resolution, override support), tokenCounter.ts (tiktoken AI metering). **Route Middleware Wiring**: requireTier/requireCredits on ai-coach, journal, rag-chatbot, transcription, TTS, voice-calls, emotional-checkin, call-summaries routes. New admin-billing + me-credits routes. **Client Subscription UI**: CheckoutButton, PlanComparisonTable, CreditLedgerTable, CancelSubscriptionDialog, LockedFeatureScreen, PromoCodeInput, RemainingCreditsChip, TrialCountdownBanner, WalletSummaryCard. PageAccessGate (route-level plan enforcement). EntitlementsSocketBridge (real-time sync). useNavEntitlement hook. **Admin Panels**: 6 admin subscription sub-pages (abuse, analytics, features, overrides, promotions, usage) with AbuseSignalBadge, EntityMatrix, OverrideDialog. **New Pages**: /locked/[pageKey], /settings/billing + /billing/credits, /upgrade. **Dashboard Integration**: DashboardSidebar plan-gated nav, SettingsPageContent billing section, trial countdown banner in header, constellation SVG refinements, gamification widget polish. **Exercise Admin**: ImportExercisesModal + CSV/JSON parser. **Icon Cleanup**: 40+ components consistent imports. **Static Assets**: leaderboard SVGs, self-hosted fonts. 155 files, +12,300/-700 lines. |
| 2026-04-24 | Database Consolidation, Leaderboard Redesign & Test Suite (P50) | **Database Config Consolidation**: Migrated from `database/pg.ts` to `config/database.config.ts` as single source of truth (280+ files updated), configurable pool settings (DB_POOL_MAX, timeouts). **LangGraph Tool Domain Extraction**: 16 domain modules extracted into `services/langgraph-tools/` with registry and types. **Leaderboard Redesign**: SVG-based tab navigation, OrbitalBackground animation, ScoreBreakdownBars, paginated competitions, all-time Around Me view. **Admin Customer Subscriptions**: Customer management page with shared types. **Test Suite**: 52+ new test files — 9 controller, 7 middleware, 11 service, 25 validator, 6 integration tests + test helpers infrastructure (mock-db, mock-services, factories, controller-harness). |
| 2026-04-28 | Reasoning Graph, Tool Transactions, AI Coach Agent UI & Proactive Events (P52) | **Reasoning Graph System**: 8-module `services/reasoning-graph/` — feature-node-registry (declarative feature DAG), feature-state.service (per-user feature state tracking), graph-context.service (context assembly for AI), graph-event-emitter (pub/sub for state changes), graph-validation (constraint checking), next-best-action.service (AI-driven recommendation engine), state-propagation.service (cascading state updates), shared types in `reasoning-graph.ts`. **Tool Transactions**: tool-transaction.service.ts (atomic multi-step tool execution with rollback on failure). **User Files**: user-files.service.ts (upload/list/delete with metadata). **Proactive Event Triggers**: proactive-event-triggers.service.ts (event-driven check-in scheduling). **New LangGraph Domains**: artifacts (rich content management), files (file operations), finance (spending analysis, budgets, goals). **AI Coach Agent UI**: AgentTimeline (step-by-step reasoning visualization), ArtifactCard (rich artifact rendering), CheckInCard (proactive check-in prompts), FilesPanel (file management). GraphHealthCard for knowledge graph. **5 Migrations**: reasoning_graph, tool_operations, expand_coach_personas, user_files, proactive_check_ins. **Infra**: Dockerfile.db-migrate-seed, db-migrate-seed.ts script, updated Dockerfiles/CI/docker-compose. **Broad UI Updates**: 230+ client component fixes across dashboard, money-map, wellbeing, chat, leaderboard, yoga, voice, subscription, onboarding. ~618 files, +27,251/-22,190 lines. |
| 2026-04-27 | AI Tool Governance, Calendar Domain & Test Expansion (P51) | **Tool Governance System**: `tool-entitlements.config.ts` (per-tool tier/credit cost mapping), `tool-audit.service.ts` (execution logging with latency/tokens/errors), `tool-execution-wrapper.service.ts` (entitlement→audit→metrics pipeline), `tool-metrics.service.ts` (aggregated stats), `admin-tools.routes.ts` (admin API). 5 migrations: chat perf indexes, entitlement shadow log, tool audit log, sleep_logs, user_medications. **LangGraph Calendar Domain**: New calendar semantic tool manager. Goals domain + registry + utils refined. **Service Hardening**: model-factory provider resilience, subscription lifecycle, comprehensive-user-context expansion, coaching profile, vector-embedding tuning, competitions scoring/ranking fixes, plan-generation AI, rag-chatbot tool-governance wiring, reminder-processor scheduling. **Client**: Auth improvements (SignIn, use-auth, lib/auth), admin premium panel (DataTable, FilterBar, FormModal, MetricCard, SegmentedControl, StatusBadge), invoice PDF generator, admin-tokens, boneyard config. Dashboard/money-map/wellbeing/yoga component fixes. **Test Expansion**: 16 new controller tests, 14 job tests, 4 tool-governance tests + config test. ~110 files, +4,400/-3,200 lines. |
| 2026-04-29 | Chatbot Performance Pipeline, Tool Router Expansion & Data Source Corrections (P53) | **Message Type Classifier**: synchronous first-stage classifier (`message-type-classifier.service.ts`, 205 lines) — classifies messages as greeting/casual_chat/gratitude/follow_up/command/domain_intent before any async work; lightweight types (greeting, casual, gratitude) bypass entire tool + context pipeline for sub-500ms TTFT. 63 unit tests. **Chatbot Metrics**: `chatbot-metrics.service.ts` (144 lines) — in-memory rolling window (200 entries) tracking TTFT, intent accuracy, tools loaded/called, profile cache hits, system prompt size, fallback usage with aggregation helpers. **Coaching Profile Cache**: Non-blocking in-memory cache (10min TTL) in `user-coaching-profile.service.ts` — getCachedProfile() returns instantly (never hits DB), warmCache() fire-and-forget from chat pipeline, deduped background refresh via refreshInFlight Set. **Crisis Detection Fast Path**: hasKeywordMatch() pre-check in `crisis-detection.service.ts` — flat keyword array scan before expensive LLM-based detection. **Chatbot Pipeline Refactor**: Major `langgraph-chatbot.service.ts` refactor (930 lines changed) integrating classifier, metrics, cached profiles, system prompt token budget (3000 max with warning). **Tool Router Expansion**: 15+ new tools added to TOOL_GROUPS — workouts (swap/modify/substitute), schedule (Google Calendar), reflection (habit completion/analytics), progress (body images, charts, comparisons), shopping (CRUD), reminders (CRUD), general (finance, files). **Tool Definitions Map**: `getDefinitionsMap()` exported from langgraph-tools registry for intent-aware filtering. **Schema Descriptions**: Improved Zod `.describe()` annotations in meal/workout/recipe managers to guide LLM structured output. **Reasoning Graph Fixes**: 8 data source table names corrected in feature-node-registry (water_intake→water_intake_logs, chat_messages→rag_conversations, leaderboard_entries→daily_user_scores, etc.), user column overrides (author_id for community tables), reasoning graph tables added to auto-migrate. **Streak Query Fix**: status-pattern-analyzer NOT EXISTS subquery replacing incorrect JOIN. **Client Types**: Violet DashboardCard accent, BuddySuggestion.suggestedChallenge, LifeAreasDashboardSummary interface, exercise bulk import endpoint. **Dependencies**: @langchain/* bumped (anthropic 1.3.28, core 1.1.42, google-genai 2.1.29, langgraph 1.2.9, openai 1.4.5). 21 files changed, 3 new files, 129 tests passing. |
| 2026-04-29 | Tool Resilience, Action Normalization, Entitlement Config & Voice Call Fixes (P54) | **Tool Resolution Fallback**: Full-cache fallback in `langgraph-chatbot.service.ts` — when intent-filtered tool set misses a tool the LLM requested, searches the complete user tool cache (case-insensitive) before returning tool-not-found error. Logged as warning for observability. **Action Alias Normalization**: 12 action aliases mapped to canonical actions (log/add/record/track/save→create, remove→delete, edit/modify/change→update, list/show/fetch→get, find/search/lookup→getByName) — reduces semantic tool invocation failures from LLM action name mismatches. **MealManager Description**: Explicitly states "To log/add a meal use action:create" in tool description, preventing common "log" → action:"log" failures. **Database Config**: Export pool instance directly from `database.config.ts` for consumers needing raw pool access (pg-listen, pg-boss), fix Error type annotation on pool error handler. **Entitlement Config**: Add `ENTITLEMENT_ENFORCEMENT_MODE` env (shadow/enforce-new/enforce-all) and `ENTITLEMENT_ROLLOUT_START` to `env.config.ts` for subscription gating rollout. **Voice Call Fixes**: Add 'check_in' to `CallPurpose` type union in `voice-call.types.ts`, remove invalid `initiator_source` field from checkin-call job payload that wasn't part of the `CallInitiationRequest` interface. 6 files changed, 42 insertions, 4 deletions. |
| 2026-05-05 | Landing Page V2, AI Coach Modularization, Billing Jobs & Onboarding Enhancements (P56) | **Landing Page V2**: Complete redesign replacing 30+ legacy components (3D orbs, Spline scenes, GSAP animations, CinematicOverlays, CoachAvatarVrm) with streamlined architecture — new CIA intro/features sections, galaxy-3d, gallery, marquee, timeline, wellbeing-carousel, privacy, footer, nav-bar, scroll-progress, spring-line components. New landing.css. 70 files changed. **AI Coach Modularization**: Monolithic `ai-coach.service.ts` decomposed into domain-structured directory: assessment (batch-mcq, life-coach, mcq-generator), conversation, core (engine, ai-provider, goal-context), data (fallback-questions), image (image-analysis), planning (goal-generator), session, and typed interfaces. New `adaptive-coaching-loop.service.ts` for continuous coaching feedback. AI-COACH-TOOL-COVERAGE-AUDIT.md added. **Onboarding Enhancements**: New `useLifeCoachQuestions` and `useQuickAssessmentQuestions` hooks. Updated deep assessment constants, MCQ logic, progress indicator, all onboarding step components (Welcome, Assessment, DeepAssessment, LifeGoals), context types. **Subscription & Entitlements**: `IncompleteSubscriptionOverlay` and `PausedSubscriptionOverlay` for edge-case states. Updated EntitlementsContext, FeatureGate, PlanGate, SubscriptionGate, TrialCountdownBanner, useNavEntitlement, useSubscriptionAccess hooks. Dashboard, plans, billing, subscription page refinements. **Database & Infrastructure**: 4 new tables (sleep-logs, user-medications, intelligence, goal-daily-tracking), 2 migrations (weekly_targets_to_milestones, checkout_session_id). 3 billing jobs (dunning-retry, monthly-credit-reset, stale-reservation-cleanup). Updated auto-migrate, enums, plan schemas, server bootstrap, entitlement middleware. **LangGraph & Services**: New streak domain tool. All 8 domain tools updated (analytics, finance, habits, nutrition, schedule, wellbeing, workout, intelligence-memory). Updated tool-router, langgraph-chatbot, semantic-tools, registry. Service updates: daily-analysis, emotional-checkin, goal-decomposition, proactive-messaging, subscription, stripe-webhook, life-goals. **Tests**: Unit tests for useNavEntitlement, useSubscriptionAccess hooks. Job tests for dunning-retry, grace-expiration, monthly-credit-reset, stale-reservation-cleanup. 126 files changed, +4,313/-17,045 lines across 7 atomic commits. |
| 2026-03-03 | Newsletter & Landing Page Enhancements | **Newsletter**: Admin newsletter page (AdminNewsletterPageContent, page route, AdminSidebar link), backend newsletter flow (newsletter.controller, newsletter.service, newsletter.validator, admin-newsletter.routes, newsletter.routes), DB migration for newsletter_subscriptions; routes wired in server index. **Landing**: New sections — CoachAvatarVrm, ai-chat-demo, before-after, comparison-table, fitness-carousel, lead-magnet, problem-pain, three-pillars, trust-bar, voice-coach; shared SectionReveal; UI components (container-scroll-animation, hero-scroll-demo, particle-text-effect). New assets (beforeafter.png, c1–c5.png, howitwork.png). Updates to hero, features, how-it-works, pricing, testimonials, CTA, FAQ, integrations, app-download, stats, footer, globals.css, landing index exports. |

---

*PROGRESS-DEV.md Tier 3 (Development) | yHealth Platform*
*Template: FRAMEWORKS/templates/progress-tier3-dev.md*
*Created: 2025-12-22 | Source: yhealth-app/PROGRESS.md*
