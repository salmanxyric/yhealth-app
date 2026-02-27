'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Target, Zap } from 'lucide-react';
import { useCallback, useRef, useState, useEffect } from 'react';

interface DurationSelectorProps {
  value: number;
  onChange: (weeks: number) => void;
  disabled?: boolean;
}

const DURATION_PRESETS = [
  { weeks: 2, label: '2 weeks', description: 'Quick start', icon: Zap },
  { weeks: 4, label: '4 weeks', description: 'Recommended', icon: Target },
  { weeks: 8, label: '8 weeks', description: 'Build habits', icon: Clock },
  { weeks: 12, label: '12 weeks', description: 'Full transform', icon: Calendar },
];

/**
 * DurationSelector - Select plan duration in weeks
 *
 * Features:
 * - Preset duration options with descriptions
 * - Custom slider for fine-tuning
 * - Visual feedback on selection
 */
export function DurationSelector({ value, onChange, disabled = false }: DurationSelectorProps) {
  const isCustomValue = !DURATION_PRESETS.some((p) => p.weeks === value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [_sliderWidth, setSliderWidth] = useState(0);

  // Calculate percentage for filled track
  const fillPercentage = ((value - 1) / (12 - 1)) * 100;

  // Update slider width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (sliderRef.current) {
        setSliderWidth(sliderRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle drag interaction
  const handleInteraction = useCallback(
    (clientX: number) => {
      if (disabled || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round(1 + percentage * 11);
      onChange(newValue);
    },
    [disabled, onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleInteraction(e.clientX);
    },
    [disabled, handleInteraction]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        handleInteraction(e.clientX);
      }
    },
    [isDragging, handleInteraction]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      setIsDragging(true);
      handleInteraction(e.touches[0].clientX);
    },
    [disabled, handleInteraction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging) {
        handleInteraction(e.touches[0].clientX);
      }
    },
    [isDragging, handleInteraction]
  );

  // Global mouse events for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Plan Duration</h3>
          <p className="text-slate-400 text-sm">How long should your health plan run?</p>
        </div>
      </div>

      {/* Preset Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {DURATION_PRESETS.map((preset) => {
          const isSelected = value === preset.weeks;
          const IconComponent = preset.icon;

          return (
            <button
              key={preset.weeks}
              onClick={() => onChange(preset.weeks)}
              disabled={disabled}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Recommended Badge */}
              {preset.weeks === 4 && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-white">
                  Best
                </span>
              )}

              <IconComponent
                className={`w-5 h-5 mb-2 transition-colors ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}
              />
              <p className={`font-bold text-lg transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {preset.label}
              </p>
              <p className={`text-xs transition-colors ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}>
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Custom Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Fine-tune duration</span>
          <motion.span
            key={value}
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sm font-medium text-white"
          >
            {value} week{value !== 1 ? 's' : ''}
            {isCustomValue && (
              <span className="ml-2 text-xs text-cyan-400">(Custom)</span>
            )}
          </motion.span>
        </div>

        {/* Custom Slider Track */}
        <div
          ref={sliderRef}
          className={`relative h-3 rounded-full cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* Background Track */}
          <div className="absolute inset-0 bg-slate-700 rounded-full overflow-hidden">
            {/* Tick marks */}
            <div className="absolute inset-0 flex items-center justify-between px-1">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className={`w-0.5 h-1.5 rounded-full transition-colors duration-200 ${
                    i + 1 <= value ? 'bg-cyan-300/50' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Filled Track */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
            initial={false}
            animate={{ width: `${fillPercentage}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          {/* Thumb */}
          <motion.div
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg shadow-cyan-500/30 border-2 border-cyan-500 ${
              isDragging ? 'scale-110' : ''
            } transition-transform duration-150`}
            initial={false}
            animate={{
              left: `calc(${fillPercentage}% - 10px)`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ touchAction: 'none' }}
          >
            {/* Inner glow */}
            <div className="absolute inset-1 rounded-full bg-cyan-400/30" />
          </motion.div>
        </div>

        {/* Track labels */}
        <div className="flex justify-between px-0.5 pointer-events-none">
          {[1, 4, 8, 12].map((week) => (
            <span
              key={week}
              className={`text-[10px] transition-colors duration-200 ${
                value === week ? 'text-cyan-400 font-semibold' : 'text-slate-500'
              }`}
            >
              {week}w
            </span>
          ))}
        </div>
      </div>

      {/* Duration Info */}
      <motion.div
        className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-sm text-slate-300">
          {value <= 2 && (
            <>
              <span className="text-amber-400 font-medium">Quick Start:</span> Ideal for
              testing the waters or building a single habit. You&apos;ll see initial progress
              but sustainable change takes longer.
            </>
          )}
          {value > 2 && value <= 4 && (
            <>
              <span className="text-emerald-400 font-medium">Recommended:</span> Perfect
              balance of commitment and results. Enough time to build habits and see
              measurable progress.
            </>
          )}
          {value > 4 && value <= 8 && (
            <>
              <span className="text-cyan-400 font-medium">Habit Builder:</span> Excellent
              for lasting change. Research shows 66 days to form a habit - you&apos;ll have
              time to solidify new behaviors.
            </>
          )}
          {value > 8 && (
            <>
              <span className="text-purple-400 font-medium">Full Transformation:</span>{' '}
              Comprehensive journey for significant change. Perfect for major fitness goals
              or complete lifestyle overhauls.
            </>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
}
