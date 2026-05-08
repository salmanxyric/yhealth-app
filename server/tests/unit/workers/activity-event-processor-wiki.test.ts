/**
 * Activity Event Processor — Wiki Integration Tests
 *
 * Verifies that the activity-event-processor worker calls
 * wikiIngestService.ingestFromDataEvent() for each processed event.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockCalculateDailyScore = jest.fn<any>();
const mockSaveDailyScore = jest.fn<any>();
const mockIngestFromDataEvent = jest.fn<any>();

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: {
    calculateDailyScore: mockCalculateDailyScore,
    saveDailyScore: mockSaveDailyScore,
  },
}));

jest.unstable_mockModule('../../../src/services/wiki-ingest.service.js', () => ({
  wikiIngestService: {
    ingestFromDataEvent: mockIngestFromDataEvent,
  },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/config/queue.config.js', () => ({
  redisConnection: {},
  QueueNames: { ACTIVITY_EVENT_PROCESSING: 'test-activity-processing' },
}));

// Mock BullMQ Worker to capture the processor function
let capturedProcessor: ((job: any) => Promise<void>) | null = null;

jest.unstable_mockModule('bullmq', () => ({
  Worker: class MockWorker {
    constructor(_queueName: string, processor: (job: any) => Promise<void>) {
      capturedProcessor = processor;
    }
    on() { return this; }
    close() { return Promise.resolve(); }
  },
}));

// ============================================
// IMPORT UNDER TEST
// ============================================

const { startActivityEventProcessor } = await import('../../../src/workers/activity-event-processor.worker.js');

// Trigger worker construction so MockWorker captures the processor
startActivityEventProcessor();

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockIngestFromDataEvent.mockResolvedValue({ pagesUpdated: 1 });
  mockCalculateDailyScore.mockResolvedValue({
    userId: 'user-1',
    date: '2026-05-08',
    totalScore: 75,
  });
  mockSaveDailyScore.mockResolvedValue(undefined);
});

describe('Activity Event Processor — Wiki Integration', () => {
  it('should call wikiIngestService.ingestFromDataEvent after scoring', async () => {
    expect(capturedProcessor).not.toBeNull();

    const job = {
      data: {
        eventId: 'evt-100',
        userId: 'user-abc',
        type: 'workout',
        timestamp: '2026-05-08T10:00:00Z',
      },
    };

    await capturedProcessor!(job);

    expect(mockCalculateDailyScore).toHaveBeenCalledTimes(1);
    expect(mockSaveDailyScore).toHaveBeenCalledTimes(1);

    // Give fire-and-forget a tick to execute
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockIngestFromDataEvent).toHaveBeenCalledWith('user-abc', {
      type: 'workout',
      eventId: 'evt-100',
      source: 'activity_event',
      timestamp: '2026-05-08T10:00:00Z',
    });
  });

  it('should not fail the job when wiki ingest throws', async () => {
    mockIngestFromDataEvent.mockRejectedValueOnce(new Error('Wiki DB down'));

    const job = {
      data: {
        eventId: 'evt-101',
        userId: 'user-abc',
        type: 'nutrition',
        timestamp: '2026-05-08T12:00:00Z',
      },
    };

    // Should NOT throw even though wiki ingest fails
    await expect(capturedProcessor!(job)).resolves.not.toThrow();

    expect(mockCalculateDailyScore).toHaveBeenCalledTimes(1);
  });
});
