"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  Zap,
  X,
  Check,
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
    gradient: string;
    bgGradient: string;
    border: string;
    cta: string;
  }
> = {
  credits_exhausted: {
    title: "You've Used All Your Tokens",
    subtitle:
      "You started with 100 free tokens to explore the full platform. Upgrade to keep the momentum going!",
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/30",
    cta: "Upgrade Now",
  },
  feature_disabled: {
    title: "Premium Feature",
    subtitle:
      "This feature requires an active subscription. Upgrade to unlock the full power of your AI health coach.",
    icon: Crown,
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-500/30",
    cta: "View Plans",
  },
  limit_reached: {
    title: "Daily Limit Reached",
    subtitle:
      "You've reached your daily usage limit. Upgrade for unlimited access to all features.",
    icon: Sparkles,
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-500/10 to-blue-500/10",
    border: "border-cyan-500/30",
    cta: "Upgrade Now",
  },
};

const PRO_FEATURES = [
  { icon: MessageSquare, label: "Unlimited AI coaching" },
  { icon: Brain, label: "Advanced analytics & insights" },
  { icon: Mic, label: "Voice AI assistant" },
  { icon: BarChart3, label: "Full workout & nutrition plans" },
];

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  featureName,
}: UpgradeModalProps) {
  const router = useRouter();
  const config = REASON_CONFIG[reason];
  const Icon = config.icon;

  const handleUpgrade = () => {
    onClose();
    router.push("/subscription");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className={`
                relative w-full max-w-md pointer-events-auto
                bg-slate-900/95 backdrop-blur-xl rounded-3xl
                border ${config.border} shadow-2xl overflow-hidden
              `}
            >
              {/* Gradient glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-40`}
              />

              {/* Animated orbs */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl`}
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.15, 0.3, 0.15],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className={`absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br ${config.gradient} rounded-full blur-3xl`}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              {/* Content */}
              <div className="relative p-8">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    delay: 0.1,
                    damping: 12,
                  }}
                  className="mx-auto mb-5 w-20 h-20 relative"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className={`absolute inset-0 rounded-full border-2 border-dashed ${config.border}`}
                  />
                  <div
                    className={`absolute inset-2 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl font-bold text-white text-center mb-2"
                >
                  {config.title}
                </motion.h2>

                {featureName && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-3"
                  >
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white/90`}
                    >
                      {featureName}
                    </span>
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-slate-400 text-center mb-6 leading-relaxed"
                >
                  {config.subtitle}
                </motion.p>

                {/* Pro features */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white/5 rounded-2xl p-4 mb-6 space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Pro includes
                  </p>
                  {PRO_FEATURES.map((feat, i) => (
                    <motion.div
                      key={feat.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}
                      >
                        <feat.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm text-slate-300">
                        {feat.label}
                      </span>
                      <Check className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA buttons */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgrade}
                    className={`
                      w-full py-3.5 rounded-xl font-semibold text-white text-sm
                      bg-gradient-to-r ${config.gradient}
                      shadow-lg hover:shadow-xl transition-shadow
                      flex items-center justify-center gap-2
                    `}
                  >
                    {config.cta}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    onClick={onClose}
                    className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Maybe later
                  </motion.button>
                </div>

                {/* Starting price */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-xs text-slate-500 mt-3"
                >
                  Starting at{" "}
                  <span className="text-slate-300 font-medium">$9.99/mo</span>{" "}
                  &middot; Cancel anytime
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
