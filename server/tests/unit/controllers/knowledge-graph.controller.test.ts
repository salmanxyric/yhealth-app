/**
 * Knowledge Graph Controller Unit Tests
 *
 * Tests API endpoint handlers: getGraph, getNodeDetail, searchNodes,
 * exportGraph, getReasoningOverlay, and getNextBestActions.
 */

import { jest } from '@jest/globals';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../src/types/index.js';

// ============================================
// MOCKS
// ============================================

const mockBuildGraph = jest.fn<any>();
const mockGetNodeDetail = jest.fn<any>();
const mockSearchNodes = jest.fn<any>();
const mockGetAllStates = jest.fn<any>();
const mockValidate = jest.fn<any>();
const mockGetActions = jest.fn<any>();

const mockApiResponseSuccess = jest.fn<any>();
const mockAsyncHandler = jest.fn<any>().mockImplementation((fn: any) => fn);

jest.unstable_mockModule('../../../src/services/knowledge-graph.service.js', () => ({
  knowledgeGraphService: {
    buildGraph: mockBuildGraph,
    getNodeDetail: mockGetNodeDetail,
    searchNodes: mockSearchNodes,
  },
}));

jest.unstable_mockModule('../../../src/services/reasoning-graph/feature-state.service.js', () => ({
  featureStateService: { getAllStates: mockGetAllStates },
}));

jest.unstable_mockModule('../../../src/services/reasoning-graph/graph-validation.service.js', () => ({
  graphValidationService: { validate: mockValidate },
}));

jest.unstable_mockModule('../../../src/services/reasoning-graph/next-best-action.service.js', () => ({
  nextBestActionService: { getActions: mockGetActions },
}));

jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler,
}));

jest.unstable_mockModule('../../../src/utils/ApiResponse.js', () => ({
  ApiResponse: { success: mockApiResponseSuccess },
}));

jest.unstable_mockModule('../../../src/utils/ApiError.js', () => {
  class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
    static unauthorized(msg: string) { return new ApiError(401, msg); }
    static badRequest(msg: string) { return new ApiError(400, msg); }
    static notFound(msg: string) { return new ApiError(404, msg); }
  }
  return { ApiError };
});

jest.unstable_mockModule('../../../src/services/reasoning-graph/feature-node-registry.js', () => {
  const FEATURE_NODE_REGISTRY = [
    { id: 'ai-coach', label: 'AI Coach', category: 'coaching', parentNodeId: null, route: '/ai-coach', description: 'Root', toolGroups: ['general'], dataSources: [], graphNodeTypes: [] },
    { id: 'workouts', label: 'Workouts', category: 'fitness', parentNodeId: null, route: '/workouts', description: 'Workouts', toolGroups: ['workouts'], dataSources: ['workout_logs'], graphNodeTypes: ['workout_session'] },
  ];
  return {
    FEATURE_NODE_REGISTRY,
    getDefaultEdges: () => [{ sourceNodeId: 'ai-coach', targetNodeId: 'workouts', edgeType: 'coach_manages' }],
    STATIC_CROSS_EDGES: [],
  };
});

const { knowledgeGraphController } = await import('../../../src/controllers/knowledge-graph.controller.js');

// ============================================
// HELPERS
// ============================================

