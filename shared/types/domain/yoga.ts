/**
 * @file Yoga & Meditation Domain Types
 * @description Type definitions for Feature F7.9: Yoga & Meditation Module
 */

// ============================================
// POSE TYPES
// ============================================

export type PoseCategory =
  | 'standing'
  | 'seated'
  | 'supine'
  | 'prone'
  | 'inversion'
  | 'balance'
  | 'twist'
  | 'backbend'
  | 'forward_fold'
  | 'hip_opener'
  | 'restorative';

export type PoseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type PoseSide = 'both' | 'left' | 'right';

export interface PoseCue {
  step: number;
  instruction: string;
  breathDirection: 'inhale' | 'exhale' | 'natural';
}

export interface YogaPose {
  id: string;
  englishName: string;
  sanskritName?: string;
  slug: string;
  category: PoseCategory;
  difficulty: PoseDifficulty;
  description?: string;
  benefits: string[];
  muscleGroups: string[];
  contraindications: string[];
  cues: PoseCue[];
  breathingCue?: string;
  holdSecondsDefault: number;
  svgKey?: string;
  isRecoveryPose: boolean;
  recoveryTargets: string[];
  jointTargets?: PoseTargets;
  createdAt: string;
  updatedAt: string;
}

export interface PoseListFilter {
  category?: PoseCategory;
  difficulty?: PoseDifficulty;
  muscleGroup?: string;
  isRecovery?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// SESSION TYPES
// ============================================

export type YogaSessionType =
  | 'recovery_flow'
  | 'morning_flow'
  | 'evening_flow'
  | 'power_yoga'
  | 'gentle_stretch'
  | 'hip_opener_flow'
  | 'balance_flow'
  | 'sleep_prep'
  | 'eye_exercise'
  | 'face_yoga'
  | 'desk_stretch'
  | 'breathwork_focus'
  | 'custom'
  | 'ai_generated';

export type MeditationMode =
  | 'guided'
  | 'yoga_nidra'
  | 'breathwork_only'
  | 'silent_timer'
  | 'nature_sounds'
  | 'mantra';

export type SessionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type AmbientTheme = 'forest' | 'ocean' | 'mountain' | 'night' | 'sunrise' | 'space';

// ============================================
// SESSION PHASE TYPES
// ============================================

export type PhaseType =
  | 'warmup'
  | 'flow'
  | 'peak'
  | 'cooldown'
  | 'savasana'
  | 'breathwork'
  | 'meditation'
  | 'transition';

export type BreathingPattern =
  | 'natural'
  | 'ujjayi'
  | '4-7-8'
  | 'box'
  | 'coherent'
  | 'wim_hof'
  | 'alternate_nostril'
  | 'energising';

export interface SessionPhasePose {
  poseSlug: string;
  holdSeconds: number;
  repetitions?: number;
  side: PoseSide;
}

export interface SessionPhase {
  phaseType: PhaseType;
  name: string;
  durationSeconds: number;
  poses: SessionPhasePose[];
  breathingPattern: BreathingPattern;
  narrationScript?: string;
  musicTag?: string;
}

// ============================================
// YOGA SESSION
// ============================================

export interface YogaSession {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  sessionType: YogaSessionType;
  meditationMode?: MeditationMode;
  difficulty: SessionDifficulty;
  durationMinutes: number;
  isTemplate: boolean;
  isAiGenerated: boolean;
  phases: SessionPhase[];
  generationPrompt?: string;
  whoopContext?: WhoopSessionContext;
  workoutContext?: WorkoutSessionContext;
  ambientTheme: AmbientTheme;
  backgroundMusicTag?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhoopSessionContext {
  recoveryScore?: number;
  hrv?: number;
  strain?: number;
  sleepScore?: number;
  sleepDurationHours?: number;
}

export interface WorkoutSessionContext {
  workoutId?: string;
  workoutType?: string;
  muscleGroups?: string[];
  durationMinutes?: number;
  strain?: number;
}

// ============================================
// SESSION LOG TYPES
// ============================================

export interface YogaSessionLog {
  id: string;
  userId: string;
  sessionId?: string;
  sessionType: YogaSessionType;
  meditationMode?: MeditationMode;
  startedAt: string;
  completedAt?: string;
  actualDurationSeconds?: number;
  completionRate?: number;
  phasesCompleted: number;
  phasesTotal: number;
  moodBefore?: number; // 1-10
  moodAfter?: number; // 1-10
  difficultyRating?: number; // 1-5
  effectivenessRating?: number; // 1-10
  notes?: string;
  voiceGuideUsed: boolean;
  musicPlayed: boolean;
  poseCorrectionUsed: boolean;
  preSessionHrv?: number;
  recoveryScoreAtTime?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StartSessionInput {
  sessionId: string;
  moodBefore?: number;
  preSessionHrv?: number;
  recoveryScoreAtTime?: number;
}

export interface UpdateSessionLogInput {
  phasesCompleted?: number;
  actualDurationSeconds?: number;
  voiceGuideUsed?: boolean;
  musicPlayed?: boolean;
  poseCorrectionUsed?: boolean;
}

export interface CompleteSessionInput {
  moodAfter?: number;
  difficultyRating?: number;
  effectivenessRating?: number;
  notes?: string;
  completionRate?: number;
  phasesCompleted?: number;
  actualDurationSeconds?: number;
}

// ============================================
// MEDITATION TIMER TYPES
// ============================================

export type MeditationTimerMode = 'silent_timer' | 'nature_sounds' | 'mantra';

export type AmbientSound = 'rain' | 'ocean' | 'forest' | 'fire' | 'birds' | 'silence';

export interface MeditationTimer {
  id: string;
  userId: string;
  mode: MeditationTimerMode;
  durationMinutes: number;
  ambientSound?: AmbientSound;
  intervalBellSeconds: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface StartMeditationInput {
  mode: MeditationTimerMode;
  durationMinutes: number;
  ambientSound?: AmbientSound;
  intervalBellSeconds?: number;
}

// ============================================
// STREAK & PROGRESS TYPES
// ============================================

export interface YogaStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
  lastSessionDate?: string;
  milestonesAchieved: YogaMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface YogaMilestone {
  milestone: string;
  achievedAt: string;
}

export type YogaMilestoneType =
  | '3_day_streak'
  | '7_day_streak'
  | '14_day_streak'
  | '30_day_streak'
  | '10_sessions'
  | '30_sessions'
  | '50_sessions'
  | '100_sessions'
  | '100_minutes'
  | '500_minutes'
  | '1000_minutes'
  | 'first_meditation'
  | 'first_yoga_nidra'
  | 'first_ai_session';

// ============================================
// STATS & HISTORY TYPES
// ============================================

export interface YogaStats {
  streak: YogaStreak;
  totalSessions: number;
  totalMinutes: number;
  averageDurationMinutes: number;
  averageMoodDelta: number;
  sessionsByType: Array<{ sessionType: string; count: number }>;
  heatmapData: Array<{ date: string; count: number }>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface YogaHistoryFilter {
  sessionType?: YogaSessionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// AI SESSION GENERATION TYPES
// ============================================

export type SessionGoal =
  | 'relaxation'
  | 'energy'
  | 'flexibility'
  | 'strength'
  | 'recovery'
  | 'sleep_prep'
  | 'stress_relief'
  | 'focus';

export interface GenerateSessionInput {
  sessionType: YogaSessionType;
  goal: SessionGoal;
  durationMinutes: number;
  difficulty?: SessionDifficulty;
  mood?: number; // 1-10
  meditationMode?: MeditationMode;
  includeBreathwork?: boolean;
  focusMuscleGroups?: string[];
}

// ============================================
// RECOVERY SUGGESTION TYPES
// ============================================

export interface RecoverySuggestion {
  recommended: boolean;
  reason: string;
  sessionType: YogaSessionType;
  durationMinutes: number;
  focusAreas: string[];
  poses: string[]; // pose slugs
  whoopContext?: WhoopSessionContext;
  workoutContext?: WorkoutSessionContext;
}

// ============================================
// VOICE GUIDE TYPES
// ============================================

export interface VoiceScriptSegment {
  text: string;
  delayMs: number;
}

export interface GenerateVoiceScriptInput {
  phase: SessionPhase;
  sessionType: YogaSessionType;
  userName?: string;
}

// ============================================
// SLEEP PREP TYPES
// ============================================

export interface SleepPrepCheck {
  shouldTrigger: boolean;
  reason?: string;
  sleepReadiness?: number;
  recommendedSession?: YogaSession;
  estimatedDurationMinutes?: number;
}

// ============================================
// BREATHWORK TIMER TYPES (Client-side)
// ============================================

export interface BreathworkPatternConfig {
  name: string;
  pattern: BreathingPattern;
  inhaleMs: number;
  holdMs: number;
  exhaleMs: number;
  holdAfterExhaleMs: number;
  cycles: number;
  description: string;
}

export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale' | 'rest';

export interface BreathworkTimerState {
  phase: BreathPhase;
  progress: number; // 0-1
  cycleNumber: number;
  totalCycles: number;
  isComplete: boolean;
  secondsRemaining: number;
}

// ============================================
// SESSION PLAYER TYPES (Client-side)
// ============================================

export type SessionPlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'complete';

export interface SessionPlayerContext {
  state: SessionPlayerState;
  session: YogaSession | null;
  currentPhaseIndex: number;
  currentPhase: SessionPhase | null;
  elapsedSeconds: number;
  phaseElapsedSeconds: number;
  totalDurationSeconds: number;
}

// ============================================
// YOUTUBE VIDEO TYPES
// ============================================

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

// ============================================
// AI POSE COACHING TYPES
// ============================================

/** Target angle for a single joint */
export interface JointTarget {
  angle: number;      // target degrees 0-180
  tolerance: number;  // acceptable deviation in degrees
}

/** Map of joint name to target angle */
export type PoseTargets = Record<string, JointTarget>;

/** Current angles detected by MediaPipe */
export type JointAngles = Record<string, number>;

/** Status of a single body part from Gemini analysis */
export interface BodyPartStatus {
  part: string;
  status: 'correct' | 'needs_adjustment' | 'incorrect';
  feedback: string;
}

export type CoachEmotion =
  | 'proud'
  | 'encouraging'
  | 'calm'
  | 'strict'
  | 'concerned'
  | 'celebratory'
  | 'playful'
  | 'intense';

/** Structured coaching result from Gemini Vision */
export interface CoachingResult {
  overallScore: number;
  overallFeedback: string;
  primaryCorrection: string;
  bodyParts: BodyPartStatus[];
  breathingCue: string;
  encouragement: string;
  holdRecommendation?: string;
  coachEmotion: CoachEmotion;
}

/** Request payload for POST /api/v1/wellbeing/yoga/coach */
export interface CoachAnalyseRequest {
  poseSlug: string;
  frameBase64: string;
  currentAngles: JointAngles;
  elapsedSeconds: number;
}

/** Response from coach endpoint */
export interface CoachAnalyseResponse {
  coaching: CoachingResult;
  ttsText?: string;
}
