"use client";

import { BookOpen } from "lucide-react";

interface WikiLinkChipProps {
  slug: string;
  onClick: (slug: string) => void;
}

export function WikiLinkChip({ slug, onClick }: WikiLinkChipProps) {
  const displayName = slug.replace(/-/g, " ");

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors align-baseline mx-0.5"
      title={`Open wiki page: ${displayName}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(slug);
      }}
    >
      <BookOpen className="size-3 shrink-0" />
      <span>{displayName}</span>
    </button>
  );
}
