'use client';

import { useEffect, useRef, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageItem, type ChatMessageItemData } from './ChatMessageItem';
import { TypingIndicator } from '@/components/chat';
import { DateSeparator } from './DateSeparator';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import { useChatWallpaper } from '../hooks/useChatWallpaper';

interface ChatMessagesListProps {
  messages: ChatMessageItemData[];
  currentUserId?: string;
  isLoading?: boolean;
  isTyping?: boolean;
  isGroupChat?: boolean;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onUserClick?: (userId: string, userName: string, userAvatar?: string | null) => void;
  onViewOnce?: (messageId: string) => void;
  className?: string;
  searchQuery?: string;
  highlightedMessageId?: string;
}

export function ChatMessagesList({
  messages,
  currentUserId,
  isLoading = false,
  isTyping = false,
  isGroupChat = false,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onStar,
  onPin,
  onReaction,
  onUserClick,
  onViewOnce,
  className,
  searchQuery,
  highlightedMessageId,
}: ChatMessagesListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { current: wallpaper } = useChatWallpaper();

  // Group messages by date and insert date separators
  const messagesWithSeparators = useMemo(() => {
    if (messages.length === 0) return [];

    const seenIds = new Set<string>();
    const uniqueMessages = messages.filter((m) => {
      if (seenIds.has(m.id)) return false;
      seenIds.add(m.id);
      return true;
    });

    const result: Array<{ type: 'message' | 'separator'; data: ChatMessageItemData | Date }> = [];
    let lastDate: Date | null = null;

    for (const message of uniqueMessages) {
      if (!message.timestamp) {
        // If no timestamp, just add the message
        result.push({ type: 'message', data: message });
        continue;
      }

      const messageDate = new Date(message.timestamp);

      // Check if we need to add a date separator
      // Compare only the date part (year, month, day), ignoring time
      if (!lastDate || !isSameDay(messageDate, lastDate)) {
        result.push({ type: 'separator', data: messageDate });
        lastDate = messageDate;
      }

      result.push({ type: 'message', data: message });
    }

    return result;
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  // Scroll to highlighted (search) message
  useEffect(() => {
    if (!highlightedMessageId) return;
    const el = document.getElementById(`msg-${highlightedMessageId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedMessageId]);

  return (
    <ScrollArea ref={scrollRef} className={cn('flex-1 h-full relative', className)}>
      {wallpaper.src ? (
        <>
          {/* Custom wallpaper (fixed, non-scrolling) */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none bg-center bg-cover"
            style={{ backgroundImage: `url("${wallpaper.src}")` }}
          />
          {/* Dark overlay for message-bubble legibility */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none bg-slate-950/55"
          />
        </>
      ) : (
        /* WhatsApp-style doodle pattern background (default) */
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cdefs%3E%3Cstyle%3E.c%7Bfill:none;stroke:%23fff;stroke-width:1;stroke-linecap:round%7D%3C/style%3E%3C/defs%3E%3Cpath class='c' d='M20 15c2-3 6-3 8 0s6 3 8 0'/%3E%3Ccircle cx='60' cy='20' r='6' class='c'/%3E%3Cpath class='c' d='M95 10l5 12 5-12M130 15h12M136 9v12'/%3E%3Cpath class='c' d='M165 12a6 6 0 110 8'/%3E%3Cpath class='c' d='M15 55l8 8m-8 0l8-8'/%3E%3Crect x='50' y='50' width='10' height='14' rx='2' class='c'/%3E%3Cpath class='c' d='M55 50v-3'/%3E%3Cpath class='c' d='M90 55c0-5 10-5 10 0v5H90z'/%3E%3Ccircle cx='135' cy='58' r='7' class='c'/%3E%3Cpath class='c' d='M132 58h6M135 55v6'/%3E%3Cpath class='c' d='M170 52l-4 10h8z'/%3E%3Cpath class='c' d='M22 100a8 8 0 100 1'/%3E%3Cpath class='c' d='M18 97h8M22 93v8'/%3E%3Cpath class='c' d='M55 95l10 10M55 105l10-10'/%3E%3Cpath class='c' d='M92 100h16M100 92v16'/%3E%3Cpath class='c' d='M140 95c0-3 4-6 8-3s8 0 8-3'/%3E%3Cpath class='c' d='M170 95v12l6-6'/%3E%3Cpath class='c' d='M18 145c4-8 12-8 16 0'/%3E%3Ccircle cx='58' cy='148' r='4' class='c'/%3E%3Ccircle cx='68' cy='148' r='4' class='c'/%3E%3Cpath class='c' d='M100 140l-8 16h16z'/%3E%3Cpath class='c' d='M138 142h10v10h-10z'/%3E%3Cpath class='c' d='M175 142c-5 0-8 4-8 8s3 8 8 8'/%3E%3Cpath class='c' d='M10 185l6-6 6 6 6-6'/%3E%3Cpath class='c' d='M55 180v15M50 188h10'/%3E%3Ccircle cx='98' cy='188' r='8' class='c'/%3E%3Cpath class='c' d='M98 183v10M93 188h10'/%3E%3Cpath class='c' d='M135 182c4 0 7 3 7 7s-3 7-7 7-7-3-7-7'/%3E%3Cpath class='c' d='M172 180l-5 8h10l-5 8'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
      )}
      <div className="relative w-full py-3">
        {messagesWithSeparators.map((item) => {
          if (item.type === 'separator') {
            const separatorDate = item.data as Date;
            return (
              <DateSeparator
                key={`separator-${separatorDate.getTime()}`}
                date={separatorDate}
              />
            );
          }

          const message = item.data as ChatMessageItemData;
          const isHighlighted = highlightedMessageId === message.id;
          const isSearchMatch = searchQuery && !message.isDeleted && message.content.toLowerCase().includes(searchQuery.toLowerCase());
          return (
            <div
              key={message.id}
              id={`msg-${message.id}`}
              className={cn(
                'transition-colors duration-300',
                isHighlighted && 'bg-amber-500/10 ring-1 ring-amber-500/30 rounded-lg',
                isSearchMatch && !isHighlighted && 'bg-white/[0.02]',
              )}
            >
              <ChatMessageItem
                message={message}
                currentUserId={currentUserId}
                isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
                isGroupChat={isGroupChat}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onForward={onForward}
                onStar={onStar}
                onPin={onPin}
                onReaction={onReaction}
                onUserClick={onUserClick}
                onViewOnce={onViewOnce}
              />
            </div>
          );
        })}
        {isTyping && (
          <div className="px-4">
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

