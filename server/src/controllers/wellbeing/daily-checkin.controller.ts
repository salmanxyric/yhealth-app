/**
 * @file Daily Check-in Controller
 * @description API endpoints for daily check-in flow
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { dailyCheckinService } from '../../services/wellbeing/daily-checkin.service.js';

class DailyCheckinController {
  /**
   * @route   POST /api/v1/journal/checkin
   * @desc    Create or update today's daily check-in
   * @access  Private
   */
  createOrUpdate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { mood_score, energy_score, sleep_quality, stress_score, tags, day_summary } = req.body;

    // Validate scores
    if (mood_score !== undefined && (mood_score < 1 || mood_score > 10)) {
      throw ApiError.badRequest('mood_score must be between 1 and 10');
    }
    if (energy_score !== undefined && (energy_score < 1 || energy_score > 10)) {
      throw ApiError.badRequest('energy_score must be between 1 and 10');
    }
    if (sleep_quality !== undefined && (sleep_quality < 1 || sleep_quality > 5)) {
      throw ApiError.badRequest('sleep_quality must be between 1 and 5');
    }
    if (stress_score !== undefined && (stress_score < 1 || stress_score > 10)) {
      throw ApiError.badRequest('stress_score must be between 1 and 10');
    }

    const checkin = await dailyCheckinService.createOrUpdateCheckin(userId, {
      moodScore: mood_score,
      energyScore: energy_score,
      sleepQuality: sleep_quality,
      stressScore: stress_score,
      tags,
      daySummary: day_summary,
    });

    ApiResponse.success(
      res,
      { checkin },
      { message: 'Daily check-in saved successfully', statusCode: 201 },
      undefined,
      req
    );
  });

  /**
   * @route   GET /api/v1/journal/checkin/today
   * @desc    Get today's check-in (or null)
   * @access  Private
   */
  getToday = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const checkin = await dailyCheckinService.getTodayCheckin(userId);

    ApiResponse.success(
      res,
      { checkin, hasCheckedIn: checkin !== null },
      'Today\'s check-in retrieved',
      undefined,
      req
    );
  });

  /**
   * @route   GET /api/v1/journal/checkin/history
   * @desc    Get check-in history (paginated)
   * @access  Private
   */
  getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await dailyCheckinService.getCheckinHistory(userId, {
      page, limit, startDate, endDate,
    });

    ApiResponse.success(res, result, 'Check-in history retrieved', undefined, req);
  });

  /**
   * @route   GET /api/v1/journal/checkin/streak
   * @desc    Get check-in streak info
   * @access  Private
   */
  getStreak = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const streak = await dailyCheckinService.getCheckinStreak(userId);

    ApiResponse.success(res, { streak }, 'Check-in streak retrieved', undefined, req);
  });
}

export const dailyCheckinController = new DailyCheckinController();
export default dailyCheckinController;
