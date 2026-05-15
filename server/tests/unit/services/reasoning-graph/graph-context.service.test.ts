/**
 * Graph Context Service Unit Tests
 *
 * Tests the summary computation, conflict detection, suggested actions,
 * health scoring, and prompt formatting for AI Coach context injection.
 */

import { jest } from '@jest/globals';
import type { FeatureNodeId, FeatureNodeState, FeatureNodeStatus, FeatureAlert } from '@shared/types/domain/reasoning-graph.js';

// ============================================
// MOCKS
// ============================================

const mockGetAllStates = jest.fn<any>();
const mockGetActions = jest.fn<any>();
const mockRedisGet = jest.fn<any>();
const mockRedisSet = jest.fn<any>();
const mockRedisDelete = jest.fn<any>();
const mockSetGraphAlertsForUser = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../../src/services/reasoning-graph/feature-state.service.js', () => ({
  featureStateService: { getAllStates: mockGetAllStates },
}));

jest.unstable_mockModule('../../../../src/services/reasoning-graph/next-best-action.service.js', () => ({
  nextBestActionService: { getActions: mockGetActions },
}));

jest.unstable_mockModule('../../../../src/services/redis-cache.service.js', () => ({
  redisCacheService: { get: mockRedisGet, set: mockRedisSet, delete: mockRedisDelete },
}));

jest.unstable_mockModule('../../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../../src/services/tool-router.service.js', () => ({
  setGraphAlertsForUser: mockSetGraphAlertsForUser,
}));

const { graphContextService } = await import('../../../../src/services/reasoning-graph/graph-context.service.js');

// ============================================
// HELPERS
// ============================================

