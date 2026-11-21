"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import * as React from "react";
import type { DataTableSortDirection } from "../lib/data-table-columns";
import { cn } from "../lib/utils";
import { DataTableHead } from "./data-table";

export type DataTableSortableHeadProps = React.ComponentProps<typeof DataTableHead> & {
  sortDir?: DataTableSortDirection;
  onSort?: () => void;
  sortable?: boolean;
};

export function DataTableSortableHead({
  children,
  className,
  sortDir,
  onSort,
  sortable = true,
  align,
  numeric,
  ...props
}: DataTableSortableHeadProps) {
  if (!sortable || !onSort) {
    return (
      <DataTableHead align={align} numeric={numeric} className={className} {...props}>
        {children}
      </DataTableHead>
    );
  }

  const ariaSort = sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none";
  const Icon = sortDir === "asc" ? ArrowUp : sortDir === "desc" ? ArrowDown : ArrowUpDown;
  const active = Boolean(sortDir);
  const resolvedAlign = align ?? (numeric ? "right" : "left");

  return (
    <DataTableHead
      aria-sort={ariaSort}
      align={align}
      numeric={numeric}
      className={cn("p-0 sm:px-0 first:pl-0 last:pr-0", className)}
      {...props}
    >
      <button
        type="button"
        data-active={active ? "true" : undefined}
        className={cn(
          "inline-flex h-full min-h-10 w-full items-center gap-1.5 px-3 text-xs font-medium uppercase tracking-wide sm:min-h-11 sm:px-4",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          resolvedAlign === "right"
            ? "justify-end text-right"
            : resolvedAlign === "center"
              ? "justify-center text-center"
              : "justify-start text-left",
        )}
        onClick={onSort}
      >
        <span className="min-w-0 truncate">{children}</span>
        <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      </button>
    </DataTableHead>
  );
}
