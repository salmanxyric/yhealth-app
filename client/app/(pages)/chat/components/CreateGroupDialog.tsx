'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Share2,
  Copy,
  X,
  Users,
  Check,
  Sparkles,
  
  Link2,
} from 'lucide-react';
import { chatService, type Chat } from '@/src/shared/services/chat.service';
import { useToast } from '@/hooks/use-toast';
import { AvatarUploader } from '@/components/common/avatar-uploader';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (chat: Chat) => void;
}

export function CreateGroupDialog({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupDialogProps) {
  const { toast } = useToast();
  const [chatName, setChatName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);
  const [selectedUserIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdChat, setCreatedChat] = useState<Chat | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setChatName('');
      setAvatarUrl(null);
      avatarUrlRef.current = null;
      setCreatedChat(null);
      setCodeCopied(false);
    }
  }, [isOpen]);

  const handleAvatarUpload = async (file: File): Promise<string> => {
    try {
      setIsUploadingAvatar(true);
      const result = await chatService.uploadMedia(file);
      const uploadedUrl = result.url || (result as { mediaUrl?: string }).mediaUrl;
      if (!uploadedUrl) throw new Error('No URL returned from upload');
      setAvatarUrl(uploadedUrl);
      avatarUrlRef.current = uploadedUrl;
      return uploadedUrl;
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string; response?: { data?: { message?: string; code?: string; error?: { message?: string; code?: string } } } };
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to upload avatar';
      const errorCode = err?.code || err?.response?.data?.code;
      toast({
        title: errorCode === 'FILE_TOO_LARGE' ? 'File Too Large' : 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!chatName.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }
    if (isUploadingAvatar) {
      toast({ title: 'Please wait', description: 'Avatar upload is in progress.' });
      return;
    }
    const currentAvatarUrl = avatarUrl || avatarUrlRef.current;
    if (!currentAvatarUrl) {
      toast({ title: 'Error', description: 'Please upload a group avatar', variant: 'destructive' });
      return;
    }

    try {
      setIsCreating(true);
      const chat = await chatService.createGroupChat({
        chatName: chatName.trim(),
        users: selectedUserIds,
        avatar: currentAvatarUrl,
      });
      setCreatedChat(chat);
      toast({ title: 'Success', description: 'Group created successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create group';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdChat) return;
    const joinCode = createdChat.joinCode || (createdChat as { join_code?: string }).join_code;
    if (joinCode) {
      try {
        await navigator.clipboard.writeText(joinCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
        toast({ title: 'Copied', description: 'Join code copied to clipboard' });
      } catch {
        toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
      }
    }
  };

  const handleShare = async () => {
    if (!createdChat) return;
    const joinCode = createdChat.joinCode || (createdChat as { join_code?: string }).join_code;
    if (joinCode) {
      const text = `Join my group "${createdChat.chatName}" using code: ${joinCode}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: `Join ${createdChat.chatName}`, text, url: window.location.href });
        } else {
          await navigator.clipboard.writeText(text);
          toast({ title: 'Copied', description: 'Share text copied to clipboard' });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast({ title: 'Error', description: 'Failed to share', variant: 'destructive' });
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] bg-[#0a0f1f] border border-white/10 rounded-[24px] p-0 gap-0 shadow-[0_0_80px_rgba(2,132,199,0.06)] overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">
          {createdChat ? 'Group created' : 'Create group'}
        </DialogTitle>
        <AnimatePresence mode="wait">
          {createdChat ? (
            <SuccessView
              key="success"
              chat={createdChat}
              codeCopied={codeCopied}
              onCopyCode={handleCopyCode}
              onShare={handleShare}
              onDone={() => { onGroupCreated?.(createdChat); onClose(); }}
            />
          ) : (
            <CreateView
              key="create"
              chatName={chatName}
              avatarUrl={avatarUrl}
              isCreating={isCreating}
              isUploadingAvatar={isUploadingAvatar}
              onNameChange={setChatName}
              onAvatarUpload={handleAvatarUpload}
              onCreateGroup={handleCreateGroup}
              onClose={onClose}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Create View ─── */
function CreateView({
  chatName,
  avatarUrl,
  isCreating,
  isUploadingAvatar,
  onNameChange,
  onAvatarUpload,
  onCreateGroup,
  onClose,
}: {
  chatName: string;
  avatarUrl: string | null;
  isCreating: boolean;
  isUploadingAvatar: boolean;
  onNameChange: (v: string) => void;
  onAvatarUpload: (file: File) => Promise<string>;
  onCreateGroup: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Create Group</h2>
            <p className="text-xs text-white/40">Start a new group conversation</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-[10px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      <div className="px-6 pt-6 pb-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <AvatarUploader
            currentAvatar={avatarUrl}
            fallback={chatName?.[0]?.toUpperCase() || 'G'}
            onUpload={onAvatarUpload}
            size="lg"
            disabled={isCreating || isUploadingAvatar}
          />
          <p className="text-xs text-white/30">Tap to upload group avatar</p>
        </div>

        {/* Group Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">Group Name</label>
          <input
            value={chatName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Fitness Squad"
            disabled={isCreating}
            autoFocus
            className="w-full h-[48px] px-4 bg-white/[0.04] border border-white/[0.08] rounded-[12px] text-white text-[15px] placeholder-white/25 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Members Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">Members</label>
          <div className="border border-white/[0.06] rounded-[12px] bg-white/[0.02] p-4">
            <div className="flex items-center gap-3 text-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-white/50">Invite via join code</p>
                <p className="text-xs text-white/25 mt-0.5">Members can join after group is created</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 h-[46px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] hover:text-white/80 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onCreateGroup}
            disabled={isCreating || !chatName.trim()}
            className="flex-1 h-[46px] rounded-[12px] bg-[#059669] text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(5,150,105,0.15)]"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Success View ─── */
function SuccessView({
  chat,
  codeCopied,
  onCopyCode,
  onShare,
  onDone,
}: {
  chat: Chat;
  codeCopied: boolean;
  onCopyCode: () => void;
  onShare: () => void;
  onDone: () => void;
}) {
  const joinCode = chat.joinCode || (chat as { join_code?: string }).join_code || '------';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5"
        >
          <Check className="w-8 h-8 text-emerald-400" />
        </motion.div>

        <h2 className="text-xl font-semibold text-white mb-1">Group Created!</h2>
        <p className="text-sm text-white/40 mb-8">Share the code below to invite members</p>

        {/* Join Code Card */}
        <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[16px] p-5 mb-3">
          <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">Join Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold text-white tracking-[0.3em]">
              {joinCode}
            </span>
            <button
              onClick={onCopyCode}
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all ${
                codeCopied
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.08]"
              }`}
              title="Copy code"
            >
              {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-white/20 mt-3">Expires in 24 hours</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full pt-3">
          <button
            onClick={onShare}
            className="flex-1 h-[46px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] hover:text-white/80 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={onDone}
            className="flex-1 h-[46px] rounded-[12px] bg-[#059669] text-white text-sm font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(5,150,105,0.15)]"
          >
            Done
          </button>
        </div>
      </div>
    </motion.div>
  );
}
