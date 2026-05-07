"use client";

import { useCallback, useEffect } from "react";
import { ttsService, type VoiceGender } from "@/src/shared/services/tts.service";
import { analyzeResponse as analyzeResponseForGestures } from "@/lib/avatar/conversationDirector";
import type { AvatarLayerHandle } from "@/components/avatar/AvatarLayer";
import type { MoodProfile } from "@/lib/avatar/coachPersonality";
import type { VoiceState } from "./voice-types";
import { cleanTextForTTS } from "./voice-utils";

interface UseVoiceTTSOptions {
  selectedVoice: SpeechSynthesisVoice | null;
  selectedLanguage: string;
  voiceGender: VoiceGender;
  avatarRef: React.RefObject<AvatarLayerHandle | null>;
  moodProfileRef: React.MutableRefObject<MoodProfile>;
  isConversationActiveRef: React.MutableRefObject<boolean>;
  isProcessingRef: React.MutableRefObject<boolean>;
  isListeningActiveRef: React.MutableRefObject<boolean>;
  isTTSActiveRef: React.MutableRefObject<boolean>;
  isTTSEnabledRef: React.MutableRefObject<boolean>;
  currentUtteranceRef: React.MutableRefObject<SpeechSynthesisUtterance | null>;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentAudioUrlRef: React.MutableRefObject<string | null>;
  avatarDirectiveTimersRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
  startListeningRef: React.MutableRefObject<(() => void) | null>;
  setVoiceState: (state: VoiceState) => void;
}

