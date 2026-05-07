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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<DictationStatus>("idle");
  const onTranscriptRef = useRef(onTranscript);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const win = window as unknown as { SpeechRecognition?: { new(): SpeechRecognition }; webkitSpeechRecognition?: { new(): SpeechRecognition } };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const isFinal = result.isFinal;

        if (isFinal) {
          const lower = text.toLowerCase().trim();
          if (lower === "new paragraph") {
            onTranscriptRef.current("\n\n", true);
            continue;
          }
          if (lower === "new line") {
            onTranscriptRef.current("\n", true);
            continue;
          }
          if (lower === "stop dictation") {
            recognitionRef.current?.stop();
            recognitionRef.current = null;
            setStatus("idle");
            stopTimer();
            onEndRef.current?.();
            continue;
          }
        }

        onTranscriptRef.current(text, isFinal);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setStatus("error");
    };

    recognition.onend = () => {
      if (statusRef.current === "listening") {
        try { recognition.start(); } catch { /* already started */ }
      }
    };

    return recognition;
  }, [isSupported, lang, stopTimer]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("idle");
    stopTimer();
    onEndRef.current?.();
  }, [stopTimer]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition not supported in this browser");
      setStatus("error");
      return;
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
    setElapsed(0);
    setError(null);
    startTimer();
  }, [isSupported, createRecognition, startTimer]);

  const pause = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("paused");
    stopTimer();
  }, [stopTimer]);

  const resume = useCallback(() => {
    const recognition = createRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
    startTimer();
  }, [createRecognition, startTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopTimer();
    };
  }, [stopTimer]);

  return { status, start, stop, pause, resume, elapsed, error, isSupported };
}
