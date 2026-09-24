import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { PrismaService } from "@ceylonweddings/database";
import { loadApiEnv } from "@ceylonweddings/env";
import type {
  AppNotification,
  Conversation,
  ConversationListResponse,
  ConversationType,
  CreateConversationBody,
  MarkNotificationsReadBody,
  MarkReadBody,
  Message,
  MessageListQuery,
  MessageListResponse,
  MessagingMediaPresignBody,
  MessagingMediaPresignResponse,
  MessagingUserPreview,
  NotificationListResponse,
  SendMessageBody,
  User,
} from "@ceylonweddings/contracts";
import { MESSAGE_ATTACHMENT_CONTENT_TYPES } from "@ceylonweddings/contracts";
import { RealtimeEmitter } from "../realtime/realtime.emitter";

const EXT_BY_TYPE: Record<(typeof MESSAGE_ATTACHMENT_CONTENT_TYPES)[number], string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 20;

type ConversationRow = {
  id: string;
  type: ConversationType;
  weddingId: string | null;
  vendorId: string | null;
  assignedAdminId: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  vendor?: { id: string; name: string; photoUrl: string | null } | null;
  participants: Array<{
    userId: string;
    lastReadAt: Date | null;
    muted: boolean;
    user: { id: string; name: string; role: User["role"]; vendor?: { photoUrl: string | null } | null };
  }>;
  messages?: Array<{
    body: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    attachments: Array<{ filename: string }>;
  }>;
  _count?: { messages: number };
};

