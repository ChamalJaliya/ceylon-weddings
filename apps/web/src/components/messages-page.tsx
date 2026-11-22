"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  api,
  emitTyping,
  joinConversationRoom,
  leaveConversationRoom,
  useAuthStore,
  useMessagingStore,
} from "@ceylonweddings/web";
import type { ConversationType } from "@ceylonweddings/contracts";
import {
  MessagesStudio,
  type MessagesStudioConversation,
  type MessagesStudioMessage,
} from "@ceylonweddings/ui/domain/messages-studio";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Link } from "../i18n/navigation";
import { LifeBuoy, MessageCircle } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { PlanningHero, heroButtonClass } from "@/features/planning/components/planning-hero";

export function MessagesPage({
  supportType,
  hero = false,
}: {
  supportType?: Extract<ConversationType, "COUPLE_ADMIN" | "VENDOR_ADMIN">;
  /** Use the planning-hub hero banner instead of the plain page header. */
  hero?: boolean;
}) {
  const t = useTranslations("messaging");
  const search = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const conversations = useMessagingStore((state) => state.conversations);
  const setInbox = useMessagingStore((state) => state.setInbox);
  const setMessages = useMessagingStore((state) => state.setMessages);
  const messagesByConversation = useMessagingStore((state) => state.messagesByConversation);
  const activeConversationId = useMessagingStore((state) => state.activeConversationId);
  const setActiveConversationId = useMessagingStore((state) => state.setActiveConversationId);
  const typingByConversation = useMessagingStore((state) => state.typingByConversation);

  const initialId = search.get("c") ?? activeConversationId;

  const actions = useMemo(
    () => ({
      loadInbox: () => api.messaging.conversations(),
      loadMessages: (conversationId: string, cursor?: string) =>
        api.messaging.messages(conversationId, cursor ? { cursor, limit: 40 } : { limit: 40 }),
      sendMessage: (conversationId: string, body: Parameters<typeof api.messaging.sendMessage>[1]) =>
        api.messaging.sendMessage(conversationId, body),
      markRead: async (conversationId: string) => {
        await api.messaging.markRead(conversationId);
      },
      joinRoom: async (conversationId: string) => {
        setActiveConversationId(conversationId);
        await joinConversationRoom(conversationId);
      },
      leaveRoom: (conversationId: string) => {
        leaveConversationRoom(conversationId);
      },
      emitTyping: (conversationId: string, typing: boolean) => emitTyping(conversationId, typing),
      presign: (body: Parameters<typeof api.messaging.presignMedia>[0]) => api.messaging.presignMedia(body),
      openSupport: supportType ? () => api.messaging.openConversation({ type: supportType }) : undefined,
    }),
    [setActiveConversationId, supportType],
  );

  const onConversationsChange = useCallback(
    (items: MessagesStudioConversation[], unreadTotal: number) => setInbox(items as typeof conversations, unreadTotal),
    [setInbox],
  );

  const onMessagesChange = useCallback(
    (conversationId: string, items: MessagesStudioMessage[]) =>
      setMessages(conversationId, items as (typeof messagesByConversation)[string]),
    [setMessages],
  );

  if (!user) {
    return (
      <FormStatus tone="destructive">
        Sign in required. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  const activeId = initialId;
  const messages = activeId ? (messagesByConversation[activeId] ?? []) : [];

  return (
    <MessagesStudio
      labels={{
        kicker: t("kicker"),
        title: t("title"),
        description: t("description"),
        inboxEmpty: t("inboxEmpty"),
        threadEmpty: t("threadEmpty"),
        placeholder: t("placeholder"),
        send: t("send"),
        attach: t("attach"),
        typing: t("typing"),
        support: t("support"),
        deleted: t("deleted"),
        openSupport: supportType ? t("openSupport") : undefined,
        back: t("back"),
        unread: t("unread"),
        attachError: t("attachError"),
      }}
      actions={actions}
      renderHeader={
        hero
          ? ({ openSupport }) => (
              <PlanningHero
                icon={MessageCircle}
                kicker={t("kicker")}
                title={t("title")}
                description={t("description")}
                actions={
                  openSupport ? (
                    <Button
                      type="button"
                      size="sm"
                      shape="pill"
                      variant="outline"
                      className={heroButtonClass}
                      onClick={() => void openSupport()}
                    >
                      <LifeBuoy className="size-4" /> {t("openSupport")}
                    </Button>
                  ) : null
                }
              >
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <div>
                    <p className="text-xs text-paper/60">Conversations</p>
                    <p className="font-serif text-2xl">{conversations.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-paper/60">Unread</p>
                    <p className="font-serif text-2xl text-[color:var(--cw-gold-300)]">
                      {conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)}
                    </p>
                  </div>
                </div>
              </PlanningHero>
            )
          : undefined
      }
      initialConversationId={initialId}
      conversations={conversations}
      messages={messages}
      typingUserId={activeId ? typingByConversation[activeId] : null}
      currentUserId={user.id}
      onConversationsChange={onConversationsChange}
      onMessagesChange={onMessagesChange}
    />
  );
}
