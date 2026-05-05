/**
 * @file Message Type Classifier
 * @description Fast, synchronous first-stage classifier that determines message type
 * BEFORE any async work (tool loading, profile fetch, RAG retrieval).
 *
 * Messages classified as greeting/casual_chat/gratitude bypass the entire
 * tool + context pipeline for sub-500ms TTFT.
 */


// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType =
  | 'greeting'
  | 'casual_chat'
  | 'gratitude'
  | 'follow_up'
  | 'command'
  | 'domain_intent';

export interface MessageClassification {
  type: MessageType;
  confidence: number;
  /** True when the message can skip tool loading + heavy context assembly */
  isLightweight: boolean;
}

// ============================================
// PATTERN DEFINITIONS
// ============================================

const GREETING_EXACT = new Set([
  'hi', 'hello', 'hey', 'yo', 'howdy', 'hola', 'sup', 'hiya',
  'salaam', 'salam', 'greetings', 'heya', 'aloha',
  'good morning', 'good afternoon', 'good evening', 'good night',
  'morning', 'afternoon', 'evening',
  'hi there', 'hey there', 'hello there',
  'assalamu alaikum', 'assalam alaikum', 'as salaam alaikum',
  'salaam alaikum', 'salam alaikum',
  'wassalam', 'wa alaikum assalam',
]);

const GREETING_PREFIXES = [
  'hi ', 'hey ', 'hello ', 'yo ', 'hiya ', 'heya ',
  'good morning', 'good afternoon', 'good evening',
  'morning ', 'evening ',
  'salaam ', 'salam ',
];

const CASUAL_CHAT_PATTERNS = [
  'how are you', "how're you", 'how r u', 'how u doing',
  "how's it going", 'hows it going', "how's everything",
  "what's up", 'whats up', 'wazzup', 'wassup', "what's new", 'whats new',
  "how's your day", 'hows your day',
  "how's life", "what's happening", 'whats happening',
  "how have you been", "how've you been",
  "long time no see", "missed you",
  "how do you do",
];

const GRATITUDE_PATTERNS = [
  'thanks', 'thank you', 'thank u', 'thx', 'ty',
  'appreciate it', 'appreciate that', 'much appreciated',
  'awesome', 'perfect', 'great', 'wonderful', 'excellent', 'amazing',
  'cool', 'nice', 'nice one', 'sweet',
  'got it', 'understood', 'makes sense', 'i see',
  'alright', 'sounds good', 'sounds great',
  'good to know', 'noted',
  'jazakallah', 'jazak allah', 'barakallah',
  'alhamdulillah', 'mashallah', 'ma sha allah',
];

const FOLLOW_UP_EXACT = new Set([
  'yes', 'no', 'yeah', 'yep', 'yup', 'nope', 'nah',
  'sure', 'ok', 'okay', 'k', 'kk',
  'do it', 'go ahead', 'proceed', 'continue',
  'why', 'how', 'when', 'where', 'what', 'who',
  'tell me more', 'more details', 'explain',
  'really', 'seriously', 'wow',
  'and', 'also', 'plus', 'but', 'hmm', 'hm',
  'lol', 'haha', 'hehe', 'lmao',
]);

const COMMAND_PREFIXES = [
  'create ', 'add ', 'log ', 'delete ', 'remove ', 'update ', 'edit ',
  'set ', 'change ', 'modify ', 'cancel ', 'start ', 'stop ', 'pause ',
  'resume ', 'schedule ', 'reschedule ', 'plan ',
  'show me ', 'give me ', 'get me ', 'find ', 'search ',
  'play ', 'skip ', 'next ', 'previous ',
];

// Domain keywords that override greeting/casual classification
// (e.g., "hi, can you log my breakfast" should NOT be lightweight)
const DOMAIN_SIGNALS = [
  'workout', 'exercise', 'meal', 'food', 'eat', 'calorie', 'protein',
  'weight', 'goal', 'schedule', 'plan', 'diet', 'recipe', 'cook',
  'sleep', 'stress', 'mood', 'journal', 'water', 'hydration',
  'whoop', 'recovery', 'fitness', 'gym', 'training', 'muscle',
  'run', 'cardio', 'yoga', 'lift', 'stretch',
  'log ', 'track ', 'create ', 'add ', 'delete ', 'update ', 'show ',
  'breakfast', 'lunch', 'dinner', 'snack',
  'competition', 'challenge', 'leaderboard', 'xp', 'level', 'streak',
  'music', 'song', 'playlist', 'spotify', 'pulse',
  'reminder', 'alarm', 'notification',
  'sick', 'injured', 'traveling', 'vacation',
];

