import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock all dependencies ---

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
