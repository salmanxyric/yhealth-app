import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';
import { deepAnalysisEngineService } from '../../deep-analysis-engine.service.js';
import { getAnalysisStepEmitter } from '../../analysis-step-emitter.store.js';

const METRIC_ENUM = z.enum([
  'sleep_hours',
  'resting_hr',
  'hrv',
  'daily_steps',
  'workout_intensity',
  'total_calories',
  'recovery_score',
]);

const METRIC_LABELS: Record<string, string> = {
  sleep_hours: 'Sleep Hours',
  resting_hr: 'Resting Heart Rate',
  hrv: 'HRV',
  daily_steps: 'Daily Steps',
  workout_intensity: 'Workout Intensity',
  total_calories: 'Total Calories',
  recovery_score: 'Recovery Score',
};

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyzeCorrelationSchema = z.object({
  metricA: METRIC_ENUM.describe('First metric to correlate'),
  metricB: METRIC_ENUM.describe('Second metric to correlate'),
  days: z.number().optional().describe('Number of days to analyze (default: 60)'),
});

const AnalyzeTrendSchema = z.object({
  metric: METRIC_ENUM.describe('Metric to analyze trend for'),
  days: z.number().optional().describe('Number of days to analyze (default: 90)'),
});

const CompareTimePeriodsSchema = z.object({
  metric: METRIC_ENUM.describe('Metric to compare across periods'),
  periodADays: z.number().optional().describe('Days in current period (default: 7)'),
  periodBDays: z.number().optional().describe('Days in previous period (default: 7)'),
  periodALabel: z.string().optional().describe('Label for current period (default: "This week")'),
  periodBLabel: z.string().optional().describe('Label for previous period (default: "Last week")'),
});

const DetectAnomaliesSchema = z.object({
  metric: METRIC_ENUM.describe('Metric to check for anomalies'),
  days: z.number().optional().describe('Number of days to analyze (default: 60)'),
  threshold: z.number().optional().describe('Z-score threshold for anomaly detection (default: 2.0)'),
});

async function analyzeCorrelation(
  userId: string,
  params: z.infer<typeof AnalyzeCorrelationSchema>
): Promise<string> {
  const days = params.days || 60;
  const emitter = getAnalysisStepEmitter(userId);

  const result = await deepAnalysisEngineService.runAnalysis(
    userId, 'correlation', { metricA: params.metricA, metricB: params.metricB, days }, emitter
  );

  const [dataA, dataB] = await Promise.all([
    deepAnalysisEngineService.fetchMetricTimeSeries(userId, params.metricA, days),
    deepAnalysisEngineService.fetchMetricTimeSeries(userId, params.metricB, days),
  ]);

  const bMap = new Map(dataB.map(d => [d.date, d.value]));
  const scatterData = dataA
    .filter(d => bMap.has(d.date))
    .map(d => ({ x: d.value, y: bMap.get(d.date)!, date: d.date }));

  const artifact = {
    type: 'chart' as const,
    chartType: 'correlation_scatter' as const,
    title: `${METRIC_LABELS[params.metricA]} vs ${METRIC_LABELS[params.metricB]}`,
    data: scatterData,
    xAxisKey: 'x',
    dataKeys: [{ key: 'y', label: METRIC_LABELS[params.metricB], color: DEFAULT_COLORS[0] }],
    yAxisLabel: METRIC_LABELS[params.metricB],
    statistics: result.correlation ? {
      r: result.correlation.r,
      slope: result.correlation.r,
      intercept: 0,
    } : undefined,
    annotations: result.correlation ? [
      { label: `r = ${result.correlation.r.toFixed(3)} (${result.correlation.interpretation})`, position: 'top-right' },
      { label: `${result.correlation.n} data points, ${days} days`, position: 'bottom-left' },
    ] : undefined,
    insight: result.narrative,
  };

  return JSON.stringify({ success: true, narrative: result.narrative, artifact, steps: result.steps });
}

