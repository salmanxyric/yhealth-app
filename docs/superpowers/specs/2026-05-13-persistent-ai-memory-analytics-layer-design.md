# Persistent AI Memory & Analytics Layer

## Overview

A post-processing insight extraction layer inside the LangGraph chatbot that transforms user conversation inputs into structured, persistent intelligence — reusable across future AI coach interactions without reprocessing raw data.

This design addresses two problems:
1. **Broken pipeline**: Existing memory engine, extraction jobs, and intelligence files infrastructure exists but produces no results (0 items in Memories, Artifacts, Plans, Core, Logs)
2. **Missing middleware**: No unified mechanism intercepts user inputs, runs analysis once, and distributes insights to both structured memory and vector DB simultaneously

## Architecture

### Approach: Inline Post-Processing Node

Add a post-processing step inside the existing LangGraph chatbot's `chat()` method that extracts insights from every conversation turn and routes them to existing storage systems.

**Why this approach over alternatives:**
- Reuses existing services (`memoryEngineService`, `embeddingQueueService`, `comprehensiveUserContextService`)
- No new infrastructure (no new queues, workers, or services beyond the extractor)
- Zero latency impact — extraction runs as fire-and-forget after response is returned
- Extracted insights available for the next conversation turn

### Data Flow

```
User Message → LangGraph chat()
                ├─ [EXISTING] Emotion detection, crisis check, context gathering
                ├─ [EXISTING] LLM generates coach response
                ├─ [EXISTING] Store message pair, wiki maintenance
                └─ [NEW] Post-response insight extraction (fire-and-forget)
                     ├─ Lightweight LLM call → structured JSON extraction
                     ├─ Dedup check against existing memories
                     ├─ Write to intelligence_memories (via memoryEngineService)
                     ├─ Queue vector embedding (via embeddingQueueService)
                     ├─ Update core profile if preferences detected
                     └─ Append to daily_analysis_reports.insights (feeds batch jobs)
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Middleware location | Inside LangGraph `chat()` | Simplest path, reuses existing infrastructure |
| Analysis timing | Per-turn extraction | Real-time intelligence available during conversation |
| Conflict resolution | Recency wins + version history | Old memory gets `superseded` status with link to new; matches natural behavior change |
| Retrieval strategy | Enhance existing context service | Add 10th category to `comprehensive-user-context.service.ts` |
| Extraction model | gpt-4o-mini | Cheapest (~$0.0002/turn), fast, sufficient for structured extraction |

## Component 1: Conversation Insight Extractor Service

### New File: `server/src/services/conversation-insight-extractor.service.ts`

A focused service with one job — extract structured insights from a conversation turn and route them to the right stores.

### Extraction Schema

```typescript
interface TurnInsights {
  mood: {
    state: string;          // "anxious", "motivated", "tired", etc.
    intensity: number;      // 0-1
    triggers?: string[];    // what caused it
  } | null;

  intent: string;           // "seeking_advice", "logging_activity", "venting", "planning", etc.

  entities: {
    goals?: string[];       // "lose 5kg", "run a marathon"
    habits?: string[];      // "morning workouts", "meal prep"
    preferences?: string[]; // "prefers evening sessions", "doesn't like cardio"
    issues?: string[];      // "knee pain", "insomnia", "work stress"
  };

  behavioral_signals: {
    pattern?: string;       // "stress eating on weekdays", "skipping morning routines"
    sentiment_trend?: 'improving' | 'stable' | 'declining';
    commitment_level?: 'high' | 'medium' | 'low';
  } | null;

  memory_candidates: Array<{
    title: string;
    description: string;
    category: IntelligenceCategory;  // fitness, nutrition, sleep, wellbeing, lifestyle, behavioral, cross_domain
    memoryType: MemoryType;          // pattern, preference, context, feedback, relationship, learned_rule
    confidence: number;              // suggested initial confidence 0-1
  }>;

  core_profile_updates: Array<{
    section: CoreSection;   // "biometrics" | "targets" | "constraints" | "preferences" | "medical" | "lifestyle"
    key: string;            // "preferred_workout_time", "dietary_restriction", etc.
    value: unknown;
    unit?: string;          // "kg", "hours", "bpm", etc.
    source: string;         // quote from conversation
  }>;
}
```

### LLM Extraction Prompt

- Model: `gpt-4o-mini` via existing `OpenAI` client (already imported in langgraph-chatbot.service.ts)
- Input: user message + coach response + list of existing memory titles (for dedup context)
- Output: structured JSON matching `TurnInsights` schema
- Temperature: 0 (deterministic extraction)
- Max tokens: 500
- Cost: ~200-400 input tokens + ~150-300 output tokens = ~$0.0001-0.0002 per turn

### Extraction Prompt Template

```
You are an insight extraction engine for a health coaching AI. Given a conversation turn between a user and their AI health coach, extract structured insights.

