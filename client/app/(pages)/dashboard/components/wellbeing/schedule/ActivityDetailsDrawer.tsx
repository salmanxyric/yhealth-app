"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Tag,
  Timer,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { ScheduleItem } from "@/src/shared/services/schedule.service";
import type { PrayerScheduleItem } from "@/src/shared/services/data-source.service";

export interface GoogleCalendarEventLite {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string | null;
  description?: string | null;
}

export type DrawerItem =
  | { kind: "activity"; data: ScheduleItem }
  | { kind: "prayer"; data: PrayerScheduleItem }
  | { kind: "google"; data: GoogleCalendarEventLite };

interface Props {
  item: DrawerItem | null;
  onClose: () => void;
  onEditActivity?: (item: ScheduleItem) => void;
  onDeleteActivity?: (itemId: string) => void;
  onMarkPrayerDone?: (prayerId: string) => void;
}

function formatClock(time: string): string {
  if (!time) return "";
  // Accept both "HH:mm" and ISO. Try ISO first.
  const asDate = new Date(time);
  if (!isNaN(asDate.getTime()) && time.includes("T")) {
    return asDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h)) return time;
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function durationFromScheduleItem(item: ScheduleItem): string | null {
  if (item.durationMinutes) {
    const h = Math.floor(item.durationMinutes / 60);
    const m = item.durationMinutes % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }
  return null;
}

function durationFromRange(startISO: string, endISO: string): string | null {
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  const mins = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000));
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const CATEGORY_STYLE: Record<
  string,
  { bg: string; ring: string; icon: string; label: string }
> = {
  activity: {
    bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    ring: "rgba(16,185,129,0.45)",
    icon: "#ffffff",
    label: "Activity",
  },
  prayer: {
    bg: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    ring: "rgba(139,92,246,0.45)",
    icon: "#ffffff",
    label: "Prayer",
  },
  google: {
    bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    ring: "rgba(59,130,246,0.45)",
    icon: "#ffffff",
    label: "Google Calendar",
  },
};

