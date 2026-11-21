"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { EmptyState } from "./empty-state";
import type { IconComponent } from "../components/icon";

/**
 * Compact preview row for dashboards (pro leads, planning messages, studio steps).
 */
export function PreviewRow({
  title,
  description,
  meta,
  actions,
  className,
  onClick,
  leading,
}: {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
  leading?: ReactNode;
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
        "cw-row-lift flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm",
        onClick && "cursor-pointer",
        className,
      )}
      data-slot="preview-row"
    >
      {leading}
      <div className="min-w-0 flex-1 grid gap-0.5">
        <p className="font-medium">{title}</p>
        {description != null ? <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p> : null}
        {meta}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PreviewRowList({
  children,
  className,
  empty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  children: ReactNode;
  className?: string;
  empty?: boolean;
  emptyIcon?: IconComponent;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
}) {
  if (empty) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} className="py-8" />;
  }
  return (
    <div className={cn("grid gap-2", className)} data-slot="preview-row-list">
      {children}
    </div>
  );
}

/** Bullet-style tip/step row for studio next-steps lists. */
export function BulletPreviewRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <li
      className={cn(
        "flex items-start gap-2 rounded-xl border border-border/50 bg-background/30 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
      data-slot="bullet-preview-row"
    >
      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="min-w-0 capitalize">{children}</span>
    </li>
  );
}
