/**
 * @file Next Best Action Service
 * @description Pre-computes top recommended actions by traversing the reasoning
 *              graph. Uses feature states, edge weights, and temporal patterns
 *              to suggest what the user should do next.
 */

import { redisCacheService } from '../redis-cache.service.js';
import { featureStateService } from './feature-state.service.js';
import {
  FEATURE_NODE_REGISTRY,
  STATIC_CROSS_EDGES,
} from './feature-node-registry.js';
import type {
  FeatureNodeId,
  FeatureNodeState,
} from '@shared/types/domain/reasoning-graph.js';

const CACHE_TTL_SECONDS = 300;
const CACHE_PREFIX = 'rg:nba:';
const MAX_ACTIONS = 5;

export interface NextBestAction {
  id: string;
  type: 'revive_dormant' | 'resolve_conflict' | 'cascade_opportunity' | 'coverage_gap' | 'declining_trend';
  priority: number;
  title: string;
  description: string;
  targetNodeId: FeatureNodeId;
  relatedNodeIds: FeatureNodeId[];
  suggestedPrompt?: string;
}

class NextBestActionService {
  async getActions(userId: string): Promise<NextBestAction[]> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;
    try {
      const cached = await redisCacheService.get<NextBestAction[]>(cacheKey);
      if (cached) return cached;
    } catch {
      // cache miss
    }

    const states = await featureStateService.getAllStates(userId);
    const actions = this.computeActions(states);

