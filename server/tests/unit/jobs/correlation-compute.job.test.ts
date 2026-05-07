/**
 * Correlation Compute Job Unit Tests
 *
 * Guards the scheduler query that selects users for daily correlation refreshes.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

const { mockQuery } = setupDbMock();
setupLoggerMock();

const mockComputeDailyCorrelation = jest.fn<any>().mockResolvedValue({});

jest.unstable_mockModule('../../../src/services/cross-domain-correlator.service.js', () => ({
  crossDomainCorrelatorService: {
    computeDailyCorrelation: mockComputeDailyCorrelation,
  },
}));

const { correlationComputeJob } = await import('../../../src/jobs/correlation-compute.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockResolvedValue(pgEmpty());
  mockComputeDailyCorrelation.mockResolvedValue({});
});

describe('correlationComputeJob.processNow', () => {
  it('uses user_daily_correlations for the recent-computation cooldown check', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'user-1' }]));

    await correlationComputeJob.processNow();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('FROM user_daily_correlations dc'),
      [expect.any(String), 50],
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.not.stringContaining('FROM daily_correlations dc'),
      expect.any(Array),
    );
    expect(mockComputeDailyCorrelation).toHaveBeenCalledWith('user-1', expect.any(String));
  });

  it('does nothing when no users need correlation computation', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await correlationComputeJob.processNow();

    expect(mockComputeDailyCorrelation).not.toHaveBeenCalled();
  });
});
