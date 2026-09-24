-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "showPricing" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Vendor" ADD COLUMN "listed" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Vendor_listed_moderationStatus_idx" ON "Vendor"("listed", "moderationStatus");
