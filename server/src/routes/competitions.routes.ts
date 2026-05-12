/**
 * @file Competitions Routes
 * @description API endpoints for competitions and shared challenges
 */

import { Router } from 'express';
import authenticate from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { competitionIdParamSchema } from '../validators/competitions.validator.js';
import {
  getActiveCompetitions,
  getCompetition,
  joinCompetition,
  leaveCompetition,
  getCompetitionLeaderboard,
  createCompetition,
  getAllCompetitions,
} from '../controllers/competitions.controller.js';
import {
  generateChallenge,
  createSharedCompetition,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  inviteToCompetition,
} from '../controllers/shared-challenge.controller.js';

const router = Router();

// --- Shared Challenge routes (must be before :id param routes) ---

router.post('/shared-challenge/generate', authenticate, generateChallenge);
router.post('/shared-challenge/create', authenticate, createSharedCompetition);
router.get('/invitations', authenticate, getPendingInvitations);
router.post('/invitations/:id/accept', authenticate, acceptInvitation);
router.post('/invitations/:id/decline', authenticate, declineInvitation);

// --- Public / optionally-authenticated GET routes ---

/**
 * GET /api/v1/competitions
 * Get active competitions (includes is_joined when authenticated)
 */
router.get('/', optionalAuth, getActiveCompetitions);

/**
 * GET /api/v1/competitions/active
 * Get active competitions (alias)
 */
router.get('/active', optionalAuth, getActiveCompetitions);

/**
 * GET /api/v1/competitions/:id
 * Get competition details
 */
router.get('/:id', optionalAuth, validate(competitionIdParamSchema, 'params'), getCompetition);

/**
 * GET /api/v1/competitions/:id/leaderboard
 * Get competition leaderboard
 */
router.get('/:id/leaderboard', optionalAuth, validate(competitionIdParamSchema, 'params'), getCompetitionLeaderboard);

// --- Authenticated action routes ---

router.post('/:id/join', authenticate, validate(competitionIdParamSchema, 'params'), joinCompetition);
router.delete('/:id/leave', authenticate, validate(competitionIdParamSchema, 'params'), leaveCompetition);
router.post('/:id/invite', authenticate, inviteToCompetition);

// Admin routes
router.post('/', authenticate, createCompetition);
router.get('/admin/all', authenticate, getAllCompetitions);

export default router;
