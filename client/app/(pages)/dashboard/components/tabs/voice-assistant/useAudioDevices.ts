"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── localStorage keys ──────────────────────────────────────────────
const LS_INPUT_KEY = "voice-assistant-input-device";
const LS_OUTPUT_KEY = "voice-assistant-output-device";

// ── Helpers ────────────────────────────────────────────────────────

/** Safe localStorage read — returns null when unavailable (SSR / iframe). */
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Safe localStorage write. */
function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage quota exceeded or unavailable — silently ignore.
  }
}

// ── Types ──────────────────────────────────────────────────────────

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceInfo["kind"];
  groupId: string;
}

export interface UseAudioDevicesReturn {
  /** Available microphone devices. */
  audioInputs: AudioDeviceInfo[];
  /** Available speaker / headphone devices. */
  audioOutputs: AudioDeviceInfo[];
  /** Currently selected input deviceId, or null if none selected. */
  selectedInputId: string | null;
  /** Currently selected output deviceId, or null if none selected. */
  selectedOutputId: string | null;
  /** Select an input device by deviceId. Persists to localStorage. */
  setSelectedInput: (deviceId: string) => void;
  /** Select an output device by deviceId. Persists to localStorage. */
  setSelectedOutput: (deviceId: string) => void;
  /**
   * Get a new MediaStream using the currently selected input device.
   * Stops all tracks on the provided (old) stream before returning
   * the replacement stream.
   */
  applyInputDevice: (stream: MediaStream) => Promise<MediaStream>;
  /** True while the initial device enumeration is in progress. */
  isLoading: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────

export function useAudioDevices(): UseAudioDevicesReturn {
  const [audioInputs, setAudioInputs] = useState<AudioDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<AudioDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputIdState] = useState<string | null>(null);
  const [selectedOutputId, setSelectedOutputIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref so the `applyInputDevice` callback always reads the latest
  // selected input without needing to be recreated on every state change.
  const selectedInputRef = useRef<string | null>(null);

  // ── Enumerate devices ──────────────────────────────────────────

  const enumerateDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setIsLoading(false);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputs: AudioDeviceInfo[] = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
          kind: d.kind,
          groupId: d.groupId,
        }));

      const outputs: AudioDeviceInfo[] = devices
        .filter((d) => d.kind === "audiooutput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker (${d.deviceId.slice(0, 8)})`,
          kind: d.kind,
          groupId: d.groupId,
        }));

      setAudioInputs(inputs);
      setAudioOutputs(outputs);

      // ── Restore / validate persisted selections ──────────────
      const storedInput = readStorage(LS_INPUT_KEY);
      const storedOutput = readStorage(LS_OUTPUT_KEY);

      const inputStillExists = storedInput !== null && inputs.some((d) => d.deviceId === storedInput);
      const outputStillExists = storedOutput !== null && outputs.some((d) => d.deviceId === storedOutput);

      const resolvedInput = inputStillExists ? storedInput : (inputs[0]?.deviceId ?? null);
      const resolvedOutput = outputStillExists ? storedOutput : (outputs[0]?.deviceId ?? null);

      setSelectedInputIdState(resolvedInput);
      selectedInputRef.current = resolvedInput;

      setSelectedOutputIdState(resolvedOutput);

      // Persist the resolved value so next load doesn't have to re-resolve.
      if (resolvedInput !== null) writeStorage(LS_INPUT_KEY, resolvedInput);
      if (resolvedOutput !== null) writeStorage(LS_OUTPUT_KEY, resolvedOutput);
    } catch (error) {
      // Permission denied or other error — leave lists empty.
      console.warn("[useAudioDevices] Failed to enumerate devices:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Mount + devicechange listener ──────────────────────────────

  useEffect(() => {
    enumerateDevices();

    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!mediaDevices) return;

    const handleDeviceChange = () => {
      enumerateDevices();
    };

    mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [enumerateDevices]);

  // ── Setters with persistence ───────────────────────────────────

  const setSelectedInput = useCallback((deviceId: string) => {
    setSelectedInputIdState(deviceId);
    selectedInputRef.current = deviceId;
    writeStorage(LS_INPUT_KEY, deviceId);
  }, []);

  const setSelectedOutput = useCallback((deviceId: string) => {
    setSelectedOutputIdState(deviceId);
    writeStorage(LS_OUTPUT_KEY, deviceId);
  }, []);

  // ── Apply input device to a MediaStream ────────────────────────

  const applyInputDevice = useCallback(async (oldStream: MediaStream): Promise<MediaStream> => {
    // Stop every track on the old stream so the browser releases the mic.
    for (const track of oldStream.getTracks()) {
      track.stop();
    }

    const deviceId = selectedInputRef.current;

    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      return newStream;
    } catch (error) {
      // If the exact device fails (e.g. unplugged), fall back to default.
      console.warn("[useAudioDevices] Failed to get stream for device, falling back to default:", error);
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return fallbackStream;
    }
  }, []);

  return {
    audioInputs,
    audioOutputs,
    selectedInputId,
    selectedOutputId,
    setSelectedInput,
    setSelectedOutput,
    applyInputDevice,
    isLoading,
  };
}
