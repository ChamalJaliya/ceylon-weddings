import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaService } from "@ceylonweddings/database";
import {
  complementaryCategoriesFor,
  DEFAULT_SLOT_CONFIGS,
  effectivePromotionBadge,
  isPromotionLive,
  promotionCompleteness,
  sanitizePaidBadgeLabel,
  type Promotion,
  type PromotionListQuery,
  type PromotionPackage,
  type PromotionSlot,
  type PromotionSlotConfig,
  type PublicPromotionQuery,
  type PublicPromotionSlotConfig,
  type TrackPromotionBody,
  type UpsertPromotionBody,
  type UpsertPromotionPackageBody,
  type UpsertPromotionSlotConfigBody,
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

  async listSlotConfigs(user: User): Promise<PromotionSlotConfig[]> {
    this.access.assertAdmin(user);
    await this.ensureSlotConfigs();
    const rows = await this.prisma.promotionSlotConfig.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map((row) => this.serializeSlotConfig(row));
  }

  async upsertSlotConfig(user: User, body: UpsertPromotionSlotConfigBody, ip?: string): Promise<PromotionSlotConfig> {
    this.access.assertAdmin(user);
    await this.ensureSlotConfigs();
    const row = await this.prisma.promotionSlotConfig.upsert({
      where: { slot: body.slot },
      create: {
        slot: body.slot,
        enabled: body.enabled,
        pageKey: body.pageKey,
        regionKey: body.regionKey,
        description: body.description ?? null,
        defaultLayout: body.defaultLayout,
        maxPerRequest: body.maxPerRequest,
        densityEveryN: body.densityEveryN ?? null,
        disclosure: body.disclosure,
        priceLkr: body.priceLkr,
        interval: body.interval,
        currency: body.currency,
        sortOrder: body.sortOrder,
        notes: body.notes ?? null,
      },
      update: {
        enabled: body.enabled,
        pageKey: body.pageKey,
        regionKey: body.regionKey,
        description: body.description ?? null,
        defaultLayout: body.defaultLayout,
        maxPerRequest: body.maxPerRequest,
        densityEveryN: body.densityEveryN ?? null,
        disclosure: body.disclosure,
        priceLkr: body.priceLkr,
        interval: body.interval,
        currency: body.currency,
        sortOrder: body.sortOrder,
        notes: body.notes ?? null,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "promotion_slot_config.upsert",
      entityType: "PROMOTION_SLOT_CONFIG",
      entityId: row.id,
      after: { slot: row.slot, enabled: row.enabled, priceLkr: row.priceLkr },
      ip,
    });
    return this.serializeSlotConfig(row);
  }

  async listPackages(user: User, activeOnly = false): Promise<PromotionPackage[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.promotionPackage.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => this.serializePackage(row));
  }

  async createPackage(user: User, body: UpsertPromotionPackageBody, ip?: string): Promise<PromotionPackage> {
    this.access.assertAdmin(user);
    const row = await this.prisma.promotionPackage.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        slots: body.slots,
        priceLkr: body.priceLkr,
        interval: body.interval,
        durationDays: body.durationDays,
        active: body.active,
        sortOrder: body.sortOrder,
        stripePriceId: body.stripePriceId ?? null,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "promotion_package.create",
      entityType: "PROMOTION_PACKAGE",
      entityId: row.id,
      after: { slug: row.slug, priceLkr: row.priceLkr },
      ip,
    });
    return this.serializePackage(row);
  }

  async updatePackage(
    user: User,
    id: string,
    body: UpsertPromotionPackageBody,
    ip?: string,
  ): Promise<PromotionPackage> {
    this.access.assertAdmin(user);
    const existing = await this.prisma.promotionPackage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Package not found");
    const row = await this.prisma.promotionPackage.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        slots: body.slots,
        priceLkr: body.priceLkr,
        interval: body.interval,
        durationDays: body.durationDays,
        active: body.active,
        sortOrder: body.sortOrder,
        stripePriceId: body.stripePriceId ?? null,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "promotion_package.update",
      entityType: "PROMOTION_PACKAGE",
      entityId: row.id,
      after: { slug: row.slug, priceLkr: row.priceLkr, active: row.active },
      ip,
    });
    return this.serializePackage(row);
  }

  async deletePackage(user: User, id: string, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.promotionPackage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Package not found");
    await this.prisma.promotionPackage.delete({ where: { id } });
    await this.access.append({
      actorUserId: user.id,
      action: "promotion_package.delete",
      entityType: "PROMOTION_PACKAGE",
      entityId: id,
      before: { slug: existing.slug },
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
    if (!vendor.verified || !vendor.listed || vendor.moderationStatus !== "APPROVED") {
      throw new ForbiddenException("Only verified, listed vendors can run promotions");
    }
    if (body.vendorId && body.vendorId !== vendor.id) {
      throw new ForbiddenException("Vendors can only promote their own listing");
    }
    if (body.badgeLabel && (body.source === "PAID" || body.source === "PAID_PENDING")) {
      if (!sanitizePaidBadgeLabel(body.badgeLabel)) {
        body = { ...body, badgeLabel: "Sponsored" };
      }
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

  /** Demo / manual fulfillment until PayHere-Stripe promo checkout lands. */
  async vendorActivatePackage(user: User, packageId: string): Promise<Promotion> {
    const vendor = await this.requireVendor(user);
    if (!vendor.verified || !vendor.listed || vendor.moderationStatus !== "APPROVED") {
      throw new ForbiddenException("Only verified, listed vendors can run promotions");
    }
    const withType = await this.prisma.vendor.findUnique({
      where: { id: vendor.id },
      include: { categoryType: { select: { slug: true } } },
    });
    const pkg = await this.prisma.promotionPackage.findFirst({
      where: { id: packageId, active: true },
    });
    if (!pkg) throw new NotFoundException("Package not found");
    const starts = new Date();
    const ends = new Date(starts.getTime() + pkg.durationDays * 86400000);
    return this.upsert(
      {
        name: `${pkg.name} — ${vendor.name}`,
        status: "ACTIVE",
        headline: vendor.name,
        subheadline: pkg.description,
        ctaLabel: "View profile",
        ctaHref: `/vendors/${vendor.slug}`,
        coverUrl: vendor.photoUrl,
        overlayTone: "light",
        layout: "CARD",
        badgeLabel: "Sponsored",
        slots: pkg.slots,
        cities: vendor.city ? [vendor.city] : [],
        categories: withType?.categoryType?.slug ? [withType.categoryType.slug] : [],
        locales: ["en"],
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        priority: 50,
        vendorId: vendor.id,
        packageId: pkg.id,
        source: "PAID",
        notes: "Demo activate — replace with PayHere/Stripe webhook fulfillment",
      },
      { actorId: user.id, allowAnyVendor: false },
    );
  }

  async vendorListPackages(user: User): Promise<PromotionPackage[]> {
    await this.requireVendor(user);
    const rows = await this.prisma.promotionPackage.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => this.serializePackage(row));
  }

  async publicSlotConfigs(): Promise<PublicPromotionSlotConfig[]> {
    await this.ensureSlotConfigs();
    const rows = await this.prisma.promotionSlotConfig.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map((row) => ({
      slot: row.slot,
      enabled: row.enabled,
      defaultLayout: row.defaultLayout,
      maxPerRequest: row.maxPerRequest,
      densityEveryN: row.densityEveryN,
      disclosure: row.disclosure,
      pageKey: row.pageKey,
      regionKey: row.regionKey,
    }));
  }

  async publicList(query: PublicPromotionQuery): Promise<Promotion[]> {
    const adsEnabled = await isFeatureEnabled(this.prisma, "ads.public");
    if (!adsEnabled) return [];

    await this.ensureSlotConfigs();
    const slotConfig = await this.prisma.promotionSlotConfig.findUnique({ where: { slot: query.slot } });
    if (!slotConfig?.enabled) return [];

    const limit = query.limit ?? slotConfig.maxPerRequest;
    const complementary =
      query.slot === "VENDOR_COMPLEMENTARY" && query.excludeCategory
        ? complementaryCategoriesFor(query.excludeCategory)
        : null;

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
        AND: [
          {
            OR: [{ vendorId: null }, { vendor: { listed: true, verified: true, moderationStatus: "APPROVED" } }],
          },
        ],
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 40,
      include: {
        vendor: {
          select: {
            name: true,
            slug: true,
            verified: true,
            listed: true,
            categoryType: { select: { slug: true } },
          },
        },
        package: { select: { name: true } },
      },
    });

    const excludeIds = new Set(
      (query.excludeVendorIds ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    );
    const excludeSlugs = new Set(
      (query.excludeVendorSlugs ?? "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    );

    const seenVendors = new Set<string>();
    return rows
      .map((row) =>
        this.serialize(row, false, {
          disclosure: slotConfig.disclosure,
          defaultLayout: slotConfig.defaultLayout,
        }),
      )
      .filter((row) => isPromotionLive(row))
      .filter((row) => {
        if (row.vendorId && excludeIds.has(row.vendorId)) return false;
        if (row.vendorSlug && excludeSlugs.has(row.vendorSlug)) return false;
        return true;
      })
      .filter((row) => {
        if (!complementary) return true;
        const vendorCategory = rows.find((r) => r.id === row.id)?.vendor?.categoryType?.slug;
        const cats = row.categories.length ? row.categories : vendorCategory ? [vendorCategory] : [];
        if (!cats.length) return false;
        if (query.excludeCategory && cats.includes(query.excludeCategory)) return false;
        return cats.some((cat) => complementary.includes(cat));
      })
      .filter((row) => {
        // One appearance per vendor per request.
        const key = row.vendorId ?? row.vendorSlug ?? row.id;
        if (seenVendors.has(key)) return false;
        seenVendors.add(key);
        return true;
      })
      .slice(0, limit);
  }

  async track(id: string, kind: "impression" | "click", body?: TrackPromotionBody) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promotion not found");
    const meta = body?.slot ? { slot: body.slot } : undefined;
    await this.prisma.$transaction([
      this.prisma.promotion.update({
        where: { id },
        data: kind === "impression" ? { impressionCount: { increment: 1 } } : { clickCount: { increment: 1 } },
      }),
      this.prisma.analyticsEvent.create({
        data: {
          kind: kind === "impression" ? "PROMO_IMPRESSION" : "PROMO_CLICK",
          entityType: "PROMOTION",
          entityId: id,
          meta: meta ?? undefined,
        },
      }),
    ]);
    return { ok: true as const };
  }

  async slotAnalytics(user: User) {
    this.access.assertAdmin(user);
    const events = await this.prisma.analyticsEvent.findMany({
      where: { kind: { in: ["PROMO_IMPRESSION", "PROMO_CLICK"] } },
      select: { kind: true, meta: true },
      take: 5000,
      orderBy: { createdAt: "desc" },
    });
    const bySlot: Record<string, { impressions: number; clicks: number }> = {};
    for (const event of events) {
      const meta = event.meta as { slot?: string } | null;
      const slot = meta?.slot ?? "UNKNOWN";
      if (!bySlot[slot]) bySlot[slot] = { impressions: 0, clicks: 0 };
      if (event.kind === "PROMO_IMPRESSION") bySlot[slot].impressions += 1;
      else bySlot[slot].clicks += 1;
    }
    return Object.entries(bySlot).map(([slot, stats]) => ({ slot, ...stats }));
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
      include: {
        vendor: { select: { name: true, slug: true } },
        package: { select: { name: true } },
      },
    });
    return rows.map((row) => this.serialize(row, true));
  }

  private async get(id: string, withCompleteness: boolean): Promise<Promotion> {
    const row = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        vendor: { select: { name: true, slug: true } },
        package: { select: { name: true } },
      },
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
    if (body.packageId) {
      const pkg = await this.prisma.promotionPackage.findUnique({ where: { id: body.packageId } });
      if (!pkg) throw new NotFoundException("Package not found");
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
      packageId: body.packageId ?? null,
      createdById: options.actorId,
      source: body.source,
      notes: body.notes ?? null,
    };

    const row = options.id
      ? await this.prisma.promotion.update({
          where: { id: options.id },
          data,
          include: {
            vendor: { select: { name: true, slug: true } },
            package: { select: { name: true } },
          },
        })
      : await this.prisma.promotion.create({
          data,
          include: {
            vendor: { select: { name: true, slug: true } },
            package: { select: { name: true } },
          },
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

  /** Editorial featured only — paid promotions must not flip Ceylon Pick. */
  private async syncVendorFeatured(vendorId: string) {
    const now = new Date();
    const placementActive = await this.prisma.featuredPlacement.count({
      where: {
        vendorId,
        startsAt: { lte: now },
        endsAt: { gte: now },
        source: { in: ["EDITORIAL", "COMPED"] },
      },
    });
    const promoEditorial = await this.prisma.promotion.count({
      where: {
        vendorId,
        source: { in: ["EDITORIAL", "COMPED"] },
        status: { in: ["ACTIVE", "SCHEDULED"] },
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: now }, endsAt: { gte: now } },
          { startsAt: { lte: now }, endsAt: null },
          { startsAt: null, endsAt: { gte: now } },
        ],
      },
    });
    if (placementActive + promoEditorial > 0) {
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: { featured: true, featuredAt: now },
      });
    }
  }

  private async ensureSlotConfigs() {
    const count = await this.prisma.promotionSlotConfig.count();
    if (count > 0) {
      const existing = await this.prisma.promotionSlotConfig.findMany({ select: { slot: true } });
      const have = new Set(existing.map((row) => row.slot));
      const missing = DEFAULT_SLOT_CONFIGS.filter((row) => !have.has(row.slot));
      if (missing.length) {
        await this.prisma.promotionSlotConfig.createMany({
          data: missing.map((slot) => ({
            slot: slot.slot,
            enabled: slot.enabled,
            pageKey: slot.pageKey,
            regionKey: slot.regionKey,
            description: slot.description,
            defaultLayout: slot.defaultLayout,
            maxPerRequest: slot.maxPerRequest,
            densityEveryN: slot.densityEveryN,
            disclosure: slot.disclosure,
            priceLkr: slot.priceLkr,
            interval: slot.interval,
            sortOrder: slot.sortOrder,
          })),
        });
      }
      return;
    }
    await this.prisma.promotionSlotConfig.createMany({
      data: DEFAULT_SLOT_CONFIGS.map((slot) => ({
        slot: slot.slot,
        enabled: slot.enabled,
        pageKey: slot.pageKey,
        regionKey: slot.regionKey,
        description: slot.description,
        defaultLayout: slot.defaultLayout,
        maxPerRequest: slot.maxPerRequest,
        densityEveryN: slot.densityEveryN,
        disclosure: slot.disclosure,
        priceLkr: slot.priceLkr,
        interval: slot.interval,
        sortOrder: slot.sortOrder,
      })),
    });
  }

  private async requireVendor(user: User) {
    if (user.role !== "VENDOR" && user.role !== "ADMIN") {
      throw new ForbiddenException();
    }
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new NotFoundException("Vendor profile not found");
    return vendor;
  }

  private serializeSlotConfig(row: {
    id: string;
    slot: PromotionSlot;
    enabled: boolean;
    pageKey: string;
    regionKey: string;
    description: string | null;
    defaultLayout: Promotion["layout"];
    maxPerRequest: number;
    densityEveryN: number | null;
    disclosure: PromotionSlotConfig["disclosure"];
    priceLkr: number;
    interval: PromotionSlotConfig["interval"];
    currency: string;
    sortOrder: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PromotionSlotConfig {
    return {
      id: row.id,
      slot: row.slot,
      enabled: row.enabled,
      pageKey: row.pageKey,
      regionKey: row.regionKey,
      description: row.description,
      defaultLayout: row.defaultLayout,
      maxPerRequest: row.maxPerRequest,
      densityEveryN: row.densityEveryN,
      disclosure: row.disclosure,
      priceLkr: row.priceLkr,
      interval: row.interval,
      currency: row.currency,
      sortOrder: row.sortOrder,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private serializePackage(row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    slots: PromotionSlot[];
    priceLkr: number;
    interval: PromotionPackage["interval"];
    durationDays: number;
    active: boolean;
    sortOrder: number;
    stripePriceId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PromotionPackage {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      slots: row.slots,
      priceLkr: row.priceLkr,
      interval: row.interval,
      durationDays: row.durationDays,
      active: row.active,
      sortOrder: row.sortOrder,
      stripePriceId: row.stripePriceId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
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
      packageId?: string | null;
      createdById: string | null;
      source: Promotion["source"];
      notes: string | null;
      impressionCount: number;
      clickCount: number;
      createdAt: Date;
      updatedAt: Date;
      vendor?: { name: string; slug: string; categoryType?: { slug: string } | null } | null;
      package?: { name: string } | null;
    },
    withCompleteness = false,
    delivery?: { disclosure: PromotionSlotConfig["disclosure"]; defaultLayout: Promotion["layout"] },
  ): Promotion {
    const effectiveBadge = delivery
      ? effectivePromotionBadge({
          source: row.source,
          badgeLabel: row.badgeLabel,
          disclosure: delivery.disclosure,
        })
      : effectivePromotionBadge({
          source: row.source,
          badgeLabel: row.badgeLabel,
          disclosure: row.source === "PAID" || row.source === "PAID_PENDING" ? "SPONSORED" : "CUSTOM",
        });

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
      effectiveBadge,
      effectiveLayout: delivery?.defaultLayout ?? row.layout,
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
      packageId: row.packageId ?? null,
      packageName: row.package?.name ?? null,
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
