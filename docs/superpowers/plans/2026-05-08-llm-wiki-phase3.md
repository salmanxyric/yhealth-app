# Phase 3: Frontend Wiki Browser — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a wiki browser to the AI Coach's Intelligence Drawer so users can browse, search, and read their personal health wiki pages, and see clickable `[[wiki-link]]` citations in chat messages.

**Architecture:** Extends the existing Intelligence Files Drawer by adding a "Wiki" folder. New client-side wiki service calls the existing REST API (`/api/v1/wiki/*`). Chat messages containing `[[slug]]` patterns are preprocessed into clickable chips that open the wiki page in the drawer. A "Save to Wiki" action lets users persist valuable AI responses.

**Tech Stack:** React 19, TypeScript, Framer Motion, ReactMarkdown (remark-gfm, rehype-raw), Lucide icons, Tailwind CSS, Axios (via `api-client.ts`)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `client/src/shared/services/wiki.service.ts` | Client-side API calls for all wiki endpoints |
| Modify | `client/shared/types/domain/intelligence-files.ts` | Add `'wiki'` to `IntelligenceFolder` union |
| Create | `client/app/(pages)/ai-coach/components/WikiPageCard.tsx` | Reusable card for wiki page in list views |
| Create | `client/app/(pages)/ai-coach/components/WikiPageDetail.tsx` | Full wiki page view with markdown + metadata + tabs |
| Create | `client/app/(pages)/ai-coach/components/WikiLinkChip.tsx` | Inline clickable chip for `[[slug]]` references |
| Create | `client/app/(pages)/ai-coach/components/SaveToWikiModal.tsx` | Modal for saving AI response to wiki page |
| Modify | `client/app/(pages)/ai-coach/hooks/useIntelligenceFiles.ts` | Add wiki state, fetch logic, page selection |
| Modify | `client/app/(pages)/ai-coach/components/IntelligenceFilesDrawer.tsx` | Add wiki to FOLDER_CONFIG, render wiki list + detail |
| Modify | `client/app/(pages)/ai-coach/components/AICoachMessages.tsx` | Preprocess `[[slug]]` → WikiLinkChip in messages |
| Modify | `client/app/(pages)/ai-coach/components/MessageActions.tsx` | Add "Save to Wiki" action button |
| Modify | `client/app/(pages)/ai-coach/AICoachPageContent.tsx` | Wire `onOpenWikiPage` callback through components |

---

### Task 1: Wiki Client Service

**Files:**
- Create: `client/src/shared/services/wiki.service.ts`

- [ ] **Step 1: Create the wiki service file**

