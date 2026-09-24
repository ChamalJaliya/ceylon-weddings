import { ForbiddenException, Injectable } from "@nestjs/common";
import type { User } from "@ceylonweddings/contracts";
import { Prisma, PrismaService } from "@ceylonweddings/database";

@Injectable()
export class AdminAccessService {
  constructor(private readonly prisma: PrismaService) {}

  assertAdmin(user: User) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException();
    }
  }

  async append(input: {
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
    ip?: string | null;
  }) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before == null ? Prisma.JsonNull : (input.before as Prisma.InputJsonValue),
        after: input.after == null ? Prisma.JsonNull : (input.after as Prisma.InputJsonValue),
        ip: input.ip ?? null,
      },
    });
  }
}
