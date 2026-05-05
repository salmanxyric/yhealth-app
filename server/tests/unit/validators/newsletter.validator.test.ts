/**
 * Newsletter Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  subscribeNewsletterSchema,
  bulkDeleteNewsletterSchema,
} from '../../../src/validators/newsletter.validator.js';

describe('Newsletter Validators', () => {
  describe('subscribeNewsletterSchema', () => {
    it('should accept valid email', () => {
      const result = subscribeNewsletterSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should default interests to empty array', () => {
      const result = subscribeNewsletterSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interests).toEqual([]);
      }
    });

    it('should default source to footer', () => {
      const result = subscribeNewsletterSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('footer');
      }
    });

    it('should accept valid interests', () => {
      const result = subscribeNewsletterSchema.safeParse({
        email: 'test@example.com',
        interests: ['fitness', 'nutrition', 'wellbeing'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid interest', () => {
      const result = subscribeNewsletterSchema.safeParse({
        email: 'test@example.com',
        interests: ['invalid'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const result = subscribeNewsletterSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = subscribeNewsletterSchema.safeParse({ email: 'not-email' });
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = subscribeNewsletterSchema.safeParse({ email: '' });
      expect(result.success).toBe(false);
    });

    it('should reject email exceeding 255 characters', () => {
      const result = subscribeNewsletterSchema.safeParse({
        email: 'a'.repeat(250) + '@x.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteNewsletterSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteNewsletterSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteNewsletterSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 ids', () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const result = bulkDeleteNewsletterSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID strings', () => {
      const result = bulkDeleteNewsletterSchema.safeParse({ ids: ['bad-id'] });
      expect(result.success).toBe(false);
    });
  });
});
