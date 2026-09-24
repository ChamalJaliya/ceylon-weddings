import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PrismaService } from "@ceylonweddings/database";
import {
  isPromotionLive,
  promotionCompleteness,
  type Promotion,
  type PromotionListQuery,
  type PublicPromotionQuery,
  type UpsertPromotionBody,
  type User,
} from "@ceylonweddings/contracts";
import { AdminAccessService } from "./admin-access.service";
import { isFeatureEnabled } from "./feature-flag.util";

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AdminAccessService,
  ) {}

  async adminList(user: User, query: PromotionListQuery): Promise<Promotion[]> {
    this.access.assertAdmin(user);
    return this.list(query);
  }

  async adminGet(user: User, id: string): Promise<Promotion> {
    this.access.assertAdmin(user);
    return this.get(id, true);
  }

  async adminUpsert(user: User, body: UpsertPromotionBody, id?: string, ip?: string): Promise<Promotion> {
    this.access.assertAdmin(user);
    return this.upsert(body, { id, actorId: user.id, ip, allowAnyVendor: true });
  }

  async adminDelete(user: User, id: string, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promotion not found");
    await this.prisma.promotion.delete({ where: { id } });
    if (existing.vendorId) await this.syncVendorFeatured(existing.vendorId);
    await this.access.append({
      actorUserId: user.id,
      action: "promotion.delete",
      entityType: "PROMOTION",
      entityId: id,
      before: { name: existing.name, status: existing.status },
      ip,
    });
    return { ok: true as const };
  }

  async vendorList(user: User): Promise<Promotion[]> {
    const vendor = await this.requireVendor(user);
    return this.list({ vendorId: vendor.id });
  }

  async vendorGet(user: User, id: string): Promise<Promotion> {
    const vendor = await this.requireVendor(user);
    const promo = await this.get(id, true);
    if (promo.vendorId !== vendor.id) throw new ForbiddenException();
    return promo;
  }

  async vendorUpsert(user: User, body: UpsertPromotionBody, id?: string): Promise<Promotion> {
    const vendor = await this.requireVendor(user);
    if (body.vendorId && body.vendorId !== vendor.id) {
      throw new ForbiddenException("Vendors can only promote their own listing");
    }
    const next: UpsertPromotionBody = {
      ...body,
      vendorId: vendor.id,
      source: body.source === "EDITORIAL" || body.source === "COMPED" ? "PAID_PENDING" : body.source,
      status:
        body.status === "ACTIVE" || body.status === "SCHEDULED"
          ? "SCHEDULED"
          : body.status === "ARCHIVED"
            ? "ARCHIVED"
            : body.status === "PAUSED"
              ? "PAUSED"
              : "DRAFT",
    };
    if (id) {
      const existing = await this.prisma.promotion.findUnique({ where: { id } });
      if (!existing || existing.vendorId !== vendor.id) throw new ForbiddenException();
    }
    return this.upsert(next, { id, actorId: user.id, allowAnyVendor: false });
  }

  async publicList(query: PublicPromotionQuery): Promise<Promotion[]> {
    const adsEnabled = await isFeatureEnabled(this.prisma, "ads.public");
    if (!adsEnabled) return [];

    const rows = await this.prisma.promotion.findMany({
      where: {
        status: { in: ["ACTIVE", "SCHEDULED"] },
        slots: { has: query.slot },
        ...(query.city
          ? {
              OR: [{ cities: { isEmpty: true } }, { cities: { has: query.city } }],
            }
          : {}),
        ...(query.category
          ? {
              OR: [{ categories: { isEmpty: true } }, { categories: { has: query.category } }],
            }
          : {}),
        ...(query.locale
          ? {
              OR: [{ locales: { isEmpty: true } }, { locales: { has: query.locale } }],
            }
          : {}),
        AND: [{ OR: [{ vendorId: null }, { vendor: { listed: true } }] }],
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 40,
      include: { vendor: { select: { name: true, slug: true } } },
    });
    return rows
      .map((row) => this.serialize(row))
      .filter((row) => isPromotionLive(row))
      .slice(0, query.limit);
  }

  async track(id: string, kind: "impression" | "click") {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promotion not found");
    await this.prisma.$transaction([
      this.prisma.promotion.update({
        where: { id },
        data:
          kind === "impression"
            ? { impressionCount: { increment: 1 } }
            : { clickCount: { increment: 1 } },
      }),
      this.prisma.analyticsEvent.create({
        data: {
          kind: kind === "impression" ? "PROMO_IMPRESSION" : "PROMO_CLICK",
          entityType: "PROMOTION",
          entityId: id,
        },
      }),
    ]);
    return { ok: true as const };
  }

  private async list(query: PromotionListQuery): Promise<Promotion[]> {
    const rows = await this.prisma.promotion.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.slot ? { slots: { has: query.slot } } : {}),
        ...(query.vendorId ? { vendorId: query.vendorId } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { headline: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: { vendor: { select: { name: true, slug: true } } },
    });
    return rows.map((row) => this.serialize(row, true));
  }

  private async get(id: string, withCompleteness: boolean): Promise<Promotion> {
    const row = await this.prisma.promotion.findUnique({
      where: { id },
      include: { vendor: { select: { name: true, slug: true } } },
    });
    if (!row) throw new NotFoundException("Promotion not found");
    return this.serialize(row, withCompleteness);
  }

  private async upsert(
    body: UpsertPromotionBody,
    options: { id?: string; actorId: string; ip?: string; allowAnyVendor: boolean },
  ): Promise<Promotion> {
    if (body.startsAt && body.endsAt && new Date(body.startsAt) > new Date(body.endsAt)) {
      throw new BadRequestException("startsAt must be before endsAt");
    }
    if (body.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({ where: { id: body.vendorId } });
      if (!vendor) throw new NotFoundException("Vendor not found");
    }

    const data: Prisma.PromotionUncheckedCreateInput = {
      name: body.name,
      status: body.status,
      headline: body.headline,
      subheadline: body.subheadline ?? null,
      body: body.body ?? null,
      ctaLabel: body.ctaLabel ?? null,
      ctaHref: body.ctaHref ?? null,
      coverUrl: body.coverUrl ?? null,
      secondaryUrl: body.secondaryUrl ?? null,
      logoUrl: body.logoUrl ?? null,
      accentColor: body.accentColor ?? null,
      overlayTone: body.overlayTone,
      layout: body.layout,
      badgeLabel: body.badgeLabel ?? null,
      slots: body.slots,
      cities: body.cities,
      categories: body.categories,
      locales: body.locales,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      priority: body.priority,
      vendorId: body.vendorId ?? null,
      createdById: options.actorId,
      source: body.source,
      notes: body.notes ?? null,
    };

    const row = options.id
      ? await this.prisma.promotion.update({
          where: { id: options.id },
          data,
          include: { vendor: { select: { name: true, slug: true } } },
        })
      : await this.prisma.promotion.create({
          data,
          include: { vendor: { select: { name: true, slug: true } } },
        });

    if (row.vendorId) await this.syncVendorFeatured(row.vendorId);

    await this.access.append({
      actorUserId: options.actorId,
      action: options.id ? "promotion.update" : "promotion.create",
      entityType: "PROMOTION",
      entityId: row.id,
      after: { name: row.name, status: row.status, layout: row.layout, slots: row.slots },
      ip: options.ip,
    });

    return this.serialize(row, true);
  }

  private async syncVendorFeatured(vendorId: string) {
    const now = new Date();
    const [placementActive, promoActive] = await Promise.all([
      this.prisma.featuredPlacement.count({
        where: { vendorId, startsAt: { lte: now }, endsAt: { gte: now } },
      }),
      this.prisma.promotion.count({
        where: {
          vendorId,
          status: { in: ["ACTIVE", "SCHEDULED"] },
          OR: [
            { startsAt: null, endsAt: null },
            { startsAt: { lte: now }, endsAt: { gte: now } },
            { startsAt: { lte: now }, endsAt: null },
            { startsAt: null, endsAt: { gte: now } },
          ],
        },
      }),
    ]);
    if (placementActive + promoActive > 0) {
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: { featured: true, featuredAt: now },
      });
    }
  }

  private async requireVendor(user: User) {
    if (user.role !== "VENDOR" && user.role !== "ADMIN") {
      throw new ForbiddenException();
    }
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new NotFoundException("Vendor profile not found");
    return vendor;
  }

  private serialize(
    row: {
      id: string;
      name: string;
      status: Promotion["status"];
      headline: string;
      subheadline: string | null;
      body: string | null;
      ctaLabel: string | null;
      ctaHref: string | null;
      coverUrl: string | null;
      secondaryUrl: string | null;
      logoUrl: string | null;
      accentColor: string | null;
      overlayTone: string;
      layout: Promotion["layout"];
      badgeLabel: string | null;
      slots: Promotion["slots"];
      cities: string[];
      categories: Promotion["categories"];
      locales: string[];
      startsAt: Date | null;
      endsAt: Date | null;
      priority: number;
      vendorId: string | null;
      createdById: string | null;
      source: Promotion["source"];
      notes: string | null;
      impressionCount: number;
      clickCount: number;
      createdAt: Date;
      updatedAt: Date;
      vendor?: { name: string; slug: string } | null;
    },
    withCompleteness = false,
  ): Promotion {
    const promo: Promotion = {
      id: row.id,
      name: row.name,
      status: row.status,
      headline: row.headline,
      subheadline: row.subheadline,
      body: row.body,
      ctaLabel: row.ctaLabel,
      ctaHref: row.ctaHref,
      coverUrl: row.coverUrl,
      secondaryUrl: row.secondaryUrl,
      logoUrl: row.logoUrl,
      accentColor: row.accentColor,
      overlayTone: row.overlayTone,
      layout: row.layout,
      badgeLabel: row.badgeLabel,
      slots: row.slots,
      cities: row.cities,
      categories: row.categories,
      locales: row.locales,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      priority: row.priority,
      vendorId: row.vendorId,
      vendorName: row.vendor?.name ?? null,
      vendorSlug: row.vendor?.slug ?? null,
      createdById: row.createdById,
      source: row.source,
      notes: row.notes,
      impressionCount: row.impressionCount,
      clickCount: row.clickCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    if (withCompleteness) {
      promo.completeness = promotionCompleteness(promo);
    }
    return promo;
  }
}
