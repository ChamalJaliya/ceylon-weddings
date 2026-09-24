import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";
import type {
  CreateAppointmentBody,
  CreateBudgetLineBody,
  CreateEventBody,
  CreateTaskBody,
  Event,
  GuestHousehold,
  UpdateAppointmentBody,
  UpdateBudgetLineBody,
  UpdateEventBody,
  UpdateTaskBody,
  UpdateWeddingBody,
  User,
  WeddingType,
} from "@ceylonweddings/contracts";
import {
  musicPlanReady,
  moodboardElementCount,
  moodboardReady,
  guestListSummary,
  hubStats,
  nekathAppointmentSpecs,
  nekathAppointmentsFromSpecs,
  plateSummary,
  weddingCompleteness,
} from "@ceylonweddings/contracts";
import { WeddingAccessService } from "./wedding-access.service";
import { templatesForTypes } from "./task-templates";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

const parseDate = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException("Invalid date");
  }
  return date;
};

@Injectable()
export class WeddingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  async mine(user: User) {
    const context = await this.access.requireMembership(user);
    const full = await this.prisma.wedding.findUniqueOrThrow({
      where: { id: context.wedding.id },
      include: {
        events: true,
        tasks: true,
        budgetLines: true,
        members: { include: { user: true } },
        households: { include: { invites: { include: { event: true } } } },
        vendors: { include: { vendor: { include: { categoryType: true } } } },
        inviteTemplates: { select: { id: true } },
        seatingPlans: { select: { eventId: true } },
        musicPlans: {
          include: {
            tracks: { select: { list: true } },
            cues: { select: { id: true } },
          },
        },
        moodboards: {
          select: { id: true, scene: true },
        },
      },
    });

    const myAccess = {
      role: context.membership.role === "FAMILY" ? ("FAMILY" as const) : ("COUPLE" as const),
      canEditGuests: context.flags.canEditGuests,
      canViewBudget: context.flags.canViewBudget,
      canManageVendors: context.flags.canManageVendors,
    };

    const events = full.events.map((event) => this.serializeEvent(event)) as Event[];
    const tasks = full.tasks.map((task) => this.serializeTask(task));
    const budgetLines = myAccess.canViewBudget ? full.budgetLines.map((line) => this.serializeBudget(line)) : [];
    const members = full.members.map((member) => ({
      id: member.id,
      weddingId: member.weddingId,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.role === "FAMILY" ? ("FAMILY" as const) : ("COUPLE" as const),
      canEditGuests: member.role === "COUPLE" ? true : member.canEditGuests,
      canViewBudget: member.role === "COUPLE" ? true : member.canViewBudget,
      canManageVendors: member.role === "COUPLE" ? true : member.canManageVendors,
    }));
    const households = full.households.map((household) => this.serializeHousehold(household)) as GuestHousehold[];
    const team = full.vendors.map((link) => ({
      vendorId: link.vendorId,
      name: link.vendor.name,
      slug: link.vendor.slug,
      category: link.vendor.categoryType?.slug ?? "",
      status: link.status,
      photoUrl: link.vendor.photoUrl,
      photos: link.vendor.photos,
      city: link.vendor.city,
      district: link.vendor.district,
      startingPriceLkr: link.vendor.showPricing === false ? null : link.vendor.startingPriceLkr,
      priceDisplayMode: link.vendor.priceDisplayMode,
      showPricing: link.vendor.showPricing,
      whatsapp: link.vendor.whatsapp,
    }));

    const musicPlans = full.musicPlans.map((plan) => {
      const mustCount = plan.tracks.filter((t) => t.list === "MUST").length;
      const cueCount = plan.cues.length;
      return {
        planId: plan.id,
        eventId: plan.eventId,
        mustCount,
        cueCount,
        ready: musicPlanReady({ mustCount, cueCount }),
      };
    });

