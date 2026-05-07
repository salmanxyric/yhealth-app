/**
 * One-time cleanup script to delete explicit fake/test users from the database.
 *
 * Safety rule: never delete arbitrary non-protected emails. Only explicit
 * test domains and known generated test prefixes are eligible.
 *
 * Handles the credit_transactions append-only trigger by disabling it
 * during deletion.
 *
 * Usage: npx tsx src/scripts/cleanup-fake-users.ts
 */

import 'dotenv/config';
import { Pool } from 'pg';

const PROTECTED_EMAILS = [
  'salman@xyric.ai',
  'ai-coach@balencia.system',
];

const TEST_USER_WHERE = `
  email NOT IN ($1, $2)
  AND (
    email LIKE '%@balencia.test'
    OR email LIKE '%@balancia.test'
    OR email LIKE 'test-%@example.com'
    OR email LIKE 'register-%@example.com'
    OR email LIKE 'dup-%@example.com'
    OR email LIKE 'weakpwd-%@example.com'
    OR email LIKE 'login-%@example.com'
  )
`;

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

async function main() {
  const config = process.env['DATABASE_URL']
    ? parseConnectionString(process.env['DATABASE_URL'])
    : {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432', 10),
        database: process.env['DB_NAME'] || 'balencia',
        user: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || '',
      };

  const pool = new Pool({ ...config, max: 3 });

  try {
    const before = await pool.query('SELECT COUNT(*) as cnt FROM users');
    console.log(`Total users before cleanup: ${before.rows[0].cnt}`);

    const targets = await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE ${TEST_USER_WHERE}`,
      PROTECTED_EMAILS,
    );

    if (targets.rows.length === 0) {
      console.log('No fake users to delete.');
      return;
    }

    console.log(`Found ${targets.rows.length} fake user(s) to delete...`);

    const ids = targets.rows.map(r => r.id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('ALTER TABLE credit_transactions DISABLE TRIGGER trg_credit_tx_no_delete');
      await client.query('ALTER TABLE audit_log DISABLE TRIGGER trg_audit_log_no_update');
      await client.query('ALTER TABLE audit_log DISABLE TRIGGER trg_audit_log_no_delete');
      const result = await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [ids]);
      await client.query('ALTER TABLE credit_transactions ENABLE TRIGGER trg_credit_tx_no_delete');
      await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_no_update');
      await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_no_delete');
      await client.query('COMMIT');
      console.log(`Deleted ${result.rowCount} fake users.`);
    } catch (err) {
      await client.query('ROLLBACK');
      await client.query('ALTER TABLE credit_transactions ENABLE TRIGGER trg_credit_tx_no_delete').catch(() => {});
      await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_no_update').catch(() => {});
      await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_no_delete').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    const after = await pool.query('SELECT COUNT(*) as cnt FROM users');
    console.log(`Total users after cleanup: ${after.rows[0].cnt}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
