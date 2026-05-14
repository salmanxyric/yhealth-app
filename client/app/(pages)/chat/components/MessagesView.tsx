'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, ChevronUp, ChevronDown, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChatHeader } from './ChatHeader';
import { ChatMessagesList } from './ChatMessagesList';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { GroupInfoModal } from './GroupInfoModal';
import { EditChatDialog } from './EditChatDialog';
import { ForwardMessageDialog } from './ForwardMessageDialog';
import { ViewOnceViewer } from './ViewOnceViewer';
import { UserHealthProfileModal } from './UserHealthProfileModal';
import { ChatSocialModal } from './ChatSocialModal';
import { chatService, type Chat } from '@/src/shared/services/chat.service';
import { type ChatMessageItemData } from './ChatMessageItem';
import { adaptMessageToChatMessageItem } from '../utils/messageAdapter';
import type { Message } from '@/src/shared/services/chat.service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/context/AuthContext';
import { subscribeToChatEvents, subscribeToUserEvents, getSocket } from '@/lib/socket-client';
import { useVoiceAssistant } from '@/app/context/VoiceAssistantContext';
import { useChatCall } from '@/app/providers/ChatCallProvider';

import { api } from '@/lib/api-client';

interface MessagesViewProps {
  chatId: string | null;
  onBack?: () => void;
  onMenuClick?: () => void;
  onChatDeleted?: () => void;
  onChatRead?: () => void; // Callback when chat is marked as read
  onOpenChatSettings?: (tab: 'general' | 'privacy') => void;
}

