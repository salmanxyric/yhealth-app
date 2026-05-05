"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Zap,
  Target,
  Play,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import type { ExerciseListItem } from "@/src/shared/services/exercises.service";

interface ExerciseCardProps {
  exercise: ExerciseListItem;
  index: number;
}

const DIFFICULTY: Record<
  string,
  { label: string; chipText: string; chipBg: string; chipRing: string; accent: string }
> = {
  beginner: {
    label: "Beginner",
    chipText: "#86efac",
    chipBg: "rgba(16,185,129,0.15)",
    chipRing: "rgba(16,185,129,0.35)",
    accent: "#34d399",
  },
  intermediate: {
    label: "Intermediate",
    chipText: "#fcd34d",
    chipBg: "rgba(245,158,11,0.15)",
    chipRing: "rgba(245,158,11,0.35)",
    accent: "#fbbf24",
  },
  advanced: {
    label: "Advanced",
    chipText: "#fca5a5",
    chipBg: "rgba(239,68,68,0.15)",
    chipRing: "rgba(239,68,68,0.35)",
    accent: "#f87171",
  },
  expert: {
    label: "Expert",
    chipText: "#c4b5fd",
    chipBg: "rgba(139,92,246,0.15)",
    chipRing: "rgba(139,92,246,0.35)",
    accent: "#a78bfa",
  },
};

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const difficulty = DIFFICULTY[exercise.difficulty_level] || DIFFICULTY.beginner;
  const isVideo = exercise.animation_url?.endsWith(".mp4");
  const mediaSrc = isVideo
    ? exercise.thumbnail_url
    : exercise.animation_url || exercise.thumbnail_url;
  const hasImage = !imageError && (exercise.animation_url || exercise.thumbnail_url);

  return (
    <Link href={`/exercises/${exercise.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded-[22px]">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.025, 0.35) }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative"
      >
        {/* Aurora glow */}
        <motion.div
          aria-hidden
          animate={{ opacity: isHovered ? 0.5 : 0 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none absolute -inset-4 rounded-[32px] blur-3xl"
          style={{
            background: `radial-gradient(60% 55% at 50% 0%, ${difficulty.accent}40 0%, transparent 70%)`,
          }}
        />

        {/* Gradient border frame */}
        <div
          className="relative rounded-[22px] p-[1px] transition-colors duration-500"
          style={{
            background: isHovered
              ? `linear-gradient(135deg, ${difficulty.accent}70 0%, rgba(255,255,255,0.06) 45%, ${difficulty.accent}40 100%)`
              : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <div
            className="relative overflow-hidden rounded-[21px]"
            style={{
              background:
                "linear-gradient(180deg, #11131a 0%, #0a0c12 100%)",
              boxShadow: isHovered
                ? "0 24px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset"
                : "0 10px 30px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset",
            }}
          >
            {/* Media */}
            <div className="relative aspect-[5/4] overflow-hidden">
              {hasImage ? (
                <>
                  {isVideo ? (
                    <video
                      src={exercise.animation_url || ""}
                      poster={exercise.thumbnail_url || undefined}
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={mediaSrc || ""}
                      alt={exercise.name}
                      loading="lazy"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                    />
                  )}

                  {/* Bottom darken gradient for text legibility */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(10,12,18,0) 40%, rgba(10,12,18,0.55) 75%, rgba(10,12,18,0.95) 100%)",
                    }}
                  />

                  {/* Hover sheen */}
                  <motion.div
                    aria-hidden
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? "120%" : "-20%" }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="absolute top-0 bottom-0 w-1/3 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
                      transform: "skewX(-15deg)",
                    }}
                  />

                  {/* Play button on hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="relative">
                      <motion.span
                        aria-hidden
                        animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full"
                        style={{ background: `${difficulty.accent}55` }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${difficulty.accent} 0%, #0ea5e9 100%)`,
                          boxShadow: `0 12px 30px ${difficulty.accent}55`,
                        }}
                      >
                        <Play className="w-5 h-5 text-white translate-x-[1px]" fill="currentColor" />
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <Dumbbell className="w-12 h-12 text-slate-700" />
                </div>
              )}

              {/* Top-left: Difficulty chip */}
              <div
                className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md"
                style={{
                  background: difficulty.chipBg,
                  border: `1px solid ${difficulty.chipRing}`,
                  color: difficulty.chipText,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: difficulty.accent }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }}
                >
                  {difficulty.label}
                </span>
              </div>

              {/* Top-right: Category chip */}
              {exercise.category && (
                <div
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md"
                  style={{
                    background: "rgba(10,12,18,0.55)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#cbd5e1",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {exercise.category}
                </div>
              )}

              {/* Title overlay at bottom of media */}
              <div className="absolute left-4 right-4 bottom-3">
                <h3
                  className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] truncate capitalize"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {exercise.name}
                </h3>
              </div>
            </div>

            {/* Meta row */}
            <div className="px-4 py-3 space-y-2.5">
              {/* Muscle group */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-flex items-center justify-center rounded-md shrink-0"
                  style={{
                    width: "20px",
                    height: "20px",
                    background: `${difficulty.accent}20`,
                    color: difficulty.accent,
                  }}
                >
                  <Target className="w-3 h-3" strokeWidth={2.2} />
                </span>
                <span
                  className="text-[12px] text-slate-300 truncate capitalize"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                >
                  {exercise.primary_muscle_group || exercise.body_part || "Full Body"}
                </span>
              </div>

              {/* Equipment chips */}
              {exercise.equipment_required && exercise.equipment_required.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {exercise.equipment_required.slice(0, 2).map((eq) => (
                    <span
                      key={eq}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium capitalize"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#94a3b8",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                  {(exercise.equipment_required.length || 0) > 2 && (
                    <span
                      className="text-[10px] text-slate-500"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      +{exercise.equipment_required.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: "1px dashed rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Zap className="w-3 h-3" style={{ color: difficulty.accent }} />
                    <span className="tabular-nums">
                      {exercise.default_sets}×{exercise.default_reps}
                    </span>
                  </span>
                  {exercise.calories_per_minute && (
                    <span className="inline-flex items-center gap-1 text-amber-300/80">
                      <Flame className="w-3 h-3" />
                      <span className="tabular-nums">
                        {Math.round(exercise.calories_per_minute)}
                      </span>
                      <span className="text-slate-600">cal/min</span>
                    </span>
                  )}
                </div>
                <motion.span
                  animate={{ x: isHovered ? 2 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                  style={{ color: difficulty.accent, fontFamily: "Inter, sans-serif" }}
                >
                  View
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
