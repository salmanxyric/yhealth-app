'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Music,
  Moon,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Heart,
} from 'lucide-react';
import {
  dataSourceService,
  type DailyCorrelation,
  type DataSourceOverview,
  type DataSourceType,
} from '@/src/shared/services/data-source.service';

// ─── Score Ring ───────────────────────────────────────────

interface ScoreRingProps {
  label: string;
  score: number;
  colors: { stroke: string; bg: string; text: string };
  icon: React.ReactNode;
  delay: number;
}

function ScoreRing({ label, score, colors, icon, delay }: ScoreRingProps) {
  const size = 88;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.bg}
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay: delay + 0.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${colors.stroke}50)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${colors.text}`}>{Math.round(score)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
    </motion.div>
  );
}

// ─── Source Icon Map ──────────────────────────────────────

const SOURCE_META: Record<DataSourceType, { icon: typeof Calendar; label: string }> = {
  google_calendar: { icon: Calendar, label: 'Calendar' },
  spotify: { icon: Music, label: 'Spotify' },
  prayer_times: { icon: Moon, label: 'Prayer' },
  finance: { icon: DollarSign, label: 'Finance' },
};

// ─── Severity Config ─────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-400',
    dot: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-400',
    dot: 'bg-amber-500',
  },
  info: {
    icon: CheckCircle2,
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    badge: 'bg-cyan-500/20 text-cyan-400',
    dot: 'bg-cyan-500',
  },
} as const;

// ─── Main Component ──────────────────────────────────────

export function CorrelationDashboard() {
  const [dailyCorrelation, setDailyCorrelation] = useState<DailyCorrelation | null>(null);
  const [history, setHistory] = useState<DailyCorrelation[]>([]);
  const [overview, setOverview] = useState<DataSourceOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [corr, hist, ov] = await Promise.all([
          dataSourceService.getDailyCorrelation(today),
          dataSourceService.getCorrelationHistory(7),
          dataSourceService.getOverview(),
        ]);
        if (cancelled) return;
        setDailyCorrelation(corr);
        setHistory(hist);
        setOverview(ov);
      } catch {
        // non-critical — render empty states
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const stressScore = dailyCorrelation?.stressScore ?? 0;
  const energyScore = dailyCorrelation?.energyScore ?? 0;
  const moodScore = dailyCorrelation?.moodScore ?? 0;
  const availabilityScore = dailyCorrelation?.availabilityScore ?? 0;
  const correlations = dailyCorrelation?.correlations ?? [];

  return (
    <div className="space-y-6">
      {/* ── 1. Score Rings ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Today&apos;s Scores</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
          <ScoreRing
            label="Stress"
            score={stressScore}
            colors={{ stroke: '#ef4444', bg: '#ef444420', text: 'text-red-400' }}
            icon={<Zap className="w-3.5 h-3.5 text-red-400" />}
            delay={0}
          />
          <ScoreRing
            label="Energy"
            score={energyScore}
            colors={{ stroke: '#14b8a6', bg: '#14b8a620', text: 'text-teal-400' }}
            icon={<TrendingUp className="w-3.5 h-3.5 text-teal-400" />}
            delay={0.1}
          />
          <ScoreRing
            label="Mood"
            score={moodScore}
            colors={{ stroke: '#a855f7', bg: '#a855f720', text: 'text-purple-400' }}
            icon={<Heart className="w-3.5 h-3.5 text-purple-400" />}
            delay={0.2}
          />
          <ScoreRing
            label="Availability"
            score={availabilityScore}
            colors={{ stroke: '#06b6d4', bg: '#06b6d420', text: 'text-cyan-400' }}
            icon={<Calendar className="w-3.5 h-3.5 text-cyan-400" />}
            delay={0.3}
          />
        </div>
      </motion.div>

      {/* ── 2. Source Status Strip ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Data Sources</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(SOURCE_META) as DataSourceType[]).map((sourceType, idx) => {
            const meta = SOURCE_META[sourceType];
            const Icon = meta.icon;
            const src = overview.find((o) => o.sourceType === sourceType);
            const connected = src?.connected ?? false;
            const lastSync = src?.lastSyncAt
              ? new Date(src.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <motion.div
                key={sourceType}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${connected ? 'bg-emerald-500/15' : 'bg-slate-700/50'}`}>
                  <Icon className={`w-4 h-4 ${connected ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{meta.label}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className="text-[10px] text-slate-500">
                      {connected ? (lastSync ? `Synced ${lastSync}` : 'Connected') : 'Not connected'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── 3. Active Correlations ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Active Correlations</h3>
          <span className="text-xs text-slate-500">{correlations.length} detected</span>
        </div>

        {correlations.length === 0 ? (
          <div className="text-center py-10 rounded-2xl bg-white/5 border border-white/10">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No active correlations today.</p>
            <p className="text-xs text-slate-500 mt-1">All signals look balanced.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {correlations.map((corr, idx) => {
              const cfg = SEVERITY_CONFIG[corr.severity] ?? SEVERITY_CONFIG.info;
              const SevIcon = cfg.icon;

              return (
                <motion.div
                  key={corr.ruleId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + idx * 0.06 }}
                  className={`rounded-xl ${cfg.bg} border ${cfg.border} p-4`}
                >
                  <div className="flex items-start gap-3">
                    <SevIcon className={`w-4 h-4 mt-0.5 shrink-0 ${corr.severity === 'critical' ? 'text-red-400' : corr.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-1">{corr.description}</p>

                      {corr.evidence.length > 0 && (
                        <ul className="space-y-1 mb-2">
                          {corr.evidence.map((ev, i) => (
                            <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                              <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${cfg.dot}`} />
                              {ev}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {corr.domains.map((domain) => (
                          <span
                            key={domain}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.badge}`}
                          >
                            {SOURCE_META[domain]?.label ?? domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── 4. 7-Day Trend ────────────────────────────────── */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">7-Day Trend</h3>
          </div>

          <div className="flex items-end gap-2 h-32">
            {history.map((day, idx) => {
              const stress = day.stressScore ?? 0;
              const mood = day.moodScore ?? 0;
              const dateLabel = new Date(day.correlationDate).toLocaleDateString([], {
                weekday: 'short',
              });

              return (
                <motion.div
                  key={day.id || idx}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.5 + idx * 0.06, duration: 0.3 }}
                  style={{ transformOrigin: 'bottom' }}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex gap-0.5 items-end h-24">
                    <div
                      className="flex-1 rounded-t-sm bg-red-500/60"
                      style={{ height: `${Math.max(stress, 4)}%` }}
                      title={`Stress: ${stress}`}
                    />
                    <div
                      className="flex-1 rounded-t-sm bg-purple-500/60"
                      style={{ height: `${Math.max(mood, 4)}%` }}
                      title={`Mood: ${mood}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{dateLabel}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500/60" />
              <span className="text-[10px] text-slate-500">Stress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-purple-500/60" />
              <span className="text-[10px] text-slate-500">Mood</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 5. AI Insight ─────────────────────────────────── */}
      {dailyCorrelation && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="rounded-2xl bg-linear-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">AI Insight</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {generateInsightText(dailyCorrelation)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              Recommended: {dailyCorrelation.recommendedMode} session
            </span>
            {dailyCorrelation.toneAdjustment && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">
                Tone: {dailyCorrelation.toneAdjustment}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function generateInsightText(data: DailyCorrelation): string {
  const parts: string[] = [];

  if (data.stressScore > 60) {
    parts.push(`Your stress is elevated today${data.calendarLoad > 0 ? ` with ${data.calendarLoad} meetings on your calendar` : ''}.`);
  } else {
    parts.push(`Your stress levels look manageable today.`);
  }

  if (data.musicMood) {
    parts.push(`Spotify data shows a ${data.musicMood} mood in your listening.`);
  }

  if (data.prayerAdherence > 0.8) {
    parts.push(`Strong prayer adherence is supporting your wellbeing.`);
  } else if (data.prayerAdherence > 0) {
    parts.push(`Maintaining your prayer routine can help reduce stress.`);
  }

  if (data.spendingStress > 0.5) {
    parts.push(`Financial activity may be adding to your stress.`);
  }

  if (data.stressScore > 60) {
    parts.push(`Consider shorter activities and take breaks between tasks.`);
  } else if (data.energyScore > 70) {
    parts.push(`Energy is high — a great time for a challenging workout.`);
  }

  return parts.join(' ');
}
