---
type: feature-implementation
title: AI Coach Calling System
epic: E02
epic_name: Voice Coaching
features: [F2.1]
product: yhealth-platform
status: Implemented
priority: P0
created: 2026-05-14
last_updated: 2026-05-14
owner: salmanxyric
kb_summary: Scheduled and on-demand AI coach voice calls via BullMQ + WebRTC + Socket.IO
---

# AI Coach Calling System

> **Status**: Implemented  
> **Epic**: E02 — Voice Coaching  
> **Feature**: F2.1 — Voice Call Initiation  
> **Related Stories**: S02.1.2 (AI-Initiated Proactive Calls), S02.1.3 (Scheduled Coaching Sessions), S02.6.1 (Voice & Schedule Customization)

---

## Overview

The AI Coach Calling system enables the AI health coach to proactively call users at their preferred times for check-in sessions. Users configure call frequency, preferred times, quiet hours, and do-not-disturb days via the settings UI. The system uses BullMQ for job scheduling with Redis, Socket.IO for real-time call signaling, and WebRTC for peer-to-peer voice communication.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                         │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  VoiceAssistant   │  │ ChatSettingsModal│  │ ChatCall     │  │
│  │  SettingsSection  │  │ (Ringtone)       │  │ Provider     │  │
│  │  (Call Schedule)  │  │                  │  │ (Call State)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│           ▼                     ▼                    ▼          │
│     PATCH /preferences    useRingtone hook     Socket.IO       │
│     (call times, freq,    (localStorage)       Events          │
│      DND, quiet hours)                                         │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Server (Express)                         │
│                                                                 │
│  ┌─────────────────┐    ┌───────────────────┐                  │
│  │  Voice Schedule  │◄──│ AI Coach Call      │                  │
│  │  Service         │    │ Queue Service      │                  │
│  │  (preferences)   │    │ (BullMQ producer)  │                  │
│  └─────────────────┘    └────────┬──────────┘                  │
│                                  │                              │
│  ┌─────────────────┐    ┌────────▼──────────┐                  │
│  │  Reconciler Job  │───│ AI Coach Call      │                  │
│  │  (daily scan)    │    │ Worker (BullMQ)    │                  │
│  └─────────────────┘    └────────┬──────────┘                  │
│                                  │ Gate checks pass             │
│                         ┌────────▼──────────┐                  │
│                         │  Chat Call Service │                  │
│                         │  (call orchestr.)  │                  │
│                         └────────┬──────────┘                  │
│                                  │                              │
│              Socket.IO emit: chat:call:incoming                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
│                                                                 │
│  PostgreSQL                         Redis                       │
│  ├── user_preferences               ├── BullMQ queue:           │
│  │   (preferred_call_times,          │   ai-coach-call           │
│  │    ai_call_frequency,             └── Job delay scheduling    │
│  │    dnd_days, quiet hours)                                    │
│  ├── ai_coach_call_log                                          │
│  │   (schedule, outcome tracking)                               │
│  └── chat_calls                                                 │
│      (call records, participants)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Server Components

### 1. AI Coach Call Queue Service

**File**: `server/src/services/ai-coach-call-queue.service.ts`

Manages BullMQ job scheduling for AI coach calls.

| Method | Purpose |
|--------|---------|
| `scheduleCall(userId, timeHHMM, timezone, targetDate)` | Creates a delayed BullMQ job that fires at the user's preferred local time |
| `cancelUserJobs(userId)` | Cancels all scheduled jobs for a user (used when preferences change) |
| `syncUserSchedule(userId)` | Cancel-and-reschedule: reads preferences, creates jobs for today |

Each job is idempotent — a unique index on `(user_id, scheduled_date, scheduled_time, session_type)` prevents duplicates.

### 2. AI Coach Call Worker

**File**: `server/src/workers/ai-coach-call.worker.ts`

Processes scheduled call jobs through a 7-gate check pipeline:

| Gate | Check | Skip Reason |
|------|-------|-------------|
| 1 | Feature flag `AI_COACH_CALL_BULLMQ_ENABLED` | `feature_flag_disabled` |
| 2 | User account active | `account_inactive` |
| 3 | AI calls enabled (frequency != 'off') | `ai_calls_disabled` |
| 4 | Check-in push consent | `checkin_push_disabled` |
| 5 | Not a DND day | `dnd_day` |
| 6 | Quiet hours check | `quiet_hours` |
| 7 | Miss threshold (3+ misses at same hour) | `miss_threshold` |
| 8 | Daily call cap not exceeded | `daily_cap` |

If all gates pass, calls `chatCallService.initiateAICoachCall()` which handles both online (socket ring) and offline (push notification) users.

### 3. Chat Call Service

**File**: `server/src/services/chat-call.service.ts`

Core call orchestration with volatile in-memory state:

