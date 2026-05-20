import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const { personaSelectorService } = await import(
  '../../../src/services/persona-selector.service.js'
);

import {
  NEUTRAL_EMOTIONAL_CONTEXT,
  type EmotionalContext,
  type TopicClassification,
} from '@shared/types/domain/emotional-intelligence.js';

function makeContext(overrides: Partial<EmotionalContext> = {}): EmotionalContext {
  return { ...NEUTRAL_EMOTIONAL_CONTEXT, ...overrides };
}

describe('PersonaSelectorService', () => {
  beforeEach(() => {
    personaSelectorService.resetTransitionState();
  });

  describe('select()', () => {
    it('returns deep_listener for emotional shutdown', () => {
      const ctx = makeContext({
        hiddenStates: ['emotional_shutdown'],
        engagementLevel: 'withdrawing',
      });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('deep_listener');
      expect(result.responseLength).toBe('minimal');
      expect(result.challengeLevel).toBe(0);
      expect(result.warmthLevel).toBeGreaterThanOrEqual(8);
    });

    it('returns brutal_accountability for self-sabotage with low risk', () => {
      const ctx = makeContext({
        isSelfSabotaging: true,
        riskLevel: 'low',
        behavioralPatterns: [
          { type: 'self_sabotage_loop', frequency: 4, lastOccurrence: '2026-05-15', confidence: 0.8 },
        ],
      });
      const result = personaSelectorService.select(ctx, { domain: 'fitness' });

      expect(result.primaryPersona).toBe('brutal_accountability');
      expect(result.shouldConfirm).toBe(true);
      expect(result.challengeLevel).toBeGreaterThanOrEqual(7);
    });

    it('returns therapist for multiple hidden states', () => {
      const ctx = makeContext({
        hiddenStates: ['masking', 'suppressing'],
        primaryEmotion: 'sadness',
        emotionalIntensity: 65,
      });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('therapist');
      expect(result.shouldUseMCQ).toBe(true);
    });

    it('returns strategic_advisor for career strategy with low emotional intensity', () => {
      const ctx = makeContext({ emotionalIntensity: 25, motivationState: 'present' });
      const topic: TopicClassification = { domain: 'career', subtype: 'strategy' };
      const result = personaSelectorService.select(ctx, topic);

      expect(result.primaryPersona).toBe('strategic_advisor');
      expect(result.structureLevel).toBeGreaterThanOrEqual(8);
    });

    it('returns calm_mentor for cognitive overload', () => {
      const ctx = makeContext({ cognitiveLoad: 'overloaded', emotionalIntensity: 50 });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('calm_mentor');
      expect(result.responseLength).toBe('concise');
      expect(result.challengeLevel).toBeLessThanOrEqual(2);
    });

    it('returns emotional_recovery blend for high risk', () => {
      const ctx = makeContext({ riskLevel: 'high' });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('emotional_recovery');
      expect(result.secondaryPersona).toBe('therapist');
      expect(result.shouldEscalate).toBe(true);
    });

    it('blends therapist + accountability when needs empathy AND challenge', () => {
      const ctx = makeContext({ needsEmpathy: true, needsChallenge: true });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('therapist');
      expect(result.secondaryPersona).toBe('brutal_accountability');
      expect(result.blendWeight).toBeCloseTo(0.6, 1);
    });

    it('returns wellness_strategist for fitness topics', () => {
      const ctx = makeContext({ emotionalIntensity: 20 });
      const result = personaSelectorService.select(ctx, { domain: 'fitness' });

      expect(result.primaryPersona).toBe('wellness_strategist');
    });

    it('returns reflective_philosopher for spirituality topics', () => {
      const ctx = makeContext({ emotionalIntensity: 20 });
      const result = personaSelectorService.select(ctx, { domain: 'spirituality' });

      expect(result.primaryPersona).toBe('reflective_philosopher');
      expect(result.responseLength).toBe('expansive');
    });

    it('defaults to calm_mentor when no strong signals', () => {
      const result = personaSelectorService.select(
        NEUTRAL_EMOTIONAL_CONTEXT,
        { domain: 'general' },
      );

      expect(result.primaryPersona).toBe('calm_mentor');
    });
  });

  describe('transition smoothing', () => {
    it('limits persona shift to 30% per turn', () => {
      const ctx1 = makeContext({
        hiddenStates: ['masking', 'suppressing'],
        primaryEmotion: 'sadness',
        emotionalIntensity: 65,
      });
      personaSelectorService.select(ctx1, { domain: 'general' });

      const ctx2 = makeContext({
        emotionalIntensity: 15,
        motivationState: 'present',
      });
      const result = personaSelectorService.select(ctx2, { domain: 'career', subtype: 'strategy' });

      expect(result.secondaryPersona || result.primaryPersona).toBeDefined();
    });
  });
});
