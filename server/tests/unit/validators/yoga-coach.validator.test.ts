/**
 * Yoga Coach Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  analyseCoachSchema,
  coachResponseSchema,
} from '../../../src/validators/yoga-coach.validator.js';

describe('Yoga Coach Validators', () => {
  describe('analyseCoachSchema', () => {
    const validData = {
      poseSlug: 'warrior-1',
      frameBase64: 'a'.repeat(200),
      currentAngles: { leftKnee: 90, rightKnee: 170 },
      elapsedSeconds: 30,
    };

    it('should accept valid input', () => {
      const result = analyseCoachSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing poseSlug', () => {
      const { poseSlug: _poseSlug, ...rest } = validData;
      const result = analyseCoachSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty poseSlug', () => {
      const result = analyseCoachSchema.safeParse({ ...validData, poseSlug: '' });
      expect(result.success).toBe(false);
    });

    it('should reject poseSlug exceeding 200 characters', () => {
      const result = analyseCoachSchema.safeParse({ ...validData, poseSlug: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject frameBase64 shorter than 100 characters', () => {
      const result = analyseCoachSchema.safeParse({ ...validData, frameBase64: 'short' });
      expect(result.success).toBe(false);
    });

    it('should reject frameBase64 exceeding 500000 characters', () => {
      const result = analyseCoachSchema.safeParse({
        ...validData,
        frameBase64: 'a'.repeat(500001),
      });
      expect(result.success).toBe(false);
    });

    it('should reject angle values below 0', () => {
      const result = analyseCoachSchema.safeParse({
        ...validData,
        currentAngles: { knee: -10 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject angle values above 360', () => {
      const result = analyseCoachSchema.safeParse({
        ...validData,
        currentAngles: { knee: 361 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative elapsedSeconds', () => {
      const result = analyseCoachSchema.safeParse({ ...validData, elapsedSeconds: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject elapsedSeconds above 7200', () => {
      const result = analyseCoachSchema.safeParse({ ...validData, elapsedSeconds: 7201 });
      expect(result.success).toBe(false);
    });
  });

  describe('coachResponseSchema', () => {
    const validData = {
      overallScore: 85,
      overallFeedback: 'Great alignment!',
      primaryCorrection: 'Bend your front knee a bit more.',
      bodyParts: [
        { part: 'left knee', status: 'correct' as const, feedback: 'Good angle' },
      ],
      coachEmotion: 'encouraging' as const,
    };

    it('should accept valid response', () => {
      const result = coachResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default breathingCue', () => {
      const result = coachResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.breathingCue).toBe('Breathe deeply and steadily');
      }
    });

    it('should default encouragement', () => {
      const result = coachResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.encouragement).toBe('Keep going, you are doing great!');
      }
    });

    it('should reject overallScore below 0', () => {
      const result = coachResponseSchema.safeParse({ ...validData, overallScore: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject overallScore above 100', () => {
      const result = coachResponseSchema.safeParse({ ...validData, overallScore: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject empty bodyParts', () => {
      const result = coachResponseSchema.safeParse({ ...validData, bodyParts: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 8 bodyParts', () => {
      const bodyParts = Array.from({ length: 9 }, (_, i) => ({
        part: `part-${i}`,
        status: 'correct' as const,
        feedback: 'OK',
      }));
      const result = coachResponseSchema.safeParse({ ...validData, bodyParts });
      expect(result.success).toBe(false);
    });

    it('should accept all valid coachEmotion values', () => {
      const emotions = [
        'proud', 'encouraging', 'calm', 'strict',
        'concerned', 'celebratory', 'playful', 'intense',
      ] as const;
      for (const coachEmotion of emotions) {
        const result = coachResponseSchema.safeParse({ ...validData, coachEmotion });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid coachEmotion', () => {
      const result = coachResponseSchema.safeParse({ ...validData, coachEmotion: 'angry' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid body part status values', () => {
      const statuses = ['correct', 'needs_adjustment', 'incorrect'] as const;
      for (const status of statuses) {
        const bodyParts = [{ part: 'knee', status, feedback: 'Note' }];
        const result = coachResponseSchema.safeParse({ ...validData, bodyParts });
        expect(result.success).toBe(true);
      }
    });
  });
});
