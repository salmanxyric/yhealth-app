import { z } from 'zod';
import { wikiService } from '../../wiki.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// ============================================
// ENUMS
// ============================================

const PAGE_TYPES = ['entity', 'concept', 'pattern', 'journal', 'synthesis', 'source'] as const;
const CATEGORIES = ['fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain', 'medical', 'mental_health', 'goals', 'coaching', 'meta', 'preferences', 'relationships', 'general'] as const;
const LINK_TYPES = ['reference', 'contradicts', 'supports', 'supersedes', 'derived_from', 'see_also'] as const;

// ============================================
// SCHEMAS
// ============================================

const SearchWikiPagesSchema = z.object({
  query: z.string().min(1).describe('Search query to find wiki pages by title, summary, or body content'),
  category: z.enum(CATEGORIES).optional().describe('Filter results by category'),
  pageType: z.enum(PAGE_TYPES).optional().describe('Filter results by page type'),
  limit: z.number().int().min(1).max(20).optional().describe('Max results to return (default 10)'),
});

const GetWikiPageSchema = z.object({
  slug: z.string().min(1).describe('The unique slug identifier of the wiki page'),
});

const CreateWikiPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('URL-friendly slug (lowercase, hyphens only, e.g. "morning-routine")'),
  pageType: z.enum(PAGE_TYPES).describe('Type of wiki page'),
  category: z.enum(CATEGORIES).describe('Category for the page'),
  title: z.string().min(1).max(255).describe('Human-readable page title'),
  summary: z.string().min(1).max(500).describe('Brief one-line summary of the page content'),
  body: z.string().min(1).max(50000).describe('Full markdown body content. Use [[slug]] to link to other wiki pages.'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score 0-1 (default 0.5)'),
});

const UpdateWikiPageSchema = z.object({
  slug: z.string().min(1).describe('Slug of the wiki page to update'),
  title: z.string().min(1).max(255).optional().describe('Updated title'),
  summary: z.string().min(1).max(500).optional().describe('Updated summary'),
  body: z.string().min(1).max(50000).optional().describe('Updated body content (markdown, use [[slug]] for links)'),
  confidence: z.number().min(0).max(1).optional().describe('Updated confidence score'),
  changeReason: z.string().min(1).max(500).describe('Reason for the update (stored in version history)'),
});

const CreateWikiLinkSchema = z.object({
  sourceSlug: z.string().min(1).describe('Slug of the source page'),
  targetSlug: z.string().min(1).describe('Slug of the target page'),
  linkType: z.enum(LINK_TYPES).describe('Type of relationship between pages'),
  context: z.string().max(500).optional().describe('Brief context explaining the relationship'),
});

const FlagWikiContradictionSchema = z.object({
  pageSlug: z.string().min(1).describe('Slug of the original/authoritative page'),
  contradictingSlug: z.string().min(1).describe('Slug of the page that contradicts it'),
  explanation: z.string().min(1).max(500).describe('Explanation of the contradiction'),
});

const FileQueryAsWikiPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('URL-friendly slug for the new synthesis page'),
  title: z.string().min(1).max(255).describe('Title for the synthesis page'),
  summary: z.string().min(1).max(500).describe('Brief summary of the Q&A insight'),
  body: z.string().min(1).max(50000).describe('Full body content synthesizing the Q&A. Use [[slug]] to link related pages.'),
  category: z.enum(CATEGORIES).describe('Category for the synthesis page'),
});

// ============================================
// HANDLERS
// ============================================

async function searchWikiPages(userId: string, params: z.infer<typeof SearchWikiPagesSchema>): Promise<string> {
  const results = await wikiService.searchPages(userId, params.query, {
    category: params.category,
    pageType: params.pageType,
    limit: params.limit || 10,
  });

  if (results.length === 0) {
    return JSON.stringify({ message: 'No wiki pages found matching your query', results: [] });
  }

  const formatted = results.map((r) => ({
    slug: r.page.slug,
    type: r.page.pageType,
    category: r.page.category,
    title: r.page.title,
    summary: r.page.summary,
    confidence: r.page.confidence,
    similarity: r.similarity,
  }));

  return JSON.stringify({ results: formatted, count: formatted.length }, null, 2);
}

