/**
 * @file Wellbeing Domain Types
 * @description Type definitions for Epic 07: Wellbeing Pillar
 */

// ============================================
// MOOD TYPES
// ============================================

export type MoodEmoji =
  | '😊' | '😐' | '😟' | '😡' | '😰' | '😴'  // Legacy (😴, 😡 kept for backward compat)
  | '😌' | '😎' | '🎯' | '🤩' | '🤔' | '😨' | '😤'; // Expanded 9-state model

export type EmotionalState =
  | 'calm'
  | 'confident'
  | 'focused'
  | 'neutral'
  | 'distracted'
  | 'euphoric'
  | 'anxious'
  | 'frustrated'
  | 'fearful';

export type EmotionalValence = 'positive' | 'neutral' | 'negative';

export interface EmotionalStateConfig {
  emoji: MoodEmoji;
  label: string;
  color: string;
  state: EmotionalState;
  valence: EmotionalValence;
}

export type TriggerCategory =
  | 'work'
  | 'exercise'
  | 'social'
  | 'food'
  | 'sleep'
  | 'meditation'
  | 'conflict'
  | 'news'
  | 'weather'
  | 'other';

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
  // Mood arc / transition tracking
  transitionTrigger?: string;
  triggerCategory?: TriggerCategory;
  previousMoodLogId?: string;
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
  | 'free_write'
  | 'voice_conversation';

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
  // Rich editor content
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
  attachments?: JournalAttachment[];
  drawings?: JournalDrawing[];
  aiInteractions?: AIInteraction[];
  completenessScore?: number;
  validationResult?: ValidationResult;
  isDraft?: boolean;
  lastAutoSavedAt?: string;
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
// RICH JOURNAL EDITOR TYPES
// ============================================

export interface JournalAttachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  width?: number;
  height?: number;
  caption?: string;
  altText?: string;
  transcription?: string;
  transcriptionStatus?: TranscriptionStatus;
  uploadedAt: string;
}

