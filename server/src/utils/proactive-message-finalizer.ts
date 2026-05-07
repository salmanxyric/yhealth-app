export const DATA_GAP_MESSAGE_TYPES = new Set<string>([
  'data_gap_dinner',
  'data_gap_mood',
  'data_gap_workout_feedback',
]);

export const COMPLETE_SENTENCE_END_PATTERN = /[.!?…]["'”’)]?$/;

const SENTENCE_END_PATTERN = /[.!?…]["'”’)]?(?=\s|$)/g;
const TRAILING_FRAGMENT_WORD_LIMIT = 4;
const MIN_DATA_GAP_WORDS = 4;
const MIN_COACH_REVIEW_WORDS = 18;
const MIN_COACH_REVIEW_SENTENCES = 2;

export interface FinalizeProactiveCoachMessageParams {
  message: string;
  type: string;
  fallbackMessage: string;
}

export interface FinalizeProactiveCoachMessageResult {
  message: string;
  rejectedReason?: string;
  usedFallback: boolean;
}

export function finalizeProactiveCoachMessage(
  params: FinalizeProactiveCoachMessageParams
): FinalizeProactiveCoachMessageResult {
  const cleaned = params.message.trim();
  if (!cleaned) {
    return { message: '', rejectedReason: 'empty_or_tool_artifact', usedFallback: true };
  }

  const candidate = removeTrailingIncompleteFragment(cleaned);
  if (!candidate) {
    return {
      message: params.fallbackMessage,
      rejectedReason: 'no_complete_sentence',
      usedFallback: true,
    };
  }

  const validation = validateCoachMessage(candidate, params.type);
  if (!validation.valid) {
    return {
      message: params.fallbackMessage,
      rejectedReason: validation.reason,
      usedFallback: true,
    };
  }

  return { message: candidate, usedFallback: false };
}

function removeTrailingIncompleteFragment(message: string): string {
  const cleaned = message.trim();
  if (COMPLETE_SENTENCE_END_PATTERN.test(cleaned)) return cleaned;

  const sentenceEnds = Array.from(cleaned.matchAll(SENTENCE_END_PATTERN));
  const lastEnd = sentenceEnds.at(-1);
  if (!lastEnd || lastEnd.index === undefined) return '';

  const endIndex = lastEnd.index + lastEnd[0].length;
  const completed = cleaned.slice(0, endIndex).trim();
  const trailingFragment = cleaned.slice(endIndex).trim();
  const trailingWords = countWords(trailingFragment);

  if (
    completed.length >= Math.floor(cleaned.length * 0.55) &&
    completed.length > 40 &&
    trailingWords <= TRAILING_FRAGMENT_WORD_LIMIT
  ) {
    return completed;
  }

  return '';
}

function validateCoachMessage(message: string, type: string): { valid: true } | { valid: false; reason: string } {
  if (!COMPLETE_SENTENCE_END_PATTERN.test(message)) {
    return { valid: false, reason: 'missing_sentence_end' };
  }

  const wordCount = countWords(message);
  if (DATA_GAP_MESSAGE_TYPES.has(type)) {
    return wordCount >= MIN_DATA_GAP_WORDS
      ? { valid: true }
      : { valid: false, reason: 'data_gap_too_short' };
  }

  const sentenceCount = Array.from(message.matchAll(SENTENCE_END_PATTERN)).length;
  if (wordCount < MIN_COACH_REVIEW_WORDS) {
    return { valid: false, reason: 'message_too_short_for_review' };
  }
  if (sentenceCount < MIN_COACH_REVIEW_SENTENCES) {
    return { valid: false, reason: 'missing_review_action_structure' };
  }

  return { valid: true };
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
