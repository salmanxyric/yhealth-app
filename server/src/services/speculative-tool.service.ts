/**
 * @file Speculative Tool Pre-Execution Service
 * @description For high-confidence intents, speculatively executes the predicted tool
 * IN PARALLEL with the LLM call. If the LLM picks the same tool, the pre-fetched
 * result is used — saving 1-3s per tool round-trip.
 *
 * If the LLM picks a different tool, the speculative result is silently discarded.
 */

import { logger } from './logger.service.js';
import type { IntentClassification, ToolIntent } from './tool-router.service.js';

// ============================================
// TYPES
// ============================================

export interface SpeculativeResult {
  toolName: string;
  args: Record<string, any>;
  result: string | null;
  startedAt: number;
  completedAt: number | null;
  error?: string;
}

interface SpeculativeMapping {
  toolName: string;
  buildArgs: (message: string) => Record<string, any>;
  minConfidence: number;
}

// ============================================
// INTENT → TOOL MAPPINGS (read-only tools only)
// ============================================

const SPECULATIVE_MAPPINGS: Partial<Record<ToolIntent, SpeculativeMapping>> = {
  water: {
    toolName: 'waterIntakeManager',
    buildArgs: (message) => {
      const lower = message.toLowerCase();
      if (/\b(log|add|record|track|drank|had)\b/.test(lower)) {
        return { action: 'get_today' };
      }
      return { action: 'get_today' };
    },
    minConfidence: 0.5,
  },
  schedules: {
    toolName: 'getScheduleByDate',
    buildArgs: () => {
      const today = new Date().toISOString().slice(0, 10);
      return { date: today };
    },
    minConfidence: 0.5,
  },
  meals: {
    toolName: 'getUserMealLogs',
    buildArgs: () => ({}),
    minConfidence: 0.6,
  },
  workouts: {
    toolName: 'getUserWorkoutLogs',
    buildArgs: () => ({}),
    minConfidence: 0.6,
  },
  goals: {
    toolName: 'getUserGoals',
    buildArgs: () => ({}),
    minConfidence: 0.6,
  },
  progress: {
    toolName: 'getUserProgress',
    buildArgs: () => ({}),
    minConfidence: 0.6,
  },
};

// ============================================
// SERVICE
// ============================================

class SpeculativeToolService {
  /**
   * Check if a speculative execution is worthwhile for this intent.
   * Returns the mapping if confidence is high enough, null otherwise.
   */
  getSpeculativeMapping(intent: IntentClassification): SpeculativeMapping | null {
    const mapping = SPECULATIVE_MAPPINGS[intent.primary];
    if (!mapping) return null;
    if (intent.confidence < mapping.minConfidence) return null;
    return mapping;
  }

  /**
   * Start speculative tool execution. Returns a promise that resolves to the result.
   * The caller should race this against the LLM stream and use the result only if
   * the LLM confirms the same tool call.
   */
  async executeSpeculatively(
    userId: string,
    message: string,
    intent: IntentClassification,
    tools: any[]
  ): Promise<SpeculativeResult | null> {
    const mapping = this.getSpeculativeMapping(intent);
    if (!mapping) return null;

    const tool = tools.find((t: any) => t.name === mapping.toolName);
    if (!tool) return null;

    const args = mapping.buildArgs(message);
    const startedAt = Date.now();

    logger.info('[SpeculativeTool] Starting speculative execution', {
      userId,
      toolName: mapping.toolName,
      intent: intent.primary,
      confidence: Math.round(intent.confidence * 100),
    });

    try {
      const result = await tool.func(args);
      const completedAt = Date.now();

      logger.info('[SpeculativeTool] Speculative execution completed', {
        userId,
        toolName: mapping.toolName,
        durationMs: completedAt - startedAt,
      });

      return {
        toolName: mapping.toolName,
        args,
        result: typeof result === 'string' ? result : JSON.stringify(result),
        startedAt,
        completedAt,
      };
    } catch (error) {
      const completedAt = Date.now();
      logger.warn('[SpeculativeTool] Speculative execution failed (non-fatal)', {
        userId,
        toolName: mapping.toolName,
        error: error instanceof Error ? error.message : String(error),
        durationMs: completedAt - startedAt,
      });

      return {
        toolName: mapping.toolName,
        args,
        result: null,
        startedAt,
        completedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if an LLM tool call matches the speculative result.
   * If it does, the speculative result can be used instead of re-executing.
   */
  matchesSpeculativeResult(
    llmToolName: string,
    speculativeResult: SpeculativeResult | null
  ): boolean {
    if (!speculativeResult) return false;
    if (!speculativeResult.result) return false;
    return llmToolName === speculativeResult.toolName;
  }
}

export const speculativeToolService = new SpeculativeToolService();
