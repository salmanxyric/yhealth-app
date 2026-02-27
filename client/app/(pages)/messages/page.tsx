'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/chat';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

// Loading fallback component
function MessagesPageLoading() {
  return (
    <div className="flex h-[calc(100vh-0rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesPageLoading />}>
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  // TODO: Implement full person-to-person messaging interface
  // This is a placeholder structure - full implementation would include:
  // - Chat list sidebar
  // - Message list
  // - Chat input with all features
  // - Integration with chatService
  
  return (
    <div className="flex h-[calc(100vh-0rem)] items-center justify-center p-8">
      <EmptyState
        title="Messages"
        description="Person-to-person messaging will be available here. This feature is coming soon."
      />
    </div>
  );
}

