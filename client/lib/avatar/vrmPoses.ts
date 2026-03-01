/**
 * @file VRM Pose & Animation Constants
 * @description Pure data constants for avatar body poses, state-based posture
 * changes, and data-driven idle animation channels. No runtime dependencies.
 *
 * All quaternion rotations are [x, y, z, w] relative to VRM T-pose.
 */

// ============================================
// DEV HELPER (tree-shaken in production)
// ============================================

/**
 * Convert Euler angles (degrees) to quaternion [x, y, z, w].
 * Use during development to compute pose values, then paste the result.
 */
export function eulerDegToQuat(
  xDeg: number,
  yDeg: number,
  zDeg: number
): [number, number, number, number] {
  const toRad = Math.PI / 180;
  const x = xDeg * toRad;
  const y = yDeg * toRad;
  const z = zDeg * toRad;

  const cx = Math.cos(x / 2), sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2), sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2), sz = Math.sin(z / 2);

  // XYZ order
  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}

// ============================================
// TYPES
// ============================================

/** VRM pose transform — matches @pixiv/three-vrm VRMPose format. */
interface PoseTransform {
  position?: [number, number, number];
  rotation?: [number, number, number, number]; // quaternion [x, y, z, w]
}

/** Partial pose keyed by VRM humanoid bone name. */
type VrmPose = Record<string, PoseTransform>;

/** Idle animation channel — drives a single bone axis with sin() oscillation. */
export interface IdleAnimChannel {
  boneName: string;
  axis: "x" | "y" | "z";
  type: "rotation" | "position";
  amplitude: number; // radians or world units
  frequency: number; // cycles per second
  phase: number; // phase offset in radians
  /**
   * Rotation space. Default "local" (bone.quaternion.multiply).
   * Use "parent" for bones with large rest-pose rotations (upper arms)
   * so that X=forward/back and Z=in/out work correctly.
   */
  space?: "local" | "parent";
}

// ============================================
// IDLE REST POSE (T-POSE FIX)
// ============================================

/**
 * Natural idle rest pose — arms down at sides with hands in front of hips.
 * Premium AAA preset: 15° shoulder forward, 30° elbow bend, 8° wrist curl.
 *
 * Quaternions computed via eulerDegToQuat:
 *   shoulders: Z -10deg / +10deg (drop toward body)
 *   upperArm:  X +15deg (forward), Z -65deg / +65deg (hanging down)
 *   lowerArm:  X -30deg (elbow bend — never fully straight)
 *   hands:     X -8deg (wrist curl)
 *   fingers:   X -7deg (relaxed curl)
 */
export const IDLE_REST_POSE: VrmPose = {
  // Shoulders — drop to bring arms closer to body
  leftShoulder: { rotation: [0, 0, -0.087, 0.996] },
  rightShoulder: { rotation: [0, 0, 0.087, 0.996] },

  // Upper arms — 15° forward lean, hanging at sides — eulerDegToQuat(15, 0, ∓65)
  leftUpperArm: { rotation: [0.110, 0.070, -0.533, 0.836] },
  rightUpperArm: { rotation: [0.110, -0.070, 0.533, 0.836] },

  // Lower arms — 30° elbow bend (never fully straight) — eulerDegToQuat(-30, 0, 0)
  leftLowerArm: { rotation: [-0.259, 0, 0, 0.966] },
  rightLowerArm: { rotation: [-0.259, 0, 0, 0.966] },

  // Hands — 8° wrist curl — eulerDegToQuat(-8, 0, 0)
  leftHand: { rotation: [-0.070, 0, 0, 0.998] },
  rightHand: { rotation: [-0.070, 0, 0, 0.998] },

  // Fingers — relaxed curl (proximal joints only)
  leftIndexProximal: { rotation: [-0.061, 0, 0, 0.998] },
  leftMiddleProximal: { rotation: [-0.070, 0, 0, 0.998] },
  leftRingProximal: { rotation: [-0.061, 0, 0, 0.998] },
  leftLittleProximal: { rotation: [-0.052, 0, 0, 0.999] },
  rightIndexProximal: { rotation: [-0.061, 0, 0, 0.998] },
  rightMiddleProximal: { rotation: [-0.070, 0, 0, 0.998] },
  rightRingProximal: { rotation: [-0.061, 0, 0, 0.998] },
  rightLittleProximal: { rotation: [-0.052, 0, 0, 0.999] },

  // Thumbs — slight inward rotation
  leftThumbProximal: { rotation: [0, 0, -0.087, 0.996] },
  rightThumbProximal: { rotation: [0, 0, 0.087, 0.996] },
};

