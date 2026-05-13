# Persistent AI Memory & Analytics Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a post-processing insight extraction layer to the LangGraph chatbot that transforms conversation turns into structured, persistent intelligence — reusable across future AI coach interactions.

**Architecture:** A new `conversation-insight-extractor.service.ts` runs as fire-and-forget after each coach response, extracting insights via gpt-4o-mini and routing them to existing memory, vector, and profile stores. The `comprehensive-user-context.service.ts` gains a 10th context category that retrieves stored intelligence for prompt injection. Broken upstream jobs are fixed by feeding them the data they expect.

**Tech Stack:** TypeScript/ESM, PostgreSQL (pgvector), OpenAI gpt-4o-mini, BullMQ, Redis, Vitest

**Spec:** `docs/superpowers/specs/2026-05-13-persistent-ai-memory-analytics-layer-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|----------------|
| `server/src/services/conversation-insight-extractor.service.ts` | Core extraction + routing service. Calls LLM, dedup-checks, routes to memory/vector/profile/daily-analysis stores |
| `server/src/database/migrations/20260513_intelligence_pending_signals.sql` | Pending signals table for sub-threshold memory candidates |
| `server/shared/types/domain/turn-insights.ts` | `TurnInsights` and `IntelligenceContext` type definitions |
| `server/src/services/__tests__/conversation-insight-extractor.test.ts` | Unit tests for the extractor service |

### Modified Files

| File | Change |
|------|--------|
| `server/src/services/langgraph-chatbot.service.ts` (~line 4684) | Add fire-and-forget call to extractor after `enqueueWikiMaintenance` |
| `server/src/services/comprehensive-user-context.service.ts` | Add `getIntelligenceContext()` method + Intelligence Memory section in `formatContextForPrompt()` |
| `server/src/services/memory-engine.service.ts` | Add `findSimilarMemories()` dedup query method |
| `server/src/jobs/life-history-digest.job.ts` | Add conversation insights fallback when no activity logs exist |
| `server/src/database/auto-migrate.ts` | Register new migration in SUPPLEMENTARY_MIGRATIONS |

---

## Task 1: Shared Types

**Files:**
- Create: `server/shared/types/domain/turn-insights.ts`

- [ ] **Step 1: Create the TurnInsights and IntelligenceContext type file**

```typescript
// server/shared/types/domain/turn-insights.ts
import type {
  IntelligenceCategory,
  MemoryType,
  IntelligenceMemory,
  CoreSection,
} from './intelligence-files.js';

export interface ExtractedMood {
  state: string;
  intensity: number;
  triggers?: string[];
}

export interface ExtractedEntities {
  goals?: string[];
  habits?: string[];
  preferences?: string[];
  issues?: string[];
}

export interface BehavioralSignals {
  pattern?: string;
  sentiment_trend?: 'improving' | 'stable' | 'declining';
  commitment_level?: 'high' | 'medium' | 'low';
}

export interface MemoryCandidate {
  title: string;
  description: string;
  category: IntelligenceCategory;
  memoryType: MemoryType;
  confidence: number;
  dedup_action?: 'reinforce' | 'supersede';
  existing_memory_id?: string;
}

export interface CoreProfileUpdate {
  section: CoreSection;
  key: string;
  value: unknown;
  unit?: string;
  source: string;
}

export interface TurnInsights {
  mood: ExtractedMood | null;
  intent: string;
  entities: ExtractedEntities;
  behavioral_signals: BehavioralSignals | null;
  memory_candidates: MemoryCandidate[];
  core_profile_updates: CoreProfileUpdate[];
}

export interface SemanticInsight {
  content: string;
  similarity: number;
  createdAt: string;
  sourceType: string;
}

export interface IntelligenceContext {
  structuredMemories: IntelligenceMemory[];
  semanticInsights: SemanticInsight[];
}

