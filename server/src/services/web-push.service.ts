import webpush from 'web-push';
import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@xyric.ai';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

class WebPushService {
  isConfigured(): boolean {
    return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
  }

  async saveSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ): Promise<void> {
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, endpoint)
       DO UPDATE SET keys_p256dh = EXCLUDED.keys_p256dh,
                     keys_auth = EXCLUDED.keys_auth,
                     user_agent = EXCLUDED.user_agent,
                     updated_at = CURRENT_TIMESTAMP`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent || null],
    );
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await query(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      [userId, endpoint],
    );
  }

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; icon?: string; badge?: string; url?: string; tag?: string },
  ): Promise<number> {
    if (!this.isConfigured()) return 0;

    const subs = await query<PushSubscriptionRow>(
      `SELECT id, endpoint, keys_p256dh, keys_auth
       FROM push_subscriptions WHERE user_id = $1`,
      [userId],
    );

    if (subs.rows.length === 0) return 0;

    let sent = 0;
    const staleIds: string[] = [];

    for (const sub of subs.rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 },
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(sub.id);
        } else {
          logger.warn('[WebPush] Failed to send', {
            userId,
            endpoint: sub.endpoint.slice(0, 60),
            error: err.message,
          });
        }
      }
    }

    if (staleIds.length > 0) {
      await query(
        `DELETE FROM push_subscriptions WHERE id = ANY($1::uuid[])`,
        [staleIds],
      );
      logger.info('[WebPush] Cleaned up stale subscriptions', { userId, count: staleIds.length });
    }

    return sent;
  }
}

export const webPushService = new WebPushService();