async function analyzeTrend(
  userId: string,
  params: z.infer<typeof AnalyzeTrendSchema>
): Promise<string> {
  const days = params.days || 90;
  const emitter = getAnalysisStepEmitter(userId);

  const result = await deepAnalysisEngineService.runAnalysis(
    userId, 'trend', { metric: params.metric, days }, emitter
  );

  const timeSeries = await deepAnalysisEngineService.fetchMetricTimeSeries(userId, params.metric, days);

  const values = timeSeries.map(d => d.value);
  const mean = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  const stdDev = values.length > 0
    ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
    : 0;

  const artifact = {
    type: 'chart' as const,
    chartType: 'time_series' as const,
    title: `${METRIC_LABELS[params.metric]} — ${days}-Day Trend`,
    data: timeSeries.map(d => ({ date: d.date, value: d.value })),
    xAxisKey: 'date',
    dataKeys: [{ key: 'value', label: METRIC_LABELS[params.metric], color: DEFAULT_COLORS[0] }],
    yAxisLabel: METRIC_LABELS[params.metric],
    referenceLines: [
      { y: mean, label: `Mean: ${mean.toFixed(1)}`, stroke: '#94a3b8' },
      { y: mean + 2 * stdDev, label: '+2σ', stroke: '#f59e0b', strokeDasharray: '4 4' },
      { y: mean - 2 * stdDev, label: '-2σ', stroke: '#f59e0b', strokeDasharray: '4 4' },
    ],
    statistics: result.trend ? {
      slope: result.trend.slope,
      intercept: result.trend.intercept,
      mean,
      stdDev,
    } : undefined,
    annotations: result.trend ? [
      { label: `${result.trend.direction} — ${result.trend.changePerWeek >= 0 ? '+' : ''}${result.trend.changePerWeek.toFixed(2)}/week`, position: 'top-right' },
    ] : undefined,
    insight: result.narrative,
  };

  return JSON.stringify({ success: true, narrative: result.narrative, artifact, steps: result.steps });
}

async function compareTimePeriods(
  userId: string,
  params: z.infer<typeof CompareTimePeriodsSchema>
): Promise<string> {
  const periodADays = params.periodADays || 7;
  const periodBDays = params.periodBDays || 7;
  const periodALabel = params.periodALabel || 'This week';
  const periodBLabel = params.periodBLabel || 'Last week';
  const emitter = getAnalysisStepEmitter(userId);

  const result = await deepAnalysisEngineService.runAnalysis(
    userId, 'comparison',
    { metric: params.metric, periodADays, periodBDays, periodALabel, periodBLabel },
    emitter
  );

  const comp = result.comparison;
  const direction: 'up' | 'down' | 'flat' = comp
    ? (comp.direction === 'improved' ? 'up' : comp.direction === 'declined' ? 'down' : 'flat')
    : 'flat';

  const artifact = {
    type: 'comparison' as const,
    comparisonType: 'week_over_week' as const,
    title: `${METRIC_LABELS[params.metric]}: ${periodALabel} vs ${periodBLabel}`,
    periods: {
      baseline: { label: periodBLabel },
      compare: { label: periodALabel },
    },
    metrics: comp ? [{
      name: METRIC_LABELS[params.metric],
      baseline: Math.round(comp.periodB.mean * 10) / 10,
      compare: Math.round(comp.periodA.mean * 10) / 10,
      change: {
        absolute: Math.round(comp.delta * 10) / 10,
        percentage: Math.round(comp.deltaPercent * 10) / 10,
        direction: comp.direction,
      },
      isPositiveChange: comp.direction === 'improved',
    }] : undefined,
    summary: comp ? {
      improved: comp.direction === 'improved' ? [METRIC_LABELS[params.metric]] : [],
      declined: comp.direction === 'declined' ? [METRIC_LABELS[params.metric]] : [],
      stable: comp.direction === 'stable' ? [METRIC_LABELS[params.metric]] : [],
      headline: result.narrative,
    } : undefined,
    items: comp ? [{
      label: METRIC_LABELS[params.metric],
      current: Math.round(comp.periodA.mean * 10) / 10,
      target: Math.round(comp.periodB.mean * 10) / 10,
      trend: direction,
    }] : [],
    insight: result.narrative,
  };

  return JSON.stringify({ success: true, narrative: result.narrative, artifact, steps: result.steps });
}

