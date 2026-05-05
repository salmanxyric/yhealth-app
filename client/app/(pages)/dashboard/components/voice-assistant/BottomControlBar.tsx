"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Keyboard,
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  SkipForward,
} from "lucide-react";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface BottomControlBarProps {
  voiceState: VoiceState;
  isConversationActive: boolean;
  isTTSEnabled: boolean;
  onToggleTTS: () => void;
  showCamera: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onOpenKeyboard: () => void;
  onStop: () => void;
  onSkip?: () => void;
}

interface IconButtonBaseProps {
  onClick: () => void;
  ariaLabel: string;
  active?: boolean;
  opacity?: number;
  children: React.ReactNode;
  paddingX?: number;
}

function IconButton({
  onClick,
  ariaLabel,
  active = false,
  opacity = 1,
  children,
  paddingX = 11,
}: IconButtonBaseProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center justify-center rounded-full transition-colors"
      style={{
        height: "48px",
        paddingLeft: `${paddingX}px`,
        paddingRight: `${paddingX}px`,
        background: active ? "rgba(0,208,181,0.2)" : "transparent",
        opacity,
        color: active ? "#ffffff" : "#d1d5dc",
      }}
    >
      {children}
    </motion.button>
  );
}

export function BottomControlBar({
  voiceState,
  isConversationActive,
  isTTSEnabled,
  onToggleTTS,
  showCamera,
  onToggleCamera,
  onToggleMic,
  onOpenKeyboard,
  onStop,
  onSkip,
}: BottomControlBarProps) {
  const isListening = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";
  const micPulse = isListening;

  return (
    <div
      className="flex flex-col items-center justify-center w-full pointer-events-none"
      style={{ paddingTop: "16px", paddingBottom: "16px" }}
    >
      {/* Skip pill — shown only while the assistant is speaking */}
      <AnimatePresence>
        {isSpeaking && onSkip && (
          <motion.button
            key="skip-pill"
            type="button"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSkip}
            aria-label="Skip assistant response"
            className="pointer-events-auto flex items-center gap-2 rounded-full mb-3"
            style={{
              paddingLeft: "14px",
              paddingRight: "16px",
              paddingTop: "8px",
              paddingBottom: "8px",
              background: "rgba(9,9,15,0.85)",
              border: "1px solid rgba(0,208,181,0.35)",
              color: "#e6f8f4",
              backdropFilter: "blur(8px)",
              boxShadow: "0 8px 24px 0 rgba(0,208,181,0.18)",
            }}
          >
            <SkipForward style={{ width: "16px", height: "16px" }} strokeWidth={2} />
            <span className="text-xs font-medium tracking-wide">Skip</span>
          </motion.button>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pointer-events-auto flex items-center justify-center shrink-0 rounded-full"
        style={{
          height: "90px",
          gap: "16px",
          paddingLeft: "9px",
          paddingRight: "9px",
          paddingTop: "13px",
          paddingBottom: "13px",
          background: "#09090f",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 -2px 28px 0 rgba(0,0,0,0.5)",
        }}
      >
        {/* Speaker / TTS toggle */}
        <IconButton
          onClick={onToggleTTS}
          ariaLabel={isTTSEnabled ? "Mute voice" : "Unmute voice"}
          active={isTTSEnabled}
          opacity={isTTSEnabled ? 1 : 0.6}
          paddingX={11}
        >
          {isTTSEnabled ? (
            <Volume2 style={{ width: "20px", height: "20px" }} strokeWidth={2} />
          ) : (
            <VolumeX style={{ width: "20px", height: "20px" }} strokeWidth={2} />
          )}
        </IconButton>

        {/* Camera toggle */}
        <IconButton
          onClick={onToggleCamera}
          ariaLabel={showCamera ? "Hide camera" : "Show camera"}
          active={showCamera}
          opacity={1}
          paddingX={14}
        >
          <Camera style={{ width: "20px", height: "20px" }} strokeWidth={2} />
        </IconButton>

        {/* Mic (center, large, gradient) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleMic}
          aria-label={isListening ? "Stop listening" : "Start listening"}
          className="relative flex items-center justify-center rounded-full shrink-0"
          style={{
            width: "64px",
            height: "64px",
            paddingLeft: "20px",
            paddingRight: "20px",
            background:
              "linear-gradient(90deg, #00d0b5 0%, #05ccb8 7.14%, #0ac9bb 14.29%, #0fc5be 21.43%, #13c2c1 28.57%, #16bec4 35.71%, #19bac7 42.86%, #1cb7ca 50%, #1fb3cc 57.14%, #22afcf 64.29%, #24acd1 71.43%, #26a8d4 78.57%, #29a4d6 85.71%, #2ba0d9 92.86%, #2d9cdb 100%)",
            boxShadow: "0 0 20px 0 rgba(0,208,181,0.4)",
            color: "#ffffff",
          }}
        >
          {micPulse && (
            <motion.span
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              style={{
                boxShadow: "0 0 0 4px rgba(0,208,181,0.35)",
              }}
            />
          )}
          {isConversationActive ? (
            <Mic style={{ width: "24px", height: "24px" }} strokeWidth={2} />
          ) : (
            <MicOff style={{ width: "24px", height: "24px" }} strokeWidth={2} />
          )}
        </motion.button>

        {/* Keyboard — jump to text chat */}
        <IconButton
          onClick={onOpenKeyboard}
          ariaLabel="Open text chat"
          active={false}
          opacity={0.6}
          paddingX={11}
        >
          <Keyboard style={{ width: "20px", height: "20px" }} strokeWidth={2} />
        </IconButton>

        {/* Stop */}
        <IconButton
          onClick={onStop}
          ariaLabel="Stop session"
          active={false}
          opacity={0.75}
          paddingX={10}
        >
          <Square
            style={{
              width: "20px",
              height: "20px",
              fill: "currentColor",
            }}
            strokeWidth={0}
          />
        </IconButton>
      </motion.div>
    </div>
  );
}
