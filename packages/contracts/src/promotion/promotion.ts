import { z } from "zod";
import { completenessResultSchema } from "../common";
import { emptyToUndefined, optionalQueryString } from "../query";
import { vendorCategorySchema } from "../vendor/enums";
import { featuredPlacementSourceSchema } from "../admin/enums";

export const promotionStatusSchema = z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "ARCHIVED"]);
export type PromotionStatus = z.infer<typeof promotionStatusSchema>;

export const promotionLayoutSchema = z.enum(["SPOTLIGHT", "BANNER", "CARD", "STRIP", "PICKS_TILE"]);
export type PromotionLayout = z.infer<typeof promotionLayoutSchema>;

export const promotionSlotSchema = z.enum([
  "HOME_HERO",
  "HOME_PICKS",
  "CATALOG_TOP",
  "CATALOG_INLINE",
  "CATALOG_DATE_AVAILABLE",
  "CATALOG_MAP",
  "IDEAS_RAIL",
  "IDEAS_INLINE",
  "VENDOR_SIDEBAR",
  "VENDOR_COMPLEMENTARY",
  "VENDOR_SIMILAR",
  "COMPARE_SUGGEST",
  "ARTICLE_INLINE",
  "ARTICLE_NEXT_STEP",
  "ARTICLE_STORY_CREDITS",
  "REELS",
  "AWARDS_CATEGORY",
]);
export type PromotionSlot = z.infer<typeof promotionSlotSchema>;

export const promotionDisclosureSchema = z.enum(["SPONSORED", "SPONSORED_STORY", "CUSTOM"]);
export type PromotionDisclosure = z.infer<typeof promotionDisclosureSchema>;

export const promotionBillingIntervalSchema = z.enum(["DAY", "WEEK", "MONTH"]);
export type PromotionBillingInterval = z.infer<typeof promotionBillingIntervalSchema>;

export const DISCLOSURE_LABEL: Record<PromotionDisclosure, string> = {
  SPONSORED: "Sponsored",
  SPONSORED_STORY: "Sponsored story",
  CUSTOM: "",
};

/** Categories that may appear as complementary ads next to a given category (never same category). */
export const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  PHOTO_VIDEO: ["VENUE", "FLORIST_DECOR", "HAIR_MAKEUP", "BRIDAL_WEAR", "ENTERTAINMENT", "CAKE"],
  VENUE: ["PHOTO_VIDEO", "FLORIST_DECOR", "CATERER", "ENTERTAINMENT", "CAKE", "WEDDING_CARS"],
  FLORIST_DECOR: ["VENUE", "PHOTO_VIDEO", "BRIDAL_WEAR", "CAKE"],
  CATERER: ["VENUE", "CAKE", "ENTERTAINMENT", "PHOTO_VIDEO"],
  CAKE: ["CATERER", "VENUE", "PHOTO_VIDEO", "FLORIST_DECOR"],
  HAIR_MAKEUP: ["BRIDAL_WEAR", "PHOTO_VIDEO", "JEWELLERY", "BRIDAL_DRESSER"],
  BRIDAL_WEAR: ["HAIR_MAKEUP", "JEWELLERY", "PHOTO_VIDEO", "FLORIST_DECOR"],
  JEWELLERY: ["BRIDAL_WEAR", "HAIR_MAKEUP", "PHOTO_VIDEO"],
  ENTERTAINMENT: ["VENUE", "PHOTO_VIDEO", "CATERER"],
  WEDDING_CARS: ["VENUE", "PHOTO_VIDEO", "BRIDAL_WEAR"],
  TRANSPORT: ["VENUE", "PHOTO_VIDEO", "BRIDAL_WEAR"],
  PLANNER: ["VENUE", "PHOTO_VIDEO", "FLORIST_DECOR", "CATERER"],
};

export function complementaryCategoriesFor(category: string): string[] {
  return COMPLEMENTARY_CATEGORIES[category] ?? [];
}

