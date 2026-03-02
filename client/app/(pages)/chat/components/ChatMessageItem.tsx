'use client';

import { memo } from 'react';
import { format } from 'date-fns';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageBubble, MessageStatus, MessageMedia } from '@/components/chat';
import { AudioPlayer } from './AudioPlayer';
import { MessageMenu } from './MessageMenu';
import { MessageReactions } from './MessageReactions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface ChatMessageItemData {
  id: string;
  role: 'user' | 'assistant';
  senderId?: string;
  senderName?: string;
  senderAvatar?: string | null;
  content: string;
  timestamp?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  contentType?: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  fileSize?: number;
  repliedTo?: {
    id: string;
    content: string;
    senderName?: string;
  };
  reactions?: Array<{ emoji: string; count: number; userIds: string[] }>;
  isStarred?: boolean;
  isPinned?: boolean;
  isViewOnce?: boolean;
  viewOnceOpenedAt?: string | null;
}

interface ChatMessageItemProps {
  message: ChatMessageItemData;
  currentUserId?: string;
  isLoading?: boolean;
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
}

export const ChatMessageItem = memo(function ChatMessageItem({
  message,
  currentUserId,
  isLoading = false,
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
}: ChatMessageItemProps) {
  // Use senderId comparison for accurate user detection
  const isUser = message.senderId === currentUserId;
  // View-once logic
  const isViewOnce = message.isViewOnce;
  const viewOnceOpened = isViewOnce && !!message.viewOnceOpenedAt;
  // For view-once: hide media if opened (or if recipient hasn't opened yet, show locked placeholder)
  const showMedia = !isViewOnce
    ? (message.mediaUrl && message.mediaType !== 'audio')
    : false; // View-once media is never shown via normal MediaMessage
  const showAudio = !isViewOnce
    ? (message.mediaUrl && message.mediaType === 'audio')
    : false;
  // Only show text bubble if there's actual content (not just whitespace)
  const hasTextContent = message.content && message.content.trim().length > 0;
  // Check if this is a system message
  const isSystemMessage = message.contentType === 'system';

  // Get content type label for view-once
  const viewOnceLabel = message.mediaType === 'video' ? 'video'
    : message.mediaType === 'audio' ? 'audio'
    : 'photo';

  // Get initials from sender name
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0]?.toUpperCase() || '?';
  };

  const handleCopy = () => {
    if (message.content && !message.isDeleted) {
      navigator.clipboard.writeText(message.content);
    }
  };

  // System messages are displayed centered without bubble
  if (isSystemMessage) {
    return (
      <div className="flex items-center justify-center px-4 py-2">
        <div className="text-xs text-muted-foreground italic bg-muted/30 px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex gap-2 px-4 py-1 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar - Only show for other users' messages (left side) */}
      {!isUser && (
        <button
          onClick={() => {
            if (onUserClick && message.senderId && message.senderName) {
              onUserClick(message.senderId, message.senderName, message.senderAvatar);
            }
          }}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-600/30">
            <AvatarImage src={message.senderAvatar || undefined} alt={message.senderName || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white text-xs">
              {getInitials(message.senderName || '')}
            </AvatarFallback>
          </Avatar>
        </button>
      )}

      {/* Message content */}
      <div
        className={cn('flex flex-col gap-1 w-full', isUser ? 'items-end' : 'items-start')}
      >
        {/* Sender name for group chats (only for other users' messages) */}
        {isGroupChat && !isUser && message.senderName && (
          <button
            onClick={() => {
              if (onUserClick && message.senderId && message.senderName) {
                onUserClick(message.senderId, message.senderName, message.senderAvatar);
              }
            }}
            className="text-[12.5px] text-emerald-600 dark:text-emerald-400 px-2 pb-0.5 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer font-medium"
          >
            {message.senderName}
          </button>
        )}

        {/* Reply context */}
        {message.repliedTo && (
          <div
            className={cn(
              'text-xs text-muted-foreground mb-1 px-3 py-1 border-l-2 border-primary/50 bg-muted/50 rounded',
              isUser ? 'border-r-2 border-l-0' : ''
            )}
          >
            {message.repliedTo.senderName && (
              <div className="font-medium">{message.repliedTo.senderName}</div>
            )}
            <div className="truncate">{message.repliedTo.content}</div>
          </div>
        )}

        <div className={cn('flex items-end gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
            {/* View-once message card */}
            {isViewOnce && (
              viewOnceOpened ? (
                // Already opened — show "Opened" status
                <div className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-2xl',
                  isUser
                    ? 'bg-emerald-600/20 border border-emerald-500/30'
                    : 'bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300/30 dark:border-slate-600/30'
                )}>
                  <Eye className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                    {isUser ? `View once ${viewOnceLabel} \u2022 Opened` : `Opened`}
                  </span>
                </div>
              ) : isUser ? (
                // Sender: waiting for recipient to open
                <div className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-2xl',
                  'bg-emerald-600/20 border border-emerald-500/30'
                )}>
                  <EyeOff className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">
                    View once {viewOnceLabel} &bull; Waiting...
                  </span>
                </div>
              ) : (
                // Recipient: locked, tap to open
                <button
                  onClick={() => onViewOnce?.(message.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all',
                    'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800',
                    'border border-slate-300/50 dark:border-slate-600/50',
                    'hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10',
                    'active:scale-[0.98]'
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      View once {viewOnceLabel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tap to open
                    </p>
                  </div>
                </button>
              )
            )}

            {/* Media */}
            {showMedia && message.mediaType && message.mediaUrl && (
              <MessageMedia
                mediaUrl={message.mediaUrl}
                mediaThumbnail={message.mediaThumbnail}
                mediaType={message.mediaType}
                fileName={message.fileName}
                fileSize={message.fileSize}
                isOwn={isUser}
                className={hasTextContent ? "mb-2" : ""}
              />
            )}

            {/* Audio */}
            {showAudio && (
              <div className={hasTextContent ? "mb-2" : ""}>
                <AudioPlayer src={message.mediaUrl!} isOwn={isUser} />
              </div>
            )}

            {/* Message bubble - only show if there's text content */}
            {hasTextContent && (
              <MessageBubble
                content={message.content}
                isOwn={isUser}
                isDeleted={message.isDeleted}
                isEdited={message.isEdited}
                markdown={!isUser}
              />
            )}

            {/* Timestamp and status - Emerald theme */}
            <div
              className={cn(
                'flex items-center gap-1 text-[11.5px]',
                // Position differently based on whether there's text content
                hasTextContent ? 'px-2 mt-0.5' : (showMedia || showAudio) ? 'px-1 mt-1' : 'px-2 mt-0.5',
                isUser ? 'flex-row-reverse text-white/90' : 'flex-row text-slate-500 dark:text-slate-400'
              )}
            >
              {message.timestamp && (() => {
                try {
                  // Parse the timestamp - backend sends ISO strings (UTC)
                  // If timestamp doesn't have timezone info, treat it as UTC
                  let timestampStr = message.timestamp;
                  
                  // If timestamp doesn't end with 'Z' or timezone offset, append 'Z' to treat as UTC
                  if (!timestampStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(timestampStr)) {
                    timestampStr = timestampStr + 'Z';
                  }
                  
                  const date = new Date(timestampStr);
                  
                  // Validate the date
                  if (isNaN(date.getTime())) {
                    console.warn('Invalid timestamp:', message.timestamp);
                    return null;
                  }
                  
                  // Format in user's local timezone with 12-hour format
                  return <span>{format(date, 'h:mm a')}</span>;
                } catch (error) {
                  console.error('Error formatting timestamp:', error);
                  return null;
                }
              })()}
              {isUser && (
                <MessageStatus status={isLoading ? 'sending' : 'read'} />
              )}
            </div>

            {/* Reactions */}
            <div className={cn('flex items-center gap-1 mt-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
              <MessageReactions
                messageId={message.id}
                reactions={message.reactions || []}
                currentUserId={currentUserId}
                onAddReaction={onReaction}
                onRemoveReaction={onReaction}
              />
            </div>
          </div>

          {/* Message menu */}
          {!message.isDeleted && (
            <MessageMenu
              messageId={message.id}
              isOwn={isUser}
              isStarred={message.isStarred}
              isPinned={message.isPinned}
              onReply={() => onReply?.(message.id)}
              onEdit={isUser ? () => onEdit?.(message.id) : undefined}
              onDelete={() => onDelete?.(message.id)}
              onForward={() => onForward?.(message.id)}
              onStar={() => onStar?.(message.id)}
              onPin={() => onPin?.(message.id)}
              onCopy={handleCopy}
            />
          )}
        </div>
      </div>
    </div>
  );
});

