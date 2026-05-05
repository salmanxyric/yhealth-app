import type { GoalCategory } from './coach.types.js';

export interface AssessmentResponseInput {
  questionId: string;
  value: string;
}

export interface BodyStatsInput {
  height?: number;
  weight?: number;
  age?: number;
}

export interface GeneratedGoal {
  title: string;
  description: string;
  targetValue?: number;
  targetUnit?: string;
  timeline?: {
    startDate?: string;
    targetDate?: string;
    durationWeeks?: number;
  };
  motivation?: string;
  milestones?: Array<{
    week?: number;
    target?: number;
    description?: string;
  }>;
  id?: string;
  category?: string;
  pillar?: string;
  isPrimary?: boolean;
  currentValue?: number;
  confidenceScore?: number;
  aiSuggested?: boolean;
}

export interface GenerateGoalsRequest {
  userId: string;
  goalCategory: GoalCategory;
  assessmentResponses: AssessmentResponseInput[];
  bodyStats?: BodyStatsInput;
  customGoalText?: string;
}

export interface GenerateGoalsResponse {
  goals: GeneratedGoal[];
  reasoning?: string;
}

export interface DietPlanRequest {
  userId: string;
  goal?: GoalCategory;
  goalCategory?: GoalCategory;
  insights?: Array<{ category: string; text: string; confidence: number }>;
  preferences?: Record<string, unknown>;
}

export interface GeneratedDietPlan {
  plan: unknown;
}
