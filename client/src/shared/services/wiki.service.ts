/**
 * @file Wiki Client Service
 * @description API service for the Personal Health Wiki (LLM Wiki layer).
 * Thin client matching server routes at /api/v1/wiki.
 */

import { api } from "@/lib/api-client";
import type {
  WikiPage,
  WikiPageWithLinks,
  WikiSearchResult,
  WikiStats,
  WikiLink,
  WikiLogEntry,
  WikiPageVersion,
  WikiPageType,
  WikiPageStatus,
} from "@shared/types/domain/wiki";

const BASE = "/v1/wiki";

// ============================================
// PAGES
// ============================================

export interface ListPagesParams {
  [key: string]: string | number | boolean | undefined;
  pageType?: WikiPageType;
  category?: string;
  status?: WikiPageStatus;
  minConfidence?: number;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export async function listPages(params: ListPagesParams = {}) {
  return api.get<{ data: WikiPage[]; total: number }>(`${BASE}/pages`, {
    params,
  });
}

export async function getPage(slug: string) {
  return api.get<WikiPageWithLinks>(`${BASE}/pages/${slug}`);
}

// ============================================
// SEARCH
// ============================================

export interface SearchPagesParams {
  [key: string]: string | number | boolean | undefined;
  pageType?: WikiPageType;
  category?: string;
  status?: WikiPageStatus;
  minConfidence?: number;
  limit?: number;
}

export async function searchPages(q: string, filters?: SearchPagesParams) {
  return api.get<WikiSearchResult[]>(`${BASE}/search`, {
    params: { q, ...filters },
  });
}

// ============================================
// STATS
// ============================================

export async function getStats() {
  return api.get<WikiStats>(`${BASE}/stats`);
}

// ============================================
// LINKS
// ============================================

export async function getPageLinks(slug: string) {
  return api.get<{ outbound: WikiLink[]; inbound: WikiLink[] }>(
    `${BASE}/pages/${slug}/links`,
  );
}

// ============================================
// VERSIONS
// ============================================

export async function getPageVersions(slug: string) {
  return api.get<WikiPageVersion[]>(`${BASE}/pages/${slug}/versions`);
}

// ============================================
// LOG
// ============================================

export async function getLog(limit?: number) {
  return api.get<WikiLogEntry[]>(`${BASE}/log`, {
    params: limit !== undefined ? { limit } : undefined,
  });
}

// ============================================
// FLAG & FEEDBACK
// ============================================

export async function flagPage(slug: string, reason: string) {
  return api.post<null>(`${BASE}/pages/${slug}/flag`, { reason });
}

export async function submitFeedback(
  slug: string,
  data: { action: string; correction?: string; comment?: string; details?: string },
) {
  const { details, ...payload } = data;
  return api.post<null>(`${BASE}/pages/${slug}/feedback`, {
    ...payload,
    comment: payload.comment ?? details,
  });
}
