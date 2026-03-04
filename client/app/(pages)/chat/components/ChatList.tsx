'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Search, MessageSquare, Users, UserPlus, UserRoundPlus, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
import { useVoiceAssistant } from '@/app/context/VoiceAssistantContext';
import { JoinGroupDialog } from './JoinGroupDialog';
import { CreateGroupDialog } from './CreateGroupDialog';

interface ChatListProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  refreshTrigger?: number; // Add trigger to force refresh
}

export function ChatList({ selectedChatId, onSelectChat, refreshTrigger }: ChatListProps) {
  const { user } = useAuth();
  const { assistantName } = useVoiceAssistant();
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

    // For 1-on-1 chats with no other participant (AI coach), use assistant name
    return assistantName || 'AI Coach';
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
      <div className="flex h-full flex-col bg-white dark:bg-[#111827]">
        <div className="px-5 py-4 flex items-center justify-between bg-emerald-600 dark:bg-emerald-700">
          <Skeleton className="h-6 w-24 rounded-md bg-white/20" />
          <Skeleton className="h-8 w-8 rounded-lg bg-white/20" />
        </div>
        <div className="px-4 pb-3">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex-1 px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 rounded" style={{ width: `${60 + (i % 3) * 20}px` }} />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
                <Skeleton className="h-3 rounded" style={{ width: `${120 + (i % 4) * 30}px` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#111827]">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-linear-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Image
              src="/logo1.png"
              alt="yHealth"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            yHealth
          </h2>
        </motion.div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/80 hover:text-white hover:bg-white/15">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-slate-200 dark:border-slate-700">
            <DropdownMenuItem onClick={() => setShowJoinDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Join Group
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Create Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-10 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/8 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-xl h-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center p-8 text-center"
          >
            <div className="mb-4 h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/8 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Start a new conversation
            </p>
          </motion.div>
        ) : (
          <div className="px-2">
            {groupOrder.map((groupName) => {
              const groupChats = groupedChats[groupName];
              if (!groupChats || groupChats.length === 0) return null;

              return (
                <div key={groupName}>
                  <div className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500/80 uppercase tracking-widest">
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
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => onSelectChat(chat.id)}
                        className={cn(
                          'group relative flex w-full items-center gap-3 px-3 py-3 text-left rounded-xl',
                          'transition-all duration-150',
                          'hover:bg-slate-50 dark:hover:bg-white/5',
                          'active:scale-[0.98]',
                          isSelected && 'bg-emerald-50 dark:bg-emerald-500/10 shadow-sm shadow-emerald-500/5'
                        )}
                      >
                        {/* Avatar */}
                        <div className="relative h-12 w-12 shrink-0 rounded-full">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt={title} className="h-full w-full object-cover rounded-full" />
                          ) : chat.isGroupChat ? (
                            <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center rounded-full">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center rounded-full">
                              <span className="text-lg font-semibold text-white">
                                {title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -right-0.5 -top-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white px-1 ring-2 ring-white dark:ring-slate-900">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.div>

                          )}
                        </div>

                        {/* Chat Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className={cn(
                              'truncate font-semibold text-[15px]',
                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                            )}>
                              {title}
                            </h3>
                            {lastMessageTime && (
                              <span className={cn(
                                'shrink-0 text-[11px] font-medium',
                                unreadCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                              )}>
                                {lastMessageTime}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                'truncate text-[13px] flex-1',
                                unreadCount > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'
                              )}>{lastMessage}</p>
                              {unreadCount > 0 && (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
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

