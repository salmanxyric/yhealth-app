/**
 * Scoring Controller Unit Tests
 *
 * Tests: getDailyScore (with existing score, with calculation fallback),
 *        getScoreHistory
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Mock ai-scoring service
const mockAiScoringService = {
  getDailyScore: jest.fn<any>(),
  calculateDailyScore: jest.fn<any>(),
  saveDailyScore: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: mockAiScoringService,
}));

// 3. Mock leaderboard service
const mockLeaderboardService = {
  getUserRank: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/leaderboard.service.js', () => ({
  leaderboardService: mockLeaderboardService,
}));

// 4. Dynamic imports (AFTER mocks)
const { getDailyScore, getScoreHistory } = await import(
  '../../../src/controllers/scoring.controller.js'
);

const { createAuthReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getDailyScore ───────────────────────────────────────────

describe('getDailyScore', () => {
  const scoreData = {
    userId: 'test-user-id',
    date: '2025-01-15',
    totalScore: 78,
    componentScores: {
      workout: 80,
      nutrition: 75,
      wellbeing: 82,
      biometrics: 70,
      engagement: 85,
      consistency: 76,
    },
  };

  it('should return existing daily score with ranks', async () => {
    mockAiScoringService.getDailyScore.mockResolvedValue(scoreData);
    mockLeaderboardService.getUserRank
      .mockResolvedValueOnce(42)   // global
      .mockResolvedValueOnce(10)   // country
      .mockResolvedValueOnce(3);   // friends

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-01-15' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyScore, req, res, next);

    expect(mockAiScoringService.getDailyScore).toHaveBeenCalledWith(
      'test-user-id',
      '2025-01-15'
    );
    expect(mockAiScoringService.calculateDailyScore).not.toHaveBeenCalled();

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.totalScore).toBe(78);
    expect(body.data.rank).toEqual({
      global: 42,
      country: 10,
      friends: 3,
    });
  });

  it('should calculate and save score when none exists', async () => {
    mockAiScoringService.getDailyScore.mockResolvedValue(null);
    mockAiScoringService.calculateDailyScore.mockResolvedValue(scoreData);
    mockAiScoringService.saveDailyScore.mockResolvedValue(undefined);
    mockLeaderboardService.getUserRank
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(5);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-01-15' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyScore, req, res, next);

    expect(mockAiScoringService.calculateDailyScore).toHaveBeenCalledWith(
      'test-user-id',
      expect.any(Date)
    );
    expect(mockAiScoringService.saveDailyScore).toHaveBeenCalledWith(scoreData);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.totalScore).toBe(78);
    expect(body.data.rank.global).toBe(100);
  });

  it('should use today when no date query param provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockAiScoringService.getDailyScore.mockResolvedValue(scoreData);
    mockLeaderboardService.getUserRank.mockResolvedValue(1);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyScore, req, res, next);

    expect(mockAiScoringService.getDailyScore).toHaveBeenCalledWith(
      'test-user-id',
      today
    );
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyScore, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should propagate service errors via next', async () => {
    mockAiScoringService.getDailyScore.mockRejectedValue(
      new Error('DB connection failed')
    );

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-01-15' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyScore, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('DB connection failed');
  });

  it('should fetch ranks for all three scopes', async () => {
    mockAiScoringService.getDailyScore.mockResolvedValue(scoreData);
    mockLeaderboardService.getUserRank.mockResolvedValue(1);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-01-15' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyScore, req, res, next);

    expect(mockLeaderboardService.getUserRank).toHaveBeenCalledTimes(3);
    expect(mockLeaderboardService.getUserRank).toHaveBeenCalledWith(
      'test-user-id',
      '2025-01-15',
      'global'
    );
    expect(mockLeaderboardService.getUserRank).toHaveBeenCalledWith(
      'test-user-id',
      '2025-01-15',
      'country'
    );
    expect(mockLeaderboardService.getUserRank).toHaveBeenCalledWith(
      'test-user-id',
      '2025-01-15',
      'friends'
    );
  });
});

// ─── getScoreHistory ─────────────────────────────────────────

describe('getScoreHistory', () => {
  it('should return empty scores array (MVP stub)', async () => {
    const req = createAuthReq({ userId: 'test-user-id' });
    const res = createRes();
    const next = createNext();

    await callHandler(getScoreHistory, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ scores: [] });
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(getScoreHistory, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});
