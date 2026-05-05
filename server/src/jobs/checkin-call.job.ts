/**
 * Scheduled AI check-in: creates a voice call + high-priority notification with deep link.
 * Respects user_communication_preferences, local hour, and max_checkins_per_day.
 */

import { query } from '../config/database.config.js';
import { getUserLocalHour } from '../lib/user-timezone.js';
import { logger } from '../services/logger.service.js';
import { voiceCallService } from '../services/voice-call.service.js';
import { notificationEngine } from '../services/notification-engine.service.js';
import { communicationPreferencesService } from '../services/communication-preferences.service.js';
import {
  timingProfileService,
  isHourInReceptiveWindows,
} from '../services/timing-profile.service.js';

const INTERVAL_MS = process.env.CHECKIN_JOB_INTERVAL_MS
  ? parseInt(process.env.CHECKIN_JOB_INTERVAL_MS, 10)
  : 6 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = process.env.CHECKIN_JOB_STARTUP_DELAY_MS
  ? parseInt(process.env.CHECKIN_JOB_STARTUP_DELAY_MS, 10)
  : 1_020_000; // 17m — stagger after other jobs
const BATCH = 200;
/** When timing profile confidence ≥ this, only offer check-ins in peak/secondary ±1h local windows (else 07–22). */
const CHECKIN_TIMING_CONFIDENCE_MIN = process.env.CHECKIN_TIMING_CONFIDENCE_MIN
  ? parseFloat(process.env.CHECKIN_TIMING_CONFIDENCE_MIN)
  : 0.4;
/** Skip scheduling in local hours with this many logged misses (from prefs JSON). */
const CHECKIN_MISS_SKIP_THRESHOLD = process.env.CHECKIN_MISS_SKIP_THRESHOLD
  ? parseInt(process.env.CHECKIN_MISS_SKIP_THRESHOLD, 10)
  : 3;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let startupTimeoutId: NodeJS.Timeout | null = null;

function isWeekend(timezone: string): boolean {
  try {
    const w = new Date().toLocaleString('en-US', { weekday: 'short', timeZone: timezone });
    return w === 'Sat' || w === 'Sun';
  } catch {
    const d = new Date().getDay();
    return d === 0 || d === 6;
  }
}

function inQuietHours(
  hour: number,
  start: number | null | undefined,
  end: number | null | undefined
): boolean {
  if (start == null || end == null) return false;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

async function processCheckins(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  const start = Date.now();
  let processed = 0;
  let sent = 0;
  try {
    let cursor = '00000000-0000-0000-0000-000000000000';

    while (true) {
      const users = await query<{ id: string; timezone: string }>(
        `SELECT id, COALESCE(timezone, 'UTC') AS timezone
         FROM users
         WHERE is_active = true AND id > $1::uuid
         ORDER BY id ASC
         LIMIT $2`,
        [cursor, BATCH]
      );
      if (users.rows.length === 0) break;

      for (const row of users.rows) {
        processed++;
        cursor = row.id;
        try {
          const prefs = await communicationPreferencesService.getForUser(row.id);
          if (!prefs.checkin_push_enabled) continue;
          if (prefs.workdays_only && isWeekend(row.timezone)) continue;
          const hour = getUserLocalHour(row.timezone);
          const missByHour = prefs.checkin_miss_count_by_hour || {};
          const missHere = Number(missByHour[String(hour)] ?? missByHour[hour] ?? 0);
          if (missHere >= CHECKIN_MISS_SKIP_THRESHOLD) continue;

          let inDeliveryWindow = hour >= 7 && hour < 22;
          try {
            const profile = await timingProfileService.getProfile(row.id);
            if (profile && profile.confidence >= CHECKIN_TIMING_CONFIDENCE_MIN) {
              inDeliveryWindow = isHourInReceptiveWindows(
                hour,
                profile.peakHour,
                profile.secondaryHour
              );
            }
          } catch {
            /* keep default 7–22 */
          }
          if (!inDeliveryWindow) continue;
          if (inQuietHours(hour, prefs.quiet_hours_start, prefs.quiet_hours_end)) continue;

          const cnt = await query<{ c: string }>(
            `SELECT COUNT(*)::text AS c FROM notifications
             WHERE user_id = $1 AND type = 'ai_check_in'
               AND (created_at AT TIME ZONE $2)::date = (NOW() AT TIME ZONE $2)::date`,
            [row.id, row.timezone]
          );
          if (parseInt(cnt.rows[0]?.c || '0', 10) >= prefs.max_checkins_per_day) continue;

          const initiation = await voiceCallService.initiateCall(row.id, {
            channel: 'mobile_app',
            session_type: 'quick_checkin',
            call_purpose: 'check_in',
            pre_call_context: 'Scheduled AI check-in',
          });

          await notificationEngine.send({
            userId: row.id,
            type: 'ai_check_in',
            title: 'Time for a quick check-in',
            message: 'Your coach is ready for a short voice check-in. Tap to connect.',
            priority: 'high',
            category: 'coaching',
            actionUrl: `/voice-call?callId=${initiation.callId}`,
            actionLabel: 'Start call',
          });
          sent++;
        } catch (e) {
          logger.debug('[CheckinJob] skip user', {
            userId: row.id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      if (users.rows.length < BATCH) break;
    }

    logger.info('[CheckinJob] cycle complete', {
      processed,
      sent,
      ms: Date.now() - start,
    });
  } catch (e) {
    logger.error('[CheckinJob] fatal', { error: e instanceof Error ? e.message : String(e) });
  } finally {
    isRunning = false;
  }
}

function start(): void {
  if (intervalId) return;
  startupTimeoutId = setTimeout(() => {
    processCheckins().catch(() => {});
    intervalId = setInterval(() => {
      processCheckins().catch(() => {});
    }, INTERVAL_MS);
    logger.info('[CheckinJob] started', { intervalMs: INTERVAL_MS });
  }, STARTUP_DELAY_MS);
}

function stop(): void {
  if (startupTimeoutId) {
    clearTimeout(startupTimeoutId);
    startupTimeoutId = null;
  }
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  logger.info('[CheckinJob] stopped');
}

export const checkinCallJob = { start, stop };
