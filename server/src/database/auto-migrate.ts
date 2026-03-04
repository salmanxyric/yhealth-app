import { pool } from './pg.js';
import { logger } from '../services/logger.service.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of expected tables in the database
const EXPECTED_TABLES = [
  'users',
  'user_preferences',
  'consent_records',
  'whatsapp_enrollments',
  'user_goals',
  'assessment_questions',
  'assessment_responses',
  'user_integrations',
  'sync_logs',
  'health_data_records',
  'user_plans',
  'activity_logs',
  'notifications',
  'ai_coach_sessions',
  'diet_plans',
  'meal_logs',
  'body_images',
  'exercises',
  'workout_plans',
  'workout_logs',
  'progress_records',
  'water_intake',
  'xp_transactions',
  'shopping_list',
  'workout_alarms',
  'recipes',
  'user_videos',
  'scheduled_reminders',
  'user_tasks',
  'rag_conversations',
  'voice_calls',
  'voice_call_events',
  'activity_status_history',
  'emotion_logs',
  'mental_recovery_scores',
  // Chat and messaging tables
  'chats',
  'messages',
  'chat_participants',
  'message_reactions',
  'message_reads',
  'starred_messages',
  // Automation tables
  'schedule_automation_logs',
  'activity_automation_logs',
  // Blog reactions
  'blog_reactions',
  // Contact submissions
  'contact_submissions',
  // Help center
  'help_articles',
  // Community
  'community_posts',
  'community_replies',
  // Webinars
  'webinars',
  'webinar_registrations',
  // Leaderboard & Competitions
  'daily_user_scores',
  'leaderboard_snapshots',
  'competitions',
  'competition_entries',
  // Exercise lookup & media tables
  'muscles',
  'equipment',
  'body_parts',
  'exercise_media',
  // Testimonials
  'testimonials',
  // AI Coaching Profiles
  'user_coaching_profiles',
  // User Classification & Intensity
  'user_classifications',
  'intensity_prescriptions',
  'personality_mode_events',
  // User Interventions
  'user_interventions',
  // Cross-Pillar Contradictions
  'cross_pillar_contradictions',
  // Gamification Upgrade
  'variable_rewards',
  'daily_pledges',
  'teams',
  'team_members',
  'achievement_definitions',
  'user_achievements',
  // Newsletter
  'newsletter_subscriptions',
  // Subscriptions (Stripe)
  'subscription_plans',
  'user_subscriptions',
  // Visitor analytics
  'visitor_visits',
];

// List of expected enum types
const EXPECTED_TYPES = [
  'user_role',
  'gender',
  'auth_provider',
  'onboarding_status',
  'consent_type',
  'notification_channel',
  'coaching_style',
  'coaching_intensity',
  'goal_category',
  'health_pillar',
  'goal_status',
  'assessment_type',
  'question_type',
  'integration_provider',
  'sync_status',
  'data_type',
  'plan_status',
  'activity_type',
  'day_of_week',
  'activity_log_status',
  'notification_type',
  'notification_priority',
  'ai_session_status',
  'call_status',
  'call_channel',
  'call_event_type',
  'activity_status',
  'emotion_category',
  'contact_status',
  'contact_priority',
];

/**
 * Check which tables exist in the database
 */
async function getExistingTables(): Promise<string[]> {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  `);
  return result.rows.map(row => row.table_name);
}

/**
 * Check which enum types exist in the database
 */
async function getExistingTypes(): Promise<string[]> {
  const result = await pool.query(`
    SELECT typname
    FROM pg_type
    WHERE typcategory = 'E'
  `);
  return result.rows.map(row => row.typname);
}

/**
 * Check which columns exist in a table
 */
async function getExistingColumns(tableName: string): Promise<string[]> {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
  `, [tableName]);
  return result.rows.map(row => row.column_name);
}

/**
 * Fix missing columns in the users table
 */
