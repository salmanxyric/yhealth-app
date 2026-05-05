/**
 * Comprehensive test data cleanup utilities.
 * Deletes in reverse FK dependency order to avoid constraint violations.
 */

import { query } from '../../src/database/pg.js';

/**
 * Clean up all test data for a specific user.
 * Tables are deleted in reverse FK dependency order.
 */
export async function cleanupUser(userId: string): Promise<void> {
  const tables = [
    // Billing & credits
    'credit_transactions',
    'credit_wallets',
    'promo_redemptions',
    'stripe_event_log',
    'user_subscriptions',
    'admin_overrides',
    'user_entitlements_cache',
    'usage_events',
    'audit_log',
    // AI & coaching
    'ai_coach_sessions',
    'voice_calls',
    'voice_call_events',
    'call_summaries',
    'action_items',
    'user_coaching_profiles',
    // Social & chat
    'message_reactions',
    'message_reads',
    'starred_messages',
    'messages',
    'chat_participants',
    'chats',
    'community_posts',
    'user_follows',
    // Activity & tracking
    'activity_logs',
    'activity_events',
    'daily_user_scores',
    'leaderboard_snapshots',
    'streak_activity_log',
    'streak_freeze_log',
    'streak_rewards',
    'user_streaks',
    'xp_transactions',
    // Competitions
    'competition_entries',
    'competition_invitations',
    'competitions',
    // Health data
    'health_data_records',
    'sync_logs',
    'user_integrations',
    'data_source_signals',
    'data_source_connections',
    'user_daily_correlations',
    // Wellness
    'mood_logs',
    'stress_logs',
    'emotion_logs',
    'energy_logs',
    'journal_insights',
    'journal_entries',
    'habit_logs',
    'habits',
    'routine_completions',
    'daily_health_metrics',
    'mental_recovery_scores',
    // Goals & accountability
    'accountability_contracts',
    'goal_obstacles',
    'goal_reconnections',
    'goal_actions',
    'life_goal_milestones_checkins',
    'life_goals',
    'life_area_links',
    'user_goals',
    // Plans & schedules
    'user_plans',
    'daily_schedules',
    'scheduled_reminders',
    'user_tasks',
    'workout_alarms',
    // Fitness
    'workout_logs',
    'progress_records',
    'body_metrics',
    'user_body_images',
    // Nutrition
    'meal_logs',
    'nutrition_daily_analysis',
    // Finance
    'finance_tracking',
    'spending_limits',
    'finance_insights',
    // Notifications & communication
    'notifications',
    'proactive_messages',
    'email_logs',
    // Misc
    'consent_records',
    'assessment_responses',
    'user_preferences',
    'daily_checkins',
    'emotional_checkin_sessions',
    // User last (everything depends on it)
    'user_roles',
    'users',
  ];

  for (const table of tables) {
    try {
      await query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
    } catch {
      // Table may not exist or column name differs - skip silently in tests
    }
  }
}

/**
 * Clean up multiple test users.
 */
export async function cleanupUsers(userIds: string[]): Promise<void> {
  for (const id of userIds) {
    await cleanupUser(id);
  }
}

/**
 * Clean up test promo codes by code prefix.
 */
export async function cleanupPromos(codePrefix: string): Promise<void> {
  try {
    await query(`DELETE FROM promo_redemptions WHERE promo_id IN (SELECT id FROM promo_codes WHERE LOWER(code) LIKE $1)`, [`${codePrefix.toLowerCase()}%`]);
    await query(`DELETE FROM promo_codes WHERE LOWER(code) LIKE $1`, [`${codePrefix.toLowerCase()}%`]);
  } catch {
    // Tables may not exist
  }
}

/**
 * Clean up test subscription plans by slug prefix.
 */
export async function cleanupPlans(slugPrefix: string): Promise<void> {
  try {
    await query(`DELETE FROM plan_menus WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug LIKE $1)`, [`${slugPrefix}%`]);
    await query(`DELETE FROM plan_pages WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug LIKE $1)`, [`${slugPrefix}%`]);
    await query(`DELETE FROM plan_features WHERE plan_id IN (SELECT id FROM subscription_plans WHERE slug LIKE $1)`, [`${slugPrefix}%`]);
    await query(`DELETE FROM subscription_plans WHERE slug LIKE $1`, [`${slugPrefix}%`]);
  } catch {
    // Tables may not exist
  }
}
