# Streak System Design Spec

**Date**: 2026-04-07
**Status**: Approved
**Author**: Claude (Senior Principal Engineer)

## Context

yHealth needs a Snapchat-like streak system to maximize daily engagement and retention. The app already has scattered streak infrastructure (gamification service with basic day-diff logic, yoga/vision module streaks, XP multipliers, achievement trees with consistency tiers). This design unifies and elevates those into a cohesive, production-grade streak engine.

**Problem**: Current streak tracking lives on the `users` table as simple columns (`current_streak`, `longest_streak`, `last_activity_date`) with no freeze mechanism, no timezone awareness, no audit trail, and no dedicated validation job. Module-specific streaks (yoga, vision) are siloed.

**Goal**: A single master streak that any qualifying activity feeds into, with freeze economy, real-time updates, AI coach integration, calendar heatmap, milestone celebrations, and streak leaderboard.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streak scope | Single master streak | Any qualifying activity keeps it alive. Simpler, higher retention. |
| Architecture | Event-driven (BullMQ + Redis + Socket.IO) | Fits existing stack, decoupled, idempotent |
| Grace period | None (strict midnight cutoff) | User preference. Timezone-aware dates handle fairness. |
| Freeze economy | Earned via milestones + purchasable with XP | Dual source: achievement-driven + flexible |
| AI integration | Full (risk detection, quick-save suggestions) | Leverages existing proactive messaging infrastructure |
| DB migration | New tables + keep denormalized columns on `users` | Backward compatible with existing gamification/achievement code |

## Qualifying Activities

Any of these count as "active" for the day:
- Workout completion (status = 'completed' or 'partial')
- Yoga session
- Meditation/mindfulness session
- Breathing exercise
- Mood check-in (light or deep)
- Journal entry
- Meal log
- Water goal achieved
- AI coach conversation (minimum 2 user-sent messages in a single session)
- Daily check-in (morning or evening)

**Excluded**: Passive data (WHOOP sync, Apple Health auto-import) does NOT count — user must actively do something.

---

## 1. Database Schema

### 1.1 `user_streaks` — Central streak state

```sql
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Streak state
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_started_at DATE,
    total_active_days INTEGER NOT NULL DEFAULT 0,

    -- Freeze economy
    freezes_available INTEGER NOT NULL DEFAULT 0 CHECK (freezes_available >= 0 AND freezes_available <= 3),
    freezes_used_total INTEGER NOT NULL DEFAULT 0,
    last_freeze_date DATE,

    -- User timezone for midnight calculations
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_timezone ON user_streaks(timezone);
CREATE INDEX idx_user_streaks_last_activity ON user_streaks(last_activity_date);
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);
```

Table number: `108-user-streaks.sql`

### 1.2 `streak_activity_log` — Immutable audit trail

```sql
CREATE TABLE streak_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(100),
    streak_day INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, activity_date, activity_type)
);

CREATE INDEX idx_streak_activity_user_date ON streak_activity_log(user_id, activity_date DESC);
CREATE INDEX idx_streak_activity_date ON streak_activity_log(activity_date);
```

Table number: `109-streak-activity-log.sql`

### 1.3 `streak_freeze_log` — Freeze usage audit

```sql
CREATE TABLE streak_freeze_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    freeze_date DATE NOT NULL,
    source VARCHAR(30) NOT NULL,
    xp_cost INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, freeze_date)
);

CREATE INDEX idx_streak_freeze_user ON streak_freeze_log(user_id, freeze_date DESC);
```

Table number: `110-streak-freeze-log.sql`

### 1.4 `streak_rewards` — Reward definitions (seed data)

