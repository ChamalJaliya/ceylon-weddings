import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcrypt";
import { PrismaService } from "@ceylonweddings/database";
import type {
  BulkCreateGuestsBody,
  CreateGuestBody,
  GuestListQuery,
  InviteMemberBody,
  PublicRsvpBody,
  UpdateEventInviteBody,
  UpdateGuestBody,
  UpdateMemberFlagsBody,
  User,
} from "@ceylonweddings/contracts";
import { WeddingAccessService } from "./wedding-access.service";

type HouseholdWithInvites = {
  id: string;
  weddingId: string;
  label: string;
  headName: string;
  side: string;
  plusCount: number;
  status: string;
  meal: string | null;
  channel: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  giftReceived: boolean;
  thanked: boolean;
  invites: { eventId: string; status: string; event: { name: string; kind: string } }[];
};

@Injectable()
export class GuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  async list(user: User, query: GuestListQuery = {}) {
    const wedding = await this.access.requireWedding(user);
    const q = query.q?.trim();
    const households = await this.prisma.guestHousehold.findMany({
      where: {
        weddingId: wedding.id,
        ...(query.side ? { side: query.side } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.channel ? { channel: query.channel } : {}),
        ...(query.meal ? { meal: query.meal } : {}),
        ...(query.eventId ? { invites: { some: { eventId: query.eventId } } } : {}),
        ...(q
          ? {
              OR: [
                { label: { contains: q, mode: "insensitive" } },
                { headName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { invites: { include: { event: true } } },
      orderBy: { label: "asc" },
    });
    return households.map((household) => this.serialize(household));
  }

  async create(user: User, body: CreateGuestBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const eventIds = await this.assertEventIds(wedding.id, body.eventIds ?? []);
    const household = await this.prisma.guestHousehold.create({
      data: {
        weddingId: wedding.id,
        label: body.label,
        headName: body.headName,
        side: body.side,
        plusCount: body.plusCount,
        status: body.status,
        meal: body.meal,
        channel: body.channel,
        phone: body.phone,
        email: body.email,
        notes: body.notes,
        giftReceived: body.giftReceived,
        thanked: body.thanked,
        invites: eventIds.length
          ? {
              create: eventIds.map((eventId) => ({
                eventId,
                status: body.status === "CONSIDERING" ? "INVITED" : body.status,
              })),
            }
          : undefined,
      },
      include: { invites: { include: { event: true } } },
    });
    return this.serialize(household);
  }

  async bulkCreate(user: User, body: BulkCreateGuestsBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    if (body.rows.length > 500) {
      throw new BadRequestException("Maximum 500 guests per import");
    }

    const events = await this.prisma.event.findMany({
      where: { weddingId: wedding.id },
      select: { id: true, name: true, kind: true },
    });
    const byName = new Map(events.map((e) => [e.name.toLowerCase(), e.id]));
    const byKind = new Map(events.map((e) => [e.kind, e.id]));

    const errors: Array<{ row: number; message: string }> = [];
    let created = 0;
    let skipped = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const [index, row] of body.rows.entries()) {
        try {
          const eventIds = new Set<string>(body.defaultEventIds ?? []);
          for (const name of row.eventNames ?? []) {
            const id = byName.get(name.toLowerCase());
            if (id) eventIds.add(id);
          }
          for (const kind of row.eventKinds ?? []) {
            const id = byKind.get(kind);
            if (id) eventIds.add(id);
          }
          const email = row.email === "" || row.email == null ? undefined : row.email;
          await tx.guestHousehold.create({
            data: {
              weddingId: wedding.id,
              label: row.label,
              headName: row.headName,
              side: row.side,
              plusCount: row.plusCount,
              status: row.status,
              meal: row.meal ?? undefined,
              channel: row.channel,
              phone: row.phone ?? undefined,
              email,
              notes: row.notes ?? undefined,
              invites: eventIds.size
                ? {
                    create: [...eventIds].map((eventId) => ({
                      eventId,
                      status: row.status === "CONSIDERING" ? "INVITED" : row.status,
                    })),
                  }
                : undefined,
            },
          });
          created += 1;
        } catch (err) {
          skipped += 1;
          errors.push({
            row: index + 1,
            message: err instanceof Error ? err.message : "Failed to create guest",
          });
        }
      }
    });

    return { created, skipped, errors };
  }

  async update(user: User, householdId: string, body: UpdateGuestBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const existing = await this.prisma.guestHousehold.findFirst({
      where: { id: householdId, weddingId: wedding.id },
    });
    if (!existing) {
      throw new NotFoundException("Guest not found");
    }

    const eventIds = body.eventIds ? await this.assertEventIds(wedding.id, body.eventIds) : null;
    const household = await this.prisma.guestHousehold.update({
      where: { id: householdId },
      data: {
        label: body.label,
        headName: body.headName,
        side: body.side,
        plusCount: body.plusCount,
        status: body.status,
        meal: body.meal,
        channel: body.channel,
        phone: body.phone,
        email: body.email,
        notes: body.notes,
        giftReceived: body.giftReceived,
        thanked: body.thanked,
        ...(eventIds
          ? {
              invites: {
                deleteMany: {},
                create: eventIds.map((eventId) => ({
                  eventId,
                  status: (body.status ?? existing.status) === "CONSIDERING" ? "INVITED" : (body.status ?? existing.status),
                })),
              },
            }
          : {}),
      },
      include: { invites: { include: { event: true } } },
    });
    return this.serialize(household);
  }

  async deleteGuest(user: User, householdId: string) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const existing = await this.prisma.guestHousehold.findFirst({
      where: { id: householdId, weddingId: wedding.id },
    });
    if (!existing) {
      throw new NotFoundException("Guest not found");
    }
    await this.prisma.guestHousehold.delete({ where: { id: householdId } });
    return { ok: true as const };
  }

