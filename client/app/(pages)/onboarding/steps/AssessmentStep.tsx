"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useOnboarding } from "@/src/features/onboarding/context/OnboardingContext";
import { StepNavigation } from "../components/StepNavigation";
import {
  SliderInput,
  EmojiScale,
  SingleSelect,
  NumberInput,
} from "@/components/common/questions";
import {
  getQuestionsForGoal,
  getAssessmentTitle,
  getAssessmentSubtitle,
  getQuestionIcon,
} from "../data/goal-questions";

/**
 * AssessmentStep - Quick assessment questionnaire
 *
 * Uses shared question components for a clean, maintainable implementation.
 * Supports slider, emoji scale, single select, and number input question types.
 */
export function AssessmentStep() {
  const {
    selectedGoal,
    assessmentResponses,
    addAssessmentResponse,
    setBodyStats,
    bodyStats,
    completeAssessment,
    nextStep,
    prevStep,
  } = useOnboarding();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Get goal-specific questions
  const assessmentQuestions = useMemo(
    () => getQuestionsForGoal(selectedGoal),
    [selectedGoal]
  );

  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const totalQuestions = assessmentQuestions.length;

  // Assessment title and subtitle based on goal
  const assessmentTitle = getAssessmentTitle(selectedGoal);
  const assessmentSubtitle = getAssessmentSubtitle(selectedGoal);

  // Get current response for the question
  const getCurrentResponse = (): string | number => {
    if (!currentQuestion) return "";
    if (currentQuestion.id === "height") return bodyStats.heightCm || "";
    if (currentQuestion.id === "weight") return bodyStats.weightKg || "";
    if (currentQuestion.id === "target_weight") return bodyStats.targetWeightKg || "";
    const response = assessmentResponses.find((r) => r.questionId === currentQuestion.id)?.value;
    // Handle array values by taking the first element or joining
    if (Array.isArray(response)) {
      return response[0] || "";
    }
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
      // Include question text and metadata for AI context
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

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      prevStep();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    completeAssessment();
    nextStep();
  };

  const isCurrentAnswered = getCurrentResponse() !== "";

  // Progress percentage
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Don't render if no current question
  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Assessment Header - shows goal context */}
      {currentQuestionIndex === 0 && (
        <AssessmentHeader title={assessmentTitle} subtitle={assessmentSubtitle} />
      )}

      {/* Progress Bar */}
      <ProgressBar
        currentIndex={currentQuestionIndex}
        total={totalQuestions}
        progress={progress}
      />

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8"
        >
          {/* Question Header */}
          <QuestionHeader
            icon={getQuestionIcon(currentQuestion.iconName)}
            pillar={currentQuestion.pillar}
            text={currentQuestion.text}
          />

          {/* Answer Options - Using shared components */}
          <div className="mt-8">
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
                  icon: opt.icon ? <opt.icon className="w-5 h-5" /> : undefined,
                }))}
                layout="list"
              />
            )}

            {currentQuestion.type === "number" && (
              <NumberInput
                value={Number(getCurrentResponse()) || undefined}
                onChange={handleResponse}
                unit={currentQuestion.unit}
                placeholder={getNumberPlaceholder(currentQuestion.id)}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <StepNavigation
        onBack={handlePrev}
        onNext={handleNext}
        backLabel={currentQuestionIndex === 0 ? "Back" : "Previous"}
        nextLabel={
          currentQuestionIndex === totalQuestions - 1
            ? "Complete Assessment"
            : "Next Question"
        }
        isNextDisabled={!isCurrentAnswered}
        isLoading={isCompleting}
      />

      {/* Quick Skip Option */}
      {currentQuestion.category === "body_stats" && (
        <motion.p
          className="text-center mt-4 text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          This helps us personalize your plan, but you can update it later.
        </motion.p>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components (kept local as they're assessment-specific)
// =============================================================================

function AssessmentHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Sparkles className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-blue-400">
          Personalized for your goal
        </span>
      </motion.div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        {title}
      </h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
        {subtitle}
      </p>
    </motion.div>
  );
}

function ProgressBar({
  currentIndex,
  total,
  progress,
}: {
  currentIndex: number;
  total: number;
  progress: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-slate-400 mb-2">
        <span>
          Question {currentIndex + 1} of {total}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

function QuestionHeader({
  icon,
  pillar,
  text,
}: {
  icon: React.ReactNode;
  pillar: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400">
        {icon}
      </div>
      <div>
        <span className="text-xs text-slate-500 uppercase tracking-wide">
          {pillar}
        </span>
        <h2 className="text-xl font-semibold text-white">{text}</h2>
      </div>
    </div>
  );
}

// Helper to get placeholder text for number inputs
function getNumberPlaceholder(questionId: string): string {
  const placeholders: Record<string, string> = {
    height: "Enter height",
    weight: "Enter weight",
    target_weight: "Enter target weight",
  };
  return placeholders[questionId] || "Enter value";
}
