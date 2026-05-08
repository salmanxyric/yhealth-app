"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Check, Loader2 } from "lucide-react";
import * as wikiApi from "@/src/shared/services/wiki.service";
import type { WikiPage } from "@shared/types/domain/wiki";

interface SaveToWikiModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
}

export function SaveToWikiModal({ isOpen, onClose, messageContent }: SaveToWikiModalProps) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state and fetch pages when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setSelectedSlug(null);
    setIsSaving(false);
    setIsSaved(false);
    setError(null);

    let cancelled = false;

    async function fetchPages() {
      setIsLoading(true);
      try {
        const result = await wikiApi.listPages({ limit: 50, sort: "updated_at", order: "desc" });
        if (!cancelled) {
          setPages(result.data?.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load wiki pages");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPages();
    return () => { cancelled = true; };
  }, [isOpen]);

  async function handleSave() {
    if (!selectedSlug) return;

    setIsSaving(true);
    setError(null);

    try {
      const excerpt = messageContent.slice(0, 200).replace(/\n/g, " ").trim();
      await wikiApi.flagPage(selectedSlug, `User saved AI response: ${excerpt}`);
      setIsSaved(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setError("Failed to save. Please try again.");
      setIsSaving(false);
    }
  }

  const preview = messageContent.slice(0, 300);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0520] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Save to Wiki</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content preview */}
            <div className="mx-5 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {preview}
              </p>
            </div>

            {/* Page selection */}
            <div className="px-5 pt-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
                Select a wiki page
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              )}

              {error && !isLoading && (
                <div className="text-sm text-red-400 py-4 text-center">{error}</div>
              )}

              {!isLoading && !error && pages.length === 0 && (
                <div className="text-sm text-slate-500 py-4 text-center">
                  No wiki pages found
                </div>
              )}

              {!isLoading && !error && pages.length > 0 && (
                <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {pages.map((page) => (
                    <button
                      key={page.slug}
                      onClick={() => setSelectedSlug(page.slug)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition ${
                        selectedSlug === page.slug
                          ? "border border-indigo-500/60 bg-indigo-500/10"
                          : "border border-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {page.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {page.category}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 pt-4 pb-5">
              {isSaved ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <Check className="w-4 h-4" />
                  Saved
                </div>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!selectedSlug || isSaving}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
