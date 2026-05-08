/**
 * @file Tool Execution Wrapper Service
 * @description Wraps every AI tool invocation with:
 *   1. Mutation type classification
 *   2. Execution timing
 *   3. Audit logging (mutations only)
 *   4. Per-tool metrics collection
 *   5. Entitlement checking (Phase 3)
 *   6. Idempotency deduplication (Phase 4)
 *
 * Inserted at the single chokepoint: executeTools() in langgraph-chatbot.service.ts
 */

import { createHash } from 'crypto';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { logger } from './logger.service.js';
import { toolAuditService } from './tool-audit.service.js';
import { toolMetricsService } from './tool-metrics.service.js';
import { TOOL_FEATURE_REQUIREMENTS } from '../config/tool-entitlements.config.js';
import { getUserEntitlements } from './entitlement.service.js';
import { env } from '../config/env.config.js';

// ============================================
// TYPES
// ============================================

export interface ToolExecutionContext {
  userId: string;
  conversationId?: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  toolCallId: string;
}

export interface ToolExecutionResult {
  content: string;
  durationMs: number;
  success: boolean;
  mutationType: MutationType;
}

export type MutationType = 'read' | 'create' | 'update' | 'delete' | 'unknown';

// ============================================
// MUTATION TYPE CLASSIFICATION
// ============================================

const READ_PREFIXES = ['get', 'check', 'search', 'list', 'find', 'track'];
const CREATE_PREFIXES = ['create', 'add', 'log', 'bulk'];
const UPDATE_PREFIXES = ['update', 'mark', 'reset', 'toggle', 'snooze', 'merge', 'batch'];
const DELETE_PREFIXES = ['delete', 'remove'];

const MANAGER_READ_ACTIONS = new Set([
  'get', 'getAll', 'getById', 'getByName', 'getByDate', 'getPlans', 'getLogs',
  'getActive', 'getStats', 'getLatest', 'getStreak', 'getInsights',
  'getTimeline', 'getPatterns', 'getTrends', 'getHistory', 'getCheckin',
  'checkConflicts',
  'status', 'overview', 'recommend', 'search_and_play', 'progress',
  'analytics', 'summary', 'trends',
]);

const MANAGER_CREATE_ACTIONS = new Set(['create', 'add', 'log', 'start']);
const MANAGER_UPDATE_ACTIONS = new Set(['update', 'mark', 'complete', 'toggle', 'snooze', 'reschedule']);
const MANAGER_DELETE_ACTIONS = new Set(['delete', 'remove', 'cancel']);

export function classifyMutationType(toolName: string, args: Record<string, unknown>): MutationType {
  // Semantic managers: inspect args.action
  if (toolName.endsWith('Manager') || toolName === 'activityTimeline' || toolName === 'aiDecisionHistory') {
    const action = typeof args.action === 'string' ? args.action : '';
    if (MANAGER_READ_ACTIONS.has(action)) return 'read';
    if (MANAGER_CREATE_ACTIONS.has(action)) return 'create';
    if (MANAGER_UPDATE_ACTIONS.has(action)) return 'update';
    if (MANAGER_DELETE_ACTIONS.has(action)) return 'delete';
    // Default for managers without recognized action
    return action ? 'unknown' : 'read';
  }

  // Domain tools: inspect name prefix
  const lowerName = toolName.toLowerCase();
  if (READ_PREFIXES.some(p => lowerName.startsWith(p))) return 'read';
  if (DELETE_PREFIXES.some(p => lowerName.startsWith(p))) return 'delete';
  if (CREATE_PREFIXES.some(p => lowerName.startsWith(p))) return 'create';
  if (UPDATE_PREFIXES.some(p => lowerName.startsWith(p))) return 'update';

  return 'unknown';
}

// ============================================
// ENTITY TYPE EXTRACTION
// ============================================

const ENTITY_TYPE_MAP: Record<string, string> = {
  meal: 'meal', recipe: 'recipe', diet: 'diet_plan', dietPlan: 'diet_plan',
  workout: 'workout', goal: 'goal', schedule: 'schedule', plan: 'plan',
  progress: 'progress', habit: 'habit', reminder: 'reminder', notification: 'notification',
  water: 'water_intake', shopping: 'shopping_list', body: 'body_image',
  mood: 'mood', stress: 'stress', journal: 'journal', energy: 'energy',
  sleep: 'sleep', medication: 'medication', integration: 'integration',
  preference: 'preference', checkin: 'checkin', competition: 'competition',
};

export function deriveEntityType(toolName: string): string | null {
  const lower = toolName.toLowerCase();
  for (const [key, type] of Object.entries(ENTITY_TYPE_MAP)) {
    if (lower.includes(key.toLowerCase())) return type;
  }
  return null;
}

function extractEntityId(resultContent: string): string | null {
  try {
    const parsed = JSON.parse(resultContent);
    // Try common ID patterns in tool results
    return parsed.id
      || parsed.goalId
      || parsed.mealId
      || parsed.data?.id
      || parsed.meal?.id
      || parsed.goal?.id
      || parsed.workout?.id
      || parsed.plan?.id
      || parsed.recipe?.id
      || parsed.schedule?.id
      || parsed.habit?.id
      || parsed.reminder?.id
      || parsed.journal?.id
      || null;
  } catch {
    return null;
  }
}

