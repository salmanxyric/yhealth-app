/**
 * @file apply-mood-rating-migration.ts
 * @description One-shot runner that adds and backfills the `mood_rating`
 * column on `mood_logs`. Safe to run repeatedly.
 *
 * Usage (from `server/`):
 *   npx ts-node --esm src/database/apply-mood-rating-migration.ts
 * or
 *   npx tsx src/database/apply-mood-rating-migration.ts
 */

import { pool } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';

const SQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mood_logs' AND column_name = 'mood_rating'
  ) THEN
    ALTER TABLE mood_logs
      ADD COLUMN mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10);

    UPDATE mood_logs
    SET mood_rating = CASE
      WHEN happiness_rating IS NOT NULL THEN happiness_rating
      WHEN energy_rating IS NOT NULL AND stress_rating IS NOT NULL
        THEN GREATEST(1, LEAST(10, ROUND(((energy_rating + (11 - stress_rating)) / 2.0))::INT))
      WHEN energy_rating IS NOT NULL THEN energy_rating
      WHEN stress_rating IS NOT NULL THEN (11 - stress_rating)
      WHEN anxiety_rating IS NOT NULL THEN (11 - anxiety_rating)
      ELSE NULL
    END
    WHERE mood_rating IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_rating
  ON mood_logs(user_id, logged_at DESC)
  WHERE mood_rating IS NOT NULL;
`;

async function main() {
  try {
    logger.info('Applying mood_rating migration to mood_logs...');
    await pool.query(SQL);
    const { rows } = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM information_schema.columns
         WHERE table_name = 'mood_logs' AND column_name = 'mood_rating'`
    );
    if (rows[0]?.c === 1) {
      logger.info('mood_rating column is present on mood_logs ✅');
    } else {
      logger.error('mood_rating column missing AFTER migration — investigate');
      process.exit(1);
    }
  } catch (err) {
    logger.error('Failed to apply mood_rating migration', { err });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