    redisCacheService.set(cacheKey, actions, CACHE_TTL_SECONDS).catch(() => {});
    return actions;
  }

  async invalidateCache(userId: string): Promise<void> {
    await redisCacheService.delete(`${CACHE_PREFIX}${userId}`).catch(() => {});
  }

  private computeActions(states: FeatureNodeState[]): NextBestAction[] {
    const stateMap = new Map(states.map((s) => [s.featureNodeId, s]));
    const actions: NextBestAction[] = [];

    actions.push(...this.findDormantRevivals(stateMap));
    actions.push(...this.findCascadeOpportunities(stateMap));
    actions.push(...this.findCoverageGaps(stateMap));
    actions.push(...this.findDecliningTrends(stateMap));
    actions.push(...this.findConflictResolutions(stateMap));

    actions.sort((a, b) => b.priority - a.priority);
    return actions.slice(0, MAX_ACTIONS);
  }

  private findDormantRevivals(stateMap: Map<FeatureNodeId, FeatureNodeState>): NextBestAction[] {
    const actions: NextBestAction[] = [];

    for (const edge of STATIC_CROSS_EDGES) {
      const source = stateMap.get(edge.sourceNodeId);
      const target = stateMap.get(edge.targetNodeId);
      if (!source || !target) continue;

      if (source.status === 'active' && target.status === 'dormant' && edge.edgeType === 'supports') {
        const daysAgo = target.lastActivityAt
          ? Math.round((Date.now() - new Date(target.lastActivityAt).getTime()) / 86400000)
          : null;

        actions.push({
          id: `revive:${target.featureNodeId}`,
          type: 'revive_dormant',
          priority: 70 + edge.weight * 20,
          title: `Revive ${this.getLabel(target.featureNodeId)}`,
          description: `${this.getLabel(target.featureNodeId)} has been dormant${daysAgo ? ` for ${daysAgo} days` : ''} but ${this.getLabel(source.featureNodeId)} is active and supports it.`,
          targetNodeId: target.featureNodeId,
          relatedNodeIds: [source.featureNodeId],
          suggestedPrompt: `How can I get back into ${this.getLabel(target.featureNodeId).toLowerCase()}?`,
        });
      }
    }

    return actions;
  }

  private findCascadeOpportunities(stateMap: Map<FeatureNodeId, FeatureNodeState>): NextBestAction[] {
    const actions: NextBestAction[] = [];

    for (const edge of STATIC_CROSS_EDGES) {
      if (edge.edgeType !== 'feeds_data') continue;

      const source = stateMap.get(edge.sourceNodeId);
      const target = stateMap.get(edge.targetNodeId);
      if (!source || !target) continue;

      if (source.status === 'active' && source.healthScore >= 75 && target.status === 'active' && target.healthScore < 50) {
        actions.push({
          id: `cascade:${source.featureNodeId}:${target.featureNodeId}`,
          type: 'cascade_opportunity',
          priority: 60 + (source.healthScore - target.healthScore) * 0.3,
          title: `Leverage ${this.getLabel(source.featureNodeId)} for ${this.getLabel(target.featureNodeId)}`,
          description: `${this.getLabel(source.featureNodeId)} is strong (${source.healthScore}) and feeds data to ${this.getLabel(target.featureNodeId)} (${target.healthScore}). Improving the connection could boost both.`,
          targetNodeId: target.featureNodeId,
          relatedNodeIds: [source.featureNodeId],
          suggestedPrompt: `How does my ${this.getLabel(source.featureNodeId).toLowerCase()} data relate to my ${this.getLabel(target.featureNodeId).toLowerCase()} progress?`,
        });
      }
    }

    return actions;
  }

  private findCoverageGaps(stateMap: Map<FeatureNodeId, FeatureNodeState>): NextBestAction[] {
    const actions: NextBestAction[] = [];
    const goalsState = stateMap.get('goals');
    if (!goalsState || goalsState.status !== 'active') return actions;

    for (const edge of STATIC_CROSS_EDGES) {
      if (edge.sourceNodeId !== 'goals' || edge.edgeType !== 'requires') continue;

      const target = stateMap.get(edge.targetNodeId);
      if (!target) continue;

      if (target.status === 'never_used') {
        actions.push({
          id: `gap:${target.featureNodeId}`,
          type: 'coverage_gap',
          priority: 80,
          title: `Start using ${this.getLabel(target.featureNodeId)}`,
          description: `You have active goals that require ${this.getLabel(target.featureNodeId).toLowerCase()}, but you've never used this feature.`,
          targetNodeId: target.featureNodeId,
          relatedNodeIds: ['goals'],
          suggestedPrompt: `Help me get started with ${this.getLabel(target.featureNodeId).toLowerCase()} tracking`,
        });
      }
    }

    return actions;
  }

  private findDecliningTrends(stateMap: Map<FeatureNodeId, FeatureNodeState>): NextBestAction[] {
    const actions: NextBestAction[] = [];

    for (const [nodeId, state] of stateMap) {
      if (nodeId === 'ai-coach') continue;

      const decliningAlert = state.alerts.find((a) => a.type === 'declining');
      if (!decliningAlert || state.status !== 'active') continue;

      const downstreamNodes = STATIC_CROSS_EDGES
        .filter((e) => e.sourceNodeId === nodeId)
        .map((e) => e.targetNodeId)
        .filter((id) => stateMap.get(id)?.status === 'active');

      actions.push({
        id: `decline:${nodeId}`,
        type: 'declining_trend',
        priority: decliningAlert.severity === 'high' ? 90 : 65,
        title: `${this.getLabel(nodeId)} is declining`,
        description: decliningAlert.message + (downstreamNodes.length > 0
          ? ` This may affect ${downstreamNodes.map((id) => this.getLabel(id)).join(', ')}.`
          : ''),
        targetNodeId: nodeId,
        relatedNodeIds: downstreamNodes,
        suggestedPrompt: `What's happening with my ${this.getLabel(nodeId).toLowerCase()} trends?`,
      });
    }

    return actions;
  }

  private findConflictResolutions(stateMap: Map<FeatureNodeId, FeatureNodeState>): NextBestAction[] {
    const actions: NextBestAction[] = [];

    for (const state of stateMap.values()) {
      const conflicts = state.alerts.filter((a) => a.type === 'conflict' && a.relatedNodeId);
      for (const alert of conflicts) {
        const relatedState = stateMap.get(alert.relatedNodeId!);
        if (!relatedState) continue;

        actions.push({
          id: `conflict:${state.featureNodeId}:${alert.relatedNodeId}`,
          type: 'resolve_conflict',
          priority: alert.severity === 'high' ? 85 : 60,
          title: `Resolve conflict: ${this.getLabel(state.featureNodeId)} ↔ ${this.getLabel(alert.relatedNodeId!)}`,
          description: alert.message,
          targetNodeId: state.featureNodeId,
          relatedNodeIds: [alert.relatedNodeId!],
          suggestedPrompt: `I'm seeing conflicting signals between ${this.getLabel(state.featureNodeId).toLowerCase()} and ${this.getLabel(alert.relatedNodeId!).toLowerCase()}. Can you help me understand why?`,
        });
      }
    }

    return actions;
  }

  private getLabel(nodeId: FeatureNodeId): string {
    return FEATURE_NODE_REGISTRY.find((n) => n.id === nodeId)?.label ?? nodeId;
  }
}

export const nextBestActionService = new NextBestActionService();
