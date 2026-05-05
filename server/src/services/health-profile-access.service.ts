import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

type Visibility = 'disabled' | 'friends' | 'all' | 'custom';

interface AccessResult {
  allowed: boolean;
  visibility: Visibility;
  reason?: string;
}

/**
 * Check whether `viewerId` is permitted to see `targetUserId`'s health profile
 * based on the target user's preferences.
 */
export async function checkHealthProfileAccess(
  viewerId: string,
  targetUserId: string,
): Promise<AccessResult> {
  if (viewerId === targetUserId) {
    return { allowed: true, visibility: 'all' };
  }

  const prefsResult = await query<{
    health_profile_visibility: Visibility;
    health_profile_allowed_users: string[];
  }>(
    `SELECT health_profile_visibility, health_profile_allowed_users
     FROM user_preferences WHERE user_id = $1`,
    [targetUserId],
  );

  const visibility: Visibility =
    prefsResult.rows[0]?.health_profile_visibility ?? 'friends';
  const allowedUsers: string[] =
    prefsResult.rows[0]?.health_profile_allowed_users ?? [];

  if (visibility === 'disabled') {
    return { allowed: false, visibility, reason: 'This user has disabled health profile sharing' };
  }

  if (visibility === 'friends') {
    const friendCheck = await query<{ id: string }>(
      `SELECT id FROM user_follows
       WHERE follower_id = $1 AND following_id = $2 AND status = 'accepted'
       LIMIT 1`,
      [viewerId, targetUserId],
    );

    if (friendCheck.rows.length === 0) {
      const reverseCheck = await query<{ id: string }>(
        `SELECT id FROM user_follows
         WHERE follower_id = $1 AND following_id = $2 AND status = 'accepted'
         LIMIT 1`,
        [targetUserId, viewerId],
      );
      if (reverseCheck.rows.length === 0) {
        return {
          allowed: false,
          visibility,
          reason: 'This user only shares their health profile with friends',
        };
      }
    }

    return { allowed: true, visibility };
  }

  if (visibility === 'all') {
    const chatCheck = await query<{ chat_id: string }>(
      `SELECT DISTINCT c.id as chat_id
       FROM chats c
       INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id
       INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id
       WHERE cp1.user_id = $1 AND cp2.user_id = $2
       AND cp1.left_at IS NULL AND cp2.left_at IS NULL
       LIMIT 1`,
      [viewerId, targetUserId],
    );

    if (chatCheck.rows.length === 0) {
      return {
        allowed: false,
        visibility,
        reason: 'You must share a chat with this user to view their health profile',
      };
    }
    return { allowed: true, visibility };
  }

  if (visibility === 'custom') {
    if (allowedUsers.includes(viewerId)) {
      return { allowed: true, visibility };
    }
    return {
      allowed: false,
      visibility,
      reason: 'This user has not granted you access to their health profile',
    };
  }

  logger.warn('Unknown health profile visibility value', { visibility, targetUserId });
  return { allowed: false, visibility, reason: 'Health profile is not available' };
}
