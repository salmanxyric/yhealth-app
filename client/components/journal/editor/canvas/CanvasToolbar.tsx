"use client";

import {
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  MousePointer,
  Hand,
  Minus,
  Triangle,
  MoveRight,
  Undo,
  Redo,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasTool =
  | "select" | "pen" | "eraser" | "hand"
  | "rect" | "circle" | "triangle" | "line" | "arrow"
  | "text";

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  strokeWidth: number;
  onStrokeWidthChange: (w: number) => void;
  strokeColor: string;
  onStrokeColorChange: (c: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS: { tool: CanvasTool; icon: typeof Pencil; label: string }[] = [
  { tool: "select", icon: MousePointer, label: "Select" },
  { tool: "pen", icon: Pencil, label: "Pen" },
  { tool: "eraser", icon: Eraser, label: "Eraser" },
  { tool: "hand", icon: Hand, label: "Pan" },
  { tool: "rect", icon: Square, label: "Rectangle" },
  { tool: "circle", icon: Circle, label: "Circle" },
  { tool: "triangle", icon: Triangle, label: "Triangle" },
  { tool: "line", icon: Minus, label: "Line" },
  { tool: "arrow", icon: MoveRight, label: "Arrow" },
  { tool: "text", icon: Type, label: "Text" },
];

export function CanvasToolbar({
  activeTool,
  onToolChange,
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-[#0e0a22]/95 backdrop-blur-xl">
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            title={label}
            className={cn(
              "p-2 rounded-lg transition-all",
              activeTool === tool
                ? "bg-purple-500/25 text-purple-300"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* Stroke width */}
      <input
        type="range"
        min={1}
        max={20}
        value={strokeWidth}
        onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
        className="w-20 accent-purple-500"
        title={`Stroke: ${strokeWidth}px`}
      />

      {/* Color */}
      <input
        type="color"
        value={strokeColor}
        onChange={(e) => onStrokeColorChange(e.target.value)}
        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/10"
      />

      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* History */}
      <button onClick={onUndo} disabled={!canUndo} className={cn("p-2 rounded-lg transition-colors", canUndo ? "text-white/40 hover:text-white/70" : "text-white/10")}>
        <Undo className="w-4 h-4" />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className={cn("p-2 rounded-lg transition-colors", canRedo ? "text-white/40 hover:text-white/70" : "text-white/10")}>
        <Redo className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button onClick={onClear} className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-colors" title="Clear canvas">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