async function getWikiPage(userId: string, params: z.infer<typeof GetWikiPageSchema>): Promise<string> {
  const page = await wikiService.getPage(userId, params.slug);

  if (!page) {
    return JSON.stringify({ success: false, error: `Wiki page not found: ${params.slug}` });
  }

  const outboundSummary = page.outboundLinks.map((l) => ({
    slug: l.targetSlug,
    title: l.targetTitle,
    linkType: l.linkType,
    context: l.context,
  }));

  const inboundSummary = page.inboundLinks.map((l) => ({
    slug: l.sourceSlug,
    title: l.sourceTitle,
    linkType: l.linkType,
    context: l.context,
  }));

  return JSON.stringify({
    slug: page.slug,
    type: page.pageType,
    category: page.category,
    title: page.title,
    summary: page.summary,
    body: page.body,
    confidence: page.confidence,
    status: page.status,
    version: page.version,
    wordCount: page.wordCount,
    updatedAt: page.updatedAt,
    outboundLinks: outboundSummary,
    inboundLinks: inboundSummary,
  }, null, 2);
}

async function createWikiPage(userId: string, params: z.infer<typeof CreateWikiPageSchema>): Promise<string> {
  // Idempotency guard — return early if the page already exists
  const existing = await wikiService.getPage(userId, params.slug);
  if (existing) {
    return JSON.stringify({
      message: `Wiki page "${params.slug}" already exists`,
      data: { slug: existing.slug, title: existing.title, version: existing.version },
    }, null, 2);
  }

  const page = await wikiService.createPage(userId, {
    slug: params.slug,
    pageType: params.pageType,
    category: params.category,
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: params.confidence,
  });

  // Parse [[slug]] links from body and create wiki links
  const linkedSlugs = wikiService.parseWikiLinks(params.body);
  let linksCreated = 0;
  for (const targetSlug of linkedSlugs) {
    try {
      await wikiService.createLink(userId, {
        sourceSlug: params.slug,
        targetSlug,
        linkType: 'reference',
      });
      linksCreated++;
    } catch {
      // Target page may not exist yet — skip silently
    }
  }

  // Log the operation
  await wikiService.logOperation(userId, {
    operation: 'create',
    pageIds: [page.id],
    summary: `Created wiki page: ${page.title}`,
    pagesTouched: 1,
  });

  return JSON.stringify({
    success: true,
    message: `Wiki page "${page.title}" created (${linksCreated} links established)`,
    data: { slug: page.slug, id: page.id, version: page.version, linksCreated },
  }, null, 2);
}

async function updateWikiPage(userId: string, params: z.infer<typeof UpdateWikiPageSchema>): Promise<string> {
  // Idempotency guard — check existence and detect no-op updates
  const existing = await wikiService.getPage(userId, params.slug);
  if (!existing) {
    return JSON.stringify({
      message: `Wiki page "${params.slug}" not found`,
    }, null, 2);
  }

  const titleUnchanged = params.title === undefined || params.title === existing.title;
  const summaryUnchanged = params.summary === undefined || params.summary === existing.summary;
  const bodyUnchanged = params.body === undefined || params.body === existing.body;
  const confidenceUnchanged = params.confidence === undefined || params.confidence === existing.confidence;

  if (titleUnchanged && summaryUnchanged && bodyUnchanged && confidenceUnchanged) {
    return JSON.stringify({
      message: `Wiki page "${params.slug}" has no changes — skipping update`,
      data: { slug: existing.slug, version: existing.version },
    }, null, 2);
  }

  const page = await wikiService.updatePage(userId, params.slug, {
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: params.confidence,
    changeReason: params.changeReason,
  });

  // Re-parse and create wiki links if body was updated
  let linksCreated = 0;
  if (params.body) {
    const linkedSlugs = wikiService.parseWikiLinks(params.body);
    for (const targetSlug of linkedSlugs) {
      try {
        await wikiService.createLink(userId, {
          sourceSlug: params.slug,
          targetSlug,
          linkType: 'reference',
        });
        linksCreated++;
      } catch {
        // Target page may not exist yet — skip silently
      }
    }
  }

  // Log the operation
  await wikiService.logOperation(userId, {
    operation: 'update',
    pageIds: [page.id],
    summary: `Updated wiki page: ${page.title} (v${page.version}) — ${params.changeReason}`,
    pagesTouched: 1,
  });

  return JSON.stringify({
    success: true,
    message: `Wiki page "${page.title}" updated to v${page.version}`,
    data: { slug: page.slug, id: page.id, version: page.version, linksCreated },
  }, null, 2);
}

