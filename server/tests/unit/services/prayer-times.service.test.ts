import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

const { mockQuery } = setupDbMock();
setupLoggerMock();

const { prayerTimesService } = await import('../../../src/services/prayer-times.service.js');

const aladhanResponse = {
  code: 200,
  status: 'OK',
  data: {
    timings: {
      Fajr: '03:43',
      Sunrise: '05:13',
      Dhuhr: '11:59',
      Asr: '15:38',
      Sunset: '18:46',
      Maghrib: '18:46',
      Isha: '20:16',
      Imsak: '03:33',
      Midnight: '23:59',
    },
    date: { readable: '06 May 2026', gregorian: { date: '06-05-2026' } },
    meta: { timezone: 'Asia/Karachi' },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn<any>().mockResolvedValue({
    ok: true,
    json: async () => aladhanResponse,
  });
  mockQuery.mockImplementation(async (_sql: string, params: unknown[]) => ({
    rows: [{
      id: `${params[2] || 'prayer'}-id`,
      user_id: params[0],
      prayer_date: params[1],
      prayer_name: params[2],
      scheduled_time: params[3],
      completed: false,
      completed_at: null,
      source: params[4] || 'api',
      created_at: new Date().toISOString(),
    }],
    rowCount: 1,
  }));
});

describe('PrayerTimesService', () => {
  it('uses Aladhan timingsByCity with Karachi method by default and advanced params', async () => {
    await prayerTimesService.syncPrayerTimes('user-1', {
      city: 'Lahore',
      country: 'PK',
      date: '2026-05-06',
      school: 1,
      offsets: { fajr: 2, isha: -3 },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.aladhan.com/v1/timingsByCity/06-05-2026?')
    );
    const url = String((global.fetch as jest.Mock).mock.calls[0]?.[0]);
    expect(url).toContain('city=Lahore');
    expect(url).toContain('country=PK');
    expect(url).toContain('method=1');
    expect(url).toContain('school=1');
    expect(url).toContain('tune=0%2C2%2C0%2C0%2C0%2C0%2C0%2C-3%2C0');
  });

  it('applies manual prayer overrides while keeping API-derived prayers', async () => {
    await prayerTimesService.syncPrayerTimes('user-1', {
      city: 'Lahore',
      country: 'PK',
      date: '06-05-2026',
      manualTimes: { fajr: '04:05', isha: '20:45' },
    });

    const inserts = mockQuery.mock.calls.map(call => call[1] as unknown[]);
    expect(inserts.find(params => params[2] === 'fajr')?.[3]).toBe('2026-05-06 04:05:00 Asia/Karachi');
    expect(inserts.find(params => params[2] === 'fajr')?.[4]).toBe('manual');
    expect(inserts.find(params => params[2] === 'dhuhr')?.[3]).toBe('2026-05-06 11:59:00 Asia/Karachi');
    expect(inserts.find(params => params[2] === 'dhuhr')?.[4]).toBe('api');
    expect(inserts.find(params => params[2] === 'isha')?.[3]).toBe('2026-05-06 20:45:00 Asia/Karachi');
  });

  it('rejects invalid manual prayer times', async () => {
    await expect(prayerTimesService.upsertManualPrayerTimes(
      'user-1',
      '2026-05-06',
      { fajr: '25:99' },
      'Asia/Karachi',
    )).rejects.toThrow('Invalid time for fajr');
  });
});
