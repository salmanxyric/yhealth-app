/**
 * @file Declarative DAG Controller for Pre-LLM Context Enrichment
 * @description Replaces ad-hoc Promise.all/Promise.race blocks with a typed
 * dependency graph. Each node is a FUNCTION (not an LLM agent), with declared
 * dependencies, per-node timeout, and fallback values.
 *
 * The single main LLM call remains the brain. This DAG only orchestrates the
 * pre-LLM context assembly and post-LLM async work.
 */

import { logger } from './logger.service.js';
import type { MessageComplexity } from './tool-router.service.js';

// ============================================
// TYPES
// ============================================

export interface DAGNode<T = unknown> {
  name: string;
  execute: () => Promise<T>;
  fallback: T;
  timeoutMs: number;
  dependsOn?: string[];
  tiers: MessageComplexity[];
}

export interface DAGResult<T = unknown> {
  value: T;
  durationMs: number;
  source: 'executed' | 'fallback' | 'timeout' | 'skipped';
}

export interface DAGExecutionReport {
  totalDurationMs: number;
  tier: MessageComplexity;
  nodes: Record<string, DAGResult>;
}

// ============================================
// EXECUTOR
// ============================================

export class MessageDAG {
  private nodes = new Map<string, DAGNode>();

  addNode<T>(node: DAGNode<T>): this {
    this.nodes.set(node.name, node as DAGNode);
    return this;
  }