    const moodboards = full.moodboards.map((board) => {
      const elementCount = moodboardElementCount(board.scene);
      return {
        id: board.id,
        elementCount,
        ready: moodboardReady({ elementCount }),
      };
    });

    const payload = {
      id: full.id,
      slug: full.slug,
      partnerOneName: full.partnerOneName,
      partnerTwoName: full.partnerTwoName,
      date: iso(full.date),
      city: full.city,
      district: full.district,
      guestCountEstimate: full.guestCountEstimate,
      budgetLkr: myAccess.canViewBudget ? full.budgetLkr : 0,
      payer: full.payer,
      types: full.types,
      locale: full.locale,
      currency: full.currency,
      planningFromOverseas: full.planningFromOverseas,
      websiteEnabled: full.websiteEnabled,
      websiteFaq: full.websiteFaq,
      travelNotes: full.travelNotes,
      style: full.style,
      styleNotes: full.styleNotes,
      settingNotes: full.settingNotes,
      colors: full.colors,
      onboardingCompletedAt: iso(full.onboardingCompletedAt),
      events,
      tasks,
      budgetLines,
      members,
      rsvpConfirmed: full.households.filter((h) => h.status === "CONFIRMED").length,
      rsvpTotal: full.households.length,
      team,
      myAccess,
    };

    const coreTypes = await this.prisma.vendorType.findMany({
      where: { coreTeam: true, status: "ACTIVE" },
      select: { slug: true },
      orderBy: { sortOrder: "asc" },
    });

