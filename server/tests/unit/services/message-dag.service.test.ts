/**
 * MessageDAG Service Unit Tests
 *
 * Tests the declarative DAG controller for pre-LLM context enrichment,
 * covering execution, tier filtering, parallelism, dependencies, timeouts,
 * error handling, cycle detection, and the buildPreLLMDag factory.
 */

import { jest } from '@jest/globals';
import { logger } from '../../../src/services/logger.service.js';

// ============================================
// IMPORTS (loaded in beforeAll)
// ============================================

let MessageDAG: any;
let buildPreLLMDag: any;
let NODE_NAMES: any;
let TIER_CONFIGS: any;

// ============================================
// HELPERS
// ============================================

type TierName = 'TRIVIAL' | 'SIMPLE_ACTION' | 'CONVERSATIONAL' | 'ANALYTICAL';

interface NodeConfig<T = unknown> {
  name: string;
  execute?: () => Promise<T>;
  fallback: T;
  timeoutMs?: number;
  dependsOn?: string[];
  tiers?: TierName[];
}

function makeNode<T>(config: NodeConfig<T>) {
  return {
    name: config.name,
    execute: config.execute ?? (() => Promise.resolve(config.fallback)),
    fallback: config.fallback,
    timeoutMs: config.timeoutMs ?? 5000,
    dependsOn: config.dependsOn,
    tiers: config.tiers ?? ['CONVERSATIONAL'] as TierName[],
  };
}

function delayedNode<T>(name: string, value: T, delayMs: number, extras?: Partial<NodeConfig<T>>) {
  return makeNode({
    name,
    fallback: null as unknown as T,
    execute: () => new Promise<T>((resolve) => setTimeout(() => resolve(value), delayMs)),
    ...extras,
  });
}

// ============================================
// TESTS
// ============================================

