# Contextual Timing — Design Spec

**Date**: 2026-04-17
**Status**: Design approved, ready for implementation plan
**Related**: proactive-messaging.service.ts, reminder-processor.job.ts, user_preferences

---

## Context

The yHealth app sends up to 4 proactive coach messages per user per day via `proactive-messaging.service.ts`. Each of the ~40 message types has a **hardcoded semantic window** (morning_briefing 6–10 AM, nutrition 6–10 PM, habit_missed 6–10 PM, etc.) plus a global 6 AM–10 PM filter and the user's IANA timezone. Every user is treated identically inside those windows — a morning person and a night owl both get their `morning_briefing` at the same local hour.

Daily check-in reminders are likewise a fixed default: `user_preferences.preferred_check_in_time = '09:00'`. Most users never change it. Scheduled activity reminders use per-row `reminder_time` on `scheduled_reminders`, also user-set or default.

**The problem**: the app has no sense of *when this specific user is awake, talkative, and likely to respond*. A user who journals every night at 10:30 PM still gets their morning_briefing at 7 AM and ignores it. A post-lunch checker-in gets nudged at 09:00 and swipes away.

**The outcome**: a nightly analyzer mines four engagement signals from the last 14 days — chat messages the user sent, `daily_checkins.logged_at`, `reminder_logs.action_at`, `activity_logs.completed_at` — builds a 24-hour engagement histogram in the user's local timezone, and writes a `user_timing_profiles` row containing `peak_hour`, `secondary_hour`, and a confidence score. The proactive messaging scorer then biases candidates toward peak hours *within* their existing semantic window (never outside), and the default check-in reminder auto-updates to the learned peak unless the user has explicitly overridden it. A Preferences UI shows the learned peak with a manual override.

---

## Scope decisions (from discussion)

| Decision | Choice |
|---|---|
| Influence surfaces | Proactive messages **and** check-in reminder **and** scheduled activity reminders (default-only) **and** morning-briefing |
| Engagement signals | Chat messages sent + daily check-in `logged_at` + reminder action latency + activity completions |
| Apply strategy | **Bias within existing type windows** — never send a type outside its semantic window |
| Cold-start threshold | 14 days and ≥20 events; below that, fall back to `preferred_check_in_time` / 09:00 |
| Recompute cadence | Nightly batch job at ~03:00 UTC |
| Transparency | Visible in Preferences with manual override toggle |

---

## Architecture

### 1. Data model

**New table**: `user_timing_profiles`

```sql
CREATE TABLE user_timing_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Learned peaks (local hour, 0–23). Null until first successful compute.
  peak_hour SMALLINT CHECK (peak_hour BETWEEN 0 AND 23),
  secondary_hour SMALLINT CHECK (secondary_hour BETWEEN 0 AND 23),

  -- 24-slot local-hour histogram, smoothed.
  hour_histogram JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- How much data went into this profile.
  event_count INTEGER NOT NULL DEFAULT 0,
  signals_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { messages: N, checkins: N, ... }

  -- 0.0 (cold-start) → 1.0 (stable, high-confidence)
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.0,

  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_timing_profiles_computed
  ON user_timing_profiles(last_computed_at DESC);
```

**New column** on `user_preferences`:

```sql
ALTER TABLE user_preferences
  ADD COLUMN preferred_check_in_time_override BOOLEAN NOT NULL DEFAULT FALSE;
```

Purpose: when TRUE, the nightly reconciler will **not** overwrite `preferred_check_in_time` with the learned peak. Users who set their own time get to keep it.

### 2. Signal aggregator — `server/src/services/timing-profile.service.ts`

Public surface:
```
detectPeakHours(userId, now = Date): Promise<TimingComputation>
computeAndStoreProfile(userId): Promise<UserTimingProfile | null>
getProfile(userId): Promise<UserTimingProfile | null>
setManualOverride(userId, { preferredCheckInTime }): Promise<void>
```

