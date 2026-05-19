"use client";

import { useEffect, useCallback, useMemo } from "react";

interface CallKeyboardShortcutsConfig {
  onToggleMic?: () => void;
  onToggleTTS?: () => void;
  onToggleCamera?: () => void;
  onEndCall?: () => void;
  onSkipResponse?: () => void;
  isActive: boolean;
}

interface ShortcutEntry {
  key: string;
  description: string;
}

/** Tags and attributes that indicate the focused element accepts text input. */
const INPUT_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  if (INPUT_TAG_NAMES.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useCallKeyboardShortcuts(config: CallKeyboardShortcutsConfig) {
  const {
    onToggleMic,
    onToggleTTS,
    onToggleCamera,
    onEndCall,
    onSkipResponse,
    isActive,
  } = config;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Never intercept shortcuts when typing in an input field
      if (isEditableTarget(event)) return;

      switch (event.key) {
        case " ": {
          // Space — toggle mic, prevent page scroll
          event.preventDefault();
          onToggleMic?.();
          break;
        }
        case "m":
        case "M": {
          onToggleMic?.();
          break;
        }
        case "t":
        case "T": {
          onToggleTTS?.();
          break;
        }
        case "c":
        case "C": {
          onToggleCamera?.();
          break;
        }
        case "Escape": {
          onEndCall?.();
          break;
        }
        case "s":
        case "S": {
          onSkipResponse?.();
          break;
        }
        default:
          break;
      }
    },
    [onToggleMic, onToggleTTS, onToggleCamera, onEndCall, onSkipResponse],
  );

  useEffect(() => {
    if (!isActive) return;

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  const shortcuts: ShortcutEntry[] = useMemo(
    () => [
      { key: "Space / M", description: "Toggle microphone" },
      { key: "T", description: "Toggle text-to-speech" },
      { key: "C", description: "Toggle camera" },
      { key: "Esc", description: "End call" },
      { key: "S", description: "Skip AI response" },
    ],
    [],
  );

  return { shortcuts };
}
