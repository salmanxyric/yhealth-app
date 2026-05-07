/**
 * @file Feature State Service
 * @description Hydrates per-user feature node state by querying each feature's
 *              data sources. Computes health scores, activity counts, status,
 *              and alerts. Results are cached in Redis (5 min TTL).
 */

import { query as dbQuery } from '../../config/database.config.js';
import { logger } from '../logger.service.js';
import { redisCacheService } from '../redis-cache.service.js';
import {
  FEATURE_NODE_REGISTRY,
  getAllFeatureNodeIds,
} from './feature-node-registry.js';
import type {
  FeatureNodeId,
  FeatureNodeState,
  FeatureNodeStatus,
  FeatureAlert,
} from '@shared/types/domain/reasoning-graph.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes
const CACHE_PREFIX = 'rg:state:';

const USER_COLUMN_OVERRIDES: Record<string, string> = {
  community_posts: 'author_id',
  community_replies: 'author_id',
};

// ============================================
// PUBLIC API
// ============================================

class FeatureStateService {
  /**
   * Get all feature node states for a user.
   * Returns from cache if available, otherwise hydrates from DB.
   */
  async getAllStates(userId: string): Promise<FeatureNodeState[]> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;
    try {
      const cached = await redisCacheService.get<FeatureNodeState[]>(cacheKey);
      if (cached) return cached;
    } catch {
      // cache miss — proceed to hydrate
    }

    const states = await this.hydrateAllStates(userId);

