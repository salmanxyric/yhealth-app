import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { followService } from '../services/follow.service.js';
import { query } from '../config/database.config.js';

export const sendFollowRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const { userId: targetId } = req.params;
  if (!targetId) throw ApiError.badRequest('userId is required');
  if (userId === targetId) throw ApiError.badRequest('Cannot follow yourself');

  try {
    const follow = await followService.sendFollowRequest(userId, targetId, req.body?.message);
    ApiResponse.created(res, { follow }, 'Follow request sent');
  } catch (error) {
    if (error instanceof Error) throw ApiError.badRequest(error.message);
    throw error;
  }
});

export const acceptFollowRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  try {
    const follow = await followService.acceptFollowRequest(req.params.followId, userId);
    ApiResponse.success(res, { follow }, 'Follow request accepted');
  } catch (error) {
    if (error instanceof Error) throw ApiError.badRequest(error.message);
    throw error;
  }
});

export const rejectFollowRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  try {
    await followService.rejectFollowRequest(req.params.followId, userId);
    ApiResponse.success(res, null, 'Follow request rejected');
  } catch (error) {
    if (error instanceof Error) throw ApiError.badRequest(error.message);
    throw error;
  }
});

export const removeFollow = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  await followService.removeFollow(userId, req.params.userId);
  ApiResponse.success(res, null, 'Unfollowed');
});

export const blockUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  await followService.blockUser(userId, req.params.userId);
  ApiResponse.success(res, null, 'User blocked');
});

export const getFollowers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const followers = await followService.getFollowers(userId);
  ApiResponse.success(res, { followers, count: followers.length }, 'Followers retrieved');
});

export const getFollowing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const following = await followService.getFollowing(userId);
  ApiResponse.success(res, { following, count: following.length }, 'Following retrieved');
});

export const getPendingRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const direction = req.query.direction === 'sent' ? 'sent' : 'received';
  const pending = direction === 'sent'
    ? await followService.getSentPendingRequests(userId)
    : await followService.getPendingRequests(userId);
  ApiResponse.success(res, { requests: pending, count: pending.length }, 'Pending requests retrieved');
});

export const getMutualFollows = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const mutual = await followService.getMutualFollows(userId);
  ApiResponse.success(res, { mutual, count: mutual.length }, 'Mutual follows retrieved');
});

export const getRelationship = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const relationship = await followService.getRelationship(userId, req.params.userId);
  ApiResponse.success(res, { relationship }, 'Relationship retrieved');
});

export const getSocialStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const stats = await followService.getSocialStats(userId);
  ApiResponse.success(res, { stats }, 'Social stats retrieved');
});

export const getConsent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const consent = await followService.getConsent(userId);
  ApiResponse.success(res, { consent }, 'Consent retrieved');
});

export const updateConsent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  await followService.updateConsent(userId, req.body);
  const consent = await followService.getConsent(userId);
  ApiResponse.success(res, { consent }, 'Consent updated');
});

export const getSuggestions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  // Lazy import buddy suggestion service
  const { buddySuggestionService } = await import('../services/buddy-suggestion.service.js');
  const suggestions = await buddySuggestionService.getSuggestions(userId, Number(req.query.limit) || 10);
  ApiResponse.success(res, { suggestions }, 'Suggestions retrieved');
});

export const dismissSuggestion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  const { buddySuggestionService } = await import('../services/buddy-suggestion.service.js');
  await buddySuggestionService.dismissSuggestion(userId, req.params.userId);
  ApiResponse.success(res, null, 'Suggestion dismissed');
});

export const searchUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  const rawQuery = (req.query.query ?? req.query.q ?? '').toString().trim();
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '10'), 10) || 10, 1), 50);

  if (rawQuery.length < 2) {
    ApiResponse.success(res, { users: [] }, 'Search results');
    return;
  }

  const like = `%${rawQuery.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const result = await query<{ id: string; name: string; avatar: string | null }>(
    `SELECT id,
            TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) AS name,
            avatar
     FROM users
     WHERE id <> $1
       AND (
         first_name ILIKE $2 OR
         last_name ILIKE $2 OR
         (first_name || ' ' || COALESCE(last_name, '')) ILIKE $2 OR
         email ILIKE $2
       )
     ORDER BY first_name ASC
     LIMIT $3`,
    [userId, like, limit]
  );

  ApiResponse.success(
    res,
    { users: result.rows.map((r) => ({ id: r.id, name: r.name || 'User', avatar: r.avatar ?? undefined })) },
    'Search results'
  );
});

export default {
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  removeFollow,
  blockUser,
  getFollowers,
  getFollowing,
  getPendingRequests,
  getMutualFollows,
  getRelationship,
  getSocialStats,
  getConsent,
  updateConsent,
  getSuggestions,
  dismissSuggestion,
  searchUsers,
};
