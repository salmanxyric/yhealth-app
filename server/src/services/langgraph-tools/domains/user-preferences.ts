import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const CreateUserPreferencesSchema = z.object({
  coachingStyle: z.string().optional().describe('Coaching style: supportive, motivational, analytical, balanced'),
  coachingIntensity: z.string().optional().describe('Coaching intensity: gentle, moderate, intense'),
  preferredChannel: z.string().optional().describe('Preferred notification channel: push, email, sms, whatsapp'),
  checkInFrequency: z.string().optional().describe('Check-in frequency: daily, weekly, biweekly, monthly'),
  preferredCheckInTime: z.string().optional().describe('Preferred check-in time in HH:MM format'),
  aiUseEmojis: z.boolean().optional().describe('Whether AI should use emojis in responses'),
  aiFormalityLevel: z.string().optional().describe('AI formality level: casual, balanced, formal'),
  aiEncouragementLevel: z.string().optional().describe('AI encouragement level: low, medium, high'),
  focusAreas: z.array(z.string()).optional().describe('Focus areas array'),
  weightUnit: z.string().optional().describe('Weight unit: kg, lbs'),
  heightUnit: z.string().optional().describe('Height unit: cm, inches'),
  distanceUnit: z.string().optional().describe('Distance unit: km, miles'),
  language: z.string().optional().describe('Language code: en, ur, etc.'),
  timezone: z.string().optional().describe('Timezone string'),
  quietHoursEnabled: z.boolean().optional().describe('Enable quiet hours'),
  quietHoursStart: z.string().optional().describe('Quiet hours start time in HH:MM format'),
  quietHoursEnd: z.string().optional().describe('Quiet hours end time in HH:MM format'),
});

const UpdateUserPreferencesSchema = z.object({
  coachingStyle: z.string().optional(),
  coachingIntensity: z.string().optional(),
  preferredChannel: z.string().optional(),
  checkInFrequency: z.string().optional(),
  preferredCheckInTime: z.string().optional(),
  aiUseEmojis: z.boolean().optional(),
  aiFormalityLevel: z.string().optional(),
  aiEncouragementLevel: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  weightUnit: z.string().optional(),
  heightUnit: z.string().optional(),
  distanceUnit: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  notificationChannels: z.record(z.boolean()).optional().describe('Notification channels object'),
  notificationTypes: z.record(z.any()).optional().describe('Notification types preferences'),
  maxNotificationsDay: z.number().optional(),
  maxNotificationsWeek: z.number().optional(),
});

// --- Implementations ---

