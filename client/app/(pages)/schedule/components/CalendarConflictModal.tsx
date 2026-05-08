'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Calendar,
  Clock,
  ArrowRight,
  Dumbbell,
  UtensilsCrossed,
  Layers,
  Shield,
  Loader2,
} from 'lucide-react';
import type { ScheduleConflict, ConflictResolution } from '@/src/shared/services/schedule.service';

interface CalendarConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: ScheduleConflict | null;
  onResolve: (notificationId: string, resolution: ConflictResolution) => Promise<boolean>;
}

function formatTime(hhmm: string | null): string {
  if (!hhmm) return '?';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function CalendarConflictModal({
  isOpen,
  onClose,
  conflict,
  onResolve,
}: CalendarConflictModalProps) {
  const [resolving, setResolving] = useState<ConflictResolution | null>(null);

  if (typeof window === 'undefined' || !conflict) return null;

  const handleResolve = async (resolution: ConflictResolution) => {
    setResolving(resolution);
    const success = await onResolve(conflict.notificationId, resolution);
    if (!success) setResolving(null);
  };

  const isPlan = conflict.conflictSource === 'plan';

  const resolutionOptions: Array<{
    key: ConflictResolution;
    label: string;
    description: string;
    icon: typeof ArrowRight;
    color: string;
    hoverBg: string;
    iconBg: string;
  }> = isPlan
    ? [
        {
          key: 'keep_both',
          label: 'Add to Schedule',
          description: 'Add the plan item alongside the existing item — they will overlap.',
          icon: Layers,
          color: 'text-amber-400',
          hoverBg: 'hover:bg-amber-500/10 hover:border-amber-500/30',
          iconBg: 'bg-amber-500/15',
        },
        {
          key: 'remove_existing',
          label: 'Replace Existing',
          description: 'Remove the existing item and add the plan item instead.',
          icon: ArrowRight,
          color: 'text-sky-400',
          hoverBg: 'hover:bg-sky-500/10 hover:border-sky-500/30',
          iconBg: 'bg-sky-500/15',
        },
        {
          key: 'keep_existing',
          label: 'Skip Plan Item',
          description: 'Keep your current schedule — don\'t add this plan item.',
          icon: Shield,
          color: 'text-emerald-400',
          hoverBg: 'hover:bg-emerald-500/10 hover:border-emerald-500/30',
          iconBg: 'bg-emerald-500/15',
        },
      ]
    : [
        {
          key: 'remove_existing',
          label: 'Replace with Calendar Event',
          description: 'Remove your scheduled item and keep the Google Calendar event.',
          icon: ArrowRight,
          color: 'text-sky-400',
          hoverBg: 'hover:bg-sky-500/10 hover:border-sky-500/30',
          iconBg: 'bg-sky-500/15',
        },
        {
          key: 'keep_both',
          label: 'Keep Both',
          description: 'Keep both items on your schedule — they will overlap.',
          icon: Layers,
          color: 'text-amber-400',
          hoverBg: 'hover:bg-amber-500/10 hover:border-amber-500/30',
          iconBg: 'bg-amber-500/15',
        },
        {
          key: 'keep_existing',
          label: 'Keep Existing',
          description: 'Dismiss this conflict and keep your scheduled item as-is.',
          icon: Shield,
          color: 'text-emerald-400',
          hoverBg: 'hover:bg-emerald-500/10 hover:border-emerald-500/30',
          iconBg: 'bg-emerald-500/15',
        },
      ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/25 rounded-2xl shadow-2xl z-[10000] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="w-11 h-11 rounded-full bg-amber-500/20 flex items-center justify-center"
                  >
                    <AlertTriangle className="w-5.5 h-5.5 text-amber-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Schedule Conflict</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isPlan
                        ? 'A plan item overlaps with your schedule'
                        : 'A Google Calendar event overlaps with your schedule'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Conflicting Items */}
            <div className="px-6 py-4 space-y-3">
              {/* Incoming Item (Google Calendar or Plan) */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className={`p-3.5 rounded-xl ${
                  isPlan
                    ? 'bg-violet-500/[0.07] border border-violet-500/20'
                    : 'bg-sky-500/[0.07] border border-sky-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {isPlan ? (
                    <>
                      {conflict.planItem?.category === 'exercise' ? (
                        <Dumbbell className="w-3.5 h-3.5 text-violet-400" />
                      ) : (
                        <UtensilsCrossed className="w-3.5 h-3.5 text-violet-400" />
                      )}
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                        {conflict.planItem?.category === 'exercise' ? 'Workout Plan' : 'Nutrition Plan'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                        Google Calendar
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm font-semibold text-white">
                  {isPlan ? conflict.planItem?.title : conflict.googleEvent?.title}
                </p>
                {isPlan && conflict.planItem?.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{conflict.planItem.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-300">
                    {formatTime(isPlan ? conflict.planItem?.startTime ?? null : conflict.googleEvent?.startTime ?? null)}
                    {' — '}
                    {formatTime(isPlan ? conflict.planItem?.endTime ?? null : conflict.googleEvent?.endTime ?? null)}
                  </span>
                </div>
              </motion.div>

              {/* VS Divider */}
              <div className="flex items-center gap-3 px-2">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/80">
                  Conflicts with
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Existing Schedule Item */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-3.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    Your Schedule
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {isPlan ? conflict.existingItem?.title : conflict.manualItem?.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-300">
                    {formatTime(isPlan ? conflict.existingItem?.startTime ?? null : conflict.manualItem?.startTime ?? null)}
                    {' — '}
                    {formatTime(isPlan ? conflict.existingItem?.endTime ?? null : conflict.manualItem?.endTime ?? null)}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Resolution Options */}
            <div className="px-6 pb-6 pt-2 space-y-2">
              <p className="text-xs text-slate-500 mb-3">How would you like to resolve this?</p>

              {resolutionOptions.map((opt, i) => {
                const Icon = opt.icon;
                const isResolving = resolving === opt.key;
                const isDisabled = resolving !== null;

                return (
                  <motion.button
                    key={opt.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    onClick={() => handleResolve(opt.key)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] ${opt.hoverBg} transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${opt.iconBg} flex items-center justify-center shrink-0`}>
                      {isResolving ? (
                        <Loader2 className={`w-4 h-4 ${opt.color} animate-spin`} />
                      ) : (
                        <Icon className={`w-4 h-4 ${opt.color}`} />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{opt.label}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{opt.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
