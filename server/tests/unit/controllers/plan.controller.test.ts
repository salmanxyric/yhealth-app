/**
 * Plan Controller Unit Tests
 *
 * Tests: generatePlan, getPlans, getActivePlan, getPlanById,
 * updatePlan, logActivity, getActivityLogs, getWeeklySummary,
 * getTodayActivities, completeOnboarding, createManualPlan,
 * generateAITasks, getSafetyPreview.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import {
  setupLoggerMock,
  setupCacheMock,
  setupQueueMock,
  setupModelFactoryMock,
} from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();
setupQueueMock();
const mockModelFactory = setupModelFactoryMock();

// ── Service mocks ──
const mockNotificationService = {
  activityLogged: jest.fn<any>().mockResolvedValue(undefined),
  streakMilestone: jest.fn<any>().mockResolvedValue(undefined),
  planUpdated: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/notification.service.js', () => ({
  notificationService: mockNotificationService,
}));

const mockNutritionService = {
  activityDaysToLevel: jest.fn<any>().mockReturnValue('moderate'),
  goalCategoryToType: jest.fn<any>().mockReturnValue('weight_loss'),
  generateNutritionPlan: jest.fn<any>().mockReturnValue({
    macros: {
      calories: 2000,
      protein: { grams: 150 },
      carbohydrates: { grams: 200 },
      fat: { grams: 67 },
    },
    safetyWarnings: [],
    recommendations: [],
  }),
  validatePlanSafety: jest.fn<any>().mockReturnValue({ isSafe: true, issues: [] }),
};

const mockSafetyService = {
  validateForPlanGeneration: jest.fn<any>().mockReturnValue({
    isApproved: true,
    riskLevel: 'low',
    requiresDoctorConsult: false,
    warnings: [],
    restrictions: [],
    recommendations: [],
    disclaimers: [],
  }),
  calculateBMI: jest.fn<any>().mockReturnValue(24.5),
  getBMICategory: jest.fn<any>().mockReturnValue('normal'),
  getRequiredConsents: jest.fn<any>().mockReturnValue([]),
};

jest.unstable_mockModule('../../../src/services/index.js', () => ({
  nutritionService: mockNutritionService,
  safetyService: mockSafetyService,
}));

// ── Dynamic imports AFTER mocks ──
const {
  generatePlan,
  getPlans,
  getActivePlan,
  getPlanById,
  updatePlan,
  logActivity,
  getActivityLogs,
  getWeeklySummary: _getWeeklySummary,
  getTodayActivities: _getTodayActivities,
  completeOnboarding,
  createManualPlan,
  generateAITasks,
  getSafetyPreview: _getSafetyPreview,
} = await import('../../../src/controllers/plan.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => jest.clearAllMocks());

// ── Helpers ──
const USER_ID = 'test-user-id';

function makePlanRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-1',
    user_id: USER_ID,
    goal_id: 'goal-1',
    name: 'Weight Loss Plan',
    description: 'A 12-week plan',
    pillar: 'fitness',
    goal_category: 'weight_loss',
    start_date: new Date('2025-01-01'),
    end_date: new Date('2025-04-01'),
    duration_weeks: 12,
    current_week: 1,
    status: 'active',
    paused_at: null,
    resumed_at: null,
    completed_at: null,
    activities: [
      {
        id: 'act_1',
        type: 'workout',
        title: 'Strength Training',
        description: 'Full body workout',
        targetValue: 45,
        targetUnit: 'minutes',
        daysOfWeek: ['monday', 'wednesday', 'friday'],
        preferredTime: '07:00',
        duration: 45,
      },
      {
        id: 'act_2',
        type: 'check_in',
        title: 'Daily Check-in',
        description: 'Rate energy and mood',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        preferredTime: '09:00',
      },
    ],
    weekly_focuses: [{ week: 1, theme: 'Foundation', focus: 'Build habits', expectedOutcome: 'Momentum', activities: ['act_1'] }],
    ai_generated: true,
    ai_model: 'gpt-4',
    generation_params: null,
    user_adjustments: [],
    overall_progress: 0,
    weekly_completion_rates: [],
    user_rating: null,
    user_feedback: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeGoalRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'goal-1',
    user_id: USER_ID,
    category: 'weight_loss',
    pillar: 'fitness',
    title: 'Lose 10 lbs',
    description: 'Weight loss goal',
    target_value: 10,
    target_unit: 'lbs',
    duration_weeks: 12,
    status: 'active',
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// getPlans
// ─────────────────────────────────────────────
describe('getPlans', () => {
  it('returns all user plans with stats', async () => {
    const plans = [makePlanRow()];
    mockQuery
      .mockResolvedValueOnce({ rows: plans }) // plans query
      .mockResolvedValueOnce({ rows: [{ status: 'active', count: '1' }] }); // stats query

    const req = createAuthReq({ userId: USER_ID }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getPlans, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.plans).toHaveLength(1);
    expect(body.data.stats.active).toBe(1);
  });

  it('filters plans by status', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ status: 'completed', count: '2' }] });

    const req = createAuthReq({ userId: USER_ID }, { query: { status: 'completed' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getPlans, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.plans).toHaveLength(0);
  });

  it('returns 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getPlans, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getActivePlan
// ─────────────────────────────────────────────
describe('getActivePlan', () => {
  it('returns active plan with today activities', async () => {
    const plan = makePlanRow();
    mockQuery
      .mockResolvedValueOnce({ rows: [plan] }) // plan query
      .mockResolvedValueOnce({ rows: [] }) // today logs
      .mockResolvedValueOnce({ rows: [] }); // week logs

    const req = createAuthReq({ userId: USER_ID });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivePlan, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.plan).toBeDefined();
    expect(body.data.weekCompletionRate).toBeDefined();
  });

  it('returns 404 when no active plan', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID });
    const res = createRes();
    const next = createNext();

    await callHandler(getActivePlan, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// getPlanById
// ─────────────────────────────────────────────
describe('getPlanById', () => {
  it('returns plan by ID', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [makePlanRow()] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'plan-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getPlanById, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.plan.id).toBe('plan-1');
  });

  it('returns 404 when plan not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'nonexistent' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getPlanById, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// updatePlan
// ─────────────────────────────────────────────
describe('updatePlan', () => {
  it('updates plan status to paused', async () => {
    const plan = makePlanRow();
    const updated = makePlanRow({ status: 'paused', paused_at: new Date() });
    mockQuery
      .mockResolvedValueOnce({ rows: [plan] }) // find plan
      .mockResolvedValueOnce({ rows: [updated] }); // UPDATE

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'plan-1' },
      body: { status: 'paused' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updatePlan, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.plan.status).toBe('paused');
  });

  it('updates plan with user rating', async () => {
    const plan = makePlanRow();
    const updated = makePlanRow({ user_rating: 4 });
    mockQuery
      .mockResolvedValueOnce({ rows: [plan] })
      .mockResolvedValueOnce({ rows: [updated] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'plan-1' },
      body: { userRating: 4 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updatePlan, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.plan.userRating).toBe(4);
  });

  it('returns 404 when plan not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'nonexistent' },
      body: { status: 'paused' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updatePlan, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// logActivity
// ─────────────────────────────────────────────
describe('logActivity', () => {
  it('creates a new activity log', async () => {
    const plan = makePlanRow();
    const log = {
      id: 'log-1',
      user_id: USER_ID,
      plan_id: 'plan-1',
      activity_id: 'act_1',
      scheduled_date: new Date(),
      completed_at: new Date(),
      status: 'completed',
      actual_value: 45,
      target_value: 45,
      duration: 45,
      user_notes: null,
      mood: 4,
      ai_feedback: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [plan] }) // find plan
      .mockResolvedValueOnce({ rows: [] }) // no existing log
      .mockResolvedValueOnce({ rows: [log] }) // INSERT log
      .mockResolvedValueOnce({ rows: [] }) // UPDATE ai_feedback
      // updatePlanProgress internal queries:
      .mockResolvedValueOnce({ rows: [plan] }) // plan query
      .mockResolvedValueOnce({ rows: [{ status: 'completed' }] }) // logs
      .mockResolvedValueOnce({ rows: [] }) // update progress
      // streak check
      .mockResolvedValueOnce({ rows: [{ streak_count: '3' }] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'plan-1', activityId: 'act_1' },
      body: { status: 'completed', actualValue: 45, duration: 45, mood: 4 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(logActivity, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.log).toBeDefined();
    expect(mockNotificationService.activityLogged).toHaveBeenCalled();
  });

  it('returns 404 when activity not in plan', async () => {
    const plan = makePlanRow();
    mockQuery.mockResolvedValueOnce({ rows: [plan] }); // find plan

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'plan-1', activityId: 'nonexistent_activity' },
      body: { status: 'completed' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(logActivity, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// getActivityLogs
// ─────────────────────────────────────────────
describe('getActivityLogs', () => {
  it('returns activity logs for a plan', async () => {
    const logs = [
      { id: 'log-1', status: 'completed' },
      { id: 'log-2', status: 'skipped' },
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: [makePlanRow()] }) // verify plan
      .mockResolvedValueOnce({ rows: logs }); // logs query

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'plan-1' },
      query: {},
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityLogs, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.logs).toHaveLength(2);
  });

  it('returns 404 when plan not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { planId: 'nonexistent' },
      query: {},
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getActivityLogs, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// completeOnboarding
// ─────────────────────────────────────────────
describe('completeOnboarding', () => {
  it('completes onboarding when plan exists', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [makePlanRow()] }) // active plan check
      .mockResolvedValueOnce({ rows: [] }); // UPDATE users

    const req = createAuthReq({ userId: USER_ID });
    const res = createRes();
    const next = createNext();

    await callHandler(completeOnboarding, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.planId).toBe('plan-1');
  });

  it('returns 400 when no active plan', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID });
    const res = createRes();
    const next = createNext();

    await callHandler(completeOnboarding, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// createManualPlan
// ─────────────────────────────────────────────
describe('createManualPlan', () => {
  it('creates manual plan with activities', async () => {
    const goal = makeGoalRow();
    const plan = makePlanRow({ ai_generated: false });

    mockQuery
      .mockResolvedValueOnce({ rows: [goal] }) // INSERT goal
      .mockResolvedValueOnce({ rows: [plan] }); // INSERT plan

    const req = createAuthReq({ userId: USER_ID }, {
      body: {
        name: 'My Custom Plan',
        description: 'Custom workout routine',
        pillar: 'fitness',
        durationWeeks: 4,
        activities: [
          {
            title: 'Morning Run',
            type: 'workout',
            daysOfWeek: ['monday', 'wednesday', 'friday'],
            preferredTime: '07:00',
            duration: 30,
          },
        ],
      },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(createManualPlan, req, res, next);

    expect(getStatus(res)).toBe(201);
    expect(getJsonBody(res).data.plan).toBeDefined();
    expect(mockNotificationService.planUpdated).toHaveBeenCalled();
  });

  it('returns 400 when no activities provided', async () => {
    const req = createAuthReq({ userId: USER_ID }, {
      body: { name: 'Empty Plan', pillar: 'fitness', activities: [] },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(createManualPlan, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const req = createAuthReq({ userId: USER_ID }, {
      body: {
        pillar: 'fitness',
        activities: [{ title: 'Task 1', type: 'workout', daysOfWeek: ['monday'] }],
      },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(createManualPlan, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// generateAITasks
// ─────────────────────────────────────────────
describe('generateAITasks', () => {
  it('generates AI tasks from goal description', async () => {
    const mockLlm = {
      invoke: jest.fn<any>().mockResolvedValue({
        content: JSON.stringify({
          planName: 'Strength Plan',
          planDescription: 'Build muscle',
          tasks: [
            { title: 'Push-ups', type: 'workout', daysOfWeek: ['monday'], preferredTime: '08:00', duration: 15 },
            { title: 'Squats', type: 'workout', daysOfWeek: ['wednesday'], preferredTime: '08:00', duration: 15 },
          ],
        }),
      }),
    };
    mockModelFactory.getModel.mockReturnValue(mockLlm);

    const req = createAuthReq({ userId: USER_ID }, {
      body: {
        goalDescription: 'Build upper body strength',
        pillar: 'fitness',
        goalCategory: 'muscle_building',
        durationWeeks: 8,
      },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(generateAITasks, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.tasks).toHaveLength(2);
    expect(body.data.planName).toBe('Strength Plan');
  });

  it('returns default tasks when AI fails', async () => {
    const mockLlm = {
      invoke: jest.fn<any>().mockRejectedValue(new Error('AI unavailable')),
    };
    mockModelFactory.getModel.mockReturnValue(mockLlm);

    const req = createAuthReq({ userId: USER_ID }, {
      body: { goalDescription: 'Get fit', pillar: 'fitness' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(generateAITasks, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.tasks.length).toBeGreaterThan(0);
    expect(body.message).toContain('Default');
  });

  it('returns 400 when goalDescription is missing', async () => {
    const req = createAuthReq({ userId: USER_ID }, {
      body: { pillar: 'fitness' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(generateAITasks, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// generatePlan
// ─────────────────────────────────────────────
describe('generatePlan', () => {
  it('returns 400 when no active goals exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // no goals

    const req = createAuthReq({ userId: USER_ID }, {
      body: {},
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(generatePlan, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 409 when active plan exists without regenerate flag', async () => {
    const goal = makeGoalRow();
    const plan = makePlanRow();

    mockQuery
      .mockResolvedValueOnce({ rows: [goal] }) // goals
      .mockResolvedValueOnce({ rows: [] }) // preferences
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, gender: 'male', date_of_birth: null }] }) // user
      .mockResolvedValueOnce({ rows: [] }) // assessment
      .mockResolvedValueOnce({ rows: [plan] }); // existing active plan

    const req = createAuthReq({ userId: USER_ID }, {
      body: {},
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(generatePlan, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(409);
  });
});
