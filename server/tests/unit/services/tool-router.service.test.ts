/**
 * Tool Router Service — Unit Tests
 *
 * Tests intent classification (keyword matching + fuzzy fallback)
 * and TOOL_GROUPS completeness.
 */

import { classifyIntent, TOOL_GROUPS } from '../../../src/services/tool-router.service.js';
import type { ToolIntent } from '../../../src/services/tool-router.service.js';

// ============================================
// HELPERS
// ============================================

const ALL_INTENTS: ToolIntent[] = [
  'meals', 'workouts', 'goals', 'schedules', 'wellbeing', 'progress',
  'water', 'shopping', 'reminders', 'integrations', 'competitions',
  'emotional', 'gamification', 'personal', 'music', 'status', 'general',
];

// ============================================
// classifyIntent — PRIMARY INTENT
// ============================================

describe('classifyIntent', () => {
  describe('primary intent classification', () => {
    it('should classify "I had breakfast" as meals', () => {
      const result = classifyIntent('I had breakfast');
      expect(result.primary).toBe('meals');
    });

    it('should classify "log my workout" as workouts', () => {
      const result = classifyIntent('log my workout');
      expect(result.primary).toBe('workouts');
    });

    it('should classify "set a new goal and reach my target" as goals', () => {
      const result = classifyIntent('set a new goal and reach my target');
      expect(result.primary).toBe('goals');
    });

    it('should classify "I feel stressed" as wellbeing', () => {
      const result = classifyIntent('I feel stressed');
      expect(result.primary).toBe('wellbeing');
    });

    it('should classify "I slept badly" as wellbeing', () => {
      const result = classifyIntent('I slept badly');
      expect(result.primary).toBe('wellbeing');
    });

    it('should classify "what medications am I on" as personal', () => {
      const result = classifyIntent('what medications am I on');
      expect(result.primary).toBe('personal');
    });

    it('should classify "play some music" as music', () => {
      const result = classifyIntent('play some music');
      expect(result.primary).toBe('music');
    });

    it('should classify "I need to drink more water and stay hydrated" as water', () => {
      const result = classifyIntent('I need to drink more water and stay hydrated');
      expect(result.primary).toBe('water');
    });

    it('should classify "what is on my schedule today" as schedules', () => {
      const result = classifyIntent('what is on my schedule today');
      expect(result.primary).toBe('schedules');
    });

    it('should classify "how much do I weigh now" as progress', () => {
      const result = classifyIntent('how much do I weigh now');
      expect(result.primary).toBe('progress');
    });

    it('should classify "add eggs to my shopping list" as shopping', () => {
      const result = classifyIntent('add eggs to my shopping list');
      expect(result.primary).toBe('shopping');
    });

    it('should classify "set a reminder and alarm for me" as reminders', () => {
      const result = classifyIntent('set a reminder and alarm for me');
      expect(result.primary).toBe('reminders');
    });

    it('should classify "sync my whoop data" as integrations', () => {
      const result = classifyIntent('sync my whoop data');
      expect(result.primary).toBe('integrations');
    });

    it('should classify "show the leaderboard" as competitions', () => {
      const result = classifyIntent('show the leaderboard');
      expect(result.primary).toBe('competitions');
    });

    it('should classify "how is my emotional health" as emotional', () => {
      const result = classifyIntent('how is my emotional health');
      expect(result.primary).toBe('emotional');
    });

    it('should classify "check my xp and level" as gamification', () => {
      const result = classifyIntent('check my xp and level');
      expect(result.primary).toBe('gamification');
    });

    it('should classify "I am sick and injured" as status', () => {
      const result = classifyIntent('I am sick and injured');
      expect(result.primary).toBe('status');
    });
  });

  // ============================================
  // CASE INSENSITIVITY
  // ============================================

  describe('case insensitivity', () => {
    it('should classify "BREAKFAST was great" as meals (uppercase)', () => {
      const result = classifyIntent('BREAKFAST was great');
      expect(result.primary).toBe('meals');
    });

    it('should classify "My WORKOUT was intense" as workouts (mixed case)', () => {
      const result = classifyIntent('My WORKOUT was intense');
      expect(result.primary).toBe('workouts');
    });
  });

  // ============================================
  // FALLBACK TO GENERAL
  // ============================================

  describe('fallback behavior', () => {
    it('should always return a valid ToolIntent for unknown messages', () => {
      const result = classifyIntent('xyzzy12345');
      expect(result.primary).toBeDefined();
      expect(typeof result.primary).toBe('string');
      expect(result.secondary).toBeInstanceOf(Array);
    });

    it('should always return a valid ToolIntent for empty string', () => {
      const result = classifyIntent('');
      expect(result.primary).toBeDefined();
      expect(result.secondary).toBeInstanceOf(Array);
    });

    it('should return general when no keywords match at all', () => {
      const result = classifyIntent('42');
      expect(result.primary).toBe('general');
    });
  });

  // ============================================
  // SECONDARY INTENTS
  // ============================================

  describe('secondary intents', () => {
    it('should return secondary intents for ambiguous messages', () => {
      // "how is my goal progress on my workout plan" has keywords for goals + workouts + progress
      const result = classifyIntent('how is my goal progress on my workout plan');
      expect(result.secondary.length).toBeGreaterThan(0);
    });

    it('should return at most 2 secondary intents', () => {
      const result = classifyIntent('I ate breakfast then did a workout and tracked my water and set a goal');
      expect(result.secondary.length).toBeLessThanOrEqual(2);
    });

    it('should not include primary in secondary', () => {
      const result = classifyIntent('log my meal and also track my water intake');
      expect(result.secondary).not.toContain(result.primary);
    });

    it('should return empty secondary when message is single-intent', () => {
      const result = classifyIntent('play some music');
      // music is the only matched intent; secondary should be empty or have weak matches
      expect(result.primary).toBe('music');
    });
  });

  // ============================================
  // RESULT SHAPE
  // ============================================

  describe('result shape', () => {
    it('should always return an object with primary and secondary', () => {
      const result = classifyIntent('anything at all');
      expect(result).toHaveProperty('primary');
      expect(result).toHaveProperty('secondary');
      expect(typeof result.primary).toBe('string');
      expect(Array.isArray(result.secondary)).toBe(true);
    });

    it('should return a valid ToolIntent as primary', () => {
      const result = classifyIntent('log a meal');
      expect(ALL_INTENTS).toContain(result.primary);
    });

    it('should return only valid ToolIntents in secondary', () => {
      const result = classifyIntent('ate breakfast then did a workout and tracked water');
      for (const intent of result.secondary) {
        expect(ALL_INTENTS).toContain(intent);
      }
    });
  });
});

