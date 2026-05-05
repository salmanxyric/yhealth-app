export type {
  GoalCategory,
  ConversationPhase,
  SupportedLanguage,
  ChatMessage,
  ConversationContext,
  ExtractedInsight,
  AICoachResponse,
  AICoachSession,
} from './coach.types.js';

export type {
  HealthImageType,
  ImageValidationResult,
  ImageAnalysisResult,
  UploadedHealthImage,
} from './image.types.js';

export type {
  MCQCategory,
  MCQOption,
  MCQQuestion,
  MCQGenerationRequest,
  MCQGenerationResponse,
  BatchMCQRequest,
  BatchMCQResponse,
  LifeCoachQuestionsRequest,
  LifeCoachQuestionItem,
  LifeCoachQuestionsResponse,
} from './assessment.types.js';

export type {
  AssessmentResponseInput,
  BodyStatsInput,
  GeneratedGoal,
  GenerateGoalsRequest,
  GenerateGoalsResponse,
  DietPlanRequest,
  GeneratedDietPlan,
} from './plan.types.js';
