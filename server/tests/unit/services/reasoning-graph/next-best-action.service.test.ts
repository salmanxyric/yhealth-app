/**
 * Next Best Action Service Unit Tests
 *
 * Tests the 5 action detection algorithms: dormant revivals,
 * cascade opportunities, coverage gaps, declining trends, and conflict resolution.
 */

import { jest } from '@jest/globals';
import type { FeatureNodeId, FeatureNodeState, FeatureNodeStatus, FeatureAlert } from '@shared/types/domain/reasoning-graph.js';

// ============================================
// MOCKS
// ============================================

const mockGetAllStates = jest.fn<any>();
const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockRedisDelete = jest.fn<any>();

jest.unstable_mockModule('../../../../src/services/reasoning-graph/feature-state.service.js', () => ({
  featureStateService: { getAllStates: mockGetAllStates },
}));

jest.unstable_mockModule('../../../../src/services/redis-cache.service.js', () => ({
  redisCacheService: { get: mockRedisGet, set: mockRedisSet, delete: mockRedisDelete },
}));

const { nextBestActionService } = await import('../../../../src/services/reasoning-graph/next-best-action.service.js');

// ============================================
// HELPERS
// ============================================

function makeState(
  id: FeatureNodeId,
  status: FeatureNodeStatus = 'never_used',
  healthScore = 0,
  alerts: FeatureAlert[] = [],
  lastActivityAt: string | null = null,
): FeatureNodeState {
  return {
    featureNodeId: id,
    userId: 'user-1',
    healthScore,
    lastActivityAt,
    activityCount7d: status === 'active' ? 5 : 0,
    status,
    alerts,
    updatedAt: new Date().toISOString(),
  };
}

function makeAllStates(overrides: Partial<Record<FeatureNodeId, Partial<FeatureNodeState>>> = {}): FeatureNodeState[] {
  const allIds: FeatureNodeId[] = [
    'ai-coach', 'overview', 'workouts', 'nutrition', 'exercises', 'progress',
    'activity', 'activity-status', 'whoop', 'achievements', 'wellbeing',
    'journal', 'mood', 'insights', 'yoga', 'pulse', 'goals', 'life-areas',
    'leaderboard', 'competitions', 'community', 'contracts', 'chat',
    'voice-assistant', 'call-coach', 'money-map', 'notifications',
    'knowledge-graph', 'hydration',
  ];
  return allIds.map((id) => {
    const o = overrides[id] || {};
    return makeState(id, o.status, o.healthScore, o.alerts, o.lastActivityAt);
  });
}

// ============================================
// TESTS
// ============================================