async function createWikiLink(userId: string, params: z.infer<typeof CreateWikiLinkSchema>): Promise<string> {
  const link = await wikiService.createLink(userId, {
    sourceSlug: params.sourceSlug,
    targetSlug: params.targetSlug,
    linkType: params.linkType,
    context: params.context,
  });

  return JSON.stringify({
    success: true,
    message: `Link created: ${params.sourceSlug} —[${params.linkType}]→ ${params.targetSlug}`,
    data: { id: link.id, linkType: link.linkType },
  }, null, 2);
}

async function flagWikiContradiction(userId: string, params: z.infer<typeof FlagWikiContradictionSchema>): Promise<string> {
  // Create a 'contradicts' link between the two pages
  const link = await wikiService.createLink(userId, {
    sourceSlug: params.contradictingSlug,
    targetSlug: params.pageSlug,
    linkType: 'contradicts',
    context: params.explanation,
  });

  // Update the contradicting page status to 'contradicted'
  const page = await wikiService.updatePage(userId, params.contradictingSlug, {
    status: 'contradicted',
    changeReason: `Flagged as contradicting "${params.pageSlug}": ${params.explanation}`,
  });

  // Log the operation
  await wikiService.logOperation(userId, {
    operation: 'contradiction_detected',
    pageIds: [page.id],
    summary: `Contradiction flagged: "${params.contradictingSlug}" contradicts "${params.pageSlug}" — ${params.explanation}`,
    pagesTouched: 1,
  });

  return JSON.stringify({
    success: true,
    message: `Contradiction flagged: "${params.contradictingSlug}" now marked as contradicted`,
    data: { linkId: link.id, pageSlug: params.contradictingSlug, status: 'contradicted' },
  }, null, 2);
}

async function fileQueryAsWikiPage(userId: string, params: z.infer<typeof FileQueryAsWikiPageSchema>): Promise<string> {
  // Idempotency guard — return early if the synthesis page already exists
  const existing = await wikiService.getPage(userId, params.slug);
  if (existing) {
    return JSON.stringify({
      message: `Wiki page "${params.slug}" already exists`,
      data: { slug: existing.slug, title: existing.title, version: existing.version },
    }, null, 2);
  }

  const page = await wikiService.createPage(userId, {
    slug: params.slug,
    pageType: 'synthesis',
    category: params.category,
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: 0.7,
  });

  // Parse [[slug]] links from body and create wiki links
  const linkedSlugs = wikiService.parseWikiLinks(params.body);
  let linksCreated = 0;
  for (const targetSlug of linkedSlugs) {
    try {
      await wikiService.createLink(userId, {
        sourceSlug: params.slug,
        targetSlug,
        linkType: 'reference',
      });
      linksCreated++;
    } catch {
      // Target page may not exist yet — skip silently
    }
  }

  // Log as query_filed operation
  await wikiService.logOperation(userId, {
    operation: 'query_filed',
    pageIds: [page.id],
    summary: `Filed Q&A as synthesis page: ${page.title}`,
    pagesTouched: 1,
  });

  return JSON.stringify({
    success: true,
    message: `Q&A filed as synthesis page "${page.title}" (confidence: 0.7, ${linksCreated} links)`,
    data: { slug: page.slug, id: page.id, linksCreated },
  }, null, 2);
}