```sql
CREATE TABLE streak_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_days INTEGER NOT NULL UNIQUE,
    tier_name VARCHAR(30) NOT NULL,
    reward_type VARCHAR(30) NOT NULL,
    xp_bonus INTEGER NOT NULL DEFAULT 0,
    freezes_earned INTEGER NOT NULL DEFAULT 0,
    title_unlocked VARCHAR(50),
    badge_icon VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Table number: `111-streak-rewards.sql`

**Seed data:**

| milestone_days | tier_name | reward_type | xp_bonus | freezes_earned | title_unlocked | badge_icon |
|----------------|-----------|-------------|----------|----------------|----------------|------------|
| 3 | Spark | badge | 25 | 0 | NULL | spark |
| 7 | Flame | badge_freeze | 100 | 1 | Week Warrior | flame |
| 14 | Blaze | badge_title | 200 | 0 | Fortnight Fighter | blaze |
| 30 | Inferno | badge_freeze_title | 500 | 1 | Month Master | inferno |
| 60 | Wildfire | badge_title | 1000 | 0 | Sixty Strong | wildfire |
| 90 | Supernova | badge_freeze_title | 2000 | 1 | Streak Legend | supernova |
| 180 | Phoenix | badge_title | 5000 | 0 | Half-Year Hero | phoenix |
| 365 | Eternal Flame | badge_title | 10000 | 0 | Year of Fire | eternal |

### 1.5 Backward Compatibility

The `users` table columns (`current_streak`, `longest_streak`, `last_activity_date`) remain as **denormalized read caches**. The streak service updates both `user_streaks` AND `users` on every change. This ensures:
- `gamification.service.ts` getUserStats() continues working
- `achievement-tree.service.ts` consistency checks continue working
- `comprehensive-user-context.service.ts` GamificationContext continues working
- `leaderboard.service.ts` queries continue working

Over time, consumers can migrate to read from `user_streaks` directly.

---

## 2. Service Architecture

### 2.1 Event Flow

```
Activity Completed (any controller)
  |
  v
streakService.recordActivity(userId, activityType, sourceId)
  |
  ├── Check idempotency (UNIQUE constraint: user + date + type)
  |     └── If duplicate → return current state (no-op)
  |
  ├── Is this the FIRST activity today?
  |     ├── YES → increment current_streak, update dates
  |     └── NO → just log the activity (streak already incremented)
  |
  ├── Check for milestone hit
  |     └── If milestone → award XP bonus + freeze + emit milestone event
  |
  ├── Update Redis cache: streak:{userId}
  |
  ├── Sync denormalized columns on users table
  |
  └── Emit Socket.IO: streak:updated → user:{userId}
```

### 2.2 Core Service: `streak.service.ts`

```typescript
interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  lastActivityDate: string | null;
  streakStartedAt: string | null;
  totalActiveDays: number;
  tier: StreakTier;
  nextTier: StreakTier | null;
  tierProgress: number;        // 0-100% to next tier
  atRisk: boolean;             // no activity today AND past 6pm local
  todayActivities: string[];   // activities logged today
  timezone: string;
}

interface StreakUpdateResult {
  streak: StreakStatus;
  isFirstActivityToday: boolean;
  streakIncremented: boolean;
  milestone: StreakMilestone | null;
  xpEarned: number;
}

interface CalendarDay {
  date: string;
  status: 'active' | 'frozen' | 'broken' | 'none';
  activities: string[];
  streakDay: number;
  freezeSource?: string;
}

class StreakService {
  // === Core Operations ===

  async recordActivity(
    userId: string,
    activityType: string,
    sourceId?: string
  ): Promise<StreakUpdateResult>

  async getStreakStatus(userId: string): Promise<StreakStatus>
  // Redis-first: check streak:{userId}
  // Fallback: query user_streaks table
  // Computes atRisk flag based on current time vs user timezone

  // === Freeze Operations ===

  async purchaseFreeze(userId: string): Promise<{
    success: boolean;
    freezesAvailable: number;
    xpDeducted: number;
  }>
  // Cost: 200 XP. Max 3 freezes stored.
  // Deducts XP by directly updating users.total_xp and logging a
  // 'freeze_purchase' XP transaction with negative xp_amount.

  async applyFreeze(userId: string, date?: string): Promise<{
    success: boolean;
    freezesRemaining: number;
  }>
  // Default date: yesterday. Validates streak was actually broken.
  // Restores streak, logs freeze, decrements available count.

  // === Cron Operations ===

  async runMidnightValidation(timezone: string): Promise<{
    usersProcessed: number;
    streaksBroken: number;
    freezesApplied: number;
  }>
  // Called hourly. Processes users in timezone bucket where midnight has passed.
  // For each user with no activity yesterday:
  //   - If freezes > 0: auto-apply freeze
  //   - If freezes = 0: break streak (reset to 0)

  // === Query Operations ===

  async getCalendar(userId: string, month: string): Promise<{
    month: string;
    days: CalendarDay[];
    summary: { activeDays: number; frozenDays: number; brokenDays: number; currentStreak: number };
  }>