// ============================================
// STATE-BASED POSE OFFSETS
// ============================================

/** All bone names used across rest pose, state offsets, and finger animations (for bone caching). */
export const ALL_ANIMATED_BONES: string[] = [
  ...Object.keys(IDLE_REST_POSE),
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
  "leftFoot",
  "rightFoot",
  // Intermediate finger bones (for emotion hand offsets)
  "leftIndexIntermediate",
  "leftMiddleIntermediate",
  "leftRingIntermediate",
  "leftLittleIntermediate",
  "leftThumbIntermediate",
  "rightIndexIntermediate",
  "rightMiddleIntermediate",
  "rightRingIntermediate",
  "rightLittleIntermediate",
  "rightThumbIntermediate",
];

/**
 * Per-state ABSOLUTE target poses. Applied via slerp(restQuat → targetQuat).
 *
 * IMPORTANT: These are ABSOLUTE bone quaternions (not offsets to multiply).
 * For torso bones (spine, head) whose rest is identity, the values equal offsets.
 * For arm bones with large rest rotations, values are pre-computed via eulerDegToQuat.
 *
 * Golden rule: Hands stay inside an invisible box in front of the chest.
 * Arms within torso width. No big swings. No overacting.
 *
 * Rest pose: eulerDegToQuat(15, 0, ∓65) upper arms, (-30, 0, 0) elbows
 */
export const STATE_POSE_OFFSETS: Record<string, VrmPose> = {
  idle: {},

  listening: {
    spine: { rotation: [0.035, 0, 0, 0.999] },           // lean forward ~4deg
    head: { rotation: [0.026, 0.035, 0, 0.999] },         // slight attentive tilt
    // Arms barely shift — +2° forward, +1° inward from rest
    // eulerDegToQuat(17, 0, -64)
    leftUpperArm: { rotation: [0.125, 0.078, -0.524, 0.839] },
    rightUpperArm: { rotation: [0.125, -0.078, 0.524, 0.839] },
    // Elbows 3° more bent — eulerDegToQuat(-33, 0, 0)
    leftLowerArm: { rotation: [-0.284, 0, 0, 0.959] },
    rightLowerArm: { rotation: [-0.284, 0, 0, 0.959] },
  },

  thinking: {
    head: { rotation: [0.061, 0, 0.026, 0.998] },         // look down ~7deg + tilt
    spine: { rotation: [0.017, 0, 0, 1.0] },              // slight lean
    // Right arm raised to chin — eulerDegToQuat(40, 0, 20)
    rightUpperArm: { rotation: [0.337, -0.059, 0.163, 0.925] },
    // Elbow deeply bent — eulerDegToQuat(-90, 0, 0)
    rightLowerArm: { rotation: [-0.707, 0, 0, 0.707] },
    // Hand tilted up — eulerDegToQuat(10, 0, 0)
    rightHand: { rotation: [0.087, 0, 0, 0.996] },
    // Left arm stays at rest (not included = no change)
  },

  speaking: {
    spine: { rotation: [0.044, 0, 0, 0.999] },              // 5° engaged forward lean
    upperChest: { rotation: [0.026, 0, 0, 1.0] },           // 3° chest lift
    // Arms forward but CLOSE to body — eulerDegToQuat(35, 5, -58)
    // Z=-58° keeps arms close to body (idle is Z=-65°). Previous Z=-40° was BUG.
    leftUpperArm: { rotation: [0.243, 0.182, -0.450, 0.840] },
    rightUpperArm: { rotation: [0.243, -0.182, 0.450, 0.840] },
    // 70° elbow bend — hands at chest level — eulerDegToQuat(-70, 0, 0)
    leftLowerArm: { rotation: [-0.574, 0, 0, 0.819] },
    rightLowerArm: { rotation: [-0.574, 0, 0, 0.819] },
    // 12° wrist curl — eulerDegToQuat(-12, 0, 0)
    leftHand: { rotation: [-0.105, 0, 0, 0.995] },
    rightHand: { rotation: [-0.105, 0, 0, 0.995] },
  },
};

// ============================================
// EMOTION-SPECIFIC SPEAKING POSES
// ============================================

