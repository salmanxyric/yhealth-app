import { Suspense } from "react";
import type { Metadata } from "next";
import CalendarConnectedView from "./CalendarConnectedView";

export const metadata: Metadata = {
  title: "Google Calendar — Connected | Balencia",
  description: "Google Calendar has been synced with your Balencia account.",
};

export default function CalendarConnectedPage() {
  return (
    <Suspense fallback={<div style={{ background: "#02000f", width: "100%", height: "100vh" }} />}>
      <CalendarConnectedView />
    </Suspense>
  );
}
