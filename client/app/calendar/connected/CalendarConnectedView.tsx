"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const REDIRECT_MS = 4500;
const SCHEDULE_PATH = "/wellbeing/schedule";

export default function CalendarConnectedView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const status = (searchParams?.get("status") || "connected") as "connected" | "error";
  const reason = searchParams?.get("reason") || null;

  const isSuccess = status === "connected";
  const [countdown, setCountdown] = useState(Math.ceil(REDIRECT_MS / 1000));
  const [viewportH, setViewportH] = useState(900); // SSR-safe default; updated on mount
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setViewportH(window.innerHeight || 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-forward to schedule on success.
  useEffect(() => {
    if (!isSuccess) return;
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const redirect = setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      router.replace(SCHEDULE_PATH);
    }, REDIRECT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(redirect);
    };
  }, [isSuccess, router]);

  const [particles, setParticles] = useState<
    Array<{ id: number; left: number; delay: number; duration: number; size: number; hue: string }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 5 + Math.random() * 4,
        size: 2 + Math.random() * 3.5,
        hue: Math.random() > 0.5 ? "#00d0b5" : "#2d9cdb",
      })),
    );
  }, []);

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "100vh", width: "100%", background: "#02000f", color: "#ffffff" }}
    >
      {/* Layered radial glow backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "-180px",
            width: "880px",
            height: "880px",
            transform: "translateX(-50%)",
            background: isSuccess ? "#5ad9f6" : "#f87171",
            filter: "blur(165px)",
            opacity: 0.18,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "60%",
            width: "520px",
            height: "520px",
            transform: "translate(-50%, -50%)",
            background: isSuccess ? "#0099b9" : "#991b1b",
            filter: "blur(90px)",
            opacity: 0.55,
          }}
        />
      </div>

      {/* Ambient floating particles */}
      {!reduceMotion && isSuccess && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.left}%`,
                bottom: "-20px",
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.hue,
                boxShadow: `0 0 8px ${p.hue}80`,
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 0.9, 0],
                y: -(viewportH + 100),
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center"
        style={{
          maxWidth: "560px",
          padding: "48px 40px 40px",
          borderRadius: "32px",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.55), 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px rgba(0,208,181,0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <SuccessContent key="ok" countdown={countdown} onSkip={() => router.replace(SCHEDULE_PATH)} />
          ) : (
            <ErrorContent key="err" reason={reason} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SuccessContent({
  countdown,
  onSkip,
}: {
  countdown: number;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      {/* Orbital ring + icon */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: "148px", height: "148px", marginBottom: "28px" }}
      >
        {/* Rotating rings */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(0,208,181,0.35)",
            boxShadow: "0 0 40px rgba(0,208,181,0.2) inset",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: "14px",
            border: "1px dashed rgba(45,156,219,0.4)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        {/* Pulsing halo */}
        <motion.span
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: "8px",
            background: "radial-gradient(circle, rgba(0,208,181,0.35) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Center capsule */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: "spring", damping: 12, stiffness: 220 }}
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: "96px",
            height: "96px",
            background:
              "linear-gradient(135deg, #00d0b5 0%, #1fb3cc 55%, #2d9cdb 100%)",
            boxShadow: "0 10px 40px rgba(0,208,181,0.45), 0 0 0 6px rgba(0,208,181,0.08)",
          }}
        >
          <CalendarIcon style={{ width: "42px", height: "42px", color: "#ffffff" }} strokeWidth={1.8} />
          <motion.span
            aria-hidden
            className="absolute"
            style={{ right: "-4px", bottom: "-4px" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 240, damping: 14 }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: "36px",
                height: "36px",
                background: "#10b981",
                boxShadow: "0 6px 20px rgba(16,185,129,0.55)",
                border: "3px solid #02000f",
              }}
            >
              <CheckCircle2 style={{ width: "20px", height: "20px", color: "#ffffff" }} strokeWidth={2.4} />
            </div>
          </motion.span>
        </motion.div>
      </div>

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="inline-flex items-center gap-1.5 rounded-full"
        style={{
          padding: "5px 12px",
          marginBottom: "14px",
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.28)",
        }}
      >
        <Sparkles style={{ width: "12px", height: "12px", color: "#10b981" }} strokeWidth={2.2} />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "#10b981",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Connected
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "32px",
          lineHeight: "40px",
          fontWeight: 700,
          letterSpacing: "-0.8px",
          margin: 0,
          marginBottom: "10px",
          background:
            "linear-gradient(135deg, #ffffff 0%, #d1d5dc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Google Calendar is synced
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "15px",
          lineHeight: "24px",
          color: "#94a3b8",
          margin: 0,
          marginBottom: "28px",
          maxWidth: "420px",
        }}
      >
        Your upcoming events will now inform scheduling, stress detection, and
        your AI coach&apos;s recommendations. We&apos;re taking you to your
        schedule.
      </motion.p>

      {/* CTA + countdown */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-4"
      >
        <button
          type="button"
          onClick={onSkip}
          className="relative inline-flex items-center gap-2 rounded-full transition-transform active:scale-[0.98]"
          style={{
            padding: "12px 22px",
            background:
              "linear-gradient(90deg, #00d0b5 0%, #1fb3cc 50%, #2d9cdb 100%)",
            color: "#02000f",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.2px",
            boxShadow: "0 10px 30px rgba(0,208,181,0.35)",
          }}
        >
          <span>Go to Schedule</span>
          <ArrowRight style={{ width: "16px", height: "16px" }} strokeWidth={2.4} />
        </button>

        <div
          className="flex items-center gap-2"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#64748b" }}
        >
          <RedirectRing seconds={countdown} />
          <span>Redirecting in {countdown}s</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RedirectRing({ seconds }: { seconds: number }) {
  const total = Math.ceil(REDIRECT_MS / 1000);
  const progress = Math.max(0, Math.min(1, 1 - seconds / total));
  const size = 22;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#00d0b5"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        transition={{ duration: 1, ease: "linear" }}
      />
    </svg>
  );
}

function ErrorContent({ reason }: { reason: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 220 }}
        className="flex items-center justify-center rounded-full"
        style={{
          width: "96px",
          height: "96px",
          marginBottom: "24px",
          background: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
          boxShadow: "0 10px 40px rgba(220,38,38,0.45)",
        }}
      >
        <AlertTriangle style={{ width: "42px", height: "42px", color: "#ffffff" }} strokeWidth={1.8} />
      </motion.div>

      <h1
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "28px",
          lineHeight: "36px",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          margin: 0,
          marginBottom: "8px",
        }}
      >
        We couldn&apos;t finish connecting
      </h1>
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#94a3b8",
          margin: 0,
          marginBottom: "20px",
          maxWidth: "420px",
        }}
      >
        {reason
          ? reason
          : "Google didn't complete the handoff. Head back to Settings and try again — double-check the Redirect URI matches Google Cloud Console."}
      </p>

      <div className="flex items-center gap-3">
        <a
          href="/settings"
          className="rounded-full"
          style={{
            padding: "10px 20px",
            background: "#ffffff",
            color: "#02000f",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back to Settings
        </a>
        <a
          href="/wellbeing/schedule"
          className="rounded-full"
          style={{
            padding: "10px 20px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#d1d5dc",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Skip to Schedule
        </a>
      </div>
    </motion.div>
  );
}
