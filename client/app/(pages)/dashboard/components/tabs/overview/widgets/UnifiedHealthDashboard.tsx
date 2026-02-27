'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CircularMetricCard } from './CircularMetricCard';
import { metricConfigs } from './metricConfigs';
import { RealTimeHeartRateCard } from './RealTimeHeartRateCard';
import { useWhoopRealtime } from '../hooks/useWhoopRealtime';
import type { HealthMetricType } from './CircularHealthMetric';
import { RefreshCw, Wifi, WifiOff, Clock, Moon } from 'lucide-react';

export interface EnhancedHealthMetrics {
  steps: { value: number | null; target: number };
  whoopAge: { value: number | null; chronologicalAge: number | null };
  water: { consumed: number; target: number };
  calories: { consumed: number; burned: number; target: number };
  nutrition: {
    macros: { protein: number; carbs: number; fats: number };
    targets: { protein: number; carbs: number; fats: number };
    calories?: number;
  };
  heartRate: {
    current: number | null;
    resting: number | null;
    history: Array<{ time: string; bpm: number }>;
  };
  analytics: {
    weeklyAvg: number;
    consistencyScore: number;
    dataPoints: number;
    trend: 'up' | 'down' | 'stable';
  };
  sleep?: {
    hours: number | null;
    quality: number | null;
  };
}

interface UnifiedHealthDashboardProps {
  data: EnhancedHealthMetrics;
  isLoading?: boolean;
  onAddWater?: () => void;
}

