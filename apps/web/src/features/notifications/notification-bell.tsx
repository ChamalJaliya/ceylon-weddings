"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, CheckCheck, Settings } from "lucide-react";
import { api, useMessagingStore } from "@ceylonweddings/web";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@ceylonweddings/ui/components/popover";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";
import { groupByDay, NotificationRow } from "./notification-ui";
import { useOpenNotification } from "./use-open-notification";

type Filter = "all" | "unread";

/**
 * Header bell (Kloqra NotificationDropdown): unread badge that pops on new
 * items, All / Unread tabs, day-grouped rows, mark all read, links to the
 * inbox and to notification settings. Live via the realtime store.
 */
export function NotificationBell({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const notifications = useMessagingStore((state) => state.notifications);
  const unread = useMessagingStore((state) => state.notificationUnread);
  const setNotifications = useMessagingStore((state) => state.setNotifications);
  const markAllLocal = useMessagingStore((state) => state.markNotificationsLocalRead);
  const openItem = useOpenNotification(() => setOpen(false));

  // Pop the badge when the count grows.
  const previous = useRef(unread);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (unread > previous.current) {
      setPop(true);
      const timer = window.setTimeout(() => setPop(false), 300);
      previous.current = unread;
      return () => window.clearTimeout(timer);
    }
    previous.current = unread;
  }, [unread]);

  // Refresh when opened so the list is right even if the socket missed something.
  useEffect(() => {
    if (!open) return;
    api.notifications
      .list({ limit: 20 })
      .then((page) => setNotifications(page.items, page.unreadCount))
      .catch(() => undefined);
  }, [open, setNotifications]);

  const visible = useMemo(
    () => (filter === "unread" ? notifications.filter((item) => !item.readAt) : notifications).slice(0, 12),
    [filter, notifications],
  );
  const groups = groupByDay(visible);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          data-testid="notification-bell"
          className={cn(
            "relative grid size-9 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            overlay ? "text-hero-foreground hover:bg-hero-foreground/10" : "text-foreground hover:bg-accent",
          )}
        >
          <Icon icon={Bell} size="sm" lottie={false} />
          {unread > 0 ? (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-primary px-1 text-label font-medium text-primary-foreground ring-2 ring-background transition-transform",
                pop && "scale-125",
              )}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <p className="font-serif text-h4 text-foreground">Notifications</p>
            {unread > 0 ? (
              <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-label font-medium text-primary-text">
                {unread} new
              </span>
            ) : null}
          </div>
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => {
              markAllLocal();
              void api.notifications.markRead({ all: true }).catch(() => undefined);
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-caption font-medium text-primary-text hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon icon={CheckCheck} size="xs" lottie={false} />
            Mark all read
          </button>
        </div>

        <div role="tablist" aria-label="Filter notifications" className="flex gap-1 px-3 pt-2">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-3 py-1 text-caption font-medium transition-colors",
                filter === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {value === "all" ? "All" : `Unread${unread ? ` (${unread})` : ""}`}
            </button>
          ))}
        </div>

        <div className="max-h-[min(26rem,60dvh)] overflow-y-auto px-2 py-2">
          {groups.length ? (
            groups.map((group) => (
              <div key={group.key} className="grid gap-0.5 pb-1">
                <p className="cw-eyebrow px-3 pt-2 pb-1">{group.label}</p>
                {group.items.map((item) => (
                  <NotificationRow key={item.id} item={item} onOpen={openItem} dense />
                ))}
              </div>
            ))
          ) : (
            <div className="grid place-items-center gap-2 px-6 py-10 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Icon icon={filter === "unread" ? CheckCheck : BellOff} size="sm" lottie={false} />
              </span>
              <p className="text-compact font-medium text-foreground">
                {filter === "unread" ? "You're all caught up" : "No notifications yet"}
              </p>
              <p className="text-caption text-muted-foreground">
                {filter === "unread"
                  ? "New messages, inquiries and RSVPs will show up here."
                  : "We'll let you know when something needs you."}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-inset px-4 py-2.5">
          <Link
            href="/settings/notifications"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
          >
            <Icon icon={Settings} size="xs" lottie={false} />
            Settings
          </Link>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="text-caption font-medium text-primary-text hover:text-primary-hover"
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
