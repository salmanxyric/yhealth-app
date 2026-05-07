/**
 * @file db-migrate-seed.ts
 *
 * Standalone entry point for the Railway `db-migrate-seed` one-shot service.
 * Runs the full migration pipeline (schema + versioned migrations + column sync
 * + supplementary migrations) then seeds essential data, and exits.
 *
 * Usage:
 *   npx tsx src/scripts/db-migrate-seed.ts
 *   node dist/src/scripts/db-migrate-seed.ts
 *
 * Environment:
 *   DATABASE_URL  - Full PostgreSQL connection string (preferred)
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD - Individual params
 *   SKIP_SEED     - Set to "true" to skip seeding (run migrations only)
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { createHash } from 'crypto';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_DIR = join(__dirname, '..', 'database');
const TABLES_DIR = join(DATABASE_DIR, 'tables');
const MIGRATIONS_DIR = join(DATABASE_DIR, 'migrations');

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

function parseConnectionString(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    database: parsed.pathname.slice(1),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

function buildPool(): Pool {
  const config = process.env['DATABASE_URL']
    ? parseConnectionString(process.env['DATABASE_URL'])
    : {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432', 10),
        database: process.env['DB_NAME'] || 'balencia',
        user: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || '',
      };

  return new Pool({
    ...config,
    max: 5,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function log(msg: string) {
  console.log(`[db-migrate-seed] ${msg}`);
}

function warn(msg: string) {
  console.warn(`[db-migrate-seed] ⚠ ${msg}`);
}

function fail(msg: string): never {
  console.error(`[db-migrate-seed] ❌ ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Schema table files — dependency-ordered
// ---------------------------------------------------------------------------

const TABLE_FILES = [
  '00-extensions.sql',
  '01-enums.sql',
  '73-roles.sql',
  '74-permissions.sql',
  '75-role-permissions.sql',
  '02-users.sql',
  '03-consent-records.sql',
  '04-whatsapp-enrollments.sql',
  '05-user-preferences.sql',
  '06-user-goals.sql',
  '07-assessment-questions.sql',
  '08-assessment-responses.sql',
  '09-user-integrations.sql',
  '10-sync-logs.sql',
  '11-health-data-records.sql',
  '12-user-plans.sql',
  '13-activity-logs.sql',
  '14-notifications.sql',
  '15-ai-coach-sessions.sql',
  '16-diet-plans.sql',
  '17-meal-logs.sql',
  '18-body-images.sql',
  '19-exercises.sql',
  '20-workout-plans.sql',
  '21-workout-logs.sql',
  '22-progress-records.sql',
  '23-water-intake.sql',
  '24-xp-transactions.sql',
  '25-shopping-list.sql',
  '26-workout-alarms.sql',
  '27-recipes.sql',
  '27-user-videos.sql',
  '28-scheduled-reminders.sql',
  '29-user-tasks.sql',
  '30-vector-extension.sql',
  '31-voice-calls.sql',
  '32-voice-call-events.sql',
  '33-activity-status-history.sql',
  '34-emotion-logs.sql',
  '35-mental-recovery-scores.sql',
  '36-call-summaries.sql',
  '37-action-items.sql',
  '38-chats.sql',
  '39-messages.sql',
  '40-chat-participants.sql',
  '41-message-reactions.sql',
  '42-message-reads.sql',
  '43-starred-messages.sql',
  '44-daily-health-metrics.sql',
  '45-stress-logs.sql',
  '46-mood-logs.sql',
  '47-journal-entries.sql',
  '48-habits.sql',
  '49-habit-logs.sql',
  '50-energy-logs.sql',
  '51-wellbeing-routines.sql',
  '52-routine-completions.sql',
  '53-mindfulness-practices.sql',
  '54-daily-schedules.sql',
  '55-workout-schedule-tasks.sql',
  '56-user-workout-constraints.sql',
  '57-plan-reschedule-history.sql',
  '58-goal-daily-tracking.sql',
  '59-breathing-tests.sql',
  '60-emotional-checkin-sessions.sql',
  '61-nutrition-daily-analysis.sql',
  '62-nutrition-calorie-adjustments.sql',
  '63-nutrition-adherence-patterns.sql',
  '64-nutrition-user-preferences.sql',
  '65-schedule-automation-logs.sql',
  '66-activity-automation-logs.sql',
  '67-activity-events.sql',
  '55-blogs.sql',
  '68-blog-reactions.sql',
  '69-contact-submissions.sql',
  '68-daily-user-scores.sql',
  '69-leaderboard-snapshots.sql',
  '70-competitions.sql',
  '71-competition-entries.sql',
  '70-help-articles.sql',
  '71-community-posts.sql',
  '72-webinars.sql',
  '80-exercise-lookup-tables.sql',
  '82-testimonials.sql',
  '83-user-coaching-profiles.sql',
  '76-newsletter-subscriptions.sql',
  '77-user-roles.sql',
  '84-daily-checkins.sql',
  '85-life-goals.sql',
  '86-journal-insights.sql',
  '87-lessons-learned.sql',
  '88-insight-feedback.sql',
  '88-voice-journal-sessions.sql',
  '89-weekly-analysis-reports.sql',
  '90-prediction-accuracy.sql',
  '91-spotify-cached-playlists.sql',
  '92-yoga-poses.sql',
  '93-yoga-sessions.sql',
  '94-yoga-session-logs.sql',
  '95-meditation-timers.sql',
  '96-yoga-streaks.sql',
  '97-user-life-history.sql',
  '98-life-goal-milestones-checkins.sql',
  '99-user-motivation-profiles.sql',
  '100-goal-actions.sql',
  '101-proactive-messages.sql',
  '102-email-logs.sql',
  '103-email-preferences.sql',
  '104-vision-test-sessions.sql',
  '105-vision-test-responses.sql',
  '106-vision-streaks.sql',
  '107-finance.sql',
  '108-user-streaks.sql',
  '109-streak-activity-log.sql',
  '110-streak-freeze-log.sql',
  '111-streak-rewards.sql',
  '112-accountability-system.sql',
  '113-accountability-contracts.sql',
  '115-user-follows.sql',
  '113-calendar-connections.sql',
  '114-calendar-events.sql',
  '116-goal-obstacles.sql',
  '117-goal-reconnections.sql',
  '118-user-timing-profiles.sql',
  '119-holiday-calendar.sql',
  '120-data-source-connections.sql',
  '121-data-source-signals.sql',
  '122-user-daily-correlations.sql',
  '123-spotify-listening-history.sql',
  '124-prayer-schedules.sql',
  '125-finance-tracking.sql',
  '126-competition-invitations.sql',
  '127-mental-health-screening-events.sql',
  '99-triggers.sql',
];

// Versioned migration file pattern: YYYYMMDDHHMMSS_name.sql
const MIGRATION_FILE_PATTERN = /^(\d{14})_(.+)\.sql$/;

// Supplementary idempotent migrations (run after column sync)
const SUPPLEMENTARY_MIGRATIONS = [
  '20260416000000_goal_obstacles.sql',
  '20260417000000_goal_reconnections.sql',
  '20260417140000_ai_coach_persona.sql',
  '20260418000000_user_timing_profiles.sql',
  '20260421000000_add_mood_rating_to_mood_logs.sql',
  '20260422000000_schedule_items_source.sql',
  'add-accountability-indexes.sql',
  'add-achievement-constraints.sql',
  'add-buddy-challenge-and-competition-invitations.sql',
  'add-health-profile-visibility.sql',
];

// ---------------------------------------------------------------------------
// Phase 1: Apply full schema (CREATE TABLE IF NOT EXISTS)
// ---------------------------------------------------------------------------

async function applySchema(pool: Pool): Promise<number> {
  log('Phase 1: Applying database schema…');

  // Create trigger function early (used by many tables)
  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Check pgvector availability
  let skipVector = false;
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  } catch {
    warn('pgvector not available — vector tables will use TEXT fallback');
    skipVector = true;
  }

  // Get existing tables/types for safe-mode decisions
  const existingTables = new Set(
    (await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`))
      .rows.map((r: { table_name: string }) => r.table_name)
  );
  const existingTypes = new Set(
    (await pool.query(`SELECT typname FROM pg_type WHERE typcategory='E'`))
      .rows.map((r: { typname: string }) => r.typname)
  );

  let appliedFiles = 0;

  for (const file of TABLE_FILES) {
    const filePath = join(TABLES_DIR, file);
    if (!existsSync(filePath)) continue;

    if (skipVector && file.includes('vector-extension')) {
      const fallback = join(TABLES_DIR, '30-vector-extension-no-pgvector.sql');
      if (existsSync(fallback)) {
        await executeFileStatements(pool, fallback, '30-vector-extension-no-pgvector.sql', existingTables, existingTypes);
        appliedFiles++;
      }
      continue;
    }

    await executeFileStatements(pool, filePath, file, existingTables, existingTypes);
    appliedFiles++;
  }

  log(`  Schema applied (${appliedFiles} files processed)`);
  return appliedFiles;
}

async function executeFileStatements(
  pool: Pool,
  filePath: string,
  fileName: string,
  existingTables: Set<string>,
  existingTypes: Set<string>,
): Promise<void> {
  const content = readFileSync(filePath, 'utf-8');

  // For trigger files, execute the entire content as one block
  if (fileName === '99-triggers.sql' || fileName.includes('trigger')) {
    try {
      await pool.query(content);
    } catch (err: any) {
      if (!isIgnorableError(err)) {
        warn(`Trigger file ${fileName}: ${err.message}`);
      }
    }
    return;
  }

  const statements = splitStatements(content);

  for (const stmt of statements) {
    const upper = stmt.toUpperCase();

    // Skip destructive statements
    if (upper.includes('DROP TABLE') || upper.includes('DROP TYPE')) continue;
    if (upper.includes('DROP FUNCTION') || upper.includes('DROP TRIGGER')) continue;

    // Skip CREATE TYPE if it already exists
    if (upper.startsWith('CREATE TYPE')) {
      const match = stmt.match(/CREATE TYPE\s+(\w+)/i);
      if (match && existingTypes.has(match[1])) continue;
    }

    // Convert CREATE TABLE → CREATE TABLE IF NOT EXISTS
    let safeStmt = stmt;
    if (upper.startsWith('CREATE TABLE') && !upper.includes('IF NOT EXISTS')) {
      const match = stmt.match(/CREATE TABLE\s+(\w+)/i);
      if (match) {
        if (existingTables.has(match[1])) continue;
        safeStmt = stmt.replace(/CREATE TABLE\s+(\w+)/i, 'CREATE TABLE IF NOT EXISTS $1');
      }
    }

    try {
      await pool.query(safeStmt);
    } catch (err: any) {
      if (!isIgnorableError(err)) {
        warn(`${fileName}: ${err.message?.substring(0, 120)}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Run versioned migrations (schema_migrations table)
// ---------------------------------------------------------------------------

async function runVersionedMigrations(pool: Pool): Promise<number> {
  log('Phase 2: Running versioned migrations…');

  // Ensure tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(14) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      checksum VARCHAR(64)
    );
  `);

  // Discover migration files
  let entries: string[];
  try {
    entries = readdirSync(MIGRATIONS_DIR);
  } catch {
    warn('No migrations directory found');
    return 0;
  }

  const migrations = entries
    .filter(e => MIGRATION_FILE_PATTERN.test(e))
    .map(e => {
      const m = MIGRATION_FILE_PATTERN.exec(e)!;
      return { version: m[1], name: m[2].replace(/-/g, ' '), filename: e, filepath: join(MIGRATIONS_DIR, e) };
    })
    .sort((a, b) => a.version.localeCompare(b.version));

  if (migrations.length === 0) {
    log('  No versioned migration files found');
    return 0;
  }

  // Get already-applied
  const applied = new Map(
    (await pool.query<{ version: string; checksum: string }>('SELECT version, checksum FROM schema_migrations ORDER BY version'))
      .rows.map(r => [r.version, r.checksum])
  );

  // Validate checksums
  for (const m of migrations) {
    const existingChecksum = applied.get(m.version);
    if (!existingChecksum) continue;
    const current = sha256(readFileSync(m.filepath, 'utf-8'));
    if (existingChecksum !== current) {
      fail(`Checksum mismatch for ${m.filename} — do not modify applied migrations`);
    }
  }

  const pending = migrations.filter(m => !applied.has(m.version));
  if (pending.length === 0) {
    log('  All versioned migrations already applied');
    return 0;
  }

  log(`  ${pending.length} pending migration(s)`);
  let count = 0;

  for (const m of pending) {
    const sql = readFileSync(m.filepath, 'utf-8');
    const checksum = sha256(sql);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
        [m.version, m.name, checksum],
      );
      await client.query('COMMIT');
      count++;
      log(`    ✓ ${m.version} (${m.filename})`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      fail(`Migration ${m.filename} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Phase 3: Column sync + supplementary migrations
// ---------------------------------------------------------------------------

async function runColumnSyncAndSupplementary(pool: Pool): Promise<void> {
  log('Phase 3: Column sync + supplementary migrations…');

  // Run sync-missing-columns.sql
  const syncPath = join(MIGRATIONS_DIR, 'sync-missing-columns.sql');
  if (existsSync(syncPath)) {
    await runMigrationFile(pool, syncPath, 'sync-missing-columns.sql');
    log('  ✓ Column sync completed');
  }

  // Run add-* migrations (all idempotent)
  try {
    const addMigrations = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.startsWith('add-') && f.endsWith('.sql'))
      .sort();

    for (const f of addMigrations) {
      await runMigrationFile(pool, join(MIGRATIONS_DIR, f), f);
    }
    if (addMigrations.length > 0) {
      log(`  ✓ ${addMigrations.length} add-* migrations processed`);
    }
  } catch { /* no migrations dir */ }

  // Run supplementary migrations
  for (const f of SUPPLEMENTARY_MIGRATIONS) {
    const p = join(MIGRATIONS_DIR, f);
    if (existsSync(p)) {
      await runMigrationFile(pool, p, f);
    }
  }
  log('  ✓ Supplementary migrations completed');
}

