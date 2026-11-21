"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { AsyncSearchField } from "./async-list";

/**
 * Shared list toolbar for admin/pro server tables (Kloqra AppBarListToolbar pattern).
 * Gate with `showListChrome(...)` so it hides on true-empty.
 */
export function AdminListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  tableTools,
  actions,
  summary,
  className,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  tableTools?: ReactNode;
  actions?: ReactNode;
  summary?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", className)}
      data-slot="admin-list-toolbar"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {onSearchChange ? (
          <AsyncSearchField
            value={searchValue ?? ""}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="min-w-[12rem] flex-1 sm:max-w-sm"
          />
        ) : null}
        {filters}
      </div>
      {summary || tableTools || actions ? (
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
          {summary ? (
            <p className="mr-auto text-sm text-muted-foreground sm:mr-0" aria-live="polite">
              {summary}
            </p>
          ) : null}
          {tableTools}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
