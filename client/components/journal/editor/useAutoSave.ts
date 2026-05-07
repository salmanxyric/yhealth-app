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
  const lastSavedDataRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useCallback(async () => {
    if (!data || !enabled) return;

    const dataHash = data.text;
    if (dataHash === lastSavedDataRef.current) return;
    if (data.text.trim().length === 0) return;

    setStatus("saving");
    try {
      await onSave(data);
      lastSavedDataRef.current = dataHash;
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [data, onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(save, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
      if (data && data.text.trim().length > 0 && data.text !== lastSavedDataRef.current) {
        try {
          localStorage.setItem(
            "journal-emergency-save",
            JSON.stringify({ ...data, timestamp: new Date().toISOString() })
          );
        } catch { /* localStorage full — best effort */ }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data, enabled]);

  return { status, lastSavedAt, forceSave: save };
}
