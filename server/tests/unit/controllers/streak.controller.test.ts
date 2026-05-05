/**
 * Streak Controller Unit Tests
 * Tests: streak status, activity history, calendar, leaderboard, around-me,
 *        reward tiers, aggregate stats, friend comparison, freeze purchase/apply.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockStreakService = {
  getStreakStatus: jest.fn<any>(),
  getCalendar: jest.fn<any>(),
  getStreakLeaderboard: jest.fn<any>(),
  getAroundMe: jest.fn<any>(),
  getStats: jest.fn<any>(),
  compareWithFriend: jest.fn<any>(),
  purchaseFreeze: jest.fn<any>(),
  applyFreeze: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/streak.service.js', () => ({
  streakService: mockStreakService,
}));

// ── Dynamic imports AFTER mocks ──
const {
  getStreakStatus,
  getActivityHistory,
  getCalendar,
  getStreakLeaderboard,
  getAroundMe,
  getRewardTiers,
  getAggregateStats,
  compareWithFriend,
  purchaseFreeze,
  applyFreeze,
} = await import('../../../src/controllers/streak.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// getStreakStatus
// ─────────────────────────────────────────────
describe('getStreakStatus', () => {
  it('returns 200 with streak status', async () => {
    const status = { currentStreak: 5, longestStreak: 12, lastActivityDate: '2025-04-23' };
    mockStreakService.getStreakStatus.mockResolvedValueOnce(status);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getStreakStatus, req, res, next);

    expect(mockStreakService.getStreakStatus).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(status);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getStreakStatus, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getActivityHistory
// ─────────────────────────────────────────────
describe('getActivityHistory', () => {
  it('returns 200 with activity history and total', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // count query
      .mockResolvedValueOnce({ rows: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }] }); // data query

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityHistory, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.activities).toHaveLength(3);
    expect(data.total).toBe(3);
  });

  it('passes limit and offset from query params', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: 'u-1' }, {
      query: { limit: '10', offset: '5' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityHistory, req, res, next);

    // Second call is the data query with limit/offset
    const dataCall = mockQuery.mock.calls[1];
    expect(dataCall[1]).toContain(10);
    expect(dataCall[1]).toContain(5);
  });

  it('filters by activityType when provided', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'a1' }] });

    const req = createAuthReq({ userId: 'u-1' }, {
      query: { activityType: 'workout' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityHistory, req, res, next);

    // Both calls should include the activityType param
    expect(mockQuery.mock.calls[0][1]).toContain('workout');
    expect(mockQuery.mock.calls[1][1]).toContain('workout');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityHistory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getCalendar
// ─────────────────────────────────────────────
describe('getCalendar', () => {
  it('returns 200 with calendar data', async () => {
    const calendar = { days: [{ date: '2025-04-01', active: true }] };
    mockStreakService.getCalendar.mockResolvedValueOnce(calendar);

    const req = createAuthReq({ userId: 'u-1' }, { params: { month: '2025-04' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getCalendar, req, res, next);

    expect(mockStreakService.getCalendar).toHaveBeenCalledWith('u-1', '2025-04');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(calendar);
  });

  it('calls next with 400 for invalid month format', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { params: { month: '2025' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getCalendar, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 400 for missing month param', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { params: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getCalendar, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// getStreakLeaderboard
// ─────────────────────────────────────────────
describe('getStreakLeaderboard', () => {
  it('returns 200 with leaderboard entries', async () => {
    const result = { entries: [{ userId: 'u-1', rank: 1 }], total: 1 };
    mockStreakService.getStreakLeaderboard.mockResolvedValueOnce(result);

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getStreakLeaderboard, req, res, next);

    expect(mockStreakService.getStreakLeaderboard).toHaveBeenCalledWith(25, 0, 'global');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.entries).toHaveLength(1);
  });

  it('passes custom segment, limit, offset', async () => {
    mockStreakService.getStreakLeaderboard.mockResolvedValueOnce({ entries: [], total: 0 });

    const req = createAuthReq({ userId: 'u-1' }, {
      query: { segment: 'friends', limit: '10', offset: '5' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getStreakLeaderboard, req, res, next);

    expect(mockStreakService.getStreakLeaderboard).toHaveBeenCalledWith(10, 5, 'friends');
  });
});

// ─────────────────────────────────────────────
// getAroundMe
// ─────────────────────────────────────────────
describe('getAroundMe', () => {
  it('returns 200 with nearby entries', async () => {
    const entries = [{ userId: 'u-0', rank: 4 }, { userId: 'u-1', rank: 5 }];
    mockStreakService.getAroundMe.mockResolvedValueOnce(entries);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getAroundMe, req, res, next);

    expect(mockStreakService.getAroundMe).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
  });
});

// ─────────────────────────────────────────────
// getRewardTiers
// ─────────────────────────────────────────────
describe('getRewardTiers', () => {
  it('returns 200 with rewards and unlock status', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { id: 'r1', streak_days_required: 7, title: 'Week Warrior', description: 'desc',
            reward_type: 'badge', reward_value: null, icon: 'fire', created_at: new Date() },
          { id: 'r2', streak_days_required: 30, title: 'Month Master', description: 'desc',
            reward_type: 'badge', reward_value: null, icon: 'star', created_at: new Date() },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ current_streak: 10 }],
      });

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getRewardTiers, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.rewards).toHaveLength(2);
    expect(data.currentStreak).toBe(10);
    // 10 >= 7 => unlocked
    expect(data.rewards[0].unlocked).toBe(true);
    // 10 < 30 => locked
    expect(data.rewards[1].unlocked).toBe(false);
  });

  it('handles no streak row (defaults to 0)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // no rewards
      .mockResolvedValueOnce({ rows: [{ current_streak: 0 }] }); // COALESCE returns 0

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getRewardTiers, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.currentStreak).toBe(0);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getRewardTiers, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getAggregateStats
// ─────────────────────────────────────────────
describe('getAggregateStats', () => {
  it('returns 200 with stats', async () => {
    const stats = { totalDays: 50, totalXp: 1200 };
    mockStreakService.getStats.mockResolvedValueOnce(stats);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getAggregateStats, req, res, next);

    expect(mockStreakService.getStats).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(stats);
  });
});

// ─────────────────────────────────────────────
// compareWithFriend
// ─────────────────────────────────────────────
describe('compareWithFriend', () => {
  it('returns 200 with comparison data', async () => {
    const comparison = { user: { streak: 10 }, friend: { streak: 15 } };
    mockStreakService.compareWithFriend.mockResolvedValueOnce(comparison);

    const req = createAuthReq({ userId: 'u-1' }, { params: { friendId: 'friend-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(compareWithFriend, req, res, next);

    expect(mockStreakService.compareWithFriend).toHaveBeenCalledWith('u-1', 'friend-1');
    expect(getStatus(res)).toBe(200);
  });

  it('calls next with 400 when friendId is missing', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { params: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(compareWithFriend, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// purchaseFreeze
// ─────────────────────────────────────────────
describe('purchaseFreeze', () => {
  it('returns 200 on successful purchase', async () => {
    const result = { freezesRemaining: 2 };
    mockStreakService.purchaseFreeze.mockResolvedValueOnce(result);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(purchaseFreeze, req, res, next);

    expect(mockStreakService.purchaseFreeze).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(result);
  });

  it('propagates service errors to next', async () => {
    mockStreakService.purchaseFreeze.mockRejectedValueOnce(new Error('Insufficient credits'));

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(purchaseFreeze, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.message).toBe('Insufficient credits');
  });
});

// ─────────────────────────────────────────────
// applyFreeze
// ─────────────────────────────────────────────
describe('applyFreeze', () => {
  it('returns 200 on successful apply without date', async () => {
    const result = { applied: true };
    mockStreakService.applyFreeze.mockResolvedValueOnce(result);

    const req = createAuthReq({ userId: 'u-1' }, { body: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(applyFreeze, req, res, next);

    expect(mockStreakService.applyFreeze).toHaveBeenCalledWith('u-1', undefined);
    expect(getStatus(res)).toBe(200);
  });

  it('passes date to service when provided', async () => {
    mockStreakService.applyFreeze.mockResolvedValueOnce({ applied: true });

    const req = createAuthReq({ userId: 'u-1' }, { body: { date: '2025-04-20' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(applyFreeze, req, res, next);

    expect(mockStreakService.applyFreeze).toHaveBeenCalledWith('u-1', '2025-04-20');
  });

  it('calls next with 400 for invalid date format', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { body: { date: '04-20-2025' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(applyFreeze, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(applyFreeze, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
