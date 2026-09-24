import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";
import type { CreateFamilyPersonBody, UpdateFamilyPersonBody, User } from "@ceylonweddings/contracts";
import { WeddingAccessService } from "./wedding-access.service";

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  async list(user: User) {
    const wedding = await this.access.requireWedding(user);
    const rows = await this.prisma.familyPerson.findMany({
      where: { weddingId: wedding.id },
      include: { household: true, parent: true },
      orderBy: [{ side: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => this.serialize(row));
  }

  async create(user: User, body: CreateFamilyPersonBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    await this.assertHousehold(wedding.id, body.householdId);
    await this.assertParent(wedding.id, body.parentId);
    const row = await this.prisma.familyPerson.create({
      data: {
        weddingId: wedding.id,
        name: body.name,
        side: body.side,
        relation: body.relation,
        notes: body.notes ?? null,
        phone: body.phone ?? null,
        householdId: body.householdId ?? null,
        parentId: body.parentId ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
      include: { household: true, parent: true },
    });
    return this.serialize(row);
  }

  async update(user: User, id: string, body: UpdateFamilyPersonBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const existing = await this.prisma.familyPerson.findFirst({
      where: { id, weddingId: wedding.id },
    });
    if (!existing) throw new NotFoundException("Family person not found");
    if (body.parentId === id) {
      throw new BadRequestException("A person cannot be their own parent");
    }
    await this.assertHousehold(wedding.id, body.householdId);
    await this.assertParent(wedding.id, body.parentId);
    const row = await this.prisma.familyPerson.update({
      where: { id },
      data: {
        name: body.name,
        side: body.side,
        relation: body.relation,
        notes: body.notes,
        phone: body.phone,
        householdId: body.householdId === undefined ? undefined : body.householdId,
        parentId: body.parentId === undefined ? undefined : body.parentId,
        sortOrder: body.sortOrder,
      },
      include: { household: true, parent: true },
    });
    return this.serialize(row);
  }

  async delete(user: User, id: string) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const existing = await this.prisma.familyPerson.findFirst({
      where: { id, weddingId: wedding.id },
    });
    if (!existing) throw new NotFoundException("Family person not found");
    await this.prisma.familyPerson.delete({ where: { id } });
    return { ok: true as const };
  }

  private async assertHousehold(weddingId: string, householdId?: string | null) {
    if (!householdId) return;
    const household = await this.prisma.guestHousehold.findFirst({
      where: { id: householdId, weddingId },
    });
    if (!household) throw new BadRequestException("Guest household not found");
  }

  private async assertParent(weddingId: string, parentId?: string | null) {
    if (!parentId) return;
    const parent = await this.prisma.familyPerson.findFirst({
      where: { id: parentId, weddingId },
    });
    if (!parent) throw new BadRequestException("Parent not found on this wedding");
  }

  private serialize(row: {
    id: string;
    weddingId: string;
    name: string;
    side: string;
    relation: string;
    notes: string | null;
    phone: string | null;
    householdId: string | null;
    parentId: string | null;
    sortOrder: number;
    household: { label: string } | null;
    parent: { name: string } | null;
  }) {
    return {
      id: row.id,
      weddingId: row.weddingId,
      name: row.name,
      side: row.side,
      relation: row.relation,
      notes: row.notes,
      phone: row.phone,
      householdId: row.householdId,
      householdLabel: row.household?.label ?? null,
      parentId: row.parentId,
      parentName: row.parent?.name ?? null,
      sortOrder: row.sortOrder,
    };
  }
}
