/**
 * Intelligence Files Validator Unit Tests
 *
 * Tests for all Zod schemas in the Intelligence Files API:
 * - createMemorySchema
 * - updateMemorySchema
 * - rejectMemorySchema
 * - updateCoreValueSchema
 * - submitFeedbackSchema
 * - listMemoriesQuerySchema
 * - listArtifactsQuerySchema
 * - updateArtifactSchema
 * - listLogsQuerySchema
 * - searchMemoriesQuerySchema
 */

import { describe, it, expect } from '@jest/globals';

const {
  createMemorySchema,
  updateMemorySchema,
  rejectMemorySchema,
  updateCoreValueSchema,
  submitFeedbackSchema,
  listMemoriesQuerySchema,
  listArtifactsQuerySchema,
  updateArtifactSchema,
  listLogsQuerySchema,
  searchMemoriesQuerySchema,
} = await import('../../../src/validators/intelligence-files.validator.js');

// ============================================
// HELPERS
// ============================================

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

function validEvidence() {
  return [
    {
      source_table: 'activity_events',
      source_id: VALID_UUID,
      date: '2026-04-20',
      summary: 'User ran 5km in 25 minutes',
    },
  ];
}

function validCreateMemoryInput(overrides: Record<string, unknown> = {}) {
  return {
    memoryType: 'pattern',
    category: 'fitness',
    title: 'Morning runner pattern',
    description: 'User consistently runs in the morning before 7am',
    evidence: validEvidence(),
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('Intelligence Files Validators', () => {
  // ------------------------------------------
  // createMemorySchema
  // ------------------------------------------
  describe('createMemorySchema', () => {
    it('should accept valid full input with all optional fields', () => {
      const input = validCreateMemoryInput({
        subcategory: 'cardio',
        structuredData: { avgPace: 5.0 },
        source: 'ai',
        expiresAt: '2026-12-31T23:59:59.000Z',
      });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid minimal input with only required fields', () => {
      const input = validCreateMemoryInput();

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid memoryType', () => {
      const input = validCreateMemoryInput({ memoryType: 'invalid_type' });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error!.issues[0].path).toContain('memoryType');
    });

    it('should reject invalid category', () => {
      const input = validCreateMemoryInput({ category: 'invalid_category' });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error!.issues[0].path).toContain('category');
    });

    it('should reject missing title', () => {
      const { title: _title, ...input } = validCreateMemoryInput();

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject evidence with invalid UUID for source_id', () => {
      const input = validCreateMemoryInput({
        evidence: [
          {
            source_table: 'activity_events',
            source_id: 'not-a-uuid',
            date: '2026-04-20',
            summary: 'Some summary',
          },
        ],
      });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject evidence with invalid date format', () => {
      const input = validCreateMemoryInput({
        evidence: [
          {
            source_table: 'activity_events',
            source_id: VALID_UUID,
            date: '20-04-2026',
            summary: 'Some summary',
          },
        ],
      });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty evidence array (min 1 required)', () => {
      const input = validCreateMemoryInput({ evidence: [] });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error!.issues[0].message).toMatch(/At least one evidence/i);
    });

    it('should accept evidence without optional source_id', () => {
      const input = validCreateMemoryInput({
        evidence: [
          {
            source_table: 'manual_entry',
            date: '2026-04-20',
            summary: 'Manually logged workout',
          },
        ],
      });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept all valid memoryType enum values', () => {
      const validTypes = ['pattern', 'preference', 'context', 'feedback', 'relationship', 'learned_rule'];
      for (const memoryType of validTypes) {
        const result = createMemorySchema.safeParse(validCreateMemoryInput({ memoryType }));
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid category enum values', () => {
      const validCategories = ['fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain'];
      for (const category of validCategories) {
        const result = createMemorySchema.safeParse(validCreateMemoryInput({ category }));
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid source enum values', () => {
      const validSources = ['ai', 'user', 'system', 'wearable'];
      for (const source of validSources) {
        const result = createMemorySchema.safeParse(validCreateMemoryInput({ source }));
        expect(result.success).toBe(true);
      }
    });

    it('should reject missing description', () => {
      const { description: _description, ...input } = validCreateMemoryInput();

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 255 characters', () => {
      const input = validCreateMemoryInput({ title: 'a'.repeat(256) });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 2000 characters', () => {
      const input = validCreateMemoryInput({ description: 'a'.repeat(2001) });

      const result = createMemorySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------
  // updateMemorySchema
  // ------------------------------------------
  describe('updateMemorySchema', () => {
    it('should accept empty object (partial update, all optional)', () => {
      const result = updateMemorySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept title only', () => {
      const result = updateMemorySchema.safeParse({ title: 'Updated title' });
      expect(result.success).toBe(true);
    });

    it('should accept description only', () => {
      const result = updateMemorySchema.safeParse({ description: 'Updated description' });
      expect(result.success).toBe(true);
    });

    it('should accept structuredData only', () => {
      const result = updateMemorySchema.safeParse({ structuredData: { key: 'value' } });
      expect(result.success).toBe(true);
    });

    it('should reject empty title string', () => {
      const result = updateMemorySchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------
  // rejectMemorySchema
  // ------------------------------------------
  describe('rejectMemorySchema', () => {
    it('should accept empty object (all optional)', () => {
      const result = rejectMemorySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept with reason', () => {
      const result = rejectMemorySchema.safeParse({ reason: 'Incorrect assumption' });
      expect(result.success).toBe(true);
    });

    it('should accept with both reason and correction', () => {
      const result = rejectMemorySchema.safeParse({
        reason: 'Wrong time',
        correction: 'I actually run at night, not morning',
      });
      expect(result.success).toBe(true);
    });

    it('should reject reason exceeding 500 characters', () => {
      const result = rejectMemorySchema.safeParse({ reason: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------
  // updateCoreValueSchema
  // ------------------------------------------
  describe('updateCoreValueSchema', () => {
    it('should accept number value', () => {
      const result = updateCoreValueSchema.safeParse({ value: 72 });
      expect(result.success).toBe(true);
    });

    it('should accept string value', () => {
      const result = updateCoreValueSchema.safeParse({ value: 'moderate' });
      expect(result.success).toBe(true);
    });

    it('should accept object value', () => {
      const result = updateCoreValueSchema.safeParse({ value: { min: 60, max: 80 } });
      expect(result.success).toBe(true);
    });

    it('should accept value with unit', () => {
      const result = updateCoreValueSchema.safeParse({ value: 180, unit: 'cm' });
      expect(result.success).toBe(true);
    });

    it('should accept null value (z.unknown allows null)', () => {
      const result = updateCoreValueSchema.safeParse({ value: null });
      expect(result.success).toBe(true);
    });

    it('should accept missing value key (z.unknown accepts undefined)', () => {
      // z.unknown() in a z.object does not enforce key presence — missing key = undefined = valid
      const result = updateCoreValueSchema.safeParse({ unit: 'kg' });
      expect(result.success).toBe(true);
    });

    it('should reject unit exceeding 32 characters', () => {
      const result = updateCoreValueSchema.safeParse({ value: 10, unit: 'a'.repeat(33) });
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------
  // submitFeedbackSchema
  // ------------------------------------------
  describe('submitFeedbackSchema', () => {
    it('should accept valid verify action', () => {
      const result = submitFeedbackSchema.safeParse({
        targetType: 'memory',
        targetId: VALID_UUID,
        action: 'verify',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid targetType', () => {
      const result = submitFeedbackSchema.safeParse({
        targetType: 'nonexistent',
        targetId: VALID_UUID,
        action: 'verify',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues[0].path).toContain('targetType');
    });

    it('should reject invalid action', () => {
      const result = submitFeedbackSchema.safeParse({
        targetType: 'memory',
        targetId: VALID_UUID,
        action: 'destroy',
      });
      expect(result.success).toBe(false);
      expect(result.error!.issues[0].path).toContain('action');
    });

    it('should reject non-UUID targetId', () => {
      const result = submitFeedbackSchema.safeParse({
        targetType: 'memory',
        targetId: 'not-a-uuid',
        action: 'verify',
      });
      expect(result.success).toBe(false);
    });

    it('should accept with correctionData', () => {
      const result = submitFeedbackSchema.safeParse({
        targetType: 'memory',
        targetId: VALID_UUID,
        action: 'correct',
        correctionData: { newValue: 65 },
      });
      expect(result.success).toBe(true);
    });

    it('should accept with comment', () => {
      const result = submitFeedbackSchema.safeParse({
        targetType: 'artifact',
        targetId: VALID_UUID,
        action: 'dismiss',
        comment: 'Not relevant to me',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid targetType values', () => {
      const types = ['memory', 'artifact', 'plan', 'insight', 'recommendation'];
      for (const targetType of types) {
        const result = submitFeedbackSchema.safeParse({
          targetType,
          targetId: VALID_UUID,
          action: 'verify',
        });
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid action values', () => {
      const actions = ['verify', 'reject', 'correct', 'dismiss', 'expand', 'pin'];
      for (const action of actions) {
        const result = submitFeedbackSchema.safeParse({
          targetType: 'memory',
          targetId: VALID_UUID,
          action,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  // ------------------------------------------
  // listMemoriesQuerySchema
  // ------------------------------------------
  describe('listMemoriesQuerySchema', () => {
    it('should accept empty object (all defaults)', () => {
      const result = listMemoriesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid filters', () => {
      const result = listMemoriesQuerySchema.safeParse({
        category: 'fitness',
        memoryType: 'pattern',
        status: 'active',
        minConfidence: 0.5,
        sort: 'confidence',
        page: 2,
        limit: 25,
      });
      expect(result.success).toBe(true);
    });

    it('should reject minConfidence > 1', () => {
      const result = listMemoriesQuerySchema.safeParse({ minConfidence: 1.5 });
      expect(result.success).toBe(false);
    });

    it('should reject minConfidence < 0', () => {
      const result = listMemoriesQuerySchema.safeParse({ minConfidence: -0.1 });
      expect(result.success).toBe(false);
    });

    it('should accept minConfidence at boundary 0', () => {
      const result = listMemoriesQuerySchema.safeParse({ minConfidence: 0 });
      expect(result.success).toBe(true);
    });

    it('should accept minConfidence at boundary 1', () => {
      const result = listMemoriesQuerySchema.safeParse({ minConfidence: 1 });
      expect(result.success).toBe(true);
    });

    it('should reject invalid sort value', () => {
      const result = listMemoriesQuerySchema.safeParse({ sort: 'alphabetical' });
      expect(result.success).toBe(false);
    });

    it('should reject limit > 100', () => {
      const result = listMemoriesQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject limit < 1', () => {
      const result = listMemoriesQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should coerce string numbers from query params', () => {
      const result = listMemoriesQuerySchema.safeParse({ page: '3', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });
  });

  // ------------------------------------------
  // listArtifactsQuerySchema
  // ------------------------------------------
  describe('listArtifactsQuerySchema', () => {
    it('should accept empty object (all defaults)', () => {
      const result = listArtifactsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid artifactType', () => {
      const result = listArtifactsQuerySchema.safeParse({ artifactType: 'chart' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid artifactType', () => {
      const result = listArtifactsQuerySchema.safeParse({ artifactType: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept tag filter', () => {
      const result = listArtifactsQuerySchema.safeParse({ tag: 'correlation' });
      expect(result.success).toBe(true);
    });

    it('should accept all valid artifact types', () => {
      const types = ['chart', 'comparison', 'report', 'heatmap', 'scatter', 'gauge', 'timeline', 'table'];
      for (const artifactType of types) {
        const result = listArtifactsQuerySchema.safeParse({ artifactType });
        expect(result.success).toBe(true);
      }
    });
  });

  // ------------------------------------------
  // updateArtifactSchema
  // ------------------------------------------
  describe('updateArtifactSchema', () => {
    it('should accept isPinned', () => {
      const result = updateArtifactSchema.safeParse({ isPinned: true });
      expect(result.success).toBe(true);
    });

    it('should accept isArchived', () => {
      const result = updateArtifactSchema.safeParse({ isArchived: true });
      expect(result.success).toBe(true);
    });

    it('should accept tags array', () => {
      const result = updateArtifactSchema.safeParse({ tags: ['fitness', 'weekly'] });
      expect(result.success).toBe(true);
    });

    it('should reject tags with more than 20 items', () => {
      const tags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);
      const result = updateArtifactSchema.safeParse({ tags });
      expect(result.success).toBe(false);
    });

    it('should accept tags with exactly 20 items', () => {
      const tags = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
      const result = updateArtifactSchema.safeParse({ tags });
      expect(result.success).toBe(true);
    });

    it('should reject individual tag exceeding 50 characters', () => {
      const result = updateArtifactSchema.safeParse({ tags: ['a'.repeat(51)] });
      expect(result.success).toBe(false);
    });

    it('should accept empty object', () => {
      const result = updateArtifactSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  // ------------------------------------------
  // listLogsQuerySchema
  // ------------------------------------------
  describe('listLogsQuerySchema', () => {
    it('should accept empty object (all defaults)', () => {
      const result = listLogsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid date range', () => {
      const result = listLogsQuerySchema.safeParse({
        startDate: '2026-01-01',
        endDate: '2026-04-30',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format (not YYYY-MM-DD)', () => {
      const result = listLogsQuerySchema.safeParse({ startDate: '01-01-2026' });
      expect(result.success).toBe(false);
    });

    it('should reject date with extra characters after YYYY-MM-DD', () => {
      // The regex is /^\d{4}-\d{2}-\d{2}$/ — anchored at end
      const result = listLogsQuerySchema.safeParse({ startDate: '2026-01-01T00:00:00' });
      expect(result.success).toBe(false);
    });

    it('should accept category filter', () => {
      const result = listLogsQuerySchema.safeParse({ category: 'sleep' });
      expect(result.success).toBe(true);
    });

    it('should reject limit > 100', () => {
      const result = listLogsQuerySchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });
  });

  // ------------------------------------------
  // searchMemoriesQuerySchema
  // ------------------------------------------
  describe('searchMemoriesQuerySchema', () => {
    it('should reject empty q string', () => {
      const result = searchMemoriesQuerySchema.safeParse({ q: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing q entirely', () => {
      const result = searchMemoriesQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject q exceeding 500 characters', () => {
      const result = searchMemoriesQuerySchema.safeParse({ q: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('should accept valid q with category', () => {
      const result = searchMemoriesQuerySchema.safeParse({
        q: 'morning running pattern',
        category: 'fitness',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid q alone', () => {
      const result = searchMemoriesQuerySchema.safeParse({ q: 'sleep' });
      expect(result.success).toBe(true);
    });

    it('should accept valid q at max length (500 chars)', () => {
      const result = searchMemoriesQuerySchema.safeParse({ q: 'a'.repeat(500) });
      expect(result.success).toBe(true);
    });

    it('should reject limit > 50', () => {
      const result = searchMemoriesQuerySchema.safeParse({ q: 'test', limit: 51 });
      expect(result.success).toBe(false);
    });

    it('should accept limit at boundary 50', () => {
      const result = searchMemoriesQuerySchema.safeParse({ q: 'test', limit: 50 });
      expect(result.success).toBe(true);
    });
  });
});
