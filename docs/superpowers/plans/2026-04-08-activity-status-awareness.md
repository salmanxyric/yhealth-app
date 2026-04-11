# Activity Status Awareness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI coach aware of user activity status (sick, traveling, injured, etc.) so it auto-detects status from chat, adjusts plans accordingly, follows up on temporary statuses, and learns behavioral patterns.

**Architecture:** Five capabilities layered on existing infrastructure: (1) Status Intent Classifier detects status from chat messages via LLM, (2) Status Plan Adjuster applies tiered plan modifications, (3) Status Lifecycle Manager handles resets/follow-ups/duration, (4) Status Pattern Analyzer discovers recurring behaviors weekly, (5) Context Integration pipes status into the AI coach's system prompt and tools.

**Tech Stack:** TypeScript/ESM, PostgreSQL (raw queries via `query()`), AI provider service (Gemini/DeepSeek/OpenAI), Jest (ESM mocking), existing proactive messaging and intervention frameworks.

**Spec:** `docs/superpowers/specs/2026-04-08-activity-status-awareness-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `server/src/services/status-intent-classifier.service.ts` | Detect activity status from chat messages (LLM + keyword fallback) |
| `server/src/services/status-plan-adjuster.service.ts` | Apply tiered plan adjustments based on status |
| `server/src/services/status-pattern-analyzer.service.ts` | Weekly analysis of status history for behavioral patterns |
| `server/src/database/migrations/add-status-awareness-fields.sql` | Schema: add lifecycle fields to activity_status_history, status_overrides to user_plans, status_patterns to coaching profiles |
| `server/tests/unit/services/status-intent-classifier.service.test.ts` | Tests for intent classification |
| `server/tests/unit/services/status-plan-adjuster.service.test.ts` | Tests for plan adjustment logic |
| `server/tests/unit/services/status-pattern-analyzer.service.test.ts` | Tests for pattern detection |

### Modified Files
| File | Change |
|------|--------|
| `server/src/types/activity-status.types.ts` | Add StatusDetection, PlanStatusOverride, StatusPattern interfaces |
| `server/src/services/activity-status.service.ts` | Add lifecycle methods (getActiveNonWorkingStatuses, markFollowUpSent, resetExpiredStatuses) |
| `server/src/services/comprehensive-user-context.service.ts` | Add activityStatus section to ComprehensiveUserContext |
| `server/src/services/langgraph-chatbot.service.ts` | Integrate classifier into message pipeline |
| `server/src/services/proactive-messaging.service.ts` | Add 7 status follow-up message candidates |
| `server/src/services/tool-router.service.ts` | Add statusManager tool group + keywords |
| `server/src/services/intelligent-intervention.service.ts` | Add STATUS_AWARENESS_RESPONSE decision tree |
| `server/src/services/user-coaching-profile.service.ts` | Add buildStatusPatterns() to profile generation |

---

## Task 1: Database Migration

**Files:**
- Create: `server/src/database/migrations/add-status-awareness-fields.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Migration: Add Activity Status Awareness Fields
-- Date: 2026-04-08

-- 1. Extend activity_status_history with lifecycle fields
ALTER TABLE activity_status_history
  ADD COLUMN IF NOT EXISTS expected_end_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS detected_from VARCHAR(20) DEFAULT 'manual';

-- 2. Index for lifecycle cron queries (find non-working statuses needing follow-up)
CREATE INDEX IF NOT EXISTS idx_activity_status_lifecycle
  ON activity_status_history (user_id, activity_status, follow_up_sent)
  WHERE activity_status NOT IN ('working', 'excellent', 'good');

-- 3. Add status patterns to coaching profiles
ALTER TABLE user_coaching_profiles
  ADD COLUMN IF NOT EXISTS status_patterns JSONB DEFAULT '[]';

-- 4. Add plan status overrides
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS status_overrides JSONB DEFAULT NULL;

