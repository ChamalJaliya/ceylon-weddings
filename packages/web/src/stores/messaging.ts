"use client";

import { create } from "zustand";
import type {
  AppNotification,
  Conversation,
  Message,
  MessageReadEvent,
  TypingUpdate,
} from "@ceylonweddings/contracts";

type MessagingState = {
  conversations: Conversation[];
  unreadTotal: number;
  activeConversationId: string | null;
  messagesByConversation: Record<string, Message[]>;
  typingByConversation: Record<string, string | null>;
  notifications: AppNotification[];
  notificationUnread: number;
  setInbox: (items: Conversation[], unreadTotal: number) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  upsertMessage: (message: Message) => void;
  applyRead: (event: MessageReadEvent) => void;
  applyTyping: (event: TypingUpdate) => void;
  applyConversationUpdated: (payload: {
    conversationId: string;
    lastMessageAt: string;
    lastMessagePreview: string;
  }) => void;
  setNotifications: (items: AppNotification[], unreadCount: number) => void;
  upsertNotification: (notification: AppNotification) => void;
  markNotificationsLocalRead: () => void;
  reset: () => void;
};

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  unreadTotal: 0,
  activeConversationId: null,
  messagesByConversation: {},
  typingByConversation: {},
  notifications: [],
  notificationUnread: 0,

  setInbox: (items, unreadTotal) => set({ conversations: items, unreadTotal }),

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] ?? [];
      const ids = new Set(existing.map((item) => item.id));
      const merged = [...messages.filter((item) => !ids.has(item.id)), ...existing];
      return {
        messagesByConversation: { ...state.messagesByConversation, [conversationId]: merged },
      };
    }),

  upsertMessage: (message) =>
    set((state) => {
      const list = state.messagesByConversation[message.conversationId] ?? [];
      if (list.some((item) => item.id === message.id)) {
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [message.conversationId]: list.map((item) => (item.id === message.id ? message : item)),
          },
        };
      }

      const conversations = state.conversations.map((item) => {
        if (item.id !== message.conversationId) return item;
        const isActive = state.activeConversationId === item.id;
        return {
          ...item,
          lastMessageAt: message.createdAt,
          lastMessagePreview: message.deletedAt
            ? "Message deleted"
            : message.body ?? (message.attachments[0] ? `Attachment: ${message.attachments[0].filename}` : item.lastMessagePreview),
          unreadCount: isActive ? 0 : item.unreadCount + 1,
        };
      });
      const unreadTotal = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

      return {
        conversations,
        unreadTotal,
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: [...list, message],
        },
      };
    }),

  applyRead: (event) =>
    set((state) => ({
      conversations: state.conversations.map((item) => {
        if (item.id !== event.conversationId) return item;
        return {
          ...item,
          participants: item.participants?.map((part) =>
            part.userId === event.userId ? { ...part, lastReadAt: event.readAt } : part,
          ),
          unreadCount: get().activeConversationId === item.id ? 0 : item.unreadCount,
        };
      }),
    })),

  applyTyping: (event) =>
    set((state) => ({
      typingByConversation: {
        ...state.typingByConversation,
        [event.conversationId]: event.typing ? event.userId : null,
      },
    })),

  applyConversationUpdated: (payload) =>
    set((state) => {
      const conversations = state.conversations.map((item) =>
        item.id === payload.conversationId
          ? {
              ...item,
              lastMessageAt: payload.lastMessageAt,
              lastMessagePreview: payload.lastMessagePreview,
            }
          : item,
      );
      conversations.sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
      return { conversations };
    }),

  setNotifications: (items, unreadCount) => set({ notifications: items, notificationUnread: unreadCount }),

  upsertNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((item) => item.id === notification.id)) {
        return {
          notifications: state.notifications.map((item) =>
            item.id === notification.id ? notification : item,
          ),
        };
      }
      return {
        notifications: [notification, ...state.notifications].slice(0, 50),
        notificationUnread: state.notificationUnread + (notification.readAt ? 0 : 1),
      };
    }),

  markNotificationsLocalRead: () =>
    set((state) => ({
      notificationUnread: 0,
      notifications: state.notifications.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    })),

  reset: () =>
    set({
      conversations: [],
      unreadTotal: 0,
      activeConversationId: null,
      messagesByConversation: {},
      typingByConversation: {},
      notifications: [],
      notificationUnread: 0,
    }),
}));
