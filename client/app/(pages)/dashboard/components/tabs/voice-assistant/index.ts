// Types and constants
export type { VoiceState, VoiceAssistantTabProps, EmergencyResourcesData } from "./voice-types";
export { COACH_AVATAR_VRM_URL, SILENCE_THRESHOLD, MIN_SPEECH_LENGTH, NUDGE_DELAY_MS } from "./voice-constants";

// Utility functions
export { detectMoodFromText, getAuthToken, cleanTextForTTS } from "./voice-utils";

// Hooks
export { useVoiceRecognition } from "./useVoiceRecognition";
export { useVoiceTTS } from "./useVoiceTTS";
export { useVoiceCamera } from "./useVoiceCamera";
export { useAvatarUpload } from "./useAvatarUpload";

// Components
export { SessionSelectorModal } from "./SessionSelectorModal";
export { SpeechNotSupported } from "./SpeechNotSupported";
