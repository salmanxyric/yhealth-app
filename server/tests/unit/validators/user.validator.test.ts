/**
 * User Validator Unit Tests
 */

import {
  createUserSchema,
  updateUserSchema,
  bulkDeleteUsersSchema,
  bulkUpdateUserStatusSchema,
} from '../../../src/validators/user.validator.js';

describe('User Validators', () => {
  describe('createUserSchema', () => {
    const validData = {
      email: 'user@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
    };

    it('should accept valid user data', () => {
      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional password', () => {
      const result = createUserSchema.safeParse({ ...validData, password: 'StrongPass1!' });
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = createUserSchema.safeParse({ ...validData, password: 'short' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = createUserSchema.safeParse({ ...validData, email: 'not-email' });
      expect(result.success).toBe(false);
    });

    it('should reject missing first_name', () => {
      const { first_name: _first_name, ...rest } = validData;
      const result = createUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty first_name', () => {
      const result = createUserSchema.safeParse({ ...validData, first_name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject first_name over 100 characters', () => {
      const result = createUserSchema.safeParse({ ...validData, first_name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject missing last_name', () => {
      const { last_name: _last_name, ...rest } = validData;
      const result = createUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should accept valid role_id UUID', () => {
      const result = createUserSchema.safeParse({
        ...validData,
        role_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role_id', () => {
      const result = createUserSchema.safeParse({ ...validData, role_id: 'bad-uuid' });
      expect(result.success).toBe(false);
    });

    it('should accept valid gender values', () => {
      for (const gender of ['male', 'female', 'other']) {
        const result = createUserSchema.safeParse({ ...validData, gender });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid gender', () => {
      const result = createUserSchema.safeParse({ ...validData, gender: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('should accept nullable gender', () => {
      const result = createUserSchema.safeParse({ ...validData, gender: null });
      expect(result.success).toBe(true);
    });

    it('should accept valid date_of_birth', () => {
      const result = createUserSchema.safeParse({ ...validData, date_of_birth: '1990-05-15' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date_of_birth format', () => {
      const result = createUserSchema.safeParse({ ...validData, date_of_birth: '15/05/1990' });
      expect(result.success).toBe(false);
    });

    it('should accept nullable phone', () => {
      const result = createUserSchema.safeParse({ ...validData, phone: null });
      expect(result.success).toBe(true);
    });

    it('should reject phone over 20 characters', () => {
      const result = createUserSchema.safeParse({ ...validData, phone: '1'.repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should accept partial update with one field', () => {
      const result = updateUserSchema.safeParse({ first_name: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (all fields optional)', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept avatar URL', () => {
      const result = updateUserSchema.safeParse({ avatar: 'https://example.com/pic.jpg' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid avatar URL', () => {
      const result = updateUserSchema.safeParse({ avatar: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should accept nullable avatar', () => {
      const result = updateUserSchema.safeParse({ avatar: null });
      expect(result.success).toBe(true);
    });

    it('should accept is_email_verified boolean', () => {
      const result = updateUserSchema.safeParse({ is_email_verified: true });
      expect(result.success).toBe(true);
    });
  });

  describe('bulkDeleteUsersSchema', () => {
    it('should accept array of valid UUIDs', () => {
      const result = bulkDeleteUsersSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty ids array', () => {
      const result = bulkDeleteUsersSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID strings in ids', () => {
      const result = bulkDeleteUsersSchema.safeParse({ ids: ['not-a-uuid'] });
      expect(result.success).toBe(false);
    });

    it('should reject missing ids field', () => {
      const result = bulkDeleteUsersSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUpdateUserStatusSchema', () => {
    it('should accept valid bulk status update', () => {
      const result = bulkUpdateUserStatusSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
        is_active: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing is_active', () => {
      const result = bulkUpdateUserStatusSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty ids array', () => {
      const result = bulkUpdateUserStatusSchema.safeParse({
        ids: [],
        is_active: true,
      });
      expect(result.success).toBe(false);
    });
  });
});