describe('MessageDAG', () => {
  beforeAll(async () => {
    const mod = await import('../../../src/services/message-dag.service.js');
    MessageDAG = mod.MessageDAG;
    buildPreLLMDag = mod.buildPreLLMDag;
    NODE_NAMES = mod.NODE_NAMES;
    TIER_CONFIGS = mod.TIER_CONFIGS;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // 1. Basic execution
  // ------------------------------------------
  describe('basic execution', () => {
    it('should execute a single node and return the result', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'greeting',
        fallback: 'fallback-value',
        execute: () => Promise.resolve('hello'),
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(report.tier).toBe('CONVERSATIONAL');
      expect(report.nodes['greeting'].value).toBe('hello');
      expect(report.nodes['greeting'].source).toBe('executed');
      expect(report.nodes['greeting'].durationMs).toBeGreaterThanOrEqual(0);
      expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should return an empty nodes map when DAG has no nodes', async () => {
      const dag = new MessageDAG();
      const report = await dag.execute('TRIVIAL');

      expect(report.tier).toBe('TRIVIAL');
      expect(Object.keys(report.nodes)).toHaveLength(0);
    });

    it('should support chained addNode calls', () => {
      const dag = new MessageDAG();
      const result = dag
        .addNode(makeNode({ name: 'a', fallback: null }))
        .addNode(makeNode({ name: 'b', fallback: null }));

      expect(result).toBe(dag);
    });
  });

  // ------------------------------------------
  // 2. Tier filtering
  // ------------------------------------------
  describe('tier filtering', () => {
    it('should skip nodes not in the requested tier', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'active',
        fallback: 'fb-active',
        execute: () => Promise.resolve('ran'),
        tiers: ['CONVERSATIONAL'],
      }));
      dag.addNode(makeNode({
        name: 'inactive',
        fallback: 'fb-inactive',
        execute: () => Promise.resolve('should-not-run'),
        tiers: ['ANALYTICAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(report.nodes['active'].source).toBe('executed');
      expect(report.nodes['active'].value).toBe('ran');

      expect(report.nodes['inactive'].source).toBe('skipped');
      expect(report.nodes['inactive'].value).toBe('fb-inactive');
      expect(report.nodes['inactive'].durationMs).toBe(0);
    });

    it('should include a node present in multiple tiers', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'multi',
        fallback: 'fb',
        execute: () => Promise.resolve('ok'),
        tiers: ['TRIVIAL', 'CONVERSATIONAL', 'ANALYTICAL'],
      }));

      for (const tier of ['TRIVIAL', 'CONVERSATIONAL', 'ANALYTICAL'] as const) {
        const report = await dag.execute(tier);
        expect(report.nodes['multi'].source).toBe('executed');
      }
    });
  });

  // ------------------------------------------
  // 3. Parallel execution
  // ------------------------------------------
  describe('parallel execution', () => {
    it('should execute independent nodes concurrently', async () => {
      const dag = new MessageDAG();
      const DELAY_MS = 100;

      dag.addNode(delayedNode('nodeA', 'A', DELAY_MS, { tiers: ['CONVERSATIONAL'] }));
      dag.addNode(delayedNode('nodeB', 'B', DELAY_MS, { tiers: ['CONVERSATIONAL'] }));
      dag.addNode(delayedNode('nodeC', 'C', DELAY_MS, { tiers: ['CONVERSATIONAL'] }));

      const start = Date.now();
      const report = await dag.execute('CONVERSATIONAL');
      const elapsed = Date.now() - start;

      // If sequential, would take ~300ms. Parallel should be close to ~100ms.
      // Use generous threshold to avoid flaky tests.
      expect(elapsed).toBeLessThan(DELAY_MS * 2.5);

      expect(report.nodes['nodeA'].value).toBe('A');
      expect(report.nodes['nodeB'].value).toBe('B');
      expect(report.nodes['nodeC'].value).toBe('C');
    });
  });

  // ------------------------------------------
  // 4. Dependencies
  // ------------------------------------------
  describe('dependencies', () => {
    it('should execute dependent node after its dependency completes', async () => {
      const executionOrder: string[] = [];

      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'parent',
        fallback: null,
        execute: async () => {
          await new Promise((r) => setTimeout(r, 50));
          executionOrder.push('parent');
          return 'parent-done';
        },
        tiers: ['CONVERSATIONAL'],
      }));
      dag.addNode(makeNode({
        name: 'child',
        fallback: null,
        dependsOn: ['parent'],
        execute: async () => {
          executionOrder.push('child');
          return 'child-done';
        },
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(executionOrder).toEqual(['parent', 'child']);
      expect(report.nodes['parent'].value).toBe('parent-done');
      expect(report.nodes['child'].value).toBe('child-done');
    });

    it('should skip dependency check for deps not in active tier', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'depNode',
        fallback: 'dep-fb',
        execute: () => Promise.resolve('dep-result'),
        tiers: ['ANALYTICAL'], // Not in CONVERSATIONAL
      }));
      dag.addNode(makeNode({
        name: 'childNode',
        fallback: 'child-fb',
        dependsOn: ['depNode'],
        execute: () => Promise.resolve('child-result'),
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      // depNode is skipped, but childNode should still run because
      // the DAG considers inactive dependencies as satisfied
      expect(report.nodes['depNode'].source).toBe('skipped');
      expect(report.nodes['childNode'].source).toBe('executed');
      expect(report.nodes['childNode'].value).toBe('child-result');
    });

    it('should handle a chain of three dependencies (A -> B -> C)', async () => {
      const executionOrder: string[] = [];
      const dag = new MessageDAG();

      dag.addNode(makeNode({
        name: 'A',
        fallback: null,
        execute: async () => { executionOrder.push('A'); return 'A'; },
        tiers: ['CONVERSATIONAL'],
      }));
      dag.addNode(makeNode({
        name: 'B',
        fallback: null,
        dependsOn: ['A'],
        execute: async () => { executionOrder.push('B'); return 'B'; },
        tiers: ['CONVERSATIONAL'],
      }));
      dag.addNode(makeNode({
        name: 'C',
        fallback: null,
        dependsOn: ['B'],
        execute: async () => { executionOrder.push('C'); return 'C'; },
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(executionOrder).toEqual(['A', 'B', 'C']);
      expect(report.nodes['C'].source).toBe('executed');
    });
  });

  // ------------------------------------------
  // 5. Timeout
  // ------------------------------------------
  describe('timeout', () => {
    it('should return fallback when a node exceeds its timeout', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'slow',
        fallback: 'timeout-fallback',
        execute: () => new Promise((resolve) => setTimeout(() => resolve('too-late'), 500)),
        timeoutMs: 50,
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      // The Promise.race will resolve with the fallback value from the timeout branch.
      // The source is 'timeout' when durationMs >= timeoutMs.
      expect(report.nodes['slow'].source).toBe('timeout');
      expect(report.nodes['slow'].value).toBe('timeout-fallback');
    });

    it('should not timeout a fast node', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'fast',
        fallback: 'fb',
        execute: () => Promise.resolve('quick-result'),
        timeoutMs: 5000,
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(report.nodes['fast'].source).toBe('executed');
      expect(report.nodes['fast'].value).toBe('quick-result');
    });
  });

  // ------------------------------------------
  // 6. Error handling
  // ------------------------------------------
  describe('error handling', () => {
    it('should return fallback when execute() throws', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'failing',
        fallback: 'error-fallback',
        execute: () => Promise.reject(new Error('boom')),
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(report.nodes['failing'].source).toBe('fallback');
      expect(report.nodes['failing'].value).toBe('error-fallback');
    });

    it('should log a warning when a node fails', async () => {
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'failing',
        fallback: null,
        execute: () => Promise.reject(new Error('test-error')),
        tiers: ['CONVERSATIONAL'],
      }));

      await dag.execute('CONVERSATIONAL');

      expect(warnSpy).toHaveBeenCalledWith(
        '[MessageDAG] Node failed, using fallback',
        expect.objectContaining({
          node: 'failing',
          error: 'test-error',
        }),
      );
      warnSpy.mockRestore();
    });

    it('should handle non-Error thrown values', async () => {
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'stringThrow',
        fallback: 'fb',
        execute: () => Promise.reject('raw-string-error'),
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(report.nodes['stringThrow'].source).toBe('fallback');
      expect(warnSpy).toHaveBeenCalledWith(
        '[MessageDAG] Node failed, using fallback',
        expect.objectContaining({ error: 'raw-string-error' }),
      );
      warnSpy.mockRestore();
    });
  });

  // ------------------------------------------
  // 7. Cycle detection
  // ------------------------------------------
  describe('cycle detection', () => {
    it('should force fallback for mutually dependent nodes', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'cycleA',
        fallback: 'fb-A',
        dependsOn: ['cycleB'],
        execute: () => Promise.resolve('A'),
        tiers: ['CONVERSATIONAL'],
      }));
      dag.addNode(makeNode({
        name: 'cycleB',
        fallback: 'fb-B',
        dependsOn: ['cycleA'],
        execute: () => Promise.resolve('B'),
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      expect(report.nodes['cycleA'].source).toBe('fallback');
      expect(report.nodes['cycleA'].value).toBe('fb-A');
      expect(report.nodes['cycleB'].source).toBe('fallback');
      expect(report.nodes['cycleB'].value).toBe('fb-B');
    });

    it('should log an error when a cycle is detected', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'x',
        fallback: null,
        dependsOn: ['y'],
        tiers: ['CONVERSATIONAL'],
      }));
      dag.addNode(makeNode({
        name: 'y',
        fallback: null,
        dependsOn: ['x'],
        tiers: ['CONVERSATIONAL'],
      }));

      const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
      await dag.execute('CONVERSATIONAL');

      expect(errorSpy).toHaveBeenCalledWith(
        '[MessageDAG] Cycle detected — forcing fallback for remaining nodes',
        expect.objectContaining({
          remaining: expect.arrayContaining(['x', 'y']),
        }),
      );
      errorSpy.mockRestore();
    });

    it('should still execute non-cyclic nodes alongside cyclic ones', async () => {
      const dag = new MessageDAG();
      // Independent node
      dag.addNode(makeNode({
        name: 'independent',
        fallback: 'fb-ind',
        execute: () => Promise.resolve('independent-result'),
        tiers: ['CONVERSATIONAL'],
      }));
      // Cyclic pair
      dag.addNode(makeNode({
        name: 'cA',
        fallback: 'fb-cA',
        dependsOn: ['cB'],
        execute: () => Promise.resolve('cA-result'),
        tiers: ['CONVERSATIONAL'],
      }));
      dag.addNode(makeNode({
        name: 'cB',
        fallback: 'fb-cB',
        dependsOn: ['cA'],
        execute: () => Promise.resolve('cB-result'),
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');

      // Independent node should have executed normally
      expect(report.nodes['independent'].source).toBe('executed');
      expect(report.nodes['independent'].value).toBe('independent-result');

      // Cyclic nodes should be forced to fallback
      expect(report.nodes['cA'].source).toBe('fallback');
      expect(report.nodes['cB'].source).toBe('fallback');
    });
  });

  // ------------------------------------------
  // 8. get() helper
  // ------------------------------------------
  describe('get()', () => {
    it('should extract the correct value from a report', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'data',
        fallback: null,
        execute: () => Promise.resolve({ items: [1, 2, 3] }),
        tiers: ['CONVERSATIONAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');
      const value = dag.get<{ items: number[] }>(report, 'data');

      expect(value).toEqual({ items: [1, 2, 3] });
    });

    it('should return fallback value for skipped nodes', async () => {
      const dag = new MessageDAG();
      dag.addNode(makeNode({
        name: 'skippedNode',
        fallback: 'default-val',
        execute: () => Promise.resolve('real'),
        tiers: ['ANALYTICAL'],
      }));

      const report = await dag.execute('CONVERSATIONAL');
      const value = dag.get<string>(report, 'skippedNode');

      expect(value).toBe('default-val');
    });

    it('should throw for an unknown node name', async () => {
      const dag = new MessageDAG();
      const report = await dag.execute('CONVERSATIONAL');

      expect(() => dag.get(report, 'nonexistent')).toThrow(
        '[MessageDAG] Unknown node: nonexistent',
      );
    });
  });

  // ------------------------------------------
  // 9. buildPreLLMDag factory
  // ------------------------------------------
  describe('buildPreLLMDag', () => {
    function makeMockExecutors() {
      return {
        systemPrompt: jest.fn<() => Promise<string>>().mockResolvedValue('system-prompt-text'),
        systemPromptFallback: 'fallback-system-prompt',
        ragContext: jest.fn<() => Promise<any>>().mockResolvedValue({ docs: [] }),
        wellbeingContext: jest.fn<() => Promise<any>>().mockResolvedValue({ score: 80 }),
        lifeAreaRouting: jest.fn<() => Promise<any>>().mockResolvedValue({ area: 'fitness' }),
        mentalHealth: jest.fn<() => Promise<any>>().mockResolvedValue({ safe: true }),
        mentalHealthFallback: { safe: true, fallback: true },
        wellnessQuestion: jest.fn<() => Promise<any>>().mockResolvedValue({ shouldAsk: true }),
      };
    }

    it('should return a MessageDAG instance', () => {
      const dag = buildPreLLMDag(makeMockExecutors());
      expect(dag).toBeInstanceOf(MessageDAG);
    });

    it('should register all expected nodes', async () => {
      const dag = buildPreLLMDag(makeMockExecutors());
      // Execute on ANALYTICAL to activate all nodes
      const report = await dag.execute('ANALYTICAL');

      const nodeNames = Object.keys(report.nodes);
      expect(nodeNames).toContain(NODE_NAMES.SYSTEM_PROMPT);
      expect(nodeNames).toContain(NODE_NAMES.RAG_CONTEXT);
      expect(nodeNames).toContain(NODE_NAMES.WELLBEING_CONTEXT);
      expect(nodeNames).toContain(NODE_NAMES.LIFE_AREA_ROUTING);
      expect(nodeNames).toContain(NODE_NAMES.MENTAL_HEALTH);
      expect(nodeNames).toContain(NODE_NAMES.WELLNESS_QUESTION);
      expect(nodeNames).toHaveLength(6);
    });

    it('should include systemPrompt in all tiers', async () => {
      const dag = buildPreLLMDag(makeMockExecutors());

      for (const tier of ['TRIVIAL', 'SIMPLE_ACTION', 'CONVERSATIONAL', 'ANALYTICAL'] as const) {
        const report = await dag.execute(tier);
        expect(report.nodes[NODE_NAMES.SYSTEM_PROMPT].source).not.toBe('skipped');
      }
    });

    it('should skip RAG/wellbeing/lifeArea/wellness nodes for TRIVIAL tier', async () => {
      const executors = makeMockExecutors();
      const dag = buildPreLLMDag(executors);
      const report = await dag.execute('TRIVIAL');

      expect(report.nodes[NODE_NAMES.RAG_CONTEXT].source).toBe('skipped');
      expect(report.nodes[NODE_NAMES.WELLBEING_CONTEXT].source).toBe('skipped');
      expect(report.nodes[NODE_NAMES.LIFE_AREA_ROUTING].source).toBe('skipped');
      expect(report.nodes[NODE_NAMES.WELLNESS_QUESTION].source).toBe('skipped');
      expect(report.nodes[NODE_NAMES.MENTAL_HEALTH].source).toBe('skipped');

      // Verify the executors were NOT called
      expect(executors.ragContext).not.toHaveBeenCalled();
      expect(executors.wellbeingContext).not.toHaveBeenCalled();
      expect(executors.lifeAreaRouting).not.toHaveBeenCalled();
      expect(executors.wellnessQuestion).not.toHaveBeenCalled();
      expect(executors.mentalHealth).not.toHaveBeenCalled();
    });

    it('should include mentalHealth in SIMPLE_ACTION but skip RAG/wellbeing/lifeArea/wellness', async () => {
      const executors = makeMockExecutors();
      const dag = buildPreLLMDag(executors);
      const report = await dag.execute('SIMPLE_ACTION');

      expect(report.nodes[NODE_NAMES.SYSTEM_PROMPT].source).toBe('executed');
      expect(report.nodes[NODE_NAMES.MENTAL_HEALTH].source).toBe('executed');

      expect(report.nodes[NODE_NAMES.RAG_CONTEXT].source).toBe('skipped');
      expect(report.nodes[NODE_NAMES.WELLBEING_CONTEXT].source).toBe('skipped');
      expect(report.nodes[NODE_NAMES.LIFE_AREA_ROUTING].source).toBe('skipped');
      expect(report.nodes[NODE_NAMES.WELLNESS_QUESTION].source).toBe('skipped');
    });

    it('should execute all nodes for CONVERSATIONAL tier', async () => {
      const executors = makeMockExecutors();
      const dag = buildPreLLMDag(executors);
      const report = await dag.execute('CONVERSATIONAL');

      for (const name of Object.values(NODE_NAMES)) {
        expect(report.nodes[name].source).toBe('executed');
      }
    });

    it('should use provided fallback values', async () => {
      const executors = makeMockExecutors();
      executors.systemPrompt.mockRejectedValue(new Error('prompt-gen-failed'));
      executors.mentalHealth.mockRejectedValue(new Error('guardrail-failed'));

      const dag = buildPreLLMDag(executors);
      const report = await dag.execute('ANALYTICAL');

      expect(report.nodes[NODE_NAMES.SYSTEM_PROMPT].source).toBe('fallback');
      expect(report.nodes[NODE_NAMES.SYSTEM_PROMPT].value).toBe('fallback-system-prompt');

      expect(report.nodes[NODE_NAMES.MENTAL_HEALTH].source).toBe('fallback');
      expect(report.nodes[NODE_NAMES.MENTAL_HEALTH].value).toEqual({ safe: true, fallback: true });
    });
  });

  // ------------------------------------------
  // 10. TIER_CONFIGS
  // ------------------------------------------
  describe('TIER_CONFIGS', () => {
    it('should have configs for all 4 tiers', () => {
      const expectedTiers = ['TRIVIAL', 'SIMPLE_ACTION', 'CONVERSATIONAL', 'ANALYTICAL'] as const;

      for (const tier of expectedTiers) {
        expect(TIER_CONFIGS[tier]).toBeDefined();
      }

      expect(Object.keys(TIER_CONFIGS)).toHaveLength(4);
    });

    it('should have required properties on each tier config', () => {
      for (const [, config] of Object.entries(TIER_CONFIGS)) {
        expect(config).toHaveProperty('promptTier');
        expect(config).toHaveProperty('promptTimeoutMs');
        expect(config).toHaveProperty('globalTimeoutMs');

        expect(['minimal', 'standard', 'deep']).toContain(config.promptTier);
        expect(typeof config.promptTimeoutMs).toBe('number');
        expect(typeof config.globalTimeoutMs).toBe('number');
        expect(config.promptTimeoutMs).toBeGreaterThan(0);
        expect(config.globalTimeoutMs).toBeGreaterThan(0);
      }
    });

    it('should assign correct prompt tiers', () => {
      expect(TIER_CONFIGS.TRIVIAL.promptTier).toBe('minimal');
      expect(TIER_CONFIGS.SIMPLE_ACTION.promptTier).toBe('standard');
      expect(TIER_CONFIGS.CONVERSATIONAL.promptTier).toBe('deep');
      expect(TIER_CONFIGS.ANALYTICAL.promptTier).toBe('deep');
    });

    it('should have non-decreasing prompt timeouts as complexity rises', () => {
      expect(TIER_CONFIGS.TRIVIAL.promptTimeoutMs).toBeLessThanOrEqual(TIER_CONFIGS.SIMPLE_ACTION.promptTimeoutMs);
      expect(TIER_CONFIGS.SIMPLE_ACTION.promptTimeoutMs).toBeLessThanOrEqual(TIER_CONFIGS.CONVERSATIONAL.promptTimeoutMs);
      expect(TIER_CONFIGS.CONVERSATIONAL.promptTimeoutMs).toBeLessThanOrEqual(TIER_CONFIGS.ANALYTICAL.promptTimeoutMs);
    });
  });

  // ------------------------------------------
  // 11. NODE_NAMES
  // ------------------------------------------
  describe('NODE_NAMES', () => {
    it('should contain all expected node name constants', () => {
      expect(NODE_NAMES.SYSTEM_PROMPT).toBe('systemPrompt');
      expect(NODE_NAMES.RAG_CONTEXT).toBe('ragContext');
      expect(NODE_NAMES.WELLBEING_CONTEXT).toBe('wellbeingContext');
      expect(NODE_NAMES.LIFE_AREA_ROUTING).toBe('lifeAreaRouting');
      expect(NODE_NAMES.MENTAL_HEALTH).toBe('mentalHealthGuardrail');
      expect(NODE_NAMES.WELLNESS_QUESTION).toBe('wellnessQuestionCheck');
    });

    it('should have exactly 6 node names', () => {
      expect(Object.keys(NODE_NAMES)).toHaveLength(6);
    });

    it('should have unique values', () => {
      const values = Object.values(NODE_NAMES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });
});
