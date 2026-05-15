"use client";

import { Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function safeCallbackUrl(from: string | null): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return "/dashboard";
}

function ShieldParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: ((i * 61 + 23) % 100),
        y: ((i * 47 + 13) % 100),
        size: 2 + (i % 3),
        delay: (i % 8) * 0.6,
        duration: 6 + (i % 5) * 1.5,
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
            background:
              p.id % 3 === 0
                ? "rgba(59, 130, 246, 0.4)"
                : p.id % 3 === 1
                ? "rgba(16, 185, 129, 0.3)"
                : "rgba(0, 188, 212, 0.25)",
          }}
          animate={{
            y: [0, -22, 0],
            opacity: [0, 0.8, 0],
            scale: [0.4, 1.1, 0.4],
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

function LockRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 220 + i * 150,
            height: 220 + i * 150,
            borderColor: `rgba(59, 130, 246, ${0.08 - i * 0.02})`,
          }}
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.2, 0.08, 0.2],
            rotate: i % 2 === 0 ? [0, 8, 0] : [0, -8, 0],
          }}
          transition={{
            duration: 5 + i * 2,
            delay: i * 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={null}>
      <UnauthorizedInner />
    </Suspense>
  );
}

function UnauthorizedInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const callbackUrl = safeCallbackUrl(fromParam);

  const signinHref = `/auth/signin?callbackUrl=${encodeURIComponent(
    callbackUrl
  )}`;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060a0f]">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59, 130, 246, 0.04) 0%, transparent 70%)",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.06) 0%, transparent 55%)",
              "radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 55%)",
              "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.06) 0%, transparent 55%)",
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

        <ShieldParticles />
        <LockRings />
      </div>

      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-[100px]"
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "rgba(59, 130, 246, 0.3)" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full blur-[120px]"
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ background: "rgba(16, 185, 129, 0.2)" }}
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
              style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.08))" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -inset-8 rounded-3xl blur-2xl"
              style={{ background: "linear-gradient(180deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.08))" }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm p-6 shadow-[0_0_60px_rgba(59,130,246,0.08),0_0_120px_rgba(16,185,129,0.04)]">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/unauth.png"
                  width={440}
                  height={280}
                  alt="Unauthorized access illustration"
                  priority
                  className="relative mx-auto drop-shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-5"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/[0.07] backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-medium text-sky-300/90 tracking-widest uppercase">
              Sign-in Required
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
          Please sign in to continue
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.8, ease: "easeOut" }}
          className="h-px w-40 mx-auto mb-6 bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"
        />

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-6 leading-relaxed"
        >
          {fromParam
            ? "This page is part of your private workspace. Sign in and we’ll take you right back."
            : "You need to be signed in to view this content. Sign in or create a new account to continue."}
        </motion.p>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mx-auto mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/[0.04] text-xs text-slate-500"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          End-to-end encrypted &middot; HIPAA-aligned data handling
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-sky-600 to-emerald-500 hover:from-sky-500 hover:to-emerald-400 text-white shadow-[0_0_30px_rgba(14,165,233,0.2)] hover:shadow-[0_0_40px_rgba(14,165,233,0.3)] font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] px-8 rounded-xl"
          >
            <Link href={signinHref}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign in
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] backdrop-blur-sm px-8 rounded-xl transition-all duration-300"
          >
            <Link href="/auth/signup">
              <UserPlus className="w-4 h-4 mr-2" />
              Create account
            </Link>
          </Button>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 hover:text-sky-400 transition-colors duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
          <span className="text-slate-800">|</span>
          <Link
            href="/auth/forgot-password"
            className="text-slate-500 hover:text-sky-400 transition-colors duration-300"
          >
            Forgot password?
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
