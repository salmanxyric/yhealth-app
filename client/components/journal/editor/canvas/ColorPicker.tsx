"use client";

import { cn } from "@/lib/utils";

const OBSERVATORY_PALETTE = [
  "#ffffff", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9",
  "#60a5fa", "#3b82f6", "#2dd4bf", "#14b8a6", "#f59e0b",
  "#ef4444", "#ec4899", "#94a3b8", "#475569", "#1e293b",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="p-2 rounded-xl bg-[#0e0a22] border border-white/10">
      <div className="grid grid-cols-5 gap-1.5 mb-2">
        {OBSERVATORY_PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={cn(
              "w-7 h-7 rounded-lg border-2 transition-all",
              value === color ? "border-white/60 scale-110" : "border-transparent hover:border-white/20"
            )}
            style={{ background: color }}
          />
        ))}
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded cursor-pointer bg-transparent"
      />
    </div>
  );
}
