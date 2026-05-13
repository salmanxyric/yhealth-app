import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/database.config.js', () => ({
  query: vi.fn(),
}));
vi.mock('../logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { communicationPreferencesService } from '../communication-preferences.service.js';
import { query } from '../../config/database.config.js';

const mockQuery = vi.mocked(query);

const baseRow = {
  user_id: 'u1',
  checkin_push_enabled: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
  workdays_only: false,
  max_checkins_per_day: 1,
  missed_followup_hours: 24,
  push_achievements: true,
  push_streaks: true,
  push_nudges: true,
  email_digest: true,
  email_urgent_only: false,
};

function mockRow(overrides: Record<string, unknown> = {}) {
  return {
    rows: [{ ...baseRow, ...overrides }],
    rowCount: 1, command: '', oid: 0, fields: [],
  } as any;
}

const emptyWrite = { rows: [], rowCount: 1, command: '', oid: 0, fields: [] } as any;

describe('CommunicationPreferencesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordMiss', () => {
    it('increments miss count for the given hour', async () => {
      // getForUser
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: { '9': 1 } }));
      // upsert -> getForUser (existing prefs)
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: { '9': 1 } }));
      // upsert INSERT/UPDATE
      mockQuery.mockResolvedValueOnce(emptyWrite);
      // upsert final getForUser
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: { '9': 2 } }));

      await communicationPreferencesService.recordMiss('u1', 9);

      const upsertCall = mockQuery.mock.calls[2];
      expect(upsertCall).toBeDefined();
      const args = upsertCall![1] as unknown[];
      const missJson = args[args.length - 1] as string;
      const parsed = JSON.parse(missJson);
      expect(parsed['9']).toBe(2);
    });

    it('initializes miss count for a new hour', async () => {
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: {} }));
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: {} }));
      mockQuery.mockResolvedValueOnce(emptyWrite);
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: { '21': 1 } }));

      await communicationPreferencesService.recordMiss('u1', 21);

      const upsertCall = mockQuery.mock.calls[2];
      expect(upsertCall).toBeDefined();
      const args = upsertCall![1] as unknown[];
      const missJson = args[args.length - 1] as string;
      const parsed = JSON.parse(missJson);
      expect(parsed['21']).toBe(1);
    });
  });

  describe('recordAnswer', () => {
    it('resets miss count for the given hour to zero', async () => {
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: { '9': 3 } }));
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: { '9': 3 } }));
      mockQuery.mockResolvedValueOnce(emptyWrite);
      mockQuery.mockResolvedValueOnce(mockRow({ checkin_miss_count_by_hour: { '9': 0 } }));

      await communicationPreferencesService.recordAnswer('u1', 9);

      const upsertCall = mockQuery.mock.calls[2];
      expect(upsertCall).toBeDefined();
      const args = upsertCall![1] as unknown[];
      const missJson = args[args.length - 1] as string;
      const parsed = JSON.parse(missJson);
      expect(parsed['9']).toBe(0);
    });
  });
});