EXISTING USER MEMORIES (avoid duplicating these):
{existingMemoryTitles}

CONVERSATION TURN:
User: {userMessage}
Coach: {coachResponse}

Extract insights as JSON matching this schema exactly:
{schema}

Rules:
- Only extract insights that are clearly stated or strongly implied
- memory_candidates: only include genuinely new insights not already in EXISTING USER MEMORIES
- core_profile_updates: only include when user explicitly states a preference or fact about themselves
- mood: null if no emotional signal detected
- behavioral_signals: null if no behavioral pattern detected
- If the turn is purely transactional (navigation, quick commands), return empty arrays for memory_candidates and core_profile_updates
```

### Routing Logic

After extraction completes:

#### Memory Candidates

For each candidate in `memory_candidates`:

1. **Dedup check**: Query `intelligence_memories` for existing active/verified memories with similar title in the same category:
   ```sql
   SELECT id, title, confidence FROM intelligence_memories
   WHERE user_id = $1 AND category = $2 AND status IN ('active', 'verified')
   AND (title ILIKE $3 OR description ILIKE $3)
   LIMIT 5
   ```

2. **If match found (same category, similar title)**:
   - **Determine relationship**: Include the matched memory's title + description in the extraction prompt's dedup context. The LLM extraction already returns `memory_candidates` — extend the prompt to also return a `dedup_action` field per candidate: `"reinforce"` (same meaning, new evidence) or `"supersede"` (contradicts existing). This is cheap since it's part of the same extraction call.
   - If `reinforce`: call `memoryEngineService.reinforceMemory()` — adds new evidence, boosts confidence
   - If `supersede`: mark old as `status = 'superseded'`, create new with `superseded_by` link pointing to the new memory via existing `processUserFeedback(memoryId, userId, 'correct', correctionData)`

3. **If no match found**:
   - Store as a **pending signal** in a new `intelligence_pending_signals` table (lightweight — no evidence threshold)
   - When the same signal appears 3+ times across different conversation turns, promote to a full memory via `memoryEngineService.createMemory()` with accumulated evidence
   - This respects the existing `MIN_EVIDENCE_AI = 3` threshold without bypassing it

#### Pending Signals Table

New table `intelligence_pending_signals`:

```sql
CREATE TABLE IF NOT EXISTS intelligence_pending_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence JSONB NOT NULL DEFAULT '[]',
  promoted_memory_id UUID REFERENCES intelligence_memories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_signals_user_category ON intelligence_pending_signals(user_id, category);
CREATE INDEX idx_pending_signals_user_title ON intelligence_pending_signals(user_id, title);
```

When `occurrence_count >= 3` and `promoted_memory_id IS NULL`:
- Create full memory via `memoryEngineService.createMemory()` with all accumulated evidence
- Set `promoted_memory_id` to the new memory ID

#### Core Profile Updates

For each entry in `core_profile_updates`:
- Call `coreProfileKernelService.updateValue(userId, section, key, value, unit)` 
- `section` maps to one of: `biometrics`, `targets`, `constraints`, `preferences`, `medical`, `lifestyle`
- The extraction prompt includes these section names so the LLM categorizes correctly
- This populates the "Core" folder in Intelligence Files

#### Vector Embedding

Queue the full `TurnInsights` JSON as a vector embedding:
- Source type: `insight_extraction`
- Via existing `embeddingQueueService.addJob()` 
- Enables future semantic retrieval of past insights

#### Daily Analysis Report Feed

Append extracted insights to today's daily analysis report:

```sql
INSERT INTO daily_analysis_reports (user_id, report_date, insights)
VALUES ($1, CURRENT_DATE, $2::jsonb)
ON CONFLICT (user_id, report_date)
DO UPDATE SET insights = COALESCE(daily_analysis_reports.insights, '[]'::jsonb) || $2::jsonb,
              updated_at = NOW()