// ============================================
// REGISTRATION
// ============================================

export function registerWikiTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'searchWikiPages',
      description: 'Search the user\'s personal wiki knowledge base. Use when you need to find existing knowledge pages about the user\'s health patterns, preferences, goals, or any previously documented insight. Returns matching pages ranked by relevance.',
      schema: SearchWikiPagesSchema,
      icon: 'search',
      mutationType: 'read' as const,
      handler: withErrorHandling('searchWikiPages', searchWikiPages),
    },
    {
      name: 'getWikiPage',
      description: 'Get the full content of a specific wiki page by its slug. Use when you need to read the detailed body of a page, check its current version, or see its inbound/outbound links to other pages.',
      schema: GetWikiPageSchema,
      icon: 'file-text',
      mutationType: 'read' as const,
      handler: withErrorHandling('getWikiPage', getWikiPage),
    },
    {
      name: 'createWikiPage',
      description: 'Create a new wiki page to persist knowledge about the user. Use when you discover a significant pattern, preference, health concept, or behavioral insight worth preserving. Automatically parses [[slug]] links in the body and creates cross-references. Do NOT create pages for trivial or one-off observations.',
      schema: CreateWikiPageSchema,
      icon: 'file-plus',
      mutationType: 'create' as const,
      semanticDelta: (params: any) => `Created wiki page: ${params.title}`,
      handler: withErrorHandling('createWikiPage', createWikiPage),
    },
    {
      name: 'updateWikiPage',
      description: 'Update an existing wiki page with new or corrected information. Use when knowledge evolves — e.g., the user\'s routine changes, a pattern is refined, or new evidence supports an update. A version snapshot is saved automatically before the update.',
      schema: UpdateWikiPageSchema,
      icon: 'edit',
      mutationType: 'update' as const,
      semanticDelta: (params: any) => `Updated wiki: ${params.slug} — ${params.changeReason}`,
      handler: withErrorHandling('updateWikiPage', updateWikiPage),
    },
    {
      name: 'createWikiLink',
      description: 'Create a typed cross-reference link between two wiki pages. Use to explicitly connect related knowledge — e.g., linking a nutrition page to a fitness page with "supports", or marking one page as "supersedes" another.',
      schema: CreateWikiLinkSchema,
      icon: 'link',
      mutationType: 'create' as const,
      semanticDelta: (params: any) => `Linked: ${params.sourceSlug} → ${params.targetSlug}`,
      handler: withErrorHandling('createWikiLink', createWikiLink),
    },
    {
      name: 'flagWikiContradiction',
      description: 'Flag a contradiction between two wiki pages. Use when you detect conflicting information — e.g., one page says the user prefers morning workouts but another says evening. Marks the contradicting page status and creates a link for review.',
      schema: FlagWikiContradictionSchema,
      icon: 'alert-triangle',
      mutationType: 'update' as const,
      semanticDelta: (params: any) => `Contradiction: ${params.contradictingSlug} vs ${params.pageSlug}`,
      handler: withErrorHandling('flagWikiContradiction', flagWikiContradiction),
    },
    {
      name: 'fileQueryAsWikiPage',
      description: 'File a valuable Q&A exchange as a synthesis wiki page. Use when a conversation produces an insight worth preserving — e.g., a detailed analysis of the user\'s sleep patterns or a personalized nutrition recommendation. Creates a synthesis page with 0.7 confidence.',
      schema: FileQueryAsWikiPageSchema,
      icon: 'archive',
      mutationType: 'create' as const,
      semanticDelta: (params: any) => `Filed Q&A: ${params.title}`,
      handler: withErrorHandling('fileQueryAsWikiPage', fileQueryAsWikiPage),
    },
  ];
}
