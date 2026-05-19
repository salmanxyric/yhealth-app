/**
 * Voice Schedule Service - Unit Tests
 *
 * Tests for voiceScheduleService (6 API methods) and helper functions (4).
 * Validates API delegation, correct endpoints, HTTP methods, request bodies,
 * and pure helper function behavior including boundary values.
 *
 * @module __tests__/services/voice-schedule.service.test
 */

// ---------------------------------------------------------------------------
// Mock: @/lib/api-client
// ---------------------------------------------------------------------------
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Must import AFTER jest.mock so the mock is in place
import { api } from '@/lib/api-client';
import {
  voiceScheduleService,
  getDayName,
  getShortDayName,
  formatScheduleTime,
  getSpeechPaceLabel,
} from '@/src/shared/services/voice-schedule.service';

import type {
  VoiceSettings,
  ScheduleSettings,
  VoiceSchedulePreferences,
  VoiceOption,
  FrequencyOption,
  AICallFrequency,
} from '@/src/shared/services/voice-schedule.service';

// Typed mock reference
const mockApi = api as jest.Mocked<typeof api>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a successful ApiResponse wrapper */
function ok<T>(data: T) {
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('voiceScheduleService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. getPreferences
  // =========================================================================
  describe('getPreferences', () => {
    it('should GET /voice-schedule/preferences', async () => {
      const prefs: VoiceSchedulePreferences = {
        voiceId: 'alloy',
        speechPace: 1.0,
        voicePreviewPlayed: false,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        dndDays: [0, 6],
        aiCallFrequency: 'moderate',
        preferredCallTimes: ['09:00', '14:00'],
      };
      mockApi.get.mockResolvedValueOnce(ok(prefs));

      const result = await voiceScheduleService.getPreferences();

      expect(mockApi.get).toHaveBeenCalledWith('/voice-schedule/preferences');
      expect(result).toEqual(ok(prefs));
    });
  });

  // =========================================================================
  // 2. updateVoiceSettings
  // =========================================================================
  describe('updateVoiceSettings', () => {
    it('should PATCH /voice-schedule/voice with full settings', async () => {
      const settings: Partial<VoiceSettings> = {
        voiceId: 'nova',
        speechPace: 1.2,
        voicePreviewPlayed: true,
      };
      const response: VoiceSettings = {
        voiceId: 'nova',
        speechPace: 1.2,
        voicePreviewPlayed: true,
      };
      mockApi.patch.mockResolvedValueOnce(ok(response));

      const result = await voiceScheduleService.updateVoiceSettings(settings);

      expect(mockApi.patch).toHaveBeenCalledWith('/voice-schedule/voice', settings);
      expect(result).toEqual(ok(response));
    });

    it('should PATCH with partial settings (single field)', async () => {
      const settings: Partial<VoiceSettings> = { speechPace: 0.8 };
      mockApi.patch.mockResolvedValueOnce(ok({ voiceId: 'alloy', speechPace: 0.8, voicePreviewPlayed: false }));

      await voiceScheduleService.updateVoiceSettings(settings);

      expect(mockApi.patch).toHaveBeenCalledWith('/voice-schedule/voice', { speechPace: 0.8 });
    });
  });

  // =========================================================================
  // 3. updateScheduleSettings
  // =========================================================================
  describe('updateScheduleSettings', () => {
    it('should PATCH /voice-schedule/schedule with full settings', async () => {
      const settings: Partial<ScheduleSettings> = {
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '08:00',
        dndDays: [0],
        aiCallFrequency: 'proactive',
        preferredCallTimes: ['10:00'],
      };
      mockApi.patch.mockResolvedValueOnce(ok(settings));

      await voiceScheduleService.updateScheduleSettings(settings);

      expect(mockApi.patch).toHaveBeenCalledWith('/voice-schedule/schedule', settings);
    });

    it('should PATCH with partial settings (single field)', async () => {
      const settings: Partial<ScheduleSettings> = { aiCallFrequency: 'off' };
      mockApi.patch.mockResolvedValueOnce(ok(settings));

      await voiceScheduleService.updateScheduleSettings(settings);

      expect(mockApi.patch).toHaveBeenCalledWith('/voice-schedule/schedule', { aiCallFrequency: 'off' });
    });
  });

  // =========================================================================
  // 4. getVoiceOptions
  // =========================================================================
  describe('getVoiceOptions', () => {
    it('should GET /voice-schedule/voices', async () => {
      const voices: { voices: VoiceOption[] } = {
        voices: [
          { id: 'alloy', name: 'Alloy', description: 'Warm and friendly', gender: 'neutral', tone: 'warm' },
          { id: 'nova', name: 'Nova', description: 'Energetic and clear', gender: 'female', tone: 'bright' },
        ],
      };
      mockApi.get.mockResolvedValueOnce(ok(voices));

      const result = await voiceScheduleService.getVoiceOptions();

      expect(mockApi.get).toHaveBeenCalledWith('/voice-schedule/voices');
      expect(result).toEqual(ok(voices));
    });
  });

  // =========================================================================
  // 5. getFrequencyOptions
  // =========================================================================
  describe('getFrequencyOptions', () => {
    it('should GET /voice-schedule/frequencies', async () => {
      const frequencies: { frequencies: Record<AICallFrequency, FrequencyOption> } = {
        frequencies: {
          off: { label: 'Off', description: 'No AI calls', callsPerWeek: '0' },
          minimal: { label: 'Minimal', description: '1-2 calls', callsPerWeek: '1-2' },
          moderate: { label: 'Moderate', description: '3-4 calls', callsPerWeek: '3-4' },
          proactive: { label: 'Proactive', description: '5+ calls', callsPerWeek: '5+' },
        },
      };
      mockApi.get.mockResolvedValueOnce(ok(frequencies));

      const result = await voiceScheduleService.getFrequencyOptions();

      expect(mockApi.get).toHaveBeenCalledWith('/voice-schedule/frequencies');
      expect(result).toEqual(ok(frequencies));
    });
  });

  // =========================================================================
  // 6. canInitiateCall
  // =========================================================================
  describe('canInitiateCall', () => {
    it('should GET /voice-schedule/can-call', async () => {
      mockApi.get.mockResolvedValueOnce(ok({ allowed: true }));

      const result = await voiceScheduleService.canInitiateCall();

      expect(mockApi.get).toHaveBeenCalledWith('/voice-schedule/can-call');
      expect(result).toEqual(ok({ allowed: true }));
    });
  });
});

