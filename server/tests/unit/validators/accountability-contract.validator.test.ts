/**
 * Accountability Contract Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createContractSchema,
  updateContractSchema,
  signContractSchema,
  disputeViolationSchema,
  cancelContractSchema,
  contractIdParamSchema,
  violationIdParamSchema,
  listContractsQuerySchema,
} from '../../../src/validators/accountability-contract.validator.js';

describe('Accountability Contract Validators', () => {
  describe('createContractSchema', () => {
    const validData = {
      title: 'Gym 3x per week',
      condition_type: 'missed_activity' as const,
      penalty_type: 'xp_loss' as const,
      start_date: '2024-01-01',
      end_date: '2024-03-31',
    };

    it('should accept valid input', () => {
      const result = createContractSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default condition_window_days to 1', () => {
      const result = createContractSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.condition_window_days).toBe(1);
      }
    });

    it('should default penalty_currency to PKR', () => {
      const result = createContractSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.penalty_currency).toBe('PKR');
      }
    });

    it('should default auto_renew to false', () => {
      const result = createContractSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.auto_renew).toBe(false);
      }
    });

    it('should default verification_method to auto', () => {
      const result = createContractSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.verification_method).toBe('auto');
      }
    });

    it('should default confidence_threshold to 0.8', () => {
      const result = createContractSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confidence_threshold).toBe(0.8);
      }
    });

    it('should default social_enforcer_ids to empty array', () => {
      const result = createContractSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.social_enforcer_ids).toEqual([]);
      }
    });

    it('should reject title shorter than 3 characters', () => {
      const result = createContractSchema.safeParse({ ...validData, title: 'AB' });
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 200 characters', () => {
      const result = createContractSchema.safeParse({ ...validData, title: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject missing condition_type', () => {
      const { condition_type: _condition_type, ...rest } = validData;
      const result = createContractSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should accept all valid condition_types', () => {
      const types = [
        'missed_activity', 'calorie_exceeded', 'streak_break',
        'missed_goal', 'sleep_deficit', 'custom',
      ] as const;
      for (const condition_type of types) {
        const result = createContractSchema.safeParse({ ...validData, condition_type });
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid penalty_types', () => {
      const types = [
        'donation', 'xp_loss', 'social_alert', 'streak_freeze_loss', 'custom',
      ] as const;
      for (const penalty_type of types) {
        const result = createContractSchema.safeParse({ ...validData, penalty_type });
        expect(result.success).toBe(true);
      }
    });

    it('should reject end_date before start_date', () => {
      const result = createContractSchema.safeParse({
        ...validData,
        start_date: '2024-06-01',
        end_date: '2024-01-01',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const endDateError = result.error.issues.find((i) => i.path.includes('end_date'));
        expect(endDateError).toBeDefined();
      }
    });

    it('should reject invalid start_date', () => {
      const result = createContractSchema.safeParse({ ...validData, start_date: 'not-a-date' });
      expect(result.success).toBe(false);
    });

    it('should reject condition_window_days below 1', () => {
      const result = createContractSchema.safeParse({ ...validData, condition_window_days: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject condition_window_days above 30', () => {
      const result = createContractSchema.safeParse({ ...validData, condition_window_days: 31 });
      expect(result.success).toBe(false);
    });

    it('should reject confidence_threshold below 0.5', () => {
      const result = createContractSchema.safeParse({ ...validData, confidence_threshold: 0.3 });
      expect(result.success).toBe(false);
    });

    it('should reject confidence_threshold above 1.0', () => {
      const result = createContractSchema.safeParse({ ...validData, confidence_threshold: 1.1 });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 social_enforcer_ids', () => {
      const result = createContractSchema.safeParse({
        ...validData,
        social_enforcer_ids: Array.from({ length: 6 }, (_, i) =>
          `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
        ),
      });
      expect(result.success).toBe(false);
    });

    it('should reject grace_period_hours above 48', () => {
      const result = createContractSchema.safeParse({ ...validData, grace_period_hours: 49 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateContractSchema', () => {
    it('should accept empty object', () => {
      const result = updateContractSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateContractSchema.safeParse({
        title: 'Updated Contract',
        auto_renew: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject title shorter than 3 characters', () => {
      const result = updateContractSchema.safeParse({ title: 'AB' });
      expect(result.success).toBe(false);
    });
  });

  describe('signContractSchema', () => {
    it('should accept confirm true', () => {
      const result = signContractSchema.safeParse({ confirm: true });
      expect(result.success).toBe(true);
    });

    it('should reject confirm false', () => {
      const result = signContractSchema.safeParse({ confirm: false });
      expect(result.success).toBe(false);
    });

    it('should reject missing confirm', () => {
      const result = signContractSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('disputeViolationSchema', () => {
    it('should accept valid reason', () => {
      const result = disputeViolationSchema.safeParse({
        reason: 'I was sick and could not work out that day.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject reason shorter than 10 characters', () => {
      const result = disputeViolationSchema.safeParse({ reason: 'Short' });
      expect(result.success).toBe(false);
    });

    it('should reject reason exceeding 1000 characters', () => {
      const result = disputeViolationSchema.safeParse({ reason: 'a'.repeat(1001) });
      expect(result.success).toBe(false);
    });

    it('should reject missing reason', () => {
      const result = disputeViolationSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('cancelContractSchema', () => {
    it('should accept empty object', () => {
      const result = cancelContractSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept optional reason', () => {
      const result = cancelContractSchema.safeParse({ reason: 'No longer relevant' });
      expect(result.success).toBe(true);
    });

    it('should reject reason exceeding 500 characters', () => {
      const result = cancelContractSchema.safeParse({ reason: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('contractIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const result = contractIdParamSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = contractIdParamSchema.safeParse({ id: 'not-uuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('violationIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const result = violationIdParamSchema.safeParse({
        vid: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = violationIdParamSchema.safeParse({ vid: 'bad' });
      expect(result.success).toBe(false);
    });
  });

  describe('listContractsQuerySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = listContractsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept all valid status values', () => {
      const statuses = [
        'draft', 'active', 'at_risk', 'violated',
        'completed', 'cancelled', 'paused',
      ] as const;
      for (const status of statuses) {
        const result = listContractsQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = listContractsQuerySchema.safeParse({ status: 'expired' });
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding 50', () => {
      const result = listContractsQuerySchema.safeParse({ limit: 51 });
      expect(result.success).toBe(false);
    });
  });
});
