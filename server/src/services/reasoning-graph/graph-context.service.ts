/**
 * @file Graph Context Service
 * @description Builds the ~500-token GraphContextSummary that gets injected
 *              into the AI Coach's system prompt. Pre-computes feature states,
 *              alerts, conflicts, and suggested next actions.
 */

import { logger } from '../logger.service.js';
import { redisCacheService } from '../redis-cache.service.js';
import { featureStateService } from './feature-state.service.js';
import { nextBestActionService } from './next-best-action.service.js';
import { FEATURE_NODE_REGISTRY, STATIC_CROSS_EDGES } from './feature-node-registry.js';
import { setGraphAlertsForUser } from '../tool-router.service.js';
import type {
  FeatureNodeId,
  FeatureNodeState,
  FeatureAlert,
  GraphContextSummary,
} from '@shared/types/domain/reasoning-graph.js';

const CACHE_TTL_SECONDS = 300;
const CACHE_PREFIX = 'rg:ctx:';
const MAX_ALERTS = 5;
const MAX_CONFLICTS = 3;
const MAX_ACTIONS = 5;

class GraphContextService {
  /**
   * Build the full graph context summary for a user.
   * Returns cached result if available.
   */
  async buildSummary(userId: string): Promise<GraphContextSummary> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;
    try {
      const cached = await redisCacheService.get<GraphContextSummary>(cacheKey);
      if (cached) return cached;
    } catch {
      // cache miss
    }

    const [states, nbaActions] = await Promise.all([
      featureStateService.getAllStates(userId),
      nextBestActionService.getActions(userId).catch(() => []),
    ]);

    const summary = this.computeSummary(states);

    // Enrich suggested actions with graph-traversal recommendations
    if (nbaActions.length > 0) {
      const nbaDescriptions = nbaActions.map((a) => a.title);
      const existing = new Set(summary.suggestedNextActions);
      for (const desc of nbaDescriptions) {
        if (!existing.has(desc)) {
          summary.suggestedNextActions.push(desc);
        }
      }
      summary.suggestedNextActions = summary.suggestedNextActions.slice(0, MAX_ACTIONS);
    }

