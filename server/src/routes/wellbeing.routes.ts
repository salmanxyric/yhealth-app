/**
 * @file Wellbeing Routes
 * @description API routes for Epic 07: Wellbeing Pillar
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { moodController } from '../controllers/wellbeing/mood.controller.js';
import { energyController } from '../controllers/wellbeing/energy.controller.js';
import { journalController } from '../controllers/wellbeing/journal.controller.js';
import { habitController } from '../controllers/wellbeing/habit.controller.js';
import { routineController } from '../controllers/wellbeing/routine.controller.js';
import { mindfulnessController } from '../controllers/wellbeing/mindfulness.controller.js';
import { breathingController } from '../controllers/wellbeing/breathing.controller.js';
import emotionalCheckInRoutes from './emotional-checkin.routes.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// F7.1: MOOD CHECK-INS
// ============================================

/**
 * @route   POST /api/v1/wellbeing/mood
 * @desc    Log mood check-in
 * @access  Private
 */
router.post('/mood', moodController.createMoodLog);

/**
 * @route   GET /api/v1/wellbeing/mood
 * @desc    List mood records (paginated, date filtered)
 * @access  Private
 */
router.get('/mood', moodController.getMoodLogs);

/**
 * @route   GET /api/v1/wellbeing/mood/timeline
 * @desc    Get mood timeline data for visualization
 * @access  Private
 */
router.get('/mood/timeline', moodController.getMoodTimeline);

/**
 * @route   GET /api/v1/wellbeing/mood/patterns
 * @desc    Get mood pattern insights
 * @access  Private
 */
router.get('/mood/patterns', moodController.getMoodPatterns);

// ============================================
// F7.4: ENERGY LEVEL MONITORING
// ============================================

/**
 * @route   POST /api/v1/wellbeing/energy
 * @desc    Log energy level
 * @access  Private
 */
router.post('/energy', energyController.createEnergyLog);

/**
 * @route   GET /api/v1/wellbeing/energy
 * @desc    List energy records (paginated, date filtered)
 * @access  Private
 */
router.get('/energy', energyController.getEnergyLogs);

/**
 * @route   GET /api/v1/wellbeing/energy/timeline
 * @desc    Get energy timeline data for visualization
 * @access  Private
 */
router.get('/energy/timeline', energyController.getEnergyTimeline);

/**
 * @route   GET /api/v1/wellbeing/energy/patterns
 * @desc    Get energy pattern insights
 * @access  Private
 */
router.get('/energy/patterns', energyController.getEnergyPatterns);

/**
 * @route   GET /api/v1/wellbeing/energy/:id
 * @desc    Get single energy log by ID
 * @access  Private
 */
router.get('/energy/:id', energyController.getEnergyLogById);

/**
 * @route   PUT /api/v1/wellbeing/energy/:id
 * @desc    Update energy log
 * @access  Private
 */
router.put('/energy/:id', energyController.updateEnergyLog);

/**
 * @route   DELETE /api/v1/wellbeing/energy/:id
 * @desc    Delete energy log
 * @access  Private
 */
router.delete('/energy/:id', energyController.deleteEnergyLog);

// ============================================
// F7.2: DAILY JOURNALING
// ============================================

/**
 * @route   GET /api/v1/wellbeing/journal/prompts
 * @desc    Get recommended journal prompts
 * @access  Private
 */
router.get('/journal/prompts', journalController.getPrompts);

/**
 * @route   POST /api/v1/wellbeing/journal
 * @desc    Create journal entry
 * @access  Private
 */
router.post('/journal', journalController.createEntry);

/**
 * @route   GET /api/v1/wellbeing/journal
 * @desc    List journal entries (paginated)
 * @access  Private
 */
router.get('/journal', journalController.getEntries);

/**
 * @route   GET /api/v1/wellbeing/journal/streak
 * @desc    Get journal streak information
 * @access  Private
 */
router.get('/journal/streak', journalController.getStreak);

/**
 * @route   GET /api/v1/wellbeing/journal/:id
 * @desc    Get single journal entry
 * @access  Private
 */
router.get('/journal/:id', journalController.getEntry);

/**
 * @route   PUT /api/v1/wellbeing/journal/:id
 * @desc    Update journal entry
 * @access  Private
 */
router.put('/journal/:id', journalController.updateEntry);

/**
 * @route   DELETE /api/v1/wellbeing/journal/:id
 * @desc    Delete journal entry
 * @access  Private
 */
router.delete('/journal/:id', journalController.deleteEntry);

/**
 * @route   GET /api/v1/wellbeing/journal/export
 * @desc    Export journal entries (text or JSON)
 * @access  Private
 */
router.get('/journal/export', journalController.exportEntries);

// ============================================
// F7.3: HABIT TRACKING
// ============================================

/**
 * @route   GET /api/v1/wellbeing/habits
 * @desc    List user habits
 * @access  Private
 */
router.get('/habits', habitController.getHabits);

/**
 * @route   POST /api/v1/wellbeing/habits
 * @desc    Create new habit
 * @access  Private
 */
