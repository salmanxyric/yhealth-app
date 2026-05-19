"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { voiceCallService } from "@/src/shared/services/voice-call.service";

// ============================================================================
// Types
// ============================================================================

export type QualityLevel = "excellent" | "good" | "fair" | "poor" | "unknown";

export interface QualityMetrics {
  /** Audio jitter in seconds */
  jitter: number;
  /** Total packets lost */
  packetsLost: number;
  /** Total packets received */
  packetsReceived: number;
  /** Packet loss as a percentage (0-100) */
  packetLossPercent: number;
  /** Round-trip time in milliseconds */
  roundTripTime: number;
  /** Mean Opinion Score (1-5) */
  mos: number;
  /** Local ICE candidate type (e.g. "host", "srflx", "relay") */
  localCandidateType: string | null;
  /** Remote ICE candidate type */
  remoteCandidateType: string | null;
  /** Timestamp when metrics were collected */
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Polling interval for getStats() in milliseconds */
const STATS_POLL_INTERVAL_MS = 5_000;

/** Minimum packets needed before packet-loss percentage is meaningful */
const MIN_PACKETS_FOR_LOSS_CALC = 1;

// ============================================================================
// MOS Computation (E-model approximation)
// ============================================================================

/**
 * Compute a simplified Mean Opinion Score from network metrics.
 *
 * Uses an E-model R-factor approximation:
 *   effectiveLatency = rtt + jitter * 2.5 + 10
 *   R = 93.2 - (effectiveLatency / 40) - (packetLossPercent * 2.5)
 *   MOS = 1 + 0.035 * R + R * (R - 60) * 0.000007 * R
 *
 * Result is clamped to [1, 5].
 */
function computeMOS(roundTripTimeMs: number, jitterMs: number, packetLossPercent: number): number {
  const effectiveLatency = roundTripTimeMs + jitterMs * 2.5 + 10;
  const R = 93.2 - effectiveLatency / 40 - packetLossPercent * 2.5;
  const rawMOS = 1 + 0.035 * R + R * (R - 60) * 0.000007 * R;
  return Math.min(5, Math.max(1, rawMOS));
}

/**
 * Map a MOS score to a human-readable quality level.
 */
function mosToQualityLevel(mos: number): QualityLevel {
  if (mos >= 4.0) return "excellent";
  if (mos >= 3.5) return "good";
  if (mos >= 3.0) return "fair";
  return "poor";
}

// ============================================================================
// Hook
// ============================================================================

interface UseCallQualityOptions {
  peerConnection: RTCPeerConnection | null;
  callId: string | null;
}

/**
 * Monitors WebRTC call quality metrics (jitter, packet loss, RTT, MOS) from
 * an RTCPeerConnection at a 5-second interval. Optionally reports metrics to
 * the server when a `callId` is provided.
 *
 * @example
 * ```tsx
 * const { quality, metrics, isMonitoring } = useCallQuality({
 *   peerConnection: pcRef.current,
 *   callId: activeCallId,
 * });
 * ```
 */
export function useCallQuality({ peerConnection, callId }: UseCallQualityOptions) {
  const [quality, setQuality] = useState<QualityLevel>("unknown");
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Refs to avoid stale closures in the interval callback
  const callIdRef = useRef(callId);
  const metricsRef = useRef<QualityMetrics | null>(null);

  // Keep refs in sync with latest values
  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  /**
   * Collect stats from the peer connection and derive quality metrics.
   */
  const collectStats = useCallback(async (pc: RTCPeerConnection): Promise<QualityMetrics | null> => {
    try {
      const stats = await pc.getStats();

      let jitter = 0;
      let packetsLost = 0;
      let packetsReceived = 0;
      let roundTripTime = 0;
      let foundAudioInbound = false;

      let localCandidateType: string | null = null;
      let remoteCandidateType: string | null = null;
      let candidateRoundTripTime: number | null = null;

      stats.forEach((report) => {
        // Extract audio inbound-rtp stats
        if (report.type === "inbound-rtp" && report.kind === "audio") {
          foundAudioInbound = true;
          jitter = (report.jitter ?? 0) as number;
          packetsLost = (report.packetsLost ?? 0) as number;
          packetsReceived = (report.packetsReceived ?? 0) as number;
          // roundTripTime may be present on inbound-rtp in some browsers
          if (typeof report.roundTripTime === "number") {
            roundTripTime = report.roundTripTime * 1000; // convert s -> ms
          }
        }

        // Extract candidate-pair stats for RTT and candidate types
        if (report.type === "candidate-pair" && report.state === "succeeded") {
          if (typeof report.currentRoundTripTime === "number") {
            candidateRoundTripTime = (report.currentRoundTripTime as number) * 1000; // s -> ms
          }

          // Resolve local and remote candidate types
          const localId = report.localCandidateId as string | undefined;
          const remoteId = report.remoteCandidateId as string | undefined;

          if (localId) {
            const localCandidate = stats.get(localId);
            if (localCandidate) {
              localCandidateType = (localCandidate.candidateType as string) ?? null;
            }
          }

          if (remoteId) {
            const remoteCandidate = stats.get(remoteId);
            if (remoteCandidate) {
              remoteCandidateType = (remoteCandidate.candidateType as string) ?? null;
            }
          }
        }
      });

      if (!foundAudioInbound) {
        return null;
      }

      // Prefer candidate-pair RTT over inbound-rtp RTT (more reliable)
      if (candidateRoundTripTime !== null) {
        roundTripTime = candidateRoundTripTime;
      }

      const totalPackets = packetsReceived + packetsLost;
      const packetLossPercent =
        totalPackets >= MIN_PACKETS_FOR_LOSS_CALC
          ? (packetsLost / totalPackets) * 100
          : 0;

      // Jitter from getStats() is in seconds; convert to ms for MOS computation
      const jitterMs = jitter * 1000;

      const mos = computeMOS(roundTripTime, jitterMs, packetLossPercent);

      return {
        jitter,
        packetsLost,
        packetsReceived,
        packetLossPercent,
        roundTripTime,
        mos,
        localCandidateType,
        remoteCandidateType,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn("[useCallQuality] Failed to collect stats:", error);
      return null;
    }
  }, []);

  /**
   * Report collected metrics to the server.
   * Fire-and-forget; failures are logged but do not interrupt monitoring.
   */
  const reportMetrics = useCallback(async (currentCallId: string, currentMetrics: QualityMetrics) => {
    try {
      await voiceCallService.reportQuality(currentCallId, {
        jitter: currentMetrics.jitter,
        packetsLost: currentMetrics.packetsLost,
        packetsReceived: currentMetrics.packetsReceived,
        packetLossPercent: currentMetrics.packetLossPercent,
        roundTripTime: currentMetrics.roundTripTime,
        mos: currentMetrics.mos,
        qualityLevel: mosToQualityLevel(currentMetrics.mos),
        localCandidateType: currentMetrics.localCandidateType,
        remoteCandidateType: currentMetrics.remoteCandidateType,
        timestamp: currentMetrics.timestamp,
      });
    } catch (error) {
      // Non-critical: log and continue monitoring
      console.warn("[useCallQuality] Failed to report metrics:", error);
    }
  }, []);

  // Main polling effect
  useEffect(() => {
    if (!peerConnection) {
      return;
    }

    // Only monitor when the connection is in a usable state
    const connectionState = peerConnection.connectionState;
    if (connectionState === "closed" || connectionState === "failed") {
      return;
    }

    let active = true;

    const pollStats = async () => {
      if (active) setIsMonitoring(true);
      // Guard against connection being closed between interval ticks
      if (
        peerConnection.connectionState === "closed" ||
        peerConnection.connectionState === "failed"
      ) {
        return;
      }

      const collected = await collectStats(peerConnection);
      if (!collected) return;

      setMetrics(collected);
      setQuality(mosToQualityLevel(collected.mos));

      // Report to server if we have an active call ID
      const currentCallId = callIdRef.current;
      if (currentCallId) {
        reportMetrics(currentCallId, collected);
      }
    };

    // Collect immediately on mount, then every STATS_POLL_INTERVAL_MS
    pollStats();
    const intervalId = setInterval(pollStats, STATS_POLL_INTERVAL_MS);

    // Listen for connection state changes to stop monitoring when appropriate
    const handleConnectionStateChange = () => {
      const state = peerConnection.connectionState;
      if (state === "closed" || state === "failed" || state === "disconnected") {
        setIsMonitoring(false);
        clearInterval(intervalId);
      }
    };

    peerConnection.addEventListener("connectionstatechange", handleConnectionStateChange);

    return () => {
      active = false;
      clearInterval(intervalId);
      peerConnection.removeEventListener("connectionstatechange", handleConnectionStateChange);
      setQuality("unknown");
      setMetrics(null);
      setIsMonitoring(false);
    };
  }, [peerConnection, collectStats, reportMetrics]);

  return { quality, metrics, isMonitoring } as const;
}