/**
 * Per-emotion ABSOLUTE target poses while speaking.
 * Overrides STATE_POSE_OFFSETS.speaking when the RAF loop detects a speaking state.
 * Each emotion maps to the user's 6 gesture states:
 *   neutral → Neutral Speaking, happy → Motivational/Energetic,
 *   relaxed → Calm/Supportive, sad → Gentle/Empathetic,
 *   angry → Strong Warning, surprised → Emergency Support.
 *
 * All quaternions pre-computed via eulerDegToQuat.
 */
export const EMOTION_SPEAKING_POSES: Record<string, VrmPose> = {
  // Neutral Speaking: Relaxed forward-resting position
  neutral: {
    spine: { rotation: [0.044, 0, 0, 0.999] },
    upperChest: { rotation: [0.026, 0, 0, 1.0] },
    // eulerDegToQuat(35, 5, -58) — 35° forward, close to body
    leftUpperArm: { rotation: [0.243, 0.182, -0.450, 0.840] },
    rightUpperArm: { rotation: [0.243, -0.182, 0.450, 0.840] },
    leftLowerArm: { rotation: [-0.574, 0, 0, 0.819] },   // 70° elbow
    rightLowerArm: { rotation: [-0.574, 0, 0, 0.819] },
    leftHand: { rotation: [-0.105, 0, 0, 0.995] },
    rightHand: { rotation: [-0.105, 0, 0, 0.995] },
  },

  // Motivational/Energetic: Higher arms, bigger gestures
  happy: {
    spine: { rotation: [0.035, 0, 0, 0.999] },
    upperChest: { rotation: [0.035, 0, 0, 0.999] },
    // eulerDegToQuat(45, 8, -50) — arms higher, slightly more open for energy
    leftUpperArm: { rotation: [0.319, 0.220, -0.365, 0.847] },
    rightUpperArm: { rotation: [0.319, -0.220, 0.365, 0.847] },
    leftLowerArm: { rotation: [-0.500, 0, 0, 0.866] },   // 60° elbow
    rightLowerArm: { rotation: [-0.500, 0, 0, 0.866] },
    leftHand: { rotation: [-0.087, 0, 0, 0.996] },
    rightHand: { rotation: [-0.087, 0, 0, 0.996] },
  },

  // Calm/Supportive: Lower arms, close to body, gentle
  relaxed: {
    spine: { rotation: [0.026, 0, 0, 1.0] },
    upperChest: { rotation: [0.017, 0, 0, 1.0] },
    // eulerDegToQuat(25, 3, -62) — arms low, close
    leftUpperArm: { rotation: [0.172, 0.133, -0.498, 0.840] },
    rightUpperArm: { rotation: [0.172, -0.133, 0.498, 0.840] },
    leftLowerArm: { rotation: [-0.383, 0, 0, 0.924] },   // 45° elbow
    rightLowerArm: { rotation: [-0.383, 0, 0, 0.924] },
    leftHand: { rotation: [-0.070, 0, 0, 0.998] },
    rightHand: { rotation: [-0.070, 0, 0, 0.998] },
  },

  // Gentle/Empathetic: Similar to calm, slightly more closed
  sad: {
    spine: { rotation: [0.044, 0, 0, 0.999] },
    upperChest: { rotation: [0.017, 0, 0, 1.0] },
    // eulerDegToQuat(25, 3, -62) — low, close, protective
    leftUpperArm: { rotation: [0.172, 0.133, -0.498, 0.840] },
    rightUpperArm: { rotation: [0.172, -0.133, 0.498, 0.840] },
    leftLowerArm: { rotation: [-0.423, 0, 0, 0.906] },   // 50° elbow
    rightLowerArm: { rotation: [-0.423, 0, 0, 0.906] },
    leftHand: { rotation: [-0.087, 0, 0, 0.996] },
    rightHand: { rotation: [-0.087, 0, 0, 0.996] },
  },

  // Strong Warning: Tight, controlled, aggressive forward lean
  angry: {
    spine: { rotation: [0.052, 0, 0, 0.999] },
    upperChest: { rotation: [0.035, 0, 0, 0.999] },
    // eulerDegToQuat(40, 5, -55) — forward, tight
    leftUpperArm: { rotation: [0.284, 0.194, -0.420, 0.840] },
    rightUpperArm: { rotation: [0.284, -0.194, 0.420, 0.840] },
    leftLowerArm: { rotation: [-0.643, 0, 0, 0.766] },   // 80° elbow — fists close
    rightLowerArm: { rotation: [-0.643, 0, 0, 0.766] },
    leftHand: { rotation: [-0.130, 0, 0, 0.992] },
    rightHand: { rotation: [-0.130, 0, 0, 0.992] },
  },

  // Emergency Support: Open palms, calming gesture
  surprised: {
    spine: { rotation: [0.035, 0, 0, 0.999] },
    upperChest: { rotation: [0.026, 0, 0, 1.0] },
    // eulerDegToQuat(30, 5, -55) — forward, open
    leftUpperArm: { rotation: [0.210, 0.157, -0.436, 0.861] },
    rightUpperArm: { rotation: [0.210, -0.157, 0.436, 0.861] },
    leftLowerArm: { rotation: [-0.423, 0, 0, 0.906] },   // 50° elbow — open hands visible
    rightLowerArm: { rotation: [-0.423, 0, 0, 0.906] },
    // Slight upward wrist for palm-forward calming gesture
    leftHand: { rotation: [0.044, 0.026, 0, 0.999] },
    rightHand: { rotation: [0.044, -0.026, 0, 0.999] },
  },
};

