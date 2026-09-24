import { z } from "zod";

export const consultationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>;

export const consultationModeSchema = z.enum(["VIDEO", "PHONE", "WHATSAPP", "IN_PERSON"]);
export type ConsultationMode = z.infer<typeof consultationModeSchema>;

export const consultationTopicSchema = z.enum([
  "GETTING_STARTED",
  "VENDORS",
  "BUDGET",
  "VENUE",
  "PLATFORM_HELP",
  "VENDOR_ONBOARDING",
  "OTHER",
]);
export type ConsultationTopic = z.infer<typeof consultationTopicSchema>;

export const CONSULTATION_WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const consultationWeekdayKeySchema = z.enum(CONSULTATION_WEEKDAY_KEYS);
export type ConsultationWeekdayKey = z.infer<typeof consultationWeekdayKeySchema>;
