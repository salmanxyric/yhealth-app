/**
 * @file Deep Analysis Engine Service
 * @description Multi-step statistical analysis with SSE-streamed progress.
 * Supports correlation, trend, anomaly, comparison, and multi-factor analysis.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import type {
  AnalysisType,
  AnalysisStep,
} from '@shared/types/domain/intelligence-files.js';

type EmitStepFn = (step: AnalysisStep) => void;

interface CorrelationResult {
  r: number;
  pValue: number;
  n: number;
  interpretation: string;
}

interface TrendResult {
  slope: number;
  intercept: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  changePerWeek: number;
  significanceNote: string;
}

interface AnomalyResult {
  anomalies: Array<{
    date: string;
    value: number;
    zScore: number;
    mean: number;
    stdDev: number;
  }>;
  baselineMean: number;
  baselineStdDev: number;
}

interface ComparisonResult {
  periodA: { mean: number; stdDev: number; count: number; label: string };
  periodB: { mean: number; stdDev: number; count: number; label: string };
  delta: number;
  deltaPercent: number;
  direction: 'improved' | 'declined' | 'stable';
}

export interface AnalysisResult {
  analysisId?: string;
  type: AnalysisType;
  correlation?: CorrelationResult;
  trend?: TrendResult;
  anomalies?: AnomalyResult;
  comparison?: ComparisonResult;
  narrative: string;
  steps: AnalysisStep[];
}

class DeepAnalysisEngineService {
  private emitStep(
    emit: EmitStepFn,
    id: string,
    label: string,
    status: AnalysisStep['status'],
    resultSummary?: string
  ): void {
    emit({ id, label, status, resultSummary });
  }

  private formatMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      sleep_hours: 'Sleep',
      resting_hr: 'Resting Heart Rate',
      hrv: 'HRV',
      daily_steps: 'Activity',
      workout_intensity: 'Workout Intensity',
      total_calories: 'Nutrition',
      recovery_score: 'Recovery',
    };
    return labels[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  async runAnalysis(
    userId: string,
    analysisType: AnalysisType,
    parameters: Record<string, unknown>,
    emitStep?: EmitStepFn,
    conversationId?: string
  ): Promise<AnalysisResult> {
    const steps: AnalysisStep[] = [];
    const startTime = Date.now();

    const emit = (step: AnalysisStep) => {
      steps.push(step);
      emitStep?.(step);
    };

    // Create analysis session
    const session = await query(
      `INSERT INTO intelligence_analyses
       (user_id, analysis_type, parameters, status, started_at, trigger, conversation_id)
       VALUES ($1, $2, $3, 'running', NOW(), 'user', $4)
       RETURNING id`,
      [userId, analysisType, JSON.stringify(parameters), conversationId || null]
    );
    const analysisId = session.rows[0].id as string;

    try {
      let result: AnalysisResult;

      switch (analysisType) {
        case 'correlation':
          result = await this.runCorrelation(userId, parameters, emit);
          break;
        case 'trend':
          result = await this.runTrend(userId, parameters, emit);
          break;
        case 'anomaly':
          result = await this.runAnomaly(userId, parameters, emit);
          break;
        case 'comparison':
          result = await this.runComparison(userId, parameters, emit);
          break;
        default:
          result = await this.runCorrelation(userId, parameters, emit);
      }

      result.analysisId = analysisId;
      result.steps = steps;

      // Persist results
      const totalMs = Date.now() - startTime;
      await query(
        `UPDATE intelligence_analyses
         SET status = 'completed', completed_at = NOW(),
             steps = $2, statistical_results = $3, narrative = $4
         WHERE id = $1`,
        [analysisId, JSON.stringify(steps), JSON.stringify(result), result.narrative]
      );

      emit({
        id: `step-done-${Date.now()}`,
        label: 'Analysis Complete',
        status: 'completed',
        durationMs: totalMs,
        resultSummary: result.narrative,
      });

      return result;
    } catch (err) {
      await query(
        `UPDATE intelligence_analyses SET status = 'failed', completed_at = NOW() WHERE id = $1`,
        [analysisId]
      );
      throw err;
    }
  }

  private async runCorrelation(
    userId: string,
    params: Record<string, unknown>,
    emit: EmitStepFn
  ): Promise<AnalysisResult> {
    const metricA = (params.metricA as string) || 'sleep_hours';
    const metricB = (params.metricB as string) || 'workout_intensity';
    const days = (params.days as number) || 60;

    // Step 1: Fetch data
    this.emitStep(emit, 'fetch-metric-a', `Analyzing ${this.formatMetricLabel(metricA)} Data`, 'active');
    const dataA = await this.fetchMetricTimeSeries(userId, metricA, days);
    this.emitStep(emit, 'fetch-metric-a', `Analyzing ${this.formatMetricLabel(metricA)} Data`, 'completed', `${dataA.length} data points`);

    this.emitStep(emit, 'fetch-metric-b', `Analyzing ${this.formatMetricLabel(metricB)} Data`, 'active');
    const dataB = await this.fetchMetricTimeSeries(userId, metricB, days);
    this.emitStep(emit, 'fetch-metric-b', `Analyzing ${this.formatMetricLabel(metricB)} Data`, 'completed', `${dataB.length} data points`);

    // Step 2: Align dates
    this.emitStep(emit, 'relationship-mapping', 'Mapping Relationships', 'active');
    const aligned = this.alignTimeSeries(dataA, dataB);
    this.emitStep(emit, 'relationship-mapping', 'Mapping Relationships', 'completed', `${aligned.length} matched pairs`);

    // Step 3: Compute correlation
    this.emitStep(emit, 'correlation-analysis', 'Finding Correlations', 'active');
    const valuesA = aligned.map((d) => d.a);
    const valuesB = aligned.map((d) => d.b);
    const correlation = this.pearsonCorrelation(valuesA, valuesB);
    this.emitStep(emit, 'correlation-analysis', 'Finding Correlations', 'completed', `r = ${correlation.r.toFixed(3)}`);

    const narrative = `Correlation between ${metricA} and ${metricB} over ${days} days: r = ${correlation.r.toFixed(3)} (${correlation.interpretation}). Based on ${correlation.n} matched data points.`;

    return { type: 'correlation', correlation, narrative, steps: [] };
  }

  private async runTrend(
    userId: string,
    params: Record<string, unknown>,
    emit: EmitStepFn
  ): Promise<AnalysisResult> {
    const metric = (params.metric as string) || 'sleep_hours';
    const days = (params.days as number) || 90;

    this.emitStep(emit, 'fetch-metric', `Analyzing ${this.formatMetricLabel(metric)} Data`, 'active');
    const data = await this.fetchMetricTimeSeries(userId, metric, days);
    this.emitStep(emit, 'fetch-metric', `Analyzing ${this.formatMetricLabel(metric)} Data`, 'completed', `${data.length} data points`);

    this.emitStep(emit, 'trend-detection', 'Detecting Trends', 'active');
    const values = data.map((d) => d.value);
    const xs = data.map((_, i) => i);
    const trend = this.linearRegression(xs, values);
    this.emitStep(emit, 'trend-detection', 'Detecting Trends', 'completed', `Slope: ${trend.slope.toFixed(4)}/day`);

    const narrative = `${metric} trend over ${days} days: ${trend.direction}. Change rate: ${trend.changePerWeek.toFixed(2)} per week. ${trend.significanceNote}`;

    return { type: 'trend', trend, narrative, steps: [] };
  }

  private async runAnomaly(
    userId: string,
    params: Record<string, unknown>,
    emit: EmitStepFn
  ): Promise<AnalysisResult> {
    const metric = (params.metric as string) || 'resting_hr';
    const days = (params.days as number) || 60;
    const threshold = (params.threshold as number) || 2.0;

    this.emitStep(emit, 'fetch-metric', `Analyzing ${this.formatMetricLabel(metric)} Data`, 'active');
    const data = await this.fetchMetricTimeSeries(userId, metric, days);
    this.emitStep(emit, 'fetch-metric', `Analyzing ${this.formatMetricLabel(metric)} Data`, 'completed', `${data.length} data points`);

    this.emitStep(emit, 'data-quality-check', 'Analyzing Data Issues', 'active');
    const values = data.map((d) => d.value);
    const mean = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    const stdDev = values.length ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) : 0;
    this.emitStep(emit, 'data-quality-check', 'Analyzing Data Issues', 'completed', `Mean: ${mean.toFixed(1)}, StdDev: ${stdDev.toFixed(1)}`);

    this.emitStep(emit, 'anomaly-detection', 'Identifying Anomalies', 'active');
    const anomalies = data
      .map((d) => ({ date: d.date, value: d.value, zScore: (d.value - mean) / (stdDev || 1), mean, stdDev }))
      .filter((d) => Math.abs(d.zScore) >= threshold);
    this.emitStep(emit, 'anomaly-detection', 'Identifying Anomalies', 'completed', `${anomalies.length} anomalies found`);

    const narrative = `Anomaly detection for ${metric} over ${days} days: found ${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'} (z-score threshold: ${threshold}). Baseline mean: ${mean.toFixed(1)}, std dev: ${stdDev.toFixed(1)}.`;

    return { type: 'anomaly', anomalies: { anomalies, baselineMean: mean, baselineStdDev: stdDev }, narrative, steps: [] };
  }

  private async runComparison(
    userId: string,
    params: Record<string, unknown>,
    emit: EmitStepFn
  ): Promise<AnalysisResult> {
    const metric = (params.metric as string) || 'daily_steps';
    const periodADays = (params.periodADays as number) || 7;
    const periodBDays = (params.periodBDays as number) || 7;
    const periodALabel = (params.periodALabel as string) || 'This week';
    const periodBLabel = (params.periodBLabel as string) || 'Last week';

    this.emitStep(emit, 'fetch-period-a', `Analyzing ${periodALabel} Data`, 'active');
    const dataA = await this.fetchMetricTimeSeries(userId, metric, periodADays);
    this.emitStep(emit, 'fetch-period-a', `Analyzing ${periodALabel} Data`, 'completed', `${dataA.length} data points`);

    this.emitStep(emit, 'fetch-period-b', `Analyzing ${periodBLabel} Data`, 'active');
    const dataB = await this.fetchMetricTimeSeries(userId, metric, periodADays + periodBDays);
    const periodBData = dataB.slice(0, Math.max(0, dataB.length - periodADays));
    this.emitStep(emit, 'fetch-period-b', `Analyzing ${periodBLabel} Data`, 'completed', `${periodBData.length} data points`);

    this.emitStep(emit, 'impact-assessment', 'Analyzing Impact', 'active');
    const statsA = this.computeStats(dataA.map((d) => d.value), periodALabel);
    const statsB = this.computeStats(periodBData.map((d) => d.value), periodBLabel);

    const delta = statsA.mean - statsB.mean;
    const deltaPercent = statsB.mean !== 0 ? (delta / statsB.mean) * 100 : 0;
    const direction = Math.abs(deltaPercent) < 3 ? 'stable' as const : delta > 0 ? 'improved' as const : 'declined' as const;

    this.emitStep(emit, 'impact-assessment', 'Analyzing Impact', 'completed', `${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`);

    const comparison: ComparisonResult = { periodA: statsA, periodB: statsB, delta, deltaPercent, direction };
    const narrative = `${metric} comparison: ${periodALabel} avg ${statsA.mean.toFixed(1)} vs ${periodBLabel} avg ${statsB.mean.toFixed(1)} (${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%, ${direction}).`;

    return { type: 'comparison', comparison, narrative, steps: [] };
  }

  // --- Statistical Methods ---

  private pearsonCorrelation(x: number[], y: number[]): CorrelationResult {
    const n = Math.min(x.length, y.length);
    if (n < 3) return { r: 0, pValue: 1, n, interpretation: 'insufficient data' };

    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;

    let num = 0, denomX = 0, denomY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    const r = denom === 0 ? 0 : num / denom;
    const absR = Math.abs(r);

    const interpretation =
      absR < 0.1 ? 'negligible' :
      absR < 0.3 ? 'weak' :
      absR < 0.5 ? 'moderate' :
      absR < 0.7 ? 'strong' : 'very strong';

    // Approximate p-value via t-statistic
    const t = r * Math.sqrt((n - 2) / (1 - r * r + 1e-10));
    const pValue = Math.min(1, 2 * Math.exp(-0.717 * Math.abs(t) - 0.416 * t * t / n));

    return { r: Math.round(r * 1000) / 1000, pValue: Math.round(pValue * 1000) / 1000, n, interpretation };
  }

  private linearRegression(x: number[], y: number[]): TrendResult {
    const n = x.length;
    if (n < 2) return { slope: 0, intercept: 0, direction: 'stable', changePerWeek: 0, significanceNote: 'Insufficient data' };

    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;

    let num = 0, denom = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - meanX) * (y[i] - meanY);
      denom += (x[i] - meanX) ** 2;
    }

    const slope = denom === 0 ? 0 : num / denom;
    const intercept = meanY - slope * meanX;
    const changePerWeek = slope * 7;

    const direction =
      Math.abs(changePerWeek) < 0.01 * Math.abs(meanY || 1) ? 'stable' as const :
      slope > 0 ? 'increasing' as const : 'decreasing' as const;

    const significanceNote = n >= 30 ? 'Based on sufficient data for significance' : `Based on ${n} data points — interpret with caution`;

    return { slope, intercept, direction, changePerWeek, significanceNote };
  }

  private computeStats(values: number[], label: string) {
    if (values.length === 0) return { mean: 0, stdDev: 0, count: 0, label };
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    return { mean, stdDev, count: values.length, label };
  }

  private alignTimeSeries(
    a: Array<{ date: string; value: number }>,
    b: Array<{ date: string; value: number }>
  ): Array<{ date: string; a: number; b: number }> {
    const bMap = new Map(b.map((d) => [d.date, d.value]));
    return a
      .filter((d) => bMap.has(d.date))
      .map((d) => ({ date: d.date, a: d.value, b: bMap.get(d.date)! }));
  }

  /**
   * Fetch time series data from various health tables.
   * Queries whoop_daily_data, workout_logs, daily_scores, etc.
   */
  async fetchMetricTimeSeries(
    userId: string,
    metric: string,
    days: number
  ): Promise<Array<{ date: string; value: number }>> {
    // Map metric names to actual table/column queries
    const metricQueries: Record<string, { sql: string; dateCol: string }> = {
      sleep_hours: {
        sql: `SELECT date::text, sleep_hours as value FROM daily_scores WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int AND sleep_hours IS NOT NULL ORDER BY date`,
        dateCol: 'date',
      },
      resting_hr: {
        sql: `SELECT created_at::date::text as date, resting_heart_rate as value FROM whoop_daily_data WHERE user_id = $1 AND created_at >= CURRENT_DATE - $2::int AND resting_heart_rate IS NOT NULL ORDER BY created_at::date`,
        dateCol: 'date',
      },
      hrv: {
        sql: `SELECT created_at::date::text as date, hrv as value FROM whoop_daily_data WHERE user_id = $1 AND created_at >= CURRENT_DATE - $2::int AND hrv IS NOT NULL ORDER BY created_at::date`,
        dateCol: 'date',
      },
      daily_steps: {
        sql: `SELECT date::text, COALESCE((metrics->>'steps')::numeric, 0) as value FROM daily_scores WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int ORDER BY date`,
        dateCol: 'date',
      },
      workout_intensity: {
        sql: `SELECT scheduled_date::text as date, AVG(difficulty_rating) as value FROM workout_logs WHERE user_id = $1 AND scheduled_date >= CURRENT_DATE - $2::int AND difficulty_rating IS NOT NULL GROUP BY scheduled_date ORDER BY scheduled_date`,
        dateCol: 'date',
      },
      total_calories: {
        sql: `SELECT date::text, total_calories as value FROM daily_scores WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int AND total_calories IS NOT NULL ORDER BY date`,
        dateCol: 'date',
      },
      recovery_score: {
        sql: `SELECT created_at::date::text as date, recovery_score as value FROM whoop_daily_data WHERE user_id = $1 AND created_at >= CURRENT_DATE - $2::int AND recovery_score IS NOT NULL ORDER BY created_at::date`,
        dateCol: 'date',
      },
      sleep_quality: {
        sql: `SELECT recorded_at::date::text as date,
                     AVG(COALESCE((value->>'sleep_quality_score')::numeric, (value->>'sleep_performance_percentage')::numeric)) as value
              FROM health_data_records
              WHERE user_id = $1
                AND data_type = 'sleep'
                AND recorded_at >= CURRENT_DATE - $2::int
                AND COALESCE(value->>'sleep_quality_score', value->>'sleep_performance_percentage') IS NOT NULL
              GROUP BY recorded_at::date
              ORDER BY recorded_at::date`,
        dateCol: 'date',
      },
      sleep_score: {
        sql: `SELECT recorded_at::date::text as date,
                     AVG(COALESCE((value->>'sleep_quality_score')::numeric, (value->>'sleep_performance_percentage')::numeric)) as value
              FROM health_data_records
              WHERE user_id = $1
                AND data_type = 'sleep'
                AND recorded_at >= CURRENT_DATE - $2::int
                AND COALESCE(value->>'sleep_quality_score', value->>'sleep_performance_percentage') IS NOT NULL
              GROUP BY recorded_at::date
              ORDER BY recorded_at::date`,
        dateCol: 'date',
      },
      cardio_load: {
        sql: `SELECT metric_date::text as date, strain_score as value
              FROM daily_health_metrics
              WHERE user_id = $1 AND metric_date >= CURRENT_DATE - $2::int AND strain_score IS NOT NULL
              ORDER BY metric_date`,
        dateCol: 'date',
      },
      strain_score: {
        sql: `SELECT metric_date::text as date, strain_score as value
              FROM daily_health_metrics
              WHERE user_id = $1 AND metric_date >= CURRENT_DATE - $2::int AND strain_score IS NOT NULL
              ORDER BY metric_date`,
        dateCol: 'date',
      },
      active_calories: {
        sql: `SELECT recorded_at::date::text as date,
                     AVG(COALESCE((value->>'calories_burned')::numeric, (value->>'active_calories')::numeric, (value->>'calories')::numeric)) as value
              FROM health_data_records
              WHERE user_id = $1
                AND recorded_at >= CURRENT_DATE - $2::int
                AND COALESCE(value->>'calories_burned', value->>'active_calories', value->>'calories') IS NOT NULL
              GROUP BY recorded_at::date
              ORDER BY recorded_at::date`,
        dateCol: 'date',
      },
    };

    const queryDef = metricQueries[metric];
    if (!queryDef) {
      logger.warn(`[DeepAnalysis] Unknown metric: ${metric}, returning empty`);
      return [];
    }

    try {
      const result = await query(queryDef.sql, [userId, days]);
      return result.rows.map((r: Record<string, unknown>) => ({
        date: r.date as string,
        value: parseFloat(String(r.value)) || 0,
      }));
    } catch (err) {
      logger.warn(`[DeepAnalysis] Failed to fetch metric ${metric}`, { error: (err as Error).message });
      return [];
    }
  }
}

export const deepAnalysisEngineService = new DeepAnalysisEngineService();