// ============================================
// ARM ROTATION CLAMP LIMITS
// ============================================

/**
 * Euler-angle clamp ranges (radians) for arm bones while speaking.
 * Applied as post-processing after all gesture layers to prevent
 * unnatural backward rotations or spreading.
 *
 * Upper arm X: forward/back — prevent backward rotation (negative X)
 * Upper arm Z: spread — prevent T-pose spreading (left: more negative = closer)
 * Lower arm X: elbow bend — never fully straight or over-bent
 */
export const ARM_CLAMP_LIMITS = {
  upperArmX: { min: -0.087, max: 1.047 },  // -5° to 60° forward
  upperArmZ: { min: -1.222, max: -0.698 },  // -70° to -40° (left side; negate for right)
  lowerArmX: { min: -1.745, max: -0.262 },  // -100° to -15° elbow bend
};

// ============================================
// IDLE ANIMATION CHANNELS
// ============================================

/** Continuous idle sway — layered on top of rest pose every frame. */
export const IDLE_ANIM_CHANNELS: IdleAnimChannel[] = [
  // --- Breathing + head movement ---
  { boneName: "hips", axis: "y", type: "position", amplitude: 0.003, frequency: 0.75, phase: 0 },
  { boneName: "spine", axis: "x", type: "rotation", amplitude: 0.008, frequency: 0.75, phase: 0 },
  { boneName: "head", axis: "y", type: "rotation", amplitude: 0.05, frequency: 0.35, phase: 0 },
  { boneName: "head", axis: "x", type: "rotation", amplitude: 0.025, frequency: 0.25, phase: 0 },
  { boneName: "head", axis: "z", type: "rotation", amplitude: 0.015, frequency: 0.18, phase: 1.2 },

  // --- Shoulder breathing (clavicle rise/fall, both in sync) ---
  { boneName: "leftShoulder", axis: "z", type: "rotation", amplitude: 0.006, frequency: 0.75, phase: 0 },
  { boneName: "rightShoulder", axis: "z", type: "rotation", amplitude: 0.006, frequency: 0.75, phase: 0 },

  // --- Arm idle sway (parent space, asymmetric) ---
  { boneName: "leftUpperArm", axis: "z", type: "rotation", amplitude: 0.012, frequency: 0.2, phase: 0, space: "parent" },
  { boneName: "rightUpperArm", axis: "z", type: "rotation", amplitude: 0.010, frequency: 0.2, phase: Math.PI + 0.3, space: "parent" },
  { boneName: "leftUpperArm", axis: "x", type: "rotation", amplitude: 0.010, frequency: 0.12, phase: 0.8, space: "parent" },
  { boneName: "rightUpperArm", axis: "x", type: "rotation", amplitude: 0.008, frequency: 0.12, phase: Math.PI + 1.0, space: "parent" },
  { boneName: "leftLowerArm", axis: "x", type: "rotation", amplitude: 0.015, frequency: 0.18, phase: 0.5 },
  { boneName: "rightLowerArm", axis: "x", type: "rotation", amplitude: 0.012, frequency: 0.18, phase: Math.PI + 0.7 },

  // --- Hand sway — wrist curl ---
  { boneName: "leftHand", axis: "x", type: "rotation", amplitude: 0.012, frequency: 0.15, phase: 0.3 },
  { boneName: "rightHand", axis: "x", type: "rotation", amplitude: 0.010, frequency: 0.15, phase: Math.PI + 0.5 },

  // --- NEW: Weight shifting (hips left-right sway) ---
  { boneName: "hips", axis: "x", type: "position", amplitude: 0.003, frequency: 0.125, phase: 0 },
  { boneName: "hips", axis: "z", type: "rotation", amplitude: 0.008, frequency: 0.125, phase: 0 },

  // --- NEW: Compensating knee bends for weight shift ---
  { boneName: "leftUpperLeg", axis: "x", type: "rotation", amplitude: 0.012, frequency: 0.125, phase: 0 },
  { boneName: "rightUpperLeg", axis: "x", type: "rotation", amplitude: 0.012, frequency: 0.125, phase: Math.PI },

  // --- Lower leg ankle compensation ---
  { boneName: "leftLowerLeg", axis: "x", type: "rotation", amplitude: 0.008, frequency: 0.125, phase: 0.5 },
  { boneName: "rightLowerLeg", axis: "x", type: "rotation", amplitude: 0.008, frequency: 0.125, phase: Math.PI + 0.5 },

  // --- Foot tilt (ankle roll during weight shift) ---
  { boneName: "leftFoot", axis: "z", type: "rotation", amplitude: 0.005, frequency: 0.125, phase: 0 },
  { boneName: "rightFoot", axis: "z", type: "rotation", amplitude: 0.005, frequency: 0.125, phase: Math.PI },

  // --- Foot flex (toe tap / shift) ---
  { boneName: "leftFoot", axis: "x", type: "rotation", amplitude: 0.006, frequency: 0.08, phase: 1.0 },
  { boneName: "rightFoot", axis: "x", type: "rotation", amplitude: 0.006, frequency: 0.08, phase: Math.PI + 1.0 },
];

