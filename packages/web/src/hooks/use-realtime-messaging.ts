"use client";

import { useEffect } from "react";
import { api } from "../api/client";
import { bindRealtimeHandlers, connectRealtime, disconnectRealtime } from "../api/realtime";
import { useAuthStore } from "../stores/auth";
import { useMessagingStore } from "../stores/messaging";

export function useRealtimeMessaging(enabled = true) {
  const user = useAuthStore((state) => state.user);
  const upsertMessage = useMessagingStore((state) => state.upsertMessage);
  const applyRead = useMessagingStore((state) => state.applyRead);
  const applyTyping = useMessagingStore((state) => state.applyTyping);
  const applyConversationUpdated = useMessagingStore((state) => state.applyConversationUpdated);
  const upsertNotification = useMessagingStore((state) => state.upsertNotification);
  const setInbox = useMessagingStore((state) => state.setInbox);
  const setNotifications = useMessagingStore((state) => state.setNotifications);
  const reset = useMessagingStore((state) => state.reset);

  useEffect(() => {
    if (!enabled || !user) {
      disconnectRealtime();
      reset();
      return;
    }

    let cancelled = false;
    connectRealtime();

    void Promise.all([api.messaging.conversations(), api.messaging.notifications()])
      .then(([inbox, notes]) => {
        if (cancelled) return;
        setInbox(inbox.items, inbox.unreadTotal);
        setNotifications(notes.items, notes.unreadCount);
      })
      .catch(() => undefined);

    const unbind = bindRealtimeHandlers({
      onMessage: upsertMessage,
      onRead: applyRead,
      onTyping: applyTyping,
      onNotification: upsertNotification,
      onConversationUpdated: applyConversationUpdated,
    });

    return () => {
      cancelled = true;
      unbind();
    };
  }, [
    enabled,
    user,
    upsertMessage,
    applyRead,
    applyTyping,
    upsertNotification,
    applyConversationUpdated,
    setInbox,
    setNotifications,
    reset,
  ]);
}
