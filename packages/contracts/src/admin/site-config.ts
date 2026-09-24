import { z } from "zod";
import { consultationSettingsSchema } from "../consultation/settings";
import { vendorCategorySchema } from "../vendor/enums";
import { siteOnboardingPresentationSchema } from "../vendor/onboarding-stage";
import { awardNominationStatusSchema, cmsPageSlugSchema, cmsPageStatusSchema } from "./enums";

export const FEATURE_FLAG_CATALOG = [
  {
    key: "reviews.enabled",
    description: "Show reviews on vendor storefronts and allow couple review submission",
    defaultEnabled: true,
  },
  {
    key: "awards.public",
    description: "Publish Best of Ceylon awards on the public /awards page",
    defaultEnabled: true,
  },
  {
    key: "ideas.public",
    description: "Show Ideas & Inspiration in public navigation and routes",
    defaultEnabled: true,
  },
  {
    key: "ads.public",
    description: "Render public promotion / ad slot rails",
    defaultEnabled: true,
  },
  {
    key: "consultations.public",
    description: "Let guests book a free consultation with the platform team on /consultation",
    defaultEnabled: true,
  },
  {
    key: "site.maintenance",
    description: "Show the maintenance banner from branding config on public pages",
    defaultEnabled: false,
  },
] as const;

export const featureFlagCatalogKeySchema = z.enum([
  "reviews.enabled",
  "awards.public",
  "ideas.public",
  "ads.public",
  "consultations.public",
  "site.maintenance",
]);
export type FeatureFlagCatalogKey = z.infer<typeof featureFlagCatalogKeySchema>;

export const siteBrandingSchema = z.object({
  logoUrl: z.string().nullable().optional(),
  tagline: z.string().max(200).default("Sri Lanka's wedding planning platform."),
  footerBlurb: z
    .string()
    .max(500)
    .default(
      "Browse 250+ verified Sri Lankan vendors, manage your checklist, budget, guest list, and custom RSVP website — all in one place.",
    ),
  contactEmail: z.union([z.string().email(), z.literal("")]).default("hello@ceylonweddings.com"),
  contactPhone: z.string().max(40).default("+94 11 234 5678"),
  whatsapp: z.string().max(40).default("+94771234567"),
  socialInstagram: z.string().max(200).nullable().optional(),
  socialFacebook: z.string().max(200).nullable().optional(),
  socialTiktok: z.string().max(200).nullable().optional(),
  maintenanceBanner: z
    .object({
      enabled: z.boolean().default(false),
      message: z.string().max(300).default(""),
    })
    .default({ enabled: false, message: "" }),
});
export type SiteBranding = z.infer<typeof siteBrandingSchema>;

export const siteHomepageHeroSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).default(""),
  ctaPrimaryLabel: z.string().max(80).default("Browse vendors"),
  ctaPrimaryHref: z.string().max(200).default("/vendors"),
  ctaSecondaryLabel: z.string().max(80).default("Start planning"),
  ctaSecondaryHref: z.string().max(200).default("/register"),
  imageUrl: z.string().min(1),
  chips: z.array(z.string().max(60)).max(6).default([]),
});

export const siteHomepageStatSchema = z.object({
  value: z.string().max(40),
  label: z.string().max(80),
});

export const siteHomepageHowItWorksSchema = z.object({
  title: z.string().max(120),
  body: z.string().max(500),
});

export const siteHomepageSeoSchema = z.object({
  title: z.string().max(120),
  description: z.string().max(400),
  ogImage: z.string().min(1),
});

export const siteHomepageSchema = z.object({
  hero: siteHomepageHeroSchema,
  stats: z.array(siteHomepageStatSchema).max(8).default([]),
  categoryKeys: z.array(vendorCategorySchema).max(20).default([]),
  howItWorks: z.array(siteHomepageHowItWorksSchema).max(6).default([]),
  seo: siteHomepageSeoSchema,
});
export type SiteHomepage = z.infer<typeof siteHomepageSchema>;

export const siteConfigSchema = z.object({
  id: z.string(),
  branding: siteBrandingSchema,
  homepage: siteHomepageSchema,
  onboarding: siteOnboardingPresentationSchema.nullable().optional(),
  consultations: consultationSettingsSchema,
  updatedById: z.string().nullable().optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
});
export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const updateSiteConfigBodySchema = z.object({
  branding: siteBrandingSchema,
  homepage: siteHomepageSchema,
  onboarding: siteOnboardingPresentationSchema.nullable().optional(),
  consultations: consultationSettingsSchema.optional(),
});
export type UpdateSiteConfigBody = z.infer<typeof updateSiteConfigBodySchema>;

