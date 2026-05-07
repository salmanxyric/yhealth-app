'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Timer, Loader2, AlertCircle,
  Dumbbell, Activity, Heart, Utensils, Moon, Brain,
  Droplets, Footprints, Zap, CheckCircle2, SkipForward,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { api } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface CalendarDay {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  isToday: boolean;
  activities: {
    total: number;
    completed: number;
    completionRate: number;
  };
  healthLogs: number;
  duration: number;
  hasActivity: boolean;
}

interface ActivityLog {
  id: string;
  type: string;
  title: string;
  description: string;
  completedAt: string;
  duration: number | null;
  pillar: string;
  source: 'activity' | 'health_data';
  metrics?: Record<string, unknown>;
}

interface DayDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: CalendarDay | null;
  onRefresh: () => void;
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  meal: Utensils,
  sleep: Moon,
  mindfulness: Brain,
  recovery: Heart,
  habit: Zap,
  check_in: Heart,
  water: Droplets,
  steps: Footprints,
};

const activityColors: Record<string, { gradient: string; color: string }> = {
  workout: { gradient: 'from-orange-500 to-red-500', color: '#f97316' },
  meal: { gradient: 'from-green-500 to-emerald-500', color: '#22c55e' },
  sleep: { gradient: 'from-indigo-500 to-purple-500', color: '#818cf8' },
  mindfulness: { gradient: 'from-cyan-500 to-blue-500', color: '#06b6d4' },
  recovery: { gradient: 'from-emerald-500 to-teal-500', color: '#10b981' },
  habit: { gradient: 'from-yellow-500 to-amber-500', color: '#f59e0b' },
  check_in: { gradient: 'from-pink-500 to-rose-500', color: '#ec4899' },
  water: { gradient: 'from-blue-400 to-cyan-500', color: '#3b82f6' },
  steps: { gradient: 'from-teal-500 to-green-500', color: '#14b8a6' },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function DayDetailSheet({ open, onOpenChange, day, onRefresh }: DayDetailSheetProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDayActivities = useCallback(async () => {
    if (!day) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ activities: ActivityLog[] }>(
        `/activity/recent?limit=50&startDate=${day.date}&endDate=${day.date}`,
      );
      setActivities(res.data?.activities ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [day]);

  useEffect(() => {
    if (open && day) {
      fetchDayActivities();
    }
  }, [open, day, fetchDayActivities]);

  const handleComplete = async (logId: string) => {
    try {
      await api.post(`/activity/logs/${logId}/complete`);
      toast.success('Activity completed');
      fetchDayActivities();
      onRefresh();
    } catch {
      toast.error('Failed to complete activity');
    }
  };

  const handleSkip = async (logId: string) => {
    try {
      await api.post(`/activity/logs/${logId}/skip`);
      toast.success('Activity skipped');
      fetchDayActivities();
      onRefresh();
    } catch {
      toast.error('Failed to skip activity');
    }
  };

  if (!day) return null;

  const dayDate = new Date(day.date + 'T00:00:00');
  const dayLabel = dayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-slate-900 border-white/10 text-white w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b border-white/[0.06]">
          <SheetTitle className="text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/25">
              <Calendar className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-base font-semibold">{dayLabel}</p>
              <div className="flex items-center gap-2 mt-1">
                {day.activities.total > 0 ? (
                  <>
                    <span className="text-xs text-slate-400">
                      {day.activities.completed}/{day.activities.total} completed
                    </span>
                    <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                        style={{ width: `${day.activities.completionRate}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        day.activities.completionRate === 100
                          ? 'text-emerald-400'
                          : day.activities.completionRate >= 50
                          ? 'text-yellow-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.activities.completionRate}%
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500">No activities</span>
                )}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="pt-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Activity className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-sm text-slate-400 mb-1">No activities for this day</p>
              <p className="text-xs text-slate-600">Activities will appear here once logged</p>
            </div>
          ) : (
            activities.map((activity, i) => {
              const colors = activityColors[activity.type] || activityColors.habit;
              const IconComp = activityIcons[activity.type] || Activity;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex items-start gap-3 p-3.5 rounded-xl hover:bg-white/[0.03] transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors.gradient} shrink-0`}
                    style={{ boxShadow: `0 4px 12px ${colors.color}33` }}
                  >
                    <IconComp className="w-4 h-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-white">{activity.title}</h4>
                    {activity.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(activity.completedAt)}
                      </span>
                      {activity.duration && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Timer className="w-3 h-3" />
                          {activity.duration}m
                        </span>
                      )}
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          color: colors.color,
                          background: `${colors.color}15`,
                          border: `1px solid ${colors.color}30`,
                        }}
                      >
                        {activity.pillar}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleComplete(activity.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                      title="Mark complete"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSkip(activity.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                      title="Skip"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
