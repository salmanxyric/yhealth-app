import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';
import { logger } from '../../logger.service.js';
import { moodService } from '../../wellbeing/mood.service.js';
import { stressService } from '../../stress.service.js';
import { journalService } from '../../wellbeing/journal.service.js';
import { dailyCheckinService } from '../../wellbeing/daily-checkin.service.js';
import { energyService } from '../../wellbeing/energy.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];

// --- Schemas ---

// Cross-cutting schemas (activity_logs)
const GetUserActivityLogsWithMoodSchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of logs to return (default: 20)'),
});

const GetUserMoodTrendsSchema = z.object({
  days: z.number().optional().describe('Number of days to analyze (default: 14)'),
});

// Mood Schemas
const GetUserMoodLogsSchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  page: z.number().optional().describe('Page number (default: 1)'),
  limit: z.number().optional().describe('Items per page (default: 50)'),
});

const CreateMoodLogSchema = z.object({
  moodEmoji: z.string().optional().describe('Mood emoji: 😊, 😐, 😟, 😡, 😰, 😴'),
  descriptor: z.string().optional().describe('Mood descriptor'),
  happinessRating: z.number().optional().describe('Happiness rating 1-10'),
  energyRating: z.number().optional().describe('Energy rating 1-10'),
  stressRating: z.number().optional().describe('Stress rating 1-10'),
  anxietyRating: z.number().optional().describe('Anxiety rating 1-10'),
  emotionTags: z.array(z.string()).optional().describe('Emotion tags array'),
  contextNote: z.string().optional().describe('Context note'),
  mode: z.enum(['light', 'deep']).describe('Mode: light or deep'),
  loggedAt: z.string().optional().describe('Timestamp in ISO format'),
});

const UpdateMoodLogSchema = z.object({
  logId: z.string().describe('Mood log ID (required)'),
  moodEmoji: z.string().optional(),
  descriptor: z.string().optional(),
  happinessRating: z.number().optional(),
  energyRating: z.number().optional(),
  stressRating: z.number().optional(),
  anxietyRating: z.number().optional(),
  emotionTags: z.array(z.string()).optional(),
  contextNote: z.string().optional(),
});

const DeleteMoodLogSchema = z.object({
  logId: z.string().describe('Mood log ID to delete (required)'),
});

const GetMoodLogByIdSchema = z.object({
  logId: z.string().describe('Mood log ID (required)'),
});

const GetMoodTimelineSchema = z.object({
  startDate: z.string().describe('Start date in ISO format (YYYY-MM-DD) (required)'),
  endDate: z.string().describe('End date in ISO format (YYYY-MM-DD) (required)'),
});

const GetMoodPatternsSchema = z.object({
  days: z.number().optional().describe('Number of days to analyze (default: 30)'),
});

// Stress Schemas
const GetUserStressLogsSchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  page: z.number().optional().describe('Page number (default: 1)'),
  limit: z.number().optional().describe('Items per page (default: 50)'),
});

const CreateStressLogSchema = z.object({
  stressRating: z.number().describe('Stress rating 1-10 (required)'),
  triggers: z.array(z.string()).optional().describe('Stress triggers array'),
  otherTrigger: z.string().optional().describe('Other trigger description'),
  note: z.string().optional().describe('Note'),
  checkInType: z.enum(['daily', 'on_demand']).describe('Check-in type'),
  clientRequestId: z.string().describe('Client request ID for idempotency (required)'),
  loggedAt: z.string().optional().describe('Timestamp in ISO format'),
});

const UpdateStressLogSchema = z.object({
  logId: z.string().describe('Stress log ID (required)'),
  stressRating: z.number().optional(),
  triggers: z.array(z.string()).optional(),
  otherTrigger: z.string().optional(),
  note: z.string().optional(),
});

const DeleteStressLogSchema = z.object({
  logId: z.string().describe('Stress log ID to delete (required)'),
});

const GetStressLogByIdSchema = z.object({
  logId: z.string().describe('Stress log ID (required)'),
});

const GetStressTrendsSchema = z.object({
  days: z.number().optional().describe('Number of days to analyze (default: 30)'),
});

// Journal Schemas
const GetUserJournalEntriesSchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  page: z.number().optional().describe('Page number (default: 1)'),
  limit: z.number().optional().describe('Items per page (default: 50)'),
  category: z.string().optional().describe('Prompt category filter'),
});

const CreateJournalEntrySchema = z.object({
  prompt: z.string().describe('Journal prompt (required)'),
  promptCategory: z.string().optional().describe('Prompt category'),
  promptId: z.string().optional().describe('Prompt ID'),
  entryText: z.string().describe('Entry text (required)'),
  mode: z.enum(['light', 'deep']).describe('Mode: light or deep'),
  voiceEntry: z.boolean().optional().describe('Whether entry was voice recorded'),
  durationSeconds: z.number().optional().describe('Voice duration in seconds'),
  loggedAt: z.string().optional().describe('Timestamp in ISO format'),
});

const UpdateJournalEntrySchema = z.object({
  entryId: z.string().describe('Journal entry ID (required)'),
  entryText: z.string().optional(),
  prompt: z.string().optional(),
  promptCategory: z.string().optional(),
});

const DeleteJournalEntrySchema = z.object({
  entryId: z.string().describe('Journal entry ID to delete (required)'),
});

const GetJournalEntryByIdSchema = z.object({
  entryId: z.string().describe('Journal entry ID (required)'),
});

