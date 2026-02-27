'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Target,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  BarChart3,
} from 'lucide-react';

interface AnalyticsData {
  activityTrends: Array<{
    date: string;
    completed: number;
    total: number;
    completionRate: number;
  }>;
  weeklyBreakdown: Array<{
    day: string;
    activities: number;
    workouts: number;
    meals: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  timeDistribution: Array<{
    hour: number;
    activities: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    completed: number;
    target: number;
  }>;
  performanceMetrics: {
    averageCompletionRate: number;
    bestDay: string;
    worstDay: string;
    totalActivities: number;
    improvementRate: number;
  };
}

// Brand colors - Emerald 600 as primary accent
const BRAND_COLORS = {
  primary: '#059669', // emerald-600
  secondary: '#00BCD4', // cyan/teal (yHealth primary)
  success: '#10b981', // emerald-500
  fitness: '#f97316', // orange-500
  nutrition: '#22c55e', // green-500
  wellbeing: '#3b82f6', // blue-500
  accent: '#8b5cf6', // violet-500
  pink: '#ec4899',
};

const CHART_COLORS = [
  BRAND_COLORS.primary,
  BRAND_COLORS.secondary,
  BRAND_COLORS.success,
  BRAND_COLORS.fitness,
  BRAND_COLORS.wellbeing,
  BRAND_COLORS.pink,
];

// Animated number component
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}

// Skeleton loader for charts - deterministic heights for stable rendering
const SKELETON_HEIGHTS = [45, 70, 55, 80, 40, 65, 50];