async function detectAnomalies(
  userId: string,
  params: z.infer<typeof DetectAnomaliesSchema>
): Promise<string> {
  const days = params.days || 60;
  const threshold = params.threshold || 2.0;
  const emitter = getAnalysisStepEmitter(userId);

  const result = await deepAnalysisEngineService.runAnalysis(
    userId, 'anomaly', { metric: params.metric, days, threshold }, emitter
  );

  const timeSeries = await deepAnalysisEngineService.fetchMetricTimeSeries(userId, params.metric, days);

  const anomalyDates = new Set(result.anomalies?.anomalies.map(a => a.date) || []);
  const mean = result.anomalies?.baselineMean || 0;
  const stdDev = result.anomalies?.baselineStdDev || 0;

  const artifact = {
    type: 'chart' as const,
    chartType: 'time_series' as const,
    title: `${METRIC_LABELS[params.metric]} — Anomaly Detection`,
    data: timeSeries.map(d => ({
      date: d.date,
      value: d.value,
      isAnomaly: anomalyDates.has(d.date) ? 1 : 0,
    })),
    xAxisKey: 'date',
    dataKeys: [{ key: 'value', label: METRIC_LABELS[params.metric], color: DEFAULT_COLORS[0] }],
    yAxisLabel: METRIC_LABELS[params.metric],
    referenceLines: [
      { y: mean, label: `Mean: ${mean.toFixed(1)}`, stroke: '#94a3b8' },
      { y: mean + threshold * stdDev, label: `+${threshold}σ`, stroke: '#ef4444', strokeDasharray: '4 4' },
      { y: mean - threshold * stdDev, label: `-${threshold}σ`, stroke: '#ef4444', strokeDasharray: '4 4' },
    ],
    statistics: { mean, stdDev },
    annotations: result.anomalies ? [
      { label: `${result.anomalies.anomalies.length} anomalies detected`, position: 'top-right' },
    ] : undefined,
    insight: result.narrative,
  };

  return JSON.stringify({ success: true, narrative: result.narrative, artifact, steps: result.steps });
}

const GetDashboardSummarySchema = z.object({
  date: z.string().optional().describe('Date in YYYY-MM-DD format. Defaults to today.'),
});

