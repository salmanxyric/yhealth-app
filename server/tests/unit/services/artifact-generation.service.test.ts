/**
 * Artifact Generation Service Unit Tests
 *
 * Tests for generateFromAnalysis (correlation, trend, anomaly, comparison)
 * and generateComparison.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';
import { pgResult } from '../../helpers/factories.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { artifactGenerationService } = await import(
  '../../../src/services/artifact-generation.service.js'
);

// ============================================
// HELPERS
// ============================================

const USER_ID = '11111111-aaaa-bbbb-cccc-000000000001';
const ANALYSIS_ID = '22222222-aaaa-bbbb-cccc-000000000002';
const CONVERSATION_ID = '33333333-aaaa-bbbb-cccc-000000000003';
const MESSAGE_ID = '44444444-aaaa-bbbb-cccc-000000000004';
const NOW = new Date();

function makeArtifactRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'artifact-001',
    user_id: USER_ID,
    artifact_type: 'scatter',
    title: 'Correlation Analysis (r = 0.850)',
    description: 'A narrative about the analysis',
    chart_config: {},
    data: [],
    insight: 'A narrative about the analysis',
    generated_by: 'deep_analysis',
    trigger_message_id: null,
    conversation_id: null,
    analysis_id: ANALYSIS_ID,
    memory_ids_used: [],
    data_sources: [],
    is_pinned: false,
    is_archived: false,
    tags: ['correlation'],
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeCorrelationResult(overrides: Record<string, unknown> = {}) {
  return {
    type: 'correlation' as const,
    correlation: {
      r: 0.85,
      pValue: 0.001,
      n: 30,
      interpretation: 'strong positive',
    },
    narrative: 'Strong positive correlation detected between sleep and recovery.',
    steps: [],
    ...overrides,
  };
}

function makeTrendResult(overrides: Record<string, unknown> = {}) {
  return {
    type: 'trend' as const,
    trend: {
      slope: 0.5,
      intercept: 60,
      direction: 'increasing' as const,
      changePerWeek: 0.5,
      significanceNote: 'Statistically significant',
    },
    narrative: 'Resting heart rate is trending upward.',
    steps: [],
    ...overrides,
  };
}

function makeAnomalyResult(overrides: Record<string, unknown> = {}) {
  return {
    type: 'anomaly' as const,
    anomalies: {
      anomalies: [
        { date: '2026-04-10', value: 120, zScore: 3.2 },
        { date: '2026-04-15', value: 115, zScore: 2.8 },
      ],
      baselineMean: 72,
      baselineStdDev: 8,
    },
    narrative: '2 anomalous heart rate readings detected.',
    steps: [],
    ...overrides,
  };
}

function makeComparisonResult(overrides: Record<string, unknown> = {}) {
  return {
    type: 'comparison' as const,
    comparison: {
      periodA: { mean: 65, stdDev: 4, count: 7, label: 'This Week' },
      periodB: { mean: 70, stdDev: 5, count: 7, label: 'Last Week' },
      delta: -5,
      deltaPercent: -7.14,
      direction: 'improved' as const,
    },
    narrative: 'Resting heart rate improved this week compared to last week.',
    steps: [],
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('ArtifactGenerationService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------
  // generateFromAnalysis
  // ------------------------------------------
  describe('generateFromAnalysis', () => {
    it('should create scatter artifact for correlation analysis with r-value in title', async () => {
      const result = makeCorrelationResult();
      const dbRow = makeArtifactRow({
        artifact_type: 'scatter',
        title: 'Correlation Analysis (r = 0.850)',
        tags: ['correlation', 'statistics'],
      });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      const artifact = await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      expect(artifact.artifactType).toBe('scatter');
      expect(artifact.title).toContain('r = 0.850');
    });

    it('should include trendLine in chartConfig for correlation', async () => {
      const result = makeCorrelationResult();
      const dbRow = makeArtifactRow();
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      const insertCall = mockQuery.mock.calls[0];
      const params = insertCall[1] as unknown[];
      // chart_config is params[4] (JSON stringified)
      const chartConfig = JSON.parse(params[4] as string);
      expect(chartConfig.chartType).toBe('correlation_scatter');
      expect(chartConfig.trendLine).toBeDefined();
      expect(chartConfig.trendLine.slope).toBe(0.85);
      expect(chartConfig.trendLine.visible).toBe(true);
    });

    it('should create chart artifact for trend analysis with direction in title', async () => {
      const result = makeTrendResult();
      const dbRow = makeArtifactRow({
        artifact_type: 'chart',
        title: 'Trend Analysis — increasing',
      });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      const artifact = await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      expect(artifact.artifactType).toBe('chart');
    });

    it('should include showTrendLine in chartConfig for trend analysis', async () => {
      const result = makeTrendResult();
      const dbRow = makeArtifactRow({ artifact_type: 'chart' });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      const chartConfig = JSON.parse(params[4] as string);
      expect(chartConfig.chartType).toBe('time_series');
      expect(chartConfig.showTrendLine).toBe(true);
      expect(chartConfig.slope).toBe(0.5);
      expect(chartConfig.intercept).toBe(60);
    });

    it('should create chart artifact for anomaly analysis with anomaly annotations', async () => {
      const result = makeAnomalyResult();
      const dbRow = makeArtifactRow({
        artifact_type: 'chart',
        title: 'Anomaly Detection — 2 found',
      });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      const artifact = await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      expect(artifact.artifactType).toBe('chart');

      const params = mockQuery.mock.calls[0][1] as unknown[];
      const chartConfig = JSON.parse(params[4] as string);
      expect(chartConfig.showAnomolies).toBe(true);
      expect(chartConfig.referenceLines).toHaveLength(3);
      expect(chartConfig.referenceLines[0].label).toBe('Mean');

      // data should be the anomaly points
      const data = JSON.parse(params[5] as string);
      expect(data).toHaveLength(2);
      expect(data[0].date).toBe('2026-04-10');
      expect(data[0].zScore).toBe(3.2);
    });

    it('should create comparison artifact for comparison analysis', async () => {
      const result = makeComparisonResult();
      const dbRow = makeArtifactRow({
        artifact_type: 'comparison',
        title: 'This Week vs Last Week',
        tags: ['comparison', 'comparison'],
      });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      const artifact = await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      expect(artifact.artifactType).toBe('comparison');

      const params = mockQuery.mock.calls[0][1] as unknown[];
      const chartConfig = JSON.parse(params[4] as string);
      expect(chartConfig.chartType).toBe('comparison_bar');
      expect(chartConfig.groupLabels).toEqual(['This Week', 'Last Week']);
    });

    it('should persist to DB with correct fields', async () => {
      const result = makeCorrelationResult();
      const dbRow = makeArtifactRow();
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO intelligence_artifacts'),
        expect.arrayContaining([
          USER_ID,
          'scatter',
          expect.stringContaining('r = 0.850'),
        ])
      );
    });

    it('should include analysisId in the DB insert', async () => {
      const result = makeCorrelationResult();
      const dbRow = makeArtifactRow();
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      // analysisId is params[9]
      expect(params[9]).toBe(ANALYSIS_ID);
    });

    it('should include conversationId and messageId when provided', async () => {
      const result = makeCorrelationResult();
      const dbRow = makeArtifactRow({
        conversation_id: CONVERSATION_ID,
        trigger_message_id: MESSAGE_ID,
      });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      const artifact = await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result, CONVERSATION_ID, MESSAGE_ID
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      // messageId is params[7], conversationId is params[8]
      expect(params[7]).toBe(MESSAGE_ID);
      expect(params[8]).toBe(CONVERSATION_ID);
      expect(artifact.conversationId).toBe(CONVERSATION_ID);
      expect(artifact.triggerMessageId).toBe(MESSAGE_ID);
    });

    it('should pass null for conversationId and messageId when not provided', async () => {
      const result = makeCorrelationResult();
      const dbRow = makeArtifactRow();
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      expect(params[7]).toBeNull();
      expect(params[8]).toBeNull();
    });

    it('should tag artifacts with the analysis type', async () => {
      const result = makeTrendResult();
      const dbRow = makeArtifactRow({ tags: ['trend', 'trend'] });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateFromAnalysis(
        USER_ID, ANALYSIS_ID, result
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      // tags is params[10]
      const tags = params[10] as string[];
      expect(tags).toContain('trend');
    });

    it('should propagate DB failure', async () => {
      const result = makeCorrelationResult();
      mockQuery.mockRejectedValueOnce(new Error('connection refused'));

      await expect(
        artifactGenerationService.generateFromAnalysis(USER_ID, ANALYSIS_ID, result)
      ).rejects.toThrow('connection refused');
    });
  });

  // ------------------------------------------
  // generateComparison
  // ------------------------------------------
  describe('generateComparison', () => {
    it('should create a comparison artifact with correct structure', async () => {
      const items = [
        { label: 'Steps', current: 8000, target: 10000, trend: 'up' as const, unit: 'steps' },
        { label: 'Calories', current: 2100, target: 2200, trend: 'stable' as const, unit: 'kcal' },
      ];
      const dbRow = makeArtifactRow({
        artifact_type: 'comparison',
        title: 'Weekly Health Summary',
        tags: ['comparison', 'weekly'],
      });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      const artifact = await artifactGenerationService.generateComparison(
        USER_ID, 'Weekly Health Summary', items, CONVERSATION_ID
      );

      expect(artifact.artifactType).toBe('comparison');
      expect(artifact.title).toBe('Weekly Health Summary');
      expect(artifact.tags).toContain('comparison');
      expect(artifact.tags).toContain('weekly');
    });

    it('should map items correctly in the data payload', async () => {
      const items = [
        { label: 'Sleep Hours', current: 7.5, target: 8, unit: 'hrs' },
        { label: 'Steps', current: 9500 },
      ];
      const dbRow = makeArtifactRow({ artifact_type: 'comparison' });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateComparison(
        USER_ID, 'Daily Metrics', items
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      const data = JSON.parse(params[3] as string);
      expect(data).toHaveLength(2);
      expect(data[0].label).toBe('Sleep Hours');
      expect(data[0].current).toBe(7.5);
      expect(data[0].target).toBe(8);
      expect(data[1].label).toBe('Steps');
      expect(data[1].current).toBe(9500);
    });

    it('should handle items with no target gracefully', async () => {
      const items = [
        { label: 'Water', current: 2.5 },
      ];
      const dbRow = makeArtifactRow({ artifact_type: 'comparison' });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateComparison(
        USER_ID, 'Hydration Check', items
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      const data = JSON.parse(params[3] as string);
      expect(data[0].target).toBeUndefined();
    });

    it('should persist to DB with generated_by=chat', async () => {
      const items = [{ label: 'Score', current: 85 }];
      const dbRow = makeArtifactRow({
        artifact_type: 'comparison',
        generated_by: 'chat',
      });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateComparison(
        USER_ID, 'Score Check', items
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("'chat'"),
        expect.any(Array)
      );
    });

    it('should pass conversationId when provided', async () => {
      const items = [{ label: 'HR', current: 65 }];
      const dbRow = makeArtifactRow({ artifact_type: 'comparison' });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateComparison(
        USER_ID, 'HR Check', items, CONVERSATION_ID
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      // conversationId is params[4]
      expect(params[4]).toBe(CONVERSATION_ID);
    });

    it('should pass null for conversationId when not provided', async () => {
      const items = [{ label: 'HR', current: 65 }];
      const dbRow = makeArtifactRow({ artifact_type: 'comparison' });
      mockQuery.mockResolvedValueOnce(pgResult([dbRow]));

      await artifactGenerationService.generateComparison(
        USER_ID, 'HR Check', items
      );

      const params = mockQuery.mock.calls[0][1] as unknown[];
      expect(params[4]).toBeNull();
    });
  });
});
