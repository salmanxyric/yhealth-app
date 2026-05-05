/**
 * Life Areas Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createLifeAreaSchema,
  updateLifeAreaSchema,
  linkEntitySchema,
  routeIntentSchema,
} from '../../../src/validators/life-areas.validator.js';

describe('Life Areas Validators', () => {
  describe('createLifeAreaSchema', () => {
    const validData = {
      slug: 'morning-routine',
      display_name: 'Morning Routine',
      domain_type: 'fitness',
    };

    it('should accept valid input', () => {
      const result = createLifeAreaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid domain types', () => {
      const types = [
        'career', 'relationships', 'creativity', 'spirituality',
        'finance', 'fitness', 'learning', 'custom',
      ];
      for (const domain_type of types) {
        const result = createLifeAreaSchema.safeParse({ ...validData, domain_type });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid domain_type', () => {
      const result = createLifeAreaSchema.safeParse({ ...validData, domain_type: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('should reject missing slug', () => {
      const { slug: _slug, ...rest } = validData;
      const result = createLifeAreaSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing display_name', () => {
      const { display_name: _display_name, ...rest } = validData;
      const result = createLifeAreaSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject slug with uppercase', () => {
      const result = createLifeAreaSchema.safeParse({ ...validData, slug: 'Bad-Slug' });
      expect(result.success).toBe(false);
    });

    it('should reject slug with special characters', () => {
      const result = createLifeAreaSchema.safeParse({ ...validData, slug: 'bad_slug!' });
      expect(result.success).toBe(false);
    });

    it('should accept valid hex color', () => {
      const result = createLifeAreaSchema.safeParse({ ...validData, color: '#3366ff' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid hex color', () => {
      const result = createLifeAreaSchema.safeParse({ ...validData, color: 'red' });
      expect(result.success).toBe(false);
    });

    it('should reject 3-digit hex color', () => {
      const result = createLifeAreaSchema.safeParse({ ...validData, color: '#fff' });
      expect(result.success).toBe(false);
    });

    it('should accept preferences object', () => {
      const result = createLifeAreaSchema.safeParse({
        ...validData,
        preferences: {
          preferredTimeOfDay: 'morning',
          tone: 'gentle',
          followUpFrequency: 'daily',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept preferences with blocked days', () => {
      const result = createLifeAreaSchema.safeParse({
        ...validData,
        preferences: {
          blockedDays: ['sat', 'sun'],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid preferredTimeOfDay', () => {
      const result = createLifeAreaSchema.safeParse({
        ...validData,
        preferences: { preferredTimeOfDay: 'midnight' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateLifeAreaSchema', () => {
    it('should accept empty object', () => {
      const result = updateLifeAreaSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateLifeAreaSchema.safeParse({
        display_name: 'Updated Name',
        status: 'paused',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid status values', () => {
      const statuses = ['active', 'paused', 'archived'] as const;
      for (const status of statuses) {
        const result = updateLifeAreaSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = updateLifeAreaSchema.safeParse({ status: 'deleted' });
      expect(result.success).toBe(false);
    });
  });

  describe('linkEntitySchema', () => {
    const validData = {
      entity_type: 'goal' as const,
      entity_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    it('should accept valid input', () => {
      const result = linkEntitySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid entity types', () => {
      const types = ['goal', 'schedule', 'contract', 'reminder'] as const;
      for (const entity_type of types) {
        const result = linkEntitySchema.safeParse({ ...validData, entity_type });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid entity_type', () => {
      const result = linkEntitySchema.safeParse({ ...validData, entity_type: 'task' });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID entity_id', () => {
      const result = linkEntitySchema.safeParse({ ...validData, entity_id: 'bad-id' });
      expect(result.success).toBe(false);
    });

    it('should reject missing entity_type', () => {
      const result = linkEntitySchema.safeParse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('routeIntentSchema', () => {
    it('should accept valid message', () => {
      const result = routeIntentSchema.safeParse({ message: 'I want to exercise more' });
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const result = routeIntentSchema.safeParse({ message: '' });
      expect(result.success).toBe(false);
    });

    it('should reject message exceeding 4000 characters', () => {
      const result = routeIntentSchema.safeParse({ message: 'a'.repeat(4001) });
      expect(result.success).toBe(false);
    });

    it('should accept optional coach_reply', () => {
      const result = routeIntentSchema.safeParse({
        message: 'Help me',
        coach_reply: 'Here is my advice...',
      });
      expect(result.success).toBe(true);
    });

    it('should reject coach_reply exceeding 8000 characters', () => {
      const result = routeIntentSchema.safeParse({
        message: 'Help',
        coach_reply: 'a'.repeat(8001),
      });
      expect(result.success).toBe(false);
    });
  });
});
