import { z } from "zod";

export const conversationTypeSchema = z.enum([
  "COUPLE_VENDOR",
  "COUPLE_ADMIN",
  "VENDOR_VENDOR",
  "VENDOR_ADMIN",
]);
export type ConversationType = z.infer<typeof conversationTypeSchema>;

export const notificationTypeSchema = z.enum(["MESSAGE"]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const MESSAGE_ATTACHMENT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export const MESSAGE_ATTACHMENT_MAX_BYTES = 15 * 1024 * 1024;

export const messagingUserPreviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["COUPLE", "VENDOR", "ADMIN", "FAMILY"]),
  photoUrl: z.string().nullable().optional(),
});
export type MessagingUserPreview = z.infer<typeof messagingUserPreviewSchema>;

export const messageAttachmentSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  key: z.string(),
  contentType: z.string(),
  filename: z.string(),
  byteSize: z.number().int().nonnegative(),
});
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  sender: messagingUserPreviewSchema.optional(),
  body: z.string().nullable(),
  createdAt: z.string(),
  editedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  attachments: z.array(messageAttachmentSchema),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationParticipantSchema = z.object({
  userId: z.string(),
  lastReadAt: z.string().nullable(),
  muted: z.boolean(),
  user: messagingUserPreviewSchema.optional(),
});
export type ConversationParticipant = z.infer<typeof conversationParticipantSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  type: conversationTypeSchema,
  weddingId: z.string().nullable(),
  vendorId: z.string().nullable(),
  vendorName: z.string().nullable().optional(),
  assignedAdminId: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  createdAt: z.string(),
  unreadCount: z.number().int().nonnegative().default(0),
  lastMessagePreview: z.string().nullable().optional(),
  peer: messagingUserPreviewSchema.nullable().optional(),
  participants: z.array(conversationParticipantSchema).optional(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const createConversationBodySchema = z
  .object({
    type: conversationTypeSchema,
    peerUserId: z.string().min(1).optional(),
    vendorId: z.string().min(1).optional(),
    weddingId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "COUPLE_VENDOR" && !value.vendorId) {
      ctx.addIssue({ code: "custom", message: "vendorId is required", path: ["vendorId"] });
    }
    if (value.type === "VENDOR_VENDOR" && !value.peerUserId && !value.vendorId) {
      ctx.addIssue({
        code: "custom",
        message: "peerUserId or vendorId is required",
        path: ["peerUserId"],
      });
    }
  });
export type CreateConversationBody = z.infer<typeof createConversationBodySchema>;

export const sendMessageAttachmentBodySchema = z.object({
  url: z.string().url(),
  key: z.string().min(1),
  contentType: z.enum(MESSAGE_ATTACHMENT_CONTENT_TYPES),
  filename: z.string().min(1).max(200),
  byteSize: z.number().int().positive().max(MESSAGE_ATTACHMENT_MAX_BYTES),
});

export const sendMessageBodySchema = z
  .object({
    body: z.string().trim().max(8000).optional(),
    attachments: z.array(sendMessageAttachmentBodySchema).max(5).default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.body && value.attachments.length === 0) {
      ctx.addIssue({ code: "custom", message: "Message body or attachment required", path: ["body"] });
    }
  });
export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;

export const messageListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});
export type MessageListQuery = z.infer<typeof messageListQuerySchema>;

export const messageListResponseSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable(),
});
export type MessageListResponse = z.infer<typeof messageListResponseSchema>;

export const conversationListResponseSchema = z.object({
  items: z.array(conversationSchema),
  unreadTotal: z.number().int().nonnegative(),
});
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;

export const markReadBodySchema = z.object({
  readAt: z.string().datetime().optional(),
});
export type MarkReadBody = z.infer<typeof markReadBodySchema>;

export const messageReadEventSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  readAt: z.string(),
});
export type MessageReadEvent = z.infer<typeof messageReadEventSchema>;

export const typingUpdateSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  typing: z.boolean(),
});
export type TypingUpdate = z.infer<typeof typingUpdateSchema>;

export const messagingMediaPresignBodySchema = z.object({
  conversationId: z.string().min(1),
  contentType: z.enum(MESSAGE_ATTACHMENT_CONTENT_TYPES),
  filename: z.string().min(1).max(200),
  byteSize: z.number().int().positive().max(MESSAGE_ATTACHMENT_MAX_BYTES),
});
export type MessagingMediaPresignBody = z.infer<typeof messagingMediaPresignBodySchema>;

export const messagingMediaPresignResponseSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  publicUrl: z.string().url(),
});
export type MessagingMediaPresignResponse = z.infer<typeof messagingMediaPresignResponseSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  href: z.string().nullable(),
  conversationId: z.string().nullable(),
  messageId: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

export const notificationListResponseSchema = z.object({
  items: z.array(notificationSchema),
  unreadCount: z.number().int().nonnegative(),
});
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

export const markNotificationsReadBodySchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});
export type MarkNotificationsReadBody = z.infer<typeof markNotificationsReadBodySchema>;
