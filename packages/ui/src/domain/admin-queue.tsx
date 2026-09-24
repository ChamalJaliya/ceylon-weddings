"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Badge } from "../components/badge";

export function AdminQueue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

export function AdminQueueChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground/30 bg-foreground text-background"
          : "border-border/70 bg-background/50 text-foreground hover:bg-secondary/40",
      )}
    >
      <span>{label}</span>
      {count != null ? (
        <Badge intent={active ? "love" : undefined} className="min-w-6 justify-center">
          {count}
        </Badge>
      ) : null}
    </button>
  );
}
