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
import { MessagesStudio } from "@ceylonweddings/ui/domain/messages-studio";
import type {
  MessagesStudioConversation,
  MessagesStudioMessage,
} from "@ceylonweddings/ui/domain/messages-studio";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Link } from "../i18n/navigation";

export function MessagesPage({
  supportType,
}: {
  supportType?: Extract<ConversationType, "COUPLE_ADMIN" | "VENDOR_ADMIN">;
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
      openSupport: supportType
        ? () => api.messaging.openConversation({ type: supportType })
        : undefined,
    }),
    [setActiveConversationId, supportType],
  );

  const onConversationsChange = useCallback(
    (items: MessagesStudioConversation[], unreadTotal: number) =>
      setInbox(items as typeof conversations, unreadTotal),
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
