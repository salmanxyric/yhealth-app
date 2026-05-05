/**
 * Help Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createHelpArticleSchema,
  updateHelpArticleSchema,
  bulkDeleteHelpSchema,
  helpFeedbackSchema,
  generateHelpArticleSchema,
} from '../../../src/validators/help.validator.js';

describe('Help Validators', () => {
  describe('createHelpArticleSchema', () => {
    const validData = {
      title: 'How to Get Started',
      content: 'This is the article content.',
    };

    it('should accept valid input with required fields', () => {
      const result = createHelpArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default status to draft', () => {
      const result = createHelpArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
      }
    });

    it('should default category to general', () => {
      const result = createHelpArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('general');
      }
    });

    it('should default sort_order to 0', () => {
      const result = createHelpArticleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe(0);
      }
    });

    it('should reject missing title', () => {
      const result = createHelpArticleSchema.safeParse({ content: 'Some content' });
      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const result = createHelpArticleSchema.safeParse({ title: 'A Title' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid slug', () => {
      const result = createHelpArticleSchema.safeParse({ ...validData, slug: 'BAD SLUG' });
      expect(result.success).toBe(false);
    });

    it('should accept valid slug', () => {
      const result = createHelpArticleSchema.safeParse({ ...validData, slug: 'getting-started' });
      expect(result.success).toBe(true);
    });

    it('should reject content exceeding 100000 characters', () => {
      const result = createHelpArticleSchema.safeParse({
        ...validData,
        content: 'a'.repeat(100001),
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      const statuses = ['draft', 'published', 'archived'] as const;
      for (const status of statuses) {
        const result = createHelpArticleSchema.safeParse({ ...validData, status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('updateHelpArticleSchema', () => {
    it('should accept empty object', () => {
      const result = updateHelpArticleSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateHelpArticleSchema.safeParse({ title: 'Updated', sort_order: 5 });
      expect(result.success).toBe(true);
    });

    it('should accept nullable fields', () => {
      const result = updateHelpArticleSchema.safeParse({
        excerpt: null,
        meta_title: null,
        meta_description: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('bulkDeleteHelpSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteHelpSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteHelpSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID', () => {
      const result = bulkDeleteHelpSchema.safeParse({ ids: ['bad-id'] });
      expect(result.success).toBe(false);
    });
  });

  describe('helpFeedbackSchema', () => {
    it('should accept helpful true', () => {
      const result = helpFeedbackSchema.safeParse({ helpful: true });
      expect(result.success).toBe(true);
    });

    it('should accept helpful false', () => {
      const result = helpFeedbackSchema.safeParse({ helpful: false });
      expect(result.success).toBe(true);
    });

    it('should reject missing helpful', () => {
      const result = helpFeedbackSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-boolean', () => {
      const result = helpFeedbackSchema.safeParse({ helpful: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  describe('generateHelpArticleSchema', () => {
    it('should accept valid topic', () => {
      const result = generateHelpArticleSchema.safeParse({ topic: 'Account Settings' });
      expect(result.success).toBe(true);
    });

    it('should reject empty topic', () => {
      const result = generateHelpArticleSchema.safeParse({ topic: '' });
      expect(result.success).toBe(false);
    });

    it('should reject topic exceeding 200 characters', () => {
      const result = generateHelpArticleSchema.safeParse({ topic: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should accept all optional fields', () => {
      const result = generateHelpArticleSchema.safeParse({
        topic: 'FAQ',
        requirements: 'Include screenshots',
        tone: 'friendly',
        targetAudience: 'beginners',
        length: 'long',
        includeSEO: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
