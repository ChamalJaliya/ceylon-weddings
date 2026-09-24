-- CreateEnum
CREATE TYPE "WeddingType" AS ENUM ('KANDYAN_PORUWA', 'WESTERN_CHURCH', 'HINDU', 'MUSLIM_NIKAH', 'HOMECOMING', 'ENGAGEMENT', 'MEHNDI', 'DESTINATION');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('PORUWA', 'CHURCH', 'NIKAH', 'WALIMA', 'RECEPTION', 'HOMECOMING', 'MEHNDI', 'ENGAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Payer" AS ENUM ('COUPLE', 'BRIDE_FAMILY', 'GROOM_FAMILY');

-- CreateEnum
CREATE TYPE "GuestSide" AS ENUM ('BRIDE', 'GROOM', 'BOTH');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('CONSIDERING', 'INVITED', 'CONFIRMED', 'DECLINED', 'MAYBE', 'WALK_IN');

-- CreateEnum
CREATE TYPE "Meal" AS ENUM ('VEG', 'FISH', 'CHICKEN', 'BEEF', 'HALAL', 'OTHER');

-- CreateEnum
CREATE TYPE "InviteChannel" AS ENUM ('WHATSAPP', 'PHONE', 'PRINTED', 'OVERSEAS');

-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('VENUE', 'PHOTO_VIDEO', 'BRIDAL_WEAR', 'GROOM_WEAR', 'JEWELLERY', 'HAIR_MAKEUP', 'BRIDAL_DRESSER', 'FLORIST_DECOR', 'CATERER', 'CAKE', 'ENTERTAINMENT', 'PORUWA', 'ASTROLOGY', 'WEDDING_CARS', 'INVITATIONS', 'PLANNER', 'REGISTRAR', 'MEHNDI', 'TRANSPORT', 'ACCOMMODATION');

-- CreateEnum
CREATE TYPE "VendorLinkStatus" AS ENUM ('SHORTLISTED', 'INQUIRED', 'BOOKED');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'REPLIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'DOING', 'DONE');

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "partnerOneName" TEXT NOT NULL,
    "partnerTwoName" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "city" TEXT,
    "district" TEXT,
    "guestCountEstimate" INTEGER NOT NULL DEFAULT 150,
    "budgetLkr" INTEGER NOT NULL DEFAULT 2500000,
    "payer" "Payer" NOT NULL DEFAULT 'COUPLE',
    "types" "WeddingType"[],
    "locale" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "planningFromOverseas" BOOLEAN NOT NULL DEFAULT false,
    "websiteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "websiteFaq" TEXT,
    "travelNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingMember" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COUPLE',
    "canEditGuests" BOOLEAN NOT NULL DEFAULT true,
    "canViewBudget" BOOLEAN NOT NULL DEFAULT true,
    "canManageVendors" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeddingMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "nekathAt" TIMESTAMP(3),
    "venueName" TEXT,
    "address" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "category" TEXT,
    "assigneeUserId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "plannedLkr" INTEGER NOT NULL,
    "spentLkr" INTEGER NOT NULL DEFAULT 0,
    "payer" "Payer" NOT NULL DEFAULT 'COUPLE',
    "vendorId" TEXT,
    "depositDueAt" TIMESTAMP(3),
    "balanceDueAt" TIMESTAMP(3),

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestHousehold" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "headName" TEXT NOT NULL,
    "side" "GuestSide" NOT NULL DEFAULT 'BOTH',
    "plusCount" INTEGER NOT NULL DEFAULT 0,
    "status" "RsvpStatus" NOT NULL DEFAULT 'CONSIDERING',
    "meal" "Meal",
    "channel" "InviteChannel" NOT NULL DEFAULT 'WHATSAPP',
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "giftReceived" BOOLEAN NOT NULL DEFAULT false,
    "thanked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GuestHousehold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInvite" (
    "householdId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'INVITED',

    CONSTRAINT "EventInvite_pkey" PRIMARY KEY ("householdId","eventId")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "startingPriceLkr" INTEGER,
    "whatsapp" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "styles" TEXT[],
    "destinationExperienced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "whatsappUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingVendor" (
    "weddingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "VendorLinkStatus" NOT NULL DEFAULT 'SHORTLISTED',

    CONSTRAINT "WeddingVendor_pkey" PRIMARY KEY ("weddingId","vendorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_slug_key" ON "Wedding"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingMember_weddingId_userId_key" ON "WeddingMember"("weddingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");

-- AddForeignKey
ALTER TABLE "WeddingMember" ADD CONSTRAINT "WeddingMember_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingMember" ADD CONSTRAINT "WeddingMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestHousehold" ADD CONSTRAINT "GuestHousehold_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "GuestHousehold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendor" ADD CONSTRAINT "WeddingVendor_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingVendor" ADD CONSTRAINT "WeddingVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
