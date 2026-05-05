/**
 * @file Shared Challenge Controller
 * @description Handles shared challenge generation, invitation management.
 */

import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { sharedChallengeService } from '../services/shared-challenge.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const generateChallenge = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { userIds } = req.body as { userIds: string[] };

  if (!Array.isArray(userIds) || userIds.length === 0) {
    ApiResponse.badRequest(res, 'userIds array is required');
    return;
  }

  const challenge = await sharedChallengeService.generateChallenge(userId, userIds);
  ApiResponse.success(res, { challenge }, 'Challenge generated');
});

export const createSharedCompetition = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { challenge, inviteeIds, message } = req.body as {
    challenge: { name: string; description: string; metric: string; durationDays: number; target?: number; reasoning?: string; scoringWeights?: Record<string, number> };
    inviteeIds: string[];
    message?: string;
  };

  if (!challenge?.name || !Array.isArray(inviteeIds)) {
    ApiResponse.badRequest(res, 'challenge and inviteeIds are required');
    return;
  }

  const result = await sharedChallengeService.createSharedCompetition(
    {
      name: challenge.name,
      description: challenge.description || '',
      metric: challenge.metric || 'workout',
      durationDays: challenge.durationDays || 7,
      target: challenge.target || null,
      reasoning: challenge.reasoning || '',
      scoringWeights: challenge.scoringWeights || { workout: 20, nutrition: 20, wellbeing: 20, biometrics: 10, engagement: 15, consistency: 15 },
    },
    userId,
    inviteeIds,
    message,
  );

  ApiResponse.success(res, result, 'Competition created and invitations sent');
});

export const getPendingInvitations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const invitations = await sharedChallengeService.getPendingInvitations(userId);
  ApiResponse.success(res, { invitations }, 'Pending invitations retrieved');
});

export const acceptInvitation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  await sharedChallengeService.acceptInvitation(id, userId);
  ApiResponse.success(res, { accepted: true }, 'Invitation accepted');
});

export const declineInvitation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  await sharedChallengeService.declineInvitation(id, userId);
  ApiResponse.success(res, { declined: true }, 'Invitation declined');
});

export const inviteToCompetition = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { inviteeIds, message } = req.body as { inviteeIds: string[]; message?: string };

  if (!Array.isArray(inviteeIds) || inviteeIds.length === 0) {
    ApiResponse.badRequest(res, 'inviteeIds array is required');
    return;
  }

  const count = await sharedChallengeService.inviteToCompetition(id, userId, inviteeIds, message);
  ApiResponse.success(res, { invited: count }, `${count} invitation(s) sent`);
});
