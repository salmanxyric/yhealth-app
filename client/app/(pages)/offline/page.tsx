"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw, Home, Activity, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

// Subscribe to the browser's online/offline events. Returns `true` on the
// server (assume connectivity) and the live value on the client.
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

/**
 * Offline screen — shown when the user loses network connectivity.
 *
 * Behaviour:
 *  - Auto-detects when the browser comes back online (`navigator.onLine`).
 *  - Surfaces a retry button that re-runs the previous request via reload.
 *  - Animated severed-signal motif (broken concentric waves + drifting nodes).
 *
 * Route at `/offline`. Can also be wired into a service-worker fallback.
 */
export default function OfflinePage() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
  const [isRetrying, setIsRetrying] = useState(false);

  // Deterministic-on-mount positions for floating nodes — avoids hydration
  // mismatches and the react-hooks/purity lint rule.
  const nodes = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: 10 + ((i * 73) % 80),
        y: 15 + ((i * 41) % 70),
        delay: (i % 5) * 0.4,
        size: 4 + (i % 3) * 2,
      })),
    []
  );

  const handleRetry = () => {
    setIsRetrying(true);
    // Tiny delay so the spinner is visible even on instant reconnect.
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Animated background gradient */}
      <div className="absolute inset-0">
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 25% 30%, rgba(244, 114, 182, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 75% 70%, rgba(251, 146, 60, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 25% 30%, rgba(244, 114, 182, 0.10) 0%, transparent 55%)",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Drifting disconnected nodes */}
        {nodes.map((n) => (
          <motion.div
            key={n.id}
            aria-hidden
            className="absolute rounded-full bg-rose-500/40"
            style={{
              width: n.size,
              height: n.size,
              left: `${n.x}%`,
              top: `${n.y}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.6, 1.2, 0.6],
            }}
            transition={{
              duration: 4,
              delay: n.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Soft orbs */}
      <div
        aria-hidden
        className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-rose-500/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
        {/* Signal-loss icon with broken waves */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
          className="relative flex items-center justify-center mb-8 mx-auto h-40 w-40"
        >
          {/* Concentric broken signal waves */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute rounded-full border border-rose-500/30"
              style={{ width: 96 + i * 36, height: 96 + i * 36 }}
              animate={{
                opacity: [0, 0.5, 0],
                scale: [0.85, 1.05, 1.2],
                rotate: i % 2 === 0 ? [0, 12, 0] : [0, -12, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.6,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Icon */}
          <motion.div
            className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-sm"
            animate={{
              boxShadow: [
                "0 0 20px rgba(244, 63, 94, 0.10)",
                "0 0 40px rgba(244, 63, 94, 0.20)",
                "0 0 20px rgba(244, 63, 94, 0.10)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: [0, -4, 4, -2, 2, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
            >
              <WifiOff className="w-12 h-12 text-rose-400" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-sm mb-5"
        >
          <span
            className={`relative flex h-2 w-2 ${
              isOnline ? "" : ""
            }`}
            aria-hidden
          >
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-70 ${
                isOnline ? "bg-emerald-400 animate-ping" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isOnline ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
          <span className="text-xs font-medium text-slate-300">
            {isOnline ? "Connection restored" : "You are currently offline"}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight"
        >
          {isOnline ? "You\u2019re back online" : "No internet connection"}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed"
        >
          {isOnline
            ? "We detected your connection is back. Tap retry to pick up where you left off."
            : "Check your Wi-Fi, mobile data, or VPN. Some cached content may still be available."}
        </motion.p>

        {/* Action buttons */}
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
            className="bg-linear-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white shadow-lg shadow-emerald-500/20 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] px-8 disabled:opacity-70"
          >
            <RefreshCw
              className={`w-5 h-5 mr-2 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Reconnecting\u2026" : "Retry connection"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-600 backdrop-blur-sm px-8"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
        </motion.div>

        {/* Diagnostic strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto text-left"
        >
          <DiagItem
            icon={<Activity className="w-4 h-4" />}
            label="Network"
            value={isOnline ? "Online" : "Offline"}
            ok={isOnline}
          />
          <DiagItem
            icon={<ServerCrash className="w-4 h-4" />}
            label="API"
            value={isOnline ? "Reachable" : "Unreachable"}
            ok={isOnline}
          />
          <DiagItem
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

function DiagItem({
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
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2.5 backdrop-blur-sm">
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
