# AI Coach Scheduled Calling — Design Spec

## Overview

The AI coach calls users at their chosen times for personalized check-ins, exactly like a human coach would. Users set preferred call times; BullMQ schedules jobs at those exact moments; the call arrives via the existing chat call system (`chat:call:incoming`). If the user doesn't answer, the system records the miss, sends a follow-up chat message, delivers a push notification, and learns to avoid bad hours over time.

## Goals

1. AI coach rings users through the same chat call UI as peer-to-peer calls (accept/decline overlay).
2. Users control when they're called (`preferredCallTimes` in `user_preferences`).
3. Calls are scheduled as BullMQ delayed jobs — no polling, no wasted CPU cycles.
4. Missed calls trigger a conversational follow-up in the AI Coach chat + push notification.
5. Adaptive learning: repeated misses at the same hour suppress future calls at that hour.
6. All existing preference gates are respected: quiet hours, DND days, frequency cap, max calls/day.

## Non-Goals

- Video calls from AI coach (voice only).
- AI coach calling during an active call with another user.
- Real-time speech-to-text during the call (handled by existing voice-session infrastructure).
- User-to-AI outbound calling changes (already works via voice assistant).

---

## Architecture

### System Diagram

```
User sets preferredCallTimes via API
  │
  ▼
voice-schedule.service ──► ai-coach-call-queue.service
  (syncs BullMQ jobs)        (Queue: AI_COACH_CALL)
                                  │
                    ┌─────────────┴──────────────┐
                    │   BullMQ Delayed Jobs       │
                    │   jobId: call:{uid}:{date}:{HH:MM}  │
                    │   delay = targetTime - now  │
                    └─────────────┬──────────────┘
                                  │ fires at exact time
                                  ▼
                    ai-coach-call.worker.ts
                      │
                      ├─ 1. Validate preferences (quiet hours, DND, freq cap, miss threshold)
                      ├─ 2. Check user not already in a call
                      ├─ 3. Build pre-call context (daily analysis, goals, scores)
                      ├─ 4. chatCallService.initiateAICoachCall(userId, context)
                      │       └─ emits chat:call:incoming via Socket.IO
                      ├─ 5. pushNotificationService.deliverForUser() — "Your coach is calling"
                      └─ 6. Write ai_coach_call_log row (chat_call_id, status='initiated')
                              │
                      ┌───────┴───────────────────┐
                      │                           │
                   Answered                  Missed/Declined/Offline
                      │                           │
                  Normal voice session       finishCall() updates ai_coach_call_log
                  via server media bridge    directly (durable — no callbacks)
                  (quick_checkin)             ├─ Record miss in checkin_miss_count_by_hour
                                              ├─ Send chat follow-up message
                                              ├─ Send push: "Missed check-in"
                                              └─ Offline users → status 'skipped_offline'
                                                  (does NOT count toward miss threshold)
```

### Reconciler (Daily Safety Net)

```
ai-coach-call-reconciler.job.ts
  │
  ├─ Runs once daily at 00:05 UTC
  ├─ Queries all users with preferredCallTimes + ai_call_frequency != 'off'
  ├─ For each user, ensures BullMQ jobs exist for today's remaining times
  ├─ Deduplicates via jobId convention
  └─ Handles server restarts, missed schedules, timezone edge cases
```

---

## Components

### New Files

| File | Purpose |
|------|---------|
| `server/src/services/ai-coach-call-queue.service.ts` | BullMQ queue management — schedule, cancel, reschedule jobs |
| `server/src/workers/ai-coach-call.worker.ts` | BullMQ worker — processes scheduled call jobs |
| `server/src/jobs/ai-coach-call-reconciler.job.ts` | Daily reconciler ensuring jobs exist for all users |
| `server/src/database/migrations/20260513_ai_coach_call_log.sql` | Call log table for analytics and adaptive learning |

### Modified Files

| File | Change |
|------|--------|
| `server/src/config/queue.config.ts` | Add `AI_COACH_CALL` queue name + job types |
| `server/src/services/voice-schedule.service.ts` | On `updateScheduleSettings()`, sync BullMQ jobs via queue service |
| `server/src/services/chat-call.service.ts` | Add `initiateAICoachCall()` — creates call from AI coach user to target user |
| `server/src/index.ts` | Start worker + reconciler, register graceful shutdown |
| `server/src/services/communication-preferences.service.ts` | Add `recordMiss()` helper to increment `checkin_miss_count_by_hour` |

