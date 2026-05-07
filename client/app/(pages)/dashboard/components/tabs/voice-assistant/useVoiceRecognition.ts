"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getFallbackLanguage } from "@/lib/language-config";
import { transcriptionService } from "@/src/shared/services/transcription.service";
import type { VoiceState } from "./voice-types";
import { SILENCE_THRESHOLD, MIN_SPEECH_LENGTH } from "./voice-constants";

interface UseVoiceRecognitionOptions {
  selectedLanguage: string;
  capturedImage: string | null;
  imageFile: File | null;
  setImageDescription: (desc: string) => void;
  setShouldAutoAnalyze: (val: boolean) => void;
  // Refs passed in from the parent
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
  silenceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  pendingTranscriptRef: React.MutableRefObject<string>;
  isConversationActiveRef: React.MutableRefObject<boolean>;
  isTTSActiveRef: React.MutableRefObject<boolean>;
  isListeningActiveRef: React.MutableRefObject<boolean>;
  isRestartingRef: React.MutableRefObject<boolean>;
  restartTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  startListeningRef: React.MutableRefObject<(() => void) | null>;
  processWithStreamRef: React.MutableRefObject<((text: string) => Promise<void>) | null>;
  // State setters
  setVoiceState: (state: VoiceState) => void;
  setTranscript: (text: string) => void;
  setInterimTranscript: (text: string) => void;
  setError: (error: string | null) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions) {
  const {
    selectedLanguage,
    capturedImage,
    imageFile,
    setImageDescription,
    setShouldAutoAnalyze,
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
  } = options;

  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [useAssemblyAIFallback, setUseAssemblyAIFallback] = useState(false);
  const [_isTranscribing, setIsTranscribing] = useState(false);

  // AssemblyAI recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Load voices - filter by selected language
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      (window as { webkitSpeechRecognition?: { new (): SpeechRecognition } }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTimeout(async () => {
        setIsSpeechSupported(false);
        try {
          const response = await transcriptionService.checkStatus();
          if (response.success && response.data?.available) {
            setUseAssemblyAIFallback(true);
            setError("Browser speech recognition not available. Using AssemblyAI transcription instead.");
          } else {
            setError("Speech recognition not supported. Please use Chrome or Edge, or configure AssemblyAI.");
          }
        } catch {
          setError("Speech recognition not supported. Please use Chrome or Edge.");
        }
      }, 0);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const baseLang = selectedLanguage.split("-")[0];
      let preferredVoice = voices.find((v) => v.lang === selectedLanguage);

      if (!preferredVoice) {
        preferredVoice = voices.find((v) => {
          const voiceBase = v.lang.split("-")[0];
          return voiceBase === baseLang;
        });
      }

      if (!preferredVoice) {
        const langVoices = voices.filter((v) => {
          const voiceBase = v.lang.split("-")[0];
          return voiceBase === baseLang;
        });

        if (langVoices.length > 0) {
          preferredVoice =
            langVoices.find(
              (v) =>
                v.name.toLowerCase().includes("neural") ||
                v.name.toLowerCase().includes("premium") ||
                v.name.toLowerCase().includes("enhanced"),
            ) || langVoices[0];
        }
      }

      if (!preferredVoice) {
        const fallbackLang = getFallbackLanguage(selectedLanguage);
        const fallbackBase = fallbackLang.split("-")[0];

        preferredVoice =
          voices.find((v) => v.lang === fallbackLang) ||
          voices.find((v) => {
            const voiceBase = v.lang.split("-")[0];
            return voiceBase === fallbackBase;
          }) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];
      }

      setSelectedVoice(preferredVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [selectedLanguage, recognitionRef, silenceTimerRef, abortControllerRef, setError]);

  // AssemblyAI transcription
  const transcribeWithAssemblyAI = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true);
      try {
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        const langCode = selectedLanguage.split("-")[0] || "en";

        const response = await transcriptionService.transcribe(audioFile, {
          languageCode: langCode,
          punctuate: true,
          formatText: true,
        });

        if (response.success && response.data?.text) {
          const transcribedText = response.data.text.trim();
          if (transcribedText.length >= MIN_SPEECH_LENGTH) {
            setTranscript(transcribedText);
            pendingTranscriptRef.current = transcribedText;
            if (processWithStreamRef.current) {
              await processWithStreamRef.current(transcribedText);
            }
          } else {
            setError("No speech detected. Please try again.");
            setVoiceState("idle");
          }
        } else {
          throw new Error(response.error?.message || "Transcription failed");
        }
      } catch (error) {
        console.error("[VoiceAssistant] AssemblyAI transcription failed:", error);
        setError(error instanceof Error ? error.message : "Transcription failed. Please try again.");
        setVoiceState("idle");
      } finally {
        setIsTranscribing(false);
      }
    },
    [selectedLanguage, pendingTranscriptRef, processWithStreamRef, setTranscript, setError, setVoiceState],
  );

  // Start AssemblyAI recording
  const startAssemblyAIRecording = useCallback(async () => {
    if (isRecordingRef.current || isProcessingRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeWithAssemblyAI(audioBlob);

        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
      };

      mediaRecorder.start();
      isRecordingRef.current = true;
      setVoiceState("listening");
      setError(null);
      console.log("[VoiceAssistant] AssemblyAI recording started");
    } catch (error) {
      console.error("[VoiceAssistant] Failed to start AssemblyAI recording:", error);
      setError("Failed to access microphone. Please check permissions.");
      setVoiceState("idle");
    }
  }, [isProcessingRef, transcribeWithAssemblyAI, setVoiceState, setError]);

  // Start listening (main entry point)
  const startListening = useCallback(() => {
    if (isProcessingRef.current || !isConversationActiveRef.current) {
      console.log("[VoiceAssistant] startListening blocked", {
        isProcessing: isProcessingRef.current,
        isConversationActive: isConversationActiveRef.current,
      });
      return;
    }

    if (isListeningActiveRef.current || isRestartingRef.current) {
      console.log("[VoiceAssistant] startListening blocked - already listening or restarting");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      (window as { webkitSpeechRecognition?: { new (): SpeechRecognition } }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("[VoiceAssistant] SpeechRecognition not available, using AssemblyAI fallback");
      if (useAssemblyAIFallback) {
        startAssemblyAIRecording();
        return;
      } else {
        setError("Speech recognition not available. Please refresh the page.");
        return;
      }
    }

    setTranscript("");
    setInterimTranscript("");
    pendingTranscriptRef.current = "";
    setError(null);

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
        isListeningActiveRef.current = false;
      } catch (err) {
        console.warn("[VoiceAssistant] Error stopping previous recognition:", err);
      }
      recognitionRef.current = null;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Small delay to ensure previous recognition is fully stopped
    setTimeout(() => {
      if (!isConversationActiveRef.current || isProcessingRef.current || isListeningActiveRef.current) {
        console.log("[VoiceAssistant] Conditions changed, aborting recognition start");
        return;
      }

      const SpeechRecognitionCheck =
        window.SpeechRecognition ||
        (window as { webkitSpeechRecognition?: { new (): SpeechRecognition } }).webkitSpeechRecognition;
      if (!SpeechRecognitionCheck) {
        console.error("[VoiceAssistant] SpeechRecognition no longer available");
        setError("Speech recognition not available. Please refresh the page.");
        return;
      }

      const recognition = new SpeechRecognitionCheck();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("[VoiceAssistant] Recognition started");
        isListeningActiveRef.current = true;
        isRestartingRef.current = false;
        setVoiceState("listening");
      };

      recognition.onresult = (event) => {
        if (!isConversationActiveRef.current) return;

        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        if (final) {
          pendingTranscriptRef.current += final;
          setTranscript(pendingTranscriptRef.current);
          setInterimTranscript("");
        } else {
          setInterimTranscript(interim);
        }

        if (final.trim().length >= MIN_SPEECH_LENGTH) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const fullText = (pendingTranscriptRef.current + final).trim();

            // Check for "analyze picture/image" commands
            const lowerText = fullText.toLowerCase();
            const analyzePatterns = [
              /\b(analyze|analyse|analyze this|analyze the picture|analyze the image|analyze picture|analyze image|what.*in.*(picture|image|photo)|check.*(picture|image|photo)|analyze it|analyze that)\b/,
              /\b(what.*this|what.*that|what.*in|tell me.*about.*(picture|image|photo)|analyze|examine|review)\b/,
            ];

            const isAnalyzeCommand = analyzePatterns.some((pattern) => pattern.test(lowerText));
            const hasImage = capturedImage || imageFile;

            if (isAnalyzeCommand && hasImage) {
              const descriptionMatch = lowerText.match(
                /(?:analyze|analyse|check|what.*in|tell me.*about|examine|review).*?(?:picture|image|photo|this|that|it)?\s*(.+?)(?:please|now|\.|$)/i,
              );
              if (descriptionMatch && descriptionMatch[1]) {
                const extractedDescription = descriptionMatch[1].trim();
                if (extractedDescription && extractedDescription.length > 3) {
                  setImageDescription(extractedDescription);
                }
              }

              setShouldAutoAnalyze(true);
              console.log("[VoiceAssistant] Analyze command detected, will auto-analyze image");
            }

            if (fullText.length >= MIN_SPEECH_LENGTH && !isProcessingRef.current && isConversationActiveRef.current) {
              processWithStreamRef.current?.(fullText);
            }
          }, SILENCE_THRESHOLD);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted") {
          console.log("[VoiceAssistant] Recognition aborted (expected)");
          isListeningActiveRef.current = false;
          return;
        }

        const nonCriticalErrors = ["no-speech", "audio-capture", "network", "service-not-allowed"];
        if (nonCriticalErrors.includes(event.error)) {
          console.log(`[VoiceAssistant] Recognition ${event.error} (non-critical, will retry if conversation active)`);
          isListeningActiveRef.current = false;

          if (
            (event.error === "network" || event.error === "audio-capture") &&
            isConversationActiveRef.current &&
            !isProcessingRef.current
          ) {
            setTimeout(() => {
              if (
                isConversationActiveRef.current &&
                !isProcessingRef.current &&
                !isTTSActiveRef.current &&
                !isListeningActiveRef.current
              ) {
                const startRef = startListeningRef.current;
                if (startRef) {
                  console.log(`[VoiceAssistant] Retrying after ${event.error} error...`);
                  startRef();
                }
              }
            }, 1500);
          }
          return;
        }

        console.error("[VoiceAssistant] Recognition error:", event.error);
        isListeningActiveRef.current = false;

        const criticalErrors = ["not-allowed", "bad-grammar", "language-not-supported"];
        if (criticalErrors.includes(event.error)) {
          setError(`Recognition error: ${event.error}. Please check your microphone permissions or settings.`);
        }

        if (!isConversationActiveRef.current) {
          setVoiceState("idle");
        }
      };

      recognition.onend = () => {
        console.log("[VoiceAssistant] Recognition ended");
        isListeningActiveRef.current = false;

        if (isConversationActiveRef.current && !isProcessingRef.current && !isTTSActiveRef.current) {
          if (isRestartingRef.current) {
            console.log("[VoiceAssistant] Already restarting, skipping");
            return;
          }

          isRestartingRef.current = true;

          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }

          restartTimeoutRef.current = setTimeout(() => {
            isRestartingRef.current = false;

            if (
              isConversationActiveRef.current &&
              !isProcessingRef.current &&
              !isTTSActiveRef.current &&
              !isListeningActiveRef.current
            ) {
              console.log("[VoiceAssistant] Auto-restarting recognition");
              const startRef = startListeningRef.current;
              if (startRef) {
                setTimeout(() => {
                  if (
                    isConversationActiveRef.current &&
                    !isProcessingRef.current &&
                    !isTTSActiveRef.current &&
                    !isListeningActiveRef.current
                  ) {
                    startRef();
                  }
                }, 100);
              }
            } else {
              console.log("[VoiceAssistant] Conditions changed, not restarting", {
                isConversationActive: isConversationActiveRef.current,
                isProcessing: isProcessingRef.current,
                isTTSActive: isTTSActiveRef.current,
                isListeningActive: isListeningActiveRef.current,
              });
            }
          }, 500);
        } else if (!isConversationActiveRef.current) {
          setVoiceState("idle");
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        console.log("[VoiceAssistant] Recognition start() called successfully");
      } catch (err: unknown) {
        console.error("[VoiceAssistant] Failed to start recognition:", err);
        isListeningActiveRef.current = false;
        isRestartingRef.current = false;

        const error = err as Error & { name?: string; message?: string };
        if (error?.name === "InvalidStateError" || error?.message?.includes("already started")) {
          console.log("[VoiceAssistant] Recognition already started, attempting recovery...");
          try {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
              recognitionRef.current = null;
            }
            setTimeout(() => {
              if (isConversationActiveRef.current && !isProcessingRef.current && !isListeningActiveRef.current) {
                const startRef = startListeningRef.current;
                if (startRef) {
                  console.log("[VoiceAssistant] Retrying after InvalidStateError recovery...");
                  startRef();
                }
              }
            }, 800);
          } catch (recoveryErr) {
            console.error("[VoiceAssistant] Recovery attempt failed:", recoveryErr);
            setError("Failed to start listening. Please try clicking the microphone button.");
            isListeningActiveRef.current = false;
            isRestartingRef.current = false;
          }
        } else if (error?.name === "NotAllowedError" || error?.message?.includes("permission")) {
          setError("Microphone permission denied. Please allow microphone access and try again.");
          isListeningActiveRef.current = false;
          isRestartingRef.current = false;
        } else {
          setError("Failed to start listening. Please try again or check microphone permissions.");
          isListeningActiveRef.current = false;
          isRestartingRef.current = false;

          if (isConversationActiveRef.current) {
            setTimeout(() => {
              if (isConversationActiveRef.current && !isProcessingRef.current && !isListeningActiveRef.current) {
                const startRef = startListeningRef.current;
                if (startRef) {
                  console.log("[VoiceAssistant] Auto-retrying after start error...");
                  startRef();
                }
              }
            }, 2000);
          }
        }
      }
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, capturedImage, imageFile, setImageDescription, setShouldAutoAnalyze, useAssemblyAIFallback, startAssemblyAIRecording]);

  return {
    isSpeechSupported,
    selectedVoice,
    useAssemblyAIFallback,
    startListening,
    startAssemblyAIRecording,
    mediaRecorderRef,
    isRecordingRef,
    recordingStreamRef,
  };
}
