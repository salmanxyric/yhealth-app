'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Copy, RefreshCw, Trash2, Users, X, Check, Loader2, MessageCircle, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatService, type Chat, type GroupMember } from '@/src/shared/services/chat.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/context/AuthContext';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | null;
  onGroupDeleted?: () => void;
  onPermissionsUpdated?: () => void;
}

export function GroupInfoModal({
  isOpen,
  onClose,
  chat,
  onGroupDeleted,
  onPermissionsUpdated,
}: GroupInfoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [permissionMode, setPermissionMode] = useState<'all' | 'restricted'>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const isAdmin = chat?.groupAdmin === user?.id;
  const isCreator = chat?.createdBy === user?.id;
  const canManage = isAdmin || isCreator;

  useEffect(() => {
    if (isOpen && chat?.id) {
      loadMembers();
      if (chat.messagePermissionMode) setPermissionMode(chat.messagePermissionMode);
      if (chat.allowedSenderIds) setAllowedUserIds(chat.allowedSenderIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chat?.id]);

  const loadMembers = async () => {
    if (!chat?.id) return;
    try {
      setIsLoading(true);
      const membersList = await chatService.getGroupMembers(chat.id);
      setMembers(membersList);
    } catch {
      toast({ title: 'Error', description: 'Failed to load group members', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (chat?.joinCode) {
      navigator.clipboard.writeText(chat.joinCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast({ title: 'Copied', description: 'Join code copied to clipboard' });
    }
  };

  const handleRegenerateCode = async () => {
    if (!chat?.id) return;
    try {
      setIsRegenerating(true);
      await chatService.regenerateJoinCode(chat.id);
      toast({ title: 'Success', description: 'Join code regenerated' });
      onClose();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to regenerate', variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!chat?.id) return;
    try {
      setIsDeleting(true);
      await chatService.deleteGroup(chat.id);
      toast({ title: 'Success', description: 'Group deleted' });
      setShowDeleteConfirm(false);
      onClose();
      onGroupDeleted?.();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionModeChange = async (mode: 'all' | 'restricted') => {
    if (!chat?.id || !isAdmin) return;
    setPermissionMode(mode);
    try {
      setIsUpdatingPermissions(true);
      if (mode === 'all') {
        await chatService.updateMessagePermissions(chat.id, 'all');
      } else {
        const adminAndCreatorIds = [
          ...(chat.groupAdmin ? [chat.groupAdmin] : []),
          ...(chat.createdBy && chat.createdBy !== chat.groupAdmin ? [chat.createdBy] : []),
        ];
        const initialAllowedIds = [...new Set([...allowedUserIds, ...adminAndCreatorIds])];
        await chatService.updateMessagePermissions(chat.id, 'restricted', initialAllowedIds);
        setAllowedUserIds(initialAllowedIds);
      }
      toast({ title: 'Success', description: 'Permissions updated' });
      onPermissionsUpdated?.();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update', variant: 'destructive' });
      setPermissionMode(chat.messagePermissionMode || 'all');
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const handleAllowedUserToggle = async (userId: string, checked: boolean) => {
    if (!chat?.id || !isAdmin) return;
    const newAllowedIds = checked ? [...allowedUserIds, userId] : allowedUserIds.filter(id => id !== userId);
    setAllowedUserIds(newAllowedIds);
    try {
      setIsUpdatingPermissions(true);
      await chatService.updateMessagePermissions(chat.id, 'restricted', newAllowedIds);
      onPermissionsUpdated?.();
    } catch {
      setAllowedUserIds(chat.allowedSenderIds || []);
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    return '?';
  };

  const isCodeExpired = chat?.joinCodeExpiresAt ? new Date(chat.joinCodeExpiresAt) < new Date() : false;

  if (!chat) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[520px] max-h-[90vh] bg-[#0a0f1f] border border-white/10 rounded-[24px] p-0 gap-0 shadow-[0_0_80px_rgba(2,132,199,0.06)] overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">Group info</DialogTitle>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Group Info</h2>
                <p className="text-xs text-white/35">Settings, members & permissions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-[10px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 pt-5 pb-6 space-y-5 scrollbar-hide">

            {/* Group Identity Card */}
            <div
              className="rounded-[16px] p-5 flex items-center gap-4"
              style={{
                background: 'linear-gradient(145deg, rgba(18,20,35,0.95) 0%, rgba(12,13,30,0.98) 50%, rgba(8,10,22,1) 100%)',
                border: '1px solid rgba(16,185,129,0.12)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 32px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <Avatar className="h-16 w-16 rounded-[14px] shrink-0">
                <AvatarImage src={chat.avatar || undefined} alt={chat.chatName} className="rounded-[14px]" />
                <AvatarFallback className="rounded-[14px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl font-semibold">
                  {chat.chatName?.[0]?.toUpperCase() || 'G'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">{chat.chatName}</h3>
                <p className="text-sm text-white/40 mt-0.5">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>

            {/* Join Code Card */}
            <div className="rounded-[16px] p-4 bg-white/[0.02] border border-white/[0.06]">
              <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">Join Code</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center px-4 py-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06]">
                  <span className={cn(
                    "text-2xl font-mono font-bold tracking-[0.25em] text-white",
                    isCodeExpired && "text-white/20 line-through"
                  )}>
                    {chat.joinCode || '------'}
                  </span>
                  {isCodeExpired && (
                    <span className="text-[11px] text-red-400 ml-3 font-medium">Expired</span>
                  )}
                </div>
                {chat.joinCode && (
                  <>
                    <button
                      onClick={handleCopyCode}
                      className={cn(
                        "w-10 h-10 rounded-[10px] flex items-center justify-center transition-all shrink-0",
                        codeCopied
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.08]"
                      )}
                      title="Copy code"
                    >
                      {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {canManage && (
                      <button
                        onClick={handleRegenerateCode}
                        disabled={isRegenerating}
                        className="w-10 h-10 rounded-[10px] bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.08] flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
                        title="Regenerate code"
                      >
                        <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                      </button>
                    )}
                  </>
                )}
              </div>
              {chat.joinCodeExpiresAt && !isCodeExpired && (
                <p className="text-[11px] text-white/20 mt-2">
                  Expires: {new Date(chat.joinCodeExpiresAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Members Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Members ({members.length})</h3>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {members.map((member, i) => {
                    const isMemberAdmin = chat.groupAdmin === member.userId;
                    const isMemberCreator = chat.createdBy === member.userId;

                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 rounded-[12px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                      >
                        <Avatar className="h-10 w-10 rounded-full shrink-0">
                          <AvatarImage src={member.user.avatar || undefined} alt={member.user.firstName} />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-medium">
                            {getInitials(member.user.firstName, member.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            {isMemberAdmin && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/15">
                                <Crown className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                            {isMemberCreator && !isMemberAdmin && (
                              <span className="text-[10px] text-white/30 font-medium">Creator</span>
                            )}
                          </div>
                          <p className="text-xs text-white/30 truncate mt-0.5">
                            {member.user.email}
                          </p>
                        </div>

                        {/* Permission toggle in restricted mode */}
                        {isAdmin && permissionMode === 'restricted' && (
                          <PermToggle
                            checked={isMemberAdmin || isMemberCreator || allowedUserIds.includes(member.userId)}
                            disabled={isMemberAdmin || isMemberCreator || isUpdatingPermissions}
                            onChange={(checked) => handleAllowedUserToggle(member.userId, checked)}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Permissions */}
            {isAdmin && (
              <div className="rounded-[16px] p-4 bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Message Permissions</h3>
                </div>
                <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-[12px]">
                  {(['all', 'restricted'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => handlePermissionModeChange(mode)}
                      disabled={isUpdatingPermissions}
                      className={cn(
                        "flex-1 py-2 rounded-[10px] text-sm font-medium transition-all capitalize",
                        permissionMode === mode
                          ? "bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.2)]"
                          : "text-white/40 hover:text-white/60"
                      )}
                    >
                      {mode === 'all' ? 'Everyone' : 'Restricted'}
                    </button>
                  ))}
                </div>
                {permissionMode === 'restricted' && (
                  <p className="text-[11px] text-white/25 mt-2">Toggle permission per member in the list above</p>
                )}
              </div>
            )}

            {/* Danger Zone */}
            {canManage && (
              <div className="rounded-[16px] p-4 bg-red-500/[0.03] border border-red-500/10">
                <p className="text-xs text-red-400/60 uppercase tracking-wider font-medium mb-3">Danger Zone</p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-[42px] rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Group
                </button>
                <p className="text-[11px] text-white/20 mt-2">Permanently deletes the group and all messages.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#0a0f1f] border border-white/10 rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Group</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40">
              Are you sure you want to delete &quot;{chat?.chatName}&quot;? This permanently deletes the group and all messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white rounded-[10px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-[10px]"
            >
              {isDeleting ? 'Deleting...' : 'Delete Group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Small permission toggle ─── */
function PermToggle({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked); }}
      className={cn(
        "relative inline-flex w-[36px] h-[20px] rounded-full transition-colors duration-200 shrink-0",
        checked ? "bg-emerald-500" : "bg-white/10",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-200 mt-[2px]",
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}
