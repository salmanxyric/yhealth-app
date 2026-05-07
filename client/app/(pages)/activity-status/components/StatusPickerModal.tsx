"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { activityStatusService, STATUS_CONFIG, type ActivityStatus } from "@/src/shared/services/activity-status.service";
import { toast } from "react-hot-toast";

interface StatusPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  initialStatus?: ActivityStatus;
  initialMood?: number;
  initialNotes?: string;
  onSuccess?: () => void;
}

const MOOD_EMOJIS = ["😞", "😐", "😊", "😄", "🌟"];

export function StatusPickerModal({
  open,
  onOpenChange,
  date,
  initialStatus,
  initialMood,
  initialNotes,
  onSuccess,
}: StatusPickerModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus>(initialStatus || "working");
  const [mood, setMood] = useState<number>(initialMood || 3);
  const [notes, setNotes] = useState<string>(initialNotes || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await activityStatusService.setStatusForDate({
        date,
        status: selectedStatus,
        mood,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        toast.success("Status updated successfully!");
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-white/10 bg-slate-950/95 text-[11px] backdrop-blur-xl sm:text-xs">
        <DialogHeader>
          <DialogTitle className="text-sm text-white sm:text-base">Set Activity Status</DialogTitle>
          <DialogDescription className="text-[11px] text-slate-300 sm:text-xs">
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-10.5rem)] overflow-y-auto pr-1">
        <div className="space-y-6 py-2">
          {/* Status Selection */}
          <div>
            <Label className="mb-3 block text-xs font-semibold text-slate-200">Select Status</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStatus(status as ActivityStatus)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    selectedStatus === status
                      ? "border-emerald-400/70 bg-emerald-500/10 shadow-[0_8px_30px_rgba(16,185,129,0.2)]"
                      : "border-white/10 bg-slate-900/60 hover:border-emerald-300/45"
                  }`}
                  style={{
                    backgroundColor: selectedStatus === status ? `${config.color}15` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl">{config.icon}</span>
                    <div>
                      <div className="text-xs font-semibold capitalize text-slate-100">{status}</div>
                      <div className="text-[10px] text-slate-300 sm:text-[11px]">{config.description}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Mood Selection */}
          <div>
            <Label className="mb-3 block text-xs font-semibold text-slate-200">Mood (Optional)</Label>
            <div className="flex items-center gap-3">
              {MOOD_EMOJIS.map((emoji, index) => {
                const moodValue = index + 1;
                return (
                  <motion.button
                    key={moodValue}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMood(moodValue)}
                    className={`text-2xl transition-all sm:text-3xl ${
                      mood === moodValue
                        ? "scale-125 filter drop-shadow-lg"
                        : "opacity-50 hover:opacity-75"
                    }`}
                  >
                    {emoji}
                  </motion.button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Selected: {mood}/5
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="mb-2 block text-xs font-semibold text-slate-200">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your day..."
              className="min-h-24 border-white/10 bg-slate-900/70 text-xs text-slate-100 placeholder:text-slate-400"
              maxLength={1000}
            />
            <p className="mt-1 text-[10px] text-slate-400">
              {notes.length}/1000 characters
            </p>
          </div>
        </div>
        </div>

          {/* Actions */}
          <div className="sticky bottom-0 z-20 mt-4 flex gap-3 justify-end border-t border-white/10 bg-[linear-gradient(0deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.92)_100%)] px-1 pt-4 pb-1 backdrop-blur-xl">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-white/15 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-linear-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_8px_24px_rgba(16,185,129,0.35)]"
            >
              {isLoading ? "Saving..." : "Save Status"}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
