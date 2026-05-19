"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const DEFAULT_MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

interface CallReconnectionConfig {
  callId: string | null;
  isCallActive: boolean;
  connectionState: RTCPeerConnectionState | null;
  onReconnect?: () => Promise<void>;
  maxAttempts?: number;
}

interface CallReconnectionState {
  isReconnecting: boolean;
  reconnectAttempt: number;
  hasGivenUp: boolean;
  networkOnline: boolean;
}

interface CallReconnectionReturn extends CallReconnectionState {
  maxAttempts: number;
  resetReconnection: () => void;
}

/**
 * Detects network drops during an active voice call and manages
 * reconnection attempts with exponential backoff and UI state.
 */
export function useCallReconnection(config: CallReconnectionConfig): CallReconnectionReturn {
  const {
    callId,
    isCallActive,
    connectionState,
    onReconnect,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  } = config;

  const [state, setState] = useState<CallReconnectionState>({
    isReconnecting: false,
    reconnectAttempt: 0,
    hasGivenUp: false,
    networkOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  });

  // Refs to avoid stale closures in async reconnection logic
  const onReconnectRef = useRef(onReconnect);
  const maxAttemptsRef = useRef(maxAttempts);
  const isCallActiveRef = useRef(isCallActive);
  const callIdRef = useRef(callId);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkWaitResolveRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  // Keep refs in sync with latest props
  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    maxAttemptsRef.current = maxAttempts;
  }, [maxAttempts]);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);

  // Track mount status for safe state updates after async operations
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Resets all reconnection state back to defaults.
   * Can be called externally (e.g., user dismisses error) or
   * internally when the connection recovers.
   */
  const resetReconnection = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Resolve any pending network-wait promise so it does not leak
    if (networkWaitResolveRef.current) {
      networkWaitResolveRef.current();
      networkWaitResolveRef.current = null;
    }

    setState({
      isReconnecting: false,
      reconnectAttempt: 0,
      hasGivenUp: false,
      networkOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    });

    console.log("[VoiceAssistant] Reconnection state reset");
  }, []);

  // --- Network online/offline listeners ---
  useEffect(() => {
    const handleOnline = () => {
      console.log("[VoiceAssistant] Network back online");
      setState((prev) => ({ ...prev, networkOnline: true }));

      // If we were waiting for network to come back, resolve the promise
      if (networkWaitResolveRef.current) {
        networkWaitResolveRef.current();
        networkWaitResolveRef.current = null;
      }
    };

    const handleOffline = () => {
      console.log("[VoiceAssistant] Network went offline");
      setState((prev) => ({ ...prev, networkOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * Returns a promise that resolves when the browser reports
   * it is back online. Resolves immediately if already online.
   */
  const waitForNetwork = useCallback((): Promise<void> => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      networkWaitResolveRef.current = resolve;
    });
  }, []);

  /**
   * Core reconnection loop. Called once when a disconnection is
   * detected. Runs up to `maxAttempts` with exponential backoff
   * (1s, 2s, 4s, ...). Waits for network to come back online
   * before each attempt.
   */
  const attemptReconnection = useCallback(async () => {
    const currentCallId = callIdRef.current;

    for (let attempt = 0; attempt < maxAttemptsRef.current; attempt++) {
      // Bail out if the component unmounted, the call ended,
      // or a different call is now active
      if (!isMountedRef.current || !isCallActiveRef.current || callIdRef.current !== currentCallId) {
        console.log("[VoiceAssistant] Reconnection aborted — call context changed");
        if (isMountedRef.current) {
          resetReconnection();
        }
        return;
      }

      setState((prev) => ({
        ...prev,
        isReconnecting: true,
        reconnectAttempt: attempt,
        hasGivenUp: false,
      }));

      console.log(
        `[VoiceAssistant] Reconnection attempt ${attempt + 1}/${maxAttemptsRef.current} for call ${currentCallId}`,
      );

      // Wait for network if offline
      await waitForNetwork();

      // Guard again after potentially awaiting network
      if (!isMountedRef.current || !isCallActiveRef.current || callIdRef.current !== currentCallId) {
        if (isMountedRef.current) {
          resetReconnection();
        }
        return;
      }

      // Exponential backoff delay: 1s, 2s, 4s, ...
      const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise<void>((resolve) => {
        reconnectTimerRef.current = setTimeout(resolve, backoffMs);
      });

      // Guard after backoff delay
      if (!isMountedRef.current || !isCallActiveRef.current || callIdRef.current !== currentCallId) {
        if (isMountedRef.current) {
          resetReconnection();
        }
        return;
      }

      // Attempt the reconnection callback
      if (onReconnectRef.current) {
        try {
          await onReconnectRef.current();
          // If callback did not throw, assume success.
          // The connectionState transition back to 'connected' will
          // trigger the reset via the effect below.
          console.log(`[VoiceAssistant] Reconnection attempt ${attempt + 1} completed successfully`);
          return;
        } catch (error) {
          console.error(`[VoiceAssistant] Reconnection attempt ${attempt + 1} failed:`, error);
        }
      }
    }

    // All attempts exhausted
    if (isMountedRef.current) {
      console.log("[VoiceAssistant] All reconnection attempts exhausted — giving up");
      setState((prev) => ({
        ...prev,
        isReconnecting: false,
        hasGivenUp: true,
      }));
    }
  }, [waitForNetwork, resetReconnection]);

  // --- React to connectionState changes ---
  const prevConnectionStateRef = useRef<RTCPeerConnectionState | null>(null);

  useEffect(() => {
    const prevState = prevConnectionStateRef.current;
    prevConnectionStateRef.current = connectionState;

    // Nothing to do if the call is not active or there is no callId
    if (!isCallActive || !callId) {
      return;
    }

    // Connection recovered — reset reconnection state
    if (connectionState === "connected" && prevState !== "connected" && prevState !== null) {
      console.log("[VoiceAssistant] WebRTC connection recovered");
      resetReconnection();
      return;
    }

    // Connection dropped — start reconnection if not already running
    const isDisconnected = connectionState === "disconnected" || connectionState === "failed";
    const wasConnectedOrNew =
      prevState === "connected" || prevState === "new" || prevState === "connecting" || prevState === null;

    if (isDisconnected && wasConnectedOrNew) {
      setState((prev) => {
        // Do not restart if already reconnecting or given up
        if (prev.isReconnecting || prev.hasGivenUp) {
          return prev;
        }

        console.log(`[VoiceAssistant] Connection ${connectionState} detected — starting reconnection`);
        // Kick off the reconnection loop asynchronously
        attemptReconnection();

        return {
          ...prev,
          isReconnecting: true,
          reconnectAttempt: 0,
          hasGivenUp: false,
        };
      });
    }
  }, [connectionState, isCallActive, callId, resetReconnection, attemptReconnection]);

  // --- Reset when the call ends or a new call starts ---
  useEffect(() => {
    if (!isCallActive) {
      resetReconnection();
    }
  }, [isCallActive, resetReconnection]);

  useEffect(() => {
    // When callId changes (new call), reset any lingering reconnection state
    resetReconnection();
  }, [callId, resetReconnection]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (networkWaitResolveRef.current) {
        networkWaitResolveRef.current();
        networkWaitResolveRef.current = null;
      }
    };
  }, []);

  return {
    isReconnecting: state.isReconnecting,
    reconnectAttempt: state.reconnectAttempt,
    maxAttempts,
    hasGivenUp: state.hasGivenUp,
    networkOnline: state.networkOnline,
    resetReconnection,
  };
}
