/**
 * Exercise Validator Unit Tests
 */

import {
  listExercisesQuerySchema,
  searchExercisesQuerySchema,
  exerciseIdParamsSchema,
  exerciseSlugParamsSchema,
} from '../../../src/validators/exercise.validator.js';

describe('Exercise Validators', () => {
  describe('listExercisesQuerySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = listExercisesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort).toBe('name');
        expect(result.data.order).toBe('asc');
      }
    });

    it('should accept all valid category values', () => {
      for (const category of ['strength', 'cardio', 'flexibility', 'balance', 'plyometric']) {
        const result = listExercisesQuerySchema.safeParse({ category });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid category', () => {
      const result = listExercisesQuerySchema.safeParse({ category: 'yoga' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid difficulty values', () => {
      for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
        const result = listExercisesQuerySchema.safeParse({ difficulty });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid difficulty', () => {
      const result = listExercisesQuerySchema.safeParse({ difficulty: 'expert' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid sort fields', () => {
      for (const sort of ['name', 'category', 'difficulty', 'created_at']) {
        const result = listExercisesQuerySchema.safeParse({ sort });
        expect(result.success).toBe(true);
      }
    });

    it('should accept desc order', () => {
      const result = listExercisesQuerySchema.safeParse({ order: 'desc' });
      expect(result.success).toBe(true);
    });

    it('should accept muscle filter', () => {
      const result = listExercisesQuerySchema.safeParse({ muscle: 'biceps' });
      expect(result.success).toBe(true);
    });

    it('should reject muscle over 50 characters', () => {
      const result = listExercisesQuerySchema.safeParse({ muscle: 'A'.repeat(51) });
      expect(result.success).toBe(false);
    });

    it('should accept equipment filter', () => {
      const result = listExercisesQuerySchema.safeParse({ equipment: 'dumbbell' });
      expect(result.success).toBe(true);
    });

    it('should accept valid source values', () => {
      for (const source of ['manual', 'exercisedb', 'rapidapi']) {
        const result = listExercisesQuerySchema.safeParse({ source });
        expect(result.success).toBe(true);
      }
    });

    it('should reject page of 0', () => {
      const result = listExercisesQuerySchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = listExercisesQuerySchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });

    it('should accept cursor-based pagination', () => {
      const result = listExercisesQuerySchema.safeParse({ cursor: 'eyJpZCI6MTIzfQ==' });
      expect(result.success).toBe(true);
    });
  });

  describe('searchExercisesQuerySchema', () => {
    it('should accept valid search query', () => {
      const result = searchExercisesQuerySchema.safeParse({ q: 'bench press' });
      expect(result.success).toBe(true);
    });

    it('should reject empty search query', () => {
      const result = searchExercisesQuerySchema.safeParse({ q: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing q parameter', () => {
      const result = searchExercisesQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject q over 200 characters', () => {
      const result = searchExercisesQuerySchema.safeParse({ q: 'A'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should accept optional filters alongside search', () => {
      const result = searchExercisesQuerySchema.safeParse({
        q: 'press',
        category: 'strength',
        difficulty: 'intermediate',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('exerciseIdParamsSchema', () => {
    it('should accept valid UUID', () => {
      const result = exerciseIdParamsSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID string', () => {
      const result = exerciseIdParamsSchema.safeParse({ id: 'abc123' });
      expect(result.success).toBe(false);
    });

    it('should reject missing id', () => {
      const result = exerciseIdParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('exerciseSlugParamsSchema', () => {
    it('should accept valid slug', () => {
      const result = exerciseSlugParamsSchema.safeParse({ slug: 'bench-press' });
      expect(result.success).toBe(true);
    });

    it('should reject empty slug', () => {
      const result = exerciseSlugParamsSchema.safeParse({ slug: '' });
      expect(result.success).toBe(false);
    });

    it('should reject slug over 300 characters', () => {
      const result = exerciseSlugParamsSchema.safeParse({ slug: 'a'.repeat(301) });
      expect(result.success).toBe(false);
    });
  });
});
