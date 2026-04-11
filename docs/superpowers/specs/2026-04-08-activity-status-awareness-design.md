# AI Coach Activity Status Awareness - Design Spec

**Date**: 2026-04-08
**Status**: Draft
**Scope**: Backend-only (server services, database, AI coach integration)

## Problem

The yHealth app tracks user activity status (working, sick, injury, travel, vacation, stress, rest) but this data is completely disconnected from the AI coaching system. The AI coach doesn't know the user's status, doesn't adjust plans when status changes, doesn't detect status from conversations, doesn't follow up on temporary statuses, and doesn't learn behavioral patterns from status history.

Users must manually toggle their status AND manually adjust their own plans — the AI coach is blind to their life circumstances.

## Goals

1. AI coach automatically detects activity status from chat messages
2. Plans auto-adjust based on status (tiered: safety-critical vs lifestyle)
3. Statuses have lifecycle management (follow-ups, expiry, duration tracking)
4. Pattern recognition learns user behavioral tendencies from history
5. Full status context is available to the AI coach for every interaction

## Non-Goals

- Frontend UI changes (existing status UI is sufficient)
- New status types beyond the existing 11-value enum
- Integration with external calendars for travel detection (future)
- Wearable-based auto-detection (e.g., elevated temp = sick) (future)

---

## Architecture

Five capabilities that plug into existing infrastructure:

```
Chat Message
  ↓
Status Intent Classifier (new)
  ↓ detected status change
Status Lifecycle Manager (extended activity-status.service)
  ↓ status persisted with duration/metadata
Status Plan Adjuster (new)
  ↓ plan overrides applied (tiered logic)
Context Integration (modified comprehensive-user-context)
  ↓ status available in AI coach context
Proactive Messaging (modified)
  ↓ follow-ups, welcome-back messages

Weekly Cron → Status Pattern Analyzer (new) → Coaching Profile
```

---

## 1. Status Intent Classifier

**New file**: `server/src/services/status-intent-classifier.service.ts`

### Purpose

Detects activity status changes from user chat messages. Two detection layers with different confidence thresholds.

### Layer A: Explicit Intent Detection (high confidence → auto-apply)

Pattern matching on user messages for direct status declarations:

| Pattern Category | Example Phrases | Mapped Status |
|-----------------|-----------------|---------------|
| Sickness | "I'm sick", "feeling under the weather", "got the flu", "not feeling well" | `sick` |
| Injury | "hurt my back", "twisted my ankle", "I'm injured", "pulled a muscle" | `injury` |
| Travel | "traveling to X", "I'm on a trip", "flying out tomorrow", "on the road" | `travel` |
| Vacation | "I'm on vacation", "taking a holiday", "on leave", "taking time off" | `vacation` |
| Stress | "I'm so stressed", "overwhelmed", "burning out", "can't handle this" | `stress` |
| Rest | "need a rest day", "taking it easy today", "recovery day" | `rest` |

**Duration extraction**: Parse phrases like "for 3 days", "until Friday", "for a week", "back on Monday" into `expected_end_date`.

**Implementation**: Use a lightweight LLM call (Haiku/Flash tier) with a structured output schema:

```typescript
interface StatusDetection {
  detected: boolean;
  status?: ActivityStatus;
  confidence: number;           // 0.0 - 1.0
  duration?: {
    days?: number;
    endDate?: string;           // ISO date
  };
  reason?: string;              // extracted context: "hurt my back", "flu"
  layer: 'explicit' | 'inferred';
}
```

**Threshold**: confidence >= 0.85 → auto-apply. Below that → Layer B.

### Layer B: Emotion-Backed Inference (lower confidence → suggest)

Combines the existing emotion detection output with message context:

- If emotion = `tired` + `stressed` + sentiment negative + current status is `working` → suggest: "It sounds like you might need a break. Want me to mark today as a rest day?"
- Only triggers when no explicit intent detected AND emotion signals are strong
- Confidence threshold for suggestion: >= 0.7
- Never auto-applies — always asks user for confirmation

### Integration Point

Runs inside `langgraph-chatbot.service.ts` message processing pipeline:
1. User message received
2. Status Intent Classifier runs (parallel with emotion detection)
3. If high-confidence detection → auto-update status via `activityStatusService.updateCurrentStatus()` with `source: 'auto'`
4. Detection result injected into AI coach tool context
5. AI coach acknowledges the status change naturally in its response

### Guardrails

- Don't re-detect if user already has that status today
- Don't downgrade from a more severe status (sick → working) without explicit "I'm better now"
- Rate limit: max 1 auto-detection per conversation session
- User can always override: "No, I'm fine" dismisses the detection

