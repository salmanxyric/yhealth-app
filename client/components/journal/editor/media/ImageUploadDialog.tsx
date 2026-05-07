"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Link, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImage } from "./media-validators";
import { api } from "@/lib/api-client";

interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt?: string) => void;
}

export function ImageUploadDialog({ isOpen, onClose, onInsert }: ImageUploadDialogProps) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTab("upload");
      setUrl("");
      setAlt("");
      setError(null);
      setDragActive(false);
      setUploading(false);
    }
  }, [isOpen]);

  const handleUpload = useCallback(
    async (file: File) => {
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.error ?? "Invalid file");
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<{ publicUrl?: string; url: string }>(
          "/upload/image",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (response.success && response.data) {
          onInsert(response.data.publicUrl || response.data.url, alt || file.name);
          onClose();
        } else {
          throw new Error("Upload failed");
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [alt, onInsert, onClose]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{ background: "rgba(2, 2, 10, 0.8)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0a22] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="observatory-font-display text-white/80" style={{ fontSize: 12, letterSpacing: "0.15em" }}>
                INSERT IMAGE
              </h2>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/5 mb-4">
              {(["upload", "url"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition-all",
                    tab === t ? "bg-purple-500/20 text-purple-300" : "text-white/40 hover:text-white/60"
                  )}
                >
                  {t === "upload" ? <Upload className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                  {t === "upload" ? "Upload" : "URL"}
                </button>
              ))}
            </div>

            {tab === "upload" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  dragActive ? "border-purple-500/50 bg-purple-500/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
                <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm mb-1">
                  {uploading ? "Uploading..." : "Drop image here or click to browse"}
                </p>
                <p className="text-white/20 text-xs">JPG, PNG, GIF, WebP, SVG — max 10MB</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 placeholder:text-white/20 text-sm focus:outline-none focus:border-purple-500/30"
                />
                <button
                  onClick={() => { if (url) { onInsert(url, alt); onClose(); } }}
                  disabled={!url}
                  className="w-full py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 transition-all text-sm disabled:opacity-30"
                >
                  Insert Image
                </button>
              </div>
            )}

            {/* Alt text */}
            <div className="mt-3">
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Alt text (optional)"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 placeholder:text-white/15 text-sm focus:outline-none focus:border-purple-500/30"
              />
            </div>

            {error && <p className="text-red-400/70 text-xs mt-2">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
