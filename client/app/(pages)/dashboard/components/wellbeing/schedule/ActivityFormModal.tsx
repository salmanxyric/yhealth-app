"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Square,
  Circle,
  Diamond,
  Shapes,
  Clock,
  AlignLeft,
  Tag,
  Palette,
  Smile,
  Timer,
  AlertCircle,
  Briefcase,
  Dumbbell,
  UtensilsCrossed,
  Coffee,
  User,
  BookOpen,
  Users,
  Heart,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  scheduleService,
  type ScheduleItem,
  type UpdateScheduleItemRequest,
} from "@/src/shared/services/schedule.service";
import { IconPicker } from "./IconPicker";
import {
  detectConflict,
  findNextOpenSlot,
  type ExistingSlot,
  type ConflictHit,
} from "@/lib/schedule/time-conflict";

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ScheduleItem | null;
  onSave: (item?: ScheduleItem) => void;
  scheduleId?: string;
  /** Existing slots (manual + google + prayer) to check conflicts against. */
  existingSlots?: ExistingSlot[];
}

const SHAPES = [
  { value: "square", label: "Square", icon: Square },
  { value: "circle", label: "Circle", icon: Circle },
  { value: "rounded", label: "Rounded", icon: Square },
  { value: "diamond", label: "Diamond", icon: Diamond },
];

const COLORS = [
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#ec4899", label: "Pink" },
  { value: "#14b8a6", label: "Teal" },
];

const CATEGORIES: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: "Work", label: "Work", icon: Briefcase, color: "#3b82f6" },
  { value: "Exercise", label: "Exercise", icon: Dumbbell, color: "#f97316" },
  { value: "Meal", label: "Meal", icon: UtensilsCrossed, color: "#10b981" },
  { value: "Break", label: "Break", icon: Coffee, color: "#f59e0b" },
  { value: "Personal", label: "Personal", icon: User, color: "#8b5cf6" },
  { value: "Study", label: "Study", icon: BookOpen, color: "#06b6d4" },
  { value: "Social", label: "Social", icon: Users, color: "#ec4899" },
  { value: "Health", label: "Health", icon: Heart, color: "#ef4444" },
  { value: "Other", label: "Other", icon: MoreHorizontal, color: "#a1a1aa" },
];

