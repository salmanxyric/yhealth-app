"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Zap, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useOnboarding } from "@/src/features/onboarding/context/OnboardingContext";
import {
  SliderInput,
  EmojiScale,
  SingleSelect,
  NumberInput,
} from "@/components/common/questions";
import { getQuestionIcon } from "../data/goal-questions";
import { useQuickAssessmentQuestions } from "../hooks/useQuickAssessmentQuestions";

export function AssessmentStep() {
  const {
    selectedGoal,
    assessmentResponses,
    addAssessmentResponse,
    setBodyStats,
    bodyStats,
    completeAssessment,
    prevStep,
    goToStep,
  } = useOnboarding();

  const { questions: assessmentQuestions, isLoading, error, retry } = useQuickAssessmentQuestions();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const totalQuestions = assessmentQuestions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const getCurrentResponse = (): string | number => {
    if (!currentQuestion) return "";
    if (currentQuestion.id === "height") return bodyStats.heightCm || "";
    if (currentQuestion.id === "weight") return bodyStats.weightKg || "";
    if (currentQuestion.id === "target_weight") return bodyStats.targetWeightKg || "";
    const response = assessmentResponses.find((r) => r.questionId === currentQuestion.id)?.value;
    if (Array.isArray(response)) return response[0] || "";
    return response || "";
  };

  const handleResponse = (value: string | number) => {
    if (!currentQuestion) return;
    if (currentQuestion.id === "height") {
      setBodyStats({ heightCm: Number(value) });
    } else if (currentQuestion.id === "weight") {
      setBodyStats({ weightKg: Number(value) });
    } else if (currentQuestion.id === "target_weight") {
      setBodyStats({ targetWeightKg: Number(value) });
    } else {
      addAssessmentResponse({
        questionId: currentQuestion.id,
        value,
        questionText: currentQuestion.text,
        category: currentQuestion.category,
        pillar: currentQuestion.pillar,
      });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    completeAssessment();
    goToStep(3);
  };

  const isCurrentAnswered = getCurrentResponse() !== "";

  // Loading state while AI generates questions
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#02000f]">
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-8 h-8 text-sky-400" />
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
              Personalizing your assessment...
            </h2>
            <p className="text-sm sm:text-base text-white/60 mb-8">
              Creating questions tailored to your{" "}
              {selectedGoal === "custom" ? "personal" : selectedGoal?.replace(/_/g, " ")} goal
            </p>

            {/* Shimmer skeleton cards */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="h-14 rounded-xl bg-white/5 border border-white/10"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mt-8">
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
              <span className="text-sm text-white/40">This usually takes 2-3 seconds</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error state with retry (only if no fallback questions loaded)
  if (error && assessmentQuestions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#02000f]">
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">
              Couldn&apos;t personalize your assessment
            </h2>
            <p className="text-sm text-white/60 mb-6">
              We had trouble generating your questions. Let&apos;s try again.
            </p>
            <motion.button
              onClick={retry}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-500 transition-all"
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-[calc(100vh-198px)] flex flex-col bg-[#02000f]">
      {/* Header — slim bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <motion.button
          onClick={() => prevStep()}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-white text-sm sm:text-base border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group"
          whileHover={{ x: -2 }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-medium hidden sm:inline">Back to Assessment Style</span>
          <span className="font-medium sm:hidden">Back</span>
        </motion.button>

        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium bg-slate-800/70 text-slate-400 border border-white/10">
          <Zap className="w-4 h-4" />
          <span>Quick Mode</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-white/60 font-medium">Assessment Progress</span>
            <span className="text-white/60 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-teal-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* Question header — icon + text */}
            <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center text-purple-400 shrink-0">
                {getQuestionIcon(currentQuestion.iconName)}
              </div>
              <h2 className="text-lg sm:text-xl lg:text-[26px] font-medium text-white leading-snug">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Answer Options */}
            <div>
              {currentQuestion.type === "slider" && currentQuestion.sliderConfig && (
                <SliderInput
                  value={Number(getCurrentResponse()) || currentQuestion.sliderConfig.min}
                  onChange={handleResponse}
                  min={currentQuestion.sliderConfig.min}
                  max={currentQuestion.sliderConfig.max}
                  step={currentQuestion.sliderConfig.step}
                  unit={currentQuestion.sliderConfig.unit}
                  labels={currentQuestion.sliderConfig.labels}
                />
              )}

              {currentQuestion.type === "emoji_scale" && currentQuestion.options && (
                <EmojiScale
                  value={String(getCurrentResponse())}
                  onChange={handleResponse}
                  options={currentQuestion.options}
                />
              )}

              {currentQuestion.type === "single_select" && currentQuestion.options && (
                <SingleSelect
                  value={String(getCurrentResponse())}
                  onChange={handleResponse}
                  options={currentQuestion.options.map(opt => ({
                    value: opt.value,
                    label: opt.label,
                    description: opt.value.replace(/_/g, " "),
                    icon: opt.icon ? <opt.icon className="w-5 h-5" /> : undefined,
                  }))}
                  layout="grid"
                  columns={2}
                />
              )}

              {currentQuestion.type === "number" && (
                <NumberInput
                  value={Number(getCurrentResponse()) || undefined}
                  onChange={handleResponse}
                  unit={currentQuestion.unit}
                  placeholder={getNumberPlaceholder(currentQuestion.id)}
                  min={getNumberMin(currentQuestion.id)}
                  max={getNumberMax(currentQuestion.id)}
                  size="lg"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next Button — full width */}
        <motion.button
          onClick={handleNext}
          disabled={!isCurrentAnswered || isCompleting}
          className={`
            w-full flex items-center justify-center gap-2 mt-8 sm:mt-10
            px-6 py-3 sm:py-3.5 rounded-xl font-medium text-base sm:text-lg
            transition-all duration-300 border border-white/10
            ${
              isCurrentAnswered && !isCompleting
                ? "bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }
          `}
          whileHover={isCurrentAnswered && !isCompleting ? { scale: 1.01 } : {}}
          whileTap={isCurrentAnswered && !isCompleting ? { scale: 0.99 } : {}}
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>
                {currentQuestionIndex === totalQuestions - 1
                  ? "Complete Assessment"
                  : "Next"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        {/* Body stats hint */}
        {currentQuestion.category === "body_stats" && (
          <motion.p
            className="text-center mt-4 text-xs sm:text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            This helps us personalize your plan, but you can update it later.
          </motion.p>
        )}
      </div>
    </div>
  );
}

function getNumberPlaceholder(questionId: string): string {
  const placeholders: Record<string, string> = {
    height: "Height",
    weight: "Weight",
    target_weight: "Target",
  };
  return placeholders[questionId] || "Enter value";
}

function getNumberMin(questionId: string): number | undefined {
  const mins: Record<string, number> = {
    height: 90,
    weight: 25,
    target_weight: 25,
  };
  return mins[questionId];
}

function getNumberMax(questionId: string): number | undefined {
  const maxes: Record<string, number> = {
    height: 250,
    weight: 350,
    target_weight: 350,
  };
  return maxes[questionId];
}
