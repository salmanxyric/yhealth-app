"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  onBack?: () => void;
  backText?: string;
  variant?: "dark" | "light";
  fullScreen?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

function Particles({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        x: ((i * 67 + 13) % 100),
        y: ((i * 43 + 7) % 100),
        size: 2 + (i % 3),
        delay: (i % 6) * 0.7,
        duration: 5 + (i % 4) * 2,
      })),
    []
  );

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: color,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

const variantStyles = {
  dark: {
    bg: "bg-[#060a0f]",
    iconBg: "bg-red-500/[0.08] border border-red-500/[0.15]",
    iconColor: "text-red-400",
    title: "text-white font-[family-name:var(--font-poppins)]",
    message: "text-slate-400",
    button:
      "bg-linear-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:shadow-[0_0_40px_rgba(239,68,68,0.25)] rounded-xl",
    buttonSecondary:
      "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] backdrop-blur-sm rounded-xl",
    particleColor: "rgba(239, 68, 68, 0.3)",
    orbColor: "rgba(239, 68, 68, 0.25)",
    glowColor: "rgba(239, 68, 68, 0.06)",
    lineColor: "via-red-500/30",
  },
  light: {
    bg: "bg-white",
    iconBg: "bg-red-50 border border-red-200/50",
    iconColor: "text-red-500",
    title: "text-slate-900",
    message: "text-slate-500",
    button:
      "bg-slate-900 text-white hover:bg-slate-800 rounded-xl",
    buttonSecondary:
      "bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl",
    particleColor: "rgba(239, 68, 68, 0.15)",
    orbColor: "rgba(239, 68, 68, 0.08)",
    glowColor: "rgba(239, 68, 68, 0.03)",
    lineColor: "via-red-300/40",
  },
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryText = "Try Again",
  onBack,
  backText = "Go Back",
  variant = "dark",
  fullScreen = true,
  icon,
  className,
}: ErrorStateProps) {
  const s = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center px-4 overflow-hidden",
        fullScreen && "min-h-screen",
        s.bg,
        className
      )}
    >
      {/* Background layers */}
      <div className="absolute inset-0" aria-hidden>
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              `radial-gradient(circle at 30% 35%, ${s.orbColor} 0%, transparent 50%)`,
              `radial-gradient(circle at 70% 65%, ${s.orbColor} 0%, transparent 50%)`,
              `radial-gradient(circle at 30% 35%, ${s.orbColor} 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {variant === "dark" && (
          <>
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />
          </>
        )}

        <Particles color={s.particleColor} />

        {/* Pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 180 + i * 120,
                height: 180 + i * 120,
                border: `1px solid ${s.orbColor}`,
              }}
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.15, 0.04, 0.15],
              }}
              transition={{
                duration: 4,
                delay: i * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/4 left-[15%] w-64 h-64 rounded-full blur-[100px]"
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: s.orbColor }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-[15%] w-80 h-80 rounded-full blur-[120px]"
        animate={{ opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ background: s.orbColor }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.35 }}
          className="mb-6"
        >
          <div className="relative inline-block">
            <motion.div
              aria-hidden
              className="absolute -inset-6 rounded-full blur-2xl"
              style={{ background: s.glowColor }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className={cn(
                "relative w-20 h-20 mx-auto rounded-2xl flex items-center justify-center backdrop-blur-sm",
                s.iconBg
              )}
            >
              {icon || (
                <AlertCircle className={cn("w-9 h-9", s.iconColor)} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className={cn("text-2xl font-bold mb-2 tracking-tight", s.title)}
        >
          {title}
        </motion.h1>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.25, duration: 0.7, ease: "easeOut" }}
          className={cn(
            "h-px w-28 mx-auto mb-5 bg-linear-to-r from-transparent to-transparent",
            s.lineColor
          )}
        />

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={cn("mb-8 leading-relaxed", s.message)}
        >
          {message}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 font-medium transition-all duration-300",
                s.buttonSecondary
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {backText}
            </Button>
          )}

          {onRetry && (
            <Button
              onClick={onRetry}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]",
                s.button
              )}
            >
              <RefreshCw className="w-4 h-4" />
              {retryText}
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ErrorState;
