import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Queue } from "bullmq";
import {
  ALWAYS_ON,
  buildNotificationTemplate,
  notificationMetadataSchema,
  parseUserPreferences,
  resolveNotificationChannels,
  type AppNotification,
  type NotificationCategory,
  type NotificationChannels,
  type NotificationTemplateContextMap,
  type NotificationTemplateId,
  type RenderedNotification,
  type User,
} from "@ceylonweddings/contracts";
import { PrismaService } from "@ceylonweddings/database";
import { renderNotificationEmail } from "../../common/mailer/notification.mailer";
import type { EmailJob } from "../jobs/email.processor";
import { RealtimeEmitter } from "../realtime/realtime.emitter";

export type NotifyInput<T extends NotificationTemplateId> = {
  userId: string;
  templateId: T;
  context: NotificationTemplateContextMap[T];
  /** Link the row to a conversation (message notifications). */
  conversationId?: string;
  messageId?: string;
  /** Override resolved channels (e.g. suppress email when a custom mail was sent). */
  forceChannels?: Partial<NotificationChannels>;
};

type Row = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  conversationId: string | null;
  messageId: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
};

/**
 * One entry point for every notification (Kloqra NotificationsDispatchService):
 * render the catalog template → resolve the user's channels → in-app row
 * (pushed over the socket) and/or a branded email on the queue.
 * A failed email never fails the action that triggered it.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEmitter,
    @InjectQueue("email") private readonly emailQueue: Queue,
  ) {}

  async notify<T extends NotificationTemplateId>(input: NotifyInput<T>): Promise<AppNotification | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true, locale: true, preferences: true, status: true },
      });
      if (!user || user.status === "SUSPENDED") return null;

      const rendered = buildNotificationTemplate(input.templateId, input.context);
      const channels = {
        ...(rendered.preferenceKey === null
          ? ALWAYS_ON
          : resolveNotificationChannels(parseUserPreferences(user.preferences), rendered.preferenceKey)),
        ...input.forceChannels,
      };

      let created: AppNotification | null = null;
      if (channels.inApp) {
        const row = await this.prisma.notification.create({
          data: {
            userId: user.id,
            type: rendered.type,
            title: rendered.title,
            body: rendered.body,
            href: rendered.href,
            metadata: rendered.metadata,
            conversationId: input.conversationId,
            messageId: input.messageId,
          },
        });
        created = this.map(row);
        this.realtime.toUser(user.id, "notification.new", created);
      }
      if (channels.email) {
        await this.enqueueEmail(user.email, rendered, user.locale);
      }
      return created;
    } catch (error) {
      this.logger.error(`notify(${input.templateId}) failed: ${(error as Error).message}`);
      return null;
    }
  }

  async notifyMany<T extends NotificationTemplateId>(
    userIds: string[],
    input: Omit<NotifyInput<T>, "userId">,
  ): Promise<void> {
    await Promise.all([...new Set(userIds)].map((userId) => this.notify({ ...input, userId })));
  }

  /** Every active admin (consultations, moderation queues). */
  async notifyAdmins<T extends NotificationTemplateId>(input: Omit<NotifyInput<T>, "userId">): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN", status: { not: "SUSPENDED" } },
      select: { id: true },
    });
    await this.notifyMany(
      admins.map((a) => a.id),
      input,
    );
  }

  /** Couple + family members of a wedding (optionally only those who can edit guests). */
  async notifyWedding<T extends NotificationTemplateId>(
    weddingId: string,
    input: Omit<NotifyInput<T>, "userId">,
    filter: { canEditGuests?: boolean } = {},
  ): Promise<void> {
    const members = await this.prisma.weddingMember.findMany({
      where: { weddingId, ...(filter.canEditGuests ? { canEditGuests: true } : {}) },
      select: { userId: true },
    });
    await this.notifyMany(
      members.map((m) => m.userId),
      input,
    );
  }

  /** The vendor account behind a storefront. */
  async notifyVendor<T extends NotificationTemplateId>(vendorId: string, input: Omit<NotifyInput<T>, "userId">) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
    if (vendor?.userId) await this.notify({ ...input, userId: vendor.userId });
  }

  // ── Inbox ────────────────────────────────────────────────────────────────

  async list(
    user: User,
    query: { limit?: number; unread?: boolean; category?: NotificationCategory; before?: string },
  ) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const rows = await this.prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(query.unread ? { readAt: null } : {}),
        ...(query.category ? { metadata: { path: ["category"], equals: query.category } } : {}),
        ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });
    const items = rows.slice(0, limit).map((row) => this.map(row));
    return {
      items,
      unreadCount: await this.unreadCount(user),
      nextBefore: rows.length > limit ? items[items.length - 1]!.createdAt : null,
    };
  }

  unreadCount(user: User) {
    return this.prisma.notification.count({ where: { userId: user.id, readAt: null } });
  }

  async markRead(user: User, body: { ids?: string[]; all?: boolean }) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null, ...(body.all ? {} : { id: { in: body.ids ?? [] } }) },
      data: { readAt: new Date() },
    });
    const unreadCount = await this.unreadCount(user);
    this.realtime.toUser(user.id, "notification.unread", { unreadCount });
    return { ok: true as const, unreadCount };
  }

  map(row: Row): AppNotification {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href,
      conversationId: row.conversationId,
      messageId: row.messageId,
      metadata: notificationMetadataSchema.parse(row.metadata ?? {}),
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async enqueueEmail(to: string, rendered: RenderedNotification, locale: string) {
    const email = renderNotificationEmail(rendered, locale);
    const job: EmailJob = { to, subject: email.subject, template: "custom", html: email.html, text: email.text };
    try {
      await this.emailQueue.add("send", job, { attempts: 3, backoff: { type: "exponential", delay: 30_000 } });
    } catch (error) {
      this.logger.warn(`Could not queue ${rendered.type} email: ${(error as Error).message}`);
    }
  }
}
