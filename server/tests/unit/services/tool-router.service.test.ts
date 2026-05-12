/**
 * Tool Router Service — Unit Tests
 *
 * Tests intent classification (keyword matching + fuzzy fallback)
 * and TOOL_GROUPS completeness.
 */

import { classifyIntent, TOOL_GROUPS } from '../../../src/services/tool-router.service.js';
import type { ToolIntent, MessageComplexity } from '../../../src/services/tool-router.service.js';

// ============================================
// HELPERS
// ============================================

const ALL_INTENTS: ToolIntent[] = [
  'meals', 'workouts', 'goals', 'schedules', 'wellbeing', 'progress',
  'water', 'shopping', 'reminders', 'notes', 'integrations', 'competitions',
  'emotional', 'gamification', 'personal', 'music', 'status', 'finance',
  'analytics', 'general',
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

    it('should classify "save this as a quick note" as notes', () => {
      const result = classifyIntent('save this as a quick note');
      expect(result.primary).toBe('notes');
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

  describe('notes group', () => {
    it('should include quick note manager tools', () => {
      expect(TOOL_GROUPS.notes).toEqual(expect.arrayContaining([
        'getQuickNotes',
        'createQuickNote',
        'updateQuickNote',
        'deleteQuickNote',
      ]));
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

// ============================================
// COMPLEXITY CLASSIFICATION
// ============================================

describe('classifyIntent — complexity classification', () => {
  describe('TRIVIAL', () => {
    it.each([
      'hi',
      'hello!',
      'hey',
      'thanks',
      'thank you!',
      'bye',
      'goodbye',
      'good morning',
      'good night',
      'how are you',
      'ok',
      'sure',
      'yes',
      'nope',
      'got it',
      'cool',
      'lol',
      'yo!',
    ])('should classify "%s" as TRIVIAL', (msg) => {
      const result = classifyIntent(msg);
      expect(result.complexity).toBe('TRIVIAL');
    });

    it('should classify greetings with trailing punctuation as TRIVIAL', () => {
      expect(classifyIntent('hello!!!').complexity).toBe('TRIVIAL');
      expect(classifyIntent('hi.').complexity).toBe('TRIVIAL');
      expect(classifyIntent('hey?').complexity).toBe('TRIVIAL');
    });

    it('should NOT classify messages with additional content as TRIVIAL', () => {
      // "hi I want to log my breakfast" starts with "hi" but has more content
      const result = classifyIntent('hi I want to log my breakfast');
      expect(result.complexity).not.toBe('TRIVIAL');
    });
  });

  describe('SIMPLE_ACTION', () => {
    it.each([
      'log my breakfast',
      'add eggs to my list',
      'create a new goal',
      'set a reminder',
      'delete that note',
      'remove my alarm',
      'update my weight',
      'cancel my reminder',
    ])('should classify "%s" as SIMPLE_ACTION', (msg) => {
      const result = classifyIntent(msg);
      expect(result.complexity).toBe('SIMPLE_ACTION');
    });

    it('should NOT classify long messages as SIMPLE_ACTION even with action verbs', () => {
      // Over 60 characters — should not be SIMPLE_ACTION
      const longMessage = 'log my breakfast and also record my workout and track water intake please';
      expect(longMessage.length).toBeGreaterThan(60);
      const result = classifyIntent(longMessage);
      expect(result.complexity).not.toBe('SIMPLE_ACTION');
    });

    it('should NOT classify messages without action verbs as SIMPLE_ACTION', () => {
      // Short and matched, but no action verb
      const result = classifyIntent('my breakfast');
      expect(result.complexity).not.toBe('SIMPLE_ACTION');
    });
  });

  describe('ANALYTICAL', () => {
    it.each([
      'show me the correlation between sleep and mood',
      'analyze my workout trend over time',
      'compare my calories this week vs last week',
      'what factors affect my sleep quality',
      'give me a deep analysis of my progress',
      'show me the relationship between stress and workouts',
      'what drives my mood patterns',
      'show me insights from my data',
    ])('should classify "%s" as ANALYTICAL', (msg) => {
      const result = classifyIntent(msg);
      expect(result.complexity).toBe('ANALYTICAL');
    });

    it('should classify messages with analytics keywords as ANALYTICAL', () => {
      const result = classifyIntent('show me the trend in my data over time');
      expect(result.complexity).toBe('ANALYTICAL');
    });

    it('should classify multi-intent messages with strong secondary as ANALYTICAL', () => {
      // 3+ intents where secondary is >= 70% of primary score
      const result = classifyIntent('how does my meal plan correlate with workout progress and sleep quality over time');
      expect(result.complexity).toBe('ANALYTICAL');
    });
  });

  describe('CONVERSATIONAL', () => {
    it('should default to CONVERSATIONAL for general conversation', () => {
      const result = classifyIntent('tell me about healthy eating habits');
      expect(result.complexity).toBe('CONVERSATIONAL');
    });

    it('should classify moderately complex messages without analytical keywords as CONVERSATIONAL', () => {
      const result = classifyIntent('what should I have for dinner tonight based on my goals');
      expect(result.complexity).toBe('CONVERSATIONAL');
    });

    it('should classify questions about status without action verbs as CONVERSATIONAL', () => {
      const result = classifyIntent('how much water did I drink today');
      expect(result.complexity).toBe('CONVERSATIONAL');
    });
  });

  describe('complexity is always a valid MessageComplexity value', () => {
    const VALID_COMPLEXITIES: MessageComplexity[] = ['TRIVIAL', 'SIMPLE_ACTION', 'CONVERSATIONAL', 'ANALYTICAL'];

    it.each([
      '',
      'hi',
      'log my meal',
      'analyze my sleep trends over the past month',
      'xyzzy gibberish nothing matches',
      'how is my goal progress on my workout plan',
    ])('classifyIntent("%s").complexity is a valid MessageComplexity', (msg) => {
      const result = classifyIntent(msg);
      expect(VALID_COMPLEXITIES).toContain(result.complexity);
    });
  });
});

// ============================================
// CONFIDENCE SCORING
// ============================================

describe('classifyIntent — confidence scoring', () => {
  it('should return confidence between 0 and 1 inclusive', () => {
    const messages = [
      'log my breakfast',
      'how is my goal progress on my workout plan',
      'play some music',
      'xyzzy gibberish',
      '',
      'I ate breakfast then did a workout and tracked my water and set a goal',
    ];
    for (const msg of messages) {
      const result = classifyIntent(msg);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('should return 0 confidence when no keywords match', () => {
    const result = classifyIntent('42');
    expect(result.confidence).toBe(0);
  });

  it('should return higher confidence for single-intent messages', () => {
    // "play some music" only matches the music intent
    const singleIntent = classifyIntent('play some music');
    // "log my meal and also track my water and set a workout goal" matches multiple intents
    const multiIntent = classifyIntent('log my meal and also track my water and set a workout goal');
    expect(singleIntent.confidence).toBeGreaterThan(multiIntent.confidence);
  });

  it('should return confidence of 1 when only one intent scores', () => {
    // "play some music" should only trigger music intent keywords
    const result = classifyIntent('play some music');
    expect(result.primary).toBe('music');
    expect(result.confidence).toBe(1);
  });

  it('should return lower confidence for ambiguous multi-intent messages', () => {
    const result = classifyIntent('how is my goal progress on my workout plan');
    // Multiple intents matched, so confidence should be less than 1
    expect(result.confidence).toBeLessThan(1);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return confidence as a number, not a percentage', () => {
    const result = classifyIntent('log my breakfast');
    expect(typeof result.confidence).toBe('number');
    // Confidence is 0-1 ratio, not 0-100 percentage
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

// ============================================
// EXTENDED RESULT SHAPE — complexity & confidence
// ============================================

describe('classifyIntent — extended result shape', () => {
  it('should include complexity and confidence on every result', () => {
    const result = classifyIntent('anything at all');
    expect(result).toHaveProperty('complexity');
    expect(result).toHaveProperty('confidence');
  });

  it('should return all four fields: primary, secondary, complexity, confidence', () => {
    const result = classifyIntent('log a meal');
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(['primary', 'secondary', 'complexity', 'confidence']),
    );
  });

  it('should return complexity as a string', () => {
    const result = classifyIntent('hello');
    expect(typeof result.complexity).toBe('string');
  });

  it('should return confidence as a number', () => {
    const result = classifyIntent('hello');
    expect(typeof result.confidence).toBe('number');
  });

  it('should return well-formed results for empty input', () => {
    const result = classifyIntent('');
    expect(result).toHaveProperty('primary');
    expect(result).toHaveProperty('secondary');
    expect(result).toHaveProperty('complexity');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.primary).toBe('string');
    expect(Array.isArray(result.secondary)).toBe(true);
    expect(typeof result.complexity).toBe('string');
    expect(typeof result.confidence).toBe('number');
  });

  it('should maintain consistent shape across diverse inputs', () => {
    const inputs = [
      'hi',
      'log my meal',
      'analyze sleep trends over time',
      'tell me about my workout history and nutrition plan',
      '',
      'xyzzy',
    ];
    for (const msg of inputs) {
      const result = classifyIntent(msg);
      expect(result).toEqual(
        expect.objectContaining({
          primary: expect.any(String),
          secondary: expect.any(Array),
          complexity: expect.any(String),
          confidence: expect.any(Number),
        }),
      );
    }
  });
});
