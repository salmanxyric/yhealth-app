/**
 * @file Wellbeing Domain Types
 * @description Type definitions for Epic 07: Wellbeing Pillar
 */

// ============================================
// MOOD TYPES
// ============================================

export type MoodEmoji = '😊' | '😐' | '😟' | '😡' | '😰' | '😴';

export type EmotionTag =
  | 'grateful'
  | 'frustrated'
  | 'excited'
  | 'anxious'
  | 'content'
  | 'overwhelmed'
  | 'peaceful'
  | 'irritated'
  | 'hopeful'
  | 'lonely'
  | 'confident'
  | 'sad'
  | 'energized'
  | 'calm'
  | 'worried';

export type WellbeingMode = 'light' | 'deep';

export interface MoodLog {
  id: string;
  userId: string;
  moodEmoji?: MoodEmoji;
  descriptor?: string;
  happinessRating?: number; // 1-10
  energyRating?: number; // 1-10
  stressRating?: number; // 1-10
  anxietyRating?: number; // 1-10
  emotionTags: EmotionTag[];
  contextNote?: string;
  mode: WellbeingMode;
  loggedAt: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

// ============================================
// JOURNAL TYPES
// ============================================

export type JournalPromptCategory =
  | 'gratitude'
  | 'reflection'
  | 'emotional_processing'
  | 'stress_management'
  | 'self_compassion'
  | 'future_focus'
  | 'identity'
  | 'productivity'
  | 'relationships'
  | 'spirituality'
  | 'anxiety'
  | 'creativity'
  | 'cbt_reflection'
  | 'cross_pillar';

export type JournalingMode =
  | 'quick_reflection'
  | 'deep_dive'
  | 'gratitude'
  | 'life_perspective'
  | 'free_write';

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JournalEntry {
  id: string;
  userId: string;
  prompt: string;
  promptCategory?: JournalPromptCategory;
  promptId?: string;
  entryText: string;
  wordCount: number;
  mode: WellbeingMode;
  voiceEntry: boolean;
  durationSeconds?: number;
  sentimentScore?: number; // -1.0 to 1.0
  sentimentLabel?: 'positive' | 'negative' | 'neutral';
  streakDay?: number;
  // Enhanced journaling system fields
  checkinId?: string;
  journalingMode?: JournalingMode;
  aiGeneratedPrompt?: boolean;
  coachReflection?: string;
  coachReflectionAt?: string;
  // Voice journaling enhancements
  voiceAudioUrl?: string;
  voiceDurationMs?: number;
  voiceEmotionAnalysis?: VoiceEmotionAnalysis;
  transcriptionStatus?: TranscriptionStatus;
  loggedAt: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

export interface VoiceEmotionAnalysis {
  tone: string; // 'calm', 'energetic', 'stressed', 'happy', 'sad'
  confidence: number; // 0-1
  energy: number; // 1-10
  pace: string; // 'slow', 'normal', 'fast'
}

// ============================================
// DAILY CHECK-IN TYPES
// ============================================

export type CheckinTag =
  | 'productive'
  | 'social'
  | 'spiritual'
  | 'creative'
  | 'restful'
  | 'stressful'
  | 'anxious'
  | 'grateful';

export interface DailyCheckin {
  id: string;
  userId: string;
  checkinDate: string; // ISO date
  moodScore?: number; // 1-10
  energyScore?: number; // 1-10
  sleepQuality?: number; // 1-5
  stressScore?: number; // 1-10
  tags: CheckinTag[];
  daySummary?: string;
  moodLogId?: string;
  energyLogId?: string;
  stressLogId?: string;
  completedAt?: string;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyCheckinInput {
  moodScore?: number;
  energyScore?: number;
  sleepQuality?: number;
  stressScore?: number;
  tags?: CheckinTag[];
  daySummary?: string;
}

// ============================================
// LIFE GOALS TYPES
// ============================================

export type LifeGoalCategory =
  | 'spiritual'
  | 'social'
  | 'productivity'
  | 'happiness'
  | 'anxiety_management'
  | 'creative'
  | 'personal_growth'
  | 'custom';

export type LifeGoalTrackingMethod = 'daily_checkin' | 'journal_mentions' | 'manual' | 'hybrid';

export interface LifeGoal {
  id: string;
  userId: string;
  category: LifeGoalCategory;
  title: string;
  description?: string;
  motivation?: string;
  trackingMethod: LifeGoalTrackingMethod;
  targetValue?: number;
  targetUnit?: string;
  currentValue: number;
  status: string;
  progress: number; // 0-100
  journalMentionCount: number;
  avgSentimentWhenMentioned?: number;
  lastMentionedAt?: string;
  aiDetectedPatterns: unknown[];
  detectionKeywords: string[];
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLifeGoalInput {
  category: LifeGoalCategory;
  title: string;
  description?: string;
  motivation?: string;
  trackingMethod?: LifeGoalTrackingMethod;
  targetValue?: number;
  targetUnit?: string;
  detectionKeywords?: string[];
  isPrimary?: boolean;
}

export interface DailyIntention {
  id: string;
  userId: string;
  intentionDate: string;
  intentionText: string;
  checkinId?: string;
  fulfilled?: boolean;
  reflection?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalGoalLink {
  id: string;
  journalEntryId: string;
  lifeGoalId: string;
  linkType: 'ai_detected' | 'user_confirmed' | 'user_tagged';
  confidence?: number;
  relevantExcerpt?: string;
  sentimentScore?: number;
  createdAt: string;
}

// ============================================
// JOURNAL INSIGHT TYPES
// ============================================

export interface JournalEmotionalState {
  primary: string;
  secondary?: string;
  intensity: number; // 1-10
}

export interface JournalInsight {
  id: string;
  journalEntryId: string;
  userId: string;
  themes: string[];
  emotionalState?: JournalEmotionalState;
  cognitivePatterns: string[];
  growthSignals: string[];
  riskIndicators: string[];
  coachingSuggestion?: string;
  sentimentMethod?: string;
  sentimentConfidence?: number;
  detectedGoalLinks: Array<{ goalId: string; confidence: number }>;
  analysisModel?: string;
  analysisTokens?: number;
  analyzedAt: string;
  createdAt: string;
}

export interface JournalPattern {
  id: string;
  userId: string;
  patternType: string;
  patternDescription: string;
  correlationStrength?: number;
  dataPoints?: number;
  confidence?: 'high' | 'medium' | 'low';
  evidence: Record<string, unknown>;
  windowDays: number;
  computedAt: string;
  isActive: boolean;
  dismissedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// HABIT TYPES
// ============================================

export type HabitTrackingType = 'checkbox' | 'counter' | 'duration' | 'rating';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Habit {
  id: string;
  userId: string;
  habitName: string;
  category?: string;
  trackingType: HabitTrackingType;
  frequency: HabitFrequency;
  specificDays: DayOfWeek[];
  description?: string;
  targetValue?: number;
  unit?: string;
  isActive: boolean;
  isArchived: boolean;
  reminderEnabled: boolean;
  reminderTime?: string; // Time string (HH:mm)
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  completed: boolean;
  value?: number;
  note?: string;
  logDate: string; // ISO date string
  loggedAt: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ENERGY TYPES
// ============================================

export type EnergyContextTag =
  | 'post-meal'
  | 'post-workout'
  | 'during-work'
  | 'after-sleep'
  | 'after-caffeine'
  | 'after-social-activity';

export interface EnergyLog {
  id: string;
  userId: string;
  energyRating: number; // 1-10
  contextTag?: EnergyContextTag;
  contextNote?: string;
  loggedAt: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ROUTINE TYPES
// ============================================

export type RoutineType = 'morning' | 'evening' | 'custom';

export interface RoutineStep {
  step: string;
  durationMin: number;
  order: number;
  instructions?: string;
}

export interface WellbeingRoutine {
  id: string;
  userId: string;
  routineName: string;
  routineType: RoutineType;
  isTemplate: boolean;
  templateId?: string;
  steps: RoutineStep[];
  frequency: HabitFrequency;
  specificDays: DayOfWeek[];
  triggerTime?: string; // Time string (HH:mm)
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompletedRoutineStep {
  step: string;
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

export interface RoutineCompletion {
  id: string;
  userId: string;
  routineId: string;
  completionDate: string; // ISO date string
  stepsCompleted: CompletedRoutineStep[];
  completionRate: number; // 0-100
  totalSteps: number;
  completedSteps: number;
  startedAt?: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MINDFULNESS TYPES
// ============================================

export type MindfulnessPracticeCategory =
  | 'breathing'
  | 'meditation'
  | 'movement'
  | 'quick_reset'
  | 'evening';

export interface MindfulnessInstruction {
  step: number;
  instruction: string;
}

export interface MindfulnessPractice {
  id: string;
  userId?: string; // NULL for system practices
  practiceName: string;
  practiceCategory: MindfulnessPracticeCategory;
  instructions: MindfulnessInstruction[];
  durationMinutes?: number;
  whenToUse?: string;
  whyItHelps?: string;
  isSystemPractice: boolean;
  // For user practice logs:
  completedAt?: string; // ISO timestamp
  actualDurationMinutes?: number;
  effectivenessRating?: number; // 1-10
  context?: string;
  note?: string;
  recommendedAt?: string; // ISO timestamp
  accepted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BREATHING TEST TYPES
// ============================================

export type BreathingTestType = 'breath_hold' | 'box_breathing' | '4-7-8' | 'relaxation' | 'custom';

export type LungCapacityEstimate = 'poor' | 'fair' | 'good' | 'excellent';

export interface BreathingTest {
  id: string;
  userId: string;
  testType: BreathingTestType;
  patternName?: string;
  breathHoldDurationSeconds?: number;
  totalCyclesCompleted: number;
  totalDurationSeconds: number;
  averageInhaleDuration?: number;
  averageExhaleDuration?: number;
  averageHoldDuration?: number;
  consistencyScore?: number; // 0-100
  difficultyRating?: number; // 1-5
  notes?: string;
  lungCapacityEstimate?: LungCapacityEstimate;
  improvementFromBaseline?: number; // percentage
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

export interface BreathingTimelineData {
  id: string;
  timestamp: string;
  breathHoldDurationSeconds?: number;
  totalDurationSeconds: number;
  testType: BreathingTestType;
  consistencyScore?: number;
  lungCapacityEstimate?: LungCapacityEstimate;
}

export interface BreathingStats {
  totalTests: number;
  averageBreathHoldSeconds: number;
  bestBreathHoldSeconds: number;
  averageConsistencyScore: number;
  improvementPercentage: number;
  mostUsedTestType: string;
  testsByType: Array<{ testType: string; count: number }>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface CreateBreathingTestInput {
  testType: BreathingTestType;
  patternName?: string;
  breathHoldDurationSeconds?: number;
  totalCyclesCompleted?: number;
  totalDurationSeconds: number;
  averageInhaleDuration?: number;
  averageExhaleDuration?: number;
  averageHoldDuration?: number;
  consistencyScore?: number;
  difficultyRating?: number;
  notes?: string;
  startedAt: string;
}

