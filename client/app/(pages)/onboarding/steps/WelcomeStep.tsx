"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useOnboarding } from "@/src/features/onboarding/context/OnboardingContext";
import type { GoalCategory } from "@/src/types";
import Image from "next/image";

interface GoalOption {
  id: GoalCategory;
  icon: string;
  title: string;
  description: string;
}

const ICON_BASE = "/Onboardingicons";

const goalOptions: GoalOption[] = [
  {
    id: "weight_loss",
    icon: `${ICON_BASE}/Lose weight.svg`,
    title: "Lose Weight",
    description: "Achieve sustainable weight loss with personalized nutrition and exercise",
  },
  {
    id: "muscle_building",
    icon: `${ICON_BASE}/Build Muscle.svg`,
    title: "Build Muscle",
    description: "Gain strength and muscle mass with targeted training programs",
  },
  {
    id: "sleep_improvement",
    icon: `${ICON_BASE}/Sleep Better.svg`,
    title: "Sleep Better",
    description: "Optimize your sleep quality and wake up refreshed every day",
  },
  {
    id: "stress_wellness",
    icon: `${ICON_BASE}/Reduce Stress.svg`,
    title: "Reduce Stress",
    description: "Build resilience and manage stress through mindfulness practices",
  },
  {
    id: "energy_productivity",
    icon: `${ICON_BASE}/Boost Energy.svg`,
    title: "Boost Energy",
    description: "Increase your daily energy levels and productivity",
  },
  {
    id: "event_training",
    icon: `${ICON_BASE}/Train for event.svg`,
    title: "Train for Event",
    description: "Prepare for a marathon, competition, or special occasion",
  },
  {
    id: "health_condition",
    icon: `${ICON_BASE}/Manage Health.svg`,
    title: "Manage Health",
    description: "Support your health with lifestyle modifications for your condition",
  },
  {
    id: "overall_optimization",
    icon: `${ICON_BASE}/Optimize Health.svg`,
    title: "Optimize Health",
    description: "Improve overall wellness across all health pillars",
  },
  {
    id: "fitness",
    icon: `${ICON_BASE}/Yoga Classes.svg`,
    title: "Yoga Classes",
    description: "Build flexibility, balance, and inner calm through guided yoga",
  },
  {
    id: "custom",
    icon: `${ICON_BASE}/Custom Goal.svg`,
    title: "Custom Goal",
    description: "Define your own unique health and wellness objective",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 16,
    },
  },
};

