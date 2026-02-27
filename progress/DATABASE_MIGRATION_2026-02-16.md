# Database Migration: Leaderboard & Competitions Tables

**Date:** 2026-02-16  
**Status:** ✅ Completed

## Overview

This migration adds the leaderboard and competitions system tables to the database. These tables support the new leaderboard and competitions features.

## Tables Added

### 1. `daily_user_scores`
- **Purpose:** Stores daily fitness scores per user (timezone-aware)
- **Key Fields:**
  - `user_id`, `date` (unique constraint)
  - `total_score` (0-100)
  - `component_scores` (JSONB: workout, nutrition, wellbeing, participation)
  - `rank_global`, `rank_country`, `rank_friends`
  - `explanation` (AI-generated)
  - `flags` (anti-cheat flags)

### 2. `leaderboard_snapshots`
- **Purpose:** Precomputed leaderboard snapshots for fast queries
- **Key Fields:**
  - `date`, `board_type`, `segment_key` (unique constraint)
  - `ranks` (JSONB array of top N users)
  - `metadata` (total_users, computed_at, etc.)

### 3. `competitions`
- **Purpose:** Competition definitions (AI-generated and admin-created)
- **Key Fields:**
  - `name`, `type`, `description`
  - `start_date`, `end_date`
  - `rules` (JSONB rules engine)
  - `eligibility` (JSONB criteria)
  - `scoring_weights` (JSONB)
  - `anti_cheat_policy` (JSONB)
  - `prize_metadata` (JSONB)
  - `status` (draft, active, ended, cancelled)

### 4. `competition_entries`
- **Purpose:** User competition participation and current standings
- **Key Fields:**
  - `competition_id`, `user_id` (unique constraint)
  - `joined_at`
  - `status` (active, disqualified, completed, withdrawn)
  - `current_rank`, `current_score`
  - `metadata` (JSONB)

## Enum Types

The following enum types are used (already defined in `01-enums.sql`):
- `leaderboard_type`: 'global', 'country', 'friends', 'competition'
- `competition_type`: 'ai_generated', 'admin_created'
- `competition_status`: 'draft', 'active', 'ended', 'cancelled'
- `competition_entry_status`: 'active', 'disqualified', 'completed', 'withdrawn'

## Files Updated

### Setup Files
1. **`server/src/database/setup.ts`**
   - Added table files to `TABLE_FILES` array:
     - `68-daily-user-scores.sql`
     - `69-leaderboard-snapshots.sql`
     - `70-competitions.sql`
     - `71-competition-entries.sql`

2. **`server/src/database/schema.sql`**
   - Added table includes for leaderboard/competitions tables

3. **`server/src/database/auto-migrate.ts`**
   - Added tables to `EXPECTED_TABLES` array:
     - `daily_user_scores`
     - `leaderboard_snapshots`
     - `competitions`
     - `competition_entries`
   - Added table files to `runFullSchema()` function

4. **`server/src/database/tables/99-triggers.sql`**
   - Added triggers for `updated_at` columns on all four tables

### Migration File
5. **`server/src/database/migrations/add-leaderboard-competitions-tables.sql`**
   - Standalone migration file for existing databases
   - Includes all table definitions, indexes, comments, and triggers
   - Safe to run multiple times (uses `IF NOT EXISTS`)

## How to Run Migration

### For New Databases
The tables will be automatically created when running:
```bash
npm run db:setup
```

### For Existing Databases
Run the migration file:
```bash
psql -d yhealth -f server/src/database/migrations/add-leaderboard-competitions-tables.sql
```

Or use the Node.js migration runner:
```bash
npm run db:migrate
```

## Indexes Created

### daily_user_scores
- `idx_daily_scores_date_total` - For date-based leaderboard queries
- `idx_daily_scores_user_date` - For user score history
- `idx_daily_scores_user_total` - For user ranking queries
- `idx_daily_scores_rank_global` - For global rank queries
- `idx_daily_scores_rank_country` - For country rank queries
- `idx_daily_scores_flags` - GIN index for JSONB flags

### leaderboard_snapshots
- `idx_leaderboard_snapshots_date_type` - For date/type queries
- `idx_leaderboard_snapshots_type_segment` - For type/segment queries
- `idx_leaderboard_snapshots_date_desc` - For recent snapshots

### competitions
- `idx_competitions_active` - For active competition queries
- `idx_competitions_type` - For type filtering
- `idx_competitions_dates` - For date range queries
- `idx_competitions_status` - For status filtering
- `idx_competitions_rules` - GIN index for JSONB rules
- `idx_competitions_eligibility` - GIN index for JSONB eligibility

### competition_entries
- `idx_competition_entries_comp_user` - For user entry lookup
- `idx_competition_entries_comp_rank` - For ranking queries
- `idx_competition_entries_user` - For user's competitions
- `idx_competition_entries_status` - For status filtering
- `idx_competition_entries_comp_score` - For score-based ranking

## Dependencies

- **Requires:** `users` table (foreign key references)
- **Enum types:** Must exist from `01-enums.sql`
- **Extensions:** `uuid-ossp` (for UUID generation)

## Notes

- All tables use UUID primary keys
- All tables have `created_at` and `updated_at` timestamps
- Triggers automatically update `updated_at` on row updates
- JSONB fields are indexed with GIN indexes for efficient queries
- Unique constraints prevent duplicate entries
- Foreign keys use `ON DELETE CASCADE` for data integrity

## Verification

After running the migration, verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'daily_user_scores',
    'leaderboard_snapshots',
    'competitions',
    'competition_entries'
  );
```

## Rollback

To rollback this migration (if needed):
```sql
DROP TABLE IF EXISTS competition_entries CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS leaderboard_snapshots CASCADE;
DROP TABLE IF EXISTS daily_user_scores CASCADE;
```

**Note:** This will delete all data in these tables. Only use if absolutely necessary.

