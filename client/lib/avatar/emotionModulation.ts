/**
 * @file Emotion Modulation Parameters
 * @description Per-emotion modulation table that controls animation intensity,
 * frequency, posture, blink rate, eye saccade behavior, and finger curl
 * across ALL animation subsystems. The RAF loop reads one entry per frame.
 */

// ============================================
// TYPES
// ============================================

export interface EmotionModulators {
  /** Multiplier on idle channel amplitudes (1.0 = default). */
  amplitudeScale: number;
  /** Multiplier on idle channel frequencies (1.0 = default). */
  frequencyScale: number;
  /** Additive spine tilt in radians (+forward, -backward). */
  postureLean: number;
  /** Shoulder raise offset in radians (+ = raised/hunched, - = relaxed/dropped). */
  shoulderOffset: number;
  /** Blink interval range [minSeconds, maxSeconds]. */
  blinkInterval: [number, number];
  /** Probability of a double-blink (0-1). */
  doubleBlinkProb: number;
  /** Eye saccade interval range [minSeconds, maxSeconds]. */
  saccadeInterval: [number, number];
  /** Eye saccade amplitude range [minDeg, maxDeg]. */
  saccadeAmplitude: [number, number];
  /** Base finger curl change in radians (+ = more curled, - = more open). */
  fingerCurlOffset: number;
  /** Finger micro-movement amplitude multiplier. */
  fingerMicroScale: number;
  /** Weight-shift amplitude multiplier. */
  weightShiftScale: number;
}

// ============================================
// MODULATOR TABLE
// ============================================

export const EMOTION_MODULATORS: Record<string, EmotionModulators> = {
  neutral: {
    amplitudeScale: 1.0,
    frequencyScale: 1.0,
    postureLean: 0,
    shoulderOffset: 0,
    blinkInterval: [2, 6],
    doubleBlinkProb: 0.15,
    saccadeInterval: [0.8, 2.0],
    saccadeAmplitude: [1, 4],
    fingerCurlOffset: 0,
    fingerMicroScale: 1.0,
    weightShiftScale: 1.0,
  },
  happy: {
    amplitudeScale: 1.3,
    frequencyScale: 1.2,
    postureLean: -0.015, // slight backward (chest open, confident)
    shoulderOffset: -0.02, // relaxed/dropped shoulders
    blinkInterval: [2, 5],
    doubleBlinkProb: 0.2,
    saccadeInterval: [0.6, 1.5],
    saccadeAmplitude: [2, 5],
    fingerCurlOffset: -0.02, // more open hand
    fingerMicroScale: 1.3,
    weightShiftScale: 1.4,
  },
  sad: {
    amplitudeScale: 0.6,
    frequencyScale: 0.7,
    postureLean: 0.03, // slumped forward
    shoulderOffset: 0.03, // raised/hunched
    blinkInterval: [3, 8], // slow blinking
    doubleBlinkProb: 0.05,
    saccadeInterval: [1.5, 3.0],
    saccadeAmplitude: [0.5, 2],
    fingerCurlOffset: 0.02, // slightly curled
    fingerMicroScale: 0.5,
    weightShiftScale: 0.5,
  },
  angry: {
    amplitudeScale: 0.7, // tense, restricted
    frequencyScale: 1.1,
    postureLean: 0.02, // slight lean forward (aggressive)
    shoulderOffset: 0.02, // raised tense
    blinkInterval: [1.5, 4], // faster blinking
    doubleBlinkProb: 0.1,
    saccadeInterval: [0.3, 1.0], // darting eyes
    saccadeAmplitude: [1, 3],
    fingerCurlOffset: 0.08, // fist tendency
    fingerMicroScale: 0.3, // tight, minimal movement
    weightShiftScale: 0.6,
  },
  relaxed: {
    amplitudeScale: 1.1,
    frequencyScale: 0.8, // slow, flowing
    postureLean: -0.01,
    shoulderOffset: -0.03, // very relaxed
    blinkInterval: [3, 7],
    doubleBlinkProb: 0.2,
    saccadeInterval: [1.0, 2.5],
    saccadeAmplitude: [1, 3],
    fingerCurlOffset: -0.01,
    fingerMicroScale: 0.8,
    weightShiftScale: 1.2,
  },
  surprised: {
    amplitudeScale: 0.3, // brief freeze
    frequencyScale: 0.5,
    postureLean: -0.02, // lean back
    shoulderOffset: -0.01,
    blinkInterval: [1, 3],
    doubleBlinkProb: 0.3,
    saccadeInterval: [0.2, 0.8], // wide darting eyes
    saccadeAmplitude: [3, 7],
    fingerCurlOffset: -0.04, // fingers spread
    fingerMicroScale: 1.5,
    weightShiftScale: 0.4,
  },
};

// ============================================
// HELPERS
// ============================================

/** All numeric keys on EmotionModulators (for lerp transitions). */
export const MODULATOR_NUMERIC_KEYS: (keyof EmotionModulators)[] = [
  "amplitudeScale",
  "frequencyScale",
  "postureLean",
  "shoulderOffset",
  "doubleBlinkProb",
  "fingerCurlOffset",
  "fingerMicroScale",
  "weightShiftScale",
];

/** Tuple keys that need per-element lerp. */
export const MODULATOR_TUPLE_KEYS: (keyof EmotionModulators)[] = [
  "blinkInterval",
  "saccadeInterval",
  "saccadeAmplitude",
];