async function runMigrationFile(pool: Pool, filepath: string, name: string): Promise<void> {
  const sql = readFileSync(filepath, 'utf-8');

  // Handle DO blocks separately
  if (sql.includes('DO $$') || sql.includes('DO $do$')) {
    const blocks = extractDoBlocksAndStatements(sql);
    for (const block of blocks) {
      try {
        await pool.query(block);
      } catch (err: any) {
        if (!isIgnorableError(err)) {
          warn(`${name}: ${err.message?.substring(0, 100)}`);
        }
      }
    }
    return;
  }

  const statements = sql
    .split(';')
    .map(s => stripLeadingComments(s))
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err: any) {
      if (!isIgnorableError(err)) {
        warn(`${name}: ${err.message?.substring(0, 100)}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 4: Seed essential data
// ---------------------------------------------------------------------------

async function seedEssentialData(pool: Pool): Promise<void> {
  if (process.env['SKIP_SEED'] === 'true') {
    log('Phase 4: Seeding skipped (SKIP_SEED=true)');
    return;
  }

  log('Phase 4: Seeding essential data…');

  await seedRoles(pool);
  await seedAdminUser(pool);
  await seedSubscriptionPlans(pool);

  log('  ✓ Essential data seeded');
}

async function seedRoles(pool: Pool): Promise<void> {
  const ADMIN_ROLE_ID = '11111111-1111-1111-1111-111111111102';
  const USER_ROLE_ID = '11111111-1111-1111-1111-111111111101';

  try {
    await pool.query(`
      INSERT INTO roles (id, name, description, is_system)
      VALUES
        ($1, 'user', 'Default user role', true),
        ($2, 'admin', 'Administrator role with full access', true)
      ON CONFLICT (id) DO NOTHING
    `, [USER_ROLE_ID, ADMIN_ROLE_ID]);
    log('    ✓ Roles seeded');
  } catch (err: any) {
    if (!isIgnorableError(err)) warn(`Roles seed: ${err.message}`);
  }
}

async function seedAdminUser(pool: Pool): Promise<void> {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', ['salman@xyric.ai']);
  if (existing.rows.length > 0) {
    log('    ✓ Admin user already exists');
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash('salman121', salt);

  const ADMIN_ROLE_ID = '11111111-1111-1111-1111-111111111102';

  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (
      email, password, first_name, last_name, date_of_birth, gender,
      auth_provider, onboarding_status, is_email_verified, is_active, role_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id`,
    [
      'salman@xyric.ai', hash, 'Salman', 'Admin',
      new Date('1990-01-15'), 'male', 'local',
      'assessment_pending', true, true, ADMIN_ROLE_ID,
    ],
  );

  const userId = result.rows[0].id;

  await pool.query('INSERT INTO user_preferences (user_id) VALUES ($1)', [userId]);
  await pool.query(
    `INSERT INTO consent_records (user_id, type, version, ip) VALUES
      ($1, 'terms_of_service', '1.0.0', '127.0.0.1'),
      ($1, 'privacy_policy', '1.0.0', '127.0.0.1')`,
    [userId],
  );
  await pool.query(
    'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, ADMIN_ROLE_ID],
  );

  log('    ✓ Admin user created (salman@xyric.ai)');
}

async function seedSubscriptionPlans(pool: Pool): Promise<void> {
  // Check if plans already exist
  const existing = await pool.query('SELECT COUNT(*) as cnt FROM subscription_plans');
  if (parseInt(existing.rows[0].cnt, 10) >= 3) {
    log('    ✓ Subscription plans already exist');
    return;
  }

  const PLANS = [
    {
      name: 'Free', slug: 'free',
      description: 'Essential tracking and community access.',
      amount_cents: 0, currency: 'usd', interval: 'month',
      tier: 0, credits: 50, rollover: 'none', rollover_cap: 0,
      trial_days: 7, sort: 0,
      features: ['1 week free full access', 'Basic activity & mood tracking', 'Daily step counter & water intake', '7-day history', 'Community access'],
    },
    {
      name: 'Pro', slug: 'pro',
      description: 'Full access, billed monthly. Cancel anytime.',
      amount_cents: 999, currency: 'usd', interval: 'month',
      tier: 20, credits: 2000, rollover: 'cap', rollover_cap: 2000,
      trial_days: 0, sort: 1,
      features: ['Everything in Free', 'Unlimited AI coaching', 'Advanced analytics', 'Nutrition & meal planning', 'Workout plans', 'Unlimited history', 'Priority support'],
    },
    {
      name: 'Premium', slug: 'premium',
      description: 'Everything in Pro plus exclusive features. Billed yearly.',
      amount_cents: 19999, currency: 'usd', interval: 'year',
      tier: 30, credits: 5000, rollover: 'cap', rollover_cap: 5000,
      trial_days: 0, sort: 2,
      features: ['Everything in Pro', 'Voice AI assistant', 'Knowledge graph insights', 'Money map & financial wellness', 'Premium competitions', 'Webinars', 'Advanced exports'],
    },
  ];

  const now = new Date().toISOString();
  for (const p of PLANS) {
    await pool.query(
      `INSERT INTO subscription_plans (
        name, slug, description, stripe_price_id, stripe_product_id,
        amount_cents, currency, interval, features, is_active, sort_order,
        tier, credits_included_monthly, credits_rollover_policy, credits_rollover_cap,
        trial_days, is_public, version, created_at, updated_at
      ) VALUES ($1,$2,$3, NULL, NULL, $4,$5,$6, $7::jsonb, true, $8,
                $9, $10, $11, $12, $13, true, 1, $14::timestamptz, $14::timestamptz)
      ON CONFLICT (slug) DO NOTHING`,
      [
        p.name, p.slug, p.description,
        p.amount_cents, p.currency, p.interval,
        JSON.stringify(p.features), p.sort,
        p.tier, p.credits, p.rollover, p.rollover_cap,
        p.trial_days, now,
      ],
    );
  }

  log('    ✓ Subscription plans seeded (Free / Pro / Premium)');
}

// ---------------------------------------------------------------------------
// Phase 5: Verify schema
// ---------------------------------------------------------------------------

async function verifySchema(pool: Pool): Promise<void> {
  log('Phase 5: Verifying schema…');

  const tables = await pool.query(
    `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`
  );
  const tableCount = parseInt(tables.rows[0].cnt, 10);

  const types = await pool.query(`SELECT COUNT(*) as cnt FROM pg_type WHERE typcategory='E'`);
  const typeCount = parseInt(types.rows[0].cnt, 10);

  log(`  Tables: ${tableCount}, Enum types: ${typeCount}`);

  if (tableCount < 50) {
    warn(`Only ${tableCount} tables — expected 150+. Some tables may have failed to create.`);
  } else {
    log('  ✓ Schema looks healthy');
  }
}

// ---------------------------------------------------------------------------
// SQL parsing utilities
// ---------------------------------------------------------------------------

function splitStatements(content: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '$' && !inDollarQuote) {
      let tagEnd = i + 1;
      while (tagEnd < content.length && content[tagEnd] !== '$') tagEnd++;
      if (tagEnd < content.length) {
        dollarTag = content.substring(i, tagEnd + 1);
        inDollarQuote = true;
        current += dollarTag;
        i = tagEnd;
        continue;
      }
    }

    if (inDollarQuote && char === '$') {
      const potentialEnd = content.substring(i, i + dollarTag.length);
      if (potentialEnd === dollarTag) {
        inDollarQuote = false;
        current += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = '';
        continue;
      }
    }

    current += char;

    if (char === ';' && !inDollarQuote) {
      const trimmed = stripLeadingComments(current);
      if (trimmed.length > 0) statements.push(trimmed);
      current = '';
    }
  }

  const remaining = stripLeadingComments(current);
  if (remaining.length > 0) statements.push(remaining);

  return statements;
}