  async getStreakLeaderboard(
    limit: number,
    offset: number,
    segment?: 'global' | 'friends' | 'country'
  ): Promise<{ entries: LeaderboardEntry[]; total: number }>

  async getAroundMe(userId: string): Promise<LeaderboardEntry[]>
  // +-10 ranks around user

  async compareWithFriend(userId: string, friendId: string): Promise<{
    you: StreakSummary;
    friend: StreakSummary;
    delta: { streakDiff: number; suggestion: string };
  }>

  async getStats(userId: string): Promise<{
    totalActiveDays: number;
    averageStreak: number;
    bestMonth: { month: string; activeDays: number };
    activityBreakdown: Record<string, number>;
  }>

  // === Initialization ===

  async initializeUserStreak(userId: string, timezone: string): Promise<void>
  // Called on user registration. Creates user_streaks row.
  // Also backfills from existing users.current_streak if > 0.
}
```

### 2.3 Streak Multiplier (unchanged)

Existing logic in `gamification.service.ts`:
- +2% per streak day, max 60% at 30 days
- Applied to eligible XP sources: activity, workout, meal, water, daily_complete
- The streak service calls `gamificationService.awardXP()` for XP operations

### 2.4 Integration Points

| File | Change |
|------|--------|
| `server/src/services/gamification.service.ts` | `updateStreak()` delegates to `streakService.recordActivity()` internally. Existing callers continue working. |
| `server/src/controllers/achievements.controller.ts` | Achievement checks read from `user_streaks` table (add fallback to `users` table). |
| `server/src/services/comprehensive-user-context.service.ts` | Add `streakContext` block with atRisk, freezes, quickSaveActions. |
| `server/src/services/proactive-messaging.service.ts` | Enhance `streak_risk` scoring: HIGH priority when streak >= 3 AND no activity today AND past 6pm local. Include quick-save actions in message. |
| `server/src/services/daily-analysis.service.ts` | Include streak data in `snapshot.streakDays` (already exists). |
| Activity controllers (workout, yoga, mood, journal, meal, water, breathing, checkin) | Add `streakService.recordActivity()` call after successful completion. |

---

## 3. Cron Job: `streak-validation.job.ts`

### 3.1 Midnight Validation

```
Runs: Every hour (aligned with existing job pattern)
Worker: Only scheduler worker (id=0) in cluster mode

Logic:
1. Get current UTC hour
2. Find IANA timezones where local time is 00:00-00:59
3. For each timezone bucket:
   a. Query: SELECT * FROM user_streaks
              WHERE timezone = $1
              AND last_activity_date < (CURRENT_DATE AT TIME ZONE $1 - INTERVAL '1 day')
              AND current_streak > 0
   b. For each user:
      - If freezes_available > 0:
        → Auto-apply freeze (decrement freezes, log to streak_freeze_log)
        → Emit streak:freeze_applied via Socket.IO
      - If freezes_available = 0:
        → Set current_streak = 0, streak_started_at = NULL
        → Emit streak:broken via Socket.IO
   c. Update Redis cache for all affected users
   d. Log summary: { timezone, usersProcessed, freezesApplied, streaksBroken }
```

### 3.2 At-Risk Notification (6pm + 9pm local)

```
Piggybacks on existing proactive-messaging.job.ts (runs every 3 hours)

Enhanced streak_risk scoring:
- Score = 0 if user already active today
- Score = 70 if streak >= 3 AND no activity AND local time >= 18:00
- Score = 90 if streak >= 7 AND no activity AND local time >= 21:00
- Score boosted by +10 if user has 0 freezes remaining

Message includes quick-save actions:
  "You're about to lose your 15-day streak! Quick save options:"
  - "Log your mood (30 seconds)"
  - "Do a breathing exercise (2 minutes)"
  - "Log your water intake"
