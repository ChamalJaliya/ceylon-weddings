"use client";

import * as React from "react";
import type { IconComponent } from "../components/icon";
import { getListEmptyMode } from "../lib/list-state";
import { cn } from "../lib/utils";
import {
  DataTableCard,
  DataTableHeaderRow,
  DataTableScroll,
  Table,
  TableBody,
  TableHeader,
  TablePagination,
  TableLoadingState,
  TableRow,
  type TablePaginationProps,
} from "./data-table";
import { EmptyState } from "./empty-state";

export type DataTableListEmptyProps = {
  icon?: IconComponent;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
};

export type DataTableListProps<T> = {
  /** Stretch to fill leftover height when rows are showing. */
  fill?: boolean;
  /** When false, skip the outer card (use inside SectionCard). Default true. */
  framed?: boolean;
  className?: string;
  loading?: boolean;
  loadingRows?: number;
  loadingColumns?: number;
  /** Optional error UI (replaces empty/table when set and not loading). */
  error?: React.ReactNode;
  /** Unfiltered source record count — drives true-empty chrome gating. */
  sourceCount: number;
  /** Count after search/filters (page items or filtered total). */
  filteredCount: number;
  /** Props for true-empty (`kind="empty"`). */
  empty?: DataTableListEmptyProps;
  /** Props for filtered empty (`kind="no-results"`). */
  filteredEmpty?: DataTableListEmptyProps;
  /** Shown when mode is null (has rows). Omit to hide pagination. */
  pagination?: TablePaginationProps | null;
  /** Column-driven table body (preferred for workspace lists). */
  items?: readonly T[];
  getRowId?: (row: T) => string;
  orderedVisibleIds?: readonly string[];
  renderHead?: (id: string) => React.ReactNode;
  renderCell?: (id: string, row: T) => React.ReactNode;
  rowProps?: (row: T) => React.ComponentProps<typeof TableRow>;
  /**
   * Custom table content when not using items/renderHead/renderCell.
   * Rendered inside DataTableScroll when mode is null.
   */
  table?: React.ReactNode;
};

/**
 * Shared server/client list-table body shell (Kloqra DataTableList port).
 *
 * Gate toolbar with `showListChrome(getListEmptyMode({ sourceCount, filteredCount }), loading)`.
 * Pass server `page`/`limit`/`total` into `pagination`, or use `useClientTablePagination`.
 */
export function DataTableList<T>({
  fill = false,
  framed = true,
  className,
  loading = false,
  loadingRows = 5,
  loadingColumns = 4,
  error,
  sourceCount,
  filteredCount,
  empty,
  filteredEmpty,
  pagination,
  items,
  getRowId,
  orderedVisibleIds,
  renderHead,
  renderCell,
  rowProps,
  table,
}: DataTableListProps<T>) {
  const mode = getListEmptyMode({ sourceCount, filteredCount });
  const showingRows = !loading && !error && mode === null;
  const cardFill = fill && showingRows;

  let body: React.ReactNode;
  if (loading) {
    body = <TableLoadingState rows={loadingRows} columns={loadingColumns} />;
  } else if (error) {
    body = error;
  } else if (mode === "empty") {
    body = (
      <div className="p-3 sm:p-4">
        <EmptyState
          kind="empty"
          icon={empty?.icon}
          title={empty?.title}
          description={empty?.description}
          action={empty?.action}
        />
      </div>
    );
  } else if (mode === "no-results") {
    body = (
      <div className="p-3 sm:p-4">
        <EmptyState
          kind="no-results"
          icon={filteredEmpty?.icon}
          title={filteredEmpty?.title}
          description={filteredEmpty?.description}
          action={filteredEmpty?.action}
          onClearFilters={filteredEmpty?.onClearFilters}
          clearFiltersLabel={filteredEmpty?.clearFiltersLabel}
        />
      </div>
    );
  } else if (table) {
    body = (
      <>
        <DataTableScroll>{table}</DataTableScroll>
        {pagination ? <TablePagination {...pagination} /> : null}
      </>
    );
  } else {
    const ids = orderedVisibleIds ?? [];
    const rows = items ?? [];
    body = (
      <>
        <DataTableScroll>
          <Table embedded>
            <TableHeader>
              <DataTableHeaderRow>{ids.map((id) => (renderHead ? renderHead(id) : null))}</DataTableHeaderRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const id = getRowId ? getRowId(row) : String(row);
                const extra = rowProps?.(row) ?? {};
                return (
                  <TableRow key={id} {...extra}>
                    {ids.map((colId) => (renderCell ? renderCell(colId, row) : null))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableScroll>
        {pagination ? <TablePagination {...pagination} /> : null}
      </>
    );
  }

  if (!framed) {
    return <div className={cn("min-w-0 w-full", className)}>{body}</div>;
  }

  return (
    <DataTableCard fill={cardFill} className={className}>
      {body}
    </DataTableCard>
  );
}
