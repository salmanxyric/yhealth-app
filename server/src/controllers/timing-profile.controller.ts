import type { Response } from 'express';
import { BaseController } from './base.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { timingProfileService } from '../services/timing-profile.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

class TimingProfileController extends BaseController {
  constructor() {
    super('TimingProfileController');
  }

  /** GET /api/timing-profile — profile + prefs for Smart Timing UI and jobs */
  get = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId ?? '';
    const status = await timingProfileService.getTimingStatus(userId);
    this.success(res, status);
  });

  /** GET /api/timing-profile/histogram — get raw histogram for UI */
  histogram = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId ?? '';
    const histogram = await timingProfileService.getHistogram(userId);
    this.success(res, { histogram });
  });

  /** PUT /api/timing-profile/override — toggle manual override */
  override = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId ?? '';
    const { enabled, manualTime } = req.body as {
      enabled?: boolean;
      manualTime?: string;
    };
    // enabled = true means "let AI learn" (override = false)
    // enabled = false means "I want manual control" (override = true)
    const isManualOverride = enabled === false;
    await timingProfileService.setManualOverride(userId, isManualOverride, manualTime);
    this.success(res, { message: 'Timing preference updated' });
  });
}

export const timingProfileController = new TimingProfileController();
