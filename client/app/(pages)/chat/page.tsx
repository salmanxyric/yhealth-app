'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatPageContent } from './ChatPageContent';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

// Loading fallback component
function ChatPageLoading() {
  return (
    <div className="flex h-[calc(100vh-0rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
