"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { api, useAuthStore, useMessagingStore, useRealtimeMessaging } from "@ceylonweddings/web";
import type { Inquiry } from "@ceylonweddings/contracts";
import { Popover, PopoverContent, PopoverTrigger } from "@ceylonweddings/ui/components/popover";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { useRouter } from "../i18n/navigation";
import { PreferenceControls } from "./preference-controls";
import { AccountMenu } from "./account-menu";
import { NotificationBell } from "@/features/notifications/notification-bell";

function messagesHref(role: string | undefined) {
  if (role === "VENDOR") return "/pro/messages";
  if (role === "ADMIN") return "/admin/messages";
  return "/planning/messages";
}

export function ShellTrail({ overlay = false, messages = false }: { overlay?: boolean; messages?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  useRealtimeMessaging(messages && Boolean(user));

  const conversations = useMessagingStore((state) => state.conversations);
  const unreadTotal = useMessagingStore((state) => state.unreadTotal);

  const [inquiries, setInquiries] = useState<(Inquiry & { vendorName?: string })[]>([]);

  useEffect(() => {
    if (!messages || !user) return;
    if (user.role === "COUPLE" || user.role === "FAMILY") {
      api.wedding
        .inquiries()
        .then(setInquiries)
        .catch(() => setInquiries([]));
    }
  }, [messages, user]);

  const dmPreview = conversations.slice(0, 5);
  const href = messagesHref(user?.role);

  return (
    <>
      {messages ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" shape="pill" aria-label={t("nav.messages")} className="relative">
              <Icon icon={MessageCircle} size="sm" className={unreadTotal ? "text-primary" : undefined} />
              {unreadTotal > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-label font-medium text-primary-foreground">
                  {unreadTotal > 9 ? "9+" : unreadTotal}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-medium">{t("nav.messages")}</p>
              <button type="button" className="text-xs font-medium text-primary" onClick={() => router.push(href)}>
                {t("messaging.openInbox")}
              </button>
            </div>
            <div className="grid max-h-72 gap-3 overflow-auto">
              {dmPreview.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-lg p-2 text-left text-sm hover:bg-secondary"
                  onClick={() => router.push(`${href}?c=${item.id}`)}
                >
                  <p className="font-medium">{item.peer?.name ?? item.vendorName ?? t("messaging.support")}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.lastMessagePreview ?? "—"}</p>
                </button>
              ))}
              {dmPreview.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("messaging.inboxEmpty")}</p>
              ) : null}

              {(user?.role === "COUPLE" || user?.role === "FAMILY") && inquiries.length > 0 ? (
                <div className="border-t border-border/60 pt-3">
                  <p className="mb-2 text-label font-medium tracking-spaced text-muted-foreground uppercase">
                    {t("messaging.whatsappLeads")}
                  </p>
                  {inquiries.slice(0, 4).map((item) => (
                    <a
                      key={item.id}
                      href={item.whatsappUrl ?? "#"}
                      target={item.whatsappUrl ? "_blank" : undefined}
                      rel="noreferrer"
                      className="mb-2 block rounded-lg p-2 text-sm hover:bg-secondary"
                    >
                      <p className="font-medium">{item.vendorName ?? item.vendorId}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                      {item.whatsappUrl ? (
                        <p className="mt-1 text-xs font-medium text-primary">{t("knotly.openWhatsapp")}</p>
                      ) : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
      {user ? <NotificationBell overlay={overlay} /> : null}
      <PreferenceControls overlay={overlay} showSample />
      <AccountMenu overlay={overlay} />
    </>
  );
}
