/**
 * Leaderboard Controller Unit Tests
 *
 * Tests: getDailyLeaderboard, getAroundMeLeaderboard, getUserRank
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Mock leaderboard service
const mockLeaderboardService = {
  getLeaderboard: jest.fn<any>(),
  getAroundMe: jest.fn<any>(),
  getUserRank: jest.fn<any>(),
  materializeLeaderboard: jest.fn<any>(),
  updateRanks: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/leaderboard.service.js', () => ({
  leaderboardService: mockLeaderboardService,
}));

// 3. Mock ai-scoring service
const mockAiScoringService = {
  hasScoresForDate: jest.fn<any>(),
  computeScoresForAllUsers: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: mockAiScoringService,
}));

// 4. Dynamic imports (AFTER mocks)
const { getDailyLeaderboard, getAroundMeLeaderboard, getUserRank } = await import(
  '../../../src/controllers/leaderboard.controller.js'
);

const { createAuthReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
  // Default: scores already exist so ensureScoresExist does not compute
  mockAiScoringService.hasScoresForDate.mockResolvedValue(true);
  mockLeaderboardService.materializeLeaderboard.mockResolvedValue(undefined);
  mockLeaderboardService.updateRanks.mockResolvedValue(undefined);
});

// ─── getDailyLeaderboard ────────────────────────────────────

describe('getDailyLeaderboard', () => {
  const leaderboardData = {
    entries: [
      { userId: 'u-1', displayName: 'Alice', score: 95, rank: 1 },
      { userId: 'u-2', displayName: 'Bob', score: 88, rank: 2 },
    ],
    total: 2,
  };

  it('should return leaderboard with default params', async () => {
    mockLeaderboardService.getLeaderboard.mockResolvedValue(leaderboardData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyLeaderboard, req, res, next);

    expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledWith(
      'global',
      '2025-06-01',
      { segment: undefined, limit: undefined, offset: undefined }
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(leaderboardData);
    expect(body.message).toBe('Leaderboard retrieved successfully');
  });

  it('should pass type, segment, limit and offset to the service', async () => {
    mockLeaderboardService.getLeaderboard.mockResolvedValue(leaderboardData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01', type: 'country', segment: 'KE', limit: '10', offset: '20' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyLeaderboard, req, res, next);

    expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledWith(
      'country',
      '2025-06-01',
      { segment: 'KE', limit: 10, offset: 20 }
    );
  });

  it('should default to today when no date provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockLeaderboardService.getLeaderboard.mockResolvedValue(leaderboardData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyLeaderboard, req, res, next);

    expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalledWith(
      'global',
      today,
      expect.any(Object)
    );
  });

  it('should compute scores when none exist for the date', async () => {
    // First call: no scores. Second call (after compute): scores exist
    mockAiScoringService.hasScoresForDate
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    mockAiScoringService.computeScoresForAllUsers.mockResolvedValue(5);
    mockLeaderboardService.getLeaderboard.mockResolvedValue(leaderboardData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyLeaderboard, req, res, next);

    expect(mockAiScoringService.computeScoresForAllUsers).toHaveBeenCalledWith(
      new Date('2025-06-01')
    );
    expect(mockLeaderboardService.materializeLeaderboard).toHaveBeenCalledWith(
      'global',
      '2025-06-01'
    );
    expect(mockLeaderboardService.updateRanks).toHaveBeenCalledWith('2025-06-01');
    expect(getStatus(res)).toBe(200);
  });

  it('should materialize and update ranks when scores already exist', async () => {
    mockAiScoringService.hasScoresForDate.mockResolvedValue(true);
    mockLeaderboardService.getLeaderboard.mockResolvedValue(leaderboardData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyLeaderboard, req, res, next);

    expect(mockAiScoringService.computeScoresForAllUsers).not.toHaveBeenCalled();
    expect(mockLeaderboardService.materializeLeaderboard).toHaveBeenCalledWith(
      'global',
      '2025-06-01'
    );
    expect(mockLeaderboardService.updateRanks).toHaveBeenCalledWith('2025-06-01');
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyLeaderboard, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should propagate service errors via next', async () => {
    mockLeaderboardService.getLeaderboard.mockRejectedValue(
      new Error('DB connection failed')
    );

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getDailyLeaderboard, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('DB connection failed');
  });
});

// ─── getAroundMeLeaderboard ────────────────────────────────

describe('getAroundMeLeaderboard', () => {
  const aroundMeData = {
    entries: [
      { userId: 'u-3', displayName: 'Charlie', score: 80, rank: 49 },
      { userId: 'test-user-id', displayName: 'Test', score: 78, rank: 50 },
      { userId: 'u-4', displayName: 'Diana', score: 76, rank: 51 },
    ],
  };

  it('should return around-me leaderboard with defaults', async () => {
    mockLeaderboardService.getAroundMe.mockResolvedValue(aroundMeData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getAroundMeLeaderboard, req, res, next);

    expect(mockLeaderboardService.getAroundMe).toHaveBeenCalledWith(
      'test-user-id',
      '2025-06-01',
      50
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(aroundMeData);
    expect(body.message).toBe('Around me leaderboard retrieved successfully');
  });

  it('should pass custom range from query params', async () => {
    mockLeaderboardService.getAroundMe.mockResolvedValue(aroundMeData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01', range: '10' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getAroundMeLeaderboard, req, res, next);

    expect(mockLeaderboardService.getAroundMe).toHaveBeenCalledWith(
      'test-user-id',
      '2025-06-01',
      10
    );
  });

  it('should default to today when no date provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockLeaderboardService.getAroundMe.mockResolvedValue(aroundMeData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getAroundMeLeaderboard, req, res, next);

    expect(mockLeaderboardService.getAroundMe).toHaveBeenCalledWith(
      'test-user-id',
      today,
      50
    );
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(getAroundMeLeaderboard, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should propagate service errors via next', async () => {
    mockLeaderboardService.getAroundMe.mockRejectedValue(
      new Error('Redis unavailable')
    );

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getAroundMeLeaderboard, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('Redis unavailable');
  });
});

// ─── getUserRank ────────────────────────────────────────────

describe('getUserRank', () => {
  it('should return user rank for global type by default', async () => {
    mockLeaderboardService.getUserRank.mockResolvedValue(42);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getUserRank, req, res, next);

    expect(mockLeaderboardService.getUserRank).toHaveBeenCalledWith(
      'test-user-id',
      '2025-06-01',
      'global'
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ rank: 42 });
    expect(body.message).toBe('User rank retrieved successfully');
  });

  it('should pass custom type from query params', async () => {
    mockLeaderboardService.getUserRank.mockResolvedValue(5);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01', type: 'friends' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getUserRank, req, res, next);

    expect(mockLeaderboardService.getUserRank).toHaveBeenCalledWith(
      'test-user-id',
      '2025-06-01',
      'friends'
    );
    expect(getJsonBody(res).data).toEqual({ rank: 5 });
  });

  it('should return null rank when user has no rank', async () => {
    mockLeaderboardService.getUserRank.mockResolvedValue(undefined);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getUserRank, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ rank: null });
  });

  it('should default to today when no date provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockLeaderboardService.getUserRank.mockResolvedValue(1);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getUserRank, req, res, next);

    expect(mockLeaderboardService.getUserRank).toHaveBeenCalledWith(
      'test-user-id',
      today,
      'global'
    );
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(getUserRank, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should propagate service errors via next', async () => {
    mockLeaderboardService.getUserRank.mockRejectedValue(
      new Error('Query timeout')
    );

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getUserRank, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('Query timeout');
  });
});
