/**
 * Admin Exercise Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  adminListExercisesQuerySchema,
  createExerciseSchema,
  updateExerciseSchema,
  bulkDeleteExercisesSchema,
  bulkToggleActiveSchema,
  syncExercisesSchema,
  importExercisesSchema,
} from '../../../src/validators/admin-exercise.validator.js';

describe('Admin Exercise Validators', () => {
  describe('adminListExercisesQuerySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = adminListExercisesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort_by).toBe('created_at');
        expect(result.data.sort_order).toBe('desc');
      }
    });

    it('should accept valid category filter', () => {
      const categories = ['strength', 'cardio', 'flexibility', 'balance', 'plyometric'] as const;
      for (const category of categories) {
        const result = adminListExercisesQuerySchema.safeParse({ category });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid category', () => {
      const result = adminListExercisesQuerySchema.safeParse({ category: 'yoga' });
      expect(result.success).toBe(false);
    });

    it('should accept valid source filter', () => {
      const sources = ['manual', 'exercisedb', 'rapidapi', 'musclewiki'] as const;
      for (const source of sources) {
        const result = adminListExercisesQuerySchema.safeParse({ source });
        expect(result.success).toBe(true);
      }
    });

    it('should reject limit exceeding 100', () => {
      const result = adminListExercisesQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe('createExerciseSchema', () => {
    const validData = {
      name: 'Barbell Squat',
      category: 'strength' as const,
      difficulty_level: 'intermediate' as const,
    };

    it('should accept valid input with required fields', () => {
      const result = createExerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default arrays to empty', () => {
      const result = createExerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.secondary_muscle_groups).toEqual([]);
        expect(result.data.equipment_required).toEqual([]);
        expect(result.data.instructions).toEqual([]);
        expect(result.data.tips).toEqual([]);
        expect(result.data.common_mistakes).toEqual([]);
        expect(result.data.tags).toEqual([]);
        expect(result.data.target_muscles).toEqual([]);
      }
    });

    it('should default numeric fields', () => {
      const result = createExerciseSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.default_sets).toBe(3);
        expect(result.data.default_reps).toBe(10);
        expect(result.data.default_rest_seconds).toBe(60);
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should reject missing name', () => {
      const { name: _name, ...rest } = validData;
      const result = createExerciseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing category', () => {
      const { category: _category, ...rest } = validData;
      const result = createExerciseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing difficulty_level', () => {
      const { difficulty_level: _difficulty_level, ...rest } = validData;
      const result = createExerciseSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid slug format', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        slug: 'Bad Slug!',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid slug', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        slug: 'barbell-squat',
      });
      expect(result.success).toBe(true);
    });

    it('should reject default_sets above 100', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        default_sets: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should reject default_reps above 1000', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        default_reps: 1001,
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid URL fields', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        video_url: 'https://youtube.com/watch?v=123',
        thumbnail_url: 'https://example.com/thumb.jpg',
        animation_url: 'https://example.com/anim.gif',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL fields', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        video_url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 instructions', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        instructions: Array.from({ length: 51 }, () => 'Step'),
      });
      expect(result.success).toBe(false);
    });

    it('should reject met_value above 50', () => {
      const result = createExerciseSchema.safeParse({
        ...validData,
        met_value: 51,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateExerciseSchema', () => {
    it('should accept empty object (all fields optional via partial)', () => {
      const result = updateExerciseSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateExerciseSchema.safeParse({
        name: 'Updated Squat',
        default_sets: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('bulkDeleteExercisesSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteExercisesSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteExercisesSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 ids', () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const result = bulkDeleteExercisesSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkToggleActiveSchema', () => {
    it('should accept valid input', () => {
      const result = bulkToggleActiveSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
        is_active: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing is_active', () => {
      const result = bulkToggleActiveSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('syncExercisesSchema', () => {
    it('should accept valid source', () => {
      const result = syncExercisesSchema.safeParse({ source: 'exercisedb' });
      expect(result.success).toBe(true);
    });

    it('should default dryRun to false', () => {
      const result = syncExercisesSchema.safeParse({ source: 'musclewiki' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(false);
      }
    });

    it('should reject invalid source', () => {
      const result = syncExercisesSchema.safeParse({ source: 'custom' });
      expect(result.success).toBe(false);
    });

    it('should accept optional limit', () => {
      const result = syncExercisesSchema.safeParse({ source: 'exercisedb', limit: 100 });
      expect(result.success).toBe(true);
    });

    it('should reject limit exceeding 5000', () => {
      const result = syncExercisesSchema.safeParse({ source: 'exercisedb', limit: 5001 });
      expect(result.success).toBe(false);
    });
  });

  describe('importExercisesSchema', () => {
    const minExercise = {
      name: 'Push Up',
      category: 'strength' as const,
      difficulty_level: 'beginner' as const,
    };

    it('should accept valid import with one exercise', () => {
      const result = importExercisesSchema.safeParse({ exercises: [minExercise] });
      expect(result.success).toBe(true);
    });

    it('should reject empty exercises array', () => {
      const result = importExercisesSchema.safeParse({ exercises: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 2000 exercises', () => {
      const exercises = Array.from({ length: 2001 }, () => minExercise);
      const result = importExercisesSchema.safeParse({ exercises });
      expect(result.success).toBe(false);
    });
  });
});