    redisCacheService.set(cacheKey, summary, CACHE_TTL_SECONDS).catch(() => {});
    return summary;
  }

  /**
   * Build the text prompt appendix for the AI Coach system prompt.
   * Returns empty string if graph context is unavailable.
   */
  async buildContext(userId: string): Promise<string> {
    try {
      const summary = await this.buildSummary(userId);

      if (summary.topAlerts.length > 0) {
        setGraphAlertsForUser(userId, summary.topAlerts);
      }

      return this.formatAsPrompt(summary);
    } catch (error) {
      logger.warn('[GraphContext] Failed to build context', { userId, error });
      return '';
    }
  }

  /** Invalidate cached context (call when feature state changes) */
  async invalidateCache(userId: string): Promise<void> {
    await redisCacheService.delete(`${CACHE_PREFIX}${userId}`).catch(() => {});
  }

  // ============================================
  // PRIVATE
  // ============================================

  private computeSummary(states: FeatureNodeState[]): GraphContextSummary {
    const activeNodes: FeatureNodeId[] = [];
    const dormantNodes: FeatureNodeId[] = [];
    const neverUsedNodes: FeatureNodeId[] = [];
    const allAlerts: FeatureAlert[] = [];

    for (const state of states) {
      if (state.featureNodeId === 'ai-coach') continue;

      switch (state.status) {
        case 'active':
          activeNodes.push(state.featureNodeId);
          break;
        case 'dormant':
          dormantNodes.push(state.featureNodeId);
          break;
        case 'never_used':
          neverUsedNodes.push(state.featureNodeId);
          break;
      }

      allAlerts.push(...state.alerts);
    }

    // Sort alerts by severity (high > medium > low)
    const severityOrder = { high: 0, medium: 1, low: 2 };
    allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const conflicts = this.detectCrossNodeConflicts(states);
    const suggestedActions = this.computeSuggestedActions(states, dormantNodes, neverUsedNodes);
    const graphHealthScore = this.computeGraphHealth(states);

    return {
      totalNodes: states.length - 1, // exclude ai-coach
      activeNodes,
      dormantNodes,
      neverUsedNodes,
      topAlerts: allAlerts.slice(0, MAX_ALERTS),
      crossNodeConflicts: conflicts.slice(0, MAX_CONFLICTS),
      suggestedNextActions: suggestedActions.slice(0, MAX_ACTIONS),
      graphHealthScore,
    };
  }

  private detectCrossNodeConflicts(states: FeatureNodeState[]): string[] {
    const conflicts: string[] = [];
    const stateMap = new Map(states.map((s) => [s.featureNodeId, s]));

    // Check static cross-edges for conflicting signals
    for (const edge of STATIC_CROSS_EDGES) {
      const source = stateMap.get(edge.sourceNodeId);
      const target = stateMap.get(edge.targetNodeId);
      if (!source || !target) continue;

      // If source is very active but target is dormant, that's a gap
      if (source.status === 'active' && source.healthScore > 70 && target.status === 'dormant') {
        const sourceLabel = this.getLabel(edge.sourceNodeId);
        const targetLabel = this.getLabel(edge.targetNodeId);
        conflicts.push(
          `${sourceLabel} is highly active (${source.healthScore}) but ${targetLabel} is dormant — ${edge.edgeType} link underutilized`,
        );
      }
    }

    return conflicts;
  }

  private computeSuggestedActions(
    states: FeatureNodeState[],
    dormantNodes: FeatureNodeId[],
    neverUsedNodes: FeatureNodeId[],
  ): string[] {
    const actions: string[] = [];
    const stateMap = new Map(states.map((s) => [s.featureNodeId, s]));

    // 1. Revive dormant features that correlate with active ones
    for (const dormantId of dormantNodes) {
      const relatedActive = STATIC_CROSS_EDGES.filter(
        (e) =>
          (e.sourceNodeId === dormantId || e.targetNodeId === dormantId) &&
          stateMap.get(e.sourceNodeId === dormantId ? e.targetNodeId : e.sourceNodeId)?.status === 'active',
      );
      if (relatedActive.length > 0) {
        const dormantLabel = this.getLabel(dormantId);
        const dormantState = stateMap.get(dormantId);
        const daysAgo = dormantState?.lastActivityAt
          ? Math.round((Date.now() - new Date(dormantState.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
          : '?';
        actions.push(`Revive ${dormantLabel} (dormant ${daysAgo}d) — connected to ${relatedActive.length} active feature(s)`);
      }
    }

    // 2. Highlight high-severity alerts
    for (const state of states) {
      for (const alert of state.alerts) {
        if (alert.severity === 'high') {
          actions.push(`Address: ${alert.message}`);
        }
      }
    }

    // 3. Suggest never-used features connected to active goals
    const goalsState = stateMap.get('goals');
    if (goalsState?.status === 'active') {
      for (const neverUsedId of neverUsedNodes.slice(0, 2)) {
        const label = this.getLabel(neverUsedId);
        actions.push(`Introduce ${label} — never used but could support active goals`);
      }
    }

    return actions;
  }

  private computeGraphHealth(states: FeatureNodeState[]): number {
    const featureStates = states.filter((s) => s.featureNodeId !== 'ai-coach');
    if (featureStates.length === 0) return 0;

    const activeCount = featureStates.filter((s) => s.status === 'active').length;
    const avgHealthOfActive =
      featureStates
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => sum + s.healthScore, 0) / Math.max(1, activeCount);

    // Weighted: 60% coverage (how many features used), 40% health of active features
    const coverageScore = (activeCount / featureStates.length) * 100;
    return Math.round(coverageScore * 0.6 + avgHealthOfActive * 0.4);
  }

  private formatAsPrompt(summary: GraphContextSummary): string {
    const lines: string[] = [
      '\n\n--- KNOWLEDGE GRAPH STATE ---',
      `Graph Health: ${summary.graphHealthScore}/100 | Active: ${summary.activeNodes.length}/${summary.totalNodes} | Dormant: ${summary.dormantNodes.length} | Never Used: ${summary.neverUsedNodes.length}`,
    ];

    if (summary.activeNodes.length > 0) {
      lines.push(`ACTIVE: ${summary.activeNodes.join(', ')}`);
    }

    if (summary.dormantNodes.length > 0) {
      lines.push(`DORMANT: ${summary.dormantNodes.join(', ')}`);
    }

    if (summary.neverUsedNodes.length > 0) {
      lines.push(`NEVER USED: ${summary.neverUsedNodes.join(', ')}`);
    }

    if (summary.topAlerts.length > 0) {
      lines.push('');
      lines.push('ALERTS:');
      for (const alert of summary.topAlerts) {
        const sev = alert.severity.toUpperCase();
        lines.push(`- [${sev}] ${alert.message}`);
      }
    }

    if (summary.crossNodeConflicts.length > 0) {
      lines.push('');
      lines.push('CROSS-NODE CONFLICTS:');
      for (const conflict of summary.crossNodeConflicts) {
        lines.push(`- ${conflict}`);
      }
    }

    if (summary.suggestedNextActions.length > 0) {
      lines.push('');
      lines.push('SUGGESTED ACTIONS:');
      summary.suggestedNextActions.forEach((action, i) => {
        lines.push(`${i + 1}. ${action}`);
      });
    }

    return lines.join('\n');
  }

  private getLabel(nodeId: FeatureNodeId): string {
    return FEATURE_NODE_REGISTRY.find((n) => n.id === nodeId)?.label ?? nodeId;
  }
}

export const graphContextService = new GraphContextService();
