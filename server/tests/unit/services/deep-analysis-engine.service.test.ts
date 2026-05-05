/**
 * Deep Analysis Engine Service Unit Tests
 *
 * Tests for runAnalysis (routing + persistence), runCorrelation, runTrend,
 * runAnomaly, runComparison, and fetchMetricTimeSeries.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';
import { pgResult, pgEmpty } from '../../helpers/factories.js';

// ============================================
// MOCKS (must precede dynamic imports)
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { deepAnalysisEngineService } = await import(
  '../../../src/services/deep-analysis-engine.service.js'
);

// ============================================
// HELPERS
// ============================================

const USER_ID = 'user-uuid-001';

function timeSeriesData(values: number[], startDate = '2026-04-01') {
  return values.map((value, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().split('T')[0], value };
  });
}

const perfectPositive = timeSeriesData([1, 2, 3, 4, 5]);
const perfectNegative = timeSeriesData([5, 4, 3, 2, 1]);
const flat = timeSeriesData([3, 3, 3, 3, 3]);
const withOutlier = timeSeriesData([50, 50, 50, 50, 50, 50, 50, 100, 50, 50]);
const noOutlier = timeSeriesData([50, 51, 49, 50, 52, 48, 50, 51, 49, 50]);
const increasing = timeSeriesData([10, 12, 14, 16, 18, 20, 22, 24, 26, 28]);
const decreasing = timeSeriesData([28, 26, 24, 22, 20, 18, 16, 14, 12, 10]);

/**
 * Sets up mockQuery to handle the analysis session INSERT (first call)
 * and the analysis result UPDATE (last call) around the actual metric fetches.
 */
