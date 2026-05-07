"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Apple,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Dumbbell,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export type SessionTypeOption =
  | "quick_checkin"
  | "coaching_session"
  | "emergency_support"
  | "goal_review"
  | "health_coach"
  | "nutrition"
  | "fitness"
  | "wellness";

interface SessionTypeSelectorProps {
  selectedType?: SessionTypeOption;
  onSelect: (type: SessionTypeOption) => void;
  aiSuggestion?: {
    sessionType: SessionTypeOption;
    confidence: number;
    reasoning: string;
    estimatedDuration: number;
  };
  showEmergency?: boolean;
}

type SessionTone = "recommended" | "specialist" | "urgent";

interface SessionTypeConfig {
  type: SessionTypeOption;
  label: string;
  shortLabel: string;
  description: string;
  duration: string;
  durationMinutes: number;
  icon: typeof Clock;
  tone: SessionTone;
  accent: string;
  border: string;
  background: string;
  text: string;
  plan: string;
  outcome: string;
  signals: string[];
}

const SESSION_TYPES: SessionTypeConfig[] = [
  {
    type: "quick_checkin",
    label: "Quick Check-In",
    shortLabel: "Check-in",
    description: "Fast emotional scan, next best action, and a simple reset.",
    duration: "2.5 min",
    durationMinutes: 2.5,
    icon: Zap,
    tone: "recommended",
    accent: "#22d3ee",
    border: "border-cyan-300/45",
    background: "from-cyan-400/18 via-sky-400/8 to-transparent",
    text: "text-cyan-100",
    plan: "Mood pulse",
    outcome: "One clear next step",
    signals: ["Mood", "Stress", "Energy"],
  },
  {
    type: "coaching_session",
    label: "Deep Coaching Session",
    shortLabel: "Deep dive",
    description: "Structured coaching with context, reflection, and action planning.",
    duration: "10 min",
    durationMinutes: 10,
    icon: Sparkles,
    tone: "recommended",
    accent: "#a78bfa",
    border: "border-violet-300/45",
    background: "from-violet-400/18 via-fuchsia-400/8 to-transparent",
    text: "text-violet-100",
    plan: "Guided strategy",
    outcome: "Action plan",
    signals: ["Goals", "Habits", "Patterns"],
  },
  {
    type: "goal_review",
    label: "Goal Review",
    shortLabel: "Goals",
    description: "Review progress, blockers, priorities, and your next milestone.",
    duration: "10 min",
    durationMinutes: 10,
    icon: Target,
    tone: "recommended",
    accent: "#34d399",
    border: "border-emerald-300/45",
    background: "from-emerald-400/18 via-teal-400/8 to-transparent",
    text: "text-emerald-100",
    plan: "Progress audit",
    outcome: "Sharper milestone",
    signals: ["Progress", "Blockers", "Focus"],
  },
  {
    type: "health_coach",
    label: "Health Coach",
    shortLabel: "Health",
    description: "Whole-body coaching across sleep, recovery, activity, and wellbeing.",
    duration: "20 min",
    durationMinutes: 20,
    icon: HeartPulse,
    tone: "specialist",
    accent: "#2dd4bf",
    border: "border-teal-300/40",
    background: "from-teal-400/16 via-emerald-400/7 to-transparent",
    text: "text-teal-100",
    plan: "Health review",
    outcome: "Balanced protocol",
    signals: ["Sleep", "Recovery", "Activity"],
  },
  {
    type: "nutrition",
    label: "Nutrition Coach",
    shortLabel: "Nutrition",
    description: "Meal rhythm, cravings, hydration, protein, and practical food choices.",
    duration: "15 min",
    durationMinutes: 15,
    icon: Apple,
    tone: "specialist",
    accent: "#fbbf24",
    border: "border-amber-300/40",
    background: "from-amber-300/16 via-lime-300/7 to-transparent",
    text: "text-amber-100",
    plan: "Food strategy",
    outcome: "Meal direction",
    signals: ["Meals", "Hydration", "Cravings"],
  },
  {
    type: "fitness",
    label: "Fitness Coach",
    shortLabel: "Fitness",
    description: "Training guidance, consistency blocks, recovery, and workout focus.",
    duration: "20 min",
    durationMinutes: 20,
    icon: Dumbbell,
    tone: "specialist",
    accent: "#fb7185",
    border: "border-rose-300/40",
    background: "from-rose-400/16 via-orange-300/7 to-transparent",
    text: "text-rose-100",
    plan: "Training plan",
    outcome: "Workout focus",
    signals: ["Strength", "Cardio", "Recovery"],
  },
  {
    type: "wellness",
    label: "Wellness Reset",
    shortLabel: "Wellness",
    description: "Stress, mindfulness, motivation, emotional balance, and calm routines.",
    duration: "15 min",
    durationMinutes: 15,
    icon: Brain,
    tone: "specialist",
    accent: "#c084fc",
    border: "border-purple-300/40",
    background: "from-purple-400/16 via-indigo-300/7 to-transparent",
    text: "text-purple-100",
    plan: "Nervous-system reset",
    outcome: "Calmer rhythm",
    signals: ["Stress", "Mood", "Mindfulness"],
  },
  {
    type: "emergency_support",
    label: "Emergency Support",
    shortLabel: "Emergency",
    description: "Immediate support flow with crisis-safe pacing and resources.",
    duration: "15 min",
    durationMinutes: 15,
    icon: AlertCircle,
    tone: "urgent",
    accent: "#f43f5e",
    border: "border-rose-400/70",
    background: "from-rose-500/18 via-red-500/8 to-transparent",
    text: "text-rose-100",
    plan: "Safety first",
    outcome: "Stabilize and connect",
    signals: ["Safety", "Support", "Resources"],
  },
];