```

This feeds the existing `memory-extraction.job.ts` which runs daily at 5 AM and promotes patterns seen 3+ times in 14 days.

#### Mood/Behavioral Signal Logging

If `mood` is not null, write to `mood_logs`:
```sql
INSERT INTO mood_logs (user_id, mood, intensity, triggers, source, logged_at)
VALUES ($1, $2, $3, $4, 'ai_extracted', NOW())
```

This feeds the existing `life-history-digest.job.ts` and `daily-scoring` job.

## Component 2: Retrieval Layer Enhancement

### Modified File: `server/src/services/comprehensive-user-context.service.ts`

Add a 10th context category: **Intelligence Memory Context**.

### What Gets Retrieved

Before each coach response, fetch from two sources:

**1. Structured memories** (via `memoryEngineService.getMemoriesForContext()`):
- Active/verified memories ranked by existing relevance score formula: `confidence * recency_decay * text_match_boost * access_frequency_boost`
- Limit: top 10 memories
- Formatted via existing `memoryEngineService.formatMemoriesForPrompt()`

**2. Semantic vector search** (via `vectorEmbeddingService`):
- Embed the current user message
- Cosine similarity search against `vector_embeddings` where `source_type = 'insight_extraction'`
- Return top 5 semantically similar past insights
- Catches context that keyword matching would miss

### New Method: `getIntelligenceContext()`

```typescript
async getIntelligenceContext(userId: string, userMessage: string): Promise<IntelligenceContext> {
  const [structuredMemories, semanticInsights] = await Promise.all([
    memoryEngineService.getMemoriesForContext(userId, userMessage, 10),
    vectorEmbeddingService.searchSimilar({
      queryText: userMessage,
      sourceType: 'insight_extraction',
      userId,
      limit: 5,
      minSimilarity: 0.7,
    }),
  ]);

  return { structuredMemories, semanticInsights };
}
```

### Context Formatting

Added to `formatContextForPrompt()` at the top (before WHOOP data), since persistent user intelligence is more important for personalization than today's biometrics:

```
INTELLIGENCE MEMORY:
### Fitness
- [pattern] Morning workout preference: User consistently performs better in AM sessions (ai, 5 data points)
- [preference] Dislikes cardio machines: Prefers outdoor running over treadmill (user-reported, 1 data point)

### Wellbeing
- [pattern] Weekday stress pattern: Shows elevated stress on Mon-Wed, drops Thu-Fri (ai, 4 data points)

RELATED CONTEXT (semantic):
- 3 days ago: User mentioned feeling burnt out from work deadlines
- 1 week ago: Discussed switching to 3-day split instead of 4-day
```

### Caching

Using existing `redisCacheService`:
- Cache key: `user:${userId}:intelligence_context`
- TTL: 5 minutes
- Invalidate on: memory creation, memory feedback (verify/reject), core profile update

### Integration Point

The context service's `gatherContext()` method adds `intelligenceContext` to the `ComprehensiveUserContext` interface. The `formatContextForPrompt()` method at line 2101 renders it as the first section.

## Component 3: LangGraph Integration

### Modified File: `server/src/services/langgraph-chatbot.service.ts`

### Insertion Point

At line ~4684 of the `chat()` method, after `storeMessagePair()` and `enqueueWikiMaintenance()`, before the return statement at line 4700:

```typescript
// [EXISTING] Store messages
this.storeMessagePair({ ... }).catch(...);

// [EXISTING] Wiki maintenance
this.enqueueWikiMaintenance(userId, message, responseContent, activeConversationId);

// [NEW] Extract and persist insights (fire-and-forget, never blocks response)
conversationInsightExtractorService.extractAndPersist({
  userId,
  userMessage: message,
  coachResponse: responseContent,
  conversationId: activeConversationId,
  toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
}).catch((error) => {
  logger.warn('[LangGraphChatbot] Insight extraction failed (non-critical)', {
    error: error instanceof Error ? error.message : 'Unknown',
    userId,
  });
});

// [EXISTING] return { conversationId, response, ... }
```

### Context Injection

In the system prompt assembly section (where `comprehensiveUserContextService.formatContextForPrompt()` is called), the intelligence context is automatically included since we're enhancing the existing context service.

No changes needed in the prompt assembly — the context service handles it.

### Skip Conditions

The extractor skips processing for:
- Off-topic messages (already filtered at line 3366)
- Navigation/modal quick-responses (minimal content)
- Music control commands
- Crisis responses (sensitive — don't analyze)
- Messages shorter than 10 characters

## Component 4: Fixing Broken Upstream Jobs

### Fix 1: Memory Extraction Job — Feed it structured insights

**Problem**: `daily_analysis_reports.insights` column is never populated.
**Fix**: The per-turn extractor writes to this table (see "Daily Analysis Report Feed" in Component 1).

No changes to `memory-extraction.job.ts` — it already queries this table and promotes patterns seen 3+ times in 14 days. We just feed it data.

### Fix 2: Core Profile Calibration — Populate `daily_scores`

**Problem**: `daily_scores` table is empty.
**Fix**: Add a daily score aggregation step to the existing `daily-scoring` job.

**Modified file**: `server/src/jobs/daily-scoring.job.ts`

Add queries to aggregate from:
- `mood_logs` (now populated by the extractor) → `daily_scores.mood_avg`
- `meal_logs` → `daily_scores.total_calories`
- WHOOP data or manual sleep logs → `daily_scores.sleep_hours`

The core profile calibration job at `core-profile-calibration.job.ts` already queries `daily_scores` and needs minimum 3 data points. Once we populate the table, it starts producing results.

### Fix 3: Life History Digest — Conversation fallback

**Problem**: Digest job produces nothing when user hasn't formally logged workouts/meals/mood.
**Fix**: Add conversation insights as a fallback data source.

**Modified file**: `server/src/jobs/life-history-digest.job.ts`

After checking traditional log sources, if no data found for the day:
```typescript
// Fallback: check if user had conversations today
const conversationInsights = await query(
  `SELECT insights FROM daily_analysis_reports
   WHERE user_id = $1 AND report_date = $2 AND insights IS NOT NULL`,
  [userId, yesterday]
);

