"use client";

/**
 * @file JournalEntryModal Component
 * @description Observatory-styled full entry view modal. Deep glass aesthetic
 * with Cinzel headers, AI analysis section, and wellness insights.
 */

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JournalEntry, JournalingMode } from "@shared/types/domain/wellbeing";
import { formatStarLabel, getMoodEmoji, getMoodLabel } from "./constellation-math";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JournalEntryModalProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (entryId: string) => void;
}

// ---------------------------------------------------------------------------
// Journaling mode labels
// ---------------------------------------------------------------------------

const JOURNALING_MODE_LABELS: Record<JournalingMode, string> = {
  quick_reflection: "Quick Reflection",
  deep_dive: "Deep Dive",
  gratitude: "Gratitude",
  life_perspective: "Life Perspective",
  free_write: "Free Write",
};

// ---------------------------------------------------------------------------
// Sentiment pill color
// ---------------------------------------------------------------------------

function getSentimentColor(score?: number | null): string {
  if (score == null) return "#94a3b8";
  if (score > 0.3) return "#fbbf24";
  if (score > -0.3) return "#60a5fa";
  if (score > -0.6) return "#a78bfa";
  return "#f87171";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JournalEntryModal({
  entry,
  onClose,
  onEdit,
  onDelete,
}: JournalEntryModalProps) {
  const dateLabel = formatStarLabel(entry.loggedAt);
  const moodEmoji = getMoodEmoji(entry.sentimentScore);
  const moodLabel = getMoodLabel(entry.sentimentScore);
  const sentimentColor = getSentimentColor(entry.sentimentScore);
  const modeLabel = entry.journalingMode
    ? JOURNALING_MODE_LABELS[entry.journalingMode]
    : null;

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePanelClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
    },
    []
  );

  const handleEdit = useCallback(() => {
    onEdit?.(entry);
  }, [onEdit, entry]);

  const handleDelete = useCallback(() => {
    onDelete?.(entry.id);
  }, [onDelete, entry.id]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(2, 2, 10, 0.75)", backdropFilter: "blur(8px)" }}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={`Journal entry from ${dateLabel}`}
      >
        {/* Panel */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={handlePanelClick}
          className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-purple-500/15 shadow-2xl observatory-scroll"
          style={{
            background:
              "linear-gradient(135deg, rgba(14, 10, 34, 0.95) 0%, rgba(7, 5, 22, 0.98) 50%, rgba(14, 10, 34, 0.95) 100%)",
            boxShadow:
              "0 0 60px rgba(139, 92, 246, 0.08), 0 16px 64px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Subtle top glow */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
            }}
          />

          <div className="relative">
            {/* ----------------------------------------------------------- */}
            {/* Header                                                       */}
            {/* ----------------------------------------------------------- */}
            <div className="flex items-start justify-between gap-4 p-6 pb-4">
              <div className="space-y-3">
                {/* Date */}
                <p
                  className="observatory-font-display text-purple-300/60"
                  style={{ fontSize: 10, letterSpacing: "0.2em" }}
                >
                  {dateLabel}
                </p>

                {/* Sentiment badge + journaling mode */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Mood pill */}
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border observatory-font-display"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: sentimentColor,
                      borderColor: `${sentimentColor}30`,
                      background: `${sentimentColor}10`,
                    }}
                  >
                    <span aria-hidden="true">{moodEmoji}</span>
                    {moodLabel.toUpperCase()}
                  </span>

                  {/* Mode tag */}
                  {modeLabel && (
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full border border-white/8 observatory-font-display text-white/30"
                      style={{ fontSize: 9, letterSpacing: "0.1em" }}
                    >
                      {modeLabel.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Prompt section                                               */}
            {/* ----------------------------------------------------------- */}
            {entry.prompt && (
              <div className="px-6 pb-4">
                <div
                  className="pl-4 py-1"
                  style={{ borderLeft: `2px solid ${sentimentColor}30` }}
                >
                  <p className="observatory-font-body text-white/35 italic leading-relaxed" style={{ fontSize: 12 }}>
                    {entry.prompt}
                  </p>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* Entry text                                                   */}
            {/* ----------------------------------------------------------- */}
            <div className="px-6 pb-4">
              <p className="observatory-font-body whitespace-pre-wrap leading-relaxed text-white/70" style={{ fontSize: 14 }}>
                {entry.entryText}
              </p>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Word count + metadata */}
            {/* ----------------------------------------------------------- */}
            <div className="px-6 pb-4 flex items-center gap-3">
              <span
                className="observatory-font-display text-white/20 border border-white/8 rounded-full px-2.5 py-0.5"
                style={{ fontSize: 8, letterSpacing: "0.1em" }}
              >
                {entry.wordCount} WORDS
              </span>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* AI Reflection                                                */}
            {/* ----------------------------------------------------------- */}
            {entry.coachReflection && (
              <div className="px-6 pb-4">
                <div
                  className="relative overflow-hidden rounded-xl border border-purple-500/15"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(88, 28, 135, 0.04) 100%)",
                  }}
                >
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400/70" />
                      <span
                        className="observatory-font-display text-purple-300/60"
                        style={{ fontSize: 9, letterSpacing: "0.15em" }}
                      >
                        AI REFLECTION
                      </span>
                    </div>
                    <p className="observatory-font-body text-white/50 italic leading-relaxed" style={{ fontSize: 12 }}>
                      {entry.coachReflection}
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* ----------------------------------------------------------- */}
            {/* Footer actions                                               */}
            {/* ----------------------------------------------------------- */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 gap-2 observatory-font-display"
                  style={{ fontSize: 10, letterSpacing: "0.08em" }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  EDIT
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="border-red-500/15 text-red-400/60 hover:text-red-300 hover:bg-red-900/15 gap-2 observatory-font-display"
                  style={{ fontSize: 10, letterSpacing: "0.08em" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  DELETE
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