export interface ExtractAndPersistParams {
  userId: string;
  userMessage: string;
  coachResponse: string;
  conversationId: string;
  toolCalls?: Array<{ tool: string; result: string }>;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | Select-String "turn-insights" | Select-Object -First 5`

Expected: No errors referencing turn-insights.ts (warnings about other files are fine)

- [ ] **Step 3: Commit**

```
git add server/shared/types/domain/turn-insights.ts
git commit -m "feat(intelligence): add TurnInsights and IntelligenceContext shared types"
```

---

## Task 2: Pending Signals Migration

**Files:**
- Create: `server/src/database/migrations/20260513_intelligence_pending_signals.sql`
- Modify: `server/src/database/auto-migrate.ts`

- [ ] **Step 1: Create the migration SQL file**

```sql
-- server/src/database/migrations/20260513_intelligence_pending_signals.sql
-- Stores sub-threshold memory candidates until they accumulate enough evidence (3+ occurrences)

CREATE TABLE IF NOT EXISTS intelligence_pending_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  promoted_memory_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_signals_user_category
  ON intelligence_pending_signals(user_id, category);

CREATE INDEX IF NOT EXISTS idx_pending_signals_user_title
  ON intelligence_pending_signals(user_id, title);

CREATE INDEX IF NOT EXISTS idx_pending_signals_promotable
  ON intelligence_pending_signals(user_id, occurrence_count)
  WHERE promoted_memory_id IS NULL AND occurrence_count >= 3;
```

- [ ] **Step 2: Register the migration in auto-migrate.ts**

Open `server/src/database/auto-migrate.ts`. Find the `SUPPLEMENTARY_MIGRATIONS` array (around lines 1007-1063). Add the new migration at the end of the array:

```typescript
'20260513_intelligence_pending_signals.sql',
```

Also add `'intelligence_pending_signals'` to the `EXPECTED_TABLES` array (around line 123, near other intelligence tables).

- [ ] **Step 3: Verify migration runs**

Run: `cd server && node -e "import('./src/database/auto-migrate.js').then(m => m.autoMigrate()).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })"`

Expected: Migration runs without errors. Table `intelligence_pending_signals` created.

- [ ] **Step 4: Commit**

```
git add server/src/database/migrations/20260513_intelligence_pending_signals.sql server/src/database/auto-migrate.ts
git commit -m "feat(intelligence): add intelligence_pending_signals table migration"
```

---

## Task 3: Memory Engine — Add findSimilarMemories Method

**Files:**
- Modify: `server/src/services/memory-engine.service.ts` (after `findOrCreatePattern` method, ~line 454)
- Create: `server/src/services/__tests__/memory-engine-dedup.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// server/src/services/__tests__/memory-engine-dedup.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();

vi.mock('../../config/database.config.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

vi.mock('../logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { memoryEngineService } = await import('../memory-engine.service.js');

describe('memoryEngineService.findSimilarMemories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns matching memories by title similarity within category', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'mem-1',
          user_id: 'user-1',
          title: 'Morning workout preference',
          description: 'User prefers morning workouts',
          category: 'fitness',
          memory_type: 'preference',
          confidence: 0.8,
          evidence_count: 3,
          evidence: [],
          min_evidence: 3,
          source: 'ai',
          kg_node_ids: [],
          related_memory_ids: [],
          status: 'active',
          verified_at: null,
          rejected_at: null,
          rejection_reason: null,
          superseded_by: null,
          last_accessed_at: new Date(),
          access_count: 5,
          decay_rate: 0.01,
          expires_at: null,
          created_at: new Date(),
          updated_at: new Date(),
          structured_data: {},
          subcategory: null,
        },
      ],
    });

    const result = await memoryEngineService.findSimilarMemories(
      'user-1',
      'fitness',
      'morning workout'
    );

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Morning workout preference');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('intelligence_memories'),
      expect.arrayContaining(['user-1', 'fitness'])
    );
  });

  it('returns empty array when no matches found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await memoryEngineService.findSimilarMemories(
      'user-1',
      'fitness',
      'something unrelated'
    );

    expect(result).toHaveLength(0);
  });

  it('returns empty array when memory table is missing', async () => {
    mockQuery.mockRejectedValueOnce(
      Object.assign(new Error('relation "intelligence_memories" does not exist'), { code: '42P01' })
    );

    const result = await memoryEngineService.findSimilarMemories(
      'user-1',
      'fitness',
      'morning workout'
    );

    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/__tests__/memory-engine-dedup.test.ts`

Expected: FAIL — `findSimilarMemories is not a function`

- [ ] **Step 3: Implement findSimilarMemories**

Add this method to the `MemoryEngineService` class in `server/src/services/memory-engine.service.ts`, after `findOrCreatePattern` (~line 454):

```typescript
  async findSimilarMemories(
    userId: string,
    category: IntelligenceCategory,
    searchText: string,
    limit: number = 5
  ): Promise<IntelligenceMemory[]> {
    if (!(await hasMemoryTable())) return [];

    try {
      const result = await query(
        `SELECT * FROM intelligence_memories
         WHERE user_id = $1 AND category = $2
           AND status IN ('active', 'verified')
           AND (title ILIKE $3 OR description ILIKE $3)
         ORDER BY confidence DESC
         LIMIT $4`,
        [userId, category, `%${searchText}%`, limit]
      );

      return result.rows.map(mapRow);
    } catch (error) {
      if (isMissingMemoryTable(error)) return [];
      throw error;
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/services/__tests__/memory-engine-dedup.test.ts`

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```
git add server/src/services/memory-engine.service.ts server/src/services/__tests__/memory-engine-dedup.test.ts
git commit -m "feat(intelligence): add findSimilarMemories dedup method to memory engine"
```

---

## Task 4: Conversation Insight Extractor Service

**Files:**
- Create: `server/src/services/conversation-insight-extractor.service.ts`
- Create: `server/src/services/__tests__/conversation-insight-extractor.test.ts`

- [ ] **Step 1: Write the failing test for extraction + routing**

```typescript
// server/src/services/__tests__/conversation-insight-extractor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock all dependencies ---

const mockOpenAICreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  })),
}));

