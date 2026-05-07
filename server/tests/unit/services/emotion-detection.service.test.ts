import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    gemini: { apiKey: '' },
    deepseek: { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
    openai: { apiKey: '', model: 'gpt-4o-mini' },
  },
}));

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { parseEmotionClassification } = await import('../../../src/services/emotion-detection.service.js');

describe('parseEmotionClassification', () => {
  it('parses valid JSON emotion classifications', () => {
    expect(parseEmotionClassification('{"category":"happy","confidence":88,"reasoning":"upbeat"}')).toEqual({
      category: 'happy',
      confidence: 88,
      reasoning: 'upbeat',
    });
  });

  it('recovers category from truncated JSON when the category value is present', () => {
    expect(parseEmotionClassification('{\n  "category": "an')).toEqual({
      category: 'an',
      confidence: 50,
      reasoning: undefined,
    });
  });

  it('returns null when a truncated response has no usable category', () => {
    expect(parseEmotionClassification('{\n  "category":')).toBeNull();
  });
});
