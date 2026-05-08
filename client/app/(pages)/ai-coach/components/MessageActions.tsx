"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Share2, MoreHorizontal, Volume2, VolumeX, X, MessageSquare, Mail, Link2, Check, BookOpen } from "lucide-react";
import { SaveToWikiModal } from "./SaveToWikiModal";
import toast from "react-hot-toast";

interface MessageActionsProps {
  /** Raw markdown content of the assistant message */
  content: string;
  /** Called when user clicks Regenerate */
  onRegenerate: () => void;
  /** Disable regenerate while a message is being sent */
  isRegenerating?: boolean;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ""))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s/gm, "• ")
    .trim();
}

export function MessageActions({ content, onRegenerate, isRegenerating }: MessageActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showSaveToWiki, setShowSaveToWiki] = useState(false);
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
    // Try native Web Share API first (mobile)
    const plain = stripMarkdown(content);
    if (navigator.share) {
      navigator.share({ title: "yHealth Coach", text: plain }).catch(() => {
        // User cancelled or API unavailable — fall back to modal
        setShareOpen(true);
      });
    } else {
      setShareOpen(true);
    }
  }

  function handleCopyShareText() {
    navigator.clipboard.writeText(stripMarkdown(content)).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function shareVia(channel: "whatsapp" | "x" | "email") {
    const plain = stripMarkdown(content);
    const encoded = encodeURIComponent(plain);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      x: `https://x.com/intent/tweet?text=${encoded}`,
      email: `mailto:?subject=${encodeURIComponent("From my yHealth Coach")}&body=${encoded}`,
    };
    window.open(urls[channel], "_blank", "noopener");
    setShareOpen(false);
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
      <ActionButton icon={<BookOpen className="w-3.5 h-3.5" />} title="Save to Wiki" onClick={() => setShowSaveToWiki(true)} />

      {/* Share portal */}
      <AnimatePresence>
        {shareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShareOpen(false)}
          >
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-semibold text-white">Share message</h3>
                <button
                  onClick={() => setShareOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="mx-5 rounded-xl border border-white/10 bg-white/5 p-4 max-h-40 overflow-y-auto">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
                    {stripMarkdown(content)}
                  </p>
                </div>
              </div>

              {/* Share channels */}
              <div className="px-5 pt-4 pb-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">Share via</div>
                <div className="flex gap-3">
                  <ShareChannel
                    label="WhatsApp"
                    color="bg-emerald-600"
                    icon={<MessageSquare className="w-5 h-5" />}
                    onClick={() => shareVia("whatsapp")}
                  />
                  <ShareChannel
                    label="X"
                    color="bg-slate-700"
                    icon={<span className="text-sm font-bold">𝕏</span>}
                    onClick={() => shareVia("x")}
                  />
                  <ShareChannel
                    label="Email"
                    color="bg-blue-600"
                    icon={<Mail className="w-5 h-5" />}
                    onClick={() => shareVia("email")}
                  />
                </div>
              </div>

              {/* Copy text button */}
              <div className="px-5 pt-3 pb-5">
                <button
                  onClick={handleCopyShareText}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm text-slate-200 transition"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Copy text
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Save to Wiki modal */}
      <SaveToWikiModal
        isOpen={showSaveToWiki}
        onClose={() => setShowSaveToWiki(false)}
        messageContent={content}
      />
    </div>
  );
}

function ShareChannel({
  label,
  color,
  icon,
  onClick,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group/share"
    >
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white group-hover/share:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-[11px] text-slate-400">{label}</span>
    </button>
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
