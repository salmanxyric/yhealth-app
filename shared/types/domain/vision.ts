// ============================================
// VISION TESTING MODULE — Shared Types
// ============================================

// ─── Enums / Literal Types ──────────────────────────────────────────

export type VisionTestType = 'color_vision_quick' | 'color_vision_advanced' | 'eye_exercise';
export type VisionDifficulty = 'quick' | 'standard' | 'advanced';
export type PlateType = 'protan' | 'deutan' | 'tritan' | 'control';

export type VisionClassification =
  | 'normal'
  | 'protan_weak' | 'protan_strong'
  | 'deutan_weak' | 'deutan_strong'
  | 'tritan_weak' | 'tritan_strong';

export type EyeExerciseType = 'trataka' | 'eye_circles' | 'focus_shift' | 'palming';

// ─── Core Types ─────────────────────────────────────────────────────

export interface VisionTestSession {
  id: string;
  userId: string;
  testType: VisionTestType;
  difficulty: VisionDifficulty;
  totalPlates: number;
  correctCount: number;
  accuracyPercentage: number;
  averageResponseTimeMs?: number;
  totalDurationSeconds?: number;
  visionClassification?: VisionClassification;
  confidenceScore?: number;
  exerciseType?: EyeExerciseType;
  exerciseDurationSeconds?: number;
  plateSeed?: string;
  notes?: string;
  moodBefore?: number;
  moodAfter?: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisionTestResponse {
  id: string;
  sessionId: string;
  plateIndex: number;
  plateType: PlateType;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
  responseTimeMs?: number;
  timedOut: boolean;
  createdAt: string;
}

export interface VisionStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalExercises: number;
  lastSessionDate?: string;
  milestonesAchieved: VisionMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface VisionMilestone {
  milestone: VisionMilestoneType;
  achievedAt: string;
}

export type VisionMilestoneType =
  | 'first_test'
  | 'perfect_score'
  | '7_day_streak'
  | '30_day_streak'
  | '10_sessions'
  | '50_sessions'
  | 'speed_demon'
  | 'eagle_eye';

// ─── Input Types ────────────────────────────────────────────────────

export interface StartVisionTestInput {
  testType: VisionTestType;
  difficulty?: VisionDifficulty;
  moodBefore?: number;
}

export interface SubmitPlateResponseInput {
  plateIndex: number;
  plateType: PlateType;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
  responseTimeMs?: number;
  timedOut?: boolean;
}

export interface CompleteVisionTestInput {
  responses: SubmitPlateResponseInput[];
  totalDurationSeconds: number;
  moodAfter?: number;
  notes?: string;
}

export interface StartEyeExerciseInput {
  exerciseType: EyeExerciseType;
  durationSeconds: number;
  moodBefore?: number;
}

export interface CompleteEyeExerciseInput {
  moodAfter?: number;
  notes?: string;
}

// ─── Stats / Analytics ──────────────────────────────────────────────

export interface VisionStats {
  totalTests: number;
  totalExercises: number;
  averageAccuracy: number;
  averageResponseTimeMs: number;
  latestClassification?: VisionClassification;
  classificationHistory: { date: string; classification: VisionClassification; accuracy: number }[];
  accuracyTrend: { date: string; accuracy: number }[];
  responseTimeTrend: { date: string; avgMs: number }[];
  streak: VisionStreak;
  suggestedExercises: string[];
}

export interface VisionHistoryFilter {
  testType?: VisionTestType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ─── Plate Generation (client-side) ─────────────────────────────────

export interface PlateConfig {
  plateType: PlateType;
  character: string;
  options: string[];
  timerSeconds: number;
}
