"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Home, Bug, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: ((i * 67 + 13) % 100),
        y: ((i * 43 + 7) % 100),
        size: 2 + (i % 4),
        delay: (i % 8) * 0.6,
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
            background: p.id % 3 === 0
              ? "rgba(239, 68, 68, 0.4)"
              : p.id % 3 === 1
              ? "rgba(251, 146, 60, 0.3)"
              : "rgba(14, 165, 233, 0.2)",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.8, 0],
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

function PulseRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-red-500/10"
          style={{
            width: 200 + i * 140,
            height: 200 + i * 140,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.05, 0.15],
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
  );
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060a0f]">
      {/* Layered background */}
      <div className="absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(239, 68, 68, 0.06) 0%, transparent 70%)",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 25% 35%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)",
              "radial-gradient(circle at 75% 65%, rgba(251, 146, 60, 0.06) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Noise texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <FloatingParticles />
        <PulseRings />
      </div>

      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/4 left-[15%] w-72 h-72 rounded-full blur-[100px]"
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "rgba(239, 68, 68, 0.3)" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-[15%] w-96 h-96 rounded-full blur-[120px]"
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ background: "rgba(251, 146, 60, 0.25)" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", duration: 1.2, bounce: 0.3 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              aria-hidden
              className="absolute -inset-20 rounded-full blur-[100px]"
              style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(251, 146, 60, 0.08))" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -inset-8 rounded-3xl blur-2xl"
              style={{ background: "linear-gradient(180deg, rgba(239, 68, 68, 0.15), rgba(251, 146, 60, 0.08))" }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm p-6 shadow-[0_0_60px_rgba(239,68,68,0.08),0_0_120px_rgba(251,146,60,0.04)]">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/error.png"
                  width={320}
                  height={320}
                  alt="Error illustration"
                  priority
                  className="relative mx-auto drop-shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Error badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-5"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-medium text-red-300/90 tracking-widest uppercase">
              Runtime Error
            </span>
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight font-[family-name:var(--font-poppins)]"
        >
          Something Went Wrong
        </motion.h1>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="h-px w-32 mx-auto mb-6 bg-gradient-to-r from-transparent via-red-500/40 to-transparent"
        />

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed"
        >
          We encountered an unexpected error. Don&apos;t worry, our team has
          been notified and is working on a fix.
        </motion.p>

        {/* Error details toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors duration-300"
          >
            <Bug className="w-3.5 h-3.5" />
            {showDetails ? "Hide" : "Show"} error details
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm text-left">
                  <p className="text-xs font-mono text-red-400/80 break-all leading-relaxed">
                    {error.message || "Unknown error"}
                  </p>
                  {error.digest && (
                    <p className="text-xs font-mono text-slate-600 mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] px-8 rounded-xl disabled:opacity-70"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Retrying..." : "Try Again"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] backdrop-blur-sm px-8 rounded-xl transition-all duration-300"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </motion.div>

        {/* Subtle footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-12 text-[11px] text-slate-600 tracking-wide"
        >
          If this persists, contact{" "}
          <a
            href="mailto:support@balencia.app"
            className="text-slate-500 hover:text-red-400 transition-colors underline underline-offset-2"
          >
            support@balencia.app
          </a>
        </motion.p>
      </div>
    </div>
  );
}