---

## 2. Status Plan Adjuster

**New file**: `server/src/services/status-plan-adjuster.service.ts`

### Purpose

Adjusts active plans when activity status changes. Uses tiered logic based on status severity.

### Tiered Adjustment Rules

#### Tier 1: Safety-Critical (auto-apply, notify user)

**Sick**:
- Workout: Auto-skip all scheduled workouts for the day
- Nutrition: Suggest comfort/recovery foods — hydration focus, lighter meals (soup, khichdi, toast, ginger tea). Don't enforce macro targets.
- Goals: Pause fitness goals. Keep spiritual/prayer/meditation goals active.
- Message: "I've cleared your workouts for today. Focus on rest and hydration. Your [meal plan] has been adjusted to lighter recovery foods."

**Injury**:
- Workout: Auto-skip all workouts. AI asks injury type and body part to determine safe alternatives.
- Nutrition: Suggest anti-inflammatory foods, maintain protein for recovery.
- Goals: Revise timeline expectations. Suggest modified goals if long-term injury.
- Message: "What got injured? I'll adjust your plan based on what's safe for you."

#### Tier 2: Lifestyle (suggest, wait for confirmation)

**Travel**:
- AI asks: "How long are you traveling? Where to?" (context for suggestions)
- Suggest: Hotel/bodyweight workouts, flexible meal guidelines (not strict macros)
- Adjust goal deadlines by travel duration
- Message: "Traveling! How many days? I can set up hotel-friendly workouts and relax the meal tracking."

**Vacation**:
- AI asks duration
- Suggest: Optional fun activities only (swimming, hiking, walking)
- Relax all tracking — no guilt messaging, no "you missed X" notifications
- Message: "Enjoy your vacation! I'll keep things light. Want me to suggest any fun activities?"

#### Tier 3: Adjustment (suggest alternatives)

**Stress**:
- Suggest: Replace high-intensity with stress-relief (yoga, walking, breathing exercises)
- Nutrition: No changes unless requested
- Goals: Keep all active, reduce daily intensity expectations
- Message: "Let's take it easier today. How about yoga or a walk instead of HIIT?"

**Rest**:
- Skip workouts for the day only
- No other changes
- Auto-resets tomorrow

### Implementation: Plan Status Overrides

Rather than generating a new plan, store temporary overrides on the active plan:

```typescript
interface PlanStatusOverride {
  status: ActivityStatus;
  appliedAt: string;              // ISO date
  expiresAt?: string;             // ISO date (auto-clear)
  workoutOverride: 'skip_all' | 'skip_affected' | 'suggest_alternatives' | 'optional_only';
  nutritionOverride: 'comfort_foods' | 'flexible' | 'anti_inflammatory' | 'none';
  goalOverride: 'pause_fitness' | 'extend_deadlines' | 'reduce_intensity' | 'none';
  adjustmentDetails?: string;     // AI-generated specifics
  userConfirmed: boolean;         // true for Tier 1 (auto), requires confirmation for Tier 2-3
}
```

Stored in new `status_overrides JSONB` column on `user_plans` table.

When status returns to a "normal" state (working, good, excellent), overrides are automatically cleared and original plan resumes.

### AI Coach Tool

The plan adjuster exposes tools the AI coach can call:

- `applyStatusAdjustment(status, overrides)` — apply plan modifications
- `clearStatusAdjustments()` — return to normal plan
- `getActiveOverrides()` — check what's currently adjusted

---

## 3. Status Lifecycle Manager

**Extended in**: `server/src/services/activity-status.service.ts`
**New cron job**: Added to existing job scheduler

### Duration Tracking

When status is set (manually or auto), track expected duration:

- `expected_end_date`: Extracted from conversation ("for 3 days") or explicitly asked by AI
- `follow_up_sent`: Prevents duplicate follow-up messages
- `detected_from`: Track how status was set ('manual', 'chat_explicit', 'chat_inferred')

### Daily Reset Logic (Cron Job)

Runs at midnight (user local time), integrated into existing job scheduler:

| Condition | Action |
|-----------|--------|
| `rest` status (any) | Auto-reset to `working` |
| `expected_end_date` <= today | Auto-reset to `working`, send "Welcome back!" proactive message |
| `sick` or `injury` without end date, no follow-up sent today | Send follow-up message, mark `follow_up_sent = true` |
| `travel` or `vacation` without end date, day 2+ | Ask "When are you back?" via proactive message |
| `stress` without end date, day 3+ | Check in: "How's your stress level today?" |
| Status unchanged for 7+ days (except injury) | Force check-in: "You've been marked as [X] for a week. Still accurate?" |

