/**
 * @file apply-status-awareness-migration.ts
 * @description One-shot runner that applies `add-status-awareness-fields.sql`
 * to the current database. Adds `status_overrides` (user_plans),
 * `status_patterns` (user_coaching_profiles), and lifecycle fields on
 * `activity_status_history` together with their indexes/constraints.
 *
 * The underlying SQL is fully idempotent (IF NOT EXISTS / DO blocks with
 * duplicate_object guards), so existing data is preserved and the script is
 * safe to run repeatedly.
 *
 * Execution mirrors `runMigration()` in `auto-migrate.ts` — statements run
 * independently so a single failing statement (e.g. a pre-existing partial
 * index whose predicate is non-immutable) does not abort the column
 * additions that the runtime requires.
 *
 * Usage (from `server/`):
 *   npx tsx src/database/apply-status-awareness-migration.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATION_FILE = 'add-status-awareness-fields.sql';

// Codes that mean "object already exists / duplicate" — safe to ignore for
// idempotent migrations.
const IGNORABLE_CODES = new Set(['42P07', '42710', '42701']);

function stripLeadingComments(s: string): string {
  const lines = s.split('\n');
  const firstNonComment = lines.findIndex(
    (l) => l.trim().length > 0 && !l.trim().startsWith('--'),
  );
  return firstNonComment >= 0 ? lines.slice(firstNonComment).join('\n').trim() : '';
}

/**
 * Split a SQL migration into executable chunks, keeping `DO $$ ... END $$;`
 * blocks intact. Mirrors the splitter in `auto-migrate.ts::runMigration`.
 */
function splitMigration(sql: string): string[] {
  const blocks: string[] = [];
  if (sql.includes('DO $$')) {
    const doBlockRegex = /DO\s*\$\$[\s\S]*?END\s*\$\$\s*;/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = doBlockRegex.exec(sql)) !== null) {
      const between = sql.substring(lastIndex, match.index).trim();
      if (between) {
        between.split(';').forEach((s) => {
          const cleaned = stripLeadingComments(s);
          if (cleaned) blocks.push(cleaned + ';');
        });
      }
      blocks.push(match[0]);
      lastIndex = match.index + match[0].length;
    }
    const tail = sql.substring(lastIndex).trim();
    if (tail) {
      tail.split(';').forEach((s) => {
        const cleaned = stripLeadingComments(s);
        if (cleaned) blocks.push(cleaned + ';');
      });
    }
    return blocks;
  }

  return sql
    .split(';')
    .map((s) => stripLeadingComments(s))
    .filter((s) => s.length > 0)
    .map((s) => s + ';');
}

async function main() {
  const migrationPath = join(__dirname, 'migrations', MIGRATION_FILE);
  let sql: string;
  try {
    sql = readFileSync(migrationPath, 'utf-8');
  } catch (err) {
    logger.error('Failed to read migration file', { migrationPath, err });
    process.exit(1);
  }

  const statements = splitMigration(sql);
  logger.info(`Applying migration: ${MIGRATION_FILE} (${statements.length} statements)`);

  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      applied++;
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (
        (e.code && IGNORABLE_CODES.has(e.code)) ||
        e.message?.includes('already exists') ||
        e.message?.includes('duplicate')
      ) {
        skipped++;
        continue;
      }
      failed++;
      logger.warn('Statement failed (continuing with remaining statements)', {
        code: e.code,
        message: e.message,
        preview: stmt.replace(/\s+/g, ' ').slice(0, 120),
      });
    }
  }

  logger.info('Migration pass complete', { applied, skipped, failed });

  try {
    const { rows } = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_plans'
          AND column_name = 'status_overrides'`,
    );

    if (rows[0]?.c === 1) {
      logger.info('user_plans.status_overrides column present ✅');
    } else {
      logger.error('status_overrides column missing AFTER migration — investigate');
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch(async (err) => {
  logger.error('Unexpected failure in status-awareness migration', { err });
  await pool.end().catch(() => undefined);
  process.exit(1);
});
