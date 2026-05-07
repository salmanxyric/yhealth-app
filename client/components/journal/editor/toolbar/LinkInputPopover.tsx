"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Unlink } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface LinkInputPopoverProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkInputPopover({ editor, isOpen, onClose }: LinkInputPopoverProps) {
  const existing = editor.getAttributes("link").href || "";
  const [url, setUrl] = useState(existing);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(editor.getAttributes("link").href || "");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, editor]);

  const apply = () => {
    const trimmed = url.trim();
    if (trimmed) {
      editor.chain().focus().setLink({ href: trimmed }).run();
    }
    onClose();
  };

  const remove = () => {
    editor.chain().focus().unsetLink().run();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-center justify-center px-4"
          style={{ background: "rgba(2, 2, 10, 0.7)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0e0a22] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="observatory-font-display text-white/60"
                style={{ fontSize: 10, letterSpacing: "0.15em" }}
              >
                INSERT LINK
              </h3>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); apply(); }
                  if (e.key === "Escape") { e.preventDefault(); onClose(); }
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 placeholder:text-white/20 text-sm focus:outline-none focus:border-purple-500/30 transition-colors"
              />
              <button
                onClick={apply}
                disabled={!url.trim()}
                className="px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 transition-all text-sm disabled:opacity-30"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {existing && (
              <button
                onClick={remove}
                className="mt-2 flex items-center gap-1.5 text-red-400/60 hover:text-red-400 text-xs transition-colors"
              >
                <Unlink className="w-3 h-3" />
                Remove link
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
