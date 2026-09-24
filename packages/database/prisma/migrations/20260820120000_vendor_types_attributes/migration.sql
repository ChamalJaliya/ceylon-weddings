-- CreateEnum
CREATE TYPE "VendorTypeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VendorAttributeValueType" AS ENUM ('SELECT', 'MULTISELECT', 'BOOLEAN', 'NUMBER', 'RANGE', 'TEXT');

-- CreateEnum
CREATE TYPE "VendorAttributeLayout" AS ENUM ('CARDS', 'GRID', 'LIST', 'TOGGLE', 'SLIDER', 'TEXT');

-- CreateEnum
CREATE TYPE "VendorAttributeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VendorGalleryLayout" AS ENUM ('venue', 'portrait', 'detail', 'default');

-- CreateTable
CREATE TABLE "VendorType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "description" JSONB,
    "icon" TEXT,
    "coverUrl" TEXT,
    "galleryLayout" "VendorGalleryLayout" NOT NULL DEFAULT 'default',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "coreTeam" BOOLEAN NOT NULL DEFAULT false,
    "status" "VendorTypeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorType_slug_key" ON "VendorType"("slug");

-- CreateIndex
CREATE INDEX "VendorType_status_sortOrder_idx" ON "VendorType"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "VendorType_featured_sortOrder_idx" ON "VendorType"("featured", "sortOrder");

