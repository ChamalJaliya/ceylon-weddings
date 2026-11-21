-- Dual checkout: Stripe customer/subscription refs + optional Stripe price on plans.

ALTER TABLE "VendorSubscription"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;

CREATE INDEX IF NOT EXISTS "VendorSubscription_stripeCustomerId_idx"
  ON "VendorSubscription"("stripeCustomerId");

ALTER TABLE "SubscriptionPlan"
  ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;
