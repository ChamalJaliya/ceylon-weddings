import { z } from "zod";

/** Uppercase slug for vendor types (e.g. PHOTO_VIDEO). Length 2–48. */
export const VENDOR_CATEGORY_SLUG_REGEX = /^[A-Z][A-Z0-9_]{1,47}$/;

/** Former Prisma enum values — seed/docs only, not used for Zod enum validation. */
export const LEGACY_VENDOR_CATEGORY_SLUGS = [
  "VENUE",
  "PHOTO_VIDEO",
  "BRIDAL_WEAR",
  "GROOM_WEAR",
  "JEWELLERY",
  "HAIR_MAKEUP",
  "BRIDAL_DRESSER",
  "FLORIST_DECOR",
  "CATERER",
  "CAKE",
  "ENTERTAINMENT",
  "PORUWA",
  "ASTROLOGY",
  "WEDDING_CARS",
  "INVITATIONS",
  "PLANNER",
  "REGISTRAR",
  "MEHNDI",
  "TRANSPORT",
  "ACCOMMODATION",
] as const;

export const vendorCategorySchema = z
  .string()
  .regex(VENDOR_CATEGORY_SLUG_REGEX, "Invalid vendor category slug");
export type VendorCategory = z.infer<typeof vendorCategorySchema>;

export const packageTierSchema = z.enum(["BASIC", "ADVANCED", "DREAM"]);
export const priceDisplayModeSchema = z.enum(["FIXED", "FROM", "ON_REQUEST"]);
export const packagePricingModeSchema = z.enum(["FIXED", "FROM", "RANGE", "PER_GUEST", "ON_REQUEST"]);
export const packageStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export const packageBadgeSchema = z.enum(["POPULAR", "BEST_VALUE", "LIMITED"]);
export const packageEventTypeSchema = z.enum([
  "WEDDING",
  "HOMECOMING",
  "ENGAGEMENT",
  "PRESHOOT",
  "PORUWA",
  "DESTINATION",
  "REGISTRATION",
]);
export const subscriptionStatusSchema = z.enum([
  "TRIAL",
  "ACTIVE",
  "GRACE",
  "EXPIRED",
  "CANCELLED",
  "COMPED",
]);
export const billingIntervalSchema = z.enum(["MONTHLY", "ANNUAL"]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type BillingInterval = z.infer<typeof billingIntervalSchema>;
export type PriceDisplayMode = z.infer<typeof priceDisplayModeSchema>;
export type PackagePricingMode = z.infer<typeof packagePricingModeSchema>;
export type PackageStatus = z.infer<typeof packageStatusSchema>;
export type PackageBadge = z.infer<typeof packageBadgeSchema>;
export type PackageEventType = z.infer<typeof packageEventTypeSchema>;
