"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { AnalysisStep } from "@shared/types/domain/intelligence-files";

interface DeepAnalysisTimelineProps {
  steps: AnalysisStep[];
  totalDurationMs?: number;
}

export function DeepAnalysisTimeline({ steps, totalDurationMs }: DeepAnalysisTimelineProps) {
  if (steps.length === 0) return null;

  const isComplete = steps.every((s) => s.status === "completed" || s.status === "failed");

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {!isComplete ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span className="text-xs font-medium text-slate-300">
          {isComplete ? "Analysis Complete" : "Analyzing..."}
        </span>
        {isComplete && totalDurationMs && (
          <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Thought for {(totalDurationMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2.5 px-2 py-1.5"
          >
            <StepIcon status={step.status} />
            <span
              className={`text-xs flex-1 ${
                step.status === "active"
                  ? "text-white"
                  : step.status === "completed"
                    ? "text-slate-400"
                    : step.status === "failed"
                      ? "text-red-400"
                      : "text-slate-600"
              }`}
            >
              {step.label}
            </span>
            {step.resultSummary && (
              <span className="text-[10px] text-slate-500 shrink-0">{step.resultSummary}</span>
            )}
            {step.durationMs !== undefined && (
              <span className="text-[10px] text-slate-600 tabular-nums shrink-0">
                {step.durationMs}ms
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StepIcon({ status }: { status: AnalysisStep["status"] }) {
  switch (status) {
    case "active":
      return <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />;
    case "completed":
      return <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />;
    case "failed":
      return <XCircle className="w-3 h-3 text-red-400 shrink-0" />;
    default:
      return <div className="w-3 h-3 rounded-full bg-white/10 shrink-0" />;
  }
}