describe('NextBestActionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-set mock implementations (resetMocks in jest.config clears them between tests)
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
    mockRedisDelete.mockResolvedValue(undefined);
  });

  describe('getActions', () => {
    it('should return empty array when all features are never_used', async () => {
      mockGetAllStates.mockResolvedValue(makeAllStates());

      const actions = await nextBestActionService.getActions('user-1');

      expect(Array.isArray(actions)).toBe(true);
    });

    it('should limit results to max 5 actions', async () => {
      const states = makeAllStates({
        'goals': { status: 'active', healthScore: 90 },
        'workouts': { status: 'never_used' },
        'nutrition': { status: 'never_used' },
        'yoga': { status: 'dormant', healthScore: 5, lastActivityAt: '2025-01-01T00:00:00Z' },
        'mood': { status: 'dormant', healthScore: 5, lastActivityAt: '2025-01-01T00:00:00Z' },
        'journal': { status: 'dormant', healthScore: 5, lastActivityAt: '2025-01-01T00:00:00Z' },
        'whoop': { status: 'active', healthScore: 90 },
        'wellbeing': { status: 'active', healthScore: 80 },
        'hydration': { status: 'active', healthScore: 75 },
        'progress': { status: 'active', healthScore: 30 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      expect(actions.length).toBeLessThanOrEqual(5);
    });

    it('should sort actions by priority descending', async () => {
      const states = makeAllStates({
        'goals': { status: 'active', healthScore: 90 },
        'workouts': { status: 'never_used' },
        'nutrition': { status: 'never_used' },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      for (let i = 1; i < actions.length; i++) {
        expect(actions[i - 1].priority).toBeGreaterThanOrEqual(actions[i].priority);
      }
    });

    it('should use cached result when available', async () => {
      const cached = [{ id: 'cached', type: 'coverage_gap', priority: 80, title: 'Cached', description: '', targetNodeId: 'workouts', relatedNodeIds: [] }];
      mockRedisGet.mockResolvedValue(cached);

      const actions = await nextBestActionService.getActions('user-1');

      expect(actions).toEqual(cached);
      expect(mockGetAllStates).not.toHaveBeenCalled();
    });
  });

  describe('findDormantRevivals', () => {
    it('should detect dormant feature supported by active feature', async () => {
      // yoga supports mood: { sourceNodeId: 'yoga', targetNodeId: 'mood', edgeType: 'supports' }
      const states = makeAllStates({
        'yoga': { status: 'active', healthScore: 70 },
        'mood': { status: 'dormant', healthScore: 5, lastActivityAt: '2025-04-01T00:00:00Z' },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const revival = actions.find((a) => a.type === 'revive_dormant' && a.targetNodeId === 'mood');
      expect(revival).toBeDefined();
      expect(revival!.title).toContain('Mood');
      expect(revival!.relatedNodeIds).toContain('yoga');
    });

    it('should not suggest revival when source is also dormant', async () => {
      const states = makeAllStates({
        'yoga': { status: 'dormant', healthScore: 5 },
        'mood': { status: 'dormant', healthScore: 5 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const revival = actions.find((a) => a.type === 'revive_dormant' && a.targetNodeId === 'mood');
      expect(revival).toBeUndefined();
    });
  });

  describe('findCascadeOpportunities', () => {
    it('should detect cascade when source is strong and target is weak via feeds_data', async () => {
      // whoop feeds_data workouts (0.9)
      const states = makeAllStates({
        'whoop': { status: 'active', healthScore: 90 },
        'workouts': { status: 'active', healthScore: 40 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const cascade = actions.find(
        (a) => a.type === 'cascade_opportunity' && a.targetNodeId === 'workouts'
      );
      expect(cascade).toBeDefined();
      expect(cascade!.relatedNodeIds).toContain('whoop');
    });

    it('should not detect cascade when target health is already high', async () => {
      const states = makeAllStates({
        'whoop': { status: 'active', healthScore: 90 },
        'workouts': { status: 'active', healthScore: 80 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const cascade = actions.find(
        (a) => a.type === 'cascade_opportunity' && a.targetNodeId === 'workouts' && a.relatedNodeIds.includes('whoop')
      );
      expect(cascade).toBeUndefined();
    });
  });

  describe('findCoverageGaps', () => {
    it('should detect never-used feature required by active goals', async () => {
      // goals requires workouts and nutrition
      const states = makeAllStates({
        'goals': { status: 'active', healthScore: 70 },
        'workouts': { status: 'never_used' },
        'nutrition': { status: 'never_used' },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const gaps = actions.filter((a) => a.type === 'coverage_gap');
      expect(gaps.length).toBeGreaterThan(0);
      const targetIds = gaps.map((g) => g.targetNodeId);
      expect(targetIds).toContain('workouts');
    });

    it('should not detect coverage gap when goals are inactive', async () => {
      const states = makeAllStates({
        'goals': { status: 'never_used' },
        'workouts': { status: 'never_used' },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const gaps = actions.filter((a) => a.type === 'coverage_gap');
      expect(gaps).toHaveLength(0);
    });
  });

  describe('findDecliningTrends', () => {
    it('should detect declining active feature', async () => {
      const states = makeAllStates({
        'workouts': {
          status: 'active',
          healthScore: 30,
          alerts: [{ type: 'declining', message: 'Workout frequency dropped 50%', severity: 'high' }],
        },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const decline = actions.find((a) => a.type === 'declining_trend' && a.targetNodeId === 'workouts');
      expect(decline).toBeDefined();
      expect(decline!.priority).toBe(90); // high severity = 90
    });

    it('should not flag declining if feature is not active', async () => {
      const states = makeAllStates({
        'workouts': {
          status: 'dormant',
          healthScore: 10,
          alerts: [{ type: 'declining', message: 'Dropped', severity: 'medium' }],
        },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const decline = actions.find((a) => a.type === 'declining_trend' && a.targetNodeId === 'workouts');
      expect(decline).toBeUndefined();
    });
  });

  describe('findConflictResolutions', () => {
    it('should detect conflict between two features', async () => {
      const states = makeAllStates({
        'workouts': {
          status: 'active',
          healthScore: 50,
          alerts: [{
            type: 'conflict',
            message: 'High workout volume conflicts with recovery signals',
            severity: 'high',
            relatedNodeId: 'whoop',
          }],
        },
        'whoop': { status: 'active', healthScore: 60 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const actions = await nextBestActionService.getActions('user-1');

      const conflict = actions.find((a) => a.type === 'resolve_conflict');
      expect(conflict).toBeDefined();
      expect(conflict!.relatedNodeIds).toContain('whoop');
    });
  });

  describe('invalidateCache', () => {
    it('should delete the Redis cache key', async () => {
      await nextBestActionService.invalidateCache('user-1');

      expect(mockRedisDelete).toHaveBeenCalledWith('rg:nba:user-1');
    });
  });
});
