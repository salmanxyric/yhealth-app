/**
 * @file Shared Challenge Controller
 * @description Handles shared challenge generation, invitation management.
 */

import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { sharedChallengeService } from '../services/shared-challenge.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUserIds(userIds: unknown, requesterId: string, max = 10): string[] {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw ApiError.badRequest('userIds array is required');
  }
  const unique = [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))]
    .filter((id) => id !== requesterId);
  if (unique.length === 0) {
    throw ApiError.badRequest('At least one other user is required');
  }
  if (unique.length > max) {
    throw ApiError.badRequest(`A maximum of ${max} users can be invited at once`);
  }
  if (unique.some((id) => !UUID_RE.test(id))) {
    throw ApiError.badRequest('All user IDs must be valid UUIDs');
  }
  return unique;
}

export const generateChallenge = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { userIds } = req.body as { userIds: string[] };

  const normalizedUserIds = normalizeUserIds(userIds, userId);
  const challenge = await sharedChallengeService.generateChallenge(userId, normalizedUserIds);
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
  const normalizedInviteeIds = normalizeUserIds(inviteeIds, userId);

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
    normalizedInviteeIds,
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

  const normalizedInviteeIds = normalizeUserIds(inviteeIds, userId);
  const count = await sharedChallengeService.inviteToCompetition(id, userId, normalizedInviteeIds, message);
  ApiResponse.success(res, { invited: count }, `${count} invitation(s) sent`);
});
