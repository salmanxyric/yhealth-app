/**
 * @file Wiki Service
 * @description Core CRUD, search, versioning, and link management for the LLM Wiki layer.
 * Provides per-user persistent knowledge base operations.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import type {
  WikiPage,
  WikiPageWithLinks,
  WikiLink,
  WikiPageVersion,
  WikiLogEntry,
  WikiStats,
  WikiSearchResult,
  WikiSearchFilters,
  CreateWikiPageInput,
  UpdateWikiPageInput,
  CreateWikiLinkInput,
  CreateWikiPageSourceInput,
  WikiLogOperation,
} from '@shared/types/domain/wiki.js';

type QueryParam = string | number | boolean | null | Date | object;

// ============================================
// TABLE EXISTENCE CACHE
// ============================================

let wikiTableExistsCache: boolean | null = null;

async function hasWikiTable(): Promise<boolean> {
  if (wikiTableExistsCache !== null) return wikiTableExistsCache;
  const result = await query<{ exists: boolean }>(
    `SELECT to_regclass('public.wiki_pages') IS NOT NULL AS exists`,
    []
  );
  wikiTableExistsCache = Boolean(result.rows[0]?.exists);
  return wikiTableExistsCache;
}

function isMissingWikiTable(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('wiki_pages') ||
      (error as Error & { code?: string }).code === '42P01')
  );
}

// ============================================
// ROW MAPPERS
// ============================================

function mapPageRow(row: Record<string, unknown>): WikiPage {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    slug: row.slug as string,
    pageType: row.page_type as WikiPage['pageType'],
    category: row.category as string,
    title: row.title as string,
    summary: row.summary as string,
    body: row.body as string,
    frontmatter: (row.frontmatter as Record<string, unknown>) || {},
    confidence: row.confidence as number,
    evidenceCount: row.evidence_count as number,
    wordCount: row.word_count as number,
    status: row.status as WikiPage['status'],
    version: row.version as number,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    lastLintAt: row.last_lint_at ? (row.last_lint_at as Date).toISOString() : null,
    staleAfterDays: row.stale_after_days as number,
  };
}

function mapLinkRow(row: Record<string, unknown>): WikiLink {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    sourcePageId: row.source_page_id as string,
    targetPageId: row.target_page_id as string,
    sourceSlug: (row.source_slug as string) || undefined,
    targetSlug: (row.target_slug as string) || undefined,
    sourceTitle: (row.source_title as string) || undefined,
    targetTitle: (row.target_title as string) || undefined,
    linkType: row.link_type as WikiLink['linkType'],
    context: (row.context as string) || null,
    anchorText: (row.anchor_text as string) || null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function mapVersionRow(row: Record<string, unknown>): WikiPageVersion {
  return {
    id: row.id as string,
    pageId: row.page_id as string,
    version: row.version as number,
    title: row.title as string,
    summary: row.summary as string,
    body: row.body as string,
    frontmatter: (row.frontmatter as Record<string, unknown>) || {},
    confidence: row.confidence as number,
    evidenceCount: row.evidence_count as number,
    changeReason: (row.change_reason as string) || null,
    triggerType: (row.trigger_type as string) || null,
    triggerId: (row.trigger_id as string) || null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function mapLogRow(row: Record<string, unknown>): WikiLogEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    operation: row.operation as WikiLogOperation,
    pageIds: (row.page_ids as string[]) || [],
    sourceType: (row.source_type as string) || null,
    sourceId: (row.source_id as string) || null,
    conversationId: (row.conversation_id as string) || null,
    summary: row.summary as string,
    details: (row.details as Record<string, unknown>) || {},
    pagesTouched: row.pages_touched as number,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

// ============================================
// HELPERS
// ============================================

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseWikiLinks(body: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const slugs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    const slug = match[1].trim();
    if (slug && !slugs.includes(slug)) {
      slugs.push(slug);
    }
  }
  return slugs;
}

// ============================================
// WIKI SERVICE CLASS
// ============================================

class WikiService {
  // ------------------------------------------
  // PAGES
  // ------------------------------------------

  async createPage(userId: string, input: CreateWikiPageInput): Promise<WikiPage> {
    const wordCount = countWords(input.body || '');
    const frontmatter = input.frontmatter ?? {};
    const confidence = input.confidence ?? 0.5;

    const result = await query<Record<string, unknown>>(
      `INSERT INTO wiki_pages (user_id, slug, page_type, category, title, summary, body, frontmatter, confidence, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, input.slug, input.pageType, input.category, input.title, input.summary, input.body, JSON.stringify(frontmatter), confidence, wordCount]
    );

    const page = mapPageRow(result.rows[0]);

    // Add sources if provided
    if (input.sources && input.sources.length > 0) {
      await this.addSources(page.id, input.sources);
    }

    logger.info(`Wiki page created: ${page.slug}`, { userId, pageId: page.id });
    return page;
  }

  async getPage(userId: string, slug: string): Promise<WikiPageWithLinks | null> {
    const pageResult = await query<Record<string, unknown>>(
      `SELECT * FROM wiki_pages WHERE user_id = $1 AND slug = $2`,
      [userId, slug]
    );

    if (pageResult.rows.length === 0) return null;

    const page = mapPageRow(pageResult.rows[0]);

    const [outboundResult, inboundResult] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT l.*, sp.slug AS source_slug, sp.title AS source_title, tp.slug AS target_slug, tp.title AS target_title
         FROM wiki_links l
         JOIN wiki_pages sp ON sp.id = l.source_page_id
         JOIN wiki_pages tp ON tp.id = l.target_page_id
         WHERE l.source_page_id = $1`,
        [page.id]
      ),
      query<Record<string, unknown>>(
        `SELECT l.*, sp.slug AS source_slug, sp.title AS source_title, tp.slug AS target_slug, tp.title AS target_title
         FROM wiki_links l
         JOIN wiki_pages sp ON sp.id = l.source_page_id
         JOIN wiki_pages tp ON tp.id = l.target_page_id
         WHERE l.target_page_id = $1`,
        [page.id]
      ),
    ]);

    return {
      ...page,
      outboundLinks: outboundResult.rows.map(mapLinkRow),
      inboundLinks: inboundResult.rows.map(mapLinkRow),
    };
  }

  async updatePage(userId: string, slug: string, input: UpdateWikiPageInput): Promise<WikiPage> {
    // Fetch current page
    const currentResult = await query<Record<string, unknown>>(
      `SELECT * FROM wiki_pages WHERE user_id = $1 AND slug = $2`,
      [userId, slug]
    );

    if (currentResult.rows.length === 0) {
      throw new Error(`Wiki page not found: ${slug}`);
    }

    const current = currentResult.rows[0];

    // Save version snapshot BEFORE applying update
    await query(
      `INSERT INTO wiki_page_versions (page_id, version, title, summary, body, frontmatter, confidence, evidence_count, change_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        current.id as string,
        current.version as number,
        current.title as string,
        current.summary as string,
        current.body as string,
        JSON.stringify((current.frontmatter as object) || {}),
        current.confidence as number,
        current.evidence_count as number,
        input.changeReason,
      ]
    );

    // Build dynamic update
    const sets: string[] = ['version = version + 1'];
    const params: QueryParam[] = [userId, slug];
    let paramIdx = 3;

    if (input.title !== undefined) {
      sets.push(`title = $${paramIdx++}`);
      params.push(input.title);
    }
    if (input.summary !== undefined) {
      sets.push(`summary = $${paramIdx++}`);
      params.push(input.summary);
    }
    if (input.body !== undefined) {
      sets.push(`body = $${paramIdx++}`);
      params.push(input.body);
      sets.push(`word_count = $${paramIdx++}`);
      params.push(countWords(input.body));
    }
    if (input.frontmatter !== undefined) {
      sets.push(`frontmatter = $${paramIdx++}`);
      params.push(JSON.stringify(input.frontmatter));
    }
    if (input.confidence !== undefined) {
      sets.push(`confidence = $${paramIdx++}`);
      params.push(input.confidence);
    }
    if (input.status !== undefined) {
      sets.push(`status = $${paramIdx++}`);
      params.push(input.status);
    }

    const result = await query<Record<string, unknown>>(
      `UPDATE wiki_pages SET ${sets.join(', ')} WHERE user_id = $1 AND slug = $2 RETURNING *`,
      params
    );

    const page = mapPageRow(result.rows[0]);
    logger.info(`Wiki page updated: ${slug} -> v${page.version}`, { userId, pageId: page.id });
    return page;
  }

  async archivePage(userId: string, slug: string): Promise<void> {
    const result = await query(
      `UPDATE wiki_pages SET status = 'archived' WHERE user_id = $1 AND slug = $2`,
      [userId, slug]
    );

    if ((result as { rowCount: number }).rowCount === 0) {
      throw new Error(`Wiki page not found: ${slug}`);
    }

    logger.info(`Wiki page archived: ${slug}`, { userId });
  }

  async listPages(
    userId: string,
    filters: WikiSearchFilters
  ): Promise<{ data: WikiPage[]; total: number }> {
    const conditions: string[] = ['user_id = $1'];
    const params: QueryParam[] = [userId];
    let paramIdx = 2;

    if (filters.pageType) {
      conditions.push(`page_type = $${paramIdx++}`);
      params.push(filters.pageType);
    }
    if (filters.category) {
      conditions.push(`category = $${paramIdx++}`);
      params.push(filters.category);
    }
    if (filters.status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(filters.status);
    } else {
      // Filter out archived by default
      conditions.push(`status != 'archived'`);
    }
    if (filters.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramIdx++}`);
      params.push(filters.minConfidence);
    }

    const where = conditions.join(' AND ');

    const sortColumn = filters.sort || 'updated_at';
    const sortOrder = filters.order || 'desc';
    const limit = filters.limit || 20;
    const offset = ((filters.page || 1) - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT * FROM wiki_pages WHERE ${where} ORDER BY ${sortColumn} ${sortOrder} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset] as QueryParam[]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM wiki_pages WHERE ${where}`,
        params
      ),
    ]);

    return {
      data: dataResult.rows.map(mapPageRow),
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  // ------------------------------------------
  // SEARCH
  // ------------------------------------------

  async searchPages(
    userId: string,
    queryText: string,
    filters?: WikiSearchFilters
  ): Promise<WikiSearchResult[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: QueryParam[] = [userId];
    let paramIdx = 2;

    if (filters?.status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(filters.status);
    } else {
      conditions.push(`status != 'archived'`);
    }

    const pattern = `%${queryText}%`;
    const patternParam = paramIdx;
    conditions.push(`(title ILIKE $${patternParam} OR summary ILIKE $${patternParam} OR body ILIKE $${patternParam})`);
    params.push(pattern);
    paramIdx++;

    if (filters?.pageType) {
      conditions.push(`page_type = $${paramIdx++}`);
      params.push(filters.pageType);
    }
    if (filters?.category) {
      conditions.push(`category = $${paramIdx++}`);
      params.push(filters.category);
    }
    if (filters?.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramIdx++}`);
      params.push(filters.minConfidence);
    }

    const limit = filters?.limit || 20;
    const where = conditions.join(' AND ');

    const result = await query<Record<string, unknown>>(
      `SELECT *,
              CASE
                WHEN title ILIKE $${patternParam} THEN 1.0
                WHEN summary ILIKE $${patternParam} THEN 0.8
                ELSE 0.5
              END AS similarity
       FROM wiki_pages
       WHERE ${where}
       ORDER BY similarity DESC, updated_at DESC
       LIMIT $${paramIdx}`,
      [...params, limit] as QueryParam[]
    );

    return result.rows.map((row) => ({
      page: mapPageRow(row),
      similarity: row.similarity as number,
      matchContext: null,
    }));
  }

  // ------------------------------------------
  // LINKS
  // ------------------------------------------

  async createLink(userId: string, input: CreateWikiLinkInput): Promise<WikiLink> {
    // Resolve slugs to page IDs
    const slugMap = await this.resolveLinks(userId, [input.sourceSlug, input.targetSlug]);
    const sourcePageId = slugMap.get(input.sourceSlug);
    const targetPageId = slugMap.get(input.targetSlug);

    if (!sourcePageId) throw new Error(`Source page not found: ${input.sourceSlug}`);
    if (!targetPageId) throw new Error(`Target page not found: ${input.targetSlug}`);

    const result = await query<Record<string, unknown>>(
      `INSERT INTO wiki_links (user_id, source_page_id, target_page_id, link_type, context, anchor_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (source_page_id, target_page_id, link_type)
       DO UPDATE SET context = EXCLUDED.context, anchor_text = EXCLUDED.anchor_text
       RETURNING *`,
      [userId, sourcePageId, targetPageId, input.linkType, input.context || null, input.anchorText || null]
    );

    const link = mapLinkRow(result.rows[0]);
    logger.info(`Wiki link created: ${input.sourceSlug} -> ${input.targetSlug}`, { userId, linkType: input.linkType });
    return link;
  }

  async getLinks(
    userId: string,
    slug: string
  ): Promise<{ outbound: WikiLink[]; inbound: WikiLink[] }> {
    const pageResult = await query<{ id: string }>(
      `SELECT id FROM wiki_pages WHERE user_id = $1 AND slug = $2`,
      [userId, slug]
    );

    if (pageResult.rows.length === 0) {
      throw new Error(`Wiki page not found: ${slug}`);
    }

    const pageId = pageResult.rows[0].id;

    const [outboundResult, inboundResult] = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT l.*, sp.slug AS source_slug, sp.title AS source_title, tp.slug AS target_slug, tp.title AS target_title
         FROM wiki_links l
         JOIN wiki_pages sp ON sp.id = l.source_page_id
         JOIN wiki_pages tp ON tp.id = l.target_page_id
         WHERE l.source_page_id = $1`,
        [pageId]
      ),
      query<Record<string, unknown>>(
        `SELECT l.*, sp.slug AS source_slug, sp.title AS source_title, tp.slug AS target_slug, tp.title AS target_title
         FROM wiki_links l
         JOIN wiki_pages sp ON sp.id = l.source_page_id
         JOIN wiki_pages tp ON tp.id = l.target_page_id
         WHERE l.target_page_id = $1`,
        [pageId]
      ),
    ]);

    return {
      outbound: outboundResult.rows.map(mapLinkRow),
      inbound: inboundResult.rows.map(mapLinkRow),
    };
  }

  async getOrphans(userId: string): Promise<WikiPage[]> {
    const result = await query<Record<string, unknown>>(
      `SELECT p.* FROM wiki_pages p
       WHERE p.user_id = $1
         AND p.status != 'archived'
         AND NOT EXISTS (
           SELECT 1 FROM wiki_links l WHERE l.target_page_id = p.id
         )
       ORDER BY p.updated_at DESC`,
      [userId]
    );

    return result.rows.map(mapPageRow);
  }

  // ------------------------------------------
  // SOURCES
  // ------------------------------------------

  async addSources(pageId: string, sources: CreateWikiPageSourceInput[]): Promise<void> {
    if (sources.length === 0) return;

    const values: string[] = [];
    const params: QueryParam[] = [];
    let paramIdx = 1;

    for (const src of sources) {
      values.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
      );
      params.push(
        pageId,
        src.sourceType,
        src.sourceId,
        src.sourceTable,
        src.dateRangeStart || null,
        src.dateRangeEnd || null,
        src.rowCount ?? null,
        src.extractSummary || null
      );
    }

    await query(
      `INSERT INTO wiki_page_sources (page_id, source_type, source_id, source_table, date_range_start, date_range_end, row_count, extract_summary)
       VALUES ${values.join(', ')}
       ON CONFLICT (page_id, source_type, source_id)
       DO UPDATE SET
         date_range_start = EXCLUDED.date_range_start,
         date_range_end = EXCLUDED.date_range_end,
         row_count = EXCLUDED.row_count,
         extract_summary = EXCLUDED.extract_summary`,
      params
    );

    logger.debug(`Added ${sources.length} sources to page ${pageId}`);
  }

  // ------------------------------------------
  // VERSIONING
  // ------------------------------------------

  async getVersions(userId: string, slug: string): Promise<WikiPageVersion[]> {
    const result = await query<Record<string, unknown>>(
      `SELECT v.* FROM wiki_page_versions v
       JOIN wiki_pages p ON p.id = v.page_id
       WHERE p.user_id = $1 AND p.slug = $2
       ORDER BY v.version DESC`,
      [userId, slug]
    );

    return result.rows.map(mapVersionRow);
  }

  async getVersion(userId: string, slug: string, version: number): Promise<WikiPageVersion | null> {
    const result = await query<Record<string, unknown>>(
      `SELECT v.* FROM wiki_page_versions v
       JOIN wiki_pages p ON p.id = v.page_id
       WHERE p.user_id = $1 AND p.slug = $2 AND v.version = $3`,
      [userId, slug, version]
    );

    if (result.rows.length === 0) return null;
    return mapVersionRow(result.rows[0]);
  }

  // ------------------------------------------
  // LOG
  // ------------------------------------------

  async logOperation(
    userId: string,
    entry: {
      operation: WikiLogOperation;
      pageIds?: string[];
      sourceType?: string;
      sourceId?: string;
      conversationId?: string;
      summary: string;
      details?: Record<string, unknown>;
      pagesTouched?: number;
    }
  ): Promise<void> {
    await query(
      `INSERT INTO wiki_log (user_id, operation, page_ids, source_type, source_id, conversation_id, summary, details, pages_touched)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        entry.operation,
        entry.pageIds || [],
        entry.sourceType || null,
        entry.sourceId || null,
        entry.conversationId || null,
        entry.summary,
        JSON.stringify(entry.details || {}),
        entry.pagesTouched || 0,
      ]
    );
  }

  async getLog(userId: string, limit: number = 50): Promise<WikiLogEntry[]> {
    const result = await query<Record<string, unknown>>(
      `SELECT * FROM wiki_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(mapLogRow);
  }

  // ------------------------------------------
  // STATS
  // ------------------------------------------

  async getStats(userId: string): Promise<WikiStats> {
    if (!(await hasWikiTable())) {
      return emptyStats();
    }

    try {
      const [pagesResult, linksResult, sourcesResult, typeResult, categoryResult, orphanResult, logResult] =
        await Promise.all([
          query<Record<string, unknown>>(
            `SELECT
               COUNT(*) AS total,
               COUNT(*) FILTER (WHERE status = 'active') AS active,
               COUNT(*) FILTER (WHERE status = 'stale') AS stale,
               COUNT(*) FILTER (WHERE status = 'contradicted') AS contradicted
             FROM wiki_pages WHERE user_id = $1`,
            [userId]
          ),
          query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM wiki_links WHERE user_id = $1`,
            [userId]
          ),
          query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM wiki_page_sources s
             JOIN wiki_pages p ON p.id = s.page_id
             WHERE p.user_id = $1`,
            [userId]
          ),
          query<{ page_type: string; count: string }>(
            `SELECT page_type, COUNT(*) AS count FROM wiki_pages WHERE user_id = $1 AND status != 'archived' GROUP BY page_type`,
            [userId]
          ),
          query<{ category: string; count: string }>(
            `SELECT category, COUNT(*) AS count FROM wiki_pages WHERE user_id = $1 AND status != 'archived' GROUP BY category`,
            [userId]
          ),
          query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM wiki_pages p
             WHERE p.user_id = $1 AND p.status != 'archived'
             AND NOT EXISTS (SELECT 1 FROM wiki_links l WHERE l.target_page_id = p.id)`,
            [userId]
          ),
          query<{ last_ingest: Date | null; last_lint: Date | null }>(
            `SELECT
               MAX(CASE WHEN operation = 'ingest' THEN created_at END) AS last_ingest,
               MAX(CASE WHEN operation = 'lint' THEN created_at END) AS last_lint
             FROM wiki_log WHERE user_id = $1`,
            [userId]
          ),
        ]);

      const pages = pagesResult.rows[0];
      const countsByType: Record<string, number> = {};
      for (const row of typeResult.rows) {
        countsByType[row.page_type] = parseInt(row.count, 10);
      }
      const countsByCategory: Record<string, number> = {};
      for (const row of categoryResult.rows) {
        countsByCategory[row.category] = parseInt(row.count, 10);
      }
      const logRow = logResult.rows[0];

      return {
        totalPages: parseInt(pages.total as string, 10),
        activePages: parseInt(pages.active as string, 10),
        stalePages: parseInt(pages.stale as string, 10),
        contradictedPages: parseInt(pages.contradicted as string, 10),
        orphanPages: parseInt(orphanResult.rows[0].count, 10),
        totalLinks: parseInt(linksResult.rows[0].count, 10),
        totalSources: parseInt(sourcesResult.rows[0].count, 10),
        countsByType: countsByType as WikiStats['countsByType'],
        countsByCategory,
        lastIngestAt: logRow?.last_ingest ? (logRow.last_ingest as Date).toISOString() : null,
        lastLintAt: logRow?.last_lint ? (logRow.last_lint as Date).toISOString() : null,
      };
    } catch (error) {
      if (isMissingWikiTable(error)) {
        wikiTableExistsCache = false;
        return emptyStats();
      }
      throw error;
    }
  }

  // ------------------------------------------
  // HELPERS (public)
  // ------------------------------------------

  parseWikiLinks(body: string): string[] {
    return parseWikiLinks(body);
  }

  async resolveLinks(userId: string, slugs: string[]): Promise<Map<string, string>> {
    if (slugs.length === 0) return new Map();

    const placeholders = slugs.map((_, i) => `$${i + 2}`).join(', ');
    const result = await query<{ slug: string; id: string }>(
      `SELECT slug, id FROM wiki_pages WHERE user_id = $1 AND slug IN (${placeholders})`,
      [userId, ...slugs]
    );

    const map = new Map<string, string>();
    for (const row of result.rows) {
      map.set(row.slug, row.id);
    }
    return map;
  }

  countWords(text: string): number {
    return countWords(text);
  }
}

// ============================================
// EMPTY STATS HELPER
// ============================================

function emptyStats(): WikiStats {
  return {
    totalPages: 0,
    activePages: 0,
    stalePages: 0,
    contradictedPages: 0,
    orphanPages: 0,
    totalLinks: 0,
    totalSources: 0,
    countsByType: { entity: 0, concept: 0, pattern: 0, journal: 0, synthesis: 0, source: 0 },
    countsByCategory: {},
    lastIngestAt: null,
    lastLintAt: null,
  };
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiService = new WikiService();
