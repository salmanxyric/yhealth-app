/**
 * @file Wiki Controller
 * @description API endpoints for the Personal Health Wiki.
 * Manages wiki pages, links, versions, search, and feedback.
 * Mounted at /api/v1/wiki
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { wikiService } from '../services/wiki.service.js';
import {
  createWikiPageSchema,
  updateWikiPageSchema,
  createWikiLinkSchema,
  listWikiPagesQuerySchema,
  searchWikiQuerySchema,
  flagWikiPageSchema,
  wikiPageFeedbackSchema,
} from '../validators/wiki.validator.js';

class WikiController {

  // ============================================
  // PAGES
  // ============================================

  listPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const filters = listWikiPagesQuerySchema.parse(req.query);
    const result = await wikiService.listPages(userId, filters);

    ApiResponse.success(res, result, 'Wiki pages retrieved', 200, req);
  });

  getPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    const page = await wikiService.getPage(userId, slug);
    if (!page) throw ApiError.notFound('Wiki page not found');

    ApiResponse.success(res, page, 'Wiki page retrieved', 200, req);
  });

  createPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const data = createWikiPageSchema.parse(req.body);
    const page = await wikiService.createPage(userId, data);

    ApiResponse.success(res, page, 'Wiki page created', 201, req);
  });

  updatePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    const data = updateWikiPageSchema.parse(req.body);
    const page = await wikiService.updatePage(userId, slug, data);

    ApiResponse.success(res, page, 'Wiki page updated', 200, req);
  });

  archivePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    await wikiService.archivePage(userId, slug);

    ApiResponse.success(res, null, 'Wiki page archived', 200, req);
  });

  // ============================================
  // SEARCH
  // ============================================

  searchPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { q, ...filters } = searchWikiQuerySchema.parse(req.query);
    const results = await wikiService.searchPages(userId, q, filters);

    ApiResponse.success(res, results, 'Search results retrieved', 200, req);
  });

  getRelated = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    const links = await wikiService.getLinks(userId, slug);

    ApiResponse.success(res, links, 'Related pages retrieved', 200, req);
  });

  // ============================================
  // STATS & ORPHANS
  // ============================================

  getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const stats = await wikiService.getStats(userId);

    ApiResponse.success(res, stats, 'Wiki stats retrieved', 200, req);
  });

  getOrphans = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const orphans = await wikiService.getOrphans(userId);

    ApiResponse.success(res, orphans, 'Orphan pages retrieved', 200, req);
  });

  // ============================================
  // VERSIONS
  // ============================================

  getVersions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    const versions = await wikiService.getVersions(userId, slug);

    ApiResponse.success(res, versions, 'Page versions retrieved', 200, req);
  });

  getVersion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug, version } = req.params;
    const versionData = await wikiService.getVersion(userId, slug, parseInt(version, 10));
    if (!versionData) throw ApiError.notFound('Version not found');

    ApiResponse.success(res, versionData, 'Page version retrieved', 200, req);
  });

  // ============================================
  // LOG
  // ============================================

  getLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const log = await wikiService.getLog(userId, limit);

    ApiResponse.success(res, log, 'Wiki log retrieved', 200, req);
  });

  // ============================================
  // LINKS
  // ============================================

  createLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const data = createWikiLinkSchema.parse(req.body);
    const link = await wikiService.createLink(userId, data);

    ApiResponse.success(res, link, 'Wiki link created', 201, req);
  });

  getPageLinks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    const links = await wikiService.getLinks(userId, slug);

    ApiResponse.success(res, links, 'Page links retrieved', 200, req);
  });

  // ============================================
  // FLAG & FEEDBACK
  // ============================================

  flagPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    const { reason } = flagWikiPageSchema.parse(req.body);
    await wikiService.logOperation(userId, {
      operation: 'update',
      pageIds: [],
      summary: `Page flagged: ${slug} — ${reason}`,
      details: { slug, reason },
      pagesTouched: 1,
    });

    ApiResponse.success(res, null, 'Page flagged', 200, req);
  });

  submitFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { slug } = req.params;
    const data = wikiPageFeedbackSchema.parse(req.body);
    await wikiService.logOperation(userId, {
      operation: 'update',
      pageIds: [],
      summary: `Feedback submitted for: ${slug}`,
      details: { slug, ...data },
      pagesTouched: 1,
    });

    ApiResponse.success(res, null, 'Feedback submitted', 200, req);
  });
}

export const wikiController = new WikiController();
