/**
 * Graph Validation Service Unit Tests
 *
 * Tests BFS reachability, orphan detection, weak connections,
 * missing edge detection, auto-repair, and edge seeding.
 */

import { jest } from '@jest/globals';
import type { FeatureNodeId, ReasoningEdge } from '@shared/types/domain/reasoning-graph.js';

// ============================================
// MOCKS
// ============================================

const mockDbQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../../src/config/database.config.js', () => ({
  query: mockDbQuery,
}));

jest.unstable_mockModule('../../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { graphValidationService } = await import('../../../../src/services/reasoning-graph/graph-validation.service.js');

// ============================================
// HELPERS
// ============================================

function makeEdgeRow(source: FeatureNodeId, target: FeatureNodeId, edgeType = 'feeds_data', weight = 0.5): any {
  return {
    id: `${source}-${target}`,
    source_node_id: source,
    target_node_id: target,
    edge_type: edgeType,
    weight,
    direction: 'bidirectional',
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// ============================================
// TESTS
// ============================================

describe('GraphValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should report all 29 nodes as reachable when default edges provide full coverage', async () => {
      // No user-specific edges — default hierarchy provides full BFS coverage
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const report = await graphValidationService.validate('user-1');

      expect(report.totalNodes).toBe(29);
      expect(report.reachableNodes).toBe(29);
      expect(report.orphanNodes).toHaveLength(0);
    });

    it('should detect weak connections (nodes with zero user-specific edges)', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const report = await graphValidationService.validate('user-1');

      expect(report.weaklyConnected.length).toBeGreaterThan(0);
    });

    it('should detect missing static cross-edges', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const report = await graphValidationService.validate('user-1');

      const missingEdgeIssues = report.issues.filter((i) => i.type === 'missing_edge');
      expect(missingEdgeIssues.length).toBe(14);
    });

    it('should not report missing cross-edge if it exists in DB', async () => {
      const edges = [
        makeEdgeRow('nutrition', 'workouts', 'feeds_data', 0.8),
      ];
      mockDbQuery.mockResolvedValueOnce({ rows: edges });

      const report = await graphValidationService.validate('user-1');

      const missingEdgeIssues = report.issues.filter((i) => i.type === 'missing_edge');
      const nutritionWorkoutsIssue = missingEdgeIssues.find(
        (i) => i.description.includes('nutrition → workouts')
      );
      expect(nutritionWorkoutsIssue).toBeUndefined();
    });

    it('should include suggestedFix for orphan nodes', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const report = await graphValidationService.validate('user-1');

      const orphanIssues = report.issues.filter((i) => i.type === 'orphan_node');
      for (const issue of orphanIssues) {
        expect(issue.suggestedFix).toBeDefined();
        expect(issue.suggestedFix!.action).toBe('create_edge');
        expect(issue.suggestedFix!.edgeType).toBe('coach_manages');
      }
    });

    it('should include suggestedFix for missing edges', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const report = await graphValidationService.validate('user-1');

      const missingEdgeIssues = report.issues.filter((i) => i.type === 'missing_edge');
      for (const issue of missingEdgeIssues) {
        expect(issue.suggestedFix).toBeDefined();
        expect(issue.suggestedFix!.action).toBe('create_edge');
      }
    });

    it('should set autoRepaired to 0 when autoRepair is false', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const report = await graphValidationService.validate('user-1', false);

      expect(report.autoRepaired).toBe(0);
    });

    it('should auto-repair when autoRepair is true', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });
      // Auto-repair inserts
      mockDbQuery.mockResolvedValue({ rows: [] });

      const report = await graphValidationService.validate('user-1', true);

      expect(report.autoRepaired).toBeGreaterThan(0);
    });

    it('should handle DB errors gracefully when loading edges', async () => {
      mockDbQuery.mockRejectedValueOnce(new Error('DB error'));

      const report = await graphValidationService.validate('user-1');

      expect(report.totalNodes).toBe(29);
      expect(report.reachableNodes).toBe(29);
    });
  });

  describe('seedDefaultEdges', () => {
    it('should create hierarchy + cross edges', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const created = await graphValidationService.seedDefaultEdges('user-1');

      // 28 hierarchy edges + 14 cross edges = 42 total
      expect(created).toBe(42);
      expect(mockDbQuery).toHaveBeenCalledTimes(42);
    });

    it('should handle duplicate edge inserts gracefully', async () => {
      let callCount = 0;
      mockDbQuery.mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          throw new Error('duplicate key');
        }
        return { rows: [] };
      });

      const created = await graphValidationService.seedDefaultEdges('user-1');

      // Some edges skipped due to duplicate, but should still count them
      expect(created).toBeGreaterThan(0);
    });
  });
});
