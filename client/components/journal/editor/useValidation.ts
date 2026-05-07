"use client";

import { useMemo } from "react";
import type { JournalingMode, ValidationCheck, ValidationResult } from "@shared/types/domain/wellbeing";

const WORD_TARGETS: Record<JournalingMode, number> = {
  quick_reflection: 50,
  deep_dive: 200,
  gratitude: 80,
  life_perspective: 150,
  free_write: 100,
  voice_conversation: 50,
};

const WORD_MINIMUMS: Record<JournalingMode, number> = {
  quick_reflection: 20,
  deep_dive: 50,
  gratitude: 30,
  life_perspective: 30,
  free_write: 20,
  voice_conversation: 10,
};

interface UseValidationOptions {
  text: string;
  html: string;
  mode: JournalingMode;
  hasMedia?: boolean;
  hasUnsavedCanvas?: boolean;
  pendingUploads?: number;
}

export function useValidation({
  text,
  html,
  mode,
  hasMedia = false,
  hasUnsavedCanvas = false,
  pendingUploads = 0,
}: UseValidationOptions): ValidationResult {
  return useMemo(() => {
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const checks: ValidationCheck[] = [];

    if (wordCount === 0) {
      checks.push({
        name: "Content",
        status: "block",
        message: "Cannot save an empty entry",
      });
    }

    if (pendingUploads > 0) {
      checks.push({
        name: "Uploads",
        status: "block",
        message: `${pendingUploads} upload(s) still in progress`,
      });
    }

    const minWords = WORD_MINIMUMS[mode];
    if (wordCount > 0 && wordCount < minWords) {
      checks.push({
        name: "Word count",
        status: "warn",
        message: `${wordCount} words — minimum ${minWords} for ${mode.replace("_", " ")}`,
      });
    } else if (wordCount >= minWords) {
      checks.push({
        name: "Word count",
        status: "pass",
        message: `${wordCount} words (minimum ${minWords} met)`,
      });
    }

    if (hasUnsavedCanvas) {
      checks.push({
        name: "Drawing",
        status: "warn",
        message: "Drawing canvas has unsaved changes",
      });
    }

    const target = WORD_TARGETS[mode];
    const wordScore = Math.min(wordCount / target, 1) * 40;

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const uniqueWords = new Set(text.toLowerCase().match(/\b[a-z]+\b/g) ?? []);
    const depthScore = Math.min(
      ((sentences.length / 5) * 10 + (uniqueWords.size / 30) * 10),
      20
    );

    const hasHeadings = /<h[1-3]/i.test(html);
    const hasLists = /<[uo]l/i.test(html);
    const structureScore = (hasHeadings ? 5 : 0) + (hasLists ? 5 : 0);

    const mediaScore = hasMedia ? 10 : 0;

    const reflectiveWords = ["feel", "think", "realize", "notice", "wonder", "grateful", "reflect", "learn"];
    const hasReflection = reflectiveWords.some((w) => text.toLowerCase().includes(w));
    const reflectionScore = hasReflection ? 5 : 0;

    const promptScore = wordCount > 0 ? 15 : 0;

    const completenessScore = Math.round(
      wordScore + depthScore + structureScore + mediaScore + reflectionScore + promptScore
    );

    return {
      completenessScore: Math.min(completenessScore, 100),
      wordCount,
      checks,
    };
  }, [text, html, mode, hasMedia, hasUnsavedCanvas, pendingUploads]);
}