// ============================================
// CLASSIFIER
// ============================================

function classify(message: string): MessageClassification {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;

  // Very short empty-ish messages — treat as follow-up
  if (trimmed.length === 0) {
    return { type: 'follow_up', confidence: 1.0, isLightweight: true };
  }

  // Check for domain signals as whole words in the message.
  // If present, this is NOT a lightweight message regardless of greeting prefix.
  const hasDomainSignal = DOMAIN_SIGNALS.some(signal => {
    if (signal.endsWith(' ')) return lower.includes(signal);
    const re = new RegExp(`\\b${signal}\\b`);
    return re.test(lower);
  });

  // --- GREETING ---
  if (!hasDomainSignal) {
    // Exact match (whole message is a greeting)
    if (GREETING_EXACT.has(lower)) {
      return { type: 'greeting', confidence: 1.0, isLightweight: true };
    }

    // Greeting prefix for short messages (e.g., "hi how are you", "good morning!", "hi! 👋")
    if (trimmed.length < 40 && GREETING_PREFIXES.some(p => {
      if (lower.startsWith(p)) return true;
      const base = p.trimEnd();
      return lower.startsWith(base + '!') || lower.startsWith(base + ',') || lower.startsWith(base + '.');
    })) {
      return { type: 'greeting', confidence: 0.9, isLightweight: true };
    }

    // Single emoji or very short non-alpha (e.g., "👋", "😊", "🙏")
    if (trimmed.length <= 4 && !/[a-zA-Z]{2,}/.test(trimmed)) {
      return { type: 'greeting', confidence: 0.8, isLightweight: true };
    }
  }

  // --- CASUAL CHAT ---
  if (!hasDomainSignal && CASUAL_CHAT_PATTERNS.some(p => lower.includes(p))) {
    if (trimmed.length < 60) {
      return { type: 'casual_chat', confidence: 0.9, isLightweight: true };
    }
  }

  // --- GRATITUDE ---
  if (!hasDomainSignal) {
    const isGratitude = GRATITUDE_PATTERNS.some(p => lower === p || lower.startsWith(p + ' ') || lower.startsWith(p + '!') || lower.startsWith(p + '.') || lower.startsWith(p + ','));
    if (isGratitude && trimmed.length < 50) {
      return { type: 'gratitude', confidence: 0.9, isLightweight: true };
    }
  }

  // --- FOLLOW-UP ---
  if (FOLLOW_UP_EXACT.has(lower) || (wordCount <= 3 && trimmed.length < 20 && !hasDomainSignal)) {
    if (FOLLOW_UP_EXACT.has(lower)) {
      return { type: 'follow_up', confidence: 0.95, isLightweight: true };
    }
    // Short non-domain messages — likely contextual follow-up
    if (!hasDomainSignal && trimmed.length < 15) {
      return { type: 'follow_up', confidence: 0.7, isLightweight: true };
    }
  }

  // --- COMMAND ---
  if (COMMAND_PREFIXES.some(p => lower.startsWith(p))) {
    return { type: 'command', confidence: 0.85, isLightweight: false };
  }

  // --- DEFAULT: DOMAIN INTENT ---
  return { type: 'domain_intent', confidence: 0.5, isLightweight: false };
}

// ============================================
// SERVICE EXPORT
// ============================================

export const messageTypeClassifier = {
  classify,

  /** Check if a message type should bypass tools + heavy context */
  isLightweight(type: MessageType): boolean {
    return type === 'greeting' || type === 'casual_chat' || type === 'gratitude';
  },

  /** Check if a message type should load tools but can use a lighter context */
  isFollowUp(type: MessageType): boolean {
    return type === 'follow_up';
  },
};
