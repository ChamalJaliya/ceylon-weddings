import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaService } from "@ceylonweddings/database";
import type {
  CatalogAttrValue,
  CreateInquiryBody,
  CreateReviewBody,
  ShortlistVendorBody,
  UpdateTeamVendorBody,
  UpdateVendorBody,
  UpsertVendorAddOnBody,
  UpsertVendorAttributesBody,
  UpsertVendorMediaProjectBody,
  UpsertVendorPackageBody,
  UpsertVendorVideoBody,
  User,
  Vendor,
  VendorAttributeAnswerValue,
  VendorCatalogQuery,
  VendorCatalogResult,
  VendorOnboardingResponse,
  VendorSort,
} from "@ceylonweddings/contracts";
import { toPaginatedResult, vendorCompleteness, normalizeVendorWebsiteUrl } from "@ceylonweddings/contracts";
import { uniqueVendorSlug } from "../../common/vendor-slug";
import { WeddingAccessService } from "./wedding-access.service";
import { isFeatureEnabled } from "../admin/feature-flag.util";
import {
  computeAttributeCompleteness,
  profileChipsFromValues,
  serializeDefinition,
  serializeVendorType,
  valuesRecordFromRows,
} from "../vendor-taxonomy/attribute.util";

type PackageRow = Prisma.VendorPackageGetPayload<{ include: { addOns: true } }>;
type AddOnRow = Prisma.VendorAddOnGetPayload<object>;
type ReviewRow = Prisma.ReviewGetPayload<object>;
type MediaProjectRow = Prisma.VendorMediaProjectGetPayload<{ include: { items: true } }>;
type VideoRow = Prisma.VendorVideoGetPayload<object>;
type AttrValueRow = Prisma.VendorAttributeValueGetPayload<{
  include: {
    definition: true;
    selections: { include: { option: true } };
  };
}>;
type CategoryTypeRow = {
  id: string;
  slug: string;
  galleryLayout: NonNullable<Vendor["galleryLayout"]>;
  status: string;
  attributes?: Array<{
    id: string;
    key: string;
    required: boolean;
    valueType: string;
    showOnProfile: boolean;
    status: string;
  }>;
};

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WeddingAccessService,
  ) {}

  list(category?: string, q?: string): Promise<Vendor[]> {
    return this.prisma.vendor
      .findMany({
        where: this.listWhere(category, q),
        orderBy: [{ featured: "desc" }, { name: "asc" }],
        include: this.lightInclude(),
      })
      .then((rows) => rows.map((row) => this.serializeVendor(row)));
  }

  async catalog(query: VendorCatalogQuery): Promise<VendorCatalogResult> {
    const where = await this.catalogWhere(query);
    const facetWhere = await this.catalogWhere({ ...query, city: undefined, district: undefined });
    const total = await this.prisma.vendor.count({ where });
    const meta = toPaginatedResult([], total, query.page, query.pageSize);
    const [rows, cityRows, districtRows, attributeFacets] = await Promise.all([
      total === 0
        ? Promise.resolve([])
        : this.prisma.vendor.findMany({
            where,
            orderBy: this.catalogOrderBy(query.sort),
            skip: (meta.page - 1) * query.pageSize,
            take: query.pageSize,
            include: this.lightInclude(),
          }),
      this.prisma.vendor.groupBy({
        by: ["city"],
        where: facetWhere,
        _count: { _all: true },
      }),
      this.prisma.vendor.groupBy({
        by: ["district"],
        where: facetWhere,
        _count: { _all: true },
      }),
      this.catalogAttributeFacets(query),
    ]);

    return {
      ...toPaginatedResult(
        rows.map((row) => this.serializeVendor(row)),
        total,
        meta.page,
        query.pageSize,
      ),
      facets: {
        cities: cityRows
          .map((row) => ({ value: row.city, count: row._count._all }))
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
        districts: districtRows
          .map((row) => ({ value: row.district, count: row._count._all }))
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
        ...(Object.keys(attributeFacets).length ? { attributes: attributeFacets } : {}),
      },
    };
  }

  async bySlug(slug: string): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { slug, moderationStatus: { not: "HIDDEN" } },
      include: this.fullInclude(),
    });
    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }
    const reviewsEnabled = await isFeatureEnabled(this.prisma, "reviews.enabled");
    const serialized = this.serializeVendor(vendor, { includeDrafts: false });
    if (!reviewsEnabled) {
      return { ...serialized, reviews: [] };
    }
    return {
      ...serialized,
      reviews: (serialized.reviews ?? []).filter((review) => !review.hidden),
    };
  }

  async mine(user: User): Promise<Vendor> {
    if (user.role !== "VENDOR" && user.role !== "ADMIN") {
      throw new ForbiddenException();
    }
    const existing = await this.prisma.vendor.findUnique({
      where: { userId: user.id },
      include: this.fullInclude(),
    });
    if (existing) {
      return this.serializeVendor(existing, { includeDrafts: true, withCompleteness: true });
    }
    const created = await this.prisma.vendor.create({
      data: {
        userId: user.id,
        name: user.name,
        slug: await uniqueVendorSlug(this.prisma, user.name),
        categoryId: null,
        city: "Colombo",
        district: "Colombo",
        description: "Update your storefront so couples can find you.",
        priceDisplayMode: "FROM",
        subscription: {
          create: {
            status: "TRIAL",
            trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: this.fullInclude(),
    });
    return this.serializeVendor(created, { includeDrafts: true, withCompleteness: true });
  }

  async onboardingMine(user: User): Promise<VendorOnboardingResponse> {
    const vendor = await this.mine(user);
    return this.buildOnboardingResponse(vendor.id);
  }

  async upsertMineAttributes(user: User, body: UpsertVendorAttributesBody): Promise<Vendor> {
    const vendor = await this.mine(user);
    if (!vendor.categoryId) {
      throw new BadRequestException("Choose a vendor type before saving attributes");
    }

    const definitions = await this.prisma.vendorAttributeDefinition.findMany({
      where: { typeId: vendor.categoryId, status: "ACTIVE" },
      include: {
        options: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { key: "asc" }] },
      },
    });
    const defByKey = new Map(definitions.map((def) => [def.key, def]));

    const incoming = Array.isArray(body.values)
      ? body.values
      : Object.entries(body.values).map(([key, value]) => ({ key, ...value }));

    for (const item of incoming) {
      if (!defByKey.has(item.key)) {
        throw new BadRequestException(`Unknown attribute key: ${item.key}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of incoming) {
        const def = defByKey.get(item.key)!;
        await this.upsertAttributeValue(tx, vendor.id, def, item);
      }

      const values = await tx.vendorAttributeValue.findMany({
        where: { vendorId: vendor.id },
        include: {
          definition: true,
          selections: { include: { option: true } },
        },
      });
      const record = valuesRecordFromRows(values);
      const completeness = computeAttributeCompleteness(definitions, record);
      const complete = completeness.requiredTotal === completeness.requiredDone;
      const current = await tx.vendor.findUniqueOrThrow({ where: { id: vendor.id } });
      if (complete && !current.onboardingCompletedAt) {
        await tx.vendor.update({
          where: { id: vendor.id },
          data: { onboardingCompletedAt: new Date() },
        });
      }
    });

    return this.mine(user);
  }

  async updateMine(user: User, body: UpdateVendorBody): Promise<Vendor> {
    const vendor = await this.mine(user);
    const { packages, addOns, faqs, mediaProjects, videos, category, ...scalar } = body;
    if (scalar.websiteUrl !== undefined) {
      const raw = (scalar.websiteUrl ?? "").trim();
      const next = normalizeVendorWebsiteUrl(scalar.websiteUrl);
      if (raw && !next) throw new BadRequestException("Enter a valid website URL");
      scalar.websiteUrl = next;
    }

    await this.prisma.$transaction(async (tx) => {
      let nextCategoryId: string | undefined;
      if (category !== undefined) {
        const type = await tx.vendorType.findUnique({ where: { slug: category } });
        if (!type) throw new BadRequestException(`Unknown vendor type: ${category}`);
        if (type.status === "ARCHIVED") {
          throw new BadRequestException("Cannot select an archived vendor type");
        }
        nextCategoryId = type.id;
        if (vendor.categoryId !== nextCategoryId) {
          await this.pruneAttributeValuesForType(tx, vendor.id, nextCategoryId);
        }
      }

      if (Object.keys(scalar).length || faqs !== undefined || nextCategoryId !== undefined) {
        await tx.vendor.update({
          where: { id: vendor.id },
          data: {
            ...scalar,
            ...(faqs !== undefined ? { faqs } : {}),
            ...(nextCategoryId !== undefined
              ? {
                  categoryId: nextCategoryId,
                  onboardingCompletedAt:
                    vendor.categoryId !== nextCategoryId ? null : undefined,
                }
              : {}),
          },
        });
      }

      let addOnIdMap = new Map<string, string>();
      if (addOns !== undefined) {
        addOnIdMap = await this.replaceAddOns(tx, vendor.id, addOns);
      } else {
        const existing = await tx.vendorAddOn.findMany({ where: { vendorId: vendor.id } });
        addOnIdMap = new Map(existing.map((row) => [row.id, row.id]));
      }

      if (packages !== undefined) {
        await this.replacePackages(tx, vendor.id, packages, addOnIdMap);
      }

      if (mediaProjects !== undefined) {
        await this.replaceMediaProjects(tx, vendor.id, mediaProjects);
      }

      if (videos !== undefined) {
        await this.replaceVideos(tx, vendor.id, videos);
      }

      await this.syncStartingPrice(tx, vendor.id);
    });

    return this.mine(user);
  }

  async shortlist(user: User, body: ShortlistVendorBody) {
    const { wedding } = await this.access.requireFlag(user, "canManageVendors");
    const vendor = await this.prisma.vendor.findUnique({ where: { id: body.vendorId } });
    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }
    const link = await this.prisma.weddingVendor.upsert({
      where: { weddingId_vendorId: { weddingId: wedding.id, vendorId: vendor.id } },
      update: {},
      create: { weddingId: wedding.id, vendorId: vendor.id, status: "SHORTLISTED" },
      include: { vendor: { include: { categoryType: true } } },
    });
    return {
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
    };
  }

  async updateTeamVendor(user: User, vendorId: string, body: UpdateTeamVendorBody) {
    const { wedding } = await this.access.requireFlag(user, "canManageVendors");
    const link = await this.prisma.weddingVendor.findUnique({
      where: { weddingId_vendorId: { weddingId: wedding.id, vendorId } },
      include: { vendor: { include: { categoryType: true } } },
    });
    if (!link) {
      throw new NotFoundException("Team vendor not found");
    }
    const updated = await this.prisma.weddingVendor.update({
      where: { weddingId_vendorId: { weddingId: wedding.id, vendorId } },
      data: { status: body.status },
      include: { vendor: { include: { categoryType: true } } },
    });
    return {
      vendorId: updated.vendorId,
      name: updated.vendor.name,
      slug: updated.vendor.slug,
      category: updated.vendor.categoryType?.slug ?? "",
      status: updated.status,
      photoUrl: updated.vendor.photoUrl,
      photos: updated.vendor.photos,
      city: updated.vendor.city,
      district: updated.vendor.district,
      startingPriceLkr: updated.vendor.showPricing === false ? null : updated.vendor.startingPriceLkr,
      priceDisplayMode: updated.vendor.priceDisplayMode,
      showPricing: updated.vendor.showPricing,
      whatsapp: updated.vendor.whatsapp,
    };
  }

  async unshortlist(user: User, vendorId: string) {
    const { wedding } = await this.access.requireFlag(user, "canManageVendors");
    const link = await this.prisma.weddingVendor.findUnique({
      where: { weddingId_vendorId: { weddingId: wedding.id, vendorId } },
    });
    if (!link) {
      throw new NotFoundException("Team vendor not found");
    }
    await this.prisma.weddingVendor.delete({
      where: { weddingId_vendorId: { weddingId: wedding.id, vendorId } },
    });
    return { ok: true as const };
  }

  async inquire(user: User, body: CreateInquiryBody) {
    const { wedding } = await this.access.requireFlag(user, "canManageVendors");
    const vendor = await this.prisma.vendor.findUnique({ where: { id: body.vendorId } });
    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }

    let packageName = body.packageName;
    if (body.packageId) {
      const pkg = await this.prisma.vendorPackage.findFirst({
        where: { id: body.packageId, vendorId: vendor.id },
      });
      if (pkg) {
        packageName = pkg.name;
      }
    }

    const message = packageName ? `${body.message}\n\nPackage: ${packageName}` : body.message;
    const digits = vendor.whatsapp?.replace(/\D/g, "") ?? "";
    const whatsappUrl = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : null;

    const inquiry = await this.prisma.inquiry.create({
      data: {
        weddingId: wedding.id,
        vendorId: vendor.id,
        message,
        whatsappUrl,
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : null,
      },
    });

    await this.prisma.weddingVendor.upsert({
      where: { weddingId_vendorId: { weddingId: wedding.id, vendorId: vendor.id } },
      update: { status: "INQUIRED" },
      create: { weddingId: wedding.id, vendorId: vendor.id, status: "INQUIRED" },
    });

    return {
      id: inquiry.id,
      weddingId: inquiry.weddingId,
      vendorId: inquiry.vendorId,
      vendorName: vendor.name,
      vendorPhoto: vendor.photoUrl,
      message: inquiry.message,
      status: inquiry.status,
      whatsappUrl: inquiry.whatsappUrl,
      preferredDate: inquiry.preferredDate?.toISOString() ?? null,
      createdAt: inquiry.createdAt.toISOString(),
    };
  }

  async createReview(user: User, vendorId: string, body: CreateReviewBody) {
    const reviewsEnabled = await isFeatureEnabled(this.prisma, "reviews.enabled");
    if (!reviewsEnabled) {
      throw new ForbiddenException("Reviews are currently disabled");
    }
    const { wedding } = await this.access.requireMembership(user);
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }
    const allowed = await this.prisma.inquiry.findFirst({
      where: { weddingId: wedding.id, vendorId },
    });
    const booked = await this.prisma.weddingVendor.findUnique({
      where: { weddingId_vendorId: { weddingId: wedding.id, vendorId } },
    });
    if (!allowed && !booked) {
      throw new ForbiddenException("Inquire or book this vendor before reviewing");
    }

    const rating = body.rating;
    const review = await this.prisma.review.create({
      data: {
        vendorId,
        weddingId: wedding.id,
        authorName: user.name,
        rating,
        quality: body.quality ?? rating,
        professionalism: body.professionalism ?? rating,
        flexibility: body.flexibility ?? rating,
        responseTime: body.responseTime ?? rating,
        value: body.value ?? rating,
        communication: body.communication ?? rating,
        body: body.body,
        recommended: body.recommended,
      },
    });

    const agg = await this.prisma.review.aggregate({
      where: { vendorId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { ratingAvg: agg._avg.rating ?? rating, ratingCount: agg._count },
    });

    return {
      ...review,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async leads(user: User) {
    const vendor = await this.mine(user);
    return this.prisma.inquiry.findMany({
      where: { vendorId: vendor.id },
      include: { wedding: true },
      orderBy: { createdAt: "desc" },
    });
  }

  adminInclude() {
    return this.lightInclude();
  }

  serializePublic(
    vendor: {
      faqs: unknown;
      packages?: PackageRow[];
      addOns?: AddOnRow[];
      reviews?: ReviewRow[] | false;
      mediaProjects?: MediaProjectRow[];
      videos?: VideoRow[];
      [key: string]: unknown;
    },
    options?: { includeDrafts?: boolean; withCompleteness?: boolean },
  ) {
    return this.serializeVendor(vendor, options);
  }

  private async replaceAddOns(
    tx: Prisma.TransactionClient,
    vendorId: string,
    addOns: UpsertVendorAddOnBody[],
  ) {
    const keepIds: string[] = [];
    const idMap = new Map<string, string>();

    for (const addOn of addOns) {
      if (addOn.id) {
        const updated = await tx.vendorAddOn.update({
          where: { id: addOn.id },
          data: {
            name: addOn.name,
            description: addOn.description ?? null,
            pricingMode: addOn.pricingMode,
            priceLkr: addOn.priceLkr ?? null,
          },
        });
        keepIds.push(updated.id);
        idMap.set(addOn.id, updated.id);
        if (addOn.clientKey) idMap.set(addOn.clientKey, updated.id);
      } else {
        const created = await tx.vendorAddOn.create({
          data: {
            vendorId,
            name: addOn.name,
            description: addOn.description ?? null,
            pricingMode: addOn.pricingMode,
            priceLkr: addOn.priceLkr ?? null,
          },
        });
        keepIds.push(created.id);
        idMap.set(created.id, created.id);
        if (addOn.clientKey) idMap.set(addOn.clientKey, created.id);
      }
    }

    await tx.vendorAddOn.deleteMany({
      where: { vendorId, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
    });

    return idMap;
  }

  private async replacePackages(
    tx: Prisma.TransactionClient,
    vendorId: string,
    packages: UpsertVendorPackageBody[],
    addOnIdMap: Map<string, string>,
  ) {
    const popularCount = packages.filter((pkg) => pkg.badge === "POPULAR" && pkg.status === "PUBLISHED").length;
    if (popularCount > 1) {
      throw new BadRequestException("Only one Popular package is allowed");
    }

    const knownAddOnIds = new Set([...addOnIdMap.keys(), ...addOnIdMap.values()]);
    const keepIds: string[] = [];
    for (const [index, pkg] of packages.entries()) {
      const connectIds = (pkg.addOnIds ?? [])
        .map((id) => addOnIdMap.get(id) ?? id)
        .filter((id, i, arr) => arr.indexOf(id) === i && knownAddOnIds.has(id));

      const base = {
        name: pkg.name,
        tier: pkg.tier ?? null,
        pricingMode: pkg.pricingMode,
        priceLkr: pkg.pricingMode === "ON_REQUEST" ? null : (pkg.priceLkr ?? null),
        priceMaxLkr: pkg.pricingMode === "RANGE" ? (pkg.priceMaxLkr ?? null) : null,
        description: pkg.description ?? null,
        status: pkg.status,
        sortOrder: pkg.sortOrder ?? index,
        badge: pkg.badge ?? null,
        inclusions: pkg.inclusions ?? [],
        exclusions: pkg.exclusions ?? [],
        eventTypes: pkg.eventTypes ?? [],
        durationHours: pkg.durationHours ?? null,
        guestMin: pkg.guestMin ?? null,
        guestMax: pkg.guestMax ?? null,
        photoUrls: pkg.photoUrls ?? [],
        bestFor: pkg.bestFor ?? null,
      };

      if (pkg.id) {
        const updated = await tx.vendorPackage.update({
          where: { id: pkg.id },
          data: {
            ...base,
            addOns: { set: connectIds.map((id) => ({ id })) },
          },
        });
        keepIds.push(updated.id);
      } else {
        const created = await tx.vendorPackage.create({
          data: {
            vendorId,
            ...base,
            addOns: { connect: connectIds.map((id) => ({ id })) },
          },
        });
        keepIds.push(created.id);
      }
    }

    await tx.vendorPackage.deleteMany({
      where: { vendorId, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
    });
  }

  private async replaceMediaProjects(
    tx: Prisma.TransactionClient,
    vendorId: string,
    projects: UpsertVendorMediaProjectBody[],
  ) {
    const keepIds: string[] = [];

    for (const [index, project] of projects.entries()) {
      const eventDate = project.eventDate ? new Date(project.eventDate) : null;
      const base = {
        title: project.title,
        description: project.description ?? null,
        coverUrl: project.coverUrl ?? null,
        eventDate: eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate : null,
        sortOrder: project.sortOrder ?? index,
      };

      let projectId: string;
      if (project.id) {
        const existing = await tx.vendorMediaProject.findFirst({
          where: { id: project.id, vendorId },
        });
        if (existing) {
          const updated = await tx.vendorMediaProject.update({
            where: { id: existing.id },
            data: base,
          });
          projectId = updated.id;
        } else {
          const created = await tx.vendorMediaProject.create({
            data: { vendorId, ...base },
          });
          projectId = created.id;
        }
      } else {
        const created = await tx.vendorMediaProject.create({
          data: { vendorId, ...base },
        });
        projectId = created.id;
      }
      keepIds.push(projectId);

      const itemKeepIds: string[] = [];
      for (const [itemIndex, item] of (project.items ?? []).entries()) {
        if (item.id) {
          const existingItem = await tx.vendorMediaItem.findFirst({
            where: { id: item.id, projectId },
          });
          if (existingItem) {
            const updated = await tx.vendorMediaItem.update({
              where: { id: existingItem.id },
              data: { url: item.url, sortOrder: item.sortOrder ?? itemIndex },
            });
            itemKeepIds.push(updated.id);
            continue;
          }
        }
        const created = await tx.vendorMediaItem.create({
          data: {
            projectId,
            url: item.url,
            sortOrder: item.sortOrder ?? itemIndex,
          },
        });
        itemKeepIds.push(created.id);
      }

      await tx.vendorMediaItem.deleteMany({
        where: { projectId, ...(itemKeepIds.length ? { id: { notIn: itemKeepIds } } : {}) },
      });
    }

    await tx.vendorMediaProject.deleteMany({
      where: { vendorId, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
    });
  }

  private async replaceVideos(
    tx: Prisma.TransactionClient,
    vendorId: string,
    videos: UpsertVendorVideoBody[],
  ) {
    const keepIds: string[] = [];
    for (const [index, video] of videos.entries()) {
      const base = {
        url: video.url,
        title: video.title ?? null,
        sortOrder: video.sortOrder ?? index,
      };
      if (video.id) {
        const existing = await tx.vendorVideo.findFirst({
          where: { id: video.id, vendorId },
        });
        if (existing) {
          const updated = await tx.vendorVideo.update({
            where: { id: existing.id },
            data: base,
          });
          keepIds.push(updated.id);
          continue;
        }
      }
      const created = await tx.vendorVideo.create({
        data: { vendorId, ...base },
      });
      keepIds.push(created.id);
    }

    await tx.vendorVideo.deleteMany({
      where: { vendorId, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
    });
  }

  private async syncStartingPrice(tx: Prisma.TransactionClient, vendorId: string) {
    const vendor = await tx.vendor.findUniqueOrThrow({ where: { id: vendorId } });
    const published = await tx.vendorPackage.findMany({
      where: { vendorId, status: "PUBLISHED", priceLkr: { not: null } },
      orderBy: { priceLkr: "asc" },
      take: 1,
    });
    if (published[0]?.priceLkr != null && vendor.startingPriceLkr == null) {
      await tx.vendor.update({
        where: { id: vendorId },
        data: { startingPriceLkr: published[0].priceLkr },
      });
    }
  }

  private lightInclude() {
    return {
      categoryType: {
        include: {
          attributes: {
            where: { status: "ACTIVE" as const },
            select: {
              id: true,
              key: true,
              required: true,
              valueType: true,
              showOnProfile: true,
              status: true,
            },
          },
        },
      },
      attributeValues: {
        include: {
          definition: true,
          selections: { include: { option: true } },
        },
      },
      packages: {
        where: { status: "PUBLISHED" as const },
        orderBy: [{ sortOrder: "asc" as const }, { priceLkr: "asc" as const }],
        include: { addOns: true },
      },
      addOns: true,
      mediaProjects: {
        orderBy: [{ sortOrder: "asc" as const }],
        include: { items: { orderBy: [{ sortOrder: "asc" as const }] } },
      },
      videos: { orderBy: [{ sortOrder: "asc" as const }] },
    };
  }

  private fullInclude() {
    return {
      categoryType: {
        include: {
          attributes: {
            where: { status: "ACTIVE" as const },
            select: {
              id: true,
              key: true,
              required: true,
              valueType: true,
              showOnProfile: true,
              status: true,
            },
          },
        },
      },
      attributeValues: {
        include: {
          definition: true,
          selections: { include: { option: true } },
        },
      },
      packages: {
        orderBy: [{ sortOrder: "asc" as const }, { priceLkr: "asc" as const }],
        include: { addOns: true },
      },
      addOns: true,
      reviews: { orderBy: { createdAt: "desc" as const } },
      mediaProjects: {
        orderBy: [{ sortOrder: "asc" as const }],
        include: { items: { orderBy: [{ sortOrder: "asc" as const }] } },
      },
      videos: { orderBy: [{ sortOrder: "asc" as const }] },
    };
  }

  private listWhere(category?: string, q?: string): Prisma.VendorWhereInput {
    return {
      listed: true,
      moderationStatus: { not: "HIDDEN" },
      categoryId: { not: null },
      categoryType: {
        status: "ACTIVE",
        ...(category ? { slug: category } : {}),
      },
      onboardingCompletedAt: { not: null },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { district: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }

  private async catalogWhere(query: VendorCatalogQuery): Promise<Prisma.VendorWhereInput> {
    const price =
      query.minPrice != null || query.maxPrice != null
        ? {
            showPricing: true,
            startingPriceLkr: {
              not: null,
              ...(query.minPrice != null ? { gte: query.minPrice } : {}),
              ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
            },
          }
        : {};

    const attrFilters = await this.attributeFiltersWhere(query.category, query.attrs);
    const andParts: Prisma.VendorWhereInput[] = [];
    if (attrFilters.AND && Array.isArray(attrFilters.AND)) {
      andParts.push(...attrFilters.AND);
    }
    if (query.q) {
      andParts.push({
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { city: { contains: query.q, mode: "insensitive" } },
          { district: { contains: query.q, mode: "insensitive" } },
          { description: { contains: query.q, mode: "insensitive" } },
        ],
      });
    }

    return {
      listed: true,
      moderationStatus: { not: "HIDDEN" },
      categoryId: { not: null },
      onboardingCompletedAt: { not: null },
      OR: [
        { subscription: null },
        { subscription: { status: { in: ["TRIAL", "ACTIVE", "GRACE", "COMPED"] } } },
      ],
      categoryType: {
        status: "ACTIVE",
        ...(query.category ? { slug: query.category } : {}),
      },
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
      ...(query.district ? { district: { equals: query.district, mode: "insensitive" } } : {}),
      ...(query.featured ? { featured: true } : {}),
      ...(query.verified ? { verified: true } : {}),
      ...(query.destination ? { destinationExperienced: true } : {}),
      ...(query.minRating != null ? { ratingAvg: { gte: query.minRating } } : {}),
      ...price,
      ...(andParts.length ? { AND: andParts } : {}),
    };
  }

  private async attributeFiltersWhere(
    categorySlug: string | undefined,
    attrs: VendorCatalogQuery["attrs"],
    excludeKey?: string,
  ): Promise<Prisma.VendorWhereInput> {
    if (!categorySlug || !attrs || !Object.keys(attrs).length) return {};

    const type = await this.prisma.vendorType.findFirst({
      where: { slug: categorySlug, status: "ACTIVE" },
      include: {
        attributes: {
          where: { status: "ACTIVE", filterable: true },
          include: { options: true },
        },
      },
    });
    if (!type) return {};

    const defByKey = new Map(type.attributes.map((d) => [d.key, d]));
    const and: Prisma.VendorWhereInput[] = [];

    for (const [key, raw] of Object.entries(attrs)) {
      if (excludeKey && key === excludeKey) continue;
      if (!this.isActiveAttrFilter(raw)) continue;
      const def = defByKey.get(key);
      if (!def) continue;
      const filter = this.singleAttrWhere(def, raw);
      if (filter) and.push(filter);
    }

    return and.length ? { AND: and } : {};
  }

  private isActiveAttrFilter(value: CatalogAttrValue | undefined): boolean {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return value.min !== undefined || value.max !== undefined;
    return true;
  }

  private singleAttrWhere(
    def: {
      id: string;
      valueType: string;
      options: Array<{ id: string; key: string; active: boolean }>;
    },
    raw: CatalogAttrValue,
  ): Prisma.VendorWhereInput | null {
    switch (def.valueType) {
      case "SELECT":
      case "MULTISELECT": {
        const keys = (Array.isArray(raw) ? raw : [raw])
          .map(String)
          .filter((k) => def.options.some((o) => o.active && o.key === k));
        if (!keys.length) return null;
        return {
          attributeSelections: {
            some: {
              option: {
                definitionId: def.id,
                key: { in: keys },
                active: true,
              },
            },
          },
        };
      }
      case "BOOLEAN": {
        const rawStr = Array.isArray(raw) ? raw[0] : typeof raw === "string" ? raw : null;
        const bool = rawStr === "true" || rawStr === "1";
        const isFalse = rawStr === "false" || rawStr === "0";
        if (!bool && !isFalse) return null;
        return {
          attributeValues: {
            some: {
              definitionId: def.id,
              booleanValue: bool,
            },
          },
        };
      }
      case "NUMBER": {
        if (typeof raw === "object" && !Array.isArray(raw)) {
          return {
            attributeValues: {
              some: {
                definitionId: def.id,
                numberValue: {
                  ...(raw.min != null ? { gte: raw.min } : {}),
                  ...(raw.max != null ? { lte: raw.max } : {}),
                },
              },
            },
          };
        }
        const num = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(num)) return null;
        return {
          attributeValues: {
            some: {
              definitionId: def.id,
              numberValue: num,
            },
          },
        };
      }
      case "RANGE": {
        const range = typeof raw === "object" && !Array.isArray(raw) ? raw : null;
        if (!range) return null;
        return {
          attributeValues: {
            some: {
              definitionId: def.id,
              ...(range.min != null ? { rangeMax: { gte: range.min } } : {}),
              ...(range.max != null ? { rangeMin: { lte: range.max } } : {}),
            },
          },
        };
      }
      default:
        return null;
    }
  }

  private async catalogAttributeFacets(
    query: VendorCatalogQuery,
  ): Promise<Record<string, Array<{ value: string; count: number }>>> {
    if (!query.category) return {};

    const type = await this.prisma.vendorType.findFirst({
      where: { slug: query.category, status: "ACTIVE" },
      include: {
        attributes: {
          where: { status: "ACTIVE", filterable: true },
          orderBy: [{ filterSortOrder: "asc" }, { sortOrder: "asc" }],
          include: {
            options: {
              where: { active: true },
              orderBy: [{ sortOrder: "asc" }],
            },
          },
        },
      },
    });
    if (!type) return {};

    const result: Record<string, Array<{ value: string; count: number }>> = {};

    await Promise.all(
      type.attributes.map(async (def) => {
        const baseWhere = await this.catalogWhere({
          ...query,
          attrs: query.attrs
            ? Object.fromEntries(Object.entries(query.attrs).filter(([k]) => k !== def.key))
            : undefined,
        });

        if (def.valueType === "SELECT" || def.valueType === "MULTISELECT") {
          const buckets = await Promise.all(
            def.options.map(async (opt) => {
              const count = await this.prisma.vendor.count({
                where: {
                  AND: [
                    baseWhere,
                    {
                      attributeSelections: {
                        some: { optionId: opt.id },
                      },
                    },
                  ],
                },
              });
              return { value: opt.key, count };
            }),
          );
          result[def.key] = buckets;
          return;
        }

        if (def.valueType === "BOOLEAN") {
          const [yes, no] = await Promise.all([
            this.prisma.vendor.count({
              where: {
                AND: [
                  baseWhere,
                  {
                    attributeValues: {
                      some: { definitionId: def.id, booleanValue: true },
                    },
                  },
                ],
              },
            }),
            this.prisma.vendor.count({
              where: {
                AND: [
                  baseWhere,
                  {
                    attributeValues: {
                      some: { definitionId: def.id, booleanValue: false },
                    },
                  },
                ],
              },
            }),
          ]);
          result[def.key] = [
            { value: "true", count: yes },
            { value: "false", count: no },
          ];
        }
      }),
    );

    return result;
  }

  private catalogOrderBy(sort: VendorSort): Prisma.VendorOrderByWithRelationInput[] {
    switch (sort) {
      case "rating":
        return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { name: "asc" }];
      case "price_asc":
        return [
          { showPricing: "desc" },
          { startingPriceLkr: { sort: "asc", nulls: "last" } },
          { name: "asc" },
        ];
      case "price_desc":
        return [
          { showPricing: "desc" },
          { startingPriceLkr: { sort: "desc", nulls: "last" } },
          { name: "asc" },
        ];
      case "name":
        return [{ name: "asc" }];
      default:
        return [{ featured: "desc" }, { ratingAvg: "desc" }, { name: "asc" }];
    }
  }

  private serializeVendor(
    vendor: {
      faqs: unknown;
      packages?: PackageRow[];
      addOns?: AddOnRow[];
      reviews?: ReviewRow[] | false;
      mediaProjects?: MediaProjectRow[];
      videos?: VideoRow[];
      categoryType?: CategoryTypeRow | null;
      categoryId?: string | null;
      onboardingCompletedAt?: Date | string | null;
      attributeValues?: AttrValueRow[];
      [key: string]: unknown;
    },
    options?: { includeDrafts?: boolean; withCompleteness?: boolean },
  ): Vendor {
    const {
      packages = [],
      addOns = [],
      reviews = [],
      mediaProjects = [],
      videos = [],
      faqs,
      categoryType,
      attributeValues = [],
      ...rest
    } = vendor;
    const packageRows = options?.includeDrafts
      ? packages
      : packages.filter((pkg) => pkg.status === "PUBLISHED");
    const showPricing = rest.showPricing !== false;
    const listed = rest.listed !== false;
    const redactPricing = !options?.includeDrafts && !showPricing;

    const serializedPackages = packageRows.map((pkg) => ({
      id: pkg.id,
      vendorId: pkg.vendorId,
      tier: pkg.tier,
      name: pkg.name,
      pricingMode: pkg.pricingMode,
      priceLkr: redactPricing ? null : pkg.priceLkr,
      priceMaxLkr: redactPricing ? null : pkg.priceMaxLkr,
      description: pkg.description,
      status: pkg.status,
      sortOrder: pkg.sortOrder,
      badge: pkg.badge,
      inclusions: pkg.inclusions,
      exclusions: pkg.exclusions,
      eventTypes: pkg.eventTypes,
      durationHours: pkg.durationHours,
      guestMin: pkg.guestMin,
      guestMax: pkg.guestMax,
      photoUrls: pkg.photoUrls,
      bestFor: pkg.bestFor,
      addOnIds: pkg.addOns?.map((item) => item.id) ?? [],
      addOns: (pkg.addOns ?? []).map((item) => this.serializeAddOn(item, redactPricing)),
    }));

    const reviewRows = Array.isArray(reviews) ? reviews.filter((review) => !review.hidden) : [];
    const valuesRecord = valuesRecordFromRows(attributeValues);
    const defsForCompleteness =
      categoryType?.attributes?.length
        ? categoryType.attributes
        : attributeValues.map((v) => v.definition);
    const attributeCompleteness = computeAttributeCompleteness(defsForCompleteness, valuesRecord);
    const attributes = profileChipsFromValues(
      attributeValues.map((row) => row.definition),
      attributeValues,
    );

    const result: Vendor = {
      ...(rest as unknown as Vendor),
      category: (categoryType?.slug ?? "") as Vendor["category"],
      categoryId: vendor.categoryId ?? null,
      galleryLayout: categoryType?.galleryLayout ?? "default",
      onboardingCompletedAt:
        vendor.onboardingCompletedAt instanceof Date
          ? vendor.onboardingCompletedAt.toISOString()
          : ((vendor.onboardingCompletedAt as string | null | undefined) ?? null),
      attributeCompleteness,
      attributes,
      priceDisplayMode: (rest.priceDisplayMode as Vendor["priceDisplayMode"]) ?? "FROM",
      showPricing,
      listed,
      startingPriceLkr: redactPricing ? null : ((rest.startingPriceLkr as number | null | undefined) ?? null),
      typicalSpendLkr: redactPricing ? null : ((rest.typicalSpendLkr as number | null | undefined) ?? null),
      moderationStatus: (rest.moderationStatus as Vendor["moderationStatus"]) ?? "PENDING",
      moderationNote: (rest.moderationNote as string | null | undefined) ?? null,
      verifiedAt:
        rest.verifiedAt instanceof Date
          ? rest.verifiedAt.toISOString()
          : ((rest.verifiedAt as string | null | undefined) ?? null),
      featuredAt:
        rest.featuredAt instanceof Date
          ? rest.featuredAt.toISOString()
          : ((rest.featuredAt as string | null | undefined) ?? null),
      hiddenAt:
        rest.hiddenAt instanceof Date
          ? rest.hiddenAt.toISOString()
          : ((rest.hiddenAt as string | null | undefined) ?? null),
      faqs: Array.isArray(faqs) ? (faqs as Vendor["faqs"]) : [],
      packages: serializedPackages,
      addOns: addOns.map((item) => this.serializeAddOn(item, redactPricing)),
      mediaProjects: mediaProjects.map((project) => ({
        id: project.id,
        vendorId: project.vendorId,
        title: project.title,
        description: project.description,
        coverUrl: project.coverUrl,
        eventDate: project.eventDate?.toISOString() ?? null,
        sortOrder: project.sortOrder,
        items: (project.items ?? []).map((item) => ({
          id: item.id,
          url: item.url,
          sortOrder: item.sortOrder,
        })),
      })),
      videos: videos.map((video) => ({
        id: video.id,
        vendorId: video.vendorId,
        url: video.url,
        title: video.title,
        sortOrder: video.sortOrder,
      })),
      reviews: reviewRows.map((review) => ({
        ...review,
        hidden: review.hidden,
        createdAt: review.createdAt.toISOString(),
      })),
    };

    if (options?.withCompleteness) {
      result.completeness = vendorCompleteness(result);
    }
    return result;
  }

  private serializeAddOn(addOn: AddOnRow, redactPricing = false) {
    return {
      id: addOn.id,
      vendorId: addOn.vendorId,
      name: addOn.name,
      description: addOn.description,
      pricingMode: addOn.pricingMode,
      priceLkr: redactPricing ? null : addOn.priceLkr,
    };
  }

  private async buildOnboardingResponse(vendorId: string): Promise<VendorOnboardingResponse> {
    const vendor = await this.prisma.vendor.findUniqueOrThrow({
      where: { id: vendorId },
      include: {
        categoryType: {
          include: {
            attributes: {
              where: { status: "ACTIVE" },
              orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
              include: {
                options: {
                  where: { active: true },
                  orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
                },
              },
            },
          },
        },
        attributeValues: {
          include: {
            definition: true,
            selections: { include: { option: true } },
          },
        },
      },
    });

    const type = vendor.categoryType
      ? serializeVendorType(vendor.categoryType, { includeAttributes: true, activeOnly: true })
      : null;

    const definitions = (vendor.categoryType?.attributes ?? [])
      .map((def) => serializeDefinition(def, { activeOptionsOnly: true, activeDefinitionsOnly: true }))
      .filter((def): def is NonNullable<typeof def> => def != null);

    const values = valuesRecordFromRows(vendor.attributeValues);
    const attributeCompleteness = computeAttributeCompleteness(definitions, values);

    return {
      type,
      definitions: {
        required: definitions.filter((def) => def.required),
        optional: definitions.filter((def) => !def.required),
      },
      values,
      complete:
        Boolean(type) && attributeCompleteness.requiredDone === attributeCompleteness.requiredTotal,
      attributeCompleteness,
    };
  }

  private async pruneAttributeValuesForType(
    tx: Prisma.TransactionClient,
    vendorId: string,
    typeId: string,
  ) {
    const keepDefIds = (
      await tx.vendorAttributeDefinition.findMany({
        where: { OR: [{ typeId: null }, { typeId }] },
        select: { id: true },
      })
    ).map((row) => row.id);

    await tx.vendorAttributeValue.deleteMany({
      where: {
        vendorId,
        ...(keepDefIds.length ? { definitionId: { notIn: keepDefIds } } : {}),
      },
    });
  }

  private async upsertAttributeValue(
    tx: Prisma.TransactionClient,
    vendorId: string,
    def: {
      id: string;
      valueType: string;
      maxSelect: number | null;
      options: Array<{ id: string; key: string; active: boolean }>;
    },
    answer: VendorAttributeAnswerValue & { key: string },
  ) {
    if (def.valueType === "SELECT" || def.valueType === "MULTISELECT") {
      if (!("optionKeys" in answer)) {
        throw new BadRequestException(`Attribute ${answer.key} expects optionKeys`);
      }
      const byKey = new Map(def.options.filter((opt) => opt.active).map((opt) => [opt.key, opt]));
      const selected = answer.optionKeys
        .map((key) => byKey.get(key))
        .filter((opt): opt is { id: string; key: string; active: boolean } => Boolean(opt));
      if (def.valueType === "SELECT" && selected.length > 1) {
        throw new BadRequestException(`Attribute ${answer.key} allows one option`);
      }
      if (def.maxSelect != null && selected.length > def.maxSelect) {
        throw new BadRequestException(`Attribute ${answer.key} allows at most ${def.maxSelect} options`);
      }

      const value = await tx.vendorAttributeValue.upsert({
        where: { vendorId_definitionId: { vendorId, definitionId: def.id } },
        create: { vendorId, definitionId: def.id },
        update: {
          booleanValue: null,
          numberValue: null,
          rangeMin: null,
          rangeMax: null,
          textValue: null,
        },
      });
      await tx.vendorAttributeSelection.deleteMany({ where: { valueId: value.id } });
      if (selected.length) {
        await tx.vendorAttributeSelection.createMany({
          data: selected.map((opt) => ({
            vendorId,
            valueId: value.id,
            optionId: opt.id,
          })),
        });
      }
      return;
    }

    if (def.valueType === "BOOLEAN") {
      if (!("boolean" in answer)) {
        throw new BadRequestException(`Attribute ${answer.key} expects boolean`);
      }
      await tx.vendorAttributeValue.upsert({
        where: { vendorId_definitionId: { vendorId, definitionId: def.id } },
        create: { vendorId, definitionId: def.id, booleanValue: answer.boolean },
        update: {
          booleanValue: answer.boolean,
          numberValue: null,
          rangeMin: null,
          rangeMax: null,
          textValue: null,
        },
      });
      return;
    }

    if (def.valueType === "NUMBER") {
      if (!("number" in answer)) {
        throw new BadRequestException(`Attribute ${answer.key} expects number`);
      }
      await tx.vendorAttributeValue.upsert({
        where: { vendorId_definitionId: { vendorId, definitionId: def.id } },
        create: { vendorId, definitionId: def.id, numberValue: answer.number },
        update: {
          numberValue: answer.number,
          booleanValue: null,
          rangeMin: null,
          rangeMax: null,
          textValue: null,
        },
      });
      return;
    }

    if (def.valueType === "RANGE") {
      if (!("range" in answer)) {
        throw new BadRequestException(`Attribute ${answer.key} expects range`);
      }
      await tx.vendorAttributeValue.upsert({
        where: { vendorId_definitionId: { vendorId, definitionId: def.id } },
        create: {
          vendorId,
          definitionId: def.id,
          rangeMin: answer.range.min ?? null,
          rangeMax: answer.range.max ?? null,
        },
        update: {
          rangeMin: answer.range.min ?? null,
          rangeMax: answer.range.max ?? null,
          booleanValue: null,
          numberValue: null,
          textValue: null,
        },
      });
      return;
    }

    if (def.valueType === "TEXT") {
      if (!("text" in answer)) {
        throw new BadRequestException(`Attribute ${answer.key} expects text`);
      }
      await tx.vendorAttributeValue.upsert({
        where: { vendorId_definitionId: { vendorId, definitionId: def.id } },
        create: { vendorId, definitionId: def.id, textValue: answer.text },
        update: {
          textValue: answer.text,
          booleanValue: null,
          numberValue: null,
          rangeMin: null,
          rangeMax: null,
        },
      });
    }
  }
}
