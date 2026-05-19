# Database Tables

143 SQL table definitions for the Balencia platform, numbered for execution order (foreign key dependencies).

---

## Setup

```bash
# Create all tables
npm run db:setup

# Run pending migrations
npm run db:migrate

# Run a single table file
psql -d balencia -f src/database/tables/15-ai-coach-sessions.sql
```

---

## Table Index by Domain

### Foundation (00-09)

| # | File | Description |
|---|------|-------------|
| 00 | `extensions.sql` | PostgreSQL extensions (uuid-ossp, pgvector) |
| 01 | `enums.sql` | All enum types used across tables |
| 02 | `users.sql` | User accounts and authentication |
| 03 | `consent-records.sql` | User consent tracking (GDPR) |
| 04 | `whatsapp-enrollments.sql` | WhatsApp coaching enrollment |
| 05 | `user-preferences.sql` | Notification, coaching, display settings |
| 06 | `user-goals.sql` | SMART health goals |
| 07 | `assessment-questions.sql` | Onboarding question bank |
| 08 | `assessment-responses.sql` | User assessment answers |
| 09 | `user-integrations.sql` | Connected health apps (WHOOP, Fitbit, etc.) |

### Data & Plans (10-29)

| # | File | Description |
|---|------|-------------|
| 10 | `sync-logs.sql` | Integration sync history |
| 11 | `health-data-records.sql` | Synced health metrics |
| 12 | `user-plans.sql` | AI-generated life plans |
| 13 | `activity-logs.sql` | Daily activity tracking |
| 14 | `notifications.sql` | Push notifications |
| 15 | `ai-coach-sessions.sql` | AI coaching chat history |
| 16 | `diet-plans.sql` | Nutrition plans |
| 17 | `meal-logs.sql` | Meal tracking |
| 18 | `body-images.sql` | Body progress photos |
| 19 | `exercises.sql` | Exercise definitions |
| 20 | `workout-plans.sql` | Workout plan templates |
| 21 | `workout-logs.sql` | Workout completion records |
| 22 | `progress-records.sql` | Body measurements & progress |
| 23 | `water-intake.sql` | Water intake tracking |
| 24 | `xp-transactions.sql` | Gamification XP ledger |
| 25 | `shopping-list.sql` | Meal-plan shopping lists |
| 26 | `workout-alarms.sql` | Workout reminders |
| 27 | `recipes.sql` / `user-videos.sql` | Recipe library, user video content |
| 28 | `scheduled-reminders.sql` | General reminder scheduling |
| 29 | `user-tasks.sql` | Task management |

### Voice, Chat & Messaging (30-43)

| # | File | Description |
|---|------|-------------|
| 30 | `vector-extension.sql` | pgvector setup for embeddings |
| 31 | `voice-calls.sql` | AI voice call sessions |
| 32 | `voice-call-events.sql` | Voice call event log |
| 33 | `activity-status-history.sql` | Activity state transitions |
| 34 | `emotion-logs.sql` | Emotion detection records |
| 35 | `mental-recovery-scores.sql` | Mental recovery scoring |
| 36 | `call-summaries.sql` | AI voice call summaries |
| 37 | `action-items.sql` | Call-derived action items |
| 38 | `chats.sql` | Chat rooms / conversations |
| 39 | `messages.sql` | Chat messages |
| 40 | `chat-participants.sql` | Chat membership |
| 41 | `message-reactions.sql` | Message reactions |
| 42 | `message-reads.sql` | Read receipts |
| 43 | `starred-messages.sql` | Bookmarked messages |

### Wellbeing & Mental Health (44-60)

| # | File | Description |
|---|------|-------------|
| 44 | `daily-health-metrics.sql` | Aggregated daily health data |
| 45 | `stress-logs.sql` | Stress level tracking |
| 46 | `mood-logs.sql` | Mood tracking |
| 47 | `journal-entries.sql` | Journaling |
| 48 | `habits.sql` | Habit definitions |
| 49 | `habit-logs.sql` | Habit completion records |
| 50 | `energy-logs.sql` | Energy level tracking |
| 51 | `wellbeing-routines.sql` | Wellbeing routine definitions |
| 52 | `routine-completions.sql` | Routine completion records |
| 53 | `mindfulness-practices.sql` | Mindfulness sessions |
| 54 | `daily-schedules.sql` | Day planning |
| 55 | `workout-schedule-tasks.sql` | Workout-schedule links |
| 56 | `user-workout-constraints.sql` | Workout preferences & limits |
| 57 | `plan-reschedule-history.sql` | Plan change audit trail |
| 58 | `goal-daily-tracking.sql` | Daily goal progress |
| 59 | `breathing-tests.sql` | Breathing exercise sessions |
| 60 | `emotional-checkin-sessions.sql` | Emotional check-in flows |

### Nutrition Analytics (61-64)

| # | File | Description |
|---|------|-------------|
| 61 | `nutrition-daily-analysis.sql` | Daily nutrition AI analysis |
| 62 | `nutrition-calorie-adjustments.sql` | Adaptive calorie targets |
| 63 | `nutrition-adherence-patterns.sql` | Diet adherence tracking |
| 64 | `nutrition-user-preferences.sql` | Dietary preferences & restrictions |

### Automation & Scoring (65-69)

