import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

const GetGoogleCalendarEventsSchema = z.object({
  startDate: z.string().optional().describe('Start date in YYYY-MM-DD format. Defaults to today if not provided.'),
  endDate: z.string().optional().describe('End date in YYYY-MM-DD format. Defaults to startDate if not provided.'),
});

async function getGoogleCalendarEvents(
  userId: string,
  params: z.infer<typeof GetGoogleCalendarEventsSchema>,
): Promise<string> {
  const startDate = params.startDate || new Date().toISOString().split('T')[0];
  const endDate = params.endDate || startDate;

  const result = await query<{
    title: string;
    description: string | null;
    start_time: Date;
    end_time: Date;
    location: string | null;
    all_day: boolean;
    busy_status: string;
    status: string;
  }>(
    `SELECT title, description, start_time, end_time, location, all_day, busy_status, status
     FROM calendar_events
     WHERE user_id = $1
       AND start_time::date >= $2::date
       AND start_time::date <= $3::date
       AND status = 'confirmed'
     ORDER BY start_time ASC`,
    [userId, startDate, endDate],
  );

  if (result.rows.length === 0) {
    return JSON.stringify({
      success: true,
      data: [],
      message: `No Google Calendar events found for ${startDate === endDate ? startDate : `${startDate} to ${endDate}`}`,
    });
  }

  const events = result.rows.map(e => ({
    title: e.title,
    description: e.description,
    startTime: e.all_day ? null : new Date(e.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    endTime: e.all_day ? null : new Date(e.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: new Date(e.start_time).toISOString().split('T')[0],
    location: e.location,
    allDay: e.all_day,
    busyStatus: e.busy_status,
  }));

  return JSON.stringify({
    success: true,
    data: events,
    message: `Found ${events.length} Google Calendar event(s)`,
  });
}

export function registerCalendarTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getGoogleCalendarEvents',
      description:
        "Get user's Google Calendar events for a date range. Use when user asks about meetings, appointments, calendar, Google Calendar events, or their schedule for a specific day. Defaults to today if no date provided. Returns event titles, times, locations, and descriptions.",
      schema: GetGoogleCalendarEventsSchema,
      handler: withErrorHandling('getGoogleCalendarEvents', async (uid, params) =>
        getGoogleCalendarEvents(uid, params),
      ),
    },
  ];
}
