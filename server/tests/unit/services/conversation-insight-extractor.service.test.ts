import { jest } from '@jest/globals';

// --- Register all mocks BEFORE dynamic imports ---

const mockOpenAICreate = jest.fn();
jest.unstable_mockModule('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: mockOpenAICreate,
      },
    };
  },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    openai: { apiKey: 'test-key', model: 'gpt-5.4-mini' },
  },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockGetMemoriesForContext = jest.fn();
const mockFindSimilarMemories = jest.fn();
const mockFindOrCreatePattern = jest.fn();
jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: {
    getMemoriesForContext: mockGetMemoriesForContext,
    findSimilarMemories: mockFindSimilarMemories,
    findOrCreatePattern: mockFindOrCreatePattern,
  },
}));

const mockEnqueueEmbedding = jest.fn();
jest.unstable_mockModule('../../../src/services/embedding-queue.service.js', () => ({
  embeddingQueueService: {
    enqueueEmbedding: mockEnqueueEmbedding,
    isAvailable: jest.fn().mockReturnValue(true),
  },
}));

const mockUpdateValue = jest.fn();
jest.unstable_mockModule('../../../src/services/core-profile-kernel.service.js', () => ({
  coreProfileKernelService: {
    updateValue: mockUpdateValue,
  },
}));

// --- Dynamic imports AFTER mocks are registered ---
const { conversationInsightExtractorService } = await import('../../../src/services/conversation-insight-extractor.service.js');

describe('conversationInsightExtractorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
    mockGetMemoriesForContext.mockResolvedValue([]);
    mockFindSimilarMemories.mockResolvedValue([]);
    mockFindOrCreatePattern.mockResolvedValue({ memory: { id: 'mem-1' }, wasReinforced: false });
    mockEnqueueEmbedding.mockResolvedValue(undefined);
    mockUpdateValue.mockResolvedValue({});
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
    mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT conversation_claims

    await conversationInsightExtractorService.extractAndPersist({
      userId: 'user-1',
      userMessage: 'I want to train for a 5k run',
      coachResponse: 'Great goal! Let me help you plan.',
      conversationId: 'conv-1',
    });

    // Should have called OpenAI for extraction
    expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    expect(mockOpenAICreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4-mini',
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
