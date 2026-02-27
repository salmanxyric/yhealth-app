'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Search, MessageSquare, Users, UserPlus, UserRoundPlus, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { chatService, type Chat } from '@/src/shared/services/chat.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/context/AuthContext';
import { JoinGroupDialog } from './JoinGroupDialog';
import { CreateGroupDialog } from './CreateGroupDialog';

interface ChatListProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  refreshTrigger?: number; // Add trigger to force refresh
}

export function ChatList({ selectedChatId, onSelectChat, refreshTrigger }: ChatListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const hasLoadedRef = useRef(false);

  // Keep toast ref up to date
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const isLoadingRef = useRef(false);

  const loadChats = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const data = await chatService.getChats({ limit: 100 });
      setChats(data);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to load chats:', error);
      // Only show toast if it's not a rate limit error (429)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('429') && !errorMessage.includes('rate limit')) {
        toastRef.current({
          title: 'Error',
          description: 'Failed to load chats',
          variant: 'destructive',
        });
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Load chats on mount and when refreshTrigger changes
  useEffect(() => {
    if (!hasLoadedRef.current || refreshTrigger !== undefined) {
      loadChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const getChatTitle = (chat: Chat): string => {
    if (chat.isGroupChat) {
      return chat.chatName || 'Group Chat';
    }

    // For one-on-one chats, find the other participant
    if (chat.participants && user) {
      const otherParticipant = chat.participants.find(
        (p) => p.user && p.user.id !== user.id
      );
      if (otherParticipant?.user) {
        const { firstName, lastName } = otherParticipant.user;
        return `${firstName} ${lastName}`.trim() || otherParticipant.user.email;
      }
    }

    return 'Chat';
  };

  const getChatAvatar = (chat: Chat): string | null => {
    if (chat.avatar) return chat.avatar;

    if (chat.isGroupChat) return null;

    if (chat.participants && user) {
      const otherParticipant = chat.participants.find(
        (p) => p.user && p.user.id !== user.id
      );
      if (otherParticipant?.user?.avatar) {
        return otherParticipant.user.avatar;
      }
    }

    return null;
  };

  const getUnreadCount = (chat: Chat): number => {
    if (!chat.participants || !user) return 0;
    const participant = chat.participants.find((p) => p.userId === user.id);
    return participant?.unreadCount || 0;
  };

  const formatLastMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE');
    } else if (isThisMonth(date)) {
      return format(date, 'MMM d');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const title = getChatTitle(chat).toLowerCase();
    const lastMessage = chat.latestMessage?.content?.toLowerCase() || '';
    return title.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
  });

  const groupedChats = filteredChats.reduce(
    (groups, chat) => {
      const date = new Date(chat.updatedAt || chat.createdAt);
      let group: string;

      if (isToday(date)) {
        group = 'Today';
      } else if (isYesterday(date)) {
        group = 'Yesterday';
      } else if (isThisWeek(date)) {
        group = 'This Week';
      } else if (isThisMonth(date)) {
        group = 'This Month';
      } else {
        group = 'Older';
      }

      if (!groups[group]) groups[group] = [];
      groups[group].push(chat);
      return groups;
    },
    {} as Record<string, Chat[]>
  );

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-slate-800">
        {/* Header skeleton */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between border-b border-emerald-700/50">
          <Skeleton className="h-6 w-32 bg-white/20" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
        </div>
        {/* Search skeleton */}
        <div className="bg-emerald-50/50 dark:bg-slate-800/50 px-3 py-2.5 border-b border-emerald-200 dark:border-emerald-600/30">
          <Skeleton className="h-9 w-full rounded-lg bg-emerald-200/30 dark:bg-slate-700/50" />
        </div>
        {/* Chat item skeletons */}
        <div className="flex-1 px-0">
          <div className="px-4 py-2">
            <Skeleton className="h-3 w-16 bg-emerald-200/40 dark:bg-emerald-800/30" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
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
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-800">
      {/* Header - Emerald theme */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between border-b border-emerald-700/50 shadow-sm">
        <motion.h2
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-semibold text-white"
        >
          Yhealth Chats
        </motion.h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/20">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-600/30 text-slate-900 dark:text-white">
            <DropdownMenuItem onClick={() => setShowJoinDialog(true)} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <UserPlus className="mr-2 h-4 w-4" />
              Join Group
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Create Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search - Emerald theme */}
      <div className="bg-emerald-50/50 dark:bg-slate-800/50 px-3 py-2.5 border-b border-emerald-200 dark:border-emerald-600/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="pl-9 bg-white dark:bg-slate-700 border-emerald-200 dark:border-emerald-600/30 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-lg h-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 bg-white dark:bg-slate-800">
        {filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="mb-4"
            >
              <MessageSquare className="h-12 w-12 text-emerald-300 dark:text-emerald-600" />
            </motion.div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </p>
          </motion.div>
        ) : (
          <div>
            {groupOrder.map((groupName) => {
              const groupChats = groupedChats[groupName];
              if (!groupChats || groupChats.length === 0) return null;

              return (
                <div key={groupName}>
                  <div className="px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {groupName}
                  </div>
                  {groupChats.map((chat) => {
                    const isSelected = selectedChatId === chat.id;
                    const unreadCount = getUnreadCount(chat);
                    const title = getChatTitle(chat);
                    const avatar = getChatAvatar(chat);
                    const lastMessage = chat.latestMessage?.content || '';
                    const lastMessageTime = chat.updatedAt
                      ? formatLastMessageTime(chat.updatedAt)
                      : '';

                    return (
                      <motion.button
                        key={chat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onSelectChat(chat.id)}
                        className={cn(
                          'group relative flex w-full items-center gap-3 px-4 py-3 text-left',
                          'transition-all duration-150',
                          'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:bg-emerald-100 dark:active:bg-emerald-900/30',
                          isSelected && 'bg-emerald-100 dark:bg-emerald-900/30 border-l-2 border-emerald-600'
                        )}
                      >
                        {/* Avatar - Emerald theme */}
                        <div className="relative h-12 w-12 shrink-0  rounded-full ring-2 ring-emerald-200 dark:ring-emerald-600/30">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt={title} className="h-full w-full object-cover rounded-full" />
                          ) : chat.isGroupChat ? (
                            <div className="h-full w-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center rounded-full">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center rounded-full">
                              <span className="text-lg font-semibold text-white">
                                {title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white px-1.5 shadow-lg ring-2 ring-white dark:ring-slate-800">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.div>
                          )}
                        </div>

                        {/* Chat Info - Emerald theme */}
                        <div className="min-w-0 flex-1 border-b border-emerald-100 dark:border-emerald-900/30 pb-3 group-last:border-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={cn(
                              'truncate font-medium text-[17px]',
                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                            )}>
                              {title}
                            </h3>
                            {lastMessageTime && (
                              <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                {lastMessageTime}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm text-slate-600 dark:text-slate-300 flex-1">{lastMessage}</p>
                              {unreadCount > 0 && (
                                <div className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                              )}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Join Group Dialog */}
      <JoinGroupDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onJoinSuccess={async (chat) => {
          // Refresh chat list
          hasLoadedRef.current = false;
          isLoadingRef.current = false;
          await loadChats();
          // Select the newly joined chat
          onSelectChat(chat.id);
          setShowJoinDialog(false);
        }}
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onGroupCreated={async (chat) => {
          // Refresh chat list
          hasLoadedRef.current = false;
          isLoadingRef.current = false;
          await loadChats();
          // Select the newly created chat
          onSelectChat(chat.id);
        }}
      />
    </div>
  );
}

