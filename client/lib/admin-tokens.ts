export const ADMIN_SPACING = {
  page: 'px-6',
  sectionGap: 'gap-6',
  cardPadding: 'p-5',
  cardHeader: 'px-5 py-4',
  tableCell: 'px-3 py-3',
  compact: 'gap-2',
  tight: 'gap-1',
} as const;

export const ADMIN_RADIUS = {
  card: 'rounded-2xl',
  input: 'rounded-lg',
  badge: 'rounded-full',
  tableContainer: 'rounded-2xl',
} as const;

export const ADMIN_BG = {
  card: 'bg-slate-900/60 border border-slate-800',
  surface: 'bg-slate-950/40',
  cardHeader: 'bg-slate-900/40 border-b border-slate-800',
  tableRow: 'border-b border-slate-800/60',
  input: 'bg-slate-800/60 border-slate-700',
} as const;

export const ADMIN_TEXT = {
  pageTitle: 'text-xl font-semibold text-slate-100',
  sectionTitle: 'text-sm font-semibold text-slate-100',
  label: 'text-xs font-medium uppercase tracking-wider text-slate-500',
  body: 'text-sm text-slate-300',
  muted: 'text-sm text-slate-500',
  mono: 'font-mono text-[11px] text-slate-400',
} as const;

export type StatusColorKey =
  | 'active' | 'canceled' | 'past_due' | 'trialing'
  | 'grace' | 'paused' | 'suspended' | 'expired'
  | 'revoked' | 'inactive' | 'pending' | 'completed'
  | 'queued' | 'in_progress' | 'blocked'
  | 'credit_grant' | 'percent_off' | 'fixed_off' | 'trial_extend'
  | 'grant_credits' | 'deduct_credits' | 'extend_trial' | 'comp_plan' | 'suspend' | 'unsuspend' | 'refund'
  | 'critical' | 'high' | 'medium' | 'low'
  | 'user' | 'admin' | 'system' | 'webhook';

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  active:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  canceled:     { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20',   dot: 'bg-slate-400' },
  past_due:     { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    dot: 'bg-rose-400' },
  trialing:     { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20',  dot: 'bg-violet-400' },
  grace:        { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   dot: 'bg-amber-400' },
  paused:       { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20',   dot: 'bg-slate-400' },
  suspended:    { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     dot: 'bg-red-400' },
  expired:      { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20',   dot: 'bg-slate-500' },
  revoked:      { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20',  dot: 'bg-orange-400' },
  inactive:     { bg: 'bg-slate-500/10',   text: 'text-slate-500',   border: 'border-slate-500/20',   dot: 'bg-slate-500' },
  pending:      { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   dot: 'bg-amber-400' },
  completed:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  queued:       { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20',   dot: 'bg-slate-400' },
  in_progress:  { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    dot: 'bg-blue-400' },
  blocked:      { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     dot: 'bg-red-400' },

  credit_grant: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  percent_off:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20',  dot: 'bg-violet-400' },
  fixed_off:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    dot: 'bg-cyan-400' },
  trial_extend: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   dot: 'bg-amber-400' },

  grant_credits:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  deduct_credits: { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    dot: 'bg-rose-400' },
  extend_trial:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   dot: 'bg-amber-400' },
  comp_plan:      { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20',  dot: 'bg-violet-400' },
  suspend:        { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     dot: 'bg-red-400' },
  unsuspend:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  refund:         { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20',  dot: 'bg-orange-400' },

  critical: { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',    dot: 'bg-red-400' },
  high:     { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20',  dot: 'bg-amber-400' },
  medium:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  low:      { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/20',  dot: 'bg-slate-400' },

  user:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    dot: 'bg-blue-400' },
  admin:   { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20',  dot: 'bg-violet-400' },
  system:  { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20',   dot: 'bg-slate-400' },
  webhook: { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    dot: 'bg-cyan-400' },
};

const DEFAULT_STATUS_COLOR = { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-500' };

export function getStatusColor(status: string) {
  return STATUS_COLORS[status.toLowerCase()] ?? DEFAULT_STATUS_COLOR;
}

export const ACCENT_COLORS = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
} as const;

export type AccentColor = keyof typeof ACCENT_COLORS;
