/**
 * Contact Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createContactSchema,
  updateContactSchema,
  bulkDeleteContactsSchema,
  bulkUpdateContactStatusSchema,
} from '../../../src/validators/contact.validator.js';

describe('Contact Validators', () => {
  describe('createContactSchema', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Help needed',
      message: 'I need help with my account settings please.',
    };

    it('should accept valid input', () => {
      const result = createContactSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional phone', () => {
      const result = createContactSchema.safeParse({ ...validData, phone: '+1234567890' });
      expect(result.success).toBe(true);
    });

    it('should accept nullable phone', () => {
      const result = createContactSchema.safeParse({ ...validData, phone: null });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const { name: _name, ...rest } = validData;
      const result = createContactSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const { email: _email, ...rest } = validData;
      const result = createContactSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = createContactSchema.safeParse({ ...validData, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject missing subject', () => {
      const { subject: _subject, ...rest } = validData;
      const result = createContactSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject message shorter than 10 characters', () => {
      const result = createContactSchema.safeParse({ ...validData, message: 'Hi' });
      expect(result.success).toBe(false);
    });

    it('should reject message exceeding 5000 characters', () => {
      const result = createContactSchema.safeParse({ ...validData, message: 'a'.repeat(5001) });
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 255 characters', () => {
      const result = createContactSchema.safeParse({ ...validData, name: 'a'.repeat(256) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateContactSchema', () => {
    it('should accept empty object', () => {
      const result = updateContactSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid status update', () => {
      const result = updateContactSchema.safeParse({ status: 'resolved' });
      expect(result.success).toBe(true);
    });

    it('should accept valid priority update', () => {
      const result = updateContactSchema.safeParse({ priority: 'urgent' });
      expect(result.success).toBe(true);
    });

    it('should accept valid assigned_to UUID', () => {
      const result = updateContactSchema.safeParse({
        assigned_to: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid assigned_to', () => {
      const result = updateContactSchema.safeParse({ assigned_to: 'not-uuid' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = updateContactSchema.safeParse({ status: 'deleted' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      const statuses = ['new', 'read', 'in_progress', 'resolved', 'archived'] as const;
      for (const status of statuses) {
        const result = updateContactSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('bulkDeleteContactsSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteContactsSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteContactsSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 ids', () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const result = bulkDeleteContactsSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateContactStatusSchema', () => {
    it('should accept valid ids and status', () => {
      const result = bulkUpdateContactStatusSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
        status: 'resolved',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing status', () => {
      const result = bulkUpdateContactStatusSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });
  });
});