const mockQuery = vi.fn();
vi.mock('../../config/database.config.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

vi.mock('../../config/env.config.js', () => ({
  env: {
    openai: { apiKey: 'test-key', model: 'gpt-4o-mini' },
  },
}));

vi.mock('../logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockGetMemoriesForContext = vi.fn().mockResolvedValue([]);
const mockFindSimilarMemories = vi.fn().mockResolvedValue([]);
const mockFindOrCreatePattern = vi.fn().mockResolvedValue({ memory: { id: 'mem-1' }, wasReinforced: false });
vi.mock('../memory-engine.service.js', () => ({
  memoryEngineService: {
    getMemoriesForContext: mockGetMemoriesForContext,
    findSimilarMemories: mockFindSimilarMemories,
    findOrCreatePattern: mockFindOrCreatePattern,
  },
}));

const mockEnqueueEmbedding = vi.fn().mockResolvedValue(undefined);
vi.mock('../embedding-queue.service.js', () => ({
  embeddingQueueService: {
    enqueueEmbedding: mockEnqueueEmbedding,
    isAvailable: vi.fn().mockReturnValue(true),
  },
}));

const mockUpdateValue = vi.fn().mockResolvedValue({});
vi.mock('../core-profile-kernel.service.js', () => ({
  coreProfileKernelService: {
    updateValue: mockUpdateValue,
  },
}));

const { conversationInsightExtractorService } = await import(
  '../conversation-insight-extractor.service.js'
);

describe('conversationInsightExtractorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
  });

  it('extracts insights and routes memory candidates to pending signals', async () => {
    const mockInsights = {
      mood: { state: 'motivated', intensity: 0.8, triggers: ['good sleep'] },
      intent: 'planning',
      entities: { goals: ['run 5k'] },
      behavioral_signals: null,
      memory_candidates: [
        {
          title: 'Wants to run 5k',
          description: 'User expressed goal to run a 5k race',
          category: 'fitness',
          memoryType: 'context',
          confidence: 0.6,
        },
      ],
      core_profile_updates: [],
    };

    mockOpenAICreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockInsights) } }],
    });

    // No existing similar memories
    mockFindSimilarMemories.mockResolvedValueOnce([]);
    // No existing pending signal
    mockQuery.mockResolvedValueOnce({ rows: [] }); // findSimilar pending signal
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sig-1' }] }); // INSERT pending signal
    mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT mood_logs
    mockQuery.mockResolvedValueOnce({ rows: [] }); // UPSERT daily_analysis_reports

    await conversationInsightExtractorService.extractAndPersist({
      userId: 'user-1',
      userMessage: 'I want to train for a 5k run',
      coachResponse: 'Great goal! Let me help you plan.',
      conversationId: 'conv-1',
    });

    // Should have called OpenAI for extraction
    expect(mockOpenAICreate).toHaveBeenCalledOnce();
    expect(mockOpenAICreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        temperature: 0,
      })
    );

    // Should have checked for similar memories
    expect(mockFindSimilarMemories).toHaveBeenCalledWith(
      'user-1',
      'fitness',
      'Wants to run 5k',
      5
    );
  });

  it('skips extraction for short messages', async () => {
    await conversationInsightExtractorService.extractAndPersist({
      userId: 'user-1',
      userMessage: 'ok',
      coachResponse: 'Let me know if you need anything!',
      conversationId: 'conv-1',
    });

    expect(mockOpenAICreate).not.toHaveBeenCalled();
  });

  it('handles LLM returning invalid JSON gracefully', async () => {
    mockOpenAICreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'not valid json' } }],
    });

    // Should not throw
    await conversationInsightExtractorService.extractAndPersist({
      userId: 'user-1',
      userMessage: 'I want to improve my sleep quality significantly',
      coachResponse: 'Let us work on your sleep hygiene.',
      conversationId: 'conv-1',
    });

    // No routing should happen since parse failed
    expect(mockFindSimilarMemories).not.toHaveBeenCalled();
  });

  it('routes core profile updates to coreProfileKernelService', async () => {
    const mockInsights = {
      mood: null,
      intent: 'sharing_info',
      entities: {},
      behavioral_signals: null,
      memory_candidates: [],
      core_profile_updates: [
        {
          section: 'preferences',
          key: 'preferred_workout_time',
          value: 'morning',
          source: 'I always work out in the morning',
        },
      ],
    };

    mockOpenAICreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockInsights) } }],
    });

    mockQuery.mockResolvedValue({ rows: [] });

    await conversationInsightExtractorService.extractAndPersist({
      userId: 'user-1',
      userMessage: 'I always work out in the morning before breakfast',
      coachResponse: 'Morning workouts are great for consistency!',
      conversationId: 'conv-1',
    });

    expect(mockUpdateValue).toHaveBeenCalledWith(
      'user-1',
      'preferences',
      'preferred_workout_time',
      'morning',
      undefined
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/__tests__/conversation-insight-extractor.test.ts`

Expected: FAIL — Cannot find module `../conversation-insight-extractor.service.js`

- [ ] **Step 3: Implement the extractor service**

```typescript
// server/src/services/conversation-insight-extractor.service.ts
import OpenAI from 'openai';
import { query } from '../config/database.config.js';
import { env } from '../config/env.config.js';
import { logger } from './logger.service.js';
import { memoryEngineService } from './memory-engine.service.js';
import { embeddingQueueService } from './embedding-queue.service.js';
import { coreProfileKernelService } from './core-profile-kernel.service.js';
import type { IntelligenceCategory, MemoryEvidence } from '@shared/types/domain/intelligence-files.js';
import type {
  TurnInsights,
  ExtractAndPersistParams,
  MemoryCandidate,
  CoreProfileUpdate,
} from '@shared/types/domain/turn-insights.js';

const MIN_MESSAGE_LENGTH = 10;

const EXTRACTION_PROMPT = `You are an insight extraction engine for a health coaching AI. Given a conversation turn between a user and their AI health coach, extract structured insights.

EXISTING USER MEMORIES (do not duplicate these):
{existingMemoryTitles}

CONVERSATION TURN:
User: {userMessage}
Coach: {coachResponse}

Extract insights as JSON matching this schema exactly:
{
  "mood": { "state": string, "intensity": number 0-1, "triggers": [string] } | null,
  "intent": string,
  "entities": { "goals": [string], "habits": [string], "preferences": [string], "issues": [string] },
  "behavioral_signals": { "pattern": string, "sentiment_trend": "improving"|"stable"|"declining", "commitment_level": "high"|"medium"|"low" } | null,
  "memory_candidates": [{ "title": string, "description": string, "category": "fitness"|"nutrition"|"sleep"|"wellbeing"|"lifestyle"|"behavioral"|"cross_domain", "memoryType": "pattern"|"preference"|"context"|"feedback"|"relationship"|"learned_rule", "confidence": number 0-1 }],
  "core_profile_updates": [{ "section": "biometrics"|"targets"|"constraints"|"preferences"|"medical"|"lifestyle", "key": string, "value": any, "unit": string|null, "source": string }]
}

Rules:
- Only extract insights clearly stated or strongly implied
- memory_candidates: only genuinely new insights not in EXISTING USER MEMORIES
- core_profile_updates: only when user explicitly states a preference or fact about themselves
- mood: null if no emotional signal detected
- behavioral_signals: null if no behavioral pattern detected
- If the turn is purely transactional (navigation, commands), return empty arrays for memory_candidates and core_profile_updates
- Respond with valid JSON only, no prose`;

class ConversationInsightExtractorService {
  private openai: OpenAI | null;

  constructor() {
    this.openai = env.openai.apiKey
      ? new OpenAI({ apiKey: env.openai.apiKey })
      : null;
  }

  async extractAndPersist(params: ExtractAndPersistParams): Promise<void> {
    const { userId, userMessage, coachResponse, conversationId } = params;

    if (userMessage.length < MIN_MESSAGE_LENGTH) return;
    if (!this.openai) {
      logger.debug('[InsightExtractor] No OpenAI key configured, skipping');
      return;
    }

    let insights: TurnInsights;
    try {
      insights = await this.extractInsights(userId, userMessage, coachResponse);
    } catch (error) {
      logger.warn('[InsightExtractor] Extraction failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return;
    }

    const evidence: MemoryEvidence = {
      source_table: 'rag_conversations',
      source_id: conversationId,
      date: new Date().toISOString().split('T')[0],
      summary: userMessage.substring(0, 200),
    };

    await Promise.allSettled([
      this.routeMemoryCandidates(userId, insights.memory_candidates, evidence),
      this.routeCoreProfileUpdates(userId, insights.core_profile_updates),
      this.routeVectorEmbedding(userId, conversationId, insights),
      this.routeToDailyAnalysis(userId, insights),
      this.routeMoodLog(userId, insights),
    ]);

    const candidateCount = insights.memory_candidates.length;
    const profileCount = insights.core_profile_updates.length;
    if (candidateCount > 0 || profileCount > 0) {
      logger.info('[InsightExtractor] Processed turn', {
        userId,
        conversationId,
        memoryCandidates: candidateCount,
        coreProfileUpdates: profileCount,
        mood: insights.mood?.state ?? 'none',
        intent: insights.intent,
      });
    }
  }

  private async extractInsights(
    userId: string,
    userMessage: string,
    coachResponse: string
  ): Promise<TurnInsights> {
    const existingMemories = await memoryEngineService.getMemoriesForContext(userId, userMessage, 20);
    const existingTitles = existingMemories.map(m => `- ${m.title}`).join('\n') || '(none)';

    const prompt = EXTRACTION_PROMPT
      .replace('{existingMemoryTitles}', existingTitles)
      .replace('{userMessage}', userMessage)
      .replace('{coachResponse}', coachResponse);

    const response = await this.openai!.chat.completions.create({
      model: env.openai.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Respond with strict JSON only, no prose.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content ?? '';
    return JSON.parse(content) as TurnInsights;
  }

  private async routeMemoryCandidates(
    userId: string,
    candidates: MemoryCandidate[],
    evidence: MemoryEvidence
  ): Promise<void> {
    for (const candidate of candidates) {
      try {
        const similar = await memoryEngineService.findSimilarMemories(
          userId,
          candidate.category,
          candidate.title,
          5
        );

        if (similar.length > 0) {
          await memoryEngineService.reinforceMemory(similar[0].id, userId, [evidence]);
          continue;
        }

        await this.upsertPendingSignal(userId, candidate, evidence);
      } catch (error) {
        logger.debug('[InsightExtractor] Memory candidate routing failed', {
          userId,
          title: candidate.title,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
  }

  private async upsertPendingSignal(
    userId: string,
    candidate: MemoryCandidate,
    evidence: MemoryEvidence
  ): Promise<void> {
    const existing = await query(
      `SELECT id, occurrence_count, evidence, promoted_memory_id
       FROM intelligence_pending_signals
       WHERE user_id = $1 AND category = $2
         AND (title ILIKE $3 OR title ILIKE $4)
         AND promoted_memory_id IS NULL
       LIMIT 1`,
      [userId, candidate.category, `%${candidate.title}%`, `%${candidate.title.split(' ').slice(0, 3).join(' ')}%`]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const newCount = (row.occurrence_count as number) + 1;
      const existingEvidence = (row.evidence as MemoryEvidence[]) || [];
      const mergedEvidence = [...existingEvidence, evidence];

      await query(
        `UPDATE intelligence_pending_signals
         SET occurrence_count = $2, last_seen_at = NOW(),
             evidence = $3, updated_at = NOW()
         WHERE id = $1`,
        [row.id, newCount, JSON.stringify(mergedEvidence)]
      );

      if (newCount >= 3 && !row.promoted_memory_id) {
        await this.promoteSignal(userId, row.id as string, candidate, mergedEvidence);
      }
    } else {
      await query(
        `INSERT INTO intelligence_pending_signals
         (user_id, title, description, category, memory_type, confidence, evidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          candidate.title,
          candidate.description,
          candidate.category,
          candidate.memoryType,
          candidate.confidence,
          JSON.stringify([evidence]),
        ]
      );
    }
  }

  private async promoteSignal(
    userId: string,
    signalId: string,
    candidate: MemoryCandidate,
    evidence: MemoryEvidence[]
  ): Promise<void> {
    try {
      const result = await memoryEngineService.findOrCreatePattern(
        userId,
        candidate.category,
        candidate.title.slice(0, 255),
        candidate.description,
        evidence.slice(0, 10),
        'ai'
      );

      await query(
        `UPDATE intelligence_pending_signals SET promoted_memory_id = $1, updated_at = NOW() WHERE id = $2`,
        [result.memory.id, signalId]
      );

      logger.info('[InsightExtractor] Promoted pending signal to memory', {
        userId,
        signalId,
        memoryId: result.memory.id,
        title: candidate.title,
      });
    } catch (error) {
      logger.warn('[InsightExtractor] Signal promotion failed', {
        userId,
        signalId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  private async routeCoreProfileUpdates(
    userId: string,
    updates: CoreProfileUpdate[]
  ): Promise<void> {
    for (const update of updates) {
      try {
        await coreProfileKernelService.updateValue(
          userId,
          update.section,
          update.key,
          update.value,
          update.unit
        );
      } catch (error) {
        logger.debug('[InsightExtractor] Core profile update failed', {
          userId,
          section: update.section,
          key: update.key,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
  }

  private async routeVectorEmbedding(
    userId: string,
    conversationId: string,
    insights: TurnInsights
  ): Promise<void> {
    if (!embeddingQueueService.isAvailable()) return;

    try {
      const textContent = [
        insights.mood ? `Mood: ${insights.mood.state} (${insights.mood.intensity})` : '',
        `Intent: ${insights.intent}`,
        ...insights.memory_candidates.map(c => `${c.category}: ${c.title} - ${c.description}`),
        ...insights.core_profile_updates.map(u => `${u.section}.${u.key}: ${u.value}`),
      ].filter(Boolean).join('\n');

      if (textContent.length < 20) return;

      await embeddingQueueService.enqueueEmbedding({
        userId,
        sourceType: 'insight_extraction',
        sourceId: `${conversationId}-${Date.now()}`,
        operation: 'create',
      });
    } catch (error) {
      logger.debug('[InsightExtractor] Embedding queue failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  private async routeToDailyAnalysis(
    userId: string,
    insights: TurnInsights
  ): Promise<void> {
    const claims = insights.memory_candidates.map(c => ({
      claim: c.title,
      category: c.category,
      evidence: c.description,
    }));

    if (claims.length === 0) return;

    try {
      await query(
        `INSERT INTO daily_analysis_reports (user_id, report_date, snapshot, insights, cross_domain_insights)
         VALUES ($1, CURRENT_DATE, '{}'::jsonb, $2::jsonb, '[]'::jsonb)
         ON CONFLICT (user_id, report_date)
         DO UPDATE SET
           insights = COALESCE(daily_analysis_reports.insights, '[]'::jsonb) || $2::jsonb,
           updated_at = NOW()`,
        [userId, JSON.stringify(claims)]
      );
    } catch (error) {
      logger.debug('[InsightExtractor] Daily analysis upsert failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  private async routeMoodLog(
    userId: string,
    insights: TurnInsights
  ): Promise<void> {
    if (!insights.mood) return;

    try {
      const moodRating = Math.round(insights.mood.intensity * 10);
      await query(
        `INSERT INTO mood_logs (user_id, mood_rating, context_note, mode, logged_at)
         VALUES ($1, $2, $3, 'light', NOW())`,
        [userId, moodRating, `AI-extracted: ${insights.mood.state}`]
      );
    } catch (error) {
      logger.debug('[InsightExtractor] Mood log insert failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }
}

export const conversationInsightExtractorService = new ConversationInsightExtractorService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run src/services/__tests__/conversation-insight-extractor.test.ts`

Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```
git add server/src/services/conversation-insight-extractor.service.ts server/src/services/__tests__/conversation-insight-extractor.test.ts
git commit -m "feat(intelligence): add conversation insight extractor service with tests"
```

---

## Task 5: LangGraph Integration — Wire Extractor Into Chat

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts` (line ~4684 and imports)

- [ ] **Step 1: Add the import**

At the top of `server/src/services/langgraph-chatbot.service.ts`, after the `wikiIngestService` import (line 61), add:

```typescript
import { conversationInsightExtractorService } from './conversation-insight-extractor.service.js';
```

- [ ] **Step 2: Add the fire-and-forget extraction call**

In the `chat()` method, find the line `this.enqueueWikiMaintenance(userId, message, responseContent, activeConversationId);` (around line 4684). Immediately after it, before the `return` block, add:

```typescript
      // Extract and persist conversation insights (fire-and-forget, never blocks response)
      conversationInsightExtractorService.extractAndPersist({
        userId,
        userMessage: message,
        coachResponse: responseContent,
        conversationId: activeConversationId,
      }).catch((error) => {
        logger.warn('[LangGraphChatbot] Insight extraction failed (non-critical)', {
          error: error instanceof Error ? error.message : 'Unknown',
          userId,
        });
      });
```

- [ ] **Step 3: Also wire into the streaming chat method**

Search for the streaming equivalent — `streamChat` or `chatStream` method. Find its equivalent of the `storeMessagePair` + `enqueueWikiMaintenance` block. Add the same fire-and-forget call there. The streaming method assembles `responseContent` from chunks before storing — add the extraction call after storage, using the same pattern.

If no streaming method stores messages (some streaming implementations don't), skip this step.

- [ ] **Step 4: Verify the server starts without errors**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | Select-String "error TS" | Select-Object -First 10`

Expected: No new TypeScript errors (existing errors from other files are fine — check that none reference `conversation-insight-extractor` or `langgraph-chatbot`)

- [ ] **Step 5: Commit**

```
git add server/src/services/langgraph-chatbot.service.ts
git commit -m "feat(intelligence): wire insight extractor into LangGraph chat pipeline"
```

---

## Task 6: Retrieval Layer — Enhance Comprehensive User Context

**Files:**
- Modify: `server/src/services/comprehensive-user-context.service.ts`

- [ ] **Step 1: Add imports**

At the top of `server/src/services/comprehensive-user-context.service.ts`, add these imports alongside the existing service imports:

```typescript
import { memoryEngineService } from './memory-engine.service.js';
import { vectorEmbeddingService } from './vector-embedding.service.js';
import type { IntelligenceContext } from '@shared/types/domain/turn-insights.js';
```

- [ ] **Step 2: Add IntelligenceContext to the ComprehensiveUserContext interface**

Find the `ComprehensiveUserContext` interface definition in the file. Add a new field:

```typescript
  intelligenceContext?: IntelligenceContext;
```

- [ ] **Step 3: Add getIntelligenceContext method**

Add this method to the `ComprehensiveUserContextService` class, before `formatContextForPrompt`:

```typescript
  async getIntelligenceContext(userId: string, userMessage: string): Promise<IntelligenceContext> {
    try {
      const [structuredMemories, semanticResults] = await Promise.all([
        memoryEngineService.getMemoriesForContext(userId, userMessage, 10),
        vectorEmbeddingService.searchSimilar({
          queryText: userMessage,
          sourceType: 'insight_extraction',
          userId,
          limit: 5,
          minSimilarity: 0.7,
        }).catch(() => []),
      ]);

      const semanticInsights = semanticResults.map((r: { content: string; similarity: number; created_at: string | Date; source_type: string }) => ({
        content: typeof r.content === 'string' ? r.content : JSON.stringify(r.content),
        similarity: r.similarity,
        createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
        sourceType: r.source_type,
      }));

      return { structuredMemories, semanticInsights };
    } catch (error) {
      logger.warn('[ComprehensiveContext] Intelligence context retrieval failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return { structuredMemories: [], semanticInsights: [] };
    }
  }
```

- [ ] **Step 4: Add Intelligence Memory section to formatContextForPrompt**

In `formatContextForPrompt` (line ~2101), add this block at the very top of the method, right after `const sections: string[] = [];`:

```typescript
    // Intelligence Memory (persistent user knowledge)
    if (context.intelligenceContext) {
      const { structuredMemories, semanticInsights } = context.intelligenceContext;

      if (structuredMemories.length > 0) {
        sections.push('INTELLIGENCE MEMORY:');
        sections.push(memoryEngineService.formatMemoriesForPrompt(structuredMemories));
        sections.push('');
      }

      if (semanticInsights.length > 0) {
        sections.push('RELATED CONTEXT (semantic):');
        for (const insight of semanticInsights.slice(0, 5)) {
          const daysAgo = Math.floor(
            (Date.now() - new Date(insight.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          const timeLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
          sections.push(`- ${timeLabel}: ${insight.content.substring(0, 200)}`);
        }
        sections.push('');
      }
    }
```

- [ ] **Step 5: Wire getIntelligenceContext into the context gathering**

Find where `getComprehensiveContext` is called in `langgraph-chatbot.service.ts` — the context is fetched before building the system prompt. The intelligence context needs to be attached. There are two approaches:

**Option A (preferred):** In `langgraph-chatbot.service.ts`, after calling `comprehensiveUserContextService.getComprehensiveContext(userId)` and before calling `formatContextForPrompt`, add:

```typescript
// Attach intelligence context (requires current message for semantic search)
comprehensiveContext.intelligenceContext = await comprehensiveUserContextService
  .getIntelligenceContext(userId, message)
  .catch(() => undefined);
```

Search for `getComprehensiveContext` in `langgraph-chatbot.service.ts` to find the exact line. There may be multiple call sites (chat + streamChat) — update all of them.

- [ ] **Step 6: Verify compilation**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | Select-String "comprehensive-user-context|turn-insights" | Select-Object -First 10`

Expected: No errors

- [ ] **Step 7: Commit**

```
git add server/src/services/comprehensive-user-context.service.ts server/src/services/langgraph-chatbot.service.ts
git commit -m "feat(intelligence): add intelligence memory retrieval to comprehensive context"
```

---

## Task 7: Fix Life History Digest — Conversation Fallback

**Files:**
- Modify: `server/src/jobs/life-history-digest.job.ts`

- [ ] **Step 1: Locate the activity check in the job**

Read `server/src/jobs/life-history-digest.job.ts`. Find where it checks for user activity (queries `daily_user_scores`, `workout_logs`, `meal_logs`, `mood_logs`, `journal_entries`, `habit_logs`). The job skips users with no activity.

- [ ] **Step 2: Add conversation insights fallback**

After the existing activity check that determines whether to generate a digest for a user, and before the call to `lifeHistoryEmbeddingService.generateDailyDigest()`, add a fallback:

```typescript
        // Fallback: if no traditional activity, check for conversation insights
        if (!hasActivity) {
          try {
            const conversationInsights = await query(
              `SELECT insights FROM daily_analysis_reports
               WHERE user_id = $1 AND report_date = $2
                 AND insights IS NOT NULL AND insights != '[]'::jsonb`,
              [userId, activityDate]
            );

            if (conversationInsights.rows.length > 0) {
              hasActivity = true;
              // The digest service will pick up conversation data
            }
          } catch {
            // Non-critical — skip fallback silently
          }
        }
```

The exact insertion point depends on how `hasActivity` is determined in the current code. Read the job to find the right variable name and location. The key: if traditional logs are empty but `daily_analysis_reports.insights` has data for that date, treat the user as active.

- [ ] **Step 3: Verify compilation**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | Select-String "life-history-digest" | Select-Object -First 5`

Expected: No errors

- [ ] **Step 4: Commit**

```
git add server/src/jobs/life-history-digest.job.ts
git commit -m "fix(intelligence): add conversation insights fallback to life history digest job"
```

---

## Task 8: Integration Verification

**Files:** None created — this is verification only.

- [ ] **Step 1: Verify all tests pass**

Run: `cd server && npx vitest run src/services/__tests__/conversation-insight-extractor.test.ts src/services/__tests__/memory-engine-dedup.test.ts`

Expected: All tests PASS

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | Select-String "error TS" | Measure-Object | Select-Object -ExpandProperty Count`

Expected: No new errors (note existing error count and compare — new files should not add errors)

- [ ] **Step 3: Verify server starts**

Run: `cd server && timeout 15 node --loader ts-node/esm src/index.ts 2>&1 | Select-Object -First 30`

Expected: Server starts without import errors or crashes related to new files. It's fine if it shuts down after 15s timeout.

- [ ] **Step 4: Verify migration applied**

Run: `cd server && node -e "import('./src/config/database.config.js').then(m => m.query('SELECT COUNT(*) FROM intelligence_pending_signals')).then(r => console.log('Table exists, rows:', r.rows[0].count)).catch(e => console.error('Table missing:', e.message))"`

Expected: `Table exists, rows: 0`

- [ ] **Step 5: Final commit (if any fixups needed)**

```
git add -A
git commit -m "chore(intelligence): integration verification and fixups"
```

---

## Execution Order & Dependencies

```
Task 1 (Types)           ← no deps, do first
Task 2 (Migration)       ← no deps, can parallel with Task 1
Task 3 (Memory Engine)   ← no deps, can parallel with Tasks 1-2
Task 4 (Extractor)       ← depends on Tasks 1, 2, 3
Task 5 (LangGraph Wire)  ← depends on Task 4
Task 6 (Context Retrieval)← depends on Tasks 1, 3
Task 7 (Digest Fix)      ← no deps, can parallel with Tasks 4-6
Task 8 (Verification)    ← depends on all above
```

Tasks 1, 2, 3, and 7 are independent and can run in parallel. Task 4 is the critical path. Tasks 5 and 6 depend on Task 4 and can be parallelized with each other.
