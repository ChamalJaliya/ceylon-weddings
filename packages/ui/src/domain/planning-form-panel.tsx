"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/** Bordered form cluster used across planning pages (guests, family, seating, agenda). */
export function PlanningFormPanel({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div
      className={cn("grid gap-3 rounded-3xl border border-border/70 bg-card/40 p-4", className)}
      data-slot="planning-form-panel"
    >
      {title != null || description != null ? (
        <div className="grid gap-1">
          {title != null ? <p className="text-sm font-medium">{title}</p> : null}
          {description != null ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** Event picker + primary actions row shared by agenda / music / seating. */
export function PlanningEventToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)} data-slot="planning-event-toolbar">
      {children}
    </div>
  );
}

/** Compact summary chip used for seating/agenda counts. */
export function StatPill({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "default" && "bg-secondary text-secondary-foreground",
        tone === "warning" && "bg-warning/20 text-warning-foreground",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "success" && "bg-success/15 text-success",
        className,
      )}
      data-slot="stat-pill"
    >
      {children}
    </span>
  );
}
