# Exercises Import & Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Import (JSON upload) and Export (paged JSON download) buttons to the Admin Exercises header row, backed by an already-implemented server endpoint.

**Architecture:** The entire backend stack is already live — `importExercisesSchema`, `POST /api/admin/exercises/import`, controller, and `adminImportExercises` service are all implemented. The client service method `adminExercisesService.importExercises()` also exists. Work is: (1) unit-test the service function, (2) build the `ImportExercisesModal` component, (3) wire both Import + Export into `page.tsx`.

**Tech Stack:** TypeScript, React, Next.js 14 App Router, Framer Motion, shadcn/ui (`Dialog`, `Button`, `Input`, `Label`), lucide-react (`Upload`, `Download`), react-hot-toast, Jest (Bun) for tests.

---

## File Map

| Status | File | Change |
|--------|------|--------|
| Modify | `server/tests/unit/services/exercise-library.service.test.ts` | Add `adminImportExercises` describe block |
| **Create** | `client/app/(pages)/admin/exercises/components/ImportExercisesModal.tsx` | New Dialog component |
| Modify | `client/app/(pages)/admin/exercises/page.tsx` | Add state, icons, buttons, modal, handleExport |

---

## Task 1: Unit-test `adminImportExercises`

**Files:**
- Modify: `server/tests/unit/services/exercise-library.service.test.ts`

The existing test file uses `jest.unstable_mockModule` for `pg.js`. We need to add `adminCreateExercise`/`adminInsertExerciseRow` — actually the service calls `adminInsertExerciseRow` (a private helper that calls `query`). Each successful insert returns a row; a duplicate triggers a Postgres unique-violation error (code `'23505'`).

- [ ] **Step 1: Open the test file and locate the dynamic import line**

In `server/tests/unit/services/exercise-library.service.test.ts`, find:

```typescript
const {
  listExercises,
  listExercisesCursor,
  searchExercises,
  getExerciseById,
  getExerciseBySlug,
  getAvailableFilters,
  getExerciseStats,
  getETag,
} = await import('../../../src/services/exercise-library.service.js');
```

Replace it with (add `adminImportExercises` and `adminCreateExercise`):

```typescript
const {
  listExercises,
  listExercisesCursor,
  searchExercises,
  getExerciseById,
  getExerciseBySlug,
  getAvailableFilters,
  getExerciseStats,
  getETag,
  adminImportExercises,
} = await import('../../../src/services/exercise-library.service.js');
```

Also add the ingestion service mock **before** the dynamic import block (alongside the other `jest.unstable_mockModule` calls):

```typescript
jest.unstable_mockModule('../../../src/services/exercise-ingestion.service.js', () => ({
  invalidateExerciseCache: jest.fn(),
  ingestFromExerciseDB: jest.fn(),
  ingestFromMuscleWiki: jest.fn(),
}));
```

- [ ] **Step 2: Run existing tests to ensure they still pass before adding new ones**

```bash
cd server && bun test tests/unit/services/exercise-library.service.test.ts
```

Expected: all existing tests pass (no failures from adding the mock).

- [ ] **Step 3: Add the `adminImportExercises` describe block at the end of the top-level `describe('ExerciseLibraryService')` block**

Add this inside the existing `describe('ExerciseLibraryService', () => { ... })` at the bottom, before the closing `}`:

