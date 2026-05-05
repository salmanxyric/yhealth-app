/**
 * Blog Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createBlogSchema,
  updateBlogSchema,
  bulkDeleteBlogsSchema,
  bulkUpdateStatusSchema,
  listBlogsQuerySchema,
  generateBlogSchema,
  blogReactionSchema,
} from '../../../src/validators/blog.validator.js';

describe('Blog Validators', () => {
  describe('createBlogSchema', () => {
    const validData = {
      title: 'My Blog Post',
      content: 'This is the blog content.',
    };

    it('should accept valid input with required fields only', () => {
      const result = createBlogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default status to draft', () => {
      const result = createBlogSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
      }
    });

    it('should accept all optional fields', () => {
      const result = createBlogSchema.safeParse({
        ...validData,
        slug: 'my-blog-post',
        excerpt: 'A short excerpt',
        markdown_content: '# Heading',
        featured_image: 'https://example.com/image.png',
        status: 'published',
        published_at: '2024-01-01T00:00:00Z',
        meta_title: 'SEO Title',
        meta_description: 'SEO Description',
        meta_keywords: 'blog, test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing title', () => {
      const { title: _title, ...rest } = validData;
      const result = createBlogSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing content', () => {
      const { content: _content, ...rest } = validData;
      const result = createBlogSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = createBlogSchema.safeParse({ ...validData, title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 255 characters', () => {
      const result = createBlogSchema.safeParse({ ...validData, title: 'a'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should reject invalid slug format', () => {
      const result = createBlogSchema.safeParse({ ...validData, slug: 'Invalid Slug!' });
      expect(result.success).toBe(false);
    });

    it('should accept valid slug', () => {
      const result = createBlogSchema.safeParse({ ...validData, slug: 'valid-slug-123' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid featured_image URL', () => {
      const result = createBlogSchema.safeParse({ ...validData, featured_image: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status value', () => {
      const result = createBlogSchema.safeParse({ ...validData, status: 'deleted' });
      expect(result.success).toBe(false);
    });

    it('should accept nullable optional fields', () => {
      const result = createBlogSchema.safeParse({ ...validData, excerpt: null, meta_title: null });
      expect(result.success).toBe(true);
    });

    it('should reject content exceeding 100000 characters', () => {
      const result = createBlogSchema.safeParse({ ...validData, content: 'a'.repeat(100001) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateBlogSchema', () => {
    it('should accept empty object (all fields optional)', () => {
      const result = updateBlogSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateBlogSchema.safeParse({ title: 'Updated Title' });
      expect(result.success).toBe(true);
    });

    it('should reject empty title when provided', () => {
      const result = updateBlogSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = updateBlogSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteBlogsSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteBlogsSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteBlogsSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID strings', () => {
      const result = bulkDeleteBlogsSchema.safeParse({ ids: ['not-a-uuid'] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 ids', () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const result = bulkDeleteBlogsSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateStatusSchema', () => {
    it('should accept valid ids and status', () => {
      const result = bulkUpdateStatusSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
        status: 'published',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing status', () => {
      const result = bulkUpdateStatusSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = bulkUpdateStatusSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
        status: 'deleted',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listBlogsQuerySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = listBlogsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe('created_at');
        expect(result.data.sort_order).toBe('desc');
      }
    });

    it('should transform page string to number', () => {
      const result = listBlogsQuerySchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it('should reject non-numeric page', () => {
      const result = listBlogsQuerySchema.safeParse({ page: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should reject page 0', () => {
      const result = listBlogsQuerySchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject limit exceeding 500', () => {
      const result = listBlogsQuerySchema.safeParse({ limit: '501' });
      expect(result.success).toBe(false);
    });

    it('should accept valid sort_by values', () => {
      const sortValues = ['created_at', 'updated_at', 'published_at', 'title', 'views'] as const;
      for (const sort_by of sortValues) {
        const result = listBlogsQuerySchema.safeParse({ sort_by });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('generateBlogSchema', () => {
    it('should accept valid input', () => {
      const result = generateBlogSchema.safeParse({ topic: 'Health Tips' });
      expect(result.success).toBe(true);
    });

    it('should reject missing topic', () => {
      const result = generateBlogSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty topic', () => {
      const result = generateBlogSchema.safeParse({ topic: '' });
      expect(result.success).toBe(false);
    });

    it('should reject topic exceeding 200 characters', () => {
      const result = generateBlogSchema.safeParse({ topic: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should accept all valid tone values', () => {
      const tones = ['professional', 'casual', 'friendly', 'technical', 'conversational'] as const;
      for (const tone of tones) {
        const result = generateBlogSchema.safeParse({ topic: 'Test', tone });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid tone', () => {
      const result = generateBlogSchema.safeParse({ topic: 'Test', tone: 'angry' });
      expect(result.success).toBe(false);
    });
  });

  describe('blogReactionSchema', () => {
    it('should accept like', () => {
      const result = blogReactionSchema.safeParse({ type: 'like' });
      expect(result.success).toBe(true);
    });

    it('should accept dislike', () => {
      const result = blogReactionSchema.safeParse({ type: 'dislike' });
      expect(result.success).toBe(true);
    });

    it('should reject missing type', () => {
      const result = blogReactionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const result = blogReactionSchema.safeParse({ type: 'love' });
      expect(result.success).toBe(false);
    });
  });
});