- **`initiateAICoachCall(targetUserId, context)`** — Creates call session, emits `chat:call:incoming` via socket if online, sends push notification if offline
- **`invite(chatId, initiatorId, callType)`** — User-initiated calls (1-on-1 or group)
- **`accept/decline/cancel/end`** — Call lifecycle management
- **WebRTC relay** — `relayOffer`, `relayAnswer`, `relayIceCandidate` for peer connection
- **Outcome tracking** — Updates `ai_coach_call_log` with answered/missed/declined status
- **Missed call follow-up** — Sends contextual chat message after missed AI coach calls

### 4. Reconciler Job

**File**: `server/src/jobs/ai-coach-call-reconciler.job.ts`

Runs on startup (staggered 1860s) then every 24 hours:

- Recovers stuck "initiated" rows (server crashed mid-call)
- Scans all eligible users and schedules today's BullMQ jobs
- Respects DND days per user timezone

### 5. Voice Schedule Service

**File**: `server/src/services/voice-schedule.service.ts`

CRUD for user voice/call preferences stored in `user_preferences`:

- `preferred_call_times` — `TIME[]` array (e.g., `['09:00', '13:00']`)
- `ai_call_frequency` — `'off' | 'minimal' | 'moderate' | 'proactive'`
- `dnd_days` — `INTEGER[]` (0=Sun, 6=Sat)
- `quiet_hours_enabled`, `quiet_hours_start`, `quiet_hours_end`

---

## Database Schema

### ai_coach_call_log

**Migration**: `server/src/database/migrations/20260513_ai_coach_call_log.sql`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Call log entry ID |
| `user_id` | UUID FK → users | Target user |
| `chat_call_id` | UUID | Links to volatile `chat_calls` record |
| `bullmq_job_id` | VARCHAR(128) | BullMQ job reference |
| `scheduled_time` | TIME | Scheduled local time |
| `scheduled_date` | DATE | Scheduled date |
| `timezone` | VARCHAR(64) | User's timezone |
| `status` | VARCHAR(24) | `scheduled → initiated → answered/missed/declined/skipped/cancelled` |
| `skip_reason` | VARCHAR(128) | Gate check that caused skip |
| `session_type` | VARCHAR(48) | Currently `quick_checkin` |
| `call_duration_seconds` | INTEGER | Duration if answered |
| `followup_message_id` | UUID | Missed-call follow-up message |

**Indexes**: `(user_id, scheduled_date DESC)`, partial on status `IN ('scheduled', 'initiated')`, unique constraint preventing duplicate scheduling.

### chat_calls

**Migration**: `server/src/database/migrations/20260512000000_chat_calls.sql`

Durable record of all calls (user-initiated and AI-initiated):

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Call ID |
| `chat_id` | UUID FK → chats | Chat where call occurred |
| `initiator_id` | UUID FK → users | Who started the call |
| `call_type` | VARCHAR(16) | `voice` or `video` |
| `status` | VARCHAR(24) | `ringing/active/ended/declined/missed/cancelled` |
| `participants` | JSONB | Snapshot of participants with names/avatars |
| `duration_seconds` | INTEGER | Call duration |

---

## Client Components

### 1. ChatCallProvider

**File**: `client/app/providers/ChatCallProvider.tsx`

Global provider managing call state via Socket.IO events:

- Listens for `chat:call:incoming`, `chat:call:outgoing`, `chat:call:accepted`, `chat:call:ended`
- Manages WebRTC peer connections for audio
- **Ringtone integration**: Plays ringtone on incoming/outgoing calls, stops on answer/end
- Provides `incomingCall`, `outgoingCall`, `activeCall` state to the entire app

### 2. Call Ringtone System

**File**: `client/hooks/use-ringtone.ts`

Custom hook for ringtone playback and selection:

| API | Purpose |
|-----|---------|
| `play(loop)` | Start ringtone (looped for incoming calls) |
| `stop()` | Stop ringtone |
| `preview(id)` | Play a ringtone sample (settings preview) |
| `select(id)` | Save ringtone preference to localStorage |
| `selectedRingtone` | Current ringtone ID |

**Ringtone options**:

| ID | Label | File |
|----|-------|------|
| `ring1` | Harmony | `/ring/ring1.mp3` |
| `ring2` | Pulse | `/ring/ring2.mp3` |
| `ring3` | Serenity | `/ring/ring3.mp3` |

**Storage**: `localStorage` key `yhealth-call-ringtone`, default `ring1`.

### 3. Settings UI — Voice Assistant Section

**File**: `client/app/(pages)/settings/components/VoiceAssistantSettingsSection.tsx`

Full settings page with:

- **Call Frequency selector** — Off / Minimal / Moderate / Proactive
- **Preferred Call Times** — Add/remove time chips with time picker
- **Quiet Hours** — Toggle with start/end time
- **Do Not Disturb Days** — Day-of-week toggle buttons
- **Ringtone Selector** — Visual cards with animated waveform bars, play/stop preview, radio selection

### 4. Settings UI — Chat Settings Modal

**File**: `client/app/(pages)/chat/components/ChatSettingsModal.tsx`

Compact ringtone selector in the "Settings and privacy" modal (General tab):

