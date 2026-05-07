/**
 * AIProvider.repairJSON and stripMarkdownFences Unit Tests
 *
 * Tests the JSON repair logic that handles malformed AI responses:
 * comments, trailing commas, truncated output, unclosed strings.
 */

// Direct import — repairJSON and stripMarkdownFences are pure methods with no side-effect deps
import { AIProvider } from '../../../src/services/ai-coach/core/ai-provider.js';

describe('AIProvider.repairJSON', () => {
  let provider: AIProvider;

  beforeEach(() => {
    provider = new AIProvider();
  });

  it('should return valid JSON unchanged', () => {
    const input = '{"goal_summary":"Fitness","questions":[]}';
    const result = provider.repairJSON(input);
    expect(JSON.parse(result)).toEqual({ goal_summary: 'Fitness', questions: [] });
  });

  it('should remove single-line comments', () => {
    const input = '{\n"goal": "fitness" // this is a comment\n}';
    const result = provider.repairJSON(input);
    expect(JSON.parse(result)).toEqual({ goal: 'fitness' });
  });

  it('should remove multi-line comments', () => {
    const input = '{\n/* a comment */\n"goal": "fitness"\n}';
    const result = provider.repairJSON(input);
    expect(JSON.parse(result)).toEqual({ goal: 'fitness' });
  });

  it('should remove trailing commas before }', () => {
    const input = '{"a": 1, "b": 2,}';
    const result = provider.repairJSON(input);
    expect(JSON.parse(result)).toEqual({ a: 1, b: 2 });
  });

  it('should remove trailing comma in array', () => {
    const input = '{"items": [1, 2, 3,]}';
    const result = provider.repairJSON(input);
    expect(JSON.parse(result)).toEqual({ items: [1, 2, 3] });
  });

  it('should fix unescaped newlines inside string values', () => {
    const input = '{"question": "How are\nyou?"}';
    const result = provider.repairJSON(input);
    expect(JSON.parse(result)).toEqual({ question: 'How are\nyou?' });
  });

  describe('truncated JSON repair', () => {
    it('should close a single unclosed brace', () => {
      const input = '{"goal": "fitness"';
      const result = provider.repairJSON(input);
      expect(JSON.parse(result)).toEqual({ goal: 'fitness' });
    });

    it('should close nested unclosed braces and brackets', () => {
      const input = '{"questions": [{"id": "q1"}';
      const result = provider.repairJSON(input);
      const parsed = JSON.parse(result);
      expect(parsed.questions).toHaveLength(1);
      expect(parsed.questions[0].id).toBe('q1');
    });

    it('should close unclosed string then close brackets', () => {
      const input = '{"questions": [{"id": "q1", "question": "How are you';
      const result = provider.repairJSON(input);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should handle truncation mid-object with trailing comma', () => {
      const input = '{"questions": [{"id": "q1", "question": "What is"},{"id": "q2", "quest';
      const result = provider.repairJSON(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.questions).toBeDefined();
      expect(parsed.questions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle a realistic truncated batch MCQ response', () => {
      const input = `{"goal_summary":"Improve fitness","detected_goal_categories":["fitness","exercise"],"questions":[{"id":"q1","question":"Where are you starting from?","options":[{"label":"Beginner","value":"beginner"},{"label":"Intermediate","value":"intermediate"},{"label":"Advanced","value":"advanced"},{"label":"Expert","value":"expert"}]},{"id":"q2","question":"How often do you exercise?","options":[{"label":"Never","value":"never"},{"label":"1-2 times","value":"1_2_times"},{"label":"3-4 times","value":"3_4_times"},{"label":"Daily","value":"dai`;
      const result = provider.repairJSON(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.goal_summary).toBe('Improve fitness');
      expect(parsed.questions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle truncation right after a complete question object', () => {
      const input = `{"goal_summary":"Test","questions":[{"id":"q1","question":"Q1?","options":[{"label":"A","value":"a"}]},{"id":"q2","question":"Q2?","options":[{"label":"B","value":"b"}]},{"id":"q3","que`;
      const result = provider.repairJSON(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.questions.length).toBeGreaterThanOrEqual(2);
    });

    it('should not modify already valid JSON', () => {
      const valid = '{"a":1,"b":[1,2,3],"c":{"d":"e"}}';
      const result = provider.repairJSON(valid);
      expect(result).toBe(valid);
    });

    it('should handle deeply nested truncation', () => {
      const input = '{"a":{"b":{"c":[{"d":"e"';
      const result = provider.repairJSON(input);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should handle truncation with trailing comma after complete element', () => {
      const input = '{"items":[{"id":1},';
      const result = provider.repairJSON(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.items).toHaveLength(1);
    });
  });

  describe('combined issues', () => {
    it('should handle comments + trailing commas + truncation together', () => {
      const input = '{\n"a": 1, // comment\n"b": [1, 2,],\n"c": {"d": "trun';
      const result = provider.repairJSON(input);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});

describe('AIProvider.stripMarkdownFences', () => {
  let provider: AIProvider;

  beforeEach(() => {
    provider = new AIProvider();
  });

  it('should strip ```json fences', () => {
    const input = '```json\n{"a":1}\n```';
    expect(provider.stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it('should strip ``` fences without language', () => {
    const input = '```\n{"a":1}\n```';
    expect(provider.stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it('should return plain text unchanged', () => {
    const input = '{"a":1}';
    expect(provider.stripMarkdownFences(input)).toBe('{"a":1}');
  });

  it('should trim whitespace', () => {
    const input = '  {"a":1}  ';
    expect(provider.stripMarkdownFences(input)).toBe('{"a":1}');
  });
});