const GetJournalStreakSchema = z.object({});

const GetJournalInsightsSchema = z.object({
  days: z.number().optional().describe('Number of days to analyze (default: 30)'),
});

// Daily Check-in Schemas
const CreateDailyCheckinSchema = z.object({
  moodScore: z.number().min(1).max(10).optional().describe('Mood score 1-10 (1=terrible, 10=amazing)'),
  energyScore: z.number().min(1).max(10).optional().describe('Energy score 1-10'),
  sleepQuality: z.number().min(1).max(5).optional().describe('Sleep quality 1-5 (1=terrible, 5=excellent)'),
  stressScore: z.number().min(1).max(10).optional().describe('Stress score 1-10 (1=none, 10=extreme)'),
  tags: z.array(z.string()).optional().describe('Tags: productive, social, spiritual, creative, challenging, restful, anxious, grateful, lonely, motivated, exhausted, peaceful'),
  daySummary: z.string().optional().describe('Brief summary of how the day is going'),
});

const GetTodayCheckinSchema = z.object({});

const GetCheckinHistorySchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Max results (default: 30)'),
});

const GetCheckinStreakSchema = z.object({});

// Energy Schemas
const GetUserEnergyLogsSchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  page: z.number().optional().describe('Page number (default: 1)'),
  limit: z.number().optional().describe('Items per page (default: 50)'),
});

const CreateEnergyLogSchema = z.object({
  energyRating: z.number().describe('Energy rating 1-10 (required)'),
  contextTag: z.string().optional().describe('Context tag'),
  contextNote: z.string().optional().describe('Context note'),
  loggedAt: z.string().optional().describe('Timestamp in ISO format'),
});

const UpdateEnergyLogSchema = z.object({
  logId: z.string().describe('Energy log ID (required)'),
  energyRating: z.number().optional(),
  contextTag: z.string().optional(),
  contextNote: z.string().optional(),
});

const DeleteEnergyLogSchema = z.object({
  logId: z.string().describe('Energy log ID to delete (required)'),
});

const GetEnergyLogByIdSchema = z.object({
  logId: z.string().describe('Energy log ID (required)'),
});

const GetEnergyTimelineSchema = z.object({
  startDate: z.string().describe('Start date in ISO format (YYYY-MM-DD) (required)'),
  endDate: z.string().describe('End date in ISO format (YYYY-MM-DD) (required)'),
});

const GetEnergyPatternsSchema = z.object({
  days: z.number().optional().describe('Number of days to analyze (default: 30)'),
});

// --- Implementations ---

// Cross-cutting: activity_logs with mood

