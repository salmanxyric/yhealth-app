'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  className?: string;
  markdown?: boolean;
}

export function MessageBubble({
  content,
  isOwn,
  isDeleted = false,
  isEdited = false,
  className,
  markdown = false,
}: MessageBubbleProps) {
  // Don't render if content is empty or only whitespace
  if (!content || !content.trim()) {
    return null;
  }

  if (isDeleted) {
    return (
      <div
        className={cn(
          'rounded-2xl px-4 py-2.5 text-sm',
          'italic text-muted-foreground/60',
          // WhatsApp style: subtle background for deleted messages
          isOwn 
            ? 'bg-muted/40 text-muted-foreground/60' 
            : 'bg-muted/30 text-muted-foreground/60',
          className
        )}
      >
        <span className="flex items-center gap-1.5">
          <span>This message was deleted</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative break-words rounded-lg px-3 py-2 text-[14.2px] min-w-fit leading-[19px]',
        'max-w-[65%] sm:max-w-[60%] md:max-w-[55%]',
        isOwn
          ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tr-none shadow-sm'
          : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none border border-emerald-100 dark:border-emerald-600/30 shadow-sm',
        className
      )}
    >
      {markdown ? (
        <div className={cn('prose prose-sm max-w-none', isOwn && 'prose-invert')}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0 text-[14.2px] leading-[19px]">{children}</p>,
              ul: ({ children }) => <ul className="mb-1.5 ml-4 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="mb-1.5 ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5 text-[14.2px] leading-[19px]">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              code: ({ children }) => (
                <code className={cn(
                  'rounded px-1 py-0.5 text-xs',
                  isOwn ? 'bg-white/20' : 'bg-black/10'
                )}>
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="whitespace-pre-wrap min-w-fit text-[14.2px] leading-[19px]">{content}</p>
      )}
      {isEdited && (
        <span className="text-[11.5px] opacity-70 ml-1.5">(edited)</span>
      )}
    </div>
  );
}

