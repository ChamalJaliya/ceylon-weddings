-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ConsultationMode" AS ENUM ('VIDEO', 'PHONE', 'WHATSAPP', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "ConsultationTopic" AS ENUM ('GETTING_STARTED', 'VENDORS', 'BUDGET', 'VENUE', 'PLATFORM_HELP', 'VENDOR_ONBOARDING', 'OTHER');

-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "publishedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AwardNomination" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "FeatureFlag" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "FeaturedPlacement" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MusicPlan" ALTER COLUMN "languages" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PaymentIntent" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Promotion" ALTER COLUMN "slots" DROP DEFAULT,
ALTER COLUMN "cities" DROP DEFAULT,
ALTER COLUMN "locales" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "categories" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SiteConfig" ADD COLUMN     "consultations" JSONB;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "capabilities" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VendorAttributeDefinition" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VendorAttributeOption" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VendorAttributeValue" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VendorType" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "manageToken" TEXT NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Colombo',
    "slotKey" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "topic" "ConsultationTopic" NOT NULL DEFAULT 'GETTING_STARTED',
    "mode" "ConsultationMode" NOT NULL DEFAULT 'VIDEO',
    "message" TEXT,
    "weddingDate" TIMESTAMP(3),
    "city" TEXT,
    "guestCount" INTEGER,
    "budgetLkr" INTEGER,
    "userId" TEXT,
    "weddingId" TEXT,
    "assignedAdminId" TEXT,
    "meetingUrl" TEXT,
    "adminNotes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "ip" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_reference_key" ON "Consultation"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_manageToken_key" ON "Consultation"("manageToken");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_slotKey_key" ON "Consultation"("slotKey");

-- CreateIndex
CREATE INDEX "Consultation_status_startsAt_idx" ON "Consultation"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Consultation_startsAt_idx" ON "Consultation"("startsAt");

-- CreateIndex
CREATE INDEX "Consultation_email_idx" ON "Consultation"("email");

-- CreateIndex
CREATE INDEX "Vendor_ratingAvg_ratingCount_idx" ON "Vendor"("ratingAvg", "ratingCount");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "VendorAttributeDefinition_filterable_filterHighlight_filterSort" RENAME TO "VendorAttributeDefinition_filterable_filterHighlight_filter_idx";