router.post('/habits', habitController.createHabit);

/**
 * @route   GET /api/v1/wellbeing/habits/:id
 * @desc    Get single habit
 * @access  Private
 */
router.get('/habits/:id', habitController.getHabit);

/**
 * @route   PUT /api/v1/wellbeing/habits/:id
 * @desc    Update habit
 * @access  Private
 */
router.put('/habits/:id', habitController.updateHabit);

/**
 * @route   DELETE /api/v1/wellbeing/habits/:id
 * @desc    Delete habit
 * @access  Private
 */
router.delete('/habits/:id', habitController.deleteHabit);

/**
 * @route   POST /api/v1/wellbeing/habits/:id/log
 * @desc    Log habit completion
 * @access  Private
 */
router.post('/habits/:id/log', habitController.logCompletion);

/**
 * @route   GET /api/v1/wellbeing/habits/:id/logs
 * @desc    Get habit logs
 * @access  Private
 */
router.get('/habits/:id/logs', habitController.getLogs);

/**
 * @route   GET /api/v1/wellbeing/habits/:id/analytics
 * @desc    Get habit analytics and correlations
 * @access  Private
 */
router.get('/habits/:id/analytics', habitController.getAnalytics);

// ============================================
// F7.6: WELLBEING ROUTINES
// ============================================

/**
 * @route   GET /api/v1/wellbeing/routines/templates
 * @desc    Get pre-built routine templates
 * @access  Private
 */
router.get('/routines/templates', routineController.getTemplates);

/**
 * @route   POST /api/v1/wellbeing/routines
 * @desc    Create routine
 * @access  Private
 */
router.post('/routines', routineController.createRoutine);

/**
 * @route   GET /api/v1/wellbeing/routines
 * @desc    Get user routines
 * @access  Private
 */
router.get('/routines', routineController.getRoutines);

/**
 * @route   GET /api/v1/wellbeing/routines/:id
 * @desc    Get single routine
 * @access  Private
 */
router.get('/routines/:id', routineController.getRoutine);

/**
 * @route   POST /api/v1/wellbeing/routines/:id/complete
 * @desc    Log routine completion
 * @access  Private
 */
router.post('/routines/:id/complete', routineController.completeRoutine);

/**
 * @route   GET /api/v1/wellbeing/routines/:id/progress
 * @desc    Get routine progress analytics
 * @access  Private
 */
router.get('/routines/:id/progress', routineController.getProgress);

// ============================================
// F7.7: MINDFULNESS RECOMMENDATIONS
// ============================================

/**
 * @route   GET /api/v1/wellbeing/mindfulness/practices
 * @desc    Get practice library
 * @access  Private
 */
router.get('/mindfulness/practices', mindfulnessController.getPractices);

/**
 * @route   GET /api/v1/wellbeing/mindfulness/recommend
 * @desc    Get AI recommendation
 * @access  Private
 */
router.get('/mindfulness/recommend', mindfulnessController.getRecommendation);

/**
 * @route   POST /api/v1/wellbeing/mindfulness/log
 * @desc    Log practice completion
 * @access  Private
 */
router.post('/mindfulness/log', mindfulnessController.logPractice);

/**
 * @route   GET /api/v1/wellbeing/mindfulness/history
 * @desc    Get practice history
 * @access  Private
 */
router.get('/mindfulness/history', mindfulnessController.getHistory);

// ============================================
// F7.8: BREATHING TESTS / LUNG HEALTH
// ============================================

/**
 * @route   POST /api/v1/wellbeing/breathing
 * @desc    Save a breathing test result
 * @access  Private
 */
router.post('/breathing', breathingController.createBreathingTest);

/**
 * @route   GET /api/v1/wellbeing/breathing
 * @desc    Get breathing test history (paginated)
 * @access  Private
 */
router.get('/breathing', breathingController.getBreathingTests);

/**
 * @route   GET /api/v1/wellbeing/breathing/timeline
 * @desc    Get breathing timeline data for visualization
 * @access  Private
 */
router.get('/breathing/timeline', breathingController.getBreathingTimeline);

/**
 * @route   GET /api/v1/wellbeing/breathing/stats
 * @desc    Get breathing statistics and insights
 * @access  Private
 */
router.get('/breathing/stats', breathingController.getBreathingStats);

/**
 * @route   GET /api/v1/wellbeing/breathing/:id
 * @desc    Get a single breathing test by ID
 * @access  Private
 */
router.get('/breathing/:id', breathingController.getBreathingTestById);

/**
 * @route   DELETE /api/v1/wellbeing/breathing/:id
 * @desc    Delete a breathing test
 * @access  Private
 */
router.delete('/breathing/:id', breathingController.deleteBreathingTest);

// ============================================
// EMOTIONAL CHECK-IN SESSIONS
// ============================================

/**
 * @route   /api/v1/wellbeing/emotional-checkin/*
 * @desc    Emotional check-in screening sessions
 * @access  Private
 */
router.use('/emotional-checkin', emotionalCheckInRoutes);

export default router;

