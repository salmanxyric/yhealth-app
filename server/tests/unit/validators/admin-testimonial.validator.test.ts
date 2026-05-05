/**
 * Admin Testimonial Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  adminListTestimonialsQuerySchema,
  createTestimonialSchema,
  updateTestimonialSchema,
  bulkDeleteTestimonialsSchema,
  bulkToggleActiveTestimonialsSchema,
} from '../../../src/validators/admin-testimonial.validator.js';

describe('Admin Testimonial Validators', () => {
  describe('adminListTestimonialsQuerySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = adminListTestimonialsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort_by).toBe('display_order');
        expect(result.data.sort_order).toBe('asc');
      }
    });

    it('should coerce string page to number', () => {
      const result = adminListTestimonialsQuerySchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it('should accept valid pillar filter', () => {
      const pillars = ['fitness', 'nutrition', 'wellbeing'] as const;
      for (const pillar of pillars) {
        const result = adminListTestimonialsQuerySchema.safeParse({ pillar });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid pillar', () => {
      const result = adminListTestimonialsQuerySchema.safeParse({ pillar: 'mental' });
      expect(result.success).toBe(false);
    });

    it('should accept rating filter 1-5', () => {
      const result = adminListTestimonialsQuerySchema.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
    });

    it('should reject rating outside 1-5', () => {
      const result = adminListTestimonialsQuerySchema.safeParse({ rating: 6 });
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding 100', () => {
      const result = adminListTestimonialsQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept is_active as string enum', () => {
      const result = adminListTestimonialsQuerySchema.safeParse({ is_active: 'true' });
      expect(result.success).toBe(true);
    });

    it('should accept all valid sort_by values', () => {
      const sorts = ['name', 'rating', 'pillar', 'display_order', 'created_at', 'updated_at'] as const;
      for (const sort_by of sorts) {
        const result = adminListTestimonialsQuerySchema.safeParse({ sort_by });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('createTestimonialSchema', () => {
    const validData = {
      name: 'Jane Smith',
      role: 'Yoga Instructor',
      rating: 5,
      content: 'This app changed my life completely!',
    };

    it('should accept valid input', () => {
      const result = createTestimonialSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default verified to false', () => {
      const result = createTestimonialSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.verified).toBe(false);
      }
    });

    it('should default is_active to true', () => {
      const result = createTestimonialSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should default is_featured to false', () => {
      const result = createTestimonialSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_featured).toBe(false);
      }
    });

    it('should default display_order to 0', () => {
      const result = createTestimonialSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_order).toBe(0);
      }
    });

    it('should reject missing name', () => {
      const { name: _name, ...rest } = validData;
      const result = createTestimonialSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing role', () => {
      const { role: _role, ...rest } = validData;
      const result = createTestimonialSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing rating', () => {
      const { rating: _rating, ...rest } = validData;
      const result = createTestimonialSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject rating below 1', () => {
      const result = createTestimonialSchema.safeParse({ ...validData, rating: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const result = createTestimonialSchema.safeParse({ ...validData, rating: 6 });
      expect(result.success).toBe(false);
    });

    it('should reject content shorter than 10 characters', () => {
      const result = createTestimonialSchema.safeParse({ ...validData, content: 'Short' });
      expect(result.success).toBe(false);
    });

    it('should reject content exceeding 2000 characters', () => {
      const result = createTestimonialSchema.safeParse({ ...validData, content: 'a'.repeat(2001) });
      expect(result.success).toBe(false);
    });

    it('should accept valid avatar_url', () => {
      const result = createTestimonialSchema.safeParse({
        ...validData,
        avatar_url: 'https://example.com/avatar.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid avatar_url', () => {
      const result = createTestimonialSchema.safeParse({
        ...validData,
        avatar_url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTestimonialSchema', () => {
    it('should accept empty object (all fields optional via partial)', () => {
      const result = updateTestimonialSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateTestimonialSchema.safeParse({ rating: 4, verified: true });
      expect(result.success).toBe(true);
    });
  });

  describe('bulkDeleteTestimonialsSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteTestimonialsSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteTestimonialsSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 ids', () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const result = bulkDeleteTestimonialsSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkToggleActiveTestimonialsSchema', () => {
    it('should accept valid input', () => {
      const result = bulkToggleActiveTestimonialsSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
        is_active: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing is_active', () => {
      const result = bulkToggleActiveTestimonialsSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty ids', () => {
      const result = bulkToggleActiveTestimonialsSchema.safeParse({
        ids: [],
        is_active: false,
      });
      expect(result.success).toBe(false);
    });
  });
});
