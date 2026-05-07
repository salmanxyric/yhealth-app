'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnboarding } from '@/src/features/onboarding/context/OnboardingContext';
import { aiCoachService } from '@/src/shared/services/ai-coach.service';
import type { AssessmentQuestion } from '../data/goal-questions';
import { getQuestionsForGoal } from '../data/goal-questions';

const inFlightGoalKeys = new Set<string>();

function buildGoalKey(goal: string | null, customText: string): string {
  return `${goal || 'none'}::${customText.trim().toLowerCase()}`;
}

export function useQuickAssessmentQuestions() {
  const {
    selectedGoal,
    customGoalText,
    generatedAssessmentQuestions,
    assessmentQuestionsGoalKey,
    setGeneratedAssessmentQuestions,
  } = useOnboarding();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const currentGoalKey = buildGoalKey(selectedGoal, customGoalText);
  const hasCachedQuestions =
    generatedAssessmentQuestions !== null &&
    assessmentQuestionsGoalKey === currentGoalKey;

  const bodyStatQuestions: AssessmentQuestion[] = [
    {
      id: 'height',
      text: 'What is your height?',
      type: 'number',
      category: 'body_stats',
      pillar: 'general',
      iconName: 'Ruler',
      unit: 'cm',
    },
    {
      id: 'weight',
      text: 'What is your current weight?',
      type: 'number',
      category: 'body_stats',
      pillar: 'general',
      iconName: 'Scale',
      unit: 'kg',
    },
  ];

  const targetWeightQuestion: AssessmentQuestion = {
    id: 'target_weight',
    text: 'What is your target weight?',
    type: 'number',
    category: 'goal_specific',
    pillar: 'fitness',
    iconName: 'Target',
    unit: 'kg',
  };

  const mapGeneratedToAssessment = useCallback(
    (
      generated: NonNullable<typeof generatedAssessmentQuestions>
    ): AssessmentQuestion[] => {
      return generated.map((q) => ({
        id: q.id,
        text: q.question,
        type: 'single_select' as const,
        category: 'goal_specific',
        pillar: q.goal_area || 'general',
        iconName: 'Sparkles',
        options: q.options.map((opt) => ({
          value: opt.value,
          label: opt.label,
        })),
      }));
    },
    []
  );

  const getFallbackQuestions = useCallback((): AssessmentQuestion[] => {
    return getQuestionsForGoal(selectedGoal, customGoalText);
  }, [selectedGoal, customGoalText]);

  const fetchQuestions = useCallback(async () => {
    if (!selectedGoal) return;

    const goalKey = buildGoalKey(selectedGoal, customGoalText);
    if (inFlightGoalKeys.has(goalKey)) return;
    inFlightGoalKeys.add(goalKey);
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiCoachService.generateBatchMCQQuestions({
        goal: selectedGoal,
        customGoalText: customGoalText || undefined,
        count: 6,
      });

      if (response.questions && response.questions.length >= 2) {
        const mapped = response.questions.map((q) => ({
          id: q.id,
          question: q.question,
          goal_area: 'goal_specific',
          options: q.options.map((opt) => ({
            label: opt.text,
            value: opt.insightValue || opt.text.toLowerCase().replace(/\s+/g, '_'),
          })),
        }));
        setGeneratedAssessmentQuestions(mapped, goalKey);
      } else {
        throw new Error('Too few questions returned');
      }
    } catch (err) {
      console.warn('[useQuickAssessmentQuestions] AI generation failed, using fallback', err);
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      inFlightGoalKeys.delete(goalKey);
      setIsLoading(false);
    }
  }, [selectedGoal, customGoalText, setGeneratedAssessmentQuestions]);

  useEffect(() => {
    if (hasCachedQuestions || fetchedRef.current || !selectedGoal) return;
    fetchedRef.current = true;
    void fetchQuestions();
  }, [hasCachedQuestions, selectedGoal, fetchQuestions]);

  // Reset fetch guard when goal changes
  useEffect(() => {
    fetchedRef.current = false;
  }, [currentGoalKey]);

  const retry = useCallback(() => {
    fetchedRef.current = false;
    void fetchQuestions();
  }, [fetchQuestions]);

  let questions: AssessmentQuestion[];

  if (hasCachedQuestions && generatedAssessmentQuestions) {
    const aiQuestions = mapGeneratedToAssessment(generatedAssessmentQuestions);
    const staticPrefix =
      selectedGoal === 'weight_loss'
        ? [targetWeightQuestion, ...bodyStatQuestions]
        : [...bodyStatQuestions];
    questions = selectedGoal === 'weight_loss'
      ? [...staticPrefix, ...aiQuestions]
      : [...aiQuestions, ...staticPrefix];
  } else if (!isLoading && error) {
    questions = getFallbackQuestions();
  } else {
    questions = [];
  }

  return {
    questions,
    isLoading: isLoading && !hasCachedQuestions,
    error,
    retry,
  };
}
