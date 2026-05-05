/**
 * Activity Controller Unit Tests
 *
 * Tests: getActivityLogs, getActivityStats, getActivityBreakdown,
 *        getCalendarData, completeActivity, skipActivity, getRecentActivities
 *
 * The activity controller queries the DB directly (no service layer),
 * so we mock the database query function.
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks (BEFORE dynamic imports)
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Dynamic imports (AFTER all mocks)
const {
  getActivityLogs,
  getActivityStats,
  getActivityBreakdown,
  getCalendarData,
  completeActivity,
  skipActivity,
  getRecentActivities,
} = await import('../../../src/controllers/activity.controller.js');

const {
  createAuthReq,
  createRes,
  createNext,
  callHandler,
  getJsonBody,
  getStatus,
  expectNextCalledWithError,
} = await import('../../helpers/controller-harness.js');

const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ─── Setup ──────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getActivityLogs ────────────────────────────────────────────

describe('getActivityLogs', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityLogs, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should return paginated activity logs for default date range', async () => {
    // First call: COUNT query
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '2' }]));
    // Second call: data query
    mockQuery.mockResolvedValueOnce(
      pgResult([
        {
          id: 'log-1',
          data_type: 'workouts',
          recorded_at: new Date('2025-01-10T08:00:00Z'),
          value: { duration: 30, type: 'running' },
          unit: 'minutes',
          provider: 'manual',
        },
        {
          id: 'log-2',
          data_type: 'sleep',
          recorded_at: new Date('2025-01-10T06:00:00Z'),
          value: { duration_minutes: 480, sleep_quality_score: 85 },
          unit: 'minutes',
          provider: 'whoop',
        },
      ])
    );

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityLogs, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });

    // Verify mapped activity shape
    expect(body.data[0]).toMatchObject({
      id: 'log-1',
      title: 'Workout',
      type: 'workout',
      pillar: 'fitness',
      status: 'completed',
      source: 'health_data',
    });
  });

  it('should apply type filter and custom pagination', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '5' }]));
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const req = createAuthReq(
      { userId: 'user-1' },
      {
        query: {
          type: 'sleep',
          page: '2',
          limit: '10',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityLogs, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.total).toBe(5);

    // Verify type filter was included in query params
    const countCallArgs = mockQuery.mock.calls[0];
    expect(countCallArgs[1]).toContain('sleep');
  });

  it('should clamp limit to max 50', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'user-1' },
      { query: { limit: '999' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityLogs, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.meta.limit).toBe(50);
  });

  it('should handle WHOOP strain data description', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '1' }]));
    mockQuery.mockResolvedValueOnce(
      pgResult([
        {
          id: 'log-strain',
          data_type: 'strain',
          recorded_at: new Date('2025-01-10T08:00:00Z'),
          value: {
            sport_name: 'Running',
            strain_score: 14.5,
            calories_burned: 350,
            duration_minutes: 45,
          },
          unit: '',
          provider: 'whoop',
        },
      ])
    );

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityLogs, req, res, next);

    const body = getJsonBody(res);
    expect(body.data[0].description).toContain('Running');
    expect(body.data[0].description).toContain('Strain: 15');
    expect(body.data[0].description).toContain('350 kcal');
    expect(body.data[0].description).toContain('45 min');
  });
});

// ─── getActivityStats ───────────────────────────────────────────

describe('getActivityStats', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityStats, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should return weekly stats by default', async () => {
    // Current period health data stats
    mockQuery.mockResolvedValueOnce(
      pgResult([{ total: '10', total_duration: '300', total_calories: '2000' }])
    );
    // Current period activity logs stats
    mockQuery.mockResolvedValueOnce(
      pgResult([{ total: '5', total_duration: '150' }])
    );
    // Previous period health stats
    mockQuery.mockResolvedValueOnce(
      pgResult([{ total: '8', total_duration: '200' }])
    );
    // Previous period activity stats
    mockQuery.mockResolvedValueOnce(
      pgResult([{ total: '4', total_duration: '100' }])
    );

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityStats, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.stats).toBeDefined();
    expect(body.data.stats.period).toBe('week');
    expect(body.data.stats.activitiesThisPeriod).toBe(15); // 10 + 5
    expect(body.data.stats.activeTime).toBe(450); // 300 + 150
    expect(body.data.stats.caloriesBurned).toBe(2000);
  });

  it('should accept period=month', async () => {
    mockQuery.mockResolvedValueOnce(
      pgResult([{ total: '0', total_duration: '0', total_calories: '0' }])
    );
    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0', total_duration: '0' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0', total_duration: '0' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0', total_duration: '0' }]));

    const req = createAuthReq(
      { userId: 'user-1' },
      { query: { period: 'month' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityStats, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.stats.period).toBe('month');
  });

  it('should accept period=day', async () => {
    mockQuery.mockResolvedValueOnce(
      pgResult([{ total: '3', total_duration: '60', total_calories: '500' }])
    );
    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1', total_duration: '30' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ total: '2', total_duration: '45' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1', total_duration: '20' }]));

    const req = createAuthReq(
      { userId: 'user-1' },
      { query: { period: 'day' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityStats, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.stats.period).toBe('day');
    expect(body.data.stats.activitiesThisPeriod).toBe(4); // 3 + 1
  });
});

// ─── getActivityBreakdown ───────────────────────────────────────

describe('getActivityBreakdown', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityBreakdown, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should return breakdown by activity type', async () => {
    // Health data breakdown
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { data_type: 'workouts', total: '5', total_duration: '200' },
        { data_type: 'sleep', total: '7', total_duration: '3360' },
      ])
    );
    // Activity logs breakdown
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { activity_type: 'meal', pillar: 'nutrition', total: '14', total_duration: '0' },
      ])
    );

    const req = createAuthReq({ userId: 'user-1' }, { query: { period: 'week' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityBreakdown, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.breakdown).toBeDefined();
    expect(body.data.period).toBe('week');
    expect(Array.isArray(body.data.breakdown)).toBe(true);
    // Sorted by count descending
    expect(body.data.breakdown[0].count).toBeGreaterThanOrEqual(body.data.breakdown[1].count);
  });

  it('should return empty breakdown when no data exists', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityBreakdown, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.breakdown).toEqual([]);
  });
});

// ─── getCalendarData ────────────────────────────────────────────

describe('getCalendarData', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(getCalendarData, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should return calendar data for current week by default', async () => {
    // Health daily result
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { date: '2025-01-13', count: '3', total_duration: '90' },
        { date: '2025-01-14', count: '2', total_duration: '60' },
      ])
    );
    // Activity daily result
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { date: '2025-01-13', total: '5', completed: '4', total_duration: '120' },
      ])
    );

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getCalendarData, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.days).toBeDefined();
    expect(Array.isArray(body.data.days)).toBe(true);
    // Default week has 7 days
    expect(body.data.days.length).toBe(7);
    // Each day has expected shape
    const day = body.data.days[0];
    expect(day).toHaveProperty('date');
    expect(day).toHaveProperty('dayOfWeek');
    expect(day).toHaveProperty('dayNumber');
    expect(day).toHaveProperty('isToday');
    expect(day).toHaveProperty('activities');
    expect(day).toHaveProperty('healthLogs');
    expect(day).toHaveProperty('duration');
    expect(day).toHaveProperty('hasActivity');
  });

  it('should return calendar data for specific month', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'user-1' },
      { query: { year: '2025', month: '2' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getCalendarData, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.days.length).toBe(28); // Feb 2025 has 28 days
    // startDate is formatted from local Date object — just verify it exists
    expect(body.data.startDate).toBeDefined();
  });

  it('should return calendar data for specific week', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'user-1' },
      { query: { week: '2025-01-15' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getCalendarData, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.days.length).toBe(7);
  });
});

// ─── completeActivity ───────────────────────────────────────────

describe('completeActivity', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(completeActivity, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should return 400 when logId is missing', async () => {
    const req = createAuthReq(
      { userId: 'user-1' },
      { params: {}, body: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(completeActivity, req, res, next);

    expectNextCalledWithError(next, 400);
  });

  it('should return 404 when activity log is not found', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'user-1' },
      { params: { logId: 'nonexistent' }, body: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(completeActivity, req, res, next);

    expectNextCalledWithError(next, 404);
  });

  it('should complete activity and return feedback', async () => {
    const existingLog = {
      id: 'log-1',
      user_id: 'user-1',
      plan_id: 'plan-1',
      activity_id: 'morning-walk',
      scheduled_date: new Date('2025-01-15'),
      completed_at: null,
      status: 'pending',
      actual_value: null,
      target_value: 30,
      duration: null,
      user_notes: null,
      mood: null,
      ai_feedback: null,
    };

    const updatedLog = {
      ...existingLog,
      status: 'completed',
      completed_at: new Date(),
      actual_value: 35,
      duration: 30,
      user_notes: 'Felt great!',
      mood: 4,
    };

    // SELECT existing log
    mockQuery.mockResolvedValueOnce(pgResult([existingLog]));
    // UPDATE log
    mockQuery.mockResolvedValueOnce(pgResult([updatedLog]));
    // UPDATE feedback
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const req = createAuthReq(
      { userId: 'user-1' },
      {
        params: { logId: 'log-1' },
        body: {
          actualValue: 35,
          duration: 30,
          notes: 'Felt great!',
          mood: 4,
        },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(completeActivity, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.log).toBeDefined();
    expect(body.data.feedback).toBeDefined();
    expect(body.message).toBe('Activity completed successfully');
  });
});

// ─── skipActivity ───────────────────────────────────────────────

describe('skipActivity', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(skipActivity, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should return 400 when logId is missing', async () => {
    const req = createAuthReq(
      { userId: 'user-1' },
      { params: {}, body: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(skipActivity, req, res, next);

    expectNextCalledWithError(next, 400);
  });

  it('should return 404 when activity log is not found', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'user-1' },
      { params: { logId: 'nonexistent' }, body: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(skipActivity, req, res, next);

    expectNextCalledWithError(next, 404);
  });

  it('should skip activity with reason', async () => {
    const existingLog = {
      id: 'log-1',
      user_id: 'user-1',
      status: 'pending',
    };

    const skippedLog = {
      ...existingLog,
      status: 'skipped',
      user_notes: 'Feeling unwell',
    };

    // SELECT existing log
    mockQuery.mockResolvedValueOnce(pgResult([existingLog]));
    // UPDATE log
    mockQuery.mockResolvedValueOnce(pgResult([skippedLog]));

    const req = createAuthReq(
      { userId: 'user-1' },
      {
        params: { logId: 'log-1' },
        body: { reason: 'Feeling unwell' },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(skipActivity, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.log.status).toBe('skipped');
    expect(body.message).toBe('Activity skipped');
  });
});

// ─── getRecentActivities ────────────────────────────────────────

describe('getRecentActivities', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(getRecentActivities, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should return recent activities from both sources', async () => {
    // Activity logs query
    mockQuery.mockResolvedValueOnce(
      pgResult([
        {
          id: 'al-1',
          activity_id: 'morning-walk',
          scheduled_date: new Date('2025-01-15'),
          completed_at: new Date('2025-01-15T08:30:00Z'),
          status: 'completed',
          duration: 30,
          user_notes: 'Nice walk',
          plan_name: 'Fitness Plan',
          pillar: 'fitness',
        },
      ])
    );
    // Health data query
    mockQuery.mockResolvedValueOnce(
      pgResult([
        {
          id: 'hd-1',
          user_id: 'user-1',
          data_type: 'sleep',
          recorded_at: new Date('2025-01-15T06:00:00Z'),
          value: { duration_minutes: 480 },
          unit: 'minutes',
          provider: 'whoop',
        },
      ])
    );

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getRecentActivities, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.activities).toBeDefined();
    expect(body.data.activities.length).toBe(2);

    // Should be sorted by completedAt descending (walk at 08:30 before sleep at 06:00)
    expect(body.data.activities[0].id).toBe('al-1');
    expect(body.data.activities[0].source).toBe('activity');
    expect(body.data.activities[1].id).toBe('hd-1');
    expect(body.data.activities[1].source).toBe('health_data');
  });

  it('should return empty activities when no data exists', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getRecentActivities, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.activities).toEqual([]);
  });

  it('should clamp limit to max 50', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'user-1' },
      { query: { limit: '999' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getRecentActivities, req, res, next);

    // Verify the LIMIT param passed to the health data query is 50
    const healthQueryCall = mockQuery.mock.calls[1];
    const lastParam = healthQueryCall[1][healthQueryCall[1].length - 1];
    expect(lastParam).toBe(50);
  });
});