export function ActivityDetailsDrawer({
  item,
  onClose,
  onEditActivity,
  onDeleteActivity,
  onMarkPrayerDone,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while drawer is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] backdrop-blur-sm"
            style={{ background: "rgba(2,0,15,0.55)" }}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Activity details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[95] flex flex-col"
            style={{
              width: "min(440px, 100vw)",
              background: "#0d0d14",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "-24px 0 60px rgba(0,0,0,0.55)",
            }}
          >
            <DrawerBody
              item={item}
              onClose={onClose}
              onEditActivity={onEditActivity}
              onDeleteActivity={onDeleteActivity}
              onMarkPrayerDone={onMarkPrayerDone}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({
  item,
  onClose,
  onEditActivity,
  onDeleteActivity,
  onMarkPrayerDone,
}: Omit<Props, "item"> & { item: DrawerItem }) {
  const style = CATEGORY_STYLE[item.kind];
  const { title, start, end, duration, category, description, location, extra } = summarize(item);

  return (
    <>
      {/* Header */}
      <div
        className="relative px-6 pt-6 pb-5"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: "32px",
            height: "32px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#94a3b8",
          }}
          aria-label="Close"
        >
          <X style={{ width: "16px", height: "16px" }} />
        </button>

        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center shrink-0 rounded-2xl"
            style={{
              width: "52px",
              height: "52px",
              background: style.bg,
              boxShadow: `0 10px 30px ${style.ring}`,
            }}
          >
            <CalendarIcon style={{ width: "24px", height: "24px", color: style.icon }} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#d1d5dc",
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {style.label}
            </span>
            <h2
              className="mt-2 text-white leading-tight break-words"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              {title || "Untitled"}
            </h2>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Time / Duration */}
        <section className="space-y-2">
          <SectionLabel>Schedule</SectionLabel>
          <DetailRow icon={<Clock className="w-4 h-4" />} label="Time">
            {start}
            {end ? ` – ${end}` : ""}
          </DetailRow>
          {duration && (
            <DetailRow icon={<Timer className="w-4 h-4" />} label="Duration">
              {duration}
            </DetailRow>
          )}
          {category && (
            <DetailRow icon={<Tag className="w-4 h-4" />} label="Category">
              {category}
            </DetailRow>
          )}
          {location && (
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location">
              {location}
            </DetailRow>
          )}
        </section>

        {description && (
          <section className="space-y-2">
            <SectionLabel>Details</SectionLabel>
            <p
              className="whitespace-pre-wrap"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                lineHeight: "22px",
                color: "#cbd5e1",
              }}
            >
              {description}
            </p>
          </section>
        )}

        {extra && (
          <section className="space-y-2">
            <SectionLabel>More</SectionLabel>
            {extra}
          </section>
        )}

        {item.kind === "prayer" && item.data.completed && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.22)",
              color: "#34d399",
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Marked as completed
            {item.data.completedAt && (
              <span style={{ color: "#94a3b8" }}>
                · {new Date(item.data.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div
        className="flex items-center gap-2 px-6 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {item.kind === "activity" && (
          <>
            {onEditActivity && (
              <FooterButton
                variant="primary"
                onClick={() => {
                  onEditActivity(item.data);
                  onClose();
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </FooterButton>
            )}
            {onDeleteActivity && (
              <FooterButton
                variant="danger"
                onClick={() => {
                  onDeleteActivity(item.data.id);
                  onClose();
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </FooterButton>
            )}
          </>
        )}

        {item.kind === "prayer" && !item.data.completed && onMarkPrayerDone && (
          <FooterButton
            variant="primary"
            onClick={() => {
              onMarkPrayerDone(item.data.id);
              onClose();
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark as done
          </FooterButton>
        )}

        {item.kind === "google" && (
          <FooterButton
            variant="primary"
            onClick={() =>
              window.open(
                `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
                  item.data.title,
                )}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Google Calendar
          </FooterButton>
        )}

        <FooterButton variant="ghost" onClick={onClose}>
          Close
        </FooterButton>
      </div>
    </>
  );
}

function summarize(item: DrawerItem): {
  title: string;
  start: string;
  end: string | null;
  duration: string | null;
  category: string | null;
  description: string | null;
  location: string | null;
  extra: React.ReactNode | null;
} {
  if (item.kind === "activity") {
    const a = item.data;
    return {
      title: a.title,
      start: formatClock(a.startTime),
      end: a.endTime ? formatClock(a.endTime) : null,
      duration: durationFromScheduleItem(a),
      category: a.category ?? null,
      description: a.description ?? null,
      location: null,
      extra: null,
    };
  }
  if (item.kind === "prayer") {
    const p = item.data;
    const startISO = p.scheduledTime || "";
    return {
      title: p.prayerName || "Prayer",
      start: startISO ? formatClock(startISO) : "",
      end: null,
      duration: null,
      category: "Prayer",
      description: null,
      location: null,
      extra: p.completed ? null : (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.22)",
            color: "#fbbf24",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
          }}
        >
          <AlertCircle className="w-4 h-4" />
          Not yet marked as done
        </div>
      ),
    };
  }
  const g = item.data;
  return {
    title: g.title,
    start: g.allDay ? "All day" : formatClock(g.startTime),
    end: g.allDay ? null : formatClock(g.endTime),
    duration: g.allDay ? null : durationFromRange(g.startTime, g.endTime),
    category: "Google Calendar",
    description: g.description ?? null,
    location: g.location ?? null,
    extra: null,
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "#6a7282",
        margin: 0,
      }}
    >
      {children}
    </h3>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span style={{ color: "#64748b" }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: "#6a7282",
            margin: 0,
            marginBottom: "2px",
          }}
        >
          {label}
        </p>
        <p
          className="truncate"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#e2e8f0",
            margin: 0,
          }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

function FooterButton({
  variant,
  onClick,
  children,
}: {
  variant: "primary" | "danger" | "ghost";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-semibold transition-all active:scale-[0.98]";
  const variants: Record<typeof variant, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #00d0b5 0%, #2d9cdb 100%)",
      color: "#02000f",
      boxShadow: "0 6px 18px rgba(0,208,181,0.25)",
    },
    danger: {
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#fca5a5",
    },
    ghost: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      color: "#cbd5e1",
      marginLeft: "auto",
    },
  };
  return (
    <button type="button" onClick={onClick} className={base} style={variants[variant]}>
      {children}
    </button>
  );
}