-- Seed VendorType rows (stable ids: vt_<SLUG>) so existing VendorCategory values can backfill FKs
INSERT INTO "VendorType" ("id", "slug", "label", "galleryLayout", "sortOrder", "featured", "coreTeam", "status", "createdAt", "updatedAt") VALUES
    ('vt_VENUE',          'VENUE',          '{"en":"Venues"}'::jsonb,              'venue',    0,  true,  true,  'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_PHOTO_VIDEO',    'PHOTO_VIDEO',    '{"en":"Photo & video"}'::jsonb,       'portrait', 1,  true,  true,  'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_BRIDAL_WEAR',    'BRIDAL_WEAR',    '{"en":"Bridal wear"}'::jsonb,         'portrait', 2,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_GROOM_WEAR',     'GROOM_WEAR',     '{"en":"Groom wear"}'::jsonb,          'default',  3,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_JEWELLERY',      'JEWELLERY',      '{"en":"Jewellery"}'::jsonb,           'detail',   4,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_HAIR_MAKEUP',    'HAIR_MAKEUP',    '{"en":"Hair & makeup"}'::jsonb,       'portrait', 5,  true,  false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_BRIDAL_DRESSER', 'BRIDAL_DRESSER', '{"en":"Bridal dresser"}'::jsonb,      'default',  6,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_FLORIST_DECOR',  'FLORIST_DECOR',  '{"en":"Florist & decor"}'::jsonb,     'default',  7,  true,  true,  'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_CATERER',        'CATERER',        '{"en":"Catering"}'::jsonb,            'default',  8,  true,  true,  'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_CAKE',           'CAKE',           '{"en":"Cake"}'::jsonb,                'default',  9,  true,  false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_ENTERTAINMENT',  'ENTERTAINMENT',  '{"en":"Entertainment"}'::jsonb,       'default', 10,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_PORUWA',         'PORUWA',         '{"en":"Poruwa"}'::jsonb,              'default', 11,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_ASTROLOGY',      'ASTROLOGY',      '{"en":"Astrology / nekath"}'::jsonb,  'default', 12,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_WEDDING_CARS',   'WEDDING_CARS',   '{"en":"Wedding cars"}'::jsonb,        'default', 13,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_INVITATIONS',    'INVITATIONS',    '{"en":"Invitations"}'::jsonb,         'default', 14,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_PLANNER',        'PLANNER',        '{"en":"Planners"}'::jsonb,            'default', 15,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_REGISTRAR',      'REGISTRAR',      '{"en":"Registrar"}'::jsonb,           'default', 16,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_MEHNDI',         'MEHNDI',         '{"en":"Mehndi"}'::jsonb,              'default', 17,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_TRANSPORT',      'TRANSPORT',      '{"en":"Transport"}'::jsonb,           'default', 18,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('vt_ACCOMMODATION',  'ACCOMMODATION',  '{"en":"Stay"}'::jsonb,                'default', 19,  false, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: add nullable categoryId columns before backfill
ALTER TABLE "Vendor" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "FeaturedPlacement" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "AwardNomination" ADD COLUMN "categoryId" TEXT;

-- Backfill categoryId from VendorType.slug = old VendorCategory::text
UPDATE "Vendor" AS v
SET "categoryId" = vt."id"
FROM "VendorType" AS vt
WHERE vt."slug" = v."category"::text;

UPDATE "FeaturedPlacement" AS fp
SET "categoryId" = vt."id"
FROM "VendorType" AS vt
WHERE fp."category" IS NOT NULL
  AND vt."slug" = fp."category"::text;

UPDATE "AwardNomination" AS an
SET "categoryId" = vt."id"
FROM "VendorType" AS vt
WHERE vt."slug" = an."category"::text;

-- Convert Promotion.categories from VendorCategory[] to TEXT[] (slug strings)
ALTER TABLE "Promotion" ADD COLUMN "categories_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Promotion"
SET "categories_new" = COALESCE(
    (
        SELECT array_agg(c::text ORDER BY ordinality)
        FROM unnest("categories") WITH ORDINALITY AS t(c, ordinality)
    ),
    ARRAY[]::TEXT[]
);

ALTER TABLE "Promotion" DROP COLUMN "categories";
ALTER TABLE "Promotion" RENAME COLUMN "categories_new" TO "categories";

-- Drop old unique index that references AwardNomination.category
DROP INDEX "AwardNomination_vendorId_year_category_key";

-- Drop old enum-backed category columns
ALTER TABLE "Vendor" DROP COLUMN "category";
ALTER TABLE "FeaturedPlacement" DROP COLUMN "category";
ALTER TABLE "AwardNomination" DROP COLUMN "category";

-- AwardNomination.categoryId is required in the new schema
ALTER TABLE "AwardNomination" ALTER COLUMN "categoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VendorType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedPlacement" ADD CONSTRAINT "FeaturedPlacement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VendorType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardNomination" ADD CONSTRAINT "AwardNomination_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VendorType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex (replace former category-based Vendor indexes)
CREATE INDEX "Vendor_categoryId_city_idx" ON "Vendor"("categoryId", "city");
CREATE INDEX "Vendor_categoryId_district_idx" ON "Vendor"("categoryId", "district");
CREATE INDEX "Vendor_categoryId_startingPriceLkr_idx" ON "Vendor"("categoryId", "startingPriceLkr");
CREATE INDEX "Vendor_categoryId_verified_featured_idx" ON "Vendor"("categoryId", "verified", "featured");

-- CreateIndex
CREATE INDEX "FeaturedPlacement_categoryId_idx" ON "FeaturedPlacement"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AwardNomination_vendorId_year_categoryId_key" ON "AwardNomination"("vendorId", "year", "categoryId");
CREATE INDEX "AwardNomination_categoryId_idx" ON "AwardNomination"("categoryId");

-- DropEnum
DROP TYPE "VendorCategory";

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Existing categorized vendors skip the new required-attribute wizard
UPDATE "Vendor"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "categoryId" IS NOT NULL;

-- Existing categorized vendors skip the new required-attribute wizard
UPDATE "Vendor"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "categoryId" IS NOT NULL;

-- CreateTable
CREATE TABLE "VendorAttributeDefinition" (
    "id" TEXT NOT NULL,
    "typeId" TEXT,
    "key" TEXT NOT NULL,
    "valueType" "VendorAttributeValueType" NOT NULL,
    "question" JSONB NOT NULL,
    "instruction" JSONB,
    "helpText" JSONB,
    "filterLabel" JSONB,
    "filterHelp" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT true,
    "filterHighlight" BOOLEAN NOT NULL DEFAULT false,
    "filterSortOrder" INTEGER NOT NULL DEFAULT 0,
    "showOnProfile" BOOLEAN NOT NULL DEFAULT true,
    "collectOnboard" BOOLEAN NOT NULL DEFAULT false,
    "layout" "VendorAttributeLayout" NOT NULL DEFAULT 'CARDS',
    "groupKey" TEXT,
    "groupLabel" JSONB,
    "unit" TEXT,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "maxSelect" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "VendorAttributeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAttributeOption" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "helpText" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAttributeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAttributeValue" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "booleanValue" BOOLEAN,
    "numberValue" DOUBLE PRECISION,
    "rangeMin" DOUBLE PRECISION,
    "rangeMax" DOUBLE PRECISION,
    "textValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAttributeSelection" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "valueId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAttributeSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorAttributeDefinition_typeId_key_key" ON "VendorAttributeDefinition"("typeId", "key");
CREATE INDEX "VendorAttributeDefinition_typeId_status_sortOrder_idx" ON "VendorAttributeDefinition"("typeId", "status", "sortOrder");
CREATE INDEX "VendorAttributeDefinition_filterable_filterHighlight_filterSortOrder_idx" ON "VendorAttributeDefinition"("filterable", "filterHighlight", "filterSortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAttributeOption_definitionId_key_key" ON "VendorAttributeOption"("definitionId", "key");
CREATE INDEX "VendorAttributeOption_definitionId_active_sortOrder_idx" ON "VendorAttributeOption"("definitionId", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAttributeValue_vendorId_definitionId_key" ON "VendorAttributeValue"("vendorId", "definitionId");
CREATE INDEX "VendorAttributeValue_definitionId_booleanValue_idx" ON "VendorAttributeValue"("definitionId", "booleanValue");
CREATE INDEX "VendorAttributeValue_definitionId_numberValue_idx" ON "VendorAttributeValue"("definitionId", "numberValue");
CREATE INDEX "VendorAttributeValue_definitionId_rangeMin_rangeMax_idx" ON "VendorAttributeValue"("definitionId", "rangeMin", "rangeMax");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAttributeSelection_valueId_optionId_key" ON "VendorAttributeSelection"("valueId", "optionId");
CREATE UNIQUE INDEX "VendorAttributeSelection_vendorId_optionId_key" ON "VendorAttributeSelection"("vendorId", "optionId");
CREATE INDEX "VendorAttributeSelection_optionId_vendorId_idx" ON "VendorAttributeSelection"("optionId", "vendorId");
CREATE INDEX "VendorAttributeSelection_vendorId_idx" ON "VendorAttributeSelection"("vendorId");

-- AddForeignKey
ALTER TABLE "VendorAttributeDefinition" ADD CONSTRAINT "VendorAttributeDefinition_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "VendorType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAttributeOption" ADD CONSTRAINT "VendorAttributeOption_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "VendorAttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAttributeValue" ADD CONSTRAINT "VendorAttributeValue_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAttributeValue" ADD CONSTRAINT "VendorAttributeValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "VendorAttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAttributeSelection" ADD CONSTRAINT "VendorAttributeSelection_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAttributeSelection" ADD CONSTRAINT "VendorAttributeSelection_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES "VendorAttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAttributeSelection" ADD CONSTRAINT "VendorAttributeSelection_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "VendorAttributeOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
