/**
 * Preferences Controller Unit Tests
 * Tests: getPreferences, updateNotificationPreferences, getCoachingStyles,
 *        updateCoachingPreferences, updateDisplayPreferences, updatePrivacyPreferences,
 *        updateIntegrationPreferences, completePreferencesStep, resetPreferences,
 *        updateTourStatus.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupQueueMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();
setupQueueMock();

// ── Service mocks ──
const mockNotificationService = {
  preferencesUpdated: jest.fn<any>().mockResolvedValue(undefined),
};

const mockEmbeddingQueueService = {
  enqueueEmbedding: jest.fn<any>().mockResolvedValue(undefined),
};

jest.unstable_mockModule('../../../src/services/notification.service.js', () => ({
  notificationService: mockNotificationService,
}));

jest.unstable_mockModule('../../../src/services/embedding-queue.service.js', () => ({
  embeddingQueueService: mockEmbeddingQueueService,
}));

// Mock the shared coach-persona module
// Controller at src/controllers/ imports ../../../shared/... (resolves to yhealth-app/shared/)
// From test at tests/unit/controllers/, we need ../../../../shared/...
jest.unstable_mockModule('@shared/types/domain/coach-persona.js', () => ({
  coachingStyleForPersona: jest.fn<any>().mockReturnValue('direct'),
  personaFromCoachingStyle: jest.fn<any>().mockReturnValue('commander'),
  normalizePersonaId: jest.fn<any>().mockImplementation((v: string) => v || 'friend'),
}));

// ── Dynamic imports AFTER mocks ──
const {
  getPreferences,
  updateNotificationPreferences,
  getCoachingStyles,
  updateCoachingPreferences,
  updateDisplayPreferences,
  updatePrivacyPreferences,
  updateIntegrationPreferences,
  completePreferencesStep,
  resetPreferences,
  updateTourStatus,
} = await import('../../../src/controllers/preferences.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set default implementations cleared by clearAllMocks
  mockNotificationService.preferencesUpdated.mockResolvedValue(undefined);
  mockEmbeddingQueueService.enqueueEmbedding.mockResolvedValue(undefined);
});

// ── Helpers ──

function qr<T>(rows: T[]) {
  return { rows, rowCount: rows.length };
}

const EMPTY = qr([]);

/** A minimal UserPreferencesRow matching the DB shape */
function makePrefsRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pref-1',
    user_id: 'test-user-id',
    notification_channels: { push: true, email: false },
    notification_types: { reminders: true, achievements: true },
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    timezone: 'UTC',
    max_notifications_day: 10,
    max_notifications_week: 50,
    coaching_style: 'supportive',
    ai_coach_persona: 'gentle_friend',
    coaching_intensity: 'moderate',
    preferred_channel: 'push',
    check_in_frequency: 'daily',
    preferred_check_in_time: '09:00',
    ai_use_emojis: true,
    ai_formality_level: 'casual',
    ai_encouragement_level: 'high',
    focus_areas: ['fitness', 'nutrition'],
    weight_unit: 'kg',
    height_unit: 'cm',
    distance_unit: 'km',
    temperature_unit: 'celsius',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    language: 'en',
    theme: 'system',
    share_progress_with_coach: true,
    allow_anonymous_data_research: false,
    show_in_leaderboards: true,
    profile_visibility: 'friends',
    health_profile_visibility: 'friends',
    health_profile_allowed_users: [],
    auto_sync_enabled: true,
    sync_on_wifi_only: false,
    background_sync_enabled: true,
    data_retention_days: 365,
    voice_assistant_avatar_url: null,
    voice_assistant_name: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-04-01'),
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// getPreferences
// ─────────────────────────────────────────────
describe('getPreferences', () => {
  it('returns 200 with existing preferences', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()]));

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.preferences).toHaveProperty('notifications');
    expect(body.data.preferences).toHaveProperty('coaching');
    expect(body.data.preferences).toHaveProperty('display');
    expect(body.data.preferences).toHaveProperty('privacy');
    expect(body.data.preferences).toHaveProperty('integrations');
  });

  it('creates default preferences when none exist', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // no prefs
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()])); // INSERT returning

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    // Verify INSERT was called
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const insertCall = mockQuery.mock.calls[1][0] as string;
    expect(insertCall).toContain('INSERT INTO user_preferences');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getCoachingStyles
// ─────────────────────────────────────────────
describe('getCoachingStyles', () => {
  it('returns 200 with styles, intensities, personas, channels, and frequencies', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getCoachingStyles, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.styles.length).toBe(4);
    expect(data.intensities.length).toBe(3);
    expect(data.personas.length).toBe(4);
    expect(data.channels.length).toBe(4);
    expect(data.checkInFrequencies.length).toBe(3);
  });

  it('includes expected style ids', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getCoachingStyles, req, res, next);

    const ids = getJsonBody(res).data.styles.map((s: any) => s.id);
    expect(ids).toContain('supportive');
    expect(ids).toContain('direct');
    expect(ids).toContain('analytical');
    expect(ids).toContain('motivational');
  });
});

