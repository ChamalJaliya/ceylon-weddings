import { z } from "zod";
import { emptyToUndefined, optionalQueryString } from "../query";
import { consultationModeSchema, consultationStatusSchema, consultationTopicSchema } from "./enums";
import { consultationIntroSchema } from "./settings";

export const CONSULTATION_ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Enter a valid email").max(200).optional(),
);
const optionalPhone = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(6, "Enter a valid phone number").max(40).optional(),
);

export const consultationSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: consultationStatusSchema,
  startsAt: z.string(),
  endsAt: z.string(),
  timezone: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  locale: z.string(),
  topic: consultationTopicSchema,
  mode: consultationModeSchema,
  message: z.string().nullable(),
  weddingDate: z.string().nullable(),
  city: z.string().nullable(),
  guestCount: z.number().int().nullable(),
  budgetLkr: z.number().int().nullable(),
  userId: z.string().nullable(),
  weddingId: z.string().nullable(),
  assignedAdminId: z.string().nullable(),
  assignedAdminName: z.string().nullable().optional(),
  meetingUrl: z.string().nullable(),
  adminNotes: z.string().nullable(),
  confirmedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  cancelReason: z.string().nullable(),
  source: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Consultation = z.infer<typeof consultationSchema>;

/** What a guest is allowed to see: no admin notes, no internal ids. */
export const publicConsultationSchema = z.object({
  reference: z.string(),
  manageToken: z.string(),
  status: consultationStatusSchema,
  startsAt: z.string(),
  endsAt: z.string(),
  timezone: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  topic: consultationTopicSchema,
  mode: consultationModeSchema,
  message: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
});
export type PublicConsultation = z.infer<typeof publicConsultationSchema>;

export const consultationSlotViewSchema = z.object({
  startsAt: z.string(),
  endsAt: z.string(),
  slotKey: z.string(),
});

export const consultationDayViewSchema = z.object({
  date: z.string(),
  weekday: z.string(),
  slots: z.array(consultationSlotViewSchema),
});

export const consultationAvailabilitySchema = z.object({
  enabled: z.boolean(),
  timezone: z.string(),
  slotMinutes: z.number().int(),
  leadTimeHours: z.number().int(),
  horizonDays: z.number().int(),
  modes: z.array(consultationModeSchema),
  intro: consultationIntroSchema,
  days: z.array(consultationDayViewSchema),
});
export type ConsultationAvailability = z.infer<typeof consultationAvailabilitySchema>;

export const consultationAvailabilityQuerySchema = z.object({
  from: optionalQueryString,
  days: z.coerce.number().int().min(1).max(60).optional(),
});
export type ConsultationAvailabilityQuery = z.infer<typeof consultationAvailabilityQuerySchema>;

const consultationContextFields = {
  message: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  weddingDate: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  guestCount: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(5000).optional()),
  budgetLkr: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(1_000_000_000).optional()),
};

export const createConsultationBodySchema = z
  .object({
    startsAt: z.string().min(10),
    mode: consultationModeSchema.default("VIDEO"),
    topic: consultationTopicSchema.default("GETTING_STARTED"),
    name: z.string().trim().min(2, "Enter your name").max(120),
    email: optionalEmail,
    phone: optionalPhone,
    locale: z.string().min(2).max(8).default("en"),
    source: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
    ...consultationContextFields,
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: "custom",
        message: "Add an email or a phone number so we can reach you",
        path: ["email"],
      });
    }
  });
export type CreateConsultationBody = z.infer<typeof createConsultationBodySchema>;

export const cancelConsultationBodySchema = z.object({
  reason: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
});
export type CancelConsultationBody = z.infer<typeof cancelConsultationBodySchema>;

export const adminCreateConsultationBodySchema = z
  .object({
    startsAt: z.string().min(10),
    mode: consultationModeSchema.default("PHONE"),
    topic: consultationTopicSchema.default("GETTING_STARTED"),
    name: z.string().trim().min(2).max(120),
    email: optionalEmail,
    phone: optionalPhone,
    locale: z.string().min(2).max(8).default("en"),
    status: consultationStatusSchema.default("CONFIRMED"),
    meetingUrl: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
    adminNotes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    assignedAdminId: z.preprocess(emptyToUndefined, z.string().optional()),
    /** Admins book outside published hours when someone calls in. */
    ignoreAvailability: z.boolean().default(true),
    ...consultationContextFields,
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({ code: "custom", message: "Add an email or a phone number", path: ["email"] });
    }
  });
export type AdminCreateConsultationBody = z.infer<typeof adminCreateConsultationBodySchema>;

export const updateConsultationBodySchema = z.object({
  status: consultationStatusSchema.optional(),
  startsAt: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  mode: consultationModeSchema.optional(),
  topic: consultationTopicSchema.optional(),
  meetingUrl: z.string().trim().max(500).nullable().optional(),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
  assignedAdminId: z.string().nullable().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  message: z.string().trim().max(2000).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  weddingDate: z.string().trim().max(40).nullable().optional(),
  guestCount: z.number().int().min(1).max(5000).nullable().optional(),
  budgetLkr: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  cancelReason: z.string().trim().max(500).nullable().optional(),
});
export type UpdateConsultationBody = z.infer<typeof updateConsultationBodySchema>;

export const consultationListQuerySchema = z.object({
  q: optionalQueryString,
  status: z.preprocess(emptyToUndefined, consultationStatusSchema.optional()),
  mode: z.preprocess(emptyToUndefined, consultationModeSchema.optional()),
  topic: z.preprocess(emptyToUndefined, consultationTopicSchema.optional()),
  from: optionalQueryString,
  to: optionalQueryString,
  window: z.preprocess(emptyToUndefined, z.enum(["upcoming", "past", "all"]).optional()),
});
export type ConsultationListQuery = z.infer<typeof consultationListQuerySchema>;

export const CONSULTATION_MODE_LABELS: Record<z.infer<typeof consultationModeSchema>, string> = {
  VIDEO: "Video call",
  PHONE: "Phone call",
  WHATSAPP: "WhatsApp call",
  IN_PERSON: "In person (Colombo)",
};

export const CONSULTATION_TOPIC_LABELS: Record<z.infer<typeof consultationTopicSchema>, string> = {
  GETTING_STARTED: "Getting started",
  VENDORS: "Finding vendors",
  BUDGET: "Budget planning",
  VENUE: "Venue selection",
  PLATFORM_HELP: "Help using Ceylon Weddings",
  VENDOR_ONBOARDING: "Listing my business",
  OTHER: "Something else",
};

export function consultationReferenceCode(random = Math.random): string {
  const alphabet = "ACDEFGHJKLMNPQRTUVWXY34789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(random() * alphabet.length)] ?? "A";
  }
  return `CW-${code}`;
}

export function isConsultationActive(status: z.infer<typeof consultationStatusSchema>): boolean {
  return (CONSULTATION_ACTIVE_STATUSES as readonly string[]).includes(status);
}

export function consultationIcs(input: {
  reference: string;
  startsAt: string;
  endsAt: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
}): string {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const escape = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ceylon Weddings//Consultations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.reference}@ceylonweddings`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(input.startsAt)}`,
    `DTEND:${stamp(input.endsAt)}`,
    `SUMMARY:${escape(input.summary)}`,
  ];
  if (input.description) lines.push(`DESCRIPTION:${escape(input.description)}`);
  if (input.location) lines.push(`LOCATION:${escape(input.location)}`);
  if (input.url) lines.push(`URL:${escape(input.url)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