function makeState(
  id: FeatureNodeId,
  status: FeatureNodeStatus = 'active',
  healthScore = 50,
  alerts: FeatureAlert[] = [],
  lastActivityAt: string | null = new Date().toISOString(),
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

function makeFullStates(overrides: Partial<Record<FeatureNodeId, Partial<FeatureNodeState>>> = {}): FeatureNodeState[] {
  const defaultIds: FeatureNodeId[] = [
    'ai-coach', 'overview', 'workouts', 'nutrition', 'exercises', 'progress',
    'activity', 'activity-status', 'whoop', 'achievements', 'wellbeing',
    'journal', 'mood', 'insights', 'yoga', 'pulse', 'goals', 'life-areas',
    'leaderboard', 'competitions', 'community', 'contracts', 'chat',
    'voice-assistant', 'call-coach', 'money-map', 'notifications',
    'knowledge-graph', 'hydration',
  ];

  return defaultIds.map((id) => {
    const override = overrides[id] || {};
    return makeState(
      id,
      override.status ?? 'never_used',
      override.healthScore ?? 0,
      override.alerts ?? [],
      override.lastActivityAt ?? null,
    );
  });
}

// ============================================
// TESTS
// ============================================

describe('GraphContextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
    mockRedisDelete.mockResolvedValue(undefined);
    mockGetActions.mockResolvedValue([]);
  });

  describe('buildSummary', () => {
    it('should classify nodes by status correctly', async () => {
      const states = makeFullStates({
        'workouts': { status: 'active', healthScore: 80 },
        'nutrition': { status: 'active', healthScore: 60 },
        'journal': { status: 'dormant', healthScore: 10 },
        'mood': { status: 'dormant', healthScore: 5 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.activeNodes).toContain('workouts');
      expect(summary.activeNodes).toContain('nutrition');
      expect(summary.dormantNodes).toContain('journal');
      expect(summary.dormantNodes).toContain('mood');
      expect(summary.neverUsedNodes.length).toBeGreaterThan(0);
      expect(summary.activeNodes).not.toContain('ai-coach');
    });

    it('should exclude ai-coach from totalNodes count', async () => {
      const states = makeFullStates();
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.totalNodes).toBe(28);
    });

    it('should sort alerts by severity (high first)', async () => {
      const states = makeFullStates({
        'workouts': {
          status: 'active',
          healthScore: 30,
          alerts: [{ type: 'declining', message: 'Low alert', severity: 'low' }],
        },
        'nutrition': {
          status: 'active',
          healthScore: 20,
          alerts: [{ type: 'missed', message: 'High alert', severity: 'high' }],
        },
        'mood': {
          status: 'active',
          healthScore: 40,
          alerts: [{ type: 'conflict', message: 'Medium alert', severity: 'medium' }],
        },
      });
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.topAlerts[0].severity).toBe('high');
      expect(summary.topAlerts[1].severity).toBe('medium');
      expect(summary.topAlerts[2].severity).toBe('low');
    });

    it('should limit topAlerts to 5', async () => {
      const alerts: FeatureAlert[] = Array.from({ length: 8 }, (_, i) => ({
        type: 'declining' as const,
        message: `Alert ${i}`,
        severity: 'medium' as const,
      }));
      const states = makeFullStates({
        'workouts': { status: 'active', healthScore: 50, alerts },
      });
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.topAlerts.length).toBeLessThanOrEqual(5);
    });

    it('should detect cross-node conflicts when source is active + high health but target is dormant', async () => {
      const states = makeFullStates({
        'nutrition': { status: 'active', healthScore: 85 },
        'workouts': { status: 'dormant', healthScore: 10 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.crossNodeConflicts.length).toBeGreaterThan(0);
      const conflictText = summary.crossNodeConflicts.join(' ');
      expect(conflictText).toContain('Nutrition');
      expect(conflictText).toContain('Workouts');
    });

    it('should generate suggested actions for dormant features connected to active ones', async () => {
      const states = makeFullStates({
        'goals': { status: 'active', healthScore: 60 },
        'workouts': { status: 'never_used', healthScore: 0, lastActivityAt: null },
        'nutrition': { status: 'never_used', healthScore: 0, lastActivityAt: null },
      });
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.suggestedNextActions.length).toBeGreaterThan(0);
    });

    it('should compute graph health score as weighted combination', async () => {
      const states = makeFullStates({
        'workouts': { status: 'active', healthScore: 100 },
        'nutrition': { status: 'active', healthScore: 100 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.graphHealthScore).toBeGreaterThan(0);
      expect(summary.graphHealthScore).toBeLessThanOrEqual(100);
    });

    it('should return 0 graph health when no features are active', async () => {
      const states = makeFullStates();
      mockGetAllStates.mockResolvedValue(states);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.graphHealthScore).toBe(0);
    });

    it('should enrich suggested actions from NBA service', async () => {
      const states = makeFullStates();
      mockGetAllStates.mockResolvedValue(states);
      mockGetActions.mockResolvedValue([
        { title: 'Start tracking workouts', description: 'test', priority: 80, id: '1', type: 'coverage_gap', targetNodeId: 'workouts', relatedNodeIds: [] },
      ]);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary.suggestedNextActions).toContain('Start tracking workouts');
    });

    it('should use cached result when available', async () => {
      const cachedSummary = {
        totalNodes: 28,
        activeNodes: ['workouts'],
        dormantNodes: [],
        neverUsedNodes: [],
        topAlerts: [],
        crossNodeConflicts: [],
        suggestedNextActions: [],
        graphHealthScore: 50,
      };
      mockRedisGet.mockResolvedValue(cachedSummary);

      const summary = await graphContextService.buildSummary('user-1');

      expect(summary).toEqual(cachedSummary);
      expect(mockGetAllStates).not.toHaveBeenCalled();
    });
  });

  describe('buildContext', () => {
    it('should return formatted prompt string with graph state', async () => {
      const states = makeFullStates({
        'workouts': { status: 'active', healthScore: 80 },
        'nutrition': { status: 'dormant', healthScore: 10 },
      });
      mockGetAllStates.mockResolvedValue(states);

      const context = await graphContextService.buildContext('user-1');

      expect(context).toContain('KNOWLEDGE GRAPH STATE');
      expect(context).toContain('Graph Health:');
      expect(context).toContain('ACTIVE:');
      expect(context).toContain('workouts');
    });

    it('should include alerts section when alerts exist', async () => {
      const states = makeFullStates({
        'workouts': {
          status: 'active',
          healthScore: 30,
          alerts: [{ type: 'declining', message: 'Workout frequency dropping', severity: 'high' }],
        },
      });
      mockGetAllStates.mockResolvedValue(states);

      const context = await graphContextService.buildContext('user-1');

      expect(context).toContain('ALERTS:');
      expect(context).toContain('[HIGH]');
      expect(context).toContain('Workout frequency dropping');
    });

    it('should call setGraphAlertsForUser when alerts exist', async () => {
      const states = makeFullStates({
        'workouts': {
          status: 'active',
          healthScore: 30,
          alerts: [{ type: 'declining', message: 'test alert', severity: 'medium' }],
        },
      });
      mockGetAllStates.mockResolvedValue(states);

      await graphContextService.buildContext('user-1');

      expect(mockSetGraphAlertsForUser).toHaveBeenCalledWith(
        'user-1',
        expect.arrayContaining([expect.objectContaining({ message: 'test alert' })]),
      );
    });

    it('should return empty string on error', async () => {
      mockGetAllStates.mockRejectedValue(new Error('DB down'));

      const context = await graphContextService.buildContext('user-1');

      expect(context).toBe('');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('should delete the Redis cache key', async () => {
      await graphContextService.invalidateCache('user-1');

      expect(mockRedisDelete).toHaveBeenCalledWith('rg:ctx:user-1');
    });
  });
});