-- 5. Documentation comments
COMMENT ON COLUMN activity_status_history.expected_end_date IS 'When status is expected to end (from user input or AI extraction)';
COMMENT ON COLUMN activity_status_history.detected_from IS 'How status was set: manual, chat_explicit, chat_inferred';
COMMENT ON COLUMN activity_status_history.follow_up_sent IS 'Whether a follow-up message has been sent for this status day';
COMMENT ON COLUMN user_plans.status_overrides IS 'Temporary plan modifications due to activity status. Cleared when status returns to normal.';
COMMENT ON COLUMN user_coaching_profiles.status_patterns IS 'Recurring behavioral patterns detected from activity status history.';
```

- [ ] **Step 2: Run the migration**

Run: `cd server && npx tsx src/database/run-migrations.ts`
Expected: Migration applies without errors. Verify with:
```bash
cd server && npx tsx -e "
import { query } from './src/database/pg.js';
const r = await query(\`SELECT column_name FROM information_schema.columns WHERE table_name = 'activity_status_history' AND column_name = 'expected_end_date'\`);
console.log('Column exists:', r.rows.length > 0);
process.exit(0);
"
```

- [ ] **Step 3: Commit**

```bash
git add server/src/database/migrations/add-status-awareness-fields.sql
git commit -m "feat(db): add activity status awareness migration fields"
```

---

## Task 2: Extend Type Definitions

**Files:**
- Modify: `server/src/types/activity-status.types.ts`

- [ ] **Step 1: Add new interfaces to the types file**

Append to end of `server/src/types/activity-status.types.ts`:

```typescript
// ─── Status Intent Classification ───────────────────────────────────────────

export interface StatusDetection {
  detected: boolean;
  status?: ActivityStatus;
  confidence: number;
  duration?: {
    days?: number;
    endDate?: string;
  };
  reason?: string;
  layer: 'explicit' | 'inferred';
}

// ─── Plan Status Overrides ──────────────────────────────────────────────────

export type WorkoutOverride = 'skip_all' | 'skip_affected' | 'suggest_alternatives' | 'optional_only' | 'none';
export type NutritionOverride = 'comfort_foods' | 'flexible' | 'anti_inflammatory' | 'none';
export type GoalOverride = 'pause_fitness' | 'extend_deadlines' | 'reduce_intensity' | 'none';

export interface PlanStatusOverride {
  status: ActivityStatus;
  appliedAt: string;
  expiresAt?: string;
  workoutOverride: WorkoutOverride;
  nutritionOverride: NutritionOverride;
  goalOverride: GoalOverride;
  adjustmentDetails?: string;
  userConfirmed: boolean;
}

// ─── Status Patterns ────────────────────────────────────────────────────────

export type StatusPatternType = 'day_of_week' | 'post_event' | 'streak_disruption';

export interface StatusPattern {
  type: StatusPatternType;
  pattern: string;
  confidence: number;
  frequency: number;
  firstObserved: string;
  lastConfirmed: string;
  suggestion: string;
}

// ─── Activity Status Context (for ComprehensiveUserContext) ─────────────────

export interface ActivityStatusContext {
  current: ActivityStatus;
  since: string;
  source: string;
  expectedEndDate?: string;
  recentHistory: Array<{
    date: string;
    status: ActivityStatus;
    mood?: number;
  }>;
  patterns: StatusPattern[];
  activeOverrides: boolean;
  daysSinceLastWorkingStatus: number;
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to activity-status.types.ts

- [ ] **Step 3: Commit**

```bash
git add server/src/types/activity-status.types.ts
git commit -m "feat(types): add StatusDetection, PlanStatusOverride, StatusPattern interfaces"
```

---

## Task 3: Status Intent Classifier Service

**Files:**
- Create: `server/src/services/status-intent-classifier.service.ts`
- Create: `server/tests/unit/services/status-intent-classifier.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/unit/services/status-intent-classifier.service.test.ts`:

```typescript
import { jest } from '@jest/globals';

// Mock AI provider
const mockGenerateCompletion = jest.fn();
jest.unstable_mockModule('../../../src/services/ai-provider.service.js', () => ({
  aiProviderService: { generateCompletion: mockGenerateCompletion },
}));

// Mock logger
jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { statusIntentClassifierService } = await import(
  '../../../src/services/status-intent-classifier.service.js'
);

describe('StatusIntentClassifierService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('classifyFromMessage', () => {
    it('should detect explicit sick status with high confidence', async () => {
      mockGenerateCompletion.mockResolvedValueOnce({
        content: JSON.stringify({
          detected: true,
          status: 'sick',
          confidence: 0.95,
          reason: 'flu',
          layer: 'explicit',
        }),
        provider: 'gemini',
        model: 'gemini-2.0-flash',
      });

      const result = await statusIntentClassifierService.classifyFromMessage(
        "I'm sick today, got the flu"
      );

      expect(result.detected).toBe(true);
      expect(result.status).toBe('sick');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.layer).toBe('explicit');
    });

    it('should detect travel status with duration extraction', async () => {
      mockGenerateCompletion.mockResolvedValueOnce({
        content: JSON.stringify({
          detected: true,
          status: 'travel',
          confidence: 0.92,
          duration: { days: 5 },
          reason: 'business trip to Dubai',
          layer: 'explicit',
        }),
        provider: 'gemini',
        model: 'gemini-2.0-flash',
      });

      const result = await statusIntentClassifierService.classifyFromMessage(
        "I'm traveling to Dubai for 5 days"
      );

      expect(result.detected).toBe(true);
      expect(result.status).toBe('travel');
      expect(result.duration?.days).toBe(5);
    });

    it('should detect injury status and extract body part', async () => {
      mockGenerateCompletion.mockResolvedValueOnce({
        content: JSON.stringify({
          detected: true,
          status: 'injury',
          confidence: 0.90,
          reason: 'hurt my back',
          layer: 'explicit',
        }),
        provider: 'gemini',
        model: 'gemini-2.0-flash',
      });

      const result = await statusIntentClassifierService.classifyFromMessage(
        'I hurt my back lifting weights yesterday'
      );

      expect(result.detected).toBe(true);
      expect(result.status).toBe('injury');
      expect(result.reason).toContain('back');
    });

    it('should return not detected for normal messages', async () => {
      mockGenerateCompletion.mockResolvedValueOnce({
        content: JSON.stringify({
          detected: false,
          confidence: 0.1,
          layer: 'explicit',
        }),
        provider: 'gemini',
        model: 'gemini-2.0-flash',
      });

      const result = await statusIntentClassifierService.classifyFromMessage(
        "What's my workout for today?"
      );

      expect(result.detected).toBe(false);
    });

    it('should use keyword fallback when LLM fails', async () => {
      mockGenerateCompletion.mockRejectedValueOnce(new Error('LLM timeout'));

      const result = await statusIntentClassifierService.classifyFromMessage(
        "I'm really sick today"
      );

      expect(result.detected).toBe(true);
      expect(result.status).toBe('sick');
      expect(result.layer).toBe('explicit');
      expect(result.confidence).toBeLessThan(0.85);
    });

    it('should detect stress as inferred layer when emotional language used', async () => {
      mockGenerateCompletion.mockResolvedValueOnce({
        content: JSON.stringify({
          detected: true,
          status: 'stress',
          confidence: 0.75,
          reason: 'overwhelmed with work deadlines',
          layer: 'inferred',
        }),
        provider: 'gemini',
        model: 'gemini-2.0-flash',
      });

      const result = await statusIntentClassifierService.classifyFromMessage(
        "I'm so overwhelmed, everything is piling up and I can't cope"
      );

      expect(result.detected).toBe(true);
      expect(result.status).toBe('stress');
      expect(result.layer).toBe('inferred');
      expect(result.confidence).toBeLessThan(0.85);
    });
  });

  describe('fallbackKeywordDetection', () => {
    it('should detect sick keywords', () => {
      const result = statusIntentClassifierService.fallbackKeywordDetection(
        "I'm not feeling well at all"
      );
      expect(result.detected).toBe(true);
      expect(result.status).toBe('sick');
    });

    it('should detect injury keywords', () => {
      const result = statusIntentClassifierService.fallbackKeywordDetection(
        'I pulled a muscle in my leg'
      );
      expect(result.detected).toBe(true);
      expect(result.status).toBe('injury');
    });

    it('should detect travel keywords', () => {
      const result = statusIntentClassifierService.fallbackKeywordDetection(
        "I'm traveling tomorrow"
      );
      expect(result.detected).toBe(true);
      expect(result.status).toBe('travel');
    });

    it('should return not detected for unrelated messages', () => {
      const result = statusIntentClassifierService.fallbackKeywordDetection(
        'How many calories in a banana?'
      );
      expect(result.detected).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/status-intent-classifier.service.test.ts --verbose 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the service**

Create `server/src/services/status-intent-classifier.service.ts`:

```typescript
import { aiProviderService } from './ai-provider.service.js';
import { logger } from './logger.service.js';
import type { ActivityStatus, StatusDetection } from '../types/activity-status.types.js';

const VALID_STATUSES: ActivityStatus[] = [
  'working', 'sick', 'injury', 'rest', 'vacation', 'travel', 'stress',
  'excellent', 'good', 'fair', 'poor',
];

const KEYWORD_MAP: Record<string, { status: ActivityStatus; confidence: number }[]> = {
  // Sick
  "i'm sick": [{ status: 'sick', confidence: 0.80 }],
  'not feeling well': [{ status: 'sick', confidence: 0.75 }],
  'got the flu': [{ status: 'sick', confidence: 0.80 }],
  'under the weather': [{ status: 'sick', confidence: 0.75 }],
  'feeling unwell': [{ status: 'sick', confidence: 0.75 }],
  'have a fever': [{ status: 'sick', confidence: 0.80 }],
  'have a cold': [{ status: 'sick', confidence: 0.75 }],
  // Injury
  'hurt my': [{ status: 'injury', confidence: 0.75 }],
  'injured my': [{ status: 'injury', confidence: 0.80 }],
  'pulled a muscle': [{ status: 'injury', confidence: 0.80 }],
  'twisted my': [{ status: 'injury', confidence: 0.75 }],
  "i'm injured": [{ status: 'injury', confidence: 0.80 }],
  'sprained my': [{ status: 'injury', confidence: 0.80 }],
  // Travel
  'traveling to': [{ status: 'travel', confidence: 0.80 }],
  "i'm traveling": [{ status: 'travel', confidence: 0.80 }],
  'on a trip': [{ status: 'travel', confidence: 0.75 }],
  'flying out': [{ status: 'travel', confidence: 0.75 }],
  'on the road': [{ status: 'travel', confidence: 0.70 }],
  // Vacation
  'on vacation': [{ status: 'vacation', confidence: 0.85 }],
  'on holiday': [{ status: 'vacation', confidence: 0.80 }],
  'taking time off': [{ status: 'vacation', confidence: 0.75 }],
  'on leave': [{ status: 'vacation', confidence: 0.75 }],
  // Stress
  'so stressed': [{ status: 'stress', confidence: 0.70 }],
  'really stressed': [{ status: 'stress', confidence: 0.70 }],
  'burning out': [{ status: 'stress', confidence: 0.75 }],
  'overwhelmed': [{ status: 'stress', confidence: 0.65 }],
  // Rest
  'need a rest day': [{ status: 'rest', confidence: 0.80 }],
  'taking it easy': [{ status: 'rest', confidence: 0.70 }],
  'recovery day': [{ status: 'rest', confidence: 0.75 }],
};

const CLASSIFICATION_SYSTEM_PROMPT = `You are an activity status classifier for a health coaching app.
Analyze the user's message to detect if they are declaring or implying a change in their activity status.

Activity statuses: sick, injury, rest, vacation, travel, stress

Respond with ONLY a JSON object:
{
  "detected": boolean,
  "status": "sick" | "injury" | "rest" | "vacation" | "travel" | "stress" | null,
  "confidence": 0.0-1.0,
  "duration": { "days": number | null, "endDate": "YYYY-MM-DD" | null } | null,
  "reason": "brief description of what was detected" | null,
  "layer": "explicit" | "inferred"
}

Rules:
- "explicit": user directly states their status ("I'm sick", "traveling to X")
- "inferred": emotional language suggests a status ("I can't cope with anything" → stress)
- Extract duration if mentioned ("for 3 days", "until Friday", "for a week")
- If no status change detected, return detected: false with low confidence
- Do NOT classify normal complaints as status changes ("this workout was hard" is NOT injury)
- Be conservative: only flag real status changes, not passing mentions`;

const NOT_DETECTED: StatusDetection = {
  detected: false,
  confidence: 0,
  layer: 'explicit',
};

class StatusIntentClassifierService {
  async classifyFromMessage(
    message: string,
    currentStatus?: ActivityStatus,
  ): Promise<StatusDetection> {
    try {
      const response = await aiProviderService.generateCompletion({
        systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
        userPrompt: `Current status: ${currentStatus ?? 'working'}\nUser message: "${message}"`,
        maxTokens: 200,
        temperature: 0.2,
        jsonMode: true,
      });

      const parsed = this.parseClassificationResponse(response.content);
      if (parsed.detected && parsed.status && !VALID_STATUSES.includes(parsed.status)) {
        logger.warn('[StatusClassifier] Invalid status from LLM', { status: parsed.status });
        return NOT_DETECTED;
      }

      // Don't re-detect same status
      if (parsed.detected && parsed.status === currentStatus) {
        return NOT_DETECTED;
      }

      return parsed;
    } catch (error) {
      logger.warn('[StatusClassifier] LLM classification failed, using keyword fallback', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      return this.fallbackKeywordDetection(message);
    }
  }

  fallbackKeywordDetection(message: string): StatusDetection {
    const lower = message.toLowerCase();

    // Check keywords in order of specificity (longer phrases first)
    const sortedKeywords = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      if (lower.includes(keyword)) {
        const match = KEYWORD_MAP[keyword]![0]!;
        return {
          detected: true,
          status: match.status,
          confidence: match.confidence,
          layer: 'explicit',
          reason: keyword,
        };
      }
    }

    return NOT_DETECTED;
  }

  private parseClassificationResponse(content: string): StatusDetection {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as StatusDetection;
      return {
        detected: parsed.detected ?? false,
        status: parsed.status ?? undefined,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        duration: parsed.duration ?? undefined,
        reason: parsed.reason ?? undefined,
        layer: parsed.layer === 'inferred' ? 'inferred' : 'explicit',
      };
    } catch {
      logger.warn('[StatusClassifier] Failed to parse LLM response', { content });
      return NOT_DETECTED;
    }
  }
}

export const statusIntentClassifierService = new StatusIntentClassifierService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/status-intent-classifier.service.test.ts --verbose 2>&1 | tail -30`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/status-intent-classifier.service.ts server/tests/unit/services/status-intent-classifier.service.test.ts
git commit -m "feat: add status intent classifier service with LLM + keyword fallback"
```

---

## Task 4: Status Plan Adjuster Service

**Files:**
- Create: `server/src/services/status-plan-adjuster.service.ts`
- Create: `server/tests/unit/services/status-plan-adjuster.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/unit/services/status-plan-adjuster.service.test.ts`:

```typescript
import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { statusPlanAdjusterService } = await import(
  '../../../src/services/status-plan-adjuster.service.js'
);

function pgResult(rows: Record<string, unknown>[] = []) {
  return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] } as never;
}

const TEST_USER_ID = 'user-test-001';

describe('StatusPlanAdjusterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverridesForStatus', () => {
    it('should return auto-apply skip_all for sick status', () => {
      const override = statusPlanAdjusterService.getOverridesForStatus('sick');
      expect(override.workoutOverride).toBe('skip_all');
      expect(override.nutritionOverride).toBe('comfort_foods');
      expect(override.goalOverride).toBe('pause_fitness');
      expect(override.userConfirmed).toBe(true); // auto-applied
    });

    it('should return auto-apply skip_all for injury status', () => {
      const override = statusPlanAdjusterService.getOverridesForStatus('injury');
      expect(override.workoutOverride).toBe('skip_all');
      expect(override.nutritionOverride).toBe('anti_inflammatory');
      expect(override.userConfirmed).toBe(true);
    });

    it('should return suggest alternatives for stress status', () => {
      const override = statusPlanAdjusterService.getOverridesForStatus('stress');
      expect(override.workoutOverride).toBe('suggest_alternatives');
      expect(override.nutritionOverride).toBe('none');
      expect(override.goalOverride).toBe('reduce_intensity');
      expect(override.userConfirmed).toBe(false); // needs confirmation
    });

    it('should return optional_only for vacation status', () => {
      const override = statusPlanAdjusterService.getOverridesForStatus('vacation');
      expect(override.workoutOverride).toBe('optional_only');
      expect(override.nutritionOverride).toBe('flexible');
      expect(override.goalOverride).toBe('extend_deadlines');
      expect(override.userConfirmed).toBe(false);
    });

    it('should return suggest_alternatives for travel status', () => {
      const override = statusPlanAdjusterService.getOverridesForStatus('travel');
      expect(override.workoutOverride).toBe('suggest_alternatives');
      expect(override.nutritionOverride).toBe('flexible');
      expect(override.goalOverride).toBe('extend_deadlines');
      expect(override.userConfirmed).toBe(false);
    });

    it('should return skip_all for rest status with auto-confirm', () => {
      const override = statusPlanAdjusterService.getOverridesForStatus('rest');
      expect(override.workoutOverride).toBe('skip_all');
      expect(override.nutritionOverride).toBe('none');
      expect(override.goalOverride).toBe('none');
      expect(override.userConfirmed).toBe(true);
    });

    it('should return no overrides for working status', () => {
      const override = statusPlanAdjusterService.getOverridesForStatus('working');
      expect(override.workoutOverride).toBe('none');
      expect(override.nutritionOverride).toBe('none');
      expect(override.goalOverride).toBe('none');
    });
  });

  describe('applyOverridesToPlan', () => {
    it('should save overrides to the active user plan', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'plan-1' }])); // find active plan
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'plan-1' }])); // update plan

      await statusPlanAdjusterService.applyOverridesToPlan(TEST_USER_ID, 'sick');

      expect(mockQuery).toHaveBeenCalledTimes(2);
      const updateCall = mockQuery.mock.calls[1]!;
      expect(updateCall[0]).toContain('UPDATE user_plans');
      expect(updateCall[0]).toContain('status_overrides');
    });

    it('should not fail if no active plan exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([])); // no active plan

      await expect(
        statusPlanAdjusterService.applyOverridesToPlan(TEST_USER_ID, 'sick')
      ).resolves.not.toThrow();
    });
  });

  describe('clearOverrides', () => {
    it('should set status_overrides to null on active plan', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'plan-1' }]));

      await statusPlanAdjusterService.clearOverrides(TEST_USER_ID);

      const updateCall = mockQuery.mock.calls[0]!;
      expect(updateCall[0]).toContain('status_overrides = NULL');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/status-plan-adjuster.service.test.ts --verbose 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the service**

