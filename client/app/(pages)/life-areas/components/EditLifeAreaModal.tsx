'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { X, Loader2, Star, StarOff } from 'lucide-react';
import { DomainPicker } from './DomainPicker';
import type { LifeArea, LifeAreaDomain, LifeAreaPreferences } from '../types';

interface Props {
  open: boolean;
  area: LifeArea | null;
  domains: LifeAreaDomain[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<LifeArea>) => Promise<LifeArea>;
}

const ICON_OPTIONS = [
  'Target', 'Briefcase', 'Heart', 'Brain', 'Dumbbell', 'BookOpen',
  'Palette', 'Music', 'Camera', 'Globe', 'Flame', 'Leaf',
  'Star', 'Zap', 'Shield', 'Code',
];

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#64748b', '#a855f7',
];

const TONE_OPTIONS: { value: LifeAreaPreferences['tone']; label: string }[] = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'direct', label: 'Direct' },
  { value: 'playful', label: 'Playful' },
  { value: 'neutral', label: 'Neutral' },
];

const FOLLOW_UP_OPTIONS: { value: LifeAreaPreferences['followUpFrequency']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-other-day', label: 'Every Other Day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'off', label: 'Off' },
];

export function EditLifeAreaModal({ open, area, domains, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [domainType, setDomainType] = useState<string>('');
  const [icon, setIcon] = useState<string>('Target');
  const [color, setColor] = useState<string>('#6366f1');
  const [isFlagship, setIsFlagship] = useState(false);
  const [tone, setTone] = useState<LifeAreaPreferences['tone']>('neutral');
  const [followUp, setFollowUp] = useState<LifeAreaPreferences['followUpFrequency']>('weekly');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !area) return;
    setName(area.display_name);
    setDomainType(area.domain_type);
    setIcon(area.icon || 'Target');
    setColor(area.color || '#6366f1');
    setIsFlagship(area.is_flagship);
    setTone(area.preferences?.tone || 'neutral');
    setFollowUp(area.preferences?.followUpFrequency || 'weekly');
    setError(null);
    setSubmitting(false);
  }, [open, area]);

  async function handleSave() {
    if (!area || !name.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(area.id, {
        display_name: name.trim(),
        domain_type: domainType as LifeArea['domain_type'],
        icon,
        color,
        is_flagship: isFlagship,
        preferences: {
          ...area.preferences,
          tone,
          followUpFrequency: followUp,
        },
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && area && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg max-h-[90vh] rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl px-6 pt-6 pb-4 border-b border-white/5">
              <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-semibold text-white">Edit Life Area</h2>
              <p className="text-sm text-slate-400 mt-1">Update your area settings and preferences.</p>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Job Hunt 2026"
                  className="w-full rounded-lg bg-slate-950/50 border border-white/10 px-3 py-2.5 text-white placeholder:text-slate-500
                             focus:outline-none focus:border-blue-400/60 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Category</label>
                <DomainPicker domains={domains} value={domainType} onChange={setDomainType} />
              </div>

              {/* Flagship toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsFlagship(!isFlagship)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition border ${
                    isFlagship
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {isFlagship ? <Star className="w-4 h-4 fill-amber-400" /> : <StarOff className="w-4 h-4" />}
                  {isFlagship ? 'Flagship Area' : 'Mark as Flagship'}
                </button>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((iconName) => {
                    const LucideIcon = (Icons[iconName as keyof typeof Icons] ?? Icons.Target) as React.ComponentType<{ className?: string }>;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${
                          icon === iconName
                            ? 'border-blue-400/60 bg-blue-500/15 text-blue-300 scale-110'
                            : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <LucideIcon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coaching Tone */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Coaching Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTone(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition border ${
                        tone === opt.value
                          ? 'border-blue-400/60 bg-blue-500/15 text-blue-300'
                          : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-up Frequency */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Follow-up Frequency</label>
                <div className="flex flex-wrap gap-2">
                  {FOLLOW_UP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFollowUp(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition border ${
                        followUp === opt.value
                          ? 'border-blue-400/60 bg-blue-500/15 text-blue-300'
                          : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="text-sm text-red-300">{error}</div>}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white transition">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white
                           bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
