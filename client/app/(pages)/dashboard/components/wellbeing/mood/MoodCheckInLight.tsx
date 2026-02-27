/**
 * @file MoodCheckInLight Component
 * @description Quick emoji-based mood check-in for light mode
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Smile } from "lucide-react";
import { moodService, type CreateMoodLogRequest } from "@/src/shared/services/wellbeing.service";
import type { MoodEmoji } from "@shared/types/domain/wellbeing";

const MOOD_EMOJIS: Array<{ emoji: MoodEmoji; label: string; color: string }> = [
  { emoji: "😊", label: "Great", color: "from-green-500 to-emerald-500" },
  { emoji: "😐", label: "Okay", color: "from-gray-400 to-slate-500" },
  { emoji: "😟", label: "Low", color: "from-yellow-500 to-orange-500" },
  { emoji: "😡", label: "Angry", color: "from-red-500 to-rose-500" },
  { emoji: "😰", label: "Anxious", color: "from-purple-500 to-pink-500" },
  { emoji: "😴", label: "Tired", color: "from-blue-400 to-indigo-500" },
];

interface MoodCheckInLightProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MoodCheckInLight({ onSuccess, onCancel }: MoodCheckInLightProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji | null>(null);
  const [descriptor, setDescriptor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedEmoji) {
      setError("Please select a mood");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: CreateMoodLogRequest = {
        mode: "light",
        mood_emoji: selectedEmoji,
        ...(descriptor.trim() && { descriptor: descriptor.trim() }),
      };

      const response = await moodService.createLog(data);

      if (response.success) {
        onSuccess?.();
      } else {
        setError(response.error?.message || "Failed to log mood");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to log mood");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mood Emoji Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-4">
          How are you feeling?
        </label>
        <div className="grid grid-cols-3 gap-4">
          {MOOD_EMOJIS.map((mood) => (
            <motion.button
              key={mood.emoji}
              onClick={() => setSelectedEmoji(mood.emoji)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all
                ${selectedEmoji === mood.emoji
                  ? `bg-gradient-to-br ${mood.color} border-white shadow-lg scale-105`
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-5xl mb-2">{mood.emoji}</div>
              <div
                className={`text-sm font-medium ${
                  selectedEmoji === mood.emoji ? "text-white" : "text-slate-400"
                }`}
              >
                {mood.label}
              </div>
              {selectedEmoji === mood.emoji && (
                <motion.div
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Optional Descriptor */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Optional: One-word descriptor
        </label>
        <Input
          type="text"
          placeholder="e.g., grateful, frustrated, excited..."
          value={descriptor}
          onChange={(e) => setDescriptor(e.target.value)}
          maxLength={50}
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 border-white/20 hover:bg-white/10"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedEmoji}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            <>
              <Smile className="w-4 h-4 mr-2" />
              Log Mood
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

