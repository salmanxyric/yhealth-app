'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Timer, Check,
  Loader2, AlertCircle, RotateCcw, Moon,
  ChevronDown, Dumbbell, Activity, Heart, Sun, Utensils,
  Droplets, Brain, Star,
} from 'lucide-react';
import Link from 'next/link';
import {
  scheduleService,
  type DailySchedule,
  type ScheduleItem,
  type CalendarSchedule,
} from '@/src/shared/services/schedule.service';
import { ScheduleItemActions } from '@/app/(pages)/dashboard/components/tabs/overview/ScheduleItemActions';
import { EditScheduleItemModal } from '@/app/(pages)/dashboard/components/tabs/overview/EditScheduleItemModal';
import { CalendarConflictModal } from './components/CalendarConflictModal';
import { ConflictBanner } from './components/ConflictBanner';
import { useCalendarConflicts } from '@/hooks/use-calendar-conflicts';
import { confirm } from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';

interface TC {
  color: string;
  rgb: string;
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const TYPE_MAP: Record<string, TC> = {
  workout:     { color: '#f97316', rgb: '249,115,22',  gradient: 'from-orange-500 to-amber-600',   Icon: Dumbbell },
  exercise:    { color: '#f97316', rgb: '249,115,22',  gradient: 'from-orange-500 to-amber-600',   Icon: Activity },
  cardio:      { color: '#f43f5e', rgb: '244,63,94',   gradient: 'from-rose-500 to-pink-600',      Icon: Heart },
  morning:     { color: '#fbbf24', rgb: '251,191,36',  gradient: 'from-amber-400 to-yellow-500',   Icon: Sun },
  meal:        { color: '#a855f7', rgb: '168,85,247',  gradient: 'from-purple-500 to-violet-600',  Icon: Utensils },
  nutrition:   { color: '#a855f7', rgb: '168,85,247',  gradient: 'from-purple-500 to-violet-600',  Icon: Utensils },
  water:       { color: '#06b6d4', rgb: '6,182,212',   gradient: 'from-cyan-500 to-sky-600',       Icon: Droplets },
  sleep:       { color: '#818cf8', rgb: '129,140,248', gradient: 'from-indigo-400 to-violet-500',  Icon: Moon },
  rest:        { color: '#818cf8', rgb: '129,140,248', gradient: 'from-indigo-400 to-violet-500',  Icon: Moon },
  meditation:  { color: '#ec4899', rgb: '236,72,153',  gradient: 'from-pink-500 to-rose-600',      Icon: Brain },
  mindfulness: { color: '#ec4899', rgb: '236,72,153',  gradient: 'from-pink-500 to-rose-600',      Icon: Brain },
};

const getTC = (type: string): TC =>
  TYPE_MAP[type] ?? {
    color: '#10b981', rgb: '16,185,129',
    gradient: 'from-emerald-500 to-teal-600', Icon: Activity,
  };

function formatTimeStr(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (formatDate(date) === formatDate(today)) return 'Today';
  if (formatDate(date) === formatDate(yesterday)) return 'Yesterday';
  if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

interface ScheduleActivityForEdit {
  id: string;
  type: string;
  title: string;
  description: string;
  preferredTime: string;
  duration?: number;
  status: string;
}

function mapScheduleItemToActivity(item: ScheduleItem): ScheduleActivityForEdit {
  return {
    id: item.id,
    type: item.category?.toLowerCase() || 'other',
    title: item.title,
    description: item.description || '',
    preferredTime: item.startTime,
    duration: item.durationMinutes ?? undefined,
    status: item.completed ? 'completed' : 'pending',
  };
}

export function ScheduleFullView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState<DailySchedule | null>(null);
  const [historyDays, setHistoryDays] = useState<CalendarSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<ScheduleActivityForEdit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [historySchedules, setHistorySchedules] = useState<Record<string, DailySchedule>>({});

  const dateStr = formatDate(selectedDate);
  const {
    conflicts,
    activeConflict,
    isModalOpen: isConflictModalOpen,
    resolveConflict,
    openConflictModal,
    closeConflictModal,
    fetchConflicts,
  } = useCalendarConflicts(dateStr);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateStr = formatDate(selectedDate);
      const pastStart = new Date(selectedDate);
      pastStart.setDate(pastStart.getDate() - 7);

      const [scheduleRes, historyRes] = await Promise.all([
        scheduleService.getScheduleByDate(dateStr),
        scheduleService.getCalendarSchedules(formatDate(pastStart), dateStr),
      ]);

      setSchedule(scheduleRes.data?.schedule ?? null);
      setHistoryDays(
        (historyRes.data?.schedules ?? [])
          .filter((d) => d.date !== dateStr)
          .reverse(),
      );
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateDate = (dir: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === 'next' ? 1 : -1));
    setSelectedDate(d);
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingActivity(mapScheduleItemToActivity(item));
    setIsEditModalOpen(true);
  };

  const handleDelete = async (item: ScheduleItem) => {
    const confirmed = await confirm({
      title: 'Delete Schedule Item',
      description: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await scheduleService.deleteScheduleItem(item.id);
      toast.success('Schedule item deleted');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleToggleComplete = async (item: ScheduleItem) => {
    try {
      await scheduleService.updateScheduleItem(item.id, {});
      toast.success(item.completed ? 'Marked as pending' : 'Marked as complete');
      fetchData();
    } catch {
      toast.error('Failed to update item');
    }
  };

  const loadHistorySchedule = async (date: string) => {
    if (historySchedules[date]) return;
    try {
      const res = await scheduleService.getScheduleByDate(date);
      if (res.data?.schedule) {
        setHistorySchedules((prev) => ({ ...prev, [date]: res.data!.schedule! }));
      }
    } catch {
      // Silently fail for history
    }
  };

  const toggleHistoryDay = (date: string) => {
    if (expandedHistory === date) {
      setExpandedHistory(null);
    } else {
      setExpandedHistory(date);
      loadHistorySchedule(date);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    );
  }

  const items = schedule?.items ?? [];
  const sortedItems = [...items].sort((a, b) => {
    const [ah, am] = a.startTime.split(':').map(Number);
    const [bh, bm] = b.startTime.split(':').map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });
  const completedCount = items.filter((i) => i.completed).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Date Navigation Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.065) 0%, rgba(14,165,233,0.02) 60%, transparent 100%)',
          border: '1px solid rgba(14,165,233,0.13)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2.5 rounded-xl bg-white/5 border border-white/[0.06] hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25">
                <Calendar className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{formatDateLabel(selectedDate)}</h1>
                <p className="text-xs text-slate-500">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2.5 rounded-xl bg-white/5 border border-white/[0.06] hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/[0.06]">
                <div className="text-xs text-slate-400">
                  {completedCount}/{items.length} done
                </div>
                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      </motion.div>

      {/* Conflict Banner */}
      <ConflictBanner conflicts={conflicts} onReviewConflict={openConflictModal} />

      {/* Schedule Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-[#0F1419] border border-white/[0.06] overflow-hidden"
      >
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            Schedule
          </h2>
          <span className="text-xs text-slate-500">{items.length} items</span>
        </div>

        {sortedItems.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {sortedItems.map((item, i) => {
              const cfg = getTC(item.category?.toLowerCase() || '');
              const IconComp = cfg.Icon;
              const isManual = item.source === 'manual';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group/item flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-all"
                >
                  {/* Time */}
                  <div className="w-16 sm:w-20 text-right shrink-0">
                    <span className="text-xs sm:text-sm font-medium text-slate-400">
                      {formatTimeStr(item.startTime)}
                    </span>
                  </div>

                  {/* Timeline dot */}
                  <div className="shrink-0">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: item.completed ? '#10b981' : cfg.color,
                        boxShadow: `0 0 8px ${item.completed ? 'rgba(16,185,129,0.4)' : `rgba(${cfg.rgb},0.4)`}`,
                      }}
                    />
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${cfg.gradient} shrink-0`}
                    style={{
                      opacity: item.completed ? 0.5 : 1,
                      boxShadow: `0 4px 12px rgba(${cfg.rgb},0.3)`,
                    }}
                  >
                    <IconComp className="w-4 h-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium text-sm ${
                        item.completed ? 'text-slate-500 line-through' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {item.durationMinutes && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Timer className="w-3 h-3" />
                          {item.durationMinutes}m
                        </span>
                      )}
                      {item.category && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            color: cfg.color,
                            background: `rgba(${cfg.rgb},0.1)`,
                            border: `1px solid rgba(${cfg.rgb},0.2)`,
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                      {item.completed && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          Done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isManual && (
                      <ScheduleItemActions
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item)}
                      />
                    )}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleToggleComplete(item)}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                      style={{
                        background: item.completed
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${
                          item.completed ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'
                        }`,
                      }}
                    >
                      <Check
                        className={`w-4 h-4 ${
                          item.completed ? 'text-emerald-400' : 'text-transparent group-hover/item:text-white/20'
                        } transition-colors`}
                      />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Star className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 mb-2">No items scheduled for this day</p>
            <Link
              href="/dashboard?tab=plans"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-0.5 transition-colors"
            >
              Create a plan <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </motion.div>

      {/* History Section */}
      {historyDays.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-[#0F1419] border border-white/[0.06] overflow-hidden"
        >
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              Recent History
            </h2>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {historyDays.map((day) => {
              const dayDate = new Date(day.date + 'T00:00:00');
              const isExpanded = expandedHistory === day.date;
              const daySchedule = historySchedules[day.date];

              return (
                <div key={day.date}>
                  <button
                    onClick={() => toggleHistoryDay(day.date)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-400">{dayDate.getDate()}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' · '}
                          {day.itemCount} items
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {day.hasSchedule && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-medium text-sky-400 bg-sky-500/10">
                          Scheduled
                        </span>
                      )}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          {daySchedule ? (
                            daySchedule.items.length > 0 ? (
                              <div className="space-y-2">
                                {daySchedule.items
                                  .sort((a, b) => {
                                    const [ah, am] = a.startTime.split(':').map(Number);
                                    const [bh, bm] = b.startTime.split(':').map(Number);
                                    return ah * 60 + am - (bh * 60 + bm);
                                  })
                                  .map((item) => {
                                    const cfg = getTC(item.category?.toLowerCase() || '');
                                    const IconComp = cfg.Icon;
                                    return (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                                      >
                                        <div
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${cfg.gradient}`}
                                          style={{ opacity: item.completed ? 0.5 : 1 }}
                                        >
                                          <IconComp className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                                            {item.title}
                                          </p>
                                          <p className="text-[11px] text-slate-500">
                                            {formatTimeStr(item.startTime)}
                                            {item.durationMinutes ? ` · ${item.durationMinutes}m` : ''}
                                          </p>
                                        </div>
                                        {item.completed && (
                                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 text-center py-3">No items</p>
                            )
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Back to Overview */}
      <div className="flex justify-center">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-sky-400 transition-colors inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Overview
        </Link>
      </div>

      {/* Edit Modal */}
      <EditScheduleItemModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        activity={editingActivity}
        onSuccess={fetchData}
      />

      {/* Calendar Conflict Resolution Modal */}
      <CalendarConflictModal
        isOpen={isConflictModalOpen}
        onClose={closeConflictModal}
        conflict={activeConflict}
        onResolve={async (notificationId, resolution) => {
          const success = await resolveConflict(notificationId, resolution);
          if (success) {
            toast.success(
              resolution === 'remove_existing'
                ? 'Existing item removed'
                : resolution === 'keep_both'
                  ? 'Both items kept on schedule'
                  : 'Conflict dismissed',
            );
            fetchData();
            fetchConflicts();
          } else {
            toast.error('Failed to resolve conflict');
          }
          return success;
        }}
      />
    </div>
  );
}
