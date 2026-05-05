/**
 * Stress Validator Unit Tests
 */

import {
  createStressLogSchema,
  getLogsQuerySchema,
  getSummaryQuerySchema,
} from '../../../src/validators/stress.validator.js';

describe('Stress Validators', () => {
  describe('createStressLogSchema', () => {
    const validData = {
      stress_rating: 7,
      client_request_id: 'req-abc-123',
    };

    it('should accept valid stress log data', () => {
      const result = createStressLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = createStressLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.triggers).toEqual([]);
        expect(result.data.check_in_type).toBe('on_demand');
      }
    });

    it('should reject stress_rating below 1', () => {
      const result = createStressLogSchema.safeParse({ ...validData, stress_rating: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject stress_rating above 10', () => {
      const result = createStressLogSchema.safeParse({ ...validData, stress_rating: 11 });
      expect(result.success).toBe(false);
    });

    it('should accept stress_rating at boundaries (1 and 10)', () => {
      for (const stress_rating of [1, 10]) {
        const result = createStressLogSchema.safeParse({ ...validData, stress_rating });
        expect(result.success).toBe(true);
      }
    });

    it('should reject non-integer stress_rating', () => {
      const result = createStressLogSchema.safeParse({ ...validData, stress_rating: 5.5 });
      expect(result.success).toBe(false);
    });

    it('should accept all valid trigger values', () => {
      const triggers = [
        'Work', 'Relationships', 'Finances', 'Health', 'Family',
        'Uncertainty', 'Time pressure', 'Conflict', 'Other',
      ];
      const result = createStressLogSchema.safeParse({ ...validData, triggers });
      expect(result.success).toBe(true);
    });

    it('should reject invalid trigger value', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        triggers: ['InvalidTrigger'],
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional other_trigger', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        triggers: ['Other'],
        other_trigger: 'Moving to a new city',
      });
      expect(result.success).toBe(true);
    });

    it('should reject other_trigger over 100 characters', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        other_trigger: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional note', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        note: 'Had a tough day at work',
      });
      expect(result.success).toBe(true);
    });

    it('should reject note over 500 characters', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        note: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept daily check_in_type', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        check_in_type: 'daily',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid check_in_type', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        check_in_type: 'weekly',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty client_request_id', () => {
      const result = createStressLogSchema.safeParse({
        stress_rating: 5,
        client_request_id: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject client_request_id over 255 characters', () => {
      const result = createStressLogSchema.safeParse({
        stress_rating: 5,
        client_request_id: 'A'.repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing client_request_id', () => {
      const result = createStressLogSchema.safeParse({ stress_rating: 5 });
      expect(result.success).toBe(false);
    });

    it('should accept valid ISO datetime for logged_at', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        logged_at: '2025-03-15T14:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid logged_at format', () => {
      const result = createStressLogSchema.safeParse({
        ...validData,
        logged_at: '2025-03-15',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getLogsQuerySchema', () => {
    it('should accept empty query', () => {
      const result = getLogsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid date range', () => {
      const result = getLogsQuerySchema.safeParse({
        from: '2025-01-01',
        to: '2025-03-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid from date format', () => {
      const result = getLogsQuerySchema.safeParse({ from: '01-01-2025' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid to date format', () => {
      const result = getLogsQuerySchema.safeParse({ to: '2025/03/31' });
      expect(result.success).toBe(false);
    });
  });

  describe('getSummaryQuerySchema', () => {
    it('should accept valid from and to dates', () => {
      const result = getSummaryQuerySchema.safeParse({
        from: '2025-01-01',
        to: '2025-03-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing from date', () => {
      const result = getSummaryQuerySchema.safeParse({ to: '2025-03-31' });
      expect(result.success).toBe(false);
    });

    it('should reject missing to date', () => {
      const result = getSummaryQuerySchema.safeParse({ from: '2025-01-01' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const result = getSummaryQuerySchema.safeParse({
        from: 'January 1, 2025',
        to: '2025-03-31',
      });
      expect(result.success).toBe(false);
    });
  });
});
