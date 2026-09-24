-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "PromotionLayout" AS ENUM ('SPOTLIGHT', 'BANNER', 'CARD', 'STRIP', 'PICKS_TILE');
CREATE TYPE "PromotionSlot" AS ENUM ('HOME_HERO', 'HOME_PICKS', 'CATALOG_TOP', 'CATALOG_INLINE', 'IDEAS_RAIL', 'VENDOR_SIDEBAR');

-- AlterEnum
ALTER TYPE "AnalyticsEventKind" ADD VALUE 'PROMO_IMPRESSION';
ALTER TYPE "AnalyticsEventKind" ADD VALUE 'PROMO_CLICK';

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "headline" TEXT NOT NULL,
    "subheadline" TEXT,
    "body" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "coverUrl" TEXT,
    "secondaryUrl" TEXT,
    "logoUrl" TEXT,
    "accentColor" TEXT,
    "overlayTone" TEXT NOT NULL DEFAULT 'dark',
    "layout" "PromotionLayout" NOT NULL DEFAULT 'CARD',
    "badgeLabel" TEXT,
    "slots" "PromotionSlot"[] DEFAULT ARRAY[]::"PromotionSlot"[],
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" "VendorCategory"[] DEFAULT ARRAY[]::"VendorCategory"[],
    "locales" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "vendorId" TEXT,
    "createdById" TEXT,
    "source" "FeaturedPlacementSource" NOT NULL DEFAULT 'EDITORIAL',
    "notes" TEXT,
    "impressionCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Promotion_status_priority_idx" ON "Promotion"("status", "priority");
CREATE INDEX "Promotion_startsAt_endsAt_idx" ON "Promotion"("startsAt", "endsAt");
CREATE INDEX "Promotion_vendorId_idx" ON "Promotion"("vendorId");
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
