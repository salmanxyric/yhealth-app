"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@shared/types/domain/wellbeing";

interface ValidationReviewProps {
  result: ValidationResult;
  isOpen: boolean;
  onClose: () => void;
  onSaveAnyway: () => void;
  onGoBack: () => void;
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  block: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  suggestion: { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" },
};

export function ValidationReview({
  result,
  isOpen,
  onClose,
  onSaveAnyway,
  onGoBack,
}: ValidationReviewProps) {
  const hasBlockers = result.checks.some((c) => c.status === "block");
  const hasWarnings = result.checks.some((c) => c.status === "warn");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(2, 2, 10, 0.8)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0a22] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="observatory-font-display text-white/80"
                style={{ fontSize: 12, letterSpacing: "0.15em" }}
              >
                ENTRY REVIEW
              </h2>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-sm">Completeness</span>
                <span className="text-white/60 text-sm font-medium">{result.completenessScore}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    result.completenessScore < 30
                      ? "bg-red-500/60"
                      : result.completenessScore < 60
                        ? "bg-amber-500/60"
                        : "bg-emerald-500/60"
                  )}
                  style={{ width: `${result.completenessScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {result.checks.map((check, i) => {
                const config = STATUS_CONFIG[check.status];
                const Icon = config.icon;
                return (
                  <div
                    key={i}
                    className={cn("flex items-start gap-3 px-3 py-2.5 rounded-lg", config.bg)}
                  >
                    <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} />
                    <div>
                      <span className={cn("text-sm font-medium", config.color)}>{check.name}</span>
                      <p className="text-white/40 text-sm">{check.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onGoBack}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/70 hover:border-white/20 transition-all text-sm"
              >
                Go Back & Edit
              </button>
              <button
                onClick={onSaveAnyway}
                disabled={hasBlockers}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  hasBlockers
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : hasWarnings
                      ? "bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30"
                      : "bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30"
                )}
              >
                {hasBlockers ? "Fix Blockers First" : hasWarnings ? "Save Anyway" : "Save Entry"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
