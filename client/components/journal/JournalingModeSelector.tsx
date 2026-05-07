"use client";

/**
 * @file JournalingModeSelector Component
 * @description Card grid for selecting a journaling mode before entering the editor.
 * Five modes: Quick Reflection, Deep Dive, Gratitude, Life Perspective, Free Write.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Compass,
  Heart,
  Eye,
  Feather,
  Clock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { JournalingMode } from "@shared/types/domain/wellbeing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModeOption {
  mode: JournalingMode;
  label: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  iconBg: string;
}

export interface JournalingModeSelectorProps {
  onSelect: (mode: JournalingMode) => void;
  selectedMode?: JournalingMode | null;
}

// ---------------------------------------------------------------------------
// Mode definitions
// ---------------------------------------------------------------------------

const MODES: ModeOption[] = [
  {
    mode: "quick_reflection",
    label: "Quick Reflection",
    description: "A single prompt to capture your thoughts in the moment",
    duration: "2-3 min",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-400",
    glowColor: "shadow-blue-500/25",
    iconBg: "from-blue-500 to-cyan-400",
  },
  {
    mode: "deep_dive",
    label: "Deep Dive",
    description: "Multi-prompt exploration for deeper self-discovery",
    duration: "10-15 min",
    icon: Compass,
    gradient: "from-violet-500 to-purple-400",
    glowColor: "shadow-violet-500/25",
    iconBg: "from-violet-500 to-purple-400",
  },
  {
    mode: "gratitude",
    label: "Gratitude",
    description: "Reflect on three things you're grateful for today",
    duration: "5 min",
    icon: Heart,
    gradient: "from-rose-500 to-pink-400",
    glowColor: "shadow-rose-500/25",
    iconBg: "from-rose-500 to-pink-400",
  },
  {
    mode: "life_perspective",
    label: "Life Perspective",
    description: "Explore your identity, values, and what matters most",
    duration: "10 min",
    icon: Eye,
    gradient: "from-amber-500 to-orange-400",
    glowColor: "shadow-amber-500/25",
    iconBg: "from-amber-500 to-orange-400",
  },
  {
    mode: "free_write",
    label: "Free Write",
    description: "No prompts, no structure — just let your thoughts flow",
    duration: "Any",
    icon: Feather,
    gradient: "from-emerald-500 to-teal-400",
    glowColor: "shadow-emerald-500/25",
    iconBg: "from-emerald-500 to-teal-400",
  },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JournalingModeSelector({
  onSelect,
  selectedMode = null,
}: JournalingModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<JournalingMode | null>(null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      role="radiogroup"
      aria-label="Select journaling mode"
    >
      {MODES.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedMode === option.mode;
        const isHovered = hoveredMode === option.mode;

        return (
          <motion.button
            key={option.mode}
            variants={cardVariants}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(option.mode)}
            onMouseEnter={() => setHoveredMode(option.mode)}
            onMouseLeave={() => setHoveredMode(null)}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${option.label} - ${option.description} - ${option.duration}`}
            className={`
              group relative overflow-hidden rounded-2xl p-5 text-left
              border transition-all duration-500 ease-out cursor-pointer
              bg-white/[0.03] backdrop-blur-md
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
              ${
                isSelected
                  ? `border-white/20 shadow-xl ${option.glowColor}`
                  : "border-white/[0.06] hover:border-white/15"
              }
            `}
          >
            {/* Ambient glow on hover */}
            <div
              className={`
                absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500
                bg-gradient-to-br ${option.gradient} blur-xl
                ${isSelected ? "opacity-[0.12]" : "group-hover:opacity-[0.08]"}
              `}
            />

            {/* Inner highlight edge */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full min-h-[140px]">
              {/* Top: Icon + Duration */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`
                    inline-flex items-center justify-center w-12 h-12 rounded-xl
                    bg-gradient-to-br ${option.iconBg}
                    shadow-lg ${option.glowColor}
                    transition-shadow duration-500
                    ${isHovered || isSelected ? `shadow-xl ${option.glowColor}` : ""}
                  `}
                >
                  <Icon className="w-5.5 h-5.5 text-white drop-shadow-sm" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-slate-400 tracking-wide">
                  <Clock className="w-3 h-3" />
                  {option.duration}
                </span>
              </div>

              {/* Label */}
              <h3 className="text-[15px] font-semibold text-white mb-1.5 tracking-[-0.01em]">
                {option.label}
              </h3>

              {/* Description */}
              <p className="text-[13px] text-slate-400 leading-relaxed flex-1">
                {option.description}
              </p>

              {/* Start indicator */}
              <div className={`
                flex items-center gap-1.5 mt-4 text-[12px] font-medium tracking-wide
                transition-all duration-300
                ${isHovered || isSelected ? "text-white/70 translate-x-0 opacity-100" : "text-transparent -translate-x-2 opacity-0"}
              `}>
                <span>Begin</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
