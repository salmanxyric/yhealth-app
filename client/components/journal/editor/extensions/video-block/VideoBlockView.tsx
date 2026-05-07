"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Video, Trash2, Link } from "lucide-react";

const ALLOWED_EMBED_ORIGINS = [
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://www.loom.com",
] as const;

function getEmbedUrl(url: string): { embedUrl: string; provider: string } | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return { embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`, provider: "YouTube" };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, provider: "Vimeo" };

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([\w]+)/);
  if (loomMatch) return { embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`, provider: "Loom" };

  return null;
}

function isSafeEmbedUrl(url: string): boolean {
  return ALLOWED_EMBED_ORIGINS.some((origin) => url.startsWith(origin + "/"));
}

export function VideoBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { src, provider } = node.attrs;
  const [inputUrl, setInputUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!src) {
    return (
      <NodeViewWrapper className="my-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-5 h-5 text-white/30" />
            <span className="text-white/40 text-sm">Embed a video</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste YouTube, Vimeo, or Loom URL..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 placeholder:text-white/20 text-sm focus:outline-none focus:border-purple-500/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const result = getEmbedUrl(inputUrl);
                  if (result) {
                    updateAttributes({ src: result.embedUrl, provider: result.provider, type: "embed" });
                  } else {
                    setError("Unsupported URL. Use YouTube, Vimeo, or Loom links.");
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const result = getEmbedUrl(inputUrl);
                if (result) {
                  updateAttributes({ src: result.embedUrl, provider: result.provider, type: "embed" });
                } else {
                  setError("Unsupported URL");
                }
              }}
              className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-sm"
            >
              <Link className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-red-400/60 text-xs mt-2">{error}</p>}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="aspect-video">
          {isSafeEmbedUrl(src) ? (
            <iframe
              src={src}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-red-400/60 text-sm">
              Blocked: untrusted embed origin
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
          <span className="text-white/20 text-xs">{provider || "Video"}</span>
          <button
            onClick={deleteNode}
            className="p-1 rounded text-white/20 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
