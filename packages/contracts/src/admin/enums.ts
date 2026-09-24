import { z } from "zod";

export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const vendorModerationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]);
export type VendorModerationStatus = z.infer<typeof vendorModerationStatusSchema>;

export const articleStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type ArticleStatus = z.infer<typeof articleStatusSchema>;

export const reportEntityTypeSchema = z.enum(["VENDOR", "INQUIRY", "REVIEW", "ARTICLE", "USER"]);
export type ReportEntityType = z.infer<typeof reportEntityTypeSchema>;

export const reportStatusSchema = z.enum(["OPEN", "RESOLVED", "DISMISSED"]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const featuredPlacementSourceSchema = z.enum(["EDITORIAL", "COMPED", "PAID_PENDING", "PAID"]);
export type FeaturedPlacementSource = z.infer<typeof featuredPlacementSourceSchema>;

export const adminCapabilitySchema = z.enum([
  "MANAGE_VENDORS",
  "MANAGE_USERS",
  "MANAGE_CONTENT",
  "MANAGE_REPORTS",
  "MANAGE_FEATURED",
  "VIEW_AUDIT",
  "IMPERSONATE",
  "MANAGE_SETTINGS",
]);
export type AdminCapability = z.infer<typeof adminCapabilitySchema>;

export const awardNominationStatusSchema = z.enum(["NOMINATED", "SHORTLISTED", "WINNER", "REJECTED"]);
export type AwardNominationStatus = z.infer<typeof awardNominationStatusSchema>;

export const cmsPageStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export type CmsPageStatus = z.infer<typeof cmsPageStatusSchema>;

export const cmsPageSlugSchema = z.enum(["about", "faq", "terms", "privacy", "contact"]);
export type CmsPageSlug = z.infer<typeof cmsPageSlugSchema>;

export const analyticsEventKindSchema = z.enum([
  "VENDOR_PROFILE_VIEW",
  "WHATSAPP_TAP",
  "INQUIRY_CREATED",
  "ARTICLE_VIEW",
]);
export type AnalyticsEventKind = z.infer<typeof analyticsEventKindSchema>;
