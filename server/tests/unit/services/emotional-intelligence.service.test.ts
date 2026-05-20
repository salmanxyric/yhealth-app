import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockExtractInsightsOnly = jest.fn();
jest.unstable_mockModule('../../../src/services/conversation-insight-extractor.service.js', () => ({
  conversationInsightExtractorService: { extractInsightsOnly: mockExtractInsightsOnly },
}));

const mockGetActiveMemories = jest.fn();
jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: { getActiveMemories: mockGetActiveMemories },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { emotionalIntelligenceService } = await import(
  '../../../src/services/emotional-intelligence.service.js'
);

describe('EmotionalIntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveMemories.mockResolvedValue([]);
  });

  describe('analyze()', () => {
    it('returns neutral context when message is too short', async () => {
      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: 'ok',
        conversationHistory: [],
      });

      expect(result.primaryEmotion).toBe('neutral');
      expect(result.confidence).toBeLessThan(0.5);
      expect(mockExtractInsightsOnly).not.toHaveBeenCalled();
    });

    it('detects emotional masking from "I\'m fine" with declining engagement', async () => {
      mockExtractInsightsOnly.mockResolvedValue({
        mood: { state: 'neutral', intensity: 0.2, triggers: [] },
        intent: 'status_update',
        entities: {},
        behavioral_signals: { sentiment_trend: 'declining', commitment_level: 'low' },
        memory_candidates: [],
        core_profile_updates: [],
        emotional_context: {
          primaryEmotion: 'neutral',
          emotionalIntensity: 20,
          confidence: 0.6,
          toneMarkers: ['passive', 'flat'],
          hiddenStates: ['masking'],
          behavioralPatterns: [],
          riskLevel: 'low',
          riskFlags: [],
          energyEstimate: 'low',
          cognitiveLoad: 'light',
          motivationState: 'declining',
          needsEmpathy: true,
          needsChallenge: false,
          needsStructure: false,
          needsSilence: false,
          isAvoidingTruth: false,
          isSelfSabotaging: false,
          isEmotionallyOverwhelmed: false,
          moodTrajectory: 'declining',
          comparedToBaseline: 'below',
          engagementLevel: 'low',
          responseComplexity: 'shrinking',
        },
      });

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: "I'm fine, just tired I guess",
        conversationHistory: [
          { role: 'assistant', content: 'How are you feeling today?' },
          { role: 'user', content: "I'm fine, just tired I guess" },
        ],
      });

      expect(result.hiddenStates).toContain('masking');
      expect(result.needsEmpathy).toBe(true);
      expect(result.moodTrajectory).toBe('declining');
    });

    it('detects self-sabotage from repeated goal abandonment in memory', async () => {
      mockGetActiveMemories.mockResolvedValue([
        {
          category: 'behavioral',
          memoryType: 'pattern',
          title: 'Repeated gym goal abandonment',
          structuredData: { type: 'self_sabotage_loop', frequency: 4 },
          confidence: 0.8,
        },
      ]);

      mockExtractInsightsOnly.mockResolvedValue({
        mood: { state: 'frustrated', intensity: 0.5 },
        intent: 'goal_setting',
        entities: { goals: ['start gym routine'] },
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
        emotional_context: {
          primaryEmotion: 'determination',
          emotionalIntensity: 50,
          confidence: 0.7,
          toneMarkers: [],
          hiddenStates: [],
          behavioralPatterns: [
            { type: 'self_sabotage_loop', frequency: 4, lastOccurrence: '2026-05-15', confidence: 0.8 },
          ],
          riskLevel: 'low',
          riskFlags: [],
          energyEstimate: 'moderate',
          cognitiveLoad: 'light',
          motivationState: 'seeking',
          needsEmpathy: false,
          needsChallenge: true,
          needsStructure: true,
          needsSilence: false,
          isAvoidingTruth: false,
          isSelfSabotaging: true,
          isEmotionallyOverwhelmed: false,
          moodTrajectory: 'stable',
          comparedToBaseline: 'at',
          engagementLevel: 'moderate',
          responseComplexity: 'stable',
        },
      });

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: "I'm going to start going to the gym again, this time for real",
        conversationHistory: [],
      });

      expect(result.isSelfSabotaging).toBe(true);
      expect(result.behavioralPatterns.some((p: any) => p.type === 'self_sabotage_loop')).toBe(true);
      expect(result.needsChallenge).toBe(true);
    });

    it('detects emotional shutdown from shrinking responses', async () => {
      mockExtractInsightsOnly.mockResolvedValue({
        mood: { state: 'neutral', intensity: 0.1 },
        intent: 'minimal_response',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
        emotional_context: {
          primaryEmotion: 'numbness',
          emotionalIntensity: 15,
          confidence: 0.65,
          toneMarkers: ['flat'],
          hiddenStates: ['emotional_shutdown'],
          behavioralPatterns: [],
          riskLevel: 'low',
          riskFlags: [],
          energyEstimate: 'low',
          cognitiveLoad: 'light',
          motivationState: 'absent',
          needsEmpathy: true,
          needsChallenge: false,
          needsStructure: false,
          needsSilence: true,
          isAvoidingTruth: false,
          isSelfSabotaging: false,
          isEmotionallyOverwhelmed: false,
          moodTrajectory: 'declining',
          comparedToBaseline: 'below',
          engagementLevel: 'withdrawing',
          responseComplexity: 'shrinking',
        },
      });

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: 'yeah sure',
        conversationHistory: [
          { role: 'user', content: 'I had a really hard week at work with some big deadlines and stress' },
          { role: 'assistant', content: 'That sounds tough. What was the hardest part?' },
          { role: 'user', content: 'just everything' },
          { role: 'assistant', content: 'I hear you. Want to talk about what specifically drained you most?' },
          { role: 'user', content: 'yeah sure' },
        ],
      });

      expect(result.hiddenStates).toContain('emotional_shutdown');
      expect(result.needsSilence).toBe(true);
      expect(result.engagementLevel).toBe('withdrawing');
      expect(result.responseComplexity).toBe('shrinking');
    });

    it('returns neutral context on extraction failure (fallback)', async () => {
      mockExtractInsightsOnly.mockRejectedValue(new Error('OpenAI timeout'));

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: 'How should I structure my morning routine?',
        conversationHistory: [],
      });

      expect(result.primaryEmotion).toBe('neutral');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
});
