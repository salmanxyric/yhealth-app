'use client';

import { isToday, isYesterday, format, isSameYear } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateSeparatorProps {
  date: Date | string;
  className?: string;
}

export function DateSeparator({ date, className }: DateSeparatorProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  let label: string;
  if (isToday(dateObj)) {
    label = 'Today';
  } else if (isYesterday(dateObj)) {
    label = 'Yesterday';
  } else if (isSameYear(dateObj, new Date())) {
    // Same year, show month and day
    label = format(dateObj, 'MMMM d');
  } else {
    // Different year, show full date
    label = format(dateObj, 'MMMM d, yyyy');
  }

  return (
    <div className={cn('flex items-center justify-center py-4 px-4', className)}>
      <div className="relative flex items-center w-full max-w-full">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex items-center justify-center w-full">
          <span className="text-xs font-medium text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/30">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

