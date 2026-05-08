"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useVoiceAssistant } from "@/app/context/VoiceAssistantContext";
import { ttsService } from "@/src/shared/services/tts.service";
import { ActionCommand } from "@/src/shared/services/rag-chat.service";
import { parseActionsFromResponse, executeAction } from "@/src/shared/services/action-handler.service";
import { navigateToPage } from "@/src/shared/utils/navigation.helper";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";
import { ImageAnalysisModal } from "../modals/ImageAnalysisModal";
import { ragChatService } from "@/src/shared/services/rag-chat.service";
import { voiceCallService } from "@/src/shared/services/voice-call.service";

// Import extracted components from voice-assistant subdir (next to this file)
import { VisionCoachingOverlay } from "../voice-assistant/VisionCoachingOverlay";
import { AvatarLayer, type AvatarLayerHandle } from "@/components/avatar/AvatarLayer";
import { VOICE_STATE_TO_AVATAR_STATE } from "@/lib/avatar/vrmMappings";
import { SESSION_DURATIONS } from "../voice-assistant/SessionTypeSelector";
import { EmergencyResources } from "../voice-assistant/EmergencyResources";
import { JarvisLoader } from "@/components/voice-assistant/JarvisLoader";
import { CiaBrandBadge } from "../voice-assistant/CiaBrandBadge";
import { StatusPill } from "../voice-assistant/StatusPill";
import { TopRightControls } from "../voice-assistant/TopRightControls";
import { CameraPip } from "../voice-assistant/CameraPip";
import { AICoachTranscript } from "../voice-assistant/AICoachTranscript";
import { BottomControlBar } from "../voice-assistant/BottomControlBar";

// Coach personality / mood system
import { useCoachMood } from "@/hooks/useCoachMood";
import type { MoodProfile } from "@/lib/avatar/coachPersonality";

// Extracted modules (next to this file in voice-assistant/)
import type { VoiceState, VoiceAssistantTabProps, EmergencyResourcesData } from "./voice-assistant/voice-types";
import { COACH_AVATAR_VRM_URL, NUDGE_DELAY_MS } from "./voice-assistant/voice-constants";
import { detectMoodFromText, getAuthToken } from "./voice-assistant/voice-utils";
import { useVoiceRecognition } from "./voice-assistant/useVoiceRecognition";
import { useVoiceTTS } from "./voice-assistant/useVoiceTTS";
import { useVoiceCamera } from "./voice-assistant/useVoiceCamera";
import { useAvatarUpload } from "./voice-assistant/useAvatarUpload";
import { SessionSelectorModal } from "./voice-assistant/SessionSelectorModal";
import { SpeechNotSupported } from "./voice-assistant/SpeechNotSupported";
import type { SessionTypeOption } from "../voice-assistant/SessionTypeSelector";

