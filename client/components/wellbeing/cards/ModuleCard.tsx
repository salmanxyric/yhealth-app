"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTilt } from "@/hooks/use-tilt";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: string; // e.g., "Logged 3h ago"
  trend: "up" | "down" | "stable";
  actionLabel: string;
  gradient?: string; // Tailwind gradient classes
  className?: string;
}

export function ModuleCard({
  title,
  description,
  icon: Icon,
  href,
  status,
  trend,
  actionLabel,
  gradient = "from-emerald-500 to-teal-600",
  className,
}: ModuleCardProps) {
  const prefersReducedMotion = useReducedMotionSafe();
  const { rotateX, rotateY, ref } = useTilt({
    maxTilt: prefersReducedMotion ? 0 : 4,
    stiffness: 200,
    damping: 25,
  });

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-700/50",
        "bg-gradient-to-br from-slate-800/95 via-slate-800/80 to-slate-900/95",
        "backdrop-blur-2xl p-6 transition-all duration-500",
        "hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/20",
        "h-full w-full flex flex-col",
        className
      )}
      whileHover={prefersReducedMotion ? {} : { scale: 1.03, y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Animated gradient background */}
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700",
          gradient
        )}
        style={{ opacity: 0.15 }}
        animate={{
          background: [
            `linear-gradient(135deg, var(--tw-gradient-stops))`,
            `linear-gradient(225deg, var(--tw-gradient-stops))`,
            `linear-gradient(135deg, var(--tw-gradient-stops))`,
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3))`,
          filter: "blur(20px)",
          zIndex: -1,
        }}
        animate={{
          opacity: [0, 0.4, 0.2],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)",
        }}
      />

      {/* Subtle grain texture */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header with enhanced icon */}
        <div className="mb-5 flex items-start justify-between flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.15, rotate: [0, -10, 10, -10, 0] }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn(
              "relative p-4 rounded-xl bg-gradient-to-br shadow-2xl transition-all duration-500 group-hover:shadow-3xl",
              gradient
            )}
          >
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Icon className="relative h-7 w-7 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0.5 }}
            whileHover={{ opacity: 1, scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {getTrendIcon()}
          </motion.div>
        </div>

        {/* Content - flex-grow to fill available space */}
        <div className="mb-5 flex-grow flex flex-col">
          <motion.h3
            whileHover={{ x: 2 }}
            className="mb-2 text-xl font-bold text-white group-hover:text-emerald-100 transition-colors duration-300"
          >
            {title}
          </motion.h3>
          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300 leading-relaxed flex-grow">
            {description}
          </p>
        </div>

        {/* Status and Action - flex-shrink-0 to stay at bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 flex-shrink-0 mt-auto">
          <span className="text-xs font-medium text-slate-500">{status}</span>
          <Link href={href}>
            <Button
              variant="ghost"
              size="sm"
              className="group/btn relative overflow-hidden bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 hover:border-emerald-500/50 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2 font-semibold">
                {actionLabel}
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </motion.div>
              </span>
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
