/**
 * Vision Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  startVisionTestSchema,
  completeVisionTestSchema,
  startEyeExerciseSchema,
  completeEyeExerciseSchema,
  visionHistorySchema,
} from '../../../src/validators/vision.validator.js';

describe('Vision Validators', () => {
  describe('startVisionTestSchema', () => {
    it('should accept valid input with required fields', () => {
      const result = startVisionTestSchema.safeParse({ testType: 'color_vision_quick' });
      expect(result.success).toBe(true);
    });

    it('should default difficulty to standard', () => {
      const result = startVisionTestSchema.safeParse({ testType: 'color_vision_quick' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.difficulty).toBe('standard');
      }
    });

    it('should accept all valid testType values', () => {
      const types = ['color_vision_quick', 'color_vision_advanced', 'eye_exercise'] as const;
      for (const testType of types) {
        const result = startVisionTestSchema.safeParse({ testType });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid testType', () => {
      const result = startVisionTestSchema.safeParse({ testType: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept moodBefore in range 1-10', () => {
      const result = startVisionTestSchema.safeParse({
        testType: 'color_vision_quick',
        moodBefore: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should reject moodBefore below 1', () => {
      const result = startVisionTestSchema.safeParse({
        testType: 'color_vision_quick',
        moodBefore: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject moodBefore above 10', () => {
      const result = startVisionTestSchema.safeParse({
        testType: 'color_vision_quick',
        moodBefore: 11,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('completeVisionTestSchema', () => {
    const validResponse = {
      plateIndex: 0,
      plateType: 'control' as const,
      correctAnswer: '12',
      isCorrect: true,
    };

    const validData = {
      responses: [validResponse],
      totalDurationSeconds: 120,
    };

    it('should accept valid input', () => {
      const result = completeVisionTestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty responses array', () => {
      const result = completeVisionTestSchema.safeParse({
        responses: [],
        totalDurationSeconds: 10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 30 responses', () => {
      const responses = Array.from({ length: 31 }, (_, i) => ({
        ...validResponse,
        plateIndex: i,
      }));
      const result = completeVisionTestSchema.safeParse({
        responses,
        totalDurationSeconds: 10,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional moodAfter', () => {
      const result = completeVisionTestSchema.safeParse({
        ...validData,
        moodAfter: 7,
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional notes', () => {
      const result = completeVisionTestSchema.safeParse({
        ...validData,
        notes: 'Felt dizzy during test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject notes exceeding 1000 characters', () => {
      const result = completeVisionTestSchema.safeParse({
        ...validData,
        notes: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it('should default timedOut to false in response', () => {
      const result = completeVisionTestSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.responses[0].timedOut).toBe(false);
      }
    });
  });

  describe('startEyeExerciseSchema', () => {
    it('should accept valid input', () => {
      const result = startEyeExerciseSchema.safeParse({
        exerciseType: 'trataka',
        durationSeconds: 300,
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid exercise types', () => {
      const types = ['trataka', 'eye_circles', 'focus_shift', 'palming'] as const;
      for (const exerciseType of types) {
        const result = startEyeExerciseSchema.safeParse({
          exerciseType,
          durationSeconds: 60,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject durationSeconds below 10', () => {
      const result = startEyeExerciseSchema.safeParse({
        exerciseType: 'trataka',
        durationSeconds: 5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject durationSeconds above 3600', () => {
      const result = startEyeExerciseSchema.safeParse({
        exerciseType: 'trataka',
        durationSeconds: 3601,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('completeEyeExerciseSchema', () => {
    it('should accept empty object', () => {
      const result = completeEyeExerciseSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept moodAfter', () => {
      const result = completeEyeExerciseSchema.safeParse({ moodAfter: 8 });
      expect(result.success).toBe(true);
    });

    it('should accept notes', () => {
      const result = completeEyeExerciseSchema.safeParse({ notes: 'Great session' });
      expect(result.success).toBe(true);
    });
  });

  describe('visionHistorySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = visionHistorySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should coerce string limit to number', () => {
      const result = visionHistorySchema.safeParse({ limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit exceeding 100', () => {
      const result = visionHistorySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