```

---

## 4. Redis Caching

### 4.1 Cache Key Structure

```
streak:{userId} → JSON string of StreakStatus
TTL: 24 hours (refreshed on every read/write)
```

### 4.2 Cache Operations

- **Write-through**: Every `recordActivity()` and `runMidnightValidation()` updates Redis AND DB
- **Read-through**: `getStreakStatus()` checks Redis first, falls back to DB, writes to Redis on miss
- **Invalidation**: On streak break or freeze apply, delete + re-set
- **Graceful degradation**: If Redis unavailable, all operations fall back to DB (follows existing `redis-cache.service.ts` pattern)

### 4.3 Streak Leaderboard (Redis Sorted Set)

```
Key: streak-leaderboard:global
Score: current_streak
Member: userId
TTL: 1 hour
```

Updated on every streak increment. Materialized fully by streak-validation job.

---

## 5. Socket.IO Events

| Event | Direction | Trigger | Payload |
|-------|-----------|---------|---------|
| `streak:updated` | Server → Client | Activity recorded | `{ currentStreak, longestStreak, freezesAvailable, isNewRecord, xpEarned, milestone?, todayActivities }` |
| `streak:broken` | Server → Client | Midnight validation (no freeze) | `{ previousStreak, longestStreak }` |
| `streak:freeze_applied` | Server → Client | Midnight validation (auto) or manual | `{ freezesRemaining, date, source }` |
| `streak:at_risk` | Server → Client | Proactive messaging | `{ currentStreak, hoursRemaining, suggestedActions[] }` |
| `streak:milestone` | Server → Client | Milestone hit during recordActivity | `{ days, tierName, xpBonus, freezesEarned, titleUnlocked, badgeIcon }` |

All events emit to `user:{userId}` room (follows existing Socket.IO pattern).

---

## 6. API Endpoints

### 6.1 Routes: `server/src/routes/streak.routes.ts`

```
GET    /api/streaks/status              → getStreakStatus
GET    /api/streaks/history             → getActivityHistory (paginated)
GET    /api/streaks/calendar/:month     → getCalendar (YYYY-MM format)
GET    /api/streaks/leaderboard         → getStreakLeaderboard (?segment=global|friends|country&limit=20&offset=0)
GET    /api/streaks/leaderboard/around-me → getAroundMe
GET    /api/streaks/rewards             → getRewardTiers (all tiers with unlocked status)
GET    /api/streaks/stats               → getAggregateStats
GET    /api/streaks/compare/:friendId   → compareWithFriend
POST   /api/streaks/freeze/purchase     → purchaseFreeze
POST   /api/streaks/freeze/apply        → applyFreeze (?date=YYYY-MM-DD)
```

All endpoints require `authenticate()` middleware.

### 6.2 Validation: `server/src/validators/streak.validator.ts`

Zod schemas for:
- `calendarParamsSchema`: month format YYYY-MM
- `leaderboardQuerySchema`: segment enum, limit (1-100), offset
- `freezeApplySchema`: optional date (ISO date string)
- `compareParamsSchema`: friendId UUID

---

## 7. AI Coach Integration

### 7.1 Enhanced User Context

Add to `comprehensive-user-context.service.ts` → `buildContext()`:

```typescript
streakContext: {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  lastActivityDate: string | null;
  isAtRisk: boolean;
  streakStartedAt: string | null;
  currentTier: string;
  quickSaveActions: string[];
}
```

**Quick-save actions** are determined by what the user has NOT done today:
- If no mood log → "Log your mood (30 seconds)"
- If no breathing test → "Do a breathing exercise (2 minutes)"
- If no water logged → "Log your water intake (10 seconds)"
- If no journal entry → "Write a quick journal note (1 minute)"

### 7.2 Proactive Messaging Enhancement

Existing `streak_risk` and `streak_celebration` message types in `proactive-messaging.service.ts` get enhanced:

**streak_risk** scoring:
```
if (noActivityToday && currentStreak >= 3) {
  if (localHour >= 21) score = 90;
  else if (localHour >= 18) score = 70;
  if (freezesAvailable === 0) score += 10;
}
```

**streak_celebration** scoring:
```
if (justHitMilestone) score = 95;  // near-top priority
```

### 7.3 Coach Conversation Awareness

When AI coach is building a response, if user is at-risk:
- Mention streak naturally: "By the way, you're at 15 days! Don't forget to log something today."
- Suggest lowest-effort action based on quickSaveActions
- Never nag more than once per conversation

---

## 8. Frontend Components

### 8.1 File Structure

```
client/
├── app/(pages)/dashboard/components/gamification/
│   ├── StreakWidget.tsx              # Main streak counter widget
│   ├── StreakCalendar.tsx            # Monthly heatmap view
│   ├── StreakMilestoneModal.tsx      # Celebration overlay
│   ├── StreakFreezeControls.tsx      # Freeze purchase/apply UI
│   └── StreakBreakAnimation.tsx      # Break visual effect
├── src/shared/services/
│   └── streak.service.ts            # API client
└── hooks/
    └── use-streak.ts                # Real-time streak state hook
