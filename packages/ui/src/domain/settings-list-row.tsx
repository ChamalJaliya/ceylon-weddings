"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/** Shared settings/CMS list row used by pages, flags, awards, and similar admin lists. */
export function SettingsListRow({
  title,
  description,
  meta,
  actions,
  className,
  onClick,
}: {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2",
        onClick && "cursor-pointer transition-colors hover:bg-secondary/20",
        className,
      )}
      onClick={onClick}
    >
      <div className="min-w-0 grid gap-0.5">
        <p className="truncate text-sm font-medium">{title}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </li>
  );
}

export function SettingsList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("grid gap-2", className)}>{children}</ul>;
}
