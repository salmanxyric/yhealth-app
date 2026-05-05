/**
 * Stats Controller Unit Tests
 * Tests: getDashboardStats, getWeeklyActivityData, getCurrentStreak,
 *        getHealthMetrics, logQuickAction, getAnalytics, getReport.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
const _mockCache = setupCacheMock();

// ── Dynamic imports AFTER mocks ──
const {
  getDashboardStats,
  getWeeklyActivityData,
  getCurrentStreak,
  getHealthMetrics,
  logQuickAction,
  getAnalytics,
  getReport,
} = await import('../../../src/controllers/stats.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => jest.clearAllMocks());

// ── Helpers ──

/** Build a minimal query result with rows */
function qr<T>(rows: T[]) {
  return { rows, rowCount: rows.length };
}

const EMPTY = qr([]);

// ─────────────────────────────────────────────
// getDashboardStats
// ─────────────────────────────────────────────
describe('getDashboardStats', () => {
  it('returns 200 with dashboard data when user has an active plan', async () => {
    // 1. calculateStreak -> activity_logs query
    mockQuery.mockResolvedValueOnce(EMPTY);
    // 2. active plan (user_plans)
    mockQuery.mockResolvedValueOnce(
      qr([{ activities: [{ id: 'a1', daysOfWeek: ['monday', 'tuesday'] }], status: 'active' }])
    );
    // 3. this week logs
    mockQuery.mockResolvedValueOnce(qr([{ status: 'completed' }]));
    // 4. last week logs
    mockQuery.mockResolvedValueOnce(qr([]));
    // 5. total completed count
    mockQuery.mockResolvedValueOnce(qr([{ count: '42' }]));
    // 6. active goals count
    mockQuery.mockResolvedValueOnce(qr([{ count: '3' }]));
    // 7. calculateLongestStreak -> activity_logs query
    mockQuery.mockResolvedValueOnce(EMPTY);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getDashboardStats, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('streak');
    expect(body.data).toHaveProperty('weekProgress');
    expect(body.data).toHaveProperty('summary');
    expect(body.data.summary.totalActivitiesCompleted).toBe(42);
    expect(body.data.summary.activeGoals).toBe(3);
  });

  it('returns 200 with zero stats when user has no plan or logs', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // 1. calculateStreak
    mockQuery.mockResolvedValueOnce(EMPTY); // 2. no plan
    mockQuery.mockResolvedValueOnce(EMPTY); // 3. this week logs
    mockQuery.mockResolvedValueOnce(EMPTY); // 4. last week logs
    mockQuery.mockResolvedValueOnce(qr([{ count: '0' }])); // 5. total completed
    mockQuery.mockResolvedValueOnce(qr([{ count: '0' }])); // 6. active goals
    mockQuery.mockResolvedValueOnce(EMPTY); // 7. calculateLongestStreak

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getDashboardStats, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.streak.current).toBe(0);
    expect(data.weekProgress.completed).toBe(0);
    expect(data.summary.totalActivitiesCompleted).toBe(0);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getDashboardStats, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getWeeklyActivityData
// ─────────────────────────────────────────────
describe('getWeeklyActivityData', () => {
  it('returns current week data with day-by-day breakdown', async () => {
    // plan
    mockQuery.mockResolvedValueOnce(
      qr([{ activities: [{ id: 'a1', daysOfWeek: ['monday', 'wednesday', 'friday'] }] }])
    );
    // logs
    mockQuery.mockResolvedValueOnce(EMPTY);

    const req = createAuthReq({ userId: 'u-1' }, { query: { week: 'current' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getWeeklyActivityData, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.week).toBe('current');
    expect(data.days).toHaveLength(7);
    expect(data.summary).toHaveProperty('totalCompleted');
    expect(data.summary).toHaveProperty('averageCompletionRate');
  });

  it('returns last week data when week=last', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ activities: [] }]));
    mockQuery.mockResolvedValueOnce(EMPTY);

    const req = createAuthReq({ userId: 'u-1' }, { query: { week: 'last' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getWeeklyActivityData, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.week).toBe('last');
  });

  it('returns monthly aggregated data when week=month', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // logs

    const req = createAuthReq({ userId: 'u-1' }, { query: { week: 'month' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getWeeklyActivityData, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.week).toBe('month');
    expect(data.summary).toHaveProperty('totalCompleted');
  });

  it('returns lifetime data with first log fallback', async () => {
    // first log query (min date)
    mockQuery.mockResolvedValueOnce(qr([{ min_date: null }]));
    // logs
    mockQuery.mockResolvedValueOnce(EMPTY);

    const req = createAuthReq({ userId: 'u-1' }, { query: { week: 'lifetime' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getWeeklyActivityData, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.week).toBe('lifetime');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getWeeklyActivityData, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getCurrentStreak
// ─────────────────────────────────────────────
describe('getCurrentStreak', () => {
  it('returns 200 with streak data and history', async () => {
    // calculateStreak query
    mockQuery.mockResolvedValueOnce(
      qr([
        { date: '2025-04-24', completed: '3' },
        { date: '2025-04-23', completed: '2' },
      ])
    );
    // calculateLongestStreak query
    mockQuery.mockResolvedValueOnce(
      qr([
        { date: '2025-04-20', completed: '1' },
        { date: '2025-04-21', completed: '1' },
      ])
    );
    // history query (last 30 days)
    mockQuery.mockResolvedValueOnce(
      qr([{ date: '2025-04-24', completed: '3', total: '5' }])
    );

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getCurrentStreak, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data).toHaveProperty('currentStreak');
    expect(data).toHaveProperty('longestStreak');
    expect(data).toHaveProperty('streakHistory');
    expect(Array.isArray(data.streakHistory)).toBe(true);
  });

  it('returns zero streak when no logs exist', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // calculateStreak
    mockQuery.mockResolvedValueOnce(EMPTY); // calculateLongestStreak
    mockQuery.mockResolvedValueOnce(EMPTY); // history

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getCurrentStreak, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(0);
    expect(data.lastActivityDate).toBeNull();
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getCurrentStreak, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getHealthMetrics
// ─────────────────────────────────────────────
describe('getHealthMetrics', () => {
  it('returns 200 with all metric categories', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // latest health data
    mockQuery.mockResolvedValueOnce(EMPTY); // today's completed logs
    mockQuery.mockResolvedValueOnce(qr([{ total: '3' }])); // water intake
    mockQuery.mockResolvedValueOnce(qr([{ value: { duration: 480, quality: 8 } }])); // sleep
    mockQuery.mockResolvedValueOnce(qr([{ value: { bpm: 72, resting: 60 } }])); // heart rate
    mockQuery.mockResolvedValueOnce(qr([{ value: { count: 8500 } }])); // steps

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getHealthMetrics, req, res, next);

    expect(getStatus(res)).toBe(200);
    const metrics = getJsonBody(res).data.metrics;
    expect(metrics).toHaveProperty('calories');
    expect(metrics).toHaveProperty('water');
    expect(metrics).toHaveProperty('sleep');
    expect(metrics).toHaveProperty('heartRate');
    expect(metrics).toHaveProperty('steps');
    expect(metrics.water.value).toBe(3);
    expect(metrics.steps.value).toBe(8500);
  });

  it('returns null values when no health data exists', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // health data
    mockQuery.mockResolvedValueOnce(EMPTY); // today's logs
    mockQuery.mockResolvedValueOnce(qr([{ total: null }])); // water
    mockQuery.mockResolvedValueOnce(EMPTY); // sleep
    mockQuery.mockResolvedValueOnce(EMPTY); // heart rate
    mockQuery.mockResolvedValueOnce(EMPTY); // steps

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getHealthMetrics, req, res, next);

    expect(getStatus(res)).toBe(200);
    const metrics = getJsonBody(res).data.metrics;
    expect(metrics.calories.value).toBeNull();
    expect(metrics.water.value).toBeNull();
    expect(metrics.sleep.value).toBeNull();
    expect(metrics.heartRate.value).toBeNull();
    expect(metrics.steps.value).toBeNull();
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getHealthMetrics, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// logQuickAction
// ─────────────────────────────────────────────
describe('logQuickAction', () => {
  it('logs a workout quick action and returns 201', async () => {
    // integration check
    mockQuery.mockResolvedValueOnce(qr([{ id: 'int-1' }]));
    // insert record
    mockQuery.mockResolvedValueOnce(qr([{ id: 'rec-1' }]));

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { type: 'workout', duration: 45, details: { workoutType: 'running' } },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(logQuickAction, req, res, next);

    expect(getStatus(res)).toBe(201);
    const data = getJsonBody(res).data;
    expect(data.type).toBe('workout');
    expect(data.id).toBe('rec-1');
  });

  it('logs a water quick action with default value', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ id: 'int-1' }]));
    mockQuery.mockResolvedValueOnce(qr([{ id: 'rec-2' }]));

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { type: 'water' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(logQuickAction, req, res, next);

    expect(getStatus(res)).toBe(201);
    const data = getJsonBody(res).data;
    expect(data.type).toBe('water');
    expect(data.value.glasses).toBe(1);
  });

  it('creates placeholder integration when none exists', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // no integration
    mockQuery.mockResolvedValueOnce(qr([{ id: 'new-int' }])); // create integration
    mockQuery.mockResolvedValueOnce(qr([{ id: 'rec-3' }])); // insert record

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { type: 'meal', value: 500 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(logQuickAction, req, res, next);

    expect(getStatus(res)).toBe(201);
    // Verify integration was created (second query call)
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it('calls next with error when type is missing', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      body: {},
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(logQuickAction, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with error for invalid type', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      body: { type: 'invalid_type' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(logQuickAction, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(logQuickAction, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getAnalytics
// ─────────────────────────────────────────────
describe('getAnalytics', () => {
  it('returns 200 with analytics for default 30d range', async () => {
    // 1. activity trends
    mockQuery.mockResolvedValueOnce(
      qr([{ date: '2025-04-20', completed: '5', total: '7' }])
    );
    // 2. logs with plans for categorization
    mockQuery.mockResolvedValueOnce(EMPTY);
    // 3. all plans
    mockQuery.mockResolvedValueOnce(EMPTY);
    // 4. time distribution
    mockQuery.mockResolvedValueOnce(EMPTY);
    // 5. monthly progress
    mockQuery.mockResolvedValueOnce(EMPTY);

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getAnalytics, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data).toHaveProperty('activityTrends');
    expect(data).toHaveProperty('weeklyBreakdown');
    expect(Array.isArray(data.activityTrends)).toBe(true);
  });

  it('accepts range=7d query parameter', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // trends
    mockQuery.mockResolvedValueOnce(EMPTY); // logs with plans
    mockQuery.mockResolvedValueOnce(EMPTY); // plans
    mockQuery.mockResolvedValueOnce(EMPTY); // time distribution
    mockQuery.mockResolvedValueOnce(EMPTY); // monthly progress

    const req = createAuthReq({ userId: 'u-1' }, { query: { range: '7d' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getAnalytics, req, res, next);

    expect(getStatus(res)).toBe(200);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getAnalytics, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getReport
// ─────────────────────────────────────────────
describe('getReport', () => {
  it('returns 200 with report data for default month period', async () => {
    // summary
    mockQuery.mockResolvedValueOnce(qr([{ completed: '20', total: '30', avg_score: '66.7' }]));
    // weekly report
    mockQuery.mockResolvedValueOnce(
      qr([{ week: '2025-16', completed: '10', total: '15', score: '66.7' }])
    );
    // category performance
    mockQuery.mockResolvedValueOnce(
      qr([{ category: 'workout', completed: '8', total: '10', avg_score: '80' }])
    );
    // goals
    mockQuery.mockResolvedValueOnce(
      qr([{ goal: 'Run 5K', progress: '3', target: '5', status: 'active' }])
    );
    // health trends
    mockQuery.mockResolvedValueOnce(EMPTY);
    // achievements
    mockQuery.mockResolvedValueOnce(EMPTY);

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getReport, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('weeklyReport');
    expect(data).toHaveProperty('categoryPerformance');
    expect(data).toHaveProperty('goalProgress');
    expect(data.summary.completionRate).toBe(67);
    expect(data.summary.totalActivities).toBe(30);
  });

  it('generates recommendations when completion rate is low', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ completed: '5', total: '30', avg_score: '16.7' }]));
    mockQuery.mockResolvedValueOnce(EMPTY); // weekly
    mockQuery.mockResolvedValueOnce(
      qr([{ category: 'workout', completed: '2', total: '10', avg_score: '20' }])
    );
    mockQuery.mockResolvedValueOnce(EMPTY); // goals
    mockQuery.mockResolvedValueOnce(EMPTY); // health trends
    mockQuery.mockResolvedValueOnce(EMPTY); // achievements

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getReport, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.recommendations.length).toBeGreaterThan(0);
    expect(data.recommendations[0].priority).toBe('high');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getReport, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
