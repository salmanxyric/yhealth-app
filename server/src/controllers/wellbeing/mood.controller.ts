/**
 * @file Mood Controller
 * @description API endpoints for mood check-ins (F7.1)
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { moodService } from '../../services/wellbeing/mood.service.js';

class MoodController {
  /**
   * @route   POST /api/v1/wellbeing/mood
   * @desc    Log mood check-in
   * @access  Private
   */
  createMoodLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const {
      mood_emoji,
      descriptor,
      happiness_rating,
      energy_rating,
      stress_rating,
      anxiety_rating,
      emotion_tags,
      context_note,
      mode,
      logged_at,
    } = req.body;

    if (!mode || !['light', 'deep'].includes(mode)) {
      throw ApiError.badRequest('Mode must be either "light" or "deep"');
    }

    const moodLog = await moodService.createMoodLog(userId, {
      moodEmoji: mood_emoji,
      descriptor,
      happinessRating: happiness_rating,
      energyRating: energy_rating,
      stressRating: stress_rating,
      anxietyRating: anxiety_rating,
      emotionTags: emotion_tags,
      contextNote: context_note,
      mode,
      loggedAt: logged_at,
    });

    ApiResponse.success(
      res,
      { moodLog },
      {
        message: 'Mood check-in logged successfully',
        statusCode: 201,
      },
      undefined,
      req
    );
  });

  /**
   * @route   GET /api/v1/wellbeing/mood
   * @desc    List mood records
   * @access  Private
   */
  getMoodLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await moodService.getMoodLogs(userId, {
      startDate,
      endDate,
      page,
      limit,
    });

    ApiResponse.success(res, result, 'Mood logs retrieved successfully', undefined, req);
  });

  /**
   * @route   GET /api/v1/wellbeing/mood/timeline
   * @desc    Get mood timeline data for visualization
   * @access  Private
   */
  getMoodTimeline = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      throw ApiError.badRequest('startDate and endDate query parameters are required');
    }

    const timeline = await moodService.getMoodTimeline(userId, startDate, endDate);

    ApiResponse.success(res, { timeline }, 'Mood timeline retrieved successfully', undefined, req);
  });

  /**
   * @route   GET /api/v1/wellbeing/mood/patterns
   * @desc    Get mood patterns and insights
   * @access  Private
   */
  getMoodPatterns = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const days = parseInt(req.query.days as string) || 30;

    const patterns = await moodService.getMoodPatterns(userId, days);

    ApiResponse.success(res, { patterns }, 'Mood patterns retrieved successfully', undefined, req);
  });
}

export const moodController = new MoodController();
export default moodController;

