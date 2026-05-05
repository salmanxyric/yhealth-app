/**
 * Yoga Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  listPosesSchema,
  getSessionsSchema,
  generateSessionSchema,
  startSessionSchema,
  updateSessionLogSchema,
  completeSessionSchema,
  startMeditationSchema,
  historySchema,
  generateVoiceScriptSchema,
} from '../../../src/validators/yoga.validator.js';

describe('Yoga Validators', () => {
  describe('listPosesSchema', () => {
    it('should accept empty query with defaults', () => {
      const result = listPosesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept valid category', () => {
      const categories = [
        'standing', 'seated', 'supine', 'prone', 'inversion',
        'balance', 'twist', 'backbend', 'forward_fold', 'hip_opener', 'restorative',
      ] as const;
      for (const category of categories) {
        const result = listPosesSchema.safeParse({ category });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid category', () => {
      const result = listPosesSchema.safeParse({ category: 'flying' });
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding 100', () => {
      const result = listPosesSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept isRecovery as string enum', () => {
      const result = listPosesSchema.safeParse({ isRecovery: 'true' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid isRecovery value', () => {
      const result = listPosesSchema.safeParse({ isRecovery: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  describe('getSessionsSchema', () => {
    it('should accept empty query with defaults', () => {
      const result = getSessionsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should reject limit exceeding 50', () => {
      const result = getSessionsSchema.safeParse({ limit: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('generateSessionSchema', () => {
    const validData = {
      sessionType: 'morning_flow' as const,
      goal: 'energy' as const,
      durationMinutes: 30,
    };

    it('should accept valid input', () => {
      const result = generateSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default difficulty to beginner', () => {
      const result = generateSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.difficulty).toBe('beginner');
      }
    });

    it('should default includeBreathwork to true', () => {
      const result = generateSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeBreathwork).toBe(true);
      }
    });

    it('should reject durationMinutes below 5', () => {
      const result = generateSessionSchema.safeParse({ ...validData, durationMinutes: 4 });
      expect(result.success).toBe(false);
    });

    it('should reject durationMinutes above 90', () => {
      const result = generateSessionSchema.safeParse({ ...validData, durationMinutes: 91 });
      expect(result.success).toBe(false);
    });

    it('should accept mood in range 1-10', () => {
      const result = generateSessionSchema.safeParse({ ...validData, mood: 7 });
      expect(result.success).toBe(true);
    });

    it('should reject mood outside range', () => {
      const result = generateSessionSchema.safeParse({ ...validData, mood: 0 });
      expect(result.success).toBe(false);
    });

    it('should accept focusMuscleGroups up to 5', () => {
      const result = generateSessionSchema.safeParse({
        ...validData,
        focusMuscleGroups: ['hamstrings', 'quads', 'glutes'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject more than 5 focusMuscleGroups', () => {
      const result = generateSessionSchema.safeParse({
        ...validData,
        focusMuscleGroups: ['a', 'b', 'c', 'd', 'e', 'f'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing required sessionType', () => {
      const result = generateSessionSchema.safeParse({ goal: 'energy', durationMinutes: 30 });
      expect(result.success).toBe(false);
    });
  });

  describe('startSessionSchema', () => {
    const validData = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    };

    it('should accept valid sessionId', () => {
      const result = startSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sessionId', () => {
      const result = startSessionSchema.safeParse({ sessionId: 'not-uuid' });
      expect(result.success).toBe(false);
    });

    it('should accept optional moodBefore', () => {
      const result = startSessionSchema.safeParse({ ...validData, moodBefore: 6 });
      expect(result.success).toBe(true);
    });

    it('should accept optional preSessionHrv', () => {
      const result = startSessionSchema.safeParse({ ...validData, preSessionHrv: 55 });
      expect(result.success).toBe(true);
    });

    it('should reject preSessionHrv above 300', () => {
      const result = startSessionSchema.safeParse({ ...validData, preSessionHrv: 301 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSessionLogSchema', () => {
    it('should accept empty object', () => {
      const result = updateSessionLogSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = updateSessionLogSchema.safeParse({
        phasesCompleted: 3,
        actualDurationSeconds: 1800,
        voiceGuideUsed: true,
        musicPlayed: false,
        poseCorrectionUsed: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('completeSessionSchema', () => {
    it('should accept empty object', () => {
      const result = completeSessionSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = completeSessionSchema.safeParse({
        moodAfter: 9,
        difficultyRating: 3,
        effectivenessRating: 8,
        notes: 'Great session!',
        completionRate: 95.5,
        phasesCompleted: 4,
        actualDurationSeconds: 1200,
      });
      expect(result.success).toBe(true);
    });

    it('should reject difficultyRating above 5', () => {
      const result = completeSessionSchema.safeParse({ difficultyRating: 6 });
      expect(result.success).toBe(false);
    });

    it('should reject completionRate above 100', () => {
      const result = completeSessionSchema.safeParse({ completionRate: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe('startMeditationSchema', () => {
    const validData = {
      mode: 'silent_timer' as const,
      durationMinutes: 10,
    };

    it('should accept valid input', () => {
      const result = startMeditationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default intervalBellSeconds to 0', () => {
      const result = startMeditationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.intervalBellSeconds).toBe(0);
      }
    });

    it('should accept all valid modes', () => {
      const modes = ['silent_timer', 'nature_sounds', 'mantra'] as const;
      for (const mode of modes) {
        const result = startMeditationSchema.safeParse({ ...validData, mode });
        expect(result.success).toBe(true);
      }
    });

    it('should reject durationMinutes below 1', () => {
      const result = startMeditationSchema.safeParse({ ...validData, durationMinutes: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject durationMinutes above 120', () => {
      const result = startMeditationSchema.safeParse({ ...validData, durationMinutes: 121 });
      expect(result.success).toBe(false);
    });

    it('should accept valid ambientSound', () => {
      const sounds = ['rain', 'ocean', 'forest', 'fire', 'birds', 'silence'] as const;
      for (const ambientSound of sounds) {
        const result = startMeditationSchema.safeParse({ ...validData, ambientSound });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('historySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = historySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept valid date format', () => {
      const result = historySchema.safeParse({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = historySchema.safeParse({ startDate: '01/01/2024' });
      expect(result.success).toBe(false);
    });
  });

  describe('generateVoiceScriptSchema', () => {
    const validData = {
      phase: {
        phaseType: 'warmup' as const,
        name: 'Warm Up Phase',
        durationSeconds: 120,
        breathingPattern: 'natural' as const,
        poses: [],
      },
      sessionType: 'morning_flow' as const,
    };

    it('should accept valid input', () => {
      const result = generateVoiceScriptSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing phase', () => {
      const result = generateVoiceScriptSchema.safeParse({ sessionType: 'morning_flow' });
      expect(result.success).toBe(false);
    });

    it('should accept pose data within phase', () => {
      const result = generateVoiceScriptSchema.safeParse({
        ...validData,
        phase: {
          ...validData.phase,
          poses: [{
            poseSlug: 'mountain',
            holdSeconds: 30,
            side: 'both',
          }],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional userName', () => {
      const result = generateVoiceScriptSchema.safeParse({ ...validData, userName: 'Sarah' });
      expect(result.success).toBe(true);
    });

    it('should reject phase with empty name', () => {
      const result = generateVoiceScriptSchema.safeParse({
        ...validData,
        phase: { ...validData.phase, name: '' },
      });
      expect(result.success).toBe(false);
    });
  });
});
