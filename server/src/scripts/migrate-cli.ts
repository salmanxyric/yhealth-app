#!/usr/bin/env node
/**
 * Database Migration CLI
 *
 * Commands:
 *   run <file>         Run a single migration file from migrations/
 *   run-all            Run ALL supplementary migrations (idempotent)
 *   pending            List migration files not yet applied
 *   list               List all migration files
 *   verify             Verify schema (tables + types)
 *   status             Show database connection info and table count
 *
 * Examples:
 *   npm run db:cli -- run 20260518000000_conversation_claims.sql
 *   npm run db:cli -- run-all
 *   npm run db:cli -- pending
 *   npm run db:cli -- status
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, '..', 'database', 'migrations');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'balencia',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
      }
);

const SUPPLEMENTARY_MIGRATIONS: readonly string[] = [
  '20260416000000_goal_obstacles.sql',
  '20260417000000_goal_reconnections.sql',
  '20260417120000_user-commitments-life-area.sql',
  '20260417140000_ai_coach_persona.sql',
  '20260418000000_user_timing_profiles.sql',
  '20260421000000_add_mood_rating_to_mood_logs.sql',
  '20260422000000_schedule_items_source.sql',
  '20260423100000_create_entitlement_catalogs.sql',
  '20260423100100_extend_subscription_plans.sql',
  '20260423100200_create_plan_scoped_tables.sql',
  '20260423100300_create_credit_tables.sql',
  '20260423100400_create_entitlement_cache.sql',
  '20260423100500_seed_starter_pro_premium_plans.sql',
  '20260423100600_backfill_wallets_and_trial_credits.sql',
  '20260423100700_stripe_hardening.sql',
  '20260423100800_extend_user_subscriptions.sql',
  '20260423100900_admin_overrides_and_enterprise.sql',
  '20260423101000_promo_audit_abuse.sql',
  '20260427000000_add_chat_performance_indexes.sql',
  '20260427000001_entitlement_shadow_log.sql',
  '20260427100000_tool_audit_log.sql',
  '20260427100001_sleep_logs.sql',
  '20260427100002_user_medications.sql',
  '20260428000000_reasoning_graph.sql',
  '20260428100000_tool_operations.sql',
  '20260428200000_expand_coach_personas.sql',
  '20260428300000_user_files.sql',
  '20260428400000_proactive_check_ins.sql',
  '20260430000000_intelligence-files.sql',
  '20260504000000_add_weekly_targets_to_milestones.sql',
  '20260504000001_add_checkout_session_id.sql',
  '20260505000000_ai_coach_no_pgvector_fallbacks.sql',
  '20260506000000_enable_free_onboarding_goal_generation.sql',
  '20260506001000_harden_workout_alarm_user_integrity.sql',
  '20260506002000_create_quick_notes.sql',
  '20260507000000_add_journal_rich_content.sql',
  '20260506000000_wiki.sql',
  '20260508000000_wiki_reconcile.sql',
  '20260508000000_add_plan_source_to_schedule_items.sql',
  '20260508100000_add_push_subscriptions.sql',
  '20260512000000_chat_calls.sql',
  '20260512001000_add_buddy_suggested_challenge.sql',
  '20260512002000_push_tokens_user_communication_preferences.sql',
  'add-accountability-indexes.sql',
  'add-achievement-constraints.sql',
  'add-buddy-challenge-and-competition-invitations.sql',
  'add-health-profile-visibility.sql',
  'add-goal-actions-user-goal-support.sql',
  'add-status-awareness-fields.sql',
  '20260513_ai_coach_call_log.sql',
  'add-voice-schedule-prefs.sql',
  '20260513_intelligence_pending_signals.sql',
  '20260402120000_add-health-data-dedup-constraint.sql',
  '20260402130000_add-finance-module.sql',
  '20260507000000_bootstrap_required_data.sql',
  '20260518000000_conversation_claims.sql',
  '20260519000000_vector_embeddings_dedup_constraint.sql',
  '20260519100000_vector_embeddings_content_hash.sql',
  '20260519200000_voice_quality_metrics_and_transcripts.sql',
  'add-intelligence-session-updated-at.sql',
];

async function runSingleMigration(filename: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const filePath = join(MIGRATIONS_DIR, filename);
    const sql = readFileSync(filePath, 'utf-8');

    console.log(`  Running ${filename}...`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`  OK  ${filename}`);
    return true;
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (
      err?.code === '42701' || err?.code === '42P07' || err?.code === '42710' ||
      err?.message?.includes('already exists') || err?.message?.includes('duplicate')
    ) {
      console.log(`  --  ${filename} (already applied)`);
      return true;
    }
    console.error(`  FAIL  ${filename}: ${err.message}`);
    return false;
  } finally {
    client.release();
  }
}

async function cmdRun(file: string) {
  console.log(`\nRunning migration: ${file}\n`);
  const ok = await runSingleMigration(file);
  process.exit(ok ? 0 : 1);
}

async function cmdRunAll() {
  console.log(`\nRunning ${SUPPLEMENTARY_MIGRATIONS.length} supplementary migrations...\n`);
  let applied = 0;
  let failed = 0;

  for (const file of SUPPLEMENTARY_MIGRATIONS) {
    const ok = await runSingleMigration(file);
    if (ok) {
      applied++;
    } else {
      failed++;
    }
  }

  // Also run all add-* migration files
  const addFiles = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.startsWith('add-') && f.endsWith('.sql'))
    .sort();

  const supplementarySet = new Set(SUPPLEMENTARY_MIGRATIONS);
  const extraAddFiles = addFiles.filter(f => !supplementarySet.has(f));

  if (extraAddFiles.length > 0) {
    console.log(`\nRunning ${extraAddFiles.length} additional add-* migrations...\n`);
    for (const file of extraAddFiles) {
      const ok = await runSingleMigration(file);
      if (ok) applied++;
      else failed++;
    }
  }

  // Run sync-missing-columns.sql
  console.log(`\nRunning column sync...\n`);
  await runSingleMigration('sync-missing-columns.sql');

  console.log(`\nDone: ${applied} applied, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

async function cmdPending() {
  const client = await pool.connect();
  try {
    // Get existing tables
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const existingTables = new Set(tablesResult.rows.map((r: any) => r.table_name));

    // Get existing columns per table
    const columnsResult = await client.query(`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    const existingColumns = new Map<string, Set<string>>();
    for (const row of columnsResult.rows) {
      if (!existingColumns.has(row.table_name)) {
        existingColumns.set(row.table_name, new Set());
      }
      existingColumns.get(row.table_name)!.add(row.column_name);
    }

    // Get existing indexes
    const indexResult = await client.query(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    `);
    const existingIndexes = new Set(indexResult.rows.map((r: any) => r.indexname));

    console.log('\nChecking supplementary migrations for pending changes...\n');

    let pendingCount = 0;
    for (const file of SUPPLEMENTARY_MIGRATIONS) {
      const filePath = join(MIGRATIONS_DIR, file);
      let sql: string;
      try {
        sql = readFileSync(filePath, 'utf-8');
      } catch {
        console.log(`  MISSING  ${file} (file not found)`);
        pendingCount++;
        continue;
      }

      const issues: string[] = [];

      // Check CREATE TABLE
      const tableMatches = sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi);
      for (const m of tableMatches) {
        if (!existingTables.has(m[1])) {
          issues.push(`table ${m[1]} missing`);
        }
      }

      // Check ADD COLUMN
      const colMatches = sql.matchAll(/ALTER TABLE (\w+)\s+ADD COLUMN IF NOT EXISTS (\w+)/gi);
      for (const m of colMatches) {
        const tableCols = existingColumns.get(m[1]);
        if (!tableCols || !tableCols.has(m[2])) {
          issues.push(`column ${m[1]}.${m[2]} missing`);
        }
      }

      // Check CREATE INDEX
      const idxMatches = sql.matchAll(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS (\w+)/gi);
      for (const m of idxMatches) {
        if (!existingIndexes.has(m[1])) {
          issues.push(`index ${m[1]} missing`);
        }
      }

      if (issues.length > 0) {
        console.log(`  PENDING  ${file}`);
        issues.forEach(i => console.log(`           - ${i}`));
        pendingCount++;
      }
    }

    if (pendingCount === 0) {
      console.log('  All supplementary migrations are applied.\n');
    } else {
      console.log(`\n  ${pendingCount} migration(s) have pending changes.\n`);
      console.log('  Run: npm run db:cli -- run-all\n');
    }
  } finally {
    client.release();
  }
}

async function cmdList() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  console.log(`\n${files.length} migration files:\n`);
  const supplementarySet = new Set(SUPPLEMENTARY_MIGRATIONS);
  for (const f of files) {
    const tag = supplementarySet.has(f) ? ' [supplementary]' : f.startsWith('add-') ? ' [add-*]' : '';
    console.log(`  ${f}${tag}`);
  }
  console.log();
}

async function cmdStatus() {
  const client = await pool.connect();
  try {
    const dbResult = await client.query('SELECT current_database(), current_user, version()');
    const tableCount = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const typeCount = await client.query(`
      SELECT COUNT(*) as count FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `);

    console.log('\nDatabase Status:');
    console.log(`  Database:   ${dbResult.rows[0].current_database}`);
    console.log(`  User:       ${dbResult.rows[0].current_user}`);
    console.log(`  Tables:     ${tableCount.rows[0].count}`);
    console.log(`  Enum types: ${typeCount.rows[0].count}`);
    console.log(`  PostgreSQL: ${dbResult.rows[0].version.split(',')[0]}`);
    console.log();
  } finally {
    client.release();
  }
}

async function cmdVerify() {
  const client = await pool.connect();
  try {
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = tablesResult.rows.map((r: any) => r.table_name);
    console.log(`\n${tables.length} tables in public schema:\n`);
    tables.forEach((t: string) => console.log(`  ${t}`));
    console.log();
  } finally {
    client.release();
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    await pool.query('SELECT 1');
  } catch (err: any) {
    console.error(`\nFailed to connect to database: ${err.message}`);
    console.error('Check your .env or DATABASE_URL settings.\n');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'run':
        if (!args[0]) {
          console.error('Usage: npm run db:cli -- run <filename.sql>');
          process.exit(1);
        }
        await cmdRun(args[0]);
        break;
      case 'run-all':
        await cmdRunAll();
        break;
      case 'pending':
        await cmdPending();
        break;
      case 'list':
        await cmdList();
        break;
      case 'status':
        await cmdStatus();
        break;
      case 'verify':
        await cmdVerify();
        break;
      default:
        console.log(`
Database Migration CLI

Commands:
  run <file>    Run a single migration file
  run-all       Run ALL supplementary + add-* migrations
  pending       Check which migrations have pending changes
  list          List all migration files
  status        Show database connection info
  verify        List all tables in the database

Examples:
  npm run db:cli -- run 20260518000000_conversation_claims.sql
  npm run db:cli -- run-all
  npm run db:cli -- pending
  npm run db:cli -- status
`);
        break;
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
