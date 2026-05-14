"use client";

import { CSS_COLORS } from "./constants";

interface ProgressOverlayProps {
  progress: number;
  dissolving: boolean;
}

export function ProgressOverlay({ progress, dissolving }: ProgressOverlayProps) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-[12vh] pointer-events-none z-10"
      style={{
        opacity: dissolving ? 0 : 1,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Progress bar */}
      <div
        className="w-48 h-px relative overflow-hidden"
        style={{ backgroundColor: `${CSS_COLORS.coreCyan}26` }}
      >
        <div
          className="absolute inset-y-0 left-0 h-full"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, transparent, ${CSS_COLORS.coreCyan})`,
            boxShadow: `0 0 8px ${CSS_COLORS.coreCyan}, 0 0 16px ${CSS_COLORS.coreCyan}66`,
            transition: "width 0.3s ease-out",
          }}
        />
      </div>

      {/* Loading text */}
      <div
        className="mt-3 text-[10px] tracking-[0.25em] uppercase font-light"
        style={{ color: `${CSS_COLORS.coreCyan}99` }}
      >
        Initializing
        <span className="inline-flex gap-[2px] ml-1">
          <span
            className="animate-pulse"
            style={{ animationDelay: "0ms", animationDuration: "1.2s" }}
          >
            .
          </span>
          <span
            className="animate-pulse"
            style={{ animationDelay: "200ms", animationDuration: "1.2s" }}
          >
            .
          </span>
          <span
            className="animate-pulse"
            style={{ animationDelay: "400ms", animationDuration: "1.2s" }}
          >
            .
          </span>
        </span>
      </div>
    </div>
  );
}
