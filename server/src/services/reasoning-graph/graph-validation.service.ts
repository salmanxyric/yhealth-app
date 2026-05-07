/**
 * @file Graph Validation Service
 * @description Detects orphan nodes, weak connections, and missing edges
 *              in the per-user reasoning graph. Can auto-repair by creating
 *              coach_manages edges for orphans and user_correlates edges
 *              for strong but unlinked correlations.
 */

import { query as dbQuery } from '../../config/database.config.js';
import { logger } from '../logger.service.js';
import {
  getAllFeatureNodeIds,
  getDefaultEdges,
  STATIC_CROSS_EDGES,
} from './feature-node-registry.js';
import type {
  FeatureNodeId,
  ReasoningEdge,
  ReasoningEdgeType,
  GraphValidationIssue,
  GraphValidationReport,
} from '@shared/types/domain/reasoning-graph.js';

class GraphValidationService {
  /**
   * Validate the reasoning graph for a user.
   * Detects orphan nodes, weak connections, and missing edges.
   */
  async validate(userId: string, autoRepair = false): Promise<GraphValidationReport> {
    const allNodeIds = getAllFeatureNodeIds();
    const edges = await this.loadEdges(userId);

    // Build adjacency list (undirected for reachability)
    const adjacency = new Map<FeatureNodeId, Set<FeatureNodeId>>();
    for (const id of allNodeIds) {
      adjacency.set(id, new Set());
    }
    for (const edge of edges) {
      adjacency.get(edge.sourceNodeId)?.add(edge.targetNodeId);
      if (edge.direction === 'bidirectional') {
        adjacency.get(edge.targetNodeId)?.add(edge.sourceNodeId);
      }
    }
    // Add default hierarchical edges
    for (const defEdge of getDefaultEdges()) {
      adjacency.get(defEdge.sourceNodeId)?.add(defEdge.targetNodeId);
      adjacency.get(defEdge.targetNodeId)?.add(defEdge.sourceNodeId);
    }

    // BFS from ai-coach
    const visited = new Set<FeatureNodeId>();
    const queue: FeatureNodeId[] = ['ai-coach'];
    visited.add('ai-coach');
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    const orphanNodes = allNodeIds.filter((id) => id !== 'ai-coach' && !visited.has(id));
    const issues: GraphValidationIssue[] = [];

    // Orphan detection
    for (const orphanId of orphanNodes) {
      issues.push({
        type: 'orphan_node',
        nodeId: orphanId,
        description: `Node "${orphanId}" is not reachable from ai-coach`,
        suggestedFix: {
          action: 'create_edge',
          sourceNodeId: 'ai-coach',
          targetNodeId: orphanId,
          edgeType: 'coach_manages',
        },
      });
    }

    // Weak connection detection (only 1 edge — just the default hierarchy)
    const edgeCountPerNode = new Map<FeatureNodeId, number>();
    for (const id of allNodeIds) {
      edgeCountPerNode.set(id, 0);
    }
    for (const edge of edges) {
      edgeCountPerNode.set(edge.sourceNodeId, (edgeCountPerNode.get(edge.sourceNodeId) ?? 0) + 1);
      edgeCountPerNode.set(edge.targetNodeId, (edgeCountPerNode.get(edge.targetNodeId) ?? 0) + 1);
    }
    for (const [nodeId, count] of edgeCountPerNode) {
      if (nodeId === 'ai-coach') continue;
      if (count === 0) {
        issues.push({
          type: 'weak_connection',
          nodeId,
          description: `Node "${nodeId}" has no user-specific edges (only default hierarchy)`,
        });
      }
    }

    // Missing edge detection from static cross-edges
    const edgeSet = new Set(edges.map((e) => `${e.sourceNodeId}→${e.targetNodeId}:${e.edgeType}`));
    for (const staticEdge of STATIC_CROSS_EDGES) {
      const key = `${staticEdge.sourceNodeId}→${staticEdge.targetNodeId}:${staticEdge.edgeType}`;
      if (!edgeSet.has(key)) {
        issues.push({
          type: 'missing_edge',
          nodeId: staticEdge.sourceNodeId,
          description: `Missing ${staticEdge.edgeType} edge: ${staticEdge.sourceNodeId} → ${staticEdge.targetNodeId}`,
          suggestedFix: {
            action: 'create_edge',
            sourceNodeId: staticEdge.sourceNodeId,
            targetNodeId: staticEdge.targetNodeId,
            edgeType: staticEdge.edgeType as ReasoningEdgeType,
          },
        });
      }
    }

    let autoRepaired = 0;
    if (autoRepair && issues.length > 0) {
      autoRepaired = await this.applyRepairs(userId, issues);
    }

    const report: GraphValidationReport = {
      userId,
      timestamp: new Date().toISOString(),
      totalNodes: allNodeIds.length,
      reachableNodes: visited.size,
      orphanNodes,
      weaklyConnected: Array.from(edgeCountPerNode.entries())
        .filter(([id, count]) => id !== 'ai-coach' && count === 0)
        .map(([id]) => id),
      issues,
      autoRepaired,
    };

    logger.info('[GraphValidation] Validation complete', {
      userId,
      total: allNodeIds.length,
      reachable: visited.size,
      orphans: orphanNodes.length,
      issues: issues.length,
      repaired: autoRepaired,
    });

    return report;
  }