| # | File | Description |
|---|------|-------------|
| 65 | `schedule-automation-logs.sql` | Schedule automation audit |
| 66 | `activity-automation-logs.sql` | Activity automation audit |
| 67 | `activity-events.sql` | Activity event stream |
| 68 | `daily-user-scores.sql` / `blog-reactions.sql` | Daily scoring, blog engagement |
| 69 | `leaderboard-snapshots.sql` / `contact-submissions.sql` | Leaderboard state, contact form |

### Community & Social (70-77)

| # | File | Description |
|---|------|-------------|
| 70 | `competitions.sql` / `help-articles.sql` | Competitions, help center |
| 71 | `competition-entries.sql` / `community-posts.sql` | Competition participation, community feed |
| 72 | `webinars.sql` | Webinar events |
| 73 | `roles.sql` | RBAC role definitions |
| 74 | `permissions.sql` | Permission definitions |
| 75 | `role-permissions.sql` | Role-permission mapping |
| 76 | `newsletter-subscriptions.sql` | Newsletter signups |
| 77 | `user-roles.sql` | User-role assignments |
| 55 | `blogs.sql` | Blog posts |

### Extended Features (80-99)

| # | File | Description |
|---|------|-------------|
| 80 | `exercise-lookup-tables.sql` | Exercise reference data (muscles, equipment) |
| 82 | `testimonials.sql` | User testimonials |
| 83 | `user-coaching-profiles.sql` | AI coaching personality profiles |
| 84 | `daily-checkins.sql` | Daily check-in records |
| 85 | `life-goals.sql` | High-level life goals (cross-domain) |
| 86 | `journal-insights.sql` | AI-extracted journal insights |
| 87 | `lessons-learned.sql` | AI-derived lessons from patterns |
| 88 | `insight-feedback.sql` / `voice-journal-sessions.sql` | Insight ratings, voice journaling |
| 89 | `weekly-analysis-reports.sql` | Weekly AI analysis |
| 90 | `prediction-accuracy.sql` | AI prediction tracking |
| 91 | `spotify-cached-playlists.sql` | Spotify integration cache |
| 92-96 | `yoga-*.sql` | Yoga poses, sessions, logs, streaks |
| 95 | `meditation-timers.sql` | Meditation timer sessions |
| 97 | `user-life-history.sql` | Life history timeline |
| 98 | `life-goal-milestones-checkins.sql` | Milestone check-ins |
| 99 | `triggers.sql` / `user-motivation-profiles.sql` | Auto-update triggers, motivation profiles |

### Advanced Intelligence (100-131)

| # | File | Description |
|---|------|-------------|
| 100 | `goal-actions.sql` | Decomposed goal actions |
| 101 | `proactive-messages.sql` | AI proactive message log |
| 102 | `email-logs.sql` | Email delivery tracking |
| 103 | `email-preferences.sql` | Email preference settings |
| 104-106 | `vision-*.sql` | Vision test sessions, responses, streaks |
| 107 | `finance.sql` | Financial tracking |
| 108-111 | `streak-*.sql` | Streak system (streaks, activity log, freezes, rewards) |
| 112-113 | `accountability-*.sql` | Accountability system & contracts |
| 113-114 | `calendar-*.sql` | Calendar connections & events |
| 115 | `user-follows.sql` | Social follow relationships |
| 116 | `goal-obstacles.sql` / `life-areas.sql` | Obstacle tracking, life area definitions |
| 117 | `goal-reconnections.sql` / `life-area-links.sql` | Goal reconnection system, life area linking |
| 118 | `user-timing-profiles.sql` | Optimal timing analysis |
| 119 | `holiday-calendar.sql` | Holiday/event calendar |
| 120-121 | `data-source-*.sql` | External data source connections & signals |
| 122 | `user-daily-correlations.sql` | Cross-domain correlation data |
| 123 | `spotify-listening-history.sql` | Spotify listening data |
| 124 | `prayer-schedules.sql` | Prayer/spiritual schedule |
| 125 | `finance-tracking.sql` | Detailed finance tracking |
| 126 | `competition-invitations.sql` | Competition invite system |
| 127 | `mental-health-screening-events.sql` | Mental health screening |
| 128 | `sleep-logs.sql` | Sleep tracking |
| 129 | `user-medications.sql` | Medication tracking |
| 130 | `intelligence.sql` / `quick-notes.sql` | Cross-pillar intelligence, quick notes |
| 131 | `wiki.sql` | Personal knowledge wiki |

### Dynamic Tables

Created at runtime via `ensureTable()` in services:
- `cross_pillar_contradictions` — Contradictory patterns across life domains
- `daily_analysis_reports` — Deterministic analytics (source of truth, no LLM data)
- `conversation_claims` — LLM-derived claims from conversations

---

## Conventions

| Convention | Format |
|-----------|--------|
| File naming | `NN-description.sql` (numbered for dependency order) |
| Table names | `snake_case` |
| Index names | `idx_[table]_[columns]` |
| Trigger names | `update_[table]_updated_at` |
| Primary keys | `id UUID DEFAULT uuid_generate_v4()` |
| Timestamps | `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()` |

## Adding New Tables

1. Create `NN-description.sql` with the next available number
2. Add the `updated_at` trigger in `99-triggers.sql`
3. Update the schema setup script to include the new file
4. Create a migration in `../migrations/YYYYMMDDHHMMSS_description.sql`
