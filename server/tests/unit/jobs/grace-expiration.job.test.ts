/**
 * Grace Expiration Job Unit Tests
 *
 * Tests for runGraceExpirationJob — flips subscriptions from 'grace' to
 * 'canceled' when grace_period_ends_at has passed, and invalidates
 * entitlements for affected users.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery } = setupDbMock();
const mockLogger = setupLoggerMock();

// Mock entitlement service
const mockInvalidateEntitlements = jest.fn<any>().mockResolvedValue(undefined);
jest.unstable_mockModule('../../../src/services/entitlement.service.js', () => ({
  invalidateEntitlements: mockInvalidateEntitlements,
}));

// Dynamic import AFTER mocks
const { runGraceExpirationJob } = await import('../../../src/jobs/graceExpirationJob.js');

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('runGraceExpirationJob', () => {
  it('returns { expired: 0 } when no grace subscriptions have expired', async () => {
    // The UPDATE ... RETURNING query returns no rows
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await runGraceExpirationJob();

    expect(result).toEqual({ expired: 0 });

    // No entitlements should be invalidated
    expect(mockInvalidateEntitlements).not.toHaveBeenCalled();

    // No info log when count is 0
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('cancels expired grace subscriptions and returns count', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { user_id: 'user-001' },
        { user_id: 'user-002' },
      ],
    });

    const result = await runGraceExpirationJob();

    expect(result).toEqual({ expired: 2 });

    // Verify the UPDATE query targets grace subscriptions with expired deadline
    const updateCall = mockQuery.mock.calls[0];
    expect(updateCall[0]).toContain("'canceled'");
    expect(updateCall[0]).toContain("status = 'grace'");
    expect(updateCall[0]).toContain('grace_period_ends_at');
  });

  it('invalidates entitlements for each affected user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { user_id: 'user-A' },
        { user_id: 'user-B' },
        { user_id: 'user-C' },
      ],
    });

    await runGraceExpirationJob();

    expect(mockInvalidateEntitlements).toHaveBeenCalledTimes(3);
    expect(mockInvalidateEntitlements).toHaveBeenCalledWith('user-A');
    expect(mockInvalidateEntitlements).toHaveBeenCalledWith('user-B');
    expect(mockInvalidateEntitlements).toHaveBeenCalledWith('user-C');
  });

  it('deduplicates user IDs when same user has multiple grace subscriptions', async () => {
    // Same user_id appears multiple times in RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [
        { user_id: 'user-dup' },
        { user_id: 'user-dup' },
        { user_id: 'user-other' },
      ],
    });

    const result = await runGraceExpirationJob();

    // The job uses Set to deduplicate
    expect(result).toEqual({ expired: 2 });

    // Should only invalidate once per unique user
    expect(mockInvalidateEntitlements).toHaveBeenCalledTimes(2);
    expect(mockInvalidateEntitlements).toHaveBeenCalledWith('user-dup');
    expect(mockInvalidateEntitlements).toHaveBeenCalledWith('user-other');
  });

  it('logs info with count when subscriptions are expired', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-001' }],
    });

    await runGraceExpirationJob();

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Grace periods expired'),
      expect.objectContaining({ count: 1 })
    );
  });

  it('does not log when no subscriptions are expired', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await runGraceExpirationJob();

    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('sets canceled_at via COALESCE to preserve existing value', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-001' }],
    });

    await runGraceExpirationJob();

    const updateCall = mockQuery.mock.calls[0];
    expect(updateCall[0]).toContain('COALESCE(canceled_at');
  });

  describe('single subscription expiration', () => {
    it('handles exactly one expired grace subscription', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ user_id: 'user-solo' }],
      });

      const result = await runGraceExpirationJob();

      expect(result).toEqual({ expired: 1 });
      expect(mockInvalidateEntitlements).toHaveBeenCalledTimes(1);
      expect(mockInvalidateEntitlements).toHaveBeenCalledWith('user-solo');
    });
  });

  describe('large batch', () => {
    it('processes many expired subscriptions', async () => {
      const users = Array.from({ length: 50 }, (_, i) => ({
        user_id: `user-${String(i).padStart(3, '0')}`,
      }));

      mockQuery.mockResolvedValueOnce({ rows: users });

      const result = await runGraceExpirationJob();

      expect(result).toEqual({ expired: 50 });
      expect(mockInvalidateEntitlements).toHaveBeenCalledTimes(50);
    });
  });
});
