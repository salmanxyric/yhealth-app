/**
 * @file Schedule Automation Job Tests
 * Tests for schedule-based AI chat message processing.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

setupDbMock();
setupLoggerMock();
setupCacheMock();

const mockScheduleAutomationService = {
  processScheduleAutomation: jest.fn<any>().mockResolvedValue(0),
};
jest.unstable_mockModule('../../../src/services/schedule-automation.service.js', () => ({
  scheduleAutomationService: mockScheduleAutomationService,
}));

// ── Dynamic imports ─────────────────────────────────────────

const {
  scheduleAutomationJob,
  processNow,
  getMetrics,
} = await import('../../../src/jobs/schedule-automation.job.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockScheduleAutomationService.processScheduleAutomation.mockResolvedValue(0);
});

describe('ScheduleAutomationJob', () => {
  describe('processNow', () => {
    it('should delegate to scheduleAutomationService and return count', async () => {
      mockScheduleAutomationService.processScheduleAutomation.mockResolvedValueOnce(5);

      const result = await processNow();

      expect(result).toBe(5);
      expect(mockScheduleAutomationService.processScheduleAutomation).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no messages to process', async () => {
      mockScheduleAutomationService.processScheduleAutomation.mockResolvedValueOnce(0);

      const result = await processNow();

      expect(result).toBe(0);
    });

    it('should propagate errors from the service', async () => {
      mockScheduleAutomationService.processScheduleAutomation.mockRejectedValueOnce(
        new Error('Service unavailable'),
      );

      await expect(processNow()).rejects.toThrow('Service unavailable');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics object with expected shape', () => {
      const metrics = getMetrics();

      expect(metrics).toHaveProperty('totalProcessed');
      expect(metrics).toHaveProperty('totalErrors');
      expect(metrics).toHaveProperty('lastRunTime');
      expect(metrics).toHaveProperty('averageProcessingTime');
    });
  });

  describe('lifecycle', () => {
    afterEach(() => scheduleAutomationJob.stop());

    it('should start and stop without throwing', () => {
      expect(() => scheduleAutomationJob.start()).not.toThrow();
      expect(() => scheduleAutomationJob.stop()).not.toThrow();
    });

    it('should report isRunning state correctly', () => {
      expect(scheduleAutomationJob.isRunning()).toBe(false);
      scheduleAutomationJob.start();
      expect(scheduleAutomationJob.isRunning()).toBe(true);
      scheduleAutomationJob.stop();
      expect(scheduleAutomationJob.isRunning()).toBe(false);
    });

    it('should warn when starting while already running', () => {
      scheduleAutomationJob.start();
      // Starting again should not throw
      expect(() => scheduleAutomationJob.start()).not.toThrow();
    });
  });
});
