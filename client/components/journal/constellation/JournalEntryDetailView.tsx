"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Pencil,
  Trash2,
  Sparkles,
  Clock,
  Calendar,
  BookOpen,
  Mic,
  Timer,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Hash,
  Flame,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { JournalEntry, JournalingMode } from "@shared/types/domain/wellbeing";
import { formatStarLabel, formatTime, getMoodEmoji, getMoodLabel } from "./constellation-math";

interface JournalEntryDetailViewProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (entryId: string) => void;
}

const JOURNALING_MODE_LABELS: Record<JournalingMode, string> = {
  quick_reflection: "Quick Reflection",
  deep_dive: "Deep Dive",
  gratitude: "Gratitude",
  life_perspective: "Life Perspective",
  free_write: "Free Write",
  voice_conversation: "Voice Journal",
};

const JOURNALING_MODE_ICONS: Record<JournalingMode, typeof BookOpen> = {
  quick_reflection: Sparkles,
  deep_dive: BookOpen,
  gratitude: Flame,
  life_perspective: TrendingUp,
  free_write: Pencil,
  voice_conversation: Mic,
};

function getSentimentColor(score?: number | null): string {
  if (score == null) return "#94a3b8";
  if (score > 0.3) return "#fbbf24";
  if (score > -0.3) return "#60a5fa";
  if (score > -0.6) return "#a78bfa";
  return "#f87171";
}


