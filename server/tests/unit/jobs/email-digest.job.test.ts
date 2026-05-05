/**
 * @file Email Digest Job Tests
 * Tests for weekly digest and re-engagement email processing.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

const mockEmailEngine = {
  send: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/email-engine.service.js', () => ({
  emailEngine: mockEmailEngine,
}));

const mockEmailContentGenerator = {
  generateWeeklyDigest: jest.fn<any>().mockResolvedValue({
    subject: 'Your Weekly Digest',
    highlights: ['Worked out 5 times'],
    coachMessage: 'Great job!',
    insights: ['Consistency improved'],
    nextWeekFocus: 'Keep it up',
  }),
  generateReEngagementContent: jest.fn<any>().mockResolvedValue({
    subject: 'We miss you!',
    message: 'Come back and check your progress',
    incentives: ['New features available'],
  }),
};
jest.unstable_mockModule('../../../src/services/email-content-generator.service.js', () => ({
  emailContentGenerator: mockEmailContentGenerator,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { startEmailDigestJob, stopEmailDigestJob } = await import(
  '../../../src/jobs/email-digest.job.js'
);
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockEmailEngine.send.mockResolvedValue(undefined);
  mockEmailContentGenerator.generateWeeklyDigest.mockResolvedValue({
    subject: 'Your Weekly Digest',
    highlights: ['Worked out 5 times'],
    coachMessage: 'Great job!',
    insights: ['Consistency improved'],
    nextWeekFocus: 'Keep it up',
  });
  mockEmailContentGenerator.generateReEngagementContent.mockResolvedValue({
    subject: 'We miss you!',
    message: 'Come back and check your progress',
    incentives: ['New features available'],
  });
});

describe('EmailDigestJob', () => {
  describe('startEmailDigestJob / stopEmailDigestJob', () => {
    afterEach(() => stopEmailDigestJob());

    it('should schedule the job without throwing', () => {
      expect(() => startEmailDigestJob()).not.toThrow();
    });

    it('should stop cleanly', () => {
      startEmailDigestJob();
      expect(() => stopEmailDigestJob()).not.toThrow();
    });
  });

  describe('weekly digest processing (via start trigger)', () => {
    // We test the internal logic by calling startEmailDigestJob which triggers
    // runDigestJob after a delay. Instead, we test by observing mock calls
    // after running the timer-driven flow. However, since processWeeklyDigests
    // and processReEngagement are not exported, we test indirectly through
    // the lifecycle + fast-forwarding timers.

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      stopEmailDigestJob();
      jest.useRealTimers();
    });

    it('should query for eligible digest users and send emails on Sunday', async () => {
      // Set date to Sunday
      jest.setSystemTime(new Date('2026-01-04T12:00:00Z')); // Sunday

      const users = [
        { user_id: 'u1', email: 'a@test.com', first_name: 'Alice' },
      ];

      // First call: weekly digest query, second call: re-engagement query
      mockQuery
        .mockResolvedValueOnce(pgResult(users))
        .mockResolvedValueOnce(pgEmpty());

      startEmailDigestJob();

      // Fast-forward past startup delay (default 60s)
      await jest.advanceTimersByTimeAsync(61_000);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockEmailContentGenerator.generateWeeklyDigest).toHaveBeenCalledWith('u1');
      expect(mockEmailEngine.send).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          template: 'digestSummary',
          recipient: 'a@test.com',
        }),
      );
    });

    it('should skip digest sending on non-Sunday', async () => {
      jest.setSystemTime(new Date('2026-01-05T12:00:00Z')); // Monday

      // Re-engagement query returns empty
      mockQuery.mockResolvedValue(pgEmpty());

      startEmailDigestJob();
      await jest.advanceTimersByTimeAsync(61_000);

      // Digest content generator should NOT have been called (skipped because not Sunday)
      expect(mockEmailContentGenerator.generateWeeklyDigest).not.toHaveBeenCalled();
    });

    it('should process re-engagement emails for inactive users', async () => {
      jest.setSystemTime(new Date('2026-01-05T12:00:00Z')); // Monday (digest skipped)

      const inactiveUsers = [
        { user_id: 'u2', email: 'b@test.com', first_name: 'Bob', days_away: 14 },
      ];

      // On non-Sunday, processWeeklyDigests returns 0 WITHOUT querying.
      // So the first (and only) query call is from processReEngagement.
      mockQuery.mockResolvedValueOnce(pgResult(inactiveUsers));

      startEmailDigestJob();
      await jest.advanceTimersByTimeAsync(61_000);

      expect(mockEmailContentGenerator.generateReEngagementContent).toHaveBeenCalledWith('u2', 14);
      expect(mockEmailEngine.send).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u2',
          template: 'reEngagement',
          recipient: 'b@test.com',
        }),
      );
    });

    it('should handle email send failures gracefully per user', async () => {
      jest.setSystemTime(new Date('2026-01-04T12:00:00Z')); // Sunday

      const users = [
        { user_id: 'u1', email: 'a@test.com', first_name: 'Alice' },
        { user_id: 'u2', email: 'b@test.com', first_name: 'Bob' },
      ];

      mockQuery
        .mockResolvedValueOnce(pgResult(users))
        .mockResolvedValueOnce(pgEmpty());

      // First user fails, second succeeds
      mockEmailEngine.send
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(undefined);

      startEmailDigestJob();
      await jest.advanceTimersByTimeAsync(61_000);

      // Both users should have been attempted
      expect(mockEmailContentGenerator.generateWeeklyDigest).toHaveBeenCalledTimes(2);
      expect(mockEmailEngine.send).toHaveBeenCalledTimes(2);
    });

    it('should do nothing when no users need digests or re-engagement', async () => {
      jest.setSystemTime(new Date('2026-01-04T12:00:00Z')); // Sunday

      mockQuery.mockResolvedValue(pgEmpty());

      startEmailDigestJob();
      await jest.advanceTimersByTimeAsync(61_000);

      expect(mockEmailEngine.send).not.toHaveBeenCalled();
    });
  });
});
