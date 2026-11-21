"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/**
 * Shared planning list row — guests/budget/checklist/family style.
 * Use `variant="divided"` inside a `PlanningList` for checklist-style stacks.
 */
export function PlanningListRow({
  title,
  description,
  meta,
  actions,
  children,
  className,
  variant = "card",
  onClick,
}: {
  title?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  variant?: "card" | "divided" | "plain";
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "cw-row-lift",
        variant === "card" && "grid gap-2 rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4",
        variant === "divided" && "flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between",
        variant === "plain" && "grid gap-2",
        onClick && "cursor-pointer",
        className,
      )}
      data-slot="planning-list-row"
    >
      {(title != null || description != null || meta != null) && (
        <div className="min-w-0 grid gap-0.5">
          {title != null ? <div className="text-sm font-medium">{title}</div> : null}
          {description != null ? <div className="text-xs text-muted-foreground">{description}</div> : null}
          {meta}
        </div>
      )}
      {children}
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PlanningList({
  children,
  className,
  divided = false,
}: {
  children: ReactNode;
  className?: string;
  divided?: boolean;
}) {
  return (
    <div className={cn(divided ? "divide-y divide-border/70" : "grid gap-3", className)} data-slot="planning-list">
      {children}
    </div>
  );
}
