'use client';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface FormSection {
  key: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

interface FormModalProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: FormSection[];
  footer: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
} as const;

export function FormModal({
  title,
  description,
  open,
  onOpenChange,
  sections,
  footer,
  maxWidth = 'lg',
  className,
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          MAX_WIDTH_MAP[maxWidth],
          'flex max-h-[85vh] flex-col gap-0 overflow-hidden border-slate-800 bg-slate-900 p-0 text-slate-100 shadow-2xl',
          className,
        )}
        showCloseButton
      >
        {/* Header — fixed */}
        <DialogHeader className="shrink-0 border-b border-slate-800 px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-slate-100">{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-1 text-sm text-slate-500">{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-800/80">
            {sections.map((section) => (
              <div key={section.key} className="px-6 py-5">
                {(section.title || section.description) && (
                  <div className="mb-4">
                    {section.title && (
                      <h3 className="text-sm font-medium text-slate-200">{section.title}</h3>
                    )}
                    {section.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{section.description}</p>
                    )}
                  </div>
                )}
                {section.children}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer — sticky at bottom */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-end gap-3">
            {footer}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
