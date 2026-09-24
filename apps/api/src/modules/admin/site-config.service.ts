import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaService } from "@ceylonweddings/database";
import {
  DEFAULT_CMS_PAGES,
  DEFAULT_CONSULTATION_SETTINGS,
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_HOMEPAGE,
  FEATURE_FLAG_CATALOG,
  cmsPageSlugSchema,
  consultationSettingsSchema,
  siteBrandingSchema,
  siteHomepageSchema,
  siteOnboardingPresentationSchema,
  type CmsPage,
  type CmsPageSlug,
  type ConsultationSettings,
  type PublicAward,
  type PublicFlags,
  type PublicSiteConfig,
  type SiteConfig,
  type SiteOnboardingPresentation,
  type UpdateSiteConfigBody,
  type UpsertCmsPageBody,
  type User,
} from "@ceylonweddings/contracts";
import { AdminAccessService } from "./admin-access.service";
import { isFeatureEnabled } from "./feature-flag.util";

/** Stored decoration JSON is dropped rather than thrown on if it no longer matches the schema. */
function parseOnboarding(value: unknown): SiteOnboardingPresentation | null {
  if (value == null) return null;
  const parsed = siteOnboardingPresentationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Rows written before consultations existed fall back to the defaults. */
export function parseConsultationSettings(value: unknown): ConsultationSettings {
  if (value == null) return DEFAULT_CONSULTATION_SETTINGS;
  const parsed = consultationSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_CONSULTATION_SETTINGS;
}

@Injectable()
export class SiteConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AdminAccessService,
  ) {}

  async ensureFlagCatalog() {
    for (const flag of FEATURE_FLAG_CATALOG) {
      await this.prisma.featureFlag.upsert({
        where: { key: flag.key },
        create: {
          key: flag.key,
          enabled: flag.defaultEnabled,
          description: flag.description,
        },
        update: {
          description: flag.description,
        },
      });
    }
  }

  async ensureSiteDefaults() {
    const existing = await this.prisma.siteConfig.findUnique({ where: { id: "default" } });
    if (!existing) {
      await this.prisma.siteConfig.create({
        data: {
          id: "default",
          branding: DEFAULT_SITE_BRANDING,
          homepage: DEFAULT_SITE_HOMEPAGE,
          consultations: DEFAULT_CONSULTATION_SETTINGS,
        },
      });
    }
    for (const page of DEFAULT_CMS_PAGES) {
      await this.prisma.cmsPage.upsert({
        where: { slug_locale: { slug: page.slug, locale: "en" } },
        create: {
          slug: page.slug,
          title: page.title,
          excerpt: page.excerpt,
          body: page.body,
          locale: "en",
          status: "PUBLISHED",
          seo: page.seo,
        },
        update: {},
      });
    }
  }

  async getSiteConfig(user: User): Promise<SiteConfig> {
    this.access.assertAdmin(user);
    await this.ensureSiteDefaults();
    const row = await this.prisma.siteConfig.findUniqueOrThrow({ where: { id: "default" } });
    return this.serializeSiteConfig(row);
  }

  async updateSiteConfig(user: User, body: UpdateSiteConfigBody, ip?: string): Promise<SiteConfig> {
    this.access.assertAdmin(user);
    const branding = siteBrandingSchema.parse(body.branding);
    const homepage = siteHomepageSchema.parse(body.homepage);
    const onboarding =
      body.onboarding === undefined
        ? undefined
        : body.onboarding === null
          ? null
          : siteOnboardingPresentationSchema.parse(body.onboarding);
    const consultations =
      body.consultations === undefined ? undefined : consultationSettingsSchema.parse(body.consultations);
    const row = await this.prisma.siteConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        branding,
        homepage,
        onboarding: (onboarding ?? null) as Prisma.InputJsonValue,
        consultations: (consultations ?? DEFAULT_CONSULTATION_SETTINGS) as Prisma.InputJsonValue,
        updatedById: user.id,
      },
      update: {
        branding,
        homepage,
        ...(onboarding !== undefined
          ? { onboarding: (onboarding ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(consultations !== undefined
          ? { consultations: consultations as Prisma.InputJsonValue }
          : {}),
        updatedById: user.id,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "site_config.update",
      entityType: "SITE_CONFIG",
      entityId: row.id,
      after: { updatedById: user.id },
      ip,
    });
    return this.serializeSiteConfig(row);
  }

  async listCmsPages(user: User): Promise<CmsPage[]> {
    this.access.assertAdmin(user);
    await this.ensureSiteDefaults();
    const rows = await this.prisma.cmsPage.findMany({
      where: { locale: "en" },
      orderBy: { slug: "asc" },
    });
    return rows.map((row) => this.serializeCmsPage(row));
  }

  async getCmsPage(user: User, slug: string): Promise<CmsPage> {
    this.access.assertAdmin(user);
    await this.ensureSiteDefaults();
    const parsed = cmsPageSlugSchema.parse(slug);
    const row = await this.prisma.cmsPage.findUnique({
      where: { slug_locale: { slug: parsed, locale: "en" } },
    });
    if (!row) throw new NotFoundException("Page not found");
    return this.serializeCmsPage(row);
  }

  async upsertCmsPage(user: User, slug: string, body: UpsertCmsPageBody, ip?: string): Promise<CmsPage> {
    this.access.assertAdmin(user);
    const parsed = cmsPageSlugSchema.parse(slug);
    const locale = body.locale ?? "en";
    const row = await this.prisma.cmsPage.upsert({
      where: { slug_locale: { slug: parsed, locale } },
      create: {
        slug: parsed,
        title: body.title,
        excerpt: body.excerpt ?? null,
        body: body.body,
        locale,
        status: body.status,
        seo: body.seo ?? undefined,
      },
      update: {
        title: body.title,
        excerpt: body.excerpt ?? null,
        body: body.body,
        status: body.status,
        seo: body.seo ?? undefined,
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "cms_page.upsert",
      entityType: "CMS_PAGE",
      entityId: row.id,
      after: { slug: row.slug, status: row.status },
      ip,
    });
    return this.serializeCmsPage(row);
  }

  async publicSiteConfig(): Promise<PublicSiteConfig> {
    await this.ensureSiteDefaults();
    const row = await this.prisma.siteConfig.findUnique({ where: { id: "default" } });
    const branding = siteBrandingSchema.parse(row?.branding ?? DEFAULT_SITE_BRANDING);
    const homepage = siteHomepageSchema.parse(row?.homepage ?? DEFAULT_SITE_HOMEPAGE);
    return { branding, homepage, onboarding: parseOnboarding(row?.onboarding) };
  }

  /** Read without admin auth so the public consultation flow can build availability. */
  async consultationSettings(): Promise<ConsultationSettings> {
    const row = await this.prisma.siteConfig.findUnique({
      where: { id: "default" },
      select: { consultations: true },
    });
    return parseConsultationSettings(row?.consultations);
  }

  async publicPage(slug: string): Promise<CmsPage> {
    const parsed = cmsPageSlugSchema.safeParse(slug);
    if (!parsed.success) throw new NotFoundException("Page not found");
    await this.ensureSiteDefaults();
    const row = await this.prisma.cmsPage.findFirst({
      where: { slug: parsed.data, locale: "en", status: "PUBLISHED" },
    });
    if (!row) throw new NotFoundException("Page not found");
    return this.serializeCmsPage(row);
  }

  async publicFlags(): Promise<PublicFlags> {
    await this.ensureFlagCatalog();
    const rows = await this.prisma.featureFlag.findMany({
      where: { key: { in: FEATURE_FLAG_CATALOG.map((f) => f.key) } },
    });
    const byKey = new Map(rows.map((row) => [row.key, row.enabled]));
    const flags: PublicFlags = {};
    for (const flag of FEATURE_FLAG_CATALOG) {
      flags[flag.key] = byKey.get(flag.key) ?? flag.defaultEnabled;
    }
    return flags;
  }

  async publicAwards(year?: number): Promise<PublicAward[]> {
    const awardsPublic = await isFeatureEnabled(this.prisma, "awards.public");
    if (!awardsPublic) return [];

    const targetYear = year ?? new Date().getFullYear();
    const rows = await this.prisma.awardNomination.findMany({
      where: {
        year: targetYear,
        status: { in: ["WINNER", "SHORTLISTED"] },
      },
      orderBy: [{ status: "asc" }, { categoryId: "asc" }],
      include: {
        category: { select: { slug: true } },
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            district: true,
            photoUrl: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      year: row.year,
      category: row.category.slug,
      status: row.status as "SHORTLISTED" | "WINNER",
      notes: row.notes,
      vendor: {
        id: row.vendor.id,
        name: row.vendor.name,
        slug: row.vendor.slug,
        city: row.vendor.city,
        district: row.vendor.district,
        coverUrl: row.vendor.photoUrl,
        ratingAvg: row.vendor.ratingAvg,
        reviewCount: row.vendor.ratingCount,
      },
    }));
  }

  private serializeSiteConfig(row: {
    id: string;
    branding: unknown;
    homepage: unknown;
    onboarding?: unknown;
    consultations?: unknown;
    updatedById: string | null;
    updatedAt: Date;
    createdAt: Date;
  }): SiteConfig {
    return {
      id: row.id,
      branding: siteBrandingSchema.parse(row.branding),
      homepage: siteHomepageSchema.parse(row.homepage),
      onboarding: parseOnboarding(row.onboarding),
      consultations: parseConsultationSettings(row.consultations),
      updatedById: row.updatedById,
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private serializeCmsPage(row: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body: string;
    locale: string;
    status: "DRAFT" | "PUBLISHED";
    seo: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): CmsPage {
    return {
      id: row.id,
      slug: row.slug as CmsPageSlug,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      locale: row.locale,
      status: row.status,
      seo:
        row.seo && typeof row.seo === "object"
          ? (row.seo as { title?: string; description?: string })
          : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
