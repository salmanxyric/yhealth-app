'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import type {
  Plan,
  TodayData,
  WeeklySummary,
  DashboardStats,
  WeeklyActivityData,
  HealthMetrics,
  QuickLogModalState,
} from './types';
import { StatsCards } from './StatsCards';
import { TodaySchedule } from './TodaySchedule';
import { WeeklyChart, type ActivityPeriod } from './WeeklyChart';
import { CurrentPlanCard } from './CurrentPlanCard';
import { WeeklyFocus } from './WeeklyFocus';
import { WaterIntakeWidget, XPLevelWidget } from '../../gamification';
import { EmotionTrendsWidget } from '../../wellbeing';
import { AnalyticsTab } from './AnalyticsTab';
import { ScoringTab } from './ScoringTab';
import { AlarmsTab } from '../alarms/AlarmsTab';
import { LayoutDashboard, BarChart3, Award, Bell } from 'lucide-react';
import { UnifiedHealthDashboard } from './widgets/UnifiedHealthDashboard';
import type { EnhancedHealthMetrics } from './widgets/UnifiedHealthDashboard';

interface OverviewTabProps {
  plan: Plan | null;
  todayData: TodayData | null;
  weeklySummary: WeeklySummary | null;
  weekCompletionRate: number;
  onActivityComplete: (activityId: string) => void;
  onRefresh?: () => void;
}

