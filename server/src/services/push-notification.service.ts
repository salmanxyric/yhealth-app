/**
 * FCM push delivery (optional). Skips silently when not configured or user opted out.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { communicationPreferencesService } from './communication-preferences.service.js';

export interface PushPayload {
  title: string;
  body: string;
  type?: string;
  category?: string;
  actionUrl?: string;
}

type MessagingType = import('firebase-admin/messaging').Messaging;

let messagingPromise: Promise<MessagingType | null> | null = null;

async function getMessaging(): Promise<MessagingType | null> {
  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw?.trim()) {
      logger.debug('[Push] FIREBASE_SERVICE_ACCOUNT_JSON not set — push disabled');
      return null;
    }
    try {
      const { initializeApp, cert, getApps } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');
      const existing = getApps();
      if (existing.length === 0) {
        const cred = JSON.parse(raw) as Record<string, unknown>;
        initializeApp({ credential: cert(cred as never) });
      }
      return getMessaging();
    } catch (e) {
      logger.warn('[Push] firebase-admin init failed', {
        error: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
  })();

  return messagingPromise;
}

class PushNotificationService {
  /**
   * Send push to all active device tokens for a user (batched multicast).
   */
  async deliverForUser(userId: string, payload: PushPayload): Promise<void> {
    const allowed = await communicationPreferencesService.allowsPushCategory(
      userId,
      payload.category
    );
    if (!allowed) {
      logger.debug('[Push] Skipped by user category preference', { userId, category: payload.category });
      return;
    }

    const messaging = await getMessaging();
    if (!messaging) return;

    try {
      const tokensResult = await query<{ token: string }>(
        `SELECT token FROM push_tokens WHERE user_id = $1 AND active = true`,
        [userId]
      );
      const tokens = tokensResult.rows.map((r) => r.token).filter(Boolean);
      if (tokens.length === 0) return;

      const chunkSize = 500;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);
        const res = await messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title: payload.title, body: payload.body },
          data: {
            type: payload.type || 'notification',
            actionUrl: payload.actionUrl || '',
          },
        });
        if (res.failureCount > 0) {
          for (let j = 0; j < res.responses.length; j++) {
            const r = res.responses[j]!;
            if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
              const t = chunk[j];
              await query(`UPDATE push_tokens SET active = false WHERE token = $1`, [t]).catch(() => {});
            }
          }
        }
      }
    } catch (error) {
      logger.warn('[Push] deliverForUser failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const pushNotificationService = new PushNotificationService();
