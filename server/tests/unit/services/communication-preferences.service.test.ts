/**
 * Push category gating from persisted preferences.
 */

import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

const mockQuery = jest.fn();
const USER_ID = '11111111-1111-1111-1111-111111111111';

let communicationPreferencesService: typeof import(
  '../../../src/services/communication-preferences.service.js'
)['communicationPreferencesService'];

beforeAll(async () => {
  await jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
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
  await jest.unstable_mockModule('../../../src/database/pg.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));
  await jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() },
  }));
  jest.resetModules();
  const mod = await import('../../../src/services/communication-preferences.service.js');
  communicationPreferencesService = mod.communicationPreferencesService;
});

describe('communicationPreferencesService.allowsPushCategory', () => {
  beforeEach(() => {
    mockQuery.mockClear();
  });

  it('returns false for achievements when push_achievements is false', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          user_id: USER_ID,
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: false,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });
    const ok = await communicationPreferencesService.allowsPushCategory(USER_ID, 'Achievement unlocked');
    expect(ok).toBe(false);
  });

  it('returns false for streak category when push_streaks is false', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          user_id: USER_ID,
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: false,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });
    const ok = await communicationPreferencesService.allowsPushCategory(USER_ID, 'streak_risk');
    expect(ok).toBe(false);
  });

  it('returns push_nudges for generic categories', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          user_id: USER_ID,
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: false,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });
    const ok = await communicationPreferencesService.allowsPushCategory(USER_ID, 'coaching_tip');
    expect(ok).toBe(false);
  });
});
