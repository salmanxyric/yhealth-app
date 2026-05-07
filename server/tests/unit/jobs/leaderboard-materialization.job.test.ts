/**
 * Leaderboard Materialization Job Unit Tests
 *
 * Tests for materializeLeaderboards — precomputes leaderboard snapshots
 * for global + competition scopes and emits socket events for rank updates.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupRedisCacheMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();
setupRedisCacheMock();

const mockMaterializeLeaderboard = jest.fn<any>().mockResolvedValue(undefined);
const mockUpdateRanks = jest.fn<any>().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../src/services/leaderboard.service.js', () => ({
  leaderboardService: {
    materializeLeaderboard: mockMaterializeLeaderboard,
    updateRanks: mockUpdateRanks,
  },
}));

const mockGetActiveCompetitions = jest.fn<any>().mockResolvedValue({ competitions: [] });
const mockUpdateCompetitionScores = jest.fn<any>().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../src/services/competition.service.js', () => ({
  competitionService: {
    getActiveCompetitions: mockGetActiveCompetitions,
    updateCompetitionScores: mockUpdateCompetitionScores,
  },
}));

const mockHasScoresForDate = jest.fn<any>().mockResolvedValue(true);
const mockComputeScoresForAllUsers = jest.fn<any>().mockResolvedValue(0);

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: {
    hasScoresForDate: mockHasScoresForDate,
    computeScoresForAllUsers: mockComputeScoresForAllUsers,
  },
}));

const mockEmitToUser = jest.fn();

jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
  socketService: {
    emitToUser: mockEmitToUser,
  },
}));

// Dynamic imports AFTER mocks
const { leaderboardMaterializationJob } = await import(
  '../../../src/jobs/leaderboard-materialization.job.js'
);
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockHasScoresForDate.mockResolvedValue(true);
  mockGetActiveCompetitions.mockResolvedValue({ competitions: [] });
  mockMaterializeLeaderboard.mockResolvedValue(undefined);
  mockUpdateRanks.mockResolvedValue(undefined);
  mockUpdateCompetitionScores.mockResolvedValue(undefined);
});

describe('leaderboardMaterializationJob.processNow', () => {
  it('materializes global leaderboards for today and yesterday', async () => {
    await leaderboardMaterializationJob.processNow();

    // Called for today + yesterday = 2 dates
    expect(mockMaterializeLeaderboard).toHaveBeenCalledTimes(2);
    expect(mockUpdateRanks).toHaveBeenCalledTimes(2);

    // Both calls should be for 'global' scope
    for (const call of mockMaterializeLeaderboard.mock.calls) {
      expect(call[0]).toBe('global');
    }
  });

  it('lazy-computes scores when none exist for a date', async () => {
    mockHasScoresForDate.mockResolvedValue(false);

    await leaderboardMaterializationJob.processNow();

    expect(mockComputeScoresForAllUsers).toHaveBeenCalledTimes(2);
  });

  it('materializes competition leaderboards and emits rank updates', async () => {
    const competitionId = 'comp-1';
    mockGetActiveCompetitions.mockResolvedValue({
      competitions: [{ id: competitionId, name: 'Spring Challenge' }],
    });
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '2' }]));
    // competition_entries query
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { user_id: 'u1', current_rank: 1, current_score: 95 },
        { user_id: 'u2', current_rank: 2, current_score: 80 },
      ]),
    );

    await leaderboardMaterializationJob.processNow();

    expect(mockUpdateCompetitionScores).toHaveBeenCalledWith(competitionId);
    expect(mockMaterializeLeaderboard).toHaveBeenCalledWith(
      'competition',
      expect.any(String),
      100,
      competitionId,
    );
    expect(mockEmitToUser).toHaveBeenCalledTimes(2);
    expect(mockEmitToUser).toHaveBeenCalledWith('u1', 'competition:rank-update', expect.objectContaining({
      competition_id: competitionId,
      rank: 1,
    }));
  });

  it('handles competition service failure gracefully', async () => {
    mockGetActiveCompetitions.mockRejectedValue(new Error('DB timeout'));

    await expect(leaderboardMaterializationJob.processNow()).resolves.toBeUndefined();
  });

  it('handles individual competition materialization failure without stopping others', async () => {
    mockGetActiveCompetitions.mockResolvedValue({
      competitions: [
        { id: 'comp-1', name: 'A' },
        { id: 'comp-2', name: 'B' },
      ],
    });
    mockQuery
      .mockResolvedValueOnce(pgResult([{ count: '1' }]))
      .mockResolvedValueOnce(pgResult([{ count: '1' }]));
    // comp-1 fails on updateCompetitionScores
    mockUpdateCompetitionScores.mockRejectedValueOnce(new Error('comp-1 error'));
    // comp-2 succeeds
    mockUpdateCompetitionScores.mockResolvedValueOnce(undefined);
    // comp-2 participants query
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await leaderboardMaterializationJob.processNow();

    // comp-2 should still be processed
    expect(mockUpdateCompetitionScores).toHaveBeenCalledTimes(2);
  });

  it('skips competition materialization when there are no active entrants', async () => {
    mockGetActiveCompetitions.mockResolvedValue({
      competitions: [{ id: 'comp-empty', name: 'Empty' }],
    });
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));

    await leaderboardMaterializationJob.processNow();

    expect(mockUpdateCompetitionScores).not.toHaveBeenCalled();
    expect(mockMaterializeLeaderboard).not.toHaveBeenCalledWith(
      'competition',
      expect.any(String),
      100,
      'comp-empty',
    );
  });

  it('handles global leaderboard failure for one date without stopping the other', async () => {
    // First date fails during materialize
    mockMaterializeLeaderboard.mockRejectedValueOnce(new Error('Redis down'));
    // Second date succeeds
    mockMaterializeLeaderboard.mockResolvedValueOnce(undefined);

    await expect(leaderboardMaterializationJob.processNow()).resolves.toBeUndefined();

    // Both dates attempted
    expect(mockMaterializeLeaderboard).toHaveBeenCalledTimes(2);
  });
});
