-- AlterEnum: extend PromotionSlot
ALTER TYPE "PromotionSlot" ADD VALUE 'CATALOG_DATE_AVAILABLE';
ALTER TYPE "PromotionSlot" ADD VALUE 'CATALOG_MAP';
ALTER TYPE "PromotionSlot" ADD VALUE 'IDEAS_INLINE';
ALTER TYPE "PromotionSlot" ADD VALUE 'VENDOR_COMPLEMENTARY';
ALTER TYPE "PromotionSlot" ADD VALUE 'VENDOR_SIMILAR';
ALTER TYPE "PromotionSlot" ADD VALUE 'COMPARE_SUGGEST';
ALTER TYPE "PromotionSlot" ADD VALUE 'ARTICLE_INLINE';
ALTER TYPE "PromotionSlot" ADD VALUE 'ARTICLE_NEXT_STEP';
ALTER TYPE "PromotionSlot" ADD VALUE 'ARTICLE_STORY_CREDITS';
ALTER TYPE "PromotionSlot" ADD VALUE 'REELS';
ALTER TYPE "PromotionSlot" ADD VALUE 'AWARDS_CATEGORY';

-- CreateEnum
CREATE TYPE "PromotionDisclosure" AS ENUM ('SPONSORED', 'SPONSORED_STORY', 'CUSTOM');
CREATE TYPE "PromotionBillingInterval" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- CreateTable
CREATE TABLE "PromotionSlotConfig" (
    "id" TEXT NOT NULL,
    "slot" "PromotionSlot" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "pageKey" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "description" TEXT,
    "defaultLayout" "PromotionLayout" NOT NULL DEFAULT 'CARD',
    "maxPerRequest" INTEGER NOT NULL DEFAULT 6,
    "densityEveryN" INTEGER,
    "disclosure" "PromotionDisclosure" NOT NULL DEFAULT 'SPONSORED',
    "priceLkr" INTEGER NOT NULL DEFAULT 0,
    "interval" "PromotionBillingInterval" NOT NULL DEFAULT 'WEEK',
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionSlotConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromotionSlotConfig_slot_key" ON "PromotionSlotConfig"("slot");
CREATE INDEX "PromotionSlotConfig_enabled_sortOrder_idx" ON "PromotionSlotConfig"("enabled", "sortOrder");

CREATE TABLE "PromotionPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "slots" "PromotionSlot"[],
    "priceLkr" INTEGER NOT NULL,
    "interval" "PromotionBillingInterval" NOT NULL DEFAULT 'WEEK',
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromotionPackage_slug_key" ON "PromotionPackage"("slug");
CREATE INDEX "PromotionPackage_active_sortOrder_idx" ON "PromotionPackage"("active", "sortOrder");

-- AlterTable Promotion
ALTER TABLE "Promotion" ADD COLUMN "packageId" TEXT;
CREATE INDEX "Promotion_packageId_idx" ON "Promotion"("packageId");
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
