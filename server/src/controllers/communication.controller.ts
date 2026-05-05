import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { query } from '../config/database.config.js';
import { communicationPreferencesService } from '../services/communication-preferences.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

class CommunicationController {
  getPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');
    const data = await communicationPreferencesService.getForUser(userId);
    ApiResponse.success(res, data, 'Communication preferences retrieved');
  });

  updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');
    const data = await communicationPreferencesService.upsert(userId, req.body);
    ApiResponse.success(res, data, 'Communication preferences updated');
  });

  registerPushToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');
    const { token, platform } = req.body as { token: string; platform: string };
    if (!token || typeof token !== 'string') {
      throw ApiError.badRequest('token is required');
    }
    await query(
      `INSERT INTO push_tokens (user_id, token, platform, active, last_seen_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (user_id, token) DO UPDATE SET
         active = true,
         platform = EXCLUDED.platform,
         last_seen_at = NOW()`,
      [userId, token.trim(), (platform || 'web').slice(0, 24)]
    );
    ApiResponse.success(res, { registered: true }, 'Push token registered', 201);
  });

  removePushToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');
    const token = (req.body as { token?: string }).token;
    if (!token) throw ApiError.badRequest('token required');
    await query(`UPDATE push_tokens SET active = false WHERE user_id = $1 AND token = $2`, [userId, token]);
    ApiResponse.success(res, { removed: true }, 'Push token removed');
  });
}

export const communicationController = new CommunicationController();