async function getDashboardSummary(userId: string, params: z.infer<typeof GetDashboardSummarySchema>): Promise<string> {
  const targetDate = params.date || new Date().toISOString().split('T')[0];

  const [schedule, streak, waterIntake, moodLog, activePlans, habits, recentWorkout] = await Promise.all([
    query(
      `SELECT ds.id, ds.schedule_date,
              COALESCE(json_agg(json_build_object('id', si.id, 'title', si.title, 'status', si.status, 'start_time', si.start_time))
                FILTER (WHERE si.id IS NOT NULL), '[]') as items
       FROM daily_schedules ds
       LEFT JOIN schedule_items si ON ds.id = si.schedule_id
       WHERE ds.user_id = $1 AND ds.schedule_date = $2
       GROUP BY ds.id`,
      [userId, targetDate],
    ).then(r => r.rows[0] || null).catch(() => null),

    query(
      `SELECT current_streak, longest_streak, freeze_available FROM user_streaks WHERE user_id = $1`,
      [userId],
    ).then(r => r.rows[0] || null).catch(() => null),

    query(
      `SELECT total_ml, goal_ml FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
      [userId, targetDate],
    ).then(r => r.rows[0] || null).catch(() => null),

    query(
      `SELECT mood_emoji, descriptor, happiness_rating, energy_rating, stress_rating
       FROM mood_logs WHERE user_id = $1 AND DATE(logged_at) = $2
       ORDER BY logged_at DESC LIMIT 1`,
      [userId, targetDate],
    ).then(r => r.rows[0] || null).catch(() => null),

    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'active') as active_workout_plans,
              COUNT(*) FILTER (WHERE status = 'active') as active_diet_plans
       FROM (
         SELECT status FROM workout_plans WHERE user_id = $1
         UNION ALL
         SELECT status FROM diet_plans WHERE user_id = $1
       ) combined`,
      [userId],
    ).then(r => r.rows[0] || { active_workout_plans: 0, active_diet_plans: 0 }).catch(() => ({ active_workout_plans: 0, active_diet_plans: 0 })),

    query(
      `SELECT COUNT(*) FILTER (WHERE is_active = true AND is_archived = false) as active_habits,
              (SELECT COUNT(*) FROM habit_logs WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1) AND DATE(log_date) = $2 AND completed = true) as completed_today
       FROM habits WHERE user_id = $1`,
      [userId, targetDate],
    ).then(r => r.rows[0] || { active_habits: 0, completed_today: 0 }).catch(() => ({ active_habits: 0, completed_today: 0 })),

    query(
      `SELECT id, created_at FROM workout_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    ).then(r => r.rows[0] || null).catch(() => null),
  ]);

  return JSON.stringify({
    success: true,
    data: {
      date: targetDate,
      schedule,
      streak,
      waterIntake,
      latestMood: moodLog,
      activePlans,
      habits,
      recentWorkout,
    },
  }, null, 2);
}

export function registerAnalyticsTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'analyzeCorrelation',
      description: 'Analyze the statistical correlation between two health metrics (e.g., sleep vs HRV, steps vs recovery). Returns a scatter plot chart with correlation coefficient and trend line.',
      schema: AnalyzeCorrelationSchema,
      handler: withErrorHandling('analyzeCorrelation', analyzeCorrelation),
      icon: 'scatter-chart',
      mutationType: 'read',
      semanticDelta: (params) => `Correlation: ${params.metricA} vs ${params.metricB}`,
    },
    {
      name: 'analyzeTrend',
      description: 'Analyze the trend direction of a health metric over time using linear regression. Shows whether a metric is increasing, decreasing, or stable with a time series chart.',
      schema: AnalyzeTrendSchema,
      handler: withErrorHandling('analyzeTrend', analyzeTrend),
      icon: 'trending-up',
      mutationType: 'read',
      semanticDelta: (params) => `Trend analysis: ${params.metric}`,
    },
    {
      name: 'compareTimePeriods',
      description: 'Compare a health metric between two time periods (e.g., this week vs last week). Shows a comparison card with percentage change and direction.',
      schema: CompareTimePeriodsSchema,
      handler: withErrorHandling('compareTimePeriods', compareTimePeriods),
      icon: 'git-compare',
      mutationType: 'read',
      semanticDelta: (params) => `Period comparison: ${params.metric}`,
    },
    {
      name: 'detectAnomalies',
      description: 'Detect unusual values (anomalies) in a health metric using z-score analysis. Highlights data points that deviate significantly from the baseline.',
      schema: DetectAnomaliesSchema,
      handler: withErrorHandling('detectAnomalies', detectAnomalies),
      icon: 'alert-triangle',
      mutationType: 'read',
      semanticDelta: (params) => `Anomaly detection: ${params.metric}`,
    },
    {
      name: 'getDashboardSummary',
      description: 'Get a quick snapshot of the user\'s day: today\'s schedule, streak status, water intake, latest mood, active plans, habit progress, and last workout. Use when the user asks "how am I doing today?", "give me an overview", or "what\'s my status?".',
      schema: GetDashboardSummarySchema,
      handler: withErrorHandling('getDashboardSummary', getDashboardSummary),
      icon: 'layout-dashboard',
      mutationType: 'read',
    },
  ];
}
