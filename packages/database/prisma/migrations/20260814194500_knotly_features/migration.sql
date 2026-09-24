-- CreateEnum
CREATE TYPE "WeddingStyle" AS ENUM ('MINIMALIST', 'TRADITIONAL', 'KANDYAN', 'MODERN', 'BEACH');

-- CreateEnum
CREATE TYPE "AppointmentKind" AS ENUM ('VENDOR_MEETING', 'TASTING', 'FITTING', 'CEREMONY', 'OTHER');

-- CreateEnum
CREATE TYPE "PackageTier" AS ENUM ('BASIC', 'ADVANCED', 'DREAM');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('FLOWERS', 'CEREMONY', 'CAKES', 'TRANSPORT', 'FASHION', 'BEAUTY', 'FAMILY', 'EVENTS', 'TRAVEL', 'FOOD');

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN "style" "WeddingStyle" NOT NULL DEFAULT 'KANDYAN';
ALTER TABLE "Wedding" ADD COLUMN "styleNotes" TEXT;
ALTER TABLE "Wedding" ADD COLUMN "settingNotes" TEXT;
ALTER TABLE "Wedding" ADD COLUMN "colors" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "BudgetLine" ADD COLUMN "paidLkr" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Vendor" ADD COLUMN "yearsExperience" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Vendor" ADD COLUMN "couplesServed" INTEGER NOT NULL DEFAULT 40;
ALTER TABLE "Vendor" ADD COLUMN "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 4.8;
ALTER TABLE "Vendor" ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Vendor" ADD COLUMN "includedInPrice" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Vendor" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "facebook" TEXT;
ALTER TABLE "Vendor" ADD COLUMN "faqs" JSONB;

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN "preferredDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VendorPackage" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "tier" "PackageTier" NOT NULL,
    "name" TEXT NOT NULL,
    "priceLkr" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "VendorPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "weddingId" TEXT,
    "authorName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "professionalism" DOUBLE PRECISION NOT NULL,
    "flexibility" DOUBLE PRECISION NOT NULL,
    "responseTime" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "communication" DOUBLE PRECISION NOT NULL,
    "body" TEXT NOT NULL,
    "recommended" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "vendorId" TEXT,
    "title" TEXT NOT NULL,
    "kind" "AppointmentKind" NOT NULL DEFAULT 'VENDOR_MEETING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "venueName" TEXT,
    "address" TEXT,
    "reminderMinutes" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "color" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Appointment_weddingId_startsAt_idx" ON "Appointment"("weddingId", "startsAt");

-- AddForeignKey
ALTER TABLE "VendorPackage" ADD CONSTRAINT "VendorPackage_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
