import type { ReactNode } from "react";
import { Badge } from "../components/badge";
import type { BadgeIntent } from "../contracts/badge";
import { Button } from "../components/button";
import { cn } from "../lib/utils";

const STATUS_INTENT: Record<string, BadgeIntent> = {
  CONSIDERING: "default",
  INVITED: "info",
  CONFIRMED: "success",
  DECLINED: "danger",
  MAYBE: "love",
  WALK_IN: "info",
};

export function GuestRow({
  initials,
  name,
  household,
  meta,
  status,
  statusIntent,
  actions,
  className,
}: {
  initials: string;
  name: string;
  household: string;
  meta?: string;
  status: string;
  statusIntent?: BadgeIntent;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="guest-row"
      className={cn("flex flex-wrap items-center gap-3 border-b border-border/60 py-3 last:border-0", className)}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {household}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
      <Badge intent={statusIntent ?? STATUS_INTENT[status] ?? "default"}>{status}</Badge>
      {actions ? <div className="flex flex-wrap gap-1.5">{actions}</div> : null}
    </div>
  );
}

export function GuestInviteChip({
  label,
  status,
  onClick,
}: {
  label: string;
  status: string;
  onClick?: () => void;
}) {
  return (
    <Button type="button" size="sm" variant="outline" className="h-7 rounded-full text-[11px]" onClick={onClick}>
      {label}: {status}
    </Button>
  );
}