### Follow-Up Message Types

New proactive message candidates added to `proactive-messaging.service.ts`:

| Type | Trigger | Message Template |
|------|---------|-----------------|
| `status_followup_sick` | sick + next day + no follow-up sent | "How are you feeling today? Still under the weather?" |
| `status_followup_injury` | injury + every 3 days | "How's the recovery going? Any updates on your [injury]?" |
| `status_followup_travel` | travel + no end date + day 2 | "When are you getting back? I'll have your plan ready." |
| `status_followup_vacation` | vacation + no end date + day 2 | "When does your vacation end? No rush, just want to plan ahead." |
| `status_followup_stress` | stress + day 3 | "How's your stress level today? Want to talk about it?" |
| `status_return` | status just reset to working | "Welcome back! Let me rebuild your plan for this week." |
| `status_stale` | any non-working status + 7 days | "You've been marked as [status] for a week. Still the case?" |

Follow-up messages score high in the proactive messaging ranker (impact score 8-9/10) to ensure they get sent.

---

## 4. Status Pattern Analyzer

**New file**: `server/src/services/status-pattern-analyzer.service.ts`

### Purpose

Analyzes `activity_status_history` to discover recurring behavioral patterns. Feeds findings into the coaching profile for proactive AI coaching.

### Analysis Types

#### Day-of-Week Patterns

Query last 8 weeks of history. For each day of week, calculate:
- Frequency of non-working/non-good statuses
- Most common status per day
- Average mood per day

**Example output**: `{ day: 'Monday', pattern: 'low_energy', frequency: 0.6, suggestion: 'Schedule lighter Monday sessions' }`

#### Post-Event Patterns

Query status transitions: what happens the day after specific statuses?
- After travel → what's the first day back like?
- After vacation → how many days to return to normal?
- After sick → do they rush back or ease in?

**Example**: `{ trigger: 'travel', aftermath: 'rest_or_skip', frequency: 0.8, suggestion: 'Plan a light recovery day after travel' }`

#### Streak Disruption Patterns

Cross-reference streak breaks with status history:
- Do streaks always break on the same day?
- Is there a status that consistently precedes a streak break?

### Storage

Results stored in `user_coaching_profiles.status_patterns` (new JSONB column):

```typescript
interface StatusPattern {
  type: 'day_of_week' | 'post_event' | 'streak_disruption';
  pattern: string;
  confidence: number;
  frequency: number;
  firstObserved: string;
  lastConfirmed: string;
  suggestion: string;
}
```

### Schedule

Runs weekly as part of the coaching profile generation job (`coach-profile-generation.job.ts`). Requires minimum 4 weeks of status history data before generating patterns.

### AI Coach Usage

Patterns are injected into the AI coach context. The coach can proactively suggest:

- "I notice Mondays are tough for you — probably the weekend sleep schedule shift. Want me to keep Mondays as light yoga days?"
- "You usually need a recovery day after travel. I've scheduled a light day for when you get back."
- "Your streaks tend to break on Fridays. Want to set Friday as an intentional rest day so the streak stays intact?"

---

## 5. Context Integration

**Modified file**: `server/src/services/comprehensive-user-context.service.ts`

### New Context Section

Add `activityStatus` to `ComprehensiveUserContext`:

```typescript
activityStatus: {
  current: ActivityStatus;
  since: string;                    // ISO date
  source: 'manual' | 'auto';
  expectedEndDate?: string;
  recentHistory: Array<{
    date: string;
    status: ActivityStatus;
    mood?: number;
  }>;                               // last 7 days
  patterns: StatusPattern[];         // from pattern analyzer
  activeOverrides: boolean;          // plan currently adjusted?
  daysSinceLastWorkingStatus: number;
}
```

### Fetch Strategy

Added to Wave 1 (Core Health) since it's a lightweight query:
1. `activityStatusService.getCurrentStatus(userId)` — current + timestamp
2. `activityStatusService.getStatusHistory(userId, 7days)` — recent week
3. Read `status_patterns` from coaching profile cache

### AI Coach System Prompt Injection

When status is non-working, prepend to system prompt:

```
IMPORTANT USER STATUS: User is currently marked as [sick] since [date].
Active plan adjustments: [workouts skipped, nutrition set to comfort foods].
Expected return: [tomorrow / unknown — ask about duration].
Behavior patterns: [User tends to skip Mondays, drops after travel].
Adjust your coaching accordingly — be empathetic, don't push hard.
```

---

## 6. Tool Router Addition

