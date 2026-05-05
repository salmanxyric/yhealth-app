"use client";

import { motion, AnimatePresence } from "framer-motion";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface StatusPillProps {
  name: string;
  voiceState: VoiceState;
  isConversationActive: boolean;
}

function getStateLabel(voiceState: VoiceState, isActive: boolean): string | null {
  if (!isActive && voiceState === "idle") return null;
  switch (voiceState) {
    case "listening":
      return "Listening...";
    case "processing":
      return "Thinking...";
    case "speaking":
      return "Speaking...";
    case "idle":
    default:
      return "Ready";
  }
}

export function StatusPill({ name, voiceState, isConversationActive }: StatusPillProps) {
  const label = getStateLabel(voiceState, isConversationActive);

  return (
    <AnimatePresence>
      {label && (
        <motion.div
          key={`${voiceState}-${isConversationActive}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none inline-flex items-center rounded-full"
          style={{
            gap: "8px",
            height: "25px",
            paddingLeft: "13px",
            paddingRight: "13px",
            paddingTop: "5px",
            paddingBottom: "5px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.13)",
          }}
        >
          <motion.span
            animate={
              voiceState === "speaking" || voiceState === "listening"
                ? { opacity: [1, 0.4, 1] }
                : { opacity: 0.97 }
            }
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full"
            style={{
              width: "6px",
              height: "6px",
              background: "#10b981",
              flexShrink: 0,
            }}
          />
          <p
            className="whitespace-nowrap font-bold"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              lineHeight: "15px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#d1d5dc",
              margin: 0,
            }}
          >
            <span style={{ fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>{name} </span>
            <span>{label}</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
