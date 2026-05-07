"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

// ============================================
// Reusable segmented control component
// ============================================

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; preview?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const activeIndex = options.findIndex((o) => o.id === value);
  return (
    <div className="relative flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
      {/* Animated active indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-sky-500/30 to-emerald-600/30 border border-sky-500/20"
        initial={false}
        animate={{
          left: `calc(${(activeIndex / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`relative z-10 flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-colors ${
            value === option.id
              ? "text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Reusable toggle switch component
// ============================================

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  color = "sky",
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  color?: "sky" | "indigo";
}) {
  const bgColor = color === "indigo" ? "bg-indigo-500" : "bg-sky-500";
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
        checked ? bgColor : "bg-slate-700"
      }`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
        animate={{
          left: checked ? "calc(100% - 20px)" : "4px",
        }}
      />
    </button>
  );
}

// ============================================
// Glass card wrapper
// ============================================

export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================
// Section header with gradient icon badge
// ============================================

export function SectionHeader({
  icon,
  title,
  gradient = "from-sky-500 to-emerald-600",
}: {
  icon: React.ReactNode;
  title: string;
  gradient?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
      >
        <span className="text-white">{icon}</span>
      </div>
      <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
        {title}
      </h2>
    </div>
  );
}

// ============================================
// Rounded hour selector with popover list
// ============================================

export function HourSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const display = value === null ? "Off" : `${value}:00`;
  const options: Array<{ val: number | null; label: string }> = [
    { val: null, label: "Off" },
    ...Array.from({ length: 24 }, (_, h) => ({ val: h, label: `${h}:00` })),
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-white/[0.08] text-slate-100 outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/30 transition-colors cursor-pointer flex items-center justify-between"
      >
        <span>{display}</span>
        <svg
          aria-hidden
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-white/[0.08] bg-slate-950/95 backdrop-blur-xl shadow-2xl p-1.5 max-h-[10rem] overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {options.map((opt) => {
              const selected =
                (opt.val === null && value === null) || opt.val === value;
              return (
                <button
                  key={opt.val === null ? "off" : opt.val}
                  role="option"
                  aria-selected={selected}
                  type="button"
                  onClick={() => {
                    onChange(opt.val);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selected
                      ? "bg-sky-500/15 text-sky-300"
                      : "text-slate-200 hover:bg-white/[0.05]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Profile Info Tile
// ============================================

export function ProfileInfoTile({
  icon,
  label,
  value,
  empty = false,
  iconGradient = "from-blue-500/20 to-indigo-500/20",
  iconColor = "text-blue-400",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  empty?: boolean;
  iconGradient?: string;
  iconColor?: string;
}) {
  return (
    <div className="group relative p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.035] transition-all">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${iconGradient} ${iconColor} flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
            {label}
          </p>
          <p className={`text-sm font-medium truncate ${empty ? "text-slate-600 italic" : "text-white"}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
