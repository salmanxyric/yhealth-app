"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pause, Square, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface DictationOverlayProps {
  isActive: boolean;
  status: "idle" | "listening" | "paused" | "error";
  elapsed: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function DictationOverlay({
  isActive,
  status,
  elapsed,
  onPause,
  onResume,
  onStop,
}: DictationOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[65] flex items-center gap-4 px-5 py-3 rounded-2xl border border-white/10 bg-[#0e0a22]/95 backdrop-blur-xl shadow-2xl"
        >
          {/* Mic indicator */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            status === "listening" ? "bg-red-500/20 animate-pulse" : "bg-white/5"
          )}>
            <Mic className={cn("w-5 h-5", status === "listening" ? "text-red-400" : "text-white/30")} />
          </div>

          {/* Status */}
          <div>
            <div className="text-white/60 text-sm font-medium observatory-font-body">
              {status === "listening" ? "Listening..." : status === "paused" ? "Paused" : "Dictation"}
            </div>
            <div className="text-white/25 text-xs">{formatTime(elapsed)}</div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 ml-2">
            {status === "listening" ? (
              <button
                onClick={onPause}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : status === "paused" ? (
              <button
                onClick={onResume}
                className="p-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : null}
            <button
              onClick={onStop}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
