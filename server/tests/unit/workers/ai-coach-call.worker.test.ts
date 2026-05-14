/**
 * AI Coach Call Worker — Unit Tests
 *
 * Tests the 8 gate checks and call initiation flow.
 * Uses beforeEach re-import pattern for resetMocks compatibility.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
const mockGetPreferences = jest.fn<any>();
const mockGetForUser = jest.fn<any>();
const mockIsUserConnected = jest.fn<any>();
const mockInitiateAICoachCall = jest.fn<any>();
const mockGetUserLocalHour = jest.fn<any>();

let processAICoachCallJob: any;

beforeEach(async () => {
  jest.restoreAllMocks();

  jest.unstable_mockModule('../../../src/config/database.config', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service', () => ({
    logger: mockLogger,
  }));

  jest.unstable_mockModule('../../../src/services/voice-schedule.service', () => ({
    voiceScheduleService: { getPreferences: (...args: unknown[]) => mockGetPreferences(...args) },
  }));

  jest.unstable_mockModule('../../../src/services/communication-preferences.service', () => ({
    communicationPreferencesService: { getForUser: (...args: unknown[]) => mockGetForUser(...args) },
  }));

  jest.unstable_mockModule('../../../src/services/socket.service', () => ({
    socketService: { isUserConnected: (...args: unknown[]) => mockIsUserConnected(...args) },
  }));

  jest.unstable_mockModule('../../../src/services/chat-call.service', () => ({
    chatCallService: { initiateAICoachCall: (...args: unknown[]) => mockInitiateAICoachCall(...args) },
  }));

  jest.unstable_mockModule('../../../src/lib/user-timezone', () => ({
    getUserLocalHour: (...args: unknown[]) => mockGetUserLocalHour(...args),
  }));

  jest.unstable_mockModule('../../../src/config/env.config', () => ({
    env: { redis: { enabled: true } },
  }));

  jest.unstable_mockModule('../../../src/config/queue.config', () => ({
    redisConnection: {},
    queueConfig: { defaultJobOptions: {} },
    QueueNames: { AI_COACH_CALL: 'ai-coach-call' },
    JobTypes: { INITIATE_AI_CALL: 'initiate-ai-call' },
  }));

  jest.unstable_mockModule('bullmq', () => ({
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      close: jest.fn(),
    })),
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      getJob: jest.fn(),
      close: jest.fn<any>().mockResolvedValue(undefined),
      on: jest.fn(),
    })),
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn<any>().mockResolvedValue(undefined),
    })),
  }));

  process.env['AI_COACH_CALL_BULLMQ_ENABLED'] = 'true';

  jest.resetModules();
  mockQuery.mockReset();
  mockGetPreferences.mockReset();
  mockGetForUser.mockReset();
  mockIsUserConnected.mockReset();
  mockInitiateAICoachCall.mockReset();
  mockGetUserLocalHour.mockReset();

  mockGetUserLocalHour.mockReturnValue(21);

  const mod = await import('../../../src/workers/ai-coach-call.worker');
  processAICoachCallJob = mod.processAICoachCallJob;
});

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    data: {
      userId: 'user-1',
      scheduledTimeHHMM: '21:00',
      scheduledDate: '2026-05-13',
      timezone: 'UTC',
      sessionType: 'quick_checkin',
      attempt: 1,
      ...overrides,
    },
    attemptsMade: 0,
    log: jest.fn(),
  } as any;
}

function defaultMocks() {
  mockQuery
    .mockResolvedValueOnce({
      rows: [{ id: 'user-1', is_active: true }],
      rowCount: 1, command: '', oid: 0, fields: [],
    })
    .mockResolvedValueOnce({
      rows: [{ c: '0' }],
      rowCount: 1, command: '', oid: 0, fields: [],
    })
    .mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

  mockGetPreferences.mockResolvedValue({
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

  mockGetForUser.mockResolvedValue({
    user_id: 'user-1',
    checkin_push_enabled: true,
    max_checkins_per_day: 3,
    checkin_miss_count_by_hour: {},
  });

  mockIsUserConnected.mockReturnValue(true);
  mockInitiateAICoachCall.mockResolvedValue({ id: 'call-1' });
}

describe('AI Coach Call Worker', () => {
  it('initiates a call when all gates pass', async () => {
    defaultMocks();
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await processAICoachCallJob(makeJob());

    expect(mockInitiateAICoachCall).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ sessionType: 'quick_checkin' }),
    );
  });

  it('skips when feature flag is disabled', async () => {
    process.env['AI_COACH_CALL_BULLMQ_ENABLED'] = 'false';
    defaultMocks();
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when account is inactive', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'user-1', is_active: false }],
      rowCount: 1, command: '', oid: 0, fields: [],
    });
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    mockGetPreferences.mockResolvedValue({
      aiCallFrequency: 'moderate',
      quietHoursEnabled: false,
      dndDays: [],
    });
    mockGetForUser.mockResolvedValue({
      checkin_push_enabled: true,
      max_checkins_per_day: 3,
      checkin_miss_count_by_hour: {},
    });
    mockIsUserConnected.mockReturnValue(true);

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when ai_call_frequency is off', async () => {
    defaultMocks();
    mockGetPreferences.mockResolvedValue({
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
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when checkin push is disabled', async () => {
    defaultMocks();
    mockGetForUser.mockResolvedValue({
      user_id: 'user-1',
      checkin_push_enabled: false,
      max_checkins_per_day: 3,
      checkin_miss_count_by_hour: {},
    });
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when user is offline and logs skipped_offline', async () => {
    defaultMocks();
    mockIsUserConnected.mockReturnValue(false);
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when miss threshold exceeded for scheduled hour', async () => {
    defaultMocks();
    mockGetForUser.mockResolvedValue({
      user_id: 'user-1',
      checkin_push_enabled: true,
      max_checkins_per_day: 3,
      checkin_miss_count_by_hour: { '21': 3 },
    });
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when daily cap is reached', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', is_active: true }],
        rowCount: 1, command: '', oid: 0, fields: [],
      })
      .mockResolvedValueOnce({
        rows: [{ c: '3' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      })
      .mockResolvedValueOnce({
        rows: [], rowCount: 1, command: '', oid: 0, fields: [],
      });

    mockGetPreferences.mockResolvedValue({
      voiceId: 'alloy', speechPace: 1.0, voicePreviewPlayed: false,
      quietHoursEnabled: false, quietHoursStart: '22:00', quietHoursEnd: '07:00',
      dndDays: [], aiCallFrequency: 'moderate', preferredCallTimes: ['21:00'],
    });
    mockGetForUser.mockResolvedValue({
      user_id: 'user-1', checkin_push_enabled: true,
      max_checkins_per_day: 3, checkin_miss_count_by_hour: {},
    });
    mockIsUserConnected.mockReturnValue(true);

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips on quiet hours', async () => {
    defaultMocks();
    mockGetPreferences.mockResolvedValue({
      voiceId: 'alloy',
      speechPace: 1.0,
      voicePreviewPlayed: false,
      quietHoursEnabled: true,
      quietHoursStart: '20:00',
      quietHoursEnd: '08:00',
      dndDays: [],
      aiCallFrequency: 'moderate',
      preferredCallTimes: ['21:00'],
    });
    mockGetUserLocalHour.mockReturnValue(21);
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await processAICoachCallJob(makeJob());
    expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
  });

  it('records error in log when call initiation fails', async () => {
    defaultMocks();
    mockInitiateAICoachCall.mockRejectedValue(new Error('WebRTC failed'));
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 1, command: '', oid: 0, fields: [],
    });

    await expect(processAICoachCallJob(makeJob())).rejects.toThrow('WebRTC failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      '[AICoachCallWorker] Failed to initiate call',
      expect.objectContaining({ userId: 'user-1' }),
    );
  });
});