export interface JournalDrawing {
  id: string;
  fabricJson: string;
  previewUrl: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIInteraction {
  id: string;
  type: 'completion' | 'rewrite' | 'expand' | 'summarize' | 'reframe' | 'prompt' | 'coaching';
  input: string;
  output: string;
  accepted: boolean;
  timestamp: string;
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'warn' | 'block' | 'suggestion';
  message: string;
}

export interface ValidationResult {
  completenessScore: number;
  wordCount: number;
  checks: ValidationCheck[];
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

export type CheckinType = 'morning' | 'evening';

export interface DailyCheckin {
  id: string;
  userId: string;
  checkinDate: string; // ISO date
  checkinType: CheckinType;
  moodScore?: number; // 1-10
  energyScore?: number; // 1-10
  sleepQuality?: number; // 1-5
  stressScore?: number; // 1-10
  tags: CheckinTag[];
  daySummary?: string;
  // Morning-specific: predictions
  predictedMood?: number; // 1-10
  predictedEnergy?: number; // 1-10
  knownStressors?: string[];
  // Evening-specific: review
  dayRating?: number; // 1-10
  wentWell?: string[];
  didntGoWell?: string[];
  eveningLessons?: string[];
  tomorrowFocus?: string;
  // Screen time
  screenTimeMinutes?: number;
  screenTimeSource?: 'manual' | 'device';
  // Cross-references
  moodLogId?: string;
  energyLogId?: string;
  stressLogId?: string;
  completedAt?: string;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyCheckinInput {
  checkinType?: CheckinType;
  moodScore?: number;
  energyScore?: number;
  sleepQuality?: number;
  stressScore?: number;
  tags?: CheckinTag[];
  daySummary?: string;
  // Morning-specific
  predictedMood?: number;
  predictedEnergy?: number;
  knownStressors?: string[];
  // Evening-specific
  dayRating?: number;
  wentWell?: string[];
  didntGoWell?: string[];
  eveningLessons?: string[];
  tomorrowFocus?: string;
  // Screen time
  screenTimeMinutes?: number;
  screenTimeSource?: 'manual' | 'device';
}

export interface DayComparison {
  date: string;
  morning?: DailyCheckin;
  evening?: DailyCheckin;
  moodDelta?: number; // actual - predicted
  energyDelta?: number;
  intentionsFulfilled: number;
  intentionsTotal: number;
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
  | 'financial'
  | 'faith'
  | 'relationships'
  | 'education'
  | 'career'
  | 'health_wellness'
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
  sortOrder: number;
  domain?: string;
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
// LIFE GOAL MILESTONES & CHECK-INS
// ============================================

export interface LifeGoalMilestone {
  id: string;
  lifeGoalId: string;
  userId: string;
  title: string;
  description?: string;
  targetDate?: string;
  targetValue?: number;
  currentValue: number;
  completed: boolean;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLifeGoalMilestoneInput {
  title: string;
  description?: string;
  targetDate?: string;
  targetValue?: number;
  sortOrder?: number;
}

export interface LifeGoalCheckin {
  id: string;
  lifeGoalId: string;
  userId: string;
  checkinDate: string;
  progressValue?: number;
  note?: string;
  moodAboutGoal?: number; // 1-5
  createdAt: string;
}

export interface CreateLifeGoalCheckinInput {
  progressValue?: number;
  note?: string;
  moodAboutGoal?: number;
}

export interface LifeGoalDashboard {
  goal: LifeGoal;
  milestones: LifeGoalMilestone[];
  recentCheckins: LifeGoalCheckin[];
  checkinStreak: number;
  lastCheckinDate?: string;
  journalLinks: JournalGoalLink[];
}

// ============================================
// MOTIVATION TIER TYPES
// ============================================

export type MotivationTier = 'low' | 'medium' | 'high';

export interface UserMotivationProfile {
  id: string;
  userId: string;
  declaredTier: MotivationTier;
  computedTier: MotivationTier;
  activeTier: MotivationTier;
  engagementScore: number;
  loginFrequencyScore: number;
  suggestionAcceptRate: number;
  taskCompletionRate: number;
  sessionDepthScore: number;
  streakConsistencyScore: number;
  lastComputedAt: string;
  tierHistory: Array<{ tier: MotivationTier; date: string; reason: string }>;
  createdAt: string;
  updatedAt: string;
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
// LESSONS LEARNED TYPES
// ============================================

export type LessonDomain =
  | 'health'
  | 'work'
  | 'relationships'
  | 'personal'
  | 'spiritual'
  | 'productivity'
  | 'other';

export type LessonSource = 'ai_extracted' | 'user_entered' | 'evening_review';

export interface LessonLearned {
  id: string;
  userId: string;
  journalEntryId?: string;
  checkinId?: string;
  lessonText: string;
  domain: LessonDomain;
  source: LessonSource;
  isConfirmed: boolean;
  isDismissed: boolean;
  mentionCount: number;
  lastRemindedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BEHAVIORAL PATTERN TYPES
// ============================================

export type PatternSeverity = 'info' | 'warning' | 'alert';

export interface BehavioralPattern {
  id: string;
  userId: string;
  patternKey: string;
  patternDescription: string;
  detectionData: Record<string, unknown>;
  severity: PatternSeverity;
  firstDetectedAt: string;
  lastDetectedAt: string;
  isActive: boolean;
  acknowledgedAt?: string;
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

export type BreathingTestType = 'breath_hold' | 'box_breathing' | '4-7-8' | 'relaxation' | 'custom'
  | 'wim_hof' | 'alternate_nostril' | 'coherent' | 'energising';

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

// ============================================
// VOICE JOURNAL SESSION TYPES
// ============================================

export type VoiceJournalStatus = 'active' | 'summarizing' | 'review' | 'completed' | 'abandoned';

export interface VoiceJournalTranscriptEntry {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  audioDurationMs?: number;
}

export interface VoiceJournalSession {
  id: string;
  userId: string;
  status: VoiceJournalStatus;
  exchangeCount: number;
  transcript: VoiceJournalTranscriptEntry[];
  summaryMood?: string;
  summaryThemes?: string[];
  summaryLessons?: string[];
  summaryActionItems?: string[];
  summaryText?: string;
  journalEntryId?: string;
  totalDurationSeconds: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceJournalTurnResponse {
  userTranscript: string;
  aiResponse: string;
  exchangeCount: number;
  readyToSummarize: boolean;
}

export interface VoiceJournalSummary {
  mood: string;
  themes: string[];
  lessons: string[];
  actionItems: string[];
  journalText: string;
}

// ============================================
// HEALTH CORRELATION / INSIGHT TYPES
// ============================================

export type PatternCategory = 'correlation' | 'theme' | 'behavioral';

export type CorrelationType =
  | 'sleep_mood_negative'
  | 'exercise_gratitude'
  | 'best_day_profile'
  | 'sleep_energy_correlation'
  | 'recovery_mood_correlation'
  | 'stress_exercise_inverse';

export interface HealthCorrelation {
  id: string;
  userId: string;
  correlationType: CorrelationType;
  headline: string;
  insight: string;
  correlationStrength: number;
  dataPoints: number;
  confidence: 'high' | 'medium' | 'low';
  windowDays: number;
  isActive: boolean;
  dismissedAt?: string;
  computedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// THEME DETECTION TYPES
// ============================================

export type ThemeTag =
  | 'work_stress'
  | 'relationship_conflict'
  | 'health_concern'
  | 'financial_worry'
  | 'gratitude'
  | 'personal_growth'
  | 'social_connection'
  | 'family'
  | 'sleep_issues'
  | 'exercise_motivation'
  | 'anxiety'
  | 'self_doubt'
  | 'productivity'
  | 'spiritual'
  | 'creative_expression';

export interface ThemeInsight {
  theme: ThemeTag;
  frequency: number;
  percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  temporalPattern?: string;
  coOccurrences?: ThemeTag[];
  antiCorrelations?: ThemeTag[];
}

// ============================================
// GOAL DECOMPOSITION TYPES
// ============================================

export type GoalActionType = 'habit' | 'schedule' | 'journal_prompt' | 'tracking' | 'milestone' | 'behavioral_trick';
export type GoalActionResponseType = 'accept' | 'edit' | 'skip';
export type HealthPillar = 'fitness' | 'nutrition' | 'wellbeing';

export interface GoalAction {
  id: string;
  goalId: string;
  userId: string;
  actionType: GoalActionType;
  title: string;
  description?: string;
  pillar?: HealthPillar;
  frequency?: string;
  isAiGenerated: boolean;
  isCompleted: boolean;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalActionResponseRecord {
  id: string;
  actionId: string;
  userId: string;
  responseType: GoalActionResponseType;
  editedTitle?: string;
  editedDescription?: string;
  createdAt: string;
}

export interface GoalDecomposition {
  actions: GoalAction[];
  milestones: LifeGoalMilestone[];
  pillarMappings: Array<{ pillar: HealthPillar; relevance: string }>;
  motivationCalibration: string;
}
