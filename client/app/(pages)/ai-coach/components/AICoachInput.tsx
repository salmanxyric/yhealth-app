"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Camera, ArrowUp, Loader2, Mic, MicOff, X } from "lucide-react";
import Image from "next/image";

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface AICoachInputProps {
  inputMessage: string;
  isSending: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onAttach: () => void;
  onCamera: () => void;
  pendingImage?: { file: File; previewUrl: string } | null;
  onAttachImage?: (file: File) => void;
  onClearImage?: () => void;
}

export function AICoachInput({
  inputMessage,
  isSending,
  inputRef,
  onInputChange,
  onSend,
  onKeyDown,
  onAttach,
  onCamera,
  pendingImage,
  onAttachImage,
  onClearImage,
}: AICoachInputProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptBaseRef = useRef("");
  const valueRef = useRef(inputMessage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;
    onAttachImage?.(file);
    if (e.target) e.target.value = "";
  };
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const SpeechRecognitionAPI = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") return null;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  }, []);

  const isVoiceSupported = Boolean(SpeechRecognitionAPI);

  useEffect(() => {
    valueRef.current = inputMessage;
  }, [inputMessage]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }

      const spokenText = `${finalTranscript}${interimTranscript}`.trim();
      const baseText = transcriptBaseRef.current.trim();
      const nextValue = [baseText, spokenText].filter(Boolean).join(" ");
      onInputChange(nextValue);
    };

    recognition.onerror = (event) => {
      const message = event.error === "not-allowed"
        ? "Microphone permission denied"
        : event.error === "no-speech"
          ? "No speech detected"
          : "Voice recognition failed";
      setVoiceError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionAPI, onInputChange]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current || isSending) return;

    setVoiceError(null);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      inputRef.current?.focus();
      return;
    }

    try {
      transcriptBaseRef.current = valueRef.current;
      recognitionRef.current.start();
      setIsListening(true);
      inputRef.current?.focus();
    } catch {
      setVoiceError("Could not start voice input");
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleSend = () => {
    stopVoiceInput();
    onSend();
  };

  const handleTextAreaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      stopVoiceInput();
    }
    onKeyDown(event);
  };

  return (
    <div className="w-full px-2 sm:px-4 pb-2 sm:pb-3">
      <div
        className={`bg-[#02091b] border-[1.5px] rounded-[24px] p-4 sm:p-5 flex flex-col gap-4 transition-colors ${
          isListening ? "border-cyan-300/55 shadow-[0_0_28px_rgba(34,211,238,0.12)]" : "border-white/[0.17]"
        }`}
      >
        {/* Hidden file input for image attach */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Image preview */}
        {pendingImage && (
          <div className="relative w-20 h-20 rounded-[12px] overflow-hidden border border-white/10 group">
            <Image src={pendingImage.previewUrl} alt="Attached" fill className="object-cover" />
            <button
              onClick={onClearImage}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        {/* Top row: Star icon + Textarea */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/chatai/StarFour.svg" alt="" fill className="object-contain" />
          </div>
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleTextAreaKeyDown}
            placeholder={isListening ? "Listening..." : "Ask Anything..."}
            rows={1}
            className="flex-1 text-white text-[20px] font-normal placeholder-[#9f9f9f] focus:outline-none resize-none leading-normal"
          />
        </div>

        {/* Bottom row: Actions + Send */}
        <div className="flex items-center justify-between w-full">
          {/* Left actions */}
          <div className="flex items-end gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 pr-4 py-1 border-r border-white/20"
            >
              <Link2 className="w-5 h-5 text-white/70" />
              <span className="text-[16px] text-white font-normal">Attach</span>
            </button>
            <button
              onClick={onCamera}
              className="flex items-center gap-3 pr-4"
            >
              <Camera className="w-5 h-5 text-white/70" />
              <span className="text-[16px] text-white font-normal">Camera</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {voiceError && (
              <span className="hidden sm:inline text-xs text-red-300/80 max-w-[180px] truncate" title={voiceError}>
                {voiceError}
              </span>
            )}
            <button
              onClick={toggleVoiceInput}
              disabled={!isVoiceSupported || isSending}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              title={
                !isVoiceSupported
                  ? "Voice input is not supported in this browser"
                  : isListening
                    ? "Stop voice input"
                    : "Start voice input"
              }
              className={`relative flex items-center justify-center w-[47px] h-[47px] rounded-[8px] border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.28)]"
                  : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {isListening && (
                <span className="absolute inset-0 rounded-[8px] animate-ping bg-cyan-400/20" />
              )}
              {isListening ? (
                <MicOff className="relative w-5 h-5" />
              ) : (
                <Mic className="relative w-5 h-5" />
              )}
            </button>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!inputMessage.trim() && !pendingImage) || isSending}
              className="flex items-center justify-center w-[47px] h-[47px] bg-[#0099b9] rounded-[8px] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <ArrowUp className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
