'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Paperclip, Mic, Square, Smile, Image as ImageIcon, ArrowUp, Sparkles, X, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReplyPreview } from './ReplyPreview';
import { MediaPreview } from './MediaPreview';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { emitTyping, emitStopTyping } from '@/lib/socket-client';

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
  editingMessage?: { id: string; content: string } | null;
  onEditSubmit?: (newContent: string) => void;
  onCancelEdit?: () => void;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask Cia...',
  disabled = false,
  chatId,
  replyTo,
  onCancelReply,
  permissionDeniedMessage,
  editingMessage,
  onEditSubmit,
  onCancelEdit,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const isEditing = !!editingMessage;
  const hasContent = message.trim().length > 0 || mediaFiles.length > 0;

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [editingMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!chatId || disabled || isLoading) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 0 && !isTypingRef.current) {
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
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && trimmedMessage.length === 0) {
        isTypingRef.current = false;
        emitStopTyping(chatId);
      }
    };
  }, [message, chatId, disabled, isLoading]);

  const handleEmojiClick = (emojiData: { emoji?: string; unicode?: string }) => {
    const emoji = emojiData.emoji || emojiData.unicode || '';
    if (!emoji) return;
    const pos = textareaRef.current?.selectionStart || message.length;
    setMessage(message.substring(0, pos) + emoji + message.substring(pos));
    setTimeout(() => {
      textareaRef.current?.focus();
      const np = pos + emoji.length;
      textareaRef.current?.setSelectionRange(np, np);
    }, 0);
  };

  const handleGifClick = (gif: { url: string; preview: { url: string } }) => {
    setShowGifPicker(false);
    onSend('', { gifUrl: gif.url, repliedToId: replyTo?.id });
    onCancelReply?.();
  };

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed && mediaFiles.length === 0) return;
    if (isLoading || disabled) return;

    if (isEditing) {
      if (trimmed && trimmed !== editingMessage?.content) {
        onEditSubmit?.(trimmed);
      } else {
        onCancelEdit?.();
      }
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    if (isTypingRef.current && chatId) {
      isTypingRef.current = false;
      emitStopTyping(chatId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onSend(trimmed, {
      mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
      repliedToId: replyTo?.id,
      isViewOnce: isViewOnce && mediaFiles.length > 0 ? true : undefined,
    });
    setMessage('');
    setMediaFiles([]);
    setIsViewOnce(false);
    onCancelReply?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setMediaFiles((prev) => [...prev, new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })]);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
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
    <div className="px-3 sm:px-5 py-3 safe-area-pb">
      <div className="w-full max-w-4xl mx-auto">
        {/* Edit banner */}
        {isEditing && (
          <div className="mb-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Pencil className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-400">Editing message</p>
              <p className="text-xs text-slate-400 truncate">{editingMessage?.content}</p>
            </div>
            <button
              onClick={() => { onCancelEdit?.(); setMessage(''); }}
              className="p-1 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reply preview */}
        {replyTo && !isEditing && (
          <div className="mb-2">
            <ReplyPreview message={replyTo} onCancel={onCancelReply || (() => {})} />
          </div>
        )}

        {/* Media previews */}
        {mediaFiles.length > 0 && (
          <div className="mb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
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

        {/* Main input container — AI Coach style */}
        <div
          className="rounded-[20px] overflow-hidden transition-all duration-300"
          style={{
            background: '#02091b',
            border: `1.5px solid ${isFocused ? 'rgba(0,153,185,0.35)' : 'rgba(255,255,255,0.12)'}`,
            boxShadow: isFocused
              ? '0 0 24px rgba(0,153,185,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'
              : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* Top: Sparkle + Textarea */}
          <div className="flex items-start gap-3 px-5 pt-4 pb-1">
            <Sparkles className="w-5 h-5 text-cyan-500/60 shrink-0 mt-0.5" />
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={permissionDeniedMessage || placeholder}
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                'flex-1 min-h-[28px] max-h-[160px] resize-none bg-transparent',
                'text-white text-[15px] leading-relaxed placeholder-white/30',
                'focus:outline-none',
                permissionDeniedMessage && 'cursor-not-allowed opacity-50'
              )}
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-2">
            {/* Left tools */}
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />

              {/* Attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all disabled:opacity-30"
              >
                <Paperclip className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Attach</span>
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

              {/* Emoji */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      showEmojiPicker ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    )}
                    disabled={disabled || isLoading}
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto rounded-2xl border-white/[0.08] bg-[#0a0f1f]/95 backdrop-blur-xl shadow-2xl p-0">
                  <EmojiPicker onEmojiClick={handleEmojiClick} width={340} height={380} skinTonesDisabled previewConfig={{ showPreview: false }} theme="dark" searchDisabled={false} />
                </PopoverContent>
              </Popover>

              {/* GIF */}
              <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      showGifPicker ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    )}
                    disabled={disabled || isLoading}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto rounded-2xl border-white/[0.08] bg-[#0a0f1f]/95 backdrop-blur-xl shadow-2xl p-0">
                  <GifPicker tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ''} onGifClick={handleGifClick} width={340} height={380} theme="dark" />
                </PopoverContent>
              </Popover>

              {/* Mic */}
              {isRecording ? (
                <button
                  className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 animate-pulse"
                  onClick={handleStopRecording}
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                  onClick={handleStartRecording}
                  disabled={disabled || isLoading}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!hasContent || isLoading || disabled}
              className={cn(
                'w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-200 shrink-0',
                hasContent && !isLoading
                  ? isEditing
                    ? 'bg-amber-500 text-white hover:brightness-110 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                    : 'bg-[#0099b9] text-white hover:brightness-110 shadow-[0_0_16px_rgba(0,153,185,0.25)]'
                  : 'bg-white/[0.04] text-white/20 cursor-not-allowed',
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <Check className="w-4 h-4" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
