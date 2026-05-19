import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import type { SessionTypeOption } from "../../voice-assistant/SessionTypeSelector";
import { SESSION_DURATIONS } from "../../voice-assistant/SessionTypeSelector";

interface UseCallSessionConfig {
  onSessionEnd?: () => void;
}

interface CallSessionState {
  sessionType: SessionTypeOption | null;
  isTimerActive: boolean;
  startTime: Date | null;
  timeRemainingMs: number | null;
}

export function useCallSession({ onSessionEnd }: UseCallSessionConfig = {}) {
  const [sessionType, setSessionType] = useState<SessionTypeOption | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCountdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (sessionCountdownRef.current) {
      clearInterval(sessionCountdownRef.current);
      sessionCountdownRef.current = null;
    }
  }, []);

  const startSession = useCallback(
    (type: SessionTypeOption) => {
      setSessionType(type);

      const durationMinutes = SESSION_DURATIONS[type] || 15;
      const durationMs = durationMinutes * 60 * 1000;

      setStartTime(new Date());
      setTimeRemainingMs(durationMs);

      clearTimers();

      sessionCountdownRef.current = setInterval(() => {
        setTimeRemainingMs((prev) => {
          if (prev === null || prev <= 1000) return 0;
          return prev - 1000;
        });
      }, 1000);

      sessionTimerRef.current = setTimeout(() => {
        clearTimers();
        setTimeRemainingMs(null);
        setStartTime(null);
        onSessionEnd?.();
        toast.success(`Session completed! Duration: ${durationMinutes} minutes`);
      }, durationMs);
    },
    [clearTimers, onSessionEnd],
  );

  const endSession = useCallback(() => {
    clearTimers();
    setSessionType(null);
    setStartTime(null);
    setTimeRemainingMs(null);
  }, [clearTimers]);

  const state: CallSessionState = {
    sessionType,
    isTimerActive: startTime !== null && timeRemainingMs !== null && timeRemainingMs > 0,
    startTime,
    timeRemainingMs,
  };

  return {
    ...state,
    setSessionType,
    startSession,
    endSession,
    sessionTimerRef,
    sessionCountdownRef,
  };
}
