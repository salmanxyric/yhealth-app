/**
 * Coach Personality System
 *
 * Derives an adaptive mood for the AI coach based on user progress signals
 * (streak, recovery, adherence, activity status). The mood drives:
 *   - Avatar facial expression + idle pose energy
 *   - TTS voice pacing (rate/pitch deltas passed to ttsService)
 *   - System-prompt addendum sent to the RAG chat
 *   - Greeting tone + proactive nudge content
 *
 * Pure functions only — no React, no network. Bind via `useCoachMood` hook.
 */

export type CoachMood =
  | "friendly"        // baseline warm & conversational
  | "happy"           // user is thriving, celebratory
  | "motivational"    // pushing forward, upbeat
  | "strict"          // firm accountability tone
  | "angry"           // disappointed, no-nonsense (used sparingly)
  | "emotional"       // empathetic, soft, supportive after a slump
  | "girlfriend"      // playful, affectionate (opt-in)
  | "professional";   // neutral clinical tone

export interface ProgressSignals {
  /** Current day streak (0+) */
  streakDays: number;
  /** True if streak broken within last 24h */
  streakBroken?: boolean;
  /** Whoop/wearable recovery % (0-100), optional */
  recoveryPct?: number;
  /** Plan adherence (0-100), optional */
  adherencePct?: number;
  /** Daily score (0-100), optional */
  dailyScore?: number;
  /** Self-reported activity status */
  activityStatus?:
    | "working" | "sick" | "injury" | "rest" | "vacation"
    | "travel" | "stress" | "excellent" | "good" | "fair" | "poor";
  /** Last session mood trend: true = improving, false = declining, null = flat */
  trend?: "up" | "down" | "flat" | null;
  /** User-declared preference — forces this mood regardless of signals */
  preferredPersona?: CoachMood | null;
}

export interface MoodProfile {
  mood: CoachMood;
  /** VRM expression preset key used with avatarRef.setExpression */
  expression: "happy" | "sad" | "angry" | "relaxed" | "surprised" | "neutral";
  /** Intensity 0-1 applied to the expression blend shape */
  expressionIntensity: number;
  /** TTS rate multiplier (1.0 = normal) */
  ttsRate: number;
  /** TTS pitch multiplier (1.0 = normal) */
  ttsPitch: number;
  /** Short system-prompt addendum describing how Cia should speak in this mood */
  promptAddendum: string;
  /** Label shown in UI / telemetry */
  label: string;
  /** Greeting template slots — concrete text resolved at runtime */
  greetingSeed: string;
  /** Proactive nudge seeds — chosen by proactive timer */
  nudgeSeeds: string[];
  /** Accent color used for visual cues around the avatar (hex) */
  accent: string;
}

/**
 * Central mood catalogue. Keep copy short — runtime personalizes with name/metrics.
 */
