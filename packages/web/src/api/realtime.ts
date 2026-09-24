"use client";

import { io, type Socket } from "socket.io-client";
import type {
  AppNotification,
  Message,
  MessageReadEvent,
  SendMessageBody,
  TypingUpdate,
} from "@ceylonweddings/contracts";

let socket: Socket | undefined;

export function getRealtimeSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000", {
      withCredentials: true,
      path: "/realtime",
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 800,
    });
  }
  return socket;
}

export function connectRealtime() {
  const client = getRealtimeSocket();
  if (!client.connected) client.connect();
  return client;
}

export function disconnectRealtime() {
  if (socket?.connected) socket.disconnect();
}

export function joinConversationRoom(conversationId: string) {
  return new Promise<{ joined: string }>((resolve, reject) => {
    getRealtimeSocket().emit("conversation.join", conversationId, (ack: { joined?: string; error?: string }) => {
      if (ack?.joined) resolve({ joined: ack.joined });
      else reject(new Error(ack?.error ?? "Failed to join conversation"));
    });
  });
}

export function leaveConversationRoom(conversationId: string) {
  getRealtimeSocket().emit("conversation.leave", conversationId);
}

export function emitTyping(conversationId: string, typing: boolean) {
  getRealtimeSocket().emit(typing ? "typing.start" : "typing.stop", conversationId);
}

export function emitSocketSend(conversationId: string, body: SendMessageBody) {
  return new Promise<Message>((resolve, reject) => {
    getRealtimeSocket().timeout(12_000).emit(
      "message.send",
      { conversationId, ...body },
      (err: Error | null, message: Message) => {
        if (err) reject(err);
        else resolve(message);
      },
    );
  });
}

export type RealtimeHandlers = {
  onMessage?: (message: Message) => void;
  onRead?: (event: MessageReadEvent) => void;
  onTyping?: (event: TypingUpdate) => void;
  onNotification?: (notification: AppNotification) => void;
  onConversationUpdated?: (payload: {
    conversationId: string;
    lastMessageAt: string;
    lastMessagePreview: string;
  }) => void;
};

export function bindRealtimeHandlers(handlers: RealtimeHandlers) {
  const client = getRealtimeSocket();
  const onMessage = (payload: Message) => handlers.onMessage?.(payload);
  const onRead = (payload: MessageReadEvent) => handlers.onRead?.(payload);
  const onTyping = (payload: TypingUpdate) => handlers.onTyping?.(payload);
  const onNotification = (payload: AppNotification) => handlers.onNotification?.(payload);
  const onConversationUpdated = (payload: {
    conversationId: string;
    lastMessageAt: string;
    lastMessagePreview: string;
  }) => handlers.onConversationUpdated?.(payload);

  client.on("message.new", onMessage);
  client.on("message.read", onRead);
  client.on("typing.update", onTyping);
  client.on("notification.new", onNotification);
  client.on("conversation.updated", onConversationUpdated);

  return () => {
    client.off("message.new", onMessage);
    client.off("message.read", onRead);
    client.off("typing.update", onTyping);
    client.off("notification.new", onNotification);
    client.off("conversation.updated", onConversationUpdated);
  };
}
