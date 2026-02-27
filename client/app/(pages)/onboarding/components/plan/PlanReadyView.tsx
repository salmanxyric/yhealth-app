'use client';

import { motion } from 'framer-motion';
import { Check, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import type { PlanReadyViewProps } from './types';
import { PrimaryGoalCard } from './PrimaryGoalCard';
import { ActivityCard } from './ActivityCard';
import { MilestoneCard } from './MilestoneCard';
import { StartPlanButton } from './StartPlanButton';

/**
 * PlanReadyView - Displays the generated plan with activities and milestones
 *
 * Features:
 * - Success header with animation
 * - Coach message based on style
 * - Primary goal card
 * - Week 1 activities
 * - First milestone
 * - Start plan CTA
 * - Warning banner for non-AI plans
 */
export function PlanReadyView({
  plan,
  goals,
  coachMessage,
  onStartPlan,
  isStarting,
  error,
  planSource = 'ai',
}: PlanReadyViewProps) {
  const primaryGoal = goals.find((g) => g.isPrimary) || goals[0];
  const showFallbackWarning = planSource !== 'ai';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Warning Banner for non-AI plans */}
      {showFallbackWarning && (
        <FallbackWarningBanner planSource={planSource} />
      )}

      {/* Success Header */}
      <PlanReadyHeader coachMessage={coachMessage} />

      {/* Primary Goal Card */}
      <PrimaryGoalCard goal={primaryGoal} />

      {/* Week 1 Activities */}
      <ActivitiesSection activities={plan.activities} />

      {/* First Milestone */}
      {plan.milestones[0] && <MilestoneCard milestone={plan.milestones[0]} />}

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Start Button */}
      <StartPlanButton onClick={onStartPlan} isStarting={isStarting} />
    </motion.div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function PlanReadyHeader({ coachMessage }: { coachMessage: string }) {
  return (
    <motion.div
      className="text-center mb-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
        Your Plan is{' '}
        <span className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Ready!
        </span>
      </h1>
      <p className="text-slate-400 text-lg max-w-xl mx-auto">{coachMessage}</p>
    </motion.div>
  );
}

interface ActivitiesSectionProps {
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    days: string[];
    time: string;
    icon: React.ReactNode;
  }>;
}

function ActivitiesSection({ activities }: ActivitiesSectionProps) {
  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-400" />
        Your Week 1 Activities
      </h2>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <ActivityCard key={activity.id} activity={activity} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.div
      className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      <p className="text-red-400 text-sm">{message}</p>
    </motion.div>
  );
}

function FallbackWarningBanner({ planSource }: { planSource: 'ai' | 'fallback' | 'mock' }) {
  const message = planSource === 'mock'
    ? "We couldn't generate a personalized plan. You're seeing a template plan that you can customize later."
    : "Your plan was generated using basic settings. Some personalized features may be limited.";

  return (
    <motion.div
      className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-amber-300 text-sm font-medium">
          {planSource === 'mock' ? 'Template Plan' : 'Basic Plan'}
        </p>
        <p className="text-amber-400/80 text-sm mt-1">{message}</p>
      </div>
    </motion.div>
  );
}
