"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { MessageCircle, Paperclip, Send, ArrowLeft } from "lucide-react";
import { Button } from "../components/button";
import { Textarea } from "../components/textarea";
import { Icon } from "../components/icon";
import { cn } from "../lib/utils";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import { Reveal } from "./motion";

const MESSAGE_ATTACHMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;
const MESSAGE_ATTACHMENT_MAX_BYTES = 15 * 1024 * 1024;

type AttachmentContentType = (typeof MESSAGE_ATTACHMENT_CONTENT_TYPES)[number];

export type MessagesStudioAttachment = {
  id: string;
  url: string;
  key: string;
  contentType: string;
  filename: string;
  byteSize: number;
};

export type MessagesStudioMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  createdAt: string;
  deletedAt: string | null;
  attachments: MessagesStudioAttachment[];
};

export type MessagesStudioConversation = {
  id: string;
  type: string;
  vendorName?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  peer?: { id: string; name: string } | null;
};

export type MessagesStudioLabels = {
  kicker: string;
  title: string;
  description: string;
  inboxEmpty: string;
  threadEmpty: string;
  placeholder: string;
  send: string;
  attach: string;
  typing: string;
  support: string;
  deleted: string;
  openSupport?: string;
  back: string;
  unread: string;
  attachError: string;
};

export type MessagesStudioActions = {
  loadInbox: () => Promise<{ items: MessagesStudioConversation[]; unreadTotal: number }>;
  loadMessages: (
    conversationId: string,
    cursor?: string,
  ) => Promise<{ items: MessagesStudioMessage[]; nextCursor: string | null }>;
  sendMessage: (
    conversationId: string,
    body: {
      body?: string;
      attachments: Array<{
        url: string;
        key: string;
        contentType: AttachmentContentType;
        filename: string;
        byteSize: number;
      }>;
    },
  ) => Promise<MessagesStudioMessage>;
  markRead: (conversationId: string) => Promise<void>;
  joinRoom: (conversationId: string) => Promise<void>;
  leaveRoom: (conversationId: string) => void;
  emitTyping: (conversationId: string, typing: boolean) => void;
  presign?: (body: {
    conversationId: string;
    contentType: AttachmentContentType;
    filename: string;
    byteSize: number;
  }) => Promise<{ uploadUrl: string; key: string; publicUrl: string }>;
  openSupport?: () => Promise<MessagesStudioConversation>;
};

function peerLabel(conversation: MessagesStudioConversation, supportLabel: string) {
  if (conversation.peer?.name) return conversation.peer.name;
  if (conversation.vendorName) return conversation.vendorName;
  if (conversation.type === "COUPLE_ADMIN" || conversation.type === "VENDOR_ADMIN") return supportLabel;
  return "Chat";
}

function typeLabel(type: string) {
  switch (type) {
    case "COUPLE_VENDOR":
      return "Couple · Vendor";
    case "VENDOR_VENDOR":
      return "Vendor · Vendor";
    case "COUPLE_ADMIN":
      return "Couple · Support";
    case "VENDOR_ADMIN":
      return "Vendor · Support";
    default:
      return type;
  }
}

