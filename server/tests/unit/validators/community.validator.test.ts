/**
 * Community Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createCommunityPostSchema,
  createAdminCommunityPostSchema,
  updateCommunityPostSchema,
  communityReplySchema,
  bulkDeleteCommunitySchema,
  generateCommunityPostSchema,
} from '../../../src/validators/community.validator.js';

describe('Community Validators', () => {
  describe('createCommunityPostSchema', () => {
    const validData = {
      title: 'My First Post',
      content: 'This is a community post.',
    };

    it('should accept valid input with required fields', () => {
      const result = createCommunityPostSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default category to general', () => {
      const result = createCommunityPostSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('general');
      }
    });

    it('should default post_type to discussion', () => {
      const result = createCommunityPostSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.post_type).toBe('discussion');
      }
    });

    it('should reject missing title', () => {
      const result = createCommunityPostSchema.safeParse({ content: 'Some content' });
      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const result = createCommunityPostSchema.safeParse({ title: 'A Title' });
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 255 characters', () => {
      const result = createCommunityPostSchema.safeParse({
        ...validData,
        title: 'a'.repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it('should reject content exceeding 50000 characters', () => {
      const result = createCommunityPostSchema.safeParse({
        ...validData,
        content: 'a'.repeat(50001),
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid post_type values', () => {
      const types = ['discussion', 'question', 'tip', 'success_story', 'challenge', 'announcement'] as const;
      for (const post_type of types) {
        const result = createCommunityPostSchema.safeParse({ ...validData, post_type });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid slug format', () => {
      const result = createCommunityPostSchema.safeParse({ ...validData, slug: 'INVALID SLUG' });
      expect(result.success).toBe(false);
    });
  });

  describe('createAdminCommunityPostSchema', () => {
    const validData = {
      title: 'Admin Post',
      content: 'Admin community content.',
    };

    it('should default status to published', () => {
      const result = createAdminCommunityPostSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('published');
      }
    });

    it('should accept all valid status values', () => {
      const statuses = ['draft', 'published', 'archived', 'flagged'] as const;
      for (const status of statuses) {
        const result = createAdminCommunityPostSchema.safeParse({ ...validData, status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('updateCommunityPostSchema', () => {
    it('should accept empty object', () => {
      const result = updateCommunityPostSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update with boolean fields', () => {
      const result = updateCommunityPostSchema.safeParse({
        is_pinned: true,
        is_featured: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateCommunityPostSchema.safeParse({ status: 'deleted' });
      expect(result.success).toBe(false);
    });
  });

  describe('communityReplySchema', () => {
    it('should accept valid reply', () => {
      const result = communityReplySchema.safeParse({ content: 'Great post!' });
      expect(result.success).toBe(true);
    });

    it('should reject reply shorter than 2 characters', () => {
      const result = communityReplySchema.safeParse({ content: 'x' });
      expect(result.success).toBe(false);
    });

    it('should reject reply exceeding 10000 characters', () => {
      const result = communityReplySchema.safeParse({ content: 'a'.repeat(10001) });
      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const result = communityReplySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteCommunitySchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteCommunitySchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteCommunitySchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID strings', () => {
      const result = bulkDeleteCommunitySchema.safeParse({ ids: ['abc'] });
      expect(result.success).toBe(false);
    });
  });

  describe('generateCommunityPostSchema', () => {
    it('should accept valid input', () => {
      const result = generateCommunityPostSchema.safeParse({ topic: 'Wellness Tips' });
      expect(result.success).toBe(true);
    });

    it('should reject empty topic', () => {
      const result = generateCommunityPostSchema.safeParse({ topic: '' });
      expect(result.success).toBe(false);
    });

    it('should reject topic exceeding 200 characters', () => {
      const result = generateCommunityPostSchema.safeParse({ topic: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should accept all optional fields', () => {
      const result = generateCommunityPostSchema.safeParse({
        topic: 'Yoga',
        post_type: 'tip',
        tone: 'casual',
        length: 'short',
        includeSEO: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
