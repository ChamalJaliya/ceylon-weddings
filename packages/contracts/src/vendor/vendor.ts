import { z } from "zod";
import {
  ATTR_QUERY_PREFIX,
  emptyToUndefined,
  facetBucketSchema,
  optionalQueryNumber,
  optionalQueryString,
  paginatedQuerySchema,
  paginatedResultSchema,
  queryBoolean,
  queryInt,
  type CatalogAttrFilterValue,
} from "../query";
import { completenessResultSchema } from "../common";
import {
  attributeCompletenessSchema,
  attributesRequiredComplete,
  galleryLayoutSchema,
  vendorProfileAttributeChipSchema,
} from "./attributes";
import {
  billingIntervalSchema,
  packageBadgeSchema,
  packageEventTypeSchema,
  packagePricingModeSchema,
  packageStatusSchema,
  packageTierSchema,
  priceDisplayModeSchema,
  subscriptionStatusSchema,
  vendorCategorySchema,
  type BillingInterval,
  type PackagePricingMode,
  type PriceDisplayMode,
  type SubscriptionStatus,
} from "./enums";

export const vendorFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const vendorAddOnSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  pricingMode: packagePricingModeSchema,
  priceLkr: z.number().int().nullable(),
});

export const vendorPackageSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  tier: packageTierSchema.nullable(),
  name: z.string(),
  pricingMode: packagePricingModeSchema,
  priceLkr: z.number().int().nullable(),
  priceMaxLkr: z.number().int().nullable(),
  description: z.string().nullable(),
  status: packageStatusSchema,
  sortOrder: z.number().int(),
  badge: packageBadgeSchema.nullable(),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  eventTypes: z.array(packageEventTypeSchema),
  durationHours: z.number().nullable(),
  guestMin: z.number().int().nullable(),
  guestMax: z.number().int().nullable(),
  photoUrls: z.array(z.string()),
  bestFor: z.string().nullable(),
  addOnIds: z.array(z.string()).optional(),
  addOns: z.array(vendorAddOnSchema).optional(),
});

export const reviewSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  authorName: z.string(),
  rating: z.number(),
  quality: z.number(),
  professionalism: z.number(),
  flexibility: z.number(),
  responseTime: z.number(),
  value: z.number(),
  communication: z.number(),
  body: z.string(),
  recommended: z.boolean(),
  hidden: z.boolean().optional(),
  createdAt: z.string(),
});

export const createReviewBodySchema = z.object({
  rating: z.number().min(1).max(5),
  quality: z.number().min(1).max(5).optional(),
  professionalism: z.number().min(1).max(5).optional(),
  flexibility: z.number().min(1).max(5).optional(),
  responseTime: z.number().min(1).max(5).optional(),
  value: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  body: z.string().min(8),
  recommended: z.boolean().default(true),
});

export const vendorMediaItemSchema = z.object({
  id: z.string(),
  url: z.string().min(1),
  sortOrder: z.number().int(),
});

export const vendorMediaProjectSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coverUrl: z.string().nullable(),
  eventDate: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  items: z.array(vendorMediaItemSchema),
});

export const vendorVideoSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  url: z.string().min(1),
  title: z.string().nullable(),
  sortOrder: z.number().int(),
});

export const upsertVendorMediaItemBodySchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const upsertVendorMediaProjectBodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  items: z.array(upsertVendorMediaItemBodySchema).default([]),
});

export const upsertVendorVideoBodySchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  title: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const MEDIA_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MEDIA_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const mediaPresignBodySchema = z.object({
  contentType: z.enum(MEDIA_IMAGE_CONTENT_TYPES),
  filename: z.string().min(1).max(200),
  kind: z.enum(["image", "cover"]).default("image"),
});

export const mediaPresignResponseSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string().min(1),
  publicUrl: z.string().url(),
});

