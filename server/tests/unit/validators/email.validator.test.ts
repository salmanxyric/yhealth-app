/**
 * Email Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  emailCategorySchema,
  updatePreferenceSchema,
  emailAnalyticsQuerySchema,
  emailLogsQuerySchema,
  sendTestEmailSchema,
} from '../../../src/validators/email.validator.js';

describe('Email Validators', () => {
  describe('emailCategorySchema', () => {
    it('should accept all valid categories', () => {
      const categories = ['transactional', 'engagement', 'digest', 'coaching', 'marketing'] as const;
      for (const cat of categories) {
        const result = emailCategorySchema.safeParse(cat);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid category', () => {
      const result = emailCategorySchema.safeParse('newsletter');
      expect(result.success).toBe(false);
    });
  });

  describe('updatePreferenceSchema', () => {
    it('should accept enabled true', () => {
      const result = updatePreferenceSchema.safeParse({ enabled: true });
      expect(result.success).toBe(true);
    });

    it('should accept enabled false', () => {
      const result = updatePreferenceSchema.safeParse({ enabled: false });
      expect(result.success).toBe(true);
    });

    it('should reject missing enabled', () => {
      const result = updatePreferenceSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-boolean enabled', () => {
      const result = updatePreferenceSchema.safeParse({ enabled: 'yes' });
      expect(result.success).toBe(false);
    });

    it('should accept optional frequency', () => {
      const result = updatePreferenceSchema.safeParse({ enabled: true, frequency: 'daily' });
      expect(result.success).toBe(true);
    });

    it('should accept all valid frequency values', () => {
      const frequencies = ['immediate', 'daily', 'weekly', 'never'] as const;
      for (const frequency of frequencies) {
        const result = updatePreferenceSchema.safeParse({ enabled: true, frequency });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid frequency', () => {
      const result = updatePreferenceSchema.safeParse({ enabled: true, frequency: 'monthly' });
      expect(result.success).toBe(false);
    });
  });

  describe('emailAnalyticsQuerySchema', () => {
    it('should accept empty query', () => {
      const result = emailAnalyticsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid userId UUID', () => {
      const result = emailAnalyticsQuerySchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid userId', () => {
      const result = emailAnalyticsQuerySchema.safeParse({ userId: 'not-uuid' });
      expect(result.success).toBe(false);
    });

    it('should accept valid date range', () => {
      const result = emailAnalyticsQuerySchema.safeParse({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('emailLogsQuerySchema', () => {
    it('should apply defaults', () => {
      const result = emailLogsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers', () => {
      const result = emailLogsQuerySchema.safeParse({ page: '5', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit exceeding 100', () => {
      const result = emailLogsQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept valid status values', () => {
      const statuses = ['queued', 'sending', 'sent', 'delivered', 'bounced', 'failed'] as const;
      for (const status of statuses) {
        const result = emailLogsQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('sendTestEmailSchema', () => {
    const validData = {
      template: 'welcome',
      recipient: 'test@example.com',
    };

    it('should accept valid input', () => {
      const result = sendTestEmailSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing template', () => {
      const result = sendTestEmailSchema.safeParse({ recipient: 'test@example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject empty template', () => {
      const result = sendTestEmailSchema.safeParse({ ...validData, template: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid recipient email', () => {
      const result = sendTestEmailSchema.safeParse({ ...validData, recipient: 'not-email' });
      expect(result.success).toBe(false);
    });

    it('should accept optional data', () => {
      const result = sendTestEmailSchema.safeParse({ ...validData, data: { name: 'John' } });
      expect(result.success).toBe(true);
    });
  });
});
