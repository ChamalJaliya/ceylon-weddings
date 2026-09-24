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
  "IDEAS_RAIL",
  "VENDOR_SIDEBAR",
]);
export type PromotionSlot = z.infer<typeof promotionSlotSchema>;

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
  limit: z.coerce.number().int().min(1).max(24).optional().default(6),
});
export type PublicPromotionQuery = z.infer<typeof publicPromotionQuerySchema>;

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
