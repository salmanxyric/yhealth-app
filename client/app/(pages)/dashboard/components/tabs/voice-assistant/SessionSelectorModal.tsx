"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { SessionTypeSelector, type SessionTypeOption } from "../../voice-assistant/SessionTypeSelector";

interface SessionSelectorModalProps {
  isOpen: boolean;
  isConversationActive: boolean;
  selectedType: SessionTypeOption | undefined;
  onSelect: (type: SessionTypeOption) => Promise<void>;
  onClose: () => void;
}

export function SessionSelectorModal({
  isOpen,
  isConversationActive,
  selectedType,
  onSelect,
  onClose,
}: SessionSelectorModalProps) {
  return (
    <AnimatePresence>
      {isOpen && !isConversationActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/78 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border border-white/15 bg-[#070b10]/96 shadow-[0_36px_120px_rgba(0,0,0,0.6)]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(20,184,166,0.16), transparent 34%), linear-gradient(215deg, rgba(168,85,247,0.14), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 76px)",
              }}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-5 border-b border-white/10 px-5 py-5 md:px-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-teal-300/20 bg-teal-300/10">
                  <Sparkles className="w-5 h-5 text-teal-200" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                      AI coaching command center
                    </span>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                      8 modes
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    Choose how Alina should coach you
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-5 text-white/58">
                    Pick a session depth and focus area. The assistant will adapt its tone, pacing, questions, and
                    follow-up plan.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.06, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close session selector"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="relative max-h-[calc(92vh-128px)] overflow-y-auto p-5 md:p-6">
              <SessionTypeSelector selectedType={selectedType} onSelect={onSelect} showEmergency={true} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
