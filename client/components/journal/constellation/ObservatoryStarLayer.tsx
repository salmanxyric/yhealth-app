"use client";

import { memo } from "react";
import { formatShortDate, getMoodEmoji } from "./constellation-math";

export interface ScreenStar {
  id: string;
  x: number;
  y: number;
  domSize: number;
  color: string;
  glowColor: string;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  loggedAt: string;
  sentimentScore?: number | null;
}

interface Props {
  stars: ScreenStar[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
}

export const ObservatoryStarLayer = memo(function ObservatoryStarLayer({
  stars,
  hoveredIndex,
  onHover,
  onClick,
}: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
      {stars.map((star, i) => {
        const isHovered = hoveredIndex === i;
        const scale = isHovered ? 1.6 : 1;
        return (
          <div
            key={star.id}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: star.x,
              top: star.y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(i)}
          >
            {/* Star dot */}
            <div
              className="star-twinkle rounded-full"
              style={{
                width: star.domSize,
                height: star.domSize,
                backgroundColor: star.color,
                boxShadow: `0 0 ${star.domSize * 1.5}px ${star.domSize * 0.5}px ${star.glowColor}`,
                opacity: 0.5 + star.brightness * 0.5,
                animationDuration: `${star.twinkleSpeed}s`,
                animationDelay: `${star.twinklePhase}s`,
              }}
            />

            {/* Floating date label — visible on hover */}
            <div
              className="star-label-float absolute whitespace-nowrap observatory-font-display"
              style={{
                top: -(star.domSize + 20),
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 9,
                letterSpacing: "0.12em",
                color: star.glowColor,
                textShadow: `0 0 8px ${star.glowColor}`,
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.3s ease",
                pointerEvents: "none",
              }}
            >
              {getMoodEmoji(star.sentimentScore)} {formatShortDate(star.loggedAt)}
            </div>
          </div>
        );
      })}
    </div>
  );
});