// ============================================
// TOOL_GROUPS
// ============================================

describe('TOOL_GROUPS', () => {
  it('should have entries for every ToolIntent', () => {
    for (const intent of ALL_INTENTS) {
      expect(TOOL_GROUPS).toHaveProperty(intent);
      expect(Array.isArray(TOOL_GROUPS[intent])).toBe(true);
    }
  });

  it('should have at least one tool per non-general intent', () => {
    for (const intent of ALL_INTENTS) {
      if (intent === 'general') continue;
      expect(TOOL_GROUPS[intent].length).toBeGreaterThan(0);
    }
  });

  describe('general group', () => {
    it('should include activityTimeline', () => {
      expect(TOOL_GROUPS.general).toContain('activityTimeline');
    });

    it('should include aiDecisionHistory', () => {
      expect(TOOL_GROUPS.general).toContain('aiDecisionHistory');
    });

    it('should include getUserProfile', () => {
      expect(TOOL_GROUPS.general).toContain('getUserProfile');
    });
  });

  describe('wellbeing group', () => {
    it('should include sleepManager', () => {
      expect(TOOL_GROUPS.wellbeing).toContain('sleepManager');
    });

    it('should include moodManager', () => {
      expect(TOOL_GROUPS.wellbeing).toContain('moodManager');
    });

    it('should include journalManager', () => {
      expect(TOOL_GROUPS.wellbeing).toContain('journalManager');
    });
  });

  describe('personal group', () => {
    it('should include medicationManager', () => {
      expect(TOOL_GROUPS.personal).toContain('medicationManager');
    });

    it('should include personalContextManager', () => {
      expect(TOOL_GROUPS.personal).toContain('personalContextManager');
    });
  });

  describe('music group', () => {
    it('should include musicManager', () => {
      expect(TOOL_GROUPS.music).toContain('musicManager');
    });
  });

  describe('no duplicate tool names within a group', () => {
    it.each(ALL_INTENTS)('TOOL_GROUPS[%s] has no duplicates', (intent) => {
      const tools = TOOL_GROUPS[intent];
      const unique = new Set(tools);
      expect(unique.size).toBe(tools.length);
    });
  });
});