- Shares same `useRingtone` hook and localStorage key as full settings
- Play/stop preview per ringtone
- Radio selection with check indicator

---

## Call Flow — Scheduled AI Coach Call

```
1. Server startup
   └── runColumnSync() creates ai_coach_call_log + chat_calls tables
   └── startAICoachCallWorker() — BullMQ worker ready

2. Reconciler starts (staggered 1860s after boot)
   └── Scans all users with preferred_call_times
   └── For each time: aiCoachCallQueueService.scheduleCall()
       └── INSERT into ai_coach_call_log (status: 'scheduled')
       └── queue.add() with delay = targetUTC - now

3. BullMQ fires job at scheduled UTC time
   └── processAICoachCallJob() runs gate checks
   └── All gates pass → UPDATE status to 'initiated'
   └── chatCallService.initiateAICoachCall(userId)
       ├── Online → Socket.IO emit 'chat:call:incoming'
       │   └── Client ChatCallProvider receives event
       │   └── Ringtone plays, call UI shown
       └── Offline → Push notification sent

4. User answers
   └── chatCallService.accept(callId, userId)
   └── WebRTC peer connection established
   └── Ringtone stops, active call UI shown

5. Call ends
   └── chatCallService.end()
   └── UPDATE ai_coach_call_log: status='answered', duration, timestamps
   └── communicationPreferencesService.recordAnswer(userId, hour)
   └── Call message persisted to chat history

6. User misses/declines
   └── ai_coach_call_log: status='missed'/'declined'
   └── communicationPreferencesService.recordMiss(userId, hour)
   └── Follow-up chat message sent with contextual tone
   └── Push notification: "Missed check-in — tap to chat"
```

---

## Configuration

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `AI_COACH_CALL_BULLMQ_ENABLED` | `true` | Feature flag for scheduled calls |
| `AI_COACH_USER_ID` | `00000000-...0001` | Sentinel user ID for AI coach |
| `REDIS_URL` / `REDIS_HOST` | — | Required for BullMQ queue |
| `CHECKIN_MISS_SKIP_THRESHOLD` | `3` | Misses at same hour before auto-skip |

### User Preferences (PATCH /preferences)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ai_call_frequency` | enum | `moderate` | `off`, `minimal`, `moderate`, `proactive` |
| `preferred_call_times` | TIME[] | `[]` | Times for AI to call (user's local time) |
| `dnd_days` | INTEGER[] | `[]` | Days AI won't call (0=Sun, 6=Sat) |
| `quiet_hours_enabled` | boolean | `false` | Enable quiet period |
| `quiet_hours_start` | TIME | `22:00` | Quiet period start |
| `quiet_hours_end` | TIME | `07:00` | Quiet period end |

---

## Adaptive Behavior

The system learns from user interaction patterns:

- **Miss tracking**: `checkin_miss_count_by_hour` in `user_communication_preferences` tracks misses per hour slot
- **Auto-skip**: After 3+ misses at the same hour, that time slot is automatically skipped
- **Answer reward**: Answering a call resets the miss counter for that hour
- **Contextual follow-up**: Missed call messages adapt tone based on miss count (1st: friendly, 2nd: suggestive, 3rd+: offers to change time)

---

## Bugs Fixed (2026-05-14)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `relation "ai_coach_call_log" does not exist` | Startup only ran `runColumnSync()` (column sync), not table-creation migrations | Added `STARTUP_TABLE_MIGRATIONS` to `runColumnSync()` in `auto-migrate.ts` |
| `Custom Id cannot contain :` | BullMQ job ID `ai-call:userId:date:HH:MM:SS` contained colons | Changed separator to underscores, time colons to hyphens |
| Scheduled calls never trigger | Gate 8 required active WebSocket connection at fire time | Removed online gate; `initiateAICoachCall` handles offline via push notifications |

---

## Related Files

### Server
- `server/src/services/ai-coach-call-queue.service.ts` — BullMQ producer
- `server/src/workers/ai-coach-call.worker.ts` — BullMQ consumer + gate checks
- `server/src/services/chat-call.service.ts` — Call orchestration
- `server/src/jobs/ai-coach-call-reconciler.job.ts` — Daily job scheduler
- `server/src/services/voice-schedule.service.ts` — Preference CRUD
- `server/src/services/communication-preferences.service.ts` — Miss/answer tracking
- `server/src/database/migrations/20260513_ai_coach_call_log.sql` — Schema
- `server/src/database/migrations/20260512000000_chat_calls.sql` — Schema
- `server/src/database/auto-migrate.ts` — Startup migration runner

### Client
- `client/app/providers/ChatCallProvider.tsx` — Global call state + ringtone
- `client/hooks/use-ringtone.ts` — Ringtone playback hook
- `client/app/(pages)/settings/components/VoiceAssistantSettingsSection.tsx` — Full settings UI
- `client/app/(pages)/chat/components/ChatSettingsModal.tsx` — Compact ringtone selector
- `client/public/ring/ring1.mp3`, `ring2.mp3`, `ring3.mp3` — Audio files