@Injectable()
export class MessagingService {
  private readonly env = loadApiEnv();
  private client: S3Client | null = null;
  private readonly sendBuckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEmitter,
  ) {}

  async listConversations(user: User): Promise<ConversationListResponse> {
    const where =
      user.role === "ADMIN"
        ? {
            OR: [
              { type: { in: ["COUPLE_ADMIN", "VENDOR_ADMIN"] as ConversationType[] } },
              { participants: { some: { userId: user.id } } },
            ],
          }
        : { participants: { some: { userId: user.id } } };

    const rows = await this.prisma.conversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      include: {
        vendor: { select: { id: true, name: true, photoUrl: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true, vendor: { select: { photoUrl: true } } } },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, deletedAt: true, createdAt: true, attachments: { select: { filename: true } } },
        },
      },
      take: 100,
    });

    const items = await Promise.all(rows.map((row) => this.mapConversation(row as ConversationRow, user.id)));
    const unreadTotal = items.reduce((sum, item) => sum + item.unreadCount, 0);
    return { items, unreadTotal };
  }

  async openConversation(user: User, body: CreateConversationBody): Promise<Conversation> {
    const resolved = await this.resolvePeers(user, body);
    const existing = await this.prisma.conversation.findUnique({
      where: { pairKey: resolved.pairKey },
      include: this.conversationInclude(),
    });
    if (existing) {
      await this.ensureParticipant(existing.id, user.id);
      return this.mapConversation(existing as ConversationRow, user.id);
    }

    const created = await this.prisma.conversation.create({
      data: {
        type: body.type,
        pairKey: resolved.pairKey,
        weddingId: resolved.weddingId,
        vendorId: resolved.vendorId,
        participants: {
          create: resolved.participantIds.map((userId) => ({ userId })),
        },
      },
      include: this.conversationInclude(),
    });

    return this.mapConversation(created as ConversationRow, user.id);
  }

  async getConversation(user: User, conversationId: string): Promise<Conversation> {
    const row = await this.requireAccess(user, conversationId);
    return this.mapConversation(row as ConversationRow, user.id);
  }

  async listMessages(user: User, conversationId: string, query: MessageListQuery): Promise<MessageListResponse> {
    await this.requireAccess(user, conversationId);
    const limit = query.limit ?? 40;
    const rows = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(query.cursor ? { createdAt: { lt: new Date(query.cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        attachments: true,
        sender: { select: { id: true, name: true, role: true, vendor: { select: { photoUrl: true } } } },
      },
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const items = slice.map((row) => this.mapMessage(row)).reverse();
    const nextCursor = hasMore ? slice[slice.length - 1]?.createdAt.toISOString() ?? null : null;
    return { items, nextCursor };
  }

  async sendMessage(user: User, conversationId: string, body: SendMessageBody): Promise<Message> {
    this.assertRateLimit(user.id);
    const conversation = await this.requireAccess(user, conversationId);

    if (user.role === "ADMIN" && ["COUPLE_ADMIN", "VENDOR_ADMIN"].includes(conversation.type) && !conversation.assignedAdminId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { assignedAdminId: user.id },
      });
      await this.ensureParticipant(conversationId, user.id);
    }

    const text = body.body?.trim() || null;
    const attachments = body.attachments ?? [];
    for (const attachment of attachments) {
      this.assertAttachmentKey(conversationId, attachment.key, attachment.url);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: user.id,
          body: text,
          attachments: {
            create: attachments.map((item) => ({
              url: item.url,
              key: item.key,
              contentType: item.contentType,
              filename: item.filename,
              byteSize: item.byteSize,
            })),
          },
        },
        include: {
          attachments: true,
          sender: { select: { id: true, name: true, role: true, vendor: { select: { photoUrl: true } } } },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });

      await tx.conversationParticipant.updateMany({
        where: { conversationId, userId: user.id },
        data: { lastReadAt: message.createdAt },
      });

      return message;
    });

    const mapped = this.mapMessage(created);
    const recipients = await this.recipientUsers(conversationId, user.id, conversation.type);
    const preview = text ?? (attachments[0]?.filename ? `Attachment: ${attachments[0].filename}` : "New message");

    const notifications = await Promise.all(
      recipients.map((recipient) =>
        this.prisma.notification.create({
          data: {
            userId: recipient.id,
            type: "MESSAGE",
            title: user.name,
            body: preview.slice(0, 240),
            href: `${this.hrefForRole(recipient.role)}?c=${conversationId}`,
            conversationId,
            messageId: created.id,
          },
        }),
      ),
    );
    const recipientIds = recipients.map((item) => item.id);

    this.realtime.toConversation(conversationId, "message.new", mapped);
    this.realtime.toUsers(recipientIds, "message.new", mapped);
    this.realtime.toUsers(
      [...recipientIds, user.id],
      "conversation.updated",
      { conversationId, lastMessageAt: mapped.createdAt, lastMessagePreview: preview },
    );

    for (const notification of notifications) {
      const payload = this.mapNotification(notification);
      this.realtime.toUser(notification.userId, "notification.new", payload);
    }

    return mapped;
  }

  async markRead(user: User, conversationId: string, body: MarkReadBody = {}) {
    await this.requireAccess(user, conversationId);
    const readAt = body.readAt ? new Date(body.readAt) : new Date();
    await this.ensureParticipant(conversationId, user.id);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: readAt },
    });
    await this.prisma.notification.updateMany({
      where: { userId: user.id, conversationId, readAt: null },
      data: { readAt },
    });

    const payload = { conversationId, userId: user.id, readAt: readAt.toISOString() };
    this.realtime.toConversation(conversationId, "message.read", payload);
    return { ok: true as const, ...payload };
  }

  async presign(user: User, body: MessagingMediaPresignBody): Promise<MessagingMediaPresignResponse> {
    await this.requireAccess(user, body.conversationId);
    const { bucket, region, publicBase, accessKeyId, secretAccessKey } = this.requireS3();

    if (!(MESSAGE_ATTACHMENT_CONTENT_TYPES as readonly string[]).includes(body.contentType)) {
      throw new BadRequestException("Unsupported attachment type");
    }

    const fromName = extname(body.filename).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"];
    const ext =
      fromName && allowed.includes(fromName)
        ? fromName === ".jpeg"
          ? ".jpg"
          : fromName
        : EXT_BY_TYPE[body.contentType];

    const key = `messages/${body.conversationId}/${randomUUID()}${ext}`;
    const client = this.getClient(region, accessKeyId, secretAccessKey);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: body.contentType,
      ContentLength: body.byteSize,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
    return { uploadUrl, key, publicUrl: `${publicBase}/${key}` };
  }

  async listNotifications(user: User): Promise<NotificationListResponse> {
    const items = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = await this.prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return { items: items.map((item) => this.mapNotification(item)), unreadCount };
  }

  async markNotificationsRead(user: User, body: MarkNotificationsReadBody) {
    const where =
      body.all || !body.ids?.length
        ? { userId: user.id, readAt: null }
        : { userId: user.id, id: { in: body.ids }, readAt: null };
    await this.prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });
    return { ok: true as const };
  }

  async canAccessConversation(user: User, conversationId: string): Promise<boolean> {
    try {
      await this.requireAccess(user, conversationId);
      return true;
    } catch {
      return false;
    }
  }

  emitTyping(user: User, conversationId: string, typing: boolean) {
    this.realtime.toConversation(conversationId, "typing.update", {
      conversationId,
      userId: user.id,
      typing,
    });
  }

  private conversationInclude() {
    return {
      vendor: { select: { id: true, name: true, photoUrl: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, role: true, vendor: { select: { photoUrl: true } } } },
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: { body: true, deletedAt: true, createdAt: true, attachments: { select: { filename: true } } },
      },
    };
  }

  private async requireAccess(user: User, conversationId: string) {
    const row = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: this.conversationInclude(),
    });
    if (!row) throw new NotFoundException("Conversation not found");

    const isParticipant = row.participants.some((part) => part.userId === user.id);
    const isAdminPool =
      user.role === "ADMIN" && (row.type === "COUPLE_ADMIN" || row.type === "VENDOR_ADMIN");
    if (!isParticipant && !isAdminPool) {
      throw new ForbiddenException("Not allowed for this conversation");
    }
    return row;
  }

  private async ensureParticipant(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId },
      update: {},
    });
  }

  private async resolvePeers(user: User, body: CreateConversationBody) {
    if (body.type === "COUPLE_VENDOR") {
      if (user.role !== "COUPLE" && user.role !== "FAMILY") {
        throw new ForbiddenException("Only couples can start couple-vendor chats");
      }
      const vendor = await this.prisma.vendor.findUnique({ where: { id: body.vendorId! } });
      if (!vendor?.userId) throw new BadRequestException("Vendor has no linked account");
      if (vendor.userId === user.id) throw new BadRequestException("Cannot message yourself");

      let weddingId = body.weddingId ?? null;
      if (!weddingId) {
        const membership = await this.prisma.weddingMember.findFirst({ where: { userId: user.id } });
        weddingId = membership?.weddingId ?? null;
      } else {
        const membership = await this.prisma.weddingMember.findUnique({
          where: { weddingId_userId: { weddingId, userId: user.id } },
        });
        if (!membership) throw new ForbiddenException("Not a member of this wedding");
      }

      const pairKey = this.pairKey(body.type, [user.id, vendor.userId]);
      return {
        pairKey,
        weddingId,
        vendorId: vendor.id,
        participantIds: [user.id, vendor.userId],
      };
    }

    if (body.type === "VENDOR_VENDOR") {
      if (user.role !== "VENDOR") throw new ForbiddenException("Only vendors can start vendor chats");
      let peerUserId = body.peerUserId;
      if (!peerUserId && body.vendorId) {
        const peerVendor = await this.prisma.vendor.findUnique({ where: { id: body.vendorId } });
        if (!peerVendor?.userId) throw new BadRequestException("Vendor has no linked account");
        peerUserId = peerVendor.userId;
      }
      const peer = await this.prisma.user.findUnique({
        where: { id: peerUserId! },
        include: { vendor: true },
      });
      if (!peer || peer.role !== "VENDOR" || !peer.vendor) {
        throw new BadRequestException("Peer must be a vendor account");
      }
      if (peer.id === user.id) throw new BadRequestException("Cannot message yourself");
      return {
        pairKey: this.pairKey(body.type, [user.id, peer.id]),
        weddingId: null,
        vendorId: null,
        participantIds: [user.id, peer.id],
      };
    }

    if (body.type === "COUPLE_ADMIN") {
      if (user.role !== "COUPLE" && user.role !== "FAMILY") {
        throw new ForbiddenException("Only couples can open couple-admin chats");
      }
      return {
        pairKey: `${user.id}:${body.type}`,
        weddingId: null,
        vendorId: null,
        participantIds: [user.id],
      };
    }

    if (body.type === "VENDOR_ADMIN") {
      if (user.role !== "VENDOR") throw new ForbiddenException("Only vendors can open vendor-admin chats");
      return {
        pairKey: `${user.id}:${body.type}`,
        weddingId: null,
        vendorId: null,
        participantIds: [user.id],
      };
    }

    throw new BadRequestException("Unsupported conversation type");
  }

  private pairKey(type: ConversationType, userIds: string[]) {
    return `${[...userIds].sort().join(":")}:${type}`;
  }

  private async recipientUsers(conversationId: string, senderId: string, type: ConversationType) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { user: { select: { id: true, role: true } } },
    });
    const byId = new Map(participants.map((part) => [part.user.id, part.user]));

    if (type === "COUPLE_ADMIN" || type === "VENDOR_ADMIN") {
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true, role: true },
      });
      for (const admin of admins) {
        if (admin.id !== senderId) byId.set(admin.id, admin);
      }
    }

    return [...byId.values()];
  }

  private async mapConversation(row: ConversationRow, viewerId: string): Promise<Conversation> {
    const mine = row.participants.find((part) => part.userId === viewerId);
    const lastReadAt = mine?.lastReadAt ?? null;
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: row.id,
        senderId: { not: viewerId },
        deletedAt: null,
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });

    const last = row.messages?.[0];
    const lastMessagePreview = last
      ? last.deletedAt
        ? "Message deleted"
        : last.body ?? (last.attachments[0] ? `Attachment: ${last.attachments[0].filename}` : null)
      : null;

    const peerPart = row.participants.find((part) => part.userId !== viewerId);
    const peer = peerPart
      ? this.mapUserPreview(peerPart.user)
      : row.type === "COUPLE_ADMIN" || row.type === "VENDOR_ADMIN"
        ? { id: "admin-pool", name: "Ceylon Support", role: "ADMIN" as const, photoUrl: null }
        : null;

    return {
      id: row.id,
      type: row.type,
      weddingId: row.weddingId,
      vendorId: row.vendorId,
      vendorName: row.vendor?.name ?? null,
      assignedAdminId: row.assignedAdminId,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      unreadCount,
      lastMessagePreview,
      peer,
      participants: row.participants.map((part) => ({
        userId: part.userId,
        lastReadAt: part.lastReadAt?.toISOString() ?? null,
        muted: part.muted,
        user: this.mapUserPreview(part.user),
      })),
    };
  }

  private mapMessage(row: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string | null;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
    attachments: Array<{
      id: string;
      url: string;
      key: string;
      contentType: string;
      filename: string;
      byteSize: number;
    }>;
    sender?: { id: string; name: string; role: User["role"]; vendor?: { photoUrl: string | null } | null };
  }): Message {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      sender: row.sender ? this.mapUserPreview(row.sender) : undefined,
      body: row.deletedAt ? null : row.body,
      createdAt: row.createdAt.toISOString(),
      editedAt: row.editedAt?.toISOString() ?? null,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      attachments: row.deletedAt
        ? []
        : row.attachments.map((item) => ({
            id: item.id,
            url: item.url,
            key: item.key,
            contentType: item.contentType,
            filename: item.filename,
            byteSize: item.byteSize,
          })),
    };
  }

  private mapUserPreview(user: {
    id: string;
    name: string;
    role: User["role"];
    vendor?: { photoUrl: string | null } | null;
  }): MessagingUserPreview {
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      photoUrl: user.vendor?.photoUrl ?? null,
    };
  }

  private mapNotification(row: {
    id: string;
    type: "MESSAGE";
    title: string;
    body: string;
    href: string | null;
    conversationId: string | null;
    messageId: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): AppNotification {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href,
      conversationId: row.conversationId,
      messageId: row.messageId,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private hrefForRole(role: User["role"]) {
    if (role === "ADMIN") return "/admin/messages";
    if (role === "VENDOR") return "/pro/messages";
    return "/planning/messages";
  }

  private assertAttachmentKey(conversationId: string, key: string, url: string) {
    const prefix = `messages/${conversationId}/`;
    if (!key.startsWith(prefix)) {
      throw new BadRequestException("Invalid attachment key");
    }
    if (!url.includes(key)) {
      throw new BadRequestException("Attachment URL does not match key");
    }
  }

  private assertRateLimit(userId: string) {
    const now = Date.now();
    const bucket = this.sendBuckets.get(userId);
    if (!bucket || bucket.resetAt <= now) {
      this.sendBuckets.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return;
    }
    if (bucket.count >= RATE_MAX) {
      throw new BadRequestException("Too many messages. Please wait a moment.");
    }
    bucket.count += 1;
  }

  private requireS3() {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET, S3_PUBLIC_BASE_URL } = this.env;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !S3_BUCKET || !S3_PUBLIC_BASE_URL) {
      throw new ServiceUnavailableException(
        "Media uploads are not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET, and S3_PUBLIC_BASE_URL.",
      );
    }
    return {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: AWS_REGION,
      bucket: S3_BUCKET,
      publicBase: S3_PUBLIC_BASE_URL,
    };
  }

  private getClient(region: string, accessKeyId: string, secretAccessKey: string) {
    if (!this.client) {
      this.client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
    return this.client;
  }
}
