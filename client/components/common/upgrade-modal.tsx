"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  Zap,
  X,
  ArrowRight,
  MessageSquare,
  Brain,
  Mic,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";

export type UpgradeReason = "feature_disabled" | "credits_exhausted" | "limit_reached";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: UpgradeReason;
  featureName?: string;
}

const REASON_CONFIG: Record<
  UpgradeReason,
  {
    title: string;
    subtitle: string;
    icon: typeof Crown;
    accentHsl: string;
    cta: string;
  }
> = {
  credits_exhausted: {
    title: "Your Tokens Have Run Out",
    subtitle: "You explored brilliantly. Upgrade to keep the momentum going.",
    icon: Zap,
    accentHsl: "36 80% 55%",
    cta: "Upgrade Now",
  },
  feature_disabled: {
    title: "Unlock This Experience",
    subtitle: "This capability lives in Pro. Upgrade to unlock SIA’s full intelligence.",
    icon: Crown,
    accentHsl: "30 40% 64%",
    cta: "View Plans",
  },
  limit_reached: {
    title: "You’ve Reached Today’s Limit",
    subtitle: "Upgrade for unlimited access to everything SIA can do.",
    icon: Sparkles,
    accentHsl: "200 70% 55%",
    cta: "Upgrade Now",
  },
};

const PRO_FEATURES = [
  { icon: MessageSquare, label: "Unlimited coaching conversations", desc: "No daily caps" },
  { icon: Brain, label: "Deep analytics & insights", desc: "Cross-domain intelligence" },
  { icon: Mic, label: "Voice sessions with SIA", desc: "Real-time coaching calls" },
  { icon: BarChart3, label: "Personalized action plans", desc: "Workout, nutrition & more" },
];

function OrbitalRing({ size, duration, delay, accent }: { size: number; duration: number; delay: number; accent: string }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
        border: `1px solid hsl(${accent} / 0.12)`,
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, rotate: 360 }}
      transition={{
        opacity: { delay, duration: 0.6 },
        scale: { delay, duration: 0.8, type: "spring", damping: 20 },
        rotate: { delay, duration, repeat: Infinity, ease: "linear" },
      }}
    >
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: `hsl(${accent})`,
          boxShadow: `0 0 8px 2px hsl(${accent} / 0.5)`,
          top: -3,
          left: "50%",
          marginLeft: -3,
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <span className="tabular-nums font-medium text-[hsl(30,40%,64%)]">
      {value}{suffix}
    </span>
  );
}

