-- CreateEnum
CREATE TYPE "FamilyRelation" AS ENUM ('MOTHER', 'FATHER', 'SIBLING', 'AUNT_UNCLE', 'COUSIN', 'GRANDPARENT', 'FRIEND', 'OTHER');

-- CreateTable
CREATE TABLE "FamilyPerson" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "side" "GuestSide" NOT NULL DEFAULT 'BOTH',
    "relation" "FamilyRelation" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "phone" TEXT,
    "householdId" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyPerson_weddingId_side_idx" ON "FamilyPerson"("weddingId", "side");

-- CreateIndex
CREATE INDEX "FamilyPerson_householdId_idx" ON "FamilyPerson"("householdId");

-- CreateIndex
CREATE INDEX "FamilyPerson_parentId_idx" ON "FamilyPerson"("parentId");

-- AddForeignKey
ALTER TABLE "FamilyPerson" ADD CONSTRAINT "FamilyPerson_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPerson" ADD CONSTRAINT "FamilyPerson_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "GuestHousehold"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPerson" ADD CONSTRAINT "FamilyPerson_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FamilyPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
