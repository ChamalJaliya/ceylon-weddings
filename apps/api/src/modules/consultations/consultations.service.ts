import { randomBytes, randomInt } from "node:crypto";
import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Queue } from "bullmq";
import type { Request } from "express";
import { Prisma, PrismaService } from "@ceylonweddings/database";
import {
  COOKIES,
  CONSULTATION_MODE_LABELS,
  CONSULTATION_TOPIC_LABELS,
  buildConsultationSlots,
  consultationIcs,
  consultationReferenceCode,
  consultationSlotKey,
  findConsultationSlot,
  isConsultationActive,
  zonedDateKey,
  type AdminCreateConsultationBody,
  type CancelConsultationBody,
  type Consultation,
  type ConsultationAvailability,
  type ConsultationAvailabilityQuery,
  type ConsultationListQuery,
  type ConsultationSettings,
  type ContactMessage,
  type ContactMessageListQuery,
  type CreateConsultationBody,
  type CreateContactMessageBody,
  type PublicConsultation,
  type UpdateConsultationBody,
  type UpdateContactMessageBody,
  type User,
} from "@ceylonweddings/contracts";
import { loadApiEnv } from "@ceylonweddings/env";
import { AdminAccessService } from "../admin/admin-access.service";
import { SiteConfigService } from "../admin/site-config.service";
import { isFeatureEnabled } from "../admin/feature-flag.util";
import type { EmailJob } from "../jobs/email.processor";

type ConsultationRow = Prisma.ConsultationGetPayload<{
  include: { assignedAdmin: { select: { name: true } } };
}>;

