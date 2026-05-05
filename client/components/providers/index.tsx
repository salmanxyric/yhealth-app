"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "./session-provider";
import { AuthProvider } from "@/app/context/AuthContext";
import { EntitlementsProvider } from "@/app/context/EntitlementsContext";
import { VoiceAssistantProvider } from "@/app/context/VoiceAssistantContext";
import { ProductTourProvider } from "@/app/context/ProductTourContext";
import { SocketInitializer } from "@/components/common/socket-initializer";
import { Toaster } from "react-hot-toast";
import { MusicPlayerProvider } from "./music-player-provider";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

const ProductTour = dynamic(
  () =>
    import("@/components/common/product-tour/ProductTour").then(
      (m) => m.ProductTour
    ),
  { ssr: false }
);

const GlobalAchievementToast = dynamic(
  () =>
    import(
      "@/app/(pages)/dashboard/components/tabs/achievements/AchievementToast"
    ).then((m) => m.AchievementToast),
  { ssr: false }
);

const DesktopNotificationPrompt = dynamic(
  () =>
    import("@/components/notifications/DesktopNotificationPrompt").then(
      (m) => m.DesktopNotificationPrompt
    ),
  { ssr: false }
);

const NotificationSocketBridge = dynamic(
  () =>
    import("@/components/notifications/NotificationSocketBridge").then(
      (m) => m.NotificationSocketBridge
    ),
  { ssr: false }
);

const EntitlementsSocketBridge = dynamic(
  () =>
    import("@/components/notifications/EntitlementsSocketBridge").then(
      (m) => m.EntitlementsSocketBridge
    ),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

const REDUCE_MOTION_KEY = "yhealth-reduce-motion";

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    try {
      if (localStorage.getItem(REDUCE_MOTION_KEY) === "1") {
        document.documentElement.classList.add("reduce-motion");
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <SessionProvider>
      <AuthProvider>
        <EntitlementsProvider>
          <SocketInitializer />
          <NotificationSocketBridge />
          <EntitlementsSocketBridge />
          <VoiceAssistantProvider>
          <ProductTourProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              forcedTheme="dark"
              disableTransitionOnChange
            >
              <MusicPlayerProvider>
                {children}
              </MusicPlayerProvider>
              <UpgradeModal />
              <ProductTour />
              <GlobalAchievementToast />
              <DesktopNotificationPrompt />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.3)",
                  },
                  success: {
                    iconTheme: {
                      primary: "hsl(var(--primary))",
                      secondary: "white",
                    },
                    style: {
                      borderLeft: "4px solid hsl(var(--primary))",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "hsl(var(--destructive))",
                      secondary: "white",
                    },
                    style: {
                      borderLeft: "4px solid hsl(var(--destructive))",
                    },
                  },
                }}
              />
            </ThemeProvider>
          </ProductTourProvider>
        </VoiceAssistantProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
