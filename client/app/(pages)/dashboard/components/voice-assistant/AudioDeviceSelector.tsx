"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Mic, Volume2, Check } from "lucide-react";

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface AudioDeviceSelectorProps {
  audioInputs: AudioDevice[];
  audioOutputs: AudioDevice[];
  selectedInputId: string | null;
  selectedOutputId: string | null;
  onSelectInput: (deviceId: string) => void;
  onSelectOutput: (deviceId: string) => void;
  visible: boolean;
}

function DeviceList({
  label,
  icon,
  devices,
  selectedId,
  onSelect,
  listboxId,
}: {
  label: string;
  icon: React.ReactNode;
  devices: AudioDevice[];
  selectedId: string | null;
  onSelect: (deviceId: string) => void;
  listboxId: string;
}) {
  return (
    <div>
      <div
        className="flex items-center px-3 py-2"
        style={{
          gap: "6px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {icon}
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {label}
        </span>
      </div>
      <div
        role="listbox"
        id={listboxId}
        aria-label={label}
        className="py-1"
      >
        {devices.length === 0 ? (
          <div
            className="px-3 py-2 text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            No devices found
          </div>
        ) : (
          devices.map((device) => {
            const isSelected = device.deviceId === selectedId;
            const deviceLabel =
              device.label || `${label} (${device.deviceId.slice(0, 8)}...)`;

            return (
              <div
                key={device.deviceId}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => onSelect(device.deviceId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(device.deviceId);
                  }
                }}
                className="flex items-center cursor-pointer px-3 py-2 transition-colors"
                style={{
                  gap: "8px",
                  background: isSelected
                    ? "rgba(0,208,181,0.12)"
                    : "transparent",
                  color: isSelected ? "#00d0b5" : "rgba(255,255,255,0.8)",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span
                  className="flex-1 text-xs truncate"
                  style={{ lineHeight: "16px" }}
                >
                  {deviceLabel}
                </span>
                {isSelected && (
                  <Check
                    style={{
                      width: "14px",
                      height: "14px",
                      color: "#00d0b5",
                      flexShrink: 0,
                    }}
                    strokeWidth={2.5}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function AudioDeviceSelector({
  audioInputs,
  audioOutputs,
  selectedInputId,
  selectedOutputId,
  onSelectInput,
  onSelectOutput,
  visible,
}: AudioDeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Audio device settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center justify-center rounded-full transition-colors"
        style={{
          width: "36px",
          height: "36px",
          background: isOpen
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#d1d5dc",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          }
        }}
      >
        <Settings
          style={{ width: "16px", height: "16px" }}
          strokeWidth={2}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-72 rounded-xl shadow-2xl overflow-hidden z-[9999]"
            style={{
              background: "#09090e",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            role="dialog"
            aria-label="Audio device selection"
          >
            {/* Header */}
            <div
              className="px-3 py-2.5"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="text-xs font-bold"
                style={{
                  color: "#ffffff",
                  letterSpacing: "0.5px",
                }}
              >
                Audio Devices
              </span>
            </div>

            {/* Microphone section */}
            <DeviceList
              label="Microphone"
              icon={
                <Mic
                  style={{
                    width: "12px",
                    height: "12px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                  strokeWidth={2}
                />
              }
              devices={audioInputs}
              selectedId={selectedInputId}
              onSelect={onSelectInput}
              listboxId="audio-input-listbox"
            />

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "rgba(255,255,255,0.06)",
              }}
            />

            {/* Speaker section */}
            <DeviceList
              label="Speaker"
              icon={
                <Volume2
                  style={{
                    width: "12px",
                    height: "12px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                  strokeWidth={2}
                />
              }
              devices={audioOutputs}
              selectedId={selectedOutputId}
              onSelect={onSelectOutput}
              listboxId="audio-output-listbox"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
