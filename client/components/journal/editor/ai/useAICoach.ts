"use client";

import { useState, useCallback } from "react";

export interface CoachInsight {
  type: "pattern" | "connection" | "time_aware" | "encouragement";
  message: string;
  action?: string;
}

interface UseAICoachReturn {
  insights: CoachInsight[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<string>;
  analyzeContent: (text: string, mode: string) => Promise<void>;
  dismissInsight: (index: number) => void;
}

export function useAICoach(): UseAICoachReturn {
  const [insights, setInsights] = useState<CoachInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeContent = useCallback(async (text: string, _mode: string) => {
    if (text.trim().length < 50) return;

    // Pattern detection (client-side for instant feedback)
    const words = text.toLowerCase();
    const newInsights: CoachInsight[] = [];

    const stressWords = ["stress", "anxious", "overwhelm", "worry", "pressure"];
    const stressCount = stressWords.reduce(
      (count, word) => count + (words.split(word).length - 1), 0
    );
    if (stressCount >= 3) {
      newInsights.push({
        type: "pattern",
        message: `You've mentioned stress-related words ${stressCount} times. Want to explore what's driving that?`,
        action: "Reframe this",
      });
    }

    // Time-aware prompts
    const hour = new Date().getHours();
    if (hour >= 21) {
      newInsights.push({
        type: "time_aware",
        message: "It's late — your evening entries tend to be more reflective. Take your time.",
      });
    } else if (hour < 8) {
      newInsights.push({
        type: "time_aware",
        message: "Early morning writing — set an intention for the day ahead.",
      });
    }

    setInsights(newInsights);
  }, []);

  const sendMessage = useCallback(async (_message: string): Promise<string> => {
    setIsLoading(true);
    try {
      // TODO: Wire to /v1/ai/coach/journal API
      // For now, return a placeholder
      await new Promise((r) => setTimeout(r, 1000));
      return "I hear you. Let's explore that thought further — what feels most important to address right now?";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissInsight = useCallback((index: number) => {
    setInsights((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { insights, isLoading, sendMessage, analyzeContent, dismissInsight };
}