function extractDoBlocksAndStatements(sql: string): string[] {
  const blocks: string[] = [];
  const doBlockRegex = /DO\s*\$[^$]*\$[\s\S]*?END\s*\$[^$]*\$\s*;/g;
  let lastIndex = 0;
  let match;

  while ((match = doBlockRegex.exec(sql)) !== null) {
    const between = sql.substring(lastIndex, match.index).trim();
    if (between) {
      for (const s of between.split(';')) {
        const cleaned = stripLeadingComments(s);
        if (cleaned) blocks.push(cleaned + ';');
      }
    }
    blocks.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  const after = sql.substring(lastIndex).trim();
  if (after) {
    for (const s of after.split(';')) {
      const cleaned = stripLeadingComments(s);
      if (cleaned) blocks.push(cleaned + ';');
    }
  }

  return blocks;
}

function stripLeadingComments(s: string): string {
  const lines = s.split('\n');
  const first = lines.findIndex(l => l.trim().length > 0 && !l.trim().startsWith('--'));
  return first >= 0 ? lines.slice(first).join('\n').trim() : '';
}

function isIgnorableError(err: any): boolean {
  const code = err?.code;
  const msg = err?.message || '';
  return (
    code === '42P07' || // duplicate_table
    code === '42710' || // duplicate_object
    code === '42701' || // duplicate_column
    code === '42P01' || // undefined_table (for DROP IF EXISTS)
    msg.includes('already exists') ||
    msg.includes('duplicate')
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  yHealth Database Migration & Seed');
  console.log('═══════════════════════════════════════════════════════════');

  const pool = buildPool();

  try {
    // Test connection
    const connResult = await pool.query('SELECT version(), current_database() AS db');
    const pgVersion = connResult.rows[0].version.split(',')[0];
    log(`Connected to ${connResult.rows[0].db} (${pgVersion})`);

    // Run all phases
    await applySchema(pool);
    await runVersionedMigrations(pool);
    await runColumnSyncAndSupplementary(pool);
    await seedEssentialData(pool);
    await verifySchema(pool);

    console.log('═══════════════════════════════════════════════════════════');
    log('✅ All phases completed successfully');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err: any) {
    console.error('═══════════════════════════════════════════════════════════');
    fail(`Fatal error: ${err.message}\n${err.stack}`);
  } finally {
    await pool.end();
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));
