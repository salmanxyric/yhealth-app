"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";

interface CoachingNudgeProps {
  message: string | null;
  onDismiss: () => void;
}

export function CoachingNudge({ message, onDismiss }: CoachingNudgeProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, x: 20, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed top-20 right-6 z-[65] max-w-xs rounded-xl border border-white/10 bg-[#0e0a22]/95 backdrop-blur-xl px-4 py-3 shadow-xl"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400/60 mt-0.5 flex-shrink-0" />
            <p className="text-white/50 text-xs leading-relaxed flex-1">{message}</p>
            <button onClick={onDismiss} className="text-white/15 hover:text-white/40 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