export function OverviewTab({
  plan,
  todayData,
  weeklySummary,
  weekCompletionRate,
  onActivityComplete,
  onRefresh,
}: OverviewTabProps) {
  // State for dynamic data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData | null>(null);
  const [_healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [enhancedHealthMetrics, setEnhancedHealthMetrics] = useState<EnhancedHealthMetrics | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<ActivityPeriod>('current');
  const [_isLoggingQuickAction, setIsLoggingQuickAction] = useState(false);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await api.get<DashboardStats>('/stats/dashboard');
      if (response.success && response.data) {
        setDashboardStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  }, []);

  // Fetch weekly activity data
  const fetchWeeklyActivity = useCallback(async (week: ActivityPeriod) => {
    try {
      const response = await api.get<WeeklyActivityData>('/stats/weekly-activity', {
        params: { week },
      });
      if (response.success && response.data) {
        setWeeklyActivity(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch weekly activity:', err);
    }
  }, []);

  // Fetch health metrics
  const fetchHealthMetrics = useCallback(async () => {
    try {
      const response = await api.get<{ metrics: HealthMetrics }>('/stats/health-metrics');
      if (response.success && response.data) {
        setHealthMetrics(response.data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch health metrics:', err);
    }
  }, []);

  // Fetch enhanced health metrics
  const fetchEnhancedHealthMetrics = useCallback(async () => {
    try {
      const response = await api.get<EnhancedHealthMetrics>('/stats/enhanced-health-metrics');
      if (response.success && response.data) {
        console.log('[OverviewTab] Enhanced health metrics fetched:', {
          water: response.data.water,
          calories: response.data.calories,
          nutrition: response.data.nutrition,
          heartRate: response.data.heartRate,
          timestamp: new Date().toISOString(),
        });
        setEnhancedHealthMetrics(response.data);
      } else {
        // Set default values if response is not successful
        console.warn('Enhanced health metrics response was not successful:', response);
      }
    } catch (err) {
      console.error('Failed to fetch enhanced health metrics:', err);
      // Don't set default here - let the component handle null state with defaults
    }
  }, []);

  // Initial fetch - only once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setIsLoadingStats(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchWeeklyActivity('current'),
        fetchHealthMetrics(),
        fetchEnhancedHealthMetrics(),
      ]);
      if (isMounted) {
        setIsLoadingStats(false);
      }
    };
    fetchAll();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-refresh enhanced health metrics when page becomes visible (e.g., after adding water elsewhere)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEnhancedHealthMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for custom water update events
    const handleWaterUpdate = () => {
      console.log('[OverviewTab] Water update event received, refreshing metrics...');
      // Add a small delay to ensure database is updated
      setTimeout(() => {
        fetchEnhancedHealthMetrics();
      }, 500);
    };
    
    window.addEventListener('water-intake-updated', handleWaterUpdate);
    
    // Also poll periodically to catch updates from other tabs/components
    const pollInterval = setInterval(() => {
      fetchEnhancedHealthMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('water-intake-updated', handleWaterUpdate);
      clearInterval(pollInterval);
    };
  }, [fetchEnhancedHealthMetrics]);

  // Refetch weekly activity when selection changes
  useEffect(() => {
    fetchWeeklyActivity(selectedWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]); // Only depend on selectedWeek

  // Handle quick log
  const _handleQuickLog = async (type: QuickLogModalState['type'], value?: number, duration?: number) => {
    if (!type) return;

    setIsLoggingQuickAction(true);
    try {
      await api.post('/stats/quick-log', {
        type,
        value,
        duration,
      });

      // Refresh data
      await Promise.all([
        fetchDashboardStats(),
        fetchHealthMetrics(),
        fetchEnhancedHealthMetrics(),
      ]);
    } catch (err) {
      console.error('Failed to log quick action:', err);
    } finally {
      setIsLoggingQuickAction(false);
    }
  };

  // Handle add water - use proper water endpoint
  const handleAddWater = async () => {
    try {
      console.log('[OverviewTab] Adding water glass...');
      // Use the proper water endpoint which updates water_intake_logs
      const response = await api.post<{ log: { glassesConsumed: number; mlConsumed: number } }>('/water/add-glass');
      console.log('[OverviewTab] Water add response:', response);
      
      if (response.success && response.data?.log) {
        const newGlasses = response.data.log.glassesConsumed;
        console.log('[OverviewTab] Updating water to:', newGlasses, 'glasses');
        
        // Immediately update local state for instant feedback
        setEnhancedHealthMetrics((prev) => {
          if (!prev) {
            // If no previous data, create default structure
            return {
              steps: { value: null, target: 10000 },
              whoopAge: { value: null, chronologicalAge: null },
              water: { consumed: newGlasses, target: 8 },
              calories: { consumed: 0, burned: 0, target: 2200 },
              nutrition: {
                macros: { protein: 0, carbs: 0, fats: 0 },
                targets: { protein: 150, carbs: 200, fats: 65 },
              },
              heartRate: {
                current: null,
                resting: null,
                history: [],
              },
              analytics: {
                weeklyAvg: 0,
                consistencyScore: 0,
                dataPoints: 0,
                trend: 'stable' as const,
              },
            };
          }
          return {
            ...prev,
            water: {
              consumed: newGlasses,
              target: prev.water.target,
            },
          };
        });
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('water-intake-updated'));
        
        // Then refresh from server to ensure consistency (with delay to allow DB update)
        setTimeout(async () => {
          console.log('[OverviewTab] Refreshing enhanced health metrics after water add...');
          await fetchEnhancedHealthMetrics();
        }, 500);
      } else {
        console.warn('[OverviewTab] Water add response missing data, refreshing...');
        // If response doesn't have data, just refresh
        await fetchEnhancedHealthMetrics();
      }
    } catch (err) {
      console.error('[OverviewTab] Failed to add water:', err);
      // Refresh anyway to get latest state
      await fetchEnhancedHealthMetrics();
    }
  };

  // Computed values
  const completedToday = todayData?.completedCount || 0;
  const totalToday = todayData?.totalCount || 0;
  const todayProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const currentStreak = dashboardStats?.streak.current || 0;
  const weekChange = dashboardStats?.weekProgress.change || 0;
  const effectiveWeekRate = dashboardStats?.weekProgress.rate ?? weekCompletionRate;

  // Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'scoring' | 'alarms'>('dashboard');

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'scoring' as const, label: 'Scoring', icon: Award },
    { id: 'alarms' as const, label: 'Alarms', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Stats Cards */}
            <StatsCards
              completedToday={completedToday}
              totalToday={totalToday}
              todayProgress={todayProgress}
              effectiveWeekRate={effectiveWeekRate}
              weekChange={weekChange}
              currentStreak={currentStreak}
              plan={plan}
              isLoadingStats={isLoadingStats}
            />

            {/* Health Metrics Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              data-tour="health-dashboard"
            >
              <UnifiedHealthDashboard
                data={enhancedHealthMetrics || {
                  steps: { value: null, target: 10000 },
                  whoopAge: { value: null, chronologicalAge: null },
                  water: { consumed: 0, target: 8 },
                  calories: { consumed: 0, burned: 0, target: 2200 },
                  nutrition: {
                    macros: { protein: 0, carbs: 0, fats: 0 },
                    targets: { protein: 150, carbs: 200, fats: 65 },
                  },
                  heartRate: {
                    current: null,
                    resting: null,
                    history: [],
                  },
                  analytics: {
                    weeklyAvg: 0,
                    consistencyScore: 0,
                    dataPoints: 0,
                    trend: 'stable' as const,
                  },
                }}
                isLoading={isLoadingStats}
                onAddWater={handleAddWater}
              />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Today's Schedule */}
                <TodaySchedule
                  todayData={todayData}
                  plan={plan}
                  onActivityComplete={onActivityComplete}
                  onRefresh={onRefresh}
                />

                {/* Weekly Overview Chart */}
                <WeeklyChart
                  weeklyActivity={weeklyActivity}
                  selectedWeek={selectedWeek}
                  onWeekChange={setSelectedWeek}
                />
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* XP & Level Widget */}
                <div data-tour="xp-widget">
                  <XPLevelWidget />
                </div>

                {/* Water Intake Widget */}
                <WaterIntakeWidget />

                {/* Emotional Wellbeing Widget */}
                <EmotionTrendsWidget compact />

                {/* Current Plan Card */}
                {plan && <CurrentPlanCard plan={plan} />}

                {/* Weekly Focus */}
                <WeeklyFocus weeklySummary={weeklySummary} />

                {/* Health Metrics */}
                {/* <HealthMetricsSection
                  healthMetrics={healthMetrics}
                  isLoadingStats={isLoadingStats}
                /> */}

                {/* Quick Actions */}
                {/* <QuickActions
                  onQuickLog={handleQuickLog}
                  isLoggingQuickAction={isLoggingQuickAction}
                /> */}

                {/* Stats Summary */}
                {/* {dashboardStats && <StatsSummary dashboardStats={dashboardStats} />} */}
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AnalyticsTab />
          </motion.div>
        )}

        {activeTab === 'scoring' && (
          <motion.div
            key="scoring"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ScoringTab />
          </motion.div>
        )}

        {activeTab === 'alarms' && (
          <motion.div
            key="alarms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AlarmsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
