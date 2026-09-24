"use client";

import { cn } from "../lib/utils";

export type AuditTimelineItem = {
  id: string;
  action: string;
  actorName?: string | null;
  createdAt: string;
};

export function AuditTimeline({
  items,
  className,
}: {
  items: AuditTimelineItem[];
  className?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No audit events yet.</p>;
  }
  return (
    <ol className={cn("grid gap-3 border-l border-border/70 pl-4", className)}>
      {items.map((item) => (
        <li key={item.id} className="relative grid gap-1">
          <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-foreground/70" />
          <p className="text-sm font-medium">{item.action}</p>
          <p className="text-xs text-muted-foreground">
            {item.actorName ?? "System"} · {new Date(item.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
