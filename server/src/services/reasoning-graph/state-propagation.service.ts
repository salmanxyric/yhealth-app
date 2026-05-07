/**
 * @file State Propagation Service
 * @description When a feature's state changes, propagates the update to
 *              connected nodes that may need re-evaluation. Debounced to
 *              max once per 5 minutes per user to avoid cascading storms.
 */

import { logger } from '../logger.service.js';
import { redisCacheService } from '../redis-cache.service.js';
import { featureStateService } from './feature-state.service.js';
import { graphContextService } from './graph-context.service.js';
import { nextBestActionService } from './next-best-action.service.js';
import { STATIC_CROSS_EDGES, getDirectChildrenOf } from './feature-node-registry.js';
import type { FeatureNodeId } from '@shared/types/domain/reasoning-graph.js';

const DEBOUNCE_KEY_PREFIX = 'rg:prop:';
const DEBOUNCE_SECONDS = 300; // 5 minutes per user

class StatePropagationService {
  /**
   * Trigger propagation after a feature node's state changes.
   * Debounced: at most once per 5 minutes per user.
   */
  async propagate(userId: string, changedNodeId: FeatureNodeId): Promise<void> {
    const debounceKey = `${DEBOUNCE_KEY_PREFIX}${userId}`;

    try {
      const recent = await redisCacheService.get<string>(debounceKey);
      if (recent) {
        logger.debug('[StatePropagation] Debounced — skipping', { userId, changedNodeId });
        return;
      }
    } catch {
      // Redis miss — proceed
    }

    // Set debounce lock
    redisCacheService.set(debounceKey, 'active', DEBOUNCE_SECONDS).catch(() => {});

    try {
      const affectedNodes = this.findAffectedNodes(changedNodeId);

      if (affectedNodes.length === 0) {
        logger.debug('[StatePropagation] No affected nodes', { userId, changedNodeId });
        return;
      }

      logger.info('[StatePropagation] Propagating state change', {
        userId,
        changedNodeId,
        affectedCount: affectedNodes.length,
        affectedNodes,
      });

      // Invalidate caches so next access recomputes
      await Promise.all([
        featureStateService.invalidateCache(userId),
        graphContextService.invalidateCache(userId),
        nextBestActionService.invalidateCache(userId),
      ]);
    } catch (error) {
      logger.warn('[StatePropagation] Failed', {
        userId,
        changedNodeId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  /**
   * Find all nodes affected by a change to the given node.
   * Traverses: outgoing static cross-edges + direct children.
   */
  private findAffectedNodes(changedNodeId: FeatureNodeId): FeatureNodeId[] {
    const affected = new Set<FeatureNodeId>();

    // Outgoing edges from changed node
    for (const edge of STATIC_CROSS_EDGES) {
      if (edge.sourceNodeId === changedNodeId) {
        affected.add(edge.targetNodeId);
      }
      // Bidirectional: if target changes, source may also be affected
      if (edge.targetNodeId === changedNodeId) {
        affected.add(edge.sourceNodeId);
      }
    }

    // Direct children in hierarchy
    const children = getDirectChildrenOf(changedNodeId);
    for (const child of children) {
      affected.add(child.id);
    }

    affected.delete(changedNodeId);
    return Array.from(affected);
  }
}

export const statePropagationService = new StatePropagationService();
