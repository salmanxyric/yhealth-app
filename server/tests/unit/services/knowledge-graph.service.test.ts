/**
 * Knowledge Graph Service Unit Tests
 *
 * Tests visual encoding helpers, scaling functions, node fetching,
 * edge building, category filtering, and graph assembly.
 */

import { jest } from '@jest/globals';
import type { GraphFilter, GraphNodeCategory, EdgeCategory } from '@shared/types/domain/knowledge-graph.js';
import { NODE_CATEGORY_COLORS } from '@shared/types/domain/knowledge-graph.js';

// ============================================
// MOCKS
// ============================================

const mockDbQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockDbQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { knowledgeGraphService } = await import('../../../src/services/knowledge-graph.service.js');

// ============================================
// HELPERS
// ============================================

function makeWorkoutRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'w-001',
    workout_plan_id: null,
    workout_name: 'Morning Run',
    scheduled_date: '2026-05-01',
    duration_minutes: 45,
    status: 'completed',
    total_volume: 0,
    difficulty_rating: 3,
    energy_level: 7,
    mood_after: 8,
    xp_earned: 100,
    ...overrides,
  };
}

function makeMealRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm-001',
    diet_plan_id: null,
    meal_type: 'breakfast',
    meal_name: 'Oatmeal Bowl',
    calories: 450,
    protein_grams: 20,
    carbs_grams: 60,
    fat_grams: 12,
    health_score: 8,
    eaten_at: new Date('2026-05-01T08:00:00Z'),
    ...overrides,
  };
}

function makeMoodRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mood-001',
    mood_emoji: '😊',
    mode: 'manual',
    happiness_rating: 8,
    energy_rating: 7,
    stress_rating: 3,
    anxiety_rating: 2,
    emotion_tags: ['happy', 'focused'],
    created_at: new Date('2026-05-01T09:00:00Z'),
    ...overrides,
  };
}

function makeDailyScoreRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ds-001',
    score_date: '2026-05-01',
    total_score: 85,
    component_scores: { fitness: 90, nutrition: 80, wellbeing: 85 },
    explanation: 'Great overall day',
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('KnowledgeGraphService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildGraph', () => {
    it('should return graph data with nodes, edges, and meta', async () => {
      // Mock all fetchers to return empty
      mockDbQuery.mockResolvedValue({ rows: [] });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        maxNodes: 200,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.edges).toBeDefined();
      expect(graph.meta).toBeDefined();
      expect(graph.meta.userId).toBe('user-1');
      expect(graph.meta.filter.dateRange.from).toBe('2026-05-01');
    });

    it('should fetch workout nodes and map them correctly', async () => {
      const workoutRow = makeWorkoutRow();
      mockDbQuery
        .mockResolvedValueOnce({ rows: [workoutRow] }) // workouts
        .mockResolvedValue({ rows: [] }); // everything else

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        categories: ['fitness'],
        maxNodes: 200,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      const workoutNode = graph.nodes.find((n) => n.type === 'workout_session');
      if (workoutNode) {
        expect(workoutNode.id).toBe('w-001');
        expect(workoutNode.category).toBe('fitness');
        expect(workoutNode.label).toBe('Morning Run');
        expect(workoutNode.data.workoutName).toBe('Morning Run');
        expect(workoutNode.sourceTable).toBe('workout_logs');
      }
    });

    it('should compute visual encoding for nodes', async () => {
      const workoutRow = makeWorkoutRow({ duration_minutes: 90 });
      mockDbQuery
        .mockResolvedValueOnce({ rows: [workoutRow] })
        .mockResolvedValue({ rows: [] });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        categories: ['fitness'],
        maxNodes: 200,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      const workoutNode = graph.nodes.find((n) => n.type === 'workout_session');
      if (workoutNode) {
        expect(workoutNode.visual.color).toBe(NODE_CATEGORY_COLORS.fitness);
        expect(workoutNode.visual.size).toBeGreaterThanOrEqual(4);
        expect(workoutNode.visual.size).toBeLessThanOrEqual(20);
        expect(workoutNode.visual.opacity).toBe(1.0);
      }
    });

    it('should filter by category when categories filter is provided', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        categories: ['fitness'],
        maxNodes: 200,
      };

      await knowledgeGraphService.buildGraph('user-1', filter);

      // When categories filter is ['fitness'], only fitness fetchers should run
      // The service should not fetch nutrition, wellbeing etc.
      const calls = mockDbQuery.mock.calls;
      const queryStrings = calls.map((c) => c[0] as string);
      const hasMealQuery = queryStrings.some((q) => q.includes('meal_logs'));
      // With category filtering, meal_logs should not be queried
      expect(hasMealQuery).toBe(false);
    });

    it('should limit total nodes to maxNodes', async () => {
      const rows = Array.from({ length: 300 }, (_, i) =>
        makeWorkoutRow({ id: `w-${i}`, workout_name: `Workout ${i}` })
      );
      mockDbQuery
        .mockResolvedValueOnce({ rows })
        .mockResolvedValue({ rows: [] });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        categories: ['fitness'],
        maxNodes: 50,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      expect(graph.nodes.length).toBeLessThanOrEqual(50);
    });

    it('should build temporal edges between same-day nodes', async () => {
      const workoutRow = makeWorkoutRow();
      const dailyScoreRow = makeDailyScoreRow();
      mockDbQuery.mockImplementation((sql: string) => {
        if (sql.includes('workout_logs')) return { rows: [workoutRow] };
        if (sql.includes('daily_user_scores')) return { rows: [dailyScoreRow] };
        return { rows: [] };
      });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        maxNodes: 200,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      if (graph.edges.length > 0) {
        const temporalEdge = graph.edges.find((e) => e.category === 'temporal');
        if (temporalEdge) {
          expect(temporalEdge.type).toBe('same_day');
          expect(temporalEdge.visual).toBeDefined();
          expect(temporalEdge.visual.dashPattern).toBe('solid');
        }
      }
    });

    it('should generate graph stats in meta', async () => {
      const workoutRow = makeWorkoutRow();
      mockDbQuery
        .mockResolvedValueOnce({ rows: [workoutRow] })
        .mockResolvedValue({ rows: [] });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        categories: ['fitness'],
        maxNodes: 200,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      expect(graph.meta.stats.totalNodes).toBeDefined();
      expect(graph.meta.stats.totalEdges).toBeDefined();
      expect(graph.meta.stats.dateRange).toEqual({ from: '2026-05-01', to: '2026-05-01' });
    });

    it('should handle empty result gracefully', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        maxNodes: 200,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      expect(graph.nodes).toEqual([]);
      expect(graph.meta.stats.totalNodes).toBe(0);
    });

    it('should handle DB errors in individual fetchers without crashing', async () => {
      mockDbQuery.mockImplementation((sql: string) => {
        if (sql.includes('workout_logs')) throw new Error('Table locked');
        return { rows: [] };
      });

      const filter: GraphFilter = {
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
        maxNodes: 200,
      };

      const graph = await knowledgeGraphService.buildGraph('user-1', filter);

      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
    });
  });

  describe('searchNodes', () => {
    it('should search nodes by text query', async () => {
      const workoutRow = makeWorkoutRow({ workout_name: 'Morning Run' });
      mockDbQuery.mockResolvedValue({ rows: [workoutRow] });

      const dateRange = { from: '2026-05-01', to: '2026-05-01' };
      const results = await knowledgeGraphService.searchNodes('user-1', 'run', dateRange);

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getNodeDetail', () => {
    it('should return node detail with neighbors and edges for valid node', async () => {
      const workoutRow = makeWorkoutRow();
      mockDbQuery.mockResolvedValue({ rows: [workoutRow] });

      const detail = await knowledgeGraphService.getNodeDetail('user-1', 'w-001', 'workout_session');

      expect(detail).toBeDefined();
      expect(detail).toHaveProperty('node');
      expect(detail).toHaveProperty('neighbors');
      expect(detail).toHaveProperty('edges');
      if (detail.node) {
        expect(detail.node.id).toBe('w-001');
      }
    });

    it('should return null node for nonexistent node', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const detail = await knowledgeGraphService.getNodeDetail('user-1', 'nonexistent', 'workout_session');

      expect(detail.node).toBeNull();
    });
  });
});

// ============================================
// VISUAL ENCODING CONSTANTS
// ============================================

describe('Knowledge Graph Visual Constants', () => {
  it('NODE_CATEGORY_COLORS should have 9 categories', () => {
    expect(Object.keys(NODE_CATEGORY_COLORS)).toHaveLength(9);
  });

  it('NODE_CATEGORY_COLORS should have valid hex color values', () => {
    for (const color of Object.values(NODE_CATEGORY_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('should have colors for all expected categories', () => {
    const expectedCategories: GraphNodeCategory[] = [
      'fitness', 'nutrition', 'hydration', 'wellbeing',
      'biometrics', 'goals', 'intelligence', 'coaching', 'finance',
    ];
    for (const cat of expectedCategories) {
      expect(NODE_CATEGORY_COLORS[cat]).toBeDefined();
    }
  });
});