async function getUserPreferences(userId: string): Promise<string> {
  const result = await query(
    `SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No preferences found', preferences: null });
  }

  const prefs = result.rows[0];
  const formatted = {
    id: prefs.id,
    coachingStyle: prefs.coaching_style,
    coachingIntensity: prefs.coaching_intensity,
    preferredChannel: prefs.preferred_channel,
    checkInFrequency: prefs.check_in_frequency,
    preferredCheckInTime: prefs.preferred_check_in_time,
    aiUseEmojis: prefs.ai_use_emojis,
    aiFormalityLevel: prefs.ai_formality_level,
    aiEncouragementLevel: prefs.ai_encouragement_level,
    focusAreas: prefs.focus_areas || [],
    weightUnit: prefs.weight_unit,
    heightUnit: prefs.height_unit,
    distanceUnit: prefs.distance_unit,
    language: prefs.language,
    timezone: prefs.timezone,
    quietHoursEnabled: prefs.quiet_hours_enabled,
    quietHoursStart: prefs.quiet_hours_start,
    quietHoursEnd: prefs.quiet_hours_end,
    notificationChannels: prefs.notification_channels,
    maxNotificationsDay: prefs.max_notifications_day,
    maxNotificationsWeek: prefs.max_notifications_week,
  };

  return JSON.stringify({ preferences: formatted }, null, 2);
}

async function createUserPreferences(userId: string, params: z.infer<typeof CreateUserPreferencesSchema>): Promise<string> {
  // Check if preferences already exist
  const existing = await query(
    `SELECT id FROM user_preferences WHERE user_id = $1`,
    [userId]
  );

  if (existing.rows.length > 0) {
    return JSON.stringify({
      success: false,
      error: 'Preferences already exist. Use updateUserPreferences to modify them.',
      preferencesId: existing.rows[0].id
    });
  }

  const result = await query<{ id: string }>(
    `INSERT INTO user_preferences (
      user_id, coaching_style, coaching_intensity, preferred_channel,
      check_in_frequency, preferred_check_in_time,
      ai_use_emojis, ai_formality_level, ai_encouragement_level, focus_areas,
      weight_unit, height_unit, distance_unit, language, timezone,
      quiet_hours_enabled, quiet_hours_start, quiet_hours_end
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING id`,
    [
      userId,
      params.coachingStyle || 'supportive',
      params.coachingIntensity || 'moderate',
      params.preferredChannel || 'push',
      params.checkInFrequency || 'daily',
      params.preferredCheckInTime || '09:00',
      params.aiUseEmojis ?? true,
      params.aiFormalityLevel || 'balanced',
      params.aiEncouragementLevel || 'medium',
      params.focusAreas || [],
      params.weightUnit || 'kg',
      params.heightUnit || 'cm',
      params.distanceUnit || 'km',
      params.language || 'en',
      params.timezone || 'UTC',
      params.quietHoursEnabled ?? true,
      params.quietHoursStart || '22:00',
      params.quietHoursEnd || '07:00',
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Preferences created successfully',
    data: { id: result.rows[0].id },
  });
}

async function updateUserPreferences(userId: string, params: z.infer<typeof UpdateUserPreferencesSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_preferences WHERE user_id = $1`,
    [userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Preferences not found. Use createUserPreferences first.' });
  }

  const fieldMapping: Record<string, string> = {
    coachingStyle: 'coaching_style',
    coachingIntensity: 'coaching_intensity',
    preferredChannel: 'preferred_channel',
    checkInFrequency: 'check_in_frequency',
    preferredCheckInTime: 'preferred_check_in_time',
    aiUseEmojis: 'ai_use_emojis',
    aiFormalityLevel: 'ai_formality_level',
    aiEncouragementLevel: 'ai_encouragement_level',
    focusAreas: 'focus_areas',
    weightUnit: 'weight_unit',
    heightUnit: 'height_unit',
    distanceUnit: 'distance_unit',
    language: 'language',
    timezone: 'timezone',
    quietHoursEnabled: 'quiet_hours_enabled',
    quietHoursStart: 'quiet_hours_start',
    quietHoursEnd: 'quiet_hours_end',
    maxNotificationsDay: 'max_notifications_day',
    maxNotificationsWeek: 'max_notifications_week',
  };

  const setClauses: string[] = [];
  const values: (string | number | boolean | null | object)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      if (key === 'notificationChannels' || key === 'notificationTypes') {
        setClauses.push(`${key === 'notificationChannels' ? 'notification_channels' : 'notification_types'} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else if (key === 'focusAreas' && Array.isArray(value)) {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(value);
      } else {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(value as string | number | boolean | null);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE user_preferences SET ${setClauses.join(', ')}
     WHERE user_id = $${paramIndex}`,
    [...values, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Preferences updated successfully',
  });
}

async function deleteUserPreferences(userId: string): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT id FROM user_preferences WHERE user_id = $1`,
    [userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Preferences not found' });
  }

  await query(
    `DELETE FROM user_preferences WHERE user_id = $1`,
    [userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Preferences deleted successfully',
  });
}

// --- Registration ---

export function registerUserPreferencesTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserPreferences',
      description:
        "Get the user's preferences and settings. Use when user asks about their preferences, coaching style, or settings. Returns preferences including coaching style, intensity, check-in frequency, and focus areas.",
      schema: z.object({}),
      handler: withErrorHandling('getUserPreferences', async (uid) => getUserPreferences(uid)),
    },
    {
      name: 'createUserPreferences',
      description:
        'Create user preferences. Use when user wants to set up their preferences for the first time. Note: If preferences already exist, use updateUserPreferences instead.',
      schema: CreateUserPreferencesSchema,
      handler: withErrorHandling('createUserPreferences', async (uid, params) =>
        createUserPreferences(uid, params),
      ),
    },
    {
      name: 'updateUserPreferences',
      description:
        'Update user preferences. Use when user wants to change coaching style, check-in frequency, units, or other settings.',
      schema: UpdateUserPreferencesSchema,
      handler: withErrorHandling('updateUserPreferences', async (uid, params) =>
        updateUserPreferences(uid, params),
      ),
    },
    {
      name: 'deleteUserPreferences',
      description:
        'Delete user preferences. Use when user wants to reset their preferences.',
      schema: z.object({}),
      handler: withErrorHandling('deleteUserPreferences', async (uid) => deleteUserPreferences(uid)),
    },
  ];
}
