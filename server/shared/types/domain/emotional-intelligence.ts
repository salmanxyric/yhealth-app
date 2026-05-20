// server/shared/types/domain/emotional-intelligence.ts

// ── Emotion Categories ──────────────────────────────────

export type EmotionCategory =
  | 'joy' | 'contentment' | 'excitement' | 'gratitude' | 'hope'
  | 'sadness' | 'grief' | 'loneliness' | 'emptiness'
  | 'anxiety' | 'worry' | 'panic' | 'overwhelm'
  | 'anger' | 'frustration' | 'resentment' | 'irritation'
  | 'fear' | 'insecurity' | 'vulnerability' | 'shame'
  | 'confusion' | 'numbness' | 'disconnection'
  | 'determination' | 'curiosity' | 'calm' | 'neutral';

export type ToneMarker =
  | 'passive' | 'deflecting' | 'aggressive' | 'flat'
  | 'warm' | 'guarded' | 'performative' | 'desperate'
  | 'resigned' | 'intellectualizing' | 'minimizing' | 'catastrophizing';

export type HiddenState =
  | 'masking' | 'suppressing' | 'contradicting'
  | 'avoiding' | 'dissociating' | 'people_pleasing'
  | 'emotional_shutdown' | 'hypervigilance';

export type BehavioralPatternType =
  | 'self_sabotage_loop' | 'avoidance_cycle' | 'emotional_dependency'
  | 'perfectionism_paralysis' | 'burnout_spiral' | 'dopamine_seeking'
  | 'conflict_avoidance' | 'overcommitment_pattern';

export interface BehavioralPattern {
  type: BehavioralPatternType;
  frequency: number;
  lastOccurrence: string;
  confidence: number;
}

export interface RiskFlag {
  severity: 'low' | 'medium' | 'high';
  category: string;
  description: string;
}

// ── Emotional Context (EI Engine Output) ────────────────

export interface EmotionalContext {
  primaryEmotion: EmotionCategory;
  secondaryEmotion?: EmotionCategory;
  emotionalIntensity: number;
  confidence: number;

  toneMarkers: ToneMarker[];
  hiddenStates: HiddenState[];
  behavioralPatterns: BehavioralPattern[];

  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  riskFlags: RiskFlag[];

  energyEstimate: 'low' | 'moderate' | 'high';
  cognitiveLoad: 'light' | 'heavy' | 'overloaded';
  motivationState: 'seeking' | 'present' | 'declining' | 'absent';
  sleepQuality?: 'poor' | 'fair' | 'good';
  recentStressLevel?: number;

  needsEmpathy: boolean;
  needsChallenge: boolean;
  needsStructure: boolean;
  needsSilence: boolean;
  isAvoidingTruth: boolean;
  isSelfSabotaging: boolean;
  isEmotionallyOverwhelmed: boolean;

  moodTrajectory: 'improving' | 'stable' | 'declining' | 'volatile';
  comparedToBaseline: 'above' | 'at' | 'below';

  engagementLevel: 'high' | 'moderate' | 'low' | 'withdrawing';
  responseComplexity: 'expanding' | 'stable' | 'shrinking';
}

// ── Persona Types ───────────────────────────────────────

export const SIA_PERSONA_IDS = [
  'deep_listener',
  'therapist',
  'calm_mentor',
  'strategic_advisor',
  'brutal_accountability',
  'performance_coach',
  'wellness_strategist',
  'reflective_philosopher',
  'emotional_recovery',
  'founder_advisor',
] as const;

export type SiaPersonaType = (typeof SIA_PERSONA_IDS)[number];

export interface PersonaDirective {
  primaryPersona: SiaPersonaType;
  blendWeight: number;
  secondaryPersona?: SiaPersonaType;
  secondaryWeight?: number;

  responseLength: 'minimal' | 'concise' | 'standard' | 'expansive';
  questionDensity: 'none' | 'one' | 'few';
  challengeLevel: number;
  warmthLevel: number;
  structureLevel: number;
  vulnerabilityTolerance: number;

  shouldConfirm: boolean;
  shouldUseMCQ: boolean;
  shouldEscalate: boolean;

  avoid: string[];

  openingStyle: 'acknowledge_first' | 'question_first' | 'insight_first' | 'silence_then_speak';
  closingStyle: 'action_item' | 'reflection_prompt' | 'validation' | 'open_ended' | 'none';
}

// ── Neutral Defaults (cold start / fallback) ────────────

export const NEUTRAL_EMOTIONAL_CONTEXT: EmotionalContext = {
  primaryEmotion: 'neutral',
  emotionalIntensity: 20,
  confidence: 0.3,
  toneMarkers: [],
  hiddenStates: [],
  behavioralPatterns: [],
  riskLevel: 'none',
  riskFlags: [],
  energyEstimate: 'moderate',
  cognitiveLoad: 'light',
  motivationState: 'present',
  needsEmpathy: false,
  needsChallenge: false,
  needsStructure: false,
  needsSilence: false,
  isAvoidingTruth: false,
  isSelfSabotaging: false,
  isEmotionallyOverwhelmed: false,
  moodTrajectory: 'stable',
  comparedToBaseline: 'at',
  engagementLevel: 'moderate',
  responseComplexity: 'stable',
};

export const DEFAULT_PERSONA_DIRECTIVE: PersonaDirective = {
  primaryPersona: 'calm_mentor',
  blendWeight: 1.0,
  responseLength: 'standard',
  questionDensity: 'one',
  challengeLevel: 4,
  warmthLevel: 6,
  structureLevel: 5,
  vulnerabilityTolerance: 3,
  shouldConfirm: false,
  shouldUseMCQ: false,
  shouldEscalate: false,
  avoid: ['generic_motivation', 'toxic_positivity'],
  openingStyle: 'acknowledge_first',
  closingStyle: 'action_item',
};

// ── EI Engine Input/Output ──────────────────────────────

export interface EIAnalysisInput {
  userId: string;
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  existingPatterns?: BehavioralPattern[];
  sleepQuality?: 'poor' | 'fair' | 'good';
  recentStressLevel?: number;
  recentMoodLogs?: Array<{ state: string; intensity: number; created_at: string }>;
  timeOfDay?: number;
}

export interface TopicClassification {
  domain: string;
  subtype?: string;
}
