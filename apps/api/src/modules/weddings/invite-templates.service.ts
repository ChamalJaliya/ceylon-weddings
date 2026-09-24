import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";
import {
  INVITE_TEMPLATE_STARTERS,
  type CreateInviteTemplateBody,
  type UpdateInviteTemplateBody,
  type User,
} from "@ceylonweddings/contracts";
import { WeddingAccessService } from "./wedding-access.service";

@Injectable()
export class InviteTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  async list(user: User) {
    const wedding = await this.access.requireWedding(user);
    await this.ensureStarters(wedding.id);
    const rows = await this.prisma.inviteTemplate.findMany({
      where: { weddingId: wedding.id },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return rows.map((row) => this.serialize(row));
  }

  async create(user: User, body: CreateInviteTemplateBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    if (body.isDefault) {
      await this.prisma.inviteTemplate.updateMany({
        where: { weddingId: wedding.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    const row = await this.prisma.inviteTemplate.create({
      data: {
        weddingId: wedding.id,
        name: body.name,
        locale: body.locale,
        channel: body.channel,
        body: body.body,
        isDefault: body.isDefault,
      },
    });
    return this.serialize(row);
  }

  async update(user: User, id: string, body: UpdateInviteTemplateBody) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const existing = await this.prisma.inviteTemplate.findFirst({
      where: { id, weddingId: wedding.id },
    });
    if (!existing) throw new NotFoundException("Template not found");
    if (body.isDefault) {
      await this.prisma.inviteTemplate.updateMany({
        where: { weddingId: wedding.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    const row = await this.prisma.inviteTemplate.update({
      where: { id },
      data: {
        name: body.name,
        locale: body.locale,
        channel: body.channel,
        body: body.body,
        isDefault: body.isDefault,
      },
    });
    return this.serialize(row);
  }

  async delete(user: User, id: string) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    const existing = await this.prisma.inviteTemplate.findFirst({
      where: { id, weddingId: wedding.id },
    });
    if (!existing) throw new NotFoundException("Template not found");
    await this.prisma.inviteTemplate.delete({ where: { id } });
    return { ok: true as const };
  }

  async resetStarters(user: User) {
    const { wedding } = await this.access.requireFlag(user, "canEditGuests");
    await this.prisma.inviteTemplate.deleteMany({ where: { weddingId: wedding.id } });
    await this.seedStarters(wedding.id);
    return this.list(user);
  }

  async ensureStarters(weddingId: string) {
    const count = await this.prisma.inviteTemplate.count({ where: { weddingId } });
    if (count === 0) await this.seedStarters(weddingId);
  }

  async seedStarters(weddingId: string) {
    await this.prisma.inviteTemplate.createMany({
      data: INVITE_TEMPLATE_STARTERS.map((starter) => ({
        weddingId,
        name: starter.name,
        locale: starter.locale,
        channel: starter.channel,
        body: starter.body,
        isDefault: Boolean(starter.isDefault),
      })),
    });
  }

  private serialize(row: {
    id: string;
    weddingId: string;
    name: string;
    locale: string;
    channel: string;
    body: string;
    isDefault: boolean;
  }) {
    return {
      id: row.id,
      weddingId: row.weddingId,
      name: row.name,
      locale: row.locale,
      channel: row.channel,
      body: row.body,
      isDefault: row.isDefault,
    };
  }
}