```typescript
  // ------------------------------------------
  // adminImportExercises
  // ------------------------------------------
  describe('adminImportExercises', () => {
    const minimalInput = {
      name: 'Push Up',
      category: 'strength' as const,
      difficulty_level: 'beginner' as const,
    };

    it('should insert a single exercise and return inserted=1, skipped=0, failed=0', async () => {
      // adminInsertExerciseRow calls query() twice: INSERT + SELECT
      const insertedRow = makeExerciseRow({ id: 'new-uuid', name: 'Push Up', source: 'manual', is_system: false });
      mockQuery
        .mockResolvedValueOnce(qr([insertedRow])) // INSERT ... RETURNING
        .mockResolvedValueOnce(qr([insertedRow])); // SELECT (fetchById)

      const result = await adminImportExercises([minimalInput]);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should count duplicate slug as skipped and record in errors[]', async () => {
      const uniqueViolation = Object.assign(new Error('duplicate key'), {
        code: '23505',
        constraint: 'exercises_slug_key',
      });
      mockQuery.mockRejectedValueOnce(uniqueViolation);

      const result = await adminImportExercises([minimalInput]);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.error).toMatch(/duplicate/i);
    });

    it('should count non-unique DB errors as failed', async () => {
      const dbError = new Error('connection refused');
      mockQuery.mockRejectedValueOnce(dbError);

      const result = await adminImportExercises([minimalInput]);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0]!.error).toBe('connection refused');
    });

    it('should process a mixed batch: 2 inserted, 1 skipped, 1 failed', async () => {
      const row = makeExerciseRow({ id: 'x' });
      const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' });
      const dbError = new Error('timeout');

      mockQuery
        // item 0: success (INSERT + SELECT)
        .mockResolvedValueOnce(qr([row]))
        .mockResolvedValueOnce(qr([row]))
        // item 1: success
        .mockResolvedValueOnce(qr([row]))
        .mockResolvedValueOnce(qr([row]))
        // item 2: duplicate slug
        .mockRejectedValueOnce(uniqueViolation)
        // item 3: DB error
        .mockRejectedValueOnce(dbError);

      const items = [
        { ...minimalInput, name: 'A' },
        { ...minimalInput, name: 'B' },
        { ...minimalInput, name: 'C' },
        { ...minimalInput, name: 'D' },
      ];

      const result = await adminImportExercises(items);

      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(2);
    });

    it('should not call invalidateExerciseCache when no rows are inserted', async () => {
      const { invalidateExerciseCache } = await import('../../../src/services/exercise-ingestion.service.js');
      const uniqueViolation = Object.assign(new Error('dup'), { code: '23505' });
      mockQuery.mockRejectedValueOnce(uniqueViolation);

      await adminImportExercises([minimalInput]);

      expect(invalidateExerciseCache).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 4: Run the new tests**

```bash
cd server && bun test tests/unit/services/exercise-library.service.test.ts
```

Expected: all tests pass including the 5 new `adminImportExercises` cases.

- [ ] **Step 5: Commit**

```bash
git add server/tests/unit/services/exercise-library.service.test.ts
git commit -m "test(exercises): add adminImportExercises unit tests — insert, skip, fail, mixed batch, cache guard"
```

---

## Task 2: Build `ImportExercisesModal`

**Files:**
- Create: `client/app/(pages)/admin/exercises/components/ImportExercisesModal.tsx`

This component follows the same pattern as `SyncExercisesModal.tsx` (same Dialog/Button/toast conventions).

- [ ] **Step 1: Create the file with the full implementation**

Create `client/app/(pages)/admin/exercises/components/ImportExercisesModal.tsx`:

```tsx
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

// ============================================
// TYPES
// ============================================

interface ImportExercisesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type ParseState =
  | { status: "idle" }
  | { status: "parsed"; count: number; exercises: CreateExercisePayload[] }
  | { status: "error"; message: string };

// ============================================
// HELPERS
// ============================================

/** Fields to omit when mapping exported rows → import payload */
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
  return cleaned as CreateExercisePayload;
}

function parseFile(file: File): Promise<CreateExercisePayload[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") throw new Error("Could not read file");
        const json = JSON.parse(text);

        // Accept { exercises: [...] } (our export format) or a raw array
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

        // Validate each row has at minimum name + category + difficulty_level
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

// ============================================
// COMPONENT
// ============================================

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
          {/* File picker */}
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

          {/* Parse feedback */}
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

            {/* Import result */}
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

          {/* Actions */}
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
                    Importing…
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
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit -p tsconfig.json 2>&1 | grep ImportExercisesModal
```

Expected: no output (no errors for this file).

- [ ] **Step 3: Commit**

```bash
git add client/app/\(pages\)/admin/exercises/components/ImportExercisesModal.tsx
git commit -m "feat(exercises): add ImportExercisesModal — file picker, parse, validate, confirm, result summary"
```

---

## Task 3: Wire Import + Export into `page.tsx`

**Files:**
- Modify: `client/app/(pages)/admin/exercises/page.tsx`

There are 4 changes to `page.tsx`:
1. Add `Upload` and `Download` to lucide imports
2. Import `ImportExercisesModal`
3. Add state: `importModalOpen`, `isExporting`
4. Add `handleExport` function (paged loop → JSON download)
5. Render two new buttons and the modal

- [ ] **Step 1: Add icons to the existing lucide-react import block**

Find the existing import:

```typescript
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
  Grid3x3,
  List,
  ArrowUpDown,
  Dumbbell,
  RefreshCw,
  Target,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  Flame,
  ListOrdered,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
```

Replace with (adds `Upload` and `Download`):

```typescript
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
  Grid3x3,
  List,
  ArrowUpDown,
  Dumbbell,
  RefreshCw,
  Target,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  Flame,
  ListOrdered,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  Upload,
  Download,
} from "lucide-react";
```

- [ ] **Step 2: Add `ImportExercisesModal` import below the existing component imports**

Find:

```typescript
import { SyncExercisesModal } from "./components/SyncExercisesModal";
```

Replace with:

```typescript
import { SyncExercisesModal } from "./components/SyncExercisesModal";
import { ImportExercisesModal } from "./components/ImportExercisesModal";
```

- [ ] **Step 3: Add state variables**

Find the existing state block that has `syncModalOpen`:

```typescript
  const [syncModalOpen, setSyncModalOpen] = useState(false);
