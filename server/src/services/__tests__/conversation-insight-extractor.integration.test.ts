import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOpenAICreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockOpenAICreate,
        },
      };
    },
  };
});

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
const mockReinforceMemory = vi.fn().mockResolvedValue(undefined);
const mockFindOrCreatePattern = vi.fn().mockResolvedValue({ memory: { id: 'promoted-mem-1' }, wasReinforced: false });
vi.mock('../memory-engine.service.js', () => ({
  memoryEngineService: {
    getMemoriesForContext: mockGetMemoriesForContext,
    findSimilarMemories: mockFindSimilarMemories,
    reinforceMemory: mockReinforceMemory,
    findOrCreatePattern: mockFindOrCreatePattern,
  },
}));

const mockEnqueueEmbedding = vi.fn().mockResolvedValue(undefined);
const mockIsAvailable = vi.fn().mockReturnValue(true);
vi.mock('../embedding-queue.service.js', () => ({
  embeddingQueueService: {
    enqueueEmbedding: mockEnqueueEmbedding,
    isAvailable: mockIsAvailable,
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

function makeLLMResponse(insights: Record<string, unknown>) {
  return {
    choices: [{ message: { content: JSON.stringify(insights) } }],
  };
}

const baseParams = {
  userId: 'user-integration-1',
  userMessage: 'I have been running every morning for the past two weeks and I feel great',
  coachResponse: 'Amazing consistency! Morning runs are a fantastic habit.',
  conversationId: 'conv-integration-1',
};

describe('ConversationInsightExtractor — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
    mockFindSimilarMemories.mockResolvedValue([]);
    mockGetMemoriesForContext.mockResolvedValue([]);
    mockIsAvailable.mockReturnValue(true);
  });

  describe('Full pipeline: extraction → routing', () => {
    it('routes all 5 channels in parallel for a rich conversation turn', async () => {
      const fullInsights = {
        mood: { state: 'energized', intensity: 0.9, triggers: ['morning run'] },
        intent: 'sharing_progress',
        entities: { goals: ['run 5k'], habits: ['morning running'] },
        behavioral_signals: { pattern: 'consistent exercise', sentiment_trend: 'improving', commitment_level: 'high' },
        memory_candidates: [
          {
            title: 'Morning running habit',
            description: 'User runs every morning consistently',
            category: 'fitness',
            memoryType: 'pattern',
            confidence: 0.85,
          },
        ],
        core_profile_updates: [
          {
            section: 'preferences',
            key: 'exercise_time',
            value: 'morning',
            unit: null,
            source: 'User stated they run every morning',
          },
        ],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(fullInsights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      expect(mockOpenAICreate).toHaveBeenCalledOnce();

      // Channel 1: Memory candidates → pending signals INSERT
      expect(mockFindSimilarMemories).toHaveBeenCalledWith('user-integration-1', 'fitness', 'Morning running habit', 5);
      const insertCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO intelligence_pending_signals')
      );
      expect(insertCalls.length).toBe(1);

      // Channel 2: Core profile updates
      expect(mockUpdateValue).toHaveBeenCalledWith(
        'user-integration-1', 'preferences', 'exercise_time', 'morning', null
      );

      // Channel 3: Vector embedding enqueue
      expect(mockEnqueueEmbedding).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-integration-1',
          sourceType: 'insight_extraction',
          operation: 'create',
        })
      );

      // Channel 4: Daily analysis upsert
      const dailyCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('daily_analysis_reports')
      );
      expect(dailyCalls.length).toBe(1);

      // Channel 5: Mood log insert with mode='deep' and happiness_rating
      const moodCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO mood_logs')
      );
      expect(moodCalls.length).toBe(1);
      const moodSQL = moodCalls[0][0] as string;
      expect(moodSQL).toContain('happiness_rating');
      expect(moodSQL).toContain("'deep'");
      expect(moodSQL).not.toContain("'light'");
    });
  });

  describe('Pending signal accumulation and promotion', () => {
    it('creates a new pending signal on first occurrence', async () => {
      const insights = {
        mood: null,
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Prefers yoga', description: 'User mentioned preferring yoga', category: 'fitness', memoryType: 'preference', confidence: 0.7 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));
      mockFindSimilarMemories.mockResolvedValueOnce([]);
      // No existing pending signal
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // INSERT returns
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const insertCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO intelligence_pending_signals')
      );
      expect(insertCalls.length).toBe(1);
      const insertParams = insertCalls[0][1] as unknown[];
      expect(insertParams[0]).toBe('user-integration-1');
      expect(insertParams[1]).toBe('Prefers yoga');
      expect(insertParams[3]).toBe('fitness');
      expect(insertParams[4]).toBe('preference');
    });

    it('increments occurrence_count when a similar pending signal exists (count < 3)', async () => {
      const insights = {
        mood: null,
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Prefers yoga', description: 'User likes yoga', category: 'fitness', memoryType: 'preference', confidence: 0.7 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));
      mockFindSimilarMemories.mockResolvedValueOnce([]);
      // Route queries based on SQL content (parallel routes race for mockQuery)
      mockQuery.mockImplementation((sql: string) => {
        if (typeof sql === 'string' && sql.includes('SELECT') && sql.includes('intelligence_pending_signals')) {
          return Promise.resolve({
            rows: [{
              id: 'signal-existing',
              occurrence_count: 1,
              evidence: [{ source_table: 'rag_conversations', source_id: 'prev', date: '2026-05-12', summary: 'prev' }],
              promoted_memory_id: null,
            }],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const updateCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('UPDATE intelligence_pending_signals')
      );
      expect(updateCalls.length).toBe(1);
      const updateParams = updateCalls[0][1] as unknown[];
      expect(updateParams[0]).toBe('signal-existing');
      expect(updateParams[1]).toBe(2); // 1 + 1
      // No promotion at count=2
      expect(mockFindOrCreatePattern).not.toHaveBeenCalled();
    });

    it('promotes pending signal to memory when occurrence_count reaches threshold (3)', async () => {
      const insights = {
        mood: null,
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Prefers yoga', description: 'User likes yoga', category: 'fitness', memoryType: 'preference', confidence: 0.7 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));
      mockFindSimilarMemories.mockResolvedValueOnce([]);
      // Route queries based on SQL content (parallel routes race for mockQuery)
      mockQuery.mockImplementation((sql: string) => {
        if (typeof sql === 'string' && sql.includes('SELECT') && sql.includes('intelligence_pending_signals')) {
          return Promise.resolve({
            rows: [{
              id: 'signal-to-promote',
              occurrence_count: 2,
              evidence: [
                { source_table: 'rag_conversations', source_id: 'c1', date: '2026-05-11', summary: 'first' },
                { source_table: 'rag_conversations', source_id: 'c2', date: '2026-05-12', summary: 'second' },
              ],
              promoted_memory_id: null,
            }],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      // Should have promoted
      expect(mockFindOrCreatePattern).toHaveBeenCalledWith(
        'user-integration-1',
        'fitness',
        'Prefers yoga',
        'User likes yoga',
        expect.arrayContaining([
          expect.objectContaining({ source_id: 'c1' }),
          expect.objectContaining({ source_id: 'c2' }),
        ]),
        'ai'
      );

      // Should update promoted_memory_id
      const promoteUpdateCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('promoted_memory_id = $1')
      );
      expect(promoteUpdateCalls.length).toBe(1);
      expect((promoteUpdateCalls[0][1] as unknown[])[0]).toBe('promoted-mem-1');
      expect((promoteUpdateCalls[0][1] as unknown[])[1]).toBe('signal-to-promote');
    });
  });

  describe('Memory reinforcement path', () => {
    it('reinforces existing memory instead of creating pending signal when similar memory exists', async () => {
      const insights = {
        mood: null,
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Morning runner', description: 'User runs in mornings', category: 'fitness', memoryType: 'pattern', confidence: 0.8 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));
      // Existing similar memory found
      mockFindSimilarMemories.mockResolvedValueOnce([
        { id: 'existing-mem-42', title: 'Morning running preference', confidence: 0.85 },
      ]);

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      // Should reinforce, NOT create pending signal
      expect(mockReinforceMemory).toHaveBeenCalledWith(
        'existing-mem-42',
        'user-integration-1',
        [expect.objectContaining({ source_table: 'rag_conversations', source_id: 'conv-integration-1' })],
      );

      // No pending signal INSERT
      const insertCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO intelligence_pending_signals')
      );
      expect(insertCalls.length).toBe(0);
    });
  });

  describe('Mood log routing', () => {
    it('inserts mood log with mode=deep and happiness_rating from intensity', async () => {
      const insights = {
        mood: { state: 'anxious', intensity: 0.4, triggers: ['deadline'] },
        intent: 'venting',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const moodCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO mood_logs')
      );
      expect(moodCalls.length).toBe(1);
      const params = moodCalls[0][1] as unknown[];
      expect(params[0]).toBe('user-integration-1');
      expect(params[1]).toBe(4); // Math.round(0.4 * 10)
      expect(params[2]).toBe(4); // happiness_rating = clampedRating
      expect(params[3]).toBe('AI-extracted: anxious');
    });

    it('clamps mood rating to 1-10 range for edge values', async () => {
      const insights = {
        mood: { state: 'neutral', intensity: 0.0, triggers: [] },
        intent: 'neutral',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const moodCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO mood_logs')
      );
      expect(moodCalls.length).toBe(1);
      const params = moodCalls[0][1] as unknown[];
      // intensity 0.0 → round(0) = 0 → clamped to 1
      expect(params[1]).toBe(1);
      expect(params[2]).toBe(1);
    });

    it('skips mood logging when mood is null', async () => {
      const insights = {
        mood: null,
        intent: 'asking',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const moodCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO mood_logs')
      );
      expect(moodCalls.length).toBe(0);
    });
  });

  describe('Daily analysis routing', () => {
    it('upserts claims into daily_analysis_reports', async () => {
      const insights = {
        mood: null,
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Sleeps 7 hours', description: 'User reports 7h sleep', category: 'sleep', memoryType: 'context', confidence: 0.9 },
          { title: 'Takes melatonin', description: 'Uses melatonin supplement', category: 'sleep', memoryType: 'preference', confidence: 0.8 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const dailyCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('daily_analysis_reports')
      );
      expect(dailyCalls.length).toBe(1);
      const claimsJson = JSON.parse(dailyCalls[0][1][1] as string);
      expect(claimsJson).toHaveLength(2);
      expect(claimsJson[0]).toEqual({ claim: 'Sleeps 7 hours', category: 'sleep', evidence: 'User reports 7h sleep' });
      expect(claimsJson[1]).toEqual({ claim: 'Takes melatonin', category: 'sleep', evidence: 'Uses melatonin supplement' });
    });

    it('skips daily analysis when no memory candidates', async () => {
      const insights = {
        mood: { state: 'calm', intensity: 0.5, triggers: [] },
        intent: 'chatting',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const dailyCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('daily_analysis_reports')
      );
      expect(dailyCalls.length).toBe(0);
    });
  });

  describe('Vector embedding routing', () => {
    it('enqueues embedding when content is substantial', async () => {
      const insights = {
        mood: { state: 'happy', intensity: 0.8, triggers: [] },
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Yoga enthusiast', description: 'User does yoga regularly', category: 'fitness', memoryType: 'pattern', confidence: 0.9 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      expect(mockEnqueueEmbedding).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-integration-1',
          sourceType: 'insight_extraction',
          operation: 'create',
        })
      );
    });

    it('skips embedding when embedding service is unavailable', async () => {
      mockIsAvailable.mockReturnValue(false);

      const insights = {
        mood: { state: 'happy', intensity: 0.8, triggers: [] },
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Runs daily', description: 'User runs every day', category: 'fitness', memoryType: 'pattern', confidence: 0.9 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      expect(mockEnqueueEmbedding).not.toHaveBeenCalled();
    });
  });

  describe('Error resilience', () => {
    it('continues routing other channels when one channel fails', async () => {
      const insights = {
        mood: { state: 'happy', intensity: 0.7, triggers: [] },
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: 'Likes swimming', description: 'User swims weekly', category: 'fitness', memoryType: 'preference', confidence: 0.8 },
        ],
        core_profile_updates: [
          { section: 'preferences', key: 'sport', value: 'swimming', unit: null, source: 'stated' },
        ],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));
      // Memory candidate routing fails
      mockFindSimilarMemories.mockRejectedValueOnce(new Error('DB connection lost'));
      // Core profile update succeeds
      mockUpdateValue.mockResolvedValueOnce({});

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      // Core profile should still have been called despite memory routing failure
      expect(mockUpdateValue).toHaveBeenCalledWith(
        'user-integration-1', 'preferences', 'sport', 'swimming', null
      );

      // Mood log should still have been inserted
      const moodCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT INTO mood_logs')
      );
      expect(moodCalls.length).toBe(1);
    });

    it('handles OpenAI API error without throwing', async () => {
      mockOpenAICreate.mockRejectedValueOnce(new Error('OpenAI rate limit'));

      await expect(
        conversationInsightExtractorService.extractAndPersist(baseParams)
      ).resolves.toBeUndefined();

      // No routing should happen
      expect(mockFindSimilarMemories).not.toHaveBeenCalled();
      expect(mockUpdateValue).not.toHaveBeenCalled();
    });

    it('handles empty OpenAI response gracefully', async () => {
      mockOpenAICreate.mockResolvedValueOnce({
        choices: [{ message: { content: '' } }],
      });

      await expect(
        conversationInsightExtractorService.extractAndPersist(baseParams)
      ).resolves.toBeUndefined();

      expect(mockFindSimilarMemories).not.toHaveBeenCalled();
    });
  });

  describe('Existing memory dedup context', () => {
    it('passes existing memory titles to LLM prompt for deduplication', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([
        { title: 'Morning person' },
        { title: 'Runs 3x per week' },
      ]);

      const insights = {
        mood: null,
        intent: 'chatting',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
      };
      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const promptCall = mockOpenAICreate.mock.calls[0][0];
      const userContent = promptCall.messages[1].content as string;
      expect(userContent).toContain('- Morning person');
      expect(userContent).toContain('- Runs 3x per week');
    });

    it('shows (none) when no existing memories', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([]);

      const insights = {
        mood: null,
        intent: 'chatting',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
      };
      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const promptCall = mockOpenAICreate.mock.calls[0][0];
      const userContent = promptCall.messages[1].content as string;
      expect(userContent).toContain('(none)');
    });
  });

  describe('LIKE injection safety', () => {
    it('escapes SQL LIKE metacharacters in pending signal title matching', async () => {
      const insights = {
        mood: null,
        intent: 'sharing',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [
          { title: '100% effort_daily', description: 'test', category: 'fitness', memoryType: 'context', confidence: 0.5 },
        ],
        core_profile_updates: [],
      };

      mockOpenAICreate.mockResolvedValueOnce(makeLLMResponse(insights));
      mockFindSimilarMemories.mockResolvedValueOnce([]);
      // SELECT for existing pending signal
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // INSERT
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await conversationInsightExtractorService.extractAndPersist(baseParams);

      const selectCalls = mockQuery.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('intelligence_pending_signals') && (c[0] as string).includes('SELECT')
      );
      expect(selectCalls.length).toBe(1);
      const params = selectCalls[0][1] as string[];
      // The % and _ in the title should be escaped
      expect(params[2]).toContain('100\\%');
      expect(params[2]).toContain('effort\\_daily');
    });
  });
});