async function fixUsersTableColumns(): Promise<void> {
  try {
    const existingColumns = await getExistingColumns('users');
    logger.debug('Existing users table columns', { columns: existingColumns });
    
    // Check if auth_provider column exists
    if (!existingColumns.includes('auth_provider')) {
      logger.info('Adding missing auth_provider column to users table');
      // The auth_provider enum type should already exist (created in 01-enums.sql)
      // Just add the column - if the type doesn't exist, this will fail but that's expected
      try {
        await pool.query("ALTER TABLE users ADD COLUMN auth_provider auth_provider DEFAULT 'local'");
        logger.info('✅ Added auth_provider column to users table');
      } catch (err: any) {
        // If the enum type doesn't exist, try to create it first
        if (err?.message?.includes('type "auth_provider" does not exist') || err?.code === '42704') {
          logger.warn('auth_provider enum type does not exist, attempting to create it');
          try {
            await pool.query("CREATE TYPE auth_provider AS ENUM ('local', 'google', 'apple')");
            // Now try adding the column again
            await pool.query("ALTER TABLE users ADD COLUMN auth_provider auth_provider DEFAULT 'local'");
            logger.info('✅ Created auth_provider enum type and added column to users table');
          } catch (createErr: any) {
            // Type might already exist (race condition), try adding column again
            if (createErr?.message?.includes('already exists')) {
              await pool.query("ALTER TABLE users ADD COLUMN auth_provider auth_provider DEFAULT 'local'");
              logger.info('✅ Added auth_provider column to users table');
            } else {
              throw createErr;
            }
          }
        } else {
          throw err;
        }
      }
    }
    
    // Check if provider_id column exists
    if (!existingColumns.includes('provider_id')) {
      logger.info('Adding missing provider_id column to users table');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT');
      logger.info('✅ Added provider_id column to users table');
    }
    
    // Create index if it doesn't exist (only if auth_provider column exists)
    const updatedColumns = await getExistingColumns('users');
    if (updatedColumns.includes('auth_provider') && updatedColumns.includes('provider_id')) {
      try {
        await pool.query('CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_id)');
      } catch (err: any) {
        // Ignore index creation errors (might already exist)
        if (!err?.message?.includes('already exists')) {
          logger.debug('Index creation skipped or already exists');
        }
      }
    }
  } catch (error: any) {
    logger.error('Error fixing users table columns', {
      error: error?.message,
      code: error?.code
    });
    // Don't throw - allow migration to continue
  }
}

/**
 * Run the full schema if database is empty or missing critical tables
 * Loads all table files individually (like setup.ts) instead of using schema.sql
 * which contains psql-specific \i commands that don't work with pool.query()
 */
