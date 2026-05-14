import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const USER_ID = '11111111-1111-1111-1111-111111111111';

let whoopService: typeof import('../../../src/services/whoop.service.js');

function response(body: unknown, init: Partial<Response> = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    headers: init.headers ?? new Headers(),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

beforeAll(async () => {
  Object.defineProperty(globalThis, 'fetch', {
    value: mockFetch,
    writable: true,
  });

  await jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));
  await jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: mockLogger,
  }));
  await jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
    env: {
      client: {
        url: 'https://app.example.test',
      },
    },
  }));

  jest.resetModules();
  whoopService = await import('../../../src/services/whoop.service.js');
});

beforeEach(() => {
  mockQuery.mockReset();
  mockFetch.mockReset();
  Object.values(mockLogger).forEach((fn) => fn.mockReset());
  process.env.WHOOP_CLIENT_ID = 'env-client-id';
  process.env.WHOOP_CLIENT_SECRET = 'env-client-secret';
});

describe('getWhoopAccessToken', () => {
  it('refreshes tokens when token_expiry is null after the refresh lock recheck', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          access_token: 'old-access',
          refresh_token: 'old-refresh',
          token_expiry: null,
          status: 'active',
          last_sync_error: null,
          client_id: null,
          client_secret: null,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ status: 'active', last_sync_error: null }],
      })
      .mockResolvedValueOnce({
        rows: [{
          access_token: 'old-access',
          refresh_token: 'old-refresh',
          token_expiry: null,
          status: 'active',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ client_id: null, client_secret: null }],
      })
      .mockResolvedValueOnce({ rows: [] });

    mockFetch.mockResolvedValueOnce(response({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      expires_in: 3600,
      token_type: 'Bearer',
    }));

    await expect(whoopService.getWhoopAccessToken(USER_ID)).resolves.toBe('new-access');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, requestInit] = mockFetch.mock.calls[0];
    expect(requestInit?.method).toBe('POST');
    expect(String(requestInit?.body)).toContain('refresh_token=old-refresh');
    expect(mockQuery).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE user_integrations'),
      expect.arrayContaining(['new-access', 'new-refresh', expect.any(Date), USER_ID])
    );
  });

  it('returns the existing token when token_expiry is safely in the future', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        access_token: 'current-access',
        refresh_token: 'current-refresh',
        token_expiry: new Date(Date.now() + 60 * 60 * 1000),
        status: 'active',
        last_sync_error: null,
        client_id: null,
        client_secret: null,
      }],
    });

    await expect(whoopService.getWhoopAccessToken(USER_ID)).resolves.toBe('current-access');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

describe('refreshWhoopToken', () => {
  it('adds WHOOP request context and fetch cause details to network errors', async () => {
    const fetchError = new Error('fetch failed') as Error & { cause?: unknown };
    fetchError.cause = {
      code: 'UND_ERR_CONNECT_TIMEOUT',
      message: 'Connect Timeout Error',
    };
    mockFetch.mockRejectedValueOnce(fetchError);

    await expect(
      whoopService.refreshWhoopToken(
        'refresh-token',
        'client-id',
        'client-secret',
        USER_ID,
        'https://app.example.test/auth/whoop/callback'
      )
    ).rejects.toThrow(
      'WHOOP token refresh request failed: fetch failed (UND_ERR_CONNECT_TIMEOUT: Connect Timeout Error)'
    );
  });
});
