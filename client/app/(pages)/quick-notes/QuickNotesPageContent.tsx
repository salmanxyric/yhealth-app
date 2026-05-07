"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Palette,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { DashboardPageSkeleton } from "@/components/loading";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type QuickNoteStatus = "active" | "pinned" | "archived";
type QuickNoteSource = "text" | "voice" | "ai";

interface QuickNote {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  status: QuickNoteStatus;
  color: string | null;
  tags: string[] | null;
  source: QuickNoteSource;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface NotesResponse {
  notes: QuickNote[];
  total: number;
}

const NOTE_COLORS = [
  "#facc15",
  "#38bdf8",
  "#34d399",
  "#fb7185",
  "#a78bfa",
  "#f97316",
];

const STATUS_FILTERS: Array<{ id: "all" | QuickNoteStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pinned", label: "Pinned" },
  { id: "active", label: "Active" },
  { id: "archived", label: "Archived" },
];

function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function splitTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function QuickNotesContent() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuickNoteStatus>("all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [noteSource, setNoteSource] = useState<QuickNoteSource>("text");

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (statusFilter !== "all" && note.status !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        note.title?.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [notes, search, statusFilter]);

  const pinnedCount = notes.filter((note) => note.status === "pinned").length;
  const activeCount = notes.filter((note) => note.status === "active").length;
  const archivedCount = notes.filter((note) => note.status === "archived").length;
  const editingNote = editingId ? notes.find((note) => note.id === editingId) : null;

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<NotesResponse>("/quick-notes", {
        params: { limit: 100 },
      });
      if (response.success && response.data) {
        setNotes(response.data.notes);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load quick notes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes().catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const resetComposer = () => {
    setTitle("");
    setContent("");
    setTags("");
    setColor(NOTE_COLORS[0]);
    setEditingId(null);
    setNoteSource("text");
  };

  const startEdit = (note: QuickNote) => {
    setEditingId(note.id);
    setTitle(note.title || "");
    setContent(note.content);
    setTags((note.tags || []).join(", "));
    setColor(note.color || NOTE_COLORS[0]);
  };

  const saveNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;

    setIsSaving(true);
    setError(null);
    const payload = {
      title: title.trim() || undefined,
      content: content.trim(),
      color,
      tags: splitTags(tags),
      source: noteSource,
    };

    try {
      if (editingId) {
        const response = await api.patch<QuickNote>(`/quick-notes/${editingId}`, payload);
        if (response.success && response.data) {
          setNotes((prev) => prev.map((note) => (note.id === editingId ? response.data! : note)));
        }
      } else {
        const response = await api.post<QuickNote>("/quick-notes", payload);
        if (response.success && response.data) {
          setNotes((prev) => [response.data!, ...prev]);
        }
      }
      resetComposer();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save quick note");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (note: QuickNote, status: QuickNoteStatus) => {
    try {
      const response = await api.patch<QuickNote>(`/quick-notes/${note.id}`, { status });
      if (response.success && response.data) {
        setNotes((prev) => prev.map((item) => (item.id === note.id ? response.data! : item)));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update note");
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await api.delete<{ deleted: boolean }>(`/quick-notes/${noteId}`);
      if (response.success) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        if (editingId === noteId) resetComposer();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete note");
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceSupported(false);
      setError("Voice capture is not supported in this browser. Text notes still work.");
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) {
        setContent((prev) => `${prev}${prev ? " " : ""}${finalText.trim()}`);
        setNoteSource("voice");
      }
      if (interimText && !title.trim()) {
        setTitle(interimText.trim().slice(0, 80));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setError("Voice capture stopped. You can keep typing or try the mic again.");
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setVoiceSupported(true);
    setIsListening(true);
  };

  return (
    <DashboardLayout activeTab="quick-notes">
      <main className="min-h-screen px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="relative overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#080912]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(250,204,21,0.18),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.16),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_36%)]" />
            <div className="relative grid gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:p-7">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                  <StickyNote className="h-3.5 w-3.5" />
                  Quick Notes
                </div>
                <h1 className="max-w-2xl text-2xl font-semibold tracking-normal text-white sm:text-3xl">
                  Capture the thought before it disappears.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Voice, text, color, pin, archive, and ask the AI coach to manage notes when your hands are busy.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 self-end">
                <Metric label="Pinned" value={pinnedCount} tone="amber" />
                <Metric label="Active" value={activeCount} tone="emerald" />
                <Metric label="Archived" value={archivedCount} tone="sky" />
              </div>
            </div>
          </section>

          <form onSubmit={saveNote} className="grid gap-4 rounded-[8px] border border-white/[0.08] bg-white/[0.035] p-4 shadow-2xl shadow-black/25 lg:grid-cols-[1fr_220px]">
            <div className="space-y-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                maxLength={160}
                className="h-11 w-full rounded-[8px] border border-white/[0.08] bg-slate-950/70 px-3 text-sm font-semibold text-white outline-none transition focus:border-amber-300/40"
              />
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write a note, paste a thought, or use the mic..."
                rows={5}
                maxLength={10000}
                className="w-full resize-none rounded-[8px] border border-white/[0.08] bg-slate-950/70 px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-300/40"
              />
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Tags separated by commas"
                className="h-10 w-full rounded-[8px] border border-white/[0.08] bg-slate-950/70 px-3 text-sm text-slate-200 outline-none transition focus:border-sky-300/40"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-[8px] border border-white/[0.08] bg-slate-950/60 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <Palette className="h-3.5 w-3.5" />
                  Color
                </div>
                <div className="grid grid-cols-6 gap-2 lg:grid-cols-3">
                  {NOTE_COLORS.map((noteColor) => (
                    <button
                      key={noteColor}
                      type="button"
                      aria-label={`Use color ${noteColor}`}
                      onClick={() => setColor(noteColor)}
                      className={cn(
                        "h-8 rounded-[8px] border transition",
                        color === noteColor ? "border-white scale-105" : "border-white/10"
                      )}
                      style={{ backgroundColor: noteColor }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={toggleVoice}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border text-sm font-semibold transition",
                  isListening
                    ? "border-rose-300/30 bg-rose-400/15 text-rose-100"
                    : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                )}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? "Stop voice" : "Voice note"}
              </button>

              {!voiceSupported && (
                <p className="text-xs leading-5 text-amber-200">Voice is unavailable here. Text capture is ready.</p>
              )}

              <div className="mt-auto flex gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetComposer}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08]"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || !content.trim()}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-amber-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingNote ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingNote ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </form>

          <section className="rounded-[8px] border border-white/[0.08] bg-white/[0.025] p-3 sm:p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setStatusFilter(filter.id)}
                    className={cn(
                      "h-9 rounded-[8px] border px-3 text-xs font-semibold transition",
                      statusFilter === filter.id
                        ? "border-white/20 bg-white/[0.12] text-white"
                        : "border-white/[0.07] bg-white/[0.035] text-slate-400 hover:text-white"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1 lg:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search notes"
                    className="h-9 w-full rounded-[8px] border border-white/[0.08] bg-slate-950/70 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-sky-300/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchNotes().catch(() => undefined)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white"
                  aria-label="Refresh notes"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-[8px] border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-[8px] bg-white/[0.05]" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-[8px] border border-dashed border-white/[0.12] bg-slate-950/45 p-8 text-center">
                <Sparkles className="mb-3 h-8 w-8 text-amber-200" />
                <h2 className="text-base font-semibold text-white">No notes in this view</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500">Capture a quick thought above, or ask the AI coach to save something for you.</p>
              </div>
            ) : (
              <motion.div layout className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence initial={false}>
                  {filteredNotes.map((note) => (
                    <motion.article
                      key={note.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="group relative overflow-hidden rounded-[8px] border border-white/[0.08] bg-slate-950/80 p-4 shadow-xl shadow-black/20"
                    >
                      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: note.color || NOTE_COLORS[0] }} />
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-white">
                            {note.title || "Untitled note"}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDate(note.updatedAt)} - {note.source}
                          </p>
                        </div>
                        {note.status === "pinned" && <Pin className="h-4 w-4 shrink-0 text-amber-200" />}
                      </div>
                      <p className="min-h-20 whitespace-pre-wrap text-sm leading-6 text-slate-300">{note.content}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {note.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-slate-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => startEdit(note)} className="h-8 rounded-[8px] border border-white/[0.08] px-3 text-xs font-semibold text-slate-300 hover:bg-white/[0.06]">
                          Edit
                        </button>
                        <button type="button" onClick={() => updateStatus(note, note.status === "pinned" ? "active" : "pinned")} className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-amber-300/15 px-3 text-xs font-semibold text-amber-100 hover:bg-amber-300/10">
                          <Pin className="h-3.5 w-3.5" />
                          {note.status === "pinned" ? "Unpin" : "Pin"}
                        </button>
                        <button type="button" onClick={() => updateStatus(note, note.status === "archived" ? "active" : "archived")} className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-sky-300/15 px-3 text-xs font-semibold text-sky-100 hover:bg-sky-300/10">
                          <Archive className="h-3.5 w-3.5" />
                          {note.status === "archived" ? "Restore" : "Archive"}
                        </button>
                        <button type="button" onClick={() => deleteNote(note.id)} className="ml-auto inline-flex h-8 items-center gap-1 rounded-[8px] border border-rose-300/15 px-3 text-xs font-semibold text-rose-100 hover:bg-rose-300/10">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "amber" | "emerald" | "sky" }) {
  const toneClass = {
    amber: "text-amber-100 bg-amber-300/10 border-amber-300/18",
    emerald: "text-emerald-100 bg-emerald-300/10 border-emerald-300/18",
    sky: "text-sky-100 bg-sky-300/10 border-sky-300/18",
  }[tone];

  return (
    <div className={cn("rounded-[8px] border p-3", toneClass)}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">{label}</p>
    </div>
  );
}

function QuickNotesLoading() {
  return <DashboardPageSkeleton activeTab="quick-notes" variant="compact" />;
}

export default function QuickNotesPageContent() {
  return (
    <Suspense fallback={<QuickNotesLoading />}>
      <QuickNotesContent />
    </Suspense>
  );
}
