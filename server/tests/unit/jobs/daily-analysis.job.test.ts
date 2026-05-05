/**
 * @file Daily Analysis Job Tests
 * Tests for daily report generation, batching, and weekly report trigger.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

const mockDailyAnalysisService = {
  generateDailyReport: jest.fn<any>().mockResolvedValue({ id: 'report-1' }),
};
jest.unstable_mockModule('../../../src/services/daily-analysis.service.js', () => ({
  dailyAnalysisService: mockDailyAnalysisService,
}));

const mockUserCoachingProfileService = {
  getProfile: jest.fn<any>().mockResolvedValue(null),
  generateProfile: jest.fn<any>().mockResolvedValue({ id: 'profile-1' }),
};
jest.unstable_mockModule('../../../src/services/user-coaching-profile.service.js', () => ({
  userCoachingProfileService: mockUserCoachingProfileService,
}));

const mockPredictionAccuracyService = {
  trackPredictionAccuracy: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/prediction-accuracy.service.js', () => ({
  predictionAccuracyService: mockPredictionAccuracyService,
}));

const mockWeeklyReportService = {
  generateWeeklyReport: jest.fn<any>().mockResolvedValue({ id: 'weekly-1' }),
};
jest.unstable_mockModule('../../../src/services/weekly-report.service.js', () => ({
  weeklyReportService: mockWeeklyReportService,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { dailyAnalysisJob } = await import('../../../src/jobs/daily-analysis.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockDailyAnalysisService.generateDailyReport.mockResolvedValue({ id: 'report-1' });
  mockUserCoachingProfileService.getProfile.mockResolvedValue(null);
  mockUserCoachingProfileService.generateProfile.mockResolvedValue({ id: 'profile-1' });
  mockPredictionAccuracyService.trackPredictionAccuracy.mockResolvedValue(undefined);
  mockWeeklyReportService.generateWeeklyReport.mockResolvedValue({ id: 'weekly-1' });
});

describe('DailyAnalysisJob', () => {
  describe('processNow', () => {
    it('should generate reports for users with scores but no analysis', async () => {
      const users = [
        { id: 'u1', score_date: '2026-04-23' },
        { id: 'u2', score_date: '2026-04-23' },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(users));

      await dailyAnalysisJob.processNow();

      expect(mockDailyAnalysisService.generateDailyReport).toHaveBeenCalledTimes(2);
      expect(mockDailyAnalysisService.generateDailyReport).toHaveBeenCalledWith('u1', '2026-04-23');
      expect(mockDailyAnalysisService.generateDailyReport).toHaveBeenCalledWith('u2', '2026-04-23');
    });

    it('should do nothing when no users need reports', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await dailyAnalysisJob.processNow();

      expect(mockDailyAnalysisService.generateDailyReport).not.toHaveBeenCalled();
    });

    it('should generate coaching profile when none exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'u1', score_date: '2026-04-23' }]));
      mockUserCoachingProfileService.getProfile.mockResolvedValueOnce(null);

      await dailyAnalysisJob.processNow();

      expect(mockUserCoachingProfileService.generateProfile).toHaveBeenCalledWith('u1');
    });

    it('should skip profile generation when profile already exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'u1', score_date: '2026-04-23' }]));
      mockUserCoachingProfileService.getProfile.mockResolvedValueOnce({ id: 'existing' });

      await dailyAnalysisJob.processNow();

      expect(mockUserCoachingProfileService.generateProfile).not.toHaveBeenCalled();
    });

    it('should track prediction accuracy after report generation', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'u1', score_date: '2026-04-23' }]));

      await dailyAnalysisJob.processNow();

      expect(mockPredictionAccuracyService.trackPredictionAccuracy).toHaveBeenCalledWith(
        'u1',
        '2026-04-23',
      );
    });

    it('should continue processing other users when one fails', async () => {
      const users = [
        { id: 'u1', score_date: '2026-04-23' },
        { id: 'u2', score_date: '2026-04-23' },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(users));

      mockDailyAnalysisService.generateDailyReport
        .mockRejectedValueOnce(new Error('LLM timeout'))
        .mockResolvedValueOnce({ id: 'report-2' });

      await dailyAnalysisJob.processNow();

      // Both should be attempted
      expect(mockDailyAnalysisService.generateDailyReport).toHaveBeenCalledTimes(2);
    });

    it('should handle fatal query error gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      // Should not throw
      await expect(dailyAnalysisJob.processNow()).resolves.toBeUndefined();
    });
  });

  describe('lifecycle', () => {
    afterEach(() => dailyAnalysisJob.stop());

    it('should report isRunning correctly', () => {
      expect(dailyAnalysisJob.isRunning()).toBe(false);
      dailyAnalysisJob.start();
      // After start, the timeout hasn't fired yet but isRunning checks intervalId
      // which is set after the timeout fires; at this point isRunning should still be false
      // because interval hasn't been set up yet (deferred by STARTUP_DELAY_MS)
    });
  });
});
