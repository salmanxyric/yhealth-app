'use client';

import { useEffect, useRef, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessageItem, type ChatMessageItemData } from './ChatMessageItem';
import { TypingIndicator } from '@/components/chat';
import { DateSeparator } from './DateSeparator';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';

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
  className?: string;
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
  className,
}: ChatMessagesListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages by date and insert date separators
  const messagesWithSeparators = useMemo(() => {
    if (messages.length === 0) return [];

    const result: Array<{ type: 'message' | 'separator'; data: ChatMessageItemData | Date }> = [];
    let lastDate: Date | null = null;

    for (const message of messages) {
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bb6df240-51fe-4dc2-a5e6-f43a10ef3d12',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatMessagesList.tsx:44',message:'Auto-scroll effect triggered',data:{messagesCount:messages.length,hasMessagesEndRef:!!messagesEndRef.current,hasScrollRef:!!scrollRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Use setTimeout to ensure DOM is updated
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bb6df240-51fe-4dc2-a5e6-f43a10ef3d12',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatMessagesList.tsx:49',message:'Attempting scrollIntoView',data:{hasMessagesEndRef:!!messagesEndRef.current,scrollHeight:messagesEndRef.current?.scrollHeight,clientHeight:messagesEndRef.current?.clientHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  // #region agent log
  useEffect(() => {
    if (scrollRef.current) {
      const scrollAreaElement = scrollRef.current as HTMLElement;
      const viewport = scrollAreaElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
      if (viewport) {
        fetch('http://127.0.0.1:7242/ingest/bb6df240-51fe-4dc2-a5e6-f43a10ef3d12',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatMessagesList.tsx:62',message:'ScrollArea dimensions check',data:{scrollAreaHeight:scrollAreaElement.offsetHeight,viewportHeight:viewport.offsetHeight,viewportScrollHeight:viewport.scrollHeight,viewportClientHeight:viewport.clientHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const firstMsg = messages[0];
      const lastMsg = messages[messages.length - 1];
      fetch('http://127.0.0.1:7242/ingest/bb6df240-51fe-4dc2-a5e6-f43a10ef3d12',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatMessagesList.tsx:70',message:'Messages render check',data:{messagesCount:messages.length,firstMessageContent:firstMsg?.content?.substring(0,50),lastMessageContent:lastMsg?.content?.substring(0,50),firstHasLineBreaks:firstMsg?.content?.includes('\n'),lastHasLineBreaks:lastMsg?.content?.includes('\n')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
  }, [messages]);
  // #endregion

  return (
    <ScrollArea ref={scrollRef} className={cn('flex-1 h-full', className)}>
      <div className="w-full py-2">
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
          return (
            <ChatMessageItem
              key={message.id}
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
            />
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

