-- CreateEnum
CREATE TYPE "PriceDisplayMode" AS ENUM ('FIXED', 'FROM', 'ON_REQUEST');

-- CreateEnum
CREATE TYPE "PackagePricingMode" AS ENUM ('FIXED', 'FROM', 'RANGE', 'PER_GUEST', 'ON_REQUEST');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PackageBadge" AS ENUM ('POPULAR', 'BEST_VALUE', 'LIMITED');

-- CreateEnum
CREATE TYPE "PackageEventType" AS ENUM ('WEDDING', 'HOMECOMING', 'ENGAGEMENT', 'PRESHOOT', 'PORUWA', 'DESTINATION', 'REGISTRATION');

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "cancellationNote" TEXT,
ADD COLUMN     "depositNote" TEXT,
ADD COLUMN     "offerHeadline" TEXT,
ADD COLUMN     "priceDisplayMode" "PriceDisplayMode" NOT NULL DEFAULT 'FROM',
ADD COLUMN     "pricingDisclaimer" TEXT,
ADD COLUMN     "serviceAreas" TEXT[],
ADD COLUMN     "taxNote" TEXT,
ADD COLUMN     "taxesExtra" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "travelNote" TEXT,
ADD COLUMN     "typicalSpendLkr" INTEGER,
ALTER COLUMN "photos" DROP DEFAULT,
ALTER COLUMN "includedInPrice" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VendorPackage" ADD COLUMN     "badge" "PackageBadge",
ADD COLUMN     "bestFor" TEXT,
ADD COLUMN     "durationHours" DOUBLE PRECISION,
ADD COLUMN     "eventTypes" "PackageEventType"[],
ADD COLUMN     "exclusions" TEXT[],
ADD COLUMN     "guestMax" INTEGER,
ADD COLUMN     "guestMin" INTEGER,
ADD COLUMN     "inclusions" TEXT[],
ADD COLUMN     "photoUrls" TEXT[],
ADD COLUMN     "priceMaxLkr" INTEGER,
ADD COLUMN     "pricingMode" "PackagePricingMode" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "PackageStatus" NOT NULL DEFAULT 'PUBLISHED',
ALTER COLUMN "tier" DROP NOT NULL,
ALTER COLUMN "priceLkr" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Wedding" ALTER COLUMN "colors" DROP DEFAULT;

-- CreateTable
CREATE TABLE "VendorAddOn" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricingMode" "PackagePricingMode" NOT NULL DEFAULT 'FIXED',
    "priceLkr" INTEGER,

    CONSTRAINT "VendorAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PackageAddOns" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageAddOns_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "VendorAddOn_vendorId_idx" ON "VendorAddOn"("vendorId");

-- CreateIndex
CREATE INDEX "_PackageAddOns_B_index" ON "_PackageAddOns"("B");

-- CreateIndex
CREATE INDEX "VendorPackage_vendorId_sortOrder_idx" ON "VendorPackage"("vendorId", "sortOrder");

-- AddForeignKey
ALTER TABLE "VendorAddOn" ADD CONSTRAINT "VendorAddOn_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageAddOns" ADD CONSTRAINT "_PackageAddOns_A_fkey" FOREIGN KEY ("A") REFERENCES "VendorAddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageAddOns" ADD CONSTRAINT "_PackageAddOns_B_fkey" FOREIGN KEY ("B") REFERENCES "VendorPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
