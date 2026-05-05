'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Plus,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  Calendar,
  Music,
  RefreshCw,
  Volume2,
  ChevronRight,
  Zap,
  Timer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { DashboardCard } from '../overview/widgets/DashboardCard';
import { confirm } from '@/components/common/ConfirmDialog';
import { AVAILABLE_SOUNDS, type SoundFile } from '../../../utils/sound.service';

interface WorkoutAlarm {
  id: string;
  title: string;
  message: string | null;
  alarmTime: string;
  daysOfWeek: number[];
  isEnabled: boolean;
  nextTriggerAt: string | null;
  soundEnabled: boolean;
  soundFile: string;
  vibrationEnabled: boolean;
  snoozeMinutes: number;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ALARM_FORM_MODAL_Z = 10040;

export function AlarmsTab() {
  const [alarms, setAlarms] = useState<WorkoutAlarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formModalMounted, setFormModalMounted] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<WorkoutAlarm | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('Workout Reminder');
  const [formTime, setFormTime] = useState('07:00');
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [formSound, setFormSound] = useState(true);
  const [formSoundFile, setFormSoundFile] = useState<SoundFile>('alarm.wav');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAlarms = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get<{ alarms: WorkoutAlarm[] }>('/alarms');
      if (response.success && response.data) {
        setAlarms(response.data.alarms);
      } else {
        setAlarms([]);
      }
    } catch (err) {
      console.error('Failed to fetch alarms:', err);
      setAlarms([]);
      setError('Failed to load alarms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlarms();
  }, [fetchAlarms]);

  useEffect(() => {
    setFormModalMounted(true);
  }, []);

  const handleToggle = async (alarm: WorkoutAlarm) => {
    try {
      const response = await api.patch<{ alarm: WorkoutAlarm }>(`/alarms/${alarm.id}/toggle`);
      if (response.success && response.data) {
        setAlarms((prev) =>
          prev.map((a) => (a.id === alarm.id ? response.data!.alarm : a))
        );
      }
    } catch (err) {
      console.error('Failed to toggle alarm:', err);
    }
  };

  const handleDelete = async (alarmId: string) => {
    const confirmed = await confirm({
      title: 'Delete Alarm',
      description: 'Are you sure you want to delete this alarm? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await api.delete(`/alarms/${alarmId}`);
      if (response.success) {
        setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
      }
    } catch (err) {
      console.error('Failed to delete alarm:', err);
    }
  };

  const openAddModal = () => {
    setFormTitle('Workout Reminder');
    setFormTime('07:00');
    setFormDays([1, 2, 3, 4, 5]);
    setFormSound(true);
    setFormSoundFile('alarm.wav');
    setFormMessage('');
    setEditingAlarm(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (alarm: WorkoutAlarm) => {
    setFormTitle(alarm.title);
    setFormTime(alarm.alarmTime);
    setFormDays(alarm.daysOfWeek);
    setFormSound(alarm.soundEnabled);
    setFormSoundFile((alarm.soundFile as SoundFile) || 'alarm.wav');
    setFormMessage(alarm.message || '');
    setEditingAlarm(alarm);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingAlarm(null);
  };

  useEffect(() => {
    if (!isAddModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setEditingAlarm(null);
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isAddModalOpen]);

  const toggleDay = (day: number) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async () => {
    if (formDays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    setIsSubmitting(true);
    try {
      // Normalize time to HH:MM format (remove seconds if present)
      const normalizedTime = formTime.includes(':')
        ? formTime.split(':').slice(0, 2).map(part => part.padStart(2, '0')).join(':')
        : formTime;

      // Validate time format
      if (!/^\d{2}:\d{2}$/.test(normalizedTime)) {
        console.error('Invalid time format:', formTime, 'normalized to:', normalizedTime);
        setError('Time must be in HH:MM format (e.g., 12:40)');
        setIsSubmitting(false);
        return;
      }

      // Get client's timezone to send with the request
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (editingAlarm) {
        // Update existing
        const response = await api.patch<{ alarm: WorkoutAlarm }>(
          `/alarms/${editingAlarm.id}`,
          {
            title: formTitle,
            message: formMessage || null,
            alarmTime: normalizedTime,
            daysOfWeek: formDays,
            soundEnabled: formSound,
            soundFile: formSoundFile,
            timezone: clientTimezone,
          }
        );
        if (response.success && response.data) {
          setAlarms((prev) =>
            prev.map((a) => (a.id === editingAlarm.id ? response.data!.alarm : a))
          );
        }
      } else {
        // Create new
        const response = await api.post<{ alarm: WorkoutAlarm }>('/alarms', {
          title: formTitle,
          message: formMessage || null,
          alarmTime: normalizedTime,
          daysOfWeek: formDays,
          soundEnabled: formSound,
          soundFile: formSoundFile,
          timezone: clientTimezone,
        });
        if (response.success && response.data) {
          setAlarms((prev) => [...prev, response.data!.alarm]);
        }
      }
      closeModal();
      setError(null); // Clear any previous errors
    } catch (err: unknown) {
      console.error('Failed to save alarm:', err);
      // Extract error message from ApiError or response
      let errorMessage = 'Failed to save alarm. Please try again.';
      const errObj = err as Record<string, unknown>;
      if (errObj?.message && typeof errObj.message === 'string') {
        errorMessage = errObj.message;
      } else if (errObj?.error) {
        errorMessage = typeof errObj.error === 'string' ? errObj.error : ((errObj.error as Record<string, unknown>)?.message as string) || errorMessage;
      } else if ((errObj?.response as Record<string, unknown>)?.data) {
        const respData = (errObj.response as Record<string, unknown>).data as Record<string, unknown>;
        if (respData?.error) {
          errorMessage = typeof respData.error === 'string'
            ? respData.error
            : ((respData.error as Record<string, unknown>)?.message as string) || errorMessage;
        }
      }
      setError(errorMessage);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (JSON.stringify([...days].sort()) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays';
    if (JSON.stringify([...days].sort()) === JSON.stringify([0, 6])) return 'Weekends';
    return days.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ');
  };

  const formatNextTrigger = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return 'Passed';
    if (diff < 60 * 1000) return 'In less than a minute';
    if (diff < 60 * 60 * 1000) {
      const mins = Math.round(diff / (60 * 1000));
      return `In ${mins} min`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      const mins = Math.round((diff % (60 * 60 * 1000)) / (60 * 1000));
      return `In ${hours}h ${mins}m`;
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bell className="w-6 h-6 text-violet-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <DashboardCard accent="violet" padding="md" hoverable={false} className="!p-4 sm:!p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                <Bell className="w-5 h-5 text-violet-300" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  Alarms
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Workout reminders and schedules
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    const response = await api.post<{ updated: number }>('/alarms/recalculate');
                    if (response.success) {
                      const n = response.data?.updated ?? 0;
                      toast.success(`Recalculated ${n} alarm${n === 1 ? '' : 's'}`);
                      fetchAlarms();
                    } else {
                      toast.error('Could not recalculate alarms');
                    }
                  } catch (err) {
                    console.error('Failed to recalculate alarms:', err);
                    toast.error('Failed to recalculate alarms');
                  }
                }}
                className="group px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.07] text-sm font-medium transition-colors flex items-center gap-2"
                title="Recalculate alarm trigger times"
              >
                <RefreshCw className="w-4 h-4 text-violet-400/90 group-hover:rotate-180 transition-transform duration-500" />
                <span className="hidden sm:inline">Recalculate</span>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAddModal}
                className="px-4 py-2 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-sm font-semibold shadow-lg shadow-violet-900/25 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add alarm</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-white font-medium tabular-nums">{alarms.filter((a) => a.isEnabled).length}</span>
              active
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-white font-medium tabular-nums">{alarms.filter((a) => !a.isEnabled).length}</span>
              inactive
            </span>
            <span className="inline-flex items-center gap-2 text-slate-400">
              <Timer className="w-3.5 h-3.5 text-violet-400/80 shrink-0" />
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Alarms Grid */}
      {alarms.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <DashboardCard accent="violet" padding="lg" hoverable={false} className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-violet-400/90" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No alarms yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">
              Add a reminder so you never miss a planned workout.
            </p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/20 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create alarm
            </motion.button>
          </DashboardCard>
        </motion.div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {alarms.map((alarm, index) => (
            <motion.div
              key={alarm.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={alarm.isEnabled ? '' : 'opacity-[0.72]'}
            >
              <DashboardCard
                accent={alarm.isEnabled ? 'violet' : 'none'}
                padding="md"
                hoverable
                className="h-full"
              >
              <div className="relative">
                {/* Top row: Time and toggle */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
                      alarm.isEnabled
                        ? 'bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-600/30'
                        : 'bg-slate-700/50'
                    }`}>
                      <span className={`text-lg sm:text-xl font-bold ${alarm.isEnabled ? 'text-white' : 'text-slate-400'}`}>
                        {alarm.alarmTime.split(':')[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${alarm.isEnabled ? 'text-white' : 'text-slate-400'}`}>
                          {formatTime(alarm.alarmTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs sm:text-sm font-medium ${alarm.isEnabled ? 'text-violet-300' : 'text-slate-500'}`}>
                          {alarm.title}
                        </span>
                        {alarm.isEnabled && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] sm:text-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggle(alarm)}
                      className={`p-2 sm:p-2.5 rounded-xl transition-all ${
                        alarm.isEnabled
                          ? 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-400'
                          : 'bg-slate-700/50 hover:bg-slate-700 text-slate-400'
                      }`}
                      title={alarm.isEnabled ? 'Disable' : 'Enable'}
                    >
                      {alarm.isEnabled ? (
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(alarm)}
                      className="p-2 sm:p-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(alarm.id)}
                      className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Message if exists */}
                {alarm.message && (
                  <p className="text-slate-400 text-xs sm:text-sm mb-3 line-clamp-1">{alarm.message}</p>
                )}

                {/* Info row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                    <span>{formatDays(alarm.daysOfWeek)}</span>
                  </div>

                  {alarm.soundEnabled && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                      <span>
                        {AVAILABLE_SOUNDS.find((s) => s.value === alarm.soundFile)?.label || alarm.soundFile}
                      </span>
                    </div>
                  )}

                  {alarm.nextTriggerAt && alarm.isEnabled && (
                    <div className="flex items-center gap-1.5 text-violet-300">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="font-medium">{formatNextTrigger(alarm.nextTriggerAt)}</span>
                    </div>
                  )}
                </div>

                {/* Day indicators */}
                <div className="flex gap-1 sm:gap-1.5">
                  {DAY_LABELS.map((label, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                        alarm.daysOfWeek.includes(idx)
                          ? alarm.isEnabled
                            ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                            : 'bg-slate-700 text-slate-400'
                          : 'bg-slate-800/50 text-slate-600'
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal — portaled to body for true viewport centering (avoids transformed ancestors) */}
      {formModalMounted &&
        createPortal(
          <AnimatePresence mode="wait">
            {isAddModalOpen && (
              <motion.div
                key="alarm-form-overlay"
                role="presentation"
                className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 min-[480px]:p-8"
                style={{ zIndex: ALARM_FORM_MODAL_Z }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  aria-hidden
                  className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeModal}
                />

                <motion.div
                  key="alarm-form-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="alarm-form-title"
                  initial={{ opacity: 0, scale: 0.94, y: 28 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 20 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                  className="relative z-[1] w-full max-w-lg max-h-[min(92dvh,52rem)] mx-auto flex flex-col rounded-3xl border border-white/10 bg-slate-950/95 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_64px_-24px_rgba(0,0,0,0.75)] backdrop-blur-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
                  <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/12 via-transparent to-transparent opacity-90" />

                  {/* Header */}
                  <div className="relative shrink-0 px-5 sm:px-6 pt-5 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-lg shadow-violet-900/40 ring-1 ring-white/10">
                          {editingAlarm ? (
                            <Edit2 className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : (
                            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3
                            id="alarm-form-title"
                            className="text-lg sm:text-xl font-semibold tracking-tight text-white"
                          >
                            {editingAlarm ? 'Edit alarm' : 'Create alarm'}
                          </h3>
                          <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                            {editingAlarm
                              ? 'Update time, days, and sound for this reminder.'
                              : 'Schedule a workout reminder that fits your routine.'}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={closeModal}
                        className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
                    {/* Time Input */}
                    <div>
                      <label className="block text-sm font-medium text-violet-300 mb-2">
                        Alarm Time
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                        <input
                          type="time"
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 sm:py-4 bg-slate-800/50 border border-violet-500/20 hover:border-violet-500/40 focus:border-violet-500 rounded-xl sm:rounded-2xl text-white text-xl sm:text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-violet-300 mb-2">
                        Alarm Name
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-violet-500/20 hover:border-violet-500/40 focus:border-violet-500 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                        placeholder="Workout Reminder"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-violet-300 mb-2">
                        Message <span className="text-slate-500">(Optional)</span>
                      </label>
                      <textarea
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-violet-500/20 hover:border-violet-500/40 focus:border-violet-500 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none transition-all"
                        placeholder="Time for your workout!"
                        rows={2}
                      />
                    </div>

                    {/* Days */}
                    <div>
                      <label className="block text-sm font-medium text-violet-300 mb-2">
                        Repeat Days
                      </label>
                      <div className="flex gap-1.5 sm:gap-2">
                        {DAY_NAMES.map((name, index) => (
                          <motion.button
                            key={index}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleDay(index)}
                            className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                              formDays.includes(index)
                                ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-violet-500/10'
                            }`}
                          >
                            {DAY_LABELS[index]}
                          </motion.button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {formDays.length === 7
                          ? 'Every day'
                          : formDays.length === 5 && !formDays.includes(0) && !formDays.includes(6)
                          ? 'Weekdays'
                          : formDays.length === 2 && formDays.includes(0) && formDays.includes(6)
                          ? 'Weekends'
                          : formDays.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ') || 'Select days'}
                      </p>
                    </div>

                    {/* Sound */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-violet-300">Sound</label>
                        <motion.button
                          type="button"
                          role="switch"
                          aria-checked={formSound}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setFormSound(!formSound)}
                          className={`inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                            formSound
                              ? 'bg-gradient-to-r from-violet-600 to-violet-500 shadow-md shadow-violet-900/35'
                              : 'bg-slate-700'
                          }`}
                        >
                          <motion.span
                            layout
                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                            className={`block h-6 w-6 rounded-full bg-white shadow-sm ring-1 ring-black/10 ${
                              formSound ? 'ml-auto' : 'mr-auto'
                            }`}
                          />
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {formSound && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="relative">
                              <Music className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                              <select
                                value={formSoundFile}
                                onChange={(e) => setFormSoundFile(e.target.value as SoundFile)}
                                className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-800/50 border border-violet-500/20 rounded-xl sm:rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                              >
                                {AVAILABLE_SOUNDS.map((sound) => (
                                  <option key={sound.value} value={sound.value} className="bg-slate-900">
                                    {sound.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 rotate-90" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2"
                        >
                          <X className="h-4 w-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions */}
                  <div className="relative shrink-0 border-t border-white/[0.06] bg-slate-950/90 px-5 sm:px-6 py-4">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={closeModal}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08] hover:text-white"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/35 transition-all hover:from-violet-500 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Saving…</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-5 w-5" />
                            <span>{editingAlarm ? 'Save changes' : 'Create alarm'}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
