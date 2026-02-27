'use client';

import { MoreVertical, Info, Search, Menu, ArrowLeft, Pencil, X, Trash2, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  avatar?: string;
  onInfo?: () => void;
  onSearch?: () => void;
  onMore?: () => void;
  onMenuClick?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  isGroupChat?: boolean;
  onGroupMenuClick?: () => void;
  onEdit?: () => void;
  onClose?: () => void;
  onLeaveGroup?: () => void;
  onDelete?: () => void;
  onUserClick?: (userId: string, userName: string, userAvatar?: string | null) => void;
  otherUserId?: string;
  otherUserName?: string;
  className?: string;
}

export function ChatHeader({
  title = 'Chat',
  subtitle,
  avatar,
  onInfo,
  onSearch,
  onMore,
  onMenuClick,
  onBack,
  showBackButton = false,
  isGroupChat = false,
  onGroupMenuClick,
  onEdit,
  onClose,
  onLeaveGroup,
  onDelete,
  onUserClick,
  otherUserId,
  otherUserName,
  className,
}: ChatHeaderProps) {
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-emerald-200 dark:border-emerald-600/30 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex-shrink-0 shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile back button - shown when chat is selected */}
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {/* Mobile menu button - shown when no chat is selected or on desktop */}
        {!showBackButton && onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {avatar && (
          <button
            onClick={() => {
              if (!isGroupChat && onUserClick && otherUserId && otherUserName) {
                onUserClick(otherUserId, otherUserName, avatar);
              }
            }}
            className={cn(
              "h-10 w-10 rounded-full bg-white/20 ring-2 ring-white/30 shrink-0 overflow-hidden",
              !isGroupChat && onUserClick && otherUserId && "cursor-pointer hover:opacity-80 transition-opacity"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={title} className="h-full w-full object-cover" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-medium text-white truncate">{title}</h2>
          {subtitle && <p className="text-[13px] text-white/90 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDashboardClick}
          title="Go to Dashboard"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <LayoutDashboard className="h-5 w-5" />
        </Button>
        {onSearch && (
          <Button variant="ghost" size="icon" onClick={onSearch} className="text-white/70 hover:text-white hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>
        )}
        {onInfo && (
          <Button variant="ghost" size="icon" onClick={onInfo} className="text-white/70 hover:text-white hover:bg-white/10">
            <Info className="h-5 w-5" />
          </Button>
        )}
        {/* Group menu button (3 dots) - shown for group chats */}
        {isGroupChat && onGroupMenuClick && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#233138] border-white/10 text-white">
              <DropdownMenuItem onClick={onGroupMenuClick} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                <Info className="mr-2 h-4 w-4" />
                Group Info
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Group
                </DropdownMenuItem>
              )}
              {onSearch && (
                <DropdownMenuItem onClick={onSearch} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-emerald-200 dark:bg-emerald-600/30" />
              {onClose && (
                <DropdownMenuItem onClick={onClose} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <X className="mr-2 h-4 w-4" />
                  Close Chat
                </DropdownMenuItem>
              )}
              {onLeaveGroup && (
                <DropdownMenuItem onClick={onLeaveGroup} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Group
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-500 dark:text-red-400 focus:text-red-500 dark:focus:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Regular menu (for non-group chats or when group menu not available) */}
        {(!isGroupChat || !onGroupMenuClick) && (onMore || onInfo || onSearch || onEdit || onClose || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#233138] border-white/10 text-white">
              {onSearch && (
                <DropdownMenuItem onClick={onSearch} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </DropdownMenuItem>
              )}
              {onInfo && (
                <DropdownMenuItem onClick={onInfo} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Info className="mr-2 h-4 w-4" />
                  Info
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Chat
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-emerald-200 dark:bg-emerald-600/30" />
              {onClose && (
                <DropdownMenuItem onClick={onClose} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <X className="mr-2 h-4 w-4" />
                  Close Chat
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-500 dark:text-red-400 focus:text-red-500 dark:focus:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Chat
                </DropdownMenuItem>
              )}
              {onMore && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onMore}>More options</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

