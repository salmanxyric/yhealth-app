"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import {
  browserNotificationsSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from "@/lib/web-notifications";

const STORAGE_DISMISS = "balencia_desktop_notif_banner_dismissed";

/**
 * After sign-in, offers desktop/browser notifications so real-time alerts
 * surface even when the tab is in the background (requires explicit Enable click
 * for reliable permission grants across browsers).
 */
export function DesktopNotificationPrompt() {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!browserNotificationsSupported()) return;

    const perm = getBrowserNotificationPermission();
    if (perm !== "default") return;

    try {
      if (localStorage.getItem(STORAGE_DISMISS) === "1") return;
    } catch {
      /* ignore */
    }

    const t = window.setTimeout(() => setVisible(true), 3500);
    return () => window.clearTimeout(t);
  }, [isAuthenticated]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_DISMISS, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const enable = useCallback(async () => {
    const result = await requestBrowserNotificationPermission();
    setVisible(false);
    if (result === "denied") {
      try {
        localStorage.setItem(STORAGE_DISMISS, "1");
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="desktop-notif-title"
          aria-describedby="desktop-notif-desc"
          initial={{ opacity: 0, y: 24, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 16, x: "-50%" }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,400px)] pointer-events-auto"
        >
          <div
            className="rounded-2xl border border-cyan-500/25 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 px-4 py-3.5 flex gap-3 items-start"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30">
              <Bell className="h-5 w-5 text-cyan-300" aria-hidden />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p id="desktop-notif-title" className="text-sm font-semibold text-white">
                Desktop alerts for Balencia
              </p>
              <p id="desktop-notif-desc" className="text-xs text-slate-400 mt-1 leading-relaxed">
                Get a system notification when something new arrives so you do not miss reminders
                while you are focused elsewhere. You can change this anytime in the browser site
                settings.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={enable}
                  className="rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 transition-colors"
                >
                  Enable alerts
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
