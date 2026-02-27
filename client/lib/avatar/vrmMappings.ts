/**
 * @file VRM Expression & State Mappings
 * @description Centralized mapping tables from app states, moods, and emotions
 * to VRM 1.0 expression names and intensities.
 */

// ============================================
// TYPES
// ============================================

/** VRM 1.0 emotion expressions (subset we use for the avatar). */
export type AvatarExpression =
  | 'neutral'
  | 'happy'
  | 'angry'
  | 'sad'
  | 'relaxed'
  | 'surprised';

/** Application-level avatar states. */
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

// ============================================
// VOICE STATE MAPPING
// ============================================

/** Map existing VoiceAssistantTab voiceState to AvatarState. */
export const VOICE_STATE_TO_AVATAR_STATE: Record<string, AvatarState> = {
  idle: 'idle',
  listening: 'listening',
  processing: 'thinking',
  speaking: 'speaking',
};

// ============================================
// STATE -> EXPRESSION DEFAULTS
// ============================================

/** Default expression + intensity for each avatar state. */
export const STATE_EXPRESSION_MAP: Record<
  AvatarState,
  { expression: AvatarExpression; intensity: number }
> = {
  idle: { expression: 'neutral', intensity: 0.0 },
  listening: { expression: 'neutral', intensity: 0.0 },
  thinking: { expression: 'neutral', intensity: 0.1 },
  speaking: { expression: 'neutral', intensity: 0.0 },
};

// ============================================
// MOOD / EMOTION -> EXPRESSION
// ============================================

/** Map VoiceAssistantContext userMood to avatar expression. */
export const MOOD_TO_EXPRESSION: Record<string, AvatarExpression> = {
  happy: 'happy',
  neutral: 'neutral',
  sad: 'sad',
  excited: 'surprised',
  calm: 'relaxed',
  stressed: 'angry',
  motivated: 'happy',
};

/** Map backend EmotionCategory (10 values) to 6 VRM expressions. */
export const EMOTION_TO_EXPRESSION: Record<string, AvatarExpression> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  anxious: 'sad',
  calm: 'relaxed',
  stressed: 'angry',
  excited: 'surprised',
  tired: 'relaxed',
  neutral: 'neutral',
  distressed: 'sad',
};

/** Map backend PersonalityMode to default avatar expression. */
export const PERSONALITY_TO_EXPRESSION: Record<string, AvatarExpression> = {
  supportive_coach: 'happy',
  competitive_challenger: 'surprised',
  tough_love: 'angry',
  calm_recovery: 'relaxed',
  performance_strategist: 'neutral',
};

// ============================================
// LIP SYNC — MULTI-VISEME
// ============================================

/** VRM 1.0 viseme expression names. */
export const VRM_VISEMES = ['aa', 'ih', 'ou', 'ee', 'oh'] as const;
export type VrmViseme = (typeof VRM_VISEMES)[number];

/**
 * Viseme blend profiles that cycle during speech.
 * Each profile defines weights for all 5 visemes.
 * The lip-sync system interpolates between adjacent profiles
 * and scales by audio amplitude.
 */
export const VISEME_CYCLE_PROFILES: Array<Record<VrmViseme, number>> = [
  { aa: 1.0, ih: 0.0, ou: 0.0, ee: 0.0, oh: 0.0 }, // open 'ah'
  { aa: 0.0, ih: 0.0, ou: 0.7, ee: 0.0, oh: 0.3 }, // rounded 'oo'
  { aa: 0.3, ih: 0.4, ou: 0.0, ee: 0.3, oh: 0.0 }, // 'ee/ih' blend
  { aa: 0.0, ih: 0.0, ou: 0.0, ee: 0.0, oh: 0.8 }, // 'oh'
  { aa: 0.5, ih: 0.2, ou: 0.0, ee: 0.3, oh: 0.0 }, // mixed open
];

/** Seconds per viseme profile transition during speech. */
export const VISEME_CYCLE_PERIOD = 0.18;

/** @deprecated Use VRM_VISEMES and VISEME_CYCLE_PROFILES for multi-viseme. */
export const LIP_SYNC_EXPRESSION = 'aa' as const;

/** All VRM 1.0 emotion expression names (for reset). */
export const ALL_EMOTION_EXPRESSIONS: AvatarExpression[] = [
  'neutral',
  'happy',
  'angry',
  'sad',
  'relaxed',
  'surprised',
];

/** VRM 1.0 eye direction expression names. */
export const EYE_EXPRESSIONS = ['lookLeft', 'lookRight', 'lookUp', 'lookDown'] as const;
export type VrmEyeExpression = (typeof EYE_EXPRESSIONS)[number];