export const publicSiteConfigSchema = z.object({
  branding: siteBrandingSchema,
  homepage: siteHomepageSchema,
  onboarding: siteOnboardingPresentationSchema.nullable().optional(),
});
export type PublicSiteConfig = z.infer<typeof publicSiteConfigSchema>;

export const cmsPageSeoSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(400).optional(),
});

export const cmsPageSchema = z.object({
  id: z.string(),
  slug: cmsPageSlugSchema,
  title: z.string(),
  excerpt: z.string().nullable(),
  body: z.string(),
  locale: z.string(),
  status: cmsPageStatusSchema,
  seo: cmsPageSeoSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CmsPage = z.infer<typeof cmsPageSchema>;

export const upsertCmsPageBodySchema = z.object({
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).nullable().optional(),
  body: z.string().min(2),
  locale: z.string().default("en"),
  status: cmsPageStatusSchema.default("DRAFT"),
  seo: cmsPageSeoSchema.nullable().optional(),
});
export type UpsertCmsPageBody = z.infer<typeof upsertCmsPageBodySchema>;

export const publicFlagsSchema = z.record(z.string(), z.boolean());
export type PublicFlags = z.infer<typeof publicFlagsSchema>;

export const publicAwardVendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  city: z.string().nullable(),
  district: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  ratingAvg: z.number().nullable().optional(),
  reviewCount: z.number().int().optional(),
});

export const publicAwardSchema = z.object({
  id: z.string(),
  year: z.number().int(),
  category: vendorCategorySchema,
  status: z.enum(["SHORTLISTED", "WINNER"]),
  notes: z.string().nullable(),
  vendor: publicAwardVendorSchema,
});
export type PublicAward = z.infer<typeof publicAwardSchema>;

export const DEFAULT_SITE_BRANDING: SiteBranding = {
  logoUrl: null,
  tagline: "Sri Lanka's wedding planning platform.",
  footerBlurb:
    "Browse 250+ verified Sri Lankan vendors, manage your checklist, budget, guest list, and custom RSVP website — all in one place.",
  contactEmail: "hello@ceylonweddings.com",
  contactPhone: "+94 11 234 5678",
  whatsapp: "+94771234567",
  socialInstagram: "https://instagram.com/ceylonweddings",
  socialFacebook: null,
  socialTiktok: null,
  maintenanceBanner: { enabled: false, message: "" },
};

export const DEFAULT_SITE_HOMEPAGE: SiteHomepage = {
  hero: {
    title: "Your perfect Sri Lankan wedding begins here.",
    subtitle: "Plan poruwa, church, nikah, and homecoming with verified island vendors.",
    ctaPrimaryLabel: "Browse vendors",
    ctaPrimaryHref: "/vendors",
    ctaSecondaryLabel: "Start planning",
    ctaSecondaryHref: "/register",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    chips: ["Poruwa ceremony", "Church & nikah", "All island"],
  },
  stats: [
    { value: "250+", label: "Verified Vendors" },
    { value: "1,200+", label: "Couples Served" },
    { value: "4.9", label: "Average Rating" },
    { value: "All Island", label: "Coverage" },
  ],
  categoryKeys: [
    "VENUE",
    "PHOTO_VIDEO",
    "FLORIST_DECOR",
    "CATERER",
    "PORUWA",
    "HAIR_MAKEUP",
    "BRIDAL_WEAR",
    "CAKE",
    "WEDDING_CARS",
    "ENTERTAINMENT",
  ],
  howItWorks: [
    {
      title: "Create your wedding profile",
      body: "Set your ceremony types — poruwa, church, nikah, homecoming. Add partner names, city, guest count, and budget. Invite Amma, your partner, or a planner.",
    },
    {
      title: "Discover the right vendors",
      body: "Browse venues, photography, florists, caterers, and traditional specialists. Every listing is Sri Lanka first — not a US template.",
    },
    {
      title: "Connect on WhatsApp",
      body: "Inquire directly on WhatsApp — where the conversation already lives. Vendors get a lead; you keep your thread.",
    },
  ],
  seo: {
    title: "Ceylon Weddings — Plan a Sri Lankan wedding in one place",
    description:
      "Ceylon Weddings is Sri Lanka's wedding planning platform. Browse 250+ verified vendors, manage your checklist, budget, and guest list — all in one place. Poruwa, church, nikah, walima, and homecoming.",
    ogImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
  },
};

