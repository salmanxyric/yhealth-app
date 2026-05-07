"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface YouTubeEmbedProps {
  videoId: string | null;
  isLoading?: boolean;
}

function extractYouTubeVideoId(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;

      const parts = url.pathname.split("/").filter(Boolean);
      const knownPath = parts.findIndex((part) =>
        ["embed", "shorts", "live", "v"].includes(part)
      );

      if (knownPath >= 0) {
        return parts[knownPath + 1] || null;
      }
    }
  } catch {
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match?.[1] ?? null;
  }

  return null;
}

export default function YouTubeEmbed({
  videoId,
  isLoading = false,
}: YouTubeEmbedProps) {
  const normalizedVideoId = extractYouTubeVideoId(videoId);

  if (isLoading) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/5 border border-white/10">
        <div className="flex items-center justify-center h-full animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-zinc-600" />
            </div>
            <div className="h-3 w-24 rounded bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!normalizedVideoId) {
    return (
      <div
        className={cn(
          "aspect-video w-full rounded-xl overflow-hidden",
          "bg-white/3 border border-white/6",
          "flex items-center justify-center"
        )}
      >
        <div className="flex flex-col items-center gap-2 text-zinc-600">
          <Play className="h-8 w-8" />
          <span className="text-[13px]">No video available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${normalizedVideoId}?rel=0&modestbranding=1`}
        title="Exercise tutorial"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
