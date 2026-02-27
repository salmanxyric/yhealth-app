'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  MessageSquarePlus,
  Search,
  MoreVertical,
  Trash2,
  Archive,
  MessagesSquare,
  Settings,
  Pin,
  CheckCheck,
  Star,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import type { RAGConversation } from '@/src/shared/services/rag-chat.service';

interface ConversationSidebarProps {
  conversations: RAGConversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onSearch: (query: string) => void;
  onPin?: (id: string) => void;
  onStar?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  isLoading?: boolean;
}


function groupConversations(conversations: RAGConversation[]) {
  const groups: Record<string, RAGConversation[]> = {};

  conversations.forEach((conv) => {
    const date = new Date(conv.lastMessageAt || conv.createdAt);
    let group: string;

    if (isToday(date)) {
      group = 'Today';
    } else if (isYesterday(date)) {
      group = 'Yesterday';
    } else if (isThisWeek(date)) {
      group = 'This Week';
    } else if (isThisMonth(date)) {
      group = 'This Month';
    } else {
      group = 'Older';
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
  });

  return groups;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onArchive,
  onSearch,
  onPin,
  onStar,
  onMarkAsRead,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleMenuAction = (action: string) => {
    // Handle sidebar menu actions (Settings, etc.)
    console.log('Menu action:', action);
  };

  const groupedConversations = groupConversations(conversations);
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      {/* Header with Menu */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chats</h2>
        <div className="flex items-center gap-1">
          <Button
            onClick={onNew}
            size="sm"
            variant="ghost"
            className="gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleMenuAction('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('archived')}>
                <Archive className="mr-2 h-4 w-4" />
                Archived Chats
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMenuAction('starred')}>
                <Star className="mr-2 h-4 w-4" />
                Starred Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleMenuAction('help')}>
                Help & Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search chats..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
            <MessagesSquare className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-muted-foreground">
                Start a new chat with Aurea
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {groupOrder.map((group) => {
              const convs = groupedConversations[group];
              if (!convs?.length) return null;

              return (
                <div key={group}>
                  <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {convs.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeId}
                        onClick={() => onSelect(conv.id)}
                        onDelete={() => onDelete(conv.id)}
                        onArchive={() => onArchive(conv.id)}
                        onPin={onPin ? () => onPin(conv.id) : undefined}
                        onStar={onStar ? () => onStar(conv.id) : undefined}
                        onMarkAsRead={onMarkAsRead ? () => onMarkAsRead(conv.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  conversation: RAGConversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onPin?: () => void;
  onStar?: () => void;
  onMarkAsRead?: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onArchive,
  onPin,
  onStar,
  onMarkAsRead,
}: ConversationItemProps) {
  const handleCopy = () => {
    if (conversation.title) {
      navigator.clipboard.writeText(conversation.title);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-2 mx-2 transition-colors cursor-pointer',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted'
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {conversation.title || 'New Chat'}
          </p>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {conversation.messageCount} messages
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onMarkAsRead && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkAsRead(); }}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark as Read
            </DropdownMenuItem>
          )}
          {onPin && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
              <Pin className="mr-2 h-4 w-4" />
              Pin Chat
            </DropdownMenuItem>
          )}
          {onStar && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStar(); }}>
              <Star className="mr-2 h-4 w-4" />
              Star
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopy(); }}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Title
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ConversationSidebar;