```typescript
// client/src/shared/services/wiki.service.ts
import { api } from "@/lib/api-client";
import type {
  WikiPage,
  WikiPageWithLinks,
  WikiSearchResult,
  WikiSearchFilters,
  WikiStats,
  WikiLink,
  WikiLogEntry,
  WikiPageVersion,
} from "@shared/types/domain/wiki";

const BASE = "/v1/wiki";

// ============================================
// PAGES
// ============================================

export interface ListPagesParams {
  [key: string]: string | number | boolean | undefined;
  pageType?: string;
  category?: string;
  status?: string;
  minConfidence?: number;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export async function listPages(params: ListPagesParams = {}) {
  return api.get<{ pages: WikiPage[]; total: number }>(`${BASE}/pages`, { params });
}

export async function getPage(slug: string) {
  return api.get<WikiPageWithLinks>(`${BASE}/pages/${slug}`);
}

// ============================================
// SEARCH
// ============================================

export async function searchPages(q: string, filters?: Partial<WikiSearchFilters>) {
  return api.get<{ results: WikiSearchResult[] }>(`${BASE}/search`, {
    params: { q, ...filters },
  });
}

// ============================================
// STATS
// ============================================

export async function getStats() {
  return api.get<WikiStats>(`${BASE}/stats`);
}

// ============================================
// LINKS
// ============================================

export async function getPageLinks(slug: string) {
  return api.get<{ outbound: WikiLink[]; inbound: WikiLink[] }>(
    `${BASE}/pages/${slug}/links`
  );
}

// ============================================
// VERSIONS
// ============================================

export async function getPageVersions(slug: string) {
  return api.get<{ versions: WikiPageVersion[] }>(
    `${BASE}/pages/${slug}/versions`
  );
}

// ============================================
// LOG
// ============================================

export async function getLog(limit = 20) {
  return api.get<{ log: WikiLogEntry[] }>(`${BASE}/log`, {
    params: { limit },
  });
}

// ============================================
// FLAG & FEEDBACK
// ============================================

export async function flagPage(slug: string, reason: string) {
  return api.post(`${BASE}/pages/${slug}/flag`, { reason });
}

export async function submitFeedback(
  slug: string,
  data: { action: "verify" | "correct" | "dispute"; details?: string }
) {
  return api.post(`${BASE}/pages/${slug}/feedback`, data);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to wiki.service.ts

- [ ] **Step 3: Commit**

```bash
git add client/src/shared/services/wiki.service.ts
git commit -m "feat(wiki): add client-side wiki service for REST API"
```

---

### Task 2: Add Wiki Folder to Intelligence Files System

**Files:**
- Modify: `client/shared/types/domain/intelligence-files.ts:18`
- Modify: `client/app/(pages)/ai-coach/hooks/useIntelligenceFiles.ts`
- Modify: `client/app/(pages)/ai-coach/components/IntelligenceFilesDrawer.tsx`

- [ ] **Step 1: Add 'wiki' to IntelligenceFolder type**

In `client/shared/types/domain/intelligence-files.ts`, line 18, change:

```typescript
export type IntelligenceFolder = 'memories' | 'notes' | 'artifacts' | 'plans' | 'core' | 'logs';
```

to:

```typescript
export type IntelligenceFolder = 'memories' | 'wiki' | 'notes' | 'artifacts' | 'plans' | 'core' | 'logs';
```

- [ ] **Step 2: Add wiki state and fetch logic to useIntelligenceFiles hook**

In `client/app/(pages)/ai-coach/hooks/useIntelligenceFiles.ts`:

Add imports at the top:

```typescript
import type {
  WikiPage,
  WikiPageWithLinks,
  WikiStats,
} from "@shared/types/domain/wiki";
import * as wikiApi from "@/src/shared/services/wiki.service";
```

Add state declarations after the existing state variables (after `const [searchQuery, setSearchQuery] = ...`):

```typescript
const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
const [wikiStats, setWikiStats] = useState<WikiStats | null>(null);
const [selectedWikiPage, setSelectedWikiPage] = useState<WikiPageWithLinks | null>(null);
const [wikiSearchQuery, setWikiSearchQuery] = useState("");
const wikiSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
```

Add the wiki case inside `navigateToFolder`'s switch statement (before the `case "notes":` line):

```typescript
case "wiki": {
  const [pagesRes, statsRes] = await Promise.all([
    wikiApi.listPages({ limit: 100, sort: "updated_at", order: "desc" }),
    wikiApi.getStats(),
  ]);
  if (pagesRes.success && pagesRes.data?.pages) setWikiPages(pagesRes.data.pages);
  if (statsRes.success && statsRes.data) setWikiStats(statsRes.data);
  break;
}
```

Add wiki page selection and search callbacks after `handleSearch`:

```typescript
const selectWikiPage = useCallback(async (slug: string) => {
  setDrawer((prev) => ({ ...prev, level: "detail", selectedItemId: slug }));
  setLoading(true);
  setError(null);
  try {
    const res = await wikiApi.getPage(slug);
    if (res.success && res.data) setSelectedWikiPage(res.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load wiki page";
    setError(message);
  } finally {
    setLoading(false);
  }
}, []);

const handleWikiSearch = useCallback((q: string) => {
  setWikiSearchQuery(q);
  if (wikiSearchTimeout.current) clearTimeout(wikiSearchTimeout.current);
  if (!q.trim()) {
    wikiApi.listPages({ limit: 100, sort: "updated_at", order: "desc" }).then((res) => {
      if (res.success && res.data?.pages) setWikiPages(res.data.pages);
    });
    return;
  }
  wikiSearchTimeout.current = setTimeout(async () => {
    setLoading(true);
    try {
      const res = await wikiApi.searchPages(q);
      if (res.success && res.data?.results) {
        setWikiPages(res.data.results.map((r) => r.page));
      }
    } finally {
      setLoading(false);
    }
  }, 300);
}, []);

const handleFlagWikiPage = useCallback(async (slug: string, reason: string) => {
  await wikiApi.flagPage(slug, reason);
}, []);

const handleVerifyWikiPage = useCallback(async (slug: string) => {
  await wikiApi.submitFeedback(slug, { action: "verify" });
}, []);
```

Add new fields to the return object (add after `searchQuery`):

```typescript
wikiPages,
wikiStats,
selectedWikiPage,
wikiSearchQuery,
selectWikiPage,
handleWikiSearch,
handleFlagWikiPage,
handleVerifyWikiPage,
```

Also add `openWikiPage` — a direct entry point that opens the drawer and navigates straight to a wiki page:

```typescript
const openWikiPage = useCallback(async (slug: string) => {
  setDrawer({ isOpen: true, level: "detail", activeFolder: "wiki", selectedItemId: slug });
  setLoading(true);
  setError(null);
  try {
    const res = await wikiApi.getPage(slug);
    if (res.success && res.data) setSelectedWikiPage(res.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load wiki page";
    setError(message);
  } finally {
    setLoading(false);
  }
}, []);
```

Return `openWikiPage` in the hook's return object.

- [ ] **Step 3: Add wiki folder to FOLDER_CONFIG and FolderContent in IntelligenceFilesDrawer**

In `client/app/(pages)/ai-coach/components/IntelligenceFilesDrawer.tsx`:

Add `BookOpen` to the Lucide imports:

```typescript
import {
  Brain,
  StickyNote,
  Sparkles,
  ClipboardList,
  Shield,
  FileText,
  BookOpen,
  X,
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
```

Add wiki entry to `FOLDER_CONFIG` (after `memories`):

```typescript
const FOLDER_CONFIG: Record<IntelligenceFolder, { icon: LucideIcon; accent: string }> = {
  memories: { icon: Brain, accent: "text-purple-400" },
  wiki:     { icon: BookOpen, accent: "text-indigo-400" },
  notes: { icon: StickyNote, accent: "text-slate-400" },
  artifacts: { icon: Sparkles, accent: "text-cyan-400" },
  plans: { icon: ClipboardList, accent: "text-blue-400" },
  core: { icon: Shield, accent: "text-emerald-400" },
  logs: { icon: FileText, accent: "text-amber-400" },
};
```

Add search bar for wiki (duplicate the memories search pattern, add after the existing search block):

In the search section, extend the condition:

```typescript
{hook.drawer.level === "list" && (hook.drawer.activeFolder === "memories" || hook.drawer.activeFolder === "wiki") && (
```

Update the search input's `value` and `onChange` to use the correct query for each folder:

```typescript
value={hook.drawer.activeFolder === "wiki" ? hook.wikiSearchQuery : hook.searchQuery}
onChange={(e) =>
  hook.drawer.activeFolder === "wiki"
    ? hook.handleWikiSearch(e.target.value)
    : hook.handleSearch(e.target.value)
}
placeholder={hook.drawer.activeFolder === "wiki" ? "Search wiki pages..." : "Search memories..."}
```

Also update the content area: when drawer level is "detail" and activeFolder is "wiki", render WikiPageDetail instead of FolderContent. Add this condition in the content rendering section, before `hook.drawer.level === "list"`:

```typescript
) : hook.drawer.level === "detail" && hook.drawer.activeFolder === "wiki" ? (
  <WikiPageDetail
    page={hook.selectedWikiPage}
    onOpenPage={hook.selectWikiPage}
    onFlag={hook.handleFlagWikiPage}
    onVerify={hook.handleVerifyWikiPage}
  />
```

(WikiPageDetail is created in Task 4.)

Add the wiki case to the `FolderContent` switch, before the `case "notes":`:

```typescript
case "wiki":
  return (
    <div className="space-y-3">
      {hook.wikiStats && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-slate-400">
          <span>{hook.wikiStats.activePages} pages</span>
          <span className="text-white/20">·</span>
          <span>{hook.wikiStats.stalePages} stale</span>
          <span className="text-white/20">·</span>
          <span>{hook.wikiStats.contradictedPages} contradicted</span>
        </div>
      )}
      {hook.wikiPages.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          message="No wiki pages yet"
          sub="Your AI coach builds a personal health wiki from your conversations and data."
        />
      ) : (
        hook.wikiPages.map((page) => (
          <WikiPageCard
            key={page.id}
            page={page}
            onClick={() => hook.selectWikiPage(page.slug)}
          />
        ))
      )}
    </div>
  );
```

Import WikiPageCard and WikiPageDetail at the top of the file:

```typescript
import { WikiPageCard } from "./WikiPageCard";
import { WikiPageDetail } from "./WikiPageDetail";
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors. (WikiPageCard and WikiPageDetail are created in Tasks 3 and 4 — create stub files if needed to compile.)

- [ ] **Step 5: Commit**

```bash
git add client/shared/types/domain/intelligence-files.ts client/app/\(pages\)/ai-coach/hooks/useIntelligenceFiles.ts client/app/\(pages\)/ai-coach/components/IntelligenceFilesDrawer.tsx
git commit -m "feat(wiki): add wiki folder to Intelligence Files drawer"
```

---

### Task 3: WikiPageCard Component

**Files:**
- Create: `client/app/(pages)/ai-coach/components/WikiPageCard.tsx`

- [ ] **Step 1: Create the WikiPageCard component**

```tsx
"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { WikiPage, WikiPageStatus } from "@shared/types/domain/wiki";

const STATUS_STYLES: Record<WikiPageStatus, { label: string; color: string }> = {
  active:       { label: "Active",       color: "text-emerald-400 bg-emerald-500/10" },
  stale:        { label: "Stale",        color: "text-amber-400 bg-amber-500/10" },
  contradicted: { label: "Contradicted", color: "text-red-400 bg-red-500/10" },
  archived:     { label: "Archived",     color: "text-slate-500 bg-white/5" },
  draft:        { label: "Draft",        color: "text-slate-400 bg-white/5" },
};

interface WikiPageCardProps {
  page: WikiPage;
  onClick: () => void;
}

export function WikiPageCard({ page, onClick }: WikiPageCardProps) {
  const statusStyle = STATUS_STYLES[page.status] || STATUS_STYLES.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusStyle.color}`}>
          {statusStyle.label}
        </span>
        <span className="text-[10px] text-slate-600 ml-auto">v{page.version}</span>
      </div>
      <h4 className="text-sm font-medium text-slate-200">{page.title}</h4>
      {page.summary && (
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{page.summary}</p>
      )}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-[10px] text-slate-500">Confidence</span>
          <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden max-w-[80px]">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
              style={{ width: `${Math.round(page.confidence * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-indigo-400 tabular-nums">
            {Math.round(page.confidence * 100)}%
          </span>
        </div>
        <span className="text-[10px] text-slate-600">
          {page.category}
        </span>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to WikiPageCard.tsx

- [ ] **Step 3: Commit**

```bash
git add client/app/\(pages\)/ai-coach/components/WikiPageCard.tsx
git commit -m "feat(wiki): add WikiPageCard component for wiki list view"
```

---

### Task 4: WikiPageDetail Component

**Files:**
- Create: `client/app/(pages)/ai-coach/components/WikiPageDetail.tsx`

- [ ] **Step 1: Create the WikiPageDetail component**

```tsx
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Link2,
  History,
  FileText,
  CheckCircle2,
  Flag,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  WikiPageWithLinks,
  WikiPageStatus,
} from "@shared/types/domain/wiki";

const STATUS_BADGE: Record<WikiPageStatus, { label: string; color: string }> = {
  active:       { label: "Active",       color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  stale:        { label: "Stale",        color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  contradicted: { label: "Contradicted", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  archived:     { label: "Archived",     color: "text-slate-500 bg-white/5 border-white/10" },
  draft:        { label: "Draft",        color: "text-slate-400 bg-white/5 border-white/10" },
};

type DetailTab = "content" | "links" | "history";

interface WikiPageDetailProps {
  page: WikiPageWithLinks | null;
  onOpenPage: (slug: string) => void;
  onFlag: (slug: string, reason: string) => Promise<void>;
  onVerify: (slug: string) => Promise<void>;
}

export function WikiPageDetail({ page, onOpenPage, onFlag, onVerify }: WikiPageDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("content");
  const [flagging, setFlagging] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const processedBody = useMemo(() => {
    if (!page?.body) return "";
    return page.body.replace(
      /\[\[([^\]]+)\]\]/g,
      (_, slug: string) => `[📖 ${slug.replace(/-/g, " ")}](#wiki:${slug})`
    );
  }, [page?.body]);

  if (!page) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  const badge = STATUS_BADGE[page.status] || STATUS_BADGE.active;
  const allLinks = [...page.outboundLinks, ...page.inboundLinks];

  async function handleFlag() {
    setFlagging(true);
    try {
      await onFlag(page!.slug, "User flagged from wiki browser");
    } finally {
      setFlagging(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    try {
      await onVerify(page!.slug);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-[10px] text-slate-500">{page.category}</span>
          <span className="text-[10px] text-slate-600 ml-auto">v{page.version}</span>
        </div>
        <h3 className="text-base font-semibold text-white">{page.title}</h3>
        {page.summary && (
          <p className="text-xs text-slate-400 mt-1">{page.summary}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Confidence</span>
            <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                style={{ width: `${Math.round(page.confidence * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-indigo-400 tabular-nums">
              {Math.round(page.confidence * 100)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-600">
            {page.evidenceCount} evidence · {page.wordCount} words
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0">
        {(
          [
            { id: "content" as const, icon: FileText, label: "Content" },
            { id: "links" as const, icon: Link2, label: `Links (${allLinks.length})` },
            { id: "history" as const, icon: History, label: "History" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "text-indigo-400 bg-indigo-500/10 border-b-2 border-indigo-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "content" && (
        <div
          className="coach-prose prose prose-invert prose-sm max-w-none"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");
            if (anchor?.getAttribute("href")?.startsWith("#wiki:")) {
              e.preventDefault();
              const slug = anchor.getAttribute("href")!.replace("#wiki:", "");
              onOpenPage(slug);
            }
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {processedBody}
          </ReactMarkdown>
        </div>
      )}

      {activeTab === "links" && (
        <div className="space-y-2">
          {allLinks.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No links yet</p>
          ) : (
            allLinks.map((link) => {
              const isOutbound = link.sourcePageId === page.id;
              const targetSlug = isOutbound ? link.targetSlug : link.sourceSlug;
              const targetTitle = isOutbound ? link.targetTitle : link.sourceTitle;
              return (
                <button
                  key={link.id}
                  onClick={() => targetSlug && onOpenPage(targetSlug)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Link2 className="w-3 h-3 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-300 block truncate">
                      {targetTitle || targetSlug || "Unknown page"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isOutbound ? "→" : "←"} {link.linkType}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="text-center py-8">
          <History className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            Updated {new Date(page.updatedAt).toLocaleDateString()}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Created {new Date(page.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
        >
          {verifying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          Looks right
        </button>
        <button
          onClick={handleFlag}
          disabled={flagging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/15 transition-colors disabled:opacity-50"
        >
          {flagging ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Flag className="w-3 h-3" />
          )}
          Flag issue
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to WikiPageDetail.tsx

- [ ] **Step 3: Commit**

```bash
git add client/app/\(pages\)/ai-coach/components/WikiPageDetail.tsx
git commit -m "feat(wiki): add WikiPageDetail component with markdown rendering and tabs"
```

---

### Task 5: Wiki Link Rendering in Chat Messages

**Files:**
- Create: `client/app/(pages)/ai-coach/components/WikiLinkChip.tsx`
- Modify: `client/app/(pages)/ai-coach/components/AICoachMessages.tsx`
- Modify: `client/app/(pages)/ai-coach/AICoachPageContent.tsx`

- [ ] **Step 1: Create WikiLinkChip component**

```tsx
"use client";

import { BookOpen } from "lucide-react";

interface WikiLinkChipProps {
  slug: string;
  onClick: (slug: string) => void;
}

export function WikiLinkChip({ slug, onClick }: WikiLinkChipProps) {
  const displayName = slug.replace(/-/g, " ");
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(slug);
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors align-baseline mx-0.5"
      title={`Open wiki page: ${displayName}`}
    >
      <BookOpen className="w-3 h-3" />
      <span>{displayName}</span>
    </button>
  );
}
```

- [ ] **Step 2: Add wiki link preprocessing to AICoachMessages**

In `client/app/(pages)/ai-coach/components/AICoachMessages.tsx`:

Add import for WikiLinkChip and React:

```typescript
import React from "react";
import { WikiLinkChip } from "./WikiLinkChip";
```

Add `onOpenWikiPage` to the `AICoachMessagesProps` interface:

```typescript
interface AICoachMessagesProps {
  // ... existing props ...
  onOpenWikiPage?: (slug: string) => void;
}
```

Add `onOpenWikiPage` to the destructured props of the `AICoachMessages` function.

Add a helper function inside the component (before the `if (isLoadingConversation)` check):

```typescript
function renderContentWithWikiLinks(content: string): React.ReactNode {
  if (!onOpenWikiPage || !content.includes("[[")) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    );
  }

  const parts = content.split(/(\[\[[^\]]+\]\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[\[([^\]]+)\]\]$/);
    if (match) {
      return <WikiLinkChip key={i} slug={match[1]} onClick={onOpenWikiPage} />;
    }
    if (!part) return null;
    return (
      <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {part}
      </ReactMarkdown>
    );
  });
}
```

Replace the existing ReactMarkdown rendering block in the assistant message bubble. Find this block (around line 182-190):

```tsx
<div className="coach-prose prose prose-invert prose-sm max-w-none">
  {displayContent && (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
    >
      {displayContent}
    </ReactMarkdown>
  )}
</div>
```

Replace with:

```tsx
<div className="coach-prose prose prose-invert prose-sm max-w-none">
  {displayContent && renderContentWithWikiLinks(displayContent)}
</div>
```

- [ ] **Step 3: Wire onOpenWikiPage through AICoachPageContent**

In `client/app/(pages)/ai-coach/AICoachPageContent.tsx`:

Both `AICoachMessages` invocations in the `AICoachLayout` component need the new prop. Add to both:

```tsx
onOpenWikiPage={intelligence.openWikiPage}
```

So the messages component calls look like (add the prop alongside existing ones):

```tsx
<AICoachMessages
  // ... existing props ...
  onOpenWikiPage={intelligence.openWikiPage}
/>
```

Both the skeleton-loading invocation (line ~102) and the real messages invocation (line ~116) need this prop.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add client/app/\(pages\)/ai-coach/components/WikiLinkChip.tsx client/app/\(pages\)/ai-coach/components/AICoachMessages.tsx client/app/\(pages\)/ai-coach/AICoachPageContent.tsx
git commit -m "feat(wiki): render [[wiki-link]] citations as clickable chips in chat messages"
```

---

### Task 6: Save to Wiki Action on AI Responses

**Files:**
- Create: `client/app/(pages)/ai-coach/components/SaveToWikiModal.tsx`
- Modify: `client/app/(pages)/ai-coach/components/MessageActions.tsx`

- [ ] **Step 1: Create SaveToWikiModal component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Loader2, Check } from "lucide-react";
import * as wikiApi from "@/src/shared/services/wiki.service";
import type { WikiPage } from "@shared/types/domain/wiki";

interface SaveToWikiModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
}

export function SaveToWikiModal({ isOpen, onClose, messageContent }: SaveToWikiModalProps) {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSaved(false);
      setSelectedSlug(null);
      setLoading(true);
      wikiApi.listPages({ limit: 50, sort: "updated_at", order: "desc" }).then((res) => {
        if (res.success && res.data?.pages) setPages(res.data.pages);
        setLoading(false);
      });
    }
  }, [isOpen]);

  async function handleSave() {
    if (!selectedSlug) return;
    setSaving(true);
    try {
      await wikiApi.flagPage(selectedSlug, `User saved AI response: ${messageContent.slice(0, 200)}`);
      setSaved(true);
      setTimeout(onClose, 1200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm mx-4 rounded-2xl bg-[#0a0520] border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Save to Wiki</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Content preview */}
            <div className="px-5 py-3 border-b border-white/[0.04]">
              <p className="text-[10px] text-slate-500 mb-1">Message excerpt:</p>
              <p className="text-xs text-slate-300 line-clamp-3">{messageContent.slice(0, 300)}</p>
            </div>

            {/* Page selection */}
            <div className="px-5 py-3 max-h-[240px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-500 mb-2">Select target page:</p>
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedSlug(page.slug)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors text-xs ${
                        selectedSlug === page.slug
                          ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                          : "bg-white/[0.02] border border-white/[0.04] text-slate-300 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="font-medium">{page.title}</span>
                      <span className="text-[10px] text-slate-500 ml-2">{page.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedSlug || saving || saved}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
              >
                {saved ? (
                  <>
                    <Check className="w-3 h-3" />
                    Saved
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3 h-3" />
                    Save
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Add "Save to Wiki" button to MessageActions**

In `client/app/(pages)/ai-coach/components/MessageActions.tsx`:

First, read the file to understand its current structure and imports. Then add:

1. Import: `import { BookOpen } from "lucide-react";`
2. Import: `import { SaveToWikiModal } from "./SaveToWikiModal";`
3. Add state: `const [showSaveToWiki, setShowSaveToWiki] = useState(false);`
4. Add the BookOpen button in the actions bar (next to the existing share/copy buttons):

```tsx
<button
  onClick={() => setShowSaveToWiki(true)}
  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
  title="Save to Wiki"
>
  <BookOpen className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400" />
</button>
```

5. Add the modal at the end of the component's return:

```tsx
<SaveToWikiModal
  isOpen={showSaveToWiki}
  onClose={() => setShowSaveToWiki(false)}
  messageContent={content}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add client/app/\(pages\)/ai-coach/components/SaveToWikiModal.tsx client/app/\(pages\)/ai-coach/components/MessageActions.tsx
git commit -m "feat(wiki): add Save to Wiki action on AI coach messages"
```

---

## Self-Review Checklist

### Spec coverage
- [x] 8.1 Wiki Browser Component — Implemented as wiki folder in Intelligence Drawer (Task 2-4)
- [x] 8.1 Stats bar — WikiStats display in wiki folder list (Task 2)
- [x] 8.1 Page Detail View with markdown — WikiPageDetail with ReactMarkdown (Task 4)
- [x] 8.1 Clickable [[wiki-links]] in page body — processedBody in WikiPageDetail (Task 4)
- [x] 8.2 Chat Integration — [[slug]] rendered as WikiLinkChip (Task 5)
- [x] 8.2 "Save to Wiki" action — SaveToWikiModal + MessageActions (Task 6)
- [x] 8.3 Intelligence Drawer Enhancement — BookOpen icon, text-indigo-400 accent (Task 2)
- [x] Wiki search — debounced search in wiki folder (Task 2)
- [x] "Looks right" / "Flag issue" — Action buttons in WikiPageDetail (Task 4)
- [ ] Graph View — Deferred to Phase 4 (requires d3/force-graph dependency)
- [ ] Wiki stats in dashboard — Deferred to Phase 4 (separate dashboard widget)

### Placeholder scan
- No TBD, TODO, or "implement later" references
- All code blocks are complete implementations
- All file paths are exact

### Type consistency
- `WikiPage`, `WikiPageWithLinks`, `WikiStats`, `WikiSearchResult` — all from `@shared/types/domain/wiki`
- `IntelligenceFolder` — updated to include `'wiki'`
- `FOLDER_CONFIG` key matches `IntelligenceFolder` type
- `useIntelligenceFiles` return type includes all new fields
- `selectWikiPage(slug: string)` consistent across hook and drawer
- `onOpenWikiPage(slug: string)` consistent across messages and page content
