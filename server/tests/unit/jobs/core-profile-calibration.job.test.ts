/**
 * @file Core Profile Calibration Job Tests
 * Tests for weekly baseline recalibration: resting HR, sleep hours, HRV,
 * workout frequency, and daily calories from 30-day data windows.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
const mockLogger = setupLoggerMock();

const mockCoreProfileKernelService = {
  calibrate: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/core-profile-kernel.service.js', () => ({
  coreProfileKernelService: mockCoreProfileKernelService,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { coreProfileCalibrationJob } = await import('../../../src/jobs/core-profile-calibration.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Helpers ─────────────────────────────────────────────────

/** Sets up mockQuery sequence: user list, then 5 calibration rule results per user */
function setupCalibrationSequence(
  users: Array<{ user_id: string }>,
  ruleResultsPerUser: Array<Array<{ value: number | null; n: number }>>,
) {
  // Query 1: user list
  mockQuery.mockResolvedValueOnce(pgResult(users));
  // For each user, 5 rule queries
  for (const ruleResults of ruleResultsPerUser) {
    for (const result of ruleResults) {
      mockQuery.mockResolvedValueOnce(pgResult([result]));
    }
  }
}

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockCoreProfileKernelService.calibrate.mockResolvedValue(undefined);
});

describe('CoreProfileCalibrationJob', () => {
  describe('processNow', () => {
    it('should calibrate all 5 metrics for a user with sufficient data', async () => {
      setupCalibrationSequence(
        [{ user_id: 'u1' }],
        [[
          { value: 58.333, n: 25 },  // resting_hr
          { value: 7.21, n: 28 },     // avg_sleep_hours
          { value: 45.678, n: 22 },   // avg_hrv
          { value: 4.5, n: 18 },      // weekly_workout_days
          { value: 2150.44, n: 26 },  // daily_calories
        ]],
      );

      await coreProfileCalibrationJob.processNow();

      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledTimes(5);
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'resting_hr', 58.3, 'system', 25, 'bpm');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'avg_sleep_hours', 7.2, 'system', 28, 'hours');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'avg_hrv', 45.7, 'system', 22, 'ms');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'targets', 'weekly_workout_days', 4.5, 'system', 18, 'days/week');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'targets', 'daily_calories', 2150.4, 'system', 26, 'kcal');
    });

    it('should skip metrics with NaN values', async () => {
      setupCalibrationSequence(
        [{ user_id: 'u1' }],
        [[
          { value: null as any, n: 0 },   // resting_hr — NaN from null AVG
          { value: 7.2, n: 28 },           // avg_sleep_hours — valid
          { value: null as any, n: 0 },   // avg_hrv — NaN
          { value: null as any, n: 0 },   // weekly_workout_days — NaN
          { value: 2100, n: 20 },          // daily_calories — valid
        ]],
      );

      await coreProfileCalibrationJob.processNow();

      // Only 2 valid metrics should be calibrated
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledTimes(2);
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'avg_sleep_hours', 7.2, 'system', 28, 'hours');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'targets', 'daily_calories', 2100, 'system', 20, 'kcal');
    });

    it('should skip metrics with fewer than 3 data points', async () => {
      setupCalibrationSequence(
        [{ user_id: 'u1' }],
        [[
          { value: 60, n: 2 },    // resting_hr — n < 3, skip
          { value: 7.5, n: 1 },   // avg_sleep_hours — n < 3, skip
          { value: 50, n: 3 },    // avg_hrv — exactly 3, include
          { value: 3, n: 0 },     // weekly_workout_days — n < 3, skip
          { value: 2000, n: 30 }, // daily_calories — valid
        ]],
      );

      await coreProfileCalibrationJob.processNow();

      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledTimes(2);
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'avg_hrv', 50, 'system', 3, 'ms');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'targets', 'daily_calories', 2000, 'system', 30, 'kcal');
    });

    it('should round values to 1 decimal place', async () => {
      setupCalibrationSequence(
        [{ user_id: 'u1' }],
        [[
          { value: 58.349, n: 10 },   // 58.3 (round down)
          { value: 7.251, n: 10 },    // 7.3 (round up)
          { value: 45.050, n: 10 },   // 45.1 (round up 0.05)
          { value: 4.999, n: 10 },    // 5.0 (round to even)
          { value: 2100.0, n: 10 },   // 2100.0 (exact)
        ]],
      );

      await coreProfileCalibrationJob.processNow();

      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'resting_hr', 58.3, 'system', 10, 'bpm');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'avg_sleep_hours', 7.3, 'system', 10, 'hours');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'biometrics', 'avg_hrv', 45.1, 'system', 10, 'ms');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'targets', 'weekly_workout_days', 5, 'system', 10, 'days/week');
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledWith('u1', 'targets', 'daily_calories', 2100, 'system', 10, 'kcal');
    });

    it('should process multiple users', async () => {
      // User list
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }, { user_id: 'u2' }]));
      // u1: all 5 metrics valid
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 60, n: 20 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 7, n: 20 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 50, n: 20 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 4, n: 20 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 2000, n: 20 }]));
      // u2: all 5 metrics valid
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 55, n: 15 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 8, n: 15 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 60, n: 15 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 5, n: 15 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 2200, n: 15 }]));

      await coreProfileCalibrationJob.processNow();

      // 5 rules * 2 users = 10 calibrations
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledTimes(10);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CoreCalibration] Completed',
        expect.objectContaining({ usersProcessed: 2, calibratedCount: 10 }),
      );
    });

    it('should continue with other rules when calibrate fails for one', async () => {
      setupCalibrationSequence(
        [{ user_id: 'u1' }],
        [[
          { value: 60, n: 20 },
          { value: 7, n: 20 },
          { value: 50, n: 20 },
          { value: 4, n: 20 },
          { value: 2000, n: 20 },
        ]],
      );
      // Second rule (avg_sleep_hours) calibration fails
      mockCoreProfileKernelService.calibrate
        .mockResolvedValueOnce(undefined)       // resting_hr succeeds
        .mockRejectedValueOnce(new Error('Write conflict'))  // avg_sleep_hours fails
        .mockResolvedValueOnce(undefined)       // avg_hrv succeeds
        .mockResolvedValueOnce(undefined)       // weekly_workout_days succeeds
        .mockResolvedValueOnce(undefined);      // daily_calories succeeds

      await coreProfileCalibrationJob.processNow();

      // All 5 should be attempted despite failure on #2
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledTimes(5);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[CoreCalibration] Rule failed',
        expect.objectContaining({ userId: 'u1', key: 'avg_sleep_hours', error: 'Write conflict' }),
      );
      // calibratedCount should be 4 (5 attempted minus 1 failed)
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CoreCalibration] Completed',
        expect.objectContaining({ calibratedCount: 4 }),
      );
    });

    it('should handle zero users', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await coreProfileCalibrationJob.processNow();

      expect(mockCoreProfileKernelService.calibrate).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CoreCalibration] Completed',
        expect.objectContaining({ usersProcessed: 0, calibratedCount: 0 }),
      );
    });

    it('should handle user with no data for any metric (all skipped)', async () => {
      setupCalibrationSequence(
        [{ user_id: 'u1' }],
        [[
          { value: null as any, n: 0 },
          { value: null as any, n: 0 },
          { value: null as any, n: 0 },
          { value: null as any, n: 0 },
          { value: null as any, n: 0 },
        ]],
      );

      await coreProfileCalibrationJob.processNow();

      expect(mockCoreProfileKernelService.calibrate).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CoreCalibration] Completed',
        expect.objectContaining({ usersProcessed: 1, calibratedCount: 0 }),
      );
    });

    it('should log error and reset isRunning when user list query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      await coreProfileCalibrationJob.processNow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[CoreCalibration] Job failed',
        expect.objectContaining({ error: 'Connection refused' }),
      );
      expect(coreProfileCalibrationJob.isRunning()).toBe(false);
    });

    it('should prevent concurrent execution via isRunning guard', async () => {
      let resolveUserQuery!: (val: any) => void;
      const userQueryPromise = new Promise((resolve) => {
        resolveUserQuery = resolve;
      });

      mockQuery.mockReturnValueOnce(userQueryPromise as any);

      // Start first run (will block on user list query)
      const firstRun = coreProfileCalibrationJob.processNow();
      // Attempt second run while first is in progress
      const secondRun = coreProfileCalibrationJob.processNow();

      // Resolve the blocked query with empty users
      resolveUserQuery(pgEmpty());
      await firstRun;
      await secondRun;

      // User list query should only have been called once
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should pass correct section, key, and unit for each rule', async () => {
      setupCalibrationSequence(
        [{ user_id: 'u1' }],
        [[
          { value: 65, n: 5 },
          { value: 6.5, n: 5 },
          { value: 42, n: 5 },
          { value: 3.5, n: 5 },
          { value: 1800, n: 5 },
        ]],
      );

      await coreProfileCalibrationJob.processNow();

      const calls = mockCoreProfileKernelService.calibrate.mock.calls;

      // Verify each rule's section/key/unit mapping
      expect(calls[0]).toEqual(['u1', 'biometrics', 'resting_hr', 65, 'system', 5, 'bpm']);
      expect(calls[1]).toEqual(['u1', 'biometrics', 'avg_sleep_hours', 6.5, 'system', 5, 'hours']);
      expect(calls[2]).toEqual(['u1', 'biometrics', 'avg_hrv', 42, 'system', 5, 'ms']);
      expect(calls[3]).toEqual(['u1', 'targets', 'weekly_workout_days', 3.5, 'system', 5, 'days/week']);
      expect(calls[4]).toEqual(['u1', 'targets', 'daily_calories', 1800, 'system', 5, 'kcal']);
    });

    it('should handle calibration rule query returning empty rows', async () => {
      // User list
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      // All 5 rule queries return empty result (no rows)
      for (let i = 0; i < 5; i++) {
        mockQuery.mockResolvedValueOnce(pgEmpty());
      }

      await coreProfileCalibrationJob.processNow();

      // With empty rows, row?.value is undefined → parseFloat(undefined) → NaN → skip
      expect(mockCoreProfileKernelService.calibrate).not.toHaveBeenCalled();
    });

    it('should continue processing next user when all rules fail for one user', async () => {
      // Two users
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }, { user_id: 'u2' }]));
      // u1: all 5 rule queries throw
      for (let i = 0; i < 5; i++) {
        mockQuery.mockRejectedValueOnce(new Error(`u1 rule ${i} failed`));
      }
      // u2: all 5 metrics valid
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 60, n: 10 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 7, n: 10 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 50, n: 10 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 4, n: 10 }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ value: 2000, n: 10 }]));

      await coreProfileCalibrationJob.processNow();

      // u1 should have 5 debug logs, u2 should have 5 successful calibrations
      expect(mockLogger.debug).toHaveBeenCalledTimes(5);
      expect(mockCoreProfileKernelService.calibrate).toHaveBeenCalledTimes(5);
      // All calibrate calls should be for u2
      for (const call of mockCoreProfileKernelService.calibrate.mock.calls) {
        expect(call[0]).toBe('u2');
      }
    });
  });

  describe('lifecycle', () => {
    afterEach(() => coreProfileCalibrationJob.stop());

    it('should register interval on start()', () => {
      expect(() => coreProfileCalibrationJob.start()).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CoreCalibration] Starting core profile calibration job (weekly)',
      );
    });

    it('should warn and not double-register when start() called twice', () => {
      coreProfileCalibrationJob.start();
      mockLogger.warn.mockClear();

      coreProfileCalibrationJob.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('[CoreCalibration] Already running');
    });

    it('should clear interval on stop()', () => {
      coreProfileCalibrationJob.start();
      coreProfileCalibrationJob.stop();

      expect(mockLogger.info).toHaveBeenCalledWith('[CoreCalibration] Stopped');
    });

    it('should handle stop() when not started (no-op)', () => {
      expect(() => coreProfileCalibrationJob.stop()).not.toThrow();
    });
  });
});