const TONE_LABELS: Record<SessionTone, string> = {
  recommended: "Core coaching",
  specialist: "Specialist modes",
  urgent: "Safety",
};

function getSession(type?: SessionTypeOption): SessionTypeConfig {
  return SESSION_TYPES.find((session) => session.type === type) ?? SESSION_TYPES[1];
}

function formatDuration(minutes: number): string {
  return minutes < 10 ? `${minutes} min` : `${Math.round(minutes)} min`;
}

export function SessionTypeSelector({
  selectedType,
  onSelect,
  aiSuggestion,
  showEmergency = true,
}: SessionTypeSelectorProps) {
  const sessionTypes = showEmergency
    ? SESSION_TYPES
    : SESSION_TYPES.filter((session) => session.type !== "emergency_support");
  const selectedSession = getSession(selectedType);
  const recommendedSession = aiSuggestion
    ? getSession(aiSuggestion.sessionType)
    : SESSION_TYPES[1];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Modes", value: sessionTypes.length.toString(), icon: Activity },
            { label: "Depth", value: selectedSession.duration, icon: Clock },
            { label: "Output", value: "Plan", icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <div className="text-sm font-semibold text-white">{item.value}</div>
              </div>
            );
          })}
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect(recommendedSession.type)}
          className={`group relative w-full overflow-hidden rounded-lg border ${recommendedSession.border} bg-gradient-to-br ${recommendedSession.background} p-4 text-left shadow-[0_24px_80px_rgba(0,0,0,0.28)]`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20"
                style={{ color: recommendedSession.accent }}
              >
                <recommendedSession.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                    Recommended
                  </span>
                  {aiSuggestion && (
                    <span className="text-xs font-medium text-white/55">
                      {Math.round(aiSuggestion.confidence * 100)}% match
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">{recommendedSession.label}</h3>
                <p className="mt-1 max-w-xl text-sm leading-5 text-white/65">
                  {aiSuggestion?.reasoning || recommendedSession.description}
                </p>
              </div>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-white/80" />
          </div>
        </motion.button>

        <div className="grid gap-3 sm:grid-cols-2">
          {sessionTypes.map((session, index) => {
            const Icon = session.icon;
            const isSelected = selectedType === session.type;
            const isEmergency = session.type === "emergency_support";

            return (
              <motion.button
                type="button"
                key={session.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onSelect(session.type)}
                className={`group relative min-h-[132px] overflow-hidden rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? `${session.border} bg-gradient-to-br ${session.background} shadow-[0_18px_60px_rgba(0,0,0,0.32)]`
                    : "border-white/10 bg-white/[0.035] hover:border-white/22 hover:bg-white/[0.06]"
                } ${isEmergency ? "ring-1 ring-rose-400/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      isSelected ? "border-white/18 bg-black/20" : "border-white/10 bg-white/[0.04]"
                    }`}
                    style={{ color: session.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/55">
                    <Clock className="h-3.5 w-3.5" />
                    {session.duration}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    {TONE_LABELS[session.tone]}
                  </div>
                  <h3 className="text-base font-semibold leading-5 text-white">{session.label}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/58">
                    {session.description}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {session.signals.slice(0, 2).map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-white/10 bg-black/15 px-2 py-0.5 text-[11px] font-medium text-white/50"
                    >
                      {signal}
                    </span>
                  ))}
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute bottom-3 right-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-lg border border-white/10 bg-black/18 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Session intelligence
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">{selectedSession.label}</h3>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]"
            style={{ color: selectedSession.accent }}
          >
            <selectedSession.icon className="h-6 w-6" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 py-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <p className="text-xs text-white/45">Duration</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {formatDuration(selectedSession.durationMinutes)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <p className="text-xs text-white/45">Mode</p>
            <p className="mt-1 text-lg font-semibold text-white">{selectedSession.shortLabel}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4" style={{ color: selectedSession.accent }} />
              Coaching plan
            </div>
            <p className="text-sm leading-5 text-white/62">{selectedSession.plan}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Target className="h-4 w-4" style={{ color: selectedSession.accent }} />
              Expected outcome
            </div>
            <p className="text-sm leading-5 text-white/62">{selectedSession.outcome}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
            Signals used
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSession.signals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/62"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect(selectedSession.type)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          style={{
            background: `linear-gradient(135deg, ${selectedSession.accent}33, rgba(255,255,255,0.06))`,
          }}
        >
          Start {selectedSession.shortLabel}
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </aside>
    </div>
  );
}

// Export duration mapping for auto-close functionality
export const SESSION_DURATIONS: Record<SessionTypeOption, number> = {
  quick_checkin: 2.5,
  coaching_session: 10,
  goal_review: 10,
  emergency_support: 15,
  health_coach: 20,
  nutrition: 15,
  fitness: 20,
  wellness: 15,
};
