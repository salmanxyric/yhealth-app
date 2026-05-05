/**
 * Engagement Scoring Job Unit Tests
 *
 * Tests for processEngagementScores — weekly job that computes engagement
 * scores and updates computed motivation tiers for active users.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupRedisCacheMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();
setupRedisCacheMock();

const mockGetProfile = jest.fn<any>().mockResolvedValue({ userId: 'u1', tier: 'explorer' });
const mockComputeEngagementScore = jest.fn<any>().mockResolvedValue(72);
const mockUpdateComputedTier = jest.fn<any>().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../src/services/motivation-tier.service.js', () => ({
  motivationTierService: {
    getProfile: mockGetProfile,
    computeEngagementScore: mockComputeEngagementScore,
    updateComputedTier: mockUpdateComputedTier,
  },
}));

// Dynamic imports AFTER mocks
// The job exports { engagementScoringJob } with start/stop but processNow is
// the internal function. We need to access it — the job file does not export
// processNow directly, so we trigger it via the module-level function.
// Looking at the source: it only exports { start, stop } on engagementScoringJob.
// We need a way to invoke processEngagementScores. Since it's not exported,
// we'll test indirectly by importing the module and checking the mock calls.
// Actually the module-level function is not exported — let's re-read the source.
// The source exports: engagementScoringJob = { start, stop }
// start() uses setTimeout, so we need to use fake timers.

const engagementModule = await import('../../../src/jobs/engagement-scoring.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockGetProfile.mockResolvedValue({ userId: 'u1', tier: 'explorer' });
  mockComputeEngagementScore.mockResolvedValue(72);
  mockUpdateComputedTier.mockResolvedValue(undefined);
});

afterEach(() => {
  engagementModule.engagementScoringJob.stop();
  jest.useRealTimers();
});

describe('engagementScoringJob', () => {
  it('processes active users and computes engagement scores', async () => {
    jest.useFakeTimers();

    mockQuery.mockResolvedValueOnce(
      pgResult([{ id: 'u1' }, { id: 'u2' }]),
    );

    engagementModule.engagementScoringJob.start();

    // Advance past the startup delay (10 minutes)
    jest.advanceTimersByTime(10 * 60 * 1000);

    // Allow promises to resolve
    await jest.advanceTimersByTimeAsync(0);

    expect(mockQuery).toHaveBeenCalled();
    expect(mockGetProfile).toHaveBeenCalledWith('u1');
    expect(mockGetProfile).toHaveBeenCalledWith('u2');
    expect(mockComputeEngagementScore).toHaveBeenCalledTimes(2);
    expect(mockUpdateComputedTier).toHaveBeenCalledTimes(2);
  });

  it('does nothing when no active users found', async () => {
    jest.useFakeTimers();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    engagementModule.engagementScoringJob.start();
    jest.advanceTimersByTime(10 * 60 * 1000);
    await jest.advanceTimersByTimeAsync(0);

    expect(mockGetProfile).not.toHaveBeenCalled();
    expect(mockComputeEngagementScore).not.toHaveBeenCalled();
  });

  it('continues processing when one user fails', async () => {
    jest.useFakeTimers();

    mockQuery.mockResolvedValueOnce(
      pgResult([{ id: 'u1' }, { id: 'u2' }]),
    );
    // u1 fails
    mockGetProfile.mockRejectedValueOnce(new Error('Profile not found'));
    // u2 succeeds
    mockGetProfile.mockResolvedValueOnce({ userId: 'u2', tier: 'achiever' });

    engagementModule.engagementScoringJob.start();
    jest.advanceTimersByTime(10 * 60 * 1000);
    await jest.advanceTimersByTimeAsync(0);

    // u2 should still be processed
    expect(mockComputeEngagementScore).toHaveBeenCalledWith('u2');
  });

  it('handles DB failure gracefully', async () => {
    jest.useFakeTimers();

    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

    engagementModule.engagementScoringJob.start();
    jest.advanceTimersByTime(10 * 60 * 1000);
    await jest.advanceTimersByTimeAsync(0);

    // Should not throw, job completes with error logged
    expect(mockGetProfile).not.toHaveBeenCalled();
  });

  it('stop clears the interval after startup delay has passed', async () => {
    jest.useFakeTimers();

    mockQuery.mockResolvedValue(pgEmpty());

    engagementModule.engagementScoringJob.start();

    // Let the startup delay fire so intervalId is set
    jest.advanceTimersByTime(10 * 60 * 1000);
    await jest.advanceTimersByTimeAsync(0);

    // Now stop — this clears the interval
    engagementModule.engagementScoringJob.stop();

    // Reset mock to track new calls
    mockQuery.mockClear();

    // Advance past the weekly interval — no more processing should happen
    jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);
    await jest.advanceTimersByTimeAsync(0);

    expect(mockQuery).not.toHaveBeenCalled();
  });
});
