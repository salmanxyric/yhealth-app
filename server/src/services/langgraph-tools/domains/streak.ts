import { z } from 'zod';
import { streakService } from '../../streak.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling, successResponse, errorResponse } from '../utils.js';

const GetStreakStatusSchema = z.object({});

const GetStreakCalendarSchema = z.object({
  month: z.string().optional().describe('Month in YYYY-MM format. Defaults to current month.'),
});

const GetStreakLeaderboardSchema = z.object({
  limit: z.number().optional().describe('Max entries to return (default 20).'),
});

const FreezeStreakSchema = z.object({
  reason: z.string().optional().describe('Reason for freezing the streak (e.g., sick, traveling).'),
});

const GetStreakStatsSchema = z.object({});

async function getStreakStatus(userId: string, _params: z.infer<typeof GetStreakStatusSchema>): Promise<string> {
  const status = await streakService.getStreakStatus(userId);
  return successResponse({ streak: status });
}

async function getStreakCalendar(userId: string, params: z.infer<typeof GetStreakCalendarSchema>): Promise<string> {
  const month = params.month || new Date().toISOString().slice(0, 7);
  const calendar = await streakService.getCalendar(userId, month);
  return successResponse({ calendar, month });
}

async function getStreakLeaderboard(userId: string, params: z.infer<typeof GetStreakLeaderboardSchema>): Promise<string> {
  const limit = params.limit || 20;
  const leaderboard = await streakService.getStreakLeaderboard(limit);
  const aroundMe = await streakService.getAroundMe(userId);
  return successResponse({ leaderboard, aroundMe });
}

async function freezeStreak(userId: string, _params: z.infer<typeof FreezeStreakSchema>): Promise<string> {
  try {
    await streakService.applyFreeze(userId);
    return successResponse({ message: 'Streak freeze applied successfully.' });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to freeze streak');
  }
}

async function getStreakStats(userId: string, _params: z.infer<typeof GetStreakStatsSchema>): Promise<string> {
  const stats = await streakService.getStats(userId);
  return successResponse({ stats });
}

export function registerStreakTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getStreakStatus',
      description: 'Get the user\'s current streak status including current streak count, longest streak, freeze availability, and streak tier. Use when the user asks about their streak.',
      schema: GetStreakStatusSchema,
      icon: 'flame',
      mutationType: 'read',
      handler: withErrorHandling('getStreakStatus', getStreakStatus),
    },
    {
      name: 'getStreakCalendar',
      description: 'Get a calendar view of the user\'s streak for a given month showing which days were completed, missed, or frozen. Defaults to current month.',
      schema: GetStreakCalendarSchema,
      icon: 'calendar',
      mutationType: 'read',
      handler: withErrorHandling('getStreakCalendar', getStreakCalendar),
    },
    {
      name: 'getStreakLeaderboard',
      description: 'Get the streak leaderboard and the user\'s position. Use when the user asks about rankings or how they compare to others.',
      schema: GetStreakLeaderboardSchema,
      icon: 'trophy',
      mutationType: 'read',
      handler: withErrorHandling('getStreakLeaderboard', getStreakLeaderboard),
    },
    {
      name: 'freezeStreak',
      description: 'Apply a streak freeze to prevent streak loss for a day. Use when the user says they\'re sick, traveling, or need a rest day and wants to protect their streak.',
      schema: FreezeStreakSchema,
      icon: 'snowflake',
      mutationType: 'update',
      semanticDelta: () => 'Applied streak freeze',
      handler: withErrorHandling('freezeStreak', freezeStreak),
    },
    {
      name: 'getStreakStats',
      description: 'Get detailed streak statistics including total active days, completion rate, average streak length, and milestone history.',
      schema: GetStreakStatsSchema,
      icon: 'bar-chart',
      mutationType: 'read',
      handler: withErrorHandling('getStreakStats', getStreakStats),
    },
  ];
}