async function runFullSchema(): Promise<void> {
  // Table files in order (for foreign key dependencies) - same as setup.ts
  const TABLE_FILES = [
    '00-extensions.sql',
    '01-enums.sql',
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
    // Chat and messaging tables
    '38-chats.sql',
    '39-messages.sql',
    '40-chat-participants.sql',
    '41-message-reactions.sql',
    '42-message-reads.sql',
    '43-starred-messages.sql',
    '44-daily-health-metrics.sql',
    '45-stress-logs.sql',
    // Wellbeing pillar tables
    '46-mood-logs.sql',
    '47-journal-entries.sql',
    '48-habits.sql',
    '49-habit-logs.sql',
    '50-energy-logs.sql',
    '51-wellbeing-routines.sql',
    '52-routine-completions.sql',
    '53-mindfulness-practices.sql',
    '54-daily-schedules.sql',
    // Workout reschedule system tables
    '55-workout-schedule-tasks.sql',
    '56-user-workout-constraints.sql',
    '57-plan-reschedule-history.sql',
    // Goal daily tracking table
    '58-goal-daily-tracking.sql',
    // Wellbeing breathing tests table
    '59-breathing-tests.sql',
    // Emotional check-in sessions table
    '60-emotional-checkin-sessions.sql',
    // Nutrition analysis tables (order matters: 61 before 62 due to foreign key)
    '61-nutrition-daily-analysis.sql',
    '62-nutrition-calorie-adjustments.sql',
    '63-nutrition-adherence-patterns.sql',
    '64-nutrition-user-preferences.sql',
    // Automation tables
    '65-schedule-automation-logs.sql',
    '66-activity-automation-logs.sql',
    // Blog reactions and contact submissions
    '68-blog-reactions.sql',
    '69-contact-submissions.sql',
    // Leaderboard & Competitions tables
    '68-daily-user-scores.sql',
    '69-leaderboard-snapshots.sql',
    '70-competitions.sql',
    '71-competition-entries.sql',
    // Help center, community, webinars
    '70-help-articles.sql',
    '71-community-posts.sql',
    '72-webinars.sql',
    // Exercise lookup & media tables
    '80-exercise-lookup-tables.sql',
    '82-testimonials.sql',
    '83-user-coaching-profiles.sql',
    '99-triggers.sql',
  ];

  const tablesDir = join(__dirname, 'tables');

  logger.info('Applying full database schema (safe mode - preserving existing data)...');
  
  try {
    // Get existing tables to avoid dropping them
    const existingTables = await getExistingTables();
    logger.debug('Existing tables before migration', { tables: existingTables });
    
    // Process each schema file individually to filter out DROP statements
    for (const file of TABLE_FILES) {
      const filePath = join(tablesDir, file);
      if (!existsSync(filePath)) {
        if (file.includes('vector-extension')) {
          continue;
        }
        continue;
      }
      
      let content = readFileSync(filePath, 'utf-8');
      
      // Skip vector extension if pgvector is not available
      if (file.includes('vector-extension')) {
        try {
          const vectorCheck = await pool.query('SELECT 1 FROM pg_extension WHERE extname = \'vector\'');
          if (vectorCheck.rows.length === 0) {
            logger.debug(`Skipping ${file} (pgvector not available)`);
            continue;
          }
        } catch {
          logger.debug(`Skipping ${file} (pgvector check failed)`);
          continue;
        }
      }
      
      // Skip triggers/functions files in safe mode - they can be applied separately
      // These files contain dollar-quoted strings that can't be split by semicolons
      if (file === '99-triggers.sql' || file.includes('trigger') || file.includes('function')) {
        logger.debug(`Skipping ${file} in safe migration mode (triggers/functions should be applied separately)`);
        continue;
      }
      
      // Split into individual statements, but handle dollar-quoted strings properly
      // For now, we'll use a simple approach: split by semicolons but skip statements with $$
      const statements: string[] = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarTag = '';
      
      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        
        // Check for dollar quote start: $tag$ or $$
        if (char === '$' && !inDollarQuote) {
          // Look ahead to find the full dollar tag
          let tagEnd = i + 1;
          while (tagEnd < content.length && content[tagEnd] !== '$') {
            tagEnd++;
          }
          if (tagEnd < content.length) {
            dollarTag = content.substring(i, tagEnd + 1);
            inDollarQuote = true;
            currentStatement += dollarTag;
            i = tagEnd;
            continue;
          }
        }
        
        // Check for dollar quote end
        if (inDollarQuote && char === '$') {
          // Check if this matches our dollar tag
          const potentialEnd = content.substring(i, i + dollarTag.length);
          if (potentialEnd === dollarTag) {
            inDollarQuote = false;
            currentStatement += dollarTag;
            i += dollarTag.length - 1;
            dollarTag = '';
            continue;
          }
        }
        
        currentStatement += char;
        
        // If we hit a semicolon and we're not in a dollar quote, it's a statement boundary
        if (char === ';' && !inDollarQuote) {
          const trimmed = currentStatement.trim();
          if (trimmed.length > 0 && !trimmed.startsWith('--')) {
            statements.push(trimmed);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim().length > 0 && !currentStatement.trim().startsWith('--')) {
        statements.push(currentStatement.trim());
      }
      
      for (const stmt of statements) {
        const upperStmt = stmt.toUpperCase();
        
        // Skip DROP TABLE statements to preserve existing data
        if (upperStmt.includes('DROP TABLE')) {
          logger.debug(`Skipping DROP statement in ${file}`);
          continue;
        }
        
        // Skip CREATE/DROP FUNCTION, CREATE/DROP TRIGGER (handled separately)
        if (upperStmt.includes('CREATE FUNCTION') || upperStmt.includes('DROP FUNCTION') ||
            upperStmt.includes('CREATE OR REPLACE FUNCTION') ||
            upperStmt.includes('CREATE TRIGGER') || upperStmt.includes('DROP TRIGGER')) {
          logger.debug(`Skipping function/trigger statement in ${file}`);
          continue;
        }
        
        // Skip DO blocks (anonymous code blocks)
        if (upperStmt.trim().startsWith('DO ')) {
          logger.debug(`Skipping DO block in ${file}`);
          continue;
        }
        
        // Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
        let safeStmt = stmt;
        if (upperStmt.startsWith('CREATE TABLE') && !upperStmt.includes('IF NOT EXISTS')) {
          // Extract table name and rest of statement
          const tableMatch = stmt.match(/CREATE TABLE\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            // Only convert if table doesn't exist
            if (!existingTables.includes(tableName)) {
              safeStmt = stmt.replace(/CREATE TABLE\s+(\w+)/i, 'CREATE TABLE IF NOT EXISTS $1');
              logger.debug(`Converting CREATE TABLE to CREATE TABLE IF NOT EXISTS for ${tableName}`);
            } else {
              logger.debug(`Table ${tableName} already exists, skipping CREATE TABLE`);
              continue;
            }
          }
        }
        
        // Execute the statement
        try {
          await pool.query(safeStmt);
        } catch (err: any) {
          // Ignore "already exists" errors for CREATE TABLE IF NOT EXISTS, indexes, etc.
          if (err?.code === '42P07' || err?.code === '42710' || err?.message?.includes('already exists')) {
            logger.debug(`Object already exists (safe to ignore): ${safeStmt.substring(0, 50)}...`);
            continue;
          }
          // Ignore column does not exist errors for indexes (columns might be added later)
          if (err?.message?.includes('does not exist') && upperStmt.includes('CREATE INDEX')) {
            logger.debug(`Index references non-existent column (safe to ignore): ${safeStmt.substring(0, 50)}...`);
            continue;
          }
          // Log other errors but continue with other statements
          logger.warn(`Error executing statement in ${file}:`, {
            error: err.message,
            statement: safeStmt.substring(0, 100)
          });
        }
      }
    }
    
    logger.info('Full database schema applied successfully (existing data preserved)');
  } catch (error: any) {
    logger.error('Error applying schema:', {
      error: error?.message,
      code: error?.code
    });
    throw error;
  }
}

/**
 * Run a specific migration file
 */
async function runMigration(migrationFile: string): Promise<void> {
  const migrationPath = join(__dirname, 'migrations', migrationFile);

  if (!existsSync(migrationPath)) {
    logger.warn('Migration file not found', { path: migrationPath });
    return;
  }

  const migration = readFileSync(migrationPath, 'utf-8');

  // Check if migration contains DO blocks (PostgreSQL anonymous code blocks)
  // These need to be executed as a single statement
  if (migration.includes('DO $$')) {
    logger.info(`Running migration: ${migrationFile} (DO block detected, executing as single statement)`);
    try {
      await pool.query(migration);
    } catch (error: any) {
      // Ignore "already exists" errors
      if (error?.code === '42P07' || error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        logger.debug(`Migration ${migrationFile} already applied or object exists`);
        return;
      }
      throw error;
    }
    return;
  }

  // Split by semicolons and execute each statement separately to avoid syntax errors
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  logger.info(`Running migration: ${migrationFile} (${statements.length} statements)`);
  
  for (const statement of statements) {
    if (statement.trim().length > 0) {
      try {
        await pool.query(statement);
      } catch (error: any) {
        // Ignore "already exists" errors for IF NOT EXISTS statements
        if (error?.code === '42701' || error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
          logger.debug(`Statement already applied: ${statement.substring(0, 50)}...`);
          continue;
        }
        throw error;
      }
    }
  }
  
  logger.info(`Migration completed: ${migrationFile}`);
}

/**
 * Check database and auto-migrate missing tables
 */
export async function autoMigrate(): Promise<{
  success: boolean;
  tablesCreated: string[];
  existingTables: string[];
}> {
  try {
    // Get existing tables
    const existingTables = await getExistingTables();
    const existingTypes = await getExistingTypes();

    logger.debug('Existing tables', { tables: existingTables });
    logger.debug('Existing types', { types: existingTypes });

    // Fix missing columns in existing tables (especially users table)
    if (existingTables.includes('users')) {
      await fixUsersTableColumns();
    }

    // Find missing tables
    const missingTables = EXPECTED_TABLES.filter(
      table => !existingTables.includes(table)
    );

    // Find missing types
    const missingTypes = EXPECTED_TYPES.filter(
      type => !existingTypes.includes(type)
    );

    if (missingTables.length === 0 && missingTypes.length === 0) {
      logger.info('Database schema is up to date', {
        tableCount: existingTables.length,
      });
      return {
        success: true,
        tablesCreated: [],
        existingTables
      };
    }

    logger.info('Missing database objects detected', {
      missingTables,
      missingTypes,
    });

    // If most tables are missing, run full schema
    if (missingTables.length > EXPECTED_TABLES.length / 2) {
      logger.info('Running full schema migration...');
      await runFullSchema();

      const newTables = await getExistingTables();
      return {
        success: true,
        tablesCreated: missingTables,
        existingTables: newTables
      };
    }

    // Otherwise, run individual migrations for missing tables
    const tablesCreated: string[] = [];

    // Check for specific migrations in the migrations folder
    const migrationsDir = join(__dirname, 'migrations');
    const tablesDir = join(__dirname, 'tables');

    if (existsSync(migrationsDir)) {
      const migrationFiles = readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const table of missingTables) {
        // Look for a migration file that creates this table
        const migrationFile = migrationFiles.find(f =>
          f.toLowerCase().includes(table.replace(/_/g, '-')) ||
          f.toLowerCase().includes(table)
        );

        if (migrationFile) {
          try {
            await runMigration(migrationFile);
            tablesCreated.push(table);
          } catch (error) {
            logger.error(`Failed to run migration for ${table}`, {
              error: (error as Error).message
            });
          }
        } else if (existsSync(tablesDir)) {
          // Try to find the table file in tables directory
          const tableFiles = readdirSync(tablesDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
          
          // Map table names to file names
          const tableToFileMap: Record<string, string> = {
            'starred_messages': '43-starred-messages.sql',
            'message_reads': '42-message-reads.sql',
            'message_reactions': '41-message-reactions.sql',
            'chat_participants': '40-chat-participants.sql',
            'messages': '39-messages.sql',
            'chats': '38-chats.sql',
            'mental_recovery_scores': '35-mental-recovery-scores.sql',
            'emotion_logs': '34-emotion-logs.sql',
            'activity_status_history': '33-activity-status-history.sql',
            'voice_call_events': '32-voice-call-events.sql',
            'voice_calls': '31-voice-calls.sql',
            'rag_conversations': '30-vector-extension.sql',
            'user_tasks': '29-user-tasks.sql',
            'scheduled_reminders': '28-scheduled-reminders.sql',
            'schedule_automation_logs': '65-schedule-automation-logs.sql',
            'activity_automation_logs': '66-activity-automation-logs.sql',
            'blog_reactions': '68-blog-reactions.sql',
            'contact_submissions': '69-contact-submissions.sql',
            'help_articles': '70-help-articles.sql',
            'community_posts': '71-community-posts.sql',
            'community_replies': '71-community-posts.sql',
            'webinars': '72-webinars.sql',
            'webinar_registrations': '72-webinars.sql',
            'user_videos': '27-user-videos.sql',
            'recipes': '27-recipes.sql',
            'workout_alarms': '26-workout-alarms.sql',
            'shopping_list': '25-shopping-list.sql',
            'xp_transactions': '24-xp-transactions.sql',
            'water_intake': '23-water-intake.sql',
            'progress_records': '22-progress-records.sql',
            'workout_logs': '21-workout-logs.sql',
            'workout_plans': '20-workout-plans.sql',
            'exercises': '19-exercises.sql',
            'body_images': '18-body-images.sql',
            'meal_logs': '17-meal-logs.sql',
            'diet_plans': '16-diet-plans.sql',
            'ai_coach_sessions': '15-ai-coach-sessions.sql',
            'notifications': '14-notifications.sql',
            'activity_logs': '13-activity-logs.sql',
            'user_plans': '12-user-plans.sql',
            'health_data_records': '11-health-data-records.sql',
            'sync_logs': '10-sync-logs.sql',
            'user_integrations': '09-user-integrations.sql',
            'assessment_responses': '08-assessment-responses.sql',
            'assessment_questions': '07-assessment-questions.sql',
            'user_goals': '06-user-goals.sql',
            'user_preferences': '05-user-preferences.sql',
            'whatsapp_enrollments': '04-whatsapp-enrollments.sql',
            'consent_records': '03-consent-records.sql',
            'users': '02-users.sql',
            'user_coaching_profiles': '83-user-coaching-profiles.sql',
          };
          
          const tableFile = tableToFileMap[table] || tableFiles.find(f => {
            const fileName = f.toLowerCase().replace(/[^a-z0-9]/g, '');
            const tableName = table.toLowerCase().replace(/_/g, '');
            return fileName.includes(tableName) || tableName.includes(fileName.substring(0, 10));
          });

          if (tableFile) {
            try {
              logger.info(`Creating table ${table} from ${tableFile}`);
              const tableSql = readFileSync(join(tablesDir, tableFile), 'utf-8');
              
              // Split by semicolons and execute statements
              const statements = tableSql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
              
              for (const stmt of statements) {
                if (stmt.trim().length > 0) {
                  try {
                    await pool.query(stmt);
                  } catch (err: any) {
                    // Ignore "already exists" errors for DROP TABLE IF EXISTS and CREATE IF NOT EXISTS
                    if (err?.code === '42P01' && stmt.toUpperCase().includes('DROP TABLE IF EXISTS')) {
                      // Table doesn't exist, that's fine
                      continue;
                    }
                    if (err?.code === '42P07' || err?.message?.includes('already exists') || err?.message?.includes('duplicate')) {
                      logger.debug(`Object already exists: ${stmt.substring(0, 50)}...`);
                      continue;
                    }
                    // For CREATE TABLE, if table already exists, that's fine
                    if (err?.code === '42P07' && stmt.toUpperCase().includes('CREATE TABLE')) {
                      logger.debug(`Table ${table} already exists`);
                      break; // Table exists, we're done
                    }
                    throw err;
                  }
                }
              }
              
              tablesCreated.push(table);
            } catch (error) {
              logger.error(`Failed to create table ${table} from ${tableFile}`, {
                error: (error as Error).message
              });
            }
          }
        }
      }

      // Also run any column addition migrations (like add-voice-calls-session-type, add-calories-to-shopping-list)
      for (const migrationFile of migrationFiles) {
        if (migrationFile.includes('add-') && (
          migrationFile.includes('column') || 
          migrationFile.includes('session-type') ||
          migrationFile.includes('calories') ||
          migrationFile.includes('shopping-list')
        )) {
          try {
            logger.info(`Running column addition migration: ${migrationFile}`);
            await runMigration(migrationFile);
          } catch (error: any) {
            // Ignore "column already exists" errors (code 42701) and "duplicate" errors
            if (error?.code !== '42701' && !error?.message?.includes('already exists') && !error?.message?.includes('duplicate')) {
              logger.warn(`Migration ${migrationFile} had issues (may already be applied):`, {
                error: (error as Error).message
              });
            } else {
              logger.debug(`Migration ${migrationFile} already applied or column exists`);
            }
          }
        }
      }
    }

    // If we still have missing tables after individual migrations, run full schema
    const stillMissingTables = missingTables.filter(
      t => !tablesCreated.includes(t)
    );

    if (stillMissingTables.length > 0) {
      logger.info('Running full schema for remaining tables...', {
        stillMissingTables
      });
      await runFullSchema();
      tablesCreated.push(...stillMissingTables);
    }

    const finalTables = await getExistingTables();

    logger.info('Auto-migration completed', {
      tablesCreated,
      totalTables: finalTables.length,
    });

    return {
      success: true,
      tablesCreated,
      existingTables: finalTables
    };

  } catch (error) {
    logger.error('Auto-migration failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    return {
      success: false,
      tablesCreated: [],
      existingTables: []
    };
  }
}

/**
 * Verify database schema integrity
 */
export async function verifySchema(): Promise<{
  isValid: boolean;
  missingTables: string[];
  missingTypes: string[];
}> {
  const existingTables = await getExistingTables();
  const existingTypes = await getExistingTypes();

  const missingTables = EXPECTED_TABLES.filter(
    table => !existingTables.includes(table)
  );

  const missingTypes = EXPECTED_TYPES.filter(
    type => !existingTypes.includes(type)
  );

  return {
    isValid: missingTables.length === 0 && missingTypes.length === 0,
    missingTables,
    missingTypes,
  };
}

export default {
  autoMigrate,
  verifySchema,
  EXPECTED_TABLES,
  EXPECTED_TYPES,
};