export function MessagesView({
  chatId,
  onBack,
  onMenuClick,
  onChatDeleted,
  onChatRead,
  onOpenChatSettings,
}: MessagesViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { assistantName } = useVoiceAssistant();
  const { startCall } = useChatCall();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const [chat, setChat] = useState<Chat | null>(null);
  const isAiChatRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessageItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    senderName?: string;
    mediaType?: string;
  } | null>(null);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [pendingFriendRequestCount, setPendingFriendRequestCount] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    avatar?: string | null;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [viewOnceMedia, setViewOnceMedia] = useState<{
    messageId: string;
    mediaUrl: string;
    mediaThumbnail?: string;
    mediaType: 'image' | 'video' | 'audio';
  } | null>(null);
  const [accountabilityBanner, setAccountabilityBanner] = useState<{
    triggerType?: string;
  } | null>(null);

  // Keep toast ref up to date
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Helper function to reload messages
  const reloadMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const [chatData, messagesData] = await Promise.all([
        chatService.getChatById(chatId),
        chatService.getMessages(chatId, { limit: 50 }),
      ]);
      setChat(chatData);
      // Backend already returns messages in chronological order (oldest first)
      const adaptedMessages = messagesData
        .map((msg) => adaptMessageToChatMessageItem(msg, user?.id, isAiChatRef.current));
      setMessages(adaptedMessages);
    } catch (error) {
      console.error('Failed to reload messages:', error);
    }
  }, [chatId, user?.id]);

  // Load chat details and messages when chatId changes
  useEffect(() => {
    if (!chatId) {
      setChat(null);
      setMessages([]);
      setAccountabilityBanner(null);
      return;
    }

    setAccountabilityBanner(null);
    let cancelled = false;

    const loadChatAndMessages = async () => {
      try {
        setIsLoading(true);

        // Load chat details and messages in parallel
        const [chatData, messagesData] = await Promise.all([
          chatService.getChatById(chatId),
          chatService.getMessages(chatId, { limit: 50 }),
        ]);

        if (cancelled) return;

        setChat(chatData);

        // Detect AI Coach chat (other participant has system email)
        isAiChatRef.current = !chatData.isGroupChat && !!chatData.participants?.some(
          (p) => p.user?.email?.includes('ai-coach') || p.user?.email?.includes('balencia.system')
        );

        // Convert messages to ChatMessageItemData format
        // Backend already returns messages in chronological order (oldest first)
        const adaptedMessages = messagesData
          .map((msg) => adaptMessageToChatMessageItem(msg, user?.id, isAiChatRef.current));

        setMessages(adaptedMessages);

        // Mark chat as read (fire-and-forget, don't block rendering)
        chatService.markChatAsRead(chatId).then(() => {
          if (!cancelled) onChatRead?.();
        }).catch((error) => {
          console.error('Failed to mark chat as read:', error);
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load chat:', error);
        toastRef.current({
          title: 'Error',
          description: 'Failed to load chat messages',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadChatAndMessages();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, user?.id]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!chatId || !user?.id) return;

    // Subscribe to chat events
    const cleanupChat = subscribeToChatEvents(chatId, {
      onNewMessage: (data) => {
        const envelope = data as {
          isAccountabilityMessage?: boolean;
          triggerType?: string;
        };
        if (envelope.isAccountabilityMessage) {
          setAccountabilityBanner({ triggerType: envelope.triggerType });
          window.setTimeout(() => setAccountabilityBanner(null), 14_000);
        }
        // Proactive coach payloads often omit top-level senderId; use message.senderId.
        const messagePayload = data.message as { senderId?: string } | undefined;
        const effectiveSenderId = data.senderId ?? messagePayload?.senderId;
        if (data.message && effectiveSenderId !== user.id) {
          const adapted = adaptMessageToChatMessageItem(data.message as unknown as Message, user.id, isAiChatRef.current);
          setMessages((prev) => {
            if (prev.some((m) => m.id === adapted.id)) return prev;
            return [...prev, adapted];
          });
        } else if (data.message && effectiveSenderId === user.id) {
          // Own message echoed back — update if temp ID differs
          const adapted = adaptMessageToChatMessageItem(data.message as unknown as Message, user.id, isAiChatRef.current);
          setMessages((prev) => {
            if (prev.some((m) => m.id === adapted.id)) return prev;
            return [...prev, adapted];
          });
        }
      },
      onMessageEdited: (data) => {
        const content = data.content ?? (data.message as Record<string, unknown> | undefined)?.content as string | undefined;
        if (data.messageId && content !== undefined) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, content, isEdited: true }
                : msg
            )
          );
        }
      },
      onMessageDeleted: (data) => {
        // Update the message in place to mark it as deleted instead of reloading all messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, isDeleted: true, content: 'This message was deleted', contentType: 'deleted' }
              : msg
          )
        );
      },
      onMessageReaction: (data) => {
        if (data.messageId && data.emoji) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== data.messageId) return msg;
              const reactions = [...(msg.reactions || [])];
              const existing = reactions.find((r) => r.emoji === data.emoji);
              if (data.action === 'remove' && existing) {
                existing.count = Math.max(0, existing.count - 1);
                if (existing.count === 0) {
                  return { ...msg, reactions: reactions.filter((r) => r.emoji !== data.emoji) };
                }
              } else if (existing) {
                existing.count += 1;
              } else {
                reactions.push({ emoji: data.emoji, count: 1, userIds: [data.userId || ''] });
              }
              return { ...msg, reactions };
            })
          );
        }
      },
      onTyping: (data) => {
        if (data.userId && data.userId !== user?.id) {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.add(data.userId!);
            return newSet;
          });
        }
      },
      onStopTyping: (data) => {
        if (data.userId) {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId!);
            return newSet;
          });
        }
      },
      onUserLeftGroup: async (_data) => {
        try {
          // Reload chat to get updated participant list
          const chatData = await chatService.getChatById(chatId);
          setChat(chatData);
          toast({
            title: 'User Left',
            description: 'A member has left the group',
          });
        } catch (error) {
          console.error('Failed to reload chat after user left event:', error);
        }
      },
      onUserJoinedGroup: async (_data) => {
        try {
          // Reload messages to show the new system message
          const messagesData = await chatService.getMessages(chatId, { limit: 50 });
          const adaptedMessages = messagesData
            .map((msg) => adaptMessageToChatMessageItem(msg, user.id, isAiChatRef.current));
          setMessages(adaptedMessages);
          // Reload chat to get updated participant list
          const chatData = await chatService.getChatById(chatId);
          setChat(chatData);
        } catch (error) {
          console.error('Failed to reload chat after user joined event:', error);
        }
      },
      onMessagesRead: (data) => {
        // When another user reads messages, update readBy on all user's sent messages
        if (data.userId && data.userId !== user?.id) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.role === 'user' && msg.senderId === user?.id) {
                const currentReadBy = msg.readBy || [];
                if (!currentReadBy.includes(data.userId)) {
                  return { ...msg, readBy: [...currentReadBy, data.userId] };
                }
              }
              return msg;
            })
          );
        }
      },
      onViewOnceOpened: (data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, viewOnceOpenedAt: data.openedAt, mediaUrl: undefined, mediaThumbnail: undefined }
              : msg
          )
        );
      },
      onReconnect: () => {
        setIsDisconnected(false);
        reloadMessages();
      },
    });

    return cleanupChat;
  }, [chatId, user?.id, toast, reloadMessages]);

  // Track socket disconnection for reconnecting banner
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleDisconnect = () => setIsDisconnected(true);
    const handleConnect = () => setIsDisconnected(false);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);
    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    };
  }, []);

  // Subscribe to user-level events (like groupLeft)
  useEffect(() => {
    if (!user?.id) return;

    const cleanupUser = subscribeToUserEvents({
      onGroupLeft: (data) => {
        toast({
          title: 'Left Group',
          description: `You have left "${data.chatName}"`,
        });
        onChatDeleted?.();
        router.push('/chat');
      },
      onUserOnline: (data) => {
        setOnlineUsers((prev) => { const n = new Set(prev); n.add(data.userId); return n; });
      },
      onUserOffline: (data) => {
        setOnlineUsers((prev) => { const n = new Set(prev); n.delete(data.userId); return n; });
      },
      onFollowRequest: (data) => {
        setPendingFriendRequestCount((count) => count + 1);
        toast({
          title: 'New friend request',
          description: `${data.requesterName} wants to connect with you`,
        });
      },
      onFollowAccepted: (data) => {
        toast({
          title: 'Friend request accepted',
          description: `${data.recipientName} accepted your request`,
        });
        if (data.chatId) {
          router.push(`/chat?chatId=${data.chatId}`);
        }
      },
    });

    return () => {
      if (cleanupUser) cleanupUser();
    };
  }, [user?.id, toast, onChatDeleted, router]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    api.get<{ stats: { pendingCount: number } }>('/follows/stats')
      .then((result) => {
        if (!cancelled) setPendingFriendRequestCount(result.data?.stats.pendingCount ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const searchMatchIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => !m.isDeleted && m.content.toLowerCase().includes(q)).map((m) => m.id);
  }, [messages, searchQuery]);

  const getChatTitle = (chat: Chat | null): string => {
    if (!chat) return 'Chat';

    if (chat.isGroupChat) {
      return chat.chatName || 'Group Chat';
    }

    if (chat.participants && user) {
      const otherParticipant = chat.participants.find(
        (p) => p.user && p.user.id !== user.id
      );
      if (otherParticipant?.user) {
        const isAICoach = otherParticipant.user.email?.includes('ai-coach') ||
          otherParticipant.user.email?.includes('balencia.system');
        if (isAICoach) return assistantName || 'AI Coach';

        const firstName = otherParticipant.user.firstName || '';
        const lastName = otherParticipant.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || otherParticipant.user.email || 'Chat';
      }
    }

    return assistantName || 'AI Coach';
  };

  const getChatSubtitle = (chat: Chat | null): string | undefined => {
    if (!chat || chat.isGroupChat) return undefined;

    if (chat.participants && user) {
      const otherParticipant = chat.participants.find(
        (p) => p.user && p.user.id !== user.id
      );
      if (otherParticipant?.user?.email) {
        return otherParticipant.user.email;
      }
    }

    // AI coach chat — show descriptive subtitle
    return 'AI Health Coach';
  };

  // Check if user is admin or creator
  const isAdmin = chat?.groupAdmin === user?.id;
  const isCreator = chat?.createdBy === user?.id;
  const isGroupAdmin = isAdmin || isCreator;
  const isAiChat = isAiChatRef.current;
  const canStartVoiceCall = !!chat && !isAiChat;
  const canStartAiVoiceCall = !!chat && isAiChat;
  const canStartVideoCall = !!chat && !chat.isGroupChat && !isAiChat && !!chat.participants?.some(
    (p) => p.user && p.user.id !== user?.id
  );

  const handleAiCoachCall = useCallback(() => {
    if (!chatId) return;
    startCall(chatId, 'voice');
  }, [chatId, startCall]);

  // Calculate if user can send messages (for group permissions)
  const canSendMessages = useMemo(() => {
    if (!chat?.isGroupChat || chat.messagePermissionMode !== 'restricted') {
      return true;
    }
    if (isGroupAdmin) return true;
    const allowedSenderIds = chat.allowedSenderIds || [];
    return allowedSenderIds.includes(user?.id || '');
  }, [chat, user?.id, isGroupAdmin]);

  const permissionDeniedMessage = useMemo(() => {
    if (!chat?.isGroupChat || chat.messagePermissionMode !== 'restricted') {
      return undefined;
    }
    if (!canSendMessages) {
      return "You don't have permission to send messages in this group";
    }
    return undefined;
  }, [chat, canSendMessages]);

  // Handler for editing chat/group name
  const handleEditChat = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  // Handler for closing chat (just navigate back, don't leave/delete)
  const handleCloseChat = useCallback(() => {
    onChatDeleted?.();
    // Redirect to chat overview page
    router.push('/chat');
  }, [onChatDeleted, router]);

  // Handler for leaving group (remove user from group)
  // Only available for non-admin members
  const handleLeaveGroup = useCallback(async () => {
    if (!chatId || !chat || !user?.id || !chat.isGroupChat) return;
    
    // Prevent admins/creators from leaving - they must delete the group instead
    if (isGroupAdmin) {
      toast({
        title: 'Cannot Leave',
        description: 'Group admins cannot leave the group. Please delete the group instead.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await chatService.leaveGroupChat(chatId, user.id);
      toast({
        title: 'Success',
        description: 'You have left the group',
      });
      onChatDeleted?.();
      // Redirect to chat overview page
      router.push('/chat');
    } catch (error) {
      console.error('Failed to leave group:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave group';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [chatId, chat, user?.id, toast, onChatDeleted, router, isGroupAdmin]);

  // Handler for deleting chat/group
  const handleDeleteChat = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  // Confirm delete handler
  const handleConfirmDelete = useCallback(async () => {
    if (!chatId || !chat) return;

    try {
      if (chat.isGroupChat) {
        // Use deleteGroup for group chats (admin/creator only)
        await chatService.deleteGroup(chatId);
        toast({
          title: 'Success',
          description: 'Group deleted successfully',
        });
      } else {
        // Use deleteChat for one-on-one chats
        await chatService.deleteChat(chatId);
        toast({
          title: 'Success',
          description: 'Chat deleted successfully',
        });
      }
      setShowDeleteConfirm(false);
      onChatDeleted?.();
      onBack?.();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete chat';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [chatId, chat, toast, onChatDeleted, onBack]);

  // Handler for chat updated (after rename)
  const handleChatUpdated = useCallback(() => {
    reloadMessages();
  }, [reloadMessages]);

  const handleSendMessage = useCallback(
    async (message: string, options?: { mediaFiles?: File[]; repliedToId?: string; isViewOnce?: boolean; gifUrl?: string }) => {
      if (!chatId || (!message.trim() && !options?.mediaFiles?.length && !options?.gifUrl)) return;

      try {
        setIsSending(true);

        let mediaUrl: string | undefined;
        let mediaThumbnail: string | undefined;
        let mediaSize: number | undefined;
        let contentType: string = 'text';

        // Handle GIF sending (no upload needed — direct URL)
        if (options?.gifUrl) {
          contentType = 'gif';
          mediaUrl = options.gifUrl;
        }

        // Handle media upload if files are provided
        if (options?.mediaFiles && options.mediaFiles.length > 0) {
          const file = options.mediaFiles[0]; // Handle first file for now
          
          try {
            const uploadResult = await chatService.uploadMedia(file);

            // Determine content type from file
            if (file.type.startsWith('image/')) contentType = 'image';
            else if (file.type.startsWith('video/')) contentType = 'video';
            else if (file.type.startsWith('audio/')) contentType = 'audio';
            else contentType = 'document';

            mediaUrl = uploadResult.url;
            mediaThumbnail = uploadResult.thumbnail;
            mediaSize = file.size;
          } catch (uploadError: unknown) {
            // Handle upload errors specifically
            // ApiError has message, code, and status properties
            // Also check axios error response structure
            const err = uploadError as { message?: string; code?: string; response?: { data?: { message?: string; code?: string; error?: { message?: string; code?: string } } } };
            const errorMessage =
              err?.message ||
              err?.response?.data?.message ||
              err?.response?.data?.error?.message ||
              'Failed to upload file';
            const errorCode =
              err?.code ||
              err?.response?.data?.code ||
              err?.response?.data?.error?.code;
            
            console.error('File upload error:', {
              message: errorMessage,
              code: errorCode,
              error: uploadError
            });
            
            toast({
              title: errorCode === 'FILE_TOO_LARGE' ? 'File Too Large' : 'Upload Failed',
              description: errorMessage,
              variant: 'destructive',
            });
            
            setIsSending(false);
            return; // Stop message sending if upload fails
          }
        }

        // Send message
        // Only include content if there's text, otherwise omit it for media-only messages
        const messagePayload: {
          chatId: string;
          content?: string;
          contentType: string;
          mediaUrl?: string;
          mediaThumbnail?: string;
          mediaSize?: number;
          repliedTo?: string;
          isViewOnce?: boolean;
        } = {
          chatId,
          contentType,
        };

        // Only include content if there's text
        const trimmedContent = message.trim();
        if (trimmedContent) {
          messagePayload.content = trimmedContent;
        }

        // Include media fields if media was uploaded
        if (mediaUrl) {
          messagePayload.mediaUrl = mediaUrl;
          if (mediaThumbnail) {
            messagePayload.mediaThumbnail = mediaThumbnail;
          }
          if (mediaSize) {
            messagePayload.mediaSize = mediaSize;
          }
        }

        // Include reply if present
        if (options?.repliedToId) {
          messagePayload.repliedTo = options.repliedToId;
        }

        // Include view-once flag if set
        if (options?.isViewOnce) {
          messagePayload.isViewOnce = true;
        }

        const sentMessage = await chatService.sendMessage(messagePayload);

        // Convert and add to messages (avoid duplicate if socket echoed the message first)
        const adaptedMessage = adaptMessageToChatMessageItem(sentMessage, user?.id, isAiChatRef.current);
        setMessages((prev) => {
          if (prev.some((m) => m.id === adaptedMessage.id)) return prev;
          return [...prev, adaptedMessage];
        });

        setReplyTo(null);
      } catch (error) {
        console.error('Failed to send message:', error);
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
        });
      } finally {
        setIsSending(false);
      }
    },
    [chatId, user?.id, toast]
  );

  const handleViewOnce = useCallback(async (messageId: string) => {
    try {
      const result = await chatService.openViewOnceMessage(messageId);
      const message = messages.find((m) => m.id === messageId);
      const mediaType = (message?.mediaType || 'image') as 'image' | 'video' | 'audio';

      // Open the viewer
      setViewOnceMedia({
        messageId,
        mediaUrl: result.mediaUrl,
        mediaThumbnail: result.mediaThumbnail,
        mediaType,
      });

      // Update the message locally to mark as opened
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, viewOnceOpenedAt: new Date().toISOString(), mediaUrl: undefined, mediaThumbnail: undefined }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to open view-once message:', error);
      toast({
        title: 'Error',
        description: 'Failed to open view-once message',
        variant: 'destructive',
      });
    }
  }, [messages, toast]);

  const handleCloseViewOnce = useCallback(() => {
    setViewOnceMedia(null);
  }, []);

  const handleReply = useCallback((messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setReplyTo({
        id: message.id,
        content: message.content,
        senderName: message.role === 'user' ? 'You' : undefined,
        mediaType: message.mediaType,
      });
    }
  }, [messages]);

  const handleEdit = useCallback((messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message && message.senderId === user?.id && !message.isDeleted) {
      setEditingMessage({ id: message.id, content: message.content });
    }
  }, [messages, user?.id]);

  const handleEditSubmit = useCallback(async (newContent: string) => {
    if (!editingMessage) return;
    try {
      await chatService.editMessage(editingMessage.id, newContent);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessage.id ? { ...msg, content: newContent, isEdited: true } : msg
        )
      );
      setEditingMessage(null);
      toast({ title: 'Message edited', variant: 'success' });
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast({ title: 'Error', description: 'Failed to edit message', variant: 'destructive' });
    }
  }, [editingMessage, toast]);

  const handleDelete = useCallback(async (messageId: string) => {
    try {
      // Optimistically update the message to show it's deleted
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted', contentType: 'deleted' }
            : msg
        )
      );
      
      await chatService.deleteMessage(messageId);
      
      // The socket event will handle the final update, but we show success immediately
      toast({
        title: 'Success',
        description: 'Message deleted',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      // Reload messages to get correct state on error
      await reloadMessages();
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  }, [toast, reloadMessages]);

  const handleForward = useCallback((messageId: string) => {
    setForwardMessageId(messageId);
    setShowForwardDialog(true);
  }, []);

  const handleForwardSuccess = useCallback(async () => {
    // Reload messages to show the forwarded message in other chats
    await reloadMessages();
  }, [reloadMessages]);

  const handleStar = useCallback(async (messageId: string) => {
    try {
      await chatService.toggleStarMessage(messageId);
      await reloadMessages();
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  }, [reloadMessages, toast]);

  const handlePin = useCallback(async (messageId: string) => {
    try {
      await chatService.togglePinMessage(messageId);
      await reloadMessages();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  }, [reloadMessages, toast]);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await chatService.addReaction(messageId, emoji);
      await reloadMessages();
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  }, [reloadMessages, toast]);

      // Empty state - no chat selected
      if (!chatId) {
        return (
          <div className="flex h-full flex-col">
            <div
              className="flex items-center justify-between gap-3 px-4 sm:px-6 h-[72px] shrink-0 border-b border-white/[0.06]"
              style={{
                background: 'linear-gradient(180deg, rgba(8,10,18,0.95) 0%, rgba(6,8,14,0.92) 100%)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {onMenuClick && (
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]" onClick={onMenuClick} aria-label="Open chat list">
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                {onBack && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]" onClick={onBack} aria-label="Back">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <span className="text-sm font-semibold text-white truncate">Chats</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]"
                title="Settings"
                aria-label="Settings"
                onClick={() =>
                  onOpenChatSettings
                    ? onOpenChatSettings('general')
                    : router.push('/settings')
                }
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
            <ChatEmptyState />
          </div>
        );
      }

  // Loading state - skeleton messages
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <ChatHeader
          title={getChatTitle(chat)}
          subtitle={getChatSubtitle(chat)}
          isAICoach={isAiChatRef.current}
          onMenuClick={onMenuClick}
          onOpenSettings={
            onOpenChatSettings ? () => onOpenChatSettings('general') : undefined
          }
        />
        <div className="flex-1 overflow-hidden px-4 py-6 space-y-5">
          {/* Incoming message skeleton */}
          <div className="flex items-end gap-2 max-w-[75%]">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-emerald-200/50 dark:bg-white/10" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16 bg-emerald-200/30 dark:bg-white/10/50" />
              <Skeleton className="h-16 w-52 rounded-2xl rounded-bl-sm bg-emerald-200/40 dark:bg-white/10" />
              <Skeleton className="h-2.5 w-10 bg-emerald-200/20 dark:bg-white/10/30" />
            </div>
          </div>
          {/* Outgoing message skeleton */}
          <div className="flex items-end gap-2 justify-end max-w-[75%] ml-auto">
            <div className="space-y-1.5 items-end flex flex-col">
              <Skeleton className="h-10 w-44 rounded-2xl rounded-br-sm bg-emerald-300/40 dark:bg-emerald-800/40" />
              <Skeleton className="h-2.5 w-10 bg-emerald-200/20 dark:bg-white/10/30" />
            </div>
          </div>
          {/* Incoming message skeleton */}
          <div className="flex items-end gap-2 max-w-[75%]">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-emerald-200/50 dark:bg-white/10" />
            <div className="space-y-1.5">
              <Skeleton className="h-20 w-64 rounded-2xl rounded-bl-sm bg-emerald-200/40 dark:bg-white/10" />
              <Skeleton className="h-2.5 w-10 bg-emerald-200/20 dark:bg-white/10/30" />
            </div>
          </div>
          {/* Outgoing message skeleton */}
          <div className="flex items-end gap-2 justify-end max-w-[75%] ml-auto">
            <div className="space-y-1.5 items-end flex flex-col">
              <Skeleton className="h-14 w-56 rounded-2xl rounded-br-sm bg-emerald-300/40 dark:bg-emerald-800/40" />
              <Skeleton className="h-2.5 w-10 bg-emerald-200/20 dark:bg-white/10/30" />
            </div>
          </div>
          {/* Incoming message skeleton */}
          <div className="flex items-end gap-2 max-w-[75%]">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-emerald-200/50 dark:bg-white/10" />
            <div className="space-y-1.5">
              <Skeleton className="h-10 w-36 rounded-2xl rounded-bl-sm bg-emerald-200/40 dark:bg-white/10" />
              <Skeleton className="h-2.5 w-10 bg-emerald-200/20 dark:bg-white/10/30" />
            </div>
          </div>
        </div>
        {/* Input area skeleton */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 dark:border-white/6">
          <Skeleton className="h-12 w-full rounded-xl bg-emerald-200/30 dark:bg-white/10/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <ChatHeader
        title={getChatTitle(chat)}
        subtitle={getChatSubtitle(chat)}
        avatar={chat?.avatar || undefined}
        isAICoach={isAiChatRef.current}
        onMenuClick={onMenuClick}
        onOpenSettings={
          onOpenChatSettings ? () => onOpenChatSettings('general') : undefined
        }
        onBack={onBack}
        showBackButton={true}
        isGroupChat={chat?.isGroupChat || false}
        onGroupMenuClick={() => setShowGroupInfoModal(true)}
        onEdit={handleEditChat}
        onClose={handleCloseChat}
        // Only show leave group option for non-admin members
        onLeaveGroup={chat?.isGroupChat && !isGroupAdmin ? handleLeaveGroup : undefined}
        // Only show delete option for admin/creator
        onDelete={chat?.isGroupChat && isGroupAdmin ? handleDeleteChat : !chat?.isGroupChat ? handleDeleteChat : undefined}
        onVoiceCall={canStartAiVoiceCall ? handleAiCoachCall : canStartVoiceCall && chatId ? () => startCall(chatId, 'voice') : undefined}
        onVideoCall={canStartVideoCall && chatId ? () => startCall(chatId, 'video') : undefined}
        onOpenSocial={() => setShowSocialModal(true)}
        pendingFriendRequestCount={pendingFriendRequestCount}
        onSearch={() => {
          setSearchMode((prev) => !prev);
          setSearchQuery('');
          setSearchMatchIndex(0);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }}
        onUserClick={(userId, userName, userAvatar) => {
          setSelectedUser({ id: userId, name: userName, avatar: userAvatar });
        }}
        otherUserId={chat && !chat.isGroupChat && chat.participants
          ? chat.participants.find(p => p.user && p.user.id !== user?.id)?.user?.id
          : undefined}
        otherUserName={getChatTitle(chat) !== 'Chat' ? getChatTitle(chat) : undefined}
        isOtherUserOnline={(() => {
          if (!chat || chat.isGroupChat) return false;
          const otherId = chat.participants?.find(p => p.user && p.user.id !== user?.id)?.user?.id;
          return otherId ? onlineUsers.has(otherId) : false;
        })()}
      />

      {/* Search bar */}
      {searchMode && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchMatchIndex(0); }}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          {searchMatchIds.length > 0 && (
            <span className="text-xs text-slate-400 shrink-0">
              {searchMatchIndex + 1}/{searchMatchIds.length}
            </span>
          )}
          <button onClick={() => setSearchMatchIndex((i) => Math.max(0, i - 1))} disabled={searchMatchIds.length === 0}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => setSearchMatchIndex((i) => Math.min(searchMatchIds.length - 1, i + 1))} disabled={searchMatchIds.length === 0}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => { setSearchMode(false); setSearchQuery(''); }} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reconnecting banner */}
      {isDisconnected && (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-400">Reconnecting...</span>
        </div>
      )}

      {accountabilityBanner && (
        <div className="flex items-start justify-between gap-3 px-4 py-2.5 bg-orange-500/[0.08] border-b border-orange-500/20 flex-shrink-0">
          <p className="text-[12px] text-orange-100/95 leading-snug">
            <span className="font-semibold text-orange-200">Accountability check-in: </span>
            This message was sent because someone you support asked yHealth to notify you
            {accountabilityBanner.triggerType
              ? ` (${String(accountabilityBanner.triggerType).replace(/_/g, ' ')})`
              : ''}
            .
          </p>
          <button
            type="button"
            onClick={() => setAccountabilityBanner(null)}
            className="shrink-0 text-orange-300/80 hover:text-white text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      <ChatSocialModal
        open={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        onPendingCountChange={setPendingFriendRequestCount}
        onChatCreated={(createdChatId) => {
          router.push(`/chat?chatId=${createdChatId}`);
          reloadMessages();
        }}
      />

      {/* Messages List */}
      <div className="flex-1 min-h-0 overflow-hidden bg-transparent">
        <ChatMessagesList
          messages={messages}
          currentUserId={user?.id}
          isLoading={false}
          isTyping={typingUsers.size > 0}
          isGroupChat={chat?.isGroupChat || false}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onForward={handleForward}
          onStar={handleStar}
          onPin={handlePin}
          onReaction={handleReaction}
          onViewOnce={handleViewOnce}
          onUserClick={(userId, userName, userAvatar) => {
            setSelectedUser({ id: userId, name: userName, avatar: userAvatar });
          }}
          searchQuery={searchQuery}
          highlightedMessageId={searchMatchIds[searchMatchIndex] || undefined}
        />
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isSending}
          disabled={isSending || !canSendMessages}
          chatId={chatId || undefined}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          permissionDeniedMessage={permissionDeniedMessage}
          editingMessage={editingMessage}
          onEditSubmit={handleEditSubmit}
          onCancelEdit={() => setEditingMessage(null)}
        />
      </div>

      {/* Group Info Modal */}
      {chat?.isGroupChat && (
        <GroupInfoModal
          isOpen={showGroupInfoModal}
          onClose={() => setShowGroupInfoModal(false)}
          chat={chat}
          onGroupDeleted={() => {
            setShowGroupInfoModal(false);
            onChatDeleted?.();
            onBack?.();
          }}
          onPermissionsUpdated={() => {
            // Reload chat to get updated permissions
            reloadMessages();
          }}
        />
      )}

      {/* Edit Chat Dialog */}
      <EditChatDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        chat={chat}
        onChatUpdated={handleChatUpdated}
      />

      {/* Forward Message Dialog */}
      {forwardMessageId && (
        <ForwardMessageDialog
          isOpen={showForwardDialog}
          onClose={() => {
            setShowForwardDialog(false);
            setForwardMessageId(null);
          }}
          messageId={forwardMessageId}
          currentChatId={chatId}
          onForwardSuccess={handleForwardSuccess}
        />
      )}

      {/* User Health Profile Modal */}
      {selectedUser && (
        <UserHealthProfileModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.id}
          userName={selectedUser.name}
          userAvatar={selectedUser.avatar}
        />
      )}

      {/* View Once Viewer */}
      {viewOnceMedia && (
        <ViewOnceViewer
          isOpen={!!viewOnceMedia}
          mediaUrl={viewOnceMedia.mediaUrl}
          mediaThumbnail={viewOnceMedia.mediaThumbnail}
          mediaType={viewOnceMedia.mediaType}
          onClose={handleCloseViewOnce}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {chat?.isGroupChat ? 'Delete Group' : 'Delete Chat'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {chat?.isGroupChat
                ? 'Are you sure you want to delete this group? This action cannot be undone and all members will be removed.'
                : 'Are you sure you want to delete this chat? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
