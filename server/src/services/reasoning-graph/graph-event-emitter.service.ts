/**
 * @file Graph Event Emitter Service
 * @description Emits graph events when LangGraph tools execute, keeping
 *              per-user feature state up to date. Lightweight: only updates
 *              last_activity_at, increments activity_count_7d, and sets status.
 */

import { logger } from '../logger.service.js';
import { featureStateService } from './feature-state.service.js';
import { graphContextService } from './graph-context.service.js';
import { statePropagationService } from './state-propagation.service.js';
import {
  FEATURE_NODE_REGISTRY,
  featureNodeForToolGroup,
} from './feature-node-registry.js';
import type {
  FeatureNodeId,
  GraphEvent,
} from '@shared/types/domain/reasoning-graph.js';

// Debounce: max one state update per feature per user per 30 seconds
const _recentEvents = new Map<string, number>();
const DEBOUNCE_MS = 30_000;

class GraphEventEmitterService {
  /**
   * Emit a graph event after a tool executes.
   * Maps tool name → feature node and updates state.
   */
  async emitToolEvent(
    userId: string,
    toolName: string,
    eventType: GraphEvent['eventType'] = 'data_updated',
  ): Promise<void> {
    const featureNodeId = this.resolveFeatureNode(toolName);
    if (!featureNodeId) return;

    await this.emit({ userId, featureNodeId, eventType, timestamp: new Date().toISOString(), toolName });
  }

  /**
   * Emit a graph event for a specific feature node.
   */
  async emit(event: GraphEvent): Promise<void> {
    const debounceKey = `${event.userId}:${event.featureNodeId}`;
    const now = Date.now();
    const lastEmit = _recentEvents.get(debounceKey) ?? 0;

    if (now - lastEmit < DEBOUNCE_MS) return;
    _recentEvents.set(debounceKey, now);

    try {
      await featureStateService.upsertState(event.userId, {
        featureNodeId: event.featureNodeId,
        lastActivityAt: event.timestamp,
        status: 'active',
      });

      // Invalidate graph context cache so next AI Coach turn sees fresh state
      await graphContextService.invalidateCache(event.userId);

      // Propagate state change to connected nodes (fire-and-forget, debounced)
      statePropagationService.propagate(event.userId, event.featureNodeId).catch(() => {});

      logger.debug('[GraphEvent] Emitted', {
        userId: event.userId,
        node: event.featureNodeId,
        type: event.eventType,
        tool: event.toolName,
      });
    } catch (error) {
      logger.warn('[GraphEvent] Failed to emit', { event, error });
    }
  }

  /**
   * Resolve a LangGraph tool name to its feature node ID.
   * Uses the tool group mapping from the feature node registry.
   */
  private resolveFeatureNode(toolName: string): FeatureNodeId | undefined {
    // Direct tool-name-to-feature mapping via known prefixes
    const toolToGroup: Record<string, string> = {
      mealManager: 'meals',
      recipeManager: 'meals',
      dietPlanManager: 'meals',
      getUserMealLogs: 'meals',
      workoutManager: 'workouts',
      getUserWorkoutPlans: 'workouts',
      getUserWorkoutLogs: 'workouts',
      goalManager: 'goals',
      getUserGoals: 'goals',
      scheduleManager: 'schedules',
      moodManager: 'wellbeing',
      stressManager: 'wellbeing',
      journalManager: 'wellbeing',
      energyManager: 'wellbeing',
      habitManager: 'wellbeing',
      sleepManager: 'wellbeing',
      progressManager: 'progress',
      waterIntakeManager: 'water',
      competitionManager: 'competitions',
      emotionalCheckinManager: 'emotional',
      gamificationManager: 'gamification',
      musicManager: 'music',
      statusManager: 'status',
      whoopAnalyticsManager: 'integrations',
      personalContextManager: 'personal',
    };

    const group = toolToGroup[toolName];
    if (group) return featureNodeForToolGroup(group);

    // Fallback: search registry for any node whose tool groups contain a matching prefix
    for (const node of FEATURE_NODE_REGISTRY) {
      for (const tg of node.toolGroups) {
        if (toolName.toLowerCase().includes(tg.toLowerCase())) {
          return node.id;
        }
      }
    }

    return undefined;
  }

  /** Clean up old debounce entries (call periodically) */
  cleanup(): void {
    const cutoff = Date.now() - DEBOUNCE_MS * 2;
    for (const [key, time] of _recentEvents) {
      if (time < cutoff) _recentEvents.delete(key);
    }
  }
}

export const graphEventEmitterService = new GraphEventEmitterService();

// Periodic cleanup to prevent unbounded Map growth
const _cleanupInterval = setInterval(() => graphEventEmitterService.cleanup(), 60_000);
if (typeof _cleanupInterval.unref === 'function') _cleanupInterval.unref();
