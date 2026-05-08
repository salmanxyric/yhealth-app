"use client";

/**
 * @file DistractionFreeEditor Component
 * @description Full-screen, Observatory-styled writing surface for journal entries.
 * Deep space aesthetic with Cinzel headings, Nunito body, ambient glow,
 * serif textarea, word/character counts, elapsed timer, and keyboard shortcuts.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Check, CloudOff, Feather, CalendarDays } from "lucide-react";
import type { JournalingMode } from "@shared/types/domain/wellbeing";
import { AgenticEditor } from "./editor/AgenticEditor";
import type { AgenticEditorAPI } from "./editor/useAgenticEditor";
import { useAutoSave } from "./editor/useAutoSave";
import { useValidation } from "./editor/useValidation";
import { CompletenessBar } from "./editor/validation/CompletenessBar";
import { ValidationReview } from "./editor/validation/ValidationReview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DistractionFreeEditorProps {
  prompt?: string | null;
  mode: JournalingMode;
  value: string;
  onChange: (text: string) => void;
  onContentChange?: (html: string, text: string, json: Record<string, unknown>) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  autoSaveStatus?: "idle" | "saving" | "saved";
  /** Selected date for the entry (YYYY-MM-DD). Defaults to today. */
  entryDate?: string;
  onDateChange?: (date: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<JournalingMode, { label: string; accent: string }> = {
  quick_reflection: { label: "QUICK REFLECTION", accent: "rgba(96, 165, 250, 0.5)" },
  deep_dive: { label: "DEEP DIVE", accent: "rgba(168, 85, 247, 0.5)" },
  gratitude: { label: "GRATITUDE", accent: "rgba(251, 191, 36, 0.5)" },
  life_perspective: { label: "LIFE PERSPECTIVE", accent: "rgba(139, 92, 246, 0.5)" },
  free_write: { label: "FREE WRITE", accent: "rgba(148, 163, 184, 0.5)" },
  voice_conversation: { label: "VOICE JOURNAL", accent: "rgba(45, 212, 191, 0.5)" },
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AutoSaveBadge({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;

  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 observatory-font-display text-white/25"
      style={{ fontSize: 8, letterSpacing: "0.12em" }}
    >
      {status === "saving" ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          SAVING
        </>
      ) : (
        <>
          <Check className="w-3 h-3 text-emerald-400/60" />
          SAVED
        </>
      )}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistractionFreeEditor({
  prompt = null,
  mode,
  value,
  onChange,
  onContentChange,
  onClose,
  onSubmit,
  isSubmitting = false,
  autoSaveStatus: _autoSaveStatus = "idle",
  entryDate,
  onDateChange,
}: DistractionFreeEditorProps) {
  const editorApiRef = useRef<AgenticEditorAPI | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [richContent, setRichContent] = useState<{
    html: string;
    text: string;
    json: Record<string, unknown>;
  } | null>(null);

  const [showValidation, setShowValidation] = useState(false);

  const validation = useValidation({
    text: richContent?.text ?? value,
    html: richContent?.html ?? "",
    mode,
  });

  const autoSave = useAutoSave({
    data: richContent,
    onSave: async (data) => {
      onChange(data.text);
      onContentChange?.(data.html, data.text, data.json);
    },
    enabled: true,
  });

  const handleSave = useCallback(() => {
    const hasBlockers = validation.checks.some((c) => c.status === "block");
    if (hasBlockers) {
      setShowValidation(true);
    } else {
      onSubmit();
    }
  }, [validation, onSubmit]);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const isEmpty = editorApiRef.current?.isEmpty() ?? true;
        if (!isEmpty && !isSubmitting) {
          handleSave();
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("toggle-ai-pill"));
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement)?.closest?.(".ProseMirror")) {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("toggle-features-guide"));
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isSubmitting, handleSave, onClose]);

  const currentText = richContent?.text ?? value;
  const wordCount = currentText.trim().length > 0 ? currentText.trim().split(/\s+/).length : 0;
  const charCount = currentText.length;
  const editorIsEmpty = !richContent || richContent.text.trim().length === 0;
  const modeInfo = MODE_LABELS[mode];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, #0e0a22 0%, #070516 40%, #02020a 100%)",
      }}
    >
      {/* Ambient nebula glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "60vw",
          height: "40vh",
          background: `radial-gradient(ellipse, ${modeInfo.accent.replace("0.5", "0.04")} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between px-6 py-4"
        style={{ zIndex: 10 }}
      >
        {/* Left: auto-save + date picker + mode badge */}
        <div className="flex items-center gap-4">
          <AutoSaveBadge status={autoSave.status === "error" ? "idle" : autoSave.status === "saved" ? "saved" : autoSave.status === "saving" ? "saving" : "idle"} />
          {/* Date picker */}
          {onDateChange && (
            <label className="relative flex items-center gap-1.5 cursor-pointer group">
              <CalendarDays className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
              <input
                type="date"
                value={entryDate || new Date().toISOString().split("T")[0]}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => onDateChange(e.target.value)}
                className="observatory-font-display bg-transparent border border-white/8 rounded-full px-2.5 py-0.5 text-white/30 hover:text-white/50 hover:border-white/15 focus:text-white/60 focus:border-purple-500/30 outline-none transition-all cursor-pointer"
                style={{ fontSize: 9, letterSpacing: "0.1em", colorScheme: "dark" }}
              />
            </label>
          )}
          <span
            className="observatory-font-display text-white/20 border border-white/8 rounded-full px-2.5 py-0.5"
            style={{ fontSize: 8, letterSpacing: "0.12em" }}
          >
            {modeInfo.label}
          </span>
        </div>

        {/* Right: submit + close */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSubmitting || editorIsEmpty}
            className="observatory-font-display flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontSize: 10, letterSpacing: "0.15em" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <Feather className="w-3.5 h-3.5" />
                SAVE REFLECTION
              </>
            )}
          </button>

          <button
            onClick={onClose}
            aria-label="Close editor"
            className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Centered writing area */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto px-4 sm:px-6 observatory-scroll">
        <div className="w-full max-w-2xl flex flex-col flex-1 py-4 sm:py-8">
          {/* AI prompt */}
          {prompt && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="relative mb-10"
            >
              {/* Ambient glow behind prompt */}
              <div
                className="absolute -inset-4 rounded-2xl pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse, ${modeInfo.accent.replace("0.5", "0.06")} 0%, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />

              {/* Prompt card */}
              <div
                className="relative px-6 py-5 rounded-xl border border-white/5"
                style={{
                  background: "rgba(255, 255, 255, 0.015)",
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-6 right-6 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${modeInfo.accent.replace("0.5", "0.2")}, transparent)`,
                  }}
                />

                <p
                  className="observatory-font-body text-white/50 italic leading-relaxed text-center"
                  style={{ fontSize: 16 }}
                >
                  {prompt}
                </p>
              </div>
            </motion.div>
          )}

          {/* Rich Editor */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex-1 flex flex-col"
          >
            <AgenticEditor
              mode={mode}
              initialContent={value}
              onUpdate={(html, text, json) => {
                onChange(text);
                onContentChange?.(html, text, json);
                setRichContent({ html, text, json });
              }}
              onReady={(api) => {
                editorApiRef.current = api;
                setTimeout(() => api.focus(), 400);
              }}
              className="flex-1"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between px-6 py-3"
        style={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)" }}
      >
        <div
          className="flex items-center gap-4 observatory-font-display text-white/15"
          style={{ fontSize: 9, letterSpacing: "0.1em" }}
        >
          <span>{wordCount} WORDS</span>
          <span>{charCount} CHARACTERS</span>
          <CompletenessBar score={validation.completenessScore} />
        </div>

        <div
          className="flex items-center gap-4 observatory-font-display text-white/15"
          style={{ fontSize: 9, letterSpacing: "0.1em" }}
        >
          {autoSave.status === "idle" && richContent && richContent.text.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <CloudOff className="w-3 h-3" />
              NOT SAVED
            </span>
          )}
          <span>{formatElapsed(elapsed)}</span>
          <span className="hidden sm:inline text-white/10">
            CTRL+ENTER TO SAVE
          </span>
        </div>
      </motion.div>

      <ValidationReview
        result={validation}
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        onSaveAnyway={() => {
          setShowValidation(false);
          onSubmit();
        }}
        onGoBack={() => setShowValidation(false)}
      />
    </motion.div>
  );
}
