/**
 * Role Validator Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  createRoleSchema,
  updateRoleSchema,
  bulkDeleteRolesSchema,
  updateRolePermissionsSchema,
} from '../../../src/validators/role.validator.js';

describe('Role Validators', () => {
  describe('createRoleSchema', () => {
    it('should accept valid input', () => {
      const result = createRoleSchema.safeParse({ name: 'Admin' });
      expect(result.success).toBe(true);
    });

    it('should accept all optional fields', () => {
      const result = createRoleSchema.safeParse({
        name: 'Editor',
        slug: 'editor',
        description: 'Can edit content',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = createRoleSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = createRoleSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 100 characters', () => {
      const result = createRoleSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 500 characters', () => {
      const result = createRoleSchema.safeParse({
        name: 'Role',
        description: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept nullable description', () => {
      const result = createRoleSchema.safeParse({ name: 'Role', description: null });
      expect(result.success).toBe(true);
    });
  });

  describe('updateRoleSchema', () => {
    it('should accept empty object', () => {
      const result = updateRoleSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial update', () => {
      const result = updateRoleSchema.safeParse({ name: 'Updated Role' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name when provided', () => {
      const result = updateRoleSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteRolesSchema', () => {
    it('should accept valid UUID array', () => {
      const result = bulkDeleteRolesSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const result = bulkDeleteRolesSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID strings', () => {
      const result = bulkDeleteRolesSchema.safeParse({ ids: ['not-uuid'] });
      expect(result.success).toBe(false);
    });
  });

  describe('updateRolePermissionsSchema', () => {
    it('should accept valid permission UUIDs', () => {
      const result = updateRolePermissionsSchema.safeParse({
        permission_ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty permission array', () => {
      const result = updateRolePermissionsSchema.safeParse({ permission_ids: [] });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID permission ids', () => {
      const result = updateRolePermissionsSchema.safeParse({
        permission_ids: ['bad-id'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing permission_ids', () => {
      const result = updateRolePermissionsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
