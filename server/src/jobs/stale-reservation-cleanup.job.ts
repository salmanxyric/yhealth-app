/**
 * Stale Reservation Cleanup Job
 *
 * Releases credit reservations stuck in 'reserved' status for more than 30
 * minutes. This handles the edge case where the server process crashes between
 * the reserve and settle/release phases of the consumeCredits middleware.
 *
 * Runs every 15 minutes. Idempotent — only processes rows still in 'reserved'
 * status past the threshold.
 */

import { query, transaction } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';

const STALE_THRESHOLD_MINUTES = 30;

interface StaleReservation {
    id: string;
    user_id: string;
    feature_key: string;
    credits_reserved: number;
    request_id: string;
    idempotency_key: string;
}

export async function runStaleReservationCleanup(): Promise<{ released: number }> {
    const result = await query<StaleReservation>(
        `SELECT id, user_id, feature_key, credits_reserved, request_id, idempotency_key
           FROM usage_events
          WHERE status = 'reserved'
            AND created_at < (NOW() AT TIME ZONE 'UTC') - INTERVAL '${STALE_THRESHOLD_MINUTES} minutes'
          ORDER BY created_at ASC
          LIMIT 100`
    );

    if (result.rows.length === 0) return { released: 0 };

    let released = 0;

    for (const reservation of result.rows) {
        try {
            await transaction(async (client) => {
                // Restore credits to wallet (plan bucket first since that's where they were debited from)
                const walletResult = await client.query(
                    `UPDATE credit_wallets
                        SET plan_credits_balance = plan_credits_balance + $2,
                            version = version + 1,
                            updated_at = NOW() AT TIME ZONE 'UTC'
                      WHERE user_id = $1
                      RETURNING plan_credits_balance, bonus_credits_balance`,
                    [reservation.user_id, reservation.credits_reserved]
                );

                if (walletResult.rows.length === 0) {
                    logger.warn('[staleReservationCleanup] Wallet not found, skipping', {
                        userId: reservation.user_id,
                        reservationId: reservation.id,
                    });
                    return;
                }

                // Mark usage event as released
                await client.query(
                    `UPDATE usage_events
                        SET status = 'released',
                            updated_at = NOW() AT TIME ZONE 'UTC'
                      WHERE id = $1 AND status = 'reserved'`,
                    [reservation.id]
                );

                // Write compensating ledger row
                const bal = walletResult.rows[0];
                await client.query(
                    `INSERT INTO credit_transactions
                        (id, user_id, delta, bucket, kind, reason, feature_key, request_id, idempotency_key,
                         balance_after_plan, balance_after_bonus, created_at)
                     VALUES (gen_random_uuid(), $1, $2, 'plan', 'release', 'stale_reservation_cleanup', $3, $4, $5,
                             $6, $7, NOW() AT TIME ZONE 'UTC')
                     ON CONFLICT (idempotency_key) DO NOTHING`,
                    [
                        reservation.user_id,
                        reservation.credits_reserved,
                        reservation.feature_key,
                        reservation.request_id,
                        `stale_release:${reservation.id}`,
                        bal.plan_credits_balance,
                        bal.bonus_credits_balance,
                    ]
                );
            });
            released++;
        } catch (err) {
            logger.error('[staleReservationCleanup] Failed to release reservation', {
                reservationId: reservation.id,
                userId: reservation.user_id,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    if (released > 0) {
        logger.info('[staleReservationCleanup] Released stale reservations', { released });
    }

    return { released };
}
