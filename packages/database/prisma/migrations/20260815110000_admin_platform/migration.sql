-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "VendorModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ReportEntityType" AS ENUM ('VENDOR', 'INQUIRY', 'REVIEW', 'ARTICLE', 'USER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');
CREATE TYPE "FeaturedPlacementSource" AS ENUM ('EDITORIAL', 'COMPED', 'PAID_PENDING', 'PAID');
CREATE TYPE "AdminCapability" AS ENUM ('MANAGE_VENDORS', 'MANAGE_USERS', 'MANAGE_CONTENT', 'MANAGE_REPORTS', 'MANAGE_FEATURED', 'VIEW_AUDIT', 'IMPERSONATE', 'MANAGE_SETTINGS');
CREATE TYPE "AwardNominationStatus" AS ENUM ('NOMINATED', 'SHORTLISTED', 'WINNER', 'REJECTED');
CREATE TYPE "AnalyticsEventKind" AS ENUM ('VENDOR_PROFILE_VIEW', 'WHATSAPP_TAP', 'INQUIRY_CREATED', 'ARTICLE_VIEW');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "capabilities" "AdminCapability"[] DEFAULT ARRAY[]::"AdminCapability"[];
ALTER TABLE "User" ADD COLUMN "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Vendor
ALTER TABLE "Vendor" ADD COLUMN "moderationStatus" "VendorModerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Vendor" ADD COLUMN "moderationNote" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Vendor" ADD COLUMN "featuredAt" TIMESTAMP(3);
ALTER TABLE "Vendor" ADD COLUMN "hiddenAt" TIMESTAMP(3);
UPDATE "Vendor" SET "moderationStatus" = 'APPROVED' WHERE "verified" = true;
UPDATE "Vendor" SET "verifiedAt" = CURRENT_TIMESTAMP WHERE "verified" = true;
UPDATE "Vendor" SET "featuredAt" = CURRENT_TIMESTAMP WHERE "featured" = true;
CREATE INDEX "Vendor_moderationStatus_idx" ON "Vendor"("moderationStatus");
CREATE INDEX "Vendor_verified_featured_idx" ON "Vendor"("verified", "featured");

-- AlterTable Review
ALTER TABLE "Review" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Article
ALTER TABLE "Article" ADD COLUMN "status" "ArticleStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Article" ADD COLUMN "authorUserId" TEXT;
ALTER TABLE "Article" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Article" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Article" ALTER COLUMN "publishedAt" DROP NOT NULL;
CREATE INDEX "Article_status_featured_idx" ON "Article"("status", "featured");
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Report
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT,
    "entityType" "ReportEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_entityType_entityId_idx" ON "Report"("entityType", "entityId");
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable FeaturedPlacement
CREATE TABLE "FeaturedPlacement" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "city" TEXT,
    "category" "VendorCategory",
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source" "FeaturedPlacementSource" NOT NULL DEFAULT 'EDITORIAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeaturedPlacement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FeaturedPlacement_startsAt_endsAt_idx" ON "FeaturedPlacement"("startsAt", "endsAt");
CREATE INDEX "FeaturedPlacement_vendorId_idx" ON "FeaturedPlacement"("vendorId");
ALTER TABLE "FeaturedPlacement" ADD CONSTRAINT "FeaturedPlacement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable FeatureFlag
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateTable AnalyticsEvent
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "kind" "AnalyticsEventKind" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "userId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnalyticsEvent_kind_createdAt_idx" ON "AnalyticsEvent"("kind", "createdAt");
CREATE INDEX "AnalyticsEvent_entityType_entityId_idx" ON "AnalyticsEvent"("entityType", "entityId");

-- CreateTable AwardNomination
CREATE TABLE "AwardNomination" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "status" "AwardNominationStatus" NOT NULL DEFAULT 'NOMINATED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AwardNomination_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AwardNomination_vendorId_year_category_key" ON "AwardNomination"("vendorId", "year", "category");
CREATE INDEX "AwardNomination_year_status_idx" ON "AwardNomination"("year", "status");
ALTER TABLE "AwardNomination" ADD CONSTRAINT "AwardNomination_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PaymentIntent
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT,
    "userId" TEXT,
    "provider" TEXT NOT NULL,
    "externalId" TEXT,
    "amountLkr" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PaymentIntent_status_createdAt_idx" ON "PaymentIntent"("status", "createdAt");
CREATE INDEX "PaymentIntent_vendorId_idx" ON "PaymentIntent"("vendorId");