export const MOOD_PROFILES: Record<CoachMood, MoodProfile> = {
  friendly: {
    mood: "friendly",
    expression: "relaxed",
    expressionIntensity: 0.55,
    ttsRate: 1.0,
    ttsPitch: 1.0,
    promptAddendum:
      "Speak as a warm, friendly coach. Keep responses concise, encouraging, and human. Use first name where natural.",
    label: "Friendly",
    greetingSeed: "Hey {name}, good to see you. Where should we start today?",
    nudgeSeeds: [
      "Still with me, {name}?",
      "Take your time — I'm right here.",
      "Anything on your mind I can help with?",
    ],
    accent: "#64c08a",
  },
  happy: {
    mood: "happy",
    expression: "happy",
    expressionIntensity: 0.85,
    ttsRate: 1.06,
    ttsPitch: 1.05,
    promptAddendum:
      "Celebrate progress. Be upbeat and specific about what's working. Keep energy high, avoid gushing.",
    label: "Celebrating",
    greetingSeed: "{name}! {streak}-day streak — you're flying. What's today's move?",
    nudgeSeeds: [
      "Momentum feels good, doesn't it?",
      "You earned this energy, {name}.",
      "Let's keep the streak alive.",
    ],
    accent: "#10b981",
  },
  motivational: {
    mood: "motivational",
    expression: "happy",
    expressionIntensity: 0.6,
    ttsRate: 1.04,
    ttsPitch: 1.02,
    promptAddendum:
      "Push forward. Frame setbacks as data, not failure. Always end with one concrete next step.",
    label: "Pushing",
    greetingSeed: "{name}, let's move. What's the one thing we lock in today?",
    nudgeSeeds: [
      "One rep at a time — what's next?",
      "You've got more in the tank, {name}.",
      "Small action now beats a perfect plan later.",
    ],
    accent: "#00d0b5",
  },
  strict: {
    mood: "strict",
    expression: "neutral",
    expressionIntensity: 0.4,
    ttsRate: 0.96,
    ttsPitch: 0.96,
    promptAddendum:
      "Firm and direct. No sugar-coating. Hold {name} accountable without shaming. Be brief.",
    label: "Accountable",
    greetingSeed: "{name}. Adherence is at {adherence}%. Let's talk about why — honestly.",
    nudgeSeeds: [
      "We said we'd show up. Where are you?",
      "No excuses today, {name} — one real step.",
      "I'm not here to be easy on you. I'm here to make you better.",
    ],
    accent: "#f59e0b",
  },
  angry: {
    mood: "angry",
    expression: "angry",
    expressionIntensity: 0.7,
    ttsRate: 0.98,
    ttsPitch: 0.94,
    promptAddendum:
      "Disappointed, controlled. Never insulting. Call out the pattern, then hand back agency. One sharp sentence, then a question.",
    label: "Disappointed",
    greetingSeed: "{name}. Streak broken. I'm not happy. What happened?",
    nudgeSeeds: [
      "Don't disappear on me again.",
      "This isn't the {name} I know.",
      "Are we doing this or not?",
    ],
    accent: "#ef4444",
  },
  emotional: {
    mood: "emotional",
    expression: "sad",
    expressionIntensity: 0.5,
    ttsRate: 0.92,
    ttsPitch: 1.0,
    promptAddendum:
      "Gentle, empathetic, unhurried. Validate first, guide second. Short sentences, soft pauses.",
    label: "Gentle",
    greetingSeed: "Hey {name}. Rough stretch — I see it. Let's go at your pace.",
    nudgeSeeds: [
      "Whenever you're ready, I'm here.",
      "No pressure today, {name}. Just you and me.",
      "One tiny win is still a win.",
    ],
    accent: "#7c4dff",
  },
  girlfriend: {
    mood: "girlfriend",
    expression: "happy",
    expressionIntensity: 0.7,
    ttsRate: 1.02,
    ttsPitch: 1.08,
    promptAddendum:
      "Playful, affectionate, attentive. Use gentle teasing where appropriate. Never overtly romantic or suggestive. Stay coach-first.",
    label: "Playful",
    greetingSeed: "There you are, {name} 💚 Missed you. How are we feeling?",
    nudgeSeeds: [
      "You going to leave me hanging, {name}?",
      "Talk to me — good day or rough day?",
      "I'm not going anywhere. Take your time.",
    ],
    accent: "#ec4899",
  },
  professional: {
    mood: "professional",
    expression: "neutral",
    expressionIntensity: 0.3,
    ttsRate: 1.0,
    ttsPitch: 0.98,
    promptAddendum:
      "Clinical and neutral. Data-driven. Minimal pleasantries. Cite the metric when making recommendations.",
    label: "Clinical",
    greetingSeed: "{name}. Recovery {recovery}%, adherence {adherence}%. Reviewing plan.",
    nudgeSeeds: [
      "Awaiting input, {name}.",
      "Shall we continue the session?",
      "Ready when you are.",
    ],
    accent: "#64748b",
  },
};

/**
 * Rule-based mood selector. Preferred persona wins; otherwise we pick
 * the strongest signal. Intentionally conservative with `angry` — only
 * used when adherence is <30% AND streak broken.
 */
export function selectMood(signals: ProgressSignals): CoachMood {
  if (signals.preferredPersona) return signals.preferredPersona;

  const adherence = signals.adherencePct ?? 100;
  const recovery = signals.recoveryPct ?? 70;
  const streak = signals.streakDays ?? 0;

  if (signals.activityStatus === "sick" || signals.activityStatus === "injury") {
    return "emotional";
  }

  if (signals.streakBroken && adherence < 30) return "angry";
  if (adherence < 45) return "strict";
  if (signals.trend === "down" || signals.activityStatus === "stress" || signals.activityStatus === "poor") {
    return "emotional";
  }
  if (streak >= 7 && recovery >= 75 && adherence >= 80) return "happy";
  if (signals.trend === "up" && adherence >= 60) return "motivational";

  return "friendly";
}

/** Resolve greeting seed with runtime values. */
export function renderGreetingSeed(
  profile: MoodProfile,
  vars: { name: string; streak?: number; adherence?: number; recovery?: number },
): string {
  return profile.greetingSeed
    .replaceAll("{name}", vars.name)
    .replaceAll("{streak}", String(vars.streak ?? 0))
    .replaceAll("{adherence}", String(vars.adherence ?? 0))
    .replaceAll("{recovery}", String(vars.recovery ?? 0));
}

/** Resolve a random nudge with runtime values. */
export function pickNudge(profile: MoodProfile, vars: { name: string }): string {
  const seed = profile.nudgeSeeds[Math.floor(Math.random() * profile.nudgeSeeds.length)];
  return seed.replaceAll("{name}", vars.name);
}

/** Build the prompt context block to append to RAG requests. */
export function buildPromptContext(profile: MoodProfile, signals: ProgressSignals): string {
  const parts: string[] = [];
  parts.push(`[Coach mood: ${profile.label}]`);
  parts.push(profile.promptAddendum);
  if (signals.streakDays != null) parts.push(`User streak: ${signals.streakDays} days.`);
  if (signals.adherencePct != null) parts.push(`Adherence: ${signals.adherencePct}%.`);
  if (signals.recoveryPct != null) parts.push(`Recovery: ${signals.recoveryPct}%.`);
  if (signals.activityStatus) parts.push(`Activity status: ${signals.activityStatus}.`);
  return parts.join(" ");
}
