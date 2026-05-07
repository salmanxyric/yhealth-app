"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  data: {
    html: string;
    text: string;
    json: Record<string, unknown>;
  } | null;
  onSave: (data: { html: string; text: string; json: Record<string, unknown> }) => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  forceSave: () => Promise<void>;
}

export function useAutoSave({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedTextRef = useRef<string>("");
  const dataRef = useRef(data);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const save = useCallback(async () => {
    const current = dataRef.current;
    if (!current || !enabled) return;
    if (current.text === lastSavedTextRef.current) return;
    if (current.text.trim().length === 0) return;

    setStatus("saving");
    try {
      await onSaveRef.current(current);
      lastSavedTextRef.current = current.text;
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [enabled]);

  // Stable interval that doesn't reset on every keystroke
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(save, interval);
    return () => clearInterval(timer);
  }, [save, interval, enabled]);

  // Save on blur
  useEffect(() => {
    if (!enabled) return;

    let blurTimer: ReturnType<typeof setTimeout>;
    const handleBlur = () => {
      blurTimer = setTimeout(save, 5000);
    };
    const handleFocus = () => {
      clearTimeout(blurTimer);
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      clearTimeout(blurTimer);
    };
  }, [save, enabled]);

  // Emergency save on unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      const current = dataRef.current;
      if (current && current.text.trim().length > 0 && current.text !== lastSavedTextRef.current) {
        try {
          localStorage.setItem(
            "journal-emergency-save",
            JSON.stringify({ ...current, timestamp: new Date().toISOString() })
          );
        } catch { /* localStorage full — best effort */ }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  return { status, lastSavedAt, forceSave: save };
}
