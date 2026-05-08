/**
 * Tool Execution Wrapper Service — Unit Tests
 *
 * Covers:
 *   - classifyMutationType: all manager actions, domain prefix matching, edge cases
 *   - deriveEntityType: known entities, unknown names, case insensitivity
 *   - executeToolWithWrapper: timing, metrics, audit, entitlements, idempotency
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockRecord = jest.fn<any>();
const mockLogToolExecution = jest.fn<any>();
const mockGetUserEntitlements = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/services/tool-metrics.service.js', () => ({
  toolMetricsService: { record: mockRecord },
}));

jest.unstable_mockModule('../../../src/services/tool-audit.service.js', () => ({
  toolAuditService: { logToolExecution: mockLogToolExecution },
}));

jest.unstable_mockModule('../../../src/services/entitlement.service.js', () => ({
  getUserEntitlements: mockGetUserEntitlements,
}));

jest.unstable_mockModule('../../../src/config/tool-entitlements.config.js', () => ({
  TOOL_FEATURE_REQUIREMENTS: {
    musicManager: 'ai.music',
    premiumTool: 'ai.premium',
  } as Record<string, string>,
}));

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    entitlement: { mode: 'enforce-all' },
  },
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const {
  classifyMutationType,
  deriveEntityType,
  executeToolWithWrapper,
} = await import('../../../src/services/tool-execution-wrapper.service.js');

// ============================================
// HELPERS
// ============================================

function makeTool(invokeResult: unknown = '{"success":true}', shouldThrow = false) {
  const invoke = shouldThrow
    ? jest.fn<any>().mockRejectedValue(new Error(invokeResult as string))
    : jest.fn<any>().mockResolvedValue(invokeResult);
  return { invoke, name: 'testTool', description: 'test', schema: {} } as any;
}

function makeCtx(overrides: Partial<{
  userId: string;
  conversationId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  toolCallId: string;
}> = {}) {
  return {
    userId: 'user-1',
    conversationId: 'conv-1',
    toolName: 'getMealPlan',
    toolArgs: {},
    toolCallId: 'call-1',
    ...overrides,
  };
}

// ============================================
// classifyMutationType
// ============================================

describe('classifyMutationType', () => {
  // --- Manager tools (suffix "Manager") ---

  describe('manager tools (endsWith "Manager")', () => {
    it('classifies manager read actions', () => {
      const readActions = [
        'get', 'getAll', 'getById', 'getByName', 'getByDate', 'getPlans',
        'getLogs', 'getActive', 'getStats', 'getLatest', 'getStreak',
        'getInsights', 'getTimeline', 'getPatterns', 'getTrends', 'getHistory',
        'getCheckin', 'status', 'overview', 'recommend', 'search_and_play',
        'progress', 'analytics', 'summary', 'trends', 'checkConflicts',
      ];
      for (const action of readActions) {
        expect(classifyMutationType('mealManager', { action })).toBe('read');
      }
    });

    it('classifies manager create actions', () => {
      for (const action of ['create', 'add', 'log', 'start']) {
        expect(classifyMutationType('goalManager', { action })).toBe('create');
      }
    });

    it('classifies manager update actions', () => {
      for (const action of ['update', 'mark', 'complete', 'toggle', 'snooze', 'reschedule']) {
        expect(classifyMutationType('habitManager', { action })).toBe('update');
      }
    });

    it('classifies manager delete actions', () => {
      for (const action of ['delete', 'remove', 'cancel']) {
        expect(classifyMutationType('reminderManager', { action })).toBe('delete');
      }
    });

    it('returns read when action is empty string', () => {
      expect(classifyMutationType('workoutManager', { action: '' })).toBe('read');
    });

    it('returns read when action is missing (undefined)', () => {
      expect(classifyMutationType('workoutManager', {})).toBe('read');
    });

    it('returns unknown for unrecognized manager action', () => {
      expect(classifyMutationType('sleepManager', { action: 'explode' })).toBe('unknown');
    });

    it('returns read when args.action is not a string (number)', () => {
      expect(classifyMutationType('mealManager', { action: 42 })).toBe('read');
    });
  });

  // --- Special non-Manager names that still use manager logic ---

  describe('activityTimeline and aiDecisionHistory', () => {
    it('activityTimeline uses manager logic', () => {
      expect(classifyMutationType('activityTimeline', { action: 'getTimeline' })).toBe('read');
      expect(classifyMutationType('activityTimeline', { action: 'create' })).toBe('create');
      expect(classifyMutationType('activityTimeline', {})).toBe('read');
    });

    it('aiDecisionHistory uses manager logic', () => {
      expect(classifyMutationType('aiDecisionHistory', { action: 'getHistory' })).toBe('read');
      expect(classifyMutationType('aiDecisionHistory', { action: 'log' })).toBe('create');
      expect(classifyMutationType('aiDecisionHistory', { action: 'unknown_action' })).toBe('unknown');
    });
  });

  // --- Domain tools (prefix matching) ---

  describe('domain tools (prefix matching)', () => {
    it('classifies read prefixes', () => {
      expect(classifyMutationType('getMealPlan', {})).toBe('read');
      expect(classifyMutationType('checkWaterIntake', {})).toBe('read');
      expect(classifyMutationType('searchRecipes', {})).toBe('read');
      expect(classifyMutationType('listGoals', {})).toBe('read');
      expect(classifyMutationType('findWorkout', {})).toBe('read');
      expect(classifyMutationType('trackProgress', {})).toBe('read');
    });

    it('classifies create prefixes', () => {
      expect(classifyMutationType('createMeal', {})).toBe('create');
      expect(classifyMutationType('addGoal', {})).toBe('create');
      expect(classifyMutationType('logWater', {})).toBe('create');
      expect(classifyMutationType('bulkImportMeals', {})).toBe('create');
    });

    it('classifies update prefixes', () => {
      expect(classifyMutationType('updateGoal', {})).toBe('update');
      expect(classifyMutationType('markComplete', {})).toBe('update');
      expect(classifyMutationType('resetProgress', {})).toBe('update');
      expect(classifyMutationType('toggleHabit', {})).toBe('update');
      expect(classifyMutationType('snoozeReminder', {})).toBe('update');
      expect(classifyMutationType('mergeProfiles', {})).toBe('update');
      expect(classifyMutationType('batchUpdate', {})).toBe('update');
    });

    it('classifies delete prefixes', () => {
      expect(classifyMutationType('deleteMeal', {})).toBe('delete');
      expect(classifyMutationType('removeGoal', {})).toBe('delete');
    });

    it('is case-insensitive for prefix matching', () => {
      expect(classifyMutationType('GetMealPlan', {})).toBe('read');
      expect(classifyMutationType('DELETEGOAL', {})).toBe('delete');
      expect(classifyMutationType('CreateWorkout', {})).toBe('create');
      expect(classifyMutationType('UpdateHabit', {})).toBe('update');
    });

    it('returns unknown for unrecognized domain tool', () => {
      expect(classifyMutationType('doSomething', {})).toBe('unknown');
      expect(classifyMutationType('randomToolName', {})).toBe('unknown');
    });
  });

  // --- Delete before create priority ---

  describe('prefix priority order', () => {
    it('delete prefixes are checked before create prefixes', () => {
      // "delete" starts with "delete" (delete prefix) — should be delete, not unknown
      expect(classifyMutationType('deleteAndCreate', {})).toBe('delete');
    });

    it('read prefixes are checked first', () => {
      expect(classifyMutationType('getAndUpdate', {})).toBe('read');
    });
  });
});

// ============================================
// deriveEntityType
// ============================================

describe('deriveEntityType', () => {
  it('extracts known entity types from tool names', () => {
    expect(deriveEntityType('mealManager')).toBe('meal');
    expect(deriveEntityType('recipeSearch')).toBe('recipe');
    expect(deriveEntityType('dietPlanManager')).toBe('diet_plan');
    expect(deriveEntityType('workoutTracker')).toBe('workout');
    expect(deriveEntityType('goalManager')).toBe('goal');
    expect(deriveEntityType('scheduleManager')).toBe('schedule');
    expect(deriveEntityType('planManager')).toBe('plan');
    expect(deriveEntityType('progressTracker')).toBe('progress');
    expect(deriveEntityType('habitManager')).toBe('habit');
    expect(deriveEntityType('reminderManager')).toBe('reminder');
    expect(deriveEntityType('notificationManager')).toBe('notification');
    expect(deriveEntityType('waterIntake')).toBe('water_intake');
    expect(deriveEntityType('shoppingList')).toBe('shopping_list');
    expect(deriveEntityType('bodyImage')).toBe('body_image');
    expect(deriveEntityType('moodTracker')).toBe('mood');
    expect(deriveEntityType('stressManager')).toBe('stress');
    expect(deriveEntityType('journalEntry')).toBe('journal');
    expect(deriveEntityType('energyTracker')).toBe('energy');
    expect(deriveEntityType('sleepManager')).toBe('sleep');
    expect(deriveEntityType('medicationManager')).toBe('medication');
    expect(deriveEntityType('integrationManager')).toBe('integration');
    expect(deriveEntityType('preferenceManager')).toBe('preference');
    expect(deriveEntityType('checkinManager')).toBe('checkin');
    expect(deriveEntityType('competitionManager')).toBe('competition');
  });

  it('is case-insensitive', () => {
    expect(deriveEntityType('MEALMANAGER')).toBe('meal');
    expect(deriveEntityType('SleepTracker')).toBe('sleep');
  });

  it('returns null for unrecognized tool names', () => {
    expect(deriveEntityType('unknownTool')).toBeNull();
    expect(deriveEntityType('activityTimeline')).toBeNull();
    expect(deriveEntityType('aiDecisionHistory')).toBeNull();
  });

  it('returns the first match when multiple entity keywords present', () => {
    // "meal" appears before "recipe" in the map iteration
    const result = deriveEntityType('mealRecipeTool');
    expect(result).toBe('meal');
  });
});

// ============================================
// executeToolWithWrapper
// ============================================

describe('executeToolWithWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserEntitlements.mockResolvedValue({
      features: {},
      userCreatedAt: new Date().toISOString(),
    });
  });

  // --- Successful execution ---

  describe('successful execution', () => {
    it('returns content, timing, and success for a read tool', async () => {
      const tool = makeTool('{"data":"hello"}');
      const ctx = makeCtx({ toolName: 'getMealPlan' });

      const result = await executeToolWithWrapper(tool, ctx);

      expect(result.content).toBe('{"data":"hello"}');
      expect(result.success).toBe(true);
      expect(result.mutationType).toBe('read');
      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(tool.invoke).toHaveBeenCalledWith(ctx.toolArgs);
    });

    it('records metrics for every invocation', async () => {
      const tool = makeTool('ok');
      const ctx = makeCtx({ toolName: 'getMealPlan' });

      await executeToolWithWrapper(tool, ctx);

      expect(mockRecord).toHaveBeenCalledWith('getMealPlan', expect.any(Number), true);
    });

    it('does NOT audit-log read operations', async () => {
      const tool = makeTool('ok');
      const ctx = makeCtx({ toolName: 'getMealPlan' });

      await executeToolWithWrapper(tool, ctx);

      expect(mockLogToolExecution).not.toHaveBeenCalled();
    });

    it('audit-logs mutation operations', async () => {
      const tool = makeTool('{"id":"abc"}');
      const ctx = makeCtx({ toolName: 'createMeal', toolArgs: { name: 'lunch' } });

      await executeToolWithWrapper(tool, ctx);

      expect(mockLogToolExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          toolName: 'createMeal',
          mutationType: 'create',
          success: true,
        }),
      );
    });

    it('stringifies non-string tool results', async () => {
      const tool = makeTool({ data: 'object-result' });
      const ctx = makeCtx({ toolName: 'getMealPlan' });

      const result = await executeToolWithWrapper(tool, ctx);

      expect(result.content).toBe('{"data":"object-result"}');
    });

    it('detects tool-level failure from parsed JSON', async () => {
      const tool = makeTool('{"success":false,"error":"not found"}');
      const ctx = makeCtx({ toolName: 'createMeal' });

      const result = await executeToolWithWrapper(tool, ctx);

      expect(result.success).toBe(false);
    });
  });

  // --- Failed tool execution ---

  describe('failed tool execution', () => {
    it('throws after recording metrics and audit', async () => {
      const tool = makeTool('Tool crashed', true);
      const ctx = makeCtx({ toolName: 'createMeal' });

      await expect(executeToolWithWrapper(tool, ctx)).rejects.toThrow('Tool crashed');

      expect(mockRecord).toHaveBeenCalledWith('createMeal', expect.any(Number), false);
      expect(mockLogToolExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          toolName: 'createMeal',
          success: false,
          errorMessage: 'Tool crashed',
        }),
      );
    });
  });

  // --- Entitlement denial ---

  describe('entitlement checking', () => {
    it('blocks execution when feature is disabled in enforce-all mode', async () => {
      mockGetUserEntitlements.mockResolvedValue({
        features: { 'ai.music': { enabled: false } },
        userCreatedAt: new Date().toISOString(),
      });

      const tool = makeTool('should not run');
      const ctx = makeCtx({
        toolName: 'musicManager',
        toolArgs: { action: 'search_and_play' },
      });

      const result = await executeToolWithWrapper(tool, ctx);

      expect(result.success).toBe(false);
      expect(result.content).toContain('FEATURE_DISABLED');
      expect(result.content).toContain('Pro plan');
      expect(tool.invoke).not.toHaveBeenCalled();
      expect(mockRecord).toHaveBeenCalledWith('musicManager', 0, false);
    });

    it('blocks when feature key is missing from bundle', async () => {
      mockGetUserEntitlements.mockResolvedValue({
        features: {},
        userCreatedAt: new Date().toISOString(),
      });

      const tool = makeTool('should not run');
      const ctx = makeCtx({ toolName: 'premiumTool' });

      const result = await executeToolWithWrapper(tool, ctx);

      expect(result.success).toBe(false);
      expect(tool.invoke).not.toHaveBeenCalled();
    });

    it('allows execution when feature is enabled', async () => {
      mockGetUserEntitlements.mockResolvedValue({
        features: { 'ai.music': { enabled: true } },
        userCreatedAt: new Date().toISOString(),
      });

      const tool = makeTool('{"playing":true}');
      const ctx = makeCtx({
        toolName: 'musicManager',
        toolArgs: { action: 'search_and_play' },
      });

      const result = await executeToolWithWrapper(tool, ctx);

      expect(result.success).toBe(true);
      expect(tool.invoke).toHaveBeenCalled();
    });

    it('does not block when entitlement check throws (fail-open)', async () => {
      mockGetUserEntitlements.mockRejectedValue(new Error('DB down'));

      const tool = makeTool('{"ok":true}');
      const ctx = makeCtx({ toolName: 'musicManager', toolArgs: { action: 'get' } });

      const result = await executeToolWithWrapper(tool, ctx);

      expect(result.success).toBe(true);
      expect(tool.invoke).toHaveBeenCalled();
    });

    it('does not check entitlements for tools without feature requirements', async () => {
      const tool = makeTool('ok');
      const ctx = makeCtx({ toolName: 'getMealPlan' });

      await executeToolWithWrapper(tool, ctx);

      expect(mockGetUserEntitlements).not.toHaveBeenCalled();
    });
  });

  // --- Idempotency ---

  describe('idempotency deduplication', () => {
    it('returns cached result on duplicate mutation within same conversation', async () => {
      const tool = makeTool('{"id":"new-meal-1"}');
      const ctx = makeCtx({
        toolName: 'createMeal',
        toolArgs: { name: 'breakfast' },
        conversationId: 'conv-idem-1',
      });

      // First call: executes the tool
      const first = await executeToolWithWrapper(tool, ctx);
      expect(first.success).toBe(true);
      expect(tool.invoke).toHaveBeenCalledTimes(1);

      // Second call: same args, same conversation — should be cached
      jest.clearAllMocks();
      const second = await executeToolWithWrapper(tool, ctx);
      expect(second.success).toBe(true);
      expect(second.content).toBe('{"id":"new-meal-1"}');
      expect(second.durationMs).toBe(0);
      expect(tool.invoke).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Idempotency hit'),
        expect.any(Object),
      );
    });

    it('does NOT cache read operations', async () => {
      const tool = makeTool('{"meals":[]}');
      const ctx = makeCtx({
        toolName: 'getMealPlan',
        toolArgs: { date: '2026-04-27' },
        conversationId: 'conv-idem-2',
      });

      await executeToolWithWrapper(tool, ctx);
      jest.clearAllMocks();

      await executeToolWithWrapper(tool, ctx);
      // Tool should be invoked again since reads are not cached
      expect(tool.invoke).toHaveBeenCalledTimes(1);
    });

    it('does not deduplicate when conversationId is missing', async () => {
      const tool = makeTool('{"id":"x"}');
      const ctx = makeCtx({
        toolName: 'createMeal',
        toolArgs: { name: 'dinner' },
        conversationId: undefined,
      });

      await executeToolWithWrapper(tool, ctx);
      jest.clearAllMocks();

      await executeToolWithWrapper(tool, ctx);
      expect(tool.invoke).toHaveBeenCalledTimes(1);
    });
  });

  // --- Slow tool warning ---

  describe('slow tool warning', () => {
    it('logs a warning when tool takes more than 5000ms', async () => {
      // Mock performance.now to simulate slow execution
      const _originalNow = performance.now;
      let callCount = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        // First call (start): 0, second call (end): 6000
        return callCount <= 1 ? 0 : 6000;
      });

      const tool = makeTool('{"ok":true}');
      const ctx = makeCtx({ toolName: 'getMealPlan' });

      await executeToolWithWrapper(tool, ctx);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow tool execution'),
        expect.objectContaining({ toolName: 'getMealPlan', durationMs: 6000 }),
      );

      (performance.now as any).mockRestore();
    });

    it('does NOT warn when tool is fast', async () => {
      const tool = makeTool('ok');
      const ctx = makeCtx({ toolName: 'getMealPlan' });

      await executeToolWithWrapper(tool, ctx);

      const slowWarnings = (mockLogger.warn as jest.Mock).mock.calls.filter(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('Slow tool'),
      );
      expect(slowWarnings).toHaveLength(0);
    });
  });
});
