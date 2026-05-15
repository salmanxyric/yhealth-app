"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { RefreshCw, Home, Activity, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
const getOnlineSnapshot = () => window.navigator.onLine;
const getOnlineServerSnapshot = () => true;

function DisconnectedWaves() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 160 + i * 120,
            height: 160 + i * 120,
            borderColor: `rgba(244, 114, 182, ${0.12 - i * 0.025})`,
            borderStyle: i % 2 === 0 ? "solid" : "dashed",
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 4 + i,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function FloatingNodes() {
  const nodes = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        x: ((i * 73 + 11) % 100),
        y: ((i * 41 + 19) % 100),
        size: 3 + (i % 3) * 2,
        delay: (i % 7) * 0.5,
        duration: 5 + (i % 4) * 2,
      })),
    []
  );

  return (
    <>
      {nodes.map((n) => (
        <motion.div
          key={n.id}
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: n.size,
            height: n.size,
            left: `${n.x}%`,
            top: `${n.y}%`,
            background:
              n.id % 3 === 0
                ? "rgba(244, 114, 182, 0.5)"
                : n.id % 3 === 1
                ? "rgba(251, 146, 60, 0.4)"
                : "rgba(14, 165, 233, 0.3)",
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0, 0.7, 0],
            scale: [0.4, 1.1, 0.4],
          }}
          transition={{
            duration: n.duration,
            delay: n.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

export default function OfflinePage() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060a0f]">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(244, 114, 182, 0.04) 0%, transparent 70%)",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 25% 30%, rgba(244, 114, 182, 0.06) 0%, transparent 55%)",
              "radial-gradient(circle at 75% 70%, rgba(251, 146, 60, 0.05) 0%, transparent 55%)",
              "radial-gradient(circle at 25% 30%, rgba(244, 114, 182, 0.06) 0%, transparent 55%)",
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

        <FloatingNodes />
        <DisconnectedWaves />
      </div>

      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        className="absolute top-1/3 left-[15%] w-72 h-72 rounded-full blur-[100px]"
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "rgba(244, 114, 182, 0.3)" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-1/4 right-[15%] w-96 h-96 rounded-full blur-[120px]"
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ background: "rgba(251, 146, 60, 0.2)" }}
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
              style={{ background: "linear-gradient(135deg, rgba(244, 114, 182, 0.12), rgba(251, 146, 60, 0.08))" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -inset-8 rounded-3xl blur-2xl"
              style={{ background: "linear-gradient(180deg, rgba(244, 114, 182, 0.15), rgba(251, 146, 60, 0.08))" }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <div className="relative rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm p-6 shadow-[0_0_60px_rgba(244,114,182,0.08),0_0_120px_rgba(251,146,60,0.04)]">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/offline.png"
                  width={480}
                  height={200}
                  alt="No internet connection illustration"
                  priority
                  className="relative mx-auto drop-shadow-[0_0_30px_rgba(244,114,182,0.15)]"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-5"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? "bg-emerald-400 animate-ping" : "bg-rose-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
            </span>
            <span className="text-xs font-medium text-slate-300 tracking-wide">
              {isOnline ? "Connection restored" : "You are currently offline"}
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
          {isOnline ? "You’re back online" : "No internet connection"}
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.8, ease: "easeOut" }}
          className="h-px w-40 mx-auto mb-6 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent"
        />

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed"
        >
          {isOnline
            ? "We detected your connection is back. Tap retry to pick up where you left off."
            : "Check your Wi-Fi, mobile data, or VPN. Some cached content may still be available."}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-sky-500 hover:from-emerald-500 hover:to-sky-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] px-8 rounded-xl disabled:opacity-70"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Reconnecting…" : "Retry connection"}
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

        {/* Diagnostic cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-12 grid grid-cols-3 gap-3 max-w-md mx-auto"
        >
          <DiagCard
            icon={<Activity className="w-4 h-4" />}
            label="Network"
            value={isOnline ? "Online" : "Offline"}
            ok={isOnline}
          />
          <DiagCard
            icon={<ServerCrash className="w-4 h-4" />}
            label="API"
            value={isOnline ? "Reachable" : "Unreachable"}
            ok={isOnline}
          />
          <DiagCard
            icon={<RefreshCw className="w-4 h-4" />}
            label="Auto retry"
            value="Enabled"
            ok={true}
          />
        </motion.div>
      </div>
    </div>
  );
}

function DiagCard({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 backdrop-blur-sm">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          ok
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-rose-500/10 text-rose-400"
        }`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p
          className={`text-xs font-medium truncate ${
            ok ? "text-slate-200" : "text-rose-300"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
