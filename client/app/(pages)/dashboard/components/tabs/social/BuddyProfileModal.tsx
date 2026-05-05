"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Flame,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { BuddySuggestion } from "./types";
import { pillarConfig, activityLevelColors } from "./constants";

export type BuddyModalAction =
  | { kind: "follow"; userId: string }
  | { kind: "challenge"; suggestion: BuddySuggestion }
  | { kind: "dismiss"; userId: string };

interface BuddyProfileModalProps {
  suggestion: BuddySuggestion | null;
  onClose: () => void;
  onAction: (action: BuddyModalAction) => Promise<void> | void;
  /** Set to true when caller is mid-flight so buttons show spinners. */
  pending?: "follow" | "challenge" | "dismiss" | null;
}

export function BuddyProfileModal({
  suggestion,
  onClose,
  onAction,
  pending = null,
}: BuddyProfileModalProps) {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!suggestion) return;
    setSent(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [suggestion, onClose]);

  if (!suggestion) return null;

  const pillar = suggestion.primaryPillar ? pillarConfig[suggestion.primaryPillar] : null;
  const PillarIcon = pillar?.icon;
  const actColor = activityLevelColors[suggestion.activityLevel] || "#a1a1aa";
  const scorePct = Math.round(suggestion.matchScore * 100);
  const scoreColor =
    suggestion.matchScore >= 0.7
      ? "#34d399"
      : suggestion.matchScore >= 0.5
        ? "#fbbf24"
        : "#60a5fa";
  const challenge = suggestion.suggestedChallenge;

  const doFollow = async () => {
    await onAction({ kind: "follow", userId: suggestion.userId });
    setSent(true);
  };
  const doChallenge = async () => {
    await onAction({ kind: "challenge", suggestion });
  };
  const doDismiss = async () => {
    await onAction({ kind: "dismiss", userId: suggestion.userId });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-[95] backdrop-blur-md"
        style={{ background: "rgba(2,0,15,0.6)" }}
      />

      <motion.div
        key="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Buddy profile"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[96] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-3xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          style={{
            background:
              "linear-gradient(180deg, rgba(16,19,26,0.96) 0%, rgba(10,12,18,0.96) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.55), 0 0 1px rgba(255,255,255,0.05) inset, 0 0 100px rgba(0,208,181,0.1)",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: "32px",
              height: "32px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#94a3b8",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>

          {/* Hero gradient */}
          <div
            className="relative px-6 pt-7 pb-6"
            style={{
              background:
                "radial-gradient(120% 70% at 50% 0%, rgba(0,208,181,0.14) 0%, transparent 70%)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="shrink-0 flex items-center justify-center overflow-hidden"
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "20px",
                  background:
                    "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(45,156,219,0.2) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                {suggestion.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={suggestion.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (suggestion.firstName?.[0] || "?").toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  className="text-white truncate"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {suggestion.firstName} {suggestion.lastName || ""}
                </h2>
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  {PillarIcon && pillar && (
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{
                        color: pillar.color,
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <PillarIcon className="w-3.5 h-3.5" />
                      {pillar.label}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{
                      color: actColor,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: actColor }}
                    />
                    {suggestion.activityLevel}
                  </span>
                  {suggestion.currentStreak > 0 && (
                    <span
                      className="inline-flex items-center gap-1"
                      style={{
                        color: "#fb923c",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      {suggestion.currentStreak}-day
                    </span>
                  )}
                </div>
              </div>

              {/* Match Ring */}
              <div className="shrink-0 relative" style={{ width: "64px", height: "64px" }}>
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 28 * (1 - suggestion.matchScore),
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="tabular-nums font-bold"
                    style={{
                      color: scoreColor,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    {scorePct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Match reason */}
            <p
              className="mt-4"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                lineHeight: "22px",
                color: "#cbd5e1",
                fontStyle: "italic",
              }}
            >
              &ldquo;{suggestion.matchReason}&rdquo;
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Goals / primary goal */}
            {suggestion.primaryGoal && (
              <Section label="Primary Goal" icon={<Target className="w-3.5 h-3.5" />} iconColor="#22d3ee">
                <p
                  className="text-white"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 500 }}
                >
                  {suggestion.primaryGoal}
                </p>
              </Section>
            )}

            {/* Goal overlap */}
            {suggestion.goalOverlap && Object.keys(suggestion.goalOverlap).length > 0 && (
              <Section
                label="Shared Focus Areas"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                iconColor="#a78bfa"
              >
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(suggestion.goalOverlap)
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2.5 py-1 rounded-lg"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "#e2e8f0",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        {k}
                        {typeof v === "number" ? ` · ${v}` : ""}
                      </span>
                    ))}
                </div>
              </Section>
            )}

            {/* Suggested challenge */}
            {challenge && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))",
                  border: "1px solid rgba(251,191,36,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span
                    className="uppercase tracking-wider"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#fcd34d",
                      letterSpacing: "0.12em",
                    }}
                  >
                    Suggested Shared Challenge
                  </span>
                </div>
                <p
                  className="text-white mb-1"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: 600,
                  }}
                >
                  {challenge.name}
                </p>
                {challenge.description && (
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      lineHeight: "20px",
                      color: "#cbd5e1",
                    }}
                  >
                    {challenge.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
                  <span>{challenge.durationDays} days</span>
                  <span>·</span>
                  <span>{challenge.metric}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-6 py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {sent ? (
              <>
                <div
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    color: "#34d399",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <Check className="w-4 h-4" />
                  Follow request sent
                </div>
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#cbd5e1",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Open chat
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={doFollow}
                  disabled={pending === "follow"}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, #00d0b5 0%, #2d9cdb 100%)",
                    color: "#02000f",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    boxShadow: "0 10px 26px rgba(0,208,181,0.3)",
                  }}
                >
                  {pending === "follow" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Send Follow Request
                </button>
                <button
                  type="button"
                  onClick={doChallenge}
                  disabled={pending === "challenge"}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: "rgba(251,191,36,0.12)",
                    border: "1px solid rgba(251,191,36,0.28)",
                    color: "#fbbf24",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {pending === "challenge" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Challenge
                </button>
                <button
                  type="button"
                  onClick={doDismiss}
                  disabled={pending === "dismiss"}
                  aria-label="Dismiss suggestion"
                  className="inline-flex items-center justify-center rounded-xl py-2.5 px-3 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#94a3b8",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({
  label,
  icon,
  iconColor,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: iconColor }}>{icon}</span>
        <span
          className="uppercase tracking-wider"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "10px",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.12em",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
