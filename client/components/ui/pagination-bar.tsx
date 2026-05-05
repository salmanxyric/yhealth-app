'use client';

import { cn } from '@/lib/utils';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  label?: string;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pages.push(i);
    pages.push('ellipsis');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1);
    pages.push('ellipsis');
    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('ellipsis');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push('ellipsis');
    pages.push(totalPages);
  }
  return pages;
}

export function PaginationBar({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.06]',
      className,
    )}>
      <span className="text-gray-500 text-xs sm:text-sm">
        Showing{' '}
        <span className="text-white font-semibold">{start}</span>
        {' - '}
        <span className="text-white font-semibold">{end}</span>
        {' of '}
        <span className="text-emerald-400 font-semibold">{total.toLocaleString()}</span>
      </span>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
            currentPage === 1
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
          )}
          aria-label="First page"
        >
          &laquo;
        </button>
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
            currentPage === 1
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
          )}
          aria-label="Previous page"
        >
          &lsaquo;
        </button>

        {/* Page numbers */}
        {getPageNumbers(currentPage, totalPages).map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-600 text-xs">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                currentPage === p
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
              )}
              aria-label={`Page ${p}`}
              aria-current={currentPage === p ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
            currentPage === totalPages
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
          )}
          aria-label="Next page"
        >
          &rsaquo;
        </button>
        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
            currentPage === totalPages
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
          )}
          aria-label="Last page"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