async function getUserActivityLogsWithMood(userId: string, params?: z.infer<typeof GetUserActivityLogsWithMoodSchema>): Promise<string> {
  let sqlQuery = `SELECT activity_name, scheduled_date, status, mood, notes
                  FROM activity_logs
                  WHERE user_id = $1`;
  const queryParams: (string | number)[] = [userId];

  if (params?.startDate) {
    sqlQuery += ` AND scheduled_date >= $2`;
    queryParams.push(params.startDate);
  } else {
    // Default to last 7 days
    sqlQuery += ` AND scheduled_date >= NOW() - INTERVAL '7 days'`;
  }

  if (params?.endDate) {
    const paramIndex = queryParams.length + 1;
    sqlQuery += ` AND scheduled_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
  }

  sqlQuery += ` ORDER BY scheduled_date DESC`;

  if (params?.limit) {
    sqlQuery += ` LIMIT $${queryParams.length + 1}`;
    queryParams.push(params.limit);
  } else {
    sqlQuery += ` LIMIT 20`;
  }

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No activity logs found', logs: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    activityName: row.activity_name,
    scheduledDate: row.scheduled_date,
    status: row.status,
    mood: row.mood !== null ? `${row.mood}/5` : null,
    notes: row.notes,
  }));

  // Calculate mood statistics
  const moods = result.rows
    .filter((row: any) => row.mood !== null)
    .map((row: any) => row.mood);

  const moodStats = moods.length > 0 ? {
    average: (moods.reduce((a: number, b: number) => a + b, 0) / moods.length).toFixed(2),
    count: moods.length,
    min: Math.min(...moods),
    max: Math.max(...moods),
  } : null;

  return JSON.stringify({
    logs: formatted,
    count: formatted.length,
    moodStats,
  }, null, 2);
}

async function getUserMoodTrends(userId: string, params?: { days?: number }): Promise<string> {
  const days = params?.days || 14;

  const result = await query<{
    scheduled_date: Date;
    mood: number;
  }>(
    `SELECT scheduled_date, mood
     FROM activity_logs
     WHERE user_id = $1
     AND mood IS NOT NULL
     AND scheduled_date >= NOW() - INTERVAL '${days} days'
     ORDER BY scheduled_date ASC`,
    [userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({
      message: 'No mood data found',
      trend: null,
      average: null,
    });
  }

  const moods = result.rows.map(row => row.mood);
  const dates = result.rows.map(row => row.scheduled_date);

  // Calculate trend
  const firstHalf = moods.slice(0, Math.floor(moods.length / 2));
  const secondHalf = moods.slice(Math.floor(moods.length / 2));
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  let trend: 'improving' | 'stable' | 'declining';
  if (secondHalfAvg > firstHalfAvg + 0.3) {
    trend = 'improving';
  } else if (secondHalfAvg < firstHalfAvg - 0.3) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  const average = (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(2);

  return JSON.stringify({
    trend,
    average: parseFloat(average),
    dataPoints: result.rows.length,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1],
    },
    recentMood: moods[moods.length - 1],
  }, null, 2);
}

// Mood implementations

function buildMoodCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  const logs = Array.isArray(data?.logs) ? data.logs : Array.isArray(data) ? data : [];
  if (logs.length === 0) return artifacts;

  const sorted = [...logs].sort((a: any, b: any) =>
    String(a.loggedAt || a.logged_at || '').localeCompare(String(b.loggedAt || b.logged_at || '')),
  );

  if (sorted.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Mood Trend',
      data: sorted.map((log: any) => ({
        date: String(log.loggedAt || log.logged_at || '').slice(0, 10),
        happiness: log.happinessRating || log.happiness_rating || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'happiness', label: 'Happiness', color: '#f59e0b' }],
      yAxisLabel: 'Rating (1-10)',
      insight: `Average mood: ${(sorted.reduce((s: number, l: any) => s + (l.happinessRating || l.happiness_rating || 0), 0) / sorted.length).toFixed(1)}/10.`,
    });
  }

  const withMultiple = sorted.filter((l: any) =>
    (l.happinessRating || l.happiness_rating) && (l.energyRating || l.energy_rating),
  );
  if (withMultiple.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'area',
      title: 'Mood, Energy & Stress',
      data: withMultiple.map((log: any) => ({
        date: String(log.loggedAt || log.logged_at || '').slice(0, 10),
        happiness: log.happinessRating || log.happiness_rating || 0,
        energy: log.energyRating || log.energy_rating || 0,
        stress: log.stressRating || log.stress_rating || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [
        { key: 'happiness', label: 'Happiness', color: '#f59e0b' },
        { key: 'energy', label: 'Energy', color: '#10b981' },
        { key: 'stress', label: 'Stress', color: '#ef4444' },
      ],
      yAxisLabel: 'Rating (1-10)',
    });
  }

  const emojiCounts: Record<string, number> = {};
  for (const log of logs) {
    const emoji = log.moodEmoji || log.mood_emoji || log.descriptor || 'unknown';
    emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
  }
  if (Object.keys(emojiCounts).length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'pie',
      title: 'Mood Distribution',
      data: Object.entries(emojiCounts).map(([name, value]) => ({ name, value })),
      xAxisKey: 'name',
      dataKeys: Object.entries(emojiCounts).map(([name], i) => ({
        key: 'value',
        label: name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
      insight: `Most frequent mood: ${Object.entries(emojiCounts).sort((a, b) => b[1] - a[1])[0][0]}.`,
    });
  }

  return artifacts;
}

async function getUserMoodLogs(userId: string, params?: z.infer<typeof GetUserMoodLogsSchema>): Promise<string> {
  const result = await moodService.getMoodLogs(userId, {
    startDate: params?.startDate,
    endDate: params?.endDate,
    page: params?.page,
    limit: params?.limit,
  });
  const artifacts = buildMoodCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
}

async function createMoodLog(userId: string, params: z.infer<typeof CreateMoodLogSchema>): Promise<string> {
  const result = await moodService.createMoodLog(userId, {
    moodEmoji: params.moodEmoji as any,
    descriptor: params.descriptor,
    happinessRating: params.happinessRating,
    energyRating: params.energyRating,
    stressRating: params.stressRating,
    anxietyRating: params.anxietyRating,
    emotionTags: params.emotionTags as any,
    contextNote: params.contextNote,
    mode: params.mode,
    loggedAt: params.loggedAt,
  });

  // Queue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: result.id,
    operation: 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { moodLog: result } }, null, 2);
}

async function updateMoodLog(userId: string, params: z.infer<typeof UpdateMoodLogSchema>): Promise<string> {
  const existing = await query('SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2', [params.logId, userId]);
  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Mood log not found' });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.moodEmoji !== undefined) { fields.push(`mood_emoji = $${paramIndex++}`); values.push(params.moodEmoji); }
  if (params.descriptor !== undefined) { fields.push(`descriptor = $${paramIndex++}`); values.push(params.descriptor); }
  if (params.happinessRating !== undefined) { fields.push(`happiness_rating = $${paramIndex++}`); values.push(params.happinessRating); }
  if (params.energyRating !== undefined) { fields.push(`energy_rating = $${paramIndex++}`); values.push(params.energyRating); }
  if (params.stressRating !== undefined) { fields.push(`stress_rating = $${paramIndex++}`); values.push(params.stressRating); }
  if (params.anxietyRating !== undefined) { fields.push(`anxiety_rating = $${paramIndex++}`); values.push(params.anxietyRating); }
  if (params.emotionTags !== undefined) { fields.push(`emotion_tags = $${paramIndex++}`); values.push(JSON.stringify(params.emotionTags)); }
  if (params.contextNote !== undefined) { fields.push(`context_note = $${paramIndex++}`); values.push(params.contextNote); }

  if (fields.length === 0) {
    return JSON.stringify({ success: false, error: 'No fields to update' });
  }

  fields.push(`updated_at = NOW()`);
  values.push(params.logId, userId);

  const result = await query(
    `UPDATE mood_logs SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
    values,
  );

  await embeddingQueueService.enqueueEmbedding({
    userId, sourceType: 'wellbeing', sourceId: params.logId, operation: 'update', priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { moodLog: result.rows[0] } }, null, 2);
}

