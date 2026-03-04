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

  const iconBtnClass = "h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition-colors";

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-slate-100 dark:border-white/6 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl px-4 sm:px-5 py-3 flex-shrink-0',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile back button */}
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("lg:hidden shrink-0", iconBtnClass)}
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {/* Mobile menu button */}
        {!showBackButton && onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("lg:hidden shrink-0", iconBtnClass)}
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
              "h-10 w-10 rounded-full shrink-0 overflow-hidden ring-2 ring-slate-200/80 dark:ring-white/10",
              !isGroupChat && onUserClick && otherUserId && "cursor-pointer hover:ring-emerald-400 dark:hover:ring-emerald-500/50 transition-all"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={title} className="h-full w-full object-cover" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{title}</h2>
          {subtitle && <p className="text-[12px] text-emerald-600 dark:text-emerald-400 truncate font-medium">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDashboardClick}
          title="Go to Dashboard"
          className={iconBtnClass}
        >
          <LayoutDashboard className="h-[18px] w-[18px]" />
        </Button>
        {onSearch && (
          <Button variant="ghost" size="icon" onClick={onSearch} className={iconBtnClass}>
            <Search className="h-[18px] w-[18px]" />
          </Button>
        )}
        {onInfo && (
          <Button variant="ghost" size="icon" onClick={onInfo} className={iconBtnClass}>
            <Info className="h-[18px] w-[18px]" />
          </Button>
        )}
        {/* Group menu */}
        {isGroupChat && onGroupMenuClick && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={iconBtnClass}>
                <MoreVertical className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-lg">
              <DropdownMenuItem onClick={onGroupMenuClick}>
                <Info className="mr-2 h-4 w-4" />
                Group Info
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Group
                </DropdownMenuItem>
              )}
              {onSearch && (
                <DropdownMenuItem onClick={onSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onClose && (
                <DropdownMenuItem onClick={onClose}>
                  <X className="mr-2 h-4 w-4" />
                  Close Chat
                </DropdownMenuItem>
              )}
              {onLeaveGroup && (
                <DropdownMenuItem onClick={onLeaveGroup}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Group
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Regular menu */}
        {(!isGroupChat || !onGroupMenuClick) && (onMore || onInfo || onSearch || onEdit || onClose || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={iconBtnClass}>
                <MoreVertical className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-lg">
              {onSearch && (
                <DropdownMenuItem onClick={onSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </DropdownMenuItem>
              )}
              {onInfo && (
                <DropdownMenuItem onClick={onInfo}>
                  <Info className="mr-2 h-4 w-4" />
                  Info
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Chat
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onClose && (
                <DropdownMenuItem onClick={onClose}>
                  <X className="mr-2 h-4 w-4" />
                  Close Chat
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400 focus:text-red-600">
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
