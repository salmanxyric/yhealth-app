'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { ChatList } from './components/ChatList';
import { MessagesView } from './components/MessagesView';
import { cn } from '@/lib/utils';
import { initSocket } from '@/lib/socket-client';

export function ChatPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatListRefreshTrigger, setChatListRefreshTrigger] = useState(0);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      initSocket();
    }
  }, [isAuthenticated, authLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin?callbackUrl=/chat');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-screen max-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900/20">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex h-full w-[30%] max-w-[420px] flex-col border-r border-emerald-200 dark:border-emerald-600/30 bg-white dark:bg-slate-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-6 w-32 bg-white/20" />
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
          </div>
          {/* Search */}
          <div className="px-3 py-2.5 border-b border-emerald-200 dark:border-emerald-600/30">
            <Skeleton className="h-9 w-full rounded-lg bg-emerald-200/30 dark:bg-slate-700/50" />
          </div>
          {/* Chat items */}
          <div className="flex-1 px-0">
            <div className="px-4 py-2">
              <Skeleton className="h-3 w-16 bg-emerald-200/40 dark:bg-emerald-800/30" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-emerald-200/50 dark:bg-slate-700" />
                <div className="flex-1 min-w-0 space-y-2 border-b border-emerald-100 dark:border-emerald-900/30 pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 bg-emerald-200/40 dark:bg-slate-700" style={{ width: `${60 + (i % 3) * 20}px` }} />
                    <Skeleton className="h-3 w-12 bg-emerald-200/30 dark:bg-slate-700/50" />
                  </div>
                  <Skeleton className="h-3 bg-emerald-200/30 dark:bg-slate-700/50" style={{ width: `${120 + (i % 4) * 30}px` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Messages area skeleton */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-200/50 dark:border-emerald-600/20 bg-white/80 dark:bg-slate-800/80">
            <Skeleton className="h-10 w-10 rounded-full bg-emerald-200/50 dark:bg-slate-700" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 bg-emerald-200/40 dark:bg-slate-700" />
              <Skeleton className="h-3 w-20 bg-emerald-200/30 dark:bg-slate-700/50" />
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 px-4 py-6 space-y-5">
            <div className="flex items-end gap-2 max-w-[75%]">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-emerald-200/50 dark:bg-slate-700" />
              <Skeleton className="h-14 w-48 rounded-2xl rounded-bl-sm bg-emerald-200/40 dark:bg-slate-700" />
            </div>
            <div className="flex justify-end max-w-[75%] ml-auto">
              <Skeleton className="h-10 w-40 rounded-2xl rounded-br-sm bg-emerald-300/40 dark:bg-emerald-800/40" />
            </div>
            <div className="flex items-end gap-2 max-w-[75%]">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-emerald-200/50 dark:bg-slate-700" />
              <Skeleton className="h-20 w-60 rounded-2xl rounded-bl-sm bg-emerald-200/40 dark:bg-slate-700" />
            </div>
          </div>
          {/* Input */}
          <div className="px-4 py-3 border-t border-emerald-200/50 dark:border-emerald-600/20">
            <Skeleton className="h-12 w-full rounded-xl bg-emerald-200/30 dark:bg-slate-700/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex h-screen max-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900/20">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSIjZmZmIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] [background-size:40px_40px]" />
      
      {/* Overlay for mobile when sidebar is open */}
      {showSidebar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Chat List Sidebar - Emerald theme */}
      <motion.div
        initial={false}
        animate={{
          x: showSidebar ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'flex h-full flex-col',
          'bg-white dark:bg-slate-800 border-r border-emerald-200 dark:border-emerald-600/30',
          'lg:w-[30%] lg:max-w-[420px] lg:relative lg:translate-x-0',
          showSidebar 
            ? 'fixed inset-y-0 left-0 w-full sm:w-[30%] sm:max-w-[420px] z-30 shadow-2xl' 
            : 'fixed inset-y-0 left-0 w-full sm:w-[30%] sm:max-w-[420px] z-30'
        )}
      >
        <ChatList
          selectedChatId={selectedChatId}
          onSelectChat={(chatId) => {
            setSelectedChatId(chatId);
            if (window.innerWidth < 1024) {
              setShowSidebar(false);
            }
          }}
          refreshTrigger={chatListRefreshTrigger}
        />
      </motion.div>

      {/* Messages View - Emerald theme */}
      <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900/10">
        <MessagesView
          chatId={selectedChatId}
          onBack={() => {
            router.push('/dashboard');
          }}
          onMenuClick={() => {
            setShowSidebar(true);
          }}
          onChatDeleted={() => {
            setSelectedChatId(null);
          }}
          onChatRead={() => {
            // Refresh chat list to update unread counts
            setChatListRefreshTrigger((prev) => prev + 1);
          }}
        />
      </div>
    </div>
  );
}

