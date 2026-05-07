"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type DictationStatus = "idle" | "listening" | "paused" | "error";

interface UseDictationOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onEnd?: () => void;
  lang?: string;
}

interface UseDictationReturn {
  status: DictationStatus;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  elapsed: number;
  error: string | null;
  isSupported: boolean;
}

export function useDictation({
  onTranscript,
  onEnd,
  lang = "en-US",
}: UseDictationOptions): UseDictationReturn {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<DictationStatus>("idle");

  // Keep statusRef in sync so recognition.onend can read current status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    onEnd?.();
  }, [onEnd]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition not supported in this browser");
      setStatus("error");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const isFinal = result.isFinal;

        // Voice commands
        if (isFinal) {
          const lower = text.toLowerCase().trim();
          if (lower === "new paragraph") {
            onTranscript("\n\n", true);
            continue;
          }
          if (lower === "new line") {
            onTranscript("\n", true);
            continue;
          }
          if (lower === "stop dictation") {
            stop();
            continue;
          }
        }

        onTranscript(text, isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setStatus("error");
    };

    recognition.onend = () => {
      if (statusRef.current === "listening") {
        // Auto-restart for continuous dictation
        try { recognition.start(); } catch { /* already started */ }
      } else {
        onEnd?.();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
    setElapsed(0);
    setError(null);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, [isSupported, lang, onTranscript, onEnd, stop]);

  const pause = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("paused");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resume = useCallback(() => {
    recognitionRef.current?.start();
    setStatus("listening");
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { status, start, stop, pause, resume, elapsed, error, isSupported };
}
