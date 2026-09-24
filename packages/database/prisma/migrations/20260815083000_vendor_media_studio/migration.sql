-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "introVideoUrl" TEXT;

-- CreateTable
CREATE TABLE "VendorMediaProject" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VendorMediaProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorMediaItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VendorMediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorVideo" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VendorVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorMediaProject_vendorId_sortOrder_idx" ON "VendorMediaProject"("vendorId", "sortOrder");

-- CreateIndex
CREATE INDEX "VendorMediaItem_projectId_sortOrder_idx" ON "VendorMediaItem"("projectId", "sortOrder");

-- CreateIndex
CREATE INDEX "VendorVideo_vendorId_sortOrder_idx" ON "VendorVideo"("vendorId", "sortOrder");

-- AddForeignKey
ALTER TABLE "VendorMediaProject" ADD CONSTRAINT "VendorMediaProject_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorMediaItem" ADD CONSTRAINT "VendorMediaItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VendorMediaProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorVideo" ADD CONSTRAINT "VendorVideo_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
