"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, PhoneOff } from "lucide-react";

interface ReconnectionOverlayProps {
  isReconnecting: boolean;
  attempt: number;
  maxAttempts: number;
  hasGivenUp: boolean;
  networkOnline: boolean;
  onRetry?: () => void;
  onEndCall?: () => void;
}

function SpinningLoader() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      className="flex items-center justify-center"
    >
      <RefreshCw
        style={{ width: "28px", height: "28px", color: "#00d0b5" }}
        strokeWidth={2}
      />
    </motion.div>
  );
}

function ActionButton({
  onClick,
  label,
  variant,
  icon,
}: {
  onClick: () => void;
  label: string;
  variant: "primary" | "destructive";
  icon: React.ReactNode;
}) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center justify-center rounded-xl font-medium text-sm transition-colors"
      style={{
        gap: "8px",
        height: "44px",
        paddingLeft: "20px",
        paddingRight: "20px",
        background: isPrimary
          ? "linear-gradient(90deg, #00d0b5, #2d9cdb)"
          : "rgba(239,68,68,0.15)",
        color: isPrimary ? "#ffffff" : "#ef4444",
        border: isPrimary
          ? "none"
          : "1px solid rgba(239,68,68,0.3)",
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

export function ReconnectionOverlay({
  isReconnecting,
  attempt,
  maxAttempts,
  hasGivenUp,
  networkOnline,
  onRetry,
  onEndCall,
}: ReconnectionOverlayProps) {
  const isVisible = isReconnecting || hasGivenUp || !networkOnline;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          role="alertdialog"
          aria-live="assertive"
          aria-modal="true"
          aria-label={
            !networkOnline
              ? "Network disconnected"
              : hasGivenUp
                ? "Connection lost"
                : "Reconnecting to call"
          }
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center rounded-2xl"
            style={{
              gap: "16px",
              width: "320px",
              maxWidth: "90vw",
              padding: "32px 24px",
              background: "#0f1116",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Network offline state */}
            {!networkOnline && (
              <>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "rgba(239,68,68,0.12)",
                  }}
                >
                  <WifiOff
                    style={{ width: "28px", height: "28px", color: "#ef4444" }}
                    strokeWidth={2}
                  />
                </div>
                <div className="flex flex-col items-center" style={{ gap: "6px" }}>
                  <h2
                    className="font-bold text-center"
                    style={{
                      fontSize: "16px",
                      lineHeight: "22px",
                      color: "#ffffff",
                      margin: 0,
                    }}
                  >
                    Network disconnected
                  </h2>
                  <p
                    className="text-center"
                    style={{
                      fontSize: "13px",
                      lineHeight: "18px",
                      color: "rgba(255,255,255,0.5)",
                      margin: 0,
                    }}
                  >
                    Waiting for connection...
                  </p>
                </div>
                <motion.div
                  className="rounded-full"
                  style={{
                    width: "40px",
                    height: "4px",
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "rgba(239,68,68,0.5)",
                      borderRadius: "inherit",
                    }}
                  />
                </motion.div>
              </>
            )}

            {/* Reconnecting state */}
            {networkOnline && isReconnecting && !hasGivenUp && (
              <>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "rgba(0,208,181,0.1)",
                  }}
                >
                  <SpinningLoader />
                </div>
                <div className="flex flex-col items-center" style={{ gap: "6px" }}>
                  <h2
                    className="font-bold text-center"
                    style={{
                      fontSize: "16px",
                      lineHeight: "22px",
                      color: "#ffffff",
                      margin: 0,
                    }}
                  >
                    Reconnecting...
                  </h2>
                  <p
                    className="text-center"
                    style={{
                      fontSize: "13px",
                      lineHeight: "18px",
                      color: "rgba(255,255,255,0.5)",
                      margin: 0,
                    }}
                  >
                    Attempt {attempt}/{maxAttempts}
                  </p>
                </div>
              </>
            )}

            {/* Given up state */}
            {networkOnline && hasGivenUp && (
              <>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "rgba(239,68,68,0.12)",
                  }}
                >
                  <WifiOff
                    style={{ width: "28px", height: "28px", color: "#ef4444" }}
                    strokeWidth={2}
                  />
                </div>
                <div className="flex flex-col items-center" style={{ gap: "6px" }}>
                  <h2
                    className="font-bold text-center"
                    style={{
                      fontSize: "16px",
                      lineHeight: "22px",
                      color: "#ffffff",
                      margin: 0,
                    }}
                  >
                    Connection lost
                  </h2>
                  <p
                    className="text-center"
                    style={{
                      fontSize: "13px",
                      lineHeight: "18px",
                      color: "rgba(255,255,255,0.5)",
                      margin: 0,
                    }}
                  >
                    Unable to reconnect after {maxAttempts} attempts
                  </p>
                </div>
                <div
                  className="flex items-center w-full"
                  style={{ gap: "10px", marginTop: "4px" }}
                >
                  {onRetry && (
                    <div className="flex-1">
                      <ActionButton
                        onClick={onRetry}
                        label="Try Again"
                        variant="primary"
                        icon={
                          <RefreshCw
                            style={{ width: "16px", height: "16px" }}
                            strokeWidth={2}
                          />
                        }
                      />
                    </div>
                  )}
                  {onEndCall && (
                    <div className="flex-1">
                      <ActionButton
                        onClick={onEndCall}
                        label="End Call"
                        variant="destructive"
                        icon={
                          <PhoneOff
                            style={{ width: "16px", height: "16px" }}
                            strokeWidth={2}
                          />
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
