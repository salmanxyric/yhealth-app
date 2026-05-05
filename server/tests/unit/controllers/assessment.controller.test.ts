/**
 * Assessment Controller Unit Tests
 *
 * Tests: selectGoal, selectMode, getQuestions, submitQuickAssessment,
 * sendDeepMessage, completeDeepAssessment, switchMode, getSuggestedGoals,
 * createGoal, getGoals, commitToGoal, deleteGoal, deleteGoals,
 * getGoalActions, toggleGoalAction, getGoalAutoProgress.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupQueueMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery, mockTransaction } = setupDbMock();
setupLoggerMock();
setupCacheMock();
setupQueueMock();

// ── Service mocks ──
const mockNotificationService = {
  goalCreated: jest.fn<any>().mockResolvedValue(undefined),
  goalProgressUpdated: jest.fn<any>().mockResolvedValue(undefined),
  goalCompleted: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/notification.service.js', () => ({
  notificationService: mockNotificationService,
}));

const mockGoalDecompositionService = {
  getActionsWithDailyStatus: jest.fn<any>(),
  getOrCreateActionsForUserGoal: jest.fn<any>(),
  toggleActionCompletion: jest.fn<any>(),
};
jest.unstable_mockModule('../../../src/services/goal-decomposition.service.js', () => ({
  goalDecompositionService: mockGoalDecompositionService,
}));

const mockAutoProgressService = {
  calculateForUserGoal: jest.fn<any>(),
};
jest.unstable_mockModule('../../../src/services/auto-progress.service.js', () => ({
  autoProgressService: mockAutoProgressService,
}));

const mockEmbeddingQueueService = {
  enqueueEmbedding: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/embedding-queue.service.js', () => ({
  embeddingQueueService: mockEmbeddingQueueService,
}));

// ── Dynamic imports AFTER mocks ──
const {
  selectGoal,
  selectMode,
  getQuestions,
  submitQuickAssessment,
  sendDeepMessage,
  completeDeepAssessment: _completeDeepAssessment,
  switchMode,
  getSuggestedGoals: _getSuggestedGoals,
  createGoal,
  getGoals,
  commitToGoal,
  deleteGoal,
  deleteGoals,
  getGoalActions,
  toggleGoalAction,
  getGoalAutoProgress,
} = await import('../../../src/controllers/assessment.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
  mockTransaction.mockImplementation(
    async (cb: (client: any) => Promise<unknown>) => cb({ query: mockQuery, release: jest.fn() })
  );
  mockNotificationService.goalCreated.mockResolvedValue(undefined);
  mockNotificationService.goalProgressUpdated.mockResolvedValue(undefined);
  mockNotificationService.goalCompleted.mockResolvedValue(undefined);
  mockEmbeddingQueueService.enqueueEmbedding.mockResolvedValue(undefined);
});

// ── Helpers ──
const USER_ID = 'test-user-id';

function makeAssessmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'assess-1',
    user_id: USER_ID,
    assessment_type: 'quick',
    goal_category: 'weight_loss',
    responses: [],
    conversation_transcript: null,
    extracted_insights: null,
    baseline_data: {},
    body_stats: null,
    is_complete: false,
    completed_at: null,
    time_spent_seconds: null,
    switched_from_mode: null,
    switched_at: null,
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
    custom_goal_text: null,
    pillar: 'fitness',
    is_primary: true,
    title: 'Lose 10 lbs',
    description: 'Weight loss goal',
    target_value: 10,
    target_unit: 'lbs',
    current_value: 0,
    start_value: 0,
    start_date: new Date('2025-01-01'),
    target_date: new Date('2025-04-01'),
    duration_weeks: 12,
    milestones: [],
    motivation: 'Feel better',
    confidence_level: 8,
    status: 'draft',
    progress: 0,
    is_safety_checked: true,
    safety_warnings: [],
    requires_doctor_consult: false,
    ai_suggested: false,
    ai_confidence_score: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// selectGoal
// ─────────────────────────────────────────────
describe('selectGoal', () => {
  it('creates a new assessment when none exists', async () => {
    const newAssessment = makeAssessmentRow();
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] }) // user check
      .mockResolvedValueOnce({ rows: [] }) // no existing assessment
      .mockResolvedValueOnce({ rows: [newAssessment] }); // INSERT

    const req = createAuthReq({ userId: USER_ID }, {
      body: { category: 'weight_loss' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(selectGoal, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.goalCategory).toBe('weight_loss');
    expect(body.data.pillar).toBe('fitness');
    expect(body.data.nextStep).toBe('select_mode');
  });

  it('updates existing incomplete assessment', async () => {
    const existing = makeAssessmentRow();
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] }) // user check
      .mockResolvedValueOnce({ rows: [existing] }) // existing assessment
      .mockResolvedValueOnce({ rows: [{ ...existing, goal_category: 'muscle_building' }] }); // UPDATE

    const req = createAuthReq({ userId: USER_ID }, {
      body: { category: 'muscle_building' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(selectGoal, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.goalCategory).toBe('muscle_building');
  });

  it('returns 401 when not authenticated', async () => {
    const req = createReq({ body: { category: 'weight_loss' } });
    const res = createRes();
    const next = createNext();

    await callHandler(selectGoal, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // user not found

    const req = createAuthReq({ userId: USER_ID }, {
      body: { category: 'weight_loss' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(selectGoal, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// selectMode
// ─────────────────────────────────────────────
describe('selectMode', () => {
  it('updates assessment mode to deep', async () => {
    const assessment = makeAssessmentRow();
    mockQuery
      .mockResolvedValueOnce({ rows: [assessment] }) // find assessment
      .mockResolvedValueOnce({ rows: [{ ...assessment, assessment_type: 'deep' }] }); // UPDATE

    const req = createAuthReq({ userId: USER_ID }, {
      body: { mode: 'deep' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(selectMode, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.mode).toBe('deep');
  });

  it('returns 400 when no active assessment', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID }, {
      body: { mode: 'quick' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(selectMode, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// getQuestions
// ─────────────────────────────────────────────
describe('getQuestions', () => {
  it('returns sample questions when no DB questions exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [makeAssessmentRow()] }) // assessment
      .mockResolvedValueOnce({ rows: [] }); // no DB questions

    const req = createAuthReq({ userId: USER_ID });
    const res = createRes();
    const next = createNext();

    await callHandler(getQuestions, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.questions.length).toBeGreaterThan(0);
    expect(body.data.totalQuestions).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// submitQuickAssessment
// ─────────────────────────────────────────────
describe('submitQuickAssessment', () => {
  it('completes assessment with valid responses', async () => {
    const assessment = makeAssessmentRow();
    const completedAssessment = makeAssessmentRow({
      is_complete: true,
      completed_at: new Date(),
    });

    mockQuery.mockResolvedValueOnce({ rows: [assessment] }); // find assessment
    // transaction mock uses mockQuery for client.query calls
    mockQuery
      .mockResolvedValueOnce({ rows: [completedAssessment] }) // UPDATE assessment
      .mockResolvedValueOnce({ rows: [] }); // UPDATE users

    const responses = Array.from({ length: 6 }, (_, i) => ({
      questionId: `q${i + 1}`,
      value: `answer${i + 1}`,
    }));

    const req = createAuthReq({ userId: USER_ID }, {
      body: { responses, bodyStats: { heightCm: 175, weightKg: 80 } },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(submitQuickAssessment, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.nextStep).toBe('goal_setup');
  });

  it('returns 400 with fewer than 6 responses', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [makeAssessmentRow()] });

    const req = createAuthReq({ userId: USER_ID }, {
      body: { responses: [{ questionId: 'q1', value: 'a1' }] },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(submitQuickAssessment, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// sendDeepMessage
// ─────────────────────────────────────────────
describe('sendDeepMessage', () => {
  it('returns AI response for deep assessment message', async () => {
    const assessment = makeAssessmentRow({
      assessment_type: 'deep',
      conversation_transcript: [],
    });
    mockQuery
      .mockResolvedValueOnce({ rows: [assessment] }) // find assessment
      .mockResolvedValueOnce({ rows: [] }); // UPDATE transcript

    const req = createAuthReq({ userId: USER_ID }, {
      body: { message: 'I want to lose weight' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(sendDeepMessage, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.aiResponse).toBeDefined();
  });
});

// ─────────────────────────────────────────────
// switchMode
// ─────────────────────────────────────────────
describe('switchMode', () => {
  it('switches from quick to deep', async () => {
    const assessment = makeAssessmentRow({ assessment_type: 'quick' });
    mockQuery
      .mockResolvedValueOnce({ rows: [assessment] }) // find
      .mockResolvedValueOnce({
        rows: [{ ...assessment, assessment_type: 'deep', switched_from_mode: 'quick' }],
      }); // UPDATE

    const req = createAuthReq({ userId: USER_ID }, {
      body: { targetMode: 'deep' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(switchMode, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.previousMode).toBe('quick');
    expect(data.currentMode).toBe('deep');
  });
});

// ─────────────────────────────────────────────
// createGoal
// ─────────────────────────────────────────────
describe('createGoal', () => {
  it('creates a new goal successfully', async () => {
    const goal = makeGoalRow();
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] }); // count check
    // transaction: unset primary + INSERT
    mockQuery
      .mockResolvedValueOnce({ rows: [goal] }); // INSERT

    const req = createAuthReq({ userId: USER_ID }, {
      body: {
        category: 'weight_loss',
        pillar: 'fitness',
        isPrimary: false,
        title: 'Lose 10 lbs',
        description: 'Weight loss goal',
        targetValue: 10,
        targetUnit: 'lbs',
        currentValue: 0,
        timeline: {
          startDate: '2025-01-01',
          targetDate: '2025-04-01',
          durationWeeks: 12,
        },
        motivation: 'Feel better',
      },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(createGoal, req, res, next);

    expect(getStatus(res)).toBe(201);
    expect(getJsonBody(res).data.goal).toBeDefined();
  });

  it('returns 400 when max goals reached', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] }); // at limit

    const req = createAuthReq({ userId: USER_ID }, {
      body: {
        category: 'weight_loss',
        pillar: 'fitness',
        title: 'Another goal',
        description: 'Too many',
        targetValue: 5,
        targetUnit: 'lbs',
        timeline: { startDate: '2025-01-01', targetDate: '2025-04-01', durationWeeks: 12 },
        motivation: 'Test',
      },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(createGoal, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// getGoals
// ─────────────────────────────────────────────
describe('getGoals', () => {
  it('returns all user goals', async () => {
    const goals = [makeGoalRow(), makeGoalRow({ id: 'goal-2', title: 'Build muscle' })];
    mockQuery.mockResolvedValueOnce({ rows: goals });

    const req = createAuthReq({ userId: USER_ID }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getGoals, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.goals).toHaveLength(2);
  });

  it('filters goals by status', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [makeGoalRow({ status: 'active' })] });

    const req = createAuthReq({ userId: USER_ID }, { query: { status: 'active' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getGoals, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.goals).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────
// commitToGoal
// ─────────────────────────────────────────────
describe('commitToGoal', () => {
  it('activates goal with high confidence', async () => {
    const goal = makeGoalRow({ confidence_level: 8 });
    mockQuery
      .mockResolvedValueOnce({ rows: [goal] }) // find goal
      .mockResolvedValueOnce({ rows: [{ ...goal, confidence_level: 9 }] }) // update confidence
      .mockResolvedValueOnce({ rows: [{ ...goal, status: 'active' }] }); // activate

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'goal-1' },
      body: { confidenceLevel: 9, acknowledgedSafetyWarnings: true },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(commitToGoal, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.goal).toBeDefined();
    expect(getJsonBody(res).data.nextStep).toBe('integrations');
  });

  it('suggests refinement for low confidence', async () => {
    const goal = makeGoalRow();
    mockQuery
      .mockResolvedValueOnce({ rows: [goal] }) // find goal
      .mockResolvedValueOnce({ rows: [{ ...goal, confidence_level: 5 }] }); // update confidence

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'goal-1' },
      body: { confidenceLevel: 5 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(commitToGoal, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.needsRefinement).toBe(true);
  });

  it('returns 404 when goal not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'nonexistent' },
      body: { confidenceLevel: 8 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(commitToGoal, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// deleteGoal
// ─────────────────────────────────────────────
describe('deleteGoal', () => {
  it('deletes an existing goal', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [makeGoalRow()] }) // find goal
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // DELETE

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'goal-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(deleteGoal, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.deleted).toBe(true);
    expect(mockEmbeddingQueueService.enqueueEmbedding).toHaveBeenCalled();
  });

  it('returns 404 when goal not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'nonexistent' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(deleteGoal, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// deleteGoals (bulk)
// ─────────────────────────────────────────────
describe('deleteGoals', () => {
  it('deletes multiple goals', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'g1' }, { id: 'g2' }] }) // verify ownership
      .mockResolvedValueOnce({ rows: [], rowCount: 2 }); // DELETE

    const req = createAuthReq({ userId: USER_ID }, {
      body: { goalIds: ['g1', 'g2'] },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(deleteGoals, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.count).toBe(2);
    expect(mockEmbeddingQueueService.enqueueEmbedding).toHaveBeenCalledTimes(2);
  });

  it('returns 400 with empty goalIds', async () => {
    const req = createAuthReq({ userId: USER_ID }, {
      body: { goalIds: [] },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(deleteGoals, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// getGoalActions
// ─────────────────────────────────────────────
describe('getGoalActions', () => {
  it('returns existing actions', async () => {
    const actions = [{ id: 'a1', title: 'Walk 30 min' }];
    mockGoalDecompositionService.getActionsWithDailyStatus.mockResolvedValueOnce(actions);

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'goal-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getGoalActions, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.actions).toEqual(actions);
    expect(getJsonBody(res).data.generated).toBe(false);
  });

  it('generates actions when none exist', async () => {
    const generatedActions = [{ id: 'a1', title: 'Run' }];
    mockGoalDecompositionService.getActionsWithDailyStatus
      .mockResolvedValueOnce([]) // first call: empty
      .mockResolvedValueOnce(generatedActions); // after generation
    mockGoalDecompositionService.getOrCreateActionsForUserGoal.mockResolvedValueOnce(undefined);

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'goal-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getGoalActions, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.generated).toBe(true);
    expect(mockGoalDecompositionService.getOrCreateActionsForUserGoal).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// toggleGoalAction
// ─────────────────────────────────────────────
describe('toggleGoalAction', () => {
  it('toggles action completion', async () => {
    mockGoalDecompositionService.toggleActionCompletion.mockResolvedValueOnce(true);

    const req = createAuthReq({ userId: USER_ID }, {
      params: { actionId: 'act-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(toggleGoalAction, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.completed).toBe(true);
  });
});

// ─────────────────────────────────────────────
// getGoalAutoProgress
// ─────────────────────────────────────────────
describe('getGoalAutoProgress', () => {
  it('returns auto-calculated progress', async () => {
    const progress = { percent: 45, completedActions: 9, totalActions: 20 };
    mockAutoProgressService.calculateForUserGoal.mockResolvedValueOnce(progress);

    const req = createAuthReq({ userId: USER_ID }, {
      params: { goalId: 'goal-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getGoalAutoProgress, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.progress).toEqual(progress);
  });
});
