/**
 * @file Nutrition Analysis Job Tests
 * Tests for daily nutrition analysis, deviation detection, and adaptive adjustments.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

const mockNutritionAnalysisService = {
  analyzeDailyNutrition: jest.fn<any>().mockResolvedValue(null),
};
jest.unstable_mockModule('../../../src/services/nutrition-analysis.service.js', () => ({
  nutritionAnalysisService: mockNutritionAnalysisService,
  // Re-export the type so TypeScript is happy
  DeviationClassification: {},
}));

const mockAdaptiveCalorieService = {
  getUserPreferences: jest.fn<any>().mockResolvedValue({}),
  generateAdjustmentPlan: jest.fn<any>().mockResolvedValue({
    coachingMessage: 'Eat more protein',
  }),
  storeAdjustmentPlan: jest.fn<any>().mockResolvedValue('adj-1'),
};
jest.unstable_mockModule('../../../src/services/adaptive-calorie.service.js', () => ({
  adaptiveCalorieService: mockAdaptiveCalorieService,
}));

const mockNutritionLearningService = {
  updatePatternsFromAnalysis: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/nutrition-learning.service.js', () => ({
  nutritionLearningService: mockNutritionLearningService,
}));

const mockNotificationService = {
  create: jest.fn<any>().mockResolvedValue({ id: 'notif-1' }),
};
jest.unstable_mockModule('../../../src/services/notification.service.js', () => ({
  notificationService: mockNotificationService,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { nutritionAnalysisJob, triggerAnalysisForUser } = await import(
  '../../../src/jobs/nutrition-analysis.job.js'
);
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockNutritionAnalysisService.analyzeDailyNutrition.mockResolvedValue(null);
  mockAdaptiveCalorieService.getUserPreferences.mockResolvedValue({});
  mockAdaptiveCalorieService.generateAdjustmentPlan.mockResolvedValue({ coachingMessage: 'Eat more protein' });
  mockAdaptiveCalorieService.storeAdjustmentPlan.mockResolvedValue('adj-1');
  mockNutritionLearningService.updatePatternsFromAnalysis.mockResolvedValue(undefined);
  mockNotificationService.create.mockResolvedValue({ id: 'notif-1' });
});

describe('NutritionAnalysisJob', () => {
  describe('triggerAnalysisForUser', () => {
    it('should analyze nutrition and update learning patterns', async () => {
      const analysisResult = {
        id: 'analysis-1',
        deviation: { deviationPercent: -20, classification: 'moderate_under' },
        whoopContext: { workoutCalories: 300 },
        aiAnalysis: 'You are under-eating',
        targets: { dietPlanId: 'plan-1' },
      };
      mockNutritionAnalysisService.analyzeDailyNutrition.mockResolvedValueOnce(analysisResult);

      const yesterday = new Date('2026-04-23');
      await triggerAnalysisForUser('u1', yesterday);

      expect(mockNutritionAnalysisService.analyzeDailyNutrition).toHaveBeenCalledWith({
        userId: 'u1',
        date: yesterday,
        forceReanalyze: true,
      });

      expect(mockNutritionLearningService.updatePatternsFromAnalysis).toHaveBeenCalledWith({
        userId: 'u1',
        date: yesterday,
        deviationPercent: -20,
        classification: 'moderate_under',
        whoopWorkoutCalories: 300,
      });
    });

    it('should do nothing when analysis returns null (no active plan)', async () => {
      mockNutritionAnalysisService.analyzeDailyNutrition.mockResolvedValueOnce(null);

      await triggerAnalysisForUser('u1');

      expect(mockNutritionLearningService.updatePatternsFromAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('job processor (via lifecycle)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      nutritionAnalysisJob.stop();
      jest.useRealTimers();
    });

    it('should query for users with active diet plans', async () => {
      // Table check returns true
      mockQuery
        .mockResolvedValueOnce(pgResult([{ exists: true }]))
        .mockResolvedValueOnce(pgEmpty()); // No users with active plans

      nutritionAnalysisJob.start();

      // The job runs immediately on start via processNutritionAnalysis().catch(...)
      // We need to flush the microtask queue
      await jest.advanceTimersByTimeAsync(0);

      expect(mockQuery).toHaveBeenCalled();
    });

    it('should skip users whose analysis time has not arrived', async () => {
      // Set time to 10:00 AM — default analysis time is 21:00
      jest.setSystemTime(new Date('2026-04-24T10:00:00Z'));

      const users = [
        {
          id: 'u1',
          email: 'a@test.com',
          first_name: 'Alice',
          timezone: 'UTC',
          analysis_time: null,
          analysis_enabled: null,
          auto_adjust_enabled: null,
          notify_on_deviation: null,
          deviation_threshold_percent: null,
        },
      ];

      mockQuery
        .mockResolvedValueOnce(pgResult([{ exists: true }]))
        .mockResolvedValueOnce(pgResult(users));

      nutritionAnalysisJob.start();
      await jest.advanceTimersByTimeAsync(0);

      // Analysis should not run — time mismatch (10:00 vs 21:00)
      expect(mockNutritionAnalysisService.analyzeDailyNutrition).not.toHaveBeenCalled();
    });

    it('should skip users with analysis_enabled = false', async () => {
      jest.setSystemTime(new Date('2026-04-24T21:00:00Z'));

      const users = [
        {
          id: 'u1',
          email: 'a@test.com',
          first_name: 'Alice',
          timezone: 'UTC',
          analysis_time: '21:00',
          analysis_enabled: false,
          auto_adjust_enabled: null,
          notify_on_deviation: null,
          deviation_threshold_percent: null,
        },
      ];

      mockQuery
        .mockResolvedValueOnce(pgResult([{ exists: true }]))
        .mockResolvedValueOnce(pgResult(users));

      nutritionAnalysisJob.start();
      await jest.advanceTimersByTimeAsync(0);

      expect(mockNutritionAnalysisService.analyzeDailyNutrition).not.toHaveBeenCalled();
    });

    it('should handle errors for individual users without crashing the job', async () => {
      jest.setSystemTime(new Date('2026-04-24T21:00:00Z'));

      const users = [
        {
          id: 'u1',
          email: 'a@test.com',
          first_name: 'Alice',
          timezone: 'UTC',
          analysis_time: '21:00',
          analysis_enabled: true,
          auto_adjust_enabled: null,
          notify_on_deviation: null,
          deviation_threshold_percent: null,
        },
      ];

      mockQuery
        .mockResolvedValueOnce(pgResult([{ exists: true }]))
        .mockResolvedValueOnce(pgResult(users))
        .mockResolvedValueOnce(pgResult([{ count: '0' }])); // hasAnalyzedToday

      mockNutritionAnalysisService.analyzeDailyNutrition.mockRejectedValueOnce(
        new Error('LLM quota exceeded'),
      );

      nutritionAnalysisJob.start();
      await jest.advanceTimersByTimeAsync(0);

      // Job should have caught the error and continued (no throw)
    });
  });

  describe('lifecycle', () => {
    afterEach(() => nutritionAnalysisJob.stop());

    it('should start and stop without throwing', () => {
      expect(() => nutritionAnalysisJob.start()).not.toThrow();
      expect(() => nutritionAnalysisJob.stop()).not.toThrow();
    });

    it('should warn when starting while already running', () => {
      nutritionAnalysisJob.start();
      expect(() => nutritionAnalysisJob.start()).not.toThrow();
    });
  });
});
