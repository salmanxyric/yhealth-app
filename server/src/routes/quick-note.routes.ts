/**
 * @file Quick Note Routes
 * @description User-scoped quick notes for fast capture and AI coach tools.
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { apiLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  createQuickNote,
  deleteQuickNote,
  getQuickNote,
  getQuickNotes,
  updateQuickNote,
} from '../controllers/quick-note.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', apiLimiter, getQuickNotes);
router.post('/', apiLimiter, createQuickNote);
router.get('/:id', apiLimiter, getQuickNote);
router.patch('/:id', apiLimiter, updateQuickNote);
router.delete('/:id', apiLimiter, deleteQuickNote);

export default router;