export const DEFAULT_CMS_PAGES: Array<{
  slug: z.infer<typeof cmsPageSlugSchema>;
  title: string;
  excerpt: string;
  body: string;
  seo: { title: string; description: string };
}> = [
  {
    slug: "about",
    title: "About us",
    excerpt: "Built for Sri Lankan weddings.",
    body: `## Built for Sri Lankan weddings

A poruwa in Colombo. A church in Kandy. A nikah in Kalmunai. A walima in Gampaha. A homecoming in Galle.

We built Ceylon Weddings because Sri Lankan couples deserve a platform that understands every ceremony, every family structure, and every LKR. Not just a re-skinned Western template.

### Sri Lanka first
Poruwa, nikah, church, and homecoming ceremonies are supported out of the box with the right traditions and timings.

### WhatsApp native
Inquire and negotiate with vendors directly where your conversations already happen.

### Family-aware
Invite Amma, your partner, or a planner. We support household-based guest lists and collaborative planning for the whole family.`,
    seo: {
      title: "About us — Ceylon Weddings",
      description:
        "Built for Sri Lankan weddings. The planning platform that understands every ceremony, every family structure, and every LKR.",
    },
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    excerpt: "Answers for couples and vendors.",
    body: `## Couples

**Is Ceylon Weddings free for couples?**
Yes. Planning tools, guest list, budget, and wedding website lite are free for couples.

**Can I invite family to help plan?**
Yes. Invite a partner, parents, or planner with role-based access.

## Vendors

**How do I get leads?**
Couples inquire on WhatsApp from your storefront. Keep your listing complete and verified to appear in search and featured rails.

**Are there paid placements?**
Yes. Featured boosts and custom ads can be scheduled; contact the Ceylon Ops team for campaigns.`,
    seo: {
      title: "FAQ | Ceylon Weddings",
      description: "Frequently asked questions about Ceylon Weddings for couples and vendors.",
    },
  },
  {
    slug: "terms",
    title: "Terms of Service",
    excerpt: "Please read these terms carefully before using our platform.",
    body: `## 1. Acceptance
By accessing or using Ceylon Weddings, you agree to be bound by these Terms of Service.

## 2. The service
Ceylon Weddings provides free planning tools for couples and a vendor marketplace. We strive to maintain a high-quality platform but do not guarantee uninterrupted access or specific results.

## 3. Couple accounts
Couples must provide accurate information when creating an account. You are responsible for safeguarding your login credentials.

## 4. Vendor listings
Vendors must provide accurate business information. We may verify, feature, hide, or remove listings that violate our policies.

## 5. Intellectual property
The platform, its original content, features, and functionality are owned by Ceylon Weddings.

## 6. Limitation of liability
In no event shall Ceylon Weddings be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the service.`,
    seo: {
      title: "Terms of Service | Ceylon Weddings",
      description: "Terms of service and user agreements for Ceylon Weddings.",
    },
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    excerpt: "How we collect, use, and protect your information.",
    body: `## Information we collect
Account details, wedding planning data, vendor listing content, and usage analytics needed to operate the platform.

## How we use information
To provide planning tools, marketplace discovery, support, and product improvements.

## Sharing
We do not sell personal data. Vendor contact flows (such as WhatsApp inquiries) share the details you choose to send.

## Retention & security
We retain data while accounts are active and apply reasonable security controls. Contact us to request account deletion.`,
    seo: {
      title: "Privacy Policy | Ceylon Weddings",
      description: "Privacy policy for Ceylon Weddings.",
    },
  },
  {
    slug: "contact",
    title: "Contact us",
    excerpt: "Get in touch with the Ceylon Weddings team.",
    body: `## We are here to help
Reach the Ceylon Ops team for couple support, vendor onboarding, or partnership inquiries.

Use the form on this page, email hello@ceylonweddings.com, or WhatsApp our support line during business hours (Colombo).`,
    seo: {
      title: "Contact Us | Ceylon Weddings",
      description: "Get in touch with the Ceylon Weddings team.",
    },
  },
];

/** Re-export for award public filter typing */
export const publicAwardStatusFilter = awardNominationStatusSchema;