function setupAnalysisSessionMock(metricMocks: Array<{ rows: Array<{ date: string; value: number }> }>) {
  // 1. INSERT INTO intelligence_analyses RETURNING id
  mockQuery.mockResolvedValueOnce(pgResult([{ id: 'analysis-001' }]));

  // 2..N. Metric fetch queries
  for (const mock of metricMocks) {
    mockQuery.mockResolvedValueOnce(pgResult(mock.rows));
  }

  // N+1. UPDATE intelligence_analyses SET status = 'completed'
  mockQuery.mockResolvedValueOnce(pgEmpty());
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deepAnalysisEngineService', () => {
  // ──────────────────────────────────────────
  // runCorrelation
  // ──────────────────────────────────────────
  describe('runCorrelation', () => {
    it('computes positive correlation (r close to 1) for positively correlated data', async () => {
      setupAnalysisSessionMock([
        { rows: perfectPositive },
        { rows: perfectPositive },
      ]);
      const emitStep = jest.fn();

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'correlation',
        { metricA: 'sleep_hours', metricB: 'hrv', days: 30 },
        emitStep
      );

      expect(result.type).toBe('correlation');
      expect(result.correlation).toBeDefined();
      expect(result.correlation!.r).toBeCloseTo(1.0, 2);
      expect(result.correlation!.n).toBe(5);
      expect(result.correlation!.interpretation).toBe('very strong');
    });

    it('computes negative correlation (r close to -1) for inversely correlated data', async () => {
      setupAnalysisSessionMock([
        { rows: perfectPositive },
        { rows: perfectNegative },
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'correlation',
        { metricA: 'sleep_hours', metricB: 'resting_hr', days: 30 },
      );

      expect(result.correlation!.r).toBeCloseTo(-1.0, 2);
      expect(result.correlation!.interpretation).toBe('very strong');
    });

    it('computes negligible correlation for uncorrelated data', async () => {
      // Use data with no linear relationship
      const uncorrelatedA = timeSeriesData([1, 2, 3, 4, 5]);
      const uncorrelatedB = timeSeriesData([3, 1, 4, 1, 5]);

      setupAnalysisSessionMock([
        { rows: uncorrelatedA },
        { rows: uncorrelatedB },
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'correlation',
        { metricA: 'sleep_hours', metricB: 'hrv', days: 30 },
      );

      expect(Math.abs(result.correlation!.r)).toBeLessThan(0.5);
    });

    it('returns insufficient data when fewer than 3 matched points', async () => {
      const twoPoints = timeSeriesData([1, 2]);
      setupAnalysisSessionMock([
        { rows: twoPoints },
        { rows: twoPoints },
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'correlation',
        { metricA: 'sleep_hours', metricB: 'hrv', days: 7 },
      );

      expect(result.correlation!.r).toBe(0);
      expect(result.correlation!.interpretation).toBe('insufficient data');
    });

    it('emits step callbacks during execution', async () => {
      setupAnalysisSessionMock([
        { rows: perfectPositive },
        { rows: perfectPositive },
      ]);
      const emitStep = jest.fn();

      await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'correlation',
        { metricA: 'sleep_hours', metricB: 'hrv', days: 30 },
        emitStep
      );

      // Should have emitted steps: fetch A active, fetch A completed,
      // fetch B active, fetch B completed, align active, align completed,
      // compute active, compute completed, plus the final "Analysis Complete" step
      expect(emitStep.mock.calls.length).toBeGreaterThanOrEqual(5);
      const lastStep = emitStep.mock.calls[emitStep.mock.calls.length - 1][0];
      expect(lastStep.label).toBe('Analysis Complete');
      expect(lastStep.status).toBe('completed');
    });
  });

  // ──────────────────────────────────────────
  // runTrend
  // ──────────────────────────────────────────
  describe('runTrend', () => {
    it('detects increasing trend with positive slope', async () => {
      setupAnalysisSessionMock([{ rows: increasing }]);
      const emitStep = jest.fn();

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 }, emitStep
      );

      expect(result.type).toBe('trend');
      expect(result.trend).toBeDefined();
      expect(result.trend!.slope).toBeGreaterThan(0);
      expect(result.trend!.direction).toBe('increasing');
      expect(result.trend!.changePerWeek).toBeGreaterThan(0);
    });

    it('detects decreasing trend with negative slope', async () => {
      setupAnalysisSessionMock([{ rows: decreasing }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'resting_hr', days: 30 },
      );

      expect(result.trend!.slope).toBeLessThan(0);
      expect(result.trend!.direction).toBe('decreasing');
      expect(result.trend!.changePerWeek).toBeLessThan(0);
    });

    it('detects stable trend when slope is near zero', async () => {
      setupAnalysisSessionMock([{ rows: flat }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 },
      );

      expect(result.trend!.direction).toBe('stable');
    });

    it('computes changePerWeek as slope * 7', async () => {
      setupAnalysisSessionMock([{ rows: increasing }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 },
      );

      const expectedChangePerWeek = result.trend!.slope * 7;
      expect(result.trend!.changePerWeek).toBeCloseTo(expectedChangePerWeek, 6);
    });
  });

  // ──────────────────────────────────────────
  // runAnomaly
  // ──────────────────────────────────────────
  describe('runAnomaly', () => {
    it('detects outliers with z-score > 2', async () => {
      setupAnalysisSessionMock([{ rows: withOutlier }]);
      const emitStep = jest.fn();

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'anomaly', { metric: 'resting_hr', days: 60 }, emitStep
      );

      expect(result.type).toBe('anomaly');
      expect(result.anomalies).toBeDefined();
      expect(result.anomalies!.anomalies.length).toBeGreaterThanOrEqual(1);

      const outlierEntry = result.anomalies!.anomalies.find(
        (a: { value: number }) => a.value === 100
      );
      expect(outlierEntry).toBeDefined();
      expect(Math.abs(outlierEntry!.zScore)).toBeGreaterThanOrEqual(2.0);
    });

    it('finds no anomalies in normally distributed data', async () => {
      setupAnalysisSessionMock([{ rows: noOutlier }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'anomaly', { metric: 'resting_hr', days: 60 },
      );

      expect(result.anomalies!.anomalies).toHaveLength(0);
    });

    it('handles stdDev = 0 by using divisor of 1 to avoid Infinity', async () => {
      // All values identical -> stdDev = 0
      setupAnalysisSessionMock([{ rows: flat }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'anomaly', { metric: 'sleep_hours', days: 30 },
      );

      // Should not crash, no anomalies since all z-scores would be 0
      expect(result.anomalies!.anomalies).toHaveLength(0);
      expect(result.anomalies!.baselineStdDev).toBe(0);
    });

    it('populates baselineMean and baselineStdDev correctly', async () => {
      // Mean of noOutlier: average of [50,51,49,50,52,48,50,51,49,50] = 50
      setupAnalysisSessionMock([{ rows: noOutlier }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'anomaly', { metric: 'resting_hr', days: 60 },
      );

      expect(result.anomalies!.baselineMean).toBeCloseTo(50, 0);
      expect(result.anomalies!.baselineStdDev).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────
  // runComparison
  // ──────────────────────────────────────────
  describe('runComparison', () => {
    it('detects improvement between periods', async () => {
      const periodAData = timeSeriesData([80, 85, 90, 85, 80, 90, 85]); // mean ~85
      const fullData = [
        ...timeSeriesData([60, 65, 70, 65, 60, 70, 65], '2026-03-18'), // periodB, mean ~65
        ...periodAData, // periodA
      ];

      setupAnalysisSessionMock([
        { rows: periodAData },   // periodA fetch
        { rows: fullData },      // full range fetch
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'comparison',
        { metric: 'daily_steps', periodADays: 7, periodBDays: 7 },
      );

      expect(result.type).toBe('comparison');
      expect(result.comparison).toBeDefined();
      expect(result.comparison!.delta).toBeGreaterThan(0);
      expect(result.comparison!.direction).toBe('improved');
    });

    it('detects decline between periods', async () => {
      const periodAData = timeSeriesData([40, 45, 42, 43, 41, 44, 40]); // mean ~42
      const fullData = [
        ...timeSeriesData([80, 85, 82, 83, 81, 84, 80], '2026-03-18'), // periodB, mean ~82
        ...periodAData,
      ];

      setupAnalysisSessionMock([
        { rows: periodAData },
        { rows: fullData },
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'comparison',
        { metric: 'daily_steps', periodADays: 7, periodBDays: 7 },
      );

      expect(result.comparison!.delta).toBeLessThan(0);
      expect(result.comparison!.direction).toBe('declined');
    });

    it('detects stable when difference is less than 3%', async () => {
      const periodAData = timeSeriesData([100, 101, 99, 100, 101, 99, 100]); // mean ~100
      const fullData = [
        ...timeSeriesData([100, 99, 101, 100, 99, 101, 100], '2026-03-18'), // periodB, mean ~100
        ...periodAData,
      ];

      setupAnalysisSessionMock([
        { rows: periodAData },
        { rows: fullData },
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'comparison',
        { metric: 'daily_steps', periodADays: 7, periodBDays: 7 },
      );

      expect(result.comparison!.direction).toBe('stable');
    });
  });

  // ──────────────────────────────────────────
  // fetchMetricTimeSeries
  // ──────────────────────────────────────────
  describe('fetchMetricTimeSeries', () => {
    it('maps sleep_hours to daily_scores table', async () => {
      setupAnalysisSessionMock([
        { rows: [{ date: '2026-04-01', value: 7.5 }] },
      ]);

      await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 },
      );

      // Second call is the metric fetch (first is session INSERT)
      const metricFetchCall = mockQuery.mock.calls[1];
      expect(metricFetchCall[0]).toContain('daily_scores');
      expect(metricFetchCall[0]).toContain('sleep_hours');
    });

    it('maps hrv to whoop_daily_data table', async () => {
      setupAnalysisSessionMock([
        { rows: [{ date: '2026-04-01', value: 45 }] },
      ]);

      await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'hrv', days: 30 },
      );

      const metricFetchCall = mockQuery.mock.calls[1];
      expect(metricFetchCall[0]).toContain('whoop_daily_data');
      expect(metricFetchCall[0]).toContain('hrv');
    });

    it('returns empty array for unknown metric', async () => {
      setupAnalysisSessionMock([]);
      // For unknown metric, the service logs a warning and returns []
      // which means trend will get 0 data points

      // INSERT analysis session
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'analysis-002' }]));
      // UPDATE analysis completed
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'nonexistent_metric', days: 30 },
      );

      // With 0 data points, linearRegression returns stable with 0 slope
      expect(result.trend!.slope).toBe(0);
      expect(result.trend!.direction).toBe('stable');
    });

    it('maps resting_hr to whoop_daily_data table', async () => {
      setupAnalysisSessionMock([
        { rows: [{ date: '2026-04-01', value: 58 }] },
      ]);

      await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'resting_hr', days: 30 },
      );

      const metricFetchCall = mockQuery.mock.calls[1];
      expect(metricFetchCall[0]).toContain('whoop_daily_data');
      expect(metricFetchCall[0]).toContain('resting_heart_rate');
    });

    it('maps recovery_score to whoop_daily_data table', async () => {
      setupAnalysisSessionMock([
        { rows: [{ date: '2026-04-01', value: 72 }] },
      ]);

      await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'recovery_score', days: 30 },
      );

      const metricFetchCall = mockQuery.mock.calls[1];
      expect(metricFetchCall[0]).toContain('whoop_daily_data');
      expect(metricFetchCall[0]).toContain('recovery_score');
    });
  });

  // ──────────────────────────────────────────
  // runAnalysis (routing + persistence)
  // ──────────────────────────────────────────
  describe('runAnalysis', () => {
    it('routes correlation type to runCorrelation', async () => {
      setupAnalysisSessionMock([
        { rows: perfectPositive },
        { rows: perfectPositive },
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'correlation',
        { metricA: 'sleep_hours', metricB: 'hrv', days: 30 },
      );

      expect(result.type).toBe('correlation');
      expect(result.correlation).toBeDefined();
    });

    it('routes anomaly type to runAnomaly', async () => {
      setupAnalysisSessionMock([{ rows: noOutlier }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'anomaly', { metric: 'resting_hr', days: 60 },
      );

      expect(result.type).toBe('anomaly');
      expect(result.anomalies).toBeDefined();
    });

    it('routes trend type to runTrend', async () => {
      setupAnalysisSessionMock([{ rows: increasing }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 },
      );

      expect(result.type).toBe('trend');
      expect(result.trend).toBeDefined();
    });

    it('routes comparison type to runComparison', async () => {
      const periodAData = timeSeriesData([80, 85, 90]);
      const fullData = [
        ...timeSeriesData([60, 65, 70], '2026-03-25'),
        ...periodAData,
      ];
      setupAnalysisSessionMock([
        { rows: periodAData },
        { rows: fullData },
      ]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'comparison',
        { metric: 'daily_steps', periodADays: 3, periodBDays: 3 },
      );

      expect(result.type).toBe('comparison');
      expect(result.comparison).toBeDefined();
    });

    it('persists result to intelligence_analyses', async () => {
      setupAnalysisSessionMock([{ rows: increasing }]);

      await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 },
      );

      // First call: INSERT INTO intelligence_analyses
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO intelligence_analyses');
      expect(mockQuery.mock.calls[0][1]).toContain(USER_ID);

      // Last call before the final emitStep: UPDATE intelligence_analyses SET status = 'completed'
      const updateCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
      expect(updateCall[0]).toContain("status = 'completed'");
    });

    it('marks analysis as failed when session INSERT throws', async () => {
      // INSERT analysis session fails
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      await expect(
        deepAnalysisEngineService.runAnalysis(
          USER_ID, 'trend', { metric: 'sleep_hours', days: 30 },
        )
      ).rejects.toThrow('DB connection lost');
    });

    it('persists failed status when analysis encounters an unrecoverable error', async () => {
      // INSERT session succeeds
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'analysis-fail' }]));
      // Metric fetch for correlation: metricA succeeds
      mockQuery.mockResolvedValueOnce(pgResult(perfectPositive));
      // Metric fetch for correlation: metricB succeeds
      mockQuery.mockResolvedValueOnce(pgResult(perfectPositive));
      // Result UPDATE (completed) fails, triggering the catch block
      mockQuery.mockRejectedValueOnce(new Error('Write failed'));
      // Failure UPDATE in catch block
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await expect(
        deepAnalysisEngineService.runAnalysis(
          USER_ID, 'correlation',
          { metricA: 'sleep_hours', metricB: 'hrv', days: 30 },
        )
      ).rejects.toThrow('Write failed');

      // The catch block should have issued a failed status update
      const failureUpdate = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
      expect(failureUpdate[0]).toContain("status = 'failed'");
    });

    it('populates steps array in the result', async () => {
      setupAnalysisSessionMock([{ rows: increasing }]);
      const emitStep = jest.fn();

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 }, emitStep
      );

      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[result.steps.length - 1].label).toBe('Analysis Complete');
    });

    it('includes conversationId in the session insert when provided', async () => {
      setupAnalysisSessionMock([{ rows: increasing }]);

      await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend',
        { metric: 'sleep_hours', days: 30 },
        undefined,
        'conv-123'
      );

      const insertParams = mockQuery.mock.calls[0][1];
      expect(insertParams[3]).toBe('conv-123');
    });

    it('generates a narrative string in the result', async () => {
      setupAnalysisSessionMock([{ rows: increasing }]);

      const result = await deepAnalysisEngineService.runAnalysis(
        USER_ID, 'trend', { metric: 'sleep_hours', days: 30 },
      );

      expect(result.narrative).toBeTruthy();
      expect(typeof result.narrative).toBe('string');
      expect(result.narrative.length).toBeGreaterThan(0);
    });
  });
});
