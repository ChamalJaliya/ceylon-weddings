-- User preferences: theme mode, palette, notification channels.
ALTER TABLE "User" ADD COLUMN "preferences" JSONB NOT NULL DEFAULT '{}';

-- Notifications: free-form template ids (Kloqra pattern) instead of a one-value enum,
-- plus metadata for variant / category / CTA / detail rows.
ALTER TABLE "Notification" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE TEXT USING (
  CASE "type"::text WHEN 'MESSAGE' THEN 'message.received' ELSE lower("type"::text) END
);
ALTER TABLE "Notification" ALTER COLUMN "type" SET DEFAULT 'message.received';
DROP TYPE "NotificationType";

ALTER TABLE "Notification" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';

-- Unread badge hot path.
CREATE INDEX "Notification_userId_unread_idx" ON "Notification" ("userId", "createdAt" DESC) WHERE "readAt" IS NULL;
