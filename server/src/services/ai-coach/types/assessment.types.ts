import type { ConversationPhase, ExtractedInsight, GoalCategory, SupportedLanguage } from './coach.types.js';

export type MCQCategory = string;

export interface MCQOption {
  id: string;
  text: string;
  insightValue?: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
}

export interface MCQGenerationRequest {
  userId?: string;
  goal: GoalCategory;
  customGoalText?: string;
  selectedGoalLabel?: string;
  category?: MCQCategory;
  phase?: ConversationPhase;
  previousAnswers?: { questionId: string; questionText?: string; selectedOptions: string[] }[];
  extractedInsights?: ExtractedInsight[];
  language?: SupportedLanguage;
}

export interface MCQGenerationResponse {
  question: MCQQuestion;
  phase: ConversationPhase;
  progress: number;
  isComplete?: boolean;
  insights?: ExtractedInsight[];
  usedFallback?: boolean;
  warning?: string;
}

export interface BatchMCQRequest {
  goal: GoalCategory;
  customGoalText?: string;
  count?: number;
  language?: SupportedLanguage;
}

export interface BatchMCQResponse {
  questions: MCQQuestion[];
  goalSummary: string;
  detectedCategories: string[];
}

export interface LifeCoachQuestionsRequest {
  goal: GoalCategory;
  customGoalText?: string;
  selectedGoalLabel?: string;
  assessmentResponses?: { questionText: string; value: string }[];
  language?: SupportedLanguage;
}

export interface LifeCoachQuestionItem {
  id: string;
  question: string;
  type: 'text' | 'cards' | 'mcq';
  goal_area: string;
  purpose: string;
  optional?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface LifeCoachQuestionsResponse {
  questions: LifeCoachQuestionItem[];
}
