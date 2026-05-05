/**
 * Competitions Controller Unit Tests
 *
 * Tests: getActiveCompetitions, getCompetition, joinCompetition,
 *        leaveCompetition, getCompetitionLeaderboard, createCompetition,
 *        getAllCompetitions
 *
 * The competitions controller delegates to competitionService,
 * aiScoringService, and smartCompetitionService.
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks (BEFORE dynamic imports)
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Service-specific mocks
const mockCompetitionService = {
  getActiveCompetitions: jest.fn<any>(),
  getCompetition: jest.fn<any>(),
  joinCompetition: jest.fn<any>(),
  leaveCompetition: jest.fn<any>(),
  getCompetitionLeaderboard: jest.fn<any>(),
  updateCompetitionScores: jest.fn<any>(),
  createCompetition: jest.fn<any>(),
  getUserCompetitionEntries: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/competition.service.js', () => ({
  competitionService: mockCompetitionService,
}));

const mockAiScoringService = {
  hasScoresForDate: jest.fn<any>(),
  computeScoresForAllUsers: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: mockAiScoringService,
}));

const mockSmartCompetitionService = {
  isRecommendedForUser: jest.fn<any>(),
  getBuddiesInCompetition: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/smart-competition.service.js', () => ({
  smartCompetitionService: mockSmartCompetitionService,
}));

// 3. Dynamic imports (AFTER all mocks)
const {
  getActiveCompetitions,
  getCompetition,
  joinCompetition,
  leaveCompetition,
  getCompetitionLeaderboard,
  createCompetition,
  getAllCompetitions,
} = await import('../../../src/controllers/competitions.controller.js');

const {
  createAuthReq,
  createRes,
  createNext,
  callHandler,
  getJsonBody,
  getStatus,
  expectNextCalledWithError,
} = await import('../../helpers/controller-harness.js');

// ─── Setup ──────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Helper: build a competition object as returned by the service ───

function buildServiceCompetition(overrides: Record<string, any> = {}) {
  return {
    id: 'comp-1',
    name: 'January Challenge',
    type: 'standard',
    description: 'New year fitness challenge',
    startDate: new Date('2025-01-01T00:00:00Z'),
    endDate: new Date('2025-01-31T23:59:59Z'),
    status: 'active',
    rules: { minParticipants: 2 },
    eligibility: {},
    scoringWeights: { workout: 0.3 },
    antiCheatPolicy: {},
    prizeMetadata: {},
    createdBy: 'admin-1',
    createdAt: new Date('2024-12-15T00:00:00Z'),
    updatedAt: new Date('2024-12-15T00:00:00Z'),
    participantCount: 25,
    ...overrides,
  };
}

// ─── getActiveCompetitions ──────────────────────────────────────

describe('getActiveCompetitions', () => {
  it('should return active competitions for unauthenticated user', async () => {
    const comp = buildServiceCompetition();
    mockCompetitionService.getActiveCompetitions.mockResolvedValue({
      competitions: [comp],
      total: 1,
    });

    const req = createAuthReq({}, { user: undefined as any, query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActiveCompetitions, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.competitions).toHaveLength(1);
    expect(body.data.competitions[0].id).toBe('comp-1');
    expect(body.data.competitions[0].is_joined).toBe(false);
    expect(body.data.competitions[0].is_recommended).toBe(false);
    expect(body.data.competitions[0].buddies_joined).toBe(0);
    expect(body.data.pagination).toEqual({ total: 1, limit: 50, offset: 0 });
  });

  it('should mark joined competitions for authenticated user', async () => {
    const comp = buildServiceCompetition();
    mockCompetitionService.getActiveCompetitions.mockResolvedValue({
      competitions: [comp],
      total: 1,
    });
    mockCompetitionService.getUserCompetitionEntries.mockResolvedValue(['comp-1']);
    mockSmartCompetitionService.isRecommendedForUser.mockResolvedValue(true);
    mockSmartCompetitionService.getBuddiesInCompetition.mockResolvedValue(3);

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActiveCompetitions, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.competitions[0].is_joined).toBe(true);
    expect(body.data.competitions[0].is_recommended).toBe(true);
    expect(body.data.competitions[0].buddies_joined).toBe(3);
  });

  it('should handle getUserCompetitionEntries failure gracefully', async () => {
    const comp = buildServiceCompetition();
    mockCompetitionService.getActiveCompetitions.mockResolvedValue({
      competitions: [comp],
      total: 1,
    });
    mockCompetitionService.getUserCompetitionEntries.mockRejectedValue(
      new Error('DB error')
    );
    mockSmartCompetitionService.isRecommendedForUser.mockResolvedValue(false);
    mockSmartCompetitionService.getBuddiesInCompetition.mockResolvedValue(0);

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getActiveCompetitions, req, res, next);

    // Should not throw — logged warning and returned empty array
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.competitions[0].is_joined).toBe(false);
  });

  it('should apply status filter, limit and offset', async () => {
    mockCompetitionService.getActiveCompetitions.mockResolvedValue({
      competitions: [],
      total: 0,
    });

    const req = createAuthReq(
      {},
      { user: undefined as any, query: { status: 'active', limit: '10', offset: '5' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getActiveCompetitions, req, res, next);

    expect(mockCompetitionService.getActiveCompetitions).toHaveBeenCalledWith(
      'active',
      10,
      5
    );
    const body = getJsonBody(res);
    expect(body.data.pagination).toEqual({ total: 0, limit: 10, offset: 5 });
  });

  it('should clamp limit to max 200', async () => {
    mockCompetitionService.getActiveCompetitions.mockResolvedValue({
      competitions: [],
      total: 0,
    });

    const req = createAuthReq(
      {},
      { user: undefined as any, query: { limit: '999' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getActiveCompetitions, req, res, next);

    expect(mockCompetitionService.getActiveCompetitions).toHaveBeenCalledWith(
      undefined,
      200,
      0
    );
  });
});

// ─── getCompetition ─────────────────────────────────────────────

describe('getCompetition', () => {
  it('should return competition by ID', async () => {
    const comp = buildServiceCompetition();
    mockCompetitionService.getCompetition.mockResolvedValue(comp);

    const req = createAuthReq({}, { params: { id: 'comp-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getCompetition, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.competition).toBeDefined();
    expect(body.message).toBe('Competition retrieved successfully');
  });

  it('should return 404 when competition is not found', async () => {
    mockCompetitionService.getCompetition.mockResolvedValue(null);

    const req = createAuthReq({}, { params: { id: 'nonexistent' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getCompetition, req, res, next);

    expectNextCalledWithError(next, 404);
  });
});

// ─── joinCompetition ────────────────────────────────────────────

describe('joinCompetition', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any, params: { id: 'comp-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(joinCompetition, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should join competition and return 201', async () => {
    const entry = {
      id: 'entry-1',
      userId: 'user-1',
      competitionId: 'comp-1',
      status: 'active',
    };
    mockCompetitionService.joinCompetition.mockResolvedValue(entry);

    const req = createAuthReq(
      { userId: 'user-1' },
      { params: { id: 'comp-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(joinCompetition, req, res, next);

    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.entry).toEqual(entry);
    expect(body.message).toBe('Joined competition successfully');
    expect(mockCompetitionService.joinCompetition).toHaveBeenCalledWith('user-1', 'comp-1');
  });

  it('should propagate service errors via next()', async () => {
    mockCompetitionService.joinCompetition.mockRejectedValue(
      new Error('Competition is full')
    );

    const req = createAuthReq(
      { userId: 'user-1' },
      { params: { id: 'comp-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(joinCompetition, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('Competition is full');
  });
});

// ─── leaveCompetition ───────────────────────────────────────────

describe('leaveCompetition', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any, params: { id: 'comp-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(leaveCompetition, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should leave competition successfully', async () => {
    mockCompetitionService.leaveCompetition.mockResolvedValue(undefined);

    const req = createAuthReq(
      { userId: 'user-1' },
      { params: { id: 'comp-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(leaveCompetition, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
    expect(body.message).toBe('Left competition successfully');
    expect(mockCompetitionService.leaveCompetition).toHaveBeenCalledWith('user-1', 'comp-1');
  });
});

// ─── getCompetitionLeaderboard ──────────────────────────────────

describe('getCompetitionLeaderboard', () => {
  it('should return 404 when competition is not found', async () => {
    mockCompetitionService.getCompetition.mockResolvedValue(null);

    const req = createAuthReq({}, { params: { id: 'nonexistent' }, query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getCompetitionLeaderboard, req, res, next);

    expectNextCalledWithError(next, 404);
  });

  it('should return leaderboard with ranks in snake_case format', async () => {
    const comp = buildServiceCompetition({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-02'),
    });
    mockCompetitionService.getCompetition.mockResolvedValue(comp);

    // hasScoresForDate: both days have scores already
    mockAiScoringService.hasScoresForDate.mockResolvedValue(true);

    mockCompetitionService.updateCompetitionScores.mockResolvedValue({ updatedCount: 2 });
    mockCompetitionService.getCompetitionLeaderboard.mockResolvedValue({
      entries: [
        {
          userId: 'user-1',
          currentRank: 1,
          currentScore: 95,
          user: { firstName: 'John', lastName: 'Doe' },
        },
        {
          userId: 'user-2',
          currentRank: 2,
          currentScore: 80,
          user: { firstName: 'Jane', lastName: 'Smith' },
        },
      ],
      total: 2,
    });

    const req = createAuthReq(
      {},
      { params: { id: 'comp-1' }, query: { limit: '50', offset: '0' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getCompetitionLeaderboard, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('competition');
    expect(body.data.segment).toBe('comp-1');
    expect(body.data.ranks).toHaveLength(2);

    // Verify snake_case rank shape
    const firstRank = body.data.ranks[0];
    expect(firstRank.user_id).toBe('user-1');
    expect(firstRank.rank).toBe(1);
    expect(firstRank.total_score).toBe(95);
    expect(firstRank.component_scores).toBeDefined();

    expect(body.data.pagination).toEqual({ total: 2, limit: 50, offset: 0 });
  });

  it('should compute missing daily scores before returning leaderboard', async () => {
    const comp = buildServiceCompetition({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-03'),
    });
    mockCompetitionService.getCompetition.mockResolvedValue(comp);

    // First day has scores, second and third do not
    mockAiScoringService.hasScoresForDate
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    mockAiScoringService.computeScoresForAllUsers.mockResolvedValue(5);

    mockCompetitionService.updateCompetitionScores.mockResolvedValue({ updatedCount: 0 });
    mockCompetitionService.getCompetitionLeaderboard.mockResolvedValue({
      entries: [],
      total: 0,
    });

    const req = createAuthReq({}, { params: { id: 'comp-1' }, query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getCompetitionLeaderboard, req, res, next);

    // computeScoresForAllUsers called for the 2 days missing scores
    expect(mockAiScoringService.computeScoresForAllUsers).toHaveBeenCalledTimes(2);
    expect(mockCompetitionService.updateCompetitionScores).toHaveBeenCalledWith('comp-1');
  });
});

// ─── createCompetition ──────────────────────────────────────────

describe('createCompetition', () => {
  it('should return 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { user: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(createCompetition, req, res, next);

    expectNextCalledWithError(next, 401);
  });

  it('should create competition and return 201', async () => {
    const createdComp = buildServiceCompetition({ id: 'new-comp' });
    mockCompetitionService.createCompetition.mockResolvedValue(createdComp);

    const req = createAuthReq(
      { userId: 'admin-1' },
      {
        body: {
          name: 'February Challenge',
          type: 'standard',
          description: 'A new challenge',
          startDate: '2025-02-01T00:00:00Z',
          endDate: '2025-02-28T23:59:59Z',
          rules: { minParticipants: 5 },
        },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createCompetition, req, res, next);

    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.competition).toBeDefined();
    expect(body.message).toBe('Competition created successfully');

    // Verify service was called with correct shape
    expect(mockCompetitionService.createCompetition).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'February Challenge',
        type: 'standard',
        status: 'draft',
        createdBy: 'admin-1',
        eligibility: {},
        scoringWeights: {},
        antiCheatPolicy: {},
        prizeMetadata: {},
      })
    );
  });

  it('should pass through optional fields when provided', async () => {
    const createdComp = buildServiceCompetition();
    mockCompetitionService.createCompetition.mockResolvedValue(createdComp);

    const req = createAuthReq(
      { userId: 'admin-1' },
      {
        body: {
          name: 'Pro Challenge',
          type: 'premium',
          description: 'Premium only',
          startDate: '2025-03-01',
          endDate: '2025-03-31',
          rules: {},
          eligibility: { plan: 'pro' },
          scoringWeights: { workout: 0.5, nutrition: 0.5 },
          antiCheatPolicy: { maxDailySteps: 50000 },
          prizeMetadata: { prize: '$100' },
        },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createCompetition, req, res, next);

    expect(mockCompetitionService.createCompetition).toHaveBeenCalledWith(
      expect.objectContaining({
        eligibility: { plan: 'pro' },
        scoringWeights: { workout: 0.5, nutrition: 0.5 },
        antiCheatPolicy: { maxDailySteps: 50000 },
        prizeMetadata: { prize: '$100' },
      })
    );
  });
});

// ─── getAllCompetitions ──────────────────────────────────────────

describe('getAllCompetitions', () => {
  it('should return empty competitions array', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getAllCompetitions, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.competitions).toEqual([]);
    expect(body.message).toBe('Competitions retrieved successfully');
  });
});