`computeAndStoreProfile` per user:
1. Resolve user's IANA timezone from `users.timezone` (fallback UTC).
2. Query the last **14 days** from four tables:
   - `messages.created_at` where `sender_id = user_id` (user's own messages — talkative signal)
   - `daily_checkins.logged_at`
   - `reminder_logs.action_at` where user acted (not just triggered)
   - `activity_logs.completed_at`
3. For each event, convert UTC → user-local hour (0–23) and bin into a 24-slot counter. Apply per-signal weights: messages × 1.0, checkins × 2.5, activity × 2.0, reminder_action × 1.5 (intent ≠ volume).
4. Smooth with a 3-hour rolling sum (so a single outlier 3 AM event doesn't pick 3 AM as peak).
5. `event_count = sum of raw, unweighted events`.
6. Compute `confidence`:
   - `0.0` if `event_count < 20` or observation span < 7 days
   - Otherwise `min(1.0, event_count / 80) × coverage_factor` where `coverage_factor` = fraction of the 14-day window with ≥1 event
7. Pick `peak_hour` = argmax of smoothed histogram. `secondary_hour` = argmax excluding ±2 hours around peak (so peak 8 AM won't also flag 9 AM).
8. UPSERT into `user_timing_profiles`.

### 3. Nightly job — `server/src/jobs/timing-profile.job.ts`

- Cron-esque `setInterval` matching existing job style; staggered at boot + ~21 min after goal-reconnection job.
- For each user with any event in the last 14 days, call `computeAndStoreProfile`.
- Batch size 10, inter-batch delay 1s (matches other jobs).
- Two phases:
  - **Phase A**: compute profiles.
  - **Phase B**: reconcile `user_preferences.preferred_check_in_time` — if `preferred_check_in_time_override = FALSE` AND profile confidence ≥ 0.6 AND `peak_hour` is in [5, 22], set `preferred_check_in_time = '<peak_hour>:00'`. Otherwise no-op.

### 4. Proactive messaging integration

**Zero new code paths — extend the existing scoring.**

In `proactive-messaging.service.ts#scoreMessageCandidates`:
- Fetch the user's `user_timing_profiles` row once per cycle (cached alongside the existing `context` object).
- After the existing type-window check, add a **bonus**:
  - If `confidence >= 0.4` and current user-local hour is within ±1 hour of `peak_hour`: `+15` points.
  - Within ±1 hour of `secondary_hour`: `+8` points.
  - Within the user's `quiet_hours` (existing field): `-20` points.
- Bias, not gate. A candidate's `timeWindowValid` decision is unchanged; only its rank inside the sort shifts.

### 5. Reminder-processor integration

No change to `reminder-processor.job.ts` itself — it already reads `reminder_time` per row.

The contextual-timing effect on reminders comes from two places:
- **Default check-in reminder**: Phase B of the timing-profile job updates `user_preferences.preferred_check_in_time` (the default the reminder-creator uses for new users).
- **New `scheduled_reminders`**: when a reminder is created with no explicit user-chosen time, the reminder-creation path reads `user_preferences.preferred_check_in_time` — so the learned value is picked up transparently. If the existing code hardcodes 09:00 anywhere, swap to read the preference.

### 6. Preferences UI

**New section** in the existing Preferences page (`client/app/(pages)/preferences` or equivalent — confirm during planning): "Best time to reach you".

- Display: *"We noticed you're most active around **7:30 AM** (learned from your activity over the last 14 days)."*
- If confidence < 0.4: *"We're still learning your rhythm — check back in a few days."*
- Input: Time picker pre-filled with `preferred_check_in_time`. Saving sets `preferred_check_in_time_override = TRUE` + the new time.
- "Reset to learned" button clears the override.

Minimal endpoint additions: `GET /api/timing-profile` (returns profile + current override state) and `PATCH /api/preferences/check-in-time` (sets time + override).

### 7. Data flow

```
[messages.created_at]
[daily_checkins.logged_at]       →  nightly job  →  user_timing_profiles  →  scoreMessageCandidates (bias)
[reminder_logs.action_at]                                                 →  preferences reconciler → user_preferences.preferred_check_in_time
[activity_logs.completed_at]                                              →  Preferences UI
```

---

## Critical files (new vs modified)

### New
- `server/src/database/tables/118-user-timing-profiles.sql`
- `server/src/database/migrations/20260418000000_user_timing_profiles.sql`
- `server/src/services/timing-profile.service.ts`
- `server/src/jobs/timing-profile.job.ts`
- `server/src/controllers/timing-profile.controller.ts`
- `server/src/routes/timing-profile.routes.ts`
- `shared/types/domain/timing.ts`
- Frontend: a "Best time to reach you" panel inside the existing Preferences page (exact path confirmed in planning)

### Modified
- `server/src/database/tables/05-user-preferences.sql` — add `preferred_check_in_time_override BOOLEAN`
- `server/src/database/auto-migrate.ts` + `setup.ts` — register new table
- `server/src/services/proactive-messaging.service.ts#scoreMessageCandidates` — add peak-hour bonus / quiet-hour penalty
- `server/src/routes/index.ts` — mount `/api/timing-profile`
- `server/src/index.ts` — start `timingProfileJob` (staggered)
- `server/package.json` — `db:migrate:timing-profile` npm script
- `shared/types/domain/index.ts` — re-export

### Reused (no changes)
- `proactiveMessagingService.sendProactiveMessage` — delivery unchanged
- `reminder-processor.job.ts` — reads `reminder_time` unchanged
- Existing `user_preferences.timezone` + `quiet_hours_*` fields
- `aiProviderService` — not used; the learner is pure SQL + JS math

---

## Error handling

- If a user has <20 events in 14 days → `confidence = 0`, no UPDATE to `preferred_check_in_time` (Phase B skips), scorer bonus inactive. The existing defaults govern.
- If the nightly job fails for a single user → log, continue with the batch (mirrors `obstacle-detector.job.ts` pattern).
- If `peak_hour` falls outside [5, 22] (e.g., genuine night-shift worker) → still store in profile for transparency, but Phase B skips reconciling to avoid 2 AM check-in reminders. Proactive scorer bonus still applies if the user engages at those hours.
- Override toggle persists independently of the nightly job — setting the override immediately prevents further auto-reconciliation.

## Testing

**Unit**
- `timing-profile.service.spec.ts`:
  - Seed 25 messages clustered at 19:00–21:00 local → assert `peak_hour` = 20, confidence > 0.4.
  - Seed 10 events only → assert `confidence = 0`, `peak_hour = null`.
  - Seed spread uniformly across hours → assert `secondary_hour ≠ peak_hour ± 2`.
- `proactive-messaging.service.spec.ts`: with a user profile `peak_hour = 8, confidence = 0.7`, at user-local 08:00, scoring should rank a morning candidate above the same candidate at user-local 10:00.

**Integration**
- Insert a user with 14 days of check-ins at 07:30 local → run the job → assert profile row exists with `peak_hour = 7` and `user_preferences.preferred_check_in_time = '07:00'`.
- Set `preferred_check_in_time_override = TRUE`, re-run job → assert `preferred_check_in_time` unchanged.

**Manual**
1. Run `npm run db:migrate:timing-profile`.
2. Seed chat messages for a test user clustered around 22:00 local.
3. Trigger `node -e "import('./server/src/jobs/timing-profile.job.js').then(m => m.timingProfileJob.runOnce())"`.
4. Verify `SELECT * FROM user_timing_profiles WHERE user_id = '...';` shows `peak_hour = 22`, `confidence > 0`.
5. Open Preferences → see the learned peak and override toggle.
6. Verify the proactive job now ranks a `nutrition` candidate (semantic window 18–22) higher at 22:00 than at 18:00 for that user.

---

## Out of scope (deliberate)

- **Per-message-type learned windows**: e.g., learning "this user responds to nutrition messages specifically at 7 PM". Requires per-(user × type) models; overkill for now.
- **Day-of-week personalization**: weekday vs weekend rhythms. The current design treats all days equally.
- **ML model**: no neural net, no embedding. A 24-bucket histogram with smoothing is fine and debuggable.
- **Notification click-through tracking**: no new tables. We use existing read/action timestamps.
- **Onboarding question**: no "are you a morning or evening person?" prompt — the learner bootstraps from 9 AM default and adapts.
