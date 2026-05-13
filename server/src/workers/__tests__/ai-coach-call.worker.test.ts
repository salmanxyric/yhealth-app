import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/queue.config.js', () => ({
  redisConnection: { host: 'localhost', port: 6379 },
  QueueNames: { AI_COACH_CALL: 'ai-coach-call' },
  JobTypes: { INITIATE_AI_CALL: 'initiate-ai-call' },
}));
vi.mock('../../config/database.config.js', () => ({
  query: vi.fn(),
}));
vi.mock('../../services/logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../services/communication-preferences.service.js', () => ({
  communicationPreferencesService: {
    getForUser: vi.fn(),
  },
}));
vi.mock('../../services/voice-schedule.service.js', () => ({
  voiceScheduleService: {
    getPreferences: vi.fn(),
  },
}));
vi.mock('../../services/chat-call.service.js', () => ({
  chatCallService: {
    initiateAICoachCall: vi.fn(),
  },
  default: {
    initiateAICoachCall: vi.fn(),
  },
}));
vi.mock('../../services/push-notification.service.js', () => ({
  pushNotificationService: {
    deliverForUser: vi.fn(),
  },
}));
vi.mock('../../services/socket.service.js', () => ({
  socketService: {
    isUserConnected: vi.fn(),
  },
}));
vi.mock('../../lib/user-timezone.js', () => ({
  getUserLocalHour: vi.fn().mockReturnValue(21),
}));
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(function() {
    return { on: vi.fn(), close: vi.fn() };
  }),
}));

import { processAICoachCallJob } from '../ai-coach-call.worker.js';
import { query } from '../../config/database.config.js';
import { communicationPreferencesService } from '../../services/communication-preferences.service.js';
import { voiceScheduleService } from '../../services/voice-schedule.service.js';
import { chatCallService } from '../../services/chat-call.service.js';
import { socketService } from '../../services/socket.service.js';

const mockQuery = vi.mocked(query);

describe('processAICoachCallJob', () => {
  const baseJob = {
    id: 'job-1',
    data: {
      userId: 'user-1',
      scheduledTimeHHMM: '21:00',
      scheduledDate: '2026-05-13',
      timezone: 'UTC',
      sessionType: 'quick_checkin' as const,
      attempt: 1,
    },
    attemptsMade: 0,
    log: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: user is active
    mockQuery
      .mockResolvedValueOnce({ // users check
        rows: [{ id: 'user-1', is_active: true, timezone: 'UTC' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any)
      .mockResolvedValueOnce({ // daily cap check
        rows: [{ c: '0' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any)
      .mockResolvedValueOnce({ // update log to initiated
        rows: [], rowCount: 1, command: '', oid: 0, fields: [],
      } as any);

    vi.mocked(voiceScheduleService.getPreferences).mockResolvedValue({
      voiceId: 'alloy',
      speechPace: 1.0,
      voicePreviewPlayed: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      dndDays: [],
      aiCallFrequency: 'moderate',
      preferredCallTimes: ['21:00'],
    });

    vi.mocked(communicationPreferencesService.getForUser).mockResolvedValue({
      user_id: 'user-1',
      checkin_push_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      workdays_only: false,
      max_checkins_per_day: 3,
      missed_followup_hours: 24,
      push_achievements: true,
      push_streaks: true,
      push_nudges: true,
      email_digest: true,
      email_urgent_only: false,
      checkin_miss_count_by_hour: {},
    });

    vi.mocked(socketService.isUserConnected).mockReturnValue(true);
    vi.mocked(chatCallService.initiateAICoachCall).mockResolvedValue({
      id: 'call-1',
    } as any);
  });

  it('initiates a call when all gates pass', async () => {
    // Additional mock for UPDATE chat_call_id after call initiated
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    } as any);

    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ sessionType: 'quick_checkin' }),
    );
  });

  it('skips when ai_call_frequency is off', async () => {
    vi.mocked(voiceScheduleService.getPreferences).mockResolvedValue({
      voiceId: 'alloy',
      speechPace: 1.0,
      voicePreviewPlayed: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      dndDays: [],
      aiCallFrequency: 'off',
      preferredCallTimes: [],
    });

    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when user is offline and logs skipped_offline', async () => {
    vi.mocked(socketService.isUserConnected).mockReturnValue(false);

    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when miss threshold exceeded for this hour', async () => {
    vi.mocked(communicationPreferencesService.getForUser).mockResolvedValue({
      user_id: 'user-1',
      checkin_push_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      workdays_only: false,
      max_checkins_per_day: 3,
      missed_followup_hours: 24,
      push_achievements: true,
      push_streaks: true,
      push_nudges: true,
      email_digest: true,
      email_urgent_only: false,
      checkin_miss_count_by_hour: { '21': 3 },
    });

    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).not.toHaveBeenCalled();
  });
});