---

## Detailed Design

### 1. Queue Service (`ai-coach-call-queue.service.ts`)

```typescript
class AICoachCallQueueService {
  private queue: Queue | null = null;

  // Lazy init following email-queue.service.ts pattern
  private initialize(): void { ... }

  // Schedule a call at exact user-local time
  async scheduleCall(userId: string, timeHHMM: string, timezone: string, date?: string): Promise<void>

  // Remove all pending jobs for a user by querying stored bullmq_job_id from DB (not prefix scan)
  async cancelUserJobs(userId: string): Promise<void>

  // Reschedule all jobs for a user (preference change or timezone update)
  async syncUserSchedule(userId: string): Promise<void>

  // Get pending jobs for a user (debugging/admin)
  async getPendingJobs(userId: string): Promise<JobInfo[]>
}
```

**Job Data Shape:**

```typescript
interface AICoachCallJobData {
  userId: string;
  scheduledTimeHHMM: string;   // "21:00"
  timezone: string;             // "Asia/Karachi"
  sessionType: 'quick_checkin'; // future: coaching_session, goal_review
  attempt: number;              // always 1 for scheduled calls
}
```

**Job ID Convention:** `ai-call:{userId}:{YYYY-MM-DD}:{HH:MM}`

This ensures:
- No duplicate jobs for the same user/time/day
- Easy bulk cancellation by userId prefix
- Debuggable via BullMQ dashboard

**Delay Calculation (DST-safe):**

```typescript
function computeDelay(timeHHMM: string, timezone: string, targetDate: string): number {
  // Build full date+time in user timezone, correctly handling DST transitions.
  // targetDate is YYYY-MM-DD. If the resulting time is in the past, return -1 (skip).
  // If the time is in a DST gap (e.g. 02:30 skipped), Luxon auto-adjusts forward.
  const [hour, minute] = timeHHMM.split(':').map(Number);
  const target = DateTime.fromObject(
    { year: +targetDate.slice(0,4), month: +targetDate.slice(5,7), day: +targetDate.slice(8,10), hour, minute },
    { zone: timezone }
  );
  if (!target.isValid) return -1;
  const delayMs = target.toMillis() - Date.now();
  return delayMs > 0 ? delayMs : -1;
}
```

**Stored per job for auditability:**
- `scheduledTimeHHMM`: original user-local time ("21:00")
- `scheduledDate`: target date ("2026-05-13")
- `scheduledUtc`: resolved UTC timestamp (what BullMQ actually fires at)
- `timezone`: user timezone at scheduling time

**Queue Configuration:**

```typescript
{
  attempts: 2,               // one retry on transient failure
  backoff: { type: 'fixed', delay: 5000 },  // 5s retry delay
  removeOnComplete: { age: 86400, count: 5000 },  // 24h retention
  removeOnFail: { age: 604800, count: 2000 },     // 7d for debugging
}
```

### 2. Worker (`ai-coach-call.worker.ts`)

The worker processes one job at a time per user (BullMQ concurrency = 10, but rate-limited to prevent thundering herd).

**Processing Flow:**

```
1. Extract { userId, scheduledTimeHHMM, timezone } from job.data
2. GATE: Check ai_call_frequency !== 'off'
3. GATE: Check DND day (dnd_days includes today's weekday)
4. GATE: Check quiet hours (quiet_hours_enabled + range check)
5. GATE: Check miss threshold (checkin_miss_count_by_hour[hour] < 3)
6. GATE: Check daily cap (count today's ai_coach_call_log entries < max_checkins_per_day)
7. GATE: Check user not in active call (chatCallService has no active call for user)
8. GATE: Check user is online (socketService.isUserConnected) — if offline, skip call, send push only
9. Build pre-call context:
   - Latest daily analysis report
   - Active goals + progress
   - Today's tracked activities (meals, workouts, sleep)
   - Coaching profile personality + relationship depth
10. chatCallService.initiateAICoachCall(userId, context)
11. pushNotificationService.deliverForUser(userId, { title: "Your coach is calling", ... })
12. Log to ai_coach_call_log (status: 'initiated', chat_call_id = call.id)
```