export function useVoiceTTS(options: UseVoiceTTSOptions) {
  const {
    selectedVoice,
    selectedLanguage,
    voiceGender,
    avatarRef,
    moodProfileRef,
    isConversationActiveRef,
    isProcessingRef,
    isListeningActiveRef,
    isTTSActiveRef,
    currentUtteranceRef,
    currentAudioRef,
    currentAudioUrlRef,
    avatarDirectiveTimersRef,
    recognitionRef,
    startListeningRef,
    setVoiceState,
  } = options;

  const clearAvatarDirectiveTimers = useCallback(() => {
    for (const timer of avatarDirectiveTimersRef.current) {
      clearTimeout(timer);
    }
    avatarDirectiveTimersRef.current = [];
  }, [avatarDirectiveTimersRef]);

  useEffect(() => {
    return () => {
      clearAvatarDirectiveTimers();
    };
  }, [clearAvatarDirectiveTimers]);

  // Fallback to browser TTS
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      console.error("[VoiceAssistant] Browser TTS not supported");
      isTTSActiveRef.current = false;
      isProcessingRef.current = false;
      setVoiceState("idle");
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      console.warn("[VoiceAssistant] Error canceling speechSynthesis:", error);
    }

    isTTSActiveRef.current = false;
    currentUtteranceRef.current = null;

    if (!text || text.trim().length === 0) {
      console.warn("[VoiceAssistant] Empty text for TTS");
      isProcessingRef.current = false;
      setVoiceState("idle");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = selectedLanguage;
    utterance.rate = moodProfileRef.current?.ttsRate ?? 1.0;
    utterance.pitch = moodProfileRef.current?.ttsPitch ?? 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log("[VoiceAssistant] Browser TTS started");
      isTTSActiveRef.current = true;
      setVoiceState("speaking");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };

    utterance.onend = () => {
      console.log("[VoiceAssistant] Browser TTS ended");
      isTTSActiveRef.current = false;
      currentUtteranceRef.current = null;
      isProcessingRef.current = false;
      clearAvatarDirectiveTimers();

      if (isConversationActiveRef.current && !isListeningActiveRef.current) {
        setTimeout(() => {
          const startRef = startListeningRef.current;
          if (
            startRef &&
            !isProcessingRef.current &&
            !isTTSActiveRef.current &&
            isConversationActiveRef.current &&
            !isListeningActiveRef.current
          ) {
            console.log("[VoiceAssistant] Restarting recognition after TTS ended");
            startRef();
          }
        }, 300);
      } else {
        setVoiceState("idle");
      }
    };

    utterance.onerror = (event) => {
      const synthEvent = event as SpeechSynthesisErrorEvent;
      const errorType = synthEvent.error || "unknown";

      if (errorType === "interrupted" || errorType === "canceled") {
        console.debug("[VoiceAssistant] Browser TTS interrupted (expected)");
        isTTSActiveRef.current = false;
        currentUtteranceRef.current = null;
        isProcessingRef.current = false;
        return;
      }

      console.error("[VoiceAssistant] Browser TTS error:", {
        error: errorType,
        charIndex: synthEvent.charIndex,
        elapsedTime: synthEvent.elapsedTime,
        textLength: typeof text === "string" ? text.length : 0,
        textPreview: typeof text === "string" ? text.substring(0, 50) : "N/A",
        selectedVoice: selectedVoice?.name ?? "default",
        selectedLanguage: selectedLanguage ?? "N/A",
        utteranceLang: utterance?.lang ?? "N/A",
      });

      isTTSActiveRef.current = false;
      currentUtteranceRef.current = null;
      isProcessingRef.current = false;
      clearAvatarDirectiveTimers();

      try {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          if (isConversationActiveRef.current) {
            const startRef = startListeningRef.current;
            if (startRef && !isProcessingRef.current) {
              startRef();
            }
          } else {
            setVoiceState("idle");
          }
        }, 1000);
      } catch (resetError) {
        console.error("[VoiceAssistant] Error resetting speechSynthesis:", resetError);
        setVoiceState("idle");
      }
    };

    const trySpeak = () => {
      try {
        if (!window.speechSynthesis) {
          console.error("[VoiceAssistant] speechSynthesis not available");
          isProcessingRef.current = false;
          setVoiceState("idle");
          return;
        }

        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
          setTimeout(() => {
            try {
              window.speechSynthesis.speak(utterance);
            } catch (speakError) {
              console.error("[VoiceAssistant] Error calling speak:", speakError);
              isProcessingRef.current = false;
              setVoiceState("idle");
            }
          }, 100);
        } else {
          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error("[VoiceAssistant] Error in trySpeak:", error);
        isProcessingRef.current = false;
        setVoiceState("idle");
      }
    };

    setTimeout(trySpeak, 30);
  }, [
    selectedVoice,
    selectedLanguage,
    clearAvatarDirectiveTimers,
    moodProfileRef,
    isTTSActiveRef,
    isProcessingRef,
    currentUtteranceRef,
    recognitionRef,
    isConversationActiveRef,
    isListeningActiveRef,
    startListeningRef,
    setVoiceState,
  ]);

  // Speak response - Try ElevenLabs first, fallback to browser TTS
  const speakResponse = useCallback(
    async (text: string) => {
      clearAvatarDirectiveTimers();

      // Clean up any existing audio
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

      const cleanText = cleanTextForTTS(text);

      if (!cleanText) {
        isProcessingRef.current = false;
        isTTSActiveRef.current = false;
        if (!isConversationActiveRef.current) {
          setVoiceState("idle");
        }
        return;
      }

      // Analyze response text -> queue timed gestures + emotions for the avatar
      try {
        const directives = analyzeResponseForGestures(cleanText);
        for (const d of directives) {
          const delayMs = d.delaySec * 1000;
          const timer = setTimeout(() => {
            avatarRef.current?.queueGesture(d.gesture);
            avatarRef.current?.setEmotionFromBackend(d.emotion, d.intensity * 100);
          }, delayMs);
          avatarDirectiveTimersRef.current.push(timer);
        }
      } catch {
        // Non-critical -- avatar still works without directives
      }

      // Try server-side TTS (ElevenLabs -> Google Cloud TTS fallback chain)
      try {
        console.log("[VoiceAssistant] Attempting server TTS (ElevenLabs -> Google Cloud)");
        const ttsResponse = await ttsService.speak(cleanText, {
          voiceGender,
          languageCode: selectedLanguage,
        });

        if (ttsResponse.success && ttsResponse.data) {
          const audio = new Audio(ttsResponse.data.audioUrl);
          currentAudioRef.current = audio;
          currentAudioUrlRef.current = ttsResponse.data.audioUrl;

          audio.onplay = () => {
            console.log(`[VoiceAssistant] TTS audio started (provider: ${ttsResponse.provider})`);
            isTTSActiveRef.current = true;
            setVoiceState("speaking");
            avatarRef.current?.speakFromAudioElement(audio);
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch {
                /* ignore */
              }
            }
          };

          audio.onended = () => {
            console.log("[VoiceAssistant] TTS audio ended");
            isTTSActiveRef.current = false;
            isProcessingRef.current = false;
            clearAvatarDirectiveTimers();
            avatarRef.current?.stopSpeaking();

            if (currentAudioUrlRef.current) {
              ttsService.revokeAudioUrl(currentAudioUrlRef.current);
              currentAudioUrlRef.current = null;
            }
            currentAudioRef.current = null;

            if (isConversationActiveRef.current && !isListeningActiveRef.current) {
              setTimeout(() => {
                const startRef = startListeningRef.current;
                if (
                  startRef &&
                  !isProcessingRef.current &&
                  !isTTSActiveRef.current &&
                  isConversationActiveRef.current
                ) {
                  startRef();
                }
              }, 500);
            } else {
              setVoiceState("idle");
            }
          };

          audio.onerror = (event) => {
            console.error("[VoiceAssistant] TTS audio playback error:", event);
            isTTSActiveRef.current = false;
            isProcessingRef.current = false;
            clearAvatarDirectiveTimers();

            if (currentAudioUrlRef.current) {
              ttsService.revokeAudioUrl(currentAudioUrlRef.current);
              currentAudioUrlRef.current = null;
            }
            currentAudioRef.current = null;

            console.log("[VoiceAssistant] Falling back to browser TTS");
            speakWithBrowserTTS(cleanText);
          };

          await audio.play();
          return;
        } else {
          console.warn("[VoiceAssistant] Server TTS failed, using browser TTS:", ttsResponse.error?.message);
          speakWithBrowserTTS(cleanText);
        }
      } catch (error) {
        console.error("[VoiceAssistant] Server TTS error, using browser TTS:", error);
        speakWithBrowserTTS(cleanText);
      }
    },
    [
      speakWithBrowserTTS,
      selectedLanguage,
      voiceGender,
      clearAvatarDirectiveTimers,
      currentAudioRef,
      currentAudioUrlRef,
      isTTSActiveRef,
      currentUtteranceRef,
      isProcessingRef,
      isConversationActiveRef,
      isListeningActiveRef,
      avatarRef,
      avatarDirectiveTimersRef,
      recognitionRef,
      startListeningRef,
      setVoiceState,
    ],
  );

  /** Stop all active speech output */
  const stopSpeaking = useCallback(
    (startListening: () => void) => {
      if ("speechSynthesis" in window) {
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
      isProcessingRef.current = false;
      currentUtteranceRef.current = null;
      clearAvatarDirectiveTimers();

      avatarRef.current?.stopSpeaking();
      setVoiceState("idle");

      if (isConversationActiveRef.current) {
        setTimeout(() => {
          if (isConversationActiveRef.current && !isProcessingRef.current && !isTTSActiveRef.current) {
            startListening();
          }
        }, 300);
      }
    },
    [
      clearAvatarDirectiveTimers,
      currentAudioRef,
      currentAudioUrlRef,
      isTTSActiveRef,
      isProcessingRef,
      currentUtteranceRef,
      avatarRef,
      isConversationActiveRef,
      setVoiceState,
    ],
  );

  return {
    speakWithBrowserTTS,
    speakResponse,
    stopSpeaking,
    clearAvatarDirectiveTimers,
  };
}
