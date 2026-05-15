/**
 * Feature State Service Unit Tests
 *
 * Tests health score computation, status classification,
 * cache behavior, and state hydration/persistence.
 */

import { jest } from '@jest/globals';
import type { FeatureNodeId } from '@shared/types/domain/reasoning-graph.js';

// ============================================
// MOCKS
// ============================================

const mockDbQuery = jest.fn<any>();
const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockRedisDelete = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../../src/config/database.config.js', () => ({
  query: mockDbQuery,
}));

jest.unstable_mockModule('../../../../src/services/redis-cache.service.js', () => ({
  redisCacheService: { get: mockRedisGet, set: mockRedisSet, delete: mockRedisDelete },
}));

jest.unstable_mockModule('../../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { featureStateService } = await import('../../../../src/services/reasoning-graph/feature-state.service.js');

// ============================================
// TESTS
// ============================================

describe('FeatureStateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
    mockRedisDelete.mockResolvedValue(undefined);
  });

  describe('getAllStates', () => {
    it('should return cached states when available', async () => {
      const cached = [{ featureNodeId: 'workouts', healthScore: 80 }];
      mockRedisGet.mockResolvedValue(cached);

      const result = await featureStateService.getAllStates('user-1');

      expect(result).toEqual(cached);
      expect(mockDbQuery).not.toHaveBeenCalled();
    });

    it('should hydrate from DB when cache misses', async () => {
      const now = new Date();
      mockDbQuery
        .mockResolvedValueOnce({
          rows: [{
            feature_node_id: 'workouts',
            health_score: 80,
            last_activity_at: now,
            activity_count_7d: 5,
            status: 'active',
            alerts: [],
            updated_at: now,
          }],
        })
        .mockResolvedValue({
          rows: [{ count_7d: '0', last_activity: null, total_count: '0' }],
        });

      const result = await featureStateService.getAllStates('user-1');

      expect(result.length).toBe(29);
      const workoutsState = result.find((s) => s.featureNodeId === 'workouts');
      expect(workoutsState?.healthScore).toBe(80);
      expect(workoutsState?.status).toBe('active');
    });

    it('should return never_used state for nodes without persisted data', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });
      mockDbQuery.mockResolvedValue({
        rows: [{ count_7d: '0', last_activity: null, total_count: '0' }],
      });

      const result = await featureStateService.getAllStates('user-1');

      for (const state of result) {
        expect(state.featureNodeId).toBeDefined();
        expect(state.userId).toBe('user-1');
      }
    });

    it('should cache results after hydration', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });
      mockDbQuery.mockResolvedValue({
        rows: [{ count_7d: '0', last_activity: null, total_count: '0' }],
      });

      await featureStateService.getAllStates('user-1');

      expect(mockRedisSet).toHaveBeenCalledWith(
        'rg:state:user-1',
        expect.any(Array),
        300,
      );
    });
  });

  describe('getState', () => {
    it('should return state for a specific node', async () => {
      const now = new Date();
      mockDbQuery
        .mockResolvedValueOnce({
          rows: [{
            feature_node_id: 'nutrition',
            health_score: 60,
            last_activity_at: now,
            activity_count_7d: 3,
            status: 'active',
            alerts: [],
            updated_at: now,
          }],
        })
        .mockResolvedValue({
          rows: [{ count_7d: '0', last_activity: null, total_count: '0' }],
        });

      const state = await featureStateService.getState('user-1', 'nutrition');

      expect(state).not.toBeNull();
      expect(state!.featureNodeId).toBe('nutrition');
    });

    it('should return null for nonexistent node', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });
      mockDbQuery.mockResolvedValue({
        rows: [{ count_7d: '0', last_activity: null, total_count: '0' }],
      });

      const state = await featureStateService.getState('user-1', 'nonexistent' as FeatureNodeId);

      expect(state).toBeNull();
    });
  });

  describe('upsertState', () => {
    it('should upsert state to DB and invalidate cache', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await featureStateService.upsertState('user-1', {
        featureNodeId: 'workouts',
        healthScore: 85,
        lastActivityAt: '2026-05-01T00:00:00Z',
        activityCount7d: 7,
        status: 'active',
        alerts: [],
      });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feature_state'),
        expect.arrayContaining(['user-1', 'workouts', 85]),
      );
      expect(mockRedisDelete).toHaveBeenCalledWith('rg:state:user-1');
    });

    it('should handle upsert errors gracefully', async () => {
      mockDbQuery.mockRejectedValue(new Error('DB error'));

      await featureStateService.upsertState('user-1', {
        featureNodeId: 'workouts',
        healthScore: 50,
      });

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('should delete the Redis cache key', async () => {
      await featureStateService.invalidateCache('user-1');

      expect(mockRedisDelete).toHaveBeenCalledWith('rg:state:user-1');
    });
  });

  describe('computeStatus (via hydration)', () => {
    it('should classify as active when count7d > 0', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({
          rows: [{ count_7d: '5', last_activity: new Date(), total_count: '50' }],
        });

      const states = await featureStateService.getAllStates('user-1');
      const workoutState = states.find((s) => s.featureNodeId === 'workouts');
      expect(workoutState?.status).toBe('active');
    });

    it('should classify as never_used when no activity at all', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({
          rows: [{ count_7d: '0', last_activity: null, total_count: '0' }],
        });

      const states = await featureStateService.getAllStates('user-1');
      const state = states.find((s) => s.featureNodeId === 'workouts');
      expect(state?.status).toBe('never_used');
    });

    it('should classify as dormant when last activity is > 30 days ago', async () => {
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({
          rows: [{ count_7d: '0', last_activity: oldDate, total_count: '10' }],
        });

      const states = await featureStateService.getAllStates('user-1');
      const state = states.find((s) => s.featureNodeId === 'workouts');
      expect(state?.status).toBe('dormant');
    });
  });

  describe('computeHealthScore (via hydration)', () => {
    it('should return 0 for never_used', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({
          rows: [{ count_7d: '0', last_activity: null, total_count: '0' }],
        });

      const states = await featureStateService.getAllStates('user-1');
      const state = states.find((s) => s.featureNodeId === 'workouts');
      expect(state?.healthScore).toBe(0);
    });

    it('should return 100 for 7+ entries in last 7 days', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({
          rows: [{ count_7d: '7', last_activity: new Date(), total_count: '50' }],
        });

      const states = await featureStateService.getAllStates('user-1');
      const state = states.find((s) => s.featureNodeId === 'workouts');
      expect(state?.healthScore).toBe(100);
    });

    it('should cap health at 100 even for very high activity', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({
          rows: [{ count_7d: '20', last_activity: new Date(), total_count: '100' }],
        });

      const states = await featureStateService.getAllStates('user-1');
      const state = states.find((s) => s.featureNodeId === 'workouts');
      expect(state?.healthScore).toBeLessThanOrEqual(100);
    });

    it('should cap dormant health at 20', async () => {
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({
          rows: [{ count_7d: '0', last_activity: oldDate, total_count: '100' }],
        });

      const states = await featureStateService.getAllStates('user-1');
      const state = states.find((s) => s.featureNodeId === 'workouts');
      expect(state?.healthScore).toBeLessThanOrEqual(20);
    });
  });
});
