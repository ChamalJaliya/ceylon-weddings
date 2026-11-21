-- Couple cover photo for planning hub + guest wedding site
ALTER TABLE "Wedding"
  ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
