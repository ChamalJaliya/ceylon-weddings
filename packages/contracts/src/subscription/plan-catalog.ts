import { z } from "zod";

/** Vendor membership plan slugs (adapted from Kloqra plan catalog). */
export const VENDOR_PLAN_SLUGS = {
  PRO: "pro",
  SPOTLIGHT: "spotlight",
} as const;

export type VendorPlanSlug = (typeof VENDOR_PLAN_SLUGS)[keyof typeof VENDOR_PLAN_SLUGS];

export const vendorPlanSlugSchema = z.enum([VENDOR_PLAN_SLUGS.PRO, VENDOR_PLAN_SLUGS.SPOTLIGHT]);

export const planBillingModeSchema = z.enum(["checkout", "contact"]);
export type PlanBillingMode = z.infer<typeof planBillingModeSchema>;

/** Checkout payment rails available to vendors. */
export const paymentProviderSchema = z.enum(["payhere", "stripe"]);
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

/** Product entitlements enforced for vendor Pro membership. */
export const vendorPlanLimitsSchema = z.object({
  maxPhotos: z.number().int().nonnegative(),
  maxVideos: z.number().int().nonnegative(),
  maxPackages: z.number().int().nonnegative(),
  whatsappLeads: z.boolean(),
  analytics: z.boolean(),
  featuredEligible: z.boolean(),
  spotlightEligible: z.boolean(),
});

export type VendorPlanLimits = z.infer<typeof vendorPlanLimitsSchema>;

/** Trial / free listing caps while on trial or expired without paid plan. */
export const TRIAL_VENDOR_CAPS = {
  maxPhotos: 12,
  maxVideos: 1,
  maxPackages: 3,
  whatsappLeads: true,
  analytics: false,
  featuredEligible: false,
  spotlightEligible: false,
} as const satisfies VendorPlanLimits;

export const DEFAULT_VENDOR_PLAN_LIMITS: Record<VendorPlanSlug, VendorPlanLimits> = {
  [VENDOR_PLAN_SLUGS.PRO]: {
    maxPhotos: 60,
    maxVideos: 8,
    maxPackages: 12,
    whatsappLeads: true,
    analytics: true,
    featuredEligible: true,
    spotlightEligible: false,
  },
  [VENDOR_PLAN_SLUGS.SPOTLIGHT]: {
    maxPhotos: 120,
    maxVideos: 20,
    maxPackages: 24,
    whatsappLeads: true,
    analytics: true,
    featuredEligible: true,
    spotlightEligible: true,
  },
};

export const DEFAULT_VENDOR_PLAN_FEATURES: Record<VendorPlanSlug, string[]> = {
  [VENDOR_PLAN_SLUGS.PRO]: [
    "Verified Pro badge on your storefront",
    "WhatsApp couple inquiries with lead alerts",
    "High-resolution galleries and showcase video",
    "Priority ranking in district & category search",
    "Reviews collection and verified rating score",
  ],
  [VENDOR_PLAN_SLUGS.SPOTLIGHT]: [
    "Everything in Pro",
    "Spotlight / featured placement eligibility",
    "Campaign creative slots across catalog",
    "Dedicated growth support from Ceylon Ops",
  ],
};

export const DEFAULT_PRICING_BASELINE_FEATURES = [
  "Public storefront on Ceylon Weddings",
  "Mobile-friendly vendor tools",
  "Support from the Ceylon Ops team",
] as const;

export const TRIAL_DURATION_MONTHS = 3;
export const DEFAULT_GRACE_DAYS = 7;

export function canonicalizeVendorPlanSlug(slug: string): VendorPlanSlug | string {
  const normalized = slug.trim().toLowerCase();
  if (normalized === "monthly-pro" || normalized === "annual-pro" || normalized === "vendor-pro") {
    return VENDOR_PLAN_SLUGS.PRO;
  }
  if (normalized === "featured" || normalized === "spotlight-pro") {
    return VENDOR_PLAN_SLUGS.SPOTLIGHT;
  }
  return normalized;
}

export function buildVendorPlanDisplayFeatures(input: {
  slug: string;
  features?: string[] | null;
  billingMode?: PlanBillingMode | string | null;
  baselineFeatures?: readonly string[];
}): string[] {
  const slug = canonicalizeVendorPlanSlug(input.slug);
  const tierExtras = input.features?.length
    ? input.features
    : slug in DEFAULT_VENDOR_PLAN_FEATURES
      ? DEFAULT_VENDOR_PLAN_FEATURES[slug as VendorPlanSlug]
      : [];
  const baseline = input.baselineFeatures ?? DEFAULT_PRICING_BASELINE_FEATURES;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of [...tierExtras, ...baseline]) {
    const trimmed = line.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  if (input.billingMode === "contact" && !out.some((f) => /sales|custom|spotlight/i.test(f))) {
    out.push("Custom placement — talk to sales");
  }
  return out;
}
