/**
 * Speculative Tool Service — Unit Tests
 *
 * Tests speculative pre-execution of predicted tools based on intent classification.
 * Covers mapping lookup, speculative execution, result matching, and arg building.
 */

import { speculativeToolService } from '../../../src/services/speculative-tool.service.js';
import type { SpeculativeResult } from '../../../src/services/speculative-tool.service.js';
import type { IntentClassification, ToolIntent, MessageComplexity } from '../../../src/services/tool-router.service.js';

jest.mock('../../../src/services/logger.service.js', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ============================================
// HELPERS
// ============================================

function makeIntent(
  primary: ToolIntent,
  confidence: number,
  opts?: { secondary?: ToolIntent[]; complexity?: MessageComplexity }
): IntentClassification {
  return {
    primary,
    secondary: opts?.secondary ?? [],
    complexity: opts?.complexity ?? 'SIMPLE_ACTION',
    confidence,
  };
}

function makeTool(name: string, fn: (args: any) => any = () => 'ok') {
  return { name, func: fn };
}

// ============================================
// getSpeculativeMapping
// ============================================

describe('SpeculativeToolService', () => {
  describe('getSpeculativeMapping', () => {
    it('should return mapping for "water" intent with confidence >= 0.5', () => {
      const intent = makeIntent('water', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('waterIntakeManager');
      expect(mapping!.minConfidence).toBe(0.5);
    });

    it('should return mapping for "schedules" intent with confidence >= 0.5', () => {
      const intent = makeIntent('schedules', 0.6);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('getScheduleByDate');
    });

    it('should return mapping for "meals" intent with confidence >= 0.6', () => {
      const intent = makeIntent('meals', 0.7);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('getUserMealLogs');
    });

    it('should return mapping for "workouts" intent with confidence >= 0.6', () => {
      const intent = makeIntent('workouts', 0.9);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('getUserWorkoutLogs');
    });

    it('should return mapping for "goals" intent with confidence >= 0.6', () => {
      const intent = makeIntent('goals', 0.65);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('getUserGoals');
    });

    it('should return mapping for "progress" intent with confidence >= 0.6', () => {
      const intent = makeIntent('progress', 0.75);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('getUserProgress');
    });

    it('should return null when confidence is below minConfidence for 0.5-threshold intents', () => {
      const intent = makeIntent('water', 0.4);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).toBeNull();
    });

    it('should return null when confidence is below minConfidence for 0.6-threshold intents', () => {
      const intent = makeIntent('meals', 0.5);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).toBeNull();
    });

    it('should return mapping at exact minConfidence boundary (0.5)', () => {
      const intent = makeIntent('schedules', 0.5);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('getScheduleByDate');
    });

    it('should return mapping at exact minConfidence boundary (0.6)', () => {
      const intent = makeIntent('goals', 0.6);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      expect(mapping!.toolName).toBe('getUserGoals');
    });

    it('should return null for unmapped intents like "general"', () => {
      const intent = makeIntent('general', 0.99);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).toBeNull();
    });

    it('should return null for "wellbeing" (not in speculative mappings)', () => {
      const intent = makeIntent('wellbeing', 0.95);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).toBeNull();
    });

    it('should return null for "shopping" (not in speculative mappings)', () => {
      const intent = makeIntent('shopping', 0.9);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).toBeNull();
    });
  });

  // ============================================
  // buildArgs verification
  // ============================================

  describe('buildArgs for each intent', () => {
    it('should build { action: "get_today" } for water intent', () => {
      const intent = makeIntent('water', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      const args = mapping!.buildArgs('how much water did I drink today');
      expect(args).toEqual({ action: 'get_today' });
    });

    it('should build { action: "get_today" } for water intent even with log keywords', () => {
      const intent = makeIntent('water', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      const args = mapping!.buildArgs('log 500ml of water');
      expect(args).toEqual({ action: 'get_today' });
    });

    it('should build { date: today } for schedules intent', () => {
      const intent = makeIntent('schedules', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      const args = mapping!.buildArgs('what is my schedule');
      const today = new Date().toISOString().slice(0, 10);
      expect(args).toEqual({ date: today });
    });

    it('should build empty args for meals intent', () => {
      const intent = makeIntent('meals', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      const args = mapping!.buildArgs('show my meals');
      expect(args).toEqual({});
    });

    it('should build empty args for workouts intent', () => {
      const intent = makeIntent('workouts', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      const args = mapping!.buildArgs('show my workouts');
      expect(args).toEqual({});
    });

    it('should build empty args for goals intent', () => {
      const intent = makeIntent('goals', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      const args = mapping!.buildArgs('what are my goals');
      expect(args).toEqual({});
    });

    it('should build empty args for progress intent', () => {
      const intent = makeIntent('progress', 0.8);
      const mapping = speculativeToolService.getSpeculativeMapping(intent);

      expect(mapping).not.toBeNull();
      const args = mapping!.buildArgs('show my progress');
      expect(args).toEqual({});
    });
  });

  // ============================================
  // executeSpeculatively
  // ============================================

  describe('executeSpeculatively', () => {
    const userId = 'user-123';

    it('should return a SpeculativeResult when tool is found and succeeds (string result)', async () => {
      const intent = makeIntent('water', 0.8);
      const tools = [makeTool('waterIntakeManager', () => 'hydration data here')];

      const result = await speculativeToolService.executeSpeculatively(userId, 'how much water', intent, tools);

      expect(result).not.toBeNull();
      expect(result!.toolName).toBe('waterIntakeManager');
      expect(result!.args).toEqual({ action: 'get_today' });
      expect(result!.result).toBe('hydration data here');
      expect(result!.startedAt).toBeGreaterThan(0);
      expect(result!.completedAt).toBeGreaterThan(0);
      expect(result!.error).toBeUndefined();
    });

    it('should JSON.stringify non-string results', async () => {
      const intent = makeIntent('meals', 0.8);
      const data = { meals: [{ name: 'breakfast', calories: 400 }] };
      const tools = [makeTool('getUserMealLogs', () => data)];

      const result = await speculativeToolService.executeSpeculatively(userId, 'show meals', intent, tools);

      expect(result).not.toBeNull();
      expect(result!.result).toBe(JSON.stringify(data));
    });

    it('should return null when intent has no speculative mapping', async () => {
      const intent = makeIntent('general', 0.95);
      const tools = [makeTool('someGeneralTool')];

      const result = await speculativeToolService.executeSpeculatively(userId, 'hello', intent, tools);

      expect(result).toBeNull();
    });

    it('should return null when confidence is too low', async () => {
      const intent = makeIntent('water', 0.3);
      const tools = [makeTool('waterIntakeManager')];

      const result = await speculativeToolService.executeSpeculatively(userId, 'water intake', intent, tools);

      expect(result).toBeNull();
    });

    it('should return null when the mapped tool is not in the tools array', async () => {
      const intent = makeIntent('water', 0.8);
      const tools = [makeTool('completelyDifferentTool')];

      const result = await speculativeToolService.executeSpeculatively(userId, 'water intake', intent, tools);

      expect(result).toBeNull();
    });

    it('should handle tool execution errors gracefully', async () => {
      const intent = makeIntent('goals', 0.8);
      const tools = [makeTool('getUserGoals', () => { throw new Error('DB connection lost'); })];

      const result = await speculativeToolService.executeSpeculatively(userId, 'my goals', intent, tools);

      expect(result).not.toBeNull();
      expect(result!.toolName).toBe('getUserGoals');
      expect(result!.result).toBeNull();
      expect(result!.error).toBe('DB connection lost');
      expect(result!.startedAt).toBeGreaterThan(0);
      expect(result!.completedAt).toBeGreaterThan(0);
    });

    it('should handle non-Error thrown values gracefully', async () => {
      const intent = makeIntent('progress', 0.8);
      const tools = [makeTool('getUserProgress', () => { throw 'string error'; })];

      const result = await speculativeToolService.executeSpeculatively(userId, 'my progress', intent, tools);

      expect(result).not.toBeNull();
      expect(result!.result).toBeNull();
      expect(result!.error).toBe('string error');
    });

    it('should handle async tool functions', async () => {
      const intent = makeIntent('workouts', 0.8);
      const tools = [makeTool('getUserWorkoutLogs', async () => 'workout data')];

      const result = await speculativeToolService.executeSpeculatively(userId, 'my workouts', intent, tools);

      expect(result).not.toBeNull();
      expect(result!.result).toBe('workout data');
      expect(result!.error).toBeUndefined();
    });

    it('should handle async tool functions that reject', async () => {
      const intent = makeIntent('schedules', 0.8);
      const tools = [makeTool('getScheduleByDate', async () => { throw new Error('timeout'); })];

      const result = await speculativeToolService.executeSpeculatively(userId, 'my schedule', intent, tools);

      expect(result).not.toBeNull();
      expect(result!.result).toBeNull();
      expect(result!.error).toBe('timeout');
    });

    it('should record timing: completedAt >= startedAt', async () => {
      const intent = makeIntent('water', 0.8);
      const tools = [makeTool('waterIntakeManager', () => 'data')];

      const result = await speculativeToolService.executeSpeculatively(userId, 'water', intent, tools);

      expect(result).not.toBeNull();
      expect(result!.completedAt).toBeGreaterThanOrEqual(result!.startedAt);
    });
  });

  // ============================================
  // matchesSpeculativeResult
  // ============================================

  describe('matchesSpeculativeResult', () => {
    const validResult: SpeculativeResult = {
      toolName: 'waterIntakeManager',
      args: { action: 'get_today' },
      result: '{"intake": 1500}',
      startedAt: Date.now() - 100,
      completedAt: Date.now(),
    };

    it('should return true when tool names match and result exists', () => {
      expect(
        speculativeToolService.matchesSpeculativeResult('waterIntakeManager', validResult)
      ).toBe(true);
    });

    it('should return false when tool names do not match', () => {
      expect(
        speculativeToolService.matchesSpeculativeResult('getUserMealLogs', validResult)
      ).toBe(false);
    });

    it('should return false when speculativeResult is null', () => {
      expect(
        speculativeToolService.matchesSpeculativeResult('waterIntakeManager', null)
      ).toBe(false);
    });

    it('should return false when result field is null (error case)', () => {
      const errorResult: SpeculativeResult = {
        toolName: 'waterIntakeManager',
        args: { action: 'get_today' },
        result: null,
        startedAt: Date.now() - 100,
        completedAt: Date.now(),
        error: 'something failed',
      };

      expect(
        speculativeToolService.matchesSpeculativeResult('waterIntakeManager', errorResult)
      ).toBe(false);
    });

    it('should return false when result is null even without error field', () => {
      const noResultNoError: SpeculativeResult = {
        toolName: 'getUserGoals',
        args: {},
        result: null,
        startedAt: Date.now(),
        completedAt: Date.now(),
      };

      expect(
        speculativeToolService.matchesSpeculativeResult('getUserGoals', noResultNoError)
      ).toBe(false);
    });

    it('should match correctly regardless of args differences', () => {
      const resultWithArgs: SpeculativeResult = {
        toolName: 'getScheduleByDate',
        args: { date: '2026-01-01' },
        result: '{"events": []}',
        startedAt: Date.now(),
        completedAt: Date.now(),
      };

      expect(
        speculativeToolService.matchesSpeculativeResult('getScheduleByDate', resultWithArgs)
      ).toBe(true);
    });
  });
});
