/**
 * @file Life Goals Controller
 * @description API endpoints for life goals and daily intentions
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../types/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { lifeGoalsService } from '../../services/wellbeing/life-goals.service.js';

class LifeGoalsController {
  // ============================================
  // LIFE GOALS
  // ============================================

  createGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { category, title, description, motivation, tracking_method, target_value, target_unit, detection_keywords, is_primary } = req.body;

    if (!category || !title) {
      throw ApiError.badRequest('category and title are required');
    }

    const goal = await lifeGoalsService.createGoal(userId, {
      category,
      title,
      description,
      motivation,
      trackingMethod: tracking_method,
      targetValue: target_value,
      targetUnit: target_unit,
      detectionKeywords: detection_keywords,
      isPrimary: is_primary,
    });

    ApiResponse.success(res, { goal }, { message: 'Life goal created successfully', statusCode: 201 }, undefined, req);
  });

  getGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;

    const goals = await lifeGoalsService.getGoals(userId, { status, category: category as any });

    ApiResponse.success(res, { goals }, 'Life goals retrieved successfully', undefined, req);
  });

  getGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const goal = await lifeGoalsService.getGoalById(userId, req.params.id);

    ApiResponse.success(res, { goal }, 'Life goal retrieved successfully', undefined, req);
  });

  updateGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { category, title, description, motivation, tracking_method, target_value, target_unit, detection_keywords, is_primary, status, current_value, progress } = req.body;

    const goal = await lifeGoalsService.updateGoal(userId, req.params.id, {
      category,
      title,
      description,
      motivation,
      trackingMethod: tracking_method,
      targetValue: target_value,
      targetUnit: target_unit,
      detectionKeywords: detection_keywords,
      isPrimary: is_primary,
      status,
      currentValue: current_value,
      progress,
    });

    ApiResponse.success(res, { goal }, 'Life goal updated successfully', undefined, req);
  });

  deleteGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    await lifeGoalsService.deleteGoal(userId, req.params.id);

    ApiResponse.success(res, {}, 'Life goal deleted successfully', undefined, req);
  });

  getGoalEntries = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await lifeGoalsService.getGoalEntries(userId, req.params.id, { page, limit });

    ApiResponse.success(res, result, 'Goal entries retrieved successfully', undefined, req);
  });

  // ============================================
  // DAILY INTENTIONS
  // ============================================

  setIntention = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { intention_text, checkin_id } = req.body;
    if (!intention_text) {
      throw ApiError.badRequest('intention_text is required');
    }

    const intention = await lifeGoalsService.setIntention(userId, intention_text, checkin_id);

    ApiResponse.success(res, { intention }, { message: 'Intention set successfully', statusCode: 201 }, undefined, req);
  });

  getTodayIntention = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const intention = await lifeGoalsService.getTodayIntention(userId);

    ApiResponse.success(res, { intention }, 'Today\'s intention retrieved', undefined, req);
  });

  updateIntention = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { fulfilled, reflection } = req.body;

    const intention = await lifeGoalsService.updateIntention(userId, req.params.id, { fulfilled, reflection });

    ApiResponse.success(res, { intention }, 'Intention updated successfully', undefined, req);
  });
}

export const lifeGoalsController = new LifeGoalsController();
export default lifeGoalsController;