export function VoiceAssistantTab({ callId: initialCallId, callPurpose, onCallEnd }: VoiceAssistantTabProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const { setUserMood, selectedLanguage, setSelectedLanguage, assistantName, voiceGender } = useVoiceAssistant();

  // Coach personality / adaptive mood
  const coachMood = useCoachMood({ userName: user?.firstName || "", enabled: !!user });
  const moodProfileRef = useRef<MoodProfile>(coachMood.profile);
  const promptContextRef = useRef<string>(coachMood.promptContext);
  useEffect(() => {
    moodProfileRef.current = coachMood.profile;
    promptContextRef.current = coachMood.promptContext;
  }, [coachMood.profile, coachMood.promptContext]);

  // URL-based callId fallback
  const [urlCallId, setUrlCallId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const callIdFromUrl = params.get("callId");
      if (callIdFromUrl) setUrlCallId(callIdFromUrl);
    }
  }, []);
  const effectiveCallId = initialCallId || urlCallId;

  // ── Core conversation state ──
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalMode] = useState<"camera" | "upload">("upload");
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [sessionType, setSessionType] = useState<SessionTypeOption | null>(null);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [showEmergencyResources, setShowEmergencyResources] = useState(false);
  const [emergencyResources, setEmergencyResources] = useState<EmergencyResourcesData | undefined>(undefined);
  const [callId, setCallId] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // ── Refs ──
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const pendingTranscriptRef = useRef<string>("");
  const conversationIdRef = useRef<string | null>(null);
  const isConversationActiveRef = useRef<boolean>(false);
  const isTTSEnabledRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startListeningRef = useRef<(() => void) | null>(null);
  const speakResponseRef = useRef<((text: string) => void) | null>(null);
  const processWithStreamRef = useRef<((text: string) => Promise<void>) | null>(null);
  const isTTSActiveRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const avatarDirectiveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const avatarRef = useRef<AvatarLayerHandle>(null);
  const isListeningActiveRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestartingRef = useRef<boolean>(false);
  const callMarkedActiveRef = useRef(false);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const [_sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [_sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);

  // Keep refs in sync
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);
  useEffect(() => { isConversationActiveRef.current = isConversationActive; }, [isConversationActive]);
  useEffect(() => { isTTSEnabledRef.current = isTTSEnabled; }, [isTTSEnabled]);

  // ── Camera hook ──
  const camera = useVoiceCamera({
    isTTSEnabledRef,
    speakResponseRef,
    speakWithBrowserTTS: (text: string) => ttsActions.speakWithBrowserTTS(text),
  });

  // ── Recognition hook ──
  const recognition = useVoiceRecognition({
    selectedLanguage,
    capturedImage: camera.capturedImage,
    imageFile: camera.imageFile,
    setImageDescription: camera.setImageDescription,
    setShouldAutoAnalyze: camera.setShouldAutoAnalyze,
    recognitionRef,
    silenceTimerRef,
    isProcessingRef,
    pendingTranscriptRef,
    isConversationActiveRef,
    isTTSActiveRef,
    isListeningActiveRef,
    isRestartingRef,
    restartTimeoutRef,
    abortControllerRef,
    startListeningRef,
    processWithStreamRef,
    setVoiceState,
    setTranscript,
    setInterimTranscript,
    setError,
  });

  // ── TTS hook ──
  const ttsActions = useVoiceTTS({
    selectedVoice: recognition.selectedVoice,
    selectedLanguage,
    voiceGender,
    avatarRef,
    moodProfileRef,
    isConversationActiveRef,
    isProcessingRef,
    isListeningActiveRef,
    isTTSActiveRef,
    isTTSEnabledRef,
    currentUtteranceRef,
    currentAudioRef,
    currentAudioUrlRef,
    avatarDirectiveTimersRef,
    recognitionRef,
    startListeningRef,
    setVoiceState,
  });

  // ── Avatar upload hook ──
  useAvatarUpload();

  // ── Detect mood wrapper ──
  const detectMood = useCallback(
    (text: string) => {
      const mood = detectMoodFromText(text);
      setUserMood(mood);
    },
    [setUserMood],
  );

  // ── Sync callId from props or URL ──
  useEffect(() => {
    if (effectiveCallId) {
      setCallId(effectiveCallId);
      setIsCallActive(true);
      callMarkedActiveRef.current = false;
    } else if (!initialCallId && !urlCallId) {
      setIsCallActive(false);
    }
  }, [effectiveCallId, initialCallId, urlCallId]);

  // End call when unmounting
  useEffect(() => {
    return () => {
      if (callId && isCallActive) {
        voiceCallService.endCall(callId).then(() => {
          onCallEnd?.();
        }).catch((err) => {
          console.warn("[VoiceAssistant] Failed to end call:", err);
        });
      }
    };
  }, [callId, isCallActive, onCallEnd]);

  // Fetch greeting with call purpose
  const fetchGreetingWithPurpose = useCallback(async (): Promise<string | null> => {
    try {
      if (!callPurpose) return null;
      const baseLang = selectedLanguage ? selectedLanguage.split("-")[0] : undefined;
      const response = await ragChatService.getGreeting(callPurpose, baseLang);
      return response.greeting;
    } catch (error) {
      console.error("[VoiceAssistant] Error fetching greeting with purpose:", error);
      return null;
    }
  }, [callPurpose, selectedLanguage]);

  // Mark call as active on page load
  useEffect(() => {
    if (effectiveCallId && !callMarkedActiveRef.current) {
      callMarkedActiveRef.current = true;
      setCallId(effectiveCallId);
      setIsCallActive(true);
      voiceCallService.markActive(effectiveCallId).catch((error) => {
        console.error("[VoiceAssistant] Failed to mark call as active:", error);
      });
    }
  }, [effectiveCallId]);

  // Auto-start conversation for active call
  useEffect(() => {
    if (effectiveCallId && !isConversationActive) {
      const timer = setTimeout(async () => {
        setIsConversationActive(true);
        isConversationActiveRef.current = true;
        setAiResponse("");
        setTranscript("");

        try {
          if (callPurpose) {
            const greeting = await fetchGreetingWithPurpose();
            if (greeting) {
              setAiResponse(greeting);
              if (isTTSEnabledRef.current && speakResponseRef.current) {
                await speakResponseRef.current(greeting);
              } else {
                setTimeout(() => {
                  startListeningRef.current?.();
                }, 500);
              }
              return;
            }
          }
        } catch (err) {
          console.error("[VoiceAssistant] Error fetching greeting with purpose:", err);
        }

        toast.success("Connected! Start speaking...");
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCallId, callPurpose, fetchGreetingWithPurpose]);

  // Handle end call
  const handleEndCall = useCallback(async () => {
    if (callId) {
      try {
        setIsConversationActive(false);
        isConversationActiveRef.current = false;
        setVoiceState("idle");
        await voiceCallService.endCall(callId);
        toast.success("Call ended");
        setCallId(null);
        setIsCallActive(false);
        onCallEnd?.();
        router.push("/dashboard?tab=overview");
      } catch (err) {
        console.error("[VoiceAssistant] Failed to end call:", err);
        toast.error("Failed to end call");
        router.push("/dashboard?tab=overview");
      }
    } else {
      router.push("/dashboard?tab=overview");
    }
  }, [callId, onCallEnd, router]);

  // ── Execute actions from AI response ──
  const executeActionsAsync = useCallback(
    async (actions: ActionCommand[]) => {
      for (const action of actions) {
        try {
          if (action.type === "navigate") {
            const navigated = navigateToPage(router, action.target);
            if (!navigated) console.warn(`[VoiceAssistant] Could not navigate to ${action.target}`);
          } else {
            await executeAction(
              action,
              router,
              (tabId: string) => navigateToPage(router, tabId),
              async (target: string, params?: Record<string, unknown>) => {
                if (target.includes("workout") || target.includes("plan")) {
                  try {
                    const plansResponse = await api.get<{ plans?: Array<{ id: string; status?: string }> }>("/workouts/plans");
                    const activePlan = plansResponse.data?.plans?.find((p) => p.status === "active");
                    if (activePlan) {
                      const response = await api.patch(`/workouts/plans/${activePlan.id}`, params || {});
                      return response.success || false;
                    }
                  } catch (error) {
                    console.error("[VoiceAssistant] Error updating plan:", error);
                    return false;
                  }
                }
                return false;
              },
              async () => false,
              async () => false,
              async (target: string, params?: Record<string, unknown>) => {
                const isTakePictureCommand =
                  params?.action === "take_picture" ||
                  params?.autoCapture === true ||
                  (typeof params === "object" && params !== null && "take" in params);
                const isAnalyzeCommand =
                  params?.action === "analyze_image" ||
                  params?.action === "analyze_picture" ||
                  params?.autoAnalyze === true ||
                  (typeof params === "object" && params !== null && "analyze" in params);

                if (target === "camera") {
                  camera.setInlineCameraMode("camera");
                  camera.setShowInlineCamera(true);
                  camera.setShouldAutoCapture(isTakePictureCommand);
                  if (isAnalyzeCommand) {
                    camera.setShouldAutoAnalyze(true);
                    if (params?.description && typeof params.description === "string") {
                      camera.setImageDescription(params.description as string);
                    }
                  }
                  setTimeout(() => camera.startInlineCamera(), 100);
                  return true;
                } else if (target === "image_upload") {
                  camera.setInlineCameraMode("upload");
                  camera.setShowInlineCamera(true);
                  if (isAnalyzeCommand && params?.imageUrl) {
                    camera.setShouldAutoAnalyze(true);
                    if (params?.description && typeof params.description === "string") {
                      camera.setImageDescription(params.description as string);
                    }
                  }
                  camera.stopInlineCamera();
                  return true;
                }
                return false;
              },
            );
          }
        } catch (error) {
          console.error("[VoiceAssistant] Error executing action:", action, error);
        }
      }
    },
    [router, camera],
  );

  // ── Process with streaming RAG ──
  const processWithStream = useCallback(
    async (text: string) => {
      if (isProcessingRef.current || !text.trim()) return;

      detectMood(text);
      isProcessingRef.current = true;
      setVoiceState("processing");
      setAiResponse("");

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      processingTimeoutRef.current = setTimeout(() => {
        if (isProcessingRef.current) {
          isProcessingRef.current = false;
          setVoiceState("idle");
          setError("Request timed out. Please try again.");
          if (isConversationActiveRef.current) {
            setTimeout(() => startListeningRef.current?.(), 500);
          }
        }
      }, 30000);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const token = getAuthToken();
      const idempotencyKey = `voice-rag-stream-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const requestBody: Record<string, unknown> = {
        message: text.trim(),
      };
      if (conversationIdRef.current) requestBody.conversationId = conversationIdRef.current;
      if (callId) requestBody.callId = callId;
      if (sessionType) requestBody.sessionType = sessionType;
      if (callPurpose) requestBody.callPurpose = callPurpose;
      if (moodProfileRef.current) {
        requestBody.coachMood = moodProfileRef.current.mood;
        requestBody.coachPromptContext = promptContextRef.current;
      }
      if (selectedLanguage) {
        requestBody.language = selectedLanguage.split("-")[0];
      }

      // Include current camera frame
      if (camera.isCameraActive && camera.inlineVideoRef.current && camera.inlineCanvasRef.current) {
        const video = camera.inlineVideoRef.current;
        const canvas = camera.inlineCanvasRef.current;
        if (video.readyState >= 2) {
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, 640, 480);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            const base64Data = dataUrl.split(",")[1];
            if (base64Data) requestBody.imageBase64 = base64Data;
          }
        }
      }

      try {
        const response = await fetch(`${API_URL}/rag-chat/message/stream`, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let doneHandled = false;

        if (!reader) throw new Error("No response body available");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() === "" || !line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                const providerMessage = data.errorMessage || data.error;
                setError(providerMessage);
                setAiResponse(providerMessage);
                isProcessingRef.current = false;
                setVoiceState("idle");
                return;
              }

              if (data.token) {
                fullResponse += data.token;
                setAiResponse(fullResponse);
              }

              if (data.conversationId) setConversationId(data.conversationId);

              if (data.emotion) {
                avatarRef.current?.setEmotionFromBackend(
                  data.emotion.category || data.emotion,
                  data.emotion.confidence || 80,
                );
              }

              if (data.crisis || data.emergency) {
                if (data.resources) {
                  setEmergencyResources(data.resources);
                  setShowEmergencyResources(true);
                }
              }

              if (data.done) {
                doneHandled = true;
                if (processingTimeoutRef.current) {
                  clearTimeout(processingTimeoutRef.current);
                  processingTimeoutRef.current = null;
                }

                if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                  executeActionsAsync(data.actions).catch((err) =>
                    console.error("[VoiceAssistant] Error executing actions:", err),
                  );
                } else {
                  const parsedActions = parseActionsFromResponse(fullResponse);
                  if (parsedActions.length > 0) {
                    executeActionsAsync(parsedActions).catch((err) =>
                      console.error("[VoiceAssistant] Error executing parsed actions:", err),
                    );
                  }
                }

                if (isTTSEnabledRef.current) {
                  ttsActions.speakResponse(fullResponse);
                } else {
                  isProcessingRef.current = false;
                  if (isConversationActiveRef.current) {
                    if (!isListeningActiveRef.current) {
                      setTimeout(() => startListeningRef.current?.(), 100);
                    }
                  } else {
                    setVoiceState("idle");
                  }
                }
                return;
              }
            } catch (_e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }

        if (fullResponse.trim() && !doneHandled) {
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }

          try {
            const parsedActions = parseActionsFromResponse(fullResponse);
            if (parsedActions.length > 0) executeActionsAsync(parsedActions);
          } catch (err) {
            console.error("[VoiceAssistant] Error parsing actions from response:", err);
          }

          if (isTTSEnabledRef.current) {
            ttsActions.speakResponse(fullResponse);
          } else {
            isProcessingRef.current = false;
            if (isConversationActiveRef.current) {
              if (!isListeningActiveRef.current) {
                setTimeout(() => startListeningRef.current?.(), 100);
              }
            } else {
              setVoiceState("idle");
            }
          }
        }
      } catch (err) {
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }

        const errObj = err as Error;
        if (errObj.name !== "AbortError") {
          let errorMessage = "Connection error. Please try again.";
          if (errObj.message.includes("Failed to fetch") || errObj.message.includes("NetworkError")) {
            errorMessage = "Network error. Please check your internet connection.";
          } else if (errObj.message.includes("401") || errObj.message.includes("Unauthorized")) {
            errorMessage = "Authentication error. Please refresh the page.";
          } else if (errObj.message.includes("500") || errObj.message.includes("Server error")) {
            errorMessage = "Server error. Please try again in a moment.";
          }
          setError(errorMessage);
          isProcessingRef.current = false;
          setVoiceState("idle");

          if (isConversationActiveRef.current) {
            setTimeout(() => startListeningRef.current?.(), 1000);
          }
        } else {
          isProcessingRef.current = false;
          setVoiceState("idle");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detectMood, ttsActions.speakResponse, executeActionsAsync, sessionType, callId, callPurpose, selectedLanguage, camera.isCameraActive],
  );

  // Sync function refs
  useEffect(() => { startListeningRef.current = recognition.startListening; }, [recognition.startListening, recognition.useAssemblyAIFallback]);
  useEffect(() => { speakResponseRef.current = ttsActions.speakResponse; }, [ttsActions.speakResponse]);
  useEffect(() => { processWithStreamRef.current = processWithStream; }, [processWithStream]);

  // Sync voiceState -> 3D avatar state
  useEffect(() => {
    const state = VOICE_STATE_TO_AVATAR_STATE[voiceState] || "idle";
    avatarRef.current?.setState(state);
  }, [voiceState]);

  // ── Stop conversation ──
  const stopConversation = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (sessionCountdownRef.current) {
      clearInterval(sessionCountdownRef.current);
      sessionCountdownRef.current = null;
    }
    setSessionTimeRemaining(null);
    setSessionStartTime(null);
    setIsConversationActive(false);
    isConversationActiveRef.current = false;
    isProcessingRef.current = false;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    isRestartingRef.current = false;
    ttsActions.clearAvatarDirectiveTimers();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
        isListeningActiveRef.current = false;
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      ttsService.revokeAudioUrl(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }

    window.speechSynthesis.cancel();
    isTTSActiveRef.current = false;
    currentUtteranceRef.current = null;
    isListeningActiveRef.current = false;
    setVoiceState("idle");
  }, [ttsActions]);

  // Image analysis callback
  const handleImageAnalysisComplete = useCallback(
    async (analysis: string) => {
      if (analysis && isTTSEnabledRef.current) {
        await ttsActions.speakWithBrowserTTS(analysis);
      }
    },
    [ttsActions],
  );

  // Fetch personalized greeting from backend
  const fetchGreeting = useCallback(
    async (overrideSessionType?: string): Promise<string> => {
      try {
        const baseLang = selectedLanguage ? selectedLanguage.split("-")[0] : undefined;
        const effectiveSessionType = overrideSessionType || sessionType || undefined;
        const response = await ragChatService.getGreeting(callPurpose || undefined, baseLang, effectiveSessionType);
        return response.greeting;
      } catch (err) {
        console.error("[VoiceAssistant] Error fetching greeting:", err);
        const userName = user?.firstName || null;
        const baseLang = selectedLanguage ? selectedLanguage.split("-")[0] : "en";
        if (baseLang === "ur") {
          return userName ? `السلام علیکم ${userName}! آپ کیسے ہیں؟` : "السلام علیکم! آپ کیسے ہیں؟";
        }
        return userName ? `Hey ${userName}! How can I help you today?` : "Hey! How can I help you today?";
      }
    },
    [user, callPurpose, selectedLanguage, sessionType],
  );

  // Toggle conversation
  const toggleConversation = useCallback(async () => {
    if (isConversationActive) {
      stopConversation();
    } else {
      if (!sessionType) {
        setShowSessionSelector(true);
        return;
      }

      setIsConversationActive(true);
      isConversationActiveRef.current = true;
      setAiResponse("");
      setTranscript("");
      pendingTranscriptRef.current = "";
      isProcessingRef.current = false;
      isTTSActiveRef.current = false;
      currentUtteranceRef.current = null;

      const personalizedGreeting =
        coachMood.greeting && !coachMood.loading ? coachMood.greeting : null;
      const greeting = personalizedGreeting ?? (await fetchGreeting());
      setAiResponse(greeting);

      try {
        avatarRef.current?.setExpression(
          moodProfileRef.current.expression,
          moodProfileRef.current.expressionIntensity,
          600,
        );
      } catch { /* ignore */ }

      if (isTTSEnabled) {
        ttsActions.speakResponse(greeting);
      } else {
        setTimeout(() => startListeningRef.current?.(), 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConversationActive, stopConversation, isTTSEnabled, ttsActions.speakResponse, fetchGreeting, sessionType, recognition.startListening]);

  // Apply mood-driven avatar expression
  useEffect(() => {
    if (!avatarRef.current) return;
    try {
      avatarRef.current.setExpression(
        coachMood.profile.expression,
        coachMood.profile.expressionIntensity,
        500,
      );
    } catch { /* avatar not ready yet */ }
  }, [coachMood.profile.expression, coachMood.profile.expressionIntensity]);

  // Proactive nudge
  useEffect(() => {
    if (!isConversationActive || voiceState !== "idle" || !isTTSEnabled) return;

    const timeout = setTimeout(() => {
      if (!isConversationActiveRef.current || isTTSActiveRef.current) return;
      if (isProcessingRef.current || isListeningActiveRef.current) return;
      const nudge = coachMood.getNudge();
      setAiResponse(nudge);
      speakResponseRef.current?.(nudge);
    }, NUDGE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [isConversationActive, voiceState, isTTSEnabled, coachMood]);

  // Session selector callback
  const handleSessionSelect = useCallback(
    async (type: SessionTypeOption) => {
      setSessionType(type);
      setShowSessionSelector(false);

      const durationMinutes = SESSION_DURATIONS[type] || 15;
      const durationMs = durationMinutes * 60 * 1000;

      setIsConversationActive(true);
      isConversationActiveRef.current = true;
      setAiResponse("");
      setTranscript("");
      pendingTranscriptRef.current = "";
      isProcessingRef.current = false;
      isTTSActiveRef.current = false;
      currentUtteranceRef.current = null;

      setSessionStartTime(new Date());
      setSessionTimeRemaining(durationMs);

      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (sessionCountdownRef.current) clearInterval(sessionCountdownRef.current);

      sessionCountdownRef.current = setInterval(() => {
        setSessionTimeRemaining((prev) => {
          if (prev === null || prev <= 1000) return 0;
          return prev - 1000;
        });
      }, 1000);

      sessionTimerRef.current = setTimeout(() => {
        stopConversation();
        if (sessionCountdownRef.current) clearInterval(sessionCountdownRef.current);
        setSessionTimeRemaining(null);
        setSessionStartTime(null);
        toast.success(`Session completed! Duration: ${durationMinutes} minutes`);
      }, durationMs);

      const greeting = await fetchGreeting(type);
      setAiResponse(greeting);

      if (isTTSEnabled) {
        ttsActions.speakResponse(greeting);
      } else {
        setTimeout(() => recognition.startListening(), 500);
      }
    },
    [stopConversation, fetchGreeting, isTTSEnabled, ttsActions, recognition],
  );

  // ── Render ──

  if (!recognition.isSpeechSupported) {
    return <SpeechNotSupported />;
  }

  return (
    <div className="relative w-full h-full z-50 overflow-hidden" style={{ backgroundColor: "#02000f" }}>
      {/* Content layer background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "#09090e" }} />

      {/* Background glow stack */}
      <div
        className="absolute pointer-events-none"
        style={{ left: "50%", top: 0, transform: "translateX(-50%)", width: "1920px", height: "990px" }}
      >
        <div
          className="absolute rounded-full"
          style={{ left: "520px", top: "-182px", width: "880px", height: "880px", background: "#5ad9f6", filter: "blur(165px)", opacity: 0.2 }}
        />
        <div
          className="absolute rounded-full"
          style={{ left: "800px", top: "283px", width: "320px", height: "320px", background: "#0099b9", filter: "blur(50px)", opacity: 0.82 }}
        />
        <div
          className="absolute rounded-full"
          style={{ left: "836.8px", top: "319.8px", width: "246.4px", height: "246.4px", background: "rgba(12,70,83,0.35)", filter: "blur(22px)", opacity: 0.6 }}
        />
      </div>

      {/* Full-Screen Avatar Canvas */}
      <div className="absolute inset-0 z-[5] cursor-pointer" onClick={toggleConversation}>
        <AvatarLayer ref={avatarRef} vrmUrl={COACH_AVATAR_VRM_URL} autoMapVoiceState className="w-full h-full" />
      </div>

      {/* Vision Coaching Overlay */}
      {camera.isVisionActive && (
        <VisionCoachingOverlay
          visionState={camera.visionState}
          coaching={camera.visionCoaching}
          isActive={camera.isVisionActive}
          onStop={camera.stopVisionCoaching}
        />
      )}

      {/* Processing loader */}
      {voiceState === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center z-[6] pointer-events-none">
          <JarvisLoader text="processing" progress={undefined} voiceState={voiceState} isActive={isConversationActive} />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 z-40 rounded-lg border p-4 pointer-events-auto backdrop-blur-xl"
          style={{ top: "120px", transform: "translateX(-50%)", background: "rgba(220, 38, 38, 0.1)", borderColor: "rgba(220, 38, 38, 0.3)" }}
        >
          <p className="text-sm font-medium text-center" style={{ color: "#F87171" }}>{error}</p>
        </motion.div>
      )}

      {/* Top-left: Brand badge */}
      <div className="absolute z-20" style={{ top: "39px", left: "108px" }}>
        <CiaBrandBadge name={assistantName || "Cia"} />
      </div>

      {/* Top-center: Status pill */}
      <div className="absolute z-20" style={{ top: "39px", left: "50%", transform: "translateX(-50%)" }}>
        <StatusPill name={assistantName || "Cia"} voiceState={voiceState} isConversationActive={isConversationActive} />
      </div>

      {/* Top-right: Language + Close */}
      <div className="absolute z-30" style={{ top: "39px", right: "71px" }}>
        <TopRightControls
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onClose={() => router.push("/dashboard?tab=overview")}
        />
      </div>

      {/* Camera PIP */}
      <div className="absolute z-20" style={{ top: "125px", right: "71px" }}>
        <CameraPip videoRef={camera.inlineVideoRef} visible={camera.showInlineCamera} isCameraActive={camera.isCameraActive} />
        <canvas ref={camera.inlineCanvasRef} className="hidden" />
        <input
          ref={camera.inlineFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={camera.handleInlineFileChange}
        />
      </div>

      {/* AI Coach transcript card */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ bottom: "141px", left: "50%", transform: "translateX(-50%)" }}
      >
        <AICoachTranscript
          text={aiResponse || interimTranscript || transcript}
          visible={!!(aiResponse || interimTranscript || transcript)}
        />
      </div>

      {/* Bottom control bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <BottomControlBar
          voiceState={voiceState}
          isConversationActive={isConversationActive}
          isTTSEnabled={isTTSEnabled}
          onToggleTTS={() => {
            const next = !isTTSEnabled;
            setIsTTSEnabled(next);
            if (!next) {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
              }
              if (currentAudioUrlRef.current) {
                ttsService.revokeAudioUrl(currentAudioUrlRef.current);
                currentAudioUrlRef.current = null;
              }
              isTTSActiveRef.current = false;
              currentUtteranceRef.current = null;
              avatarRef.current?.stopSpeaking();
              if (voiceState === "speaking") setVoiceState("idle");
            }
          }}
          showCamera={camera.showInlineCamera}
          onToggleCamera={() => {
            if (camera.showInlineCamera) {
              camera.setShowInlineCamera(false);
            } else {
              camera.setShowInlineCamera(true);
              camera.setInlineCameraMode("camera");
            }
          }}
          onToggleMic={toggleConversation}
          onOpenKeyboard={() => router.push("/ai-coach")}
          onStop={() => {
            if (isCallActive) {
              handleEndCall();
            } else {
              stopConversation();
            }
          }}
          onSkip={() => ttsActions.stopSpeaking(recognition.startListening)}
        />
      </div>

      {/* Image Analysis Modal */}
      <ImageAnalysisModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onAnalysisComplete={handleImageAnalysisComplete}
        mode={imageModalMode}
        conversationId={conversationId || undefined}
      />

      {/* Session Type Selector Modal */}
      <SessionSelectorModal
        isOpen={showSessionSelector}
        isConversationActive={isConversationActive}
        selectedType={sessionType || undefined}
        onSelect={handleSessionSelect}
        onClose={() => setShowSessionSelector(false)}
      />

      {/* Emergency Resources Modal */}
      <EmergencyResources
        isOpen={showEmergencyResources}
        onClose={() => setShowEmergencyResources(false)}
        resources={emergencyResources}
      />
    </div>
  );
}
