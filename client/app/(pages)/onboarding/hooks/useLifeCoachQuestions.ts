'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnboarding } from '@/src/features/onboarding/context/OnboardingContext';
import { aiCoachService } from '@/src/shared/services/ai-coach.service';
import { GOAL_LABEL_MAP } from '../steps/deep-assessment';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'cards';
  optional?: boolean;
  placeholder?: string;
}

function buildGoalKey(goal: string | null, customText: string): string {
  return `${goal || 'none'}::${customText.trim().toLowerCase()}`;
}

function getFallbackQuestions(goalLabel?: string): Question[] {
  const label = goalLabel || 'your goal';
  return [
    {
      id: 'improvement',
      text: `What specifically motivated you to choose "${label}"?`,
      type: 'text',
      placeholder: `e.g., What draws you to ${label}...`,
    },
    {
      id: 'motivation',
      text: 'How motivated are you to make changes right now?',
      type: 'cards',
    },
    {
      id: 'past_attempts',
      text: `What have you tried before for "${label}" that didn't work?`,
      type: 'text',
      optional: true,
      placeholder: `e.g., Apps, programs, routines related to ${label}...`,
    },
    {
      id: 'other_goals',
      text: 'Any other life goals? (e.g., save money, pray more, read books, reduce screen time)',
      type: 'text',
      optional: true,
      placeholder: 'Type anything you want to work on...',
    },
  ];
}

export function useLifeCoachQuestions() {
  const {
    selectedGoal,
    customGoalText,
    assessmentResponses,
    generatedLifeCoachQuestions,
    lifeCoachQuestionsGoalKey,
    setGeneratedLifeCoachQuestions,
  } = useOnboarding();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const currentGoalKey = buildGoalKey(selectedGoal, customGoalText);
  const hasCachedQuestions =
    generatedLifeCoachQuestions !== null &&
    lifeCoachQuestionsGoalKey === currentGoalKey;

  const mapGeneratedToQuestions = useCallback(
    (
      generated: NonNullable<typeof generatedLifeCoachQuestions>
    ): Question[] => {
      return generated.map((q) => ({
        id: q.id,
        text: q.question,
        type: q.type === 'cards' ? ('cards' as const) : ('text' as const),
        optional: q.optional,
        placeholder: q.placeholder,
      }));
    },
    []
  );

  const assessmentResponsesRef = useRef(assessmentResponses);
  assessmentResponsesRef.current = assessmentResponses;

  const fetchQuestions = useCallback(async () => {
    if (!selectedGoal) return;

    const goalKey = buildGoalKey(selectedGoal, customGoalText);
    setIsLoading(true);
    setError(null);

    try {
      const formattedResponses = assessmentResponsesRef.current
        .filter((r) => r.value && r.value !== '')
        .map((r) => ({
          questionText: r.questionText || r.questionId,
          value: String(r.value),
        }));

      const goalLabel = selectedGoal ? GOAL_LABEL_MAP[selectedGoal] : undefined;

      const response = await aiCoachService.generateLifeCoachQuestions({
        goal: selectedGoal,
        customGoalText: customGoalText || undefined,
        selectedGoalLabel: goalLabel,
        assessmentResponses: formattedResponses.length > 0 ? formattedResponses : undefined,
      });

      if (response.questions && response.questions.length >= 2) {
        const hasMotivation = response.questions.some((q) => q.type === 'cards');
        const mapped = response.questions.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          goal_area: q.goal_area,
          purpose: q.purpose,
          optional: q.optional,
          placeholder: q.placeholder,
          options: q.options,
        }));

        if (!hasMotivation) {
          mapped.splice(1, 0, {
            id: 'motivation',
            question: 'How motivated are you to make changes right now?',
            type: 'cards',
            goal_area: 'general',
            purpose: 'Assess motivation level for plan calibration',
            optional: false,
            placeholder: undefined,
            options: undefined,
          });
        }

        setGeneratedLifeCoachQuestions(mapped, goalKey);
      } else {
        throw new Error('Too few questions returned');
      }
    } catch (err) {
      console.warn('[useLifeCoachQuestions] AI generation failed, using fallback', err);
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGoal, customGoalText, setGeneratedLifeCoachQuestions]);

  useEffect(() => {
    if (hasCachedQuestions || fetchedRef.current || !selectedGoal) return;
    fetchedRef.current = true;
    void fetchQuestions();
  }, [hasCachedQuestions, selectedGoal, fetchQuestions]);

  useEffect(() => {
    fetchedRef.current = false;
  }, [currentGoalKey]);

  const retry = useCallback(() => {
    fetchedRef.current = false;
    void fetchQuestions();
  }, [fetchQuestions]);

  let questions: Question[];

  if (hasCachedQuestions && generatedLifeCoachQuestions) {
    questions = mapGeneratedToQuestions(generatedLifeCoachQuestions);
  } else if (!isLoading && error) {
    const goalLabel = selectedGoal ? GOAL_LABEL_MAP[selectedGoal] : undefined;
    questions = getFallbackQuestions(goalLabel);
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