Create `server/src/services/status-plan-adjuster.service.ts`:

```typescript
import { query } from '../database/pg.js';
import { logger } from './logger.service.js';
import type {
  ActivityStatus,
  PlanStatusOverride,
  WorkoutOverride,
  NutritionOverride,
  GoalOverride,
} from '../types/activity-status.types.js';

// Tier 1: Safety-critical → auto-apply
// Tier 2: Lifestyle → suggest, wait for confirmation
// Tier 3: Adjustment → suggest alternatives
const STATUS_OVERRIDE_MAP: Record<string, {
  workoutOverride: WorkoutOverride;
  nutritionOverride: NutritionOverride;
  goalOverride: GoalOverride;
  autoConfirm: boolean;
}> = {
  sick:     { workoutOverride: 'skip_all', nutritionOverride: 'comfort_foods', goalOverride: 'pause_fitness', autoConfirm: true },
  injury:   { workoutOverride: 'skip_all', nutritionOverride: 'anti_inflammatory', goalOverride: 'pause_fitness', autoConfirm: true },
  rest:     { workoutOverride: 'skip_all', nutritionOverride: 'none', goalOverride: 'none', autoConfirm: true },
  travel:   { workoutOverride: 'suggest_alternatives', nutritionOverride: 'flexible', goalOverride: 'extend_deadlines', autoConfirm: false },
  vacation: { workoutOverride: 'optional_only', nutritionOverride: 'flexible', goalOverride: 'extend_deadlines', autoConfirm: false },
  stress:   { workoutOverride: 'suggest_alternatives', nutritionOverride: 'none', goalOverride: 'reduce_intensity', autoConfirm: false },
};

const NO_OVERRIDE: PlanStatusOverride = {
  status: 'working',
  appliedAt: new Date().toISOString(),
  workoutOverride: 'none',
  nutritionOverride: 'none',
  goalOverride: 'none',
  userConfirmed: true,
};

class StatusPlanAdjusterService {
  getOverridesForStatus(status: ActivityStatus, expiresAt?: string): PlanStatusOverride {
    const mapping = STATUS_OVERRIDE_MAP[status];
    if (!mapping) return { ...NO_OVERRIDE, status };

    return {
      status,
      appliedAt: new Date().toISOString(),
      expiresAt,
      workoutOverride: mapping.workoutOverride,
      nutritionOverride: mapping.nutritionOverride,
      goalOverride: mapping.goalOverride,
      userConfirmed: mapping.autoConfirm,
    };
  }

  async applyOverridesToPlan(userId: string, status: ActivityStatus, expiresAt?: string): Promise<void> {
    const override = this.getOverridesForStatus(status, expiresAt);

    // Find active plan
    const planResult = await query<{ id: string }>(
      `SELECT id FROM user_plans WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (planResult.rows.length === 0) {
      logger.info('[StatusPlanAdjuster] No active plan to adjust', { userId, status });
      return;
    }

    const planId = planResult.rows[0]!.id;

    await query(
      `UPDATE user_plans SET status_overrides = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(override), planId]
    );

    logger.info('[StatusPlanAdjuster] Applied plan overrides', { userId, status, planId, override: override.workoutOverride });
  }

  async clearOverrides(userId: string): Promise<void> {
    await query(
      `UPDATE user_plans SET status_overrides = NULL, updated_at = NOW() WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    logger.info('[StatusPlanAdjuster] Cleared plan overrides', { userId });
  }

  async getActiveOverrides(userId: string): Promise<PlanStatusOverride | null> {
    const result = await query<{ status_overrides: PlanStatusOverride | null }>(
      `SELECT status_overrides FROM user_plans WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    return result.rows[0]?.status_overrides ?? null;
  }

  isAutoConfirmStatus(status: ActivityStatus): boolean {
    return STATUS_OVERRIDE_MAP[status]?.autoConfirm ?? false;
  }
}

export const statusPlanAdjusterService = new StatusPlanAdjusterService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/status-plan-adjuster.service.test.ts --verbose 2>&1 | tail -20`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/status-plan-adjuster.service.ts server/tests/unit/services/status-plan-adjuster.service.test.ts
git commit -m "feat: add status plan adjuster service with tiered override logic"
```

---

## Task 5: Status Pattern Analyzer Service

**Files:**
- Create: `server/src/services/status-pattern-analyzer.service.ts`
- Create: `server/tests/unit/services/status-pattern-analyzer.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/tests/unit/services/status-pattern-analyzer.service.test.ts`:

```typescript
import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { statusPatternAnalyzerService } = await import(
  '../../../src/services/status-pattern-analyzer.service.js'
);

function pgResult(rows: Record<string, unknown>[] = []) {
  return { rows, command: 'SELECT', rowCount: rows.length, oid: 0, fields: [] } as never;
}

const TEST_USER_ID = 'user-test-001';

describe('StatusPatternAnalyzerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeDayOfWeekPatterns', () => {
    it('should detect Monday low-energy pattern', async () => {
      // Simulate 8 weeks of history where Mondays are often rest/poor
      const rows = [
        { day_of_week: 0, status: 'rest', count: '5' },    // Sunday
        { day_of_week: 1, status: 'poor', count: '4' },     // Monday - problematic
        { day_of_week: 1, status: 'rest', count: '2' },     // Monday - problematic
        { day_of_week: 1, status: 'working', count: '2' },  // Monday - some good
        { day_of_week: 2, status: 'working', count: '7' },  // Tuesday - fine
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const patterns = await statusPatternAnalyzerService.analyzeDayOfWeekPatterns(TEST_USER_ID);

      const mondayPattern = patterns.find(p => p.pattern.toLowerCase().includes('monday'));
      expect(mondayPattern).toBeDefined();
      expect(mondayPattern!.confidence).toBeGreaterThan(0.5);
      expect(mondayPattern!.type).toBe('day_of_week');
    });

    it('should return empty array when insufficient data', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const patterns = await statusPatternAnalyzerService.analyzeDayOfWeekPatterns(TEST_USER_ID);
      expect(patterns).toEqual([]);
    });
  });

  describe('analyzePostEventPatterns', () => {
    it('should detect drop-off after travel', async () => {
      const rows = [
        { trigger_status: 'travel', next_day_status: 'rest', count: '3' },
        { trigger_status: 'travel', next_day_status: 'poor', count: '2' },
        { trigger_status: 'travel', next_day_status: 'working', count: '1' },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const patterns = await statusPatternAnalyzerService.analyzePostEventPatterns(TEST_USER_ID);

      const travelPattern = patterns.find(p => p.pattern.toLowerCase().includes('travel'));
      expect(travelPattern).toBeDefined();
      expect(travelPattern!.type).toBe('post_event');
    });
  });

  describe('analyzeAllPatterns', () => {
    it('should combine day-of-week and post-event patterns', async () => {
      // Day of week query
      mockQuery.mockResolvedValueOnce(pgResult([
        { day_of_week: 1, status: 'poor', count: '5' },
        { day_of_week: 1, status: 'working', count: '3' },
      ]));
      // Post-event query
      mockQuery.mockResolvedValueOnce(pgResult([
        { trigger_status: 'travel', next_day_status: 'rest', count: '3' },
      ]));

      const patterns = await statusPatternAnalyzerService.analyzeAllPatterns(TEST_USER_ID);
      expect(patterns.length).toBeGreaterThanOrEqual(1);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/status-pattern-analyzer.service.test.ts --verbose 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the service**

Create `server/src/services/status-pattern-analyzer.service.ts`:

```typescript
import { query } from '../database/pg.js';
import { logger } from './logger.service.js';
import type { StatusPattern } from '../types/activity-status.types.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const NON_WORKING_STATUSES = ['sick', 'injury', 'rest', 'vacation', 'travel', 'stress', 'poor', 'fair'];
const TRIGGER_STATUSES = ['travel', 'vacation', 'sick', 'injury'];
const MIN_WEEKS_FOR_PATTERNS = 4;
const MIN_FREQUENCY_THRESHOLD = 0.4; // 40% of weeks

class StatusPatternAnalyzerService {
  async analyzeDayOfWeekPatterns(userId: string): Promise<StatusPattern[]> {
    const result = await query<{
      day_of_week: number;
      status: string;
      count: string;
    }>(
      `SELECT EXTRACT(DOW FROM status_date)::int AS day_of_week,
              activity_status AS status,
              COUNT(*)::text AS count
       FROM activity_status_history
       WHERE user_id = $1
         AND status_date >= CURRENT_DATE - INTERVAL '8 weeks'
       GROUP BY day_of_week, activity_status
       ORDER BY day_of_week, count DESC`,
      [userId]
    );

    if (result.rows.length === 0) return [];

    const patterns: StatusPattern[] = [];
    const byDay = new Map<number, { status: string; count: number }[]>();

    for (const row of result.rows) {
      const day = row.day_of_week;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push({ status: row.status, count: parseInt(row.count, 10) });
    }

    for (const [day, statuses] of byDay) {
      const total = statuses.reduce((sum, s) => sum + s.count, 0);
      const nonWorking = statuses
        .filter(s => NON_WORKING_STATUSES.includes(s.status))
        .reduce((sum, s) => sum + s.count, 0);
      const frequency = nonWorking / total;

      if (frequency >= MIN_FREQUENCY_THRESHOLD && total >= MIN_WEEKS_FOR_PATTERNS) {
        const dayName = DAY_NAMES[day] ?? `Day ${day}`;
        const topStatus = statuses
          .filter(s => NON_WORKING_STATUSES.includes(s.status))
          .sort((a, b) => b.count - a.count)[0];

        patterns.push({
          type: 'day_of_week',
          pattern: `Low energy on ${dayName}s (${topStatus?.status ?? 'rest'} ${Math.round(frequency * 100)}% of the time)`,
          confidence: Math.min(frequency + 0.1, 1.0),
          frequency,
          firstObserved: new Date().toISOString(),
          lastConfirmed: new Date().toISOString(),
          suggestion: `Schedule lighter ${dayName} sessions or make ${dayName} an intentional rest day`,
        });
      }
    }

    return patterns;
  }

  async analyzePostEventPatterns(userId: string): Promise<StatusPattern[]> {
    const result = await query<{
      trigger_status: string;
      next_day_status: string;
      count: string;
    }>(
      `SELECT a1.activity_status AS trigger_status,
              a2.activity_status AS next_day_status,
              COUNT(*)::text AS count
       FROM activity_status_history a1
       JOIN activity_status_history a2
         ON a1.user_id = a2.user_id
        AND a2.status_date = a1.status_date + INTERVAL '1 day'
       WHERE a1.user_id = $1
         AND a1.activity_status IN ('travel', 'vacation', 'sick', 'injury')
         AND a1.status_date >= CURRENT_DATE - INTERVAL '12 weeks'
       GROUP BY trigger_status, next_day_status
       ORDER BY trigger_status, count DESC`,
      [userId]
    );

    if (result.rows.length === 0) return [];

    const patterns: StatusPattern[] = [];
    const byTrigger = new Map<string, { status: string; count: number }[]>();

    for (const row of result.rows) {
      if (!byTrigger.has(row.trigger_status)) byTrigger.set(row.trigger_status, []);
      byTrigger.get(row.trigger_status)!.push({
        status: row.next_day_status,
        count: parseInt(row.count, 10),
      });
    }

    for (const [trigger, outcomes] of byTrigger) {
      const total = outcomes.reduce((sum, o) => sum + o.count, 0);
      const nonWorking = outcomes
        .filter(o => NON_WORKING_STATUSES.includes(o.status))
        .reduce((sum, o) => sum + o.count, 0);
      const frequency = nonWorking / total;

      if (frequency >= MIN_FREQUENCY_THRESHOLD && total >= 2) {
        patterns.push({
          type: 'post_event',
          pattern: `Usually needs recovery after ${trigger} (${Math.round(frequency * 100)}% drop-off rate)`,
          confidence: Math.min(frequency, 1.0),
          frequency,
          firstObserved: new Date().toISOString(),
          lastConfirmed: new Date().toISOString(),
          suggestion: `Plan a light recovery day after ${trigger} ends`,
        });
      }
    }

    return patterns;
  }

  async analyzeAllPatterns(userId: string): Promise<StatusPattern[]> {
    const [dayPatterns, eventPatterns] = await Promise.all([
      this.analyzeDayOfWeekPatterns(userId),
      this.analyzePostEventPatterns(userId),
    ]);

    const allPatterns = [...dayPatterns, ...eventPatterns];

    logger.info('[StatusPatternAnalyzer] Analysis complete', {
      userId,
      dayPatterns: dayPatterns.length,
      eventPatterns: eventPatterns.length,
    });

    return allPatterns;
  }

  async persistPatterns(userId: string, patterns: StatusPattern[]): Promise<void> {
    await query(
      `UPDATE user_coaching_profiles SET status_patterns = $1, updated_at = NOW() WHERE user_id = $2`,
      [JSON.stringify(patterns), userId]
    );
  }
}

export const statusPatternAnalyzerService = new StatusPatternAnalyzerService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/status-pattern-analyzer.service.test.ts --verbose 2>&1 | tail -20`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/status-pattern-analyzer.service.ts server/tests/unit/services/status-pattern-analyzer.service.test.ts
git commit -m "feat: add status pattern analyzer for day-of-week and post-event detection"
```

---

## Task 6: Extend Activity Status Service with Lifecycle Methods

**Files:**
- Modify: `server/src/services/activity-status.service.ts`

- [ ] **Step 1: Add lifecycle methods to the service**

Add the following methods to the `ActivityStatusService` class in `server/src/services/activity-status.service.ts`. Place them after the existing `deleteStatusForDate` method:

```typescript
  // ─── Lifecycle Management Methods ───────────────────────────────────────

  async updateCurrentStatusWithLifecycle(
    userId: string,
    status: ActivityStatus,
    source: string = 'manual',
    expectedEndDate?: string,
    reason?: string,
  ): Promise<CurrentStatusResponse> {
    const result = await this.updateCurrentStatus(userId, status);

    // Update lifecycle fields on today's history entry
    await query(
      `UPDATE activity_status_history
       SET expected_end_date = $1, detected_from = $2, notes = COALESCE($3, notes), follow_up_sent = false
       WHERE user_id = $4 AND status_date = CURRENT_DATE`,
      [expectedEndDate ?? null, source, reason ?? null, userId]
    );

    return result;
  }

  async getActiveNonWorkingStatuses(): Promise<Array<{
    user_id: string;
    activity_status: ActivityStatus;
    status_date: string;
    expected_end_date: string | null;
    follow_up_sent: boolean;
    timezone: string;
  }>> {
    const result = await query<{
      user_id: string;
      activity_status: ActivityStatus;
      status_date: string;
      expected_end_date: string | null;
      follow_up_sent: boolean;
      timezone: string;
    }>(
      `SELECT ash.user_id, ash.activity_status, ash.status_date::text,
              ash.expected_end_date::text, ash.follow_up_sent,
              COALESCE(u.timezone, 'UTC') AS timezone
       FROM activity_status_history ash
       JOIN users u ON u.id = ash.user_id
       WHERE ash.status_date = (
         SELECT MAX(status_date) FROM activity_status_history
         WHERE user_id = ash.user_id
       )
       AND ash.activity_status NOT IN ('working', 'excellent', 'good')
       AND u.is_active = true`
    );

    return result.rows;
  }

  async markFollowUpSent(userId: string): Promise<void> {
    await query(
      `UPDATE activity_status_history
       SET follow_up_sent = true
       WHERE user_id = $1 AND status_date = CURRENT_DATE`,
      [userId]
    );
  }

  async resetToWorking(userId: string): Promise<void> {
    await this.updateCurrentStatus(userId, 'working' as ActivityStatus);
    logger.info('[ActivityStatus] Reset user to working status', { userId });
  }

  async getDaysSinceLastWorkingStatus(userId: string): Promise<number> {
    const result = await query<{ days: string }>(
      `SELECT COALESCE(
        CURRENT_DATE - MAX(status_date), 0
       )::text AS days
       FROM activity_status_history
       WHERE user_id = $1
         AND activity_status IN ('working', 'excellent', 'good')`,
      [userId]
    );

    return parseInt(result.rows[0]?.days ?? '0', 10);
  }
```

- [ ] **Step 2: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add server/src/services/activity-status.service.ts
git commit -m "feat: add lifecycle methods to activity status service (follow-up, reset, query)"
```

---

## Task 7: Context Integration — Add activityStatus to ComprehensiveUserContext

**Files:**
- Modify: `server/src/services/comprehensive-user-context.service.ts`

- [ ] **Step 1: Add import for ActivityStatusContext type**

At the top of `server/src/services/comprehensive-user-context.service.ts`, add the import:

```typescript
import type { ActivityStatusContext, StatusPattern } from '../types/activity-status.types.js';
```

Also import the activity status service (if not already imported):

```typescript
import { activityStatusService } from './activity-status.service.js';
```

- [ ] **Step 2: Add ActivityStatusContext to the ComprehensiveUserContext interface**

Find the `ComprehensiveUserContext` interface definition and add the new field:

```typescript
  activityStatus: ActivityStatusContext;
```

- [ ] **Step 3: Add the fetch method**

Add this method to the `ComprehensiveUserContextService` class:

```typescript
  private async getActivityStatusContext(userId: string): Promise<ActivityStatusContext> {
    try {
      const [currentResult, historyResult, daysResult, overridesResult, patternsResult] = await Promise.all([
        query<{ current_activity_status: string; activity_status_updated_at: string }>(
          `SELECT current_activity_status, activity_status_updated_at FROM users WHERE id = $1`,
          [userId]
        ),
        query<{ status_date: string; activity_status: string; mood: number | null }>(
          `SELECT status_date::text, activity_status, mood
           FROM activity_status_history
           WHERE user_id = $1 AND status_date >= CURRENT_DATE - INTERVAL '7 days'
           ORDER BY status_date DESC`,
          [userId]
        ),
        query<{ days: string }>(
          `SELECT COALESCE(CURRENT_DATE - MAX(status_date), 0)::text AS days
           FROM activity_status_history
           WHERE user_id = $1 AND activity_status IN ('working', 'excellent', 'good')`,
          [userId]
        ),
        query<{ status_overrides: unknown }>(
          `SELECT status_overrides FROM user_plans WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
          [userId]
        ),
        query<{ status_patterns: StatusPattern[] }>(
          `SELECT status_patterns FROM user_coaching_profiles WHERE user_id = $1`,
          [userId]
        ),
      ]);

      const user = currentResult.rows[0];
      const current = (user?.current_activity_status ?? 'working') as string;

      return {
        current: current as any,
        since: user?.activity_status_updated_at ?? new Date().toISOString(),
        source: 'manual',
        recentHistory: historyResult.rows.map(r => ({
          date: r.status_date,
          status: r.activity_status as any,
          mood: r.mood ?? undefined,
        })),
        patterns: patternsResult.rows[0]?.status_patterns ?? [],
        activeOverrides: overridesResult.rows[0]?.status_overrides != null,
        daysSinceLastWorkingStatus: parseInt(daysResult.rows[0]?.days ?? '0', 10),
      };
    } catch (error) {
      logger.error('[ComprehensiveContext] Failed to fetch activity status context', { userId, error });
      return {
        current: 'working' as any,
        since: new Date().toISOString(),
        source: 'manual',
        recentHistory: [],
        patterns: [],
        activeOverrides: false,
        daysSinceLastWorkingStatus: 0,
      };
    }
  }
```

- [ ] **Step 4: Wire into Wave 1 of getComprehensiveContext**

Find the Wave 1 `Promise.all` in `getComprehensiveContext()` and add the new fetch:

```typescript
// Wave 1: Core health data
const [whoop, lifestyle, workouts, nutrition, activityStatus] = await Promise.all([
  this.getWhoopContext(userId),
  this.getLifestyleContext(userId),
  this.getWorkoutContext(userId),
  this.getNutritionContext(userId),
  this.getActivityStatusContext(userId),
]);
```

Then add `activityStatus` to the result object assembly.

- [ ] **Step 5: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add server/src/services/comprehensive-user-context.service.ts
git commit -m "feat: add activityStatus section to ComprehensiveUserContext"
```

---

## Task 8: Chat Pipeline Integration

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts`

- [ ] **Step 1: Add imports**

At the top of `server/src/services/langgraph-chatbot.service.ts`, add:

```typescript
import { statusIntentClassifierService } from './status-intent-classifier.service.js';
import { statusPlanAdjusterService } from './status-plan-adjuster.service.js';
import { activityStatusService } from './activity-status.service.js';
```

- [ ] **Step 2: Add status classification to the parallel context-gathering phase**

In the `chat()` method, find the parallel context gathering block (the `Promise.all` that fetches RAG context, wellbeing context, system prompt, etc.). Add the status classifier as an additional parallel call:

```typescript
// Add alongside existing parallel context fetches
const statusDetectionPromise = statusIntentClassifierService.classifyFromMessage(
  params.message,
  // pass current status if easily available, otherwise omit
);
```

Add `statusDetectionPromise` to the existing `Promise.all` or `Promise.allSettled` block.

- [ ] **Step 3: Handle detection result before LLM invocation**

After the parallel context gathering resolves, add this block before the LLM call:

```typescript
// Handle auto-detected status changes
const statusDetection = await statusDetectionPromise;
if (statusDetection.detected && statusDetection.status) {
  const isHighConfidence = statusDetection.confidence >= 0.85 && statusDetection.layer === 'explicit';

  if (isHighConfidence) {
    // Auto-apply status change
    const endDate = statusDetection.duration?.endDate ??
      (statusDetection.duration?.days
        ? new Date(Date.now() + statusDetection.duration.days * 86400000).toISOString().split('T')[0]
        : undefined);

    await activityStatusService.updateCurrentStatusWithLifecycle(
      params.userId,
      statusDetection.status,
      'chat_explicit',
      endDate,
      statusDetection.reason,
    );

    // Auto-apply plan adjustments for Tier 1 statuses
    if (statusPlanAdjusterService.isAutoConfirmStatus(statusDetection.status)) {
      await statusPlanAdjusterService.applyOverridesToPlan(params.userId, statusDetection.status, endDate);
    }
  }

  // Inject status detection context into system prompt for AI to acknowledge
  const statusContext = isHighConfidence
    ? `\n\nIMPORTANT: User's activity status has been auto-updated to "${statusDetection.status}" (reason: ${statusDetection.reason ?? 'unspecified'}). Acknowledge this naturally in your response and explain what adjustments you've made to their plan.`
    : `\n\nNOTE: User may be indicating a status change to "${statusDetection.status}" (confidence: ${Math.round(statusDetection.confidence * 100)}%). Gently ask if they'd like to update their status and adjust their plan.`;

  // Append to the system prompt string before LLM invocation
  // (find the variable that holds the assembled system prompt and append statusContext)
}
```

- [ ] **Step 4: Handle status return ("I'm better now")**

Add a check: if the user's current status is non-working and the classifier detects a return to normal (e.g., "I'm feeling better", "I'm back"), clear overrides:

```typescript
// After status detection, also check for status CLEARING
if (!statusDetection.detected && statusDetection.confidence < 0.3) {
  // Check if user is saying they're better
  const returnKeywords = ["i'm better", "feeling better", "i'm fine now", "back to normal", "recovered", "i'm back", "all good now"];
  const lower = params.message.toLowerCase();
  const isReturning = returnKeywords.some(kw => lower.includes(kw));

  if (isReturning) {
    const currentStatus = await activityStatusService.getCurrentStatus(params.userId);
    if (currentStatus.status !== 'working' && currentStatus.status !== 'good' && currentStatus.status !== 'excellent') {
      await activityStatusService.updateCurrentStatusWithLifecycle(params.userId, 'working', 'chat_explicit');
      await statusPlanAdjusterService.clearOverrides(params.userId);
      // Inject into system prompt
      // statusContext += '\n\nUser has recovered! Status reset to working. Welcome them back and mention their plan is restored.';
    }
  }
}
```

- [ ] **Step 5: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add server/src/services/langgraph-chatbot.service.ts
git commit -m "feat: integrate status intent classifier into chat pipeline"
```

---

## Task 9: Proactive Messaging — Status Follow-Up Messages

**Files:**
- Modify: `server/src/services/proactive-messaging.service.ts`

- [ ] **Step 1: Add status follow-up message candidates to the scoring function**

In `scoreMessageCandidates()`, find the `candidates` array and add these entries. First, the data: query the user's current activity status and lifecycle fields in the parallel data-fetch block at the top of the method:

```typescript
// Add to the parallel Promise.all data fetch
const statusResult = await query<{
  activity_status: string;
  status_date: string;
  expected_end_date: string | null;
  follow_up_sent: boolean;
}>(
  `SELECT activity_status, status_date::text, expected_end_date::text, follow_up_sent
   FROM activity_status_history
   WHERE user_id = $1
   ORDER BY status_date DESC LIMIT 1`,
  [userId]
);
const latestStatus = statusResult.rows[0];
const statusAge = latestStatus
  ? Math.floor((Date.now() - new Date(latestStatus.status_date).getTime()) / 86400000)
  : 0;
```

Then add these candidates to the `candidates` array:

```typescript
// Status follow-up: sick
{
  type: 'status_followup_sick' as ProactiveMessageType,
  eligible: latestStatus?.activity_status === 'sick' && statusAge >= 1 && !latestStatus.follow_up_sent && !sent('status_followup_sick'),
  timeWindowValid: hour >= 8 && hour < 12,
  score: 90,
},
// Status follow-up: injury
{
  type: 'status_followup_injury' as ProactiveMessageType,
  eligible: latestStatus?.activity_status === 'injury' && statusAge >= 3 && !latestStatus.follow_up_sent && !sent('status_followup_injury'),
  timeWindowValid: hour >= 8 && hour < 14,
  score: 85,
},
// Status follow-up: travel (no end date)
{
  type: 'status_followup_travel' as ProactiveMessageType,
  eligible: latestStatus?.activity_status === 'travel' && !latestStatus.expected_end_date && statusAge >= 2 && !sent('status_followup_travel'),
  timeWindowValid: hour >= 9 && hour < 18,
  score: 75,
},
// Status follow-up: vacation (no end date)
{
  type: 'status_followup_vacation' as ProactiveMessageType,
  eligible: latestStatus?.activity_status === 'vacation' && !latestStatus.expected_end_date && statusAge >= 2 && !sent('status_followup_vacation'),
  timeWindowValid: hour >= 10 && hour < 18,
  score: 70,
},
// Status follow-up: stress (day 3+)
{
  type: 'status_followup_stress' as ProactiveMessageType,
  eligible: latestStatus?.activity_status === 'stress' && statusAge >= 3 && !sent('status_followup_stress'),
  timeWindowValid: hour >= 9 && hour < 16,
  score: 80,
},
// Status return: welcome back
{
  type: 'status_return' as ProactiveMessageType,
  eligible: latestStatus?.activity_status === 'working' && statusAge === 0 && sent('status_followup_sick') || sent('status_followup_injury') || sent('status_followup_travel'),
  timeWindowValid: hour >= 7 && hour < 12,
  score: 88,
},
// Status stale: 7+ days unchanged
{
  type: 'status_stale' as ProactiveMessageType,
  eligible: latestStatus != null && !['working', 'excellent', 'good'].includes(latestStatus.activity_status) && statusAge >= 7 && !sent('status_stale'),
  timeWindowValid: hour >= 9 && hour < 18,
  score: 82,
},
```

- [ ] **Step 2: Add the ProactiveMessageType union entries**

Find the `ProactiveMessageType` type/union definition and add the 7 new types:

```typescript
| 'status_followup_sick'
| 'status_followup_injury'
| 'status_followup_travel'
| 'status_followup_vacation'
| 'status_followup_stress'
| 'status_return'
| 'status_stale'
```

- [ ] **Step 3: Add handler cases in the message dispatch switch**

In the proactive messaging job's dispatch switch (in `proactive-messaging.job.ts`), add handlers for the new types. These use the generic `generateProactiveMessage` with status-specific context:

```typescript
case 'status_followup_sick':
case 'status_followup_injury':
case 'status_followup_travel':
case 'status_followup_vacation':
case 'status_followup_stress':
case 'status_return':
case 'status_stale':
  await proactiveMessagingService.checkAndSendStatusFollowUpMessage(user.id, candidate.type, context);
  break;
```

- [ ] **Step 4: Implement the generic status follow-up send method**

Add to `ProactiveMessagingService` class:

```typescript
async checkAndSendStatusFollowUpMessage(
  userId: string,
  type: string,
  context: any,
): Promise<void> {
  const templates: Record<string, string> = {
    status_followup_sick: "Check in on the user's health. They've been marked as sick. Ask how they're feeling today and if they're ready to ease back in or need more rest.",
    status_followup_injury: "Follow up on the user's injury recovery. Ask for updates on how it's healing and whether their plan needs further adjustment.",
    status_followup_travel: "The user has been traveling without a set return date. Ask when they're getting back so you can prepare their plan.",
    status_followup_vacation: "The user is on vacation without a set end date. Casually ask when their vacation ends so you can plan ahead. Keep it light.",
    status_followup_stress: "The user has been stressed for 3+ days. Check in on their stress level. Offer to adjust their plan or suggest stress-relief activities.",
    status_return: "Welcome the user back! They just returned to active status. Mention their plan has been restored and suggest easing back in.",
    status_stale: "The user's status has been unchanged for 7+ days. Gently ask if their status is still accurate or if it needs updating.",
  };

  const prompt = templates[type] ?? 'Check in with the user about their current status.';

  await this.generateAndSendProactiveMessage(userId, type, prompt, context);

  // Mark follow-up as sent
  await activityStatusService.markFollowUpSent(userId);
}
```

- [ ] **Step 5: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add server/src/services/proactive-messaging.service.ts server/src/jobs/proactive-messaging.job.ts
git commit -m "feat: add 7 status follow-up message types to proactive messaging"
```

---

## Task 10: Tool Router — Add Status Manager Tools

**Files:**
- Modify: `server/src/services/tool-router.service.ts`

- [ ] **Step 1: Add 'status' intent and tool group**

In `server/src/services/tool-router.service.ts`, add to the `ToolIntent` type:

```typescript
| 'status'
```

Add to `TOOL_GROUPS`:

```typescript
status: ['statusManager', 'activityStatusUpdater', 'statusHistoryViewer', 'planAdjustmentManager'],
```

Add to `INTENT_KEYWORDS`:

```typescript
status: ['status', 'sick', 'injured', 'traveling', 'vacation', 'rest day', 'activity status', 'feeling sick', 'hurt', 'recovery day'],
```

- [ ] **Step 2: Make status tools always-available**

Find where "general" tools are always included (the tool filtering logic). Add `'status'` to the always-included intents so status tools are available regardless of classified intent:

```typescript
// In filterToolsByIntent, ensure status tools are always included
const alwaysInclude: ToolIntent[] = ['general', 'status'];
```

- [ ] **Step 3: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/src/services/tool-router.service.ts
git commit -m "feat: add status manager tools to tool router (always available)"
```

---

## Task 11: Intervention Decision Tree — STATUS_AWARENESS_RESPONSE

**Files:**
- Modify: `server/src/services/intelligent-intervention.service.ts`

- [ ] **Step 1: Add the new decision tree**

Find the `decisionTrees` array in `server/src/services/intelligent-intervention.service.ts` and add this tree:

```typescript
{
  id: 'STATUS_AWARENESS_RESPONSE',
  evaluate({ snapshot, context }) {
    const status = context.activityStatus?.current;
    if (!status || ['working', 'excellent', 'good'].includes(status)) return null;

    // Tier 1: Safety-critical statuses with scheduled workouts
    if ((status === 'sick' || status === 'injury') && (snapshot.workoutCount ?? 0) > 0) {
      return {
        type: 'force_rest_day',
        decisionTree: 'STATUS_AWARENESS_RESPONSE',
        adjustments: {
          skipWorkouts: true,
          status,
          reason: `User is ${status} — all workouts auto-skipped for safety`,
        },
        reasoning: `User has marked themselves as ${status}. Continuing planned workouts could worsen their condition. Auto-skipping all scheduled workouts and suggesting recovery-appropriate activities.`,
        requiresUserApproval: false,
        expiresInHours: 24,
        priority: 'critical' as const,
      };
    }

    // Return-to-training ramp-up after 3+ days off
    const daysOff = context.activityStatus?.daysSinceLastWorkingStatus ?? 0;
    if (status === 'working' && daysOff >= 3) {
      return {
        type: 'ramp_up_after_absence',
        decisionTree: 'STATUS_AWARENESS_RESPONSE',
        adjustments: {
          intensityReduction: daysOff >= 7 ? 0.5 : 0.75,
          rampUpDays: Math.min(Math.ceil(daysOff / 2), 5),
          reason: `Returning after ${daysOff} days off — gradual ramp-up`,
        },
        reasoning: `User just returned to active status after ${daysOff} days. Going from 0 to 100% risks injury and burnout. Suggesting ${daysOff >= 7 ? '50%' : '75%'} intensity for the first ${Math.min(Math.ceil(daysOff / 2), 5)} days.`,
        requiresUserApproval: false,
        expiresInHours: Math.min(Math.ceil(daysOff / 2), 5) * 24,
        priority: 'high' as const,
      };
    }

    return null;
  },
},
```

- [ ] **Step 2: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/src/services/intelligent-intervention.service.ts
git commit -m "feat: add STATUS_AWARENESS_RESPONSE decision tree for safety + ramp-up"
```

---

## Task 12: Coaching Profile — Status Pattern Integration

**Files:**
- Modify: `server/src/services/user-coaching-profile.service.ts`

- [ ] **Step 1: Add import for pattern analyzer**

At the top of `server/src/services/user-coaching-profile.service.ts`:

```typescript
import { statusPatternAnalyzerService } from './status-pattern-analyzer.service.js';
```

- [ ] **Step 2: Add status pattern analysis to the profile generation pipeline**

In the `generateProfile()` method, find the Step 2 "derived computations" section (where `buildPatterns`, `buildFitnessJourney`, etc. are called). Add:

```typescript
const statusPatterns = await statusPatternAnalyzerService.analyzeAllPatterns(userId);
```

- [ ] **Step 3: Persist patterns alongside profile**

After the profile is assembled and before it's persisted, add:

```typescript
// Persist status patterns to coaching profile
if (statusPatterns.length > 0) {
  await statusPatternAnalyzerService.persistPatterns(userId, statusPatterns);
}
```

- [ ] **Step 4: Include status patterns in RecentObservations**

Find where `RecentObservations` is built (the `generateRecentObservations` method or similar). Add a summary of status patterns:

```typescript
// Add to recentChanges array
if (statusPatterns.length > 0) {
  recentChanges.push(
    ...statusPatterns.map(p => p.pattern)
  );
}
```

- [ ] **Step 5: Verify types compile**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add server/src/services/user-coaching-profile.service.ts
git commit -m "feat: integrate status pattern analysis into coaching profile generation"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run full type check**

Run: `cd server && npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Run all new tests**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest tests/unit/services/status- --verbose 2>&1`
Expected: All tests pass (status-intent-classifier, status-plan-adjuster, status-pattern-analyzer)

- [ ] **Step 3: Run existing tests to check for regressions**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest --verbose 2>&1 | tail -30`
Expected: No new failures

- [ ] **Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: AI coach activity status awareness — complete feature integration"
```
