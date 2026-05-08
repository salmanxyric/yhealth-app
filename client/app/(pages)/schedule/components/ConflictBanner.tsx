'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { ScheduleConflict } from '@/src/shared/services/schedule.service';

interface ConflictBannerProps {
  conflicts: ScheduleConflict[];
  onReviewConflict: (conflict: ScheduleConflict) => void;
}

export function ConflictBanner({ conflicts, onReviewConflict }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="rounded-xl overflow-hidden border border-amber-500/25"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)',
        }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-amber-300">
              {conflicts.length} Schedule {conflicts.length === 1 ? 'Conflict' : 'Conflicts'}
            </p>
          </div>

          <div className="space-y-1.5">
            {conflicts.map((c) => {
              const isPlan = c.conflictSource === 'plan';
              const incomingTitle = isPlan ? c.planItem?.title : c.googleEvent?.title;
              const existingTitle = isPlan ? c.existingItem?.title : c.manualItem?.title;
              const incomingColor = isPlan ? 'text-violet-400' : 'text-sky-400';

              return (
                <button
                  key={c.notificationId}
                  onClick={() => onReviewConflict(c)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-amber-500/20 transition-all group cursor-pointer"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-white truncate">
                      <span className={incomingColor}>{incomingTitle}</span>
                      {' vs '}
                      <span className="text-emerald-400">{existingTitle}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
