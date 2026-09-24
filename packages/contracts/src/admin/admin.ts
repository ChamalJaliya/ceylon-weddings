import { z } from "zod";
import { emptyToUndefined, optionalQueryString, queryBoolean } from "../query";
import { roleSchema } from "../common";
import { vendorCategorySchema } from "../vendor/enums";
import { articleCategorySchema } from "../content/articles";
import {
  adminCapabilitySchema,
  articleStatusSchema,
  awardNominationStatusSchema,
  featuredPlacementSourceSchema,
  reportEntityTypeSchema,
  reportStatusSchema,
  userStatusSchema,
  vendorModerationStatusSchema,
} from "./enums";

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: roleSchema,
  status: userStatusSchema,
  capabilities: z.array(adminCapabilitySchema).default([]),
  totpEnabled: z.boolean().optional(),
  phone: z.string().nullable().optional(),
  createdAt: z.string(),
  vendorId: z.string().nullable().optional(),
  weddingCount: z.number().int().optional(),
  sessionCount: z.number().int().optional(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminStatsSchema = z.object({
  vendorsTotal: z.number().int(),
  vendorsVerified: z.number().int(),
  vendorsPendingVerify: z.number().int(),
  vendorsFeatured: z.number().int(),
  vendorsGateFailFeaturedCandidates: z.number().int(),
  vendorsHidden: z.number().int(),
  usersTotal: z.number().int(),
  usersSuspended: z.number().int(),
  reportsOpen: z.number().int(),
  articlesDraft: z.number().int(),
  inquiriesNew: z.number().int(),
  weddingsTotal: z.number().int(),
  placementsActive: z.number().int(),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

export const adminVendorListQuerySchema = z.object({
  q: optionalQueryString,
  category: z.preprocess(emptyToUndefined, vendorCategorySchema.optional()),
  city: optionalQueryString,
  verified: queryBoolean.optional(),
  featured: queryBoolean.optional(),
  moderationStatus: z.preprocess(emptyToUndefined, vendorModerationStatusSchema.optional()),
  gateReady: queryBoolean.optional(),
  queue: z.preprocess(emptyToUndefined, z.enum(["verify", "picks"]).optional()),
});
export type AdminVendorListQuery = z.infer<typeof adminVendorListQuerySchema>;

export const adminPatchVendorBodySchema = z.object({
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  moderationStatus: vendorModerationStatusSchema.optional(),
  moderationNote: z.string().max(2000).nullable().optional(),
});
export type AdminPatchVendorBody = z.infer<typeof adminPatchVendorBodySchema>;

export const adminBulkVendorBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
});
export type AdminBulkVendorBody = z.infer<typeof adminBulkVendorBodySchema>;

export const adminUserListQuerySchema = z.object({
  q: optionalQueryString,
  role: z.preprocess(emptyToUndefined, roleSchema.optional()),
  status: z.preprocess(emptyToUndefined, userStatusSchema.optional()),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const adminPatchUserBodySchema = z.object({
  status: userStatusSchema.optional(),
  role: roleSchema.optional(),
  capabilities: z.array(adminCapabilitySchema).optional(),
});
export type AdminPatchUserBody = z.infer<typeof adminPatchUserBodySchema>;

export const auditLogSchema = z.object({
  id: z.string(),
  actorUserId: z.string().nullable(),
  actorName: z.string().nullable().optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  before: z.unknown().nullable().optional(),
  after: z.unknown().nullable().optional(),
  ip: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

export const adminAuditListQuerySchema = z.object({
  q: optionalQueryString,
  entityType: optionalQueryString,
  entityId: optionalQueryString,
  actorUserId: optionalQueryString,
});
export type AdminAuditListQuery = z.infer<typeof adminAuditListQuerySchema>;

export const reportSchema = z.object({
  id: z.string(),
  reporterUserId: z.string().nullable(),
  reporterName: z.string().nullable().optional(),
  entityType: reportEntityTypeSchema,
  entityId: z.string(),
  reason: z.string(),
  details: z.string().nullable(),
  status: reportStatusSchema,
  resolvedById: z.string().nullable(),
  resolutionNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Report = z.infer<typeof reportSchema>;

export const createReportBodySchema = z.object({
  entityType: reportEntityTypeSchema,
  entityId: z.string().min(1),
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional(),
});
export type CreateReportBody = z.infer<typeof createReportBodySchema>;

export const resolveReportBodySchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  resolutionNote: z.string().max(2000).optional(),
});
export type ResolveReportBody = z.infer<typeof resolveReportBodySchema>;

export const adminArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  body: z.string(),
  category: articleCategorySchema,
  coverUrl: z.string(),
  locale: z.string(),
  featured: z.boolean(),
  status: articleStatusSchema,
  vendorSlugs: z.array(z.string()),
  authorUserId: z.string().nullable().optional(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminArticle = z.infer<typeof adminArticleSchema>;

export const upsertAdminArticleBodySchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  excerpt: z.string().min(2).max(500),
  body: z.string().min(2),
  category: articleCategorySchema,
  coverUrl: z.string().min(1),
  locale: z.string().default("en"),
  featured: z.boolean().default(false),
  status: articleStatusSchema.default("DRAFT"),
  vendorSlugs: z.array(z.string()).default([]),
  publishedAt: z.string().datetime().nullable().optional(),
});
export type UpsertAdminArticleBody = z.infer<typeof upsertAdminArticleBodySchema>;

export const adminWeddingSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  partnerOneName: z.string(),
  partnerTwoName: z.string(),
  date: z.string().nullable(),
  city: z.string().nullable(),
  district: z.string().nullable(),
  memberEmails: z.array(z.string()),
  bookedVendorCount: z.number().int(),
  guestHouseholdCount: z.number().int(),
  createdAt: z.string(),
});
export type AdminWeddingSummary = z.infer<typeof adminWeddingSummarySchema>;

export const adminWeddingListQuerySchema = z.object({
  q: optionalQueryString,
});
export type AdminWeddingListQuery = z.infer<typeof adminWeddingListQuerySchema>;

export const adminInquirySchema = z.object({
  id: z.string(),
  message: z.string(),
  status: z.enum(["NEW", "REPLIED", "CLOSED"]),
  whatsappUrl: z.string().nullable(),
  preferredDate: z.string().nullable(),
  createdAt: z.string(),
  vendorId: z.string(),
  vendorName: z.string(),
  weddingId: z.string(),
  weddingSlug: z.string(),
  coupleNames: z.string(),
});
export type AdminInquiry = z.infer<typeof adminInquirySchema>;

export const featuredPlacementSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  city: z.string().nullable(),
  category: vendorCategorySchema.nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  priority: z.number().int(),
  source: featuredPlacementSourceSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FeaturedPlacement = z.infer<typeof featuredPlacementSchema>;

export const upsertFeaturedPlacementBodySchema = z.object({
  vendorId: z.string().min(1),
  city: z.string().nullable().optional(),
  category: vendorCategorySchema.nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  priority: z.number().int().default(0),
  source: featuredPlacementSourceSchema.default("EDITORIAL"),
  notes: z.string().max(2000).nullable().optional(),
});
export type UpsertFeaturedPlacementBody = z.infer<typeof upsertFeaturedPlacementBodySchema>;

export const featureFlagSchema = z.object({
  id: z.string(),
  key: z.string(),
  enabled: z.boolean(),
  description: z.string().nullable(),
  updatedAt: z.string(),
  createdAt: z.string(),
});
export type FeatureFlag = z.infer<typeof featureFlagSchema>;

export const upsertFeatureFlagBodySchema = z.object({
  key: z.string().min(2).max(80).regex(/^[a-z0-9._-]+$/),
  enabled: z.boolean(),
  description: z.string().max(500).nullable().optional(),
});
export type UpsertFeatureFlagBody = z.infer<typeof upsertFeatureFlagBodySchema>;

export const awardNominationSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  year: z.number().int(),
  category: vendorCategorySchema,
  status: awardNominationStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AwardNomination = z.infer<typeof awardNominationSchema>;

export const upsertAwardNominationBodySchema = z.object({
  vendorId: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  category: vendorCategorySchema,
  status: awardNominationStatusSchema.default("NOMINATED"),
  notes: z.string().max(2000).nullable().optional(),
});
export type UpsertAwardNominationBody = z.infer<typeof upsertAwardNominationBodySchema>;

export const adminReviewSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  authorName: z.string(),
  rating: z.number(),
  body: z.string(),
  recommended: z.boolean(),
  hidden: z.boolean(),
  createdAt: z.string(),
});
export type AdminReview = z.infer<typeof adminReviewSchema>;

export const adminJobHealthSchema = z.object({
  emailQueue: z.object({
    waiting: z.number().int(),
    active: z.number().int(),
    completed: z.number().int(),
    failed: z.number().int(),
    delayed: z.number().int(),
  }),
});
export type AdminJobHealth = z.infer<typeof adminJobHealthSchema>;

export const impersonateBodySchema = z.object({
  userId: z.string().min(1),
});
export type ImpersonateBody = z.infer<typeof impersonateBodySchema>;

export const adminAnalyticsSummarySchema = z.object({
  profileViews7d: z.number().int(),
  whatsappTaps7d: z.number().int(),
  inquiries7d: z.number().int(),
  articleViews7d: z.number().int(),
});
export type AdminAnalyticsSummary = z.infer<typeof adminAnalyticsSummarySchema>;
