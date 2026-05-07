import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';
import { deepAnalysisEngineService } from '../../deep-analysis-engine.service.js';
import { getAnalysisStepEmitter } from '../../analysis-step-emitter.store.js';
import { artifactGenerationService } from '../../artifact-generation.service.js';

const METRIC_ENUM = z.enum([
  'sleep_hours',
  'sleep_quality',
  'sleep_score',
  'resting_hr',
  'hrv',
  'daily_steps',
  'workout_intensity',
  'total_calories',
  'active_calories',
  'recovery_score',
  'cardio_load',
  'strain_score',
]);

const METRIC_LABELS: Record<string, string> = {
  sleep_hours: 'Sleep Hours',
  sleep_quality: 'Sleep Quality',
  sleep_score: 'Sleep Score',
  resting_hr: 'Resting Heart Rate',
  hrv: 'HRV',
  daily_steps: 'Daily Steps',
  workout_intensity: 'Workout Intensity',
  total_calories: 'Total Calories',
  active_calories: 'Active Calories',
  recovery_score: 'Recovery Score',
  cardio_load: 'Cardio Load',
  strain_score: 'Strain Score',
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

const AnalyzeMultiFactorSchema = z.object({
  targetMetric: METRIC_ENUM.describe('Metric to explain, such as sleep_quality or recovery_score'),
  factorMetrics: z.array(METRIC_ENUM).min(2).max(6).describe('Candidate driver metrics to compare against the target'),
  days: z.number().optional().describe('Number of days to analyze (default: 60)'),
});

const AnalyzeGoalProgressSchema = z.object({
  goalId: z.string().uuid().optional().describe('Specific goal id. If omitted, uses the primary active goal.'),
});

function calculateLinearTrend(data: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  const meanX = data.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = data.reduce((sum, point) => sum + point.y, 0) / n;
  const numerator = data.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const denominator = data.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  return { slope, intercept: meanY - slope * meanX };
}

function calculatePearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const meanX = x.reduce((sum, value) => sum + value, 0) / n;
  const meanY = y.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : Math.round((numerator / denom) * 1000) / 1000;
}

async function saveAnalysisArtifact(
  userId: string,
  artifact: Record<string, unknown>,
  analysisId?: string
): Promise<Record<string, unknown>> {
  try {
    const saved = await artifactGenerationService.saveInlineArtifact({
      userId,
      artifact,
      generatedBy: 'deep_analysis',
      analysisId,
      tags: ['ai-coach', 'analysis'],
    });

    return {
      ...artifact,
      artifactId: saved.id,
      saved: true,
    };
  } catch {
    return {
      ...artifact,
      saved: false,
    };
  }
}

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
  const trend = calculateLinearTrend(scatterData);

  const artifact = {
    type: 'chart' as const,
    chartType: 'correlation_scatter' as const,
    title: `${METRIC_LABELS[params.metricA]} vs ${METRIC_LABELS[params.metricB]}`,
    data: scatterData,
    xAxisKey: 'x',
    xAxisLabel: METRIC_LABELS[params.metricA],
    dataKeys: [
      { key: 'x', label: METRIC_LABELS[params.metricA], color: DEFAULT_COLORS[1] },
      { key: 'y', label: METRIC_LABELS[params.metricB], color: DEFAULT_COLORS[0] },
    ],
    yAxisLabel: METRIC_LABELS[params.metricB],
    statistics: result.correlation ? {
      r: result.correlation.r,
      pValue: result.correlation.pValue,
      slope: trend.slope,
      intercept: trend.intercept,
    } : undefined,
    annotations: result.correlation ? [
      { label: `r = ${result.correlation.r.toFixed(3)} (${result.correlation.interpretation})`, position: 'top-right' },
      { label: `${result.correlation.n} data points, ${days} days`, position: 'bottom-left' },
    ] : undefined,
    insight: result.narrative,
  };

  const savedArtifact = await saveAnalysisArtifact(userId, artifact, result.analysisId);
  const followUps = [
    `Show me the trend for ${METRIC_LABELS[params.metricA]}`,
    'What changed on the outlier days?',
    `Compare this week to last week for ${METRIC_LABELS[params.metricB]}`,
  ];

  return JSON.stringify({ success: true, narrative: result.narrative, artifact: savedArtifact, steps: result.steps, followUps });
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

  const savedArtifact = await saveAnalysisArtifact(userId, artifact, result.analysisId);
  const followUps = [
    `Why is ${METRIC_LABELS[params.metric]} changing?`,
    `Find anomalies in ${METRIC_LABELS[params.metric]}`,
    `Compare ${METRIC_LABELS[params.metric]} this week to last week`,
  ];

  return JSON.stringify({ success: true, narrative: result.narrative, artifact: savedArtifact, steps: result.steps, followUps });
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

  const savedArtifact = await saveAnalysisArtifact(userId, artifact, result.analysisId);
  const followUps = [
    `What drove the ${periodALabel} change?`,
    `Show me a trend for ${METRIC_LABELS[params.metric]}`,
    `Find anomalies in ${METRIC_LABELS[params.metric]}`,
  ];

  return JSON.stringify({ success: true, narrative: result.narrative, artifact: savedArtifact, steps: result.steps, followUps });
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

  const savedArtifact = await saveAnalysisArtifact(userId, artifact, result.analysisId);
  const followUps = [
    'What happened on those anomaly days?',
    'Compare anomaly days to normal days',
    `Show me the ${METRIC_LABELS[params.metric]} trend`,
  ];

  return JSON.stringify({ success: true, narrative: result.narrative, artifact: savedArtifact, steps: result.steps, followUps });
}