export function MessagesStudio({
  labels,
  actions,
  initialConversationId,
  conversations,
  messages,
  typingUserId,
  currentUserId,
  onConversationsChange,
  onMessagesChange,
}: {
  labels: MessagesStudioLabels;
  actions: MessagesStudioActions;
  initialConversationId?: string | null;
  conversations: MessagesStudioConversation[];
  messages: MessagesStudioMessage[];
  typingUserId?: string | null;
  currentUserId: string;
  onConversationsChange: (items: MessagesStudioConversation[], unreadTotal: number) => void;
  onMessagesChange: (conversationId: string, items: MessagesStudioMessage[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileThread, setMobileThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const active = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? null,
    [conversations, activeId],
  );

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
      setMobileThread(true);
    }
  }, [initialConversationId]);

  useEffect(() => {
    void actions.loadInbox().then((inbox) => onConversationsChange(inbox.items, inbox.unreadTotal));
  }, [actions, onConversationsChange]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void (async () => {
      await actions.joinRoom(activeId);
      const page = await actions.loadMessages(activeId);
      if (cancelled) return;
      onMessagesChange(activeId, page.items);
      await actions.markRead(activeId);
    })().catch((err: Error) => setError(err.message));

    return () => {
      cancelled = true;
      actions.leaveRoom(activeId);
    };
  }, [activeId, actions, onMessagesChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUserId]);

  async function selectConversation(id: string) {
    setActiveId(id);
    setMobileThread(true);
    setError(null);
  }

  function onDraftChange(value: string) {
    setDraft(value);
    if (!activeId) return;
    actions.emitTyping(activeId, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => actions.emitTyping(activeId, false), 1200);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!activeId || busy) return;
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      const message = await actions.sendMessage(activeId, { body, attachments: [] });
      onMessagesChange(activeId, [...messages, message]);
      setDraft("");
      actions.emitTyping(activeId, false);
      await actions.markRead(activeId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeId || !actions.presign) return;
    if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
      setError(labels.attachError);
      return;
    }
    if (!(MESSAGE_ATTACHMENT_CONTENT_TYPES as readonly string[]).includes(file.type)) {
      setError(labels.attachError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const contentType = file.type as AttachmentContentType;
      const presign = await actions.presign({
        conversationId: activeId,
        contentType,
        filename: file.name,
        byteSize: file.size,
      });
      const upload = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upload.ok) throw new Error(labels.attachError);
      const message = await actions.sendMessage(activeId, {
        body: draft.trim() || undefined,
        attachments: [
          {
            url: presign.publicUrl,
            key: presign.key,
            contentType,
            filename: file.name,
            byteSize: file.size,
          },
        ],
      });
      onMessagesChange(activeId, [...messages, message]);
      setDraft("");
    } catch (err) {
      setError((err as Error).message || labels.attachError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cw-stack">
      <PageHeader
        icon={MessageCircle}
        kicker={labels.kicker}
        title={labels.title}
        description={labels.description}
        actions={
          labels.openSupport && actions.openSupport ? (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const conversation = await actions.openSupport?.();
                if (!conversation) return;
                const inbox = await actions.loadInbox();
                onConversationsChange(inbox.items, inbox.unreadTotal);
                setActiveId(conversation.id);
                setMobileThread(true);
              }}
            >
              {labels.openSupport}
            </Button>
          ) : null
        }
      />

      <Reveal className="grid min-h-[70vh] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-secondary/20 md:grid-cols-[minmax(240px,320px)_1fr]">
        <aside
          className={cn(
            "border-border/60 md:border-r",
            mobileThread ? "hidden md:block" : "block",
          )}
        >
          <div className="border-b border-border/50 px-4 py-3 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Inbox
          </div>
          <div className="max-h-[68vh] overflow-auto">
            {conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={MessageCircle} title={labels.inboxEmpty} />
              </div>
            ) : (
              conversations.map((item) => {
                const selected = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void selectConversation(item.id)}
                    className={cn(
                      "grid w-full gap-1 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                      selected && "bg-secondary/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{peerLabel(item, labels.support)}</p>
                      {item.unreadCount > 0 ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {item.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{typeLabel(item.type)}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.lastMessagePreview ?? "—"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className={cn("flex min-h-[70vh] flex-col", !mobileThread && !active ? "hidden md:flex" : "flex")}>
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="md:hidden"
                  aria-label={labels.back}
                  onClick={() => setMobileThread(false)}
                >
                  <Icon icon={ArrowLeft} size="sm" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate font-medium">{peerLabel(active, labels.support)}</p>
                  <p className="text-xs text-muted-foreground">{typeLabel(active.type)}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
                {messages.length === 0 ? (
                  <EmptyState icon={MessageCircle} title={labels.threadEmpty} />
                ) : (
                  messages.map((message) => {
                    const mine = message.senderId === currentUserId;
                    return (
                      <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                            mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                          )}
                        >
                          {message.deletedAt ? (
                            <p className="italic opacity-80">{labels.deleted}</p>
                          ) : (
                            <>
                              {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
                              {message.attachments.map((file: MessagesStudioAttachment) => (
                                <a
                                  key={file.id}
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    "mt-1 block text-xs underline underline-offset-2",
                                    mine ? "text-primary-foreground/90" : "text-primary",
                                  )}
                                >
                                  {file.filename}
                                </a>
                              ))}
                            </>
                          )}
                          <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {typingUserId && typingUserId !== currentUserId ? (
                  <p className="text-xs text-muted-foreground">{labels.typing}</p>
                ) : null}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={submit} className="border-t border-border/50 p-3">
                {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept={MESSAGE_ATTACHMENT_CONTENT_TYPES.join(",")}
                    onChange={onPickFile}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={labels.attach}
                    disabled={busy || !actions.presign}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Icon icon={Paperclip} size="sm" />
                  </Button>
                  <Textarea
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    placeholder={labels.placeholder}
                    rows={2}
                    className="min-h-[44px] resize-none rounded-xl"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submit();
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label={labels.send}>
                    <Icon icon={Send} size="sm" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6">
              <EmptyState icon={MessageCircle} title={labels.threadEmpty} />
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
