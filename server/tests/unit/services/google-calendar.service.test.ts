import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const mockFetch = jest.fn<any>();

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
});

const { googleCalendarService } = await import('../../../src/services/google-calendar.service.js');

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const USER_ID = 'user-uuid-1';
const FUTURE = new Date(Date.now() + 60_000);
const PAST = new Date(Date.now() - 60_000);

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Daily Stand Up',
    description: 'Team sync',
    date: '2026-05-06',
    startTime: '11:00',
    endTime: '11:30',
    timezone: 'Asia/Karachi',
    scheduleId: 'schedule-1',
    scheduleItemId: 'item-1',
    ...overrides,
  };
}

describe('GoogleCalendarService.createEventForScheduleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no active Google connection exists', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const result = await googleCalendarService.createEventForScheduleItem(USER_ID, createInput());

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('creates an event in the first selected calendar with timezone-aware start/end', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{
      id: 'conn-1',
      access_token: 'token-1',
      token_expires_at: FUTURE,
      calendar_ids: ['work-calendar'],
    }]));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'event-1', htmlLink: 'https://calendar.google.com/event' }),
    });

    const result = await googleCalendarService.createEventForScheduleItem(USER_ID, createInput());

    expect(result).toEqual({
      connectionId: 'conn-1',
      calendarId: 'work-calendar',
      eventId: 'event-1',
      htmlLink: 'https://calendar.google.com/event',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/calendar/v3/calendars/work-calendar/events',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
      }),
    );
    const payload = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(payload).toEqual(expect.objectContaining({
      summary: 'Daily Stand Up',
      description: 'Team sync',
      start: { dateTime: '2026-05-06T11:00:00', timeZone: 'Asia/Karachi' },
      end: { dateTime: '2026-05-06T11:30:00', timeZone: 'Asia/Karachi' },
      extendedProperties: {
        private: {
          balenciaScheduleId: 'schedule-1',
          balenciaScheduleItemId: 'item-1',
          source: 'balencia',
        },
      },
    }));
  });

  it('falls back to primary calendar when no selected calendars exist', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{
      id: 'conn-1',
      access_token: 'token-1',
      token_expires_at: FUTURE,
      calendar_ids: [],
    }]));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'event-1' }),
    });

    const result = await googleCalendarService.createEventForScheduleItem(USER_ID, createInput());

    expect(result?.calendarId).toBe('primary');
    expect(mockFetch.mock.calls[0][0]).toBe('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  });

  it('refreshes expired tokens before creating the event', async () => {
    mockQuery
      .mockResolvedValueOnce(pgResult([{
        id: 'conn-1',
        access_token: 'old-token',
        token_expires_at: PAST,
        calendar_ids: ['work-calendar'],
      }]))
      .mockResolvedValueOnce(pgResult([{
        client_id: 'client-id',
        client_secret: 'client-secret',
        refresh_token: 'refresh-token',
      }]))
      .mockResolvedValueOnce(pgResult([]))
      .mockResolvedValueOnce(pgResult([{ access_token: 'new-token' }]));

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'new-token', expires_in: 3600, token_type: 'Bearer' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'event-1' }),
      });

    await googleCalendarService.createEventForScheduleItem(USER_ID, createInput());

    expect(mockFetch.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe('Bearer new-token');
  });
});
