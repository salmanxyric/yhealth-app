/**
 * @file Wiki Validator
 * @description Zod schemas for the Wiki API endpoints
 */

import { z } from 'zod';

export const pageTypeEnum = z.enum(['entity', 'concept', 'pattern', 'journal', 'synthesis', 'source']);
export const pageStatusEnum = z.enum(['active', 'stale', 'contradicted', 'archived', 'draft']);
export const linkTypeEnum = z.enum(['reference', 'contradicts', 'supports', 'supersedes', 'derived_from', 'see_also']);
export const categoryEnum = z.enum([
  'fitness',
  'nutrition',
  'sleep',
  'wellbeing',
  'lifestyle',
  'behavioral',
  'cross_domain',
  'medical',
  'mental_health',
  'goals',
  'coaching',
  'meta',
  'preferences',
  'relationships',
  'general',
]);

const wikiPageSourceSchema = z.object({
  sourceType: z.string().min(1).max(64),
  sourceId: z.string().uuid(),
  sourceTable: z.string().min(1).max(128),
  dateRangeStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format required (YYYY-MM-DD)').optional(),
  dateRangeEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format required (YYYY-MM-DD)').optional(),
  rowCount: z.number().int().min(0).optional(),
  extractSummary: z.string().max(1000).optional(),
});

export const createWikiPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  pageType: pageTypeEnum,
  category: categoryEnum,
  title: z.string().min(1).max(255),
  summary: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  frontmatter: z.record(z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(wikiPageSourceSchema).optional(),
});

export const updateWikiPageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  summary: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(50000).optional(),
  frontmatter: z.record(z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  status: pageStatusEnum.optional(),
  changeReason: z.string().min(1).max(500),
});

export const createWikiLinkSchema = z.object({
  sourceSlug: z.string().min(1).max(255),
  targetSlug: z.string().min(1).max(255),
  linkType: linkTypeEnum,
  context: z.string().max(500).optional(),
  anchorText: z.string().max(255).optional(),
});

export const listWikiPagesQuerySchema = z.object({
  pageType: pageTypeEnum.optional(),
  category: categoryEnum.optional(),
  status: pageStatusEnum.optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(['updated_at', 'confidence', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const searchWikiQuerySchema = z.object({
  q: z.string().min(1).max(500),
  pageType: pageTypeEnum.optional(),
  category: categoryEnum.optional(),
  status: pageStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const flagWikiPageSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const wikiPageFeedbackSchema = z.object({
  action: z.enum(['verify', 'correct', 'dispute']),
  correction: z.string().max(2000).optional(),
  comment: z.string().max(500).optional(),
});

export { wikiPageSourceSchema };
