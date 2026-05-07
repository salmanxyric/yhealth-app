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

const inFlightGoalKeys = new Set<string>();

function buildGoalKey(goal: string | null, customText: string): string {
  return `${goal || 'none'}::${customText.trim().toLowerCase()}`;
}

function isRoutineCustomGoal(text: string): boolean {
  const normalized = text.toLowerCase();
  const matches = ['routine', 'sleep', 'career', 'work', 'focus', 'relationship', 'discipline']
    .filter((keyword) => normalized.includes(keyword));
  return matches.length >= 2;
}

function summarizeCustomGoal(text: string): string {
  const normalized = text.toLowerCase();
  const parts: string[] = [];

  if (normalized.includes('routine') || normalized.includes('discipline')) parts.push('build a steadier routine');
  if (normalized.includes('sleep')) parts.push('improve sleep consistency');
  if (normalized.includes('career') || normalized.includes('work') || normalized.includes('focus')) parts.push('protect meaningful work focus');
  if (normalized.includes('relationship')) parts.push('strengthen relationships');

  if (parts.length > 0) return parts.join(', ');
  return text.length > 90 ? `${text.slice(0, 87).trim()}...` : text;
}

function getRoutineFallbackQuestions(): Question[] {
  return [
    {
      id: 'routine_priority',
      text: 'Which area would create the most meaningful change first?',
      type: 'text',
      optional: true,
      placeholder: 'e.g., sleep consistency, focused work blocks, or intentional relationship time',
    },
    {
      id: 'motivation',
      text: 'How motivated are you to make these changes right now?',
      type: 'cards',
    },
    {
      id: 'routine_blocker',
      text: 'What usually breaks your routine or sleep consistency?',
      type: 'text',
      optional: true,
      placeholder: 'e.g., late phone use, unpredictable work, low energy, or no evening structure',
    },
    {
      id: 'relationship_action',
      text: 'What relationship action would you like to practice more consistently?',
      type: 'text',
      optional: true,
      placeholder: 'e.g., one thoughtful message daily, weekly calls, or focused time with family',
    },
  ];
}

function getFallbackQuestions(goalLabel?: string): Question[] {
  const label = goalLabel || 'your goal';
  return [
    {
      id: 'improvement',
      text: `What would make the biggest difference for ${label} right now?`,
      type: 'text',
      optional: true,
      placeholder: 'e.g., the main result you want to feel or see first...',
    },
    {
      id: 'motivation',
      text: 'How motivated are you to make changes right now?',
      type: 'cards',
    },
    {
      id: 'past_attempts',
      text: 'What has made follow-through difficult in the past?',
      type: 'text',
      optional: true,
      placeholder: 'e.g., schedule, energy, accountability, stress, or unclear next steps...',
    },
    {
      id: 'other_goals',
      text: "Any other life goals you'd like to work on alongside this?",
      type: 'text',
      optional: true,
      placeholder: 'e.g., Save money, pray more, read books, reduce screen time...',
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
        optional: q.type === 'text' ? true : q.optional,
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
    if (inFlightGoalKeys.has(goalKey)) return;
    inFlightGoalKeys.add(goalKey);

    setIsLoading(true);
    setError(null);

    try {
      const formattedResponses = assessmentResponsesRef.current
        .filter((r) => r.value && r.value !== '')
        .map((r) => ({
          questionText: r.questionText || r.questionId,
          value: String(r.value),
        }));

      const isRoutineGoal = selectedGoal === 'custom' && isRoutineCustomGoal(customGoalText);
      const goalLabel = isRoutineGoal
        ? 'fix routine, improve sleep, focus on meaningful work, and strengthen relationships'
        : selectedGoal === 'custom' && customGoalText.trim()
          ? summarizeCustomGoal(customGoalText.trim())
        : selectedGoal ? GOAL_LABEL_MAP[selectedGoal] : undefined;

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
      inFlightGoalKeys.delete(goalKey);
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
    const isRoutineGoal = selectedGoal === 'custom' && isRoutineCustomGoal(customGoalText);
    const goalLabel = isRoutineGoal
      ? undefined
      : selectedGoal === 'custom' && customGoalText.trim()
        ? summarizeCustomGoal(customGoalText.trim())
      : selectedGoal ? GOAL_LABEL_MAP[selectedGoal] : undefined;
    questions = isRoutineGoal ? getRoutineFallbackQuestions() : getFallbackQuestions(goalLabel);
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
