/**
 * Subscription Validator Unit Tests
 */

import {
  createPlanSchema,
  updatePlanSchema,
  checkoutSessionSchema,
  portalSessionSchema,
  verifySessionSchema,
  planIdParamSchema,
  adminListPlansQuerySchema,
  adminListSubscriptionsQuerySchema,
} from '../../../src/validators/subscription.validator.js';

describe('Subscription Validators', () => {
  describe('createPlanSchema', () => {
    const validData = {
      name: 'Premium Plan',
      slug: 'premium-plan',
      amount_cents: 1999,
      currency: 'USD',
      interval: 'month' as const,
    };

    it('should accept valid plan data', () => {
      const result = createPlanSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should apply defaults for optional fields', () => {
      const result = createPlanSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.features).toEqual([]);
        expect(result.data.is_active).toBe(true);
        expect(result.data.sort_order).toBe(0);
        expect(result.data.currency).toBe('USD');
      }
    });

    it('should transform currency to uppercase', () => {
      const result = createPlanSchema.safeParse({ ...validData, currency: 'eur' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('EUR');
      }
    });

    it('should reject name shorter than 2 characters', () => {
      const result = createPlanSchema.safeParse({ ...validData, name: 'A' });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 200 characters', () => {
      const result = createPlanSchema.safeParse({ ...validData, name: 'A'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject slug with uppercase letters', () => {
      const result = createPlanSchema.safeParse({ ...validData, slug: 'Premium-Plan' });
      expect(result.success).toBe(false);
    });

    it('should reject slug with spaces', () => {
      const result = createPlanSchema.safeParse({ ...validData, slug: 'premium plan' });
      expect(result.success).toBe(false);
    });

    it('should reject empty slug', () => {
      const result = createPlanSchema.safeParse({ ...validData, slug: '' });
      expect(result.success).toBe(false);
    });

    it('should reject negative amount_cents', () => {
      const result = createPlanSchema.safeParse({ ...validData, amount_cents: -100 });
      expect(result.success).toBe(false);
    });

    it('should accept zero amount_cents (free plan)', () => {
      const result = createPlanSchema.safeParse({ ...validData, amount_cents: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject amount_cents exceeding maximum', () => {
      const result = createPlanSchema.safeParse({ ...validData, amount_cents: 999_999_99 + 1 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer amount_cents', () => {
      const result = createPlanSchema.safeParse({ ...validData, amount_cents: 19.99 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid interval', () => {
      const result = createPlanSchema.safeParse({ ...validData, interval: 'week' });
      expect(result.success).toBe(false);
    });

    it('should accept year interval', () => {
      const result = createPlanSchema.safeParse({ ...validData, interval: 'year' });
      expect(result.success).toBe(true);
    });

    it('should reject currency not exactly 3 characters', () => {
      const result = createPlanSchema.safeParse({ ...validData, currency: 'US' });
      expect(result.success).toBe(false);
    });

    it('should reject features with more than 20 entries', () => {
      const features = Array.from({ length: 21 }, (_, i) => `Feature ${i}`);
      const result = createPlanSchema.safeParse({ ...validData, features });
      expect(result.success).toBe(false);
    });

    it('should reject feature text longer than 200 characters', () => {
      const result = createPlanSchema.safeParse({ ...validData, features: ['A'.repeat(201)] });
      expect(result.success).toBe(false);
    });

    it('should accept nullable description', () => {
      const result = createPlanSchema.safeParse({ ...validData, description: null });
      expect(result.success).toBe(true);
    });
  });

  describe('updatePlanSchema', () => {
    it('should accept partial update with one field', () => {
      const result = updatePlanSchema.safeParse({ name: 'Updated Plan' });
      expect(result.success).toBe(true);
    });

    it('should reject empty object (no fields)', () => {
      const result = updatePlanSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept multiple optional fields', () => {
      const result = updatePlanSchema.safeParse({
        name: 'Updated',
        amount_cents: 2999,
        is_active: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('checkoutSessionSchema', () => {
    const validData = {
      planId: '550e8400-e29b-41d4-a716-446655440000',
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    };

    it('should accept valid checkout data', () => {
      const result = checkoutSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for planId', () => {
      const result = checkoutSessionSchema.safeParse({ ...validData, planId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL for successUrl', () => {
      const result = checkoutSessionSchema.safeParse({ ...validData, successUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should reject missing cancelUrl', () => {
      const { cancelUrl: _cancelUrl, ...rest } = validData;
      const result = checkoutSessionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('portalSessionSchema', () => {
    it('should accept valid return URL', () => {
      const result = portalSessionSchema.safeParse({
        returnUrl: 'http://localhost:3000/account',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing returnUrl', () => {
      const result = portalSessionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('verifySessionSchema', () => {
    it('should accept valid session ID', () => {
      const result = verifySessionSchema.safeParse({ session_id: 'cs_test_abc123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty session_id', () => {
      const result = verifySessionSchema.safeParse({ session_id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject session_id over 500 characters', () => {
      const result = verifySessionSchema.safeParse({ session_id: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('planIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const result = planIdParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID string', () => {
      const result = planIdParamSchema.safeParse({ id: '123' });
      expect(result.success).toBe(false);
    });
  });

  describe('adminListPlansQuerySchema', () => {
    it('should apply defaults when no params provided', () => {
      const result = adminListPlansQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers to integers', () => {
      const result = adminListPlansQuerySchema.safeParse({ page: '3', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should transform is_active string to boolean', () => {
      const result = adminListPlansQuerySchema.safeParse({ is_active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should reject limit over 100', () => {
      const result = adminListPlansQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe('adminListSubscriptionsQuerySchema', () => {
    it('should apply defaults when no params provided', () => {
      const result = adminListSubscriptionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should accept optional status filter', () => {
      const result = adminListSubscriptionsQuerySchema.safeParse({ status: 'active' });
      expect(result.success).toBe(true);
    });

    it('should accept optional planId and userId filters', () => {
      const result = adminListSubscriptionsQuerySchema.safeParse({
        planId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for planId', () => {
      const result = adminListSubscriptionsQuerySchema.safeParse({ planId: 'bad' });
      expect(result.success).toBe(false);
    });
  });
});
