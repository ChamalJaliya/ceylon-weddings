"use client";

import {
  Bell,
  CalendarClock,
  CalendarHeart,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { AppNotification, NotificationCategory, NotificationVariant } from "@ceylonweddings/contracts";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { cn } from "@ceylonweddings/ui/utils";

const CATEGORY_ICON: Record<NotificationCategory, LucideIcon> = {
  messages: MessageCircle,
  bookings: Inbox,
  planning: CalendarHeart,
  listing: Store,
  account: ShieldCheck,
  admin: CalendarClock,
};

const VARIANT_TONE: Record<NotificationVariant, string> = {
  info: "bg-status-info-bg text-status-info-fg",
  success: "bg-status-success-bg text-status-success-fg",
  attention: "bg-status-warning-bg text-status-warning-fg",
  warning: "bg-status-danger-bg text-status-danger-fg",
};

export function iconForNotification(item: AppNotification): LucideIcon {
  const category = item.metadata?.category ?? (item.type.startsWith("message") ? "messages" : undefined);
  return category ? CATEGORY_ICON[category] : Bell;
}

/** "Just now", "5m", "3h", "Yesterday", "Mon", "12 Nov". */
export function timeAgo(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 172_800) return "Yesterday";
  if (seconds < 604_800) return then.toLocaleDateString(undefined, { weekday: "short" });
  return then.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export type DayGroupKey = "today" | "yesterday" | "this-week" | "earlier";
const DAY_LABEL: Record<DayGroupKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "this-week": "Earlier this week",
  earlier: "Earlier",
};

function dayGroup(iso: string, now: Date): DayGroupKey {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(now) - start(new Date(iso))) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return "this-week";
  return "earlier";
}

/** Kloqra inbox grouping: non-empty Today / Yesterday / Earlier this week / Earlier sections. */
export function groupByDay(items: readonly AppNotification[], now = new Date()) {
  const order: DayGroupKey[] = ["today", "yesterday", "this-week", "earlier"];
  return order
    .map((key) => ({
      key,
      label: DAY_LABEL[key],
      items: items.filter((item) => dayGroup(item.createdAt, now) === key),
    }))
    .filter((group) => group.items.length > 0);
}

export function NotificationRow({
  item,
  onOpen,
  dense = false,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
  dense?: boolean;
}) {
  const unread = !item.readAt;
  const variant = item.metadata?.variant ?? "info";
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      data-unread={unread || undefined}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dense ? "px-3 py-2.5" : "px-4 py-3.5",
        unread && "bg-primary-subtle/40",
      )}
    >
      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", VARIANT_TONE[variant])}>
        <Icon icon={iconForNotification(item)} size="xs" lottie={false} />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-compact text-foreground", unread && "font-medium")}>{item.title}</span>
          <span className="shrink-0 text-caption text-muted-foreground">{timeAgo(item.createdAt)}</span>
        </span>
        <span className={cn("text-caption text-muted-foreground", dense ? "line-clamp-2" : "line-clamp-3")}>
          {item.body}
        </span>
        {!dense && item.metadata?.details?.length ? (
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-muted-foreground">
            {item.metadata.details.map((d) => (
              <span key={d.label}>
                <span className="text-foreground">{d.label}:</span> {d.value}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      {unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
    </button>
  );
}