export type VendorMediaItem = z.infer<typeof vendorMediaItemSchema>;
export type VendorMediaProject = z.infer<typeof vendorMediaProjectSchema>;
export type VendorVideo = z.infer<typeof vendorVideoSchema>;
export type UpsertVendorMediaProjectBody = z.infer<typeof upsertVendorMediaProjectBodySchema>;
export type UpsertVendorVideoBody = z.infer<typeof upsertVendorVideoBodySchema>;
export type MediaPresignBody = z.infer<typeof mediaPresignBodySchema>;
export type MediaPresignResponse = z.infer<typeof mediaPresignResponseSchema>;

/** Parse YouTube / Vimeo watch or share URLs into a stable video id + provider. */
export function parseVideoUrl(raw: string): { provider: "youtube" | "vimeo"; id: string } | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? { provider: "youtube", id } : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id ? { provider: "youtube", id } : null;
      }
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id ? { provider: "youtube", id } : null;
      }
      const id = url.searchParams.get("v");
      return id ? { provider: "youtube", id } : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = parts.find((part) => /^\d+$/.test(part));
      return id ? { provider: "vimeo", id } : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function videoEmbedUrl(raw: string): string | null {
  const parsed = parseVideoUrl(raw);
  if (!parsed) return null;
  if (parsed.provider === "youtube") {
    return `https://www.youtube.com/embed/${parsed.id}`;
  }
  return `https://player.vimeo.com/video/${parsed.id}`;
}

export function videoThumbnailUrl(raw: string): string | null {
  const parsed = parseVideoUrl(raw);
  if (!parsed) return null;
  if (parsed.provider === "youtube") {
    return `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`;
  }
  return null;
}

export const vendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: vendorCategorySchema,
  categoryId: z.string().nullable().optional(),
  galleryLayout: galleryLayoutSchema.optional(),
  onboardingCompletedAt: z.string().nullable().optional(),
  attributeCompleteness: attributeCompletenessSchema.optional(),
  attributes: z.array(vendorProfileAttributeChipSchema).optional(),
  city: z.string(),
  district: z.string(),
  startingPriceLkr: z.number().int().nullable(),
  priceDisplayMode: priceDisplayModeSchema,
  typicalSpendLkr: z.number().int().nullable().optional(),
  offerHeadline: z.string().nullable().optional(),
  taxesExtra: z.boolean().optional(),
  taxNote: z.string().nullable().optional(),
  depositNote: z.string().nullable().optional(),
  cancellationNote: z.string().nullable().optional(),
  pricingDisclaimer: z.string().nullable().optional(),
  showPricing: z.boolean().default(true),
  listed: z.boolean().default(true),
  serviceAreas: z.array(z.string()).optional(),
  travelNote: z.string().nullable().optional(),
  overtimeNote: z.string().nullable().optional(),
  whatsapp: z.string().nullable(),
  description: z.string().nullable(),
  photoUrl: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  introVideoUrl: z.string().nullable().optional(),
  yearsExperience: z.number().int().optional(),
  couplesServed: z.number().int().optional(),
  ratingAvg: z.number().optional(),
  ratingCount: z.number().int().optional(),
  includedInPrice: z.array(z.string()).optional(),
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  faqs: z.array(vendorFaqSchema).optional(),
  featured: z.boolean(),
  verified: z.boolean(),
  moderationStatus: z
    .enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"])
    .optional(),
  moderationNote: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  featuredAt: z.string().nullable().optional(),
  hiddenAt: z.string().nullable().optional(),
  styles: z.array(z.string()),
  destinationExperienced: z.boolean(),
  packages: z.array(vendorPackageSchema).optional(),
  addOns: z.array(vendorAddOnSchema).optional(),
  mediaProjects: z.array(vendorMediaProjectSchema).optional(),
  videos: z.array(vendorVideoSchema).optional(),
  reviews: z.array(reviewSchema).optional(),
  completeness: completenessResultSchema.optional(),
});

export const vendorSortSchema = z.enum(["featured", "rating", "price_asc", "price_desc", "name"]);
export type VendorSort = z.infer<typeof vendorSortSchema>;

export const VENDOR_CATALOG_DEFAULTS = {
  page: 1,
  pageSize: 12,
  sort: "featured",
} as const;

export const catalogAttrValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }),
]);
export type CatalogAttrValue = z.infer<typeof catalogAttrValueSchema>;

