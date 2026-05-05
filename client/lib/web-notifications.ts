import type { NotificationEvent } from "@/lib/socket-client";

const ICON_PATH = "/icons/icon-192.png";

export function browserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!browserNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!browserNotificationsSupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * OS / browser notification when permission is granted.
 * Uses `tag` so the same notification id replaces instead of stacking.
 */
export function showBrowserNotification(ev: NotificationEvent): void {
  if (!browserNotificationsSupported() || Notification.permission !== "granted") return;
  try {
    const icon =
      typeof window !== "undefined"
        ? `${window.location.origin}${ICON_PATH}`
        : undefined;
    const n = new Notification(ev.title, {
      body: ev.message.length > 220 ? `${ev.message.slice(0, 217)}…` : ev.message,
      tag: ev.id,
      icon,
      silent: false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
      if (ev.actionUrl && typeof window !== "undefined") {
        const url = ev.actionUrl.startsWith("http")
          ? ev.actionUrl
          : `${window.location.origin}${ev.actionUrl.startsWith("/") ? ev.actionUrl : `/${ev.actionUrl}`}`;
        window.location.assign(url);
      }
    };
  } catch {
    /* quota / blocked — ignore */
  }
}
