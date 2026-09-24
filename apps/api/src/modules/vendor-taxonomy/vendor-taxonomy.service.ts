import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PrismaService } from "@ceylonweddings/database";
import type {
  CloneVendorTypeBody,
  CreateAttributeDefinitionBody,
  CreateAttributeOptionBody,
  CreateVendorTypeBody,
  ImportTaxonomyBody,
  PublicVendorTypeListItem,
  TaxonomyPack,
  UpdateAttributeDefinitionBody,
  UpdateAttributeOptionBody,
  UpdateVendorTypeBody,
  User,
  VendorAttributeDefinition,
  VendorType,
} from "@ceylonweddings/contracts";
import { AdminAccessService } from "../admin/admin-access.service";
import {
  asLocalized,
  asLocalizedOrNull,
  serializeDefinition,
  serializeVendorType,
} from "./attribute.util";

const CACHE_TTL_MS = 60_000;

const definitionInclude = {
  options: { orderBy: [{ sortOrder: "asc" as const }, { key: "asc" as const }] },
};

const typeInclude = {
  attributes: {
    orderBy: [{ sortOrder: "asc" as const }, { key: "asc" as const }],
    include: definitionInclude,
  },
};

@Injectable()
export class VendorTaxonomyService {
  private publicCache: { at: number; data: PublicVendorTypeListItem[] } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AdminAccessService,
  ) {}

  bustPublicCache() {
    this.publicCache = null;
  }

  async listPublicTypes(): Promise<PublicVendorTypeListItem[]> {
    const now = Date.now();
    if (this.publicCache && now - this.publicCache.at < CACHE_TTL_MS) {
      return this.publicCache.data;
    }

    const rows = await this.prisma.vendorType.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      include: {
        attributes: {
          where: { status: "ACTIVE", filterable: true },
          orderBy: [{ filterSortOrder: "asc" }, { sortOrder: "asc" }, { key: "asc" }],
          include: {
            options: {
              where: { active: true },
              orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
            },
          },
        },
      },
    });

    const data: PublicVendorTypeListItem[] = rows.map((row) => {
      const type = serializeVendorType(row, { includeAttributes: true, activeOnly: true });
      return {
        slug: type.slug,
        label: type.label,
        description: type.description,
        icon: type.icon,
        coverUrl: type.coverUrl,
        galleryLayout: type.galleryLayout,
        sortOrder: type.sortOrder,
        featured: type.featured,
        attributes: (type.attributes ?? []).map((def) => ({
          key: def.key,
          valueType: def.valueType,
          filterLabel: def.filterLabel,
          filterHelp: def.filterHelp,
          filterable: def.filterable,
          filterHighlight: def.filterHighlight,
          filterSortOrder: def.filterSortOrder,
          layout: def.layout,
          unit: def.unit,
          minValue: def.minValue,
          maxValue: def.maxValue,
          maxSelect: def.maxSelect,
          options: def.options,
        })),
      };
    });

    this.publicCache = { at: now, data };
    return data;
  }

  async getPublicSchema(slug: string): Promise<VendorType> {
    const row = await this.prisma.vendorType.findFirst({
      where: { slug, status: "ACTIVE" },
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
    });
    if (!row) throw new NotFoundException("Vendor type not found");
    return serializeVendorType(row, { includeAttributes: true, activeOnly: true });
  }

  async resolveTypeIdBySlug(slug: string): Promise<string> {
    const row = await this.prisma.vendorType.findUnique({ where: { slug } });
    if (!row) throw new BadRequestException(`Unknown vendor type: ${slug}`);
    return row.id;
  }

  async adminListTypes(user: User): Promise<VendorType[]> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.vendorType.findMany({
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      include: typeInclude,
    });
    return rows.map((row) => serializeVendorType(row, { includeAttributes: true }));
  }

  async adminGetType(user: User, id: string): Promise<VendorType> {
    this.access.assertAdmin(user);
    const row = await this.requireType(id);
    return serializeVendorType(row, { includeAttributes: true });
  }

  async createType(user: User, body: CreateVendorTypeBody, ip?: string | null) {
    this.access.assertAdmin(user);
    const existing = await this.prisma.vendorType.findUnique({ where: { slug: body.slug } });
    if (existing) throw new BadRequestException("Slug already exists");

    const row = await this.prisma.vendorType.create({
      data: {
        slug: body.slug,
        label: body.label as Prisma.InputJsonValue,
        description: (body.description ?? null) as Prisma.InputJsonValue,
        icon: body.icon ?? null,
        coverUrl: body.coverUrl ?? null,
        galleryLayout: body.galleryLayout,
        sortOrder: body.sortOrder,
        featured: body.featured,
        coreTeam: body.coreTeam,
        status: body.status,
        onboardingPresentation: (body.onboardingPresentation ?? null) as Prisma.InputJsonValue,
      },
      include: typeInclude,
    });

    await this.access.append({
      actorUserId: user.id,
      action: "vendor_type.create",
      entityType: "VENDOR_TYPE",
      entityId: row.id,
      after: { slug: row.slug, status: row.status },
      ip,
    });
    this.bustPublicCache();
    return serializeVendorType(row, { includeAttributes: true });
  }

  async updateType(user: User, id: string, body: UpdateVendorTypeBody, ip?: string | null) {
    this.access.assertAdmin(user);
    const existing = await this.requireType(id);
    const row = await this.prisma.vendorType.update({
      where: { id },
      data: {
        ...(body.label !== undefined ? { label: body.label as Prisma.InputJsonValue } : {}),
        ...(body.description !== undefined
          ? { description: (body.description ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.coverUrl !== undefined ? { coverUrl: body.coverUrl } : {}),
        ...(body.galleryLayout !== undefined ? { galleryLayout: body.galleryLayout } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.featured !== undefined ? { featured: body.featured } : {}),
        ...(body.coreTeam !== undefined ? { coreTeam: body.coreTeam } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.onboardingPresentation !== undefined
          ? {
              onboardingPresentation: (body.onboardingPresentation ??
                null) as Prisma.InputJsonValue,
            }
          : {}),
      },
      include: typeInclude,
    });

    await this.access.append({
      actorUserId: user.id,
      action: "vendor_type.update",
      entityType: "VENDOR_TYPE",
      entityId: id,
      before: { status: existing.status, featured: existing.featured },
      after: { status: row.status, featured: row.featured },
      ip,
    });
    this.bustPublicCache();
    return serializeVendorType(row, { includeAttributes: true });
  }

  async deleteType(user: User, id: string, ip?: string | null) {
    this.access.assertAdmin(user);
    const existing = await this.requireType(id);
    const vendorCount = await this.prisma.vendor.count({ where: { categoryId: id } });
    if (vendorCount > 0) {
      const row = await this.prisma.vendorType.update({
        where: { id },
        data: { status: "ARCHIVED" },
        include: typeInclude,
      });
      await this.access.append({
        actorUserId: user.id,
        action: "vendor_type.archive",
        entityType: "VENDOR_TYPE",
        entityId: id,
        before: { status: existing.status },
        after: { status: "ARCHIVED", vendorCount },
        ip,
      });
      this.bustPublicCache();
      return serializeVendorType(row, { includeAttributes: true });
    }

    await this.prisma.vendorType.delete({ where: { id } });
    await this.access.append({
      actorUserId: user.id,
      action: "vendor_type.delete",
      entityType: "VENDOR_TYPE",
      entityId: id,
      before: { slug: existing.slug },
      ip,
    });
    this.bustPublicCache();
    return { ok: true as const };
  }

  async reorderTypes(user: User, ids: string[], ip?: string | null) {
    this.access.assertAdmin(user);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.vendorType.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    await this.access.append({
      actorUserId: user.id,
      action: "vendor_type.reorder",
      entityType: "VENDOR_TYPE",
      entityId: "bulk",
      after: { ids },
      ip,
    });
    this.bustPublicCache();
    return this.adminListTypes(user);
  }

  async createDefinition(
    user: User,
    typeId: string,
    body: CreateAttributeDefinitionBody,
    ip?: string | null,
  ) {
    this.access.assertAdmin(user);
    await this.requireType(typeId);
    const filterableDefault =
      body.filterable ?? (body.valueType !== "TEXT");

    try {
      const row = await this.prisma.vendorAttributeDefinition.create({
        data: {
          typeId,
          key: body.key,
          valueType: body.valueType,
          question: body.question as Prisma.InputJsonValue,
          instruction: (body.instruction ?? null) as Prisma.InputJsonValue,
          helpText: (body.helpText ?? null) as Prisma.InputJsonValue,
          filterLabel: (body.filterLabel ?? null) as Prisma.InputJsonValue,
          filterHelp: (body.filterHelp ?? null) as Prisma.InputJsonValue,
          required: body.required,
          filterable: filterableDefault,
          filterHighlight: body.filterHighlight,
          filterSortOrder: body.filterSortOrder,
          showOnProfile: body.showOnProfile,
          collectOnboard: body.collectOnboard,
          layout: body.layout,
          groupKey: body.groupKey ?? null,
          groupLabel: (body.groupLabel ?? null) as Prisma.InputJsonValue,
          unit: body.unit ?? null,
          minValue: body.minValue ?? null,
          maxValue: body.maxValue ?? null,
          maxSelect: body.maxSelect ?? null,
          sortOrder: body.sortOrder,
          status: body.status,
          presentation: (body.presentation ?? null) as Prisma.InputJsonValue,
          options: body.options
            ? {
                create: body.options.map((opt) => ({
                  key: opt.key,
                  label: opt.label as Prisma.InputJsonValue,
                  helpText: (opt.helpText ?? null) as Prisma.InputJsonValue,
                  sortOrder: opt.sortOrder,
                  active: opt.active,
                })),
              }
            : undefined,
        },
        include: definitionInclude,
      });
      await this.access.append({
        actorUserId: user.id,
        action: "vendor_attribute.create",
        entityType: "VENDOR_ATTRIBUTE_DEFINITION",
        entityId: row.id,
        after: { typeId, key: row.key, valueType: row.valueType },
        ip,
      });
      this.bustPublicCache();
      return serializeDefinition(row)!;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("Attribute key already exists for this type");
      }
      throw error;
    }
  }

  async updateDefinition(
    user: User,
    typeId: string,
    id: string,
    body: UpdateAttributeDefinitionBody,
    ip?: string | null,
  ) {
    this.access.assertAdmin(user);
    const existing = await this.requireDefinition(typeId, id);

    if (body.valueType !== undefined && body.valueType !== existing.valueType) {
      const valueCount = await this.prisma.vendorAttributeValue.count({
        where: { definitionId: id },
      });
      if (valueCount > 0) {
        // Admin override: wipe incompatible answers (selections cascade from values).
        await this.prisma.vendorAttributeValue.deleteMany({ where: { definitionId: id } });
        await this.access.append({
          actorUserId: user.id,
          action: "vendor_attribute.clear_answers",
          entityType: "VENDOR_ATTRIBUTE_DEFINITION",
          entityId: id,
          before: { valueType: existing.valueType, clearedAnswers: valueCount },
          after: { valueType: body.valueType },
          ip,
        });
      }
    }

    const row = await this.prisma.vendorAttributeDefinition.update({
      where: { id },
      data: {
        ...(body.valueType !== undefined ? { valueType: body.valueType } : {}),
        ...(body.question !== undefined ? { question: body.question as Prisma.InputJsonValue } : {}),
        ...(body.instruction !== undefined
          ? { instruction: (body.instruction ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(body.helpText !== undefined
          ? { helpText: (body.helpText ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(body.filterLabel !== undefined
          ? { filterLabel: (body.filterLabel ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(body.filterHelp !== undefined
          ? { filterHelp: (body.filterHelp ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(body.required !== undefined ? { required: body.required } : {}),
        ...(body.filterable !== undefined ? { filterable: body.filterable } : {}),
        ...(body.filterHighlight !== undefined ? { filterHighlight: body.filterHighlight } : {}),
        ...(body.filterSortOrder !== undefined ? { filterSortOrder: body.filterSortOrder } : {}),
        ...(body.showOnProfile !== undefined ? { showOnProfile: body.showOnProfile } : {}),
        ...(body.collectOnboard !== undefined ? { collectOnboard: body.collectOnboard } : {}),
        ...(body.layout !== undefined ? { layout: body.layout } : {}),
        ...(body.groupKey !== undefined ? { groupKey: body.groupKey } : {}),
        ...(body.groupLabel !== undefined
          ? { groupLabel: (body.groupLabel ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(body.unit !== undefined ? { unit: body.unit } : {}),
        ...(body.minValue !== undefined ? { minValue: body.minValue } : {}),
        ...(body.maxValue !== undefined ? { maxValue: body.maxValue } : {}),
        ...(body.maxSelect !== undefined ? { maxSelect: body.maxSelect } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.presentation !== undefined
          ? { presentation: (body.presentation ?? null) as Prisma.InputJsonValue }
          : {}),
      },
      include: definitionInclude,
    });

    await this.access.append({
      actorUserId: user.id,
      action: "vendor_attribute.update",
      entityType: "VENDOR_ATTRIBUTE_DEFINITION",
      entityId: id,
      before: { valueType: existing.valueType, status: existing.status },
      after: { valueType: row.valueType, status: row.status },
      ip,
    });
    this.bustPublicCache();
    return serializeDefinition(row)!;
  }

  async deleteDefinition(user: User, typeId: string, id: string, ip?: string | null) {
    this.access.assertAdmin(user);
    const existing = await this.requireDefinition(typeId, id);
    const valueCount = await this.prisma.vendorAttributeValue.count({ where: { definitionId: id } });
    if (valueCount > 0) {
      const row = await this.prisma.vendorAttributeDefinition.update({
        where: { id },
        data: { status: "ARCHIVED" },
        include: definitionInclude,
      });
      await this.access.append({
        actorUserId: user.id,
        action: "vendor_attribute.archive",
        entityType: "VENDOR_ATTRIBUTE_DEFINITION",
        entityId: id,
        before: { status: existing.status },
        after: { status: "ARCHIVED" },
        ip,
      });
      this.bustPublicCache();
      return serializeDefinition(row)!;
    }

    await this.prisma.vendorAttributeDefinition.delete({ where: { id } });
    await this.access.append({
      actorUserId: user.id,
      action: "vendor_attribute.delete",
      entityType: "VENDOR_ATTRIBUTE_DEFINITION",
      entityId: id,
      before: { key: existing.key },
      ip,
    });
    this.bustPublicCache();
    return { ok: true as const };
  }

  async reorderDefinitions(user: User, typeId: string, ids: string[], ip?: string | null) {
    this.access.assertAdmin(user);
    await this.requireType(typeId);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.vendorAttributeDefinition.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    await this.access.append({
      actorUserId: user.id,
      action: "vendor_attribute.reorder",
      entityType: "VENDOR_TYPE",
      entityId: typeId,
      after: { ids },
      ip,
    });
    this.bustPublicCache();
    return this.adminGetType(user, typeId);
  }

  async createOption(
    user: User,
    typeId: string,
    defId: string,
    body: CreateAttributeOptionBody,
    ip?: string | null,
  ) {
    this.access.assertAdmin(user);
    await this.requireDefinition(typeId, defId);
    try {
      const row = await this.prisma.vendorAttributeOption.create({
        data: {
          definitionId: defId,
          key: body.key,
          label: body.label as Prisma.InputJsonValue,
          helpText: (body.helpText ?? null) as Prisma.InputJsonValue,
          sortOrder: body.sortOrder,
          active: body.active,
        },
      });
      await this.access.append({
        actorUserId: user.id,
        action: "vendor_attribute_option.create",
        entityType: "VENDOR_ATTRIBUTE_OPTION",
        entityId: row.id,
        after: { definitionId: defId, key: row.key },
        ip,
      });
      this.bustPublicCache();
      return {
        id: row.id,
        key: row.key,
        label: asLocalized(row.label),
        helpText: asLocalizedOrNull(row.helpText),
        sortOrder: row.sortOrder,
        active: row.active,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("Option key already exists for this attribute");
      }
      throw error;
    }
  }

  async updateOption(
    user: User,
    typeId: string,
    defId: string,
    id: string,
    body: UpdateAttributeOptionBody,
    ip?: string | null,
  ) {
    this.access.assertAdmin(user);
    await this.requireOption(typeId, defId, id);
    const row = await this.prisma.vendorAttributeOption.update({
      where: { id },
      data: {
        ...(body.label !== undefined ? { label: body.label as Prisma.InputJsonValue } : {}),
        ...(body.helpText !== undefined
          ? { helpText: (body.helpText ?? null) as Prisma.InputJsonValue }
          : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });
    await this.access.append({
      actorUserId: user.id,
      action: "vendor_attribute_option.update",
      entityType: "VENDOR_ATTRIBUTE_OPTION",
      entityId: id,
      after: { active: row.active },
      ip,
    });
    this.bustPublicCache();
    return {
      id: row.id,
      key: row.key,
      label: asLocalized(row.label),
      helpText: asLocalizedOrNull(row.helpText),
      sortOrder: row.sortOrder,
      active: row.active,
    };
  }

  async deleteOption(user: User, typeId: string, defId: string, id: string, ip?: string | null) {
    this.access.assertAdmin(user);
    const existing = await this.requireOption(typeId, defId, id);
    const selectionCount = await this.prisma.vendorAttributeSelection.count({
      where: { optionId: id },
    });
    if (selectionCount > 0) {
      const row = await this.prisma.vendorAttributeOption.update({
        where: { id },
        data: { active: false },
      });
      await this.access.append({
        actorUserId: user.id,
        action: "vendor_attribute_option.archive",
        entityType: "VENDOR_ATTRIBUTE_OPTION",
        entityId: id,
        before: { active: existing.active },
        after: { active: false, selectionCount },
        ip,
      });
      this.bustPublicCache();
      return {
        id: row.id,
        key: row.key,
        label: asLocalized(row.label),
        helpText: asLocalizedOrNull(row.helpText),
        sortOrder: row.sortOrder,
        active: row.active,
      };
    }

    await this.prisma.vendorAttributeOption.delete({ where: { id } });
    await this.access.append({
      actorUserId: user.id,
      action: "vendor_attribute_option.delete",
      entityType: "VENDOR_ATTRIBUTE_OPTION",
      entityId: id,
      before: { key: existing.key },
      ip,
    });
    this.bustPublicCache();
    return { ok: true as const };
  }

  async reorderOptions(
    user: User,
    typeId: string,
    defId: string,
    ids: string[],
    ip?: string | null,
  ) {
    this.access.assertAdmin(user);
    await this.requireDefinition(typeId, defId);
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.vendorAttributeOption.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    await this.access.append({
      actorUserId: user.id,
      action: "vendor_attribute_option.reorder",
      entityType: "VENDOR_ATTRIBUTE_DEFINITION",
      entityId: defId,
      after: { ids },
      ip,
    });
    this.bustPublicCache();
    const def = await this.requireDefinition(typeId, defId);
    return serializeDefinition(def)!;
  }

  async typeAnalytics(user: User, typeId: string) {
    this.access.assertAdmin(user);
    const type = await this.requireType(typeId);
    const definitions = type.attributes ?? [];
    const vendorIds = (
      await this.prisma.vendor.findMany({
        where: { categoryId: typeId },
        select: { id: true },
      })
    ).map((v) => v.id);

    const attributes = await Promise.all(
      definitions.map(async (def) => {
        if (def.valueType === "SELECT" || def.valueType === "MULTISELECT") {
          const buckets = await Promise.all(
            def.options.map(async (opt) => {
              const count = await this.prisma.vendorAttributeSelection.count({
                where: {
                  optionId: opt.id,
                  ...(vendorIds.length ? { vendorId: { in: vendorIds } } : { vendorId: "__none__" }),
                },
              });
              return { key: opt.key, label: asLocalized(opt.label), count };
            }),
          );
          return { key: def.key, valueType: def.valueType, buckets };
        }

        if (def.valueType === "BOOLEAN") {
          const [yes, no] = await Promise.all([
            this.prisma.vendorAttributeValue.count({
              where: { definitionId: def.id, booleanValue: true },
            }),
            this.prisma.vendorAttributeValue.count({
              where: { definitionId: def.id, booleanValue: false },
            }),
          ]);
          return {
            key: def.key,
            valueType: def.valueType,
            buckets: [
              { key: "true", label: { en: "Yes" }, count: yes },
              { key: "false", label: { en: "No" }, count: no },
            ],
          };
        }

        if (def.valueType === "NUMBER" || def.valueType === "RANGE") {
          const values = await this.prisma.vendorAttributeValue.findMany({
            where: { definitionId: def.id },
            select: { numberValue: true, rangeMin: true, rangeMax: true },
          });
          const nums =
            def.valueType === "NUMBER"
              ? values.map((v) => v.numberValue).filter((n): n is number => n != null)
              : values.flatMap((v) => [v.rangeMin, v.rangeMax]).filter((n): n is number => n != null);
          if (nums.length === 0) {
            return { key: def.key, valueType: def.valueType, buckets: [] };
          }
          const min = Math.min(...nums);
          const max = Math.max(...nums);
          const span = Math.max(max - min, 1);
          const bucketCount = 5;
          const buckets = Array.from({ length: bucketCount }, (_, i) => {
            const lo = min + (span * i) / bucketCount;
            const hi = min + (span * (i + 1)) / bucketCount;
            const count = nums.filter((n) =>
              i === bucketCount - 1 ? n >= lo && n <= hi : n >= lo && n < hi,
            ).length;
            return {
              key: `${Math.round(lo)}-${Math.round(hi)}`,
              label: { en: `${Math.round(lo)} – ${Math.round(hi)}` },
              count,
            };
          });
          return { key: def.key, valueType: def.valueType, buckets };
        }

        return { key: def.key, valueType: def.valueType, buckets: [] };
      }),
    );

    return {
      typeId,
      slug: type.slug,
      vendorCount: vendorIds.length,
      attributes,
    };
  }

  async exportPack(user: User, slug?: string): Promise<TaxonomyPack> {
    this.access.assertAdmin(user);
    const rows = await this.prisma.vendorType.findMany({
      where: slug ? { slug } : undefined,
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      include: typeInclude,
    });
    if (slug && rows.length === 0) throw new NotFoundException("Vendor type not found");

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      types: rows.map((row) => {
        const type = serializeVendorType(row, { includeAttributes: true });
        return {
          slug: type.slug,
          label: type.label,
          description: type.description,
          icon: type.icon,
          coverUrl: type.coverUrl,
          galleryLayout: type.galleryLayout,
          sortOrder: type.sortOrder,
          featured: type.featured,
          coreTeam: type.coreTeam,
          status: type.status,
          onboardingPresentation: type.onboardingPresentation,
          attributes: (type.attributes ?? []).map((def) => ({
            key: def.key,
            valueType: def.valueType,
            question: def.question,
            instruction: def.instruction,
            helpText: def.helpText,
            filterLabel: def.filterLabel,
            filterHelp: def.filterHelp,
            required: def.required,
            filterable: def.filterable,
            filterHighlight: def.filterHighlight,
            filterSortOrder: def.filterSortOrder,
            showOnProfile: def.showOnProfile,
            collectOnboard: def.collectOnboard,
            layout: def.layout,
            groupKey: def.groupKey,
            groupLabel: def.groupLabel,
            unit: def.unit,
            minValue: def.minValue,
            maxValue: def.maxValue,
            maxSelect: def.maxSelect,
            sortOrder: def.sortOrder,
            status: def.status,
            presentation: def.presentation,
            options: def.options.map((opt) => ({
              key: opt.key,
              label: opt.label,
              helpText: opt.helpText,
              sortOrder: opt.sortOrder,
              active: opt.active,
            })),
          })),
        };
      }),
    };
  }

  async importPack(
    user: User,
    body: ImportTaxonomyBody,
    dryRun: boolean,
    ip?: string | null,
  ) {
    this.access.assertAdmin(user);
    const pack: TaxonomyPack = {
      version: 1,
      exportedAt: body.exportedAt,
      types: body.types,
    };

    const preview: Array<{
      slug: string;
      action: "create" | "update" | "skip";
      conflicts: string[];
      attributes: Array<{ key: string; action: string; note?: string }>;
    }> = [];

    for (const packType of pack.types) {
      const existing = await this.prisma.vendorType.findUnique({
        where: { slug: packType.slug },
        include: typeInclude,
      });
      const conflicts: string[] = [];
      const attrPreview: Array<{ key: string; action: string; note?: string }> = [];

      if (!existing) {
        for (const attr of packType.attributes) {
          attrPreview.push({ key: attr.key, action: "create" });
        }
        preview.push({ slug: packType.slug, action: "create", conflicts, attributes: attrPreview });
        continue;
      }

      for (const attr of packType.attributes) {
        const current = existing.attributes.find((a) => a.key === attr.key);
        if (!current) {
          attrPreview.push({ key: attr.key, action: "create" });
          continue;
        }
        if (current.valueType !== attr.valueType) {
          const valueCount = await this.prisma.vendorAttributeValue.count({
            where: { definitionId: current.id },
          });
          if (valueCount > 0) {
            conflicts.push(`${attr.key}: valueType conflict (${current.valueType} → ${attr.valueType})`);
            attrPreview.push({
              key: attr.key,
              action: "conflict",
              note: "valueType change blocked",
            });
            continue;
          }
        }
        attrPreview.push({ key: attr.key, action: "update" });
      }

      preview.push({
        slug: packType.slug,
        action: "update",
        conflicts,
        attributes: attrPreview,
      });
    }

    const blocked = preview.some((item) => item.conflicts.length > 0);
    if (dryRun || blocked) {
      return { dryRun: true, applied: false, blocked, preview };
    }

    for (const packType of pack.types) {
      let type = await this.prisma.vendorType.findUnique({
        where: { slug: packType.slug },
        include: typeInclude,
      });

      if (!type) {
        type = await this.prisma.vendorType.create({
          data: {
            slug: packType.slug,
            label: packType.label as Prisma.InputJsonValue,
            description: (packType.description ?? null) as Prisma.InputJsonValue,
            icon: packType.icon ?? null,
            coverUrl: packType.coverUrl ?? null,
            galleryLayout: packType.galleryLayout,
            sortOrder: packType.sortOrder,
            featured: packType.featured,
            coreTeam: packType.coreTeam,
            status: packType.status,
            onboardingPresentation: (packType.onboardingPresentation ??
              null) as Prisma.InputJsonValue,
          },
          include: typeInclude,
        });
      } else {
        type = await this.prisma.vendorType.update({
          where: { id: type.id },
          data: {
            label: packType.label as Prisma.InputJsonValue,
            description: (packType.description ?? null) as Prisma.InputJsonValue,
            icon: packType.icon ?? null,
            coverUrl: packType.coverUrl ?? null,
            galleryLayout: packType.galleryLayout,
            sortOrder: packType.sortOrder,
            featured: packType.featured,
            coreTeam: packType.coreTeam,
            status: packType.status,
            onboardingPresentation: (packType.onboardingPresentation ??
              null) as Prisma.InputJsonValue,
          },
          include: typeInclude,
        });
      }

      const seenDefKeys = new Set<string>();
      for (const attr of packType.attributes) {
        seenDefKeys.add(attr.key);
        let def = type.attributes.find((a) => a.key === attr.key);
        if (!def) {
          def = await this.prisma.vendorAttributeDefinition.create({
            data: {
              typeId: type.id,
              key: attr.key,
              valueType: attr.valueType,
              question: attr.question as Prisma.InputJsonValue,
              instruction: (attr.instruction ?? null) as Prisma.InputJsonValue,
              helpText: (attr.helpText ?? null) as Prisma.InputJsonValue,
              filterLabel: (attr.filterLabel ?? null) as Prisma.InputJsonValue,
              filterHelp: (attr.filterHelp ?? null) as Prisma.InputJsonValue,
              required: attr.required,
              filterable: attr.filterable,
              filterHighlight: attr.filterHighlight,
              filterSortOrder: attr.filterSortOrder,
              showOnProfile: attr.showOnProfile,
              collectOnboard: attr.collectOnboard,
              layout: attr.layout,
              groupKey: attr.groupKey ?? null,
              groupLabel: (attr.groupLabel ?? null) as Prisma.InputJsonValue,
              unit: attr.unit ?? null,
              minValue: attr.minValue ?? null,
              maxValue: attr.maxValue ?? null,
              maxSelect: attr.maxSelect ?? null,
              sortOrder: attr.sortOrder,
              status: attr.status,
              presentation: (attr.presentation ?? null) as Prisma.InputJsonValue,
            },
            include: definitionInclude,
          });
        } else if (def.valueType === attr.valueType) {
          def = await this.prisma.vendorAttributeDefinition.update({
            where: { id: def.id },
            data: {
              question: attr.question as Prisma.InputJsonValue,
              instruction: (attr.instruction ?? null) as Prisma.InputJsonValue,
              helpText: (attr.helpText ?? null) as Prisma.InputJsonValue,
              filterLabel: (attr.filterLabel ?? null) as Prisma.InputJsonValue,
              filterHelp: (attr.filterHelp ?? null) as Prisma.InputJsonValue,
              required: attr.required,
              filterable: attr.filterable,
              filterHighlight: attr.filterHighlight,
              filterSortOrder: attr.filterSortOrder,
              showOnProfile: attr.showOnProfile,
              collectOnboard: attr.collectOnboard,
              layout: attr.layout,
              groupKey: attr.groupKey ?? null,
              groupLabel: (attr.groupLabel ?? null) as Prisma.InputJsonValue,
              unit: attr.unit ?? null,
              minValue: attr.minValue ?? null,
              maxValue: attr.maxValue ?? null,
              maxSelect: attr.maxSelect ?? null,
              sortOrder: attr.sortOrder,
              status: attr.status,
              presentation: (attr.presentation ?? null) as Prisma.InputJsonValue,
            },
            include: definitionInclude,
          });
        } else {
          continue;
        }

        const seenOptKeys = new Set<string>();
        for (const opt of attr.options) {
          seenOptKeys.add(opt.key);
          const current = def.options.find((o) => o.key === opt.key);
          if (!current) {
            await this.prisma.vendorAttributeOption.create({
              data: {
                definitionId: def.id,
                key: opt.key,
                label: opt.label as Prisma.InputJsonValue,
                helpText: (opt.helpText ?? null) as Prisma.InputJsonValue,
                sortOrder: opt.sortOrder,
                active: opt.active,
              },
            });
          } else {
            await this.prisma.vendorAttributeOption.update({
              where: { id: current.id },
              data: {
                label: opt.label as Prisma.InputJsonValue,
                helpText: (opt.helpText ?? null) as Prisma.InputJsonValue,
                sortOrder: opt.sortOrder,
                active: opt.active,
              },
            });
          }
        }

        for (const opt of def.options) {
          if (!seenOptKeys.has(opt.key) && opt.active) {
            await this.prisma.vendorAttributeOption.update({
              where: { id: opt.id },
              data: { active: false },
            });
          }
        }
      }
    }

    await this.access.append({
      actorUserId: user.id,
      action: "vendor_type.import",
      entityType: "VENDOR_TYPE",
      entityId: "pack",
      after: { typeCount: pack.types.length, slugs: pack.types.map((t) => t.slug) },
      ip,
    });
    this.bustPublicCache();
    return { dryRun: false, applied: true, blocked: false, preview };
  }

  async cloneType(user: User, id: string, body: CloneVendorTypeBody, ip?: string | null) {
    this.access.assertAdmin(user);
    const source = await this.requireType(id);
    const exists = await this.prisma.vendorType.findUnique({ where: { slug: body.newSlug } });
    if (exists) throw new BadRequestException("Slug already exists");

    const created = await this.prisma.$transaction(async (tx) => {
      const type = await tx.vendorType.create({
        data: {
          slug: body.newSlug,
          label: source.label as Prisma.InputJsonValue,
          description: (source.description ?? null) as Prisma.InputJsonValue,
          icon: source.icon,
          coverUrl: source.coverUrl,
          galleryLayout: source.galleryLayout,
          sortOrder: source.sortOrder + 1,
          featured: false,
          coreTeam: source.coreTeam,
          status: "DRAFT",
          onboardingPresentation: (source.onboardingPresentation ??
            null) as Prisma.InputJsonValue,
        },
      });

      for (const def of source.attributes) {
        await tx.vendorAttributeDefinition.create({
          data: {
            typeId: type.id,
            key: def.key,
            valueType: def.valueType,
            question: def.question as Prisma.InputJsonValue,
            instruction: (def.instruction ?? null) as Prisma.InputJsonValue,
            helpText: (def.helpText ?? null) as Prisma.InputJsonValue,
            filterLabel: (def.filterLabel ?? null) as Prisma.InputJsonValue,
            filterHelp: (def.filterHelp ?? null) as Prisma.InputJsonValue,
            required: def.required,
            filterable: def.filterable,
            filterHighlight: def.filterHighlight,
            filterSortOrder: def.filterSortOrder,
            showOnProfile: def.showOnProfile,
            collectOnboard: def.collectOnboard,
            layout: def.layout,
            groupKey: def.groupKey,
            groupLabel: (def.groupLabel ?? null) as Prisma.InputJsonValue,
            unit: def.unit,
            minValue: def.minValue,
            maxValue: def.maxValue,
            maxSelect: def.maxSelect,
            sortOrder: def.sortOrder,
            status: def.status,
            presentation: (def.presentation ?? null) as Prisma.InputJsonValue,
            options: {
              create: def.options.map((opt) => ({
                key: opt.key,
                label: opt.label as Prisma.InputJsonValue,
                helpText: (opt.helpText ?? null) as Prisma.InputJsonValue,
                sortOrder: opt.sortOrder,
                active: opt.active,
              })),
            },
          },
        });
      }

      return tx.vendorType.findUniqueOrThrow({
        where: { id: type.id },
        include: typeInclude,
      });
    });

    await this.access.append({
      actorUserId: user.id,
      action: "vendor_type.clone",
      entityType: "VENDOR_TYPE",
      entityId: created.id,
      after: { fromId: id, slug: created.slug },
      ip,
    });
    this.bustPublicCache();
    return serializeVendorType(created, { includeAttributes: true });
  }

  private async requireType(id: string) {
    const row = await this.prisma.vendorType.findUnique({
      where: { id },
      include: typeInclude,
    });
    if (!row) throw new NotFoundException("Vendor type not found");
    return row;
  }

  private async requireDefinition(typeId: string, id: string) {
    const row = await this.prisma.vendorAttributeDefinition.findFirst({
      where: { id, typeId },
      include: definitionInclude,
    });
    if (!row) throw new NotFoundException("Attribute definition not found");
    return row;
  }

  private async requireOption(typeId: string, defId: string, id: string) {
    await this.requireDefinition(typeId, defId);
    const row = await this.prisma.vendorAttributeOption.findFirst({
      where: { id, definitionId: defId },
    });
    if (!row) throw new NotFoundException("Attribute option not found");
    return row;
  }
}