  async updateInvite(user: User, householdId: string, eventId: string, body: UpdateEventInviteBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const household = await this.prisma.guestHousehold.findFirst({
      where: { id: householdId, weddingId: wedding.id },
    });
    if (!household) {
      throw new NotFoundException("Guest not found");
    }
    await this.assertEventIds(wedding.id, [eventId]);
    await this.prisma.eventInvite.upsert({
      where: { householdId_eventId: { householdId, eventId } },
      update: { status: body.status },
      create: { eventId, householdId, status: body.status },
    });
    if (body.status === "CONFIRMED" || body.status === "DECLINED" || body.status === "MAYBE") {
      await this.prisma.guestHousehold.update({
        where: { id: householdId },
        data: { status: body.status },
      });
    }
    const refreshed = await this.prisma.guestHousehold.findUniqueOrThrow({
      where: { id: householdId },
      include: { invites: { include: { event: true } } },
    });
    return this.serialize(refreshed);
  }

  async invite(user: User, body: InviteMemberBody) {
    const { wedding } = await this.access.requireCouple(user);
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    const memberUser =
      existing ??
      (await this.prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          role: "FAMILY",
          passwordHash: await hash("Password123!", 12),
        },
      }));

    const member = await this.prisma.weddingMember.upsert({
      where: { weddingId_userId: { weddingId: wedding.id, userId: memberUser.id } },
      update: {
        canEditGuests: body.canEditGuests,
        canViewBudget: body.canViewBudget,
        canManageVendors: body.canManageVendors,
      },
      create: {
        weddingId: wedding.id,
        userId: memberUser.id,
        role: "FAMILY",
        canEditGuests: body.canEditGuests,
        canViewBudget: body.canViewBudget,
        canManageVendors: body.canManageVendors,
      },
      include: { user: true },
    });
    return {
      id: member.id,
      weddingId: member.weddingId,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: "FAMILY" as const,
      canEditGuests: member.canEditGuests,
      canViewBudget: member.canViewBudget,
      canManageVendors: member.canManageVendors,
    };
  }

  async updateMember(user: User, memberId: string, body: UpdateMemberFlagsBody) {
    const { wedding } = await this.access.requireCouple(user);
    const member = await this.prisma.weddingMember.findFirst({
      where: { id: memberId, weddingId: wedding.id },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException("Member not found");
    }
    if (member.role === "COUPLE") {
      throw new BadRequestException("Couple access cannot be reduced");
    }
    const updated = await this.prisma.weddingMember.update({
      where: { id: memberId },
      data: {
        canEditGuests: body.canEditGuests,
        canViewBudget: body.canViewBudget,
        canManageVendors: body.canManageVendors,
      },
      include: { user: true },
    });
    return {
      id: updated.id,
      weddingId: updated.weddingId,
      userId: updated.userId,
      name: updated.user.name,
      email: updated.user.email,
      role: "FAMILY" as const,
      canEditGuests: updated.canEditGuests,
      canViewBudget: updated.canViewBudget,
      canManageVendors: updated.canManageVendors,
    };
  }

  async deleteMember(user: User, memberId: string) {
    const { wedding } = await this.access.requireCouple(user);
    const member = await this.prisma.weddingMember.findFirst({
      where: { id: memberId, weddingId: wedding.id },
    });
    if (!member) {
      throw new NotFoundException("Member not found");
    }
    if (member.role === "COUPLE") {
      throw new BadRequestException("Cannot remove couple membership");
    }
    await this.prisma.weddingMember.delete({ where: { id: memberId } });
    return { ok: true as const };
  }

  async publicSite(slug: string) {
    const wedding = await this.prisma.wedding.findUnique({
      where: { slug },
      include: {
        events: true,
        vendors: {
          where: { status: "BOOKED" },
          include: { vendor: { include: { categoryType: { select: { slug: true } } } } },
        },
      },
    });
    if (!wedding || !wedding.websiteEnabled) {
      return null;
    }
    return {
      slug: wedding.slug,
      partnerOneName: wedding.partnerOneName,
      partnerTwoName: wedding.partnerTwoName,
      date: wedding.date?.toISOString() ?? null,
      city: wedding.city,
      district: wedding.district,
      style: wedding.style,
      colors: wedding.colors,
      websiteFaq: wedding.websiteFaq,
      travelNotes: wedding.travelNotes,
      events: wedding.events.map((event) => ({
        id: event.id,
        weddingId: event.weddingId,
        kind: event.kind,
        name: event.name,
        startsAt: event.startsAt?.toISOString() ?? null,
        nekathAt: event.nekathAt?.toISOString() ?? null,
        venueName: event.venueName,
        address: event.address,
      })),
      team: wedding.vendors.map((link) => ({
        vendorId: link.vendorId,
        name: link.vendor.name,
        slug: link.vendor.slug,
        category: link.vendor.categoryType?.slug ?? "",
        photoUrl: link.vendor.photoUrl,
      })),
    };
  }

  async publicRsvp(slug: string, body: PublicRsvpBody) {
    const wedding = await this.prisma.wedding.findUnique({
      where: { slug },
      include: { events: true },
    });
    if (!wedding) {
      return null;
    }

    const perEvent = this.resolveEventStatuses(body, wedding.events.map((event) => event.id));
    await this.assertEventIds(wedding.id, perEvent.map((item) => item.eventId));
    const householdStatus = this.aggregateStatus(perEvent.map((item) => item.status), body.status);

    const household = await this.prisma.guestHousehold.create({
      data: {
        weddingId: wedding.id,
        label: body.headName,
        headName: body.headName,
        plusCount: body.plusCount,
        status: householdStatus,
        meal: body.meal,
        channel: "OVERSEAS",
        invites: perEvent.length
          ? {
              create: perEvent.map((item) => ({
                eventId: item.eventId,
                status: item.status,
              })),
            }
          : undefined,
      },
      include: { invites: { include: { event: true } } },
    });
    return this.serialize(household);
  }

  private resolveEventStatuses(body: PublicRsvpBody, allEventIds: string[]) {
    if (body.events?.length) {
      return body.events;
    }
    const status = body.status;
    if (!status) {
      throw new BadRequestException("Provide a status or per-event RSVPs");
    }
    const eventIds = body.eventIds?.length ? body.eventIds : allEventIds;
    return eventIds.map((eventId) => ({ eventId, status }));
  }

  private aggregateStatus(
    statuses: Array<"CONFIRMED" | "DECLINED" | "MAYBE">,
    fallback?: "CONFIRMED" | "DECLINED" | "MAYBE",
  ) {
    if (statuses.includes("CONFIRMED")) return "CONFIRMED" as const;
    if (statuses.includes("MAYBE")) return "MAYBE" as const;
    if (statuses.length > 0 && statuses.every((status) => status === "DECLINED")) return "DECLINED" as const;
    return fallback ?? "CONSIDERING";
  }

  private async assertEventIds(weddingId: string, eventIds: string[]) {
    if (eventIds.length === 0) {
      return [];
    }
    const unique = [...new Set(eventIds)];
    const events = await this.prisma.event.findMany({
      where: { weddingId, id: { in: unique } },
      select: { id: true },
    });
    if (events.length !== unique.length) {
      throw new BadRequestException("One or more events do not belong to this wedding");
    }
    return unique;
  }

  private serialize(household: HouseholdWithInvites) {
    return {
      id: household.id,
      weddingId: household.weddingId,
      label: household.label,
      headName: household.headName,
      side: household.side,
      plusCount: household.plusCount,
      status: household.status,
      meal: household.meal,
      channel: household.channel,
      phone: household.phone,
      email: household.email,
      notes: household.notes,
      giftReceived: household.giftReceived,
      thanked: household.thanked,
      invites: household.invites.map((invite) => ({
        eventId: invite.eventId,
        eventName: invite.event.name,
        eventKind: invite.event.kind,
        status: invite.status,
      })),
    };
  }
}
