/**
 * @file Competition Auto-Create Job Tests
 * Tests for dual-track (daily + challenge) competition creation.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupModelFactoryMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();
const mockModelFactory = setupModelFactoryMock();

const mockCompetitionService = {
  createCompetition: jest.fn<any>().mockResolvedValue({ id: 'comp-1', name: 'Test Competition' }),
};
jest.unstable_mockModule('../../../src/services/competition.service.js', () => ({
  competitionService: mockCompetitionService,
  // Type export — not needed at runtime but prevents import errors
}));

const mockSmartCompetitionService = {
  getRecentTemplateNames: jest.fn<any>().mockResolvedValue([]),
  selectBestTemplateIndex: jest.fn<any>().mockResolvedValue({ index: 0, reason: 'test' }),
  getGoalDistribution: jest.fn<any>().mockResolvedValue([]),
};
jest.unstable_mockModule('../../../src/services/smart-competition.service.js', () => ({
  smartCompetitionService: mockSmartCompetitionService,
}));

const mockLlmCircuitBreaker = {
  isCallAllowed: jest.fn<any>().mockReturnValue(true),
  recordSuccess: jest.fn(),
  recordRateLimitError: jest.fn(),
  getStatus: jest.fn().mockReturnValue({ cooldownRemaining: 0, consecutiveFailures: 0 }),
};
jest.unstable_mockModule('../../../src/services/llm-circuit-breaker.service.js', () => ({
  llmCircuitBreaker: mockLlmCircuitBreaker,
}));

const mockNotificationEngine = {
  send: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/notification-engine.service.js', () => ({
  notificationEngine: mockNotificationEngine,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { competitionAutoCreateJob, stopCompetitionAutoCreate: _stopCompetitionAutoCreate } = await import(
  '../../../src/jobs/competition-auto-create.job.js'
);
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockCompetitionService.createCompetition.mockResolvedValue({ id: 'comp-1', name: 'Test Competition' });
  mockSmartCompetitionService.getRecentTemplateNames.mockResolvedValue([]);
  mockSmartCompetitionService.selectBestTemplateIndex.mockResolvedValue({ index: 0, reason: 'test' });
  mockSmartCompetitionService.getGoalDistribution.mockResolvedValue([]);
  mockLlmCircuitBreaker.isCallAllowed.mockReturnValue(true);
  mockLlmCircuitBreaker.getStatus.mockReturnValue({ cooldownRemaining: 0, consecutiveFailures: 0 });
  mockNotificationEngine.send.mockResolvedValue(undefined);
  mockModelFactory.getModel.mockReturnValue({
    invoke: jest.fn<any>().mockResolvedValue({ content: 'mock response' }),
  });
});

describe('CompetitionAutoCreateJob', () => {
  describe('processNow', () => {
    it('should create a daily competition when none is running', async () => {
      // Daily track: no active daily competition
      mockQuery
        .mockResolvedValueOnce(pgEmpty())        // daily track query
        .mockResolvedValueOnce(pgEmpty())        // challenge track query
        .mockResolvedValueOnce(pgResult([{ count: '1' }])); // targeted track existing check

      await competitionAutoCreateJob.processNow();

      expect(mockCompetitionService.createCompetition).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ai_generated',
          status: 'active',
        }),
      );
    });

    it('should skip daily creation when an active daily competition exists', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // Daily track: active competition still running
      mockQuery
        .mockResolvedValueOnce(
          pgResult([{ id: 'comp-existing', name: 'Active Daily', status: 'active', end_date: futureDate }]),
        )
        .mockResolvedValueOnce(pgEmpty())        // challenge track
        .mockResolvedValueOnce(pgResult([{ count: '1' }])); // targeted

      await competitionAutoCreateJob.processNow();

      // Should not have created a new daily (challenge track may create one)
      // The first createCompetition call would be for challenge track
      const dailyCalls = mockCompetitionService.createCompetition.mock.calls.filter(
        (c: any[]) => c[0]?.prizeMetadata?.track === 'daily',
      );
      expect(dailyCalls).toHaveLength(0);
    });

    it('should mark expired competition as ended before creating new one', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      // Daily track: expired competition
      mockQuery
        .mockResolvedValueOnce(
          pgResult([{ id: 'comp-old', name: 'Old Daily', status: 'active', end_date: pastDate }]),
        )
        .mockResolvedValueOnce(undefined as any) // UPDATE query
        .mockResolvedValueOnce(pgEmpty())         // challenge track
        .mockResolvedValueOnce(pgResult([{ count: '1' }])); // targeted

      await competitionAutoCreateJob.processNow();

      // Should have updated the expired competition's status
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE competitions SET status'),
        ['comp-old'],
      );
    });

    it('should create a challenge competition when none is running', async () => {
      // Daily track: active competition still running
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockQuery
        .mockResolvedValueOnce(
          pgResult([{ id: 'daily-ok', name: 'Active Daily', status: 'active', end_date: futureDate }]),
        )
        .mockResolvedValueOnce(pgEmpty())         // challenge track: no active
        .mockResolvedValueOnce(pgResult([{ count: '1' }])); // targeted

      await competitionAutoCreateJob.processNow();

      // Should have created a challenge competition
      expect(mockCompetitionService.createCompetition).toHaveBeenCalled();
    });

    it('should handle fatal errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database down'));

      await expect(competitionAutoCreateJob.processNow()).resolves.toBeUndefined();
    });

    it('should not open the LLM circuit when targeted competition JSON is malformed', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockQuery
        .mockResolvedValueOnce(
          pgResult([{ id: 'daily-ok', name: 'Active Daily', status: 'active', end_date: futureDate }]),
        )
        .mockResolvedValueOnce(
          pgResult([{ id: 'challenge-ok', name: 'Active Challenge', status: 'active', end_date: futureDate }]),
        )
        .mockResolvedValueOnce(pgResult([{ count: '0' }])) // no active targeted competition
        .mockResolvedValueOnce(pgResult([
          { user_id: '11111111-1111-1111-1111-111111111111', category: 'strength', title: 'Lift' },
          { user_id: '22222222-2222-2222-2222-222222222222', category: 'strength', title: 'Lift' },
          { user_id: '33333333-3333-3333-3333-333333333333', category: 'strength', title: 'Lift' },
          { user_id: '44444444-4444-4444-4444-444444444444', category: 'strength', title: 'Lift' },
          { user_id: '55555555-5555-5555-5555-555555555555', category: 'strength', title: 'Lift' },
        ]));
      mockSmartCompetitionService.getGoalDistribution.mockResolvedValueOnce([
        { pillar: 'fitness', count: 5, percentage: 100 },
      ]);
      mockModelFactory.getModel.mockReturnValueOnce({
        invoke: jest.fn<any>().mockResolvedValue({ content: 'not json' }),
      });

      await competitionAutoCreateJob.processNow();

      expect(mockLlmCircuitBreaker.recordRateLimitError).not.toHaveBeenCalled();
      expect(mockLlmCircuitBreaker.recordSuccess).not.toHaveBeenCalled();
    });
  });

  describe('lifecycle', () => {
    afterEach(() => competitionAutoCreateJob.stop());

    it('should start and stop without throwing', () => {
      expect(() => competitionAutoCreateJob.start()).not.toThrow();
      expect(() => competitionAutoCreateJob.stop()).not.toThrow();
    });

    it('should report isRunning state', () => {
      expect(competitionAutoCreateJob.isRunning()).toBe(false);
      competitionAutoCreateJob.start();
      expect(competitionAutoCreateJob.isRunning()).toBe(true);
      competitionAutoCreateJob.stop();
      expect(competitionAutoCreateJob.isRunning()).toBe(false);
    });
  });
});