```

Replace with:

```typescript
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
```

- [ ] **Step 4: Add `handleExport` function**

After the `fetchStats` callback (which ends around line 200), add:

```typescript
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const allExercises: ExerciseListItem[] = [];
      let currentPage = 1;
      let hasMore = true;

      // Build filter params matching current table state
      const filterParams: Record<string, string | number> = {
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 100,
      };
      if (searchQuery) filterParams.search = searchQuery;
      if (categoryFilter !== "all") filterParams.category = categoryFilter;
      if (difficultyFilter !== "all") filterParams.difficulty = difficultyFilter;
      if (sourceFilter !== "all") filterParams.source = sourceFilter;
      if (activeFilter !== "all")
        filterParams.is_active = activeFilter === "active" ? "true" : "false";

      while (hasMore) {
        const response = await adminExercisesService.list({
          ...filterParams,
          page: currentPage,
        });

        if (!response.success || !response.data) break;

        allExercises.push(...response.data);

        const meta = response.meta;
        hasMore =
          !!meta &&
          typeof meta.totalPages === "number" &&
          currentPage < meta.totalPages;
        currentPage += 1;
      }

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        filterSummary: {
          search: searchQuery || null,
          category: categoryFilter !== "all" ? categoryFilter : null,
          difficulty: difficultyFilter !== "all" ? difficultyFilter : null,
          source: sourceFilter !== "all" ? sourceFilter : null,
          is_active: activeFilter !== "all" ? activeFilter : null,
        },
        total: allExercises.length,
        exercises: allExercises,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exercises-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allExercises.length} exercises`);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [searchQuery, categoryFilter, difficultyFilter, sourceFilter, activeFilter, sortBy, sortOrder]);
```

- [ ] **Step 5: Add Import and Export buttons to the header action row**

Find the existing header action row:

```tsx
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={() => setSyncModalOpen(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync APIs
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => { setEditingExercise(null); setCreateEditModalOpen(true); }}
                className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg shadow-emerald-900/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Exercise
              </Button>
            </motion.div>
          </div>
```

Replace with (inserts Export + Import between Sync and Create):

```tsx
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={() => setSyncModalOpen(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync APIs
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => { setEditingExercise(null); setCreateEditModalOpen(true); }}
                className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg shadow-emerald-900/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Exercise
              </Button>
            </motion.div>
          </div>
```

- [ ] **Step 6: Render `ImportExercisesModal` alongside the other modals**

Find:

```tsx
      <SyncExercisesModal
        open={syncModalOpen}
        onOpenChange={setSyncModalOpen}
        onSyncComplete={() => { fetchExercises(); fetchStats(); }}
      />
```

Add below it:

```tsx
      <ImportExercisesModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => { fetchExercises(); fetchStats(); }}
      />
```

- [ ] **Step 7: TypeScript check**

```bash
cd client && npx tsc --noEmit -p tsconfig.json 2>&1 | grep "admin/exercises"
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add client/app/\(pages\)/admin/exercises/page.tsx
git commit -m "feat(exercises): wire Import + Export buttons into admin exercises header"
```

---

## Self-Review

**Spec coverage:**
- ✅ Export: paged `adminExercisesService.list` loop (limit 100), respects current filter state, downloads `exercises-export-YYYY-MM-DD.json`, loading state + toast
- ✅ Import: modal with file picker, parse, count display, confirm button, POST to backend, `{ inserted, skipped, errors[] }` summary, calls `fetchExercises + fetchStats`
- ✅ JSON shape: `mapToPayload` strips server-only fields (`id`, `created_at`, `updated_at`, `is_system`, `source`, `source_id`, `version`, `external_metadata`)
- ✅ Duplicates: backend `adminImportExercises` already catches `23505`, counts as `skipped`; tested in Task 1
- ✅ Backend validator: `importExercisesSchema` already exists with `min(1).max(2000)`
- ✅ Backend service/controller/route: all already implemented — no new backend code required
- ✅ Client service `importExercises()`: already exists
- ✅ Tests: 5 cases covering insert, skip, fail, mixed batch, cache invalidation guard
- ✅ Export metadata: `version`, `exportedAt`, `filterSummary`, `total`

**Placeholder scan:** No TBDs, TODOs, or vague steps. All code blocks complete.

**Type consistency:** `CreateExercisePayload` and `AdminImportExercisesResult` referenced from `admin-exercises.service.ts` throughout — consistent. `ExerciseListItem` used in export — same type as `page.tsx`.