// ============================================
// IDEMPOTENCY
// ============================================

function generateIdempotencyKey(conversationId: string | undefined, toolName: string, args: Record<string, unknown>): string | null {
  if (!conversationId) return null;
  const sortedArgs = JSON.stringify(args, Object.keys(args).sort());
  return createHash('sha256')
    .update(`${conversationId}:${toolName}:${sortedArgs}`)
    .digest('hex')
    .slice(0, 32);
}

// In-memory dedup cache: idempotencyKey → { result, timestamp }
const recentMutations = new Map<string, { result: string; timestamp: number }>();
const DEDUP_WINDOW_MS = 60_000;

function pruneRecentMutations(): void {
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  for (const [key, entry] of recentMutations) {
    if (entry.timestamp < cutoff) recentMutations.delete(key);
  }
}

// Prune every 5 minutes
setInterval(pruneRecentMutations, 5 * 60 * 1000).unref();

// ============================================
// WRAPPER
// ============================================

export async function executeToolWithWrapper(
  tool: DynamicStructuredTool,
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const { userId, conversationId, toolName, toolArgs, toolCallId } = ctx;
  const mutationType = classifyMutationType(toolName, toolArgs);

  // 1. Entitlement check (for premium tools)
  const requiredFeature = TOOL_FEATURE_REQUIREMENTS[toolName];
  if (requiredFeature) {
    try {
      const bundle = await getUserEntitlements(userId);
      const feature = bundle.features[requiredFeature];
      if (!feature || !feature.enabled) {
        const mode = env.entitlement.mode;
        if (mode === 'enforce-all' || (mode === 'enforce-new' && bundle.userCreatedAt)) {
          const result = JSON.stringify({
            success: false,
            error: `This feature requires a Pro plan. Please upgrade to access ${toolName}.`,
            code: 'FEATURE_DISABLED',
          });
          toolMetricsService.record(toolName, 0, false);
          return { content: result, durationMs: 0, success: false, mutationType };
        }
        logger.warn('[ToolWrapper] Shadow denial — tool entitlement check failed', {
          userId, toolName, requiredFeature, mode,
        });
      }
    } catch {
      // Entitlement check failure should not block tool execution
    }
  }

  // 2. Idempotency check (mutations only, within same conversation)
  let idempotencyKey: string | null = null;
  if (mutationType !== 'read') {
    idempotencyKey = generateIdempotencyKey(conversationId, toolName, toolArgs);
    if (idempotencyKey) {
      const cached = recentMutations.get(idempotencyKey);
      if (cached && (Date.now() - cached.timestamp) < DEDUP_WINDOW_MS) {
        logger.info('[ToolWrapper] Idempotency hit — returning cached result', {
          userId, toolName, mutationType, toolCallId,
        });
        toolMetricsService.record(toolName, 0, true);
        return { content: cached.result, durationMs: 0, success: true, mutationType };
      }
    }
  }

  // 3. Execute with timing
  const startTime = performance.now();
  let content: string = '';
  let success = true;
  let errorMessage: string | undefined;

  try {
    const result = await tool.invoke(toolArgs);
    content = typeof result === 'string' ? result : JSON.stringify(result);

    // Check if the tool itself reported failure
    try {
      const parsed = JSON.parse(content);
      if (parsed.success === false) {
        success = false;
        errorMessage = parsed.error;
      }
    } catch {
      // Not JSON — treat as success
    }
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    content = JSON.stringify({ success: false, error: errorMessage });
    // Re-throw after recording metrics/audit so the caller's error handling still works
    const durationMs = Math.round(performance.now() - startTime);
    toolMetricsService.record(toolName, durationMs, success);
    if (mutationType !== 'read') {
      toolAuditService.logToolExecution({
        userId, conversationId, toolName, mutationType, toolArgs,
        toolResult: content.slice(0, 2000), entityType: deriveEntityType(toolName),
        entityId: null, durationMs, success, errorMessage, idempotencyKey,
      });
    }
    throw error;
  }

  const durationMs = Math.round(performance.now() - startTime);

  // 4. Record metrics (all tools)
  toolMetricsService.record(toolName, durationMs, success);

  // 5. Audit log (mutations only, fire-and-forget)
  if (mutationType !== 'read') {
    const entityType = deriveEntityType(toolName);
    const entityId = extractEntityId(content);

    toolAuditService.logToolExecution({
      userId, conversationId, toolName, mutationType, toolArgs,
      toolResult: content.slice(0, 2000), entityType, entityId,
      durationMs, success, errorMessage, idempotencyKey,
    });

    // Cache for idempotency dedup
    if (success && idempotencyKey) {
      recentMutations.set(idempotencyKey, { result: content, timestamp: Date.now() });
    }
  }

  // 6. Slow tool warning
  if (durationMs > 5000) {
    logger.warn('[ToolWrapper] Slow tool execution', {
      userId, toolName, mutationType, durationMs,
    });
  }

  return { content, durationMs, success, mutationType };
}
