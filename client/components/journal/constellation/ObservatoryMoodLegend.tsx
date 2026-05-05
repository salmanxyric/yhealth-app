"use client";

import {
  BookOpen,
  Heart,
  Leaf,
  List,
  Star,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, type CategoryMeta } from "./constellation-math";

interface Props {
  starCount?: number;
  onSwitchToList: () => void;
}

const ICON_MAP: Record<CategoryMeta["iconName"], LucideIcon> = {
  book: BookOpen,
  heart: Heart,
  leaf: Leaf,
  smile: Heart,
  star: Star,
  target: Target,
  zap: Zap,
  brain: Star,
};

const LEGEND_ORDER: Array<keyof typeof CATEGORIES> = [
  "mindset",
  "emotion",
  "energy",
  "growth",
  "gratitude",
  "goals",
];

export function ObservatoryMoodLegend({ onSwitchToList }: Props) {
  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      style={{ zIndex: 30 }}
    >
      {/* Category legend */}
      <div className="flex items-center gap-4 sm:gap-5 flex-wrap justify-center px-3">
        {LEGEND_ORDER.map((key) => {
          const cat = CATEGORIES[key];
          const Icon = ICON_MAP[cat.iconName];
          return (
            <div key={cat.id} className="flex items-center gap-1.5">
              <Icon style={{ color: cat.color, width: 14, height: 14 }} strokeWidth={2} />
              <span className="text-[12px] text-white/70">{cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* List View toggle */}
      <button
        onClick={onSwitchToList}
        className="inline-flex items-center gap-2 h-[36px] rounded-[10px] px-4 text-[13px] text-white transition-colors hover:bg-white/[0.08]"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        }}
      >
        <List className="w-4 h-4" />
        List View
      </button>
    </div>
  );
}
