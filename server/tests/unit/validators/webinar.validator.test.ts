/**
 * Webinar Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createWebinarSchema,
  updateWebinarSchema,
  webinarRegistrationSchema,
  bulkDeleteWebinarsSchema,
  generateWebinarSchema,
} from '../../../src/validators/webinar.validator.js';

describe('Webinar Validators', () => {
  describe('createWebinarSchema', () => {
    const validData = {
      title: 'Yoga for Beginners',
    };

    it('should accept valid input with required title only', () => {
      const result = createWebinarSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default status to draft', () => {
      const result = createWebinarSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
      }
    });

    it('should default category to general', () => {
      const result = createWebinarSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('general');
      }
    });

    it('should default is_featured to false', () => {
      const result = createWebinarSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_featured).toBe(false);
      }
    });

    it('should reject missing title', () => {
      const result = createWebinarSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = createWebinarSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      const statuses = ['draft', 'published', 'cancelled', 'completed', 'archived'] as const;
      for (const status of statuses) {
        const result = createWebinarSchema.safeParse({ ...validData, status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = createWebinarSchema.safeParse({ ...validData, status: 'deleted' });
      expect(result.success).toBe(false);
    });

    it('should accept positive duration_minutes', () => {
      const result = createWebinarSchema.safeParse({ ...validData, duration_minutes: 60 });
      expect(result.success).toBe(true);
    });

    it('should reject non-positive duration_minutes', () => {
      const result = createWebinarSchema.safeParse({ ...validData, duration_minutes: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer duration_minutes', () => {
      const result = createWebinarSchema.safeParse({ ...validData, duration_minutes: 30.5 });
      expect(result.success).toBe(false);
    });

    it('should accept nullable optional fields', () => {
      const result = createWebinarSchema.safeParse({
        ...validData,
        description: null,
        host_name: null,
        meeting_url: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateWebinarSchema', () => {
    it('should accept empty object', () => {
      const result = updateWebinarSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateWebinarSchema.safeParse({
        title: 'Updated Webinar',
        is_featured: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('webinarRegistrationSchema', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should accept valid registration', () => {
      const result = webinarRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = webinarRegistrationSchema.safeParse({ email: 'john@example.com' });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const result = webinarRegistrationSchema.safeParse({ name: 'John' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = webinarRegistrationSchema.safeParse({ ...validData, email: 'bad' });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = webinarRegistrationSchema.safeParse({ ...validData, name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteWebinarsSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteWebinarsSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteWebinarsSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('generateWebinarSchema', () => {
    it('should accept valid topic', () => {
      const result = generateWebinarSchema.safeParse({ topic: 'Meditation Basics' });
      expect(result.success).toBe(true);
    });

    it('should reject empty topic', () => {
      const result = generateWebinarSchema.safeParse({ topic: '' });
      expect(result.success).toBe(false);
    });

    it('should reject topic exceeding 200 characters', () => {
      const result = generateWebinarSchema.safeParse({ topic: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });
  });
});
