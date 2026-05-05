'use client';

import { motion } from 'framer-motion';
import { Swords, HeartHandshake, LineChart, ShieldCheck } from 'lucide-react';
import type { AICoachPersona } from '@shared/types/domain/coach-persona';
import { normalizePersonaId } from '@shared/types/domain/coach-persona';

const PERSONAS: {
  id: AICoachPersona;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    id: 'commander',
    label: 'Commander',
    description: 'Direct, strict, execution-first. Holds you accountable with minimal fluff.',
    icon: <Swords className="w-5 h-5" />,
    accent: 'from-amber-500 to-orange-600',
  },
  {
    id: 'friend',
    label: 'Friend',
    description: 'Warm, motivational, and validating. Celebrates wins and normalizes setbacks.',
    icon: <HeartHandshake className="w-5 h-5" />,
    accent: 'from-pink-500 to-rose-500',
  },
  {
    id: 'data_nerd',
    label: 'Data Nerd',
    description: 'Analytical, metrics-first coaching. Explains the "why" with numbers and trends.',
    icon: <LineChart className="w-5 h-5" />,
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'guardian',
    label: 'Guardian',
    description: 'Calm, balanced, long-term perspective. Protects against overtraining and burnout.',
    icon: <ShieldCheck className="w-5 h-5" />,
    accent: 'from-emerald-500 to-teal-600',
  },
];

export interface CoachPersonaPickerProps {
  value: AICoachPersona | string;
  onChange: (id: AICoachPersona) => void;
  disabled?: boolean;
  /** Tighter layout for dashboard preferences tab */
  compact?: boolean;
}

export function CoachPersonaPicker({ value, onChange, disabled, compact }: CoachPersonaPickerProps) {
  const normalizedValue = normalizePersonaId(value);

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <p className="text-sm font-medium text-white">Coach personality</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Shapes tone in chat, voice, and proactive messages. You can still tune formality and emojis below.
        </p>
      </div>
      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {PERSONAS.map((p) => {
          const selected = normalizedValue === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.id)}
              className={`relative text-left rounded-2xl border transition-all p-4 sm:p-5 disabled:opacity-50 disabled:pointer-events-none ${
                selected
                  ? 'bg-white/[0.06] border-emerald-500/35 shadow-[0_0_24px_rgba(16,185,129,0.12)]'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${p.accent} text-white shrink-0 ${
                    selected ? 'shadow-lg' : 'opacity-80'
                  }`}
                >
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${selected ? 'text-white' : 'text-slate-200'}`}>
                    {p.label}
                  </span>
                  <span className="block text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</span>
                </div>
                {selected ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-400 text-xs font-semibold uppercase tracking-wide shrink-0"
                  >
                    Active
                  </motion.span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function coachPersonaLabel(id: string): string {
  const p = PERSONAS.find((x) => x.id === id);
  return p?.label ?? 'Coach';
}
