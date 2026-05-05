/**
 * Follow Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  followRequestSchema,
  userIdParamSchema,
  followIdParamSchema,
  consentUpdateSchema,
} from '../../../src/validators/follow.validator.js';

describe('Follow Validators', () => {
  describe('followRequestSchema', () => {
    it('should accept empty object', () => {
      const result = followRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept optional message', () => {
      const result = followRequestSchema.safeParse({ message: 'I want to follow you!' });
      expect(result.success).toBe(true);
    });

    it('should reject message exceeding 300 characters', () => {
      const result = followRequestSchema.safeParse({ message: 'a'.repeat(301) });
      expect(result.success).toBe(false);
    });

    it('should accept message at exactly 300 characters', () => {
      const result = followRequestSchema.safeParse({ message: 'a'.repeat(300) });
      expect(result.success).toBe(true);
    });
  });

  describe('userIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const result = userIdParamSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = userIdParamSchema.safeParse({ userId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should reject missing userId', () => {
      const result = userIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('followIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const result = followIdParamSchema.safeParse({
        followId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = followIdParamSchema.safeParse({ followId: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should reject missing followId', () => {
      const result = followIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('consentUpdateSchema', () => {
    it('should accept empty object', () => {
      const result = consentUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept all boolean fields', () => {
      const result = consentUpdateSchema.safeParse({
        allow_suggestions: true,
        allow_goal_sharing: false,
        allow_activity_sharing: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const result = consentUpdateSchema.safeParse({ allow_suggestions: 'yes' });
      expect(result.success).toBe(false);
    });

    it('should accept partial consent update', () => {
      const result = consentUpdateSchema.safeParse({ allow_goal_sharing: true });
      expect(result.success).toBe(true);
    });
  });
});