async function analyzeMultiFactor(
  userId: string,
  params: z.infer<typeof AnalyzeMultiFactorSchema>
): Promise<string> {
  const days = params.days || 60;
  const emitter = getAnalysisStepEmitter(userId);

  emitter?.({ id: 'multi-factor-fetch-target', label: `Analyzing ${METRIC_LABELS[params.targetMetric]} Data`, status: 'active' });
  const targetData = await deepAnalysisEngineService.fetchMetricTimeSeries(userId, params.targetMetric, days);
  emitter?.({ id: 'multi-factor-fetch-target', label: `Analyzing ${METRIC_LABELS[params.targetMetric]} Data`, status: 'completed', resultSummary: `${targetData.length} data points` });

  const targetMap = new Map(targetData.map((point) => [point.date, point.value]));
  emitter?.({ id: 'multi-factor-correlations', label: 'Mapping Relationships', status: 'active' });

  const factors = await Promise.all(params.factorMetrics.map(async (metric) => {
    const factorData = await deepAnalysisEngineService.fetchMetricTimeSeries(userId, metric, days);
    const aligned = factorData
      .filter((point) => targetMap.has(point.date))
      .map((point) => ({ factor: point.value, target: targetMap.get(point.date)! }));
    const correlation = calculatePearson(aligned.map((point) => point.factor), aligned.map((point) => point.target));
    return {
      metric,
      name: METRIC_LABELS[metric],
      correlation,
      importance: Math.round(Math.abs(correlation) * 100),
      relationship: Math.abs(correlation) < 0.2 ? 'none' : correlation > 0 ? 'positive' : 'negative',
      dataPoints: aligned.length,
    };
  }));

  const sorted = factors.sort((a, b) => b.importance - a.importance);
  emitter?.({ id: 'multi-factor-correlations', label: 'Mapping Relationships', status: 'completed', resultSummary: `${sorted.length} factors ranked` });
  emitter?.({ id: 'multi-factor-recommendations', label: 'Generating Recommendations', status: 'completed', resultSummary: 'Driver ranking ready' });

  const top = sorted[0];
  const narrative = top
    ? `${METRIC_LABELS[params.targetMetric]} appears most related to ${top.name} over the last ${days} days (r = ${top.correlation.toFixed(3)}, ${top.dataPoints} matched points).`
    : `I could not find enough matched data to explain ${METRIC_LABELS[params.targetMetric]}.`;

  const artifact = {
    type: 'chart' as const,
    chartType: 'radar_multi' as const,
    title: `${METRIC_LABELS[params.targetMetric]} Driver Analysis`,
    data: sorted.map((factor) => ({
      factor: factor.name,
      importance: factor.importance,
      correlation: factor.correlation,
      dataPoints: factor.dataPoints,
    })),
    xAxisKey: 'factor',
    dataKeys: [{ key: 'importance', label: 'Importance', color: DEFAULT_COLORS[0] }],
    yAxisLabel: 'Relative importance',
    statistics: { factors: sorted.length },
    annotations: top ? [{ label: `Top driver: ${top.name}`, color: DEFAULT_COLORS[0] }] : undefined,
    insight: narrative,
  };

  const savedArtifact = await saveAnalysisArtifact(userId, artifact);
  return JSON.stringify({
    success: true,
    narrative,
    artifact: savedArtifact,
    factors: sorted,
    followUps: [
      `Show ${top?.name || 'the top factor'} vs ${METRIC_LABELS[params.targetMetric]}`,
      `What should I change to improve ${METRIC_LABELS[params.targetMetric]}?`,
    ],
  });
}

