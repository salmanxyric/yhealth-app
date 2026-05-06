/**
 * @file Wiki Domain Types
 * @description Type definitions for the LLM Wiki layer — a persistent, compounding knowledge base
 * the AI maintains about each user within the AI Coach system.
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type WikiPageType = 'entity' | 'concept' | 'pattern' | 'journal' | 'synthesis' | 'source';

export type WikiPageStatus = 'active' | 'stale' | 'contradicted' | 'archived' | 'draft';

export type WikiLinkType = 'reference' | 'contradicts' | 'supports' | 'supersedes' | 'derived_from' | 'see_also';

export type WikiLogOperation =
  | 'ingest'
  | 'update'
  | 'create'
  | 'lint'
  | 'query_filed'
  | 'contradiction_detected'
  | 'stale_marked'
  | 'archived';

// ============================================
// WIKI PAGES
// ============================================

export interface WikiPage {
  id: string;
  userId: string;
  slug: string;
  pageType: WikiPageType;
  category: string;
  title: string;
  summary: string;
  body: string;
  frontmatter: Record<string, unknown>;
  confidence: number;
  evidenceCount: number;
  wordCount: number;
  status: WikiPageStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastLintAt: string | null;
  staleAfterDays: number;
}

export interface WikiPageWithLinks extends WikiPage {
  outboundLinks: WikiLink[];
  inboundLinks: WikiLink[];
}

// ============================================
// WIKI LINKS
// ============================================

export interface WikiLink {
  id: string;
  userId: string;
  sourcePageId: string;
  targetPageId: string;
  sourceSlug?: string;
  targetSlug?: string;
  sourceTitle?: string;
  targetTitle?: string;
  linkType: WikiLinkType;
  context: string | null;
  anchorText: string | null;
  createdAt: string;
}

// ============================================
// WIKI PAGE SOURCES
// ============================================

export interface WikiPageSource {
  id: string;
  pageId: string;
  sourceType: string;
  sourceId: string;
  sourceTable: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  rowCount: number | null;
  extractSummary: string | null;
  createdAt: string;
}

// ============================================
// WIKI LOG
// ============================================

export interface WikiLogEntry {
  id: string;
  userId: string;
  operation: WikiLogOperation;
  pageIds: string[];
  sourceType: string | null;
  sourceId: string | null;
  conversationId: string | null;
  summary: string;
  details: Record<string, unknown>;
  pagesTouched: number;
  createdAt: string;
}

// ============================================
// WIKI INDEX
// ============================================

export interface WikiIndex {
  id: string;
  userId: string;
  content: string;
  pageCount: number;
  countsByType: Record<WikiPageType, number>;
  countsByCategory: Record<string, number>;
  orphanCount: number;
  staleCount: number;
  contradictedCount: number;
  updatedAt: string;
}

// ============================================
// WIKI PAGE VERSIONS
// ============================================

export interface WikiPageVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  summary: string;
  body: string;
  frontmatter: Record<string, unknown>;
  confidence: number;
  evidenceCount: number;
  changeReason: string | null;
  triggerType: string | null;
  triggerId: string | null;
  createdAt: string;
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateWikiPageSourceInput {
  sourceType: string;
  sourceId: string;
  sourceTable: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  rowCount?: number;
  extractSummary?: string;
}

export interface CreateWikiPageInput {
  slug: string;
  pageType: WikiPageType;
  category: string;
  title: string;
  summary: string;
  body: string;
  frontmatter?: Record<string, unknown>;
  confidence?: number;
  sources?: CreateWikiPageSourceInput[];
}

export interface UpdateWikiPageInput {
  title?: string;
  summary?: string;
  body?: string;
  frontmatter?: Record<string, unknown>;
  confidence?: number;
  status?: WikiPageStatus;
  changeReason: string;
}

export interface CreateWikiLinkInput {
  sourceSlug: string;
  targetSlug: string;
  linkType: WikiLinkType;
  context?: string;
  anchorText?: string;
}

// ============================================
// SEARCH & FILTER
// ============================================

export interface WikiSearchFilters {
  pageType?: WikiPageType;
  category?: string;
  status?: WikiPageStatus;
  minConfidence?: number;
  page?: number;
  limit?: number;
  sort?: 'updated_at' | 'confidence' | 'title';
  order?: 'asc' | 'desc';
}

export interface WikiSearchResult {
  page: WikiPage;
  similarity: number;
  matchContext: string | null;
}

// ============================================
// STATS
// ============================================

export interface WikiStats {
  totalPages: number;
  activePages: number;
  stalePages: number;
  contradictedPages: number;
  orphanPages: number;
  totalLinks: number;
  totalSources: number;
  countsByType: Record<WikiPageType, number>;
  countsByCategory: Record<string, number>;
  lastIngestAt: string | null;
  lastLintAt: string | null;
}

// ============================================
// INGEST
// ============================================

export interface IngestResult {
  pagesCreated: number;
  pagesUpdated: number;
  linksAdded: number;
  logEntryId: string;
  pageIds: string[];
}
