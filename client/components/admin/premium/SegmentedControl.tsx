'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SegmentedOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-lg bg-slate-800/60 p-0.5', className)}>
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-300',
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