// ===========================================================================
// Helper Functions (pure, no API calls)
// ===========================================================================

describe('getDayName', () => {
  it('should return full day names for valid indices 0-6', () => {
    const expected = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let i = 0; i < 7; i++) {
      expect(getDayName(i)).toBe(expected[i]);
    }
  });

  it('should return empty string for negative index', () => {
    expect(getDayName(-1)).toBe('');
  });

  it('should return empty string for index out of range', () => {
    expect(getDayName(7)).toBe('');
    expect(getDayName(100)).toBe('');
  });
});

describe('getShortDayName', () => {
  it('should return short day names for valid indices 0-6', () => {
    const expected = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      expect(getShortDayName(i)).toBe(expected[i]);
    }
  });

  it('should return empty string for negative index', () => {
    expect(getShortDayName(-1)).toBe('');
  });

  it('should return empty string for index out of range', () => {
    expect(getShortDayName(7)).toBe('');
  });
});

describe('formatScheduleTime', () => {
  it('should format midnight (00:00) as 12:00 AM', () => {
    expect(formatScheduleTime('00:00')).toBe('12:00 AM');
  });

  it('should format morning time (09:30) as 9:30 AM', () => {
    expect(formatScheduleTime('09:30')).toBe('9:30 AM');
  });

  it('should format noon (12:00) as 12:00 PM', () => {
    expect(formatScheduleTime('12:00')).toBe('12:00 PM');
  });

  it('should format afternoon time (14:30) as 2:30 PM', () => {
    expect(formatScheduleTime('14:30')).toBe('2:30 PM');
  });

  it('should format late evening time (23:59) as 11:59 PM', () => {
    expect(formatScheduleTime('23:59')).toBe('11:59 PM');
  });

  it('should format 1 AM correctly (01:00)', () => {
    expect(formatScheduleTime('01:00')).toBe('1:00 AM');
  });
});

describe('getSpeechPaceLabel', () => {
  it('should return "Slow" for pace <= 0.7', () => {
    expect(getSpeechPaceLabel(0.5)).toBe('Slow');
    expect(getSpeechPaceLabel(0.7)).toBe('Slow');
  });

  it('should return "Slightly Slow" for pace > 0.7 and <= 0.9', () => {
    expect(getSpeechPaceLabel(0.71)).toBe('Slightly Slow');
    expect(getSpeechPaceLabel(0.8)).toBe('Slightly Slow');
    expect(getSpeechPaceLabel(0.9)).toBe('Slightly Slow');
  });

  it('should return "Normal" for pace > 0.9 and <= 1.1', () => {
    expect(getSpeechPaceLabel(0.91)).toBe('Normal');
    expect(getSpeechPaceLabel(1.0)).toBe('Normal');
    expect(getSpeechPaceLabel(1.1)).toBe('Normal');
  });

  it('should return "Slightly Fast" for pace > 1.1 and <= 1.3', () => {
    expect(getSpeechPaceLabel(1.11)).toBe('Slightly Fast');
    expect(getSpeechPaceLabel(1.2)).toBe('Slightly Fast');
    expect(getSpeechPaceLabel(1.3)).toBe('Slightly Fast');
  });

  it('should return "Fast" for pace > 1.3', () => {
    expect(getSpeechPaceLabel(1.31)).toBe('Fast');
    expect(getSpeechPaceLabel(2.0)).toBe('Fast');
  });
});
