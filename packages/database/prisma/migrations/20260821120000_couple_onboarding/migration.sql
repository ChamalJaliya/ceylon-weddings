-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Existing weddings already have a studio; skip the first-run wizard.
UPDATE "Wedding" SET "onboardingCompletedAt" = "createdAt" WHERE "onboardingCompletedAt" IS NULL;
