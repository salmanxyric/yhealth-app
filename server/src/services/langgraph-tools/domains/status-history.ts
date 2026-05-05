import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetStatusHistorySchema = z.object({
  statusFilter: z.string().optional().describe('Filter by status: sick, injury, rest, vacation, travel, stress'),
  daysBack: z.number().optional().default(90).describe('How many days back to search (default 90)'),
});

// --- Implementations ---

async function getStatusHistory(userId: string, params: z.infer<typeof GetStatusHistorySchema>): Promise<string> {
  const conditions = [`user_id = $1`, `status_date >= CURRENT_DATE - ($2 || ' days')::INTERVAL`];
  const values: (string | number)[] = [userId, params.daysBack ?? 90];

  if (params.statusFilter) {
    conditions.push(`activity_status = $3`);
    values.push(params.statusFilter);
  }

  const result = await query<{
    status_date: string;
    activity_status: string;
    mood: number | null;
    notes: string | null;
    expected_end_date: string | null;
    detected_from: string | null;
  }>(
    `SELECT status_date::text, activity_status, mood, notes, expected_end_date::text, detected_from
     FROM activity_status_history
     WHERE ${conditions.join(' AND ')}
     ORDER BY status_date DESC
     LIMIT 20`,
    values
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No status history found for the given criteria.' });
  }

  return JSON.stringify({
    count: result.rows.length,
    history: result.rows.map((r: any) => ({
      date: r.status_date,
      status: r.activity_status,
      mood: r.mood,
      notes: r.notes,
      expectedEnd: r.expected_end_date,
      source: r.detected_from,
    })),
  });
}

// --- Registration ---

export function registerStatusHistoryTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getStatusHistory',
      description: 'Get the user\'s activity status history. Use when user asks about past statuses like "when was I last sick", "how often do I travel", "my status history". Returns dates, statuses, durations, and notes.',
      schema: GetStatusHistorySchema,
      handler: withErrorHandling('getStatusHistory', (uid, params) => getStatusHistory(uid, params)),
    },
  ];
}