  /**
   * Seed default edges for a new user.
   * Creates coach_manages edges for the hierarchy + static cross-edges.
   */
  async seedDefaultEdges(userId: string): Promise<number> {
    const hierarchyEdges = getDefaultEdges();
    let created = 0;

    for (const edge of [...hierarchyEdges, ...STATIC_CROSS_EDGES]) {
      try {
        await dbQuery(
          `INSERT INTO reasoning_edges (user_id, source_node_id, target_node_id, edge_type, weight, direction)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, source_node_id, target_node_id, edge_type) DO NOTHING`,
          [
            userId,
            edge.sourceNodeId,
            edge.targetNodeId,
            edge.edgeType,
            'weight' in edge ? edge.weight : 0.5,
            'bidirectional',
          ],
        );
        created++;
      } catch {
        // skip duplicates
      }
    }

    logger.info('[GraphValidation] Seeded default edges', { userId, created });
    return created;
  }

  // ============================================
  // PRIVATE
  // ============================================

  private async loadEdges(userId: string): Promise<ReasoningEdge[]> {
    try {
      const { rows } = await dbQuery(
        `SELECT id, source_node_id, target_node_id, edge_type, weight, direction, metadata, created_at, updated_at
         FROM reasoning_edges WHERE user_id = $1`,
        [userId],
      );

      return rows.map((r: any) => ({
        id: r.id,
        sourceNodeId: r.source_node_id as FeatureNodeId,
        targetNodeId: r.target_node_id as FeatureNodeId,
        edgeType: r.edge_type,
        weight: r.weight,
        direction: r.direction,
        metadata: r.metadata,
        createdAt: r.created_at?.toISOString(),
        updatedAt: r.updated_at?.toISOString(),
      }));
    } catch (error) {
      logger.warn('[GraphValidation] Failed to load edges', { userId, error });
      return [];
    }
  }

  private async applyRepairs(userId: string, issues: GraphValidationIssue[]): Promise<number> {
    let repaired = 0;
    for (const issue of issues) {
      if (!issue.suggestedFix || issue.suggestedFix.action !== 'create_edge') continue;
      try {
        await dbQuery(
          `INSERT INTO reasoning_edges (user_id, source_node_id, target_node_id, edge_type, weight, direction)
           VALUES ($1, $2, $3, $4, 0.5, 'bidirectional')
           ON CONFLICT (user_id, source_node_id, target_node_id, edge_type) DO NOTHING`,
          [userId, issue.suggestedFix.sourceNodeId, issue.suggestedFix.targetNodeId, issue.suggestedFix.edgeType],
        );
        repaired++;
      } catch {
        // skip
      }
    }
    return repaired;
  }
}

export const graphValidationService = new GraphValidationService();
