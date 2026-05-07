/**
 * Detect mood from user text and return the mood string.
 */
export function detectMoodFromText(text: string): "excited" | "happy" | "stressed" | "sad" | "motivated" | "calm" | "neutral" {
  const lowerText = text.toLowerCase();

  if (/\b(great|awesome|amazing|excellent|fantastic|wonderful|happy|excited|joy|love|perfect|best|good|nice|yeah|yes|yay|woohoo|hooray)\b/.test(lowerText)) {
    if (/\b(excited|amazing|fantastic|awesome|woohoo|hooray)\b/.test(lowerText)) {
      return "excited";
    }
    return "happy";
  }

  if (/\b(stress|stressed|worried|anxious|nervous|overwhelmed|tired|exhausted|frustrated|difficult|hard|struggling|problem|issue|help|need)\b/.test(lowerText)) {
    return "stressed";
  }

  if (/\b(sad|down|depressed|upset|disappointed|bad|terrible|awful|horrible|sick|pain|hurt|lonely|miss|sorry)\b/.test(lowerText)) {
    return "sad";
  }

  if (/\b(motivated|ready|let's|let us|go|start|begin|workout|exercise|train|fitness|goal|achieve|progress|improve|strong|power|energy)\b/.test(lowerText)) {
    return "motivated";
  }

  if (/\b(calm|peaceful|relax|relaxed|meditate|breath|breathe|zen|peace|quiet|chill|easy|slow|gentle|soft)\b/.test(lowerText)) {
    return "calm";
  }

  return "neutral";
}

/**
 * Get auth token from cookie.
 */
export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split("; balencia_access_token=");
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

/**
 * Clean markdown/formatting from text for TTS output.
 */
export function cleanTextForTTS(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*]\s/g, "")
    .replace(/\n+/g, ". ")
    .trim();
}