function makeReq(overrides: Record<string, unknown> = {}): AuthenticatedRequest {
  return {
    user: { userId: 'user-1' },
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function makeRes(): Response {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

// ============================================
// TESTS
// ============================================

describe('KnowledgeGraphController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGraph', () => {
    it('should return graph data for valid request', async () => {
      const graphData = { nodes: [], edges: [], meta: { stats: { totalNodes: 0 } } };
      mockBuildGraph.mockResolvedValue(graphData);

      const req = makeReq({ query: { from: '2026-05-01', to: '2026-05-01' } });
      const res = makeRes();

      await knowledgeGraphController.getGraph(req, res);

      expect(mockBuildGraph).toHaveBeenCalledWith('user-1', expect.objectContaining({
        dateRange: { from: '2026-05-01', to: '2026-05-01' },
      }));
      expect(mockApiResponseSuccess).toHaveBeenCalled();
    });

    it('should reject invalid date format', async () => {
      const req = makeReq({ query: { from: '05-01-2026', to: '2026-05-01' } });
      const res = makeRes();

      await expect(knowledgeGraphController.getGraph(req, res)).rejects.toThrow('Invalid date format');
    });

    it('should reject unauthenticated request', async () => {
      const req = makeReq({ user: undefined });
      const res = makeRes();

      await expect(knowledgeGraphController.getGraph(req, res)).rejects.toThrow('Authentication required');
    });

    it('should default to today when no dates provided', async () => {
      mockBuildGraph.mockResolvedValue({ nodes: [], edges: [], meta: {} });

      const req = makeReq({ query: {} });
      const res = makeRes();

      await knowledgeGraphController.getGraph(req, res);

      const callArgs = mockBuildGraph.mock.calls[0][1];
      expect(callArgs.dateRange.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should parse categories filter', async () => {
      mockBuildGraph.mockResolvedValue({ nodes: [], edges: [], meta: {} });

      const req = makeReq({ query: { from: '2026-05-01', to: '2026-05-01', categories: 'fitness,nutrition' } });
      const res = makeRes();

      await knowledgeGraphController.getGraph(req, res);

      const callArgs = mockBuildGraph.mock.calls[0][1];
      expect(callArgs.categories).toEqual(['fitness', 'nutrition']);
    });

    it('should clamp maxNodes between 10 and 500', async () => {
      mockBuildGraph.mockResolvedValue({ nodes: [], edges: [], meta: {} });

      const req = makeReq({ query: { from: '2026-05-01', to: '2026-05-01', maxNodes: '1000' } });
      const res = makeRes();

      await knowledgeGraphController.getGraph(req, res);

      const callArgs = mockBuildGraph.mock.calls[0][1];
      expect(callArgs.maxNodes).toBe(500);
    });
  });

  describe('getNodeDetail', () => {
    it('should return node detail for valid request', async () => {
      const detail = { id: 'node-1', type: 'workout_session', data: {} };
      mockGetNodeDetail.mockResolvedValue(detail);

      const req = makeReq({ params: { nodeId: 'node-1' }, query: { type: 'workout_session' } });
      const res = makeRes();

      await knowledgeGraphController.getNodeDetail(req, res);

      expect(mockGetNodeDetail).toHaveBeenCalledWith('user-1', 'node-1', 'workout_session');
      expect(mockApiResponseSuccess).toHaveBeenCalled();
    });

    it('should throw 404 when node not found', async () => {
      mockGetNodeDetail.mockResolvedValue(null);

      const req = makeReq({ params: { nodeId: 'nonexistent' }, query: { type: 'workout_session' } });
      const res = makeRes();

      await expect(knowledgeGraphController.getNodeDetail(req, res)).rejects.toThrow('Node not found');
    });

    it('should throw 400 when type query param is missing', async () => {
      const req = makeReq({ params: { nodeId: 'node-1' }, query: {} });
      const res = makeRes();

      await expect(knowledgeGraphController.getNodeDetail(req, res)).rejects.toThrow('nodeId and type');
    });
  });

  describe('searchNodes', () => {
    it('should search nodes with query', async () => {
      mockSearchNodes.mockResolvedValue([]);

      const req = makeReq({ body: { query: 'workout', from: '2026-05-01', to: '2026-05-01' } });
      const res = makeRes();

      await knowledgeGraphController.searchNodes(req, res);

      expect(mockSearchNodes).toHaveBeenCalledWith('user-1', 'workout', expect.any(Object));
      expect(mockApiResponseSuccess).toHaveBeenCalled();
    });

    it('should reject empty query', async () => {
      const req = makeReq({ body: {} });
      const res = makeRes();

      await expect(knowledgeGraphController.searchNodes(req, res)).rejects.toThrow('query is required');
    });
  });

  describe('exportGraph', () => {
    it('should export as JSON', async () => {
      const graphData = { nodes: [{ id: '1', type: 'workout_session', category: 'fitness', label: 'Run', date: '2026-05-01', timestamp: '2026-05-01T00:00:00Z' }], edges: [], meta: {} };
      mockBuildGraph.mockResolvedValue(graphData);

      const req = makeReq({ query: { format: 'json', from: '2026-05-01', to: '2026-05-01' } });
      const res = makeRes();

      await knowledgeGraphController.exportGraph(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(res.json).toHaveBeenCalledWith(graphData);
    });

    it('should export as CSV', async () => {
      const graphData = { nodes: [{ id: '1', type: 'workout_session', category: 'fitness', label: 'Run', date: '2026-05-01', timestamp: '2026-05-01T00:00:00Z' }], edges: [], meta: {} };
      mockBuildGraph.mockResolvedValue(graphData);

      const req = makeReq({ query: { format: 'csv', from: '2026-05-01', to: '2026-05-01' } });
      const res = makeRes();

      await knowledgeGraphController.exportGraph(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      const csvContent = (res.send as jest.Mock).mock.calls[0][0] as string;
      expect(csvContent).toContain('id,type,category,label,date,timestamp');
      expect(csvContent).toContain('workout_session');
    });

    it('should reject when from/to missing', async () => {
      const req = makeReq({ query: { format: 'json' } });
      const res = makeRes();

      await expect(knowledgeGraphController.exportGraph(req, res)).rejects.toThrow('from and to');
    });
  });

  describe('getReasoningOverlay', () => {
    it('should return feature nodes with states and edges', async () => {
      mockGetAllStates.mockResolvedValue([
        { featureNodeId: 'workouts', healthScore: 80, status: 'active', activityCount7d: 5, lastActivityAt: '2026-05-01', alerts: [] },
      ]);
      mockValidate.mockResolvedValue({
        orphanNodes: [],
        weaklyConnected: [],
        issues: [],
        autoRepaired: 0,
      });

      const req = makeReq();
      const res = makeRes();

      await knowledgeGraphController.getReasoningOverlay(req, res);

      expect(mockApiResponseSuccess).toHaveBeenCalled();
      const callArgs = mockApiResponseSuccess.mock.calls[0];
      const data = callArgs[1];
      expect(data.nodes).toBeDefined();
      expect(data.edges).toBeDefined();
      expect(data.validation).toBeDefined();
    });
  });

  describe('getNextBestActions', () => {
    it('should return recommended actions', async () => {
      mockGetActions.mockResolvedValue([
        { id: '1', type: 'coverage_gap', priority: 80, title: 'Start workouts' },
      ]);

      const req = makeReq();
      const res = makeRes();

      await knowledgeGraphController.getNextBestActions(req, res);

      expect(mockApiResponseSuccess).toHaveBeenCalled();
      const callArgs = mockApiResponseSuccess.mock.calls[0];
      expect(callArgs[1].actions).toHaveLength(1);
    });
  });
});