**Modified file**: `server/src/services/tool-router.service.ts`

New `statusManager` tool available to the AI coach:

| Tool | Purpose | When Available |
|------|---------|----------------|
| `updateUserStatus` | Set status from conversation context | Always |
| `getStatusHistory` | Check recent status history | Always |
| `applyPlanAdjustment` | Apply status-based plan modifications | When status is non-working |
| `clearPlanAdjustments` | Remove overrides, return to normal | When overrides are active |
| `askStatusDuration` | Prompt user about how long status will last | When status has no end date |

These are always-available tools (not filtered by intent) since status can come up in any conversation.

---

## 7. Intervention Decision Tree Updates

**Modified file**: `server/src/services/intelligent-intervention.service.ts`

New decision tree: `STATUS_AWARENESS_RESPONSE`

```
IF user has non-working status AND scheduled workout today:
  IF status is sick OR injury:
    → Auto-skip workout (critical intervention)
  ELIF status is stress:
    → Suggest lighter alternative (non-critical)
  ELIF status is travel OR vacation:
    → Check if adjusted plan exists, suggest if not

IF user status changed to working after 3+ days of non-working:
  → Trigger "return to training" ramp-up (don't go 0→100)
  → Suggest 50% intensity first day back, 75% second day
```

---

## Database Migration

**New file**: `server/src/database/migrations/add-status-awareness-fields.sql`

```sql
-- Extend activity_status_history with lifecycle fields
ALTER TABLE activity_status_history
  ADD COLUMN IF NOT EXISTS expected_end_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS detected_from VARCHAR(20) DEFAULT 'manual';

-- Add index for lifecycle cron queries
CREATE INDEX IF NOT EXISTS idx_activity_status_lifecycle
  ON activity_status_history (user_id, activity_status, follow_up_sent)
  WHERE activity_status NOT IN ('working', 'excellent', 'good');

-- Add status patterns to coaching profiles
ALTER TABLE user_coaching_profiles
  ADD COLUMN IF NOT EXISTS status_patterns JSONB DEFAULT '[]';

-- Add plan status overrides
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS status_overrides JSONB DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN activity_status_history.expected_end_date IS 'When status is expected to end (from user or AI extraction)';
COMMENT ON COLUMN activity_status_history.detected_from IS 'How status was set: manual, chat_explicit, chat_inferred';
COMMENT ON COLUMN user_plans.status_overrides IS 'Temporary plan modifications due to activity status. Cleared when status returns to normal.';
```

---

## Files Summary

### New Files (4)

| File | Purpose |
|------|---------|
| `server/src/services/status-intent-classifier.service.ts` | Detect status from chat messages |
| `server/src/services/status-plan-adjuster.service.ts` | Apply tiered plan adjustments |
| `server/src/services/status-pattern-analyzer.service.ts` | Weekly pattern recognition |
| `server/src/database/migrations/add-status-awareness-fields.sql` | Schema extensions |

### Modified Files (8)

| File | Change |
|------|--------|
| `server/src/services/activity-status.service.ts` | Add lifecycle logic (reset cron, follow-up scheduling) |
| `server/src/services/comprehensive-user-context.service.ts` | Add `activityStatus` section to context |
| `server/src/services/langgraph-chatbot.service.ts` | Integrate status classifier in message pipeline |
| `server/src/services/proactive-messaging.service.ts` | Add 7 new status follow-up message types |
| `server/src/services/user-coaching-profile.service.ts` | Include status patterns in profile |
| `server/src/services/tool-router.service.ts` | Add statusManager tools |
| `server/src/services/intelligent-intervention.service.ts` | Add STATUS_AWARENESS_RESPONSE tree |
| `server/src/types/activity-status.types.ts` | Extend types for lifecycle + patterns |

---

## Verification Plan

1. **Unit tests**: Status intent classifier with various message inputs (explicit, ambiguous, false positives)
2. **Integration test**: Set status to "sick" → verify workout auto-skipped, nutrition adjusted, follow-up scheduled
3. **Lifecycle test**: Set sick status → verify next-day follow-up sent → reply "I'm better" → verify status reset + plan restored
4. **Pattern test**: Seed 8 weeks of Monday-rest history → verify pattern detected → verify AI coach mentions it
5. **E2E chat test**: Send "I hurt my knee yesterday" → verify status auto-set to `injury` → verify AI asks about injury details → verify plan adjusted
6. **Guard rail test**: Send "I feel stressed about my exam" → verify AI suggests (not auto-applies) stress status
7. **Duration test**: Send "traveling for 5 days" → verify `expected_end_date` set → verify auto-reset on day 6
