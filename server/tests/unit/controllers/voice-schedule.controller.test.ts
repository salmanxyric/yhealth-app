/**
 * Voice Schedule Controller Unit Tests
 *
 * Tests all exported handlers on voiceScheduleController:
 *   getPreferences, updateVoiceSettings, updateScheduleSettings,
 *   getVoiceOptions, getFrequencyOptions, canInitiateCall.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockGetPreferences = jest.fn<any>();
const mockUpdateVoiceSettings = jest.fn<any>();
const mockUpdateScheduleSettings = jest.fn<any>();
const mockCanInitiateCall = jest.fn<any>();
const mockGetVoiceOptions = jest.fn<any>();
const mockGetFrequencyOptions = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/voice-schedule.service.js', () => ({
  voiceScheduleService: {
    getPreferences: mockGetPreferences,
    updateVoiceSettings: mockUpdateVoiceSettings,
    updateScheduleSettings: mockUpdateScheduleSettings,
    canInitiateCall: mockCanInitiateCall,
    getVoiceOptions: mockGetVoiceOptions,
    getFrequencyOptions: mockGetFrequencyOptions,
  },
}));

// ── Dynamic imports AFTER mocks ──
const { voiceScheduleController } = await import('../../../src/controllers/voice-schedule.controller.js');
const { createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// getPreferences
// ─────────────────────────────────────────────
describe('getPreferences', () => {
  it('returns preferences for authenticated user', async () => {
    const prefs = {
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
    mockGetPreferences.mockResolvedValueOnce(prefs);

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.getPreferences, req, res, next);

    expect(mockGetPreferences).toHaveBeenCalledWith('test-user-id');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(prefs);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.getPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('passes service error through to next', async () => {
    const serviceError = new Error('Database connection lost');
    mockGetPreferences.mockRejectedValueOnce(serviceError);

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.getPreferences, req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

// ─────────────────────────────────────────────
// updateVoiceSettings
// ─────────────────────────────────────────────
describe('updateVoiceSettings', () => {
  it('passes body fields to service and returns updated settings', async () => {
    const updated = { voiceId: 'nova', speechPace: 1.2, voicePreviewPlayed: true };
    mockUpdateVoiceSettings.mockResolvedValueOnce(updated);

    const req = createAuthReq({}, {
      body: { voiceId: 'nova', speechPace: 1.2, voicePreviewPlayed: true },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateVoiceSettings, req, res, next);

    expect(mockUpdateVoiceSettings).toHaveBeenCalledWith('test-user-id', {
      voiceId: 'nova',
      speechPace: 1.2,
      voicePreviewPlayed: true,
    });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(updated);
  });

  it('passes partial voice settings (only voiceId)', async () => {
    const updated = { voiceId: 'echo', speechPace: 1.0, voicePreviewPlayed: false };
    mockUpdateVoiceSettings.mockResolvedValueOnce(updated);

    const req = createAuthReq({}, {
      body: { voiceId: 'echo' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateVoiceSettings, req, res, next);

    expect(mockUpdateVoiceSettings).toHaveBeenCalledWith('test-user-id', {
      voiceId: 'echo',
      speechPace: undefined,
      voicePreviewPlayed: undefined,
    });
    expect(getStatus(res)).toBe(200);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, { body: { voiceId: 'alloy' } });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateVoiceSettings, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('passes service errors through to next', async () => {
    const serviceError = new Error('Invalid voice ID');
    mockUpdateVoiceSettings.mockRejectedValueOnce(serviceError);

    const req = createAuthReq({}, {
      body: { voiceId: 'invalid-voice' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateVoiceSettings, req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

// ─────────────────────────────────────────────
// updateScheduleSettings
// ─────────────────────────────────────────────
describe('updateScheduleSettings', () => {
  it('passes all schedule fields to service and returns updated settings', async () => {
    const input = {
      quietHoursEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '08:00',
      dndDays: [0, 6],
      aiCallFrequency: 'proactive',
      preferredCallTimes: ['10:00', '15:00'],
    };
    const updated = { ...input };
    mockUpdateScheduleSettings.mockResolvedValueOnce(updated);

    const req = createAuthReq({}, { body: input });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateScheduleSettings, req, res, next);

    expect(mockUpdateScheduleSettings).toHaveBeenCalledWith('test-user-id', {
      quietHoursEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '08:00',
      dndDays: [0, 6],
      aiCallFrequency: 'proactive',
      preferredCallTimes: ['10:00', '15:00'],
    });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(updated);
  });

  it('passes partial schedule settings', async () => {
    const updated = { quietHoursEnabled: false };
    mockUpdateScheduleSettings.mockResolvedValueOnce(updated);

    const req = createAuthReq({}, {
      body: { quietHoursEnabled: false },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateScheduleSettings, req, res, next);

    expect(mockUpdateScheduleSettings).toHaveBeenCalledWith('test-user-id', {
      quietHoursEnabled: false,
      quietHoursStart: undefined,
      quietHoursEnd: undefined,
      dndDays: undefined,
      aiCallFrequency: undefined,
      preferredCallTimes: undefined,
    });
    expect(getStatus(res)).toBe(200);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, { body: { quietHoursEnabled: true } });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateScheduleSettings, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('passes service errors through to next', async () => {
    const serviceError = new Error('Invalid schedule settings');
    mockUpdateScheduleSettings.mockRejectedValueOnce(serviceError);

    const req = createAuthReq({}, {
      body: { aiCallFrequency: 'invalid' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.updateScheduleSettings, req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

// ─────────────────────────────────────────────
// getVoiceOptions
// ─────────────────────────────────────────────
describe('getVoiceOptions', () => {
  it('returns voice options array wrapped in data.voices', async () => {
    const voiceOptions = [
      { id: 'alloy', name: 'Alloy', description: 'Balanced and versatile', gender: 'neutral', tone: 'Professional, clear' },
      { id: 'echo', name: 'Echo', description: 'Warm and engaging', gender: 'male', tone: 'Friendly, conversational' },
    ];
    mockGetVoiceOptions.mockReturnValue(voiceOptions);

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.getVoiceOptions, req, res, next);

    expect(mockGetVoiceOptions).toHaveBeenCalled();
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.voices).toEqual(voiceOptions);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.getVoiceOptions, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getFrequencyOptions
// ─────────────────────────────────────────────
describe('getFrequencyOptions', () => {
  it('returns frequency options wrapped in data.frequencies', async () => {
    const frequencyOptions = {
      off: { label: 'Off', description: 'AI will never initiate calls', callsPerWeek: '0' },
      minimal: { label: 'Minimal', description: 'AI initiates calls only for important check-ins', callsPerWeek: '1-2' },
    };
    mockGetFrequencyOptions.mockReturnValue(frequencyOptions);

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.getFrequencyOptions, req, res, next);

    expect(mockGetFrequencyOptions).toHaveBeenCalled();
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.frequencies).toEqual(frequencyOptions);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.getFrequencyOptions, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// canInitiateCall
// ─────────────────────────────────────────────
describe('canInitiateCall', () => {
  it('returns allowed=true when call is permitted', async () => {
    mockCanInitiateCall.mockResolvedValueOnce({ allowed: true });

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.canInitiateCall, req, res, next);

    expect(mockCanInitiateCall).toHaveBeenCalledWith('test-user-id');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.allowed).toBe(true);
  });

  it('returns allowed=false with reason when call is not permitted', async () => {
    mockCanInitiateCall.mockResolvedValueOnce({
      allowed: false,
      reason: 'AI-initiated calls are disabled',
    });

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.canInitiateCall, req, res, next);

    expect(mockCanInitiateCall).toHaveBeenCalledWith('test-user-id');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.allowed).toBe(false);
    expect(body.data.reason).toBe('AI-initiated calls are disabled');
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.canInitiateCall, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('passes service errors through to next', async () => {
    const serviceError = new Error('Preferences lookup failed');
    mockCanInitiateCall.mockRejectedValueOnce(serviceError);

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(voiceScheduleController.canInitiateCall, req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});
