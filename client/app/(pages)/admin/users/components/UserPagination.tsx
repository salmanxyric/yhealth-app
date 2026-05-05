"use client";

import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

interface UserPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
}

export function UserPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: UserPaginationProps) {
  return (
    <PaginationBar
      currentPage={currentPage}
      totalPages={totalPages}
      total={totalItems}
      pageSize={itemsPerPage}
      onPageChange={onPageChange}
      className={cn("rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm", className)}
    />
  );
}