export const catalogAttrsSchema = z.record(z.string(), catalogAttrValueSchema);
export type CatalogAttrs = z.infer<typeof catalogAttrsSchema>;

function parseBoundNumber(value: string): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function pushAttrString(
  result: Record<string, CatalogAttrFilterValue>,
  key: string,
  value: string,
) {
  const existing = result[key];
  if (existing === undefined) {
    result[key] = value;
    return;
  }
  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }
  if (typeof existing === "string") {
    result[key] = [existing, value];
  }
}

/** Parse `a.<attrKey>` catalog filters from URLSearchParams. */
export function parseCatalogAttrsFromSearchParams(
  searchParams: URLSearchParams,
): Record<string, CatalogAttrFilterValue> {
  const result: Record<string, CatalogAttrFilterValue> = {};
  const ranges = new Map<string, { min?: number; max?: number }>();

  for (const [rawKey, value] of searchParams.entries()) {
    if (!rawKey.startsWith(ATTR_QUERY_PREFIX)) continue;
    const rest = rawKey.slice(ATTR_QUERY_PREFIX.length);
    if (!rest) continue;

    if (rest.endsWith(".min") || rest.endsWith(".max")) {
      const attrKey = rest.slice(0, rest.lastIndexOf("."));
      if (!attrKey) continue;
      const bound = rest.endsWith(".min") ? "min" : "max";
      const num = parseBoundNumber(value);
      if (num === undefined) continue;
      const existing = ranges.get(attrKey) ?? {};
      existing[bound] = num;
      ranges.set(attrKey, existing);
      continue;
    }

    pushAttrString(result, rest, value);
  }

  for (const [key, range] of ranges) {
    result[key] = range;
  }

  return result;
}

/** Build attrs from a flat query object that may contain `a.*` keys. */
export function parseCatalogAttrsFromQueryObject(
  input: Record<string, unknown>,
): Record<string, CatalogAttrFilterValue> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (!key.startsWith(ATTR_QUERY_PREFIX)) continue;
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        params.append(key, String(item));
      }
      continue;
    }
    params.append(key, String(value));
  }
  return parseCatalogAttrsFromSearchParams(params);
}

function preprocessCatalogQuery(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  if (obj.attrs === undefined) {
    const attrs = parseCatalogAttrsFromQueryObject(obj);
    if (Object.keys(attrs).length > 0) obj.attrs = attrs;
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith(ATTR_QUERY_PREFIX)) delete obj[key];
  }
  return obj;
}

export const vendorCatalogQuerySchema = z.preprocess(
  preprocessCatalogQuery,
  paginatedQuerySchema.extend({
    pageSize: queryInt(12, 1, 48),
    category: z.preprocess(emptyToUndefined, vendorCategorySchema.optional()),
    city: optionalQueryString,
    district: optionalQueryString,
    featured: queryBoolean,
    verified: queryBoolean,
    destination: queryBoolean,
    minPrice: optionalQueryNumber(0, 100_000_000, true),
    maxPrice: optionalQueryNumber(0, 100_000_000, true),
    minRating: optionalQueryNumber(0, 5),
    sort: z.preprocess((value) => emptyToUndefined(value) ?? "featured", vendorSortSchema),
    attrs: catalogAttrsSchema.optional(),
  }),
);

export const vendorCatalogFacetsSchema = z.object({
  cities: z.array(facetBucketSchema),
  districts: z.array(facetBucketSchema),
  attributes: z.record(z.string(), z.array(facetBucketSchema)).optional(),
});

export const vendorCatalogResultSchema = paginatedResultSchema(vendorSchema).extend({
  facets: vendorCatalogFacetsSchema,
});

export type VendorCatalogQuery = z.infer<typeof vendorCatalogQuerySchema>;
export type VendorCatalogFacets = z.infer<typeof vendorCatalogFacetsSchema>;
export type VendorCatalogResult = z.infer<typeof vendorCatalogResultSchema>;

function isActiveAttrFilter(value: CatalogAttrFilterValue | undefined): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return value.min !== undefined || value.max !== undefined;
  return true;
}

