-- CreateEnum
CREATE TYPE "MusicListKind" AS ENUM ('MUST', 'MAYBE', 'DO_NOT');

-- CreateEnum
CREATE TYPE "MusicCueKind" AS ENUM (
  'PROCESSIONAL',
  'ENTRANCE',
  'CEREMONY',
  'RECESSIONAL',
  'COCKTAIL',
  'FIRST_DANCE',
  'PARENT_DANCE',
  'CAKE',
  'BOUQUET',
  'PARTY',
  'LAST_DANCE',
  'TRADITIONAL',
  'CUSTOM'
);

-- CreateEnum
CREATE TYPE "MusicLanguage" AS ENUM ('SINHALA', 'TAMIL', 'ENGLISH', 'HINDI', 'MIXED', 'OTHER');

-- CreateEnum
CREATE TYPE "MusicVibe" AS ENUM (
  'TRADITIONAL',
  'ROMANTIC',
  'UPBEAT',
  'BAILA',
  'RELIGIOUS',
  'SOFT',
  'PARTY',
  'CUSTOM'
);

-- CreateTable
CREATE TABLE "MusicPlan" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "notes" TEXT,
    "vibePrimary" "MusicVibe",
    "languages" "MusicLanguage"[] DEFAULT ARRAY[]::"MusicLanguage"[],
    "entertainmentVendorId" TEXT,
    "shareToken" TEXT,
    "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicTrack" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "list" "MusicListKind" NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "url" TEXT,
    "language" "MusicLanguage",
    "vibe" "MusicVibe",
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicCue" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "kind" "MusicCueKind" NOT NULL DEFAULT 'CUSTOM',
    "label" TEXT NOT NULL,
    "trackTitle" TEXT,
    "trackId" TEXT,
    "appointmentId" TEXT,
    "offsetMinutes" INTEGER,
    "startsAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicCue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicPlan_eventId_key" ON "MusicPlan"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicPlan_shareToken_key" ON "MusicPlan"("shareToken");

-- CreateIndex
CREATE INDEX "MusicPlan_weddingId_idx" ON "MusicPlan"("weddingId");

-- CreateIndex
CREATE INDEX "MusicPlan_entertainmentVendorId_idx" ON "MusicPlan"("entertainmentVendorId");

-- CreateIndex
CREATE INDEX "MusicTrack_planId_list_sortOrder_idx" ON "MusicTrack"("planId", "list", "sortOrder");

-- CreateIndex
CREATE INDEX "MusicCue_planId_sortOrder_idx" ON "MusicCue"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX "MusicCue_appointmentId_idx" ON "MusicCue"("appointmentId");

-- CreateIndex
CREATE INDEX "MusicCue_trackId_idx" ON "MusicCue"("trackId");

-- AddForeignKey
ALTER TABLE "MusicPlan" ADD CONSTRAINT "MusicPlan_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPlan" ADD CONSTRAINT "MusicPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicPlan" ADD CONSTRAINT "MusicPlan_entertainmentVendorId_fkey" FOREIGN KEY ("entertainmentVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicTrack" ADD CONSTRAINT "MusicTrack_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MusicPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicCue" ADD CONSTRAINT "MusicCue_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MusicPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicCue" ADD CONSTRAINT "MusicCue_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "MusicTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicCue" ADD CONSTRAINT "MusicCue_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
