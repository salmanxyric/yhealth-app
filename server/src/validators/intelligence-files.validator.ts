/**
 * @file Intelligence Files Validator
 * @description Zod schemas for the Intelligence Files API endpoints
 */

import { z } from 'zod';

const memoryTypeEnum = z.enum(['pattern', 'preference', 'context', 'feedback', 'relationship', 'learned_rule']);
const intelligenceCategoryEnum = z.enum(['fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain']);
const coreSectionEnum = z.enum(['biometrics', 'targets', 'constraints', 'preferences', 'medical', 'lifestyle']);
const feedbackActionEnum = z.enum(['verify', 'reject', 'correct', 'dismiss', 'expand', 'pin']);
const feedbackTargetTypeEnum = z.enum(['memory', 'artifact', 'plan', 'insight', 'recommendation']);

const memoryEvidenceSchema = z.object({
  source_table: z.string().min(1).max(128),
  source_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Date format required'),
  summary: z.string().min(1).max(500),
});

export const createMemorySchema = z.object({
  memoryType: memoryTypeEnum,
  category: intelligenceCategoryEnum,
  subcategory: z.string().max(128).optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  structuredData: z.record(z.unknown()).optional(),
  evidence: z.array(memoryEvidenceSchema).min(1, 'At least one evidence item required'),
  source: z.enum(['ai', 'user', 'system', 'wearable']).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateMemorySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(2000).optional(),
  structuredData: z.record(z.unknown()).optional(),
});

export const rejectMemorySchema = z.object({
  reason: z.string().max(500).optional(),
  correction: z.string().max(2000).optional(),
});

export const updateCoreValueSchema = z.object({
  value: z.unknown(),
  unit: z.string().max(32).optional(),
});

export const submitFeedbackSchema = z.object({
  targetType: feedbackTargetTypeEnum,
  targetId: z.string().uuid(),
  action: feedbackActionEnum,
  correctionData: z.record(z.unknown()).optional(),
  comment: z.string().max(1000).optional(),
});

export const listMemoriesQuerySchema = z.object({
  category: intelligenceCategoryEnum.optional(),
  memoryType: memoryTypeEnum.optional(),
  status: z.enum(['active', 'verified', 'rejected', 'expired', 'superseded']).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  sort: z.enum(['date', 'confidence', 'usage']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listArtifactsQuerySchema = z.object({
  artifactType: z.enum(['chart', 'comparison', 'report', 'heatmap', 'scatter', 'gauge', 'timeline', 'table']).optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateArtifactSchema = z.object({
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const listLogsQuerySchema = z.object({
  category: intelligenceCategoryEnum.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const searchMemoriesQuerySchema = z.object({
  q: z.string().min(1).max(500),
  category: intelligenceCategoryEnum.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export { coreSectionEnum };