function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatFullDate(loggedAt: string): string {
  const d = new Date(loggedAt);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function JournalEntryDetailView({
  entry,
  onClose,
  onEdit,
  onDelete,
}: JournalEntryDetailViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showReflection, setShowReflection] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sentimentColor = getSentimentColor(entry.sentimentScore);
  const moodEmoji = getMoodEmoji(entry.sentimentScore);
  const moodLabel = getMoodLabel(entry.sentimentScore);
  const modeLabel = entry.journalingMode
    ? JOURNALING_MODE_LABELS[entry.journalingMode]
    : null;
  const ModeIcon = entry.journalingMode
    ? JOURNALING_MODE_ICONS[entry.journalingMode]
    : BookOpen;
  const dateLabel = formatStarLabel(entry.loggedAt);
  const fullDate = formatFullDate(entry.loggedAt);
  const time = formatTime(entry.loggedAt);
  const hasRichContent = !!entry.contentHtml && entry.contentHtml.trim().length > 0;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.(entry.id);
    onClose();
  }, [confirmDelete, entry.id, onDelete, onClose]);

  const sentimentPercent =
    entry.sentimentScore != null
      ? Math.round((entry.sentimentScore + 1) * 50)
      : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{
          background: "rgba(2, 2, 10, 0.85)",
          backdropFilter: "blur(12px)",
        }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Journal entry from ${fullDate}`}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          layout
          onClick={(e) => e.stopPropagation()}
          className={`relative flex flex-col border border-purple-500/15 shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
            isFullscreen
              ? "w-full h-full max-w-none max-h-none rounded-none"
              : "w-full max-w-3xl max-h-[90vh] rounded-2xl"
          }`}
          style={{
            background:
              "linear-gradient(180deg, rgba(14, 10, 34, 0.97) 0%, rgba(7, 5, 22, 0.99) 40%, rgba(2, 2, 10, 1) 100%)",
            boxShadow: isFullscreen
              ? "none"
              : "0 0 80px rgba(139, 92, 246, 0.06), 0 24px 80px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Top glow accent */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${sentimentColor}50, transparent)`,
            }}
          />

          {/* Ambient glow orb */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, ${sentimentColor}08 0%, transparent 70%)`,
            }}
          />

          {/* ─── Header Bar ─── */}
          <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span
                className="observatory-font-display"
                style={{ fontSize: 10, letterSpacing: "0.12em" }}
              >
                BACK
              </span>
            </button>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(entry)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 hover:bg-white/5 transition-all observatory-font-display"
                  style={{ fontSize: 9, letterSpacing: "0.1em" }}
                >
                  <Pencil className="w-3 h-3" />
                  EDIT
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all observatory-font-display ${
                    confirmDelete
                      ? "border-red-500/40 text-red-400/80 bg-red-500/10"
                      : "border-white/8 text-white/30 hover:text-red-400/60 hover:border-red-500/20 hover:bg-red-500/5"
                  }`}
                  style={{ fontSize: 9, letterSpacing: "0.1em" }}
                >
                  <Trash2 className="w-3 h-3" />
                  {confirmDelete ? "CONFIRM DELETE" : "DELETE"}
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/50 transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Scrollable Content ─── */}
          <div className="flex-1 overflow-y-auto observatory-scroll" ref={contentRef}>
           <div className={`mx-auto w-full ${isFullscreen ? "max-w-4xl" : ""}`}>
            {/* Hero section */}
            <div className="px-8 pt-8 pb-6 space-y-6">
              {/* Date + Time */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-purple-400/40" />
                  <span
                    className="observatory-font-display text-purple-300/50"
                    style={{ fontSize: 10, letterSpacing: "0.2em" }}
                  >
                    {dateLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-400/30" />
                  <span
                    className="observatory-font-display text-white/30"
                    style={{ fontSize: 10, letterSpacing: "0.15em" }}
                  >
                    {time}
                  </span>
                </div>
              </div>

              {/* Metadata pills row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Mood pill */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{
                    color: sentimentColor,
                    borderColor: `${sentimentColor}20`,
                    background: `${sentimentColor}08`,
                  }}
                >
                  <span className="text-base" aria-hidden="true">
                    {moodEmoji}
                  </span>
                  <span
                    className="observatory-font-display"
                    style={{ fontSize: 9, letterSpacing: "0.1em" }}
                  >
                    {moodLabel.toUpperCase()}
                  </span>
                </div>

                {/* Mode pill */}
                {modeLabel && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/15 bg-purple-500/5">
                    <ModeIcon className="w-3 h-3 text-purple-400/50" />
                    <span
                      className="observatory-font-display text-purple-300/50"
                      style={{ fontSize: 9, letterSpacing: "0.1em" }}
                    >
                      {modeLabel.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Word count */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-white/3">
                  <Hash className="w-3 h-3 text-white/20" />
                  <span
                    className="observatory-font-display text-white/25"
                    style={{ fontSize: 9, letterSpacing: "0.1em" }}
                  >
                    {entry.wordCount} WORDS
                  </span>
                </div>

                {/* Voice badge */}
                {entry.voiceEntry && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/15 bg-cyan-500/5">
                    <Mic className="w-3 h-3 text-cyan-400/50" />
                    <span
                      className="observatory-font-display text-cyan-300/50"
                      style={{ fontSize: 9, letterSpacing: "0.1em" }}
                    >
                      VOICE
                    </span>
                  </div>
                )}

                {/* Duration */}
                {entry.durationSeconds != null && entry.durationSeconds > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-white/3">
                    <Timer className="w-3 h-3 text-white/20" />
                    <span
                      className="observatory-font-display text-white/25"
                      style={{ fontSize: 9, letterSpacing: "0.1em" }}
                    >
                      {formatDuration(entry.durationSeconds)}
                    </span>
                  </div>
                )}

                {/* Streak day */}
                {entry.streakDay != null && entry.streakDay > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/15 bg-orange-500/5">
                    <Flame className="w-3 h-3 text-orange-400/50" />
                    <span
                      className="observatory-font-display text-orange-300/50"
                      style={{ fontSize: 9, letterSpacing: "0.1em" }}
                    >
                      DAY {entry.streakDay}
                    </span>
                  </div>
                )}
              </div>

              {/* Sentiment bar */}
              {sentimentPercent != null && (
                <div className="space-y-2">
                  <span
                    className="observatory-font-display text-white/15"
                    style={{ fontSize: 8, letterSpacing: "0.15em" }}
                  >
                    SENTIMENT
                  </span>
                  <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sentimentPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${sentimentColor}60, ${sentimentColor})`,
                        boxShadow: `0 0 8px ${sentimentColor}40`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div
              className="mx-8 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.15), transparent)",
              }}
            />

            {/* Prompt section */}
            {entry.prompt && (
              <div className="px-8 pt-6 pb-2">
                <div
                  className="rounded-xl border border-purple-500/10 p-5"
                  style={{
                    background: `linear-gradient(135deg, ${sentimentColor}05, transparent)`,
                  }}
                >
                  <span
                    className="observatory-font-display text-white/15 block mb-2"
                    style={{ fontSize: 8, letterSpacing: "0.15em" }}
                  >
                    PROMPT
                  </span>
                  <p
                    className="observatory-font-body text-white/40 italic leading-relaxed"
                    style={{ fontSize: 14 }}
                  >
                    &ldquo;{entry.prompt}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Entry content */}
            <div className="px-8 py-6">
              {hasRichContent ? (
                <div
                  className="prose prose-invert prose-sm max-w-none observatory-font-body leading-relaxed journal-rich-content"
                  style={{ fontSize: 15, color: "rgba(255,255,255,0.78)" }}
                  dangerouslySetInnerHTML={{ __html: entry.contentHtml! }}
                />
              ) : (
                <p
                  className="observatory-font-body whitespace-pre-wrap leading-[1.85] text-white/75"
                  style={{ fontSize: 15 }}
                >
                  {entry.entryText}
                </p>
              )}
            </div>

            {/* Voice audio player */}
            {entry.voiceAudioUrl && (
              <div className="px-8 pb-4">
                <div className="rounded-xl border border-cyan-500/10 p-4 bg-cyan-500/3">
                  <span
                    className="observatory-font-display text-cyan-400/30 block mb-3"
                    style={{ fontSize: 8, letterSpacing: "0.15em" }}
                  >
                    VOICE RECORDING
                  </span>
                  <audio
                    src={entry.voiceAudioUrl}
                    controls
                    className="w-full h-8 opacity-70"
                    style={{ filter: "invert(1) hue-rotate(180deg)" }}
                  />
                </div>
              </div>
            )}

            {/* AI Coach Reflection */}
            {entry.coachReflection && (
              <div className="px-8 pb-6">
                <button
                  onClick={() => setShowReflection(!showReflection)}
                  className="flex items-center gap-2 w-full text-left mb-3"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400/40" />
                  <span
                    className="observatory-font-display text-purple-300/40"
                    style={{ fontSize: 9, letterSpacing: "0.12em" }}
                  >
                    AI COACH REFLECTION
                  </span>
                  {showReflection ? (
                    <ChevronUp className="w-3 h-3 text-purple-400/30 ml-auto" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-purple-400/30 ml-auto" />
                  )}
                </button>
                <AnimatePresence>
                  {showReflection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-xl border border-purple-500/10 p-5"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(88, 28, 135, 0.02) 100%)",
                        }}
                      >
                        <p
                          className="observatory-font-body text-white/50 italic leading-relaxed"
                          style={{ fontSize: 13 }}
                        >
                          {entry.coachReflection}
                        </p>
                        {entry.coachReflectionAt && (
                          <span
                            className="block mt-3 observatory-font-display text-purple-400/20"
                            style={{ fontSize: 8, letterSpacing: "0.1em" }}
                          >
                            Generated {new Date(entry.coachReflectionAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Bottom spacer */}
            <div className="h-4" />
           </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
