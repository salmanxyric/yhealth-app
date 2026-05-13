/**
 * @file Core Profile Calibration Job
 * @description Recalibrates core profile baselines from 30-day data windows.
 * Updates resting HR, average sleep, workout frequency, calorie patterns.
 * Runs weekly on Sunday at 4 AM.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { coreProfileKernelService } from '../services/core-profile-kernel.service.js';

const JOB_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // Weekly
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

interface CalibrationRule {
  section: 'biometrics' | 'targets' | 'constraints' | 'preferences' | 'medical' | 'lifestyle';
  key: string;
  sql: string;
  unit?: string;
}

const CALIBRATION_RULES: CalibrationRule[] = [
  {
    section: 'biometrics',
    key: 'resting_hr',
    sql: `SELECT AVG(resting_heart_rate) as value, COUNT(*) as n FROM whoop_daily_data WHERE user_id = $1 AND created_at >= CURRENT_DATE - 30 AND resting_heart_rate IS NOT NULL`,
    unit: 'bpm',
  },
  {
    section: 'biometrics',
    key: 'avg_sleep_hours',
    sql: `SELECT AVG(sleep_hours) as value, COUNT(*) as n FROM daily_scores WHERE user_id = $1 AND date >= CURRENT_DATE - 30 AND sleep_hours IS NOT NULL`,
    unit: 'hours',
  },
  {
    section: 'biometrics',
    key: 'avg_hrv',
    sql: `SELECT AVG(hrv) as value, COUNT(*) as n FROM whoop_daily_data WHERE user_id = $1 AND created_at >= CURRENT_DATE - 30 AND hrv IS NOT NULL`,
    unit: 'ms',
  },
  {
    section: 'targets',
    key: 'weekly_workout_days',
    sql: `SELECT COUNT(DISTINCT scheduled_date) / 4.0 as value, COUNT(*) as n FROM workout_logs WHERE user_id = $1 AND scheduled_date >= CURRENT_DATE - 30`,
    unit: 'days/week',
  },
  {
    section: 'targets',
    key: 'daily_calories',
    sql: `SELECT AVG(total_calories) as value, COUNT(*) as n FROM daily_scores WHERE user_id = $1 AND date >= CURRENT_DATE - 30 AND total_calories IS NOT NULL`,
    unit: 'kcal',
  },
];

async function processCoreProfileCalibration(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const usersResult = await query(`SELECT DISTINCT id as user_id FROM users WHERE deleted_at IS NULL`);
    let calibratedCount = 0;

    for (const userRow of usersResult.rows) {
      const userId = userRow.user_id as string;

      for (const rule of CALIBRATION_RULES) {
        try {
          const result = await query(rule.sql, [userId]);
          const row = result.rows[0];
          const value = parseFloat(String(row?.value));
          const n = parseInt(String(row?.n)) || 0;

          if (isNaN(value) || n < 3) continue;

          const roundedValue = Math.round(value * 10) / 10;
          await coreProfileKernelService.calibrate(
            userId, rule.section, rule.key, roundedValue, 'system', n, rule.unit
          );
          calibratedCount++;
        } catch (err) {
          logger.debug('[CoreCalibration] Rule failed', { userId, key: rule.key, error: (err as Error).message });
        }
      }
    }

    logger.info('[CoreCalibration] Completed', {
      usersProcessed: usersResult.rows.length,
      calibratedCount,
    });
  } catch (err) {
    logger.error('[CoreCalibration] Job failed', { error: (err as Error).message });
  } finally {
    isRunning = false;
  }
}

export function startCoreProfileCalibration(): void {
  if (intervalId) {
    logger.warn('[CoreCalibration] Already running');
    return;
  }

  logger.info('[CoreCalibration] Starting core profile calibration job (weekly)');
  intervalId = setInterval(processCoreProfileCalibration, JOB_INTERVAL_MS);

  // Run first time after delay (Sunday 4 AM approximation)
  const now = new Date();
  const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
  const msUntilSunday4AM = daysUntilSunday * 24 * 60 * 60 * 1000 + ((4 - now.getUTCHours() + 24) % 24) * 60 * 60 * 1000;
  setTimeout(processCoreProfileCalibration, Math.min(msUntilSunday4AM, JOB_INTERVAL_MS));
}

export function stopCoreProfileCalibration(): void {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  logger.info('[CoreCalibration] Stopped');
}

export const coreProfileCalibrationJob = {
  start: startCoreProfileCalibration,
  stop: stopCoreProfileCalibration,
  isRunning: () => isRunning,
  processNow: processCoreProfileCalibration,
};
