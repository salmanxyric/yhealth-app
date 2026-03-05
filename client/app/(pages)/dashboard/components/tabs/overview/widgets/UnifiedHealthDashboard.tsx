'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularMetricCard } from './CircularMetricCard';
import { metricConfigs } from './metricConfigs';
import { RealTimeHeartRateCard } from './RealTimeHeartRateCard';
import { useWhoopRealtime } from '../hooks/useWhoopRealtime';
import type { HealthMetricType } from './CircularHealthMetric';
import { RefreshCw, Wifi, WifiOff, Clock, Moon, Activity, Zap } from 'lucide-react';

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

// Animated number component for metrics
function AnimatedMetricValue({ value, unit, isLoading }: { value: number | null; unit?: string; isLoading?: boolean }) {
  if (isLoading || value === null) return <span className="text-4xl sm:text-5xl font-bold text-slate-400">--</span>;
  
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-4xl sm:text-5xl font-bold text-white"
    >
      {value}{unit && <span className="text-2xl sm:text-3xl text-slate-400 ml-1">{unit}</span>}
    </motion.span>
  );
}

// Premium Circular Metric Component
function PremiumCircularMetric({
  type,
  value,
  max,
  label,
  unit,
  color,
  icon: Icon,
  delay = 0,
  onClick,
  isLoading = false,
  subtitle,
}: {
  type: string;
  value: number | null;
  max: number;
  label: string;
  unit?: string;
  color: string;
  icon: React.ElementType;
  delay?: number;
  onClick?: () => void;
  isLoading?: boolean;
  subtitle?: string;
}) {
  const progress = value !== null ? Math.min(100, (value / max) * 100) : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const colorMap: Record<string, { primary: string; secondary: string; glow: string }> = {
    emerald: { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16, 185, 129, 0.4)' },
    cyan: { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6, 182, 212, 0.4)' },
    orange: { primary: '#f97316', secondary: '#fb923c', glow: 'rgba(249, 115, 22, 0.4)' },
    purple: { primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(168, 85, 247, 0.4)' },
    red: { primary: '#ef4444', secondary: '#f87171', glow: 'rgba(239, 68, 68, 0.4)' },
    indigo: { primary: '#6366f1', secondary: '#818cf8', glow: 'rgba(99, 102, 241, 0.4)' },
  };

  const colors = colorMap[color] || colorMap.emerald;
  const displayValue = value !== null ? (type === 'age' ? value.toFixed(1) : Math.round(value)) : '--';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-4 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
      />
      
      {/* Icon */}
      <motion.div
        className="mb-3"
        whileHover={{ scale: 1.2, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Icon className="w-6 h-6" style={{ color: colors.primary }} />
      </motion.div>

      {/* Circular progress */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="100%" stopColor={colors.secondary} />
            </linearGradient>
            <radialGradient id={`bg-${type}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
              <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
            </radialGradient>
            <filter id={`glow-${type}`}>
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill={`url(#bg-${type})`}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="12"
          />

          {/* Progress circle */}
          {!isLoading && value !== null && (
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={`url(#grad-${type})`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: delay + 0.2 }}
              style={{
                filter: `drop-shadow(0 0 12px ${colors.glow})`,
              }}
            />
          )}

          {/* Loading spinner */}
          {isLoading && (
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={colors.primary}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="30 100"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl sm:text-4xl font-bold text-white drop-shadow-2xl"
            style={{
              textShadow: `0 0 30px ${colors.glow}, 0 2px 4px rgba(0, 0, 0, 0.5)`,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring' }}
          >
            {displayValue}
          </motion.span>
          {unit && (
            <span className="text-sm font-medium text-slate-300/80 mb-1">{unit}</span>
          )}
          <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: colors.primary }}>
            {label}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-400 mt-1">{subtitle}</span>
          )}
        </div>
      </div>

      {/* Interactive ripple for water */}
      {type === 'water' && onClick && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: colors.primary }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
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

  // Track manual refresh time
  const [manualRefreshTime, setManualRefreshTime] = useState<Date | null>(null);

  // Compute last refresh time
  const lastRefresh = useMemo(() => {
    const whoopTime = whoopData.lastSync ? new Date(whoopData.lastSync) : null;
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

  // Use insights from API if available
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

  // Merge Whoop heart rate data
  const mergedHeartRate = (() => {
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
    return {
      current: data.heartRate.current,
      resting: data.heartRate.resting,
      max: null,
      zone: 0,
      history: data.heartRate.history,
      lastUpdated: null,
    };
  })();

  // Sleep progress calculation
  const sleepProgress = useMemo(() => {
    if (!whoopData.sleep.hours) return 0;
    return Math.min(100, (whoopData.sleep.hours / 8) * 100);
  }, [whoopData.sleep.hours]);

  const handleRefresh = () => {
    refetchWhoop();
    setManualRefreshTime(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Health Dashboard
            </span>
          </h2>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Real-time metrics from your devices
          </p>
        </div>

        {/* Status & Refresh */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <motion.div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              whoopData.isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-slate-700/30 border-slate-600/30'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {whoopData.isConnected ? (
              <>
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">Offline</span>
              </>
            )}
          </motion.div>

          {/* Last Updated */}
          <p className="text-xs text-slate-500 hidden sm:block">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          {/* Refresh Button */}
          <motion.button
            onClick={handleRefresh}
            disabled={whoopLoading}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${whoopLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Metrics Grid - 2 columns mobile, 4 columns desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-fr">
        {/* Heart Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-2 lg:col-span-1 h-full"
        >
          <div className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift h-full flex flex-col">
            <RealTimeHeartRateCard
              data={mergedHeartRate}
              isLoading={whoopLoading || isLoading}
              isConnected={whoopData.isConnected}
              showChart={true}
            />
          </div>
        </motion.div>

        {/* Sleep */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="col-span-2 lg:col-span-1 h-full"
        >
          <div className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift h-full flex flex-col">
            <PremiumCircularMetric
              type="sleep"
              value={whoopData.sleep.hours}
              max={8}
              label="Sleep"
              unit="hours"
              color="purple"
              icon={Moon}
              delay={0.15}
              isLoading={whoopLoading}
              subtitle={whoopData.recovery.score ? `Recovery: ${whoopData.recovery.score}%` : undefined}
            />
          </div>
        </motion.div>

        {/* Overall Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2 lg:col-span-1 h-full"
        >
          <div className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift h-full flex flex-col">
            <PremiumCircularMetric
              type="overall"
              value={overallScore}
              max={100}
              label="Health Score"
              unit="%"
              color="emerald"
              icon={Activity}
              delay={0.2}
              isLoading={isLoading}
              subtitle={overallScore >= 80 ? 'Excellent!' : overallScore >= 60 ? 'Good' : 'Keep Going'}
            />
          </div>
        </motion.div>

        {/* Insights/Consistency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="col-span-2 lg:col-span-1"
        >
          <div className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift">
            <PremiumCircularMetric
              type="insights"
              value={insightsData.consistencyScore}
              max={100}
              label="Consistency"
              unit="%"
              color="indigo"
              icon={Zap}
              delay={0.25}
              isLoading={isLoading}
              subtitle={`${insightsData.weeklyAvg.toFixed(0)} weekly avg`}
            />
          </div>
        </motion.div>

        {/* WHOOP Age */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-2 lg:col-span-1"
        >
          <div className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift">
            <PremiumCircularMetric
              type="age"
              value={data.whoopAge.value}
              max={100}
              label="WHOOP Age"
              unit="years"
              color="emerald"
              icon={Activity}
              delay={0.3}
              isLoading={isLoading}
              subtitle={data.whoopAge.chronologicalAge ? `Bio: ${data.whoopAge.chronologicalAge}` : undefined}
            />
          </div>
        </motion.div>

        {/* Water */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="col-span-2 lg:col-span-1 h-full"
        >
          <div 
            className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift cursor-pointer group h-full flex flex-col"
            onClick={onAddWater}
          >
            <PremiumCircularMetric
              type="water"
              value={data.water.consumed}
              max={data.water.target}
              label="Water"
              unit="glasses"
              color="cyan"
              icon={Activity}
              delay={0.35}
              onClick={onAddWater}
            />
            <motion.div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ y: 10 }}
              whileHover={{ y: 0 }}
            >
              Tap to add
            </motion.div>
          </div>
        </motion.div>

        {/* Calories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-2 lg:col-span-1 h-full"
        >
          <div className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift h-full flex flex-col">
            <PremiumCircularMetric
              type="calories"
              value={data.calories.consumed}
              max={data.calories.target}
              label="Calories"
              unit="kcal"
              color="orange"
              icon={Zap}
              delay={0.4}
              isLoading={isLoading}
              subtitle={`Burned: ${data.calories.burned}`}
            />
          </div>
        </motion.div>

        {/* Nutrition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="col-span-2 lg:col-span-1 h-full"
        >
          <div className="glass-premium rounded-3xl p-4 sm:p-6 hover-lift h-full flex flex-col">
            <PremiumCircularMetric
              type="nutrition"
              value={data.nutrition.macros.protein + data.nutrition.macros.carbs + data.nutrition.macros.fats}
              max={data.nutrition.targets.protein + data.nutrition.targets.carbs + data.nutrition.targets.fats}
              label="Nutrition"
              unit="g"
              color="purple"
              icon={Activity}
              delay={0.45}
              isLoading={isLoading}
              subtitle={`P:${Math.round(data.nutrition.macros.protein)} C:${Math.round(data.nutrition.macros.carbs)} F:${Math.round(data.nutrition.macros.fats)}`}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
