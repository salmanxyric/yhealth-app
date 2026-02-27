"use client";

import { motion } from "framer-motion";
import {
  Zap,

  Clock,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Star,
  Brain,
  Gauge,
} from "lucide-react";
import { useOnboarding } from "@/src/features/onboarding/context/OnboardingContext";
import type { AssessmentMode } from "@/src/types";

interface ModeOption {
  id: AssessmentMode;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  duration: string;
  features: string[];
  recommended?: boolean;
  gradient: string;
  iconBg: string;
  accent: string;
}

const modeOptions: ModeOption[] = [
  {
    id: "quick",
    icon: <Zap className="w-7 h-7" />,
    title: "Quick Assessment",
    subtitle: "Get started fast with essential questions",
    duration: "3-5 minutes",
    features: [
      "6-8 targeted questions",
      "Core health insights",
      "Instant plan generation",
      "Perfect for busy schedules",
    ],
    recommended: true,
    gradient: "from-cyan-500/15 via-teal-500/10 to-transparent",
    iconBg: "bg-gradient-to-br from-cyan-500 to-teal-500",
    accent: "border-cyan-500/50 shadow-cyan-500/20",
  },
  {
    id: "deep",
    icon: <Brain className="w-7 h-7" />,
    title: "Deep Assessment",
    subtitle: "Comprehensive analysis for maximum personalization",
    duration: "10-15 minutes",
    features: [
      "Conversational AI coaching",
      "In-depth lifestyle analysis",
      "Detailed personalized insights",
      "Premium action plan",
    ],
    gradient: "from-purple-500/15 via-fuchsia-500/10 to-transparent",
    iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-500",
    accent: "border-purple-500/50 shadow-purple-500/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export function AssessmentModeStep() {
  const { assessmentMode, setAssessmentMode, nextStep, prevStep, selectedGoal } =
    useOnboarding();

  const handleModeSelect = (mode: AssessmentMode) => {
    setAssessmentMode(mode);
  };

  const getGoalTitle = () => {
    const goalTitles: Record<string, string> = {
      weight_loss: "losing weight",
      muscle_building: "building muscle",
      sleep_improvement: "better sleep",
      stress_wellness: "stress management",
      energy_productivity: "boosting energy",
      event_training: "event training",
      health_condition: "health management",
      habit_building: "habit building",
      overall_optimization: "health optimization",
      custom: "your custom goal",
    };
    return goalTitles[selectedGoal || ""] || "your health journey";
  };

  const canContinue = assessmentMode !== null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Header */}
      <motion.div
        className="text-center mb-10 md:mb-14"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-fuchsia-500/10 border border-cyan-500/20 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-400">
            Choose your assessment style
          </span>
        </motion.div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          How Would You Like to{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Proceed
          </span>
          ?
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Choose how you&apos;d like us to learn about you for {getGoalTitle()}.
          Either option creates a personalized plan tailored to your needs.
        </p>
      </motion.div>

      {/* Mode Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {modeOptions.map((mode) => {
          const isSelected = assessmentMode === mode.id;

          return (
            <motion.button
              key={mode.id}
              variants={cardVariants}
              onClick={() => handleModeSelect(mode.id)}
              className={`
                group relative p-6 sm:p-8 rounded-2xl text-left transition-all duration-300
                border backdrop-blur-sm overflow-hidden
                ${
                  isSelected
                    ? `${mode.accent} bg-white/10 shadow-xl`
                    : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-700/80"
                }
              `}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Gradient */}
              <div
                className={`
                  absolute inset-0 bg-gradient-to-br ${mode.gradient}
                  transition-opacity duration-500
                  ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}
                `}
              />

              {/* Recommended Badge */}
              {mode.recommended && (
                <motion.div
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/30"
                  initial={{ opacity: 0, scale: 0, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <Star className="w-3 h-3" />
                  Recommended
                </motion.div>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  className="absolute top-4 left-4 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Content */}
              <div className="relative z-10 mt-4">
                {/* Icon */}
                <div
                  className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center mb-5
                    ${mode.iconBg} text-white shadow-lg
                    ${isSelected ? "shadow-cyan-500/30" : "shadow-slate-900/50"}
                  `}
                >
                  {mode.icon}
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {mode.title}
                </h3>
                <p className="text-slate-400 mb-4 text-sm sm:text-base">
                  {mode.subtitle}
                </p>

                {/* Duration Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 mb-5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">
                    {mode.duration}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {mode.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3 text-sm sm:text-base"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                    >
                      <div
                        className={`
                          w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                          ${isSelected ? "bg-cyan-500/20" : "bg-slate-700/50"}
                        `}
                      >
                        <Check
                          className={`w-3 h-3 ${
                            isSelected ? "text-cyan-400" : "text-slate-500"
                          }`}
                          strokeWidth={3}
                        />
                      </div>
                      <span
                        className={`${
                          isSelected ? "text-slate-200" : "text-slate-400"
                        } group-hover:text-slate-300 transition-colors`}
                      >
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Hover Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Info Box */}
      <motion.div
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-800/50 via-slate-800/30 to-slate-800/50 border border-slate-700/50 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm sm:text-base text-slate-300">
              <span className="text-cyan-400 font-medium">Pro tip:</span>{" "}
              You can switch modes anytime. Start with Quick and upgrade to Deep
              later for more personalization.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          onClick={prevStep}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-400 hover:text-white transition-colors"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Back
        </motion.button>

        <motion.button
          onClick={nextStep}
          disabled={!canContinue}
          className={`
            group relative flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-base
            transition-all duration-300 overflow-hidden
            ${
              canContinue
                ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }
          `}
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
        >
          {canContinue && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          )}
          <span className="relative z-10">
            {assessmentMode === "quick"
              ? "Start Quick Assessment"
              : assessmentMode === "deep"
                ? "Start Deep Assessment"
                : "Select a Mode"}
          </span>
          <ArrowRight
            className={`
              w-5 h-5 relative z-10 transition-transform duration-300
              ${canContinue ? "group-hover:translate-x-1" : ""}
            `}
          />
        </motion.button>
      </motion.div>
    </div>
  );
}
