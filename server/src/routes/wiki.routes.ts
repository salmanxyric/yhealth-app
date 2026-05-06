/**
 * @file Wiki Routes
 * @description API routes for the Personal Health Wiki
 * Mounted at /api/v1/wiki
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { wikiController } from '../controllers/wiki.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Pages
router.get('/pages', wikiController.listPages);
router.post('/pages', wikiController.createPage);
router.get('/pages/:slug', wikiController.getPage);
router.patch('/pages/:slug', wikiController.updatePage);
router.delete('/pages/:slug', wikiController.archivePage);

// Page versions
router.get('/pages/:slug/versions', wikiController.getVersions);
router.get('/pages/:slug/versions/:version', wikiController.getVersion);

// Page links
router.get('/pages/:slug/links', wikiController.getPageLinks);

// Page flag & feedback
router.post('/pages/:slug/flag', wikiController.flagPage);
router.post('/pages/:slug/feedback', wikiController.submitFeedback);

// Search
router.get('/search', wikiController.searchPages);
router.get('/search/related/:slug', wikiController.getRelated);

// Stats & orphans
router.get('/stats', wikiController.getStats);
router.get('/orphans', wikiController.getOrphans);

// Log
router.get('/log', wikiController.getLog);

// Links
router.post('/links', wikiController.createLink);

export default router;
