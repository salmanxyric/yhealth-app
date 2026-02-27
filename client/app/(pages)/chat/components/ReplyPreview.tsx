'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  message: {
    content: string;
    senderName?: string;
    mediaType?: string;
  };
  onCancel: () => void;
  className?: string;
}

export function ReplyPreview({ message, onCancel, className }: ReplyPreviewProps) {
  const previewText =
    message.mediaType === 'image'
      ? '📷 Photo'
      : message.mediaType === 'video'
      ? '🎥 Video'
      : message.mediaType === 'audio'
      ? '🎤 Audio'
      : message.mediaType === 'document'
      ? '📄 Document'
      : message.content?.substring(0, 50) || '';

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 bg-muted/50 rounded-lg border',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {message.senderName && (
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Replying to {message.senderName}
          </div>
        )}
        <div className="text-xs text-foreground truncate">
          {previewText}
          {!message.mediaType && message.content && message.content.length > 50 ? '...' : ''}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onCancel}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