async function analyzeGoalProgress(
  userId: string,
  params: z.infer<typeof AnalyzeGoalProgressSchema>
): Promise<string> {
  const values: Array<string | number | boolean | object | Date | null> = [userId];
  let where = `user_id = $1 AND status = 'active'`;
  if (params.goalId) {
    values.push(params.goalId);
    where += ` AND id = $2`;
  } else {
    where += ` ORDER BY is_primary DESC, updated_at DESC LIMIT 1`;
  }

  const goalResult = await query(
    `SELECT id, title, description, target_value, target_unit, current_value, start_value,
            start_date, target_date, progress, milestones
     FROM user_goals
     WHERE ${where}`,
    values
  );
  const goal = goalResult.rows[0];

  if (!goal) {
    return JSON.stringify({ success: false, narrative: 'No active goal was found to analyze.' });
  }

  const target = Number(goal.target_value || 0);
  const current = Number(goal.current_value ?? goal.start_value ?? 0);
  const progress = Number(goal.progress ?? (target > 0 ? (current / target) * 100 : 0));
  const today = new Date();
  const targetDate = new Date(goal.target_date);
  const startDate = new Date(goal.start_date);
  const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / 86400000));
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86400000));
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / 86400000));
  const expectedProgress = Math.min(100, (elapsedDays / totalDays) * 100);
  const onTrack = progress + 5 >= expectedProgress;
  const gap = Math.max(0, expectedProgress - progress);

  const narrative = `${goal.title} is ${Math.round(progress)}% complete with ${daysRemaining} days remaining. ${onTrack ? 'You are on track.' : `You are about ${Math.round(gap)}% behind the expected pace.`}`;
  const artifact = {
    type: 'chart' as const,
    chartType: 'gauge_current' as const,
    title: `Goal Progress - ${goal.title}`,
    data: [{ label: goal.title, progress: Math.round(progress), expected: Math.round(expectedProgress), current, target }],
    xAxisKey: 'label',
    dataKeys: [{ key: 'progress', label: '%', color: onTrack ? DEFAULT_COLORS[0] : DEFAULT_COLORS[2] }],
    gaugeMax: 100,
    statistics: { current, target, daysRemaining, expectedProgress, gap },
    annotations: [{ label: onTrack ? 'On track' : `${Math.round(gap)}% behind pace`, color: onTrack ? DEFAULT_COLORS[0] : DEFAULT_COLORS[2] }],
    insight: narrative,
  };

  const savedArtifact = await saveAnalysisArtifact(userId, artifact);
  return JSON.stringify({
    success: true,
    narrative,
    artifact: savedArtifact,
    goal: {
      id: goal.id,
      title: goal.title,
      target,
      current,
      unit: goal.target_unit,
      daysRemaining,
      onTrack,
    },
    followUps: [
      'What should I do this week to get back on track?',
      'Show my highest impact next action for this goal',
    ],
  });
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
      description: 'Analyze the statistical relationship between two health metrics (e.g., sleep quality vs cardio load, HRV vs recovery, steps vs sleep score). Returns and saves a scatter plot artifact with correlation coefficient, p-value, and trend line.',
      schema: AnalyzeCorrelationSchema,
      handler: withErrorHandling('analyzeCorrelation', analyzeCorrelation),
      icon: 'scatter-chart',
      mutationType: 'read',
      semanticDelta: (params) => `Correlation: ${params.metricA} vs ${params.metricB}`,
    },
    {
      name: 'analyzeTrend',
      description: 'Analyze whether a health metric is improving, declining, or stable over time using linear regression. Returns and saves a time-series artifact with mean and variance bands.',
      schema: AnalyzeTrendSchema,
      handler: withErrorHandling('analyzeTrend', analyzeTrend),
      icon: 'trending-up',
      mutationType: 'read',
      semanticDelta: (params) => `Trend analysis: ${params.metric}`,
    },
    {
      name: 'compareTimePeriods',
      description: 'Compare a health metric between two time periods (e.g., this week vs last week, this month vs last month, goal vs actual). Returns and saves a comparison artifact with percentage change and direction.',
      schema: CompareTimePeriodsSchema,
      handler: withErrorHandling('compareTimePeriods', compareTimePeriods),
      icon: 'git-compare',
      mutationType: 'read',
      semanticDelta: (params) => `Period comparison: ${params.metric}`,
    },
    {
      name: 'detectAnomalies',
      description: 'Detect unusual values in a health metric using z-score analysis. Returns and saves an anomaly artifact that highlights data points deviating from the baseline.',
      schema: DetectAnomaliesSchema,
      handler: withErrorHandling('detectAnomalies', detectAnomalies),
      icon: 'alert-triangle',
      mutationType: 'read',
      semanticDelta: (params) => `Anomaly detection: ${params.metric}`,
    },
    {
      name: 'analyzeMultiFactor',
      description: 'Explain why a target metric may be high or low by ranking multiple possible driver metrics. Use for questions like "what is affecting my sleep?", "why is recovery low?", or "what drives my energy?". Saves a multi-factor radar artifact.',
      schema: AnalyzeMultiFactorSchema,
      handler: withErrorHandling('analyzeMultiFactor', analyzeMultiFactor),
      icon: 'network',
      mutationType: 'read',
      semanticDelta: (params) => `Multi-factor analysis: ${params.targetMetric}`,
    },
    {
      name: 'analyzeGoalProgress',
      description: 'Analyze progress for the primary active goal or a specified goal. Use for questions like "how am I doing on my goal?", "am I on track?", or "what is my goal progress?". Saves a goal progress gauge artifact.',
      schema: AnalyzeGoalProgressSchema,
      handler: withErrorHandling('analyzeGoalProgress', analyzeGoalProgress),
      icon: 'target',
      mutationType: 'read',
      semanticDelta: () => 'Goal progress analysis',
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