export function catalogFilterCount(query: VendorCatalogQuery) {
  const base = [
    query.category,
    query.city,
    query.district,
    query.featured,
    query.verified,
    query.destination,
    query.minPrice,
    query.maxPrice,
    query.minRating,
  ].filter((value) => value !== undefined && value !== false).length;

  const attrCount = query.attrs
    ? Object.values(query.attrs).filter((value) => isActiveAttrFilter(value)).length
    : 0;

  return base + attrCount;
}

export const upsertVendorAddOnBodySchema = z.object({
  id: z.string().optional(),
  clientKey: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  pricingMode: packagePricingModeSchema.default("FIXED"),
  priceLkr: z.number().int().nullable().optional(),
});

export const upsertVendorPackageBodySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  tier: packageTierSchema.nullable().optional(),
  pricingMode: packagePricingModeSchema.default("FIXED"),
  priceLkr: z.number().int().nullable().optional(),
  priceMaxLkr: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  status: packageStatusSchema.default("PUBLISHED"),
  sortOrder: z.number().int().default(0),
  badge: packageBadgeSchema.nullable().optional(),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  eventTypes: z.array(packageEventTypeSchema).default([]),
  durationHours: z.number().nullable().optional(),
  guestMin: z.number().int().nullable().optional(),
  guestMax: z.number().int().nullable().optional(),
  photoUrls: z.array(z.string()).default([]),
  bestFor: z.string().nullable().optional(),
  addOnIds: z.array(z.string()).default([]),
});

export const updateVendorBodySchema = z.object({
  name: z.string().min(1).optional(),
  category: vendorCategorySchema.optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  startingPriceLkr: z.number().int().nullable().optional(),
  priceDisplayMode: priceDisplayModeSchema.optional(),
  typicalSpendLkr: z.number().int().nullable().optional(),
  offerHeadline: z.string().nullable().optional(),
  taxesExtra: z.boolean().optional(),
  taxNote: z.string().nullable().optional(),
  depositNote: z.string().nullable().optional(),
  cancellationNote: z.string().nullable().optional(),
  pricingDisclaimer: z.string().nullable().optional(),
  showPricing: z.boolean().optional(),
  listed: z.boolean().optional(),
  serviceAreas: z.array(z.string()).optional(),
  travelNote: z.string().nullable().optional(),
  overtimeNote: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  introVideoUrl: z.string().nullable().optional(),
  yearsExperience: z.number().int().optional(),
  couplesServed: z.number().int().optional(),
  includedInPrice: z.array(z.string()).optional(),
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  websiteUrl: z.string().max(300).nullable().optional(),
  faqs: z.array(vendorFaqSchema).optional(),
  styles: z.array(z.string()).optional(),
  destinationExperienced: z.boolean().optional(),
  addOns: z.array(upsertVendorAddOnBodySchema).optional(),
  packages: z.array(upsertVendorPackageBodySchema).optional(),
  mediaProjects: z.array(upsertVendorMediaProjectBodySchema).optional(),
  videos: z.array(upsertVendorVideoBodySchema).optional(),
});

