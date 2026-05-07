/**
 * BatchMCQService Unit Tests
 *
 * Tests JSON parsing, repair, fallback, and question extraction
 * for the batch MCQ assessment endpoint.
 */

import { jest } from '@jest/globals';

// Mocks must be set up before dynamic import
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    gemini: { apiKey: '', model: 'gemini-2.5-flash' },
    openai: { apiKey: '', model: 'gpt-4o-mini', maxTokens: 1000 },
  },
}));

// Use AIProvider directly for its pure utility methods
import { AIProvider } from '../../../src/services/ai-coach/core/ai-provider.js';

const realProvider = new AIProvider();

function createMockProvider(geminiResponse: string | null = null) {
  return {
    geminiApiKey: geminiResponse !== null ? 'fake-key' : '',
    visionClient: null,
    callGeminiText: jest.fn<() => Promise<string>>().mockResolvedValue(geminiResponse || ''),
    stripMarkdownFences: realProvider.stripMarkdownFences.bind(realProvider),
    repairJSON: realProvider.repairJSON.bind(realProvider),
    isReasoningModel: realProvider.isReasoningModel.bind(realProvider),
    getTemperatureParameter: realProvider.getTemperatureParameter.bind(realProvider),
    getTokenParameter: realProvider.getTokenParameter.bind(realProvider),
    getResponseFormatParameter: realProvider.getResponseFormatParameter.bind(realProvider),
  };
}

const VALID_RESPONSE = JSON.stringify({
  goal_summary: 'Improve fitness',
  detected_goal_categories: ['fitness', 'exercise'],
  questions: [
    { id: 'q1', question: 'Where are you starting from?', options: [{ label: 'Beginner', value: 'beginner' }, { label: 'Intermediate', value: 'intermediate' }, { label: 'Advanced', value: 'advanced' }, { label: 'Expert', value: 'expert' }] },
    { id: 'q2', question: 'How often do you exercise?', options: [{ label: 'Never', value: 'never' }, { label: '1-2 times/week', value: '1_2' }, { label: '3-4 times/week', value: '3_4' }, { label: 'Daily', value: 'daily' }] },
    { id: 'q3', question: 'What is your main blocker?', options: [{ label: 'Time', value: 'time' }, { label: 'Motivation', value: 'motivation' }, { label: 'Knowledge', value: 'knowledge' }, { label: 'Injury', value: 'injury' }] },
  ],
});

let BatchMCQService: any;