if (conversationInsights.rows.length > 0) {
  // Generate digest from conversation insights instead
  digestData.conversations = conversationInsights.rows[0].insights;
}
```

## Files Changed Summary

### New Files (2)

| File | Purpose |
|------|---------|
| `server/src/services/conversation-insight-extractor.service.ts` | Core extraction and routing service |
| `server/src/database/migrations/20260513_intelligence_pending_signals.sql` | Pending signals table |

### Modified Files (6)

| File | Change |
|------|--------|
| `server/src/services/langgraph-chatbot.service.ts` | Add fire-and-forget call to extractor after response (line ~4684) |
| `server/src/services/comprehensive-user-context.service.ts` | Add `getIntelligenceContext()` method, add Intelligence Memory section to `formatContextForPrompt()` |
| `server/src/services/memory-engine.service.ts` | Add `findSimilarMemory()` method for dedup matching |
| `server/src/jobs/daily-scoring.job.ts` | Add aggregation from `mood_logs` to populate `daily_scores` |
| `server/src/jobs/life-history-digest.job.ts` | Add conversation insights fallback |
| `server/src/models/index.ts` or shared types | Add `TurnInsights` and `IntelligenceContext` types |

### Unchanged Files (kept working as-is)

| File | Why unchanged |
|------|---------------|
| `server/src/jobs/memory-extraction.job.ts` | Already queries `daily_analysis_reports.insights` — we just feed it data |
| `server/src/jobs/core-profile-calibration.job.ts` | Already queries `daily_scores` — we just populate the table |
| `server/src/services/vector-embedding.service.ts` | Already supports embedding and similarity search |
| `server/src/services/embedding-queue.service.ts` | Already supports queuing embedding jobs |

## Cost Analysis

### Per-Turn Cost (gpt-4o-mini extraction)

| Metric | Value |
|--------|-------|
| Input tokens | ~200-400 (user message + coach response + memory titles) |
| Output tokens | ~150-300 (structured JSON) |
| Cost per turn | ~$0.0001-0.0002 |
| 100 turns/day/user | ~$0.01-0.02/day/user |
| 1000 active users | ~$10-20/day |

### Database Cost

- `intelligence_pending_signals`: Lightweight table, ~1-5 rows per user per day, auto-promoted and cleaned up
- `intelligence_memories`: Same as existing, grows slowly (only promoted signals)
- `vector_embeddings`: One embedding per turn (~1536 dimensions), already managed by existing queue

### Latency Impact

- **Zero** — extraction is fire-and-forget, runs after response is returned to user
- Retrieval adds ~50-100ms to context assembly (parallel DB + vector queries, cached for 5 minutes)

## Error Handling

- Extraction failure: logged as warning, never blocks chat response
- Missing `intelligence_memories` table: existing graceful fallback in `memoryEngineService`
- Missing `intelligence_pending_signals` table: catch and log, skip pending signal logic
- Vector DB unavailable: existing fallback to text-based search in `memoryEngineService.getMemoriesForContext()`
- LLM extraction returns invalid JSON: parse with try/catch, log and skip turn
- Redis cache unavailable: skip cache, query DB directly (existing pattern in context service)

## Observability

- Log each extraction with: userId, turn count, candidates extracted, memories created/reinforced/superseded
- Track in existing daily analysis: extraction success rate, average candidates per turn, memory promotion rate
- Monitor: pending signals table size per user, memory count growth, cache hit rate

## Privacy & User Control

- All memories tied to `user_id` with `ON DELETE CASCADE`
- Existing verify/reject/dismiss/correct actions on memories remain functional
- User can see all extracted memories in Intelligence Files panel
- No cross-user data leakage — all queries filter by `user_id`
- Extraction prompt never sees other users' data
