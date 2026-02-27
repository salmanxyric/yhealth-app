'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Minus, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api-client';

interface WaterLog {
  id: string;
  userId: string;
  logDate: string;
  glassesConsumed: number;
  targetGlasses: number;
  mlConsumed: number;
  targetMl: number;
  goalAchieved: boolean;
  xpEarned: number;
}

export function WaterIntakeWidget() {
  const [waterLog, setWaterLog] = useState<WaterLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const fetchWaterLog = useCallback(async () => {
    try {
      const response = await api.get<{ log: WaterLog }>('/water/today');
      if (response.success && response.data) {
        setWaterLog(response.data.log);
      }
    } catch (err) {
      console.error('Failed to fetch water log:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaterLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - request deduplication handles concurrent calls

  const handleAddGlass = async () => {
    setIsUpdating(true);
    try {
      const wasGoalAchieved = waterLog?.goalAchieved ?? false;
      const response = await api.post<{ log: WaterLog }>('/water/add-glass');
      if (response.success && response.data) {
        setWaterLog(response.data.log);

        // Dispatch event for other components (like UnifiedHealthDashboard)
        window.dispatchEvent(new CustomEvent('water-intake-updated'));

        // Show celebration if goal just achieved
        if (!wasGoalAchieved && response.data.log.goalAchieved) {
          setJustCompleted(true);
          setTimeout(() => setJustCompleted(false), 3000);
        }
      }
    } catch (err) {
      console.error('Failed to add water:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveGlass = async () => {
    if (!waterLog || waterLog.glassesConsumed <= 0) return;

    setIsUpdating(true);
    try {
      const response = await api.post<{ log: WaterLog }>('/water/remove', {
        amountMl: 250,
      });
      if (response.success && response.data) {
        setWaterLog(response.data.log);
      }
    } catch (err) {
      console.error('Failed to remove water:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
        </div>
      </div>
    );
  }

  const glasses = waterLog?.glassesConsumed ?? 0;
  const target = waterLog?.targetGlasses ?? 8;
  const progress = Math.min((glasses / target) * 100, 100);
  const goalAchieved = waterLog?.goalAchieved ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        goalAchieved
          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      {/* Goal achieved celebration */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-cyan-500/30 backdrop-blur-sm z-10"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 mx-auto mb-2 rounded-full bg-cyan-500 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              <p className="text-cyan-400 font-semibold">Water Goal Achieved!</p>
              <p className="text-cyan-400/70 text-sm">+10 XP</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                goalAchieved ? 'bg-cyan-500' : 'bg-cyan-500/20'
              }`}
            >
              <Droplets className={`w-4 h-4 ${goalAchieved ? 'text-white' : 'text-cyan-400'}`} />
            </div>
            <span className="font-medium text-white">Water Intake</span>
          </div>
          {goalAchieved && (
            <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded-full">
              Goal Met!
            </span>
          )}
        </div>

        {/* Progress Display */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-3xl font-bold text-white">{glasses}</span>
            <span className="text-slate-400 ml-1">/ {target} glasses</span>
          </div>
          <span className="text-sm text-slate-400">
            {waterLog?.mlConsumed ?? 0} ml
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              goalAchieved
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
          />
        </div>

        {/* Glass Indicators */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: target }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-6 rounded transition-all ${
                i < glasses
                  ? 'bg-cyan-500'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleRemoveGlass}
            disabled={isUpdating || glasses <= 0}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-5 h-5 text-slate-400" />
          </button>

          <button
            onClick={handleAddGlass}
            disabled={isUpdating}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              isUpdating
                ? 'bg-cyan-500/50 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-white'
            }`}
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Glass
              </>
            )}
          </button>

          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>
    </motion.div>
  );
}
