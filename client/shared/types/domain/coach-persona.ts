/**
 * Canonical AI Coach product personas (user-selected).
 * Maps to legacy coaching_style for backward compatibility.
 *
 * v2: Expanded from 3 → 4 personas. Old DB values are silently mapped:
 *   drill_sergeant  → commander
 *   gentle_friend   → friend
 *   data_driven_neutral → data_nerd
 *   (new)           → guardian
 */

export const AI_COACH_PERSONA_IDS = [
  'commander',
  'friend',
  'data_nerd',
  'guardian',
] as const;

export type AICoachPersona = (typeof AI_COACH_PERSONA_IDS)[number];

/** Old persona IDs that may still be in the database */
type LegacyPersonaId = 'drill_sergeant' | 'gentle_friend' | 'data_driven_neutral';

const LEGACY_TO_NEW: Record<LegacyPersonaId, AICoachPersona> = {
  drill_sergeant: 'commander',
  gentle_friend: 'friend',
  data_driven_neutral: 'data_nerd',
};

export type LegacyCoachingStyle =
  | 'supportive'
  | 'direct'
  | 'analytical'
  | 'motivational';

export function isAICoachPersona(v: string): v is AICoachPersona {
  return (AI_COACH_PERSONA_IDS as readonly string[]).includes(v);
}

/** Default persona for new users */
export const DEFAULT_AI_COACH_PERSONA: AICoachPersona = 'friend';

/**
 * Normalizes any persona string (including legacy IDs) to a current AICoachPersona.
 */
export function normalizePersonaId(value: string | null | undefined): AICoachPersona {
  if (!value) return DEFAULT_AI_COACH_PERSONA;
  if (isAICoachPersona(value)) return value;
  if (value in LEGACY_TO_NEW) return LEGACY_TO_NEW[value as LegacyPersonaId];
  return DEFAULT_AI_COACH_PERSONA;
}

/** Derive legacy coaching_style row when saving persona (write-through). */
export function coachingStyleForPersona(persona: AICoachPersona): LegacyCoachingStyle {
  switch (persona) {
    case 'commander':
      return 'direct';
    case 'data_nerd':
      return 'analytical';
    case 'guardian':
      return 'supportive';
    case 'friend':
    default:
      return 'supportive';
  }
}

/** One-time / fallback mapping from legacy style to persona. */
export function personaFromCoachingStyle(style: string | null | undefined): AICoachPersona {
  switch (style) {
    case 'direct':
      return 'commander';
    case 'analytical':
      return 'data_nerd';
    case 'motivational':
    case 'supportive':
    default:
      return 'friend';
  }
}
