import { pool } from '../config/database.config.js';
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
  'user_body_images',
  'exercises',
  'workout_plans',
  'workout_logs',
  'progress_records',
  'water_intake_logs',
  'user_xp_transactions',
  'shopping_list_items',
  'workout_alarms',
  'user_recipes',
  'user_private_videos',
  'scheduled_reminders',
  'user_tasks',
  'quick_notes',
  'push_tokens',
  'push_subscriptions',
  'user_communication_preferences',
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
  // Wellbeing — Journaling & Check-ins
  'daily_checkins',
  'life_goals',
  'daily_intentions',
  'journal_goal_links',
  'journal_insights',
  'journal_patterns',
  'lessons_learned',
  'voice_journal_sessions',
  'mood_behavioral_patterns',
  // Gamification
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
  // Role-based access control
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  // Additional tables from migrations
  'competition_chat_messages',
  'competition_chat_reactions',
  'habits',
  'habit_logs',
  'energy_logs',
  'user_engagement_sessions',
  'daily_analysis_reports',
  'user_video_interactions',
  'motivational_videos',
  'personality_mode_events',
  'emotional_checkin_sessions',
  'emotional_checkin_responses',
  'schedule_templates',
  'schedule_items',
  'call_summaries',
  'action_items',
  'task_reminder_logs',
  'reminder_logs',
  'vector_embeddings',
  'rag_messages',
  'health_knowledge_base',
  'user_health_embeddings',
  'daily_health_metrics',
  'stress_logs',
  'mood_logs',
  'journal_entries',
  'mindfulness_practices',
  'wellbeing_routines',
  'routine_completions',
  'daily_schedules',
  'schedule_links',
  'workout_schedule_tasks',
  'user_workout_constraints',
  'plan_reschedule_history',
  'nutrition_daily_analysis',
  'nutrition_calorie_adjustments',
  'nutrition_adherence_patterns',
  'nutrition_user_preferences',
  'cross_pillar_contradictions',
  'blogs',
  'activity_events',
  'schema_migrations',
  'user_coaching_profile_history',
  'user_classifications',
  'intensity_prescriptions',
  'user_interventions',
  'goal_daily_tracking',
  'user_commitments',
  'proactive_messages',
  // Intelligence tables (Epic 08)
  'insight_feedback',
  'weekly_analysis_reports',
  'prediction_accuracy_tracking',
  // Spotify integration
  'spotify_cached_playlists',
  // Yoga & Meditation (F7.9)
  'yoga_poses',
  'yoga_sessions',
  'yoga_session_logs',
  'meditation_timers',
  'yoga_streaks',
  // Life History (pgvector 768-dim)
  'user_life_history',
  // Life goal milestones, motivation & goal actions
  'life_goal_milestones',
  'life_goal_checkins',
  'user_motivation_profiles',
  'goal_actions',
  'goal_action_responses',
  // Email engine tables
  'email_logs',
  'email_preferences',
  // Vision Testing
  'vision_test_sessions',
  'vision_test_responses',
  'vision_streaks',
  // Finance module
  'finance_profiles',
  'finance_transactions',
  'finance_budgets',
  'finance_saving_goals',
  'finance_ai_insights',
  'finance_monthly_snapshots',
  // Streak system
  'user_streaks',
  'streak_activity_log',
  'streak_freeze_log',
  'streak_rewards',
  // Contextual Timing
  'user_timing_profiles',
  // Holiday / cultural calendar
  'holiday_calendar',
  'user_holiday_preferences',
  // Mental health guardrail audit
  'mental_health_screening_events',
  // Universal Data Source Correlation
  'data_source_connections',
  'data_source_signals',
  'user_daily_correlations',
  'spotify_listening_history',
  'prayer_schedules',
  'spending_transactions',
  // Competition invitations (shared challenges)
  'competition_invitations',
  // Reasoning graph (Knowledge Graph AI Coaching)
  'user_feature_state',
  'reasoning_edges',
  // User files & tool operations
  'user_files',
  'tool_operations',
  // Accountability & social
  'accountability_contacts',
  'accountability_groups',
  'accountability_group_members',
  'accountability_consent',
  'accountability_contact_consent',
  'accountability_triggers',
  'accountability_trigger_logs',
  'accountability_consent_audit',
  'accountability_contracts',
  'accountability_contract_violations',
  'accountability_contract_checks',
  'calendar_connections',
  'calendar_events',
  'user_follows',
  'buddy_discovery_consent',
  'buddy_suggestions_cache',
  // Life areas
  'life_areas',
  'life_area_links',
  // Sleep & medications
  'sleep_logs',
  'user_medications',
  // Intelligence system
  'intelligence_memories',
  'intelligence_artifacts',
  'intelligence_plans',
  'intelligence_core_profile',
  'intelligence_log_references',
  'intelligence_analyses',
  'intelligence_session_context',
  'intelligence_feedback',
  // Entitlement & subscription hardening
  'entitlement_shadow_log',
  'user_entitlements_cache',
  'credit_wallets',
  'credit_transactions',
  'plan_features',
  'promo_codes',
  'promo_redemptions',
  'admin_overrides',
  'tool_audit_log',
  // Goal action completions
  'goal_action_completions',
  // Wiki system (LLM knowledge layer)
  'wiki_pages',
  'wiki_links',
  'wiki_page_sources',
  'wiki_log',
  'wiki_index',
  'wiki_page_versions',
  'chat_calls',
  'ai_coach_call_log',
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
  'competition_type',
  'competition_status',
  'competition_entry_status',
  'leaderboard_type',
  // Wiki system enums
  'wiki_page_type',
  'wiki_page_status',
  'wiki_link_type',
  'wiki_log_operation',
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
    // RBAC tables
    '73-roles.sql',
    '74-permissions.sql',
    '75-role-permissions.sql',
    '76-newsletter-subscriptions.sql',
    '77-user-roles.sql',
    // Exercise lookup & media tables
    '80-exercise-lookup-tables.sql',
    '82-testimonials.sql',
    '83-user-coaching-profiles.sql',
    // Journaling & check-ins
    '84-daily-checkins.sql',
    '85-life-goals.sql',
    '86-journal-insights.sql',
    // Journaling inspiration features
    '87-lessons-learned.sql',
    '88-insight-feedback.sql',
    '88-voice-journal-sessions.sql',
    // Intelligence tables
    '89-weekly-analysis-reports.sql',
    '90-prediction-accuracy.sql',
    // Spotify integration
    '91-spotify-cached-playlists.sql',
    // Yoga & Meditation
    '92-yoga-poses.sql',
    '93-yoga-sessions.sql',
    '94-yoga-session-logs.sql',
    '95-meditation-timers.sql',
    '96-yoga-streaks.sql',
    // Life History
    '97-user-life-history.sql',
    // Life goal milestones & checkins
    '98-life-goal-milestones-checkins.sql',
    // Motivation profiles
    '99-user-motivation-profiles.sql',
    // Goal actions
    '100-goal-actions.sql',
    // Proactive messages
    '101-proactive-messages.sql',
    // Email engine
    '102-email-logs.sql',
    '103-email-preferences.sql',
    // Vision testing
    '104-vision-test-sessions.sql',
    '105-vision-test-responses.sql',
    '106-vision-streaks.sql',
    // Finance module
    '107-finance.sql',
    // Streak system
    '108-user-streaks.sql',
    '109-streak-activity-log.sql',
    '110-streak-freeze-log.sql',
    '111-streak-rewards.sql',
    // Accountability & social
    '112-accountability-system.sql',
    '113-accountability-contracts.sql',
    '113-calendar-connections.sql',
    '114-calendar-events.sql',
    '115-user-follows.sql',
    // Obstacle diagnosis & life areas
    '116-goal-obstacles.sql',
    '116-life-areas.sql',
    // Goal reconnection (DKA prevention) & life area links
    '117-goal-reconnections.sql',
    '117-life-area-links.sql',
    // Contextual timing + holiday calendar
    '118-user-timing-profiles.sql',
    '119-holiday-calendar.sql',
    // Universal Data Source Correlation
    '120-data-source-connections.sql',
    '121-data-source-signals.sql',
    '122-user-daily-correlations.sql',
    '123-spotify-listening-history.sql',
    '124-prayer-schedules.sql',
    '125-finance-tracking.sql',
    // Competition invitations (shared challenges)
    '126-competition-invitations.sql',
    // Mental health screening audit
    '127-mental-health-screening-events.sql',
    // Sleep & medications
    '128-sleep-logs.sql',
    '129-user-medications.sql',
    // Intelligence system (8 tables)
    '130-intelligence.sql',
    // Quick notes
    '130-quick-notes.sql',
    // Wiki system (LLM knowledge layer)
    '131-wiki.sql',
    // Triggers (must be last)
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
          logger.debug(`Skipping DROP TABLE statement in ${file}`);
          continue;
        }

        // Skip DROP TYPE ... CASCADE — this destroys ALL columns using the enum type!
        // Types are safe to keep as-is; new enum values can be added via ALTER TYPE.
        if (upperStmt.includes('DROP TYPE')) {
          logger.debug(`Skipping DROP TYPE statement in ${file} (prevents CASCADE column loss)`);
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
        
        // Skip CREATE TYPE if the type already exists (no IF NOT EXISTS support in PostgreSQL)
        if (upperStmt.startsWith('CREATE TYPE')) {
          const typeMatch = stmt.match(/CREATE TYPE\s+(\w+)/i);
          if (typeMatch) {
            const typeName = typeMatch[1];
            try {
              const typeExists = await pool.query('SELECT 1 FROM pg_type WHERE typname = $1', [typeName]);
              if (typeExists.rows.length > 0) {
                logger.debug(`Type ${typeName} already exists, skipping CREATE TYPE`);
                continue;
              }
            } catch {
              // If check fails, try creating anyway
            }
          }
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
          // Ignore column/relation does not exist errors for indexes and comments (columns added by sync later)
          if (err?.message?.includes('does not exist') && (upperStmt.includes('CREATE INDEX') || upperStmt.includes('COMMENT ON'))) {
            logger.debug(`References non-existent column (safe to ignore, sync will fix): ${safeStmt.substring(0, 60)}...`);
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
function stripLeadingComments(sql: string): string {
  const lines = sql.split('\n');
  const firstNonComment = lines.findIndex(l => l.trim().length > 0 && !l.trim().startsWith('--'));
  return firstNonComment >= 0 ? lines.slice(firstNonComment).join('\n').trim() : '';
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarQuoteTag: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !dollarQuoteTag && char === '-' && next === '-') {
      current += char + next;
      i++;
      inLineComment = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !dollarQuoteTag && char === '/' && next === '*') {
      current += char + next;
      i++;
      inBlockComment = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === '$') {
      const tagMatch = sql.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (tagMatch) {
        const tag = tagMatch[0];
        current += tag;
        i += tag.length - 1;
        dollarQuoteTag = dollarQuoteTag === tag ? null : tag;
        continue;
      }
    }

    if (!dollarQuoteTag && !inDoubleQuote && char === "'") {
      current += char;
      if (inSingleQuote && next === "'") {
        current += next;
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (!dollarQuoteTag && !inSingleQuote && char === '"') {
      current += char;
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !dollarQuoteTag && char === ';') {
      const cleaned = stripLeadingComments(current);
      if (cleaned) {
        statements.push(`${cleaned};`);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const cleaned = stripLeadingComments(current);
  if (cleaned) {
    statements.push(cleaned);
  }

  return statements;
}

async function runMigration(migrationFile: string): Promise<void> {
  const migrationPath = join(__dirname, 'migrations', migrationFile);

  if (!existsSync(migrationPath)) {
    logger.warn('Migration file not found', { path: migrationPath });
    return;
  }

  const migration = readFileSync(migrationPath, 'utf-8');

  // Check if migration contains DO blocks (PostgreSQL anonymous code blocks)
  // Execute each DO block independently so one failure doesn't abort the rest
  if (migration.includes('DO $$')) {
    logger.info(`Running migration: ${migrationFile} (DO blocks detected, executing independently)`);

    // Split into individual DO blocks and regular SQL statements
    const blocks: string[] = [];
    const doBlockRegex = /DO\s*\$\$[\s\S]*?END\s*\$\$\s*;/g;
    let lastIndex = 0;
    let match;

    while ((match = doBlockRegex.exec(migration)) !== null) {
      const between = migration.substring(lastIndex, match.index).trim();
      if (between) {
        blocks.push(...splitSqlStatements(between));
      }
      blocks.push(match[0]);
      lastIndex = match.index + match[0].length;
    }

    const afterLastBlock = migration.substring(lastIndex).trim();
    if (afterLastBlock) {
      blocks.push(...splitSqlStatements(afterLastBlock));
    }

    let successCount = 0;
    let skipCount = 0;
    for (const block of blocks) {
      try {
        await pool.query(block);
        successCount++;
      } catch (error: any) {
        if (error?.code === '42P07' || error?.code === '42710' || error?.code === '42701' ||
            error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
          skipCount++;
          continue;
        }
        // Log but continue with remaining blocks
        logger.warn(`Migration block had issues in ${migrationFile}`, {
          error: error?.message,
          block: block.substring(0, 80) + '...',
        });
      }
    }

    logger.info(`Migration completed: ${migrationFile} (${successCount} applied, ${skipCount} skipped)`);
    return;
  }

  // Split by semicolons and execute each statement separately to avoid syntax errors
  // Strip leading comment lines from each chunk before filtering — a chunk like
  // "-- comment\nCREATE TABLE ..." should NOT be discarded.
  const statements = splitSqlStatements(migration);

  logger.info(`Running migration: ${migrationFile} (${statements.length} statements)`);

  for (const statement of statements) {
    if (statement.trim().length > 0) {
      try {
        await pool.query(statement);
      } catch (error: any) {
        // Ignore "already exists" errors for IF NOT EXISTS statements
        if (error?.code === '42701' || error?.code === '42P07' || error?.code === '42710' ||
            error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
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
 * Dated / additive migrations and index packs not fully covered by table-first DDL.
 * All are written to be idempotent (IF NOT EXISTS, DO $$ duplicate guards, etc.).
 * Runs after sync-missing-columns so columns like ai_coach_persona exist first.
 */
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
  // Activity-status awareness: adds user_plans.status_overrides,
  // user_coaching_profiles.status_patterns, and lifecycle fields/indexes on
  // activity_status_history. Idempotent (ADD COLUMN IF NOT EXISTS / DO guards).
  // Listed here because all expected tables exist on most envs, so the
  // missing-tables branch that auto-runs `add-*` files never fires.
  'add-status-awareness-fields.sql',
  '20260513_ai_coach_call_log.sql',
  'add-voice-schedule-prefs.sql',
];

async function runSupplementaryMigrations(): Promise<void> {
  for (const migrationFile of SUPPLEMENTARY_MIGRATIONS) {
    try {
      await runMigration(migrationFile);
      logger.info('Supplementary migration completed', { migrationFile });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn('Supplementary migration had issues (may already be applied)', {
        migrationFile,
        error: message,
      });
    }
  }
}

async function runColumnSyncAndSupplementary(): Promise<void> {
  try {
    await runMigration('sync-missing-columns.sql');
    logger.info('Column sync migration completed');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('Column sync migration had issues', { error: message });
  }
  await runSupplementaryMigrations();
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
      await runColumnSyncAndSupplementary();
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

      await runColumnSyncAndSupplementary();

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

      const migrationTableMap: Record<string, string> = {
        'user_feature_state': '20260428000000_reasoning_graph.sql',
        'reasoning_edges': '20260428000000_reasoning_graph.sql',
      };

      for (const table of missingTables) {
        // Look for a migration file that creates this table
        const migrationFile = migrationTableMap[table] || migrationFiles.find(f =>
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
            'quick_notes': '130-quick-notes.sql',
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
            'daily_checkins': '84-daily-checkins.sql',
            'life_goals': '85-life-goals.sql',
            'daily_intentions': '85-life-goals.sql',
            'journal_goal_links': '85-life-goals.sql',
            'journal_insights': '86-journal-insights.sql',
            'journal_patterns': '86-journal-insights.sql',
            'newsletter_subscriptions': '76-newsletter-subscriptions.sql',
            'user_roles': '77-user-roles.sql',
            'leaderboard_snapshots': '69-leaderboard-snapshots.sql',
            'lessons_learned': '87-lessons-learned.sql',
            'voice_journal_sessions': '88-voice-journal-sessions.sql',
            'insight_feedback': '88-insight-feedback.sql',
            'weekly_analysis_reports': '89-weekly-analysis-reports.sql',
            'prediction_accuracy_tracking': '90-prediction-accuracy.sql',
            'spotify_cached_playlists': '91-spotify-cached-playlists.sql',
            'yoga_poses': '92-yoga-poses.sql',
            'yoga_sessions': '93-yoga-sessions.sql',
            'yoga_session_logs': '94-yoga-session-logs.sql',
            'meditation_timers': '95-meditation-timers.sql',
            'yoga_streaks': '96-yoga-streaks.sql',
            'user_life_history': '97-user-life-history.sql',
            'life_goal_milestones': '98-life-goal-milestones-checkins.sql',
            'life_goal_checkins': '98-life-goal-milestones-checkins.sql',
            'user_motivation_profiles': '99-user-motivation-profiles.sql',
            'goal_actions': '100-goal-actions.sql',
            'goal_action_responses': '100-goal-actions.sql',
            'proactive_messages': '101-proactive-messages.sql',
            'email_logs': '102-email-logs.sql',
            'email_preferences': '103-email-preferences.sql',
            'vision_test_sessions': '104-vision-test-sessions.sql',
            'vision_test_responses': '105-vision-test-responses.sql',
            'vision_streaks': '106-vision-streaks.sql',
            'finance_profiles': '107-finance.sql',
            'finance_transactions': '107-finance.sql',
            'finance_budgets': '107-finance.sql',
            'finance_saving_goals': '107-finance.sql',
            'finance_ai_insights': '107-finance.sql',
            'finance_monthly_snapshots': '107-finance.sql',
            'user_streaks': '108-user-streaks.sql',
            'streak_activity_log': '109-streak-activity-log.sql',
            'streak_freeze_log': '110-streak-freeze-log.sql',
            'streak_rewards': '111-streak-rewards.sql',
            'goal_obstacles': '116-goal-obstacles.sql',
            'goal_reconnections': '117-goal-reconnections.sql',
            'user_timing_profiles': '118-user-timing-profiles.sql',
            'holiday_calendar': '119-holiday-calendar.sql',
            'user_holiday_preferences': '119-holiday-calendar.sql',
            'mental_health_screening_events': '127-mental-health-screening-events.sql',
            'data_source_connections': '120-data-source-connections.sql',
            'data_source_signals': '121-data-source-signals.sql',
            'user_daily_correlations': '122-user-daily-correlations.sql',
            'spotify_listening_history': '123-spotify-listening-history.sql',
            'prayer_schedules': '124-prayer-schedules.sql',
            'spending_transactions': '125-finance-tracking.sql',
            'competition_invitations': '126-competition-invitations.sql',
            // Wiki system
            'wiki_pages': '131-wiki.sql',
            'wiki_links': '131-wiki.sql',
            'wiki_page_sources': '131-wiki.sql',
            'wiki_log': '131-wiki.sql',
            'wiki_index': '131-wiki.sql',
            'wiki_page_versions': '131-wiki.sql',
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

      // Run all add-* migration files (table creation, column additions, enum updates)
      // All migrations are idempotent (IF NOT EXISTS / IF EXISTS guards)
      for (const migrationFile of migrationFiles) {
        if (migrationFile.startsWith('add-')) {
          try {
            logger.info(`Running migration: ${migrationFile}`);
            await runMigration(migrationFile);
          } catch (error: any) {
            // Ignore "already exists" / "duplicate" errors
            if (error?.code !== '42701' && error?.code !== '42P07' && error?.code !== '42710' &&
                !error?.message?.includes('already exists') && !error?.message?.includes('duplicate')) {
              logger.warn(`Migration ${migrationFile} had issues (may already be applied):`, {
                error: (error as Error).message
              });
            } else {
              logger.debug(`Migration ${migrationFile} already applied`);
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

    await runColumnSyncAndSupplementary();

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

/**
 * Critical table migrations that must exist before workers/reconcilers start.
 * All are idempotent (CREATE TABLE IF NOT EXISTS).
 */
const STARTUP_TABLE_MIGRATIONS: readonly string[] = [
  '20260512000000_chat_calls.sql',
  '20260513_ai_coach_call_log.sql',
];

/**
 * Lightweight startup sync — runs sync-missing-columns.sql plus any critical
 * table migrations needed by workers that start before full autoMigrate.
 * Safe to call on every startup (idempotent, fast, non-blocking).
 */
export async function runColumnSync(): Promise<void> {
  try {
    await runMigration('sync-missing-columns.sql');
    logger.info('[AutoMigrate] Column sync completed');
  } catch (err: any) {
    logger.warn('[AutoMigrate] Column sync had issues (non-fatal)', {
      error: err?.message,
    });
  }

  for (const migration of STARTUP_TABLE_MIGRATIONS) {
    try {
      await runMigration(migration);
    } catch (err: any) {
      logger.warn(`[AutoMigrate] Startup migration ${migration} had issues (non-fatal)`, {
        error: err?.message,
      });
    }
  }
}

export default {
  autoMigrate,
  verifySchema,
  runColumnSync,
  EXPECTED_TABLES,
  EXPECTED_TYPES,
};
