import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";
import type { UpsertSeatingPlanBody, User } from "@ceylonweddings/contracts";
import { seatingSummary } from "@ceylonweddings/contracts";
import { WeddingAccessService } from "./wedding-access.service";

@Injectable()
export class SeatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  async get(user: User, eventId: string) {
    const wedding = await this.access.requireWedding(user);
    await this.assertEvent(wedding.id, eventId);
    const plan = await this.prisma.seatingPlan.findUnique({
      where: { eventId },
      include: {
        tables: {
          orderBy: { sortOrder: "asc" },
          include: {
            assignments: {
              include: { household: true },
            },
          },
        },
      },
    });
    if (!plan || plan.weddingId !== wedding.id) {
      return { plan: null, summary: null };
    }
    const households = await this.prisma.guestHousehold.findMany({
      where: { weddingId: wedding.id },
      select: { id: true, plusCount: true },
    });
    const serialized = this.serialize(plan);
    return { plan: serialized, summary: seatingSummary(serialized, households) };
  }

  async upsert(user: User, eventId: string, body: UpsertSeatingPlanBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    await this.assertEvent(wedding.id, eventId);

    const householdIds = body.tables.flatMap((t) => t.assignments.map((a) => a.householdId));
    const uniqueHouseholds = new Set(householdIds);
    if (uniqueHouseholds.size !== householdIds.length) {
      throw new BadRequestException("A household can only be seated once per plan");
    }
    if (householdIds.length) {
      const count = await this.prisma.guestHousehold.count({
        where: { weddingId: wedding.id, id: { in: [...uniqueHouseholds] } },
      });
      if (count !== uniqueHouseholds.size) {
        throw new BadRequestException("Invalid household in seating plan");
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.seatingPlan.findUnique({ where: { eventId } });
      if (existing && existing.weddingId !== wedding.id) {
        throw new NotFoundException("Seating plan not found");
      }
      if (existing) {
        await tx.seatAssignment.deleteMany({
          where: { table: { planId: existing.id } },
        });
        await tx.seatingTable.deleteMany({ where: { planId: existing.id } });
        await tx.seatingPlan.update({
          where: { id: existing.id },
          data: { notes: body.notes ?? null },
        });
        for (const [index, table] of body.tables.entries()) {
          const created = await tx.seatingTable.create({
            data: {
              planId: existing.id,
              name: table.name,
              capacity: table.capacity,
              sortOrder: table.sortOrder ?? index,
              notes: table.notes ?? null,
            },
          });
          if (table.assignments.length) {
            await tx.seatAssignment.createMany({
              data: table.assignments.map((a) => ({
                tableId: created.id,
                householdId: a.householdId,
                seatsUsed: a.seatsUsed,
              })),
            });
          }
        }
      } else {
        await tx.seatingPlan.create({
          data: {
            weddingId: wedding.id,
            eventId,
            notes: body.notes ?? null,
            tables: {
              create: body.tables.map((table, index) => ({
                name: table.name,
                capacity: table.capacity,
                sortOrder: table.sortOrder ?? index,
                notes: table.notes ?? null,
                assignments: {
                  create: table.assignments.map((a) => ({
                    householdId: a.householdId,
                    seatsUsed: a.seatsUsed,
                  })),
                },
              })),
            },
          },
        });
      }
    });

    return this.get(user, eventId);
  }

  private async assertEvent(weddingId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, weddingId } });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  private serialize(plan: {
    id: string;
    weddingId: string;
    eventId: string;
    notes: string | null;
    tables: Array<{
      id: string;
      planId: string;
      name: string;
      capacity: number;
      sortOrder: number;
      notes: string | null;
      assignments: Array<{
        id: string;
        tableId: string;
        householdId: string;
        seatsUsed: number;
        household: { label: string; headName: string };
      }>;
    }>;
  }) {
    return {
      id: plan.id,
      weddingId: plan.weddingId,
      eventId: plan.eventId,
      notes: plan.notes,
      tables: plan.tables.map((table) => ({
        id: table.id,
        planId: table.planId,
        name: table.name,
        capacity: table.capacity,
        sortOrder: table.sortOrder,
        notes: table.notes,
        assignments: table.assignments.map((a) => ({
          id: a.id,
          tableId: a.tableId,
          householdId: a.householdId,
          seatsUsed: a.seatsUsed,
          householdLabel: a.household.label,
          headName: a.household.headName,
        })),
      })),
    };
  }
}
