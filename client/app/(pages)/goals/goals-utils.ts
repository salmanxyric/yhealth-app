import { KANBAN_COLUMNS } from "./goals-constants";
import type { KanbanColumnId } from "./goals-constants";

export function getColumnForStatus(status: string): KanbanColumnId {
  for (const col of KANBAN_COLUMNS) {
    if ((col.statusValues as readonly string[]).includes(status)) return col.id;
  }
  return "active";
}

export function getStatusForColumn(columnId: string): string {
  switch (columnId) {
    case "active": return "active";
    case "in_progress": return "in_progress";
    case "paused": return "paused";
    case "completed": return "completed";
    default: return "active";
  }
}

// Column color utilities
export function getColumnDotColor(color: string): string {
  switch (color) {
    case "emerald": return "bg-emerald-400";
    case "violet": return "bg-violet-400";
    case "amber": return "bg-amber-400";
    case "sky": return "bg-sky-400";
    default: return "bg-slate-400";
  }
}

export function getColumnBorderGlow(color: string): string {
  switch (color) {
    case "emerald": return "border-emerald-500/40 shadow-emerald-500/10";
    case "violet": return "border-violet-500/40 shadow-violet-500/10";
    case "amber": return "border-amber-500/40 shadow-amber-500/10";
    case "sky": return "border-sky-500/40 shadow-sky-500/10";
    default: return "border-slate-500/40 shadow-slate-500/10";
  }
}

export function getColumnCountBadge(color: string): string {
  switch (color) {
    case "emerald": return "bg-emerald-500/20 text-emerald-300";
    case "violet": return "bg-violet-500/20 text-violet-300";
    case "amber": return "bg-amber-500/20 text-amber-300";
    case "sky": return "bg-sky-500/20 text-sky-300";
    default: return "bg-slate-500/20 text-slate-300";
  }
}