beforeAll(async () => {
  const mod = await import('../../../src/services/ai-coach/assessment/batch-mcq.service.js');
  BatchMCQService = mod.BatchMCQService;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BatchMCQService', () => {
  describe('valid JSON response', () => {
    it('should parse valid JSON and return mapped questions', async () => {
      const provider = createMockProvider(VALID_RESPONSE);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBe(3);
      expect(result.goalSummary).toBe('Improve fitness');
      expect(result.questions[0].question).toBe('Where are you starting from?');
      expect(result.questions[0].options.length).toBe(4);
      expect(result.questions[0].options[0].text).toBe('Beginner');
      expect(result.questions[0].options[0].insightValue).toBe('beginner');
      expect(result.questions[0].options[0].id).toBe('opt-1');
    });
  });

  describe('JSON with markdown fences', () => {
    it('should strip ```json fences and parse', async () => {
      const fenced = '```json\n' + VALID_RESPONSE + '\n```';
      const provider = createMockProvider(fenced);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBe(3);
      expect(result.goalSummary).toBe('Improve fitness');
    });
  });

  describe('JSON with comments', () => {
    it('should repair JSON with inline comments', async () => {
      const withComments = `{
        "goal_summary": "Fitness plan", // summary
        "detected_goal_categories": ["fitness"],
        "questions": [
          {"id": "q1", "question": "How fit are you?", "options": [{"label": "Low", "value": "low"}, {"label": "High", "value": "high"}, {"label": "Medium", "value": "medium"}, {"label": "Peak", "value": "peak"}]},
          {"id": "q2", "question": "How often?", "options": [{"label": "Never", "value": "never"}, {"label": "Sometimes", "value": "sometimes"}, {"label": "Often", "value": "often"}, {"label": "Always", "value": "always"}]}
        ]
      }`;
      const provider = createMockProvider(withComments);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBe(2);
      expect(result.goalSummary).toBe('Fitness plan');
    });
  });

  describe('trailing commas', () => {
    it('should handle trailing commas in objects and arrays', async () => {
      const withTrailing = `{
        "goal_summary": "Fitness",
        "detected_goal_categories": ["fitness",],
        "questions": [
          {"id": "q1", "question": "Level?", "options": [{"label": "Low", "value": "low"}, {"label": "High", "value": "high"},]},
          {"id": "q2", "question": "Goal?", "options": [{"label": "Lose", "value": "lose"}, {"label": "Gain", "value": "gain"},],},
        ],
      }`;
      const provider = createMockProvider(withTrailing);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBe(2);
    });
  });

  describe('truncated JSON', () => {
    it('should repair and parse truncated JSON preserving complete questions', async () => {
      const truncated = `{"goal_summary":"Fitness","detected_goal_categories":["fitness"],"questions":[{"id":"q1","question":"Starting level?","options":[{"label":"Beginner","value":"beginner"},{"label":"Intermediate","value":"intermediate"},{"label":"Advanced","value":"advanced"},{"label":"Expert","value":"expert"}]},{"id":"q2","question":"Exercise frequency?","options":[{"label":"Never","value":"never"},{"label":"Weekly","value":"weekly"},{"label":"Often","value":"often"},{"label":"Daily","value":"daily"}]},{"id":"q3","question":"Main goal?","options":[{"label":"Lose wei`;
      const provider = createMockProvider(truncated);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBeGreaterThanOrEqual(2);
      expect(result.questions[0].question).toBe('Starting level?');
      expect(result.questions[1].question).toBe('Exercise frequency?');
    });
  });

  describe('completely invalid response', () => {
    it('should return fallback questions when AI returns plain text', async () => {
      const provider = createMockProvider('I am thinking about your fitness goals and here is my analysis...');
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBeGreaterThanOrEqual(2);
      expect(result.questions[0].id).toMatch(/^fallback-/);
    });

    it('should return fallback questions when response is empty', async () => {
      const provider = createMockProvider(null);
      provider.geminiApiKey = '';
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBeGreaterThanOrEqual(2);
      expect(result.questions[0].id).toMatch(/^fallback-/);
    });
  });

  describe('options mapping', () => {
    it('should pad options to at least 4 when AI returns too few', async () => {
      const fewOptions = JSON.stringify({
        goal_summary: 'Test',
        detected_goal_categories: ['fitness'],
        questions: [
          { id: 'q1', question: 'Test?', options: [{ label: 'A', value: 'a' }] },
          { id: 'q2', question: 'Test2?', options: [{ label: 'B', value: 'b' }, { label: 'C', value: 'c' }] },
        ],
      });
      const provider = createMockProvider(fewOptions);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions[0].options.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('custom goal', () => {
    it('should handle custom goal with custom text', async () => {
      const customResponse = JSON.stringify({
        goal_summary: 'Improve sleep routine',
        detected_goal_categories: ['sleep', 'routine'],
        questions: [
          { id: 'q1', question: 'What disrupts your sleep?', options: [{ label: 'Screens', value: 'screens' }, { label: 'Stress', value: 'stress' }, { label: 'Schedule', value: 'schedule' }, { label: 'Noise', value: 'noise' }] },
          { id: 'q2', question: 'When do you usually sleep?', options: [{ label: 'Before 10pm', value: 'early' }, { label: '10pm-12am', value: 'normal' }, { label: 'After midnight', value: 'late' }, { label: 'Irregular', value: 'irregular' }] },
        ],
      });
      const provider = createMockProvider(customResponse);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({
        goal: 'custom',
        customGoalText: 'improve my sleep routine and wake up early',
        count: 6,
      });

      expect(result.questions.length).toBe(2);
      expect(result.detectedCategories).toContain('sleep');
    });
  });

  describe('too few questions', () => {
    it('should fall back when AI returns fewer than 2 questions', async () => {
      const tooFew = JSON.stringify({
        goal_summary: 'Test',
        detected_goal_categories: ['fitness'],
        questions: [
          { id: 'q1', question: 'Only one?', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
        ],
      });
      const provider = createMockProvider(tooFew);
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions[0].id).toMatch(/^fallback-/);
    });
  });

  describe('error resilience', () => {
    it('should not throw when AI returns garbled content', async () => {
      const provider = createMockProvider('{{{{not json!!! @@@ broken');
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBeGreaterThanOrEqual(2);
      expect(result.questions[0].id).toMatch(/^fallback-/);
    });

    it('should not throw when AI returns partial JSON with unicode', async () => {
      const provider = createMockProvider('{"goal_summary":"Test ❤","questions":[{"id":"q1","question":"Test?","options":[{"label":"الع","value":"a"},{"label":"B","value":"b"},{"label":"C","value":"c"},{"label":"D","value":"d"}]},{"id":"q2","question":"Q2?","options":[{"label":"X","value":"x"},{"label":"Y","value":"y"},{"label":"Z","value":"z"},{"label":"W","value":"w"}]}]}');
      const service = new BatchMCQService(provider);

      const result = await service.generateBatchMCQQuestions({ goal: 'fitness', count: 6 });

      expect(result.questions.length).toBe(2);
    });
  });
});
