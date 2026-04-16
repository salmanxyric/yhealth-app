"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Share2, MoreHorizontal, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";

interface MessageActionsProps {
  /** Raw markdown content of the assistant message */
  content: string;
  /** Called when user clicks Regenerate */
  onRegenerate: () => void;
  /** Disable regenerate while a message is being sent */
  isRegenerating?: boolean;
}

export function MessageActions({ content, onRegenerate, isRegenerating }: MessageActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Sync speaking state with speechSynthesis
  useEffect(() => {
    if (!isSpeaking) return;
    const interval = setInterval(() => {
      if (!window.speechSynthesis.speaking) setIsSpeaking(false);
    }, 300);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      toast.success("Copied to clipboard", { duration: 1500 });
    });
  }

  function handleShare() {
    // Strip markdown syntax for a clean shareable text
    const plain = content
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^[-*+]\s/gm, "• ")
      .trim();
    navigator.clipboard.writeText(plain).then(() => {
      toast.success("Message copied for sharing", { duration: 1500 });
    });
  }

  function handleReadAloud() {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setMenuOpen(false);
      return;
    }
    // Strip markdown for cleaner speech
    const plain = content
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setMenuOpen(false);
  }

  return (
    <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 max-sm:opacity-70">
      <ActionButton icon={<Copy className="w-3.5 h-3.5" />} title="Copy" onClick={handleCopy} />
      <ActionButton
        icon={<RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />}
        title="Regenerate"
        onClick={onRegenerate}
        disabled={isRegenerating}
      />
      <ActionButton icon={<Share2 className="w-3.5 h-3.5" />} title="Share" onClick={handleShare} />

      {/* More menu */}
      <div className="relative" ref={menuRef}>
        <ActionButton
          icon={<MoreHorizontal className="w-3.5 h-3.5" />}
          title="More"
          onClick={() => setMenuOpen((o) => !o)}
          active={menuOpen}
        />
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 bottom-full mb-1 z-20 min-w-[160px] rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-1"
            >
              <button
                onClick={handleReadAloud}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 rounded-lg hover:bg-white/5 transition"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4 text-red-400" />
                    Stop reading
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-slate-400" />
                    Read aloud
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {icon}
    </button>
  );
}
