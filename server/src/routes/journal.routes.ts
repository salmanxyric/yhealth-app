/**
 * @file Journal Routes
 * @description API routes for the AI Wellness Journaling System
 * New route group: /api/v1/journal/*
 * Extends existing wellbeing journal endpoints with daily check-ins, life goals, and insights
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { dailyCheckinController } from '../controllers/wellbeing/daily-checkin.controller.js';
import { lifeGoalsController } from '../controllers/wellbeing/life-goals.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// DAILY CHECK-IN
// ============================================

/**
 * @route   POST /api/v1/journal/checkin
 * @desc    Create or update today's daily check-in
 * @access  Private
 */
router.post('/checkin', dailyCheckinController.createOrUpdate);

/**
 * @route   GET /api/v1/journal/checkin/today
 * @desc    Get today's check-in (or null if not done)
 * @access  Private
 */
router.get('/checkin/today', dailyCheckinController.getToday);

/**
 * @route   GET /api/v1/journal/checkin/history
 * @desc    Get check-in history (paginated)
 * @access  Private
 */
router.get('/checkin/history', dailyCheckinController.getHistory);

/**
 * @route   GET /api/v1/journal/checkin/streak
 * @desc    Get check-in streak info
 * @access  Private
 */
router.get('/checkin/streak', dailyCheckinController.getStreak);

// ============================================
// LIFE GOALS
// ============================================

/**
 * @route   POST /api/v1/journal/goals
 * @desc    Create a life goal
 * @access  Private
 */
router.post('/goals', lifeGoalsController.createGoal);

/**
 * @route   GET /api/v1/journal/goals
 * @desc    List life goals
 * @access  Private
 */
router.get('/goals', lifeGoalsController.getGoals);

/**
 * @route   GET /api/v1/journal/goals/:id
 * @desc    Get a single life goal
 * @access  Private
 */
router.get('/goals/:id', lifeGoalsController.getGoal);

/**
 * @route   PUT /api/v1/journal/goals/:id
 * @desc    Update a life goal
 * @access  Private
 */
router.put('/goals/:id', lifeGoalsController.updateGoal);

/**
 * @route   DELETE /api/v1/journal/goals/:id
 * @desc    Delete a life goal
 * @access  Private
 */
router.delete('/goals/:id', lifeGoalsController.deleteGoal);

/**
 * @route   GET /api/v1/journal/goals/:id/entries
 * @desc    Get journal entries linked to a goal
 * @access  Private
 */
router.get('/goals/:id/entries', lifeGoalsController.getGoalEntries);

// ============================================
// DAILY INTENTIONS
// ============================================

/**
 * @route   POST /api/v1/journal/intentions
 * @desc    Set today's intention
 * @access  Private
 */
router.post('/intentions', lifeGoalsController.setIntention);

/**
 * @route   GET /api/v1/journal/intentions/today
 * @desc    Get today's intention
 * @access  Private
 */
router.get('/intentions/today', lifeGoalsController.getTodayIntention);

/**
 * @route   PUT /api/v1/journal/intentions/:id
 * @desc    Update intention (mark fulfilled, add reflection)
 * @access  Private
 */
router.put('/intentions/:id', lifeGoalsController.updateIntention);

export default router;