// ─────────────────────────────────────────────
// updateNotificationPreferences
// ─────────────────────────────────────────────
describe('updateNotificationPreferences', () => {
  it('updates channels and returns 200', async () => {
    const existingPrefs = makePrefsRow();
    mockQuery.mockResolvedValueOnce(qr([existingPrefs])); // SELECT
    const updatedPrefs = makePrefsRow({ notification_channels: { push: true, email: true } });
    mockQuery.mockResolvedValueOnce(qr([updatedPrefs])); // UPDATE

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { channels: { email: true } },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateNotificationPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toHaveProperty('notifications');
    expect(mockEmbeddingQueueService.enqueueEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: 'user_preferences', operation: 'update' })
    );
  });

  it('updates quiet hours settings', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()]));
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow({ quiet_hours_enabled: true, quiet_hours_start: '23:00' })]));

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { quietHours: { enabled: true, start: '23:00' } },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateNotificationPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
  });

  it('creates default preferences when none exist before update', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // no prefs
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()])); // INSERT
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()])); // UPDATE

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { channels: { push: true } },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateNotificationPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(updateNotificationPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// updateCoachingPreferences
// ─────────────────────────────────────────────
describe('updateCoachingPreferences', () => {
  it('updates coaching style and notifies', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()])); // SELECT
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow({ coaching_style: 'direct' })])); // UPDATE

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { style: 'direct', intensity: 'intensive' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateCoachingPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toHaveProperty('coaching');
    expect(mockNotificationService.preferencesUpdated).toHaveBeenCalledWith(
      'u-1',
      expect.arrayContaining(['coachingStyle', 'coachingIntensity'])
    );
  });

  it('updates aiCoachPersona and maps to coaching style', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()]));
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow({ ai_coach_persona: 'drill_sergeant' })]));

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { aiCoachPersona: 'drill_sergeant' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateCoachingPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(mockNotificationService.preferencesUpdated).toHaveBeenCalledWith(
      'u-1',
      expect.arrayContaining(['aiCoachPersona'])
    );
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(updateCoachingPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// updateDisplayPreferences
// ─────────────────────────────────────────────
describe('updateDisplayPreferences', () => {
  it('updates units and theme and returns display section', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()]));
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow({ weight_unit: 'lbs', theme: 'dark' })]));

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { units: { weight: 'lbs' }, theme: 'dark' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateDisplayPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toHaveProperty('display');
    expect(mockEmbeddingQueueService.enqueueEmbedding).toHaveBeenCalled();
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(updateDisplayPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// updatePrivacyPreferences
// ─────────────────────────────────────────────
describe('updatePrivacyPreferences', () => {
  it('updates privacy booleans and returns privacy section', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()]));
    mockQuery.mockResolvedValueOnce(
      qr([makePrefsRow({ show_in_leaderboards: false, profile_visibility: 'private' })])
    );

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { showInLeaderboards: false, profileVisibility: 'private' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updatePrivacyPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toHaveProperty('privacy');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(updatePrivacyPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// updateIntegrationPreferences
// ─────────────────────────────────────────────
describe('updateIntegrationPreferences', () => {
  it('updates sync settings and returns integrations section', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()]));
    mockQuery.mockResolvedValueOnce(
      qr([makePrefsRow({ auto_sync_enabled: false, data_retention_days: 180 })])
    );

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { autoSyncEnabled: false, dataRetentionDays: 180 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateIntegrationPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toHaveProperty('integrations');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(updateIntegrationPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// completePreferencesStep
// ─────────────────────────────────────────────
describe('completePreferencesStep', () => {
  it('marks preferences step complete and sets onboarding to plan_pending', async () => {
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()])); // SELECT prefs
    mockQuery.mockResolvedValueOnce(qr([])); // UPDATE users onboarding_status

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(completePreferencesStep, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.nextStep).toBe('plan_generation');
    expect(data).toHaveProperty('preferences');
    // Verify the onboarding status update query
    const updateCall = mockQuery.mock.calls[1];
    expect((updateCall[0] as string)).toContain('onboarding_status');
    expect(updateCall[1]).toContain('plan_pending');
  });

  it('creates preferences if none exist then completes step', async () => {
    mockQuery.mockResolvedValueOnce(EMPTY); // no prefs
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()])); // INSERT prefs
    mockQuery.mockResolvedValueOnce(qr([])); // UPDATE users

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(completePreferencesStep, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.nextStep).toBe('plan_generation');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(completePreferencesStep, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// resetPreferences
// ─────────────────────────────────────────────
describe('resetPreferences', () => {
  it('deletes existing and creates new default preferences', async () => {
    mockQuery.mockResolvedValueOnce(qr([])); // DELETE
    mockQuery.mockResolvedValueOnce(qr([makePrefsRow()])); // INSERT

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(resetPreferences, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).message).toContain('reset');
    expect(getJsonBody(res).data).toHaveProperty('preferences');
    // Verify DELETE was called first
    expect((mockQuery.mock.calls[0][0] as string)).toContain('DELETE FROM user_preferences');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(resetPreferences, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// updateTourStatus
// ─────────────────────────────────────────────
describe('updateTourStatus', () => {
  it('updates tour status to completed and returns 200', async () => {
    mockQuery.mockResolvedValueOnce(qr([])); // UPDATE

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { completed: true },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateTourStatus, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.product_tour_completed).toBe(true);
  });

  it('updates tour status to incomplete', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { completed: false },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateTourStatus, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.product_tour_completed).toBe(false);
  });

  it('calls next with 400 when completed is not a boolean', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      body: { completed: 'yes' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateTourStatus, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(updateTourStatus, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