export function WelcomeStep() {
  const {
    selectedGoal,
    setSelectedGoal,
    customGoalText,
    setCustomGoalText,
    nextStep,
  } = useOnboarding();

  const [showCustomInput, setShowCustomInput] = useState(
    selectedGoal === "custom"
  );

  const handleGoalSelect = (goalId: GoalCategory) => {
    setSelectedGoal(goalId);
    setShowCustomInput(goalId === "custom");
    if (goalId !== "custom") {
      setCustomGoalText("");
    }
  };

  const canContinue =
    selectedGoal !== null &&
    (selectedGoal !== "custom" || customGoalText.trim().length > 0);

  return (
    <div className="w-full max-w-[1286px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10">
      {/* Header */}
      <motion.div
        className="text-center mb-6 sm:mb-8 md:mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center px-3 sm:px-4 py-1.5 rounded-full border border-sky-600 mb-4 sm:mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-[11px] sm:text-xs font-medium bg-gradient-to-r from-purple-300 via-violet-300 to-blue-300 bg-clip-text text-transparent">
            Let&apos;s personalize your journey
          </span>
        </motion.div>

        {/* Title — responsive sizing */}
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium text-white mb-3 sm:mb-4 leading-tight">
          What&apos;s Your Primary Goal?
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-[rgba(239,237,253,0.7)] max-w-2xl mx-auto leading-relaxed px-2">
          Choose the goal that matters most to you right now. We&apos;ll create
          a personalized plan tailored to help you achieve it.
        </p>
      </motion.div>

      {/* Goal Cards — responsive grid: 1 col mobile, 2 col tablet+ */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {goalOptions.map((goal) => {
          const isSelected = selectedGoal === goal.id;

          return (
            <motion.button
              key={goal.id}
              variants={cardVariants}
              onClick={() => handleGoalSelect(goal.id)}
              className={`
                group relative flex items-center gap-3 sm:gap-4
                p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl text-left
                transition-all duration-300 border
                ${
                  isSelected
                    ? "border-emerald-600 border-[1.5px]"
                    : "bg-[#02000f] border-white/[0.24] hover:border-white/40"
                }
              `}
              style={
                isSelected
                  ? {
                      backgroundImage:
                        "linear-gradient(178deg, rgba(5,150,105,0) 3%, rgba(5,150,105,0.3) 99%)",
                    }
                  : undefined
              }
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon — SVG from public folder */}
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 relative">
                <Image
                  src={goal.icon}
                  alt={goal.title}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
                <h3 className="text-base sm:text-lg md:text-xl font-medium text-white leading-snug">
                  {goal.title}
                </h3>
                <p className="text-[13px] sm:text-[15px] md:text-[17px] text-[rgba(239,237,253,0.7)] leading-relaxed">
                  {goal.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Custom Goal Input */}
      {showCustomInput && (
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/40 via-sky-500/20 to-purple-500/30 transition-all duration-500 focus-within:from-emerald-400/60 focus-within:via-sky-400/40 focus-within:to-purple-400/50 focus-within:shadow-[0_0_24px_rgba(16,185,129,0.12)]">
            <div className="relative rounded-[15px] bg-[#060214]/95 backdrop-blur-sm overflow-hidden">
              {/* Subtle glow accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

              <div className="flex items-start gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Image
                    src={`${ICON_BASE}/Custom Goal.svg`}
                    alt=""
                    width={18}
                    height={18}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-emerald-400/80 mb-1 tracking-wide uppercase">
                    Your Goal
                  </label>
                  <textarea
                    value={customGoalText}
                    onChange={(e) => setCustomGoalText(e.target.value.slice(0, 200))}
                    placeholder="e.g., Improve my prayer routine and spiritual discipline, save money by cooking at home, read 20 books this year..."
                    className="w-full bg-transparent text-white placeholder-slate-500/70 resize-none text-sm sm:text-base leading-relaxed focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Footer bar */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Be specific — AI will tailor questions to your exact goal
                </p>
                <span className={`text-xs font-medium tabular-nums transition-colors ${
                  customGoalText.length >= 180 ? "text-amber-400" : customGoalText.length > 0 ? "text-emerald-500/70" : "text-slate-600"
                }`}>
                  {customGoalText.length}/200
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA Button — full width, responsive padding */}
      <motion.button
        onClick={nextStep}
        disabled={!canContinue}
        className={`
          w-full flex items-center justify-center gap-2 sm:gap-3
          px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl
          font-medium text-base sm:text-lg md:text-xl
          transition-all duration-300
          border border-white/20 overflow-hidden mb-6 sm:mb-8
          ${
            canContinue
              ? "bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700"
          }
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={canContinue ? { scale: 1.01 } : {}}
        whileTap={canContinue ? { scale: 0.99 } : {}}
      >
        <span>Continue to Assessment</span>
        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.button>

      {/* Pro Tip Banner */}
      <motion.div
        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-slate-800/40 border border-slate-700/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Image
            src={`${ICON_BASE}/STar.svg`}
            alt="Pro tip"
            width={20}
            height={20}
            className="sm:w-6 sm:h-6"
          />
        </div>
        <p className="text-sm sm:text-base text-[rgba(239,237,253,0.8)]">
          <span className="font-semibold text-emerald-500">Pro Tip:</span>{" "}
          You can add more goals later. Start with the one that excites you most!
        </p>
      </motion.div>
    </div>
  );
}