function calcDuration(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ActivityFormModal({
  isOpen,
  onClose,
  activity,
  onSave,
  scheduleId,
  existingSlots = [],
}: ActivityFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    color: "#10b981",
    icon: "",
    category: "",
    shape: "square" as "square" | "circle" | "rounded" | "diamond",
  });

  useEffect(() => {
    if (activity) {
      const shape =
        activity.shape ||
        (activity.metadata as { shape?: string })?.shape ||
        "square";
      setFormData({
        title: activity.title,
        description: activity.description || "",
        start_time: activity.startTime,
        end_time: activity.endTime || "",
        color: activity.color || "#10b981",
        icon: activity.icon || "",
        category: activity.category || "",
        shape: shape as "square" | "circle" | "rounded" | "diamond",
      });
    } else {
      // New activity — pick the next free 30-min slot from "now". If the
      // naive "now" already conflicts with an existing slot, shift forward
      // to the next open window.
      const now = new Date();
      const roundedMin = Math.floor(now.getMinutes() / 30) * 30;
      const baseStart = `${String(now.getHours()).padStart(2, "0")}:${String(roundedMin).padStart(2, "0")}`;
      const open = findNextOpenSlot(baseStart, 30, existingSlots);
      setFormData({
        title: "",
        description: "",
        start_time: open?.start || baseStart,
        end_time: open?.end || "",
        color: "#10b981",
        icon: "",
        category: "",
        shape: "square",
      });
    }
    setError(null);
    setOverrideConflict(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, isOpen]);

  const duration = useMemo(
    () => calcDuration(formData.start_time, formData.end_time),
    [formData.start_time, formData.end_time]
  );

  const timeError = useMemo(() => {
    if (!formData.start_time || !formData.end_time) return null;
    const [sh, sm] = formData.start_time.split(":").map(Number);
    const [eh, em] = formData.end_time.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (endMins <= startMins) return "End time must be after start time";
    return null;
  }, [formData.start_time, formData.end_time]);

  // Detect overlaps with manual items, Google events, and prayers. Exclude the
  // activity being edited from the check so updating doesn't conflict with itself.
  const conflict = useMemo(() => {
    if (!formData.start_time || !formData.end_time || timeError) return null;
    const slotsToCheck = activity
      ? existingSlots.filter((s) => s.id !== activity.id)
      : existingSlots;
    const result = detectConflict(formData.start_time, formData.end_time, slotsToCheck);
    if (result.conflicts.length === 0) return null;
    return result;
  }, [formData.start_time, formData.end_time, existingSlots, activity, timeError]);

  // Reset override whenever time fields change — the user has to re-confirm
  // on a new conflict.
  useEffect(() => {
    setOverrideConflict(false);
  }, [formData.start_time, formData.end_time]);

  const applySuggestedTime = () => {
    if (!conflict?.suggestedStart || !conflict?.suggestedEnd) return;
    setFormData((prev) => ({
      ...prev,
      start_time: conflict.suggestedStart!,
      end_time: conflict.suggestedEnd!,
    }));
    setOverrideConflict(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeError) return;
    // Block submission on active conflict unless the user has explicitly opted
    // in to override — the banner provides both "Use suggested time" and
    // "Save anyway" affordances.
    if (conflict && !overrideConflict) {
      setError(
        "This time conflicts with another activity. Choose the suggested time or confirm 'Save anyway'.",
      );
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const durationMinutes = duration || undefined;

      if (activity) {
        const updateData: UpdateScheduleItemRequest = {
          title: formData.title,
          description: formData.description || undefined,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          duration_minutes: durationMinutes,
          color: formData.color,
          icon: formData.icon || undefined,
          category: formData.category || undefined,
          shape: formData.shape,
          metadata: { shape: formData.shape },
        };

        const result = await scheduleService.updateScheduleItem(
          activity.id,
          updateData
        );
        if (result.success) {
          onSave(result.data?.item);
          onClose();
        } else {
          setError("Failed to update activity");
        }
      } else if (scheduleId) {
        const createData = {
          title: formData.title,
          description: formData.description || undefined,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          duration_minutes: durationMinutes,
          color: formData.color,
          icon: formData.icon || undefined,
          category: formData.category || undefined,
          shape: formData.shape,
          position: 0,
          metadata: { shape: formData.shape, x: 100, y: 100 },
        };

        const result = await scheduleService.addScheduleItem(
          scheduleId,
          createData
        );
        if (result.success) {
          onSave(result.data?.item);
          onClose();
        } else {
          setError("Failed to create activity");
        }
      }
    } catch (err) {
      console.error("Error saving activity:", err);
      setError(
        activity
          ? "Failed to update activity. Please try again."
          : "Failed to create activity. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto z-[10000]
              bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]"
                  style={{ background: `${formData.color}20` }}
                >
                  {formData.icon ? (
                    <span className="text-lg">{formData.icon}</span>
                  ) : (
                    <Clock
                      className="w-4.5 h-4.5"
                      style={{ color: formData.color }}
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white">
                    {activity ? "Edit Activity" : "New Activity"}
                  </h2>
                  {duration && (
                    <p className="text-[11px] text-zinc-500 tabular-nums">
                      {formatDuration(duration)} duration
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-400 text-[13px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <Label
                  htmlFor="title"
                  className="text-[13px] font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5"
                >
                  <AlignLeft className="w-3.5 h-3.5" /> Title{" "}
                  <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 rounded-xl"
                  placeholder="What are you planning?"
                />
              </div>

              {/* Description */}
              <div>
                <Label
                  htmlFor="description"
                  className="text-[13px] font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5"
                >
                  <AlignLeft className="w-3.5 h-3.5" /> Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl resize-none"
                  placeholder="Add notes or details..."
                  rows={2}
                />
              </div>

              {/* Time Row */}
              <div>
                <Label className="text-[13px] font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time{" "}
                  <span className="text-rose-400">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium mb-1 block">
                      Start
                    </span>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required
                      className="bg-white/[0.04] border-white/[0.08] text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium mb-1 block">
                      End
                    </span>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className={`bg-white/[0.04] border-white/[0.08] text-white focus:ring-emerald-500/20 h-11 rounded-xl ${
                        timeError
                          ? "border-rose-500/50 focus:border-rose-500/50"
                          : "focus:border-emerald-500/50"
                      }`}
                    />
                  </div>
                </div>

                {/* Duration badge + time error */}
                <div className="mt-2 flex items-center justify-between">
                  {duration ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      <Timer className="w-3 h-3" />
                      {formatDuration(duration)}
                    </span>
                  ) : (
                    <span />
                  )}
                  {timeError && (
                    <span className="flex items-center gap-1 text-[12px] text-rose-400">
                      <AlertCircle className="w-3 h-3" />
                      {timeError}
                    </span>
                  )}
                </div>

                {/* Conflict banner */}
                {conflict && (
                  <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div className="text-[12px] text-rose-100 leading-relaxed">
                        <span className="font-semibold">Time conflict.</span>{" "}
                        Overlaps with{" "}
                        {conflict.conflicts.map((c: ConflictHit, idx: number) => (
                          <span key={c.id}>
                            <span className="font-semibold">{c.title}</span>
                            <span className="text-rose-300/80">
                              {" "}
                              ({c.startHHmm}–{c.endHHmm}
                              {c.source === "google"
                                ? ", Google"
                                : c.source === "prayer"
                                  ? ", Prayer"
                                  : ""}
                              )
                            </span>
                            {idx < conflict.conflicts.length - 1 && ", "}
                          </span>
                        ))}
                        .
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {conflict.suggestedStart && conflict.suggestedEnd ? (
                        <button
                          type="button"
                          onClick={applySuggestedTime}
                          className="h-8 px-3 rounded-lg text-[12px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 transition-colors"
                        >
                          Use suggested time ({conflict.suggestedStart}–
                          {conflict.suggestedEnd})
                        </button>
                      ) : (
                        <span className="text-[11px] text-rose-200/70 italic">
                          No free slot found today.
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setOverrideConflict((v) => !v)}
                        className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors ${
                          overrideConflict
                            ? "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                            : "bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white"
                        }`}
                      >
                        {overrideConflict ? "✓ Save anyway" : "Save anyway"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <Label className="text-[13px] font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Category
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, category: cat.value })
                        }
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          isSelected
                            ? "border-white/20 bg-white/10 text-white shadow-sm"
                            : "border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                        }`}
                      >
                        <Icon
                          className="w-4 h-4 shrink-0"
                          style={{ color: isSelected ? cat.color : undefined }}
                        />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div>
                <Label className="text-[13px] font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Color
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, color: color.value })
                      }
                      className={`w-9 h-9 rounded-xl transition-all cursor-pointer ${
                        formData.color === color.value
                          ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                          : "hover:scale-105 opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Shape */}
              <div>
                <Label className="text-[13px] font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Shapes className="w-3.5 h-3.5" /> Shape
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {SHAPES.map((shape) => {
                    const IconComponent = shape.icon;
                    return (
                      <button
                        key={shape.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            shape: shape.value as
                              | "square"
                              | "circle"
                              | "rounded"
                              | "diamond",
                          })
                        }
                        className={`py-2.5 rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          formData.shape === shape.value
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                            : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-[11px] font-medium">
                          {shape.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon */}
              <div className="relative">
                <Label className="text-[13px] font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5" /> Icon
                </Label>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowIconPicker(!showIconPicker);
                      }}
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl transition-all cursor-pointer ${
                        formData.icon
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
                      }`}
                    >
                      {formData.icon || "😀"}
                    </button>
                    {showIconPicker && (
                      <div className="absolute top-full left-0 mt-2 z-[10002]">
                        <IconPicker
                          value={formData.icon}
                          onChange={(icon) => {
                            setFormData({ ...formData, icon });
                            setShowIconPicker(false);
                          }}
                          onClose={() => setShowIconPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="flex-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 rounded-xl"
                    placeholder="Or type emoji"
                    maxLength={2}
                    onClick={() => setShowIconPicker(false)}
                  />
                  {formData.icon && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: "" })}
                      className="px-3 h-11 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] text-zinc-500 hover:text-white text-[12px] font-medium transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !!timeError || (!!conflict && !overrideConflict)}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : activity ? (
                    "Update Activity"
                  ) : (
                    "Create Activity"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
