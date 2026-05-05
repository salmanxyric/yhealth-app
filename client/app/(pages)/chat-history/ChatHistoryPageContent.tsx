"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { DashboardLayout } from "@/components/layout";
import { DashboardPageSkeleton } from "@/components/loading";
import { ChatHistoryTab } from "@/app/(pages)/dashboard/components/tabs/ChatHistoryTab";

function ChatHistoryLoading() {
  return <DashboardPageSkeleton activeTab="chat-history" variant="compact" />;
}

function ChatHistoryContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/chat-history");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <DashboardPageSkeleton activeTab="chat-history" variant="compact" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout activeTab="chat-history">
      <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <ChatHistoryTab />
      </div>
    </DashboardLayout>
  );
}

export default function ChatHistoryPageContent() {
  return (
    <Suspense fallback={<ChatHistoryLoading />}>
      <ChatHistoryContent />
    </Suspense>
  );
}
