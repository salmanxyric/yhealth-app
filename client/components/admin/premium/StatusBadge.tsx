'use client';

import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/admin-tokens';

interface StatusBadgeProps {
  status: string;
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const displayLabel = label ?? status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />}
      {displayLabel}
    </span>
  );
}
