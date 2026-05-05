"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import {
  adminExercisesService,
  type CreateExercisePayload,
  type AdminImportExercisesResult,
} from "@/src/shared/services/admin-exercises.service";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ImportExercisesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type ParseState =
  | { status: "idle" }
  | { status: "parsed"; count: number; exercises: CreateExercisePayload[] }
  | { status: "error"; message: string };

const SERVER_ONLY_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "is_system",
  "source",
  "source_id",
  "version",
  "external_metadata",
]);

function mapToPayload(raw: Record<string, unknown>): CreateExercisePayload {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!SERVER_ONLY_KEYS.has(k)) cleaned[k] = v;
  }
  return cleaned as unknown as CreateExercisePayload;
}

function parseFile(file: File): Promise<CreateExercisePayload[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") throw new Error("Could not read file");
        const json = JSON.parse(text);

        const raw: unknown = Array.isArray(json)
          ? json
          : Array.isArray(json?.exercises)
          ? json.exercises
          : null;

        if (!Array.isArray(raw) || raw.length === 0) {
          throw new Error(
            'File must contain an "exercises" array or a top-level array of exercise objects.'
          );
        }
        if (raw.length > 2000) {
          throw new Error(
            `File contains ${raw.length} exercises. Maximum per import is 2,000.`
          );
        }

        for (let i = 0; i < raw.length; i++) {
          const row = raw[i] as Record<string, unknown>;
          if (!row.name || !row.category || !row.difficulty_level) {
            throw new Error(
              `Row ${i + 1} is missing required fields: name, category, difficulty_level`
            );
          }
        }

        resolve(
          (raw as Record<string, unknown>[]).map((r) => mapToPayload(r))
        );
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsText(file);
  });
}

export function ImportExercisesModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportExercisesModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parseState, setParseState] = useState<ParseState>({ status: "idle" });
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<AdminImportExercisesResult | null>(null);

  function reset() {
    setParseState({ status: "idle" });
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const exercises = await parseFile(file);
      setParseState({ status: "parsed", count: exercises.length, exercises });
      setResult(null);
    } catch (err) {
      setParseState({
        status: "error",
        message: err instanceof Error ? err.message : "Parse failed",
      });
    }
  }

  async function handleImport() {
    if (parseState.status !== "parsed") return;
    setImporting(true);
    try {
      const response = await adminExercisesService.importExercises(
        parseState.exercises
      );
      if (response.success && response.data) {
        const r = response.data;
        setResult(r);
        if (r.inserted > 0) {
          toast.success(
            `Import complete: ${r.inserted} inserted, ${r.skipped} skipped, ${r.failed} failed`
          );
          onImportComplete();
        } else {
          toast(
            `Nothing inserted. ${r.skipped} skipped (duplicate slugs), ${r.failed} failed.`,
            { icon: "⚠️" }
          );
        }
      } else {
        toast.error("Import failed — server returned an error");
      }
    } catch {
      toast.error("Import failed — could not reach server");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-slate-900 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Upload className="w-5 h-5 text-emerald-400" />
            Import Exercises
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a JSON file exported from this library. Duplicate slugs are
            skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {!result && (
            <div>
              <Label htmlFor="import-file" className="text-slate-300 mb-2 block text-sm">
                JSON file
              </Label>
              <div
                className="relative flex items-center justify-center border-2 border-dashed border-white/15 rounded-xl p-8 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition-colors group"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  id="import-file"
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileJson className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300">
                    Click to select a .json file
                  </span>
                  <span className="text-xs text-slate-600">
                    Accepts export format or raw array — max 2,000 exercises
                  </span>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {parseState.status === "parsed" && !result && (
              <motion.div
                key="parsed"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-300">
                      {parseState.count} exercise{parseState.count !== 1 ? "s" : ""} ready
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All rows passed basic validation
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {parseState.status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">Parse error</p>
                  <p className="text-xs text-slate-400 mt-0.5">{parseState.message}</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Inserted", value: result.inserted, color: "text-emerald-400" },
                    { label: "Skipped", value: result.skipped, color: "text-amber-400" },
                    { label: "Failed", value: result.failed, color: "text-red-400" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center"
                    >
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {result.errors.length > 0 && (
                  <details className="text-xs text-slate-400">
                    <summary className="cursor-pointer hover:text-slate-300 select-none">
                      {result.errors.length} error{result.errors.length !== 1 ? "s" : ""} (click to expand)
                    </summary>
                    <ul className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                      {result.errors.map((e, i) => (
                        <li key={i} className="font-mono text-[11px] text-slate-500">
                          [{e.index}] {e.name} — {e.error}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="border-white/15 text-slate-300 hover:bg-white/10 hover:text-white"
              disabled={importing}
            >
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button
                onClick={handleImport}
                disabled={parseState.status !== "parsed" || importing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {parseState.status === "parsed" ? `${parseState.count} exercises` : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
