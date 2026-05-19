/**
 * Voice Schedule Service — Unit Tests
 *
 * Tests for voice preferences, schedule settings, call initiation checks,
 * and time range logic.
 *
 * Note: This project uses resetMocks: true globally, so mock implementations
 * set in beforeAll are stripped before each test. We use beforeEach to
 * re-import a fresh singleton for each test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockSyncUserSchedule = jest.fn<any>();
const mockLoggerWarn = jest.fn<any>();
const mockLoggerError = jest.fn<any>();

let voiceScheduleService: any;
let VOICE_OPTIONS: any;
let FREQUENCY_OPTIONS: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  mockQuery.mockReset();
  mockSyncUserSchedule.mockReset().mockResolvedValue(undefined);
  mockLoggerWarn.mockReset();
  mockLoggerError.mockReset();

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
    transaction: jest.fn(),
    pool: { query: jest.fn(), end: jest.fn() },
    database: { healthCheck: jest.fn() },
    getClient: jest.fn(),
    closePool: jest.fn(),
    testConnection: jest.fn(),
    getPoolStats: jest.fn(),
    default: {},
  }));

  jest.unstable_mockModule('../../../src/database/pg.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: {
      info: jest.fn(),
      warn: (...args: unknown[]) => mockLoggerWarn(...args),
      error: (...args: unknown[]) => mockLoggerError(...args),
      debug: jest.fn(),
    },
  }));

  jest.unstable_mockModule('../../../src/services/ai-coach-call-queue.service.js', () => ({
    aiCoachCallQueueService: {
      syncUserSchedule: (...args: unknown[]) => mockSyncUserSchedule(...args),
    },
  }));

  jest.resetModules();

  const mod = await import('../../../src/services/voice-schedule.service.js');
  voiceScheduleService = mod.voiceScheduleService;
  VOICE_OPTIONS = mod.VOICE_OPTIONS;
  FREQUENCY_OPTIONS = mod.FREQUENCY_OPTIONS;
});

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[], rowCount?: number) {
  return {
    rows,
    rowCount: rowCount ?? rows.length,
    command: 'SELECT',
    oid: 0,
    fields: [],
  };
}

function fakePreferencesRow(overrides: Record<string, unknown> = {}) {
  return {
    voice_id: 'alloy',
    speech_pace: 1.0,
    voice_preview_played: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    dnd_days: [],
    ai_call_frequency: 'moderate',
    preferred_call_times: [],
    ...overrides,
  };
}

const DEFAULT_PREFS = {
  voiceId: 'alloy',
  speechPace: 1.0,
  voicePreviewPlayed: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  dndDays: [],
  aiCallFrequency: 'moderate',
  preferredCallTimes: [],
};

const USER_ID = 'user-123';

// ============================================
// TESTS
// ============================================

describe('VoiceScheduleService', () => {
  // ------------------------------------------
  // getPreferences
  // ------------------------------------------
  describe('getPreferences', () => {
    it('returns default preferences when no DB row exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await voiceScheduleService.getPreferences(USER_ID);

      expect(result).toEqual(DEFAULT_PREFS);
    });

    it('returns stored preferences from DB', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          voice_id: 'nova',
          speech_pace: 1.5,
          voice_preview_played: true,
          quiet_hours_enabled: true,
          quiet_hours_start: '23:00',
          quiet_hours_end: '08:00',
          dnd_days: [0, 6],
          ai_call_frequency: 'proactive',
          preferred_call_times: ['09:00', '14:00'],
        })]),
      );

      const result = await voiceScheduleService.getPreferences(USER_ID);

      expect(result).toEqual({
        voiceId: 'nova',
        speechPace: 1.5,
        voicePreviewPlayed: true,
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '08:00',
        dndDays: [0, 6],
        aiCallFrequency: 'proactive',
        preferredCallTimes: ['09:00', '14:00'],
      });
    });

    it('parses string speech_pace to float', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({ speech_pace: '1.75' })]),
      );

      const result = await voiceScheduleService.getPreferences(USER_ID);

      expect(result.speechPace).toBe(1.75);
      expect(typeof result.speechPace).toBe('number');
    });

    it('applies defaults for null DB fields', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{
          voice_id: null,
          speech_pace: null,
          voice_preview_played: null,
          quiet_hours_enabled: null,
          quiet_hours_start: null,
          quiet_hours_end: null,
          dnd_days: null,
          ai_call_frequency: null,
          preferred_call_times: null,
        }]),
      );

      const result = await voiceScheduleService.getPreferences(USER_ID);

      expect(result).toEqual(DEFAULT_PREFS);
    });

    it('returns defaults and logs error on DB failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await voiceScheduleService.getPreferences(USER_ID);

      expect(result).toEqual(DEFAULT_PREFS);
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[VoiceSchedule] Error getting preferences',
        expect.objectContaining({ error: 'Connection refused', userId: USER_ID }),
      );
    });

    it('passes correct SQL and userId parameter', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await voiceScheduleService.getPreferences(USER_ID);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM user_preferences WHERE user_id = $1'),
        [USER_ID],
      );
    });
  });

  // ------------------------------------------
  // updateVoiceSettings
  // ------------------------------------------
  describe('updateVoiceSettings', () => {
    /**
     * Helper: mock the full updateVoiceSettings query sequence when prefs exist.
     * 1. SELECT id (exists check) -> found
     * 2. UPDATE user_preferences
     * 3. getPreferences SELECT (for return value)
     */
    function mockUpdateVoiceExisting(prefsRow = fakePreferencesRow()) {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'pref-1' }]))   // exists check
        .mockResolvedValueOnce(pgResult([], 1))                 // UPDATE
        .mockResolvedValueOnce(pgResult([prefsRow]));            // getPreferences
    }

    /**
     * Helper: mock the full updateVoiceSettings query sequence when prefs do NOT exist.
     * 1. SELECT id (exists check) -> empty
     * 2. INSERT INTO user_preferences
     * 3. getPreferences SELECT (for return value)
     */
    function mockUpdateVoiceNew(prefsRow = fakePreferencesRow()) {
      mockQuery
        .mockResolvedValueOnce(pgResult([]))                    // exists check -> not found
        .mockResolvedValueOnce(pgResult([], 1))                 // INSERT
        .mockResolvedValueOnce(pgResult([prefsRow]));            // getPreferences
    }

    it('updates voice ID for existing preferences', async () => {
      mockUpdateVoiceExisting(fakePreferencesRow({ voice_id: 'echo' }));

      const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {
        voiceId: 'echo',
      });

      expect(result.voiceId).toBe('echo');

      // Verify UPDATE query was executed
      const updateCall = mockQuery.mock.calls.find(
        (c: any) => typeof c[0] === 'string' && c[0].includes('UPDATE user_preferences SET'),
      );
      expect(updateCall).toBeDefined();
    });

    it('creates preferences when they do not exist', async () => {
      mockUpdateVoiceNew(fakePreferencesRow({ voice_id: 'fable' }));

      const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {
        voiceId: 'fable',
      });

      expect(result.voiceId).toBe('fable');

      // Verify INSERT query was executed
      const insertCall = mockQuery.mock.calls.find(
        (c: any) => typeof c[0] === 'string' && c[0].includes('INSERT INTO user_preferences'),
      );
      expect(insertCall).toBeDefined();
    });

    it('rejects invalid voice ID', async () => {
      await expect(
        voiceScheduleService.updateVoiceSettings(USER_ID, {
          voiceId: 'invalid_voice' as any,
        }),
      ).rejects.toThrow('Invalid voice ID');
    });

    it('accepts all valid voice IDs', async () => {
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

      for (const voice of validVoices) {
        mockQuery.mockReset();
        mockUpdateVoiceExisting(fakePreferencesRow({ voice_id: voice }));

        const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {
          voiceId: voice,
        });

        expect(result.voiceId).toBe(voice);
      }
    });

    it('accepts speech pace at lower bound (0.5)', async () => {
      mockUpdateVoiceExisting(fakePreferencesRow({ speech_pace: 0.5 }));

      const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {
        speechPace: 0.5,
      });

      expect(result.speechPace).toBe(0.5);
    });

    it('accepts speech pace at upper bound (2.0)', async () => {
      mockUpdateVoiceExisting(fakePreferencesRow({ speech_pace: 2.0 }));

      const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {
        speechPace: 2.0,
      });

      expect(result.speechPace).toBe(2.0);
    });

    it('rejects speech pace below 0.5', async () => {
      await expect(
        voiceScheduleService.updateVoiceSettings(USER_ID, {
          speechPace: 0.4,
        }),
      ).rejects.toThrow('Speech pace must be between 0.5 and 2.0');
    });

    it('rejects speech pace above 2.0', async () => {
      await expect(
        voiceScheduleService.updateVoiceSettings(USER_ID, {
          speechPace: 2.1,
        }),
      ).rejects.toThrow('Speech pace must be between 0.5 and 2.0');
    });

    it('updates voicePreviewPlayed flag', async () => {
      mockUpdateVoiceExisting(fakePreferencesRow({ voice_preview_played: true }));

      const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {
        voicePreviewPlayed: true,
      });

      expect(result.voicePreviewPlayed).toBe(true);
    });

    it('updates multiple voice settings at once', async () => {
      mockUpdateVoiceExisting(fakePreferencesRow({
        voice_id: 'shimmer',
        speech_pace: 1.8,
        voice_preview_played: true,
      }));

      const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {
        voiceId: 'shimmer',
        speechPace: 1.8,
        voicePreviewPlayed: true,
      });

      expect(result).toEqual({
        voiceId: 'shimmer',
        speechPace: 1.8,
        voicePreviewPlayed: true,
      });
    });

    it('skips DB update when no settings provided', async () => {
      // With empty settings, updates.length === 0, so only getPreferences is called
      mockQuery.mockResolvedValueOnce(pgResult([fakePreferencesRow()]));

      const result = await voiceScheduleService.updateVoiceSettings(USER_ID, {});

      expect(result).toEqual({
        voiceId: 'alloy',
        speechPace: 1.0,
        voicePreviewPlayed: false,
      });

      // Only getPreferences query should have been called
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('logs and rethrows on DB error', async () => {
      // exists check succeeds, UPDATE fails
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'pref-1' }]))
        .mockRejectedValueOnce(new Error('DB write failed'));

      await expect(
        voiceScheduleService.updateVoiceSettings(USER_ID, { voiceId: 'echo' }),
      ).rejects.toThrow('DB write failed');

      expect(mockLoggerError).toHaveBeenCalledWith(
        '[VoiceSchedule] Error updating voice settings',
        expect.objectContaining({ error: 'DB write failed', userId: USER_ID }),
      );
    });
  });

  // ------------------------------------------
  // updateScheduleSettings
  // ------------------------------------------
  describe('updateScheduleSettings', () => {
    /**
     * Helper: mock updateScheduleSettings sequence when prefs exist.
     * 1. SELECT id (exists check) -> found
     * 2. UPDATE user_preferences
     * 3. getPreferences SELECT (for return value)
     */
    function mockUpdateScheduleExisting(prefsRow = fakePreferencesRow()) {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'pref-1' }]))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([prefsRow]));
    }

    /**
     * Helper: mock updateScheduleSettings when prefs do NOT exist.
     * 1. SELECT id (exists check) -> empty
     * 2. INSERT INTO user_preferences (create with defaults)
     * 3. UPDATE user_preferences
     * 4. getPreferences SELECT (for return value)
     */
    function mockUpdateScheduleNew(prefsRow = fakePreferencesRow()) {
      mockQuery
        .mockResolvedValueOnce(pgResult([]))                   // exists -> not found
        .mockResolvedValueOnce(pgResult([], 1))                // INSERT defaults
        .mockResolvedValueOnce(pgResult([], 1))                // UPDATE
        .mockResolvedValueOnce(pgResult([prefsRow]));           // getPreferences
    }

    it('updates quiet hours settings', async () => {
      mockUpdateScheduleExisting(fakePreferencesRow({
        quiet_hours_enabled: true,
        quiet_hours_start: '23:00',
        quiet_hours_end: '06:00',
      }));

      const result = await voiceScheduleService.updateScheduleSettings(USER_ID, {
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '06:00',
      });

      expect(result.quietHoursEnabled).toBe(true);
      expect(result.quietHoursStart).toBe('23:00');
      expect(result.quietHoursEnd).toBe('06:00');

      // quietHoursEnabled triggers syncUserSchedule
      expect(mockSyncUserSchedule).toHaveBeenCalledWith(USER_ID);
    });

    it('updates DnD days with valid values', async () => {
      mockUpdateScheduleExisting(fakePreferencesRow({
        dnd_days: [0, 6],
      }));

      const result = await voiceScheduleService.updateScheduleSettings(USER_ID, {
        dndDays: [0, 6],
      });

      expect(result.dndDays).toEqual([0, 6]);
      expect(mockSyncUserSchedule).toHaveBeenCalledWith(USER_ID);
    });

    it('rejects DnD day below 0', async () => {
      await expect(
        voiceScheduleService.updateScheduleSettings(USER_ID, {
          dndDays: [-1, 3],
        }),
      ).rejects.toThrow('DND days must be between 0 (Sunday) and 6 (Saturday)');
    });

    it('rejects DnD day above 6', async () => {
      await expect(
        voiceScheduleService.updateScheduleSettings(USER_ID, {
          dndDays: [1, 7],
        }),
      ).rejects.toThrow('DND days must be between 0 (Sunday) and 6 (Saturday)');
    });

    it('accepts all valid frequency values', async () => {
      const validFrequencies = ['off', 'minimal', 'moderate', 'proactive'];

      for (const freq of validFrequencies) {
        mockQuery.mockReset();
        mockSyncUserSchedule.mockReset().mockResolvedValue(undefined);

        mockUpdateScheduleExisting(fakePreferencesRow({ ai_call_frequency: freq }));

        const result = await voiceScheduleService.updateScheduleSettings(USER_ID, {
          aiCallFrequency: freq,
        });

        expect(result.aiCallFrequency).toBe(freq);
      }
    });

    it('rejects invalid frequency value', async () => {
      await expect(
        voiceScheduleService.updateScheduleSettings(USER_ID, {
          aiCallFrequency: 'daily' as any,
        }),
      ).rejects.toThrow('Invalid AI call frequency');
    });

    it('updates preferred call times', async () => {
      mockUpdateScheduleExisting(fakePreferencesRow({
        preferred_call_times: ['09:00', '14:00', '18:00'],
      }));

      const result = await voiceScheduleService.updateScheduleSettings(USER_ID, {
        preferredCallTimes: ['09:00', '14:00', '18:00'],
      });

      expect(result.preferredCallTimes).toEqual(['09:00', '14:00', '18:00']);
      expect(mockSyncUserSchedule).toHaveBeenCalledWith(USER_ID);
    });

    it('creates preferences when they do not exist', async () => {
      mockUpdateScheduleNew(fakePreferencesRow({ ai_call_frequency: 'minimal' }));

      const result = await voiceScheduleService.updateScheduleSettings(USER_ID, {
        aiCallFrequency: 'minimal',
      });

      expect(result.aiCallFrequency).toBe('minimal');

      // Verify INSERT was called
      const insertCall = mockQuery.mock.calls.find(
        (c: any) => typeof c[0] === 'string' && c[0].includes('INSERT INTO user_preferences'),
      );
      expect(insertCall).toBeDefined();
    });

    it('does not call syncUserSchedule when only quietHoursStart/End are updated', async () => {
      mockUpdateScheduleExisting(fakePreferencesRow({
        quiet_hours_start: '23:30',
        quiet_hours_end: '06:30',
      }));

      await voiceScheduleService.updateScheduleSettings(USER_ID, {
        quietHoursStart: '23:30',
        quietHoursEnd: '06:30',
      });

      // quietHoursStart and quietHoursEnd alone do NOT trigger sync
      expect(mockSyncUserSchedule).not.toHaveBeenCalled();
    });

    it('skips DB update when no settings provided', async () => {
      // Empty settings -> updates.length === 0, but also no sync trigger fields
      mockQuery.mockResolvedValueOnce(pgResult([fakePreferencesRow()]));

      const result = await voiceScheduleService.updateScheduleSettings(USER_ID, {});

      expect(result.aiCallFrequency).toBe('moderate');
      expect(mockSyncUserSchedule).not.toHaveBeenCalled();
      // Only getPreferences query should have been called
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('handles syncUserSchedule failure gracefully (non-blocking)', async () => {
      mockUpdateScheduleExisting(fakePreferencesRow({ ai_call_frequency: 'proactive' }));
      mockSyncUserSchedule.mockRejectedValueOnce(new Error('Redis down'));

      const result = await voiceScheduleService.updateScheduleSettings(USER_ID, {
        aiCallFrequency: 'proactive',
      });

      // Should still return the result despite sync failure
      expect(result.aiCallFrequency).toBe('proactive');
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        '[VoiceSchedule] BullMQ sync failed (non-blocking)',
        expect.objectContaining({ userId: USER_ID, error: 'Redis down' }),
      );
    });

    it('logs and rethrows on DB error', async () => {
      // exists check succeeds, UPDATE fails
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'pref-1' }]))
        .mockRejectedValueOnce(new Error('Constraint violation'));

      await expect(
        voiceScheduleService.updateScheduleSettings(USER_ID, {
          aiCallFrequency: 'minimal',
        }),
      ).rejects.toThrow('Constraint violation');

      expect(mockLoggerError).toHaveBeenCalledWith(
        '[VoiceSchedule] Error updating schedule settings',
        expect.objectContaining({ error: 'Constraint violation', userId: USER_ID }),
      );
    });
  });

  // ------------------------------------------
  // canInitiateCall
  // ------------------------------------------
  describe('canInitiateCall', () => {
    it('allows when all conditions are met', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: false,
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({ allowed: true });
    });

    it('blocks when AI calls are set to off', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({ ai_call_frequency: 'off' })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({
        allowed: false,
        reason: 'AI-initiated calls are disabled',
      });
    });

    it('blocks on a DnD day', async () => {
      const today = new Date().getDay();
      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [today],
          quiet_hours_enabled: false,
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({
        allowed: false,
        reason: 'Today is a do-not-disturb day',
      });
    });

    it('allows when today is NOT a DnD day', async () => {
      const today = new Date().getDay();
      const otherDay = (today + 1) % 7;
      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'proactive',
          dnd_days: [otherDay],
          quiet_hours_enabled: false,
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({ allowed: true });
    });

    it('blocks during quiet hours (normal range)', async () => {
      // Create a quiet hour range that definitely includes right now
      const now = new Date();
      const currentHour = now.getHours();
      const startHour = ((currentHour - 1 + 24) % 24).toString().padStart(2, '0');
      const endHour = ((currentHour + 1) % 24).toString().padStart(2, '0');

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: `${startHour}:00`,
          quiet_hours_end: `${endHour}:00`,
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({
        allowed: false,
        reason: 'Currently in quiet hours',
      });
    });

    it('allows when quiet hours are enabled but current time is outside range', async () => {
      // Set quiet hours far from now
      const now = new Date();
      const currentHour = now.getHours();
      // Set quiet hours to a 2-hour block 12 hours away
      const startHour = ((currentHour + 12) % 24).toString().padStart(2, '0');
      const endHour = ((currentHour + 14) % 24).toString().padStart(2, '0');

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'proactive',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: `${startHour}:00`,
          quiet_hours_end: `${endHour}:00`,
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({ allowed: true });
    });

    it('allows when quiet hours are disabled even during the range', async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const startHour = ((currentHour - 1 + 24) % 24).toString().padStart(2, '0');
      const endHour = ((currentHour + 1) % 24).toString().padStart(2, '0');

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: false,
          quiet_hours_start: `${startHour}:00`,
          quiet_hours_end: `${endHour}:00`,
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({ allowed: true });
    });

    it('returns allowed with defaults when DB fails (getPreferences catches internally)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Timeout'));

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      // getPreferences catches DB errors and returns defaults (aiCallFrequency: 'moderate', no DnD, quiet hours disabled)
      // so canInitiateCall sees valid defaults and returns allowed: true
      expect(result).toEqual({ allowed: true });
    });

    it('uses defaults (allowed) when no preferences row exists', async () => {
      // getPreferences returns defaults (aiCallFrequency: 'moderate', dndDays: [], quietHoursEnabled: false)
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({ allowed: true });
    });
  });

  // ------------------------------------------
  // isTimeInRange (tested via canInitiateCall)
  // ------------------------------------------
  describe('isTimeInRange (via canInitiateCall)', () => {
    /**
     * We test the private isTimeInRange method indirectly through canInitiateCall
     * by configuring quiet hours and checking the allowed/blocked result.
     */

    it('handles overnight range (22:00-06:00) blocking at 23:00', async () => {
      // We can test this deterministically by mocking Date
      const mockDate = new Date('2026-05-19T23:30:00');
      jest.spyOn(global, 'Date').mockImplementation(
        (...args: any[]) => {
          if (args.length === 0) return mockDate;
          return new (Function.prototype.bind.apply(Date as any, [null, ...args]))();
        },
      );

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '06:00',
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({
        allowed: false,
        reason: 'Currently in quiet hours',
      });
    });

    it('handles overnight range (22:00-06:00) blocking at 03:00', async () => {
      const mockDate = new Date('2026-05-19T03:00:00');
      jest.spyOn(global, 'Date').mockImplementation(
        (...args: any[]) => {
          if (args.length === 0) return mockDate;
          return new (Function.prototype.bind.apply(Date as any, [null, ...args]))();
        },
      );

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '06:00',
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({
        allowed: false,
        reason: 'Currently in quiet hours',
      });
    });

    it('handles overnight range (22:00-06:00) allowing at 12:00', async () => {
      const mockDate = new Date('2026-05-19T12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(
        (...args: any[]) => {
          if (args.length === 0) return mockDate;
          return new (Function.prototype.bind.apply(Date as any, [null, ...args]))();
        },
      );

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '06:00',
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({ allowed: true });
    });

    it('handles normal range (09:00-17:00) blocking at 12:00', async () => {
      const mockDate = new Date('2026-05-19T12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(
        (...args: any[]) => {
          if (args.length === 0) return mockDate;
          return new (Function.prototype.bind.apply(Date as any, [null, ...args]))();
        },
      );

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: '09:00',
          quiet_hours_end: '17:00',
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({
        allowed: false,
        reason: 'Currently in quiet hours',
      });
    });

    it('handles normal range (09:00-17:00) allowing at 08:00', async () => {
      const mockDate = new Date('2026-05-19T08:00:00');
      jest.spyOn(global, 'Date').mockImplementation(
        (...args: any[]) => {
          if (args.length === 0) return mockDate;
          return new (Function.prototype.bind.apply(Date as any, [null, ...args]))();
        },
      );

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: '09:00',
          quiet_hours_end: '17:00',
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      expect(result).toEqual({ allowed: true });
    });

    it('handles boundary: time equals start of range', async () => {
      const mockDate = new Date('2026-05-19T22:00:00');
      jest.spyOn(global, 'Date').mockImplementation(
        (...args: any[]) => {
          if (args.length === 0) return mockDate;
          return new (Function.prototype.bind.apply(Date as any, [null, ...args]))();
        },
      );

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '06:00',
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      // time >= start (22:00 >= 22:00) -> in quiet hours
      expect(result).toEqual({
        allowed: false,
        reason: 'Currently in quiet hours',
      });
    });

    it('handles boundary: time equals end of range', async () => {
      const mockDate = new Date('2026-05-19T06:00:00');
      jest.spyOn(global, 'Date').mockImplementation(
        (...args: any[]) => {
          if (args.length === 0) return mockDate;
          return new (Function.prototype.bind.apply(Date as any, [null, ...args]))();
        },
      );

      mockQuery.mockResolvedValueOnce(
        pgResult([fakePreferencesRow({
          ai_call_frequency: 'moderate',
          dnd_days: [],
          quiet_hours_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '06:00',
        })]),
      );

      const result = await voiceScheduleService.canInitiateCall(USER_ID);

      // time <= end (06:00 <= 06:00) -> in quiet hours
      expect(result).toEqual({
        allowed: false,
        reason: 'Currently in quiet hours',
      });
    });
  });

  // ------------------------------------------
  // getVoiceOptions
  // ------------------------------------------
  describe('getVoiceOptions', () => {
    it('returns all 6 voice options', () => {
      const options = voiceScheduleService.getVoiceOptions();

      expect(options).toHaveLength(6);
      expect(options.map((o: any) => o.id)).toEqual([
        'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer',
      ]);
    });

    it('each option has required fields', () => {
      const options = voiceScheduleService.getVoiceOptions();

      for (const option of options) {
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('name');
        expect(option).toHaveProperty('description');
        expect(option).toHaveProperty('gender');
        expect(option).toHaveProperty('tone');
      }
    });
  });

  // ------------------------------------------
  // getFrequencyOptions
  // ------------------------------------------
  describe('getFrequencyOptions', () => {
    it('returns all 4 frequency options', () => {
      const options = voiceScheduleService.getFrequencyOptions();

      expect(Object.keys(options)).toEqual(['off', 'minimal', 'moderate', 'proactive']);
    });

    it('each option has label, description, and callsPerWeek', () => {
      const options = voiceScheduleService.getFrequencyOptions();

      for (const key of Object.keys(options)) {
        expect(options[key]).toHaveProperty('label');
        expect(options[key]).toHaveProperty('description');
        expect(options[key]).toHaveProperty('callsPerWeek');
      }
    });
  });

  // ------------------------------------------
  // Exported constants
  // ------------------------------------------
  describe('exported constants', () => {
    it('VOICE_OPTIONS contains 6 voices', () => {
      expect(VOICE_OPTIONS).toHaveLength(6);
    });

    it('FREQUENCY_OPTIONS contains off, minimal, moderate, proactive', () => {
      expect(FREQUENCY_OPTIONS).toHaveProperty('off');
      expect(FREQUENCY_OPTIONS).toHaveProperty('minimal');
      expect(FREQUENCY_OPTIONS).toHaveProperty('moderate');
      expect(FREQUENCY_OPTIONS).toHaveProperty('proactive');
    });
  });
});
