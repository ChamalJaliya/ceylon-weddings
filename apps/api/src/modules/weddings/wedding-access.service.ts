import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ceylonweddings/database";
import { INVITE_TEMPLATE_STARTERS, type User } from "@ceylonweddings/contracts";

export type WeddingFlag = "canEditGuests" | "canViewBudget" | "canManageVendors";

export type WeddingAccessContext = {
  wedding: { id: string };
  membership: { id: string; role: "COUPLE" | "FAMILY" | "VENDOR" | "ADMIN" };
  flags: Record<WeddingFlag, boolean>;
};

@Injectable()
export class WeddingAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(user: User): Promise<WeddingAccessContext> {
    const membership = await this.prisma.weddingMember.findFirst({
      where: { userId: user.id },
      include: { wedding: true },
    });
    if (membership) {
      return this.withFlags(membership);
    }

    if (user.role !== "COUPLE") {
      throw new NotFoundException("No wedding for this account");
    }

    await this.prisma.wedding.create({
      data: {
        slug: `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-wedding-${user.id.slice(-6)}`.replace(/^-|-$/g, ""),
        partnerOneName: user.name,
        partnerTwoName: "Partner",
        types: ["KANDYAN_PORUWA"],
        members: {
          create: {
            userId: user.id,
            role: "COUPLE",
            canEditGuests: true,
            canViewBudget: true,
            canManageVendors: true,
          },
        },
        events: {
          create: [
            { kind: "PORUWA", name: "Poruwa ceremony" },
            { kind: "RECEPTION", name: "Reception" },
          ],
        },
        tasks: {
          create: [
            { title: "Confirm nekath with astrologer", category: "tradition" },
            { title: "Book venue and hall", category: "venue" },
            { title: "Draft guest list with both families", category: "guests" },
            { title: "Lock entertainment and music brief", category: "entertainment" },
          ],
        },
        budgetLines: {
          create: [
            { category: "venue_catering", label: "Venue and catering", plannedLkr: 1200000 },
            { category: "photo_video", label: "Photography and video", plannedLkr: 300000 },
            { category: "attire", label: "Attire and jewellery", plannedLkr: 350000 },
          ],
        },
        inviteTemplates: {
          create: INVITE_TEMPLATE_STARTERS.map((starter) => ({
            name: starter.name,
            locale: starter.locale,
            channel: starter.channel,
            body: starter.body,
            isDefault: Boolean(starter.isDefault),
          })),
        },
      },
    });

    const created = await this.prisma.weddingMember.findFirstOrThrow({
      where: { userId: user.id },
      include: { wedding: true },
    });
    return this.withFlags(created);
  }

  async requireWedding(user: User) {
    return (await this.requireMembership(user)).wedding;
  }

  async requireFlag(user: User, flag: WeddingFlag) {
    const context = await this.requireMembership(user);
    if (!context.flags[flag]) {
      throw new ForbiddenException(`Missing permission: ${flag}`);
    }
    return context;
  }

  async requireCouple(user: User) {
    const context = await this.requireMembership(user);
    if (context.membership.role !== "COUPLE") {
      throw new ForbiddenException("Only the couple can edit the wedding profile and events");
    }
    return context;
  }

  private withFlags(membership: {
    id: string;
    role: "COUPLE" | "FAMILY" | "VENDOR" | "ADMIN";
    canEditGuests: boolean;
    canViewBudget: boolean;
    canManageVendors: boolean;
    wedding: { id: string };
  }): WeddingAccessContext {
    const couple = membership.role === "COUPLE";
    return {
      wedding: membership.wedding,
      membership: { id: membership.id, role: membership.role },
      flags: {
        canEditGuests: couple || membership.canEditGuests,
        canViewBudget: couple || membership.canViewBudget,
        canManageVendors: couple || membership.canManageVendors,
      },
    };
  }
}
