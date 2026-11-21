"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Settings } from "lucide-react";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type AppNotification,
  type NotificationCategory,
  type Role,
} from "@ceylonweddings/contracts";
import { api, useAuthStore, useMessagingStore } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { HorizontalTabs } from "@ceylonweddings/ui/components/horizontal-tabs";
import { SkeletonText } from "@ceylonweddings/ui/components/skeleton";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";
import { groupByDay, NotificationRow } from "./notification-ui";
import { useOpenNotification } from "./use-open-notification";

/** Only show filter chips that can ever have items for this role. */
const CATEGORIES_FOR_ROLE: Record<Role, NotificationCategory[]> = {
  COUPLE: ["messages", "planning", "account"],
  FAMILY: ["messages", "planning", "account"],
  VENDOR: ["messages", "bookings", "listing", "account"],
  ADMIN: ["messages", "admin", "account"],
};

/** Full inbox (Kloqra NotificationsPage): filters, day groups, load older, mark all read. */
export default function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const unread = useMessagingStore((state) => state.notificationUnread);
  const markAllLocal = useMessagingStore((state) => state.markNotificationsLocalRead);
  const markLocal = useMessagingStore((state) => state.markNotificationLocalRead);
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const openItem = useOpenNotification();

  const query = useCallback(
    (before?: string) =>
      api.notifications.list({
        limit: 25,
        unread: unreadOnly || undefined,
        category: category === "all" ? undefined : category,
        before,
      }),
    [category, unreadOnly],
  );

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    query()
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setNextBefore(page.nextBefore);
      })
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const categories = user ? CATEGORIES_FOR_ROLE[user.role] : [];
  const filtered = category !== "all" || unreadOnly;
  const groups = groupByDay(items ?? []);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        kicker="Inbox"
        icon={Bell}
        title="Notifications"
        description="Messages, inquiries, RSVPs and account updates in one place."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm" iconLeft={Settings}>
              <Link href="/settings/notifications">Settings</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={CheckCheck}
              disabled={unread === 0}
              onClick={async () => {
                markAllLocal();
                setItems(
                  (rows) => rows?.map((row) => ({ ...row, readAt: row.readAt ?? new Date().toISOString() })) ?? rows,
                );
                try {
                  await api.notifications.markRead({ all: true });
                } catch {
                  toast.error("Couldn't mark everything as read");
                }
              }}
            >
              Mark all read
            </Button>
          </div>
        }
      />

      <HorizontalTabs
        ariaLabel="Filter notifications"
        activeId={category}
        onChange={setCategory}
        items={[
          { id: "all" as const, label: "All" },
          ...categories.map((value) => ({
            id: value,
            label: NOTIFICATION_CATEGORY_LABELS[value],
          })),
        ]}
        actions={
          <button
            type="button"
            aria-pressed={unreadOnly}
            onClick={() => setUnreadOnly((v) => !v)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-caption font-medium transition-colors",
              unreadOnly
                ? "border-primary bg-primary-subtle text-primary-text"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            Unread only{unread ? ` · ${unread}` : ""}
          </button>
        }
      />

      {items === null ? (
        <div className="card card--raised grid gap-5 p-6">
          <SkeletonText lines={2} />
          <SkeletonText lines={2} />
          <SkeletonText lines={2} />
        </div>
      ) : items.length === 0 ? (
        filtered ? (
          <EmptyState
            kind="no-results"
            title={unreadOnly ? "You're all caught up" : "Nothing in this category"}
            onClearFilters={() => {
              setCategory("all");
              setUnreadOnly(false);
            }}
          />
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="New messages, inquiries and RSVPs will show up here."
          />
        )
      ) : (
        <div className="card card--raised grid gap-1 p-2">
          {groups.map((group) => (
            <section key={group.key} className="grid gap-0.5 pb-1" aria-label={group.label}>
              <p className="cw-eyebrow px-4 pt-3 pb-1">{group.label}</p>
              {group.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onOpen={(row) => {
                    if (!row.readAt) {
                      markLocal(row.id);
                      setItems(
                        (rows) =>
                          rows?.map((r) => (r.id === row.id ? { ...r, readAt: new Date().toISOString() } : r)) ?? rows,
                      );
                    }
                    openItem(row);
                  }}
                />
              ))}
            </section>
          ))}
          {nextBefore ? (
            <div className="flex justify-center p-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={loadingMore}
                onClick={async () => {
                  setLoadingMore(true);
                  try {
                    const page = await query(nextBefore);
                    setItems((rows) => [...(rows ?? []), ...page.items]);
                    setNextBefore(page.nextBefore);
                  } finally {
                    setLoadingMore(false);
                  }
                }}
              >
                {loadingMore ? "Loading…" : "Load older"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
