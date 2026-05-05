"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  initSocket,
  subscribeToNotificationEvents,
} from "@/lib/socket-client";
import { showBrowserNotification } from "@/lib/web-notifications";

/**
 * Subscribes to `notification:new` app-wide so OS/browser notifications work
 * even on routes that do not mount the header / NotificationDropdown.
 */
export function NotificationSocketBridge() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = initSocket();
    if (!socket) return;

    const unsubscribe = subscribeToNotificationEvents({
      onNew: (data) => {
        showBrowserNotification(data);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user]);

  return null;
}