**Outcome Handling (durable — no in-memory callbacks):**

The `chatCallService.finishCall()` already handles call timeout at 45s. Instead of fragile in-memory callbacks (lost on server restart), `finishCall()` checks whether the call's `initiatorId === AI_COACH_USER_ID` and updates `ai_coach_call_log` directly in the database.

```
In finishCall(), after persisting call state:
  If call.initiatorId === AI_COACH_USER_ID:
    Query ai_coach_call_log WHERE chat_call_id = call.id
    If status === 'missed' or 'declined' or 'cancelled':
      a. communicationPreferencesService.recordMiss(userId, hour)
      b. Send AI coach chat follow-up message (contextual)
      c. Send push notification with deep link
      d. UPDATE ai_coach_call_log SET status = 'missed'
    If status === 'ended' (call completed normally):
      a. communicationPreferencesService.recordAnswer(userId, hour)
      b. UPDATE ai_coach_call_log SET status = 'answered', call_duration_seconds, answered_at, ended_at
```

This is crash-safe: if the server restarts between call initiation and outcome, the reconciler's next run detects `ai_coach_call_log` rows stuck in `initiated` status for >2 minutes and marks them `missed`.

**Rate Limiting:**

```typescript
const workerOptions = {
  connection: redisConnection,
  concurrency: 10,
  limiter: {
    max: 50,        // max 50 calls per 10 seconds across all users
    duration: 10000,
  },
};
```

### 3. Chat Call Service Extension (`chat-call.service.ts`)

New method `initiateAICoachCall()`:

```typescript
async initiateAICoachCall(
  targetUserId: string,
  context: { preCallContext: string; sessionType: SessionType }
): Promise<ChatCallSession> {
  // 1. Find or verify the AI Coach <-> User direct chat exists
  const chatId = await this.findOrCreateAICoachChat(targetUserId);

  // 2. Create call session with AI coach as initiator
  const call: ChatCallSession = {
    id: randomUUID(),
    chatId,
    chatName: 'AI Coach',
    callType: 'voice',
    isGroupCall: false,
    initiatorId: AI_COACH_USER_ID,
    initiatorName: 'AI Coach',
    initiatorAvatar: null, // uses default AI coach avatar from seed
    participantProfiles: new Map([...]),
    participantIds: [AI_COACH_USER_ID, targetUserId],
    invitedUserIds: [targetUserId],
    acceptedUserIds: new Set([AI_COACH_USER_ID]),
    ...
  };

  // 3. Emit incoming call to user
  socketService.emitToUser(targetUserId, EVENTS.INCOMING, this.toPayload(call));

  // 4. Set timeout for missed call
  call.timeout = setTimeout(() => this.timeoutCall(call.id), CALL_TIMEOUT_MS);

  // 5. Persist call start
  this.calls.set(call.id, call);
  await this.persistCallStart(call);

  return call;
}

// When user accepts, the existing accept() flow handles WebRTC setup.
// The voice-session.service creates a quick_checkin session.
// AI responds via the existing AI coach voice pipeline.

private async findOrCreateAICoachChat(userId: string): Promise<string> {
  // Query for existing direct chat between AI coach and user
  const result = await query<{ id: string }>(
    `SELECT c.id FROM chats c
     JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = $1
     JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = $2
     WHERE c.is_group_chat = false AND cp1.left_at IS NULL AND cp2.left_at IS NULL
     LIMIT 1`,
    [AI_COACH_USER_ID, userId]
  );
  if (result.rows[0]) return result.rows[0].id;
  // Create if missing (edge case — should exist from onboarding)
  const chat = await chatService.createOrGetChat({
    userId: AI_COACH_USER_ID,
    otherUserId: userId,
    isGroupChat: false,
  });
  return chat.id;
}
```

**Call Acceptance Flow:**

When the user taps "Accept" on the incoming call overlay:
1. Client emits `chat:call:accept` (existing flow)
2. `chatCallService.accept()` transitions call to `active`
3. WebRTC peer connection established (existing flow)
4. `voiceSessionService.createSession()` with `session_type: 'quick_checkin'`
5. AI coach voice responds using the existing AI provider pipeline
6. `finishCall()` detects `initiatorId === AI_COACH_USER_ID` and updates `ai_coach_call_log` directly

