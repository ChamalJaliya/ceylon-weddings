-- CreateTable
CREATE TABLE "Moodboard" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventId" TEXT,
    "notes" TEXT,
    "scene" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "shareToken" TEXT,
    "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moodboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodboardAsset" (
    "id" TEXT NOT NULL,
    "moodboardId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodboardAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Moodboard_shareToken_key" ON "Moodboard"("shareToken");

-- CreateIndex
CREATE INDEX "Moodboard_weddingId_sortOrder_idx" ON "Moodboard"("weddingId", "sortOrder");

-- CreateIndex
CREATE INDEX "Moodboard_eventId_idx" ON "Moodboard"("eventId");

-- CreateIndex
CREATE INDEX "MoodboardAsset_moodboardId_idx" ON "MoodboardAsset"("moodboardId");

-- CreateIndex
CREATE UNIQUE INDEX "MoodboardAsset_moodboardId_fileId_key" ON "MoodboardAsset"("moodboardId", "fileId");

-- AddForeignKey
ALTER TABLE "Moodboard" ADD CONSTRAINT "Moodboard_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moodboard" ADD CONSTRAINT "Moodboard_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodboardAsset" ADD CONSTRAINT "MoodboardAsset_moodboardId_fkey" FOREIGN KEY ("moodboardId") REFERENCES "Moodboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