export function normalizeVendorWebsiteUrl(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function vendorWebsiteLabel(value: string | null | undefined): string {
  const href = normalizeVendorWebsiteUrl(value);
  if (!href) return "";
  try {
    return new URL(href).hostname.replace(/^www\./i, "");
  } catch {
    return href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

export function slugifyVendorName(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "vendor";
}

export function vendorCompleteness(vendor: {
  name?: string | null;
  description?: string | null;
  city?: string | null;
  whatsapp?: string | null;
  photoUrl?: string | null;
  photos?: string[] | null;
  includedInPrice?: string[] | null;
  startingPriceLkr?: number | null;
  priceDisplayMode?: PriceDisplayMode | null;
  showPricing?: boolean | null;
  packages?: Array<{ status?: string | null; name?: string | null; inclusions?: string[] | null }> | null;
  category?: string | null;
  attributeCompleteness?: {
    requiredDone: number;
    requiredTotal: number;
    optionalDone?: number;
    optionalTotal?: number;
    discoverabilityScore?: number;
  } | null;
}) {
  const checks: Array<{ key: string; ok: boolean }> = [
    { key: "name", ok: Boolean(vendor.name?.trim()) },
    { key: "description", ok: Boolean(vendor.description && vendor.description.trim().length >= 40) },
    { key: "city", ok: Boolean(vendor.city?.trim()) },
    { key: "whatsapp", ok: Boolean(vendor.whatsapp?.trim()) },
    {
      key: "media",
      ok: Boolean(vendor.photoUrl) || Boolean(vendor.photos && vendor.photos.filter(Boolean).length >= 2),
    },
    {
      key: "offer",
      ok:
        (vendor.packages ?? []).some((pkg) => pkg.status === "PUBLISHED" && Boolean(pkg.name?.trim())) ||
        (vendor.priceDisplayMode === "ON_REQUEST" || vendor.showPricing === false
          ? (vendor.includedInPrice?.length ?? 0) >= 3
          : vendor.startingPriceLkr != null && (vendor.includedInPrice?.length ?? 0) >= 1),
    },
    { key: "category", ok: Boolean(vendor.category?.trim()) },
    {
      key: "attributes",
      ok: attributesRequiredComplete(vendor.attributeCompleteness),
    },
  ];
  const missing = checks.filter((item) => !item.ok).map((item) => item.key);
  const score = checks.length - missing.length;
  return { score, total: checks.length, ready: missing.length === 0, missing };
}

export function vendorDiscoverability(
  attributeCompleteness?: {
    optionalDone?: number;
    optionalTotal?: number;
    discoverabilityScore?: number;
  } | null,
): number {
  if (!attributeCompleteness) return 0;
  if (typeof attributeCompleteness.discoverabilityScore === "number") {
    return attributeCompleteness.discoverabilityScore;
  }
  const optionalDone = attributeCompleteness.optionalDone ?? 0;
  const optionalTotal = attributeCompleteness.optionalTotal ?? 0;
  if (optionalTotal <= 0) return 100;
  return Math.round((optionalDone / optionalTotal) * 100);
}

export function formatPackagePriceLabel(
  pkg: {
    pricingMode: PackagePricingMode;
    priceLkr: number | null;
    priceMaxLkr?: number | null;
    showPricing?: boolean | null;
  },
  formatMoney: (value: number) => string,
  hiddenLabel = "Inquire for pricing",
) {
  if (pkg.showPricing === false) return hiddenLabel;
  switch (pkg.pricingMode) {
    case "ON_REQUEST":
      return "On request";
    case "FROM":
      return pkg.priceLkr != null ? `From ${formatMoney(pkg.priceLkr)}` : "From —";
    case "RANGE":
      if (pkg.priceLkr != null && pkg.priceMaxLkr != null) {
        return `${formatMoney(pkg.priceLkr)} – ${formatMoney(pkg.priceMaxLkr)}`;
      }
      return pkg.priceLkr != null ? formatMoney(pkg.priceLkr) : "On request";
    case "PER_GUEST":
      return pkg.priceLkr != null ? `${formatMoney(pkg.priceLkr)} / guest` : "Per guest";
    default:
      return pkg.priceLkr != null ? formatMoney(pkg.priceLkr) : "On request";
  }
}

export function formatVendorStartingPriceLabel(
  vendor: {
    startingPriceLkr: number | null;
    priceDisplayMode?: PriceDisplayMode | null;
    showPricing?: boolean | null;
  },
  formatMoney: (value: number) => string,
  askLabel = "Inquire for pricing",
) {
  if (vendor.showPricing === false) return askLabel;
  const mode = vendor.priceDisplayMode ?? "FROM";
  if (mode === "ON_REQUEST" || vendor.startingPriceLkr == null) {
    return askLabel;
  }
  if (mode === "FIXED") {
    return formatMoney(vendor.startingPriceLkr);
  }
  return `From ${formatMoney(vendor.startingPriceLkr)}`;
}

export function vendorPassesPresentationGate(vendor: {
  description?: string | null;
  whatsapp?: string | null;
  photoUrl?: string | null;
  photos?: string[] | null;
  startingPriceLkr?: number | null;
  priceDisplayMode?: PriceDisplayMode | null;
  showPricing?: boolean | null;
  includedInPrice?: string[] | null;
  packages?: Array<{ status?: string | null }> | null;
}) {
  return presentationGateFailures(vendor).length === 0;
}

export function presentationGateFailures(vendor: {
  description?: string | null;
  whatsapp?: string | null;
  photoUrl?: string | null;
  photos?: string[] | null;
  startingPriceLkr?: number | null;
  priceDisplayMode?: PriceDisplayMode | null;
  showPricing?: boolean | null;
  includedInPrice?: string[] | null;
  packages?: Array<{ status?: string | null }> | null;
}): string[] {
  const failures: string[] = [];
  const photos = (vendor.photos ?? []).filter(Boolean);
  const distinct = new Set(photos.length ? photos : vendor.photoUrl ? [vendor.photoUrl] : []);
  const hasOffer =
    (vendor.packages ?? []).some((pkg) => pkg.status === "PUBLISHED") ||
    vendor.priceDisplayMode === "ON_REQUEST" ||
    vendor.showPricing === false ||
    vendor.startingPriceLkr != null;
  if (distinct.size < 2) failures.push("Need at least 2 photos");
  if (!vendor.description || vendor.description.trim().length < 40) failures.push("Description too short");
  if (!vendor.whatsapp?.trim()) failures.push("WhatsApp required");
  if (!hasOffer) failures.push("Need a clear offer or price");
  return failures;
}

export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  interval: billingIntervalSchema,
  priceLkr: z.number().int(),
  active: z.boolean(),
});

export const subscriptionInvoiceSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  planId: z.string().nullable(),
  interval: billingIntervalSchema.nullable(),
  amountLkr: z.number().int(),
  periodStart: z.string(),
  periodEnd: z.string(),
  status: z.string(),
  paidAt: z.string().nullable(),
  paymentRef: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

export const vendorSubscriptionSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  status: subscriptionStatusSchema,
  trialEndsAt: z.string(),
  trialOverrideBy: z.string().nullable(),
  planId: z.string().nullable(),
  plan: subscriptionPlanSchema.nullable().optional(),
  interval: billingIntervalSchema.nullable(),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  gracePeriodDays: z.number().int(),
  cancelledAt: z.string().nullable(),
  cancelReason: z.string().nullable(),
  compedById: z.string().nullable(),
  compedUntil: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  daysRemaining: z.number().int(),
  invoices: z.array(subscriptionInvoiceSchema).optional(),
});