**How AI Joins the Call (Server Media Bridge):**

The AI coach is NOT a browser WebRTC peer. When the user accepts:
1. The client establishes a WebRTC peer connection to the **server** (not to another browser)
2. The server's `voiceSessionService` creates a voice session with the existing AI provider pipeline (OpenAI Realtime API / TTS+STT)
3. The server bridges audio: user's WebRTC media stream ↔ AI provider audio stream
4. This is the same flow used when a user initiates a call to the AI coach via the voice assistant — the only difference is who initiated it

No changes needed to the media pipeline. The `chat:call:incoming` just controls **who rings whom**; the voice session handles the actual conversation.

**Consent & Abuse Controls:**

Before initiating any AI coach call, the worker validates these gates in order:

| Gate | Check | Source |
|------|-------|--------|
| Account active | `users.is_active = true` | users table |
| AI calls enabled | `ai_call_frequency !== 'off'` | user_preferences |
| Check-in push consent | `checkin_push_enabled = true` | user_communication_preferences |
| Subscription/entitlement | User has active subscription OR free tier with remaining credits | subscription.service |
| Daily follow-up cap | Max 1 missed-call follow-up message per day | ai_coach_call_log count WHERE status='missed' AND scheduled_date=today |
| Not deactivated/deleted | No soft-delete or pending deletion flag | users table |

These gates run before any DND/quiet-hours checks. If any consent gate fails, the job completes silently with `status: 'skipped'` and appropriate `skip_reason`.

### 4. AI Coach Call Log Table

```sql
CREATE TABLE IF NOT EXISTS ai_coach_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_call_id UUID,                        -- FK to chat_calls.id (nullable until call created)
  scheduled_time TIME NOT NULL,             -- "21:00:00"
  scheduled_date DATE NOT NULL,             -- "2026-05-13"
  timezone VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
    -- scheduled | initiated | answered | missed | skipped | cancelled
  skip_reason VARCHAR(128),                 -- why skipped (quiet_hours, dnd_day, freq_cap, miss_threshold, offline, active_call)
  session_type VARCHAR(48) DEFAULT 'quick_checkin',
  pre_call_context TEXT,
  followup_message_id UUID,                 -- FK to messages.id (follow-up chat message)
  call_duration_seconds INTEGER,
  initiated_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_coach_call_log_user_date
  ON ai_coach_call_log (user_id, scheduled_date DESC);

CREATE INDEX idx_ai_coach_call_log_status
  ON ai_coach_call_log (status)
  WHERE status IN ('scheduled', 'initiated');

-- DB is source of truth for deduplication, not just BullMQ job IDs
CREATE UNIQUE INDEX uq_ai_coach_call_log_user_date_time
  ON ai_coach_call_log (user_id, scheduled_date, scheduled_time, session_type)
  WHERE status NOT IN ('cancelled');

-- Store BullMQ job ID for exact cancellation (avoids expensive prefix scanning)
ALTER TABLE ai_coach_call_log ADD COLUMN IF NOT EXISTS bullmq_job_id VARCHAR(128);
```

### 5. Reconciler Job (`ai-coach-call-reconciler.job.ts`)

Runs once daily at 00:05 UTC. Ensures BullMQ jobs exist for all users' preferred times.

```
1. Query all active users with ai_call_frequency != 'off' AND preferred_call_times IS NOT NULL
2. For each user (batched, cursor-based like existing checkin-call.job.ts):
   a. Get user's timezone, preferred times, DND days
   b. Skip if today is a DND day for this user
   c. For each preferred time:
      - Compute UTC target time for today
      - Skip if time already passed
      - Check if BullMQ job already exists (by jobId)
      - If not, schedule via ai-coach-call-queue.service
3. Also insert ai_coach_call_log entries with status 'scheduled' for audit trail
```

**Why a reconciler?**
- Server restarts lose in-memory timers but BullMQ jobs persist in Redis.
- Edge case: Redis flush or job eviction. Reconciler re-creates missing jobs.
- New user sign-up or preference change between reconciler runs: handled by real-time sync in `voice-schedule.service.updateScheduleSettings()`.
- The reconciler is a safety net, not the primary scheduling mechanism.

### 6. Missed Call Follow-Up

When a call is missed, the AI coach sends a contextual chat message:

