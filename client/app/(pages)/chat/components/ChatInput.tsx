'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Paperclip, Mic, Square, Smile, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReplyPreview } from './ReplyPreview';
import { MediaPreview } from './MediaPreview';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

// Dynamically import GIF picker to avoid SSR issues
const GifPicker = dynamic(
  () => import('gif-picker-react'),
  { ssr: false }
) as React.ComponentType<{
  tenorApiKey: string;
  onGifClick?: (gif: { url: string; preview: { url: string } }) => void;
  width?: number | string;
  height?: number | string;
  theme?: string;
}>;

interface ChatInputProps {
  onSend: (message: string, options?: { mediaFiles?: File[]; repliedToId?: string; isViewOnce?: boolean; gifUrl?: string }) => void;
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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!chatId || disabled || isLoading) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const trimmedMessage = message.trim();
    const hasContent = trimmedMessage.length > 0;

    if (hasContent && !isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(chatId);
    }

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

    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = cursorPosition + emoji.length;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleGifClick = (gif: { url: string; preview: { url: string } }) => {
    setShowGifPicker(false);
    onSend('', { gifUrl: gif.url, repliedToId: replyTo?.id });
    onCancelReply?.();
  };

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage || mediaFiles.length > 0) && !isLoading && !disabled) {
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

  const actionBtnClass = "h-9 w-9 shrink-0 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition-colors";

  return (
    <div className="border-t border-slate-100 dark:border-white/6 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl px-3 sm:px-4 py-3 safe-area-pb">
      <div className="w-full max-w-4xl mx-auto">
        {/* Reply preview */}
        {replyTo && (
          <div className="mb-2">
            <ReplyPreview message={replyTo} onCancel={onCancelReply || (() => {})} />
          </div>
        )}

        {/* Media previews */}
        {mediaFiles.length > 0 && (
          <div className="mb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
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

        <div className="flex items-end gap-1.5">
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
            className={actionBtnClass}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
          >
            <Paperclip className="h-[18px] w-[18px]" />
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
                'min-h-[42px] max-h-[120px] resize-none',
                'rounded-2xl border border-slate-200/60 dark:border-white/8 bg-slate-50 dark:bg-white/5',
                'text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/30',
                'text-[14px] px-4 py-2.5',
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
                  actionBtnClass,
                  showEmojiPicker && 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                )}
                disabled={disabled || isLoading}
              >
                <Smile className="h-[18px] w-[18px]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-auto rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2332] shadow-2xl p-0"
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

          {/* GIF Picker */}
          <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  actionBtnClass,
                  showGifPicker && 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                )}
                disabled={disabled || isLoading}
              >
                <ImageIcon className="h-[18px] w-[18px]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-auto rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2332] shadow-2xl p-0"
            >
              <GifPicker
                tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ''}
                onGifClick={handleGifClick}
                width={350}
                height={400}
                theme="dark"
              />
            </PopoverContent>
          </Popover>

          {isRecording ? (
            <Button
              variant="destructive"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl bg-red-500 hover:bg-red-600 animate-pulse"
              onClick={handleStopRecording}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={actionBtnClass}
              onClick={handleStartRecording}
              disabled={disabled || isLoading}
            >
              <Mic className="h-[18px] w-[18px]" />
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={(!message.trim() && mediaFiles.length === 0) || isLoading || disabled}
            size="icon"
            className={cn(
              'h-9 w-9 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-500',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'transition-all shadow-md shadow-emerald-600/25'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