// ============================================
// SPEAKING GESTURE CHANNELS
// ============================================

/**
 * Speaking gesture channels — visible conversational gestures.
 * Amplified for full-body camera view. Natural hand movement while speaking.
 */
export const SPEAKING_GESTURE_CHANNELS: IdleAnimChannel[] = [
  // Primary: forward/back arm pulse — BIG gestures visible at full body view
  { boneName: "leftUpperArm", axis: "x", type: "rotation", amplitude: 0.18, frequency: 0.4, phase: 0, space: "parent" },
  { boneName: "rightUpperArm", axis: "x", type: "rotation", amplitude: 0.15, frequency: 0.4, phase: 0.5, space: "parent" },
  // Secondary: slower forward/back sweep for variety
  { boneName: "leftUpperArm", axis: "x", type: "rotation", amplitude: 0.08, frequency: 0.18, phase: 1.0, space: "parent" },
  { boneName: "rightUpperArm", axis: "x", type: "rotation", amplitude: 0.06, frequency: 0.22, phase: 0.8, space: "parent" },
  // In/out gesture spread (wide gestures)
  { boneName: "leftUpperArm", axis: "z", type: "rotation", amplitude: 0.08, frequency: 0.25, phase: 0.3, space: "parent" },
  { boneName: "rightUpperArm", axis: "z", type: "rotation", amplitude: 0.06, frequency: 0.25, phase: Math.PI + 0.5, space: "parent" },
  // Elbow flex pulse — dramatic (asymmetric — dominant arm gestures more)
  { boneName: "leftLowerArm", axis: "x", type: "rotation", amplitude: 0.14, frequency: 0.45, phase: 0.2 },
  { boneName: "rightLowerArm", axis: "x", type: "rotation", amplitude: 0.10, frequency: 0.45, phase: 0.8 },
  // Slower elbow wave for natural variety
  { boneName: "leftLowerArm", axis: "x", type: "rotation", amplitude: 0.06, frequency: 0.15, phase: 2.0 },
  { boneName: "rightLowerArm", axis: "x", type: "rotation", amplitude: 0.05, frequency: 0.20, phase: 1.5 },
  // Wrist curl emphasis — visible hand movement
  { boneName: "leftHand", axis: "x", type: "rotation", amplitude: 0.10, frequency: 0.5, phase: 0.1 },
  { boneName: "rightHand", axis: "x", type: "rotation", amplitude: 0.08, frequency: 0.5, phase: 0.7 },
  // Wrist twist (palm rotation during emphasis)
  { boneName: "leftHand", axis: "y", type: "rotation", amplitude: 0.06, frequency: 0.3, phase: 0.4 },
  { boneName: "rightHand", axis: "y", type: "rotation", amplitude: 0.05, frequency: 0.3, phase: 1.1 },
  // Shoulder emphasis (synced with speech pulse)
  { boneName: "leftShoulder", axis: "z", type: "rotation", amplitude: 0.04, frequency: 0.4, phase: 0 },
  { boneName: "rightShoulder", axis: "z", type: "rotation", amplitude: 0.03, frequency: 0.4, phase: 0.5 },
  // Head nod during speaking (emphasizes points) — prominent
  { boneName: "head", axis: "x", type: "rotation", amplitude: 0.06, frequency: 0.5, phase: 0.3 },
  { boneName: "head", axis: "y", type: "rotation", amplitude: 0.04, frequency: 0.25, phase: 1.0 },
  // Torso rotation (shifting weight during conversation)
  { boneName: "spine", axis: "y", type: "rotation", amplitude: 0.03, frequency: 0.2, phase: 0 },
  { boneName: "chest", axis: "y", type: "rotation", amplitude: 0.02, frequency: 0.2, phase: 0.3 },
];

