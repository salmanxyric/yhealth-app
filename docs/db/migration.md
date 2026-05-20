# Database Migration Guide

## Overview

yHealth uses a two-layer migration system:

1. **Table DDL** (`server/src/database/tables/*.sql`) - `CREATE TABLE IF NOT EXISTS` statements run when tables are missing
2. **Migration files** (`server/src/database/migrations/*.sql`) - Incremental schema changes (columns, indexes, constraints, seed data)

Migrations are idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, etc.) and safe to re-run.

## Migration CLI

All commands run from the **repo root** using `npm.cmd --prefix server`.

### Commands

| Command | Description |
|---------|-------------|
| `npm.cmd --prefix server run db:cli -- status` | Show DB connection info, table count, enum count |
| `npm.cmd --prefix server run db:cli -- pending` | List supplementary migrations with pending changes |
| `npm.cmd --prefix server run db:cli -- run-all` | Run ALL supplementary + add-\* migrations (safe, idempotent) |
| `npm.cmd --prefix server run db:cli -- run <file>` | Run a single migration file |
| `npm.cmd --prefix server run db:cli -- list` | List all migration files with their categories |
| `npm.cmd --prefix server run db:cli -- verify` | List all tables currently in the database |

### Examples

```powershell
# Check what's pending before applying
npm.cmd --prefix server run db:cli -- pending

# Apply all pending migrations
npm.cmd --prefix server run db:cli -- run-all

# Run a specific migration
npm.cmd --prefix server run db:cli -- run 20260518000000_conversation_claims.sql

# Check database health
npm.cmd --prefix server run db:cli -- status
```

## Other Migration Commands

These are legacy/specialized commands that predate the CLI:

| Command | Description |
|---------|-------------|
| `npm.cmd --prefix server run db:migrate:auto` | Full auto-migrate (tables + sync-columns + supplementary) |
| `npm.cmd --prefix server run db:migrate:verify` | Verify schema completeness (tables + types) |
| `npm.cmd --prefix server run db:migrate` | Legacy: workout reschedule bundle |
| `npm.cmd --prefix server run db:setup` | Initial database setup |

## How Migrations Work

### Auto-Migrate on Startup

When the server starts, `autoMigrate()` in `server/src/database/auto-migrate.ts` runs:

1. **Check existing tables** against `EXPECTED_TABLES` list
2. **Create missing tables** using DDL files in `server/src/database/tables/`
3. **Run `sync-missing-columns.sql`** to add any new columns to existing tables
4. **Run `SUPPLEMENTARY_MIGRATIONS`** array (dated/additive migrations not covered by table DDL)
5. **Run all `add-*` migration files** if any tables were missing

### Migration File Naming

| Pattern | When it runs |
|---------|-------------|
| `add-*.sql` | Auto-runs when tables are missing (step 5 above) |
| `YYYYMMDD_*.sql` | Only runs if listed in `SUPPLEMENTARY_MIGRATIONS` array |
| `sync-missing-columns.sql` | Always runs (step 3) |

### Adding a New Migration

1. Create the file in `server/src/database/migrations/`
2. Make it idempotent (`IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`)
3. Add it to the `SUPPLEMENTARY_MIGRATIONS` array in `auto-migrate.ts`
4. Also add it to the same array in `server/src/scripts/migrate-cli.ts`
5. If it creates a new table, also add the DDL to `server/src/database/tables/`

### Adding a New Column to an Existing Table

1. Add the column to the base DDL in `server/src/database/tables/` (for fresh installs)
2. Add an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `sync-missing-columns.sql` (for existing DBs)
3. Or create a dedicated migration file and add it to `SUPPLEMENTARY_MIGRATIONS`

## Troubleshooting

### "column X does not exist"

The column was added to the DDL but the migration wasn't run. Fix:

```powershell
# Check if it's pending
npm.cmd --prefix server run db:cli -- pending

# Apply all pending
npm.cmd --prefix server run db:cli -- run-all
```

### "relation X does not exist"

A table is missing. The auto-migrate should create it on startup, but you can force it:

```powershell
npm.cmd --prefix server run db:migrate:auto
```

### Migration file not running

Check:
1. Is it listed in `SUPPLEMENTARY_MIGRATIONS` in `auto-migrate.ts`?
2. If it starts with `add-*`, it only runs when tables are missing — add it to `SUPPLEMENTARY_MIGRATIONS` instead
3. Timestamp-prefixed files are **not** auto-discovered; they must be explicitly listed

### Known Environment Limitations

These migrations report as "pending" but cannot be applied due to local environment constraints — they are not regressions:

| Migration | Pending Item | Reason |
|-----------|-------------|--------|
| `20260508000000_wiki_reconcile.sql` | `wiki_pages.summary_embedding_vec`, `wiki_pages.body_embedding_vec` columns + index | Requires pgvector extension (`vector` type). Install pgvector locally or skip — production Railway has it. |
| `add-status-awareness-fields.sql` | `idx_proactive_messages_user_created` partial index | Uses `NOW()` in the `WHERE` predicate. PostgreSQL requires index predicates to be IMMUTABLE, but `NOW()` is STABLE. Fix: replace `NOW() - INTERVAL '7 days'` with a `CURRENT_TIMESTAMP`-based trigger or remove the partial filter. |

### Checking current DB state

```powershell
# Table count and connection info
npm.cmd --prefix server run db:cli -- status

# Full table list
npm.cmd --prefix server run db:cli -- verify

# Schema completeness (tables + types)
npm.cmd --prefix server run db:migrate:verify
```
