'use client';

import { useState } from 'react';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export type FilterType = 'search' | 'select' | 'multi-select' | 'boolean';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onReset: () => void;
  className?: string;
}

function SelectFilter({
  config,
  value,
  onChange,
}: {
  config: FilterConfig;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = config.options?.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            value
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300',
          )}
        >
          {config.label}
          {selectedOption && (
            <>
              <span className="text-slate-600">:</span>
              <span className="text-slate-200">{selectedOption.label}</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 border-slate-700 bg-slate-900 p-1">
        <button
          onClick={() => { onChange(undefined); setOpen(false); }}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors',
            !value ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300',
          )}
        >
          All
        </button>
        {config.options?.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors',
              value === opt.value ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300',
            )}
          >
            {value === opt.value && <Check className="h-3 w-3 text-emerald-400" />}
            <span className={cn(value === opt.value ? '' : 'ml-5')}>{opt.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function MultiSelectFilter({
  config,
  value,
  onChange,
}: {
  config: FilterConfig;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            value.length > 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300',
          )}
        >
          {config.label}
          {value.length > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/20 px-1 text-[10px] font-semibold text-emerald-400">
              {value.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 border-slate-700 bg-slate-900 p-1.5">
        <div className="space-y-0.5">
          {config.options?.map((opt) => {
            const isChecked = value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800/60"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) onChange([...value, opt.value]);
                    else onChange(value.filter((v) => v !== opt.value));
                  }}
                  className="h-3.5 w-3.5 border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
        {value.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="mt-1.5 w-full rounded-md px-2.5 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-slate-400"
          >
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function FilterBar({ filters, values, onChange, onReset, className }: FilterBarProps) {
  const searchFilter = filters.find((f) => f.type === 'search');
  const otherFilters = filters.filter((f) => f.type !== 'search');

  const activeCount = Object.entries(values).filter(([key, val]) => {
    if (key === searchFilter?.key) return false;
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== '' && val !== false;
  }).length;

  const hasAnyActive = activeCount > 0 || (searchFilter && !!values[searchFilter.key]);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Search */}
      {searchFilter && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={(values[searchFilter.key] as string) ?? ''}
            onChange={(e) => onChange(searchFilter.key, e.target.value || undefined)}
            placeholder={searchFilter.placeholder ?? 'Search...'}
            className="h-8 w-52 border-slate-700 bg-slate-800/60 pl-8 text-xs text-slate-200 placeholder:text-slate-500"
          />
          {!!values[searchFilter.key] && (
            <button
              onClick={() => onChange(searchFilter.key, undefined)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Filter pills */}
      {otherFilters.length > 0 && (
        <div className="flex items-center gap-1">
          <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-slate-600" />
        </div>
      )}

      {otherFilters.map((filter) => {
        if (filter.type === 'select') {
          return (
            <SelectFilter
              key={filter.key}
              config={filter}
              value={values[filter.key] as string | undefined}
              onChange={(v) => onChange(filter.key, v)}
            />
          );
        }
        if (filter.type === 'multi-select') {
          return (
            <MultiSelectFilter
              key={filter.key}
              config={filter}
              value={(values[filter.key] as string[]) ?? []}
              onChange={(v) => onChange(filter.key, v.length > 0 ? v : undefined)}
            />
          );
        }
        if (filter.type === 'boolean') {
          const isActive = !!values[filter.key];
          return (
            <button
              key={filter.key}
              onClick={() => onChange(filter.key, isActive ? undefined : true)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300',
              )}
            >
              {filter.label}
            </button>
          );
        }
        return null;
      })}

      {/* Clear all */}
      {hasAnyActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-slate-300"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