export function effectivePromotionBadge(input: {
  source: string;
  badgeLabel?: string | null;
  disclosure?: PromotionDisclosure | null;
}): string | null {
  const disclosure = input.disclosure ?? "SPONSORED";
  const paid = input.source === "PAID" || input.source === "PAID_PENDING";
  if (paid) {
    return disclosure === "SPONSORED_STORY" ? DISCLOSURE_LABEL.SPONSORED_STORY : DISCLOSURE_LABEL.SPONSORED;
  }
  if (disclosure === "SPONSORED_STORY") return DISCLOSURE_LABEL.SPONSORED_STORY;
  if (disclosure === "SPONSORED") return DISCLOSURE_LABEL.SPONSORED;
  const label = input.badgeLabel?.trim() || null;
  if (label && !sanitizePaidBadgeLabel(label)) return "Featured";
  return label;
}

export const promotionSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: promotionStatusSchema,
  headline: z.string(),
  subheadline: z.string().nullable(),
  body: z.string().nullable(),
  ctaLabel: z.string().nullable(),
  ctaHref: z.string().nullable(),
  coverUrl: z.string().nullable(),
  secondaryUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  accentColor: z.string().nullable(),
  overlayTone: z.enum(["light", "dark"]).or(z.string()),
  layout: promotionLayoutSchema,
  badgeLabel: z.string().nullable(),
  effectiveBadge: z.string().nullable().optional(),
  effectiveLayout: promotionLayoutSchema.optional(),
  slots: z.array(promotionSlotSchema),
  cities: z.array(z.string()),
  categories: z.array(vendorCategorySchema),
  locales: z.array(z.string()),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  priority: z.number().int(),
  vendorId: z.string().nullable(),
  vendorName: z.string().nullable().optional(),
  vendorSlug: z.string().nullable().optional(),
  packageId: z.string().nullable().optional(),
  packageName: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  source: featuredPlacementSourceSchema,
  notes: z.string().nullable(),
  impressionCount: z.number().int(),
  clickCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completeness: completenessResultSchema.optional(),
});
export type Promotion = z.infer<typeof promotionSchema>;

export const upsertPromotionBodySchema = z.object({
  name: z.string().min(2).max(120),
  status: promotionStatusSchema.default("DRAFT"),
  headline: z.string().min(2).max(160),
  subheadline: z.string().max(240).nullable().optional(),
  body: z.string().max(2000).nullable().optional(),
  ctaLabel: z.string().max(60).nullable().optional(),
  ctaHref: z.string().max(500).nullable().optional(),
  coverUrl: z.string().max(1000).nullable().optional(),
  secondaryUrl: z.string().max(1000).nullable().optional(),
  logoUrl: z.string().max(1000).nullable().optional(),
  accentColor: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
      .nullable()
      .optional(),
  ),
  overlayTone: z.enum(["light", "dark"]).default("dark"),
  layout: promotionLayoutSchema.default("CARD"),
  badgeLabel: z.string().max(40).nullable().optional(),
  slots: z.array(promotionSlotSchema).default([]),
  cities: z.array(z.string().min(1)).default([]),
  categories: z.array(vendorCategorySchema).default([]),
  locales: z.array(z.string().min(2).max(8)).default([]),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  priority: z.number().int().min(0).max(1000).default(0),
  vendorId: z.string().nullable().optional(),
  packageId: z.string().nullable().optional(),
  source: featuredPlacementSourceSchema.default("EDITORIAL"),
  notes: z.string().max(2000).nullable().optional(),
});
export type UpsertPromotionBody = z.infer<typeof upsertPromotionBodySchema>;

export const promotionListQuerySchema = z.object({
  q: optionalQueryString,
  status: z.preprocess(emptyToUndefined, promotionStatusSchema.optional()),
  slot: z.preprocess(emptyToUndefined, promotionSlotSchema.optional()),
  vendorId: optionalQueryString,
});
export type PromotionListQuery = z.infer<typeof promotionListQuerySchema>;

export const publicPromotionQuerySchema = z.object({
  slot: promotionSlotSchema,
  city: optionalQueryString,
  category: z.preprocess(emptyToUndefined, vendorCategorySchema.optional()),
  locale: optionalQueryString,
  excludeCategory: z.preprocess(emptyToUndefined, vendorCategorySchema.optional()),
  /** Comma-separated vendor ids already shown on this page (frequency cap). */
  excludeVendorIds: optionalQueryString,
  /** Comma-separated vendor slugs already shown on this page. */
  excludeVendorSlugs: optionalQueryString,
  limit: z.coerce.number().int().min(1).max(24).optional(),
});
export type PublicPromotionQuery = z.infer<typeof publicPromotionQuerySchema>;