    return {
      ...payload,
      completeness: weddingCompleteness({
        ...payload,
        inviteTemplateCount: full.inviteTemplates.length,
        seatingEventIds: full.seatingPlans.map((plan) => plan.eventId),
        guestEventIds: full.households.flatMap((h) => h.invites.map((inv) => inv.eventId)),
        musicPlans,
        moodboards,
      }),
      hubStats: hubStats({
        events,
        tasks,
        households,
        team,
        budgetLines: budgetLines as never,
        budgetLkr: payload.budgetLkr,
        guestCountEstimate: full.guestCountEstimate,
        musicPlans,
        moodboards,
        coreCategorySlugs: coreTypes.map((type) => type.slug),
      }),
      plateSummary: plateSummary(households, full.guestCountEstimate),
      guestSummary: guestListSummary(households),
    };
  }

  async updateMine(user: User, body: UpdateWeddingBody) {
    const context = await this.access.requireCouple(user);
    if (body.budgetLkr !== undefined || body.payer !== undefined) {
      await this.access.requireFlag(user, "canViewBudget");
    }

    const { seedMissingTasks, date, completeOnboarding, ...rest } = body;
    const current = await this.prisma.wedding.findUniqueOrThrow({ where: { id: context.wedding.id } });
    const nextTypes = (rest.types ?? current.types) as WeddingType[];
    const typesChanged =
      rest.types !== undefined &&
      [...rest.types].sort().join() !== [...current.types].sort().join();

    await this.prisma.wedding.update({
      where: { id: context.wedding.id },
      data: {
        ...rest,
        date: parseDate(date) as Date | null | undefined,
        ...(completeOnboarding ? { onboardingCompletedAt: new Date() } : {}),
      },
    });

    const taskCount = await this.prisma.task.count({ where: { weddingId: context.wedding.id } });
    if (seedMissingTasks || (typesChanged && taskCount === 0)) {
      await this.seedMissingTasks(context.wedding.id, nextTypes);
    }

    return this.mine(user);
  }

  async createTask(user: User, body: CreateTaskBody) {
    const wedding = await this.access.requireWedding(user); // tasks: any member
    const task = await this.prisma.task.create({
      data: {
        weddingId: wedding.id,
        title: body.title,
        category: body.category,
        status: body.status,
        dueAt: parseDate(body.dueAt) as Date | null | undefined,
        assigneeUserId: body.assigneeUserId,
      },
    });
    return this.serializeTask(task);
  }

  async updateTask(user: User, taskId: string, body: UpdateTaskBody) {
    const wedding = await this.access.requireWedding(user);
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Task not found");
    }
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title,
        category: body.category,
        status: body.status,
        dueAt: parseDate(body.dueAt) as Date | null | undefined,
        assigneeUserId: body.assigneeUserId,
      },
    });
    return this.serializeTask(task);
  }

  async deleteTask(user: User, taskId: string) {
    const wedding = await this.access.requireWedding(user);
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Task not found");
    }
    await this.prisma.task.delete({ where: { id: taskId } });
    return { ok: true as const };
  }

  async listBudget(user: User) {
    const { wedding } = await this.access.requireFlag(user, "canViewBudget");
    const lines = await this.prisma.budgetLine.findMany({ where: { weddingId: wedding.id } });
    return lines.map((line) => this.serializeBudget(line));
  }

  async createBudgetLine(user: User, body: CreateBudgetLineBody) {
    const { wedding } = await this.access.requireFlag(user, "canViewBudget");
    const line = await this.prisma.budgetLine.create({
      data: {
        weddingId: wedding.id,
        category: body.category,
        label: body.label,
        plannedLkr: body.plannedLkr,
        spentLkr: body.spentLkr,
        paidLkr: body.paidLkr,
        payer: body.payer,
        vendorId: body.vendorId,
        depositDueAt: parseDate(body.depositDueAt) as Date | null | undefined,
        balanceDueAt: parseDate(body.balanceDueAt) as Date | null | undefined,
      },
    });
    return this.serializeBudget(line);
  }

  async updateBudgetLine(user: User, lineId: string, body: UpdateBudgetLineBody) {
    const { wedding } = await this.access.requireFlag(user, "canViewBudget");
    const existing = await this.prisma.budgetLine.findFirst({ where: { id: lineId, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Budget line not found");
    }
    const line = await this.prisma.budgetLine.update({
      where: { id: lineId },
      data: {
        category: body.category,
        label: body.label,
        plannedLkr: body.plannedLkr,
        spentLkr: body.spentLkr,
        paidLkr: body.paidLkr,
        payer: body.payer,
        vendorId: body.vendorId,
        depositDueAt: parseDate(body.depositDueAt) as Date | null | undefined,
        balanceDueAt: parseDate(body.balanceDueAt) as Date | null | undefined,
      },
    });
    return this.serializeBudget(line);
  }

  async deleteBudgetLine(user: User, lineId: string) {
    const { wedding } = await this.access.requireFlag(user, "canViewBudget");
    const existing = await this.prisma.budgetLine.findFirst({ where: { id: lineId, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Budget line not found");
    }
    await this.prisma.budgetLine.delete({ where: { id: lineId } });
    return { ok: true as const };
  }

  async createEvent(user: User, body: CreateEventBody) {
    const { wedding } = await this.access.requireCouple(user);
    const event = await this.prisma.event.create({
      data: {
        weddingId: wedding.id,
        kind: body.kind,
        name: body.name,
        startsAt: parseDate(body.startsAt) as Date | null | undefined,
        nekathAt: parseDate(body.nekathAt) as Date | null | undefined,
        venueName: body.venueName,
        address: body.address,
      },
    });
    return this.serializeEvent(event);
  }

  async updateEvent(user: User, eventId: string, body: UpdateEventBody) {
    const { wedding } = await this.access.requireCouple(user);
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Event not found");
    }
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        kind: body.kind,
        name: body.name,
        startsAt: parseDate(body.startsAt) as Date | null | undefined,
        nekathAt: parseDate(body.nekathAt) as Date | null | undefined,
        venueName: body.venueName,
        address: body.address,
      },
    });
    return this.serializeEvent(event);
  }

  async deleteEvent(user: User, eventId: string) {
    const { wedding } = await this.access.requireCouple(user);
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Event not found");
    }
    await this.prisma.event.delete({ where: { id: eventId } });
    return { ok: true };
  }

  async listAppointments(user: User) {
    const wedding = await this.access.requireWedding(user);
    const rows = await this.prisma.appointment.findMany({
      where: { weddingId: wedding.id },
      include: { vendor: true },
      orderBy: { startsAt: "asc" },
    });
    return rows.map((row) => this.serializeAppointment(row));
  }

  private async assertTeamVendor(weddingId: string, vendorId: string | null | undefined) {
    if (vendorId === undefined || vendorId === null) return;
    const link = await this.prisma.weddingVendor.findFirst({
      where: { weddingId, vendorId },
    });
    if (!link) {
      throw new BadRequestException("Vendor must be on the wedding team");
    }
  }

  async createAppointment(user: User, body: CreateAppointmentBody) {
    const wedding = await this.access.requireWedding(user);
    const startsAt = parseDate(body.startsAt);
    const endsAt = parseDate(body.endsAt);
    if (!startsAt || !endsAt) {
      throw new BadRequestException("Start and end times are required");
    }
    await this.assertTeamVendor(wedding.id, body.vendorId);
    const row = await this.prisma.appointment.create({
      data: {
        weddingId: wedding.id,
        title: body.title,
        kind: body.kind,
        startsAt,
        endsAt,
        venueName: body.venueName,
        address: body.address,
        reminderMinutes: body.reminderMinutes,
        notes: body.notes,
        vendorId: body.vendorId,
        eventId: body.eventId,
        color: body.color,
        sortOrder: body.sortOrder ?? 0,
        ownerLabel: body.ownerLabel,
      },
      include: { vendor: true },
    });
    return this.serializeAppointment(row);
  }

  async updateAppointment(user: User, id: string, body: UpdateAppointmentBody) {
    const wedding = await this.access.requireWedding(user);
    const existing = await this.prisma.appointment.findFirst({ where: { id, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Appointment not found");
    }
    await this.assertTeamVendor(wedding.id, body.vendorId);
    const row = await this.prisma.appointment.update({
      where: { id },
      data: {
        title: body.title,
        kind: body.kind,
        startsAt: parseDate(body.startsAt) as Date | undefined,
        endsAt: parseDate(body.endsAt) as Date | undefined,
        venueName: body.venueName,
        address: body.address,
        reminderMinutes: body.reminderMinutes,
        notes: body.notes,
        vendorId: body.vendorId,
        eventId: body.eventId === undefined ? undefined : body.eventId,
        color: body.color,
        sortOrder: body.sortOrder,
        ownerLabel: body.ownerLabel,
      },
      include: { vendor: true },
    });
    return this.serializeAppointment(row);
  }

  async deleteAppointment(user: User, id: string) {
    const wedding = await this.access.requireWedding(user);
    const existing = await this.prisma.appointment.findFirst({ where: { id, weddingId: wedding.id } });
    if (!existing) {
      throw new NotFoundException("Appointment not found");
    }
    await this.prisma.appointment.delete({ where: { id } });
    return { ok: true as const };
  }

  async generateNekathAppointments(user: User, eventId: string) {
    const { wedding } = await this.access.requireCouple(user);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, weddingId: wedding.id } });
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    const serialized = this.serializeEvent(event) as Event;
    const specs = nekathAppointmentSpecs(serialized);
    const bodies = nekathAppointmentsFromSpecs(serialized, specs);
    if (bodies.length === 0) {
      throw new BadRequestException("Event needs a nekath or start time");
    }
    const created = [];
    for (const body of bodies) {
      const row = await this.prisma.appointment.create({
        data: {
          weddingId: wedding.id,
          eventId: body.eventId,
          title: body.title,
          kind: body.kind,
          startsAt: new Date(body.startsAt),
          endsAt: new Date(body.endsAt),
          venueName: body.venueName,
          address: body.address,
          reminderMinutes: body.reminderMinutes,
          color: body.color,
          sortOrder: body.sortOrder,
          ownerLabel: body.ownerLabel,
        },
        include: { vendor: true },
      });
      created.push(this.serializeAppointment(row));
    }
    return created;
  }

  async listInquiries(user: User) {
    const wedding = await this.access.requireWedding(user);
    const rows = await this.prisma.inquiry.findMany({
      where: { weddingId: wedding.id },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      weddingId: row.weddingId,
      vendorId: row.vendorId,
      vendorName: row.vendor.name,
      vendorPhoto: row.vendor.photoUrl,
      message: row.message,
      status: row.status,
      whatsappUrl: row.whatsappUrl,
      preferredDate: iso(row.preferredDate),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private async seedMissingTasks(weddingId: string, types: WeddingType[]) {
    const existing = await this.prisma.task.findMany({ where: { weddingId }, select: { title: true } });
    const titles = new Set(existing.map((task) => task.title));
    const missing = templatesForTypes(types).filter((item) => !titles.has(item.title));
    if (missing.length === 0) {
      return;
    }
    await this.prisma.task.createMany({
      data: missing.map((item) => ({ weddingId, title: item.title, category: item.category })),
    });
  }

  private serializeEvent(event: {
    id: string;
    weddingId: string;
    kind: string;
    name: string;
    startsAt: Date | null;
    nekathAt: Date | null;
    venueName: string | null;
    address: string | null;
  }) {
    return {
      id: event.id,
      weddingId: event.weddingId,
      kind: event.kind,
      name: event.name,
      startsAt: iso(event.startsAt),
      nekathAt: iso(event.nekathAt),
      venueName: event.venueName,
      address: event.address,
    };
  }

  private serializeTask(task: {
    id: string;
    weddingId: string;
    title: string;
    dueAt: Date | null;
    status: string;
    category: string | null;
    assigneeUserId: string | null;
  }) {
    return {
      id: task.id,
      weddingId: task.weddingId,
      title: task.title,
      dueAt: iso(task.dueAt),
      status: task.status,
      category: task.category,
      assigneeUserId: task.assigneeUserId,
    };
  }

  private serializeBudget(line: {
    id: string;
    weddingId: string;
    category: string;
    label: string;
    plannedLkr: number;
    spentLkr: number;
    paidLkr: number;
    payer: string;
    vendorId: string | null;
    depositDueAt?: Date | null;
    balanceDueAt?: Date | null;
  }) {
    return {
      id: line.id,
      weddingId: line.weddingId,
      category: line.category,
      label: line.label,
      plannedLkr: line.plannedLkr,
      spentLkr: line.spentLkr,
      paidLkr: line.paidLkr,
      payer: line.payer,
      vendorId: line.vendorId,
      depositDueAt: iso(line.depositDueAt),
      balanceDueAt: iso(line.balanceDueAt),
    };
  }

  private serializeHousehold(household: {
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
  }) {
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

  private serializeAppointment(row: {
    id: string;
    weddingId: string;
    eventId?: string | null;
    vendorId: string | null;
    title: string;
    kind: string;
    startsAt: Date;
    endsAt: Date;
    venueName: string | null;
    address: string | null;
    reminderMinutes: number;
    notes: string | null;
    color: string | null;
    sortOrder?: number;
    ownerLabel?: string | null;
    vendor: { name: string; whatsapp: string | null } | null;
  }) {
    return {
      id: row.id,
      weddingId: row.weddingId,
      eventId: row.eventId ?? null,
      vendorId: row.vendorId,
      vendorName: row.vendor?.name ?? null,
      vendorWhatsapp: row.vendor?.whatsapp ?? null,
      title: row.title,
      kind: row.kind,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      venueName: row.venueName,
      address: row.address,
      reminderMinutes: row.reminderMinutes,
      notes: row.notes,
      color: row.color,
      sortOrder: row.sortOrder ?? 0,
      ownerLabel: row.ownerLabel ?? null,
    };
  }
}