export const adminOverrideTrialBodySchema = z.object({
  trialEndsAt: z.string(),
  notes: z.string().optional(),
});

export const adminGrantCompedBodySchema = z.object({
  compedUntil: z.string().optional(),
  notes: z.string().optional(),
});

export const adminActivatePaidBodySchema = z.object({
  planId: z.string(),
  interval: billingIntervalSchema,
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionInvoice = z.infer<typeof subscriptionInvoiceSchema>;
export type VendorSubscription = z.infer<typeof vendorSubscriptionSchema>;
export type AdminOverrideTrialBody = z.infer<typeof adminOverrideTrialBodySchema>;
export type AdminGrantCompedBody = z.infer<typeof adminGrantCompedBodySchema>;
export type AdminActivatePaidBody = z.infer<typeof adminActivatePaidBodySchema>;

export type Vendor = z.infer<typeof vendorSchema>;
export type UpdateVendorBody = z.infer<typeof updateVendorBodySchema>;
export type UpsertVendorPackageBody = z.infer<typeof upsertVendorPackageBodySchema>;
export type UpsertVendorAddOnBody = z.infer<typeof upsertVendorAddOnBodySchema>;
export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;
export type VendorPackage = z.infer<typeof vendorPackageSchema>;
export type VendorAddOn = z.infer<typeof vendorAddOnSchema>;
export type VendorFaq = z.infer<typeof vendorFaqSchema>;