// ============================================
// FINGER IDLE MICRO-MOVEMENTS
// ============================================

/** Subtle finger curl/uncurl — layered every frame, scaled by emotion modulator. */
export const FINGER_IDLE_CHANNELS: IdleAnimChannel[] = [
  // Left hand
  { boneName: "leftIndexProximal", axis: "x", type: "rotation", amplitude: 0.015, frequency: 0.18, phase: 0 },
  { boneName: "leftMiddleProximal", axis: "x", type: "rotation", amplitude: 0.012, frequency: 0.15, phase: 0.7 },
  { boneName: "leftRingProximal", axis: "x", type: "rotation", amplitude: 0.010, frequency: 0.22, phase: 1.4 },
  { boneName: "leftLittleProximal", axis: "x", type: "rotation", amplitude: 0.008, frequency: 0.20, phase: 2.1 },
  { boneName: "leftThumbProximal", axis: "x", type: "rotation", amplitude: 0.006, frequency: 0.12, phase: 0.5 },
  // Right hand (mirrored phases)
  { boneName: "rightIndexProximal", axis: "x", type: "rotation", amplitude: 0.015, frequency: 0.18, phase: Math.PI },
  { boneName: "rightMiddleProximal", axis: "x", type: "rotation", amplitude: 0.012, frequency: 0.15, phase: Math.PI + 0.7 },
  { boneName: "rightRingProximal", axis: "x", type: "rotation", amplitude: 0.010, frequency: 0.22, phase: Math.PI + 1.4 },
  { boneName: "rightLittleProximal", axis: "x", type: "rotation", amplitude: 0.008, frequency: 0.20, phase: Math.PI + 2.1 },
  { boneName: "rightThumbProximal", axis: "x", type: "rotation", amplitude: 0.006, frequency: 0.12, phase: Math.PI + 0.5 },
];

// ============================================
// SPEAKING FINGER CHANNELS
// ============================================

/** Finger open/close emphasis during speech — visible gesticulation. */
export const SPEAKING_FINGER_CHANNELS: IdleAnimChannel[] = [
  // Finger curl during speech — dramatic, visible at full-body view
  { boneName: "rightIndexProximal", axis: "x", type: "rotation", amplitude: 0.12, frequency: 0.5, phase: 0 },
  { boneName: "rightMiddleProximal", axis: "x", type: "rotation", amplitude: 0.10, frequency: 0.5, phase: 0.4 },
  { boneName: "rightRingProximal", axis: "x", type: "rotation", amplitude: 0.08, frequency: 0.5, phase: 0.7 },
  { boneName: "rightLittleProximal", axis: "x", type: "rotation", amplitude: 0.07, frequency: 0.5, phase: 1.0 },
  { boneName: "leftIndexProximal", axis: "x", type: "rotation", amplitude: 0.10, frequency: 0.45, phase: Math.PI },
  { boneName: "leftMiddleProximal", axis: "x", type: "rotation", amplitude: 0.08, frequency: 0.45, phase: Math.PI + 0.4 },
  { boneName: "leftRingProximal", axis: "x", type: "rotation", amplitude: 0.07, frequency: 0.45, phase: Math.PI + 0.7 },
  { boneName: "leftLittleProximal", axis: "x", type: "rotation", amplitude: 0.06, frequency: 0.45, phase: Math.PI + 1.0 },
];

