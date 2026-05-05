// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for plan × feature configuration.

"use client";

import { useMemo, useState, useCallback } from "react";
import { Check, X, Loader2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export type MatrixValueKind = "boolean" | "access_level" | "credit_cost";

export type AccessLevel = "none" | "preview" | "locked" | "full";

export interface MatrixRow {
    /** Row key — e.g. feature_key, page_key, menu_key */
    key: string;
    label: string;
    category?: string;
}

export interface MatrixColumn {
    /** Column key — usually plan id */
    id: string;
    label: string;
    tier?: number;
}

export interface MatrixCell {
    row: string;
    column: string;
    value: boolean | AccessLevel | number | null;
}

interface Props {
    rows: MatrixRow[];
    columns: MatrixColumn[];
    cells: MatrixCell[];
    valueKind: MatrixValueKind;
    onUpdate: (row: string, column: string, value: MatrixCell["value"]) => Promise<void>;
    title?: string;
    description?: string;
}

/**
 * Generic plan × entity matrix editor. One column per plan, one row per
 * catalog entry (feature / page / menu). Each cell toggles/edits in place
 * against the admin billing API.
 *
 * Keeps pending-write state per cell so rapid clicks don't race. Errors
 * surface as toasts; the cell reverts to the server value on failure.
 */
export function EntityMatrix({
    rows,
    columns,
    cells,
    valueKind,
    onUpdate,
    title,
    description,
}: Props) {
    const cellMap = useMemo(() => {
        const m = new Map<string, MatrixCell["value"]>();
        for (const c of cells) m.set(`${c.row}|${c.column}`, c.value);
        return m;
    }, [cells]);

    const [pending, setPending] = useState<Set<string>>(() => new Set());
    const [overrides, setOverrides] = useState<Map<string, MatrixCell["value"]>>(
        () => new Map()
    );

    const value = useCallback(
        (row: string, column: string) => {
            const k = `${row}|${column}`;
            return overrides.has(k) ? overrides.get(k) : cellMap.get(k);
        },
        [cellMap, overrides]
    );

    const commit = useCallback(
        async (row: string, column: string, next: MatrixCell["value"]) => {
            const k = `${row}|${column}`;
            const prev = cellMap.get(k);
            setOverrides((m) => {
                const n = new Map(m);
                n.set(k, next);
                return n;
            });
            setPending((s) => new Set(s).add(k));
            try {
                await onUpdate(row, column, next);
            } catch (err) {
                setOverrides((m) => {
                    const n = new Map(m);
                    n.set(k, prev ?? null);
                    return n;
                });
                toast.error(
                    err instanceof Error ? err.message : "Update failed"
                );
            } finally {
                setPending((s) => {
                    const n = new Set(s);
                    n.delete(k);
                    return n;
                });
            }
        },
        [cellMap, onUpdate]
    );

    const rowsByCategory = useMemo(() => {
        const map = new Map<string, MatrixRow[]>();
        for (const r of rows) {
            const cat = r.category ?? "General";
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(r);
        }
        return Array.from(map.entries());
    }, [rows]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            {(title || description) && (
                <div className="px-6 py-4 border-b border-slate-800">
                    {title && (
                        <h3 className="text-sm font-semibold text-slate-100">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="mt-1 text-xs text-slate-500">
                            {description}
                        </p>
                    )}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900/60 border-b border-slate-800">
                        <tr>
                            <th className="text-left font-medium text-slate-400 uppercase tracking-wider text-[10px] px-4 py-3 min-w-[240px]">
                                Capability
                            </th>
                            {columns.map((col) => (
                                <th
                                    key={col.id}
                                    className="text-center font-medium text-slate-200 px-3 py-3 min-w-[120px]"
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm">{col.label}</span>
                                        {col.tier !== undefined && (
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                                                Tier {col.tier}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {rowsByCategory.map(([cat, catRows]) => (
                            <>
                                {cat !== "General" && (
                                    <tr
                                        key={`cat-${cat}`}
                                        className="bg-slate-950/40"
                                    >
                                        <td
                                            colSpan={columns.length + 1}
                                            className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300"
                                        >
                                            {cat}
                                        </td>
                                    </tr>
                                )}
                                {catRows.map((row) => (
                                    <tr
                                        key={row.key}
                                        className="hover:bg-slate-900/30"
                                    >
                                        <td className="px-4 py-2.5 text-slate-300 font-mono text-[12px]">
                                            <div className="flex flex-col">
                                                <span className="text-slate-200">
                                                    {row.label}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {row.key}
                                                </span>
                                            </div>
                                        </td>
                                        {columns.map((col) => {
                                            const k = `${row.key}|${col.id}`;
                                            const v = value(row.key, col.id);
                                            const isPending = pending.has(k);
                                            return (
                                                <td
                                                    key={col.id}
                                                    className="text-center px-2 py-2"
                                                >
                                                    <MatrixCellControl
                                                        valueKind={valueKind}
                                                        value={v ?? null}
                                                        pending={isPending}
                                                        onChange={(next) =>
                                                            commit(row.key, col.id, next)
                                                        }
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MatrixCellControl({
    valueKind,
    value,
    pending,
    onChange,
}: {
    valueKind: MatrixValueKind;
    value: MatrixCell["value"];
    pending: boolean;
    onChange: (next: MatrixCell["value"]) => void;
}) {
    if (pending) {
        return <Loader2 className="h-4 w-4 animate-spin text-cyan-400 mx-auto" />;
    }

    if (valueKind === "boolean") {
        const isOn = value === true;
        return (
            <button
                type="button"
                onClick={() => onChange(!isOn)}
                aria-pressed={isOn}
                className={cn(
                    "inline-flex items-center justify-center rounded-full h-7 w-7 transition-colors",
                    isOn
                        ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                )}
            >
                {isOn ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            </button>
        );
    }

    if (valueKind === "access_level") {
        const levels: AccessLevel[] = ["full", "preview", "locked", "none"];
        const current = (value as AccessLevel) ?? "none";
        return (
            <select
                value={current}
                onChange={(e) => onChange(e.target.value as AccessLevel)}
                className={cn(
                    "rounded-md px-1.5 py-1 text-[11px] font-medium border",
                    current === "full" &&
                        "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
                    current === "preview" &&
                        "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
                    current === "locked" &&
                        "bg-amber-500/10 text-amber-300 border-amber-500/30",
                    current === "none" && "bg-slate-800 text-slate-500 border-slate-700"
                )}
            >
                {levels.map((l) => (
                    <option key={l} value={l}>
                        {l}
                    </option>
                ))}
            </select>
        );
    }

    // credit_cost
    const n = typeof value === "number" ? value : null;
    return (
        <input
            type="number"
            min={0}
            step={1}
            defaultValue={n ?? ""}
            placeholder={n === null ? "—" : ""}
            onBlur={(e) => {
                const parsed = e.currentTarget.value === "" ? null : parseInt(e.currentTarget.value, 10);
                if (parsed === n) return;
                if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) return;
                onChange(parsed);
            }}
            className="w-16 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 text-center focus:border-cyan-400 focus:outline-none"
        />
    );
}

export const MatrixEmptyState = () => (
    <div className="flex items-center justify-center py-12 text-sm text-slate-500">
        <Minus className="h-4 w-4 mr-2" />
        Nothing to configure yet.
    </div>
);