```typescript
async sendMissedCallFollowUp(userId: string, scheduledTime: string): Promise<void> {
  const chatId = await this.findOrCreateAICoachChat(userId);
  const hour = parseInt(scheduledTime.split(':')[0], 10);

  // Use proactive messaging service for contextual, persona-aware message generation
  const message = await proactiveMessagingService.generateMessage(userId, {
    type: 'missed_checkin_call',
    data: { scheduledTime, hour, missCount: currentMissCount },
  });

  await messageService.sendMessage({
    chatId,
    senderId: AI_COACH_USER_ID,
    content: message,
    contentType: 'text',
  });

  await pushNotificationService.deliverForUser(userId, {
    title: 'Missed check-in',
    body: 'Your coach tried to call. Tap to reschedule or call back.',
    type: 'missed_checkin',
    category: 'coaching',
    actionUrl: `/chat?chatId=${chatId}`,
  });
}
```

### 7. Adaptive Learning

Already partially implemented via `checkin_miss_count_by_hour` in `user_communication_preferences`. This design leverages it:

**Miss Recording:**
```typescript
// In communication-preferences.service.ts
async recordMiss(userId: string, hour: number): Promise<void> {
  const prefs = await this.getForUser(userId);
  const counts = { ...prefs.checkin_miss_count_by_hour };
  counts[String(hour)] = (counts[String(hour)] || 0) + 1;
  await this.upsert(userId, { checkin_miss_count_by_hour: counts });
}

async recordAnswer(userId: string, hour: number): Promise<void> {
  const prefs = await this.getForUser(userId);
  const counts = { ...prefs.checkin_miss_count_by_hour };
  counts[String(hour)] = 0; // reset on successful answer
  await this.upsert(userId, { checkin_miss_count_by_hour: counts });
}
```

**Skip Logic (in worker gate checks):**
```
if (missByHour[hour] >= CHECKIN_MISS_SKIP_THRESHOLD) {
  log status = 'skipped', skip_reason = 'miss_threshold'
  return; // don't call
}
```

**Threshold:** 3 misses at the same hour (configurable via `CHECKIN_MISS_SKIP_THRESHOLD` env var). When the follow-up chat message asks "was it a bad time?", the user's response can be used to reset the counter or suggest a new preferred time.

### 8. Preference Sync on Update

When user calls `PATCH /api/voice-schedule/schedule` with new `preferredCallTimes`:

```typescript
// In voice-schedule.service.ts updateScheduleSettings()
if (settings.preferredCallTimes !== undefined) {
  // After DB update succeeds:
  await aiCoachCallQueueService.syncUserSchedule(userId);
}
```

