'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlarmClock, Check, Loader2, NotebookPen, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useAlarmRing, ALARMS_OVERVIEW_PATH } from '@/app/providers/AlarmProvider';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { RemainingCreditsChip } from '@/components/subscription/RemainingCreditsChip';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';
import { api, ApiError } from '@/lib/api-client';

type QuickNoteStatus = 'active' | 'pinned' | 'archived';

interface HeaderQuickNote {
  id: string;
  title: string | null;
  content: string;
  status: QuickNoteStatus;
  color: string | null;
  updatedAt: string;
}

interface HeaderNotesResponse {
  notes: HeaderQuickNote[];
  total: number;
}

const QUICK_NOTE_COLORS = ['#facc15', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#f97316'];

function getRandomNoteColor(): string {
  return QUICK_NOTE_COLORS[Math.floor(Math.random() * QUICK_NOTE_COLORS.length)] || QUICK_NOTE_COLORS[0];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const { isRinging } = useAlarmRing();
  const quickNoteRef = useRef<HTMLDivElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [greeting] = useState(() => getGreeting());
  const [date] = useState(() => getFormattedDate());
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState(() => getRandomNoteColor());
  const [recentNotes, setRecentNotes] = useState<HeaderQuickNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduceMotion(
        mq.matches || document.documentElement.classList.contains('reduce-motion')
      );
    };
    update();
    mq.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => {
      mq.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!notesOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!quickNoteRef.current?.contains(event.target as Node)) {
        setNotesOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [notesOpen]);

  useEffect(() => {
    if (!notesOpen) return;

    let cancelled = false;
    setNoteColor(getRandomNoteColor());
    setNoteSaved(false);
    setNoteError(null);
    setNotesLoading(true);

    api.get<HeaderNotesResponse>('/quick-notes', { params: { limit: 4 } })
      .then((response) => {
        if (!cancelled && response.success && response.data) {
          setRecentNotes(response.data.notes);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setNoteError(err instanceof ApiError ? err.message : 'Could not load notes');
        }
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [notesOpen]);

  const handleQuickNoteSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!noteContent.trim()) return;

    setNoteSaving(true);
    setNoteError(null);
    setNoteSaved(false);

    try {
      const response = await api.post<HeaderQuickNote>('/quick-notes', {
        title: noteTitle.trim() || undefined,
        content: noteContent.trim(),
        color: noteColor,
        source: 'text',
        status: 'active',
      });

      if (response.success && response.data) {
        setRecentNotes((current) => [response.data!, ...current].slice(0, 4));
        setNoteTitle('');
        setNoteContent('');
        setNoteColor(getRandomNoteColor());
        setNoteSaved(true);
        window.setTimeout(() => setNoteSaved(false), 1800);
      }
    } catch (err) {
      setNoteError(err instanceof ApiError ? err.message : 'Could not save note');
    } finally {
      setNoteSaving(false);
    }
  };

  const firstName = user?.firstName || 'there';
  const showAlarmMotion = isRinging && !reduceMotion;

  return (
    <div className="sticky top-0 z-30">
      <TrialCountdownBanner />
      <header
        data-tour="dashboard-header"
        className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]"
        style={{
          background: 'rgba(2,2,9,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
      {/* Left — Greeting + Date */}
      <div>
        <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white leading-tight">
          {greeting},{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{date}</p>
      </div>

      {/* Right — Action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <RemainingCreditsChip className="hidden sm:inline-flex" />
        <div ref={quickNoteRef} className="relative">
          <button
            type="button"
            onClick={() => setNotesOpen((open) => !open)}
            className="relative p-2 sm:p-2.5 rounded-xl bg-amber-300/[0.08] border border-amber-300/[0.16] text-amber-200 hover:text-white hover:bg-amber-300/[0.14] transition-colors"
            aria-label="Quick notes"
            aria-expanded={notesOpen}
          >
            <NotebookPen className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {notesOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/95 shadow-2xl shadow-black/45 backdrop-blur-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-amber-300/15 via-sky-400/10 to-emerald-300/10" />
                <div className="relative p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Sticky capture</p>
                      <p className="text-xs text-slate-400">Drop a thought before it disappears.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotesOpen(false)}
                      className="rounded-full border border-white/[0.08] bg-white/[0.04] p-1.5 text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                      aria-label="Close quick notes"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleQuickNoteSubmit}
                    className="rounded-[1.35rem] border border-black/10 p-3 text-slate-950 shadow-xl shadow-black/25"
                    style={{ backgroundColor: noteColor, transform: 'rotate(-0.6deg)' }}
                  >
                    <input
                      value={noteTitle}
                      onChange={(event) => setNoteTitle(event.target.value)}
                      maxLength={160}
                      placeholder="Optional title"
                      className="mb-2 w-full rounded-xl border border-black/10 bg-white/35 px-3 py-2 text-sm font-semibold text-slate-950 placeholder:text-slate-700/70 outline-none ring-black/10 transition focus:ring-2"
                    />
                    <textarea
                      value={noteContent}
                      onChange={(event) => setNoteContent(event.target.value)}
                      rows={4}
                      maxLength={10000}
                      placeholder="Write a quick note..."
                      className="min-h-24 w-full resize-none rounded-xl border border-black/10 bg-white/35 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-700/70 outline-none ring-black/10 transition focus:ring-2"
                    />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {QUICK_NOTE_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNoteColor(color)}
                            className={`h-5 w-5 rounded-full border border-black/20 transition-transform hover:scale-110 ${
                              color === noteColor ? 'ring-2 ring-slate-950 ring-offset-1 ring-offset-white/50' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Use note color ${color}`}
                          />
                        ))}
                      </div>
                      <button
                        type="submit"
                        disabled={!noteContent.trim() || noteSaving}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Save
                      </button>
                    </div>
                  </form>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Recent</p>
                    <Link
                      href="/quick-notes"
                      onClick={() => setNotesOpen(false)}
                      className="text-xs font-semibold text-amber-200 transition-colors hover:text-white"
                    >
                      View details
                    </Link>
                  </div>

                  <div className="mt-2 space-y-2">
                    {notesLoading ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3 py-3 text-xs text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading notes
                      </div>
                    ) : recentNotes.length > 0 ? (
                      recentNotes.map((note) => (
                        <Link
                          key={note.id}
                          href="/quick-notes"
                          onClick={() => setNotesOpen(false)}
                          className="block rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 transition-colors hover:bg-white/[0.08]"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: note.color || QUICK_NOTE_COLORS[0] }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{note.title || note.content}</p>
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{note.content}</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3 py-3 text-xs text-slate-400">
                        No notes yet. Save the first one above.
                      </div>
                    )}
                  </div>

                  {(noteError || noteSaved) && (
                    <p className={`mt-3 text-xs ${noteError ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {noteError || 'Saved to quick notes.'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NotificationDropdown />

        <button
          type="button"
          onClick={() => router.push(ALARMS_OVERVIEW_PATH)}
          className={`relative p-2 sm:p-2.5 rounded-xl border transition-colors ${
            isRinging
              ? 'bg-violet-500/15 border-violet-500/40 text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
              : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          aria-label={isRinging ? 'Alarms — ringing' : 'Alarms'}
        >
          <motion.span
            className="inline-flex"
            animate={
              showAlarmMotion
                ? { rotate: [0, -14, 14, -10, 10, 0], scale: [1, 1.08, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={
              showAlarmMotion
                ? { duration: 0.85, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.2 }
            }
          >
            <AlarmClock className="w-4 h-4" />
          </motion.span>
        </button>

        <Link
          href="/settings"
          className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
      </header>
    </div>
  );
}
