'use client';

import { useState, useMemo, useCallback, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronRight,
  Columns3,
  X,
} from 'lucide-react';
import { ContentSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface PaginationConfig {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: 'default' | 'destructive';
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  enableSelection?: boolean;
  enableColumnVisibility?: boolean;
  stickyHeader?: boolean;
  pagination?: PaginationConfig;
  bulkActions?: BulkAction[];
  renderExpandedRow?: (row: TData) => React.ReactNode;
  getRowId?: (row: TData) => string;
  tableId?: string;
  className?: string;
}

function DefaultEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60">
        <ChevronsUpDown className="h-5 w-5 text-slate-500" />
      </div>
      <p className="text-sm text-slate-400">No results found</p>
    </div>
  );
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyState,
  onRowClick,
  enableSelection = false,
  enableColumnVisibility = false,
  stickyHeader = false,
  pagination,
  bulkActions,
  renderExpandedRow,
  getRowId,
  tableId,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (!tableId) return {};
    try {
      const stored = localStorage.getItem(`dt-cols-${tableId}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleColumnVisibilityChange = useCallback(
    (updater: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (tableId) {
          try { localStorage.setItem(`dt-cols-${tableId}`, JSON.stringify(next)); } catch { /* noop */ }
        }
        return next;
      });
    },
    [tableId],
  );

  const allColumns = useMemo(() => {
    const cols: ColumnDef<TData, unknown>[] = [];

    if (enableSelection) {
      cols.push({
        id: '_select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
            className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
            className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (renderExpandedRow) {
      cols.push({
        id: '_expand',
        header: () => null,
        cell: ({ row }) => {
          const rowId = row.id;
          const isExpanded = expandedRows.has(rowId);
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedRows((prev) => {
                  const next = new Set(prev);
                  if (next.has(rowId)) next.delete(rowId);
                  else next.add(rowId);
                  return next;
                });
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
            >
              <ChevronRight
                className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
              />
            </button>
          );
        },
        size: 36,
        enableSorting: false,
        enableHiding: false,
      });
    }

    cols.push(...columns);
    return cols;
  }, [columns, enableSelection, renderExpandedRow, expandedRows]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: handleColumnVisibilityChange as Parameters<typeof useReactTable>[0]['onColumnVisibilityChange'],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId as Parameters<typeof useReactTable>[0]['getRowId'],
    enableRowSelection: enableSelection,
    manualPagination: true,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60', className)}>
      {/* Bulk action bar */}
      {enableSelection && selectedCount > 0 && bulkActions && (
        <div className="flex items-center gap-3 border-b border-slate-800 bg-emerald-500/5 px-5 py-2.5">
          <span className="text-xs font-medium text-emerald-400">{selectedCount} selected</span>
          <div className="flex items-center gap-1.5">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  const ids = Object.keys(rowSelection);
                  action.onClick(ids);
                }}
                className={cn(
                  'h-7 text-xs',
                  action.variant !== 'destructive' && 'border-slate-700 text-slate-300',
                )}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
          <button
            onClick={() => setRowSelection({})}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Column visibility + header actions */}
      {enableColumnVisibility && (
        <div className="flex items-center justify-end border-b border-slate-800/60 px-4 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-slate-500 hover:text-slate-300">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-slate-700 bg-slate-900 text-slate-300">
              {table.getAllLeafColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    className="text-xs capitalize"
                  >
                    {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <ContentSkeleton
          name={`datatable-${tableId ?? 'default'}`}
          loading={isLoading}
          animate="shimmer"
          darkColor="rgba(255,255,255,0.06)"
          fixture={
            <div className="space-y-0 p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-slate-800/40 px-5 py-3.5">
                  {Array.from({ length: Math.min(columns.length, 5) }).map((_, j) => (
                    <ShadcnSkeleton key={j} className="h-4 flex-1 bg-slate-800/60" />
                  ))}
                </div>
              ))}
            </div>
          }
        >
        {data.length === 0 ? (
          emptyState ?? <DefaultEmptyState />
        ) : (
          <Table>
            <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm')}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-slate-800 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-slate-500',
                        header.column.getCanSort() && 'cursor-pointer select-none',
                      )}
                      style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-slate-600">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className={cn(
                      'border-slate-800/60 transition-colors hover:bg-slate-800/30',
                      onRowClick && 'cursor-pointer',
                      row.getIsSelected() && 'bg-emerald-500/5',
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-3 text-sm text-slate-300"
                        style={cell.column.columnDef.size ? { width: cell.column.columnDef.size } : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderExpandedRow && expandedRows.has(row.id) && (
                    <TableRow className="border-slate-800/60 bg-slate-950/30 hover:bg-slate-950/30">
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="px-5 py-4"
                      >
                        {renderExpandedRow(row.original)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
        </ContentSkeleton>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > pagination.pageSize && (
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
          <p className="text-xs text-slate-500">
            {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="h-7 border-slate-700 px-3 text-xs text-slate-400 hover:text-slate-200"
            >
              Previous
            </Button>
            <span className="px-2 text-xs text-slate-500">
              {pagination.page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="h-7 border-slate-700 px-3 text-xs text-slate-400 hover:text-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
