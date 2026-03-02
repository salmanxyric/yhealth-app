'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Paperclip, Mic, Square, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReplyPreview } from './ReplyPreview';
import { MediaPreview } from './MediaPreview';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';
import { emitTyping, emitStopTyping } from '@/lib/socket-client';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
) as React.ComponentType<{
  onEmojiClick: (emojiData: { emoji: string }) => void;
  width?: number;
  height?: number;
  skinTonesDisabled?: boolean;
  previewConfig?: { showPreview: boolean };
  theme?: string;
  searchDisabled?: boolean;
}>;

interface ChatInputProps {
  onSend: (message: string, options?: { mediaFiles?: File[]; repliedToId?: string; isViewOnce?: boolean }) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  chatId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName?: string;
    mediaType?: string;
  } | null;
  onCancelReply?: () => void;
  permissionDeniedMessage?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Type a message...',
  disabled = false,
  chatId,
  replyTo,
  onCancelReply,
  permissionDeniedMessage,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Handle typing indicators
  useEffect(() => {
    if (!chatId || disabled || isLoading) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const trimmedMessage = message.trim();
    const hasContent = trimmedMessage.length > 0;

    if (hasContent && !isTypingRef.current) {
      // User started typing
      isTypingRef.current = true;
      emitTyping(chatId);
    }

    // Set timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitStopTyping(chatId);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Cleanup: stop typing when component unmounts or message is cleared
      if (isTypingRef.current && !hasContent) {
        isTypingRef.current = false;
        emitStopTyping(chatId);
      }
    };
  }, [message, chatId, disabled, isLoading]);

  const handleEmojiClick = (emojiData: { emoji?: string; unicode?: string }) => {
    const emoji = emojiData.emoji || emojiData.unicode || '';
    if (!emoji) return;
    
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const textBefore = message.substring(0, cursorPosition);
    const textAfter = message.substring(cursorPosition);
    setMessage(textBefore + emoji + textAfter);
    
    // Focus textarea and set cursor position
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = cursorPosition + emoji.length;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
    
    // Don't close the picker - let user select multiple emojis if needed
    // The Popover will handle closing on outside clicks
  };

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage || mediaFiles.length > 0) && !isLoading && !disabled) {
      // Stop typing indicator when sending message
      if (isTypingRef.current && chatId) {
        isTypingRef.current = false;
        emitStopTyping(chatId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      onSend(trimmedMessage, {
        mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
        repliedToId: replyTo?.id,
        isViewOnce: isViewOnce && mediaFiles.length > 0 ? true : undefined,
      });
      setMessage('');
      setMediaFiles([]);
      setIsViewOnce(false);
      onCancelReply?.();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        setMediaFiles((prev) => [...prev, audioFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="border-t border-emerald-200 dark:border-emerald-600/30 bg-white dark:bg-slate-800 p-3 shadow-lg">
      <div className="w-full max-w-4xl mx-auto">
        {/* Reply preview */}
        {replyTo && (
          <div className="mb-2">
            <ReplyPreview message={replyTo} onCancel={onCancelReply || (() => {})} />
          </div>
        )}

        {/* Media previews */}
        {mediaFiles.length > 0 && (
          <div className="mb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {mediaFiles.map((file, index) => (
              <MediaPreview
                key={index}
                file={file}
                onRemove={() => handleRemoveMedia(index)}
                isViewOnce={isViewOnce}
                onToggleViewOnce={() => setIsViewOnce((prev) => !prev)}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={permissionDeniedMessage || placeholder}
              disabled={disabled || isLoading}
              className={cn(
                'min-h-[42px] max-h-[120px] resize-none pr-12',
                'rounded-lg border border-emerald-200 dark:border-emerald-600/30 bg-white dark:bg-slate-700',
                'text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400',
                'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500',
                'scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-emerald-600/30 scrollbar-track-transparent',
                permissionDeniedMessage && 'cursor-not-allowed'
              )}
              rows={1}
            />
          </div>

          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all',
                  showEmojiPicker && 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                )}
                disabled={disabled || isLoading}
              >
                <motion.div
                  animate={showEmojiPicker ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Smile className="h-5 w-5" />
                </motion.div>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-auto border-emerald-200 dark:border-emerald-600/30 bg-white dark:bg-slate-800 backdrop-blur-md p-0"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
                theme="dark"
                searchDisabled={false}
              />
            </PopoverContent>
          </Popover>

          {isRecording ? (
            <Button
              variant="destructive"
              size="icon"
              className="h-10 w-10 shrink-0 bg-red-500 hover:bg-red-600"
              onClick={handleStopRecording}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              onClick={handleStartRecording}
              disabled={disabled || isLoading}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={(!message.trim() && mediaFiles.length === 0) || isLoading || disabled}
            size="icon"
            className={cn(
              'h-10 w-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all shadow-md shadow-emerald-600/30'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Send className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
          {isRecording
            ? 'Recording... Click stop when done'
            : 'Press Enter to send, Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
}

export default ChatInput;
