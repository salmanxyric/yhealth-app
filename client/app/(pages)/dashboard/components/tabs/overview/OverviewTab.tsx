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
import { LayoutDashboard, BarChart3, Award, Bell, Sparkles } from 'lucide-react';
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

// Premium Tab Button Component
function PremiumTabButton({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
  index,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 ${
        isActive
          ? 'text-white'
          : 'text-slate-400 hover:text-white'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Active background with glow */}
      {isActive && (
        <motion.div
          layoutId="activeTabBg"
          className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl"
          initial={false}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          style={{
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4), 0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}
      
      {/* Hover background */}
      {!isActive && (
        <motion.div
          className="absolute inset-0 bg-white/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity"
        />
      )}

      {/* Icon with animation */}
      <motion.span
        className="relative z-10"
        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.span>
      
      {/* Label */}
      <span className="relative z-10 whitespace-nowrap">{label}</span>

      {/* Active indicator dot */}
      {isActive && (
        <motion.span
          className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
          }}
        />
      )}
    </motion.button>
  );
}

// Animated Tab Content Wrapper
function TabContent({ children, tabId }: { children: React.ReactNode; tabId: string }) {
  return (
    <motion.div
      key={tabId}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
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
        setEnhancedHealthMetrics(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch enhanced health metrics:', err);
    }
  }, []);

  // Initial fetch
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
  }, []);

  // Auto-refresh enhanced health metrics
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEnhancedHealthMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const handleWaterUpdate = () => {
      setTimeout(() => {
        fetchEnhancedHealthMetrics();
      }, 500);
    };
    
    window.addEventListener('water-intake-updated', handleWaterUpdate);
    
    const pollInterval = setInterval(() => {
      fetchEnhancedHealthMetrics();
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('water-intake-updated', handleWaterUpdate);
      clearInterval(pollInterval);
    };
  }, [fetchEnhancedHealthMetrics]);

  // Refetch weekly activity when selection changes
  useEffect(() => {
    fetchWeeklyActivity(selectedWeek);
  }, [selectedWeek]);

  // Handle add water
  const handleAddWater = async () => {
    try {
      const response = await api.post<{ log: { glassesConsumed: number; mlConsumed: number } }>('/water/add-glass');
      
      if (response.success && response.data?.log) {
        const newGlasses = response.data.log.glassesConsumed;
        
        setEnhancedHealthMetrics((prev) => {
          if (!prev) {
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
        
        window.dispatchEvent(new CustomEvent('water-intake-updated'));
        
        setTimeout(async () => {
          await fetchEnhancedHealthMetrics();
        }, 500);
      }
    } catch (err) {
      console.error('Failed to add water:', err);
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
      {/* Premium Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-x-auto scrollbar-hide">
          {tabs.map((tab, index) => (
            <PremiumTabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              index={index}
            />
          ))}
        </div>
        
        {/* Decorative bottom glow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </motion.div>

      {/* Tab Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <TabContent key="dashboard" tabId="dashboard">
            <div className="space-y-6">
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

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Schedule & Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-2 space-y-6"
                >
                  {/* Today's Schedule */}
                  <div className="glass-premium rounded-3xl p-1">
                    <TodaySchedule
                      todayData={todayData}
                      plan={plan}
                      onActivityComplete={onActivityComplete}
                      onRefresh={onRefresh}
                    />
                  </div>

                  {/* Weekly Overview Chart */}
                  <div className="glass-premium rounded-3xl p-1">
                    <WeeklyChart
                      weeklyActivity={weeklyActivity}
                      selectedWeek={selectedWeek}
                      onWeekChange={setSelectedWeek}
                    />
                  </div>
                </motion.div>

                {/* Right Column - Widgets */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  {/* XP & Level Widget */}
                  <motion.div 
                    className="glass-premium rounded-2xl p-1"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <XPLevelWidget />
                  </motion.div>

                  {/* Water Intake Widget */}
                  <motion.div 
                    className="glass-premium rounded-2xl p-1"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <WaterIntakeWidget />
                  </motion.div>

                  {/* Emotional Wellbeing Widget */}
                  <motion.div 
                    className="glass-premium rounded-2xl p-1"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <EmotionTrendsWidget compact />
                  </motion.div>

                  {/* Current Plan Card */}
                  {plan && (
                    <motion.div 
                      className="glass-premium rounded-2xl p-1"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <CurrentPlanCard plan={plan} />
                    </motion.div>
                  )}

                  {/* Weekly Focus */}
                  <motion.div 
                    className="glass-premium rounded-2xl p-1"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <WeeklyFocus weeklySummary={weeklySummary} />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </TabContent>
        )}

        {activeTab === 'analytics' && (
          <TabContent key="analytics" tabId="analytics">
            <div className="glass-premium rounded-3xl p-6">
              <AnalyticsTab />
            </div>
          </TabContent>
        )}

        {activeTab === 'scoring' && (
          <TabContent key="scoring" tabId="scoring">
            <div className="glass-premium rounded-3xl p-6">
              <ScoringTab />
            </div>
          </TabContent>
        )}

        {activeTab === 'alarms' && (
          <TabContent key="alarms" tabId="alarms">
            <div className="glass-premium rounded-3xl p-6">
              <AlarmsTab />
            </div>
          </TabContent>
        )}
      </AnimatePresence>
    </div>
  );
}