async function deleteMoodLog(userId: string, params: z.infer<typeof DeleteMoodLogSchema>): Promise<string> {
  const result = await query('DELETE FROM mood_logs WHERE id = $1 AND user_id = $2 RETURNING id', [params.logId, userId]);
  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Mood log not found' });
  }

  await embeddingQueueService.enqueueEmbedding({
    userId, sourceType: 'wellbeing', sourceId: params.logId, operation: 'delete', priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, message: 'Mood log deleted successfully' }, null, 2);
}

async function getMoodTimeline(userId: string, params: z.infer<typeof GetMoodTimelineSchema>): Promise<string> {
  const result = await moodService.getMoodTimeline(userId, params.startDate, params.endDate);
  return JSON.stringify({ success: true, data: { timeline: result } }, null, 2);
}

async function getMoodPatterns(userId: string, params?: z.infer<typeof GetMoodPatternsSchema>): Promise<string> {
  const result = await moodService.getMoodPatterns(userId, params?.days);
  return JSON.stringify({ success: true, data: { patterns: result } }, null, 2);
}

// Stress implementations

async function getUserStressLogs(userId: string, params?: z.infer<typeof GetUserStressLogsSchema>): Promise<string> {
  const result = await stressService.getStressLogs(userId, params?.startDate, params?.endDate);
  // Apply pagination manually if needed
  let logs = result;
  if (params?.page && params?.limit) {
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    logs = result.slice(start, end);
  }
  return JSON.stringify({ success: true, data: { logs, total: result.length, page: params?.page || 1, limit: params?.limit || 50 } }, null, 2);
}

async function createStressLog(userId: string, params: z.infer<typeof CreateStressLogSchema>): Promise<string> {
  const result = await stressService.createStressLog(userId, {
    stressRating: params.stressRating,
    triggers: params.triggers as any,
    otherTrigger: params.otherTrigger,
    note: params.note,
    checkInType: params.checkInType,
    clientRequestId: params.clientRequestId,
    loggedAt: params.loggedAt,
  });

  // Queue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: result.id,
    operation: 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { stressLog: result } }, null, 2);
}

