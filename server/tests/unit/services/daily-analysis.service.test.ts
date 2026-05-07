/**
 * @file Daily Analysis Service Tests
 * Focused coverage for LLM structured-insight JSON parsing.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

setupDbMock();
const mockLogger = setupLoggerMock();

const mockModel = {
  invoke: jest.fn<any>().mockResolvedValue({ content: '[]' }),
};

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    openai: { model: 'test-model' },
  },
}));

jest.unstable_mockModule('../../../src/services/model-factory.service.js', () => ({
  modelFactory: {
    getModel: jest.fn().mockReturnValue(mockModel),
    isAuthError: jest.fn().mockReturnValue(false),
    markCurrentProviderRateLimited: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/llm-circuit-breaker.service.js', () => ({
  llmCircuitBreaker: {
    isCallAllowed: jest.fn().mockReturnValue(true),
    recordSuccess: jest.fn(),
    isRateLimitError: jest.fn().mockReturnValue(false),
    recordRateLimitError: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/comprehensive-user-context.service.js', () => ({
  comprehensiveUserContextService: {
    getComprehensiveContext: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: {
    getDailyScore: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/mental-recovery-score.service.js', () => ({
  mentalRecoveryScoreService: {
    calculateRecoveryScore: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/user-coaching-profile.service.js', () => ({
  userCoachingProfileService: {
    getProfile: jest.fn(),
    computeCoachEmotionalState: jest.fn(),
    computeRelationshipDepth: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/services/cross-pillar-intelligence.service.js', () => ({
  crossPillarIntelligenceService: {
    analyzeUser: jest.fn(),
  },
}));

const { dailyAnalysisService } = await import('../../../src/services/daily-analysis.service.js');

describe('DailyAnalysisService structured insight parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('repairs missing commas between JSON object properties', () => {
    const malformed = `[
      {
        "claim": "Sleep is limiting training today"
        "evidence": ["Sleep: 5.4h", "Workout score: 42"]
        "impact": "Lower sleep may reduce workout output."
        "action": "Keep today's workout under 30 minutes."
        "confidence": "medium"
        "pillars_connected": ["sleep", "workout"]
        "severity": "warning"
      }
    ]`;

    const parsed = (dailyAnalysisService as any).parseStructuredInsightsResponse(malformed);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      claim: 'Sleep is limiting training today',
      evidence: ['Sleep: 5.4h', 'Workout score: 42'],
      severity: 'warning',
    });
  });

  it('returns an empty array and logs a warning when JSON cannot be repaired', () => {
    const parsed = (dailyAnalysisService as any).parseStructuredInsightsResponse('not json at all');

    expect(parsed).toEqual([]);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[DailyAnalysis] Could not parse structured insights JSON, using defaults',
      expect.objectContaining({
        contentLength: 15,
      })
    );
  });
});