const AVAILABILITY_DEFAULT_DAYS = 14;

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);
  private readonly env = loadApiEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AdminAccessService,
    private readonly siteConfig: SiteConfigService,
    private readonly jwt: JwtService,
    @InjectQueue("email") private readonly emailQueue: Queue,
  ) {}

  // ---------------------------------------------------------------- public

  async availability(query: ConsultationAvailabilityQuery): Promise<ConsultationAvailability> {
    const settings = await this.siteConfig.consultationSettings();
    const open = settings.enabled && (await isFeatureEnabled(this.prisma, "consultations.public"));
    const view: ConsultationAvailability = {
      enabled: open,
      timezone: settings.timezone,
      slotMinutes: settings.slotMinutes,
      leadTimeHours: settings.leadTimeHours,
      horizonDays: settings.horizonDays,
      modes: settings.modes,
      intro: settings.intro,
      days: [],
    };
    if (!open) return view;

    const days = Math.min(query.days ?? AVAILABILITY_DEFAULT_DAYS, settings.horizonDays);
    const from = this.parseFrom(query.from, settings);
    const bookedKeys = await this.bookedKeys(from, days + 1);
    view.days = buildConsultationSlots({ settings, from, days, bookedKeys }).map((day) => ({
      date: day.date,
      weekday: day.weekday,
      slots: day.slots
        .filter((slot) => slot.available)
        .map((slot) => ({ startsAt: slot.startsAt, endsAt: slot.endsAt, slotKey: slot.slotKey })),
    }));
    return view;
  }

  async book(
    body: CreateConsultationBody,
    context: { ip?: string; request?: Request } = {},
  ): Promise<PublicConsultation> {
    const settings = await this.siteConfig.consultationSettings();
    const open = settings.enabled && (await isFeatureEnabled(this.prisma, "consultations.public"));
    if (!open) throw new NotFoundException("Consultations are not open right now");
    if (!settings.modes.includes(body.mode)) {
      throw new BadRequestException("That consultation format is not offered");
    }

    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException("Pick a time");
    const bookedKeys = await this.bookedKeys(startsAt, 1);
    const slot = findConsultationSlot(settings, startsAt, { bookedKeys });
    if (!slot) throw new BadRequestException("That time is not one of our consultation slots");
    if (!slot.available) throw new ConflictException("That time was just taken. Pick another slot.");

    const viewer = context.request ? await this.viewer(context.request) : null;
    const confirmed = settings.autoConfirm;
    const row = await this.create({
      startsAt,
      endsAt: new Date(slot.endsAt),
      slotKey: slot.slotKey,
      timezone: settings.timezone,
      status: confirmed ? "CONFIRMED" : "PENDING",
      confirmedAt: confirmed ? new Date() : null,
      meetingUrl: body.mode === "VIDEO" ? (settings.defaultMeetingUrl ?? null) : null,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      locale: body.locale,
      topic: body.topic,
      mode: body.mode,
      message: body.message ?? null,
      weddingDate: this.parseDate(body.weddingDate),
      city: body.city ?? null,
      guestCount: body.guestCount ?? null,
      budgetLkr: body.budgetLkr ?? null,
      userId: viewer?.userId ?? null,
      weddingId: viewer?.weddingId ?? null,
      ip: context.ip ?? null,
      source: body.source ?? null,
    });

    await this.notifyBooked(row, settings);
    return this.serializePublic(row);
  }

  async byToken(manageToken: string): Promise<PublicConsultation> {
    const row = await this.prisma.consultation.findUnique({ where: { manageToken } });
    if (!row) throw new NotFoundException("Booking not found");
    return this.serializePublic(row);
  }

  async cancelByToken(manageToken: string, body: CancelConsultationBody): Promise<PublicConsultation> {
    const row = await this.prisma.consultation.findUnique({ where: { manageToken } });
    if (!row) throw new NotFoundException("Booking not found");
    if (!isConsultationActive(row.status)) return this.serializePublic(row);
    const updated = await this.prisma.consultation.update({
      where: { id: row.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: body.reason ?? "Cancelled by guest",
        // Freeing the key lets the slot be booked again.
        slotKey: null,
      },
    });
    await this.notifyCancelled(updated, "guest");
    return this.serializePublic(updated);
  }

  async icsByToken(manageToken: string): Promise<{ filename: string; body: string }> {
    const row = await this.prisma.consultation.findUnique({ where: { manageToken } });
    if (!row) throw new NotFoundException("Booking not found");
    const body = consultationIcs({
      reference: row.reference,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      summary: "Ceylon Weddings consultation",
      description: [
        `Reference ${row.reference}`,
        `Format: ${CONSULTATION_MODE_LABELS[row.mode]}`,
        `Topic: ${CONSULTATION_TOPIC_LABELS[row.topic]}`,
        row.meetingUrl ? `Join: ${row.meetingUrl}` : null,
        `Manage: ${this.manageUrl(row.manageToken, row.locale)}`,
      ]
        .filter(Boolean)
        .join("\n"),
      location: row.meetingUrl ?? CONSULTATION_MODE_LABELS[row.mode],
      url: row.meetingUrl ?? this.manageUrl(row.manageToken, row.locale),
    });
    return { filename: `ceylon-weddings-${row.reference}.ics`, body };
  }

  // ----------------------------------------------------------------- admin

  async adminList(user: User, query: ConsultationListQuery): Promise<Consultation[]> {
    this.access.assertAdmin(user);
    const now = new Date();
    const window = query.window ?? "upcoming";
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const startsAt: Prisma.DateTimeFilter = {};
    if (from && !Number.isNaN(from.getTime())) startsAt.gte = from;
    if (to && !Number.isNaN(to.getTime())) startsAt.lte = to;
    if (!startsAt.gte && !startsAt.lte) {
      if (window === "upcoming") startsAt.gte = new Date(now.getTime() - 3_600_000);
      if (window === "past") startsAt.lt = now;
    }

    const rows = await this.prisma.consultation.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.mode ? { mode: query.mode } : {}),
        ...(query.topic ? { topic: query.topic } : {}),
        ...(Object.keys(startsAt).length > 0 ? { startsAt } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" as const } },
                { email: { contains: query.q, mode: "insensitive" as const } },
                { phone: { contains: query.q } },
                { reference: { contains: query.q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: window === "past" ? [{ startsAt: "desc" }] : [{ startsAt: "asc" }],
      take: 200,
      include: { assignedAdmin: { select: { name: true } } },
    });
    return rows.map((row) => this.serialize(row));
  }

  async adminGet(user: User, id: string): Promise<Consultation> {
    this.access.assertAdmin(user);
    const row = await this.prisma.consultation.findUnique({
      where: { id },
      include: { assignedAdmin: { select: { name: true } } },
    });
    if (!row) throw new NotFoundException("Consultation not found");
    return this.serialize(row);
  }

  async adminCreate(
    user: User,
    body: AdminCreateConsultationBody,
    ip?: string,
  ): Promise<Consultation> {
    this.access.assertAdmin(user);
    const settings = await this.siteConfig.consultationSettings();
    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException("Pick a time");

    let endsAt = new Date(startsAt.getTime() + settings.slotMinutes * 60_000);
    let slotKey = consultationSlotKey(startsAt);
    if (!body.ignoreAvailability) {
      const bookedKeys = await this.bookedKeys(startsAt, 1);
      const slot = findConsultationSlot(settings, startsAt, { bookedKeys });
      if (!slot?.available) throw new ConflictException("That slot is not available");
      endsAt = new Date(slot.endsAt);
      slotKey = slot.slotKey;
    }

    const active = isConsultationActive(body.status);
    const row = await this.create({
      startsAt,
      endsAt,
      // Only live bookings hold the slot.
      slotKey: active ? slotKey : null,
      timezone: settings.timezone,
      status: body.status,
      confirmedAt: body.status === "CONFIRMED" ? new Date() : null,
      meetingUrl: body.meetingUrl ?? (body.mode === "VIDEO" ? (settings.defaultMeetingUrl ?? null) : null),
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      locale: body.locale,
      topic: body.topic,
      mode: body.mode,
      message: body.message ?? null,
      weddingDate: this.parseDate(body.weddingDate),
      city: body.city ?? null,
      guestCount: body.guestCount ?? null,
      budgetLkr: body.budgetLkr ?? null,
      adminNotes: body.adminNotes ?? null,
      assignedAdminId: body.assignedAdminId ?? user.id,
      ip: null,
      source: "admin",
    });

    await this.access.append({
      actorUserId: user.id,
      action: "consultation.create",
      entityType: "CONSULTATION",
      entityId: row.id,
      after: { reference: row.reference, startsAt: row.startsAt.toISOString(), status: row.status },
      ip,
    });
    return this.adminGet(user, row.id);
  }

  async adminUpdate(
    user: User,
    id: string,
    body: UpdateConsultationBody,
    ip?: string,
  ): Promise<Consultation> {
    this.access.assertAdmin(user);
    const existing = await this.prisma.consultation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Consultation not found");

    const settings = await this.siteConfig.consultationSettings();
    const data: Prisma.ConsultationUpdateInput = {};

    let nextStartsAt = existing.startsAt;
    if (body.startsAt !== undefined) {
      nextStartsAt = new Date(body.startsAt);
      if (Number.isNaN(nextStartsAt.getTime())) throw new BadRequestException("Pick a valid time");
      data.startsAt = nextStartsAt;
      data.endsAt = new Date(nextStartsAt.getTime() + settings.slotMinutes * 60_000);
      data.slotKey = consultationSlotKey(nextStartsAt);
    }

    const nextStatus = body.status ?? existing.status;
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "CONFIRMED" && !existing.confirmedAt) data.confirmedAt = new Date();
      if (body.status === "CANCELLED") {
        data.cancelledAt = existing.cancelledAt ?? new Date();
      }
    }
    // Cancelled and completed bookings release the slot so it can be rebooked.
    if (!isConsultationActive(nextStatus)) {
      data.slotKey = null;
    } else if (data.slotKey === undefined && existing.slotKey === null) {
      data.slotKey = consultationSlotKey(nextStartsAt);
    }

    if (body.mode !== undefined) data.mode = body.mode;
    if (body.topic !== undefined) data.topic = body.topic;
    if (body.meetingUrl !== undefined) data.meetingUrl = body.meetingUrl || null;
    if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes || null;
    if (body.assignedAdminId !== undefined) {
      data.assignedAdmin = body.assignedAdminId
        ? { connect: { id: body.assignedAdminId } }
        : { disconnect: true };
    }
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.message !== undefined) data.message = body.message || null;
    if (body.city !== undefined) data.city = body.city || null;
    if (body.weddingDate !== undefined) data.weddingDate = this.parseDate(body.weddingDate ?? undefined);
    if (body.guestCount !== undefined) data.guestCount = body.guestCount;
    if (body.budgetLkr !== undefined) data.budgetLkr = body.budgetLkr;
    if (body.cancelReason !== undefined) data.cancelReason = body.cancelReason || null;

    let updated: ConsultationRow;
    try {
      updated = await this.prisma.consultation.update({
        where: { id },
        data,
        include: { assignedAdmin: { select: { name: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Another booking already holds that time");
      }
      throw error;
    }

    await this.access.append({
      actorUserId: user.id,
      action: "consultation.update",
      entityType: "CONSULTATION",
      entityId: id,
      before: {
        status: existing.status,
        startsAt: existing.startsAt.toISOString(),
        meetingUrl: existing.meetingUrl,
      },
      after: {
        status: updated.status,
        startsAt: updated.startsAt.toISOString(),
        meetingUrl: updated.meetingUrl,
      },
      ip,
    });

    const rescheduled = updated.startsAt.getTime() !== existing.startsAt.getTime();
    if (updated.status === "CANCELLED" && existing.status !== "CANCELLED") {
      await this.notifyCancelled(updated, "team");
    } else if (rescheduled || (updated.status === "CONFIRMED" && existing.status === "PENDING")) {
      await this.notifyBooked(updated, settings, rescheduled ? "rescheduled" : "confirmed");
    }
    return this.serialize(updated);
  }

  async adminCancel(user: User, id: string, body: CancelConsultationBody, ip?: string) {
    return this.adminUpdate(
      user,
      id,
      { status: "CANCELLED", cancelReason: body.reason ?? "Cancelled by the team" },
      ip,
    );
  }

  async adminAvailability(user: User, query: ConsultationAvailabilityQuery) {
    this.access.assertAdmin(user);
    const settings = await this.siteConfig.consultationSettings();
    const days = Math.min(query.days ?? AVAILABILITY_DEFAULT_DAYS, settings.horizonDays);
    const from = this.parseFrom(query.from, settings);
    const bookedKeys = await this.bookedKeys(from, days + 1);
    return {
      timezone: settings.timezone,
      slotMinutes: settings.slotMinutes,
      days: buildConsultationSlots({ settings, from, days, bookedKeys }),
    };
  }

  async submitContact(body: CreateContactMessageBody, ip?: string): Promise<{ ok: true }> {
    const row = await this.prisma.contactMessage.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        message: body.message,
        ip: ip ?? null,
      },
    });
    const inbox = await this.internalInbox();
    if (inbox) {
      await this.enqueue({
        to: inbox,
        template: "custom",
        subject: `Contact form — ${row.name}`,
        data: {
          message: `${row.name} <${row.email}>${row.phone ? ` · ${row.phone}` : ""}\n\n${row.message}`,
        },
      });
    }
    return { ok: true as const };
  }

  async adminContactList(user: User, query: ContactMessageListQuery): Promise<ContactMessage[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.contactMessage.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" as const } },
                { email: { contains: query.q, mode: "insensitive" as const } },
                { message: { contains: query.q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async adminContactUpdate(
    user: User,
    id: string,
    body: UpdateContactMessageBody,
    ip?: string,
  ): Promise<ContactMessage> {
    this.access.assertAdmin(user);
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Message not found");
    const row = await this.prisma.contactMessage.update({
      where: { id },
      data: { status: body.status },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "contact_message.update",
      entityType: "CONTACT_MESSAGE",
      entityId: id,
      before: { status: existing.status },
      after: { status: row.status },
      ip,
    });
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /** Counts for the admin dashboard. */
  async adminSummary(user: User) {
    this.access.assertAdmin(user);
    const now = new Date();
    const [pending, upcoming] = await Promise.all([
      this.prisma.consultation.count({ where: { status: "PENDING" } }),
      this.prisma.consultation.count({
        where: { status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { gte: now } },
      }),
    ]);
    return { pending, upcoming };
  }

  // --------------------------------------------------------------- helpers

  private async create(
    data: Omit<Prisma.ConsultationUncheckedCreateInput, "reference" | "manageToken">,
  ): Promise<ConsultationRow> {
    const manageToken = randomBytes(24).toString("base64url");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.consultation.create({
          data: {
            ...data,
            reference: consultationReferenceCode(() => randomInt(0, 1_000_000) / 1_000_000),
            manageToken,
          },
          include: { assignedAdmin: { select: { name: true } } },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = (error.meta?.target as string[] | string | undefined) ?? "";
          const fields = Array.isArray(target) ? target.join(",") : target;
          if (fields.includes("slotKey")) {
            throw new ConflictException("That time was just taken. Pick another slot.");
          }
          // Reference collision: try again with a fresh code.
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException("Could not create the booking. Please try again.");
  }

  private async bookedKeys(from: Date | string, days: number): Promise<string[]> {
    const start = new Date(from);
    const anchor = Number.isNaN(start.getTime()) ? new Date() : start;
    const rows = await this.prisma.consultation.findMany({
      where: {
        slotKey: { not: null },
        startsAt: {
          gte: new Date(anchor.getTime() - 86_400_000),
          lte: new Date(anchor.getTime() + days * 86_400_000),
        },
      },
      select: { slotKey: true },
    });
    return rows.flatMap((row) => (row.slotKey ? [row.slotKey] : []));
  }

  private parseFrom(from: string | undefined, settings: ConsultationSettings): Date {
    const now = new Date();
    if (!from) return now;
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(from) ? new Date(`${from}T00:00:00.000Z`) : new Date(from);
    if (Number.isNaN(parsed.getTime())) return now;
    const horizonEnd = new Date(now.getTime() + settings.horizonDays * 86_400_000);
    if (parsed > horizonEnd) return horizonEnd;
    return parsed < now ? now : parsed;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private async viewer(request: Request): Promise<{ userId: string; weddingId: string | null } | null> {
    const token = request.cookies?.[COOKIES.access] as string | undefined;
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      const membership = await this.prisma.weddingMember.findFirst({
        where: { userId: payload.sub },
        select: { weddingId: true },
      });
      return { userId: payload.sub, weddingId: membership?.weddingId ?? null };
    } catch {
      // Guests book without an account; a bad cookie is not an error here.
      return null;
    }
  }

  private siteOrigin(): string {
    return this.env.CORS_ORIGINS[0]?.replace(/\/$/, "") ?? "http://localhost:3000";
  }

  private manageUrl(manageToken: string, locale: string): string {
    return `${this.siteOrigin()}/${locale || "en"}/consultation/${manageToken}`;
  }

  private formatWhen(row: { startsAt: Date; timezone: string }): string {
    return `${new Intl.DateTimeFormat("en-GB", {
      timeZone: row.timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h12",
    }).format(row.startsAt)} (${row.timezone})`;
  }

  private async notifyBooked(
    row: ConsultationRow,
    settings: ConsultationSettings,
    kind: "booked" | "confirmed" | "rescheduled" = "booked",
  ) {
    const when = this.formatWhen(row);
    const lines = [
      `Reference: ${row.reference}`,
      `When: ${when}`,
      `Format: ${CONSULTATION_MODE_LABELS[row.mode]}`,
      `Topic: ${CONSULTATION_TOPIC_LABELS[row.topic]}`,
    ];
    if (row.meetingUrl) lines.push(`Join: ${row.meetingUrl}`);

    if (row.email) {
      await this.enqueue({
        to: row.email,
        template: "consultation-confirmed",
        subject:
          kind === "rescheduled"
            ? `Your Ceylon Weddings consultation moved to ${when}`
            : `Your Ceylon Weddings consultation is booked — ${when}`,
        data: {
          name: row.name,
          reference: row.reference,
          when,
          modeLabel: CONSULTATION_MODE_LABELS[row.mode],
          topicLabel: CONSULTATION_TOPIC_LABELS[row.topic],
          meetingUrl: row.meetingUrl,
          manageUrl: this.manageUrl(row.manageToken, row.locale),
          pending: row.status === "PENDING",
          rescheduled: kind === "rescheduled",
        },
      });
    }

    if (kind === "booked") {
      const inbox = await this.internalInbox();
      if (inbox) {
        await this.enqueue({
          to: inbox,
          template: "consultation-new",
          subject: `New consultation booking — ${when}`,
          data: {
            name: row.name,
            email: row.email,
            phone: row.phone,
            when,
            modeLabel: CONSULTATION_MODE_LABELS[row.mode],
            topicLabel: CONSULTATION_TOPIC_LABELS[row.topic],
            message: row.message,
            city: row.city,
            weddingDate: row.weddingDate ? zonedDateKey(row.weddingDate, settings.timezone) : null,
            guestCount: row.guestCount,
            budgetLkr: row.budgetLkr,
            adminUrl: `${this.siteOrigin()}/en/admin/consultations/${row.id}`,
          },
        });
      }
    }
  }

  private async notifyCancelled(
    row: { email: string | null; name: string; reference: string; startsAt: Date; timezone: string },
    by: "guest" | "team",
  ) {
    const when = this.formatWhen(row);
    const inbox = await this.internalInbox();
    if (by === "guest" && inbox) {
      await this.enqueue({
        to: inbox,
        template: "custom",
        subject: `Consultation cancelled — ${when}`,
        data: { message: `${row.name} cancelled consultation ${row.reference} scheduled for ${when}.` },
      });
    }
    if (by === "team" && row.email) {
      await this.enqueue({
        to: row.email,
        template: "custom",
        subject: `Your Ceylon Weddings consultation was cancelled`,
        data: {
          message: `We had to cancel the consultation ${row.reference} scheduled for ${when}. Please book another time that suits you.`,
        },
      });
    }
  }

  private async internalInbox(): Promise<string | null> {
    const row = await this.prisma.siteConfig.findUnique({
      where: { id: "default" },
      select: { branding: true },
    });
    const branding = (row?.branding ?? {}) as { contactEmail?: unknown };
    const email = typeof branding.contactEmail === "string" ? branding.contactEmail.trim() : "";
    return email ? email : null;
  }

  private async enqueue(job: EmailJob) {
    try {
      await this.emailQueue.add("send", job);
    } catch (error) {
      // A dead Redis must not lose the booking itself.
      this.logger.warn(`Could not queue ${job.template} email: ${(error as Error).message}`);
    }
  }

  private serialize(row: ConsultationRow): Consultation {
    return {
      id: row.id,
      reference: row.reference,
      status: row.status,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      timezone: row.timezone,
      name: row.name,
      email: row.email,
      phone: row.phone,
      locale: row.locale,
      topic: row.topic,
      mode: row.mode,
      message: row.message,
      weddingDate: row.weddingDate ? row.weddingDate.toISOString() : null,
      city: row.city,
      guestCount: row.guestCount,
      budgetLkr: row.budgetLkr,
      userId: row.userId,
      weddingId: row.weddingId,
      assignedAdminId: row.assignedAdminId,
      assignedAdminName: row.assignedAdmin?.name ?? null,
      meetingUrl: row.meetingUrl,
      adminNotes: row.adminNotes,
      confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
      cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
      cancelReason: row.cancelReason,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private serializePublic(row: {
    reference: string;
    manageToken: string;
    status: Consultation["status"];
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    name: string;
    email: string | null;
    phone: string | null;
    topic: Consultation["topic"];
    mode: Consultation["mode"];
    message: string | null;
    meetingUrl: string | null;
    cancelledAt: Date | null;
    createdAt: Date;
  }): PublicConsultation {
    return {
      reference: row.reference,
      manageToken: row.manageToken,
      status: row.status,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      timezone: row.timezone,
      name: row.name,
      email: row.email,
      phone: row.phone,
      topic: row.topic,
      mode: row.mode,
      message: row.message,
      meetingUrl: row.meetingUrl,
      cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
