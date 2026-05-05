/**
 * Daily Scoring Job Unit Tests
 *
 * Tests for processDailyScoring — timezone-aware hourly job that
 * calculates daily scores for users whose local midnight just passed.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupRedisCacheMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS — must precede dynamic imports
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();
setupRedisCacheMock();

const mockGetDailyScore = jest.fn<any>().mockResolvedValue(null);
const mockCalculateDailyScore = jest.fn<any>().mockResolvedValue({
  userId: 'u1',
  date: '2026-04-23',
  totalScore: 75,
  componentScores: {},
});
const mockSaveDailyScore = jest.fn<any>().mockResolvedValue(undefined);
const mockHasScoresForDate = jest.fn<any>().mockResolvedValue(false);
const mockComputeScoresForAllUsers = jest.fn<any>().mockResolvedValue(0);

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: {
    getDailyScore: mockGetDailyScore,
    calculateDailyScore: mockCalculateDailyScore,
    saveDailyScore: mockSaveDailyScore,
    hasScoresForDate: mockHasScoresForDate,
    computeScoresForAllUsers: mockComputeScoresForAllUsers,
  },
}));

const mockUpdateRanks = jest.fn<any>().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../src/services/leaderboard.service.js', () => ({
  leaderboardService: {
    updateRanks: mockUpdateRanks,
    materializeLeaderboard: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

// Dynamic imports AFTER mocks
const { dailyScoringJob } = await import('../../../src/jobs/daily-scoring.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults that clearAllMocks wipes
  mockGetDailyScore.mockResolvedValue(null);
  mockCalculateDailyScore.mockResolvedValue({
    userId: 'u1',
    date: '2026-04-23',
    totalScore: 75,
    componentScores: {},
  });
  mockSaveDailyScore.mockResolvedValue(undefined);
  mockUpdateRanks.mockResolvedValue(undefined);
});

describe('dailyScoringJob.processNow', () => {
  it('processes users whose local midnight just passed', async () => {
    // Query 1: find users at midnight
    mockQuery.mockResolvedValueOnce(
      pgResult([{ id: 'u1', timezone: 'America/New_York' }]),
    );
    // Query 2: compute local date
    mockQuery.mockResolvedValueOnce(
      pgResult([{ local_date: '2026-04-23' }]),
    );
    // Query 3: local date for rank update loop
    mockQuery.mockResolvedValueOnce(
      pgResult([{ local_date: '2026-04-23' }]),
    );

    await dailyScoringJob.processNow();

    expect(mockQuery).toHaveBeenCalled();
    expect(mockCalculateDailyScore).toHaveBeenCalledWith('u1', expect.any(Date));
    expect(mockSaveDailyScore).toHaveBeenCalled();
    expect(mockUpdateRanks).toHaveBeenCalledWith('2026-04-23');
  });

  it('skips user when score already exists', async () => {
    mockQuery.mockResolvedValueOnce(
      pgResult([{ id: 'u1', timezone: 'Europe/London' }]),
    );
    mockQuery.mockResolvedValueOnce(
      pgResult([{ local_date: '2026-04-23' }]),
    );
    // Existing score found
    mockGetDailyScore.mockResolvedValueOnce({ totalScore: 80 });

    await dailyScoringJob.processNow();

    expect(mockCalculateDailyScore).not.toHaveBeenCalled();
    expect(mockSaveDailyScore).not.toHaveBeenCalled();
  });

  it('does nothing when no users are at midnight', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await dailyScoringJob.processNow();

    expect(mockCalculateDailyScore).not.toHaveBeenCalled();
    expect(mockUpdateRanks).not.toHaveBeenCalled();
  });

  it('continues processing remaining users after one fails', async () => {
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { id: 'u1', timezone: 'UTC' },
        { id: 'u2', timezone: 'UTC' },
      ]),
    );
    // u1 local date
    mockQuery.mockResolvedValueOnce(pgResult([{ local_date: '2026-04-23' }]));
    // u1 calculate fails
    mockCalculateDailyScore.mockRejectedValueOnce(new Error('AI service down'));
    // u2 local date
    mockQuery.mockResolvedValueOnce(pgResult([{ local_date: '2026-04-23' }]));
    // u2 succeeds
    mockCalculateDailyScore.mockResolvedValueOnce({ userId: 'u2', totalScore: 60 });
    // rank update date queries
    mockQuery.mockResolvedValueOnce(pgResult([{ local_date: '2026-04-23' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ local_date: '2026-04-23' }]));

    await dailyScoringJob.processNow();

    // Second user should still be processed
    expect(mockCalculateDailyScore).toHaveBeenCalledTimes(2);
    expect(mockSaveDailyScore).toHaveBeenCalledTimes(1);
  });

  it('handles fatal DB error gracefully', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

    await expect(dailyScoringJob.processNow()).resolves.toBeUndefined();
  });

  it('skips user when local date query returns empty', async () => {
    mockQuery.mockResolvedValueOnce(
      pgResult([{ id: 'u1', timezone: 'Etc/Unknown' }]),
    );
    // Local date query returns empty
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await dailyScoringJob.processNow();

    expect(mockCalculateDailyScore).not.toHaveBeenCalled();
  });
});
