"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Home, ArrowLeft, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

function DriftingStars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: ((i * 59 + 17) % 100),
        y: ((i * 37 + 11) % 100),
        size: 1 + (i % 3),
        delay: (i % 10) * 0.5,
        duration: 6 + (i % 5) * 2,
      })),
    []
  );

  return (
    <>
      {stars.map((s) => (
        <motion.div
          key={s.id}
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            background:
              s.id % 4 === 0
                ? "rgba(16, 185, 129, 0.5)"
                : s.id % 4 === 1
                ? "rgba(14, 165, 233, 0.4)"
                : s.id % 4 === 2
                ? "rgba(0, 188, 212, 0.4)"
                : "rgba(255, 255, 255, 0.15)",
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.9, 0],
            scale: [0.3, 1, 0.3],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 240 + i * 160,
            height: 240 + i * 160,
            borderColor:
              i === 0
                ? "rgba(16, 185, 129, 0.08)"
                : i === 1
                ? "rgba(14, 165, 233, 0.06)"
                : "rgba(0, 188, 212, 0.04)",
          }}
          animate={{
            rotate: i % 2 === 0 ? [0, 360] : [360, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 40 + i * 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, delay: i * 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060a0f]">
      {/* Background layers */}
      <div className="absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16, 185, 129, 0.04) 0%, transparent 70%)",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 40%, rgba(16, 185, 129, 0.07) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 60%, rgba(14, 165, 233, 0.06) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 30%, rgba(0, 188, 212, 0.07) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 40%, rgba(16, 185, 129, 0.07) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Noise */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <DriftingStars />
        <OrbitRings />
      </div>

      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/3 left-[10%] w-80 h-80 rounded-full blur-[100px]"
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "rgba(16, 185, 129, 0.3)" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-[12%] w-96 h-96 rounded-full blur-[120px]"
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ background: "rgba(14, 165, 233, 0.25)" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
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
              style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.08))" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -inset-8 rounded-3xl blur-2xl"
              style={{ background: "linear-gradient(180deg, rgba(16, 185, 129, 0.15), rgba(14, 165, 233, 0.1))" }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm p-6 shadow-[0_0_60px_rgba(16,185,129,0.08),0_0_120px_rgba(14,165,233,0.04)]">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/404.png"
                  alt="Page not found illustration"
                  width={440}
                  height={280}
                  className="relative mx-auto drop-shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                  priority
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="h-px w-48 mx-auto mb-8 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
        />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mb-5"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] backdrop-blur-sm">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300/90 tracking-widest uppercase">
              Lost in space
            </span>
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight font-[family-name:var(--font-poppins)]"
        >
          Page Not Found
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed"
        >
          The page you&apos;re looking for seems to have wandered off on its own
          health journey. Let&apos;s get you back on track.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-sky-500 hover:from-emerald-500 hover:to-sky-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] px-8 rounded-xl"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] backdrop-blur-sm px-8 rounded-xl transition-all duration-300"
          >
            <Link href="/dashboard">
              <Compass className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
        >
          <Link
            href="/blogs"
            className="text-slate-500 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Browse Blogs
          </Link>
          <span className="text-slate-800">|</span>
          <button
            onClick={() => window.history.back()}
            className="text-slate-500 hover:text-emerald-400 transition-colors duration-300 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        </motion.div>
      </div>
    </div>
  );
}