```

### 8.2 StreakWidget.tsx

**Layout:**
```
┌─────────────────────────────────────────┐
│  fire  15                               │
│  Day Streak            ice ice ice       │
│  progressbar----------- 15/30 Inferno   │
│  Best: 42 days   Started: Mar 23        │
└─────────────────────────────────────────┘
```

**Visual states:**
- Fire icon: Animated SVG with `motion.div` — subtle flame flicker `animate={{ scale: [1, 1.05, 1] }}`, `repeat: Infinity, duration: 2`
- Streak number: `motion.span` with `key={streak}` for count-up animation via `AnimatePresence`
- Tier progress bar: Gradient fill showing progress to next tier

**Tier colors (Tailwind):**
| Days | Tier | Text | Background |
|------|------|------|------------|
| 1-6 | Spark | `text-slate-400` | `bg-slate-500/20` |
| 7-13 | Flame | `text-blue-400` | `bg-blue-500/20` |
| 14-29 | Blaze | `text-purple-400` | `bg-purple-500/20` |
| 30-59 | Inferno | `text-orange-400` | `bg-orange-500/20` |
| 60-89 | Wildfire | `text-amber-400` | `bg-amber-500/20` |
| 90+ | Supernova+ | `text-yellow-300` | `bg-yellow-500/20` + glow shadow |

**Freeze indicator:** 1-3 Snowflake icons (lucide-react), filled = available, outline = used

**At-risk state:** Amber border pulse animation when no activity today and past 6pm local. Text: "Log activity to save streak!"

**Responsive:**
- Desktop (>768px): Full layout in dashboard grid
- Mobile (<768px): Compact `fire 15` with tier color, freeze dots, tap to expand to bottom sheet

### 8.3 StreakCalendar.tsx

Monthly heatmap grid (7-column CSS grid):
- Cell size: 40x40px desktop, 36x36px mobile
- Colors: `bg-emerald-500` (active), `bg-blue-400` (frozen), `bg-red-400` (broken), `bg-zinc-800` (none/future)
- Opacity: 1 activity = 60%, 2+ = 100%
- Tap day: Tooltip with activities logged
- Month navigation: arrows, swipe on mobile

### 8.4 StreakBreakAnimation.tsx

Triggered by `streak:broken` socket event or page load after midnight:
1. Fire icon crack — SVG path split animation
2. Number drops from current → 0 with gravity easing
3. Particle burst — 8-12 ember particles scatter (motion.div with random trajectories)
4. Subtle screen shake — 2px translateX oscillation
5. Duration: 1.5s total
6. After: Motivational message card with freeze CTA (if available) or "Start New Streak" button

### 8.5 StreakMilestoneModal.tsx

Full-screen overlay at milestone days (7, 14, 30, 60, 90, 180, 365):
1. Dark overlay with confetti particles
2. Badge reveal: scale 0 → 1 with spring animation
3. Large streak count with tier-colored glow
4. Rewards fly in: "+100 XP" from left, "+1 Freeze" from right, "Title: Week Warrior" fades in
5. Dismiss: tap anywhere or [Continue]
6. Haptic feedback on mobile via `navigator.vibrate`

### 8.6 StreakFreezeControls.tsx

Part of expanded streak detail:
- Buy button: Disabled if XP < 200 or freezes >= 3. Loading spinner during purchase.
- Apply button: Only if streak broke within last 24h AND freezes > 0. Confirmation dialog.
- Freeze history: Last 5 uses, scrollable list.

### 8.7 use-streak.ts Hook

```typescript
function useStreak(): {
  streak: StreakStatus | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  purchaseFreeze: () => Promise<void>;
  applyFreeze: (date?: string) => Promise<void>;
  calendarData: CalendarMonth | null;
  loadMonth: (month: string) => Promise<void>;
}
```

- Initial: fetch `/api/streaks/status`
- Real-time: subscribe to `streak:updated`, `streak:broken`, `streak:freeze_applied`, `streak:at_risk`
- Cleanup: unsubscribe on unmount (follows `use-unread-count.ts` pattern)
- Optimistic: increment local state on activity before server confirmation

### 8.8 streak.service.ts (Client)

```typescript
const streakService = {
  getStatus: () => api.get<StreakStatus>('/streaks/status'),
  getHistory: (params) => api.get<PaginatedResponse>('/streaks/history', { params }),
  getCalendar: (month) => api.get<CalendarMonth>(`/streaks/calendar/${month}`),
  getLeaderboard: (params) => api.get<LeaderboardResponse>('/streaks/leaderboard', { params }),
  getAroundMe: () => api.get<LeaderboardEntry[]>('/streaks/leaderboard/around-me'),
  getRewards: () => api.get<RewardTier[]>('/streaks/rewards'),
  getStats: () => api.get<StreakStats>('/streaks/stats'),
  compareWithFriend: (friendId) => api.get<CompareResult>(`/streaks/compare/${friendId}`),
  purchaseFreeze: () => api.post<PurchaseResult>('/streaks/freeze/purchase'),
  applyFreeze: (date?) => api.post<ApplyResult>('/streaks/freeze/apply', { date }),
};
```

---

## 9. Server File Structure

```
server/src/
├── services/streak.service.ts           # Core streak engine
├── controllers/streak.controller.ts     # API handlers
├── routes/streak.routes.ts              # Route definitions
├── jobs/streak-validation.job.ts        # Midnight cron
├── validators/streak.validator.ts       # Zod schemas
├── database/tables/
│   ├── 108-user-streaks.sql
│   ├── 109-streak-activity-log.sql
│   ├── 110-streak-freeze-log.sql
│   └── 111-streak-rewards.sql
└── database/seeds/streak-rewards.ts     # Seed reward tiers
```

---

## 10. Performance & Scalability

### 10.1 Race Condition Prevention
- `UNIQUE(user_id, activity_date, activity_type)` constraint prevents duplicate streak entries
- `UNIQUE(user_id, freeze_date)` prevents double freeze application
- PostgreSQL transaction with `SELECT ... FOR UPDATE` on `user_streaks` row during `recordActivity()`
- Redis `SET NX` for streak updates (optional distributed lock)

### 10.2 Query Optimization
- All queries use indexed columns (`user_id`, `activity_date`, `timezone`)
- Leaderboard: Redis sorted set, not live DB query
- Calendar: Single query with `WHERE activity_date BETWEEN $start AND $end`
- Stats: Pre-aggregated in `user_streaks.total_active_days`

### 10.3 Timezone Handling
- User timezone stored in `user_streaks.timezone` (IANA format, e.g., 'America/New_York')
- `recordActivity()` converts UTC timestamp to user's local date: `(NOW() AT TIME ZONE timezone)::DATE`
- Midnight cron processes timezone buckets, not all users at once
- ~24 timezone buckets per day (one per UTC offset hour)

### 10.4 Scaling Considerations
- Redis cache ensures sub-ms reads for streak status
- Midnight cron is batched by timezone (~1/24th of users per hour)
- BullMQ worker can scale horizontally (add more consumers)
- Denormalized `users` table columns avoid JOINs for existing queries

---

## 11. Error Handling

| Scenario | Handling |
|----------|----------|
| Duplicate activity log | UNIQUE constraint → catch error, return current state |
| Redis unavailable | Graceful fallback to DB (existing pattern) |
| Freeze purchase with insufficient XP | Return 400 with clear message |
| Freeze apply on non-broken streak | Return 400: "Streak is not broken" |
| Midnight cron failure | Retry on next hourly run, log error, alert |
| Concurrent recordActivity calls | DB transaction + FOR UPDATE lock |
| User has no streak row | Auto-initialize on first API call |

---

## 12. Verification Plan

### 12.1 Unit Tests
- `streak.service.test.ts`: recordActivity idempotency, streak increment, streak break, freeze apply, freeze purchase, milestone detection, timezone calculations
- `streak.controller.test.ts`: API endpoint validation, auth, error responses
- `streak-validation.job.test.ts`: midnight validation logic, freeze auto-apply, timezone bucketing

### 12.2 Integration Tests
- Full flow: register → log activity → verify streak = 1 → next day activity → streak = 2
- Freeze flow: earn freeze → miss day → verify auto-applied → streak preserved
- Break flow: miss day with 0 freezes → verify streak = 0 → verify Socket.IO event emitted
- Purchase flow: verify XP deduction → freeze count increment → max 3 cap

### 12.3 Manual Testing
- Start dev server, log various activities, verify streak widget updates in real-time
- Change timezone, verify midnight validation fires at correct local time
- Verify achievement tree consistency checks still work
- Verify AI coach mentions streak status in conversation
- Verify proactive messaging sends streak_risk notifications