// ============================================
// EMOTION-LINKED HAND POSE OFFSETS
// ============================================

/**
 * Per-emotion static hand poses — applied as quaternion offsets via slerp.
 * Blended in the same way as STATE_POSE_OFFSETS.
 */
export const EMOTION_HAND_OFFSETS: Record<string, VrmPose> = {
  angry: {
    // Fist: strong finger curl
    leftIndexProximal: { rotation: [-0.35, 0, 0, 0.94] },
    leftIndexIntermediate: { rotation: [-0.40, 0, 0, 0.92] },
    leftMiddleProximal: { rotation: [-0.35, 0, 0, 0.94] },
    leftMiddleIntermediate: { rotation: [-0.40, 0, 0, 0.92] },
    leftRingProximal: { rotation: [-0.35, 0, 0, 0.94] },
    leftRingIntermediate: { rotation: [-0.40, 0, 0, 0.92] },
    leftLittleProximal: { rotation: [-0.30, 0, 0, 0.95] },
    leftLittleIntermediate: { rotation: [-0.35, 0, 0, 0.94] },
    leftThumbProximal: { rotation: [-0.15, 0, -0.15, 0.98] },
    rightIndexProximal: { rotation: [-0.35, 0, 0, 0.94] },
    rightIndexIntermediate: { rotation: [-0.40, 0, 0, 0.92] },
    rightMiddleProximal: { rotation: [-0.35, 0, 0, 0.94] },
    rightMiddleIntermediate: { rotation: [-0.40, 0, 0, 0.92] },
    rightRingProximal: { rotation: [-0.35, 0, 0, 0.94] },
    rightRingIntermediate: { rotation: [-0.40, 0, 0, 0.92] },
    rightLittleProximal: { rotation: [-0.30, 0, 0, 0.95] },
    rightLittleIntermediate: { rotation: [-0.35, 0, 0, 0.94] },
    rightThumbProximal: { rotation: [-0.15, 0, 0.15, 0.98] },
  },

  happy: {
    // Open relaxed spread — fingers slightly extended
    leftIndexProximal: { rotation: [-0.02, 0, 0.02, 1.0] },
    leftMiddleProximal: { rotation: [-0.02, 0, 0, 1.0] },
    leftRingProximal: { rotation: [-0.02, 0, -0.02, 1.0] },
    leftLittleProximal: { rotation: [-0.02, 0, -0.03, 1.0] },
    rightIndexProximal: { rotation: [-0.02, 0, -0.02, 1.0] },
    rightMiddleProximal: { rotation: [-0.02, 0, 0, 1.0] },
    rightRingProximal: { rotation: [-0.02, 0, 0.02, 1.0] },
    rightLittleProximal: { rotation: [-0.02, 0, 0.03, 1.0] },
  },

  sad: {
    // Limp, slightly more curled than rest
    leftIndexProximal: { rotation: [-0.10, 0, 0, 0.995] },
    leftMiddleProximal: { rotation: [-0.12, 0, 0, 0.993] },
    leftRingProximal: { rotation: [-0.10, 0, 0, 0.995] },
    leftLittleProximal: { rotation: [-0.08, 0, 0, 0.997] },
    rightIndexProximal: { rotation: [-0.10, 0, 0, 0.995] },
    rightMiddleProximal: { rotation: [-0.12, 0, 0, 0.993] },
    rightRingProximal: { rotation: [-0.10, 0, 0, 0.995] },
    rightLittleProximal: { rotation: [-0.08, 0, 0, 0.997] },
  },

  surprised: {
    // Fingers spread wide
    leftIndexProximal: { rotation: [0.02, 0, 0.06, 0.998] },
    leftMiddleProximal: { rotation: [0.02, 0, 0.02, 1.0] },
    leftRingProximal: { rotation: [0.02, 0, -0.04, 0.999] },
    leftLittleProximal: { rotation: [0.02, 0, -0.07, 0.997] },
    rightIndexProximal: { rotation: [0.02, 0, -0.06, 0.998] },
    rightMiddleProximal: { rotation: [0.02, 0, -0.02, 1.0] },
    rightRingProximal: { rotation: [0.02, 0, 0.04, 0.999] },
    rightLittleProximal: { rotation: [0.02, 0, 0.07, 0.997] },
  },
};
