/**
 * Jest Global Teardown
 *
 * Runs after ALL test suites complete. Deletes test-created users from the
 * database to prevent accumulation of generated rows across test runs.
 *
 * This must be conservative: tests are sometimes pointed at a shared/dev
 * database, so only explicit test-domain/prefix accounts are eligible.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

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

export default async function globalTeardown() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  const config = process.env['DATABASE_URL']
    ? parseConnectionString(process.env['DATABASE_URL'])
    : {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432', 10),
        database: process.env['DB_NAME'] || 'balencia',
        user: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || '',
      };

  const pool = new Pool({ ...config, max: 2, connectionTimeoutMillis: 5000 });

  try {
    const testUsers = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE ${TEST_USER_WHERE}`,
      PROTECTED_EMAILS,
    );

    if (testUsers.rows.length === 0) {
      return;
    }

    const ids = testUsers.rows.map(r => r.id);
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
      console.log(`[test-teardown] Cleaned up ${result.rowCount} test users`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      await client.query('ALTER TABLE credit_transactions ENABLE TRIGGER trg_credit_tx_no_delete').catch(() => {});
      await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_no_update').catch(() => {});
      await client.query('ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_no_delete').catch(() => {});
      console.error('[test-teardown] Cleanup failed:', err.message);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[test-teardown] Could not connect for cleanup:', err.message);
  } finally {
    await pool.end();
  }
}
