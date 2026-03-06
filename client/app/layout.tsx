import type { Metadata } from "next";
import { Inter, Poppins, Cinzel, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { VoiceAssistantModal } from "@/components/common/voice-assistant-modal";
import { AlarmProvider } from "./providers/AlarmProvider";
import { ConfirmDialogProvider } from "@/components/common/ConfirmDialog";
import { VisitorTracker } from "@/components/VisitorTracker";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/structured-data";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yhealth.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "YHealth - AI-Powered Personal Health & Wellness Platform",
    template: "%s | YHealth",
  },
  description:
    "Transform your health with AI-driven fitness plans, smart nutrition tracking, mental wellness tools, and personalized coaching. Track workouts, monitor mood, build habits — all in one platform.",
  keywords: [
    "AI health platform",
    "personal wellness app",
    "AI fitness coach",
    "smart health tracking",
    "personalized workout plans",
    "nutrition tracking app",
    "mental wellness platform",
    "health goal tracker",
    "mood tracking",
    "habit builder",
    "guided breathing",
    "holistic health management",
    "digital health coach",
    "wellness dashboard",
  ],
  authors: [{ name: "YHealth Team", url: SITE_URL }],
  creator: "YHealth",
  publisher: "YHealth",
  applicationName: "YHealth",
  category: "Health & Wellness",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "YHealth - AI-Powered Personal Health & Wellness Platform",
    description:
      "AI-driven fitness plans, smart nutrition tracking, mental wellness tools, and personalized coaching — all in one platform.",
    siteName: "YHealth",
  },
  twitter: {
    card: "summary_large_image",
    title: "YHealth - AI-Powered Personal Health & Wellness Platform",
    description:
      "AI-driven fitness plans, smart nutrition tracking, mental wellness tools, and personalized coaching — all in one platform.",
    creator: "@yhealthapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when available:
    // google: "google-verification-code",
    // yandex: "yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd()) }}
        />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} ${cinzel.variable} ${nunito.variable} font-sans antialiased`}
      >
        <Providers>
          <AlarmProvider>
            <ConfirmDialogProvider>
              <VisitorTracker />
              {children}
              {/* <FloatingVoiceAssistantWrapper /> */}
              <VoiceAssistantModal />
            </ConfirmDialogProvider>
          </AlarmProvider>
        </Providers>
      </body>
    </html>
  );
}
