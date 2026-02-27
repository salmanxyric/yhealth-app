'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Sparkles,
  Target,
  Activity,
  Apple,
  Moon,
  Brain,
  Heart,
  Zap,
  TrendingUp,
  Dumbbell,
  Leaf,
  Coffee,
  Flame,
  Shield,
  Star,
  ChevronRight,
  Lightbulb,
  ThumbsUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MCQQuestion, MCQOption } from './types';

interface MCQQuestionCardProps {
  question: MCQQuestion;
  selectedOptions: MCQOption[];
  onToggleOption: (option: MCQOption) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  progress?: number;
}

// Category-specific icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  lifestyle: Coffee,
  fitness: Dumbbell,
  nutrition: Apple,
  sleep: Moon,
  stress: Brain,
  goals: Target,
};

// Option icons based on common patterns
const getOptionIcon = (index: number, category: string): React.ComponentType<{ className?: string }> => {
  const iconSets: Record<string, React.ComponentType<{ className?: string }>[]> = {
    lifestyle: [Coffee, Activity, Heart, Zap],
    fitness: [Dumbbell, Flame, TrendingUp, Star],
    nutrition: [Apple, Leaf, Heart, Sparkles],
    sleep: [Moon, Shield, Star, Sparkles],
    stress: [Brain, Heart, Shield, Sparkles],
    goals: [Target, TrendingUp, Star, Flame],
  };
  const icons = iconSets[category] || iconSets.goals;
  return icons[index % icons.length];
};

export function MCQQuestionCard({
  question,
  selectedOptions,
  onToggleOption,
  onSubmit,
  isSubmitting = false,
  progress = 0,
}: MCQQuestionCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Generate contextual feedback when options are selected
  useEffect(() => {
    if (selectedOptions.length > 0) {
      const option = selectedOptions[selectedOptions.length - 1];
      const feedback = generateFeedback(option, question.category);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFeedbackMessage(feedback);
      setShowFeedback(true);

      // Hide feedback after 3 seconds
      const timer = setTimeout(() => setShowFeedback(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedOptions, question.category]);

  const categoryColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    lifestyle: {
      bg: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
    },
    fitness: {
      bg: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/20',
    },
    nutrition: {
      bg: 'from-green-500/20 to-lime-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-green-500/20',
    },
    sleep: {
      bg: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
      glow: 'shadow-indigo-500/20',
    },
    stress: {
      bg: 'from-pink-500/20 to-rose-500/20',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
      glow: 'shadow-pink-500/20',
    },
    goals: {
      bg: 'from-violet-500/20 to-fuchsia-500/20',
      border: 'border-violet-500/30',
      text: 'text-violet-400',
      glow: 'shadow-violet-500/20',
    },
  };

  const colors = categoryColors[question.category] || categoryColors.goals;
  const CategoryIcon = categoryIcons[question.category] || Target;

  const isOptionSelected = (option: MCQOption) => selectedOptions.some((o) => o.id === option.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Assessment Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        className={cn(
          'rounded-3xl p-6 md:p-8 bg-gradient-to-br border backdrop-blur-xl shadow-2xl',
          colors.bg,
          colors.border,
          colors.glow
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <motion.div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br',
              colors.bg,
              'border',
              colors.border
            )}
            whileHover={{ rotate: 5, scale: 1.05 }}
          >
            <CategoryIcon className={cn('w-6 h-6', colors.text)} />
          </motion.div>
          <div className="flex-1">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', colors.text)}>
              {question.category}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-1 leading-tight">
              {question.question}
            </h3>
          </div>
        </div>

        {/* Select All Hint */}
        {question.allowMultiple && (
          <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>Select all that apply</span>
          </div>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.options.map((option, index) => {
            const isSelected = isOptionSelected(option);
            const OptionIcon = getOptionIcon(index, question.category);

            return (
              <motion.button
                key={option.id}
                onClick={() => onToggleOption(option)}
                disabled={isSubmitting}
                className={cn(
                  'relative flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group',
                  isSelected
                    ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 border-violet-400/50 shadow-lg shadow-violet-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
                whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : undefined}
                whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                layout
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg'
                      : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                  )}
                >
                  {isSelected ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <OptionIcon className={cn('w-6 h-6', isSelected ? 'text-white' : 'text-slate-400')} />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'font-semibold text-base block',
                      isSelected ? 'text-white' : 'text-slate-200'
                    )}
                  >
                    {option.text}
                  </span>
                  {option.insightValue && (
                    <span className="text-xs text-slate-400 mt-0.5 block truncate">
                      {option.insightValue}
                    </span>
                  )}
                </div>

                {/* Selection Ring Effect */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-violet-400/50 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    layoutId={`selection-${option.id}`}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* AI Feedback Banner */}
        <AnimatePresence>
          {showFeedback && feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-4"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-cyan-300 font-medium">AI Coach Insight</p>
                  <p className="text-sm text-slate-300 mt-1">{feedbackMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          onClick={onSubmit}
          disabled={selectedOptions.length === 0 || isSubmitting}
          className={cn(
            'w-full mt-6 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3',
            selectedOptions.length > 0
              ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50'
              : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
          )}
          whileHover={selectedOptions.length > 0 ? { scale: 1.02, y: -2 } : undefined}
          whileTap={selectedOptions.length > 0 ? { scale: 0.98 } : undefined}
        >
          {isSubmitting ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>Processing...</span>
            </>
          ) : selectedOptions.length > 0 ? (
            <>
              <ThumbsUp className="w-5 h-5" />
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <span>Select an option to continue</span>
          )}
        </motion.button>

        {/* Suggestion Tip */}
        <motion.div
          className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Sparkles className="w-3 h-3" />
          <span>Your answers help us create a personalized health plan</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Generate contextual feedback based on selected option
function generateFeedback(option: MCQOption, category: string): string {
  const feedbackTemplates: Record<string, string[]> = {
    lifestyle: [
      "Great insight! Understanding your daily routine helps us optimize your plan.",
      "This tells us a lot about how to fit healthy habits into your schedule.",
      "Your lifestyle patterns will shape personalized recommendations.",
    ],
    fitness: [
      "Perfect! We'll tailor exercises to match your current activity level.",
      "This helps us create a progressive workout plan just for you.",
      "Your fitness background guides our intensity recommendations.",
    ],
    nutrition: [
      "Good to know! We'll suggest meals that fit your eating style.",
      "This helps us create realistic nutrition goals for you.",
      "Understanding your habits helps us make sustainable changes.",
    ],
    sleep: [
      "Sleep is crucial for recovery - we'll factor this into your plan.",
      "Quality rest is foundational. We'll help optimize your sleep.",
      "Your sleep patterns influence energy and performance recommendations.",
    ],
    stress: [
      "Mental wellness is key. We'll include stress management strategies.",
      "Understanding your stress helps us balance your wellness plan.",
      "We'll incorporate mindfulness practices suited to your needs.",
    ],
    goals: [
      "Excellent motivation! This drives your personalized plan.",
      "Your 'why' is powerful - we'll keep this front and center.",
      "Understanding your goals helps us prioritize what matters most.",
    ],
  };

  const templates = feedbackTemplates[category] || feedbackTemplates.goals;
  return templates[Math.floor(Math.random() * templates.length)];
}
