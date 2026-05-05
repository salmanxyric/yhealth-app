/**
 * Grace Expiration Job
 *
 * Flip `grace → canceled` for subscriptions whose `grace_period_ends_at` has
 * passed. Runs hourly. Idempotent — UPDATE has a WHERE clause that only
 * matches rows still in grace with an expired deadline.
 *
 * Emits entitlement invalidations for each affected user so the client
 * refetches within 5s and starts showing the locked UI.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { invalidateEntitlements } from '../services/entitlement.service.js';

export async function runGraceExpirationJob(): Promise<{ expired: number }> {
    const result = await query<{ user_id: string }>(
        `UPDATE user_subscriptions
            SET status     = 'canceled',
                canceled_at = COALESCE(canceled_at, NOW() AT TIME ZONE 'UTC'),
                updated_at  = NOW() AT TIME ZONE 'UTC'
          WHERE status = 'grace'
            AND grace_period_ends_at IS NOT NULL
            AND grace_period_ends_at < (NOW() AT TIME ZONE 'UTC')
         RETURNING user_id`
    );

    const userIds = new Set(result.rows.map((r) => r.user_id));
    for (const userId of userIds) {
        await invalidateEntitlements(userId);
    }

    if (userIds.size > 0) {
        logger.info('[graceExpirationJob] Grace periods expired', {
            count: userIds.size,
        });
    }

    return { expired: userIds.size };
}
