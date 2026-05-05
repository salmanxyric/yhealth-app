/**
 * Streak Validator Unit Tests
 */

import {
  calendarParamsSchema,
  leaderboardQuerySchema,
  freezeApplySchema,
  compareParamsSchema,
  historyQuerySchema,
} from '../../../src/validators/streak.validator.js';

describe('Streak Validators', () => {
  describe('calendarParamsSchema', () => {
    it('should accept valid YYYY-MM format', () => {
      const result = calendarParamsSchema.safeParse({ month: '2025-03' });
      expect(result.success).toBe(true);
    });

    it('should reject YYYY-MM-DD format', () => {
      const result = calendarParamsSchema.safeParse({ month: '2025-03-15' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid format', () => {
      const result = calendarParamsSchema.safeParse({ month: 'March 2025' });
      expect(result.success).toBe(false);
    });

    it('should reject missing month', () => {
      const result = calendarParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject year-only format', () => {
      const result = calendarParamsSchema.safeParse({ month: '2025' });
      expect(result.success).toBe(false);
    });
  });

  describe('leaderboardQuerySchema', () => {
    it('should apply defaults when no params provided', () => {
      const result = leaderboardQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept all valid segment values', () => {
      for (const segment of ['global', 'friends', 'country']) {
        const result = leaderboardQuerySchema.safeParse({ segment });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid segment', () => {
      const result = leaderboardQuerySchema.safeParse({ segment: 'regional' });
      expect(result.success).toBe(false);
    });

    it('should coerce string limit to number', () => {
      const result = leaderboardQuerySchema.safeParse({ limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit below 1', () => {
      const result = leaderboardQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit above 100', () => {
      const result = leaderboardQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = leaderboardQuerySchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('freezeApplySchema', () => {
    it('should accept empty object (date is optional)', () => {
      const result = freezeApplySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid YYYY-MM-DD date', () => {
      const result = freezeApplySchema.safeParse({ date: '2025-03-15' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = freezeApplySchema.safeParse({ date: '15/03/2025' });
      expect(result.success).toBe(false);
    });

    it('should reject YYYY-MM format', () => {
      const result = freezeApplySchema.safeParse({ date: '2025-03' });
      expect(result.success).toBe(false);
    });
  });

  describe('compareParamsSchema', () => {
    it('should accept valid UUID', () => {
      const result = compareParamsSchema.safeParse({
        friendId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID string', () => {
      const result = compareParamsSchema.safeParse({ friendId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should reject missing friendId', () => {
      const result = compareParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('historyQuerySchema', () => {
    it('should apply defaults when no params provided', () => {
      const result = historyQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept optional activityType', () => {
      const result = historyQuerySchema.safeParse({ activityType: 'workout' });
      expect(result.success).toBe(true);
    });

    it('should reject limit below 1', () => {
      const result = historyQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit above 100', () => {
      const result = historyQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should coerce string values to numbers', () => {
      const result = historyQuerySchema.safeParse({ limit: '10', offset: '5' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(5);
      }
    });
  });
});