async function updateStressLog(userId: string, params: z.infer<typeof UpdateStressLogSchema>): Promise<string> {
  const existing = await query('SELECT id FROM stress_logs WHERE id = $1 AND user_id = $2', [params.logId, userId]);
  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Stress log not found' });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.stressRating !== undefined) { fields.push(`stress_rating = $${paramIndex++}`); values.push(params.stressRating); }
  if (params.triggers !== undefined) { fields.push(`triggers = $${paramIndex++}`); values.push(JSON.stringify(params.triggers)); }
  if (params.otherTrigger !== undefined) { fields.push(`other_trigger = $${paramIndex++}`); values.push(params.otherTrigger); }
  if (params.note !== undefined) { fields.push(`note = $${paramIndex++}`); values.push(params.note); }

  if (fields.length === 0) {
    return JSON.stringify({ success: false, error: 'No fields to update' });
  }

  fields.push(`updated_at = NOW()`);
  values.push(params.logId, userId);

  const result = await query(
    `UPDATE stress_logs SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
    values,
  );

  await embeddingQueueService.enqueueEmbedding({
    userId, sourceType: 'wellbeing', sourceId: params.logId, operation: 'update', priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { stressLog: result.rows[0] } }, null, 2);
}

async function deleteStressLog(userId: string, params: z.infer<typeof DeleteStressLogSchema>): Promise<string> {
  const result = await query('DELETE FROM stress_logs WHERE id = $1 AND user_id = $2 RETURNING id', [params.logId, userId]);
  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Stress log not found' });
  }

  await embeddingQueueService.enqueueEmbedding({
    userId, sourceType: 'wellbeing', sourceId: params.logId, operation: 'delete', priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, message: 'Stress log deleted successfully' }, null, 2);
}

function buildStressCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  const patterns = data?.patterns || data?.dailyPatterns || data?.daily_patterns;
  const items = Array.isArray(patterns) ? patterns : [];
  if (items.length < 2) return artifacts;

  artifacts.push({
    type: 'chart',
    chartType: 'area',
    title: 'Stress Pattern',
    data: items.map((item: any) => ({
      date: String(item.date || item.day || '').slice(0, 10),
      stress: item.averageStress || item.average_stress || item.stressLevel || item.stress_level || 0,
    })),
    xAxisKey: 'date',
    dataKeys: [{ key: 'stress', label: 'Stress Level', color: '#ef4444' }],
    yAxisLabel: 'Stress (1-10)',
    insight: `Average stress: ${(items.reduce((s: number, i: any) => s + (i.averageStress || i.average_stress || i.stressLevel || i.stress_level || 0), 0) / items.length).toFixed(1)}/10.`,
  });

  return artifacts;
}

async function getStressTrends(userId: string, params?: z.infer<typeof GetStressTrendsSchema>): Promise<string> {
  const days = params?.days || 30;
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const result = await stressService.getMultiSignalStressPatterns(userId, startDateStr, endDate);
  const artifacts = buildStressCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
}

// Journal implementations

async function getUserJournalEntries(userId: string, params?: z.infer<typeof GetUserJournalEntriesSchema>): Promise<string> {
  const result = await journalService.getJournalEntries(userId, {
    startDate: params?.startDate,
    endDate: params?.endDate,
    page: params?.page,
    limit: params?.limit,
    category: params?.category as any,
  });
  return JSON.stringify({ success: true, data: result }, null, 2);
}

async function createJournalEntry(userId: string, params: z.infer<typeof CreateJournalEntrySchema>): Promise<string> {
  const result = await journalService.createJournalEntry(userId, {
    prompt: params.prompt,
    promptCategory: params.promptCategory as any,
    promptId: params.promptId,
    entryText: params.entryText,
    mode: params.mode,
    voiceEntry: params.voiceEntry,
    durationSeconds: params.durationSeconds,
    loggedAt: params.loggedAt,
  });

  // Queue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: result.id,
    operation: 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { entry: result } }, null, 2);
}

async function updateJournalEntry(userId: string, params: z.infer<typeof UpdateJournalEntrySchema>): Promise<string> {
  const result = await journalService.updateJournalEntry(userId, params.entryId, {
    entryText: params.entryText,
    prompt: params.prompt,
    promptCategory: params.promptCategory as any,
  });

  // Queue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: params.entryId,
    operation: 'update',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { entry: result } }, null, 2);
}

async function deleteJournalEntry(userId: string, params: z.infer<typeof DeleteJournalEntrySchema>): Promise<string> {
  await journalService.deleteJournalEntry(userId, params.entryId);

  // Queue embedding deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: params.entryId,
    operation: 'delete',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, message: 'Journal entry deleted successfully' }, null, 2);
}

async function getJournalStreak(userId: string, _params?: z.infer<typeof GetJournalStreakSchema>): Promise<string> {
  const result = await journalService.getJournalStreak(userId);
  return JSON.stringify({ success: true, data: { streak: result } }, null, 2);
}

async function getJournalInsights(userId: string, params?: z.infer<typeof GetJournalInsightsSchema>): Promise<string> {
  const days = params?.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Get entries for the period
  const entries = await journalService.getJournalEntries(userId, {
    startDate: startDateStr,
    limit: 200,
  });

  const entryList = entries.entries || [];
  const totalEntries = entryList.length;

  if (totalEntries === 0) {
    return JSON.stringify({
      success: true,
      data: {
        period: `Last ${days} days`,
        totalEntries: 0,
        message: 'No journal entries found for this period.',
      },
    }, null, 2);
  }

  // Sentiment distribution
  const sentiments = entryList
    .filter((e: any) => e.sentimentScore != null)
    .map((e: any) => e.sentimentScore as number);
  const avgSentiment = sentiments.length > 0
    ? Math.round((sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length) * 100) / 100
    : null;

  // Word count stats
  const wordCounts = entryList.map((e: any) => e.wordCount || 0);
  const avgWordCount = Math.round(wordCounts.reduce((a: number, b: number) => a + b, 0) / totalEntries);

  // Top prompt categories
  const categoryCounts: Record<string, number> = {};
  for (const e of entryList) {
    const cat = (e as any).promptCategory || 'uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  // Entries per week
  const weekMap: Record<string, number> = {};
  for (const e of entryList) {
    const d = new Date((e as any).createdAt || (e as any).loggedAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weekMap[key] = (weekMap[key] || 0) + 1;
  }
  const entriesPerWeek = Object.entries(weekMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, count]) => ({ weekOf: week, count }));

  // Get streak info
  const streak = await journalService.getJournalStreak(userId);

  return JSON.stringify({
    success: true,
    data: {
      period: `Last ${days} days`,
      totalEntries,
      averageSentiment: avgSentiment,
      averageWordCount: avgWordCount,
      topCategories,
      entriesPerWeek,
      streak,
    },
  }, null, 2);
}

// Daily Check-in implementations

async function createDailyCheckin(userId: string, params: z.infer<typeof CreateDailyCheckinSchema>): Promise<string> {
  const result = await dailyCheckinService.createOrUpdateCheckin(userId, {
    moodScore: params.moodScore,
    energyScore: params.energyScore,
    sleepQuality: params.sleepQuality,
    stressScore: params.stressScore,
    tags: params.tags as any,
    daySummary: params.daySummary,
  });
  return JSON.stringify({ success: true, data: { checkin: result } }, null, 2);
}

async function getTodayCheckin(userId: string, _params?: z.infer<typeof GetTodayCheckinSchema>): Promise<string> {
  const result = await dailyCheckinService.getTodayCheckin(userId);
  if (!result) {
    return JSON.stringify({ success: true, data: { checkin: null, message: 'No check-in yet today' } }, null, 2);
  }
  return JSON.stringify({ success: true, data: { checkin: result } }, null, 2);
}

function buildCheckinCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  const checkins = Array.isArray(data?.checkins) ? data.checkins : Array.isArray(data) ? data : [];
  if (checkins.length < 2) return artifacts;

  const sorted = [...checkins].sort((a: any, b: any) =>
    String(a.checkinDate || a.checkin_date || a.createdAt || '').localeCompare(
      String(b.checkinDate || b.checkin_date || b.createdAt || ''),
    ),
  );

  artifacts.push({
    type: 'chart',
    chartType: 'line',
    title: 'Daily Check-in Trends',
    data: sorted.map((c: any) => ({
      date: String(c.checkinDate || c.checkin_date || c.createdAt || '').slice(0, 10),
      mood: c.moodScore || c.mood_score || 0,
      energy: c.energyScore || c.energy_score || 0,
      sleep: c.sleepQuality || c.sleep_quality || 0,
      stress: c.stressScore || c.stress_score || 0,
    })),
    xAxisKey: 'date',
    dataKeys: [
      { key: 'mood', label: 'Mood', color: '#f59e0b' },
      { key: 'energy', label: 'Energy', color: '#10b981' },
      { key: 'sleep', label: 'Sleep', color: '#8b5cf6' },
      { key: 'stress', label: 'Stress', color: '#ef4444' },
    ],
    yAxisLabel: 'Score',
    insight: `${sorted.length} check-ins tracked.`,
  });

  return artifacts;
}

async function getCheckinHistory(userId: string, params?: z.infer<typeof GetCheckinHistorySchema>): Promise<string> {
  const result = await dailyCheckinService.getCheckinHistory(userId, {
    startDate: params?.startDate,
    endDate: params?.endDate,
    limit: params?.limit,
  });
  const artifacts = buildCheckinCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
}

async function getCheckinStreak(userId: string, _params?: z.infer<typeof GetCheckinStreakSchema>): Promise<string> {
  const result = await dailyCheckinService.getCheckinStreak(userId);
  return JSON.stringify({ success: true, data: { streak: result } }, null, 2);
}

// Energy implementations

async function getUserEnergyLogs(userId: string, params?: z.infer<typeof GetUserEnergyLogsSchema>): Promise<string> {
  const result = await energyService.getEnergyLogs(userId, {
    startDate: params?.startDate,
    endDate: params?.endDate,
    page: params?.page,
    limit: params?.limit,
  });
  return JSON.stringify({ success: true, data: result }, null, 2);
}

async function createEnergyLog(userId: string, params: z.infer<typeof CreateEnergyLogSchema>): Promise<string> {
  const result = await energyService.createEnergyLog(userId, {
    energyRating: params.energyRating,
    contextTag: params.contextTag as any,
    contextNote: params.contextNote,
    loggedAt: params.loggedAt,
  });

  // Queue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: result.id,
    operation: 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { energyLog: result } }, null, 2);
}

async function updateEnergyLog(userId: string, params: z.infer<typeof UpdateEnergyLogSchema>): Promise<string> {
  const result = await energyService.updateEnergyLog(userId, params.logId, {
    energyRating: params.energyRating,
    contextTag: params.contextTag as any,
    contextNote: params.contextNote,
  });

  // Queue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: params.logId,
    operation: 'update',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { energyLog: result } }, null, 2);
}

async function deleteEnergyLog(userId: string, params: z.infer<typeof DeleteEnergyLogSchema>): Promise<string> {
  await energyService.deleteEnergyLog(userId, params.logId);

  // Queue embedding deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: params.logId,
    operation: 'delete',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, message: 'Energy log deleted successfully' }, null, 2);
}

async function getEnergyTimeline(userId: string, params: z.infer<typeof GetEnergyTimelineSchema>): Promise<string> {
  const result = await energyService.getEnergyTimeline(userId, params.startDate, params.endDate);
  return JSON.stringify({ success: true, data: { timeline: result } }, null, 2);
}

async function getEnergyPatterns(userId: string, params?: z.infer<typeof GetEnergyPatternsSchema>): Promise<string> {
  const result = await energyService.getEnergyPatterns(userId, params?.days);
  return JSON.stringify({ success: true, data: { patterns: result } }, null, 2);
}

// --- GetById implementations ---

async function getMoodLogById(userId: string, params: z.infer<typeof GetMoodLogByIdSchema>): Promise<string> {
  const result = await query('SELECT * FROM mood_logs WHERE id = $1 AND user_id = $2', [params.logId, userId]);
  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Mood log not found' });
  }
  return JSON.stringify({ success: true, data: { moodLog: result.rows[0] } }, null, 2);
}

async function getStressLogById(userId: string, params: z.infer<typeof GetStressLogByIdSchema>): Promise<string> {
  const result = await query('SELECT * FROM stress_logs WHERE id = $1 AND user_id = $2', [params.logId, userId]);
  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Stress log not found' });
  }
  return JSON.stringify({ success: true, data: { stressLog: result.rows[0] } }, null, 2);
}

async function getJournalEntryById(userId: string, params: z.infer<typeof GetJournalEntryByIdSchema>): Promise<string> {
  const result = await query('SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2', [params.entryId, userId]);
  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Journal entry not found' });
  }
  return JSON.stringify({ success: true, data: { journalEntry: result.rows[0] } }, null, 2);
}

async function getEnergyLogById(userId: string, params: z.infer<typeof GetEnergyLogByIdSchema>): Promise<string> {
  const result = await query('SELECT * FROM energy_logs WHERE id = $1 AND user_id = $2', [params.logId, userId]);
  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Energy log not found' });
  }
  return JSON.stringify({ success: true, data: { energyLog: result.rows[0] } }, null, 2);
}

// --- Registration ---

export function registerWellbeingTools(_userId: string): ToolDefinition[] {
  return [
    // Cross-cutting activity log tools
    {
      name: 'getUserActivityLogsWithMood',
      description: 'Get the user\'s activity logs with mood data. Use when user asks about their activity history, mood patterns, how they felt during activities, or to understand their emotional state related to fitness and wellness activities. Returns activity completion status along with mood scores (1-5 scale).',
      schema: GetUserActivityLogsWithMoodSchema,
      handler: withErrorHandling('getUserActivityLogsWithMood', async (uid, params) =>
        getUserActivityLogsWithMood(uid, params),
      ),
    },
    {
      name: 'getUserMoodTrends',
      description: 'Get the user\'s mood trends over time. Use when user asks about their mood patterns, emotional trends, how their mood has changed, or to understand their overall emotional wellbeing related to their health and fitness journey. Returns trend analysis (improving, stable, or declining) and average mood.',
      schema: GetUserMoodTrendsSchema,
      handler: withErrorHandling('getUserMoodTrends', async (uid, params) =>
        getUserMoodTrends(uid, params),
      ),
    },
    // Mood Tools
    {
      name: 'getUserMoodLogs',
      description: 'Get the user\'s mood logs. Use when user asks about their mood history, emotional state, or mood check-ins. Returns mood logs with ratings, emojis, and emotion tags.',
      schema: GetUserMoodLogsSchema,
      handler: withErrorHandling('getUserMoodLogs', async (uid, params) =>
        getUserMoodLogs(uid, params),
      ),
    },
    {
      name: 'getMoodLogById',
      description: 'Get a single mood log by ID. Use when you need to retrieve a specific mood entry for review or before updating.',
      schema: GetMoodLogByIdSchema,
      handler: withErrorHandling('getMoodLogById', async (uid, params) =>
        getMoodLogById(uid, params),
      ),
    },
    {
      name: 'createMoodLog',
      description: 'Create a mood log entry. Use when user mentions their mood, feelings, or emotional state. Automatically creates mood entries from natural language.',
      schema: CreateMoodLogSchema,
      handler: withErrorHandling('createMoodLog', async (uid, params) =>
        createMoodLog(uid, params),
      ),
    },
    {
      name: 'updateMoodLog',
      description: 'Update a mood log entry. Use when user asks to modify or correct a mood log.',
      schema: UpdateMoodLogSchema,
      handler: withErrorHandling('updateMoodLog', async (uid, params) =>
        updateMoodLog(uid, params),
      ),
    },
    {
      name: 'deleteMoodLog',
      description: 'Delete a mood log entry. Use when user asks to remove a mood log.',
      schema: DeleteMoodLogSchema,
      handler: withErrorHandling('deleteMoodLog', async (uid, params) =>
        deleteMoodLog(uid, params),
      ),
    },
    {
      name: 'getMoodTimeline',
      description: 'Get mood timeline data for visualization. Use when user asks about mood trends over time or wants to see mood patterns.',
      schema: GetMoodTimelineSchema,
      handler: withErrorHandling('getMoodTimeline', async (uid, params) =>
        getMoodTimeline(uid, params),
      ),
    },
    {
      name: 'getMoodPatterns',
      description: 'Get mood patterns and insights. Use when user asks about mood patterns, time-of-day patterns, or dominant emotions.',
      schema: GetMoodPatternsSchema,
      handler: withErrorHandling('getMoodPatterns', async (uid, params) =>
        getMoodPatterns(uid, params),
      ),
    },
    // Stress Tools
    {
      name: 'getUserStressLogs',
      description: 'Get the user\'s stress logs. Use when user asks about their stress history, stress levels, or stress check-ins.',
      schema: GetUserStressLogsSchema,
      handler: withErrorHandling('getUserStressLogs', async (uid, params) =>
        getUserStressLogs(uid, params),
      ),
    },
    {
      name: 'getStressLogById',
      description: 'Get a single stress log by ID. Use when you need to retrieve a specific stress entry.',
      schema: GetStressLogByIdSchema,
      handler: withErrorHandling('getStressLogById', async (uid, params) =>
        getStressLogById(uid, params),
      ),
    },
    {
      name: 'createStressLog',
      description: 'Create a stress log entry. Use when user mentions feeling stressed, overwhelmed, or anxious. Automatically creates stress entries from natural language.',
      schema: CreateStressLogSchema,
      handler: withErrorHandling('createStressLog', async (uid, params) =>
        createStressLog(uid, params),
      ),
    },
    {
      name: 'updateStressLog',
      description: 'Update a stress log entry. Use when user asks to modify or correct a stress log.',
      schema: UpdateStressLogSchema,
      handler: withErrorHandling('updateStressLog', async (uid, params) =>
        updateStressLog(uid, params),
      ),
    },
    {
      name: 'deleteStressLog',
      description: 'Delete a stress log entry. Use when user asks to remove a stress log.',
      schema: DeleteStressLogSchema,
      handler: withErrorHandling('deleteStressLog', async (uid, params) =>
        deleteStressLog(uid, params),
      ),
    },
    {
      name: 'getStressTrends',
      description: 'Get stress trends and analysis. Use when user asks about stress patterns or trends over time.',
      schema: GetStressTrendsSchema,
      handler: withErrorHandling('getStressTrends', async (uid, params) =>
        getStressTrends(uid, params),
      ),
    },
    // Journal Tools
    {
      name: 'getUserJournalEntries',
      description: 'Get the user\'s journal entries. Use when user asks about their journal, reflections, or journaling history.',
      schema: GetUserJournalEntriesSchema,
      handler: withErrorHandling('getUserJournalEntries', async (uid, params) =>
        getUserJournalEntries(uid, params),
      ),
    },
    {
      name: 'getJournalEntryById',
      description: 'Get a single journal entry by ID. Use when you need to retrieve a specific journal entry.',
      schema: GetJournalEntryByIdSchema,
      handler: withErrorHandling('getJournalEntryById', async (uid, params) =>
        getJournalEntryById(uid, params),
      ),
    },
    {
      name: 'createJournalEntry',
      description: 'Create a journal entry. Use when user reflects, shares thoughts, or wants to journal. Can suggest journaling when user mentions reflection or deep thoughts.',
      schema: CreateJournalEntrySchema,
      handler: withErrorHandling('createJournalEntry', async (uid, params) =>
        createJournalEntry(uid, params),
      ),
    },
    {
      name: 'updateJournalEntry',
      description: 'Update a journal entry. Use when user asks to modify or edit a journal entry.',
      schema: UpdateJournalEntrySchema,
      handler: withErrorHandling('updateJournalEntry', async (uid, params) =>
        updateJournalEntry(uid, params),
      ),
    },
    {
      name: 'deleteJournalEntry',
      description: 'Delete a journal entry. Use when user asks to remove a journal entry.',
      schema: DeleteJournalEntrySchema,
      handler: withErrorHandling('deleteJournalEntry', async (uid, params) =>
        deleteJournalEntry(uid, params),
      ),
    },
    {
      name: 'getJournalStreak',
      description: 'Get journal streak information. Use when user asks about their journaling streak or consistency.',
      schema: GetJournalStreakSchema,
      handler: withErrorHandling('getJournalStreak', async (uid, params) =>
        getJournalStreak(uid, params),
      ),
    },
    {
      name: 'getJournalInsights',
      description: 'Get journal insights and analytics including mood trends, entry frequency, top categories, and averages. Use when user asks about their journaling patterns, mood over time, or wants a summary of their reflections.',
      schema: GetJournalInsightsSchema,
      handler: withErrorHandling('getJournalInsights', async (uid, params) =>
        getJournalInsights(uid, params),
      ),
    },
    // Daily Check-in Tools
    {
      name: 'createDailyCheckin',
      description: 'Create or update today\'s daily check-in. Use when user wants to do their daily check-in, log how they\'re feeling today, or report their mood/energy/sleep/stress. Guides a conversational check-in experience.',
      schema: CreateDailyCheckinSchema,
      handler: withErrorHandling('createDailyCheckin', async (uid, params) =>
        createDailyCheckin(uid, params),
      ),
    },
    {
      name: 'getTodayCheckin',
      description: 'Get today\'s daily check-in status. Use to check if user has already done their check-in today.',
      schema: GetTodayCheckinSchema,
      handler: withErrorHandling('getTodayCheckin', async (uid, params) =>
        getTodayCheckin(uid, params),
      ),
    },
    {
      name: 'getCheckinHistory',
      description: 'Get check-in history over time. Use when user asks about their past check-ins, daily trends, or how they\'ve been feeling recently.',
      schema: GetCheckinHistorySchema,
      handler: withErrorHandling('getCheckinHistory', async (uid, params) =>
        getCheckinHistory(uid, params),
      ),
    },
    {
      name: 'getCheckinStreak',
      description: 'Get daily check-in streak information. Use when user asks about their check-in consistency or streak.',
      schema: GetCheckinStreakSchema,
      handler: withErrorHandling('getCheckinStreak', async (uid, params) =>
        getCheckinStreak(uid, params),
      ),
    },
    // Energy Tools
    {
      name: 'getUserEnergyLogs',
      description: 'Get the user\'s energy logs. Use when user asks about their energy levels, energy history, or energy check-ins.',
      schema: GetUserEnergyLogsSchema,
      handler: withErrorHandling('getUserEnergyLogs', async (uid, params) =>
        getUserEnergyLogs(uid, params),
      ),
    },
    {
      name: 'getEnergyLogById',
      description: 'Get a single energy log by ID. Use when you need to retrieve a specific energy entry.',
      schema: GetEnergyLogByIdSchema,
      handler: withErrorHandling('getEnergyLogById', async (uid, params) =>
        getEnergyLogById(uid, params),
      ),
    },
    {
      name: 'createEnergyLog',
      description: 'Create an energy log entry. Use when user mentions feeling tired, energetic, or their energy level. Automatically creates energy entries from natural language.',
      schema: CreateEnergyLogSchema,
      handler: withErrorHandling('createEnergyLog', async (uid, params) =>
        createEnergyLog(uid, params),
      ),
    },
    {
      name: 'updateEnergyLog',
      description: 'Update an energy log entry. Use when user asks to modify or correct an energy log.',
      schema: UpdateEnergyLogSchema,
      handler: withErrorHandling('updateEnergyLog', async (uid, params) =>
        updateEnergyLog(uid, params),
      ),
    },
    {
      name: 'deleteEnergyLog',
      description: 'Delete an energy log entry. Use when user asks to remove an energy log.',
      schema: DeleteEnergyLogSchema,
      handler: withErrorHandling('deleteEnergyLog', async (uid, params) =>
        deleteEnergyLog(uid, params),
      ),
    },
    {
      name: 'getEnergyTimeline',
      description: 'Get energy timeline data for visualization. Use when user asks about energy trends over time.',
      schema: GetEnergyTimelineSchema,
      handler: withErrorHandling('getEnergyTimeline', async (uid, params) =>
        getEnergyTimeline(uid, params),
      ),
    },
    {
      name: 'getEnergyPatterns',
      description: 'Get energy patterns and insights. Use when user asks about energy patterns or time-of-day energy levels.',
      schema: GetEnergyPatternsSchema,
      handler: withErrorHandling('getEnergyPatterns', async (uid, params) =>
        getEnergyPatterns(uid, params),
      ),
    },
  ];
}