function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[300px] bg-slate-800/50 rounded-lg flex items-end justify-around p-4 gap-2">
        {SKELETON_HEIGHTS.map((height, i) => (
          <div
            key={i}
            className="bg-emerald-600/20 rounded-t"
            style={{
              height: `${height}%`,
              width: '10%',
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Metric card with animation
function MetricCard({
  icon: Icon,
  iconColor,
  value,
  label,
  trend,
  trendValue,
  gradient,
  borderColor,
  delay = 0,
}: {
  icon: React.ElementType;
  iconColor: string;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  gradient: string;
  borderColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-6 border ${borderColor} backdrop-blur-sm group`}
    >
      {/* Animated background shimmer */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </motion.div>
          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <Activity className="w-5 h-5 text-slate-400" />
              )}
            </motion.div>
          )}
        </div>
        <motion.p
          className="text-3xl font-bold text-white mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {typeof value === 'number' ? <AnimatedNumber value={value} suffix={typeof value === 'number' && label.includes('Rate') ? '%' : ''} /> : value}
        </motion.p>
        <p className="text-sm text-slate-400">{label}</p>
        {trendValue !== undefined && (
          <motion.p
            className={`text-xs mt-1 ${trendValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3 }}
          >
            {trendValue >= 0 ? '+' : ''}{trendValue}% from last period
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await api.get<AnalyticsData>('/stats/analytics', {
        params: { range: timeRange },
      });

      if (response.success && response.data) {
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err: unknown) {
      console.error('Failed to fetch analytics:', err);
      setError((err instanceof Error ? err.message : null) || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchAnalytics(true);
    }, 2 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAnalytics]);

  const handleManualRefresh = () => {
    fetchAnalytics(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-800/50 rounded animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800/30 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center h-96"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          </motion.div>
          <p className="text-red-400 mb-4 text-lg">{error || 'No data available'}</p>
          <motion.button
            onClick={() => fetchAnalytics()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Analytics Dashboard
          </h2>
          <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isRefreshing && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-800/50 backdrop-blur-xl rounded-xl p-1 border border-white/10">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <motion.button
                key={range}
                onClick={() => setTimeRange(range)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </motion.button>
            ))}
          </div>
          <motion.button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Activity}
          iconColor="text-emerald-400"
          value={data.performanceMetrics.averageCompletionRate}
          label="Avg Completion Rate"
          trend={data.performanceMetrics.improvementRate >= 0 ? 'up' : 'down'}
          gradient="from-emerald-500/20 to-emerald-600/20"
          borderColor="border-emerald-500/30"
          delay={0}
        />

        <MetricCard
          icon={Target}
          iconColor="text-cyan-400"
          value={data.performanceMetrics.totalActivities}
          label="Total Activities"
          trend="neutral"
          gradient="from-cyan-500/20 to-cyan-600/20"
          borderColor="border-cyan-500/30"
          delay={0.1}
        />

        <MetricCard
          icon={Calendar}
          iconColor="text-green-400"
          value={data.performanceMetrics.bestDay}
          label="Best Day"
          gradient="from-green-500/20 to-green-600/20"
          borderColor="border-green-500/30"
          delay={0.2}
        />

        <MetricCard
          icon={TrendingUp}
          iconColor="text-orange-400"
          value={`${data.performanceMetrics.improvementRate >= 0 ? '+' : ''}${data.performanceMetrics.improvementRate}%`}
          label="Improvement Rate"
          trend={data.performanceMetrics.improvementRate >= 0 ? 'up' : 'down'}
          gradient="from-orange-500/20 to-orange-600/20"
          borderColor="border-orange-500/30"
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -2 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Activity Trends</h3>
          </div>
          <AnimatePresence mode="wait">
            {data.activityTrends.length > 0 ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.activityTrends}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      formatter={(value: unknown) => [`${value}%`, 'Completion Rate']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="completionRate"
                      stroke={BRAND_COLORS.primary}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="Completion Rate %"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[300px] text-slate-400"
              >
                <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                <p>No activity trends data available</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Weekly Breakdown Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -2 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Weekly Breakdown</h3>
          </div>
          <AnimatePresence mode="wait">
            {data.weeklyBreakdown.length > 0 ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.weeklyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                    />
                    <Legend />
                    <Bar dataKey="activities" fill={BRAND_COLORS.primary} name="Activities" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    <Bar dataKey="workouts" fill={BRAND_COLORS.fitness} name="Workouts" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    <Bar dataKey="meals" fill={BRAND_COLORS.nutrition} name="Meals" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[300px] text-slate-400"
              >
                <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                <p>No weekly breakdown data available</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Category Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ y: -2 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Category Distribution</h3>
          </div>
          <AnimatePresence mode="wait">
            {data.categoryDistribution.length > 0 ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: { percent?: number; name?: string; category?: string }) => {
                        const percent = ((props.percent || 0) * 100).toFixed(1);
                        return `${props.name || props.category || ''}: ${percent}%`;
                      }}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                      animationDuration={1500}
                    >
                      {data.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: unknown, name?: string, props?: { payload?: { percentage?: number; category?: string } }) => [
                        `${value} (${((props?.payload?.percentage || 0)).toFixed(1)}%)`,
                        props?.payload?.category || name || '',
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[300px] text-slate-400"
              >
                <Target className="w-12 h-12 mb-2 opacity-50" />
                <p>No category data available</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Time Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ y: -2 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-pink-500/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Clock className="w-5 h-5 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Activity by Time of Day</h3>
          </div>
          <AnimatePresence mode="wait">
            {data.timeDistribution.some(t => t.activities > 0) ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="hour"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={(value) => {
                        const hour = parseInt(value);
                        return hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
                      }}
                    />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                      }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      formatter={((value: number | string) => [`${value}`, 'Activities']) as never}
                    />
                    <Bar dataKey="activities" fill={BRAND_COLORS.pink} name="Activities" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[300px] text-slate-400"
              >
                <Clock className="w-12 h-12 mb-2 opacity-50" />
                <p>No time distribution data available</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Monthly Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileHover={{ y: -2 }}
        className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-colors"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Monthly Progress</h3>
        </div>
        <AnimatePresence mode="wait">
          {data.monthlyProgress.length > 0 ? (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={BRAND_COLORS.primary}
                    strokeWidth={3}
                    name="Completed"
                    dot={{ r: 5, fill: BRAND_COLORS.primary }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke={BRAND_COLORS.secondary}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                    dot={{ r: 4, fill: BRAND_COLORS.secondary }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[300px] text-slate-400"
            >
              <Calendar className="w-12 h-12 mb-2 opacity-50" />
              <p>No monthly progress data available</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Data Freshness Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex items-center justify-center gap-2 text-xs text-slate-500"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live data • Auto-refreshes every 2 minutes</span>
      </motion.div>
    </div>
  );
}

