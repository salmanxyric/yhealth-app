"use client";

import { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CameraOff } from "lucide-react";

interface CameraPipProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  visible: boolean;
  isCameraActive: boolean;
}

export function CameraPip({ videoRef, visible, isCameraActive }: CameraPipProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden"
          style={{
            width: "224px",
            height: "288px",
            background: "#0a0c10",
            border: "2px solid rgba(0,208,181,0.5)",
            borderRadius: "24px",
            boxShadow: "0 0 30px 0 rgba(0,208,181,0.1)",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: isCameraActive ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          />

          {/* Subtle edge vignette — softer than Figma reference for live video clarity */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 85% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(2,0,15,0.55) 100%)",
            }}
          />

          {/* Placeholder when stream not yet live */}
          {!isCameraActive && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <CameraOff style={{ width: "28px", height: "28px" }} strokeWidth={1.5} />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.5px",
                }}
              >
                Starting camera…
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