  async execute(tier: MessageComplexity): Promise<DAGExecutionReport> {
    const start = Date.now();
    const results: Record<string, DAGResult> = {};

    const activeNodes = new Map<string, DAGNode>();
    for (const [name, node] of this.nodes) {
      if (node.tiers.includes(tier)) {
        activeNodes.set(name, node);
      } else {
        results[name] = { value: node.fallback, durationMs: 0, source: 'skipped' };
      }
    }

    const completed = new Set<string>();
    const pending = new Map(activeNodes);

    while (pending.size > 0) {
      const ready: [string, DAGNode][] = [];
      for (const [name, node] of pending) {
        const deps = node.dependsOn || [];
        if (deps.every(d => completed.has(d) || !activeNodes.has(d))) {
          ready.push([name, node]);
        }
      }

      if (ready.length === 0 && pending.size > 0) {
        logger.error('[MessageDAG] Cycle detected — forcing fallback for remaining nodes', {
          remaining: [...pending.keys()],
        });
        for (const [name, node] of pending) {
          results[name] = { value: node.fallback, durationMs: 0, source: 'fallback' };
          completed.add(name);
        }
        break;
      }

      const batch = ready.map(async ([name, node]) => {
        const nodeStart = Date.now();
        try {
          const value = await Promise.race([
            node.execute(),
            new Promise<typeof node.fallback>((resolve) =>
              setTimeout(() => resolve(node.fallback), node.timeoutMs)
            ),
          ]);

          const durationMs = Date.now() - nodeStart;
          const timedOut = durationMs >= node.timeoutMs;

          results[name] = {
            value,
            durationMs,
            source: timedOut ? 'timeout' : 'executed',
          };
        } catch (error) {
          results[name] = {
            value: node.fallback,
            durationMs: Date.now() - nodeStart,
            source: 'fallback',
          };
          logger.warn('[MessageDAG] Node failed, using fallback', {
            node: name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        completed.add(name);
        pending.delete(name);
      });

      await Promise.all(batch);
    }

    const report: DAGExecutionReport = {
      totalDurationMs: Date.now() - start,
      tier,
      nodes: results,
    };

    const slowNodes = Object.entries(results)
      .filter(([, r]) => r.source !== 'skipped' && r.durationMs > 500)
      .map(([name, r]) => `${name}(${r.durationMs}ms)`);

    if (slowNodes.length > 0 || report.totalDurationMs > 1500) {
      logger.info('[MessageDAG] Execution report', {
        tier,
        totalMs: report.totalDurationMs,
        activeNodes: Object.entries(results).filter(([, r]) => r.source !== 'skipped').length,
        slowNodes,
      });
    }

    return report;
  }

  get<T>(report: DAGExecutionReport, nodeName: string): T {
    const result = report.nodes[nodeName];
    if (!result) {
      throw new Error(`[MessageDAG] Unknown node: ${nodeName}`);
    }
    return result.value as T;
  }
}

// ============================================
// PRE-LLM PHASE NODES (constants)
// ============================================

export const NODE_NAMES = {
  SYSTEM_PROMPT: 'systemPrompt',
  RAG_CONTEXT: 'ragContext',
  WELLBEING_CONTEXT: 'wellbeingContext',
  LIFE_AREA_ROUTING: 'lifeAreaRouting',
  MENTAL_HEALTH: 'mentalHealthGuardrail',
  WELLNESS_QUESTION: 'wellnessQuestionCheck',
} as const;

export const TIER_CONFIGS: Record<MessageComplexity, {
  promptTier: 'minimal' | 'standard' | 'deep';
  promptTimeoutMs: number;
  globalTimeoutMs: number;
}> = {
  TRIVIAL: { promptTier: 'minimal', promptTimeoutMs: 2000, globalTimeoutMs: 2000 },
  SIMPLE_ACTION: { promptTier: 'standard', promptTimeoutMs: 3000, globalTimeoutMs: 2500 },
  CONVERSATIONAL: { promptTier: 'deep', promptTimeoutMs: 4000, globalTimeoutMs: 2500 },
  ANALYTICAL: { promptTier: 'deep', promptTimeoutMs: 4000, globalTimeoutMs: 2500 },
};

/**
 * Factory: build a pre-LLM DAG with the given executor functions.
 * Callers provide the actual async work; the DAG handles orchestration,
 * timeouts, fallbacks, and per-node telemetry.
 */
export function buildPreLLMDag(executors: {
  systemPrompt: () => Promise<string>;
  systemPromptFallback: string;
  ragContext: () => Promise<any>;
  wellbeingContext: () => Promise<any>;
  lifeAreaRouting: () => Promise<any>;
  mentalHealth: () => Promise<any>;
  mentalHealthFallback: any;
  wellnessQuestion: () => Promise<any>;
}): MessageDAG {
  const dag = new MessageDAG();

  dag.addNode<string>({
    name: NODE_NAMES.SYSTEM_PROMPT,
    execute: executors.systemPrompt,
    fallback: executors.systemPromptFallback,
    timeoutMs: 4000,
    tiers: ['TRIVIAL', 'SIMPLE_ACTION', 'CONVERSATIONAL', 'ANALYTICAL'],
  });

  dag.addNode({
    name: NODE_NAMES.RAG_CONTEXT,
    execute: executors.ragContext,
    fallback: null,
    timeoutMs: 2500,
    tiers: ['CONVERSATIONAL', 'ANALYTICAL'],
  });

  dag.addNode({
    name: NODE_NAMES.WELLBEING_CONTEXT,
    execute: executors.wellbeingContext,
    fallback: {},
    timeoutMs: 2500,
    tiers: ['CONVERSATIONAL', 'ANALYTICAL'],
  });

  dag.addNode({
    name: NODE_NAMES.LIFE_AREA_ROUTING,
    execute: executors.lifeAreaRouting,
    fallback: null,
    timeoutMs: 2500,
    tiers: ['CONVERSATIONAL', 'ANALYTICAL'],
  });

  dag.addNode({
    name: NODE_NAMES.MENTAL_HEALTH,
    execute: executors.mentalHealth,
    fallback: executors.mentalHealthFallback,
    timeoutMs: 2500,
    tiers: ['SIMPLE_ACTION', 'CONVERSATIONAL', 'ANALYTICAL'],
  });

  dag.addNode({
    name: NODE_NAMES.WELLNESS_QUESTION,
    execute: executors.wellnessQuestion,
    fallback: { shouldAsk: false, reason: null, priority: null },
    timeoutMs: 2500,
    tiers: ['CONVERSATIONAL', 'ANALYTICAL'],
  });

  return dag;
}
