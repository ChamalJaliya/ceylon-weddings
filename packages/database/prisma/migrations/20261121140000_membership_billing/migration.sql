-- Enrich subscription plans + membership lifecycle (Kloqra-inspired).

ALTER TABLE "SubscriptionPlan"
  ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "features" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "limits" JSONB,
  ADD COLUMN IF NOT EXISTS "billingMode" TEXT NOT NULL DEFAULT 'checkout',
  ADD COLUMN IF NOT EXISTS "recommended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "SubscriptionPlan"
SET "slug" = CASE
  WHEN lower("name") LIKE '%spotlight%' THEN 'spotlight'
  ELSE 'pro'
END
WHERE "slug" IS NULL OR "slug" = 'pro';

UPDATE "SubscriptionPlan"
SET
  "features" = CASE
    WHEN "slug" = 'spotlight' THEN '["Everything in Pro","Spotlight / featured placement eligibility","Campaign creative slots across catalog","Dedicated growth support from Ceylon Ops"]'::jsonb
    ELSE '["Verified Pro badge on your storefront","WhatsApp couple inquiries with lead alerts","High-resolution galleries and showcase video","Priority ranking in district & category search","Reviews collection and verified rating score"]'::jsonb
  END,
  "limits" = CASE
    WHEN "slug" = 'spotlight' THEN '{"maxPhotos":120,"maxVideos":20,"maxPackages":24,"whatsappLeads":true,"analytics":true,"featuredEligible":true,"spotlightEligible":true}'::jsonb
    ELSE '{"maxPhotos":60,"maxVideos":8,"maxPackages":12,"whatsappLeads":true,"analytics":true,"featuredEligible":true,"spotlightEligible":false}'::jsonb
  END,
  "recommended" = CASE WHEN "interval" = 'ANNUAL' AND "slug" = 'pro' THEN true ELSE "recommended" END,
  "sortOrder" = CASE
    WHEN "slug" = 'pro' AND "interval" = 'MONTHLY' THEN 10
    WHEN "slug" = 'pro' AND "interval" = 'ANNUAL' THEN 20
    WHEN "slug" = 'spotlight' THEN 30
    ELSE 100
  END;

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlan_slug_interval_key" ON "SubscriptionPlan"("slug", "interval");
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_active_sortOrder_idx" ON "SubscriptionPlan"("active", "sortOrder");

ALTER TABLE "VendorSubscription"
  ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pendingPlanId" TEXT,
  ADD COLUMN IF NOT EXISTS "pendingInterval" "BillingInterval";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VendorSubscription_pendingPlanId_fkey'
  ) THEN
    ALTER TABLE "VendorSubscription"
      ADD CONSTRAINT "VendorSubscription_pendingPlanId_fkey"
      FOREIGN KEY ("pendingPlanId") REFERENCES "SubscriptionPlan"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "VendorSubscriptionEvent" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorSubscriptionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VendorSubscriptionEvent_subscriptionId_createdAt_idx"
  ON "VendorSubscriptionEvent"("subscriptionId", "createdAt");
CREATE INDEX IF NOT EXISTS "VendorSubscriptionEvent_vendorId_createdAt_idx"
  ON "VendorSubscriptionEvent"("vendorId", "createdAt");
CREATE INDEX IF NOT EXISTS "VendorSubscriptionEvent_type_createdAt_idx"
  ON "VendorSubscriptionEvent"("type", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VendorSubscriptionEvent_subscriptionId_fkey'
  ) THEN
    ALTER TABLE "VendorSubscriptionEvent"
      ADD CONSTRAINT "VendorSubscriptionEvent_subscriptionId_fkey"
      FOREIGN KEY ("subscriptionId") REFERENCES "VendorSubscription"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed Spotlight annual contact plan if missing.
INSERT INTO "SubscriptionPlan" ("id", "slug", "name", "description", "interval", "priceLkr", "features", "limits", "billingMode", "recommended", "sortOrder", "active", "createdAt", "updatedAt")
SELECT
  'plan_spotlight_annual',
  'spotlight',
  'Spotlight',
  'Featured placement and campaign slots — talk to Ceylon Ops.',
  'ANNUAL',
  0,
  '["Everything in Pro","Spotlight / featured placement eligibility","Campaign creative slots across catalog","Dedicated growth support from Ceylon Ops"]'::jsonb,
  '{"maxPhotos":120,"maxVideos":20,"maxPackages":24,"whatsappLeads":true,"analytics":true,"featuredEligible":true,"spotlightEligible":true}'::jsonb,
  'contact',
  false,
  30,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "SubscriptionPlan" WHERE "slug" = 'spotlight' AND "interval" = 'ANNUAL'
);
