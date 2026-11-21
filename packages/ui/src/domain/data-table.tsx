"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/table";
import { TABLE_PAGE_SIZE_OPTIONS } from "../lib/use-client-table-pagination";
import { cn } from "../lib/utils";

export const dataTableCardClass = "min-w-0 w-full gap-0 overflow-hidden border border-border/60 p-0";
export const dataTableHeaderRowClass = "border-b border-border/60 bg-secondary/30";
export const dataTableHeadClass = "h-10 px-3 text-xs font-medium uppercase tracking-wide sm:h-11 sm:px-4";
export const dataTableCellClass = "px-3 py-3 text-sm sm:px-4";

export type ScrollEdges = { left: boolean; right: boolean };

export function useHorizontalScrollEdges<T extends HTMLElement>(ref: React.RefObject<T | null>): ScrollEdges {
  const [edges, setEdges] = React.useState<ScrollEdges>({ left: false, right: false });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const next = { left: el.scrollLeft > 1, right: max - el.scrollLeft > 1 };
      setEdges((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [ref]);

  return edges;
}

function ScrollEdgeCues({ edges }: { edges: ScrollEdges }) {
  const cueBase =
    "pointer-events-none absolute inset-y-0 z-20 w-6 transition-opacity duration-150 motion-reduce:transition-none";
  return (
    <>
      <div
        aria-hidden
        className={cn(
          cueBase,
          "left-0 bg-gradient-to-r from-foreground/10 to-transparent",
          edges.left ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          cueBase,
          "right-0 bg-gradient-to-l from-foreground/10 to-transparent",
          edges.right ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

export function DataTableCard({
  children,
  className,
  fill = false,
}: {
  children: React.ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return (
    <Card
      elevation="raised"
      data-fill={fill ? "true" : undefined}
      data-testid="data-table-list"
      className={cn(dataTableCardClass, "rounded-xl shadow-none", fill && "flex min-h-0 flex-1 flex-col", className)}
    >
      {children}
    </Card>
  );
}

export function DataTableScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const edges = useHorizontalScrollEdges(scrollRef);
  return (
    <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col">
      <div
        ref={scrollRef}
        data-slot="data-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scrollable table view"
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          className,
        )}
      >
        {children}
      </div>
      <ScrollEdgeCues edges={edges} />
    </div>
  );
}

export type TablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: readonly number[];
  pageSizeLabel?: string;
  summary?: React.ReactNode;
  disabled?: boolean;
};

/** Visible page buttons with ellipsis for large totals. */
export function getVisiblePageNumbers(page: number, totalPages: number): Array<number | "ellipsis"> {
  const total = Math.max(totalPages, 1);
  const current = Math.min(Math.max(page, 1), total);
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p > 1 && p < total) pages.add(p);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export function TablePagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  pageSizeLabel = "Rows per page",
  summary,
  disabled,
}: TablePaginationProps) {
  const sizes = pageSizeOptions ?? TABLE_PAGE_SIZE_OPTIONS;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = total === 0 ? 0 : Math.min(page * limit, total);
  const defaultSummary = `Showing ${start}–${end} of ${total}`;
  const safeTotalPages = Math.max(totalPages, 1);
  const pageItems = getVisiblePageNumbers(page, safeTotalPages);
  const prevDisabled = disabled || page <= 1;
  const nextDisabled = disabled || page >= safeTotalPages || totalPages === 0;

  return (
    <div
      className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-5"
      data-testid="table-pagination"
    >
      <span className="min-w-0 shrink-0">{summary ?? defaultSummary}</span>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto sm:justify-end">
        {onLimitChange ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="whitespace-nowrap">{pageSizeLabel}</span>
            <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))} disabled={disabled}>
              <SelectTrigger className="h-9 w-[4.5rem] shrink-0" aria-label={pageSizeLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <nav className="flex max-w-full flex-wrap items-center gap-1.5" aria-label="Pagination">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            disabled={prevDisabled}
            aria-label="Previous page"
            icon={ChevronLeft}
            onClick={() => onPageChange(page - 1)}
          />
          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="flex size-9 items-center justify-center" aria-hidden>
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === page ? "default" : "outline"}
                size="icon"
                className="size-9 shrink-0"
                disabled={disabled}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            disabled={nextDisabled}
            aria-label="Next page"
            icon={ChevronRight}
            onClick={() => onPageChange(page + 1)}
          />
        </nav>
      </div>
    </div>
  );
}

export function DataTableHeaderRow({ className, ...props }: React.ComponentProps<typeof TableRow>) {
  return <TableRow className={cn(dataTableHeaderRowClass, "hover:bg-secondary/30", className)} {...props} />;
}

export type DataTablePriority = "core" | "meta";

type DataTableColumnProps = {
  priority?: DataTablePriority;
  sticky?: boolean;
};

export function DataTableHead({
  className,
  priority = "core",
  sticky = false,
  ...props
}: React.ComponentProps<typeof TableHead> & DataTableColumnProps) {
  return (
    <TableHead
      data-priority={priority}
      data-sticky={sticky ? "true" : undefined}
      className={cn(
        dataTableHeadClass,
        sticky && "sticky left-0 z-[1] bg-card",
        priority === "meta" && "text-muted-foreground/80",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  priority = "core",
  sticky = false,
  ...props
}: React.ComponentProps<typeof TableCell> & DataTableColumnProps) {
  return (
    <TableCell
      data-priority={priority}
      data-sticky={sticky ? "true" : undefined}
      className={cn(
        dataTableCellClass,
        sticky && "sticky left-0 z-[1] bg-card",
        priority === "meta" && "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableLoadingState({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden", className)} aria-busy>
      <Table>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="pointer-events-none">
              {Array.from({ length: columns }).map((__, colIndex) => (
                <TableCell key={colIndex} className={dataTableCellClass}>
                  <div
                    className={cn(
                      "h-4 animate-pulse rounded-md bg-secondary",
                      colIndex === columns - 1 ? "ml-auto w-16" : "w-full max-w-[11.25rem]",
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { Table, TableBody, TableHeader, TableRow };
