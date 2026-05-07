import type { VisionStateEvent, VisionCoachingEvent } from "@/lib/socket-client";
import type { MoodProfile } from "@/lib/avatar/coachPersonality";
import type { AvatarLayerHandle } from "@/components/avatar/AvatarLayer";
import type { SessionTypeOption } from "../../voice-assistant/SessionTypeSelector";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface VoiceAssistantTabProps {
  callId?: string | null;
  callPurpose?: string | null;
  onCallEnd?: () => void;
}

/**
 * Consolidated state for the voice assistant, grouped by domain.
 */
export interface VoiceAssistantState {
  // Core conversation
  voiceState: VoiceState;
  conversationId: string | null;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  isConversationActive: boolean;
  error: string | null;

  // Speech support
  isSpeechSupported: boolean;
  isTTSEnabled: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
  useAssemblyAIFallback: boolean;

  // Camera / image
  showImageModal: boolean;
  imageModalMode: "camera" | "upload";
  showInlineCamera: boolean;
  inlineCameraMode: "camera" | "upload";
  capturedImage: string | null;
  imageFile: File | null;
  isAnalyzing: boolean;
  analysisResult: string | null;
  isCameraActive: boolean;
  shouldAutoCapture: boolean;
  shouldAutoAnalyze: boolean;
  imageDescription: string;

  // Vision coaching
  isVisionActive: boolean;
  visionState: VisionStateEvent | null;
  visionCoaching: VisionCoachingEvent | null;

  // Avatar
  showAvatarUpload: boolean;
  avatarUploadFile: File | null;
  avatarPreview: string | null;
  isUploadingAvatar: boolean;

  // Session
  sessionType: SessionTypeOption | null;
  showSessionSelector: boolean;
  showEmergencyResources: boolean;
  emergencyResources: EmergencyResourcesData | undefined;

  // Call
  callId: string | null;
  isCallActive: boolean;
}

export interface EmergencyResourcesData {
  country?: string;
  hotlines: Array<{
    name: string;
    number: string;
    type: "suicide_prevention" | "crisis_text" | "emergency" | "local";
    description?: string;
  }>;
}

/**
 * Consolidated refs used across the voice assistant.
 */
export interface VoiceAssistantRefs {
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
  silenceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  pendingTranscriptRef: React.MutableRefObject<string>;
  conversationIdRef: React.MutableRefObject<string | null>;
  isConversationActiveRef: React.MutableRefObject<boolean>;
  inlineVideoRef: React.RefObject<HTMLVideoElement | null>;
  inlineCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  inlineStreamRef: React.MutableRefObject<MediaStream | null>;
  inlineFileInputRef: React.RefObject<HTMLInputElement | null>;
  isTTSEnabledRef: React.MutableRefObject<boolean>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  startListeningRef: React.MutableRefObject<(() => void) | null>;
  speakResponseRef: React.MutableRefObject<((text: string) => void) | null>;
  processWithStreamRef: React.MutableRefObject<((text: string) => Promise<void>) | null>;
  isTTSActiveRef: React.MutableRefObject<boolean>;
  currentUtteranceRef: React.MutableRefObject<SpeechSynthesisUtterance | null>;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentAudioUrlRef: React.MutableRefObject<string | null>;
  avatarDirectiveTimersRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>;
  avatarRef: React.RefObject<AvatarLayerHandle | null>;
  isListeningActiveRef: React.MutableRefObject<boolean>;
  processingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  restartTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isRestartingRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  isRecordingRef: React.MutableRefObject<boolean>;
  recordingStreamRef: React.MutableRefObject<MediaStream | null>;
  visionIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  visionFrameIntervalMs: React.MutableRefObject<number>;
  visionCleanupRef: React.MutableRefObject<(() => void) | null>;
  avatarFileInputRef: React.RefObject<HTMLInputElement | null>;
  sessionTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  sessionCountdownRef: React.MutableRefObject<NodeJS.Timeout | null>;
  callMarkedActiveRef: React.MutableRefObject<boolean>;
  moodProfileRef: React.MutableRefObject<MoodProfile>;
  promptContextRef: React.MutableRefObject<string>;
}
