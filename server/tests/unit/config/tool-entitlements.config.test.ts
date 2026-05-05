import { TOOL_FEATURE_REQUIREMENTS } from '../../../src/config/tool-entitlements.config.js';

describe('TOOL_FEATURE_REQUIREMENTS', () => {
  it('should map musicManager to ai.music', () => {
    expect(TOOL_FEATURE_REQUIREMENTS['musicManager']).toBe('ai.music');
  });

  it('should map whoopAnalyticsManager to ai.integrations.whoop', () => {
    expect(TOOL_FEATURE_REQUIREMENTS['whoopAnalyticsManager']).toBe('ai.integrations.whoop');
  });

  it('should map competitionManager to ai.competitions', () => {
    expect(TOOL_FEATURE_REQUIREMENTS['competitionManager']).toBe('ai.competitions');
  });

  it('should map voiceJournalManager to ai.voice-journal', () => {
    expect(TOOL_FEATURE_REQUIREMENTS['voiceJournalManager']).toBe('ai.voice-journal');
  });

  it('should not have a requirement for goalManager (free tier)', () => {
    expect(TOOL_FEATURE_REQUIREMENTS['goalManager']).toBeUndefined();
  });

  it('should not have a requirement for mealManager (free tier)', () => {
    expect(TOOL_FEATURE_REQUIREMENTS['mealManager']).toBeUndefined();
  });

  it('should have exactly 4 premium tool mappings', () => {
    expect(Object.keys(TOOL_FEATURE_REQUIREMENTS)).toHaveLength(4);
  });

  it('all feature keys should be non-empty strings', () => {
    for (const [tool, feature] of Object.entries(TOOL_FEATURE_REQUIREMENTS)) {
      expect(typeof feature).toBe('string');
      expect(feature.length).toBeGreaterThan(0);
      expect(tool.length).toBeGreaterThan(0);
    }
  });
});
