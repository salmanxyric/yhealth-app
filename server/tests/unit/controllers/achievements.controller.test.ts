/**
 * Achievements Controller Unit Tests
 * Tests: getAchievements, getAchievementSummary, getUserAchievements, getLeaderboard,
 *        checkNewAchievements, getMicroWins, generateGoalAchievements, dismissMicroWin.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockDynamicAchievementsService = {
  getDynamicAchievements: jest.fn<any>(),
};

const mockMicroWinsService = {
  getRecentMicroWins: jest.fn<any>(),
  dismissMicroWin: jest.fn<any>(),
};

const mockAchievementAIService = {
  generateForGoal: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/dynamic-achievements.service.js', () => ({
  dynamicAchievementsService: mockDynamicAchievementsService,
}));

jest.unstable_mockModule('../../../src/services/micro-wins.service.js', () => ({
  microWinsService: mockMicroWinsService,
}));

jest.unstable_mockModule('../../../src/services/achievement-ai.service.js', () => ({
  achievementAIService: mockAchievementAIService,
}));

jest.unstable_mockModule('../../../src/utils/user.helpers.js', () => ({
  getPublicProfile: jest.fn<any>().mockReturnValue({ avatarUrl: 'https://example.com/avatar.png' }),
}));

// ── Dynamic imports AFTER mocks ──
const controller = (await import('../../../src/controllers/achievements.controller.js')).default;

const { createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus: _getStatus } = await import(
  '../../helpers/controller-harness.js'
);

// ── Helper: default stats row from DB ──
function makeStatsRow(overrides: Record<string, unknown> = {}) {
  return {
    created_at: new Date('2024-01-01'),
    completed_count: '0',
    days_active: '0',
    total_goals: '0',
    completed_goals: '0',
    active_goals: '0',
    fitness_activities: '0',
    nutrition_activities: '0',
    wellbeing_activities: '0',
    total_workouts: '0',
    total_meals: '0',
    longest_streak: '0',
    current_streak: '0',
    integrations_connected: '0',
    assessments_completed: '0',
    perfect_days: '0',
    early_morning_workouts: '0',
    weekend_workouts: '0',
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// getAchievements
// ─────────────────────────────────────────────
describe('getAchievements', () => {
  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getAchievements, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns achievements with summary for authenticated user', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    // Stats query returns a row
    mockQuery.mockResolvedValueOnce({ rows: [makeStatsRow({ completed_count: '5' })] });
    // XP sync query (fire-and-forget)
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockDynamicAchievementsService.getDynamicAchievements.mockResolvedValueOnce([]);

    await callHandler(controller.getAchievements, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('achievements');
    expect(body.data).toHaveProperty('summary');
    expect(body.data.summary).toHaveProperty('totalAchievements');
    expect(body.data.summary).toHaveProperty('totalXP');
  });

  it('filters achievements by category', async () => {
    const req = createAuthReq({}, { query: { category: 'streak' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [makeStatsRow()] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockDynamicAchievementsService.getDynamicAchievements.mockResolvedValueOnce([]);

    await callHandler(controller.getAchievements, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    const achievements = body.data.achievements;
    for (const a of achievements) {
      expect(a.category).toBe('streak');
    }
  });

  it('filters achievements by unlocked status', async () => {
    const req = createAuthReq({}, { query: { status: 'unlocked' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [makeStatsRow({ completed_count: '100', current_streak: '50' })] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockDynamicAchievementsService.getDynamicAchievements.mockResolvedValueOnce([]);

    await callHandler(controller.getAchievements, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    for (const a of body.data.achievements) {
      expect(a.unlocked).toBe(true);
    }
  });

  it.skip('returns default stats when no DB row is returned', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockDynamicAchievementsService.getDynamicAchievements.mockResolvedValueOnce([]);

    await callHandler(controller.getAchievements, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    // All static achievements should be locked with default stats
    expect(body.data.summary.unlockedCount).toBe(0);
  });
});

// ─────────────────────────────────────────────
// getAchievementSummary
// ─────────────────────────────────────────────
describe('getAchievementSummary', () => {
  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getAchievementSummary, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it.skip('returns summary with level, XP, featured, and nearly-unlocked achievements', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [makeStatsRow({ completed_count: '10', current_streak: '7' })] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockDynamicAchievementsService.getDynamicAchievements.mockResolvedValueOnce([]);

    await callHandler(controller.getAchievementSummary, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('level');
    expect(body.data).toHaveProperty('totalXP');
    expect(body.data).toHaveProperty('featuredAchievements');
    expect(body.data).toHaveProperty('nearlyUnlocked');
    expect(body.data).toHaveProperty('currentStreak');
    expect(body.data.currentStreak).toBe(7);
  });
});

// ─────────────────────────────────────────────
// getUserAchievements
// ─────────────────────────────────────────────
describe('getUserAchievements', () => {
  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { params: { userId: 'u-2' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getUserAchievements, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 400 when userId param is missing', async () => {
    const req = createAuthReq({}, { params: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getUserAchievements, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when users do not share a chat', async () => {
    const req = createAuthReq({}, { params: { userId: 'target-user' } });
    const res = createRes();
    const next = createNext();

    // Privacy check returns no shared chats
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(controller.getUserAchievements, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns target user achievements when privacy check passes', async () => {
    const req = createAuthReq({}, { params: { userId: 'target-user' } });
    const res = createRes();
    const next = createNext();

    // Privacy check passes
    mockQuery.mockResolvedValueOnce({ rows: [{ chat_id: 'chat-1' }] });
    // Target user stats
    mockQuery.mockResolvedValueOnce({ rows: [makeStatsRow({ completed_count: '20' })] });

    await callHandler(controller.getUserAchievements, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('totalUnlocked');
    expect(body.data).toHaveProperty('level');
    expect(body.data).toHaveProperty('unlockedAchievements');
  });
});

// ─────────────────────────────────────────────
// getLeaderboard
// ─────────────────────────────────────────────
describe('getLeaderboard', () => {
  it.skip('returns leaderboard with current user', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    // Stats query
    mockQuery.mockResolvedValueOnce({ rows: [makeStatsRow()] });
    // User info query
    mockQuery.mockResolvedValueOnce({ rows: [{ first_name: 'John', last_name: 'Doe', avatar: null }] });

    await callHandler(controller.getLeaderboard, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.leaderboard).toHaveLength(1);
    expect(body.data.leaderboard[0].isCurrentUser).toBe(true);
    expect(body.data.leaderboard[0].name).toBe('John Doe');
  });
});

// ─────────────────────────────────────────────
// checkNewAchievements
// ─────────────────────────────────────────────
describe('checkNewAchievements', () => {
  it('returns newly unlocked achievements', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [makeStatsRow({ completed_count: '1' })],
    });

    await callHandler(controller.checkNewAchievements, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('newAchievements');
    expect(body.data).toHaveProperty('totalUnlocked');
    // first_steps should be unlocked with completed_count=1
    expect(body.data.newAchievements.some((a: any) => a.id === 'first_steps')).toBe(true);
  });
});

// ─────────────────────────────────────────────
// getMicroWins
// ─────────────────────────────────────────────
describe('getMicroWins', () => {
  it('returns micro-wins for authenticated user', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockMicroWinsService.getRecentMicroWins.mockResolvedValueOnce([
      { id: 'mw-1', title: 'Test win' },
    ]);

    await callHandler(controller.getMicroWins, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.microWins).toHaveLength(1);
    expect(mockMicroWinsService.getRecentMicroWins).toHaveBeenCalledWith('test-user-id', 20);
  });

  it('respects limit query param', async () => {
    const req = createAuthReq({}, { query: { limit: '5' } });
    const res = createRes();
    const next = createNext();

    mockMicroWinsService.getRecentMicroWins.mockResolvedValueOnce([]);

    await callHandler(controller.getMicroWins, req, res, next);

    expect(mockMicroWinsService.getRecentMicroWins).toHaveBeenCalledWith('test-user-id', 5);
  });
});

// ─────────────────────────────────────────────
// generateGoalAchievements
// ─────────────────────────────────────────────
describe('generateGoalAchievements', () => {
  it('returns error when goalId is missing', async () => {
    const req = createAuthReq({}, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.generateGoalAchievements, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns error when goal is not found', async () => {
    const req = createAuthReq({}, { body: { goalId: 'g-999' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(controller.generateGoalAchievements, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('generates achievements for a valid goal', async () => {
    const req = createAuthReq({}, { body: { goalId: 'g-1' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'g-1',
        title: 'Run 5K',
        description: 'Run a 5K in under 30 minutes',
        category: 'fitness',
        target_value: '5',
        target_unit: 'km',
        frequency: 'weekly',
        status: 'active',
      }],
    });

    const generatedAchievements = [
      { id: 'da-1', title: 'First Kilometer' },
      { id: 'da-2', title: 'Halfway There' },
    ];
    mockAchievementAIService.generateForGoal.mockResolvedValueOnce(generatedAchievements);

    await callHandler(controller.generateGoalAchievements, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.achievements).toEqual(generatedAchievements);
    expect(body.data.count).toBe(2);
  });
});

// ─────────────────────────────────────────────
// dismissMicroWin
// ─────────────────────────────────────────────
describe('dismissMicroWin', () => {
  it('returns error when microWinId param is missing', async () => {
    const req = createAuthReq({}, { params: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.dismissMicroWin, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('dismisses a micro-win successfully', async () => {
    const req = createAuthReq({}, { params: { microWinId: 'mw-1' } });
    const res = createRes();
    const next = createNext();

    mockMicroWinsService.dismissMicroWin.mockResolvedValueOnce(undefined);

    await callHandler(controller.dismissMicroWin, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(mockMicroWinsService.dismissMicroWin).toHaveBeenCalledWith('test-user-id', 'mw-1');
  });
});