    redisCacheService.set(cacheKey, states, CACHE_TTL_SECONDS).catch(() => {});
    return states;
  }

  /** Get state for a single feature node */
  async getState(userId: string, nodeId: FeatureNodeId): Promise<FeatureNodeState | null> {
    const all = await this.getAllStates(userId);
    return all.find((s) => s.featureNodeId === nodeId) ?? null;
  }

  /** Invalidate cached state (call after graph events) */
  async invalidateCache(userId: string): Promise<void> {
    await redisCacheService.delete(`${CACHE_PREFIX}${userId}`).catch(() => {});
  }

  /**
   * Persist a single feature's state update to DB.
   * Called by the graph event emitter after tool execution.
   */
  async upsertState(userId: string, state: Partial<FeatureNodeState> & { featureNodeId: FeatureNodeId }): Promise<void> {
    try {
      await dbQuery(
        `INSERT INTO user_feature_state (user_id, feature_node_id, health_score, last_activity_at, activity_count_7d, status, alerts, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (user_id, feature_node_id) DO UPDATE SET
           health_score = COALESCE($3, user_feature_state.health_score),
           last_activity_at = COALESCE($4, user_feature_state.last_activity_at),
           activity_count_7d = COALESCE($5, user_feature_state.activity_count_7d),
           status = COALESCE($6, user_feature_state.status),
           alerts = COALESCE($7, user_feature_state.alerts),
           updated_at = NOW()`,
        [
          userId,
          state.featureNodeId,
          state.healthScore ?? 0,
          state.lastActivityAt ?? null,
          state.activityCount7d ?? 0,
          state.status ?? 'never_used',
          JSON.stringify(state.alerts ?? []),
        ],
      );
      await this.invalidateCache(userId);
    } catch (error) {
      logger.error('[FeatureState] Failed to upsert state', { userId, nodeId: state.featureNodeId, error });
    }
  }

  // ============================================
  // HYDRATION (from data sources)
  // ============================================

  private async hydrateAllStates(userId: string): Promise<FeatureNodeState[]> {
    const nodeIds = getAllFeatureNodeIds();

    // First try to load persisted states from DB
    const persisted = await this.loadPersistedStates(userId);
    const persistedMap = new Map(persisted.map((s) => [s.featureNodeId, s]));

    // For nodes without persisted state, compute from data sources
    const missingIds = nodeIds.filter((id) => !persistedMap.has(id));

    if (missingIds.length > 0) {
      const computed = await this.computeStatesFromSources(userId, missingIds);
      for (const state of computed) {
        persistedMap.set(state.featureNodeId, state);
        // Fire-and-forget persist
        this.upsertState(userId, state).catch(() => {});
      }
    }

    return nodeIds.map(
      (id) =>
        persistedMap.get(id) ?? {
          featureNodeId: id,
          userId,
          healthScore: 0,
          lastActivityAt: null,
          activityCount7d: 0,
          status: 'never_used' as FeatureNodeStatus,
          alerts: [],
          updatedAt: new Date().toISOString(),
        },
    );
  }

  private async loadPersistedStates(userId: string): Promise<FeatureNodeState[]> {
    try {
      const { rows } = await dbQuery(
        `SELECT feature_node_id, health_score, last_activity_at, activity_count_7d, status, alerts, updated_at
         FROM user_feature_state WHERE user_id = $1`,
        [userId],
      );

      return rows.map((r: any) => ({
        featureNodeId: r.feature_node_id as FeatureNodeId,
        userId,
        healthScore: r.health_score,
        lastActivityAt: r.last_activity_at?.toISOString() ?? null,
        activityCount7d: r.activity_count_7d,
        status: r.status as FeatureNodeStatus,
        alerts: r.alerts ?? [],
        updatedAt: r.updated_at?.toISOString() ?? new Date().toISOString(),
      }));
    } catch (error) {
      logger.warn('[FeatureState] Failed to load persisted states', { userId, error });
      return [];
    }
  }

  private async computeStatesFromSources(
    userId: string,
    nodeIds: FeatureNodeId[],
  ): Promise<FeatureNodeState[]> {
    const results: FeatureNodeState[] = [];

    // Batch: get activity counts and last activity for all data source tables
    const tableQueries = new Map<string, FeatureNodeId>();
    for (const nodeId of nodeIds) {
      const node = FEATURE_NODE_REGISTRY.find((n) => n.id === nodeId);
      if (!node || node.dataSources.length === 0) {
        results.push({
          featureNodeId: nodeId,
          userId,
          healthScore: 0,
          lastActivityAt: null,
          activityCount7d: 0,
          status: 'never_used',
          alerts: [],
          updatedAt: new Date().toISOString(),
        });
        continue;
      }
      // Use first data source as primary signal
      tableQueries.set(node.dataSources[0], nodeId);
    }

    // Query each table in parallel for activity metrics
    const tableEntries = Array.from(tableQueries.entries());
    const queryResults = await Promise.allSettled(
      tableEntries.map(async ([table, nodeId]) => {
        try {
          const userCol = USER_COLUMN_OVERRIDES[table] ?? 'user_id';
          const { rows } = await dbQuery(
            `SELECT
               COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS count_7d,
               MAX(created_at) AS last_activity,
               COUNT(*) AS total_count
             FROM ${this.sanitizeTableName(table)}
             WHERE ${userCol} = $1`,
            [userId],
          );

          const row = rows[0];
          const count7d = parseInt(row.count_7d ?? '0', 10);
          const lastActivity: string | null = row.last_activity?.toISOString() ?? null;
          const totalCount = parseInt(row.total_count ?? '0', 10);

          const status = this.computeStatus(count7d, lastActivity);
          const healthScore = this.computeHealthScore(count7d, status, totalCount);

          return {
            featureNodeId: nodeId,
            userId,
            healthScore,
            lastActivityAt: lastActivity,
            activityCount7d: count7d,
            status,
            alerts: [] as FeatureAlert[],
            updatedAt: new Date().toISOString(),
          };
        } catch {
          return {
            featureNodeId: nodeId,
            userId,
            healthScore: 0,
            lastActivityAt: null,
            activityCount7d: 0,
            status: 'never_used' as FeatureNodeStatus,
            alerts: [],
            updatedAt: new Date().toISOString(),
          };
        }
      }),
    );

    for (const result of queryResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }

    return results;
  }

  private computeStatus(count7d: number, lastActivity: string | null): FeatureNodeStatus {
    if (count7d > 0) return 'active';
    if (!lastActivity) return 'never_used';
    const daysSince = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30 ? 'dormant' : 'active';
  }

  private computeHealthScore(count7d: number, status: FeatureNodeStatus, totalCount: number): number {
    if (status === 'never_used') return 0;
    if (status === 'dormant') return Math.min(20, totalCount);
    // Active: scale 0-100 based on 7-day activity (7 entries/week = 100)
    return Math.min(100, Math.round((count7d / 7) * 100));
  }

  /** Allowlist-based table name sanitization to prevent SQL injection */
  private sanitizeTableName(table: string): string {
    const allTables = new Set(
      FEATURE_NODE_REGISTRY.flatMap((n) => n.dataSources),
    );
    if (!allTables.has(table)) {
      throw new Error(`Unknown data source table: ${table}`);
    }
    return table;
  }
}

export const featureStateService = new FeatureStateService();