function PulseBeacon({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-0 rounded-full pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid hsl(${accent} / 0.3)` }}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  featureName,
}: UpgradeModalProps) {
  const router = useRouter();
  const config = REASON_CONFIG[reason];
  const Icon = config.icon;
  const accent = config.accentHsl;

  const handleUpgrade = () => {
    onClose();
    router.push("/subscription");
  };

  const spring = { type: "spring" as const, damping: 28, stiffness: 260 };
  const softSpring = { type: "spring" as const, damping: 30, stiffness: 200 };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — deep blur with grain */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px) saturate(0.8)" }}
          />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={spring}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-[380px] pointer-events-auto overflow-hidden"
              style={{
                background: "linear-gradient(170deg, #141416 0%, #0A0A0B 40%, #0D0B09 100%)",
                borderRadius: 20,
                border: `1px solid hsl(${accent} / 0.1)`,
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.03),
                  0 24px 80px -12px rgba(0,0,0,0.7),
                  0 0 120px -40px hsl(${accent} / 0.15)
                `,
              }}
            >
              {/* Top accent line */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: `linear-gradient(90deg, transparent 10%, hsl(${accent} / 0.5) 50%, transparent 90%)`,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Ambient warm glow — top right */}
              <div
                className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: `radial-gradient(circle, hsl(${accent} / 0.08) 0%, transparent 70%)` }}
              />

              {/* Close */}
              <motion.button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}
                whileHover={{ background: "rgba(255,255,255,0.08)", scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" style={{ color: "rgba(245,245,247,0.35)" }} />
              </motion.button>

              {/* Content */}
              <div className="relative px-7 pt-8 pb-6">

                {/* === Orbital icon system === */}
                <div className="relative mx-auto mb-6 w-[100px] h-[100px]">
                  <OrbitalRing size={100} duration={20} delay={0.1} accent={accent} />
                  <OrbitalRing size={74} duration={14} delay={0.25} accent={accent} />

                  <PulseBeacon accent={accent} />

                  {/* Core icon */}
                  <motion.div
                    className="absolute flex items-center justify-center"
                    style={{
                      width: 52,
                      height: 52,
                      top: "50%",
                      left: "50%",
                      marginTop: -26,
                      marginLeft: -26,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, hsl(${accent} / 0.2) 0%, hsl(${accent} / 0.05) 100%)`,
                      border: `1px solid hsl(${accent} / 0.2)`,
                      boxShadow: `0 0 30px hsl(${accent} / 0.15), inset 0 1px 0 hsl(${accent} / 0.1)`,
                    }}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...softSpring, delay: 0.15 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Icon className="w-6 h-6" style={{ color: `hsl(${accent})` }} />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Feature badge */}
                {featureName && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-3"
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full"
                      style={{
                        color: `hsl(${accent})`,
                        background: `hsl(${accent} / 0.08)`,
                        border: `1px solid hsl(${accent} / 0.15)`,
                      }}
                    >
                      {featureName}
                    </span>
                  </motion.div>
                )}

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, ...softSpring }}
                  className="text-center mb-2"
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#F5F5F7",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {config.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="text-center mb-6"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "rgba(245,245,247,0.45)",
                  }}
                >
                  {config.subtitle}
                </motion.p>

                {/* === Feature cards === */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 }}
                  className="mb-6 space-y-2"
                >
                  {PRO_FEATURES.map((feat, i) => (
                    <motion.div
                      key={feat.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.07, ...softSpring }}
                      className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-default"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `hsl(${accent} / 0.08)`,
                          border: `1px solid hsl(${accent} / 0.1)`,
                        }}
                      >
                        <feat.icon className="w-4 h-4" style={{ color: `hsl(${accent} / 0.8)` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: "rgba(245,245,247,0.85)" }}>
                          {feat.label}
                        </p>
                        <p className="text-[11px]" style={{ color: "rgba(245,245,247,0.3)" }}>
                          {feat.desc}
                        </p>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.08, type: "spring", damping: 15, stiffness: 300 }}
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `hsl(${accent} / 0.12)`,
                          border: `1px solid hsl(${accent} / 0.2)`,
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <motion.path
                            d="M2 5.5L4 7.5L8 3"
                            stroke={`hsl(${accent})`}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.6 + i * 0.08, duration: 0.4, ease: "easeOut" }}
                          />
                        </svg>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* === CTA Button === */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, ...softSpring }}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpgrade}
                  className="relative w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, hsl(${accent}) 0%, hsl(${accent} / 0.85) 100%)`,
                    color: "#0A0A0B",
                    boxShadow: `0 4px 24px hsl(${accent} / 0.25), 0 1px 3px hsl(${accent} / 0.3)`,
                  }}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ delay: 1.2, duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
                  />
                  <span className="relative z-10">{config.cta}</span>
                  <ArrowRight className="w-4 h-4 relative z-10" />
                </motion.button>

                {/* Dismiss */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="w-full mt-2.5 py-2 text-[12px] transition-colors text-center"
                  style={{ color: "rgba(245,245,247,0.2)" }}
                >
                  Maybe later
                </motion.button>

                {/* Price anchor */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="text-center mt-1.5"
                  style={{ fontSize: 11, color: "rgba(245,245,247,0.18)" }}
                >
                  From <AnimatedCounter value="$9.99" suffix="/mo" /> &middot; Cancel anytime
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
