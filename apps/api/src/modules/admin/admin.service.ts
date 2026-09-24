import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { Prisma, PrismaService } from "@ceylonweddings/database";
import {
  presentationGateFailures,
  vendorPassesPresentationGate,
  type AdminArticle,
  type AdminAuditListQuery,
  type AdminBulkVendorBody,
  type AdminInquiry,
  type AdminJobHealth,
  type AdminPatchUserBody,
  type AdminPatchVendorBody,
  type AdminReview,
  type AdminStats,
  type AdminUser,
  type AdminUserListQuery,
  type AdminVendorListQuery,
  type AdminWeddingListQuery,
  type AdminWeddingSummary,
  type AwardNomination,
  type CreateReportBody,
  type FeatureFlag,
  type FeaturedPlacement,
  type ResolveReportBody,
  type UpsertAdminArticleBody,
  type UpsertAwardNominationBody,
  type UpsertFeatureFlagBody,
  type UpsertFeaturedPlacementBody,
  type AuditLog,
  type User,
  type Vendor,
  FEATURE_FLAG_CATALOG,
} from "@ceylonweddings/contracts";
import { AdminAccessService } from "./admin-access.service";
import { VendorsService } from "../weddings/vendors.service";
import { SubscriptionService } from "../subscription/subscription.service";
import { SiteConfigService } from "./site-config.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AdminAccessService,
    private readonly vendors: VendorsService,
    private readonly subscription: SubscriptionService,
    private readonly siteConfig: SiteConfigService,
    @InjectQueue("email") private readonly emailQueue: Queue,
  ) {}

  async stats(user: User): Promise<AdminStats> {
    this.access.assertAdmin(user);
    const now = new Date();
    const [
      vendorsTotal,
      vendorsVerified,
      vendorsPendingVerify,
      vendorsFeatured,
      vendorsHidden,
      usersTotal,
      usersSuspended,
      reportsOpen,
      articlesDraft,
      inquiriesNew,
      weddingsTotal,
      placementsActive,
      allForGate,
    ] = await Promise.all([
      this.prisma.vendor.count(),
      this.prisma.vendor.count({ where: { verified: true } }),
      this.prisma.vendor.count({
        where: { verified: false, moderationStatus: { in: ["PENDING", "APPROVED"] } },
      }),
      this.prisma.vendor.count({ where: { featured: true } }),
      this.prisma.vendor.count({ where: { moderationStatus: "HIDDEN" } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "SUSPENDED" } }),
      this.prisma.report.count({ where: { status: "OPEN" } }),
      this.prisma.article.count({ where: { status: "DRAFT" } }),
      this.prisma.inquiry.count({ where: { status: "NEW" } }),
      this.prisma.wedding.count(),
      this.prisma.featuredPlacement.count({
        where: { startsAt: { lte: now }, endsAt: { gte: now } },
      }),
      this.prisma.vendor.findMany({
        where: { verified: true, featured: false, moderationStatus: { not: "HIDDEN" } },
        include: {
          packages: { select: { status: true } },
        },
      }),
    ]);

    const vendorsGateFailFeaturedCandidates = allForGate.filter(
      (vendor) => !vendorPassesPresentationGate(vendor as never),
    ).length;

    return {
      vendorsTotal,
      vendorsVerified,
      vendorsPendingVerify,
      vendorsFeatured,
      vendorsGateFailFeaturedCandidates,
      vendorsHidden,
      usersTotal,
      usersSuspended,
      reportsOpen,
      articlesDraft,
      inquiriesNew,
      weddingsTotal,
      placementsActive,
    };
  }

  async listVendors(user: User, query: AdminVendorListQuery): Promise<Vendor[]> {
    this.access.assertAdmin(user);
    const where: Prisma.VendorWhereInput = {
      ...(query.category ? { categoryType: { slug: query.category } } : {}),
      ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {}),
      ...(query.verified != null ? { verified: query.verified } : {}),
      ...(query.featured != null ? { featured: query.featured } : {}),
      ...(query.moderationStatus ? { moderationStatus: query.moderationStatus } : {}),
      ...(query.queue === "verify"
        ? { verified: false, moderationStatus: { in: ["PENDING", "APPROVED"] } }
        : {}),
      ...(query.queue === "picks"
        ? { verified: true, featured: false, moderationStatus: { not: "HIDDEN" } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { city: { contains: query.q, mode: "insensitive" } },
              { slug: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.vendor.findMany({
      where,
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: this.vendors.adminInclude(),
    });

    let vendors = rows.map((row) => this.vendors.serializePublic(row));
    if (query.gateReady === true) {
      vendors = vendors.filter((vendor) => vendorPassesPresentationGate(vendor));
    } else if (query.gateReady === false || query.queue === "picks") {
      if (query.gateReady === false) {
        vendors = vendors.filter((vendor) => !vendorPassesPresentationGate(vendor));
      }
    }
    return vendors;
  }

  async getVendor(user: User, id: string): Promise<{
    vendor: Vendor;
    gateFailures: string[];
    audit: AuditLog[];
  }> {
    this.access.assertAdmin(user);
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: this.vendors.adminInclude(),
    });
    if (!vendor) throw new NotFoundException("Vendor not found");
    const serialized = this.vendors.serializePublic(vendor, { includeDrafts: true, withCompleteness: true });
    const audit = await this.listAuditForEntity("VENDOR", id);
    return {
      vendor: serialized,
      gateFailures: presentationGateFailures(serialized),
      audit,
    };
  }

  async patchVendor(user: User, id: string, body: AdminPatchVendorBody, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.vendor.findUnique({
      where: { id },
      include: this.vendors.adminInclude(),
    });
    if (!existing) throw new NotFoundException("Vendor not found");
    const before = this.vendors.serializePublic(existing);

    if (body.featured === true && !vendorPassesPresentationGate(before)) {
      throw new BadRequestException(
        "Featured listings need stronger presentation (photos, description, WhatsApp, and a clear offer).",
      );
    }

    const data: Prisma.VendorUpdateInput = {};
    if (body.featured != null) {
      data.featured = body.featured;
      data.featuredAt = body.featured ? new Date() : null;
    }
    if (body.verified != null) {
      data.verified = body.verified;
      data.verifiedAt = body.verified ? new Date() : null;
      if (body.verified && body.moderationStatus == null) {
        data.moderationStatus = "APPROVED";
      }
    }
    if (body.moderationStatus != null) {
      data.moderationStatus = body.moderationStatus;
      if (body.moderationStatus === "HIDDEN") {
        data.hiddenAt = new Date();
        data.featured = false;
      }
      if (body.moderationStatus === "APPROVED") {
        data.verified = true;
        data.verifiedAt = new Date();
      }
      if (body.moderationStatus === "REJECTED") {
        data.verified = false;
        data.featured = false;
      }
    }
    if (body.moderationNote !== undefined) {
      data.moderationNote = body.moderationNote;
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data,
      include: this.vendors.adminInclude(),
    });
    const after = this.vendors.serializePublic(updated);
    await this.access.append({
      actorUserId: user.id,
      action: "vendor.patch",
      entityType: "VENDOR",
      entityId: id,
      before: {
        verified: before.verified,
        featured: before.featured,
        moderationStatus: before.moderationStatus,
        moderationNote: before.moderationNote,
      },
      after: {
        verified: after.verified,
        featured: after.featured,
        moderationStatus: after.moderationStatus,
        moderationNote: after.moderationNote,
      },
      ip,
    });
    return after;
  }

  async bulkVendors(user: User, body: AdminBulkVendorBody, ip?: string) {
    this.access.assertAdmin(user);
    const results: Vendor[] = [];
    for (const id of body.ids) {
      results.push(
        await this.patchVendor(
          user,
          id,
          { verified: body.verified, featured: body.featured },
          ip,
        ),
      );
    }
    return results;
  }

  async listUsers(user: User, query: AdminUserListQuery): Promise<AdminUser[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.user.findMany({
      where: {
        ...(query.role ? { role: query.role } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { email: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true } },
        _count: { select: { memberships: true, sessions: true } },
      },
    });
    return rows.map((row) => this.serializeUser(row));
  }

  async getUser(user: User, id: string): Promise<{
    user: AdminUser;
    vendor: { id: string; name: string; slug: string } | null;
    weddings: Array<{ id: string; slug: string; partnerOneName: string; partnerTwoName: string }>;
    sessions: Array<{ id: string; createdAt: string; expiresAt: string }>;
    audit: AuditLog[];
  }> {
    this.access.assertAdmin(user);
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, slug: true } },
        memberships: {
          include: {
            wedding: {
              select: {
                id: true,
                slug: true,
                partnerOneName: true,
                partnerTwoName: true,
              },
            },
          },
        },
        sessions: { orderBy: { createdAt: "desc" }, take: 20 },
        _count: { select: { memberships: true, sessions: true } },
      },
    });
    if (!row) throw new NotFoundException("User not found");
    const audit = await this.listAuditForEntity("USER", id);
    return {
      user: this.serializeUser(row),
      vendor: row.vendor,
      weddings: row.memberships.map((m) => m.wedding),
      sessions: row.sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
      audit,
    };
  }

  async patchUser(user: User, id: string, body: AdminPatchUserBody, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("User not found");

    if (body.role && existing.role === "ADMIN" && body.role !== "ADMIN") {
      const adminCount = await this.prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
      if (adminCount <= 1) {
        throw new BadRequestException("Cannot demote the last active admin");
      }
    }
    if (body.status === "SUSPENDED" && existing.role === "ADMIN") {
      const adminCount = await this.prisma.user.count({
        where: { role: "ADMIN", status: "ACTIVE", id: { not: id } },
      });
      if (adminCount < 1) {
        throw new BadRequestException("Cannot suspend the last active admin");
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(body.status != null ? { status: body.status } : {}),
        ...(body.role != null ? { role: body.role } : {}),
        ...(body.capabilities != null ? { capabilities: body.capabilities } : {}),
      },
      include: {
        vendor: { select: { id: true } },
        _count: { select: { memberships: true, sessions: true } },
      },
    });

    if (body.status === "SUSPENDED") {
      await this.prisma.session.deleteMany({ where: { userId: id } });
    }

    await this.access.append({
      actorUserId: user.id,
      action: "user.patch",
      entityType: "USER",
      entityId: id,
      before: { status: existing.status, role: existing.role, capabilities: existing.capabilities },
      after: { status: updated.status, role: updated.role, capabilities: updated.capabilities },
      ip,
    });

    return this.serializeUser(updated);
  }

  async revokeSessions(user: User, id: string, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("User not found");
    const result = await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.access.append({
      actorUserId: user.id,
      action: "user.revoke_sessions",
      entityType: "USER",
      entityId: id,
      after: { deleted: result.count },
      ip,
    });
    return { ok: true as const, deleted: result.count };
  }

  async listAudit(user: User, query: AdminAuditListQuery): Promise<AuditLog[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.auditLog.findMany({
      where: {
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
        ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
        ...(query.q
          ? {
              OR: [
                { action: { contains: query.q, mode: "insensitive" } },
                { entityType: { contains: query.q, mode: "insensitive" } },
                { entityId: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { actor: { select: { name: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      actorUserId: row.actorUserId,
      actorName: row.actor?.name ?? null,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      before: row.before as AuditLog["before"],
      after: row.after as AuditLog["after"],
      ip: row.ip,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listReports(user: User, status?: string) {
    this.access.assertAdmin(user);
    const rows = await this.prisma.report.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { name: true } } },
      take: 200,
    });
    return rows.map((row) => ({
      id: row.id,
      reporterUserId: row.reporterUserId,
      reporterName: row.reporter?.name ?? null,
      entityType: row.entityType,
      entityId: row.entityId,
      reason: row.reason,
      details: row.details,
      status: row.status,
      resolvedById: row.resolvedById,
      resolutionNote: row.resolutionNote,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async createReport(user: User | null, body: CreateReportBody) {
    const row = await this.prisma.report.create({
      data: {
        reporterUserId: user?.id ?? null,
        entityType: body.entityType,
        entityId: body.entityId,
        reason: body.reason,
        details: body.details ?? null,
      },
    });
    return {
      id: row.id,
      reporterUserId: row.reporterUserId,
      entityType: row.entityType,
      entityId: row.entityId,
      reason: row.reason,
      details: row.details,
      status: row.status,
      resolvedById: row.resolvedById,
      resolutionNote: row.resolutionNote,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async resolveReport(user: User, id: string, body: ResolveReportBody, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Report not found");
    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: body.status,
        resolutionNote: body.resolutionNote ?? null,
        resolvedById: user.id,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "report.resolve",
      entityType: "REPORT",
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status, resolutionNote: updated.resolutionNote },
      ip,
    });
    return {
      id: updated.id,
      reporterUserId: updated.reporterUserId,
      entityType: updated.entityType,
      entityId: updated.entityId,
      reason: updated.reason,
      details: updated.details,
      status: updated.status,
      resolvedById: updated.resolvedById,
      resolutionNote: updated.resolutionNote,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async listArticles(user: User): Promise<AdminArticle[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
    return rows.map((row) => this.serializeArticle(row));
  }

  async getArticle(user: User, id: string): Promise<AdminArticle> {
    this.access.assertAdmin(user);
    const row = await this.prisma.article.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Article not found");
    return this.serializeArticle(row);
  }

  async createArticle(user: User, body: UpsertAdminArticleBody, ip?: string) {
    this.access.assertAdmin(user);
    const publishedAt =
      body.status === "PUBLISHED"
        ? body.publishedAt
          ? new Date(body.publishedAt)
          : new Date()
        : body.publishedAt
          ? new Date(body.publishedAt)
          : null;
    const row = await this.prisma.article.create({
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt,
        body: body.body,
        category: body.category,
        coverUrl: body.coverUrl,
        locale: body.locale,
        featured: body.featured,
        status: body.status,
        vendorSlugs: body.vendorSlugs,
        authorUserId: user.id,
        publishedAt,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "article.create",
      entityType: "ARTICLE",
      entityId: row.id,
      after: { slug: row.slug, status: row.status },
      ip,
    });
    return this.serializeArticle(row);
  }

  async updateArticle(user: User, id: string, body: UpsertAdminArticleBody, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Article not found");
    const publishedAt =
      body.status === "PUBLISHED"
        ? body.publishedAt
          ? new Date(body.publishedAt)
          : existing.publishedAt ?? new Date()
        : body.publishedAt
          ? new Date(body.publishedAt)
          : null;
    const row = await this.prisma.article.update({
      where: { id },
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt,
        body: body.body,
        category: body.category,
        coverUrl: body.coverUrl,
        locale: body.locale,
        featured: body.featured,
        status: body.status,
        vendorSlugs: body.vendorSlugs,
        publishedAt,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "article.update",
      entityType: "ARTICLE",
      entityId: id,
      before: { slug: existing.slug, status: existing.status },
      after: { slug: row.slug, status: row.status },
      ip,
    });
    return this.serializeArticle(row);
  }

  async deleteArticle(user: User, id: string, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Article not found");
    await this.prisma.article.delete({ where: { id } });
    await this.access.append({
      actorUserId: user.id,
      action: "article.delete",
      entityType: "ARTICLE",
      entityId: id,
      before: { slug: existing.slug },
      ip,
    });
    return { ok: true as const };
  }

  async listWeddings(user: User, query: AdminWeddingListQuery): Promise<AdminWeddingSummary[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.wedding.findMany({
      where: query.q
        ? {
            OR: [
              { slug: { contains: query.q, mode: "insensitive" } },
              { partnerOneName: { contains: query.q, mode: "insensitive" } },
              { partnerTwoName: { contains: query.q, mode: "insensitive" } },
              { city: { contains: query.q, mode: "insensitive" } },
              { members: { some: { user: { email: { contains: query.q, mode: "insensitive" } } } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        members: { include: { user: { select: { email: true } } } },
        vendors: { where: { status: "BOOKED" } },
        _count: { select: { households: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      partnerOneName: row.partnerOneName,
      partnerTwoName: row.partnerTwoName,
      date: row.date?.toISOString() ?? null,
      city: row.city,
      district: row.district,
      memberEmails: row.members.map((m) => m.user.email),
      bookedVendorCount: row.vendors.length,
      guestHouseholdCount: row._count.households,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getWedding(user: User, id: string) {
    this.access.assertAdmin(user);
    const rows = await this.listWeddings(user, {});
    const summary = rows.find((row) => row.id === id);
    if (!summary) {
      const one = await this.prisma.wedding.findUnique({
        where: { id },
        include: {
          members: { include: { user: { select: { email: true } } } },
          vendors: { where: { status: "BOOKED" } },
          _count: { select: { households: true } },
        },
      });
      if (!one) throw new NotFoundException("Wedding not found");
      return {
        id: one.id,
        slug: one.slug,
        partnerOneName: one.partnerOneName,
        partnerTwoName: one.partnerTwoName,
        date: one.date?.toISOString() ?? null,
        city: one.city,
        district: one.district,
        memberEmails: one.members.map((m) => m.user.email),
        bookedVendorCount: one.vendors.length,
        guestHouseholdCount: one._count.households,
        createdAt: one.createdAt.toISOString(),
      };
    }
    return summary;
  }

  async listInquiries(user: User): Promise<AdminInquiry[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { vendor: true, wedding: true },
    });
    return rows.map((row) => ({
      id: row.id,
      message: row.message,
      status: row.status,
      whatsappUrl: row.whatsappUrl,
      preferredDate: row.preferredDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      vendorId: row.vendorId,
      vendorName: row.vendor.name,
      weddingId: row.weddingId,
      weddingSlug: row.wedding.slug,
      coupleNames: `${row.wedding.partnerOneName} & ${row.wedding.partnerTwoName}`,
    }));
  }

  async closeInquiry(user: User, id: string, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Inquiry not found");
    const updated = await this.prisma.inquiry.update({
      where: { id },
      data: { status: "CLOSED" },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "inquiry.close",
      entityType: "INQUIRY",
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status },
      ip,
    });
    return { ok: true as const };
  }

  async listReviews(user: User): Promise<AdminReview[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { vendor: { select: { name: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      vendorId: row.vendorId,
      vendorName: row.vendor.name,
      authorName: row.authorName,
      rating: row.rating,
      body: row.body,
      recommended: row.recommended,
      hidden: row.hidden,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async setReviewHidden(user: User, id: string, hidden: boolean, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Review not found");
    const updated = await this.prisma.review.update({
      where: { id },
      data: { hidden },
      include: { vendor: { select: { name: true } } },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "review.hide",
      entityType: "REVIEW",
      entityId: id,
      before: { hidden: existing.hidden },
      after: { hidden: updated.hidden },
      ip,
    });
    return {
      id: updated.id,
      vendorId: updated.vendorId,
      vendorName: updated.vendor.name,
      authorName: updated.authorName,
      rating: updated.rating,
      body: updated.body,
      recommended: updated.recommended,
      hidden: updated.hidden,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async listPlacements(user: User): Promise<FeaturedPlacement[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.featuredPlacement.findMany({
      orderBy: [{ startsAt: "desc" }],
      include: {
        vendor: { select: { name: true } },
        category: { select: { slug: true } },
      },
    });
    return rows.map((row) => this.serializePlacement(row));
  }

  async createPlacement(user: User, body: UpsertFeaturedPlacementBody, ip?: string) {
    this.access.assertAdmin(user);
    const vendor = await this.prisma.vendor.findUnique({ where: { id: body.vendorId } });
    if (!vendor) throw new NotFoundException("Vendor not found");
    const categoryId = await this.resolveCategoryId(body.category);
    const row = await this.prisma.featuredPlacement.create({
      data: {
        vendorId: body.vendorId,
        city: body.city ?? null,
        categoryId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        priority: body.priority,
        source: body.source,
        notes: body.notes ?? null,
      },
      include: {
        vendor: { select: { name: true } },
        category: { select: { slug: true } },
      },
    });
    await this.syncVendorFeaturedFlag(body.vendorId);
    await this.access.append({
      actorUserId: user.id,
      action: "placement.create",
      entityType: "FEATURED_PLACEMENT",
      entityId: row.id,
      after: { vendorId: row.vendorId, startsAt: row.startsAt.toISOString(), endsAt: row.endsAt.toISOString() },
      ip,
    });
    return this.serializePlacement(row);
  }

  async updatePlacement(user: User, id: string, body: UpsertFeaturedPlacementBody, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.featuredPlacement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Placement not found");
    const categoryId = await this.resolveCategoryId(body.category);
    const row = await this.prisma.featuredPlacement.update({
      where: { id },
      data: {
        vendorId: body.vendorId,
        city: body.city ?? null,
        categoryId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        priority: body.priority,
        source: body.source,
        notes: body.notes ?? null,
      },
      include: {
        vendor: { select: { name: true } },
        category: { select: { slug: true } },
      },
    });
    await this.syncVendorFeaturedFlag(body.vendorId);
    if (existing.vendorId !== body.vendorId) {
      await this.syncVendorFeaturedFlag(existing.vendorId);
    }
    await this.access.append({
      actorUserId: user.id,
      action: "placement.update",
      entityType: "FEATURED_PLACEMENT",
      entityId: id,
      ip,
    });
    return this.serializePlacement(row);
  }

  async deletePlacement(user: User, id: string, ip?: string) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.featuredPlacement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Placement not found");
    await this.prisma.featuredPlacement.delete({ where: { id } });
    await this.syncVendorFeaturedFlag(existing.vendorId);
    await this.access.append({
      actorUserId: user.id,
      action: "placement.delete",
      entityType: "FEATURED_PLACEMENT",
      entityId: id,
      ip,
    });
    return { ok: true as const };
  }

  async listFlags(user: User): Promise<FeatureFlag[]> {
    this.access.assertAdmin(user);
    await this.siteConfig.ensureFlagCatalog();
    const rows = await this.prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
    const catalogKeys = new Set(FEATURE_FLAG_CATALOG.map((f) => f.key));
    const catalog = rows.filter((row) => catalogKeys.has(row.key as (typeof FEATURE_FLAG_CATALOG)[number]["key"]));
    const custom = rows.filter((row) => !catalogKeys.has(row.key as (typeof FEATURE_FLAG_CATALOG)[number]["key"]));
    return [...catalog, ...custom].map((row) => this.serializeFlag(row));
  }

  async upsertFlag(user: User, body: UpsertFeatureFlagBody, ip?: string) {
    this.access.assertAdmin(user);
    const row = await this.prisma.featureFlag.upsert({
      where: { key: body.key },
      create: {
        key: body.key,
        enabled: body.enabled,
        description: body.description ?? null,
      },
      update: {
        enabled: body.enabled,
        description: body.description ?? null,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "feature_flag.upsert",
      entityType: "FEATURE_FLAG",
      entityId: row.id,
      after: { key: row.key, enabled: row.enabled },
      ip,
    });
    return this.serializeFlag(row);
  }

  async listAwards(user: User): Promise<AwardNomination[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.awardNomination.findMany({
      orderBy: [{ year: "desc" }, { categoryId: "asc" }],
      include: {
        vendor: { select: { name: true } },
        category: { select: { slug: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      vendorId: row.vendorId,
      vendorName: row.vendor.name,
      year: row.year,
      category: row.category.slug,
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async upsertAward(user: User, body: UpsertAwardNominationBody, ip?: string) {
    this.access.assertAdmin(user);
    const categoryId = await this.resolveCategoryId(body.category);
    if (!categoryId) throw new BadRequestException(`Unknown vendor type: ${body.category}`);
    const row = await this.prisma.awardNomination.upsert({
      where: {
        vendorId_year_categoryId: {
          vendorId: body.vendorId,
          year: body.year,
          categoryId,
        },
      },
      create: {
        vendorId: body.vendorId,
        year: body.year,
        categoryId,
        status: body.status,
        notes: body.notes ?? null,
      },
      update: {
        status: body.status,
        notes: body.notes ?? null,
      },
      include: {
        vendor: { select: { name: true } },
        category: { select: { slug: true } },
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "award.upsert",
      entityType: "AWARD_NOMINATION",
      entityId: row.id,
      after: { status: row.status, year: row.year },
      ip,
    });
    return {
      id: row.id,
      vendorId: row.vendorId,
      vendorName: row.vendor.name,
      year: row.year,
      category: row.category.slug,
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async jobHealth(user: User): Promise<AdminJobHealth> {
    this.access.assertAdmin(user);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);
    return {
      emailQueue: { waiting, active, completed, failed, delayed },
    };
  }

  async analyticsSummary(user: User) {
    this.access.assertAdmin(user);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [profileViews7d, whatsappTaps7d, inquiries7d, articleViews7d] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { kind: "VENDOR_PROFILE_VIEW", createdAt: { gte: since } },
      }),
      this.prisma.analyticsEvent.count({
        where: { kind: "WHATSAPP_TAP", createdAt: { gte: since } },
      }),
      this.prisma.analyticsEvent.count({
        where: { kind: "INQUIRY_CREATED", createdAt: { gte: since } },
      }),
      this.prisma.analyticsEvent.count({
        where: { kind: "ARTICLE_VIEW", createdAt: { gte: since } },
      }),
    ]);
    return { profileViews7d, whatsappTaps7d, inquiries7d, articleViews7d };
  }

  async exportCsv(user: User, kind: "vendors" | "users") {
    this.access.assertAdmin(user);
    if (kind === "users") {
      const users = await this.listUsers(user, {});
      const header = "id,email,name,role,status,createdAt";
      const lines = users.map(
        (row) =>
          `${row.id},${csv(row.email)},${csv(row.name)},${row.role},${row.status},${row.createdAt}`,
      );
      return [header, ...lines].join("\n");
    }
    const vendors = await this.listVendors(user, {});
    const header = "id,name,slug,category,city,verified,featured,moderationStatus";
    const lines = vendors.map(
      (row) =>
        `${row.id},${csv(row.name)},${csv(row.slug)},${row.category},${csv(row.city)},${row.verified},${row.featured},${row.moderationStatus ?? ""}`,
    );
    return [header, ...lines].join("\n");
  }

  async impersonate(user: User, targetUserId: string, ip?: string) {
    this.access.assertAdmin(user);
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("User not found");
    if (target.role === "ADMIN") {
      throw new BadRequestException("Cannot impersonate another admin");
    }
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    const caps = dbUser?.capabilities ?? [];
    if (caps.length > 0 && !caps.includes("IMPERSONATE")) {
      throw new BadRequestException("Missing IMPERSONATE capability");
    }
    await this.access.append({
      actorUserId: user.id,
      action: "user.impersonate",
      entityType: "USER",
      entityId: targetUserId,
      after: { targetEmail: target.email },
      ip,
    });
    return {
      ok: true as const,
      target: {
        id: target.id,
        email: target.email,
        name: target.name,
        role: target.role,
      },
    };
  }

  private async syncVendorFeaturedFlag(vendorId: string) {
    const now = new Date();
    const active = await this.prisma.featuredPlacement.count({
      where: { vendorId, startsAt: { lte: now }, endsAt: { gte: now } },
    });
    if (active > 0) {
      await this.prisma.vendor.update({
        where: { id: vendorId },
        data: { featured: true, featuredAt: now },
      });
    }
  }

  private async listAuditForEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { name: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      actorUserId: row.actorUserId,
      actorName: row.actor?.name ?? null,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      before: row.before as AuditLog["before"],
      after: row.after as AuditLog["after"],
      ip: row.ip,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private serializeUser(row: {
    id: string;
    email: string;
    name: string;
    role: AdminUser["role"];
    status: AdminUser["status"];
    capabilities: AdminUser["capabilities"];
    totpEnabled?: boolean;
    phone?: string | null;
    createdAt: Date;
    vendor?: { id: string } | null;
    _count?: { memberships: number; sessions: number };
  }): AdminUser {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      capabilities: row.capabilities ?? [],
      totpEnabled: row.totpEnabled,
      phone: row.phone ?? null,
      createdAt: row.createdAt.toISOString(),
      vendorId: row.vendor?.id ?? null,
      weddingCount: row._count?.memberships,
      sessionCount: row._count?.sessions,
    };
  }

  private serializeArticle(row: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    category: AdminArticle["category"];
    coverUrl: string;
    locale: string;
    featured: boolean;
    status: AdminArticle["status"];
    vendorSlugs: string[];
    authorUserId: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminArticle {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      category: row.category,
      coverUrl: row.coverUrl,
      locale: row.locale,
      featured: row.featured,
      status: row.status,
      vendorSlugs: row.vendorSlugs ?? [],
      authorUserId: row.authorUserId,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private serializePlacement(row: {
    id: string;
    vendorId: string;
    city: string | null;
    categoryId?: string | null;
    category?: { slug: string } | FeaturedPlacement["category"] | null;
    startsAt: Date;
    endsAt: Date;
    priority: number;
    source: FeaturedPlacement["source"];
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    vendor?: { name: string };
  }): FeaturedPlacement {
    const categorySlug =
      row.category && typeof row.category === "object" && "slug" in row.category
        ? row.category.slug
        : typeof row.category === "string"
          ? row.category
          : null;
    return {
      id: row.id,
      vendorId: row.vendorId,
      vendorName: row.vendor?.name,
      city: row.city,
      category: categorySlug,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      priority: row.priority,
      source: row.source,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async resolveCategoryId(slug: string | null | undefined): Promise<string | null> {
    if (slug == null || slug === "") return null;
    const type = await this.prisma.vendorType.findUnique({ where: { slug } });
    if (!type) throw new BadRequestException(`Unknown vendor type: ${slug}`);
    return type.id;
  }

  async getVendorSubscription(user: User, vendorId: string) {
    this.access.assertAdmin(user);
    return this.subscription.getSubscriptionForVendor(vendorId);
  }

  async overrideVendorTrial(user: User, vendorId: string, trialEndsAt: string) {
    this.access.assertAdmin(user);
    return this.subscription.adminOverrideTrial(user.id, vendorId, trialEndsAt);
  }

  async grantVendorComped(user: User, vendorId: string, compedUntil?: string) {
    this.access.assertAdmin(user);
    return this.subscription.adminGrantComped(user.id, vendorId, compedUntil);
  }

  async activateVendorSubscription(
    user: User,
    vendorId: string,
    planId: string,
    interval: any,
    paymentRef?: string,
    notes?: string,
  ) {
    this.access.assertAdmin(user);
    return this.subscription.adminActivatePaid(user.id, vendorId, planId, interval, paymentRef, notes);
  }

  async suspendVendorSubscription(user: User, vendorId: string) {
    this.access.assertAdmin(user);
    return this.subscription.adminSuspend(user.id, vendorId);
  }

  private serializeFlag(row: {
    id: string;
    key: string;
    enabled: boolean;
    description: string | null;
    updatedAt: Date;
    createdAt: Date;
  }): FeatureFlag {
    return {
      id: row.id,
      key: row.key,
      enabled: row.enabled,
      description: row.description,
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
