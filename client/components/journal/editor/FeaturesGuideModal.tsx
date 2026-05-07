"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Type, Image, Mic, Pencil, Sparkles, Save, Slash } from "lucide-react";

interface FeaturesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: Type,
    title: "RICH TEXT FORMATTING",
    color: "text-blue-400",
    items: [
      { label: "Bold", shortcut: "Ctrl + B" },
      { label: "Italic", shortcut: "Ctrl + I" },
      { label: "Underline", shortcut: "Ctrl + U" },
      { label: "Highlight", shortcut: "Ctrl + Shift + H" },
      { label: "Inline Code", shortcut: "Ctrl + E" },
      { label: "Link", shortcut: "Ctrl + K" },
    ],
    description: "Select text to reveal the floating toolbar with formatting options.",
  },
  {
    icon: Slash,
    title: "SLASH COMMANDS",
    color: "text-purple-400",
    items: [
      { label: "Open menu", shortcut: "Type /" },
      { label: "Headings", shortcut: "/heading" },
      { label: "Lists & tasks", shortcut: "/bullet, /task" },
      { label: "Code block", shortcut: "/code" },
      { label: "Separator", shortcut: "/horizontal" },
    ],
    description: "Type / anywhere to open the command menu. Filter by typing after the slash.",
  },
  {
    icon: Image,
    title: "MEDIA BLOCKS",
    color: "text-emerald-400",
    items: [
      { label: "Insert image", shortcut: "/image" },
      { label: "Record audio", shortcut: "/audio" },
      { label: "Embed video", shortcut: "/video" },
      { label: "Attach file", shortcut: "/file" },
      { label: "Drawing canvas", shortcut: "/drawing" },
    ],
    description: "Supports drag-and-drop upload. YouTube, Vimeo, and Loom embeds for video.",
  },
  {
    icon: Mic,
    title: "VOICE DICTATION",
    color: "text-teal-400",
    items: [
      { label: "Start dictation", shortcut: "/dictation" },
      { label: "New paragraph", shortcut: 'Say "new paragraph"' },
      { label: "New line", shortcut: 'Say "new line"' },
      { label: "Stop", shortcut: 'Say "stop dictation"' },
    ],
    description: "Hands-free writing with voice commands. Uses your browser's speech recognition.",
  },
  {
    icon: Pencil,
    title: "DRAWING CANVAS",
    color: "text-amber-400",
    items: [
      { label: "Undo", shortcut: "Ctrl + Z" },
      { label: "Redo", shortcut: "Ctrl + Shift + Z" },
      { label: "Delete object", shortcut: "Delete / Backspace" },
    ],
    description: "Full drawing tools: pen, shapes, text, eraser. Saved as PNG inline in your entry.",
  },
  {
    icon: Sparkles,
    title: "AI COACH",
    color: "text-violet-400",
    items: [
      { label: "Toggle AI panel", shortcut: "Ctrl + J" },
      { label: "AI continue writing", shortcut: "/ai continue" },
      { label: "AI rewrite selection", shortcut: "/ai rewrite" },
      { label: "AI expand thought", shortcut: "/ai expand" },
      { label: "Cognitive reframe", shortcut: "/ai reframe" },
      { label: "Follow-up prompt", shortcut: "/ai prompt" },
    ],
    description: "AI coaching nudges appear as you write. Open the AI panel for deeper guidance.",
  },
  {
    icon: Save,
    title: "SAVING",
    color: "text-cyan-400",
    items: [
      { label: "Save entry", shortcut: "Ctrl + Enter" },
      { label: "Close editor", shortcut: "Escape" },
    ],
    description: "Auto-saves every 30 seconds. Emergency backup to localStorage on page close.",
  },
] as const;

export function FeaturesGuideModal({ isOpen, onClose }: FeaturesGuideModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-center justify-center px-4"
          style={{ background: "rgba(2, 2, 10, 0.85)", backdropFilter: "blur(10px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[80vh] rounded-2xl border border-white/10 bg-[#0e0a22] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-purple-400/70" />
                <h2
                  className="observatory-font-display text-white/70"
                  style={{ fontSize: 12, letterSpacing: "0.15em" }}
                >
                  EDITOR FEATURES & SHORTCUTS
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto observatory-scroll px-6 py-4 space-y-6">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${section.color}`} />
                      <h3
                        className={`observatory-font-display ${section.color}`}
                        style={{ fontSize: 9, letterSpacing: "0.15em" }}
                      >
                        {section.title}
                      </h3>
                    </div>

                    <p className="text-white/30 text-xs mb-3 leading-relaxed">
                      {section.description}
                    </p>

                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-white/50 text-sm">{item.label}</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/35 text-xs font-mono">
                            {item.shortcut}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-white/15 text-xs">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/25 text-xs font-mono mx-0.5">?</kbd> to toggle this guide
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/8 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
