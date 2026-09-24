-- AlterTable
ALTER TABLE "VendorAttributeDefinition" ADD COLUMN "presentation" JSONB;

-- AlterTable
ALTER TABLE "VendorType" ADD COLUMN "onboardingPresentation" JSONB;

-- AlterTable
ALTER TABLE "SiteConfig" ADD COLUMN "onboarding" JSONB;
