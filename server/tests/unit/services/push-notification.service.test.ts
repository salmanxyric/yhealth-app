/**
 * Push delivery skips when FCM is not configured or user opted out of category.
 */

import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

const mockQuery = jest.fn();
const mockAllowsPushCategory = jest.fn();
const USER_A = '22222222-2222-2222-2222-222222222222';
const USER_B = '33333333-3333-3333-3333-333333333333';

let pushNotificationService: typeof import(
  '../../../src/services/push-notification.service.js'
)['pushNotificationService'];

beforeAll(async () => {
  await jest.unstable_mockModule('../../../src/database/pg.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));
  await jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { warn: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() },
  }));
  await jest.unstable_mockModule('../../../src/services/communication-preferences.service.js', () => ({
    communicationPreferencesService: {
      allowsPushCategory: (...args: unknown[]) => mockAllowsPushCategory(...args),
    },
  }));
  jest.resetModules();
  const mod = await import('../../../src/services/push-notification.service.js');
  pushNotificationService = mod.pushNotificationService;
});

describe('pushNotificationService.deliverForUser', () => {
  beforeEach(() => {
    mockQuery.mockClear();
    mockAllowsPushCategory.mockClear();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });

  it('does not query tokens when category is blocked by preferences', async () => {
    mockAllowsPushCategory.mockResolvedValue(false);
    await pushNotificationService.deliverForUser(USER_A, {
      title: 'Hi',
      body: 'There',
      category: 'streak',
    });
    expect(mockAllowsPushCategory).toHaveBeenCalledWith(USER_A, 'streak');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns before token query when FCM is not configured', async () => {
    mockAllowsPushCategory.mockResolvedValue(true);
    await pushNotificationService.deliverForUser(USER_B, {
      title: 'Hi',
      body: 'There',
      category: 'nudge',
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