export function UnifiedHealthDashboard({
  data,
  isLoading = false,
  onAddWater,
}: UnifiedHealthDashboardProps) {
  // Real-time Whoop data hook with 10-second polling
  const { data: whoopData, isLoading: whoopLoading, refetch: refetchWhoop } = useWhoopRealtime({
    pollInterval: 10000,
    enabled: true,
  });

  // Track manual refresh time (only updated on user action, not in effect)
  const [manualRefreshTime, setManualRefreshTime] = useState<Date | null>(null);

  // Compute last refresh time from Whoop data or manual refresh (derived state, no effect needed)
  const lastRefresh = useMemo(() => {
    const whoopTime = whoopData.lastSync ? new Date(whoopData.lastSync) : null;

    // Use the most recent time
    if (!whoopTime) return manualRefreshTime || new Date();
    if (!manualRefreshTime) return whoopTime;
    return whoopTime > manualRefreshTime ? whoopTime : manualRefreshTime;
  }, [whoopData.lastSync, manualRefreshTime]);

  // Calculate overall health score
  const overallScore = useMemo(() => {
    const metrics = [
      data.steps.value ? (data.steps.value / data.steps.target) * 100 : 0,
      data.water.consumed ? (data.water.consumed / data.water.target) * 100 : 0,
      data.calories.consumed ? Math.min((data.calories.consumed / data.calories.target) * 100, 100) : 0,
      data.analytics.consistencyScore,
      data.sleep?.hours ? (data.sleep.hours / 8) * 100 : 0,
    ].filter(score => score > 0);

    if (metrics.length === 0) return 0;
    return Math.round(metrics.reduce((sum, score) => sum + score, 0) / metrics.length);
  }, [data]);

  // Use insights from API if available, otherwise use analytics data
  const insightsData = useMemo(() => {
    const dataAny = data as unknown as Record<string, unknown>;
    if (dataAny.insights) {
      const insights = dataAny.insights as { weeklyAvg: number };
      return {
        weeklyAvg: insights.weeklyAvg,
        consistencyScore: insights.weeklyAvg,
        dataPoints: 0,
        trend: 'stable' as const,
      };
    }
    return data.analytics;
  }, [data]);

  // Merge Whoop heart rate data with existing data
  // Let React Compiler handle memoization automatically
  const mergedHeartRate = (() => {
    // Prefer Whoop real-time data if available
    if (whoopData.heartRate.current) {
      return {
        current: whoopData.heartRate.current,
        resting: whoopData.heartRate.resting || data.heartRate.resting,
        max: whoopData.heartRate.max,
        zone: whoopData.heartRate.zone,
        history: whoopData.heartRate.history.length > 0 ? whoopData.heartRate.history : data.heartRate.history,
        lastUpdated: whoopData.heartRate.lastUpdated,
      };
    }
    // Fallback to existing data
    return {
      current: data.heartRate.current,
      resting: data.heartRate.resting,
      max: null,
      zone: 0,
      history: data.heartRate.history,
      lastUpdated: null,
    };
  })();

  // Sleep progress calculation (target: 8 hours)
  const sleepProgress = useMemo(() => {
    if (!whoopData.sleep.hours) return 0;
    return Math.min(100, (whoopData.sleep.hours / 8) * 100);
  }, [whoopData.sleep.hours]);

  // Circular metrics - 8 total (4 per row, 2 rows)
  const circularMetrics: Array<{ type: HealthMetricType; config: typeof metricConfigs[HealthMetricType] }> = [
    { type: 'overall', config: metricConfigs.overall },
    { type: 'insights', config: metricConfigs.insights },
    { type: 'age', config: metricConfigs.age },
    { type: 'water', config: metricConfigs.water },
    { type: 'calories', config: metricConfigs.calories },
    { type: 'nutrition', config: metricConfigs.nutrition },
  ];

  const handleRefresh = () => {
    refetchWhoop();
    setManualRefreshTime(new Date());
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Health Dashboard
          </h2>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Real-time metrics from your devices
          </p>
        </div>

        {/* Status & Refresh */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            whoopData.isConnected
              ? 'bg-emerald-500/20 border border-emerald-500/30'
              : 'bg-slate-700/50 border border-slate-600/30'
          }`}>
            {whoopData.isConnected ? (
              <>
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Whoop Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">Offline</span>
              </>
            )}
          </div>

          {/* Last Updated */}
          <p className="text-xs text-slate-500 hidden md:block">
            Updated {lastRefresh.toLocaleTimeString()}
          </p>

          {/* Refresh Button */}
          <motion.button
            onClick={handleRefresh}
            disabled={whoopLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${whoopLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* All 8 Cards Grid - 4 per row, 2 rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Row 1: Heart Rate, Sleep, Health Score, Insights */}

        {/* Heart Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RealTimeHeartRateCard
            data={mergedHeartRate}
            isLoading={whoopLoading && isLoading}
            isConnected={whoopData.isConnected}
            showChart={true}
          />
        </motion.div>

        {/* Sleep Card - Circular transparent style matching lg size (208px) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ delay: 0.15 }}
          className="relative flex flex-col items-center justify-center"
        >
          <motion.div className="mb-4 opacity-90">
            <Moon className="w-5 h-5 text-purple-400" />
          </motion.div>
          <div className="relative w-52 h-52">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 208 208">
              <circle cx="104" cy="104" r="98" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="12" fill="url(#sleep-bg-gradient)" />
              <motion.circle
                cx="104" cy="104" r="98"
                stroke="#a855f7" strokeWidth="12" fill="none" strokeLinecap="round"
                initial={{ strokeDasharray: 615.75, strokeDashoffset: 615.75 }}
                animate={{ strokeDashoffset: 615.75 - (sleepProgress / 100) * 615.75 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ strokeDasharray: 615.75, filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))' }}
              />
              <defs>
                <radialGradient id="sleep-bg-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.05" />
                </radialGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl font-bold text-purple-400 drop-shadow-2xl"
                style={{
                  textShadow: '0 0 30px rgba(168, 85, 247, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '-0.02em',
                }}
              >
                {whoopData.sleep.hours ? whoopData.sleep.hours.toFixed(1) : '--'}
              </span>
              <span className="text-base font-medium text-slate-300/80 mb-1">hours</span>
              <span className="text-base font-semibold text-purple-400">SLEEP</span>
              {whoopData.recovery.score && (
                <span className="text-xs text-slate-400 mt-1">Recovery: {whoopData.recovery.score}%</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Row 1-2: Other Circular Metrics */}
        {circularMetrics.map(({ type, config }, index) => {
          type MetricDataType =
            | { whoopAge: number | null; chronologicalAge: number | null }
            | { consumed: number; target: number }
            | { consumed: number; burned: number; target: number }
            | EnhancedHealthMetrics['nutrition']
            | { weeklyAvg: number; consistencyScore: number; dataPoints: number; trend: 'up' | 'down' | 'stable'; workoutAvg?: number; nutritionAvg?: number; wellbeingAvg?: number }
            | { score: number };

          type AdditionalDataType = MetricDataType | ({ consumed: number; target: number; onAddWater?: () => void });

          let metricData: MetricDataType;
          let additionalData: AdditionalDataType | undefined;

          switch (type) {
            case 'age':
              metricData = { whoopAge: data.whoopAge.value, chronologicalAge: data.whoopAge.chronologicalAge };
              break;
            case 'water':
              metricData = { consumed: data.water.consumed, target: data.water.target };
              additionalData = { ...metricData, onAddWater };
              break;
            case 'calories':
              metricData = data.calories;
              break;
            case 'nutrition':
              metricData = data.nutrition;
              break;
            case 'insights': {
              const dataInsights = (data as unknown as Record<string, unknown>).insights as { workoutAvg?: number; nutritionAvg?: number; wellbeingAvg?: number } | undefined;
              metricData = {
                ...insightsData,
                workoutAvg: dataInsights?.workoutAvg,
                nutritionAvg: dataInsights?.nutritionAvg,
                wellbeingAvg: dataInsights?.wellbeingAvg,
              };
            }
              break;
            case 'overall':
              metricData = { score: overallScore };
              break;
            default:
              // This should never happen, but TypeScript requires exhaustive handling
              metricData = { score: 0 };
          }

          const metric = config.getMetric(metricData);
          metric.isLoading = isLoading;

          const additionalInfo = config.getAdditionalInfo
            ? config.getAdditionalInfo(additionalData || metricData)
            : undefined;

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.05 }}
            >
              <CircularMetricCard
                metric={metric}
                icon={config.icon}
                additionalInfo={additionalInfo}
                size="lg"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
