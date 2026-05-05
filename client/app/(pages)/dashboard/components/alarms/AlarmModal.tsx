'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, Play } from 'lucide-react';
import { playAlarmSound, stopAlarmSound } from '../../utils/sound.service';
import type { SoundFile } from '../../utils/sound.service';

export interface AlarmModalData {
  alarmId: string;
  title: string;
  message: string | null;
  soundFile: SoundFile;
  soundEnabled?: boolean;
  workoutPlanId: string | null;
  snoozeMinutes: number;
}

interface AlarmModalProps {
  isOpen: boolean;
  alarm: AlarmModalData | null;
  onDismiss: () => void;
  onSnooze: (alarmId: string, snoozeMinutes: number) => void;
  onAction?: (workoutPlanId: string) => void;
}

const PORTAL_Z = 10050;

export function AlarmModal({
  isOpen,
  alarm,
  onDismiss,
  onSnooze,
  onAction,
}: AlarmModalProps) {
  const [mounted, setMounted] = useState(false);
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDismiss = useCallback(() => {
    stopAlarmSound();
    hasPlayedSound.current = false;
    onDismiss();
  }, [onDismiss]);

  const handleSnooze = useCallback(() => {
    if (alarm) {
      stopAlarmSound();
      hasPlayedSound.current = false;
      onSnooze(alarm.alarmId, alarm.snoozeMinutes);
    }
  }, [alarm, onSnooze]);

  const handleAction = useCallback(() => {
    if (alarm?.workoutPlanId && onAction) {
      stopAlarmSound();
      hasPlayedSound.current = false;
      onAction(alarm.workoutPlanId);
    }
  }, [alarm, onAction]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && alarm) {
       
      console.log('[AlarmModal]', { isOpen, title: alarm.title });
    }

    if (isOpen && alarm && !hasPlayedSound.current) {
      const shouldPlaySound = alarm.soundEnabled !== false;
      if (shouldPlaySound) {
        playAlarmSound(alarm.soundFile, true);
      }
      hasPlayedSound.current = true;
    }

    if (!isOpen) {
      stopAlarmSound();
      hasPlayedSound.current = false;
    }

    return () => {
      if (!isOpen) {
        stopAlarmSound();
      }
    };
  }, [isOpen, alarm]);

  useEffect(() => {
    if (!isOpen || !alarm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, alarm, handleDismiss]);

  if (!mounted || !alarm) {
    return null;
  }

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key={alarm.alarmId}
          role="presentation"
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: PORTAL_Z }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="button"
            tabIndex={-1}
            aria-label="Dismiss alarm"
            className="absolute inset-0 bg-gradient-to-br from-black/90 via-slate-950/90 to-black/90 backdrop-blur-md cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDismiss();
              }
            }}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alarm-modal-title"
            aria-describedby={alarm.message ? 'alarm-modal-desc' : undefined}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{
              type: 'spring',
              damping: 22,
              stiffness: 320,
              mass: 0.85,
            }}
            className="relative z-10 max-w-md w-full perspective-1000"
            style={{ perspective: '1000px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="relative w-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-violet-500/15 to-emerald-400/25 rounded-3xl blur-2xl -z-10 scale-105" />

              <div className="relative rounded-3xl border border-white/[0.12] bg-gradient-to-br from-slate-900/98 via-slate-950/98 to-slate-900/98 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl overflow-hidden">
                <motion.div
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(139,92,246,0.05) 50%, rgba(16,185,129,0.08) 100%)',
                      'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(16,185,129,0.12) 100%)',
                      'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(139,92,246,0.05) 50%, rgba(16,185,129,0.08) 100%)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 pointer-events-none"
                />

                <div className="relative px-6 pt-8 pb-5 border-b border-white/[0.08]">
                  <div className="flex items-center justify-center mb-5">
                    <motion.div
                      animate={{
                        scale: [1, 1.12, 1],
                        rotate: [0, 6, -6, 0],
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="relative"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.35, 0.65, 0.35],
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-violet-600 blur-xl opacity-70"
                      />
                      <div className="relative w-[4.5rem] h-[4.5rem] rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-violet-700 flex items-center justify-center shadow-[0_12px_40px_rgba(16,185,129,0.45)] ring-2 ring-white/10">
                        <Bell className="w-9 h-9 text-white drop-shadow-md" strokeWidth={2.25} />
                      </div>
                    </motion.div>
                  </div>

                  <h2
                    id="alarm-modal-title"
                    className="text-2xl sm:text-3xl font-bold text-white text-center mb-2 tracking-tight"
                  >
                    {alarm.title}
                  </h2>

                  {alarm.message && (
                    <p
                      id="alarm-modal-desc"
                      className="text-slate-300 text-center text-sm leading-relaxed"
                    >
                      {alarm.message}
                    </p>
                  )}
                </div>

                <div className="relative px-6 py-6 space-y-5">
                  <div className="flex items-center justify-center gap-2 text-slate-200">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                      className="inline-flex"
                    >
                      <Clock className="w-5 h-5 text-emerald-400/90" />
                    </motion.span>
                    <span className="text-base font-semibold tabular-nums">
                      {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {alarm.workoutPlanId && onAction && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAction}
                        className="relative w-full overflow-hidden rounded-2xl px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5 shrink-0" />
                        Start Workout
                      </motion.button>
                    )}

                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSnooze}
                        className="flex-1 rounded-xl px-4 py-3 bg-white/[0.06] border border-white/[0.1] text-white font-medium hover:bg-white/[0.1] flex items-center justify-center gap-2 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        Snooze ({alarm.snoozeMinutes}m)
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDismiss}
                        className="flex-1 rounded-xl px-4 py-3 bg-white/[0.06] border border-white/[0.1] text-white font-medium hover:bg-white/[0.1] flex items-center justify-center gap-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Dismiss
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