const BLOCKED_PAID_BADGES = ["ceylon pick", "award winner", "featured pick", "editor's pick", "editors pick"];

export function sanitizePaidBadgeLabel(label: string | null | undefined): boolean {
  if (!label?.trim()) return true;
  const normalized = label.trim().toLowerCase();
  return !BLOCKED_PAID_BADGES.some((blocked) => normalized.includes(blocked));
}

export const promotionSlotConfigSchema = z.object({
  id: z.string(),
  slot: promotionSlotSchema,
  enabled: z.boolean(),
  pageKey: z.string(),
  regionKey: z.string(),
  description: z.string().nullable(),
  defaultLayout: promotionLayoutSchema,
  maxPerRequest: z.number().int(),
  densityEveryN: z.number().int().nullable(),
  disclosure: promotionDisclosureSchema,
  priceLkr: z.number().int(),
  interval: promotionBillingIntervalSchema,
  currency: z.string(),
  sortOrder: z.number().int(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PromotionSlotConfig = z.infer<typeof promotionSlotConfigSchema>;

export const upsertPromotionSlotConfigBodySchema = z.object({
  slot: promotionSlotSchema,
  enabled: z.boolean(),
  pageKey: z.string().min(1).max(80),
  regionKey: z.string().min(1).max(80),
  description: z.string().max(500).nullable().optional(),
  defaultLayout: promotionLayoutSchema,
  maxPerRequest: z.number().int().min(1).max(24),
  densityEveryN: z.number().int().min(1).max(48).nullable().optional(),
  disclosure: promotionDisclosureSchema,
  priceLkr: z.number().int().min(0).max(10_000_000),
  interval: promotionBillingIntervalSchema,
  currency: z.string().min(3).max(8).default("LKR"),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  notes: z.string().max(2000).nullable().optional(),
});
export type UpsertPromotionSlotConfigBody = z.infer<typeof upsertPromotionSlotConfigBodySchema>;

export const publicPromotionSlotConfigSchema = z.object({
  slot: promotionSlotSchema,
  enabled: z.boolean(),
  defaultLayout: promotionLayoutSchema,
  maxPerRequest: z.number().int(),
  densityEveryN: z.number().int().nullable(),
  disclosure: promotionDisclosureSchema,
  pageKey: z.string(),
  regionKey: z.string(),
});
export type PublicPromotionSlotConfig = z.infer<typeof publicPromotionSlotConfigSchema>;

export const promotionPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  slots: z.array(promotionSlotSchema),
  priceLkr: z.number().int(),
  interval: promotionBillingIntervalSchema,
  durationDays: z.number().int(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  stripePriceId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PromotionPackage = z.infer<typeof promotionPackageSchema>;

export const upsertPromotionPackageBodySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).nullable().optional(),
  slots: z.array(promotionSlotSchema).min(1),
  priceLkr: z.number().int().min(0).max(10_000_000),
  interval: promotionBillingIntervalSchema.default("WEEK"),
  durationDays: z.number().int().min(1).max(365).default(7),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  stripePriceId: z.string().max(120).nullable().optional(),
});
export type UpsertPromotionPackageBody = z.infer<typeof upsertPromotionPackageBodySchema>;

export const trackPromotionBodySchema = z.object({
  slot: promotionSlotSchema.optional(),
});
export type TrackPromotionBody = z.infer<typeof trackPromotionBodySchema>;

export const DEFAULT_SLOT_CONFIGS: Array<{
  slot: PromotionSlot;
  enabled: boolean;
  pageKey: string;
  regionKey: string;
  description: string;
  defaultLayout: PromotionLayout;
  maxPerRequest: number;
  densityEveryN: number | null;
  disclosure: PromotionDisclosure;
  priceLkr: number;
  interval: PromotionBillingInterval;
  sortOrder: number;
}> = [
  {
    slot: "HOME_HERO",
    enabled: true,
    pageKey: "Homepage",
    regionKey: "Hero",
    description: "Full-width spotlight under the homepage hero",
    defaultLayout: "SPOTLIGHT",
    maxPerRequest: 1,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 45000,
    interval: "WEEK",
    sortOrder: 10,
  },
  {
    slot: "HOME_PICKS",
    enabled: true,
    pageKey: "Homepage",
    regionKey: "Picks",
    description: "Tiles alongside Ceylon Picks",
    defaultLayout: "PICKS_TILE",
    maxPerRequest: 2,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 25000,
    interval: "WEEK",
    sortOrder: 20,
  },
  {
    slot: "CATALOG_TOP",
    enabled: false,
    pageKey: "Vendor catalog",
    regionKey: "Top strip",
    description: "Legacy strip above results — prefer Catalog inline",
    defaultLayout: "STRIP",
    maxPerRequest: 1,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 20000,
    interval: "WEEK",
    sortOrder: 30,
  },
  {
    slot: "CATALOG_INLINE",
    enabled: true,
    pageKey: "Vendor catalog",
    regionKey: "Grid",
    description: "Native sponsored cards at positions 1, 6, then every N",
    defaultLayout: "CARD",
    maxPerRequest: 4,
    densityEveryN: 12,
    disclosure: "SPONSORED",
    priceLkr: 35000,
    interval: "WEEK",
    sortOrder: 40,
  },
  {
    slot: "CATALOG_DATE_AVAILABLE",
    enabled: true,
    pageKey: "Vendor catalog",
    regionKey: "Date available",
    description: "Sponsored vendors available on the couple's wedding date",
    defaultLayout: "CARD",
    maxPerRequest: 4,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 30000,
    interval: "WEEK",
    sortOrder: 50,
  },
  {
    slot: "CATALOG_MAP",
    enabled: true,
    pageKey: "Vendor catalog",
    regionKey: "Map",
    description: "Gold pins and first in map list",
    defaultLayout: "CARD",
    maxPerRequest: 6,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 28000,
    interval: "WEEK",
    sortOrder: 60,
  },
  {
    slot: "IDEAS_RAIL",
    enabled: false,
    pageKey: "Ideas",
    regionKey: "Rail",
    description: "Legacy ideas rail — prefer article inline",
    defaultLayout: "PICKS_TILE",
    maxPerRequest: 2,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 18000,
    interval: "WEEK",
    sortOrder: 70,
  },
  {
    slot: "IDEAS_INLINE",
    enabled: true,
    pageKey: "Ideas list",
    regionKey: "Grid",
    description: "Sponsored stories in the article grid",
    defaultLayout: "CARD",
    maxPerRequest: 2,
    densityEveryN: 6,
    disclosure: "SPONSORED_STORY",
    priceLkr: 22000,
    interval: "WEEK",
    sortOrder: 80,
  },
  {
    slot: "VENDOR_SIDEBAR",
    enabled: false,
    pageKey: "Vendor profile",
    regionKey: "Sidebar (deprecated)",
    description: "Deprecated — use Similar vendors",
    defaultLayout: "CARD",
    maxPerRequest: 2,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 15000,
    interval: "WEEK",
    sortOrder: 90,
  },
  {
    slot: "VENDOR_COMPLEMENTARY",
    enabled: true,
    pageKey: "Vendor profile",
    regionKey: "Complete your team",
    description: "Complementary vendors below reviews",
    defaultLayout: "CARD",
    maxPerRequest: 3,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 28000,
    interval: "WEEK",
    sortOrder: 100,
  },
  {
    slot: "VENDOR_SIMILAR",
    enabled: true,
    pageKey: "Vendor profile",
    regionKey: "Similar vendors",
    description: "Competitor strip at the bottom of the profile",
    defaultLayout: "CARD",
    maxPerRequest: 3,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 20000,
    interval: "WEEK",
    sortOrder: 110,
  },
  {
    slot: "COMPARE_SUGGEST",
    enabled: true,
    pageKey: "Compare",
    regionKey: "Add a third",
    description: "Sponsored third option when comparing two vendors",
    defaultLayout: "CARD",
    maxPerRequest: 1,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 32000,
    interval: "WEEK",
    sortOrder: 120,
  },
  {
    slot: "ARTICLE_INLINE",
    enabled: true,
    pageKey: "Idea article",
    regionKey: "Mid-article",
    description: "Contextual product card mid-article",
    defaultLayout: "CARD",
    maxPerRequest: 1,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 18000,
    interval: "WEEK",
    sortOrder: 130,
  },
  {
    slot: "ARTICLE_NEXT_STEP",
    enabled: true,
    pageKey: "Idea article",
    regionKey: "End CTA",
    description: "End-of-article booking prompt",
    defaultLayout: "BANNER",
    maxPerRequest: 1,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 16000,
    interval: "WEEK",
    sortOrder: 140,
  },
  {
    slot: "ARTICLE_STORY_CREDITS",
    enabled: true,
    pageKey: "Idea article",
    regionKey: "Shop this wedding",
    description: "Boost credited vendors with WhatsApp on real-wedding stories",
    defaultLayout: "CARD",
    maxPerRequest: 12,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 12000,
    interval: "WEEK",
    sortOrder: 150,
  },
  {
    slot: "REELS",
    enabled: true,
    pageKey: "Home / Ideas",
    regionKey: "Reels strip",
    description: "Wedding Reels strip inventory",
    defaultLayout: "STRIP",
    maxPerRequest: 6,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 24000,
    interval: "WEEK",
    sortOrder: 160,
  },
  {
    slot: "AWARDS_CATEGORY",
    enabled: true,
    pageKey: "Awards",
    regionKey: "Category sponsor",
    description: "Presented-by line on awards categories",
    defaultLayout: "BANNER",
    maxPerRequest: 1,
    densityEveryN: null,
    disclosure: "SPONSORED",
    priceLkr: 50000,
    interval: "MONTH",
    sortOrder: 170,
  },
];

/** Catalog inline insert indices (1-based positions → 0-based indices): 1, 6, then every densityEveryN. */
export function catalogInlineInsertIndices(organicCount: number, densityEveryN = 12, maxSlots = 4): number[] {
  const positions: number[] = [];
  if (organicCount <= 0) return positions;
  const candidates = [1, 6];
  for (let p = 6 + densityEveryN; p <= organicCount + maxSlots; p += densityEveryN) {
    candidates.push(p);
  }
  for (const pos of candidates) {
    if (positions.length >= maxSlots) break;
    const index = pos - 1;
    if (index <= organicCount + positions.length) positions.push(index);
  }
  return positions;
}

export function promotionCompleteness(promo: {
  name?: string | null;
  headline?: string | null;
  coverUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  slots?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
  layout?: string | null;
}): z.infer<typeof completenessResultSchema> {
  const checks: Array<{ key: string; ok: boolean }> = [
    { key: "name", ok: Boolean(promo.name?.trim()) },
    { key: "headline", ok: Boolean(promo.headline && promo.headline.trim().length >= 2) },
    { key: "cover", ok: Boolean(promo.coverUrl?.trim()) },
    { key: "cta", ok: Boolean(promo.ctaLabel?.trim() && promo.ctaHref?.trim()) },
    { key: "slots", ok: (promo.slots?.length ?? 0) > 0 },
    { key: "schedule", ok: Boolean(promo.startsAt && promo.endsAt) },
    { key: "layout", ok: Boolean(promo.layout) },
  ];
  const missing = checks.filter((item) => !item.ok).map((item) => item.key);
  return {
    score: checks.length - missing.length,
    total: checks.length,
    ready: missing.length === 0,
    missing,
  };
}

export function isPromotionLive(
  promo: { status: string; startsAt?: string | null; endsAt?: string | null },
  now = new Date(),
) {
  if (promo.status === "PAUSED" || promo.status === "ARCHIVED" || promo.status === "DRAFT") return false;
  if (promo.status === "ACTIVE") {
    if (promo.startsAt && new Date(promo.startsAt) > now) return false;
    if (promo.endsAt && new Date(promo.endsAt) < now) return false;
    return true;
  }
  if (promo.status === "SCHEDULED") {
    if (!promo.startsAt || !promo.endsAt) return false;
    const start = new Date(promo.startsAt);
    const end = new Date(promo.endsAt);
    return start <= now && end >= now;
  }
  return false;
}