`syncUserSchedule()`:
1. Cancel all existing BullMQ jobs for this user
2. Get updated preferences from DB
3. Schedule new jobs for each preferred time today (if time hasn't passed)
4. No jobs scheduled if `ai_call_frequency === 'off'`

---

## Scalability Considerations

### BullMQ Performance

- **Job storage**: Redis sorted sets. 100K users with 2 preferred times each = 200K jobs/day. BullMQ handles millions of jobs efficiently.
- **Worker concurrency**: 10 concurrent job processors with rate limiter (50 calls/10s). Prevents thundering herd at popular times (e.g., 9 PM).
- **Job size**: ~200 bytes per job payload. Minimal Redis memory impact.
- **Job cleanup**: Completed jobs removed after 24h, failed after 7d.

### Database Impact

- `ai_coach_call_log`: Write-heavy but small rows. Partitioned index on `(user_id, scheduled_date)` for efficient queries.
- `user_communication_preferences`: JSONB update for `checkin_miss_count_by_hour` — single row per user, no contention.
- No new joins in hot paths. All gate checks are single-row lookups by user_id (indexed primary key).

### Socket.IO Impact

- AI coach calls use the same `chat:call:incoming` event as peer calls. No new socket events.
- Rate limiter prevents more than 50 simultaneous call initiations, avoiding socket fan-out spikes.

### Failure Modes

| Failure | Mitigation |
|---------|-----------|
| Redis down | Queue service returns gracefully (lazy init pattern). Reconciler catches up on recovery. |
| Worker crash mid-job | BullMQ auto-retries (2 attempts, 5s backoff). Job marked failed after exhaustion. |
| User timezone change | `syncUserSchedule()` called on timezone update. Reconciler corrects daily. |
| Server restart | BullMQ jobs persist in Redis. Worker reconnects and processes pending. Reconciler fills gaps. |
| Clock skew | BullMQ uses Redis server time, not node process time. Consistent across workers. |
| AI coach chat doesn't exist | `findOrCreateAICoachChat()` creates it on demand. |

---

## Integration with Existing Infrastructure

### What We Reuse (Zero Duplication)

| Existing Component | How We Use It |
|---|---|
| `chatCallService` (chat-call.service.ts) | New `initiateAICoachCall()` method. Full call lifecycle (accept, decline, timeout, persist) is inherited. |
| `ChatCallProvider.tsx` | Client-side incoming call overlay works unchanged. AI coach appears as caller. |
| `socketService.emitToUser()` | Delivers `chat:call:incoming` event. No new socket events. |
| `pushNotificationService` | FCM push for "coach is calling" and "missed check-in". |
| `communicationPreferencesService` | All gate checks (quiet hours, DND, frequency, miss tracking). |
| `voiceScheduleService` | Preference storage (preferredCallTimes, aiCallFrequency). |
| `voiceSessionService` | Creates `quick_checkin` session when call is answered. |
| `proactiveMessagingService` | Generates contextual missed-call follow-up messages. |
| `timingProfileService` | Future enhancement: suggest optimal call times from engagement data. |
| `notificationEngine` | DB notification + Socket.IO real-time delivery. |
| `queueConfig` + `redisConnection` | BullMQ infrastructure (queue.config.ts). |
| `dailyAnalysisService` | Pre-call context for what the AI coach should discuss. |
| AI Coach user seed | Fixed UUID `00000000-...-0001` as call initiator. |

### What the Existing `checkin-call.job.ts` Becomes

The existing interval-based batch job is superseded by this design. Migration plan:
1. Deploy new BullMQ-based system alongside existing job.
2. Add feature flag `AI_COACH_CALL_BULLMQ_ENABLED` (default `false`).
3. When enabled, the existing `checkin-call.job.ts` skips users who have `preferredCallTimes` set.
4. Once validated in production, deprecate and remove the old job.

---

## API Changes

No new API endpoints needed. Existing endpoints handle everything:

| Endpoint | Current | Change |
|----------|---------|--------|
| `PATCH /api/voice-schedule/schedule` | Updates preferences in DB | Also syncs BullMQ jobs |
| `GET /api/voice-schedule/preferences` | Returns preferences | No change (preferredCallTimes already exposed) |
| `GET /api/voice-schedule/can-call` | Checks if AI can call now | No change (used for manual checks) |

---

## Testing Strategy

### Unit Tests

- `ai-coach-call-queue.service.test.ts`: Job scheduling, cancellation, deduplication, delay calculation across timezones.
- `ai-coach-call.worker.test.ts`: Each gate check individually. Mock all services. Verify correct skip_reason logged.
- `chat-call.service.test.ts`: `initiateAICoachCall()` creates correct session, emits correct events.
- `communication-preferences.service.test.ts`: `recordMiss()` and `recordAnswer()` correctly update JSONB.

### Integration Tests

- Schedule a call, verify BullMQ job exists with correct delay.
- Preference update triggers job reschedule.
- Full call flow: job fires → call initiated → user accepts → session created.
- Missed call flow: job fires → timeout → follow-up message sent → miss recorded.

### Manual QA

- Set preferred time 2 minutes from now. Verify incoming call overlay appears.
- Decline the call. Verify follow-up chat message appears.
- Set 3+ misses at same hour. Verify next call at that hour is skipped.
- Change preferred times. Verify old jobs cancelled, new ones scheduled.
- Restart server. Verify pending jobs still fire at correct times.

---

## Rollout Plan

1. **Phase 1**: Deploy queue service + worker + reconciler behind feature flag. Log-only mode (no actual calls).
2. **Phase 2**: Enable for internal team (5 users). Monitor BullMQ dashboard, check timing accuracy.
3. **Phase 3**: Enable for all users with `preferredCallTimes` set. Monitor miss rates, follow-up engagement.
4. **Phase 4**: Deprecate `checkin-call.job.ts` interval scanner for users with preferred times.
