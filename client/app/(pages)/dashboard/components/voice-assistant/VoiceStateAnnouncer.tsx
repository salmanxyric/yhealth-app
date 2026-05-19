"use client";

import { useEffect, useRef } from "react";

interface VoiceStateAnnouncerProps {
  voiceState: "idle" | "listening" | "processing" | "speaking";
  isConversationActive: boolean;
  isReconnecting?: boolean;
  error?: string | null;
  transcript?: string;
}

function getVoiceStateAnnouncement(
  voiceState: VoiceStateAnnouncerProps["voiceState"],
  isConversationActive: boolean,
): string {
  if (!isConversationActive && voiceState === "idle") return "";

  switch (voiceState) {
    case "idle":
      return "Ready. Tap to speak.";
    case "listening":
      return "Listening...";
    case "processing":
      return "Processing your message...";
    case "speaking":
      return "Coach is responding.";
    default:
      return "";
  }
}

export function VoiceStateAnnouncer({
  voiceState,
  isConversationActive,
  isReconnecting = false,
  error = null,
  transcript,
}: VoiceStateAnnouncerProps) {
  const prevVoiceStateRef = useRef(voiceState);
  const prevActiveRef = useRef(isConversationActive);
  const prevReconnectingRef = useRef(isReconnecting);
  const prevErrorRef = useRef(error);
  const prevTranscriptRef = useRef(transcript);

  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  // Announce voice state changes (polite)
  useEffect(() => {
    const stateChanged = prevVoiceStateRef.current !== voiceState;
    const activeChanged = prevActiveRef.current !== isConversationActive;

    if (stateChanged || activeChanged) {
      const message = getVoiceStateAnnouncement(voiceState, isConversationActive);

      if (politeRef.current && message) {
        politeRef.current.textContent = message;
      }

      prevVoiceStateRef.current = voiceState;
      prevActiveRef.current = isConversationActive;
    }
  }, [voiceState, isConversationActive]);

  // Announce error and reconnection states (assertive)
  useEffect(() => {
    const errorChanged = prevErrorRef.current !== error;
    const reconnectingChanged = prevReconnectingRef.current !== isReconnecting;

    if (assertiveRef.current) {
      if (errorChanged && error) {
        assertiveRef.current.textContent = error;
      } else if (reconnectingChanged && isReconnecting) {
        assertiveRef.current.textContent = "Connection lost. Reconnecting...";
      } else if (reconnectingChanged && !isReconnecting && prevReconnectingRef.current) {
        assertiveRef.current.textContent = "Connection restored.";
      }
    }

    prevErrorRef.current = error;
    prevReconnectingRef.current = isReconnecting;
  }, [error, isReconnecting]);

  // Announce transcript updates (polite, only on change)
  useEffect(() => {
    if (
      transcript &&
      transcript !== prevTranscriptRef.current &&
      politeRef.current
    ) {
      // Only announce significant transcript changes (not partial updates)
      // We update the live region content so screen readers pick it up
      politeRef.current.textContent = transcript;
    }

    prevTranscriptRef.current = transcript;
  }, [transcript]);

  const srOnlyStyle: React.CSSProperties = {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  };

  return (
    <>
      {/* Polite announcements: voice state transitions, transcripts */}
      <div
        ref={politeRef}
        aria-live="polite"
        role="status"
        aria-atomic="true"
        style={srOnlyStyle}
      />

      {/* Assertive announcements: errors, reconnection */}
      <div
        ref={assertiveRef}
        aria-live="assertive"
        role="alert"
        aria-atomic="true"
        style={srOnlyStyle}
      />
    </>
  );
}
